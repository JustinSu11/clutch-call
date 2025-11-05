"""
File: app/routes/nba.py
Author: Maaz Haque
Purpose: Exposes NBA endpoints using the free balldontlie API and NBA ML predictions.
         Endpoints return JSON data for games, single-game details, basic box scores (via stats), 
         a team's recent games, upcoming games within a date window, and AI-powered predictions.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

# Add backend directory to path for NBA ML imports
backend_path = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.append(backend_path)

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
    from nba_ml_prediction_service import NBAMLPredictor
    from nba_ml_training_pipeline import NBAMLPipeline
    ML_AVAILABLE = True
except ImportError as e:
    logging.warning(f"NBA ML components not available: {e}")
    ML_AVAILABLE = False

# Blueprint for NBA-related routes; mounted by the app factory at /api/v1/nba
bp = Blueprint("nba", __name__)


@bp.get("/games")
def nba_games():
    """List games with optional filters.

    Query params:
        season (str): Season year (e.g., 2024)
        team_id (str): Team ID filter
        page (int): Pagination page (default 1)
        per_page (int): Items per page (default 25)
    """
    season = request.args.get("season")
    team_id = request.args.get("team_id")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 25))
    data = get_games(season=season, team_id=team_id, page=page, per_page=per_page)
    return data


@bp.get("/game/<game_id>")
def nba_game_by_id(game_id: str):
    """Fetch a single game by its balldontlie game ID."""
    return get_game_by_id(game_id)


@bp.get("/game/<game_id>/boxscore")
def nba_box_score(game_id: str):
    """Fetch basic per-player stats for the specified game."""
    return get_box_score(game_id)


@bp.get("/teams/<int:team_id>/last")
def nba_team_last(team_id: int):
    """Get a team's recent games.

    Query params:
        n (int): Number of recent games to return (default 5)
        season (str): Optional season filter (e.g., 2024)
    """
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
        models_path = os.path.join(backend_path, 'nba_ml_data', 'models')
        models_exist = os.path.exists(models_path) and len(os.listdir(models_path)) > 0
        
        return jsonify({
            "status": "available" if models_exist else "models_not_found",
            "message": "NBA ML system is ready" if models_exist else "Models need to be trained",
            "ml_available": ML_AVAILABLE,
            "models_trained": models_exist,
            "models_path": models_path,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error checking ML system status: {str(e)}",
            "ml_available": False
        }), 500


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
        predictor = NBAMLPredictor()
        
        # Generate predictions
        predictions = predictor.generate_comprehensive_predictions(days_ahead=days_ahead)
        
        if not predictions:
            return jsonify({
                "message": "No upcoming games found for prediction",
                "days_ahead": days_ahead,
                "predictions": []
            })
        
        # Format response
        response_data = {
            "prediction_date": datetime.now().isoformat(),
            "days_ahead": days_ahead,
            "games_count": len(predictions.get('game_outcomes', [])),
            "games": []
        }
        
        # Process game predictions
        for game in predictions.get('game_outcomes', []):
            game_data = {
                "game_id": game.get('game_id'),
                "game_date": game.get('game_date'),
                "home_team_id": game.get('home_team_id'),
                "away_team_id": game.get('away_team_id'),
                "predicted_winner": game.get('predicted_winner'),
                "confidence": round(game.get('confidence', 0), 3),
                "home_win_probability": round(game.get('home_team_win_probability', 0), 3),
                "away_win_probability": round(game.get('away_team_win_probability', 0), 3),
                "decision_factors": game.get('decision_factors', [])
            }
            
            if include_details:
                game_data['prediction_timestamp'] = game.get('prediction_timestamp')
                
            response_data['games'].append(game_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({"error": f"Error generating game predictions: {str(e)}"}), 500


@bp.get("/predictions/players")
def nba_player_predictions():
    """Get individual player performance predictions for upcoming games.
    
    Query params:
        days_ahead (int): Number of days ahead to predict (default: 1, max: 7)
        game_id (str): Specific game ID to get player predictions for
        team_id (int): Filter predictions for specific team
        min_points (float): Minimum predicted points threshold
        top_n (int): Return top N performers by predicted points
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        days_ahead = int(request.args.get('days_ahead', 1))
        game_id = request.args.get('game_id')
        team_id = request.args.get('team_id', type=int)
        min_points = request.args.get('min_points', type=float)
        top_n = request.args.get('top_n', type=int)
        
        # Validate parameters
        if days_ahead < 1 or days_ahead > 7:
            return jsonify({"error": "days_ahead must be between 1 and 7"}), 400
        
        # Initialize predictor
        predictor = NBAMLPredictor()
        
        # Generate predictions
        predictions = predictor.generate_comprehensive_predictions(days_ahead=days_ahead)
        
        if not predictions:
            return jsonify({
                "message": "No upcoming games found for player predictions",
                "predictions": []
            })
        
        # Process player predictions
        all_player_predictions = []
        
        for game in predictions.get('player_performances', []):
            game_info = {
                "game_id": game.get('game_id'),
                "game_date": game.get('game_date'),
                "home_team_id": game.get('home_team_id'),
                "away_team_id": game.get('away_team_id')
            }
            
            # Process home team players
            for player in game.get('home_team_predictions', []):
                player_data = {
                    **game_info,
                    "team_type": "home",
                    "team_id": game.get('home_team_id'),
                    "player_id": player.get('player_id'),
                    "player_name": player.get('player_name'),
                    "position": player.get('position'),
                    "predicted_points": round(player.get('predicted_points', 0), 1),
                    "predicted_assists": round(player.get('predicted_assists', 0), 1),
                    "predicted_rebounds": round(player.get('predicted_rebounds', 0), 1),
                    "decision_factors": player.get('decision_factors', {})
                }
                all_player_predictions.append(player_data)
            
            # Process away team players
            for player in game.get('away_team_predictions', []):
                player_data = {
                    **game_info,
                    "team_type": "away", 
                    "team_id": game.get('away_team_id'),
                    "player_id": player.get('player_id'),
                    "player_name": player.get('player_name'),
                    "position": player.get('position'),
                    "predicted_points": round(player.get('predicted_points', 0), 1),
                    "predicted_assists": round(player.get('predicted_assists', 0), 1),
                    "predicted_rebounds": round(player.get('predicted_rebounds', 0), 1),
                    "decision_factors": player.get('decision_factors', {})
                }
                all_player_predictions.append(player_data)
        
        # Apply filters
        filtered_predictions = all_player_predictions
        
        if game_id:
            filtered_predictions = [p for p in filtered_predictions if p['game_id'] == game_id]
        
        if team_id:
            filtered_predictions = [p for p in filtered_predictions if p['team_id'] == team_id]
        
        if min_points:
            filtered_predictions = [p for p in filtered_predictions if p['predicted_points'] >= min_points]
        
        # Sort by predicted points (descending)
        filtered_predictions.sort(key=lambda x: x['predicted_points'], reverse=True)
        
        # Apply top_n filter
        if top_n and top_n > 0:
            filtered_predictions = filtered_predictions[:top_n]
        
        return jsonify({
            "prediction_date": datetime.now().isoformat(),
            "days_ahead": days_ahead,
            "total_predictions": len(filtered_predictions),
            "filters_applied": {
                "game_id": game_id,
                "team_id": team_id,
                "min_points": min_points,
                "top_n": top_n
            },
            "predictions": filtered_predictions
        })
        
    except Exception as e:
        return jsonify({"error": f"Error generating player predictions: {str(e)}"}), 500


