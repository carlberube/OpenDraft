from typing import Literal

from pydantic import BaseModel


class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: str
    context: dict | None = None


class ChatCheckpointInfo(BaseModel):
    id: str
    created_at: str
    message_count: int
    label: str | None = None
    commit_hash: str | None = None


class ChatConversationResponse(BaseModel):
    conversation_id: str
    project_id: str
    script_id: str
    created_at: str
    updated_at: str
    messages: list[ChatMessage]
    checkpoints: list[ChatCheckpointInfo]


class ChatAppendMessageRequest(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    context: dict | None = None


class ChatCheckpointCreateRequest(BaseModel):
    label: str | None = None
    commit_hash: str | None = None
