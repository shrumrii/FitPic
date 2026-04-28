from fastapi import APIRouter
from database import get_supabase
from logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

#get all images for a global tag
@router.get("/tags/{tag_name}")
async def get_images_by_tag(tag_name: str):

    try:
        query = await get_supabase().table("tags").select("*, image_tags(*, images(*))").eq("name", tag_name).execute()

        if not query.data:
            return {"success": False, "message": "Tag not found."}

        image_list = query.data[0]["image_tags"]
        images = [x["images"] for x in image_list]

        return {
            "success": True,
            "images": images
        }
    except Exception as e:
        logger.error(f"Failed to get images for tag {tag_name}: {e}")
        return {
            "success": False,
            "message": "Failed to get images for tag."
        }

#get all images for a user's tag
@router.get("/users/{user_id}/tags/{tag_name}")
async def get_user_images_by_tag(user_id: str, tag_name: str):

    try:
        query = await get_supabase().table("tags").select("*, image_tags(*, images(*))").eq("name", tag_name).eq("user_id", user_id).execute()

        if not query.data:
            return {"success": False, "message": "Tag not found."}

        image_list = query.data[0]["image_tags"]
        images = [x["images"] for x in image_list]

        return {
            "success": True,
            "images": images
        }
    except Exception as e:
        logger.error(f"Failed to get images for tag {tag_name} and user {user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to get images for tag."
        }

#get style stats for a user (for wardrobe page)
@router.get("/users/{user_id}/style-stats")
async def get_style_stats(user_id: str):

    try:
        data = {}
        query = await get_supabase().rpc("get_tag_stats", {"p_user_id": user_id}).execute()
        if not query.data:
            return {
                "success": False,
                "message": "No style stats found for user."
            }

        top_style = query.data[0]["tag_name"]
        data["top_style"] = top_style

        total = sum(row["tag_count"] for row in query.data)
        top_5 = [
            {**row, "percentage": round(row["tag_count"] / total * 100)}
            for row in query.data[:5]
        ]
        data["top_5"] = top_5

        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Failed to get style stats for user {user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to get style stats."
        }

#get color stats for a user (for wardrobe page)
@router.get("/users/{user_id}/color-stats")
async def get_color_stats(user_id: str):

    try:
        data = {}
        query = await get_supabase().rpc("get_color_stats", {"p_user_id": user_id}).execute()
        if not query.data:
            return {
                "success": False,
                "message": "No color stats found for user."
            }

        top_5_colors = [
            {"color": row["tag_name"], "count": row["tag_count"]}
            for row in query.data[:5]
        ]
        data["top_5_colors"] = top_5_colors

        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Failed to get color stats for user {user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to get color stats."
        }
