from supabase import acreate_client, AsyncClient
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_supabase: AsyncClient | None = None

async def init_supabase():
    global _supabase
    _supabase = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> AsyncClient:
    return _supabase
