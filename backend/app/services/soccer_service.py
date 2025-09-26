"""
File: app/services/soccer_service.py
Author: Maaz Haque
Purpose: Service functions for Soccer using ESPN's public JSON endpoints. Supports
         multiple leagues (MLS default, EPL, LaLiga) by constructing the appropriate
         sport path segment. Provides listings, single game details, box scores,
         and upcoming games.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import requests

# Map friendly league keys to ESPN path segments
LEAGUE_MAP = {
    # key -> ESPN path segment
    "MLS": "soccer/usa.1",
    "EPL": "soccer/eng.1",
    "LaLiga": "soccer/esp.1",
}


def _league_path(league: str) -> str:
    """Return the ESPN path for the given league key (default MLS)."""
    return LEAGUE_MAP.get(league, LEAGUE_MAP["MLS"])  # default MLS


def _scoreboard_url(league: str) -> str:
    """Construct the scoreboard endpoint URL for a league."""
    return f"https://site.api.espn.com/apis/site/v2/sports/{_league_path(league)}/scoreboard"


def _summary_url(league: str) -> str:
    """Construct the summary endpoint URL for a league."""
    return f"https://site.api.espn.com/apis/site/v2/sports/{_league_path(league)}/summary"


def _get(url: str, params: Optional[Dict[str, Any]] = None):
    """Perform a GET request and return parsed JSON."""
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def get_games(league: str = "MLS", date: Optional[str] = None):
    """List games for a league with an optional date filter (YYYYMMDD or range)."""
    params: Dict[str, Any] = {}
    if date:
        params["dates"] = date  # YYYYMMDD or range
    return _get(_scoreboard_url(league), params)


def get_game_by_id(event_id: str, league: str = "MLS"):
    """Fetch a single game by ESPN event ID for the specified league."""
    return _get(_summary_url(league), {"event": event_id})


def get_box_score(event_id: str, league: str = "MLS"):
    """Extract box score data for a given event/league if present in summary."""
    data = _get(_summary_url(league), {"event": event_id})
    comps = (data or {}).get("competitions", [])
    if comps:
        box = comps[0].get("boxscore") or data.get("boxscore")
    else:
        box = data.get("boxscore")
    return {"eventId": event_id, "boxscore": box}


def get_upcoming_games(league: str = "MLS", days: int = 7):
    """List upcoming games for a league between today and today+days."""
    today = datetime.utcnow().date()
    end = today + timedelta(days=days)
    fmt = "%Y%m%d"
    params = {"dates": f"{today.strftime(fmt)}-{end.strftime(fmt)}"}
    return _get(_scoreboard_url(league), params)


def get_today_games(league: str = "MLS"):
    """List games for today for a specific league."""
    today = datetime.utcnow().date()
    fmt = "%Y%m%d"
    params = {"dates": today.strftime(fmt)}
    data = _get(_scoreboard_url(league), params)
    
    # Add league identifier to response
    if "events" in data:
        for event in data["events"]:
            event["league"] = league
    
    return data
