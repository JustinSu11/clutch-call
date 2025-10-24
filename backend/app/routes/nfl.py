"""
File: app/routes/nfl.py
Author: Maaz Haque
Purpose: NFL endpoints backed by ESPN's public JSON APIs (scoreboard and summary).
         Provides listings for games, a single game by event ID, box scores,
         and upcoming games for the next N days.
"""
from flask import Blueprint, request # REMOVED make_response
# REMOVED from flask_cors import CORS 
from ..services.nfl_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_upcoming_games, # <-- ADD THIS IMPORT
    get_today_games,
    generate_prediction_for_game,
)

bp = Blueprint("nfl", __name__)

# REMOVED CORS(bp, ...) configuration

# --- PREDICTION ENDPOINT ---
# --- REVERTED TO @bp.get ---

@bp.get("/predict/<event_id>") 
def nfl_predict_game(event_id: str):
    # REMOVED the 'if request.method == OPTIONS:' block
    """Generate a prediction for a single game by its ESPN event ID."""
    return generate_prediction_for_game(event_id)
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
    days = int(request.args.get("days", 7))
    return get_upcoming_games(days=days)

@bp.get("/today")
def nfl_today():
    return get_today_games()