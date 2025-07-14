import json
import asyncio
from app.tools.documents import retrieve_docs
from app.tools.tasks import retrieve_tasks
from app.tools.messages import retrieve_messages

# AVAILABLE_FUNCTIONS = {
#     "retrieve_docs": retrieve_docs,
#     "retrieve_tasks": retrieve_tasks,
#     "retrieve_messages": retrieve_messages,
# }

AVAILABLE_FUNCTIONS = {}
TOOLS = []

# # Unified tool definitions
# TOOLS = [
#     {
#         'type': 'function',
#         'function': {
#             'name': 'retrieve_docs',
#             'description': 'Retrieve documents stored in the file system contain project paper work models and financial statements',
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "query": {
#                         "type": "string",
#                         "description": "The query to search for documents"
#                     },
#                     "project_id": {
#                         "type": "string",
#                         "description": "The project id"
#                     },
#                     "limit": {
#                         "type": "integer",
#                         "description": "The number of documents to retrieve"
#                     }

#                 },
#                 "required": ["query", "project_id"]
#                 },
#             },
#         },
#     {
#         'type': 'function',
#         'function': {
#             'name': 'retrieve_messages',
#             'description': 'Get the relavate previous messages for this conversation',
#             'parameters': {
#                 'type': 'object',
#                 'properties': {
#                     'query': {
#                         'type': 'string',
#                         'description': 'The query to search for messages'
#                     },
#                     'project_id': {
#                         'type': 'string',
#                         'description': 'The project id'
#                     },
#                     'conversationId': {
#                         'type': 'string',
#                         'description': 'The conversation id'
#                     },
#                     'limit': {
#                         'type': 'integer',
#                         'description': 'The number of messages to retrieve'
#                     }
#                 },
#                 'required': ['query', 'project_id', 'conversationId']
#             },
#         },
#     },
#     {
#         'type': 'function',
#         'function': {
#             'name': 'retrieve_tasks',
#             'description': 'Get the relevant tasks for this project',
#             'parameters': {
#                 'type': 'object',
#                 'properties': {
#                     'query': {
#                         'type': 'string',
#                         'description': 'The query to search for tasks'
#                     },
#                     'project_id': {
#                         'type': 'string',
#                         'description': 'The project id'
#                     },
#                     'limit': {
#                         'type': 'integer',
#                         'description': 'The number of tasks to retrieve'
#                     }
#                 },
#                 'required': ['query', 'project_id']
#             },
#         },
#     },
# ]

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