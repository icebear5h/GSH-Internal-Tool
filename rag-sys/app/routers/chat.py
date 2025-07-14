from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from app.dependencies import get_token_header
from app.tools.tool_call_utils import get_tools
from app.routing.query_router import routed_rag_context
import json
from nomic import embed
from dotenv import load_dotenv
from app.routing.groq_client import groq_client
from app.prompts.agent_prompt import AGENT_PROMPT
from app.tools.tool_call_utils import call_tool, get_tools, AVAILABLE_FUNCTIONS
from app.tools.messages import update_messages

router = APIRouter(prefix='/chat', tags=['chatbot'], dependencies=[Depends(get_token_header)])
load_dotenv()
REASONING_MODEL="qwen/qwen3-32b"
TOOL_MODEL="llama-3.3-70b-versatile"

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
    try:
        embedding = embed.text(texts=[request.userMessage], model='nomic-embed-text-v1.5', task_type='search_query')['embeddings'][0]
        rag_context = await routed_rag_context(request.userMessage, embedding, request.projectId, request.conversationId)
        messages.extend([
            {
                "role": "user",
                "content": rag_context
            }
        ])
        response = groq_client.chat.completions.create(
            model=TOOL_MODEL,
            messages=messages,
            tools=get_tools(),
            tool_choice='auto'
        )
        tool_calls = response.choices[0].message.tool_calls
        messages.append(response.choices[0].message)
        tool_msgs = []
        if tool_calls:
            for tc in tool_calls:
                fn = AVAILABLE_FUNCTIONS[tc.function.name]
                result = fn(**json.loads(tc.function.arguments))
                tool_msgs.append({
            "role": "tool",
            "tool_call_id": tc.id,
            "content": str(result),
        })

        # 3. Feed the tool results back in *one* follow-up chat call
        messages.extend(tool_msgs)
        response_content = groq_client.chat.completions.create(model=REASONING_MODEL, messages=messages).choices[0].message.content

        await update_messages({'role': 'assistant', 'content': response_content}, request.conversationId)
        return jsonable_encoder(Message(role='assistant', content=response_content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))