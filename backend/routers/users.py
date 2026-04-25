from fastapi import APIRouter, UploadFile, File 
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 
from logger import get_logger 


router = APIRouter()
logger = get_logger(__name__) 

class UserCreate(BaseModel): #modify as needed when i change the users table schema 
        id: str
        email: str
        username: str
        age: int | None = None 
 
#create user, match supabase auth user creation 
@router.post("/users/create")
async def create_user(user: UserCreate): 
    data = { 
        "user_id": user.id, 
        "email": user.email, 
        "username": user.username, 
        "age": user.age
        #created timestamp autopopulate in supabase 
    }
    try: 
        supabase.table("users").insert(data).execute()

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

#
@router.get("/users/search")
async def search_username(username: str): 

    #query supabase for username 
    try:
        #allow partial matches
        query = supabase.table("users").select("user_id, username").ilike("username", f"%{username}%").execute() 
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
 
#get user by id, used widely across app
@router.get("/users/{user_id}")
async def get_user(user_id: str):

    try: 
        response = supabase.table("users").select("*").eq("user_id", user_id).execute() 
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
async def get_images(user_id: str, include_likes: bool = False, limit: int = 50):

    #get a count of likes if include_likes optional param is true 
    if (include_likes):
        select = "image_id, created_at, url, favorites!favorites_image_id_fkey(count)"
    else: 
        select = "image_id, created_at, url"

    try: 
        query = supabase.table("images").select(select).eq("user_id", user_id).order("created_at", desc=True).execute() 

        return { 
        "success": True, 
        "data": query.data[:limit]
        }
    except Exception as e: 
        logger.error(f"Failed to get images from {user_id}: {e}.")
        return { 
            "success": False, 
            "message": f"Failed to get images."
        }

#change user's pfp (profile page) 
@router.post("/users/{user_id}/pfp")
async def upload_pfp(user_id: str, image: UploadFile = File(...)): 
    
    #validate file type 
    if image.content_type != "image/jpeg" and image.content_type != "image/png": 
        return {
            "success": False, 
            "message": "Not a valid file type. Please use JPEG or PNG"
        }
    
    try: 
        #check old pfp (if exists) 
        old_pfp_filename = ""
        pfp_check_query = supabase.table("users").select("pfp_url").eq("user_id", user_id).execute()
        if pfp_check_query.data and pfp_check_query.data[0].get("pfp_url"): 
            old_pfp_filename = pfp_check_query.data[0].get("pfp_url").split("/")[-1]

        contents = await image.read() 
        #compress img 
        img = Image.open(io.BytesIO(contents))
        img.thumbnail((1920, 1920)) 
        img_io = io.BytesIO()
        img.save(img_io, format=img.format or "JPEG", quality=85, optimize=True)
        img_io.seek(0) 
        contents = img_io.read() 

        clean_filename = image.filename.replace(" ", "_") 
        unique_filename = f"{user_id}_{clean_filename}"
        #upload to supabase storage (profile-pictures) - wrap in try catch finally so that it doesnt update database when upload to storage fails 
        upload = supabase.storage.from_("profile-pictures").upload(
            unique_filename, 
            contents, 
            file_options={"content-type": image.content_type}
        )
        image_url = supabase.storage.from_("profile-pictures").get_public_url(unique_filename) 
        
        #upload successful, remove old pfp 
        if old_pfp_filename: 
            supabase.storage.from_("profile-pictures").remove([old_pfp_filename])

        #update users row 
        query = supabase.table("users").update({"pfp_url": image_url}).eq("user_id", user_id).execute()
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
        logger.error(f"Failed to change profile picture for {user_id}: {e}")
        return {
            "success": False, 
            "message": "Failed to change profile picture" 
        }

class AddFollower(BaseModel): 
    following_id: str

#follow another user, follower_id is user 
@router.post("/users/{follower_id}/follow")
async def add_follower(follower_id: str, following: AddFollower): 

    data = { 
        "follower_id": follower_id, 
        "following_id": following.following_id
    }

    try: 

        #add to follows table 
        response = supabase.table("follows").insert(data).execute() 
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
        logger.error(f"User {follower_id} failed to add {following} as a follower: {e}")
        return { 
            "success": False, 
            "message": "Failed to add row to follows database"
        }

#unfollow user 
@router.delete("/users/{follower_id}/unfollow/{following_id}")
async def remove_follower(follower_id: str, following_id: str): 

    try: 
        supabase.table("follows").delete().eq("follower_id", follower_id).eq("following_id", following_id).execute() 

        return { 
            "success": True, 
            "message": f"Successfully unfollowed."
        }
    except Exception as e:
        logger.error(f"User {follower_id} failed to remove {following_id} as follower: {e}")
        return { 
            "success": False, 
            "message": "Failed to remove follower"
        }

