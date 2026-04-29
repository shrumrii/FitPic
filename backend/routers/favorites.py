from fastapi import APIRouter, Depends, HTTPException
from database import get_supabase
from pydantic import BaseModel
from logger import get_logger
from auth import get_current_user

router = APIRouter()
logger = get_logger(__name__)

#get user's favorited images
@router.get("/favorites")
async def get_favorites(user_id: str, current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("favorites").select("user_id, images!favorites_image_id_fkey(image_id, url, created_at, users!images_user_id_fkey(username))").eq("user_id", user_id).order("created_at", desc=True).execute()
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
async def add_favorite(favorite: Favorite, current_user: str = Depends(get_current_user)):

    if current_user != favorite.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    data = {
        "user_id": favorite.user_id,
        "image_id": favorite.image_id
    }

    try:
        response = await get_supabase().table("favorites").insert(data).execute()

        if not response.data:
            return {
                "success": False,
                "message": "Failed to favorite image."
            }

        return {
            "success": True,
            "data": response.data,
            "message": "Image favorited."
        }

    except Exception as e:
        logger.error(f"Failed to favorite {favorite.image_id} for {favorite.user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to favorite image."
        }

#unfavorite an image
@router.delete("/favorites")
async def delete_favorite(favorite: Favorite, current_user: str = Depends(get_current_user)):

    if current_user != favorite.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        response = await get_supabase().table("favorites").delete().eq("user_id", favorite.user_id).eq("image_id", favorite.image_id).execute()
        return {
            "success": True,
            "data": response.data,
            "message": "Image unfavorited."
        }

    except Exception as e:
        logger.error(f"Failed to unfavorite {favorite.image_id} for {favorite.user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to unfavorite image."
        }
