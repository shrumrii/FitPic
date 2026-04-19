from fastapi import APIRouter, UploadFile, File, Form
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 
from google import genai
from google.genai import types
from logger import get_logger 
import requests

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
        model="gemini-2.0-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction="You are a clothing validator. Answer only 'yes' or 'no'.",
            thinking_config=types.ThinkingConfig(thinking_level="low")
        ), 
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
    
#analyze image 
@router.get("/images/{image_id}/analyze")
async def analyze_image(image_id: str): 

    try: 

        #get image bytes from db 
        query = supabase.table("images").select("url").eq("image_id", image_id).execute() 
        image_url = query.data[0]["url"] 
        image_bytes = requests.get(image_url).content 

        #prompt gemini 
        response = client.models.generate_content_stream(
        model="gemini-2.0-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction="You are an expert fashion stylist. Give specific, honest, actionable style advice.",
            thinking_config=types.ThinkingConfig(thinking_level="low")
        ), 
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type='image/jpeg',
            ), 
            "Analyze this image and give tips on the image's fashion."
        ] 
        )

        #return gemini response 
        analysis = [] 
        for chunk in response:
            analysis.append(chunk.text)

        return { 
            "success": True, 
            "analysis": "".join(analysis)
        } 
    
    except Exception as e: 
        logger.error(f"Failed to analyze {image_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to analyze image."
        }

