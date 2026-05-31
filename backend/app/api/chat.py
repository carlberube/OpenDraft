from fastapi import APIRouter, HTTPException

from app.schemas.chat import (
    ChatAppendMessageRequest,
    ChatCheckpointCreateRequest,
    ChatCheckpointInfo,
    ChatConversationResponse,
    ChatMessage,
)
from app.services import chat_service

router = APIRouter()


@router.get(
    "/{project_id}/scripts/{script_id}/chat", response_model=ChatConversationResponse
)
async def get_chat_conversation(project_id: str, script_id: str):
    try:
        return chat_service.get_conversation(project_id, script_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/{project_id}/scripts/{script_id}/chat/messages", response_model=ChatMessage
)
async def append_chat_message(
    project_id: str, script_id: str, body: ChatAppendMessageRequest
):
    try:
        return chat_service.append_message(
            project_id=project_id,
            script_id=script_id,
            role=body.role,
            content=body.content,
            context=body.context,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/{project_id}/scripts/{script_id}/chat/checkpoints",
    response_model=list[ChatCheckpointInfo],
)
async def get_chat_checkpoints(project_id: str, script_id: str):
    try:
        return chat_service.list_checkpoints(project_id, script_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/{project_id}/scripts/{script_id}/chat/checkpoints",
    response_model=ChatCheckpointInfo,
)
async def create_chat_checkpoint(
    project_id: str,
    script_id: str,
    body: ChatCheckpointCreateRequest,
):
    try:
        return chat_service.create_checkpoint(
            project_id=project_id,
            script_id=script_id,
            label=body.label,
            commit_hash=body.commit_hash,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/{project_id}/scripts/{script_id}/chat/checkpoints/{checkpoint_id}/restore",
    response_model=ChatConversationResponse,
)
async def restore_chat_checkpoint(project_id: str, script_id: str, checkpoint_id: str):
    try:
        return chat_service.restore_checkpoint(project_id, script_id, checkpoint_id)
    except FileNotFoundError as exc:
        message = str(exc)
        if message.startswith("Checkpoint"):
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=404, detail=message)
