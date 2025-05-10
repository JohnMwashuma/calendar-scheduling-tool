import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from api.endpoints import root
from core.database import engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    "http://localhost:3000",
    "https://calendar-scheduling-tool.fly.dev",
]

app.include_router(root.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve index.html for all non-API routes (for React Router)
@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    index_path = os.path.join("static", "index.html")
    return FileResponse(index_path)