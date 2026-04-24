from fastapi import APIRouter
from database import supabase 
from logger import get_logger 

router = APIRouter() 
logger = get_logger(__name__) 

#get all images for a global tag
@router.get("/tags/{tag_name}")
def get_images_by_tag(tag_name: str): 

    try: 
        #nested query into junction table to get all images with the tag 
        query = supabase.table("tags").select("*, image_tags(*, images(*))").eq("name", tag_name).execute() 

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


