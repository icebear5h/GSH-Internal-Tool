from app.database import supabase

async def retrieve_docs(embedded_query: list[float], project_id: str, limit: int = 5):
    # in your FastAPI / anywhere you have supabase client
    res = supabase.rpc('retrieve_document_chunks', {
        'query_embedding': embedded_query,
        'match_threshold': 0.2,
        'match_count': limit,
        'project_id': project_id
    }).execute()
    return [r['content'] for r in res.data]


