import mimetypes
import os
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from app.dependencies import get_token_header
from app.config import settings
from app.embedding.extractor import extract_chunks
from nomic import embed
import uuid
import logging
from app.database import supabase, db

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/embedding",
    tags=["embedding"],
    dependencies=[Depends(get_token_header)],
)

# ---------- request schema -------------------------------------------------
class EmbedFileJob(BaseModel):
    project_id: str
    bucket: str
    key: str
    fileType: str       

@router.post("/embed-file")
async def embed_uploaded_file(job: EmbedFileJob):
    """
    1. Download the object from Supabase Storage.
    2. Temp-file it for libraries that need a path.
    3. extract_text ➜ embed ➜ return vector (or store in DB here).
    """

    # 1 ── download bytes from Storage
    try:
        file_bytes = supabase.storage.from_(job.bucket).download(job.key)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to download file from storage: {str(e)}")
    
    # 2 ── write to tmp file
    suffix = mimetypes.guess_extension(job.fileType) or ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # 3 ── extract → embed
        
        chunks = extract_chunks(tmp_path, job.fileType) 
        
        # Process chunks and store in database
        for chunk in chunks:
            # Get embedding
            embedding_result = embed.text(
                texts=[chunk],
                model="nomic-embed-text-v1.5",
                task_type="search_document",
            )
            
            # Extract the embedding vector
            vec = embedding_result["embeddings"][0]
            
            # Generate UUID using Python's uuid module
            chunk_id = str(uuid.uuid4())
            
            # Store in database
            await db.document_chunk.create({
                "id": chunk_id,
                "projectId": job.project_id,
                "documentId": job.key,
                "content": chunk,
                "embedding": vec,  # Make sure this matches your database schema
            })
        
        await db.disconnect()

        # Return the last embedding vector (or modify as needed)
        return jsonable_encoder({"status": "success", "chunks_processed": len(chunks)})

    except ValueError as ve:                 # unsupported extension
        await db.disconnect()
        raise HTTPException(400, detail=str(ve))

    except Exception as e:
        await db.disconnect()
        raise HTTPException(500, detail=f"Processing error: {str(e)}")

    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass

class EmbedTaskJob(BaseModel):
    project_id: str
    task_id: str

task_chunk = """
    This task is called {task_title} and has the following description: {task_description} and should be done by {task_due_date}. This is the status of the task: {task_status}
"""

@router.post("/embed-task")
async def embed_task(job: EmbedTaskJob):
    task = await db.task.find_first_or_raise(
        where={ 'id': job.task_id, 'projectId': job.project_id },
    )
    task_content = task_chunk.format(task_title=task.title, task_description=task.description, task_due_date=task.due_date, task_completed=task.completed)
    vec = embed.text(
        texts=[task_content],
        model="nomic-embed-text-v1.5",
        task_type="search_document",
    )["embeddings"][0]
    try:
        await db.task.update(
            where={ 'id': job.task_id },
            data={ 'embedding': vec,
                   'content': task_content }
        )
    except Exception as e:
        raise HTTPException(500, detail=str(e))