"""
File: app/routes/today.py
Author: Maaz Haque
Purpose: Aggregated endpoint that provides today's games from all supported leagues
         (NBA, NFL, Soccer) in a single response. This allows frontend apps to get
         a comprehensive view of today's sports schedule across all leagues.
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
    """Get today's games from all supported leagues."""
    try:
        # Default soccer leagues to check
        soccer_leagues = request.args.getlist("soccer_leagues") or ["MLS", "EPL", "LaLiga"]
        
        result = {
            "date": None,  # Will be set from first available source
            "leagues": {
                "NBA": {"games": [], "error": None},
                "NFL": {"games": [], "error": None},
                "Soccer": {"games": [], "error": None}
            }
        }
        
        # Get NBA games
        try:
            nba_data = get_nba_today()
            result["leagues"]["NBA"]["games"] = nba_data.get("data", [])
            if not result["date"] and result["leagues"]["NBA"]["games"]:
                result["date"] = result["leagues"]["NBA"]["games"][0].get("game_date")
        except Exception as e:
            result["leagues"]["NBA"]["error"] = str(e)
        
        # Get NFL games
        try:
            nfl_data = get_nfl_today()
            if "events" in nfl_data:
                result["leagues"]["NFL"]["games"] = nfl_data["events"]
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
        
        # Calculate totals
        total_games = (
            len(result["leagues"]["NBA"]["games"]) +
            len(result["leagues"]["NFL"]["games"]) +
            len(result["leagues"]["Soccer"]["games"])
        )
        
        result["summary"] = {
            "total_games": total_games,
            "nba_games": len(result["leagues"]["NBA"]["games"]),
            "nfl_games": len(result["leagues"]["NFL"]["games"]),
            "soccer_games": len(result["leagues"]["Soccer"]["games"])
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