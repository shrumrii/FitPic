from fastapi import APIRouter, UploadFile, File, Form
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 

router = APIRouter() 

@router.post("/images/upload")
async def upload_image(image: UploadFile = File(...), user_id: str = Form(...)):
    contents = await image.read()

    #compress img 
    img = Image.open(io.BytesIO(contents)) 
    img.thumbnail((1920, 1920)) #resize to max 1920x1920 
    img_io = io.BytesIO() 
    img.save(img_io, format=img.format or "JPEG", quality=85, optimize=True) 
    img_io.seek(0) 
    contents = img_io.read()  

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

    return {
        "success": True, 
        "data": inserted_row, 
        "message": f"Image {image.filename} uploaded."
    }


class ToggleFavorite(BaseModel): 
        favorite: bool 

@router.patch("/images/{image_id}/toggle-favorite")
async def favorite(image_id: str, favorite_bool: ToggleFavorite): 
    query = supabase.table("images").update({"favorite": favorite_bool.favorite}).eq("image_id", image_id).execute() 
    updated_row = query.data[0] if query.data and len(query.data) > 0 else None 

    if not updated_row: 
        return { 
            "success": False, 
            "message": f"Unable to favorite {image_id}"
        }

    return { 
        "success": True, 
        "message": f"Favorited {image_id}" 
    }