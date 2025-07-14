from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
import logging
import traceback
from app.dependencies import verify_user
from app.routers.chat import router as chat_router
from app.routers.embedding import router as embedding_router
from app.database import db

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(dependencies=[Depends(verify_user)])

# Add the exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {exc}")
    logger.error(f"Full traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

app.include_router(chat_router)
app.include_router(embedding_router)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown") 
async def shutdown():
    await db.disconnect()

@app.get('/')
async def root():
    return {'message': 'RAG FastAPI running'}