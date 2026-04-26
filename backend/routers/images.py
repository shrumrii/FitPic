from fastapi import APIRouter, UploadFile, File, Form
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 
import json 
import requests
from google import genai
from google.genai import types
from gemini.model_config import ANALYZE_CONFIG, HIGHER_ANALYZE_CONFIG, VALIDATE_CONFIG, schema
from datetime import datetime, timezone  

from logger import get_logger 

router = APIRouter() 
logger = get_logger(__name__)
client = genai.Client()

#upload image 
@router.post("/images/upload")
async def upload_image(image: UploadFile = File(...), user_id: str = Form(...)):
    
    try: 
        contents = await image.read()

        #compress img 
        img = Image.open(io.BytesIO(contents)) 
        img.thumbnail((1920, 1920)) #resize to max 1920x1920 
        img_io = io.BytesIO() 
        img.save(img_io, format=img.format or "JPEG", quality=85) 
        img_io.seek(0) 
        contents = img_io.read()  

        #validate img 
        response = client.models.generate_content(
        model="gemini-3-flash-preview",
        config=VALIDATE_CONFIG, 
        contents=[
            types.Part.from_bytes(
                data=contents,
                mime_type='image/jpeg',
            ), 
            "Is this a photo of a person wearing an outfit? Yes or no."
        ] 
        )
        print(response.text)

        if response.text.strip().lower() == "no": 
            return { 
                "success": False, 
                "message": "Failed to validate image. Make sure that the picture is a full body picture or mirror picture."
            }

        clean_filename = image.filename.replace(" ", "_") 
        unique_filename = f"{user_id}_{uuid.uuid4()}_{clean_filename}"
        #upload to supabase storage 
        upload = supabase.storage.from_("images").upload(
            unique_filename, 
            contents, 
            file_options={"content-type": image.content_type} 
        )
        image_url = supabase.storage.from_("images").get_public_url(unique_filename)

        #store in images table 
        data = { 
            "url": image_url, 
            "file_name": unique_filename,
            "content_type": image.content_type,
            "size_bytes": len(contents), 
            "user_id": user_id,  
            "is_public": True 
        }

        #send to images database 
        response = supabase.table("images").insert(data).execute() 
        inserted_row = response.data[0] if response.data and len(response.data) > 0 else None

        if not inserted_row: 
            return { 
                "success": False, 
                "message": "Failed to save uploaded image to database."
            }

        return {
            "success": True, 
            "data": inserted_row, 
            "message": f"Image successfully uploaded."
        }
    except Exception as e: 
        logger.error(f"User {user_id} failed to upload {image.filename}: {e}")
        return {
            "success": False, 
            "message": "Failed to upload image."
        }
    
def call_gemini(image_bytes, max_tokens): 
    
    config_type = ANALYZE_CONFIG if max_tokens == 800 else HIGHER_ANALYZE_CONFIG
    #prompt gemini 
    response = client.models.generate_content(
    model="gemini-3-flash-preview",
    config=config_type, 
    contents=[
        types.Part.from_bytes(
            data=image_bytes,
            mime_type='image/jpeg',
        ), 
        "Analyze this image and look at the whole outfit. Give a quick style tip. For tags, identify the color, style (e.g. streetwear, minimalist, casual), occasion (e.g. everyday, formal, party), and season."
    ] 
    )

    #return gemini response 
    print(response.text)  
    parsed = json.loads(response.text)
    analysis = parsed.get("analysis", "")
    tags = parsed.get("tags", {})

    return analysis, tags

#analyze image 
@router.get("/images/{image_id}/analyze")
async def analyze_image(image_id: str, refresh: bool = False): 

    try: 

        if not refresh: 
            #check if analysis already exists 
            query = supabase.table("images").select("analysis, tags").eq("image_id", image_id).execute()
            if query.data and query.data[0].get("analysis"): 
                return { 
                    "success": True, 
                    "analysis": query.data[0]["analysis"],
                    "tags": query.data[0]["tags"]
                }

        #get image bytes from db 
        query = supabase.table("images").select("url").eq("image_id", image_id).execute() 

        image_url = query.data[0]["url"] 
        image_bytes = requests.get(image_url).content 

        analysis, tags = call_gemini(image_bytes, max_tokens=800)

        #update supabase with analysis and tags
        supabase.table("images").update({
            "analysis": analysis,
            "tags": tags,
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }).eq("image_id", image_id).execute() 

        return { 
            "success": True, 
            "analysis": analysis, 
            "tags": tags 
        } 
    
    except json.JSONDecodeError as e:
        
        #retry gemini call with more tokens if json decode error
        logger.error(f"{image_id} ran into JSON Decode Error.Most likely due to malformed JSON from not enough tokens: {e}")
        try:  
            analysis, tags = call_gemini(image_bytes, max_tokens=1200)

            #update supabase with analysis and tags
            supabase.table("images").update({
                "analysis": analysis,
                "tags": tags, 
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }).eq("image_id", image_id).execute() 

            return { 
                "success": True, 
                "analysis": analysis, 
                "tags": tags 
            } 
        except json.JSONDecodeError as e: 
            logger.error(f"{image_id} still ran into JSON Decode Error after trying with more tokens: {e}")
            return { 
                "success": False, 
                "message": "Failed to analyze image."
            }   
    
    except Exception as e: 
        logger.error(f"Failed to analyze {image_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to analyze image."
        }

