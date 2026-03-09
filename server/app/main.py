"""
NexusChat - Multi-LLM Chatbot API
Supports Ollama (local) and cloud APIs (OpenAI, Anthropic)
With user auth, chat history, and model switching
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.routes import auth, chat, llm


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB
    app.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.db = app.mongodb_client[settings.DB_NAME]

    # Create indexes
    await app.db.users.create_index("email", unique=True)
    await app.db.conversations.create_index("user_id")
    await app.db.messages.create_index("conversation_id")

    print(f"Connected to MongoDB: {settings.DB_NAME}")
    yield

    # Shutdown
    app.mongodb_client.close()
    print("MongoDB connection closed")


app = FastAPI(title="NexusChat API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "NexusChat API is running"}
