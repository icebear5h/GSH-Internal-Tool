from app.database import supabase, db



async def get_messages(user_id: str, conversation_id: str):
    try:
        conv = await db.conversation.find_first_or_raise(
            where={ 'id': conversation_id, 'userId': user_id },
            include={ 'messages': True }
        )
        return [{'role': m.role, 'content': m.content} for m in conv.messages]
    except Exception as e:
        raise HTTPException(500, detail=str(e))



async def update_messages(new_msg: dict, conversation_id: str):
    try:
        # wrap your single message in a list:
        return await db.conversation.update(
            where={ 'id': conversation_id },
            data={
                'messages': {
                    'create': [ new_msg ]
                }
            }
        )
    except Exception as e:
        raise HTTPException(500, detail=str(e))

async def retrieve_messages(embedded_query: list[float], conversation_id: str, limit: int = 5):
    res = supabase.rpc('retrieve_messages', {
        'query_embedding': embedded_query,
        'match_threshold': 0.7,
        'match_count': limit,
        'conversation_id': conversation_id
    }).execute()
    return [r['content'] for r in res.data]
