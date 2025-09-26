"""
File: app/services/nfl_service.py
Author: Maaz Haque
Purpose: Service functions for NFL data via ESPN's public JSON endpoints. Provides
         helpers used by the route layer for listing games, fetching a single event,
         retrieving box scores, and listing upcoming games.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import requests

# ESPN public API endpoints (undocumented but widely used and publicly accessible)
SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
EVENT = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary"


def _get(url: str, params: Optional[Dict[str, Any]] = None):
    """Perform a GET request against ESPN and return parsed JSON."""
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def get_games(week: Optional[str] = None, season: Optional[str] = None):
    """Return NFL games from the scoreboard with optional week/season filters."""
    params: Dict[str, Any] = {}
    if week:
        params["week"] = week
    if season:
        params["dates"] = season  # format YYYY or YYYYMMDD; scoreboard accepts ranges too
    return _get(SCOREBOARD, params)


def get_game_by_id(event_id: str):
    """Fetch a single game summary using ESPN event ID."""
    return _get(EVENT, {"event": event_id})


def get_box_score(event_id: str):
    """Extract game box score from the summary payload if present."""
    data = _get(EVENT, {"event": event_id})
    # ESPN returns boxscore in competitions[0].boxscore or a top-level boxscore
    comps = (data or {}).get("competitions", [])
    if comps:
        box = comps[0].get("boxscore") or data.get("boxscore")
    else:
        box = data.get("boxscore")
    return {"eventId": event_id, "boxscore": box}


def get_upcoming_games(days: int = 7):
    """List NFL games between today and today+days using ESPN date range format."""
    today = datetime.utcnow().date()
    end = today + timedelta(days=days)
    # ESPN expects YYYYMMDD or range YYYYMMDD-YYYYMMDD
    fmt = "%Y%m%d"
    params = {"dates": f"{today.strftime(fmt)}-{end.strftime(fmt)}"}
    return _get(SCOREBOARD, params)


def get_today_games():
    """List NFL games for today using ESPN scoreboard."""
    today = datetime.utcnow().date()
    fmt = "%Y%m%d"
    params = {"dates": today.strftime(fmt)}
    data = _get(SCOREBOARD, params)
    
    # Add league identifier to response
    if "events" in data:
        for event in data["events"]:
            event["league"] = "NFL"
    
    return data
