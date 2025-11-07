"""
File: app/routes/nfl.py
Author: Maaz Haque
Purpose: NFL endpoints backed by ESPN's public JSON APIs (scoreboard and summary).
         Provides listings for games, a single game by event ID, box scores,
         and upcoming games for the next N days.

FIXES:
- Updated error handling to properly handle upcoming games (422 status)
- Added better error messages for different failure scenarios
- Enhanced logging for debugging
"""

from flask import Blueprint, request
from ..services.nfl_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_upcoming_games,
    get_today_games,
    generate_prediction_for_game,
    get_standings,
)

bp = Blueprint("nfl", __name__)

# --- PREDICTION ENDPOINT ---
@bp.get("/predict/<event_id>") 
def nfl_predict_game(event_id: str):
    """Generate a prediction for a single game by its ESPN event ID.
    
    Note: This endpoint only works for in-progress or completed games.
    Upcoming games cannot be predicted using this model as it requires
    actual in-game yard statistics.
    
    Returns:
        200: Successful prediction
        422: Game hasn't started yet (expected, not an error)
        400: Invalid request
        500: Server error
    """
    try:
        result = generate_prediction_for_game(event_id)
        
        # Check if result is an error response
        if isinstance(result, dict) and "error" in result:
            error_msg = result.get("error", "")
            
            # Model not loaded is a 500 error (server issue)
            if "Model not loaded" in error_msg:
                print(f" [Route] Model not loaded - returning 500")
                return result, 500
            
            # Upcoming/insufficient data games - 422 Unprocessable Entity
            # This is expected behavior for pre-game requests
            if "Cannot predict upcoming games" in error_msg:
                print(f"ℹ️  [Route] Upcoming game - returning 422")
                return result, 422
            
            if "Insufficient game data" in error_msg:
                print(f"ℹ️  [Route] Insufficient data - returning 422")
                return result, 422
            
            # Competition/team data issues - 400 (bad request)
            if "No competitions data" in error_msg or "Cannot find teams" in error_msg:
                print(f"  [Route] Invalid game data - returning 400")
                return result, 400
            
            # Other errors are 400 (bad request)
            print(f"  [Route] Other error - returning 400: {error_msg}")
            return result, 400
        
        # Success - return prediction
        print(f" [Route] Prediction successful - returning 200")
        return result, 200
        
    except Exception as e:
        # Unexpected server errors
        print(f" [Route] Exception caught: {str(e)}")
        return {
            "error": "Internal server error generating prediction.",
            "details": str(e)
        }, 500

# -----------------------------

@bp.get("/games")
def nfl_games():
    """List NFL games with optional week and season filters."""
    week = request.args.get("week")
    season = request.args.get("season")
    return get_games(week=week, season=season)

@bp.get("/game/<event_id>")
def nfl_game_by_id(event_id: str):
    """Fetch a single game's details using ESPN event ID."""
    return get_game_by_id(event_id)

@bp.get("/game/<event_id>/boxscore")
def nfl_box_score(event_id: str):
    """Fetch box score for a specific NFL game by ESPN event ID."""
    return get_box_score(event_id)

@bp.get("/upcoming")
def nfl_upcoming():
    """Get upcoming NFL games for the next N days (default: 7)."""
    days = int(request.args.get("days", 7))
    return get_upcoming_games(days=days)

@bp.get("/today")
def nfl_today():
    """List NFL games for today."""
    return get_today_games()


@bp.get("/standings")
def nfl_standings():
    """Get NFL standings.
    
    Query params:
        season (str): Optional season year (e.g., 2024)
    """
    season = request.args.get("season")
    return get_standings(season=season)
