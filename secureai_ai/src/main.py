import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before reading config values.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from src.config import HOST, PORT
from src.loader import ModelStore
from src.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("SecureAI ML API starting...")
    try:
        ModelStore.load()
        print("Model ready - API can receive requests")
    except FileNotFoundError as exc:
        print(f"Model file missing: {exc}")
        print("API will start, but /predict returns 503 until model files exist")
    yield
    print("SecureAI ML API shutting down...")


app = FastAPI(
    title="SecureAI ML API",
    description="BiLSTM + Self-Attention phishing URL detection",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "SecureAI ML API",
        "docs": "/docs",
        "health": "/health",
        "predict": "POST /predict",
    }


if __name__ == "__main__":
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=False)