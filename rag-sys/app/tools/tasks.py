from nomic import embed
from app.database import get_prisma

async def retrieve_tasks(emb: str, project_id: str, limit: int = 5):
    db = await get_prisma()
    rows = await db.query_raw(
        '''
        SELECT "content" FROM "tasks"
        WHERE "projectId" = $1
        ORDER BY "embedding" <-> CAST($2 AS vector) ASC
        LIMIT $3
        ''', project_id, str(emb), limit
    )
    return [r['content'] for r in rows]

