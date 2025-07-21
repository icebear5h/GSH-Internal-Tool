from app.database import supabase

async def retrieve_tasks(embedded_query: list[float], project_id: str, limit: int = 5):
    res = supabase.rpc('retrieve_tasks', {
        'query_embedding': embedded_query,
        'match_threshold': 0.7,
        'match_count': limit,
        'project_id': project_id,
    }).execute()
    return [r['content'] for r in res.data]