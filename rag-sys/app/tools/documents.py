from app.database import supabase

async def retrieve_docs(embedded_query: str, project_id: str, limit: int = 5):
    data = supabase.rpc('match_documents', {
        'query_embedding': embedded_query,
        'match_threshold': 0.7,
        'match_count': limit,
        'project_id': project_id
    }).execute()
    return [r['content'] for r in data]


