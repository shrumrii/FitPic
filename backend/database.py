from supabase import create_client, Client
import os 
from dotenv import load_dotenv

load_dotenv() 

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
print("KEY:", SUPABASE_KEY[:20] if SUPABASE_KEY else "NOT FOUND")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

