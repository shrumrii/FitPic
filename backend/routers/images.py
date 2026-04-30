from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request 
from PIL import Image
import io
from database import get_supabase
from pydantic import BaseModel
import uuid
import json
import httpx
import asyncio
from uuid import UUID 

from google import genai
from google.genai import types
from gemini.model_config import ANALYZE_CONFIG, HIGHER_ANALYZE_CONFIG, VALIDATE_CONFIG
from datetime import datetime, timezone

from logger import get_logger
from auth import get_current_user
from limiter import limiter

router = APIRouter()
logger = get_logger(__name__)
gemini_client = genai.Client()

#upload image
@router.post("/images/upload")
@limiter.limit("2/minute")
async def upload_image(request: Request, image: UploadFile = File(...), user_id: str = Form(...), current_user: str = Depends(get_current_user)):

    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        contents = await image.read()

        #compress img
        img = Image.open(io.BytesIO(contents))
        img.thumbnail((1920, 1920))
        img_io = io.BytesIO()
        img.save(img_io, format=img.format or "JPEG", quality=85)
        img_io.seek(0)
        contents = img_io.read()

        #validate img
        response = await gemini_client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=VALIDATE_CONFIG,
            contents=[
                types.Part.from_bytes(data=contents, mime_type='image/jpeg'),
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

        await get_supabase().storage.from_("images").upload(
            unique_filename,
            contents,
            file_options={"content-type": image.content_type}
        )
        image_url = get_supabase().storage.from_("images").get_public_url(unique_filename)

        data = {
            "url": image_url,
            "file_name": unique_filename,
            "content_type": image.content_type,
            "size_bytes": len(contents),
            "user_id": user_id,
            "is_public": True
        }

        response = await get_supabase().table("images").insert(data).execute()
        inserted_row = response.data[0] if response.data and len(response.data) > 0 else None

        if not inserted_row:
            return {
                "success": False,
                "message": "Failed to save uploaded image to database."
            }

        return {
            "success": True,
            "data": inserted_row,
            "message": "Image successfully uploaded."
        }
    except Exception as e:
        logger.error(f"User {user_id} failed to upload {image.filename}: {e}")
        return {
            "success": False,
            "message": "Failed to upload image."
        }

async def call_gemini(image_bytes, max_tokens):

    config_type = ANALYZE_CONFIG if max_tokens == 800 else HIGHER_ANALYZE_CONFIG
    response = await gemini_client.aio.models.generate_content(
        model="gemini-3-flash-preview",
        config=config_type,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
            "Analyze this image and look at the whole outfit. Give a quick style tip. For tags, identify the color, style (e.g. streetwear, minimalist, casual), occasion (e.g. everyday, formal, party), and season."
        ]
    )

    print(response.text)
    parsed = json.loads(response.text)
    analysis = parsed.get("analysis", "")
    tags = parsed.get("tags", {})

    return analysis, tags

async def fuzzy_match_tag(tag: str) -> str | None:

    cleaned = tag.strip().lower()
    query = await get_supabase().table("tags").select("name").ilike("name", f"%{cleaned}%").limit(1).execute()

    if query.data:
        return query.data[0]["name"]

    #retry for each word in case gemini returns tags with extra words which bypass ilike
    for word in cleaned.split():
        if len(word) < 3:
            continue
        query = await get_supabase().table("tags").select("name").ilike("name", f"%{word}%").limit(1).execute()
        if query.data:
            return query.data[0]["name"]

    return None

async def match_tags(color, style, season) -> list[str]:
    tasks = []
    if color:
        tasks.extend([fuzzy_match_tag(c) for c in color])
    if style:
        tasks.extend([fuzzy_match_tag(s) for s in style])
    if season:
        tasks.append(fuzzy_match_tag(season))

    results = await asyncio.gather(*tasks)
    return [r for r in results if r is not None]

