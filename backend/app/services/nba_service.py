"""
File: app/services/nba_service.py
Author: Maaz Haque
Purpose: Thin service layer for NBA data using the python package `nba_api` (which
         calls stats.nba.com). Provides helpers to list games, fetch a specific
         game (summary), box score stats, team recent games, and upcoming games.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from nba_api.stats.endpoints import (
    boxscoretraditionalv2,
    boxscoresummaryv2,
    leaguegamelog,
    scoreboardv2,
    teamgamelog,
)


def _season_to_nba_format(season: Optional[str]) -> Optional[str]:
    """Convert a season like '2024' to '2024-25' required by stats.nba.com."""
    if not season:
        return None
    if "-" in season:
        return season
    try:
        start = int(season)
        end_short = (start + 1) % 100
        return f"{start}-{end_short:02d}"
    except ValueError:
        return season


def _paginate(items: List[Dict[str, Any]], page: int, per_page: int) -> Dict[str, Any]:
    total = len(items)
    start = max((page - 1), 0) * per_page
    end = start + per_page
    return {
        "data": items[start:end],
        "meta": {"page": page, "per_page": per_page, "total": total},
    }


def get_games(season: Optional[str] = None, team_id: Optional[str] = None, page: int = 1, per_page: int = 25):
    """List NBA games using LeagueGameLog.

    Note: stats.nba.com uses string game IDs like '0022300001'.
    """
    season_fmt = _season_to_nba_format(season)
    # LeagueGameLog returns game logs for all teams; filter optional team_id
    if season_fmt:
        logs = leaguegamelog.LeagueGameLog(
            season=season_fmt, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    else:
        logs = leaguegamelog.LeagueGameLog(
            season_type_all_star="Regular Season"
        ).get_normalized_dict()
    rows = logs.get("LeagueGameLog", [])
    # Optional team filter
    if team_id:
        rows = [r for r in rows if str(r.get("TEAM_ID")) == str(team_id)]
    # Map to a simpler shape
    items = [
        {
            "game_id": r.get("GAME_ID"),
            "game_date": r.get("GAME_DATE"),
            "team_id": r.get("TEAM_ID"),
            "team_abbreviation": r.get("TEAM_ABBREVIATION"),
            "matchup": r.get("MATCHUP"),
            "wl": r.get("WL"),
            "pts": r.get("PTS"),
        }
        for r in rows
    ]
    return _paginate(items, page=page, per_page=per_page)


def get_game_by_id(game_id: str):
    """Fetch a game summary by NBA game ID using BoxScoreSummaryV2."""
    summary = boxscoresummaryv2.BoxScoreSummaryV2(game_id=game_id).get_normalized_dict()
    return summary


def get_box_score(game_id: str):
    """Fetch traditional box score stats by NBA game ID."""
    box = boxscoretraditionalv2.BoxScoreTraditionalV2(game_id=game_id).get_normalized_dict()
    return box


def get_team_last_games(team_id: int, n: int = 5, season: Optional[str] = None):
    """Return the most recent N games for a team using TeamGameLog."""
    season_fmt = _season_to_nba_format(season)
    if season_fmt:
        tlog = teamgamelog.TeamGameLog(
            team_id=team_id, season=season_fmt, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    else:
        tlog = teamgamelog.TeamGameLog(
            team_id=team_id, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    rows = tlog.get("TeamGameLog", [])
    # Rows are typically already recent-first; ensure slice of N
    items = [
        {
            "game_id": r.get("GAME_ID"),
            "game_date": r.get("GAME_DATE"),
            "matchup": r.get("MATCHUP"),
            "wl": r.get("WL"),
            "pts": r.get("PTS"),
        }
        for r in rows[:n]
    ]
    return {"data": items}


def get_upcoming_games(days: int = 7):
    """List upcoming games for the next N days using ScoreboardV2 day by day."""
    today = datetime.utcnow().date()
    all_items: List[Dict[str, Any]] = []
    for offset in range(0, max(days, 1)):
        d = today + timedelta(days=offset)
        ds = d.strftime("%m/%d/%Y")
        # day_offset parameter is optional; let it default
        sb = scoreboardv2.ScoreboardV2(game_date=ds).get_normalized_dict()
        # Linescores and GameHeader contain game info
        headers = sb.get("GameHeader", [])
        for h in headers:
            all_items.append(
                {
                    "game_id": h.get("GAME_ID"),
                    "game_date": ds,
                    "home_team_id": h.get("HOME_TEAM_ID"),
                    "visitor_team_id": h.get("VISITOR_TEAM_ID"),
                    "game_status": h.get("GAME_STATUS_TEXT"),
                }
            )
    return {"data": all_items}


def get_today_games():
    """List NBA games for today using ScoreboardV2."""
    today = datetime.utcnow().date()
    ds = today.strftime("%m/%d/%Y")
    sb = scoreboardv2.ScoreboardV2(game_date=ds).get_normalized_dict()
    
    # Get GameHeader data for today's games
    headers = sb.get("GameHeader", [])
    items = []
    for h in headers:
        items.append(
            {
                "game_id": h.get("GAME_ID"),
                "game_date": ds,
                "home_team_id": h.get("HOME_TEAM_ID"),
                "visitor_team_id": h.get("VISITOR_TEAM_ID"),
                "game_status": h.get("GAME_STATUS_TEXT"),
                "league": "NBA"
            }
        )
    return {"data": items}
