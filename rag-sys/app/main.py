from fastapi import FastAPI, Depends
from app.dependencies import verify_user
from app.routers.chat import router as chat_router

app = FastAPI(dependencies=[Depends(verify_user)])
app.include_router(chat_router)

@app.get('/')
async def root():
    return {'message': 'RAG FastAPI running'}