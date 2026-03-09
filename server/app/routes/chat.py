"""Chat & message endpoints with SSE streaming"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime, timezone
from app.models import ConversationCreate, MessageCreate
from app.auth_utils import get_current_user
from app.services.llm_service import LLMService

router = APIRouter()


# ─── Conversations ────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(request: Request, current_user=Depends(get_current_user)):
    db = request.app.db
    cursor = db.conversations.find({"user_id": current_user["id"]}).sort("updated_at", -1)
    conversations = []
    async for conv in cursor:
        conversations.append({
            "id": str(conv["_id"]),
            "title": conv["title"],
            "model_id": conv.get("model_id", "llama3.2"),
            "created_at": conv["created_at"].isoformat(),
            "updated_at": conv["updated_at"].isoformat(),
        })
    return conversations


@router.post("/conversations")
async def create_conversation(
    request: Request,
    data: ConversationCreate,
    current_user=Depends(get_current_user),
):
    db = request.app.db
    now = datetime.now(timezone.utc)
    conv_doc = {
        "user_id": current_user["id"],
        "title": data.title,
        "model_id": data.model_id,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.conversations.insert_one(conv_doc)
    conv_doc["id"] = str(result.inserted_id)
    conv_doc["created_at"] = now.isoformat()
    conv_doc["updated_at"] = now.isoformat()
    del conv_doc["_id"]
    return conv_doc


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    db = request.app.db
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user["id"],
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.messages.delete_many({"conversation_id": conversation_id})
    await db.conversations.delete_one({"_id": ObjectId(conversation_id)})
    return {"message": "Conversation deleted"}


# ─── Messages ─────────────────────────────────────────────────

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    db = request.app.db

    # Verify ownership
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user["id"],
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor = db.messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    messages = []
    async for msg in cursor:
        messages.append({
            "id": str(msg["_id"]),
            "conversation_id": msg["conversation_id"],
            "role": msg["role"],
            "content": msg["content"],
            "model_id": msg.get("model_id"),
            "created_at": msg["created_at"].isoformat(),
        })
    return messages


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    request: Request,
    current_user=Depends(get_current_user),
):
    db = request.app.db

    # Verify ownership
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user["id"],
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    model_id = data.model_id or conv.get("model_id", "llama3.2")
    now = datetime.now(timezone.utc)

    # Save user message
    user_msg = {
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.content,
        "model_id": model_id,
        "created_at": now,
    }
    await db.messages.insert_one(user_msg)

    # Auto-title: use first message as title
    msg_count = await db.messages.count_documents({"conversation_id": conversation_id})
    if msg_count == 1:
        title = data.content[:60] + ("..." if len(data.content) > 60 else "")
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"title": title}},
        )

    # Update conversation model and timestamp
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"model_id": model_id, "updated_at": now}},
    )

    # Build message history for context
    history = []
    cursor = db.messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    async for msg in cursor:
        history.append({"role": msg["role"], "content": msg["content"]})

    # Stream response via SSE
    async def event_stream():
        llm = LLMService()
        full_response = ""
        async for chunk in llm.stream_chat(model_id, history):
            full_response += chunk
            yield f"data: {chunk}\n\n"

        # Save assistant message when done
        assistant_msg = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": full_response,
            "model_id": model_id,
            "created_at": datetime.now(timezone.utc),
        }
        await db.messages.insert_one(assistant_msg)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
