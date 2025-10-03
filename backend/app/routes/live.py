"""
File: app/routes/live.py
Author: Maaz Haque
Purpose: Endpoint for fetching currently active/live games from all supported leagues.
         Provides real-time game status, scores, statistics, and performance data for
         sports statistics applications.
"""

from flask import Blueprint, request
from datetime import datetime
from ..services.nba_service import get_live_games as get_nba_live
from ..services.nfl_service import get_live_games as get_nfl_live
from ..services.soccer_service import get_live_games as get_soccer_live

# Blueprint for live/current games across all leagues
bp = Blueprint("live", __name__)


@bp.get("/")
@bp.get("")
def all_leagues_live():
    """Get currently active/live games from all supported leagues."""
    try:
        # Default soccer leagues to check
        soccer_leagues = request.args.getlist("soccer_leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "leagues": {
                "NBA": {"games": [], "error": None, "live_count": 0},
                "NFL": {"games": [], "error": None, "live_count": 0},
                "Soccer": {"games": [], "error": None, "live_count": 0}
            },
            "live_stats": {
                "real_time_updates": True,
                "available_stats": ["live_scores", "player_stats", "team_stats", "game_flow"],
                "note": "Live statistics and scores update in real-time during games"
            }
        }
        
        # Get NBA live games
        try:
            nba_data = get_nba_live()
            if isinstance(nba_data, dict):
                if "data" in nba_data:
                    live_games = [game for game in nba_data["data"] if game.get("status", "").lower() in ["live", "in_progress", "active"]]
                    result["leagues"]["NBA"]["games"] = live_games
                    result["leagues"]["NBA"]["live_count"] = len(live_games)
                elif "games" in nba_data:
                    live_games = [game for game in nba_data["games"] if game.get("status", "").lower() in ["live", "in_progress", "active"]]
                    result["leagues"]["NBA"]["games"] = live_games
                    result["leagues"]["NBA"]["live_count"] = len(live_games)
        except Exception as e:
            result["leagues"]["NBA"]["error"] = str(e)
        
        # Get NFL live games
        try:
            nfl_data = get_nfl_live()
            if isinstance(nfl_data, dict):
                if "events" in nfl_data:
                    live_games = [game for game in nfl_data["events"] if game.get("status", {}).get("type", {}).get("name", "").lower() in ["in-progress", "live"]]
                    result["leagues"]["NFL"]["games"] = live_games
                    result["leagues"]["NFL"]["live_count"] = len(live_games)
                elif "data" in nfl_data:
                    live_games = [game for game in nfl_data["data"] if game.get("status", "").lower() in ["live", "in_progress", "active"]]
                    result["leagues"]["NFL"]["games"] = live_games
                    result["leagues"]["NFL"]["live_count"] = len(live_games)
        except Exception as e:
            result["leagues"]["NFL"]["error"] = str(e)
        
        # Get Soccer live games
        try:
            soccer_data = get_soccer_live(leagues=soccer_leagues)
            if isinstance(soccer_data, dict):
                if "matches" in soccer_data:
                    live_games = [match for match in soccer_data["matches"] if match.get("status", "").lower() in ["live", "in_progress", "1h", "2h", "ht"]]
                    result["leagues"]["Soccer"]["games"] = live_games
                    result["leagues"]["Soccer"]["live_count"] = len(live_games)
                elif "data" in soccer_data:
                    live_games = [match for match in soccer_data["data"] if match.get("status", "").lower() in ["live", "in_progress", "1h", "2h", "ht"]]
                    result["leagues"]["Soccer"]["games"] = live_games
                    result["leagues"]["Soccer"]["live_count"] = len(live_games)
        except Exception as e:
            result["leagues"]["Soccer"]["error"] = str(e)
        
        # Calculate total live games
        total_live = sum([
            result["leagues"]["NBA"]["live_count"],
            result["leagues"]["NFL"]["live_count"],
            result["leagues"]["Soccer"]["live_count"]
        ])
        
        result["summary"] = {
            "total_live_games": total_live,
            "leagues_with_live_games": [
                league for league, data in result["leagues"].items() 
                if data["live_count"] > 0
            ],
            "refresh_recommended": "30-60 seconds for live updates"
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch live games: {str(e)}"}, 500


@bp.get("/nba")
def nba_live():
    """Get NBA live games only."""
    try:
        return get_nba_live()
    except Exception as e:
        return {"error": f"Failed to fetch live NBA games: {str(e)}"}, 500


@bp.get("/nfl")
def nfl_live():
    """Get NFL live games only."""
    try:
        return get_nfl_live()
    except Exception as e:
        return {"error": f"Failed to fetch live NFL games: {str(e)}"}, 500


@bp.get("/soccer")
def soccer_live():
    """Get Soccer live games only."""
    try:
        leagues = request.args.getlist("leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        return get_soccer_live(leagues=leagues)
    except Exception as e:
        return {"error": f"Failed to fetch live Soccer games: {str(e)}"}, 500


@bp.get("/status")
def live_status():
    """Get a quick summary of live games count across all leagues."""
    try:
        result = {
            "timestamp": datetime.now().isoformat(),
            "live_games_count": {
                "NBA": 0,
                "NFL": 0,
                "Soccer": 0,
                "total": 0
            }
        }
        
        # Quick count for each league
        try:
            nba_data = get_nba_live()
            if isinstance(nba_data, dict) and "data" in nba_data:
                result["live_games_count"]["NBA"] = len([g for g in nba_data["data"] if g.get("status", "").lower() in ["live", "in_progress", "active"]])
        except:
            pass
        
        try:
            nfl_data = get_nfl_live()
            if isinstance(nfl_data, dict) and "events" in nfl_data:
                result["live_games_count"]["NFL"] = len([g for g in nfl_data["events"] if g.get("status", {}).get("type", {}).get("name", "").lower() in ["in-progress", "live"]])
        except:
            pass
        
        try:
            soccer_data = get_soccer_live()
            if isinstance(soccer_data, dict) and "matches" in soccer_data:
                result["live_games_count"]["Soccer"] = len([m for m in soccer_data["matches"] if m.get("status", "").lower() in ["live", "in_progress", "1h", "2h", "ht"]])
        except:
            pass
        
        result["live_games_count"]["total"] = sum([
            result["live_games_count"]["NBA"],
            result["live_games_count"]["NFL"],
            result["live_games_count"]["Soccer"]
        ])
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to get live status: {str(e)}"}, 500