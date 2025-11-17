"""
File: app/routes/today.py
Author: Maaz Haque
Purpose: Aggregated endpoint that provides today's games from all supported leagues
         (NBA, NFL, Soccer) in a single response. Designed for sports statistics apps
         to get comprehensive daily schedules with game data, scores, and team information.
"""

from flask import Blueprint, request
from ..services.nba_service import get_today_games as get_nba_today
from ..services.nfl_service import get_today_games as get_nfl_today
from ..services.soccer_service import get_today_games as get_soccer_today

# Blueprint for unified today's games across all leagues
bp = Blueprint("today", __name__)


@bp.get("/")
@bp.get("")
def all_leagues_today():
    """Get today's games from all supported leagues with comprehensive game data."""
    try:
        # Default soccer leagues to check
        soccer_leagues = request.args.getlist("soccer_leagues") or ["MLS", "EPL", "LaLiga"]
        include_stats = request.args.get("include_stats", "true").lower() == "true"
        
        result = {
            "date": None,  # Will be set from first available source
            "leagues": {
                "NBA": {"games": [], "error": None, "games_count": 0},
                "NFL": {"games": [], "error": None, "games_count": 0},
                "Soccer": {"games": [], "error": None, "games_count": 0}
            },
            "stats_info": {
                "detailed_stats_available": include_stats,
                "available_stats": ["scores", "team_records", "player_stats", "boxscores"] if include_stats else [],
                "note": "Game statistics and boxscores available for completed games"
            }
        }
        
        # Get NBA games
        try:
            nba_data = get_nba_today()
            games = nba_data.get("data", [])
            result["leagues"]["NBA"]["games"] = games
            result["leagues"]["NBA"]["games_count"] = len(games)
            if not result["date"] and games:
                result["date"] = games[0].get("game_date")
        except Exception as e:
            result["leagues"]["NBA"]["error"] = str(e)
        
        # Get NFL games
        try:
            nfl_data = get_nfl_today()
            games = nfl_data.get("events", [])
            result["leagues"]["NFL"]["games"] = games
            result["leagues"]["NFL"]["games_count"] = len(games)
            if not result["date"] and nfl_data.get("day", {}).get("date"):
                result["date"] = nfl_data["day"]["date"]
        except Exception as e:
            result["leagues"]["NFL"]["error"] = str(e)
        
        # Get Soccer games for multiple leagues
        soccer_games = []
        for league in soccer_leagues:
            try:
                soccer_data = get_soccer_today(league=league)
                if "events" in soccer_data:
                    soccer_games.extend(soccer_data["events"])
                if not result["date"] and soccer_data.get("day", {}).get("date"):
                    result["date"] = soccer_data["day"]["date"]
            except Exception as e:
                if result["leagues"]["Soccer"]["error"]:
                    result["leagues"]["Soccer"]["error"] += f"; {league}: {str(e)}"
                else:
                    result["leagues"]["Soccer"]["error"] = f"{league}: {str(e)}"
        
        result["leagues"]["Soccer"]["games"] = soccer_games
        result["leagues"]["Soccer"]["games_count"] = len(soccer_games)
        
        # Calculate totals
        total_games = (
            result["leagues"]["NBA"]["games_count"] +
            result["leagues"]["NFL"]["games_count"] +
            result["leagues"]["Soccer"]["games_count"]
        )
        
        result["summary"] = {
            "total_games": total_games,
            "nba_games": result["leagues"]["NBA"]["games_count"],
            "nfl_games": result["leagues"]["NFL"]["games_count"],
            "soccer_games": result["leagues"]["Soccer"]["games_count"],
            "leagues_with_games": [
                league for league, data in result["leagues"].items() 
                if data["games_count"] > 0
            ],
            "stats_highlights": "Key games with significant statistical implications" if include_stats else None
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Server error: {str(e)}"}, 500


@bp.get("/nba")
def nba_today():
    """Get only NBA games for today."""
    return get_nba_today()


@bp.get("/nfl")
def nfl_today():
    """Get only NFL games for today."""
    return get_nfl_today()


@bp.get("/soccer")
def soccer_today():
    """Get soccer games for today for specified league(s)."""
    league = request.args.get("league", "MLS")
    return get_soccer_today(league=league)