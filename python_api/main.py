import os, sys
ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.append(os.path.join(ROOT, "rag‑sys"))

from app.server import app   # your FastAPI app instance