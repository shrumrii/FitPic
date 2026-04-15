from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image 
import io 
from database import supabase #import client from database.py 
from pydantic import BaseModel 
import uuid 
from logger import request_logger

from routers import users, images, favorites 

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://fit-pic.vercel.app"],   
    allow_methods=["*"],                      
    allow_headers=["*"],                    
)
 
@app.middleware("http")
async def log_requests(request, call_next): 
    response = await call_next(request)
    request_logger.info(f"{request.method} {request.url.path} - {response.status_code}")   
    return response 

app.include_router(users.router)
app.include_router(images.router) 
app.include_router(favorites.router) 

@app.get("/") 
async def root(): 
    return {"message": "Hello, World!"}  



# @app.get("/images/rank")
# async def get_image_rank(image_id: str):











