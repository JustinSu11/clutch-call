"""
File: app/routes/soccer.py
Author: Maaz Haque
MODIFIED: To use absolute imports for EPL model and fix typos.
"""

from flask import Blueprint, request, jsonify, current_app
import functools
import pandas as pd
from difflib import get_close_matches
import logging

# --- Original ESPN Service Imports ---
from ..services.soccer_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_upcoming_games,
    get_today_games,
    get_standings,
)

# --- HVB Model Integration (FIXED) ---
# Changed relative imports (..) to absolute imports (app.)
try:
    from app.services.epl_prediction.exceptions import APIError, DataError
    from app.services.epl_prediction.config import SEASONS
except ImportError as e:
    # This will now only fail if the model files are missing
    logging.warning(f"EPL exception/config types not found. Error: {e}")
    class APIError(Exception): pass
    class DataError(Exception): pass
    SEASONS = [2024] # Dummy
# --- End HVB Integration ---


# Blueprint for Soccer routes; mounted at /api/v1/soccer
bp = Blueprint("soccer", __name__)

# --- Helper Decorator ---
def _check_model(func):
    """Decorator to check if the EPL model is loaded on the current app."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not getattr(current_app, 'epl_model_loaded', False):
            return jsonify({"detail": "EPL Model not ready or failed to load."}), 503
        return func(*args, **kwargs)
    return wrapper


# --- Original ESPN Routes ---
# (Unchanged)
@bp.get("/games")
def soccer_games():
    league = request.args.get("league", "MLS")
    date = request.args.get("date")
    return get_games(league=league, date=date)

@bp.get("/game/<event_id>")
def soccer_game_by_id(event_id: str):
    league = request.args.get("league", "MLS")
    return get_game_by_id(event_id, league=league)

@bp.get("/game/<event_id>/boxscore")
def soccer_box_score(event_id: str):
    league = request.args.get("league", "MLS")
    return get_box_score(event_id, league=league)

@bp.get("/upcoming")
def soccer_upcoming():
    league = request.args.get("league", "MLS")
    days = int(request.args.get("days", 7))
    return get_upcoming_games(league=league, days=days)

@bp.get("/today")
def soccer_today():
    league = request.args.get("league", "MLS")
    return get_today_games(league=league)

@bp.get("/standings")
def soccer_standings():
    league = request.args.get("league", "MLS")
    season = request.args.get("season")
    # --- TYPO FIX 1 ---
    # Changed 'league=g=league' to 'league=league'
    return get_standings(league=league, season=season)
    # --- END FIX ---


# --- NEW HVB Model Routes (EPL) ---
# (Unchanged from previous correct version)

@bp.get("/epl/predict")
@_check_model
def epl_predict():
    """(EPL Model) Predict EPL match rates."""
    try:
        home = request.args.get("home")
        away = request.args.get("away")
        if not home or not away:
            return jsonify({"detail": "Missing 'home' or 'away' query parameter."}), 422

        last_n_str = request.args.get("last_n", "4")
        if not last_n_str.isdigit():
            return jsonify({"detail": "'last_n' must be an integer."}), 422

        last_n = int(last_n_str)
        if not (3 <= last_n <= 20):
            return jsonify({"detail": "'last_n' must be between 3 and 20."}), 422

        epl_predictor = current_app.epl_predictor
        rates = epl_predictor.predict_rates(home=home, away=away, last_n=last_n)
        return jsonify(rates)

    except DataError as e:
        return jsonify({"detail": str(e)}), 422
    except APIError as e:
        return jsonify({"detail": str(e)}), 502
    except Exception as e:
        current_app.logger.error(f"EPL predict error: {e}")
        return jsonify({"detail": f"Unexpected error: {e}"}), 500

@bp.get("/epl/upcoming")
@_check_model
def epl_get_upcoming_matches():
    """(EPL Model) Get upcoming scheduled EPL matches for a season."""
    try:
        season_str = request.args.get("season")
        season = int(season_str) if season_str and season_str.isdigit() else None

        epl_predictor = current_app.epl_predictor
        upcoming_df = epl_predictor.fetch_upcoming_matches(season)

        matches = []
        for _, row in upcoming_df.iterrows():
            matches.append({
                'match_id': int(row['match_id']),
                'date': row['date'].isoformat(),
                'matchday': int(row['matchday']) if pd.notna(row['matchday']) else None,
                'home_team': row['home_team'],
                'away_team': row['away_team']
            })

        return jsonify({"matches": matches})
    except APIError as e:
        return jsonify({"detail": str(e)}), 502
    except Exception as e:
        current_app.logger.error(f"EPL upcoming error: {e}")
        return jsonify({"detail": f"Unexpected error: {e}"}), 500

@bp.get("/epl/teams")
@_check_model
def epl_list_teams():
    """(EPL Model) List all available EPL teams in the model's training data."""
    try:
        epl_predictor = current_app.epl_predictor
        teams = epl_predictor.get_available_teams()
        return jsonify({"teams": teams})
    except Exception as e:
        current_app.logger.error(f"EPL teams error: {e}")
        return jsonify({"detail": f"Unexpected error: {e}"}), 500

@bp.get("/epl/canonicalize")
@_check_model
def epl_canonicalize():
    """(EPL Model) Find the canonical team name for a given alias."""
    try:
        name = request.args.get("name")
        if not name:
            return jsonify({"detail": "Missing 'name' query parameter."}), 422

        epl_predictor = current_app.epl_predictor
        match = epl_predictor.canonicalize_team(name)

        teams = epl_predictor.get_available_teams()
        sugg = get_close_matches(name, teams, n=5, cutoff=0.55)
        if match not in sugg:
            sugg = [match] + sugg
        seen, unique = set(), []
        for s in sugg:
            if s not in seen:
                seen.add(s); unique.append(s)

        return jsonify({"input": name, "match": match, "suggestions": unique[:5]})

    except Exception as e:
        current_app.logger.error(f"EPL canonicalize error: {e}")
        return jsonify({"detail": f"Unexpected error: {e}"}), 500

@bp.get("/epl/info")
@_check_model
def epl_info():
    """(EPL Model) Get info about the trained EPL model."""
    try:
        p = current_app.epl_predictor
        if p.features_df is None:
            return jsonify({"detail": "Model features are not loaded."}), 503

        start = p.features_df['date'].min().date().isoformat()
        end = p.features_df['date'].max().date().isoformat()

        # --- TYPO FIX 2 ---
        # Changed 'p.f.features_df' to 'p.features_df'
        return jsonify({
            "seasons": SEASONS,
            "n_matches": int(len(p.features_df)),
            "train_window": [start, end]
        })
        # --- END FIX ---
    except Exception as e:
        current_app.logger.error(f"EPL info error: {e}")
        return jsonify({"detail": f"Unexpected error: {e}"}), 500