@bp.get("/predictions/game/<game_id>")
def nba_game_prediction_detail(game_id: str):
    """Get detailed predictions for a specific game including both game outcome and player performances.
    
    Path params:
        game_id (str): The specific game ID to get predictions for
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        # Initialize predictor
        predictor = NBAMLPredictor()
        
        # Generate predictions for upcoming games
        predictions = predictor.generate_comprehensive_predictions(days_ahead=7)  # Check up to 7 days
        
        if not predictions:
            return jsonify({"error": "No upcoming games found"}), 404
        
        # Find the specific game
        game_outcome = None
        game_players = None
        
        for game in predictions.get('game_outcomes', []):
            if game.get('game_id') == game_id:
                game_outcome = game
                break
        
        for game in predictions.get('player_performances', []):
            if game.get('game_id') == game_id:
                game_players = game
                break
        
        if not game_outcome or not game_players:
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
            },
            "player_predictions": {
                "home_team": game_players.get('home_team_predictions', []),
                "away_team": game_players.get('away_team_predictions', [])
            },
            "summary": {
                "total_players": len(game_players.get('home_team_predictions', [])) + len(game_players.get('away_team_predictions', [])),
                "home_players": len(game_players.get('home_team_predictions', [])),
                "away_players": len(game_players.get('away_team_predictions', []))
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"Error getting game prediction details: {str(e)}"}), 500


@bp.get("/predictions/top-performers")
def nba_top_performers():
    """Get predicted top performers across all upcoming games.
    
    Query params:
        days_ahead (int): Number of days ahead to analyze (default: 1, max: 7)
        stat (str): Stat to rank by - 'points', 'assists', 'rebounds' (default: points)
        limit (int): Number of top performers to return (default: 10, max: 50)
        min_threshold (float): Minimum value threshold for the selected stat
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        days_ahead = int(request.args.get('days_ahead', 1))
        stat = request.args.get('stat', 'points').lower()
        limit = int(request.args.get('limit', 10))
        min_threshold = request.args.get('min_threshold', type=float, default=0)
        
        # Validate parameters
        if days_ahead < 1 or days_ahead > 7:
            return jsonify({"error": "days_ahead must be between 1 and 7"}), 400
        
        if stat not in ['points', 'assists', 'rebounds']:
            return jsonify({"error": "stat must be 'points', 'assists', or 'rebounds'"}), 400
        
        if limit < 1 or limit > 50:
            return jsonify({"error": "limit must be between 1 and 50"}), 400
        
        # Initialize predictor
        predictor = NBAMLPredictor()
        
        # Generate predictions
        predictions = predictor.generate_comprehensive_predictions(days_ahead=days_ahead)
        
        if not predictions:
            return jsonify({
                "message": "No upcoming games found",
                "top_performers": []
            })
        
        # Collect all player predictions
        all_players = []
        stat_key = f'predicted_{stat}'
        
        for game in predictions.get('player_predictions', []):
            game_info = {
                "game_id": game.get('game_id'),
                "game_date": game.get('game_date'),
                "home_team_id": game.get('home_team_id'),
                "away_team_id": game.get('away_team_id')
            }
            
            # Process all players from both teams
            for team_key, team_type in [('home_team_predictions', 'home'), ('away_team_predictions', 'away')]:
                for player in game.get(team_key, []):
                    stat_value = player.get(stat_key, 0)
                    if stat_value >= min_threshold:
                        player_data = {
                            **game_info,
                            "team_type": team_type,
                            "team_id": game.get(f'{team_type}_team_id'),
                            "player_id": player.get('player_id'),
                            "player_name": player.get('player_name'),
                            "position": player.get('position'),
                            "predicted_points": round(player.get('predicted_points', 0), 1),
                            "predicted_assists": round(player.get('predicted_assists', 0), 1),
                            "predicted_rebounds": round(player.get('predicted_rebounds', 0), 1),
                            f"predicted_{stat}": round(stat_value, 1)
                        }
                        all_players.append(player_data)
        
        # Sort by the selected stat (descending) and limit results
        all_players.sort(key=lambda x: x[stat_key], reverse=True)
        top_performers = all_players[:limit]
        
        return jsonify({
            "prediction_date": datetime.now().isoformat(),
            "days_ahead": days_ahead,
            "stat_analyzed": stat,
            "min_threshold": min_threshold,
            "total_qualified_players": len(all_players),
            "returned_count": len(top_performers),
            "top_performers": top_performers
        })
        
    except Exception as e:
        return jsonify({"error": f"Error getting top performers: {str(e)}"}), 500