#analyze image
@router.get("/images/{image_id}/analyze")
@limiter.limit("5/minute")
async def analyze_image(request: Request, image_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("images").select("url").eq("image_id", image_id).execute()
        image_url = query.data[0]["url"]
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(image_url)
            image_bytes = response.content

        analysis, ai_tags = await call_gemini(image_bytes, max_tokens=800)
        matched_tags = await match_tags(ai_tags.get("color"), ai_tags.get("style"), ai_tags.get("season"))

        return {
            "success": True,
            "analysis": analysis,
            "tags": matched_tags
        }

    except json.JSONDecodeError as e:
        logger.error(f"{image_id} ran into JSON Decode Error. Most likely due to malformed JSON from not enough tokens: {e}")
        try:
            analysis, ai_tags = await call_gemini(image_bytes, max_tokens=1200)
            matched_tags = await match_tags(ai_tags.get("color"), ai_tags.get("style"), ai_tags.get("season"))

            return {
                "success": True,
                "analysis": analysis,
                "tags": matched_tags
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
async def add_tags(image_id: UUID, request: TagRequest, current_user: str = Depends(get_current_user)):

    try:
        tag_query = await get_supabase().table("tags").select("*").eq("name", request.tag_name).execute()

        if tag_query.data:
            tag_id = tag_query.data[0]["tag_id"]
        else:
            return {
                "success": False,
                "message": f"Tag '{request.tag_name}' does not exist."
            }

        await get_supabase().table("image_tags").insert({
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
async def get_tags(image_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("image_tags").select("*, tags(*)").eq("image_id", image_id).execute()
        if not query.data:
            return {
                "success": True,
                "tags": []
            }

        tags = [x["tags"]["name"] for x in query.data]
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

#delete tags
@router.delete("/images/{image_id}/tags")
async def delete_tags(image_id: UUID, requests: TagsUpdateRequest, current_user: str = Depends(get_current_user)):

    try:
        tag_names = requests.tag_names

        query = await get_supabase().table("tags").select("*").in_("name", tag_names).execute()
        if not query.data:
            return {
                "success": True,
                "message": "No tags to delete."
            }
        tag_ids = [x["tag_id"] for x in query.data]

        await get_supabase().table("image_tags").delete().eq("image_id", image_id).in_("tag_id", tag_ids).execute()

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

class saveToWardrobeRequest(BaseModel):
    tags: list[str] | None = None
    analysis: str | None = None


@router.post("/images/{image_id}/save-to-wardrobe")
async def save_to_wardrobe(image_id: UUID, request: saveToWardrobeRequest, current_user: str = Depends(get_current_user)):

    try:
        #delete then insert to guarantee user tags correctness 
        await get_supabase().table("image_tags").delete().eq("image_id", str(image_id)).execute()    

        if request.tags:
            query = await get_supabase().table("tags").select("*").in_("name", request.tags).execute()
            if query.data:
                rows_to_insert = [{"image_id": str(image_id), "tag_id": x["tag_id"]} for x in query.data]
                await get_supabase().table("image_tags").insert(rows_to_insert).execute()

        await get_supabase().table("images").update({
            "analysis": request.analysis,
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }).eq("image_id", image_id).execute()

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
    
#delete user's image
@router.delete("images/{image_id}")
async def delete_image(image_id: UUID, current_user: str = Depends(get_current_user)):


    try:
        query = await get_supabase().table("images").select("image_id, file_name").eq("image_id", image_id).eq("user_id", current_user).execute()
        if not query.data:
            return {
                "success": False,
                "message": "Image not found or does not belong to you"
            }

        file_name = query.data[0]["file_name"]

        await asyncio.gather(
            get_supabase().storage.from_("images").remove([file_name]),
            get_supabase().table("images").delete().eq("image_id", image_id).execute()
        )

        return {
            "success": True,
            "message": "Successfully deleted image."
        }
    except Exception as e:
        logger.error(f"User {current_user} failed to delete {image_id}: {e}")
        return {
            "success": False,
            "message": "Failed to delete image."
        }
    
class journalRequest(BaseModel):
    notes: str | None = None
    description: str | None = None
    rating: int | None = None 
@router.patch("/images/{image_id}/journal")
async def add_notes(image_id: UUID, request: journalRequest, current_user: str = Depends(get_current_user)): 
    
    try: 
        updates = request.model_dump(exclude_none=True) 
        await get_supabase().table("images").update(updates).eq("image_id", str(image_id)).execute() 

        return { 
            "success": True, 
            "message": "Successfully updated journal notes."
        }

    except Exception as e: 
        logger.error(f"User {current_user} failed to update  {image_id}'s journal: {e}")
        return {
            "success": False,
            "message": "Failed to update journal for this image."
        }
    
#call endpoint to get previous analysis information to fetch on mount in analyze page 
@router.get("/images/{image_id}/journal")
async def get_journal_info(image_id: UUID, current_user: str = Depends(get_current_user)): 

    try: 
        query = await get_supabase().table("images").select("analysis, analyzed_at, notes, description, rating").eq("image_id", image_id).execute()
        data = query.data[0]


        #get tags 
        tags_query = await get_supabase().table("image_tags").select("*, tags(*)").eq("image_id", image_id).execute()
        tags = [x["tags"]["name"] for x in tags_query.data]

        return { 
            "success": True, 
            "data": { 
                "analysis": data["analysis"],
                "analyzed_at": data["analyzed_at"],
                "notes": data["notes"],
                "description": data["description"],
                "rating": data["rating"], 
                "tags": tags
            }
        }
    except Exception as e: 
        logger.error(f"Failed to retrieve analyze/journal data from {image_id}: {e}")
        return {
            "success": False, 
            "message": "Failed to retrieve analyze/journal data."
        }