#get list of following
@router.get("/users/{user_id}/following")
async def get_following(user_id: str): 

    try: 
        #joining users and follows table to get following 
        query = supabase.table("follows").select("following_id, users!follows_following_id_fkey(username)").eq("follower_id", user_id).execute() 
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
async def get_followers(user_id: str): 

    try: 
        #joining users and follows table to get followed usernames 
        query = supabase.table("follows").select("follower_id, users!follows_follower_id_fkey(username)").eq("following_id", user_id).execute() 
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

#get user feed, essentially combine /following and /images endpoints 
@router.get("/users/{user_id}/feed")
async def get_feed(user_id: str, include_likes: bool = True, mode: str = "recent", limit: int = 50):

    feed_list = [] 
    try: 
        #get following list (just ids)
        query = supabase.table("follows").select("following_id").eq("follower_id", user_id).execute() 
        following = [item["following_id"] for item in query.data]

        if include_likes: 
            select = "user_id, image_id, users!images_user_id_fkey(username), created_at, url, favorites!favorites_image_id_fkey(count)"
        else: 
            select = "user_id, image_id, users!images_user_id_fkey(username), created_at, url"

        query = supabase.table("images").select(select).in_("user_id", following).order("created_at", desc=True).execute() 
        images = query.data 

        for image in images: 
            image_dict = {"user_id": image["user_id"], "username": image["users"]["username"], "image_id": image["image_id"], "url": image["url"], "created_at": image["created_at"]}
            if include_likes:
                image_dict["likes"] = image["favorites"][0]["count"] if image.get("favorites") else 0
            feed_list.append(image_dict)

        #sort based on mode 
        if mode == 'most_liked':
            feed_list.sort(key=lambda x: x["likes"], reverse=True)
        else: 
            feed_list.sort(key=lambda x: x["created_at"], reverse=True)

        #slice based on limit 
        feed_list = feed_list[:limit]

        return { 
            "success": True, 
            "data": feed_list
        }
    except Exception as e: 
        logger.error(f"Failed to get {user_id} feed: {e}")
        return { 
            "success": False, 
            "message": "Failed to get feed."
        }
    
#delete user's image 
@router.delete("/users/{user_id}/images/{image_id}")
async def delete_image(user_id: str, image_id: str): 

    try:
        #validate image belongs to the user and get file_name for storage deletion
        query = supabase.table("images").select("image_id, file_name").eq("image_id", image_id).eq("user_id", user_id).execute()
        if not query.data:
            return {
                "success": False,
                "message": "Image not found or does not belong to you"
            }

        file_name = query.data[0]["file_name"]

        #delete from storage
        supabase.storage.from_("images").remove([file_name])

        #delete from db
        supabase.table("images").delete().eq("image_id", image_id).execute()

        return {
            "success": True,
            "message": f"Successfully deleted image."
        }                                                                                                           
    except Exception as e:  
        logger.error(f"User {user_id} failed to delete {image_id}: {e}")                                                                                                             
        return {
            "success": False, 
            "message": "Failed to delete image."
        }

#load existing rankings page 
@router.get("/users/{user_id}/rankings") 
async def get_rankings(user_id: str): 
    try: 
        query = supabase.table("rankings").select("*, images(url)").eq("user_id", user_id).order("rank", desc=True).execute()
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

# save new rankings, trust front end for validation 
@router.put("/users/{user_id}/rankings")
async def save_rankings(user_id: str, rankings: RankingList):

    try: 
        #delete existing rankings for user 
        supabase.table("rankings").delete().eq("user_id", user_id).execute() 

        new_rankings = [] 
        #replace with new ones from ranking list 
        for item in rankings.rankings: 
            data = {
                "user_id": user_id, 
                "image_id": item.image_id, 
                "rank": item.rank
            }
            new_rankings.append(data)
        
        supabase.table("rankings").insert(new_rankings).execute() 

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
    
#get all user images that have been analyzed 
@router.get("/users/{user_id}/analyzed-images")
async def get_analyzed_images(user_id: str):

    try: 
        query = supabase.table("images").select("image_id, url, analyzed_at").eq("user_id", user_id).not_.is_("analyzed_at", "null").limit(10).order("analyzed_at", desc=True).execute()
        analyzed_images = query.data

        return { 
            "success": True, 
            "data": analyzed_images
        }
    except Exception as e: 
        logger.error(f"Failed to get analyzed images for {user_id}: {e}")
        return { 
            "success": False, 
            "message": "Failed to get analyzed images."
        }