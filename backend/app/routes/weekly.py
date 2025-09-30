"""
File: app/routes/weekly.py
Author: Maaz Haque
Purpose: Aggregated endpoint that provides upcoming games for the current week from all 
         supported leagues (NBA, NFL, Soccer). Designed for sports statistics applications
         with comprehensive game data including team records, schedules, and performance metrics.
"""

from flask import Blueprint, request
from datetime import datetime, timedelta
from ..services.nba_service import get_upcoming_games as get_nba_upcoming
from ..services.nfl_service import get_upcoming_games as get_nfl_upcoming
from ..services.soccer_service import get_upcoming_games as get_soccer_upcoming

# Blueprint for weekly upcoming games across all leagues
bp = Blueprint("weekly", __name__)


@bp.get("/")
@bp.get("")
def all_leagues_weekly():
    """Get upcoming games for the current week from all supported leagues."""
    try:
        # Get days parameter (default to 7 for a week)
        days = int(request.args.get("days", 7))
        
        # Default soccer leagues to check
        soccer_leagues = request.args.getlist("soccer_leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        
        result = {
            "date_range": {
                "start": datetime.now().strftime("%Y-%m-%d"),
                "end": (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
            },
            "leagues": {
                "NBA": {"games": [], "error": None, "total_games": 0},
                "NFL": {"games": [], "error": None, "total_games": 0},
                "Soccer": {"games": [], "error": None, "total_games": 0}
            },
            "stats_info": {
                "note": "Detailed statistics and team performance data available for all games",
                "available_data": ["team_records", "player_stats", "recent_performance", "head_to_head"]
            }
        }
        
        # Get NBA upcoming games
        try:
            nba_data = get_nba_upcoming(days=days)
            if isinstance(nba_data, dict) and "data" in nba_data:
                result["leagues"]["NBA"]["games"] = nba_data["data"]
                result["leagues"]["NBA"]["total_games"] = len(nba_data["data"])
        except Exception as e:
            result["leagues"]["NBA"]["error"] = str(e)
        
        # Get NFL upcoming games
        try:
            nfl_data = get_nfl_upcoming(days=days)
            if isinstance(nfl_data, dict):
                if "events" in nfl_data:
                    result["leagues"]["NFL"]["games"] = nfl_data["events"]
                    result["leagues"]["NFL"]["total_games"] = len(nfl_data["events"])
                elif "data" in nfl_data:
                    result["leagues"]["NFL"]["games"] = nfl_data["data"]
                    result["leagues"]["NFL"]["total_games"] = len(nfl_data["data"])
        except Exception as e:
            result["leagues"]["NFL"]["error"] = str(e)
        
        # Get Soccer upcoming games
        try:
            soccer_data = get_soccer_upcoming(days=days, leagues=soccer_leagues)
            if isinstance(soccer_data, dict):
                if "matches" in soccer_data:
                    result["leagues"]["Soccer"]["games"] = soccer_data["matches"]
                    result["leagues"]["Soccer"]["total_games"] = len(soccer_data["matches"])
                elif "data" in soccer_data:
                    result["leagues"]["Soccer"]["games"] = soccer_data["data"]
                    result["leagues"]["Soccer"]["total_games"] = len(soccer_data["data"])
        except Exception as e:
            result["leagues"]["Soccer"]["error"] = str(e)
        
        # Calculate total games across all leagues
        total_games = sum([
            result["leagues"]["NBA"]["total_games"],
            result["leagues"]["NFL"]["total_games"],
            result["leagues"]["Soccer"]["total_games"]
        ])
        
        result["summary"] = {
            "total_games_all_leagues": total_games,
            "days_ahead": days,
            "leagues_with_games": [
                league for league, data in result["leagues"].items() 
                if data["total_games"] > 0
            ]
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch weekly games: {str(e)}"}, 500


@bp.get("/nba")
def nba_weekly():
    """Get NBA games for the current week only."""
    try:
        days = int(request.args.get("days", 7))
        return get_nba_upcoming(days=days)
    except Exception as e:
        return {"error": f"Failed to fetch NBA weekly games: {str(e)}"}, 500


@bp.get("/nfl")
def nfl_weekly():
    """Get NFL games for the current week only."""
    try:
        days = int(request.args.get("days", 7))
        return get_nfl_upcoming(days=days)
    except Exception as e:
        return {"error": f"Failed to fetch NFL weekly games: {str(e)}"}, 500


@bp.get("/soccer")
def soccer_weekly():
    """Get Soccer games for the current week only."""
    try:
        days = int(request.args.get("days", 7))
        leagues = request.args.getlist("leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        return get_soccer_upcoming(days=days, leagues=leagues)
    except Exception as e:
        return {"error": f"Failed to fetch Soccer weekly games: {str(e)}"}, 500