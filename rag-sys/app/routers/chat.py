from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from app.dependencies import get_token_header
from app.tools.tool_call_utils import get_tools
import json

router = APIRouter(prefix='/chatbot', tags=['chatbot'], dependencies=[Depends(get_token_header)])

REASONING_MODEL="qwen/qwen3-32b"
TOOL_MODEL="llama-3.3-70b-versatile"

class ChatRequest(BaseModel):
    conversationId: str
    userId: str
    userMessage: str

class Message(BaseModel):
    role: str
    content: str

@router.post('/chat', response_model=Message)
async def chat(request: ChatRequest):
    try:
        embedding = embed.text(texts=[request.userMessage], model='nomic-embed-text-v1.5', task_type='search_query')['embeddings'][0]
        rag_context = routed_rag_context(embedding, request.conversationId)
        response = client.chat.completions.create(
            model=TOOL_MODEL,
            messages=prompt + rag_context,
            tools=get_tools(),
            tool_choice='auto'
        )
        tool_calls = response.choices[0].message.tool_calls
        tool_msgs  = []
        for tc in tool_calls:
            fn     = available_functions[tc.function.name]   # your local tool map
            result = fn(**json.loads(tc.function.arguments))
            tool_msgs.append({
                "role":         "tool",
                "tool_call_id": tc.id,
                "content":      str(result),
            })

        # 3. Feed the tool results back in *one* follow-up chat call
        messages.extend([response.choices[0].message, *tool_msgs])
        response_content = client.chat.completions.create(model=REASONING_MODEL, messages=messages).choices[0].message.content

        await update_messages({'role': 'assistant', 'content': response_content}, request.conversationId)
        return jsonable_encoder(Message(role='assistant', content=response_content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))