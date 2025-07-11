from fastapi import Header, HTTPException, Depends
from typing import Annotated

async def get_token_header(x_token: Annotated[str, Header()]):
    if x_token != "secret-token":
        raise HTTPException(status_code=400, detail="Invalid X-Token header")

async def verify_user(token: str):
    if token != "user-token":
        raise HTTPException(status_code=401, detail="Unauthorized")