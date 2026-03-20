from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uuid
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   
    allow_methods=["*"],                      
    allow_headers=["*"],                    
)

@app.get("/") 
async def root(): 
    return {"message": "Hello, World!"}  

class UserCreate(BaseModel): #modify as needed when i change the users table schema 
        id: str
        email: str
        username: str
        age: int | None = None 

@app.post("/users/create")
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

@app.get("/users/search")
async def search_username(username: str): 

    #query supabase for username 
    query = supabase.table("users").select("user_id, username").ilike("username", f"%{username}%").execute() 
    users = query.data 

    return { 
        "success": True, 
        "data": users 
    }

@app.get("/users/{user_id}")
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
@app.get("/users/{user_id}/images")
async def get_images(user_id: str):

    #query, filter by user_id and fetch image id, url, created_at 
    query = supabase.table("images").select("image_id, created_at, url").eq("user_id", user_id).order("created_at", desc=True).execute() 

    print('hi') 
    #return list of json objects with data (such as image url, etc.) 
    #if empty, handle on frontend (user could have no posts) 
    return { 
        "success": True, 
        "data": query.data
    }


@app.post("/users/{user_id}/pfp")
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

@app.post("/images/upload")
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
    unique_filename = f"{user_id}_{clean_filename}"
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
        "file_name": image.filename,
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


