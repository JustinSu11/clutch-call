"""
File: app/services/nba_service.py
Author: Maaz Haque
Purpose: Thin service layer for NBA data using balldontlie's free public API.
         Provides helper functions used by route handlers to retrieve games,
         single-game details, per-game player stats (box score), recent team
         games, and upcoming games.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import requests

# Base URL for the balldontlie API
BASE = "https://api.balldontlie.io/v1"


def _get(url: str, params: Optional[Dict[str, Any]] = None):
    """Perform a GET request and return parsed JSON.

    Args:
        url: Endpoint URL.
        params: Query string parameters.
    Returns:
        dict: Parsed JSON response.
    Raises:
        requests.HTTPError: If the HTTP response indicates an error.
    """
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def get_games(season: Optional[str] = None, team_id: Optional[str] = None, page: int = 1, per_page: int = 25):
    """List NBA games with optional season/team filters and pagination."""
    params: Dict[str, Any] = {"page": page, "per_page": per_page}
    if season:
        params["seasons[]"] = season
    if team_id:
        params["team_ids[]"] = team_id
    return _get(f"{BASE}/games", params)


def get_game_by_id(game_id: int):
    """Fetch a single game by its balldontlie game ID."""
    return _get(f"{BASE}/games/{game_id}")


def get_box_score(game_id: int):
    """Fetch per-player stats for a given game (box score approximation)."""
    # balldontlie provides stats per game via /stats with game_ids[]
    params = {"game_ids[]": game_id, "per_page": 100}
    return _get(f"{BASE}/stats", params)


def get_team_last_games(team_id: int, n: int = 5, season: Optional[str] = None):
    """Return the most recent N games for a team (optionally filtered by season)."""
    params: Dict[str, Any] = {"team_ids[]": team_id, "per_page": n, "postseason": False}
    if season:
        params["seasons[]"] = season
    # Ordering isn't directly supported; fetch a recent window and sort client-side.
    today = datetime.utcnow().date()
    start = today - timedelta(days=200)
    params["start_date"] = start.isoformat()
    params["end_date"] = today.isoformat()
    data = _get(f"{BASE}/games", params)
    # Sort by date descending and trim to N
    games = sorted(data.get("data", []), key=lambda g: g.get("date", ""), reverse=True)[:n]
    return {"data": games}


def get_upcoming_games(days: int = 7):
    """List NBA games between today and today+days."""
    today = datetime.utcnow().date()
    end = today + timedelta(days=days)
    params = {"start_date": today.isoformat(), "end_date": end.isoformat(), "per_page": 100}
    return _get(f"{BASE}/games", params)
