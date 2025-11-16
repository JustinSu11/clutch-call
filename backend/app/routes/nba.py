"""
File: app/routes/nba.py
Author: Maaz Haque
Purpose: Exposes NBA endpoints using the free balldontlie API and NBA ML predictions.
         Endpoints return JSON data for games, single-game details, basic box scores (via stats), 
         a team's recent games, upcoming games within a date window, and AI-powered predictions.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

# Set up logging
logger = logging.getLogger(__name__)

# Common backend paths used throughout this module
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, ".."))
ML_DATA_DIR = os.path.join(PROJECT_ROOT, "nba_ml_data")
MODELS_PATH = os.path.join(ML_DATA_DIR, "models")

from ..services.nba_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_team_last_games,
    get_upcoming_games,
    get_today_games,
    get_standings,
)

# Import NBA ML system components
try:
    from nba_ml import (
        NBAMLPredictor,
        NBAMLPipeline,
        get_training_status,
        mark_training_complete,
        mark_training_failed,
        mark_training_start,
    )
    ML_AVAILABLE = True
except ImportError as exc:
    logging.warning(f"NBA ML components not available: {exc}")
    ML_AVAILABLE = False

# Blueprint for NBA-related routes; mounted by the app factory at /api/v1/nba
bp = Blueprint("nba", __name__)

# Note: Legacy /predict/<game_id> endpoint removed. Use /predictions/game/<game_id> instead.


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


# ===============================================
# NBA ML PREDICTION ENDPOINTS
# ===============================================

@bp.get("/predictions/status")
def nba_ml_status():
    """Check if NBA ML system is available and get model information."""
    if not ML_AVAILABLE:
        return jsonify({
            "status": "unavailable",
            "message": "NBA ML system is not available. Please check if models are trained.",
            "ml_available": False
        }), 503
    
    try:
        # Check if models exist
        models_exist = os.path.exists(MODELS_PATH) and len(os.listdir(MODELS_PATH)) > 0

        # Get cache stats
        predictor = NBAMLPredictor(data_dir=ML_DATA_DIR)
        cache_stats = predictor.cache.get_cache_stats()
        
        training_status = get_training_status() if ML_AVAILABLE else {}

        return jsonify({
            "status": "available" if models_exist else "models_not_found",
            "message": "NBA ML system is ready" if models_exist else "Models need to be trained",
            "ml_available": ML_AVAILABLE,
            "models_trained": models_exist,
            "models_path": MODELS_PATH,
            "cache_stats": cache_stats,
            "timestamp": datetime.now().isoformat(),
            "training_status": training_status
        })
    except Exception as e:
        training_status = get_training_status() if ML_AVAILABLE else {}
        return jsonify({
            "status": "error",
            "message": f"Error checking ML system status: {str(e)}",
            "ml_available": False,
            "training_status": training_status
        }), 500


@bp.post("/predictions/cache/clear")
def clear_prediction_cache():
    """Clear all cached predictions."""
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        predictor = NBAMLPredictor(data_dir=ML_DATA_DIR)
        predictor.cache.clear_all()
        return jsonify({
            "message": "Prediction cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": f"Error clearing cache: {str(e)}"}), 500


@bp.post("/predictions/cache/clear-expired")
def clear_expired_cache():
    """Clear only expired cache entries."""
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        predictor = NBAMLPredictor(data_dir=ML_DATA_DIR)
        predictor.cache.clear_expired()
        cache_stats = predictor.cache.get_cache_stats()
        return jsonify({
            "message": "Expired cache entries cleared",
            "cache_stats": cache_stats,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": f"Error clearing expired cache: {str(e)}"}), 500


@bp.get("/predictions/games")
def nba_game_predictions():
    """Get game outcome predictions for upcoming games.
    
    Query params:
        days_ahead (int): Number of days ahead to predict (default: 1, max: 7)
        include_details (bool): Include detailed prediction info (default: false)
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        days_ahead = int(request.args.get('days_ahead', 1))
        include_details = request.args.get('include_details', 'false').lower() == 'true'
        
        # Validate days_ahead parameter
        if days_ahead < 1 or days_ahead > 7:
            return jsonify({"error": "days_ahead must be between 1 and 7"}), 400
        
        # Initialize predictor
        predictor = NBAMLPredictor(data_dir=ML_DATA_DIR)
        payload = predictor.get_prediction_payload(
            days_ahead=days_ahead,
            include_details=include_details,
        )

        if payload is None:
            return jsonify({
                "message": "No upcoming games found for prediction",
                "days_ahead": days_ahead,
                "predictions": []
            })

        return jsonify(payload)
        
    except Exception as e:
        return jsonify({"error": f"Error generating game predictions: {str(e)}"}), 500