@bp.post("/predictions/train")
def nba_train_models():
    """Train or retrain the NBA ML models.
    
    JSON body (optional):
        seasons (list): List of seasons to train on (e.g., ["2022-23", "2023-24"])
        force_retrain (bool): Force retraining even if models exist (default: false)
    """
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        request_data = request.get_json() or {}
        seasons = request_data.get('seasons', ['2023-24'])  # Default to most recent season
        force_retrain = request_data.get('force_retrain', False)
        
        # Check if models already exist
        models_path = os.path.join(backend_path, 'nba_ml_data', 'models')
        models_exist = os.path.exists(models_path) and len(os.listdir(models_path)) > 0
        
        if models_exist and not force_retrain:
            return jsonify({
                "message": "Models already exist. Use force_retrain=true to retrain.",
                "models_path": models_path,
                "force_retrain_required": True
            }), 400
        
        # Initialize training pipeline
        pipeline = NBAMLPipeline()
        
        # Start training (this might take a while)
        training_start = datetime.now()
        
        # Execute training pipeline
        success = pipeline.run_full_pipeline()
        
        training_end = datetime.now()
        training_duration = (training_end - training_start).total_seconds()
        
        if success:
            return jsonify({
                "message": "NBA ML models trained successfully",
                "training_start": training_start.isoformat(),
                "training_end": training_end.isoformat(),
                "training_duration_seconds": round(training_duration, 2),
                "models_path": models_path,
                "seasons_trained": seasons
            })
        else:
            return jsonify({
                "error": "Model training failed. Check logs for details.",
                "training_duration_seconds": round(training_duration, 2)
            }), 500
            
    except Exception as e:
        return jsonify({
            "error": f"Error during model training: {str(e)}",
            "message": "Check server logs for detailed error information"
        }), 500


