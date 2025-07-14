from prisma import Prisma
from .config import settings
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

from prisma import Prisma

db = Prisma()


SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)