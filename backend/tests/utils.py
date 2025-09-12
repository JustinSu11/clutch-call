"""
File: tests/utils.py
Author: Maaz Haque
Purpose: Shared helpers for smoke testing the backend API endpoints.
"""

import os
import requests


def base_url() -> str:
    """Construct the base URL from env vars.

    HOST (default 127.0.0.1)
    PORT (default 8000)
    API_PREFIX (default /api/v1)
    """
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    prefix = os.getenv("API_PREFIX", "/api/v1")
    return f"http://{host}:{port}{prefix}"


def get_json(path: str):
    """GET a path and return JSON with basic status check."""
    url = f"{base_url()}{path}"
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.json()
