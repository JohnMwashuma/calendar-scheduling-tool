from fastapi import FastAPI
from fastapi.middleware import Middleware
from api.endpoints import root, auth
from core.database import init_db
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from starlette.middleware.sessions import SessionMiddleware
from core.config import SECRET_KEY

middleware = [
    Middleware(SessionMiddleware, secret_key=SECRET_KEY)
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan, middleware=middleware)


origins = [
    "http://localhost:3000",
    "https://calendar-scheduling-tool.fly.dev",
]

app.include_router(root.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
