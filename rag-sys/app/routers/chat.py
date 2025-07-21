from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from app.dependencies import get_token_header
from app.tools.tool_call_utils import get_tools, AVAILABLE_FUNCTIONS, call_tool
from app.routing.query_router import routed_rag_context
from app.routing.groq_client import groq_client
from app.prompts.agent_prompt import AGENT_PROMPT
from app.tools.messages import update_messages

import json
from nomic import embed
from dotenv import load_dotenv

router = APIRouter(
    prefix='/chat',
    tags=['chatbot'],
    dependencies=[Depends(get_token_header)]
)
load_dotenv()

REASONING_MODEL = "llama-3.3-70b-versatile"
TOOL_MODEL = "llama-3.3-70b-versatile"

messages = [
    {"role": "system", "content": AGENT_PROMPT}
]

class ChatRequest(BaseModel):
    conversationId: str
    projectId: str
    userMessage: str

class Message(BaseModel):
    role: str
    content: str

@router.post('/message', response_model=Message)
async def chat(request: ChatRequest):
    print(f"[DEBUG] → Received chat request: conversationId={request.conversationId}, projectId={request.projectId}")
    print(f"[DEBUG] → User message: {request.userMessage!r}")
    try:
        # 1. Embedding
        print("[DEBUG] → Calling embed.text()...")
        embed_resp = embed.text(
            texts=[request.userMessage],
            model='nomic-embed-text-v1.5',
            task_type='search_query'
        )
        print(f"[DEBUG] ← embed.text response keys: {list(embed_resp.keys())}")
        embedding = embed_resp['embeddings'][0]
        print(f"[DEBUG] ← Extracted embedding (first 5 dims): {embedding[:5]}... length={len(embedding)}")

        # 2. RAG context
        print("[DEBUG] → Fetching RAG context...")
        rag_context = await routed_rag_context(
            request.userMessage,
            embedding,
            request.projectId,
            request.conversationId
        )
        print(f"[DEBUG] ← RAG context (truncated to 200 chars): {rag_context[:200]!r}...")

        # 3. Send to tool‐enabled model
        messages.append({"role": "user", "content": "The following is the user request for this conversation: " + request.userMessage + "\n\n" + "The following is the context for this conversation: " + rag_context})
        print(f"[DEBUG] → Messages payload to TOOL_MODEL (len={len(messages)}):")
        for m in messages[-3:]:
            print("  ", m)

        print(f"[DEBUG] → Calling groq_client.chat.completions.create(model={TOOL_MODEL})")
        tool_resp = groq_client.chat.completions.create(
            model=TOOL_MODEL,
            messages=messages,
            tools=get_tools(),
            tool_choice='auto'
        )
        print(f"[DEBUG] ← Tool model raw response: {tool_resp}")
        tool_msg = tool_resp.choices[0].message
        tool_calls = tool_msg.tool_calls
        print(f"[DEBUG] ← tool_calls: {tool_calls}")

        messages.append(tool_msg)

        # 4. Execute each tool call
        tool_msgs = []
        if tool_calls:
            for tc in tool_calls:
                fn_name = tc.function.name
                args = json.loads(tc.function.arguments)
                print(f"[DEBUG] → Calling tool function '{fn_name}' with args: {args}")
                fn = AVAILABLE_FUNCTIONS[fn_name]
                result = fn(**args)
                print(f"[DEBUG] ← Result from '{fn_name}': {result!r}")
                tool_msgs.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": str(result),
                })

        messages.extend(tool_msgs)

        messages.append({
            "role": "user",
            "content": request.userMessage
        })
        # 5. Send to reasoning model
        print(f"[DEBUG] → Messages payload to REASONING_MODEL (len={len(messages)}):")
        for m in messages[-3:]:
            print("  ", m)
        print(f"[DEBUG] → Calling groq_client.chat.completions.create(model={REASONING_MODEL})")
        reasoning_resp = groq_client.chat.completions.create(
            model=REASONING_MODEL,
            messages=messages
        )
        response_content = reasoning_resp.choices[0].message.content
        print(f"[DEBUG] ← Reasoning model response content: {response_content!r}")

        # 6. Persist & return
        await update_messages(
            {'role': 'assistant', 'content': response_content},
            request.conversationId
        )
        return jsonable_encoder(Message(role='assistant', content=response_content))

    except Exception as e:
        print(f"[ERROR] ✗ Exception in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