@bp.get("/predictions/models/info")
def nba_models_info():
    """Get information about trained NBA ML models."""
    if not ML_AVAILABLE:
        return jsonify({"error": "NBA ML system is not available"}), 503
    
    try:
        models_path = os.path.join(backend_path, 'nba_ml_data', 'models')
        
        if not os.path.exists(models_path):
            return jsonify({
                "models_exist": False,
                "message": "No models directory found. Models need to be trained."
            })
        
        # Get model files
        model_files = [f for f in os.listdir(models_path) if f.endswith('.pkl')]
        
        if not model_files:
            return jsonify({
                "models_exist": False,
                "message": "No trained models found. Models need to be trained."
            })
        
        # Get model information
        model_info = {}
        for model_file in model_files:
            file_path = os.path.join(models_path, model_file)
            stat_info = os.stat(file_path)
            model_info[model_file] = {
                "file_size_bytes": stat_info.st_size,
                "created_timestamp": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                "modified_timestamp": datetime.fromtimestamp(stat_info.st_mtime).isoformat()
            }
        
        # Check for preprocessors
        preprocessors_path = os.path.join(backend_path, 'nba_ml_data', 'preprocessors')
        preprocessor_files = []
        if os.path.exists(preprocessors_path):
            preprocessor_files = [f for f in os.listdir(preprocessors_path) if f.endswith('.pkl')]
        
        return jsonify({
            "models_exist": True,
            "models_path": models_path,
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
        models_path = os.path.join(backend_path, 'nba_ml_data', 'models')
        if os.path.exists(models_path):
            shutil.rmtree(models_path)
            deleted_items.append('models')
        
        # Delete preprocessors directory  
        preprocessors_path = os.path.join(backend_path, 'nba_ml_data', 'preprocessors')
        if os.path.exists(preprocessors_path):
            shutil.rmtree(preprocessors_path)
            deleted_items.append('preprocessors')
        
        # Delete cached data (optional - keep raw data)
        # cache_path = os.path.join(backend_path, 'nba_ml_data', 'cache')
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
