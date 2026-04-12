from fastapi import APIRouter
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 

router = APIRouter() 

#get user's favorited images 
@router.get("/favorites")
async def get_favorites(user_id: str): 

    query = supabase.table("favorites").select("user_id, users!favorites_user_id_fkey(username), images!favorites_image_id_fkey(image_id, url, created_at)").eq("user_id", user_id).order("created_at", desc=True).execute()
    favorites = query.data 

    return {
        "success": True, 
        "data": favorites
    }

class Favorite(BaseModel): 
    user_id: str 
    image_id: str

#favorite an image
@router.post("/favorites") 
async def add_favorite(favorite: Favorite): 
    
    data = {
        "user_id": favorite.user_id, 
        "image_id": favorite.image_id
    }

    try: 

        response = supabase.table("favorites").insert(data).execute() 
        return {
            "success": True, 
            "data": response.data, 
            "message": f"Image {favorite.image_id} favorited by user {favorite.user_id}."
        }

    except Exception as e: 
        return {
            "success": False, 
            "message": str(e)
        }
    
#unfavorite an image
@router.delete("/favorites") 
async def delete_favorite(favorite: Favorite): 

    try: 
        response = supabase.table("favorites").delete().eq("user_id", favorite.user_id).eq("image_id", favorite.image_id).execute() 
        return {
            "success": True, 
            "data": response.data, 
            "message": f"Image {favorite.image_id} unfavorited by user {favorite.user_id}."
        }

    except Exception as e: 
        return {
            "success": False, 
            "message": str(e)
        }



