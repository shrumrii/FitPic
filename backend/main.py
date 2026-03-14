from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uuid
from PIL import Image 
import io 
from database import supabase #import client from database.py 

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

@app.post("/images/upload")
async def upload_image(image: UploadFile = File(...)):
    contents = await image.read()

    #compress img 
    img = Image.open(io.BytesIO(contents)) 
    img.thumbnail((1920, 1920)) #resize to max 1920x1920 
    img_io = io.BytesIO() 
    img.save(img_io, format=img.format or "JPEG", quality=85, optimize=True) 
    img_io.seek(0) 
    contents = img_io.read()  

    #just autogenerate user id for now, need to be replace later with real user id from auth system
    user_id = "cb27c878-b296-4b67-b782-006c6fae56b4"

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
