from app.database import get_prisma

async def get_messages(user_id: str, conversation_id: str):
    db = await get_prisma()
    conv = await db.conversation.find_first_or_raise(
        where={ 'id': conversation_id, 'userId': user_id },
        include={ 'messages': True }
    )
    return [{'role': m.role, 'content': m.content} for m in conv.messages]

async def update_messages(new_msg: dict, conversation_id: str):
    db = await get_prisma()
    return await db.conversation.update(
        where={ 'id': conversation_id },
        data={ 'messages': { 'create': new_msg }}
    )

async def retrieve_messages(emb: str, project_id: str, limit: int = 5):
    db = await get_prisma()
    rows = await db.query_raw(
        '''
        SELECT "content" FROM "messages"
        WHERE "projectId" = $1
        ORDER BY "embedding" <-> CAST($2 AS vector) ASC
        LIMIT $3
        ''', project_id, str(emb), limit
    )
    return [r['content'] for r in rows]
