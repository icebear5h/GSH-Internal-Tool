from fastapi import Header, HTTPException, Depends, Query
from typing import Annotated

# async def get_token_header(x_token: Annotated[str, Header()]):
#     if x_token != "secret-token":
#         raise HTTPException(status_code=400, detail="Invalid X-Token header")

# async def verify_user(token: str):
#     if token != "user-token":
#         raise HTTPException(status_code=401, detail="Unauthorized")


DEV_TOKEN = "dev-token"          # put this in .env later
USER_TOKEN = "user-token"        # likewise

async def get_token_header(
    x_token: Annotated[str, Header(alias="X-Token")]
):
    if x_token != DEV_TOKEN:
        raise HTTPException(status_code=400, detail="Invalid X-Token header")

async def verify_user(token: str = Query(...)):
    if token != USER_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

        # app/dependencies.py

