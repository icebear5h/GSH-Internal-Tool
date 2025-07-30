import mimetypes
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from app.dependencies import get_token_header
from app.config import settings
from app.embedding.extractor import extract_chunks
import nomic
import uuid
import logging
from app.database import supabase, db
import os
from nomic import embed

logger = logging.getLogger(__name__)

nomic.login(os.getenv("NOMIC_API_KEY"))

router = APIRouter(
    prefix="/embedding",
    tags=["embedding"],
    dependencies=[Depends(get_token_header)],
)

# ---------- request schema -------------------------------------------------
class EmbedFileJob(BaseModel):
    project_id: str
    document_id: str
    bucket: str
    key: str
    fileType: str       

@router.post("/embed-file")
async def embed_uploaded_file(job: EmbedFileJob):
    print(f"[DEBUG] embed_uploaded_file called with: bucket={job.bucket}, key={job.key}, fileType={job.fileType}")

    # 1 ── download bytes from Storage
    try:
        file_bytes = supabase.storage.from_(job.bucket).download(job.key)
        print(f"[DEBUG] downloaded {len(file_bytes)} bytes")
    except Exception as e:
        print(f"[ERROR] download failed: {e}")
        raise HTTPException(500, detail=f"Failed to download file from storage: {e}")

    # 2 ── write to tmp file
    suffix = mimetypes.guess_extension(job.fileType) or ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        print(f"[DEBUG] wrote file to temp path: {tmp_path}")
    except Exception as e:
        print(f"[ERROR] writing temp file failed: {e}")
        raise HTTPException(500, detail=f"Failed to write temp file: {e}")

    # 3 ── extract → embed → store
    try:
        print(f"[DEBUG] extracting chunks from {tmp_path}")
        chunks = extract_chunks(tmp_path)
        print(f"[DEBUG] extracted {len(chunks)} chunks")

        for i, chunk in enumerate(chunks, start=1):
            print(f"[DEBUG] chunk {i}/{len(chunks)} preview: {chunk[:60]!r}...")
            embedding_result = embed.text(
                texts=[chunk],
                model="nomic-embed-text-v1.5",
                task_type="search_document",
            )
            print(f"[DEBUG] embedding_result keys: {list(embedding_result.keys())}")

            vec = embedding_result["embeddings"][0]
            print(f"[DEBUG] vector length: {len(vec)}")

            chunk_id = str(uuid.uuid4())
            print(f"[DEBUG] storing chunk with id {chunk_id}")

            #print("[DEBUG] available db models:",
            #      [attr for attr in dir(db) if not attr.startswith("_")])
            await db.execute_raw(
                '''
                INSERT INTO "DocumentChunk"
                  (id, "projectId", "documentId", content, embedding)
                VALUES
                  ($1, $2, $3, $4, $5::vector)
                ''',
                chunk_id,
                job.project_id,
                job.document_id,
                chunk,
                vec,
            )
            print(f"[DEBUG] chunk {i} stored")

        return jsonable_encoder({
            "status": "success",
            "chunks_processed": len(chunks),
        })

    except Exception as e:
        print(f"[ERROR] processing or DB storage failed: {e}")
        raise HTTPException(500, detail=f"Failed during processing or database storage: {e}")

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