 # routed_rag.py
from __future__ import annotations
import asyncio, json, os
from typing import Dict, List

from groq import Groq

from app.tools.documents import retrieve_docs
from app.tools.tasks import retrieve_tasks
from app.tools.messages import retrieve_messages

ROUTING_MODEL = "llama-3.1-8b-instant"
TOOL_MODEL = "llama-3.3-70b-versatile"
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------------------------------------------------------------------

GATE_PROMPT = (
    "Answer strictly JSON {{\"include\": \"yes\"|\"no\"}}. "
    "Would the source '{src}' help answer the user?\n\n"
    "### user vector\n{vector}\n"
)

async def gate(src: str, query: str) -> bool:
    response = client.chat.completions.create(
        model=ROUTING_MODEL,
        messages=[
            {"role": "user", "content": GATE_PROMPT.format(src=src, vector=query[:10])},
        ],
    )
    return response.choices[0].message.content == "yes"

# ---------------------------------------------------------------------------

async def routed_rag_context(
    query: str,
    embedding: List[float],
    project_id: str,
    conversation_id: str,
) -> List[Dict]:
    
    # — B. run gates in parallel -----------------------------------------
    sources = ["docs", "tasks", "messages", "web"]
    gate_flags = await asyncio.gather(*(gate(s, query) for s in sources))
    to_query = [s for s, ok in zip(sources, gate_flags) if ok]

    # — C. retrieval fan-out ---------------------------------------------
    async def fetch(src: str):
      if src == "docs":
        return await retrieve_docs(embedding, project_id)
      if src == "tasks":
        return await retrieve_tasks(embedding, project_id)
      if src == "messages":
        return await retrieve_messages(embedding, project_id, conversation_id)
      return []

    results_nested = await asyncio.gather(*(fetch(s) for s in to_query))
    # flatten & label
    context: List[Dict] = [
        {**chunk, "source": src}
        for src, chunks in zip(to_query, results_nested)
        for chunk in chunks
    ]
    return context
