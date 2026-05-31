import copy
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_projects_dir


def _scripts_dir(project_id: str) -> Path:
    scripts_path = get_projects_dir() / project_id / "scripts"
    if not scripts_path.exists():
        raise FileNotFoundError(f"Project '{project_id}' not found")
    return scripts_path


def _meta_file(project_id: str, script_id: str) -> Path:
    return _scripts_dir(project_id) / f"{script_id}.meta.json"


def _chat_file(project_id: str, script_id: str) -> Path:
    return _scripts_dir(project_id) / f"{script_id}.chat.json"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _checkpoint_summary(checkpoint: dict) -> dict:
    return {
        "id": checkpoint["id"],
        "created_at": checkpoint["created_at"],
        "message_count": checkpoint["message_count"],
        "label": checkpoint.get("label"),
        "commit_hash": checkpoint.get("commit_hash"),
    }


def _summarize(conversation: dict) -> dict:
    return {
        "conversation_id": conversation["conversation_id"],
        "project_id": conversation["project_id"],
        "script_id": conversation["script_id"],
        "created_at": conversation["created_at"],
        "updated_at": conversation["updated_at"],
        "messages": conversation["messages"],
        "checkpoints": [_checkpoint_summary(cp) for cp in conversation["checkpoints"]],
    }


def _empty_conversation(project_id: str, script_id: str) -> dict:
    ts = _now()
    return {
        "conversation_id": str(uuid.uuid4()),
        "project_id": project_id,
        "script_id": script_id,
        "created_at": ts,
        "updated_at": ts,
        "messages": [],
        "checkpoints": [],
    }


def _validate_script_exists(project_id: str, script_id: str) -> None:
    if not _meta_file(project_id, script_id).exists():
        raise FileNotFoundError(f"Script '{script_id}' not found")


def _load_or_create(project_id: str, script_id: str) -> dict:
    _validate_script_exists(project_id, script_id)
    path = _chat_file(project_id, script_id)
    if not path.exists():
        return _empty_conversation(project_id, script_id)
    data = json.loads(path.read_text(encoding="utf-8"))

    if data.get("project_id") != project_id or data.get("script_id") != script_id:
        # Defensive reset if the file has incompatible data.
        return _empty_conversation(project_id, script_id)

    data.setdefault("conversation_id", str(uuid.uuid4()))
    data.setdefault("created_at", _now())
    data.setdefault("updated_at", data["created_at"])
    data.setdefault("messages", [])
    data.setdefault("checkpoints", [])
    return data


def _save(project_id: str, script_id: str, conversation: dict) -> None:
    path = _chat_file(project_id, script_id)
    path.write_text(json.dumps(conversation, indent=2), encoding="utf-8")


def get_conversation(project_id: str, script_id: str) -> dict:
    conversation = _load_or_create(project_id, script_id)
    # Persist lazily-initialized defaults.
    _save(project_id, script_id, conversation)
    return _summarize(conversation)


def append_message(
    project_id: str,
    script_id: str,
    role: str,
    content: str,
    context: dict | None = None,
) -> dict:
    if not content or not content.strip():
        raise ValueError("Message content is required")

    conversation = _load_or_create(project_id, script_id)
    message = {
        "id": str(uuid.uuid4()),
        "role": role,
        "content": content,
        "created_at": _now(),
        "context": context,
    }
    conversation["messages"].append(message)
    conversation["updated_at"] = _now()
    _save(project_id, script_id, conversation)
    return message


def list_checkpoints(project_id: str, script_id: str) -> list[dict]:
    conversation = _load_or_create(project_id, script_id)
    _save(project_id, script_id, conversation)
    return [_checkpoint_summary(cp) for cp in conversation["checkpoints"]]


def create_checkpoint(
    project_id: str,
    script_id: str,
    label: str | None = None,
    commit_hash: str | None = None,
) -> dict:
    conversation = _load_or_create(project_id, script_id)
    checkpoint = {
        "id": str(uuid.uuid4()),
        "created_at": _now(),
        "message_count": len(conversation["messages"]),
        "label": label,
        "commit_hash": commit_hash,
        "messages_snapshot": copy.deepcopy(conversation["messages"]),
    }
    conversation["checkpoints"].append(checkpoint)
    conversation["updated_at"] = _now()
    _save(project_id, script_id, conversation)
    return _checkpoint_summary(checkpoint)


def restore_checkpoint(project_id: str, script_id: str, checkpoint_id: str) -> dict:
    conversation = _load_or_create(project_id, script_id)
    checkpoint = next(
        (cp for cp in conversation["checkpoints"] if cp["id"] == checkpoint_id), None
    )
    if checkpoint is None:
        raise FileNotFoundError(f"Checkpoint '{checkpoint_id}' not found")

    snapshot = checkpoint.get("messages_snapshot", [])
    conversation["messages"] = copy.deepcopy(snapshot)
    conversation["updated_at"] = _now()
    _save(project_id, script_id, conversation)
    return _summarize(conversation)