@bp.get("/predictions/game/<game_id>")
def nba_game_prediction_detail(game_id: str):
    """Get detailed predictions for a specific game.
    
    Path params:
        game_id (str): The specific game ID to get predictions for
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        # Initialize predictor
        predictor = NBAMLPredictor(data_dir=ML_DATA_DIR)
        
        # Generate predictions for upcoming games
        predictions = predictor.generate_comprehensive_predictions(days_ahead=7)  # Check up to 7 days
        
        if not predictions:
            return jsonify({"error": "No upcoming games found"}), 404
        
        # Find the specific game
        game_outcome = None
        
        for game in predictions.get('game_outcomes', []):
            if game.get('game_id') == game_id:
                game_outcome = game
                break
        
        if not game_outcome:
            return jsonify({"error": f"Game {game_id} not found in upcoming predictions"}), 404
        
        # Build detailed response
        response = {
            "game_id": game_id,
            "game_date": game_outcome.get('game_date'),
            "prediction_timestamp": game_outcome.get('prediction_timestamp'),
            "game_outcome": {
                "home_team_id": game_outcome.get('home_team_id'),
                "away_team_id": game_outcome.get('away_team_id'),
                "predicted_winner": game_outcome.get('predicted_winner'),
                "confidence": round(game_outcome.get('confidence', 0), 3),
                "home_win_probability": round(game_outcome.get('home_team_win_probability', 0), 3),
                "away_win_probability": round(game_outcome.get('away_team_win_probability', 0), 3),
                "decision_factors": game_outcome.get('decision_factors', [])
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"Error getting game prediction details: {str(e)}"}), 500


@bp.post("/predictions/train")
def nba_train_models():
    """Train or retrain the NBA ML models.
    
    JSON body (optional):
        seasons (list): List of seasons to train on (e.g., ["2022-23", "2023-24"])
        force_retrain (bool): Force retraining even if models exist (default: false)
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    request_data = {}
    seasons = ['2023-24']
    models_exist = False

    try:
        request_data = request.get_json() or {}
        seasons = request_data.get('seasons', ['2023-24'])  # Default to most recent season
        force_retrain = request_data.get('force_retrain', False)
        
        # Check if models already exist
        models_exist = os.path.exists(MODELS_PATH) and len(os.listdir(MODELS_PATH)) > 0
        
        # Guard against overlapping training runs
        current_training_status = get_training_status()
        if current_training_status.get('is_training'):
            return jsonify({
                "error": "A training job is already running",
                "training_status": current_training_status
            }), 409

        if models_exist and not force_retrain:
            return jsonify({
                "message": "Models already exist. Use force_retrain=true to retrain.",
                "models_path": MODELS_PATH,
                "force_retrain_required": True
            }), 400
        
        # Initialize training pipeline
        pipeline = NBAMLPipeline(data_dir=ML_DATA_DIR)
        
        # Start training (this might take a while)
        training_start = datetime.now()

        mark_training_start({
            "requested_seasons": list(seasons),
            "models_path": MODELS_PATH,
        })
        
        # Execute training pipeline
        results = pipeline.run_full_pipeline()
        
        training_end = datetime.now()
        training_duration = (training_end - training_start).total_seconds()
        
        # Determine success based on pipeline summary status
        status = (
            isinstance(results, dict)
            and results.get('pipeline_summary', {}).get('status') == 'completed_successfully'
        )

        if status:
            training_status = mark_training_complete({
                "training_duration_seconds": round(training_duration, 2),
                "requested_seasons": list(seasons),
                "models_path": MODELS_PATH,
            })
            return jsonify({
                "message": "NBA ML models trained successfully",
                "training_start": training_start.isoformat(),
                "training_end": training_end.isoformat(),
                "training_duration_seconds": round(training_duration, 2),
                "models_path": MODELS_PATH,
                "seasons_trained": seasons,
                "training_status": training_status
            })
        else:
            training_status = mark_training_failed(
                "Pipeline did not complete successfully",
                {
                    "training_duration_seconds": round(training_duration, 2),
                    "requested_seasons": list(seasons),
                    "models_path": MODELS_PATH,
                }
            )
            return jsonify({
                "error": "Model training failed. Check logs for details.",
                "training_duration_seconds": round(training_duration, 2),
                "training_status": training_status
            }), 500
            
    except Exception as e:
        training_metadata = {
            "requested_seasons": list(seasons),
            "models_path": MODELS_PATH,
        }

        training_status = mark_training_failed(str(e), training_metadata) if ML_AVAILABLE else {}

        return jsonify({
            "error": f"Error during model training: {str(e)}",
            "message": "Check server logs for detailed error information",
            "training_status": training_status
        }), 500


