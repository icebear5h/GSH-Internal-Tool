import json
import asyncio
from app.tools.documents import retrieve_docs
from app.tools.tasks import retrieve_tasks
from app.tools.messages import retrieve_messages
# Unified tool definitions
TOOLS = [
    {
        'type': 'function',
        'function': {
            'name': 'retrieve_docs',
            'description': 'Retrieve documents stored in the file system contain project paper work models and financial statements',
            'parameters': {
                'type': 'object',
                'properties': {'expression': {'type': 'string'}},
                'required': ['expression'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_messages',
            'description': 'Get the relavate previous messages for this conversation',
            'parameters': {
                'type': 'object',
                'properties': {'location': {'type': 'string'}},
                'required': ['location'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_tasks',
            'description': 'Get the relevant tasks for this project',
            'parameters': {
                'type': 'object',
                'properties': {'location': {'type': 'string'}},
                'required': ['location'],
            },
        },
    },
]

async def call_tool(tool_call):
    fn = available_functions[tool_call.function.name]
    args = json.loads(tool_call.function.arguments)
    loop = asyncio.get_running_loop()
    # run sync function in thread; replace with HTTP call if it’s an async API
    result = await loop.run_in_executor(None, fn, **args)
    return {
        "role": "tool",
        "content": str(result),
        "tool_call_id": tool_call.id,
    }

def get_tools():
    return TOOLS