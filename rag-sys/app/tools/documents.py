from nomic import embed
from app.database import get_prisma

async def retrieve_docs(query: str, project_id: str, limit: int = 5):
    vec = embed.text(texts=[query], model='nomic-embed-text-v1.5', task_type='search_query')
    emb = vec['embeddings'][0]
    db = await get_prisma()
    rows = await db.query_raw(
        '''
        SELECT "content" FROM "DocumentChunks"
        WHERE "projectId" = $1
        ORDER BY "embedding" <-> CAST($2 AS vector) ASC
        LIMIT $3
        ''', project_id, str(emb), limit
    )
    return [r['content'] for r in rows]


