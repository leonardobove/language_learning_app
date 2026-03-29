from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CreateUserRequest(BaseModel):
    name: str
    avatar_color: Optional[str] = "#f5a623"


class UserProfile(BaseModel):
    id: int
    name: str
    avatar_color: str
    created_at: str


class UserWithMemory(BaseModel):
    id: int
    name: str
    avatar_color: str
    created_at: str
    memory: List[dict] = []


class StartSessionRequest(BaseModel):
    user_id: int
    language: str
    level: Optional[str] = "beginner"


class Session(BaseModel):
    id: int
    user_id: int
    language: str
    level: str
    started_at: str
    ended_at: Optional[str] = None


class Message(BaseModel):
    id: int
    session_id: int
    role: str  # "user" or "assistant"
    content: str
    created_at: str


class ChatRequest(BaseModel):
    session_id: int
    message: str
    user_id: int
    language: str


class TTSRequest(BaseModel):
    text: str
    language: str


class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    available_models: List[str] = []
