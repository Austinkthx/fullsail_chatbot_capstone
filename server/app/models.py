"""Pydantic request/response schemas"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Chat
class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model_id: Optional[str] = "llama3.2"


class ConversationResponse(BaseModel):
    id: str
    title: str
    model_id: str
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    content: str
    model_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str  # "user" or "assistant"
    content: str
    model_id: Optional[str] = None
    created_at: datetime
