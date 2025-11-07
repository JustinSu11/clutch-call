"""Utility helpers for persisting NBA ML training status.

This module writes a small JSON file to track when training jobs start and finish.
The routes can reference this to surface status info to API clients and the UI.
"""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime
from typing import Any, Dict

BACKEND_ROOT = os.path.dirname(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, ".."))
STATUS_FILE = os.path.join(PROJECT_ROOT, "nba_ml_data", "models", "training_status.json")
_LOCK = threading.Lock()


def _ensure_directory() -> None:
    os.makedirs(os.path.dirname(STATUS_FILE), exist_ok=True)


def _load_status() -> Dict[str, Any]:
    if not os.path.exists(STATUS_FILE):
        return {
            "is_training": False,
            "last_success": None,
            "last_message": None,
        }

    try:
        with open(STATUS_FILE, "r", encoding="utf-8") as status_file:
            data = json.load(status_file)
    except (json.JSONDecodeError, OSError):
        return {
            "is_training": False,
            "last_success": None,
            "last_message": None,
        }

    # Guarantee required keys exist for downstream callers
    data.setdefault("is_training", False)
    return data


def _write_status(data: Dict[str, Any]) -> None:
    _ensure_directory()
    tmp_path = f"{STATUS_FILE}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as status_file:
        json.dump(data, status_file, indent=2)
    os.replace(tmp_path, STATUS_FILE)


def get_training_status() -> Dict[str, Any]:
    """Return the latest recorded training status."""
    with _LOCK:
        return dict(_load_status())


def mark_training_start(metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Set the status to running and record optional metadata."""
    with _LOCK:
        payload = _load_status()
        payload.update(metadata or {})
        payload["is_training"] = True
        payload["started_at"] = datetime.utcnow().isoformat()
        payload.pop("completed_at", None)
        payload.pop("last_error", None)
        payload["last_message"] = "Training started"
        _write_status(payload)
        return payload


def mark_training_complete(metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Record a successful training completion."""
    with _LOCK:
        payload = _load_status()
        payload.update(metadata or {})
        payload["is_training"] = False
        payload["completed_at"] = datetime.utcnow().isoformat()
        payload["last_success"] = True
        payload["last_message"] = "Training completed"
        _write_status(payload)
        return payload


def mark_training_failed(error_message: str, metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Record that training failed with an error."""
    with _LOCK:
        payload = _load_status()
        payload.update(metadata or {})
        payload["is_training"] = False
        payload["completed_at"] = datetime.utcnow().isoformat()
        payload["last_success"] = False
        payload["last_error"] = error_message
        payload["last_message"] = "Training failed"
        _write_status(payload)
        return payload