class TagRequest(BaseModel):                                                                                                               
    tag_name: str

#add tags to image 
@router.post("/images/{image_id}/tag")
async def add_tags(image_id: str, request: TagRequest): 

    try: 
        #check if tag already exists in tags table
        tag_query = supabase.table("tags").select("*").eq("name", request.tag_name).execute() 

        if tag_query.data: 
            tag_id = tag_query.data[0]["tag_id"] 
        else: 
            return { 
                "success": False, 
                "message": f"Tag '{request.tag_name}' does not exist."
            }
        
        #insert into junction table
        supabase.table("image_tags").insert({
            "image_id": image_id,
            "tag_id": tag_id
        }).execute()

        return { 
            "success": True, 
            "message": "Tag successfully added to image."
        } 

    except Exception as e: 
        logger.error(f"Failed to add tag to {image_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to add tag to image."
        }

#get tags for specific image
@router.get("/images/{image_id}/tags")
async def get_tags(image_id: str): 

    try: 

        query = supabase.table("image_tags").select("*, tags(*)").eq("image_id", image_id).execute()
        if not query.data: 
            return { 
                "success": True, 
                "tags": [] 
            }
        
        tags = [x["tags"] for x in query.data]
        return { 
            "success": True, 
            "tags": tags 
        }
    except Exception as e: 
        logger.error(f"Failed to get tags for {image_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to get tags for image."
        }

class TagsUpdateRequest(BaseModel):                                                                                                        
    tag_names: list[str]                    

#delete tags - select list of tags then delete on frontend 
@router.delete("/images/{image_id}/tags")
async def delete_tags(image_id: str, requests: TagsUpdateRequest):

    try: 
        tag_names = requests.tag_names

        #get tag ids for tag names
        query = supabase.table("tags").select("*").in_("name", tag_names).execute() 
        if not query.data: 
            return { 
                "success": True, 
                "message": "No tags to delete."
            } 
        tag_ids = [x["tag_id"] for x in query.data]

        #delete from junction table 
        supabase.table("image_tags").delete().eq("image_id", image_id).in_("tag_id", tag_ids).execute() 

        return { 
            "success": True, 
            "message": "Tags successfully deleted from image."
        }
    except Exception as e: 
        logger.error(f"Failed to delete tags from {image_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to delete tags from image."
        } 

def fuzzy_match_tag(tag: str) -> str | None: 

    cleaned = tag.strip().lower()
    query = supabase.table("tags").select("name").ilike("name", f"%{cleaned}%").limit(1).execute()

    if query.data: 
        return query.data[0]["name"]
    
    #retry for each word in case gemini returns tags with extra words which bypass ilike
    for word in cleaned.split(): 
        if (len(word) < 3): #bypass short words like in, on, at, etc. 
            continue
        query = supabase.table("tags").select("name").ilike("name", f"%{word}%").limit(1).execute() 
        if query.data: 
            return query.data[0]["name"]
    
    return None 

class saveToWardrobeRequest(BaseModel): 
    color: list[str] | None = None
    style: list[str] | None = None
    season: str | None = None 

@router.post("/images/{image_id}/save-to-wardrobe")
async def save_to_wardrobe(image_id: str, request: saveToWardrobeRequest):

    try: 
        matched_tags = [] 
        #loop thru color tags
        if request.color:
            for color in request.color: 
                matched = fuzzy_match_tag(color) 
                if matched:
                    matched_tags.append(matched)
        #loop thru style tags
        if request.style:
            for style in request.style: 
                matched = fuzzy_match_tag(style) 
                if matched: 
                    matched_tags.append(matched)
        #loop thru season tag
        if request.season:
            matched = fuzzy_match_tag(request.season) 
            if matched: 
                matched_tags.append(matched)

        #get all tag ids for all matched tags
        query = supabase.table("tags").select("*").in_("name", matched_tags).execute() 
        if query.data: 
            rows_to_upsert = [{"image_id": image_id, "tag_id": x["tag_id"]} for x in query.data] 
            #upsert into junction table for wardrobe analysis 
            supabase.table("image_tags").upsert(rows_to_upsert).execute()
        
        return { 
            "success": True, 
            "message": "Image successfully saved to wardrobe."
        }
    except Exception as e:
        logger.error(f"Failed to save {image_id} to wardrobe: {e}")
        return { 
            "success": False, 
            "message": "Failed to save image to wardrobe."
        }




