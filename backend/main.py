from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_supabase
from pydantic import BaseModel
from logger import request_logger, frontend_logger

from routers import users, images, favorites, tags

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_supabase()
    yield

app = FastAPI(lifespan=lifespan)

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
app.include_router(tags.router)

@app.get("/")
async def root():
    return {"message": "Hello, World!"}

class FrontendError(BaseModel):
    message: str
    stack: str | None
    user_id: str | None
    timestamp: str

@app.post("/logs/frontend-error")
async def log_frontend_error(error: FrontendError):
    frontend_logger.error(f"{error.timestamp} | user:{error.user_id} | {error.message} | {error.stack}")
    return {"success": True}
