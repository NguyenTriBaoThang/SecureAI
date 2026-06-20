import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env trước tất cả
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv không bắt buộc, có thể set env thủ công

from src.config import HOST, PORT
from src.loader import ModelStore
from src.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup: load model ───────────────────────────────────────────────────
    print("🚀 SecureAI ML API đang khởi động...")
    try:
        ModelStore.load()
        print("✅ Model ready — API sẵn sàng nhận request")
    except FileNotFoundError as e:
        print(f"⚠️  {e}")
        print("   API sẽ khởi động nhưng /predict trả 503 cho đến khi có model files")
    yield
    # ── Shutdown ──────────────────────────────────────────────────────────────
    print("🛑 Shutting down...")


app = FastAPI(
    title       = "SecureAI ML API",
    description = "BiLSTM + Self-Attention phishing URL detection",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# CORS — cho phép .NET backend gọi vào
app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# Register routes
app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "SecureAI ML API",
        "docs":    "/docs",
        "health":  "/health",
        "predict": "POST /predict",
    }


if __name__ == "__main__":
    uvicorn.run("src.main:app", host=HOST, port=PORT, reload=False)