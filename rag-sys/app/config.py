# app/config.py
from pathlib import Path
from dotenv import load_dotenv
from types import SimpleNamespace
import os
import logging

load_dotenv(Path(__file__).with_suffix('.env'))   # loads your .env

settings = SimpleNamespace(
    SUPABASE_URL         = os.getenv("SUPABASE_URL"),
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY"),
    GROQ_API_KEY         = os.getenv("GROQ_API_KEY"),
    DATABASE_URL         = os.getenv("DATABASE_URL"),
)

logging.basicConfig(level=logging.INFO)

