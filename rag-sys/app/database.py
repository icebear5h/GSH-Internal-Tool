from prisma import Prisma
from .config import settings

_prisma = Prisma()

async def get_prisma():
    if not _prisma._client:
        await _prisma.connect()
    return _prisma

async def close_prisma():
    await _prisma.disconnect()