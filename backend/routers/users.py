from fastapi import APIRouter, UploadFile, File 
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 

router = APIRouter()

class UserCreate(BaseModel): #modify as needed when i change the users table schema 
        id: str
        email: str
        username: str
        age: int | None = None 

@router.post("/users/create")
async def create_user(user: UserCreate): 
    data = { 
        "user_id": user.id, 
        "email": user.email, 
        "username": user.username, 
        "age": user.age
        #created timestamp autopopulate in supabase 
    }

    response = supabase.table("users").insert(data).execute()
    return {
        "success": True, 
        "message": f"User {user.username} created." 
    }

@router.get("/users/search")
async def search_username(username: str): 

    #query supabase for username 
    query = supabase.table("users").select("user_id, username").ilike("username", f"%{username}%").execute() 
    users = query.data 

    return { 
        "success": True, 
        "data": users 
    }

@router.get("/users/{user_id}")
async def get_user(user_id: str):
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

#get all images from specific user 
@router.get("/users/{user_id}/images")
async def get_images(user_id: str):

    #query, filter by user_id and fetch image id, url, created_at 
    query = supabase.table("images").select("image_id, created_at, url").eq("user_id", user_id).order("created_at", desc=True).execute() 

    #return list of json objects with data (such as image url, etc.) 
    #if empty, handle on frontend (user could have no posts) 
    return { 
        "success": True, 
        "data": query.data
    }

@router.post("/users/{user_id}/pfp")
async def upload_pfp(user_id: str, image: UploadFile = File(...)): 
    
    #validate file type 
    if image.content_type != "image/jpeg" and image.content_type != "image/png": 
        return {
            "success": False, 
            "message": "Not a valid file type. Please use JPEG or PNG"
        }
    
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

class AddFollower(BaseModel): #modify as needed when i change the users table schema 
        following_id: str

@router.post("/users/{follower_id}/follow")
async def add_follower(follower_id: str, following: AddFollower): 

    data = { 
        "follower_id": follower_id, 
        "following_id": following.following_id
    }

    #add to follows table 
    response = supabase.table("follows").insert(data).execute() 
    inserted_row = response.data[0] if response.data and len(response.data) > 0 else None

    if not inserted_row: 
        return { 
            "success": False, 
            "message": "Failed to add row to follows database"
        }
    
    return { 
        "success": True, 
        "data": inserted_row
    }

@router.delete("/users/{follower_id}/unfollow/{following_id}")
async def remove_follower(follower_id: str, following_id: str): 

    try: 
        supabase.table("follows").delete().eq("follower_id", follower_id).eq("following_id", following_id).execute() 

        return { 
            "success": True, 
            "message": f"Successfully unfollowed {following_id}"
        }
    except Exception as e:
        return { 
            "success": False, 
            "message": "Failed to remove follower"
        }

#get list of following
@router.get("/users/{user_id}/following")
async def get_following(user_id: str): 

    #joining users and follows table to get username based on following_id 
    query = supabase.table("follows").select("following_id, users!follows_following_id_fkey(username)").eq("follower_id", user_id).execute() 
    following = query.data 

    return {
        "success": True, 
        "data": following
    }

#get list of followers 
@router.get("/users/{user_id}/followers")
async def get_followers(user_id: str): 

    #joining users and follows table to get username based on following_id 
    query = supabase.table("follows").select("follower_id, users!follows_follower_id_fkey(username)").eq("following_id", user_id).execute() 
    followers = query.data 

    return {
        "success": True, 
        "data": followers
    }

#get user feed, essentially combine /following and /images endpoints 
@router.get("/users/{user_id}/feed")
async def get_feed(user_id: str):

    feed_list = [] 
    try: 
        #get following 
        query = supabase.table("follows").select("following_id").eq("follower_id", user_id).execute() 
        following = query.data 

        for item in following: 
            following_id = item["following_id"]

            query = supabase.table("images").select("image_id, users!images_user_id_fkey(username), created_at, url").eq("user_id", following_id).order("created_at", desc=True).execute() 
            images = query.data
            for image in images: 
                image_dict = {"user_id": following_id, "username": image["users"]["username"], "image_id": image["image_id"], "url": image["url"], "created_at": image["created_at"]}
                feed_list.append(image_dict) 

        #sort by most recent across all friends 
        feed_list.sort(key=lambda x: x["created_at"], reverse=True)

        return { 
            "success": True, 
            "data": feed_list
        }
    except Exception as e: 
        return { 
            "success": False, 
            "message": str(e) 
        }
    
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
            "message": f"Successfully deleted {image_id}"
        }                                                                                                           
    except Exception as e:                                                                                                               
        return {"success": False, "message": str(e)}

#to load existing rankings page 
@router.get("/users/{user_id}/rankings") 
async def get_rankings(user_id: str): 

    query = supabase.table("rankings").select("*, images(url)").eq("user_id", user_id).order("rank", desc=True).execute()
    rankings = query.data 

    return { 
        "success": True, 
        "data": rankings
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

        return { 
            "success": False, 
            "message": str(e) 
        }