@bp.get("/predictions/models/info")
def nba_models_info():
    """Get information about trained NBA ML models."""
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        if not os.path.exists(MODELS_PATH):
            return jsonify({
                "models_exist": False,
                "message": "No models directory found. Models need to be trained."
            })
        
        # Get model files
        model_files = [f for f in os.listdir(MODELS_PATH) if f.endswith('.pkl')]
        
        if not model_files:
            return jsonify({
                "models_exist": False,
                "message": "No trained models found. Models need to be trained."
            })
        
        # Get model information
        model_info = {}
        for model_file in model_files:
            file_path = os.path.join(MODELS_PATH, model_file)
            stat_info = os.stat(file_path)
            model_info[model_file] = {
                "file_size_bytes": stat_info.st_size,
                "created_timestamp": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                "modified_timestamp": datetime.fromtimestamp(stat_info.st_mtime).isoformat()
            }
        
        # Check for preprocessors (saved under models/preprocessors)
        preprocessors_path = os.path.join(MODELS_PATH, 'preprocessors')
        preprocessor_files = []
        if os.path.exists(preprocessors_path):
            preprocessor_files = [f for f in os.listdir(preprocessors_path) if f.endswith('.pkl')]
        
        return jsonify({
            "models_exist": True,
            "models_path": MODELS_PATH,
            "total_models": len(model_files),
            "total_preprocessors": len(preprocessor_files),
            "models": model_info,
            "preprocessors": preprocessor_files,
            "system_ready": len(model_files) > 0 and len(preprocessor_files) > 0
        })
        
    except Exception as e:
        return jsonify({"error": f"Error getting model information: {str(e)}"}), 500


@bp.delete("/predictions/models")
def nba_delete_models():
    """Delete all trained NBA ML models and preprocessors.
    
    Query params:
        confirm (str): Must be 'yes' to confirm deletion
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    confirm = request.args.get('confirm', '').lower()
    if confirm != 'yes':
        return jsonify({
            "error": "Deletion not confirmed. Add ?confirm=yes to delete all models."
        }), 400
    
    try:
        import shutil
        
        deleted_items = []
        
        # Delete models directory
        if os.path.exists(MODELS_PATH):
            shutil.rmtree(MODELS_PATH)
            deleted_items.append('models')
        
        # Delete preprocessors directory  
        preprocessors_path = os.path.join(ML_DATA_DIR, 'preprocessors')
        if os.path.exists(preprocessors_path):
            shutil.rmtree(preprocessors_path)
            deleted_items.append('preprocessors')
        
        # Delete cached data (optional - keep raw data)
        # cache_path = os.path.join(ML_DATA_DIR, 'cache')
        # if os.path.exists(cache_path):
        #     shutil.rmtree(cache_path)
        #     deleted_items.append('cache')
        
        return jsonify({
            "message": "NBA ML models and preprocessors deleted successfully",
            "deleted_items": deleted_items,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": f"Error deleting models: {str(e)}"}), 500
