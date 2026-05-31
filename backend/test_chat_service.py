"""Tests for per-script chat history and checkpoint restore flows."""

import json
import os
import sys
from pathlib import Path

# Add backend root to import path
sys.path.insert(0, os.path.dirname(__file__))

from app.services import chat_service


def _seed_script(tmp_path: Path, project_id: str, script_id: str) -> None:
    scripts_dir = tmp_path / project_id / "scripts"
    scripts_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "id": script_id,
        "title": "Test Script",
        "author": "",
        "format": "json",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    (scripts_dir / f"{script_id}.meta.json").write_text(
        json.dumps(meta), encoding="utf-8"
    )
    (scripts_dir / f"{script_id}.json").write_text(
        json.dumps({"content": []}), encoding="utf-8"
    )


def test_chat_append_and_restore_checkpoint(tmp_path, monkeypatch):
    project_id = "proj-a"
    script_id = "script-a"
    _seed_script(tmp_path, project_id, script_id)

    monkeypatch.setattr(chat_service, "get_projects_dir", lambda: tmp_path)

    initial = chat_service.get_conversation(project_id, script_id)
    assert initial["project_id"] == project_id
    assert initial["script_id"] == script_id
    assert initial["messages"] == []

    m1 = chat_service.append_message(
        project_id, script_id, "user", "First prompt", {"selectedText": "HELLO"}
    )
    m2 = chat_service.append_message(
        project_id, script_id, "assistant", "First reply", None
    )

    assert m1["role"] == "user"
    assert m2["role"] == "assistant"

    checkpoint = chat_service.create_checkpoint(
        project_id,
        script_id,
        label="After first turn",
        commit_hash="abcdef123456",
    )
    assert checkpoint["label"] == "After first turn"
    assert checkpoint["commit_hash"] == "abcdef123456"
    assert checkpoint["message_count"] == 2

    chat_service.append_message(project_id, script_id, "user", "Second prompt", None)

    before_restore = chat_service.get_conversation(project_id, script_id)
    assert len(before_restore["messages"]) == 3

    restored = chat_service.restore_checkpoint(project_id, script_id, checkpoint["id"])
    assert len(restored["messages"]) == 2
    assert restored["messages"][0]["content"] == "First prompt"
    assert restored["messages"][1]["content"] == "First reply"


def test_restore_missing_checkpoint_raises(tmp_path, monkeypatch):
    project_id = "proj-b"
    script_id = "script-b"
    _seed_script(tmp_path, project_id, script_id)
    monkeypatch.setattr(chat_service, "get_projects_dir", lambda: tmp_path)

    try:
        chat_service.restore_checkpoint(project_id, script_id, "missing-checkpoint")
        assert False, "Expected FileNotFoundError"
    except FileNotFoundError as exc:
        assert "Checkpoint" in str(exc)
