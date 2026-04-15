from fastapi import APIRouter
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 
from logger import get_logger 

router = APIRouter() 
logger = get_logger(__name__) 

#get user's favorited images 
@router.get("/favorites")
async def get_favorites(user_id: str): 

    try: 
        query = supabase.table("favorites").select("user_id, users!favorites_user_id_fkey(username), images!favorites_image_id_fkey(image_id, url, created_at)").eq("user_id", user_id).order("created_at", desc=True).execute()
        favorites = query.data 

        return {
            "success": True, 
            "data": favorites
        }
    except Exception as e: 
        logger.error(f"Failed to get favorites for {user_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to get favorites."
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

        if not response.data: 
            return { 
                "success": False, 
                "message": "Failed to favorite image."
            }

        return {
            "success": True, 
            "data": response.data, 
            "message": f"Image favorited."
        }

    except Exception as e: 
        logger.error(f"Failed to favorite {favorite.image_id} for {favorite.user_id}: {e}")
        return {
            "success": False, 
            "message": "Failed to favorite image."
        }
    
#unfavorite an image
@router.delete("/favorites") 
async def delete_favorite(favorite: Favorite): 

    try: 
        response = supabase.table("favorites").delete().eq("user_id", favorite.user_id).eq("image_id", favorite.image_id).execute() 
        return {
            "success": True, 
            "data": response.data, 
            "message": f"Image unfavorited."
        }

    except Exception as e: 
        logger.error(f"Failed to unfavorite {favorite.image_id} for {favorite.user_id}: {e}")
        return {
            "success": False, 
            "message": "Failed to unfavorite image."
        }



