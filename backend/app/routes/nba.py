"""
File: app/routes/nba.py
Author: Maaz Haque
Purpose: Exposes NBA endpoints using nba_api and simplified predictions.
         Endpoints return JSON data for games, single-game details, basic box scores (via stats), 
         a team's recent games, upcoming games within a date window, and AI-powered predictions.
         Follows NFL service pattern for consistency.
"""

import os
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify

# Set up logging
logger = logging.getLogger(__name__)

from ..services.nba_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_team_last_games,
    get_upcoming_games,
    get_today_games,
    get_standings,
    generate_prediction_for_game,
)

# Blueprint for NBA-related routes; mounted by the app factory at /api/v1/nba
bp = Blueprint("nba", __name__)


# --- PREDICTION ENDPOINT ---
@bp.get("/predict/<game_id>")
def nba_predict_game(game_id: str):
    """Generate a prediction for a single game by its game ID.
    
    Returns:
        200: Successful prediction
        400: Invalid request
        500: Server error
    """
    try:
        result = generate_prediction_for_game(game_id)
        
        # Check if result is an error response
        if isinstance(result, dict) and "error" in result:
            error_msg = result.get("error", "")
            
            # Model not loaded is a 500 error (server issue)
            if "Model not loaded" in error_msg:
                return result, 500
            
            # Insufficient data - 400
            if "Insufficient game data" in error_msg or "Could not determine teams" in error_msg:
                return result, 400
            
            # Other errors are 400 (bad request)
            return result, 400
        
        # Success - return prediction
        return result, 200
        
    except Exception as e:
        # Unexpected server errors
        return {
            "error": "Internal server error generating prediction.",
            "details": str(e)
        }, 500
# -----------------------------


@bp.get("/games")
def nba_games():
    """List games with optional filters."""
    season = request.args.get("season")
    team_id = request.args.get("team_id")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 25))
    data = get_games(season=season, team_id=team_id, page=page, per_page=per_page)
    return data


@bp.get("/game/<game_id>")
def nba_game_by_id(game_id: str):
    """Fetch a single game by its game ID."""
    return get_game_by_id(game_id)


@bp.get("/game/<game_id>/boxscore")
def nba_box_score(game_id: str):
    """Fetch basic per-player stats for the specified game."""
    return get_box_score(game_id)


@bp.get("/teams/<int:team_id>/last")
def nba_team_last(team_id: int):
    """Get a team's recent games."""
    n = int(request.args.get("n", 5))
    season = request.args.get("season")
    return get_team_last_games(team_id, n=n, season=season)


@bp.get("/upcoming")
def nba_upcoming():
    """List games between today and today+days (default 7)."""
    days = int(request.args.get("days", 7))
    return get_upcoming_games(days=days)


@bp.get("/today")
def nba_today():
    """List NBA games for today."""
    return get_today_games()


@bp.get("/standings")
def nba_standings():
    """Get NBA standings.
    
    Query params:
        season (str): Optional season year (e.g., 2024)
    """
    season = request.args.get("season")
    return get_standings(season=season)
