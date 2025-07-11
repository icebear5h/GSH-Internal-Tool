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
from extractor import extract_chunks
from nomic import embed

from supabase import create_client  # ← server-side Supabase client
from app.database import get_prisma, close_prisma

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
    sb = create_client(settings.supabase_url, settings.supabase_service_role)
    dl = sb.storage.from_(job.bucket).download(job.key)
    if dl.error:
        raise HTTPException(404, detail=f"Storage download failed: {dl.error.message}")
    data: bytes = dl.data

    # 2 ── write to tmp file
    suffix = mimetypes.guess_extension(job.fileType) or ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        # 3 ── extract → embed
        db = await get_prisma()
        chunks = extract_chunks(tmp_path, job.fileType) 
        for chunk in chunks:
            vec = embed.text(
                texts=[chunk],
                model="nomic-embed-text-v1.5",
                task_type="search_document",
            )["embeddings"][0]
            
            await db.document_chunk.create({
                "id": crypto.randomUUID(),
                "projectId": job.project_id,
                "documentId": job.key,
                "content": chunk,
                "embedding": vec,
            })
        await close_prisma()

        return jsonable_encoder(vec)

    except ValueError as ve:                 # unsupported extension
        raise HTTPException(400, detail=str(ve))

    except Exception as e:
        raise HTTPException(500, detail=str(e))

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
    db = await get_prisma()
    task = await db.task.find_first_or_raise(
        where={ 'id': job.task_id, 'projectId': job.project_id },
    )
    vec = embed.text(
        texts=[task_chunk.format(task_title=task.title, task_description=task.description, task_due_date=task.due_date, task_completed=task.completed)],
        model="nomic-embed-text-v1.5",
        task_type="search_document",
    )["embeddings"][0]
    try:
        await db.task.update(
            where={ 'id': job.task_id },
            data={ 'embedding': vec }
        )
    except Exception as e:
        raise HTTPException(500, detail=str(e))
    await close_prisma()