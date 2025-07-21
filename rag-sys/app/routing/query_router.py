from __future__ import annotations
import asyncio, json, os
from typing import Dict, List

from groq import Groq

from app.tools.documents import retrieve_docs
from app.tools.tasks import retrieve_tasks
from app.tools.messages import retrieve_messages
from app.routing.groq_client import groq_client
import re

ROUTING_MODEL = "llama-3.1-8b-instant"
TOOL_MODEL = "llama-3.3-70b-versatile"

GATE_PROMPT = """You are deciding whether to include the '{src}' source when answering a user’s query about a real-estate project’s current status, required actions, or stored documentation.

Sources:

1. docs – all project documents organized by category. Always prioritize these when the user’s question is about:
   • Legal: PSA, Deeds, Title Reports, Title Insurance, CC&Rs, Leases, Estoppels, etc.  
   • Financial: Rent Rolls, P&Ls, Balance Sheets, Appraisals, Cash Flow, CapEx schedules, etc.  
   • Operational: Maintenance logs, Vendor contracts, Inspection reports, Utility records, etc.  
   • Leasing: LOIs, Lease Agreements, Amendments, TI Agreements, SNDA, Assignments, etc.  
   • Development: Architectural plans, Surveys, Permits, Soil reports, Change orders, COs, etc.  
   • Property Management: Management Agreements, CAM reconciliations, Insurance policies, etc.  
   • Lending & Finance: Loan commitments, Mortgage docs, UCC-1s, Escrow instructions, etc.  
   • Tax & Compliance: Tax returns, Permits, Environmental assessments, Compliance reports, etc.

2. tasks – actions already completed or still pending within the project. Use these when the user asks “what needs to be done,” “what’s next,” or status of individual work items.

3. messages – previous user-assistant exchanges about this project. Use sparingly, only to maintain conversational context when the user’s question refers back to something discussed earlier.

Decision rule:  
- If the user’s question is about any aspect of the project’s **documents**, always include **docs**.  
- If it’s about **next steps** or **task status**, include **tasks**.  
- Only bring in **messages** when the user explicitly refers to earlier conversation details.  
- Do not include any source that doesn’t directly help answer the user’s question. 

User's question:
"{query}"

Respond strictly with JSON: {{"include": "yes"}} or {{ "include": "no" }}."""


async def gate(src: str, query: str) -> bool:
    print(f"[DEBUG] → gate(): checking source '{src}'")

    try:
        formatted = GATE_PROMPT.format(src=src, query=query)
        print(f"[DEBUG]    formatted prompt:\n{formatted!r}\n")
    except KeyError as ke:
        print(f"[ERROR]   KeyError during prompt formatting: missing key {ke!r}")
        # Fallback: use a minimal prompt without formatting
        formatted = f"Include source '{src}' for question: '{query}'? Respond yes or no."
        print(f"[DEBUG]    fallback prompt:\n{formatted!r}\n")
    
    print(f"[DEBUG] → gate(): calling LLM...")
    # Call to LLM


    try:
        response = groq_client.chat.completions.create(
            model=ROUTING_MODEL,
            messages=[
                {"role": "user", "content": formatted},
            ],
        )
    except Exception as e:
        print(f"[ERROR]   Exception when calling Groq: {e!r}")
    print(f"[DEBUG] ← gate(): LLM response: {response}")
    raw = response.choices[0].message.content.strip()
    print(f"[DEBUG]    raw response: {raw!r}")

    # Strip wrapping quotes/backticks
    if (raw.startswith('"') and raw.endswith('"')) or (raw.startswith('`') and raw.endswith('`')):
        stripped = raw[1:-1].strip()
        print(f"[DEBUG]    stripped quotes/backticks → {stripped!r}")
    else:
        stripped = raw
        print(f"[DEBUG]    no wrapping quotes/backticks → {stripped!r}")

    include = False
    try:
        data = json.loads(stripped)
        print(f"[DEBUG]    parsed JSON: {data}")
        include = str(data.get("include", "")).lower() == "yes"
        print(f"[DEBUG]    include flag from JSON: {include}")
    except json.JSONDecodeError as jde:
        print(f"[DEBUG]    JSONDecodeError: {jde}")
        # fallback regex check
        if re.search(r'"?include"?\s*:\s*"?yes"?', stripped, re.IGNORECASE):
            include = True
            print(f"[DEBUG]    regex fallback matched 'yes' → include = {include}")
        else:
            print(f"[DEBUG]    regex fallback did not match → include = {include}")
    except Exception as e:
        print(f"[DEBUG]    Unexpected error parsing include flag: {e}")
        include = False

    print(f"[DEBUG] ← gate() for '{src}': include={include}")
    return include

async def routed_rag_context(
    query: str,
    embedding: List[float],
    project_id: str,
    conversation_id: str,
) -> str:
    print(f"[DEBUG] → routed_rag_context() start")
    print(f"         query='{query[:50]}'...")
    print(f"         embedding[0:5]={embedding[:5]}..., len={len(embedding)}")
    print(f"         project_id={project_id}, conversation_id={conversation_id}")

    # — B. run gates in parallel -----------------------------------------
    sources = ["docs", "tasks", "messages"]
    print(f"[DEBUG] → Launching gates for sources: {sources}")
    gate_flags = await asyncio.gather(*(gate(s, query) for s in sources))
    print(f"[DEBUG] ← gate_flags: {dict(zip(sources, gate_flags))}")

    to_query = [s for s, ok in zip(sources, gate_flags) if ok]
    print(f"[DEBUG] → Sources selected for retrieval: {to_query}")

    # — C. retrieval fan-out ---------------------------------------------
    async def fetch(src: str):
        print(f"[DEBUG] → fetch(): retrieving from '{src}'")
        if src == "docs":
            docs = await retrieve_docs(embedding, project_id)
            print(f"[DEBUG] ← retrieve_docs: got {len(docs)} chunks")
            return docs
        if src == "tasks":
            tasks = await retrieve_tasks(embedding, project_id)
            print(f"[DEBUG] ← retrieve_tasks: got {len(tasks)} chunks")
            return tasks
        if src == "messages":
            msgs = await retrieve_messages(embedding, conversation_id)
            print(f"[DEBUG] ← retrieve_messages: got {len(msgs)} chunks")
            return msgs
        print(f"[DEBUG] ← fetch('{src}'): no handler, returning []")
        return []

    print(f"[DEBUG] → launching parallel fetch for selected sources")
    results_nested = await asyncio.gather(*(fetch(s) for s in to_query))
    print(f"[DEBUG] ← results_nested lengths: {[len(r) for r in results_nested]}")

    # — D. assemble context -----------------------------------------------
    context = ""
    for src, chunks in zip(to_query, results_nested):
        print(f"[DEBUG] → adding {len(chunks)} chunks from '{src}' to context")
        context += f"### {src}\n"
        for i, chunk in enumerate(chunks):
            snippet = chunk.replace("\n", " ")[:100]
            print(f"    chunk[{i}]: {snippet!r}...")
            context += f"{chunk}\n"

    print(f"[DEBUG] ← routed_rag_context() assembled context length={len(context)}")
    return context