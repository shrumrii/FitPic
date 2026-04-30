from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from PIL import Image
import io
from database import get_supabase
from pydantic import BaseModel
import uuid
from logger import get_logger
import asyncio
from concurrent.futures import ThreadPoolExecutor
from auth import get_current_user
from uuid import UUID 


router = APIRouter()
logger = get_logger(__name__)

class UserCreate(BaseModel):
    email: str
    username: str
    age: int | None = None

#create user, match supabase auth user creation
@router.post("/users/create")
async def create_user(user: UserCreate, current_user: str = Depends(get_current_user)):

    data = {
        "user_id": current_user,
        "email": user.email,
        "username": user.username,
        "age": user.age
    }
    try:
        await get_supabase().table("users").insert(data).execute()

        return {
            "success": True,
            "message": f"User {user.username} created."
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return {
            "success": False,
            "message": "Failed to create user."
        }

#search for username - used for friend search feature
@router.get("/users/search")
async def search_username(username: str, current_user: str = Depends(get_current_user)):

    try:
        #strip whitespace and guard for long usernames 
        username = username.strip() 
        if len(username) > 30: 
            return { 
                "success": False, 
                "message": "Username was too long."
            }

        query = await get_supabase().table("users").select("user_id, username").ilike("username", f"%{username}%").execute()
        users = query.data

        return {
            "success": True,
            "data": users
        }

    except Exception as e:
        logger.error(f"Error searching for username: {e}")
        return {
            "success": False,
            "message": "Failed to search for username."
        }
    
#get user feed
@router.get("/users/feed")
async def get_feed(include_likes: bool = True, mode: str = "recent", limit: int = 50, current_user: str = Depends(get_current_user)):

    feed_list = []
    try:
        query = await get_supabase().table("follows").select("following_id").eq("follower_id", current_user).execute()
        following = [item["following_id"] for item in query.data]

        if include_likes:
            select = "user_id, image_id, users!images_user_id_fkey(username), created_at, url, favorites!favorites_image_id_fkey(count)"
        else:
            select = "user_id, image_id, users!images_user_id_fkey(username), created_at, url"

        query = await get_supabase().table("images").select(select).in_("user_id", following).order("created_at", desc=True).execute()
        images = query.data

        for image in images:
            image_dict = {"user_id": image["user_id"], "username": image["users"]["username"], "image_id": image["image_id"], "url": image["url"], "created_at": image["created_at"]}
            if include_likes:
                image_dict["likes"] = image["favorites"][0]["count"] if image.get("favorites") else 0
            feed_list.append(image_dict)

        if mode == 'most_liked':
            feed_list.sort(key=lambda x: x["likes"], reverse=True)
        else:
            feed_list.sort(key=lambda x: x["created_at"], reverse=True)

        feed_list = feed_list[:limit]

        return {
            "success": True,
            "data": feed_list
        }
    except Exception as e:
        logger.error(f"Failed to get {current_user} feed: {e}")
        return {
            "success": False,
            "message": "Failed to get feed."
        }

#get all user images that have been analyzed
@router.get("/users/analyzed-images")
async def get_analyzed_images(current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("images").select("image_id, url, analyzed_at").eq("user_id", current_user).not_.is_("analyzed_at", "null").limit(10).order("analyzed_at", desc=True).execute()
        analyzed_images = query.data

        return {
            "success": True,
            "data": analyzed_images
        }
    except Exception as e:
        logger.error(f"Failed to get analyzed images for {current_user}: {e}")
        return {
            "success": False,
            "message": "Failed to get analyzed images."
        }

#get user by id, used widely across app
@router.get("/users/{user_id}")
async def get_user(user_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        response = await get_supabase().table("users").select("*").eq("user_id", user_id).execute()
        user = response.data[0] if response.data and len(response.data) > 0 else None

        if user:
            return {
                "success": True,
                "data": user
            }
        else:
            return {
                "success": False,
                "message": "User not found."
            }
    except Exception as e:
        logger.error(f"Failed to get user: {e}")
        return {
                "success": False,
                "message": "Failed to get user."
            }

#get all images from specific user
@router.get("/users/{user_id}/images")
async def get_images(user_id: UUID, include_likes: bool = False, limit: int = 50, current_user: str = Depends(get_current_user)):

    if include_likes:
        select = "image_id, created_at, url, favorites!favorites_image_id_fkey(count)"
    else:
        select = "image_id, created_at, url"

    try:
        query = await get_supabase().table("images").select(select).eq("user_id", user_id).order("created_at", desc=True).execute()

        return {
            "success": True,
            "data": query.data[:limit]
        }
    except Exception as e:
        logger.error(f"Failed to get images from {user_id}: {e}.")
        return {
            "success": False,
            "message": "Failed to get images."
        }

#change user's pfp (profile page)
@router.post("/users/pfp")
async def upload_pfp(image: UploadFile = File(...), current_user: str = Depends(get_current_user)):

    if image.content_type != "image/jpeg" and image.content_type != "image/png":
        return {
            "success": False,
            "message": "Not a valid file type. Please use JPEG or PNG"
        }

    try:
        old_pfp_filename = ""
        pfp_check_query = await get_supabase().table("users").select("pfp_url").eq("user_id", current_user).execute()
        if pfp_check_query.data and pfp_check_query.data[0].get("pfp_url"):
            old_pfp_filename = pfp_check_query.data[0].get("pfp_url").split("/")[-1]

        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        img.thumbnail((1920, 1920))
        img_io = io.BytesIO()
        img.save(img_io, format=img.format or "JPEG", quality=85, optimize=True)
        img_io.seek(0)
        contents = img_io.read()

        clean_filename = image.filename.replace(" ", "_")
        unique_filename = f"{current_user}_{clean_filename}"

        await get_supabase().storage.from_("profile-pictures").upload(
            unique_filename,
            contents,
            file_options={"content-type": image.content_type}
        )
        image_url = get_supabase().storage.from_("profile-pictures").get_public_url(unique_filename)

        if old_pfp_filename:
            await get_supabase().storage.from_("profile-pictures").remove([old_pfp_filename])

        query = await get_supabase().table("users").update({"pfp_url": image_url}).eq("user_id", current_user).execute()
        updated_row = query.data[0] if query.data and len(query.data) > 0 else None

        if not updated_row:
            return {
                "success": False,
                "message": "User not found"
            }

        return {
            "success": True,
            "updated_row": updated_row,
            "message": "Profile picture updated"
        }
    except Exception as e:
        logger.error(f"Failed to change profile picture for {current_user}: {e}")
        return {
            "success": False,
            "message": "Failed to change profile picture"
        }

class AddFollower(BaseModel):
    following_id: UUID 

#follow another user
@router.post("/users/follow")
async def add_follower(following: AddFollower, current_user: str = Depends(get_current_user)):

    data = {
        "follower_id": current_user,
        "following_id": following.following_id
    }

    try:
        response = await get_supabase().table("follows").insert(data).execute()
        inserted_row = response.data[0] if response.data and len(response.data) > 0 else None

        if not inserted_row:
            return {
                "success": False,
                "message": "Failed to follow user."
            }

        return {
            "success": True,
            "data": inserted_row
        }
    except Exception as e:
        logger.error(f"User {current_user} failed to add {following} as a follower: {e}")
        return {
            "success": False,
            "message": "Failed to add row to follows database"
        }

#unfollow user
@router.delete("/users/unfollow/{following_id}")
async def remove_follower(following_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        await get_supabase().table("follows").delete().eq("follower_id", current_user).eq("following_id", following_id).execute()

        return {
            "success": True,
            "message": "Successfully unfollowed."
        }
    except Exception as e:
        logger.error(f"User {current_user} failed to remove {following_id} as follower: {e}")
        return {
            "success": False,
            "message": "Failed to remove follower"
        }

#get list of following
@router.get("/users/{user_id}/following")
async def get_following(user_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("follows").select("following_id, users!follows_following_id_fkey(username)").eq("follower_id", user_id).execute()
        following = query.data

        return {
            "success": True,
            "data": following
        }
    except Exception as e:
        logger.error(f"User {user_id} failed to get following: {e}")
        return {
            "success": False,
            "message": "Failed to get following."
        }

#get list of followers
@router.get("/users/{user_id}/followers")
async def get_followers(user_id: UUID, current_user: str = Depends(get_current_user)):

    try:
        query = await get_supabase().table("follows").select("follower_id, users!follows_follower_id_fkey(username)").eq("following_id", user_id).execute()
        followers = query.data

        return {
            "success": True,
            "data": followers
        }
    except Exception as e:
        logger.error(f"User {user_id} failed to get list of followers: {e}")
        return {
            "success": False,
            "message": "Failed to get followers."
        }

#load existing rankings page
@router.get("/users/{user_id}/rankings")
async def get_rankings(user_id: UUID, current_user: str = Depends(get_current_user)):
    try:
        query = await get_supabase().table("rankings").select("*, images(url)").eq("user_id", user_id).order("rank", desc=True).execute()
        rankings = query.data

        return {
            "success": True,
            "data": rankings
        }
    except Exception as e:
        logger.error(f"Failed to get personal rankings for {user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to get rankings"
        }

class Ranking(BaseModel):
    image_id: str
    rank: int

class RankingList(BaseModel):
    rankings: list[Ranking]

#save new rankings
@router.put("/users/{user_id}/rankings")
async def save_rankings(user_id: UUID, rankings: RankingList, current_user: str = Depends(get_current_user)):

    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        await get_supabase().table("rankings").delete().eq("user_id", user_id).execute()

        new_rankings = []
        for item in rankings.rankings:
            data = {
                "user_id": user_id,
                "image_id": item.image_id,
                "rank": item.rank
            }
            new_rankings.append(data)

        await get_supabase().table("rankings").insert(new_rankings).execute()

        return {
            "success": True,
            "message": "Rankings saved successfully"
        }
    except Exception as e:
        logger.error(f"Failed to save new personal rankings for {user_id}: {e}")
        return {
            "success": False,
            "message": "Failed to save rankings"
        }
