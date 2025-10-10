"""
NBA ML Prediction Service
Real-time prediction service for NBA games and player performance
"""

import os
import sys
import json
import logging
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our custom modules
from nba_ml_data_collector import NBADataCollector
from nba_ml_preprocessor import NBADataPreprocessor

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBAMLPredictor:
    """NBA Machine Learning Prediction Service"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.models_dir = os.path.join(data_dir, 'models')
        
        # Models
        self.game_model = None
        self.player_models = {}
        
        # Preprocessors
        self.preprocessor = NBADataPreprocessor(data_dir)
        self.data_collector = NBADataCollector(data_dir)
        
        # Load models and preprocessors
        self.load_models()
        
    def load_models(self):
        """Load trained models"""
        logger.info("Loading trained models...")
        
        try:
            # Load game outcome model
            game_model_path = os.path.join(self.models_dir, 'game_outcome_model.pkl')
            if os.path.exists(game_model_path):
                self.game_model = joblib.load(game_model_path)
                logger.info("✅ Game outcome model loaded")
            else:
                logger.warning("❌ Game outcome model not found")
            
            # Load player performance models
            for target in ['points', 'assists', 'rebounds']:
                model_path = os.path.join(self.models_dir, f'{target}_prediction_model.pkl')
                if os.path.exists(model_path):
                    self.player_models[target] = joblib.load(model_path)
                    logger.info(f"✅ {target.title()} prediction model loaded")
                else:
                    logger.warning(f"❌ {target.title()} prediction model not found")
            
            # Load preprocessors
            try:
                self.preprocessor.load_preprocessors()
                logger.info("✅ Preprocessors loaded")
            except Exception as e:
                logger.warning(f"❌ Could not load preprocessors: {e}")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def get_upcoming_games(self, days_ahead: int = 7) -> pd.DataFrame:
        """Get upcoming games for prediction"""
        logger.info(f"Getting upcoming games for next {days_ahead} days...")
        return self.data_collector.get_upcoming_games(days_ahead)
    
    def prepare_game_features(self, upcoming_games: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for upcoming games"""
        logger.info("Preparing game features for prediction...")
        
        # Load latest team stats and form data
        try:
            # Load processed data to get team statistics
            processed_dir = os.path.join(self.data_dir, 'processed')
            
            # Load team stats
            team_stats_file = os.path.join(processed_dir, 'all_team_stats.csv')
            if os.path.exists(team_stats_file):
                team_stats = pd.read_csv(team_stats_file)
                # Get latest season data
                latest_season = team_stats['SEASON'].max()
                current_team_stats = team_stats[team_stats['SEASON'] == latest_season]
            else:
                logger.warning("No team stats found, using default values")
                current_team_stats = pd.DataFrame()
            
            # Load games for recent form
            games_file = os.path.join(processed_dir, 'all_games.csv')
            if os.path.exists(games_file):
                recent_games = pd.read_csv(games_file)
                # Get recent games (last 30 days)
                recent_games['GAME_DATE'] = pd.to_datetime(recent_games['GAME_DATE'])
                cutoff_date = datetime.now() - timedelta(days=30)
                recent_games = recent_games[recent_games['GAME_DATE'] >= cutoff_date]
            else:
                logger.warning("No recent games found")
                recent_games = pd.DataFrame()
            
            # Prepare features for each game
            game_features = []
            
            for _, game in upcoming_games.iterrows():
                home_team_id = game.get('home_team_id')
                away_team_id = game.get('away_team_id')
                
                # Get team stats for both teams
                home_stats = self.get_team_features(home_team_id, current_team_stats, recent_games, is_home=True)
                away_stats = self.get_team_features(away_team_id, current_team_stats, recent_games, is_home=False)
                
                # Combine features
                game_feature = {
                    'game_id': game.get('game_id', 'unknown'),
                    'game_date': game.get('game_date', ''),
                    'home_team_id': home_team_id,
                    'away_team_id': away_team_id,
                    **home_stats,
                    **{f"OPP_{k}": v for k, v in away_stats.items() if k.startswith('TEAM_')}
                }
                
                game_features.append(game_feature)
            
            return pd.DataFrame(game_features)
            
        except Exception as e:
            logger.error(f"Error preparing game features: {e}")
            return pd.DataFrame()
    
    def get_team_features(self, team_id: int, team_stats: pd.DataFrame, 
                         recent_games: pd.DataFrame, is_home: bool = True) -> Dict:
        """Get features for a specific team - MUST match training feature set exactly"""
        
        # Essential game features - MUST match training exactly (23 features)
        # From prepare_game_outcome_features: feature_columns list + rolling features
        base_features = [
            'IS_HOME', 'TEAM_PPG', 'TEAM_FG_PCT', 'TEAM_FG3_PCT', 'TEAM_FT_PCT',
            'TEAM_REB_PG', 'TEAM_AST_PG', 'TEAM_TOV_PG', 'TEAM_STL_PG', 'TEAM_BLK_PG',
            'DAYS_REST', 'WIN_PCT_LAST_5', 'WIN_PCT_LAST_10', 'WIN_STREAK'
        ]
        
        # Rolling features (9 features: 3 base features × 3 windows)
        rolling_features = []
        for window in [5, 10, 15]:
            for base_feature in ['TEAM_PTS', 'TEAM_WIN', 'TEAM_FG_PCT']:
                rolling_features.append(f'{base_feature}_ROLL_{window}')
        
        # Initialize with defaults
        features = {}
        
        # Base features with defaults
        features['IS_HOME'] = 1 if is_home else 0
        features['TEAM_PPG'] = 105.0
        features['TEAM_FG_PCT'] = 0.45
        features['TEAM_FG3_PCT'] = 0.35
        features['TEAM_FT_PCT'] = 0.78
        features['TEAM_REB_PG'] = 45.0
        features['TEAM_AST_PG'] = 25.0
        features['TEAM_TOV_PG'] = 14.0
        features['TEAM_STL_PG'] = 8.0
        features['TEAM_BLK_PG'] = 5.0
        features['DAYS_REST'] = 1
        features['WIN_PCT_LAST_5'] = 0.5
        features['WIN_PCT_LAST_10'] = 0.5
        features['WIN_STREAK'] = 0
        
        # Update with actual data if available
        if not team_stats.empty and team_id is not None:
            team_data = team_stats[team_stats['TEAM_ID'] == team_id]
            if not team_data.empty:
                stats = team_data.iloc[0]
                features.update({
                    'TEAM_PPG': stats.get('PTS', 105.0) / max(stats.get('GP', 1), 1),
                    'TEAM_FG_PCT': stats.get('FG_PCT', 0.45),
                    'TEAM_FG3_PCT': stats.get('FG3_PCT', 0.35),
                    'TEAM_FT_PCT': stats.get('FT_PCT', 0.78),
                    'TEAM_REB_PG': stats.get('REB', 45.0) / max(stats.get('GP', 1), 1),
                    'TEAM_AST_PG': stats.get('AST', 25.0) / max(stats.get('GP', 1), 1),
                    'TEAM_TOV_PG': stats.get('TOV', 14.0) / max(stats.get('GP', 1), 1),
                    'TEAM_STL_PG': stats.get('STL', 8.0) / max(stats.get('GP', 1), 1),
                    'TEAM_BLK_PG': stats.get('BLK', 5.0) / max(stats.get('GP', 1), 1),
                })
        
        # Get recent form if available
        if not recent_games.empty and team_id is not None:
            team_recent = recent_games[recent_games['TEAM_ID'] == team_id].sort_values('GAME_DATE').tail(10)
            if not team_recent.empty:
                wins = sum(1 for w in team_recent['WL'].tail(5) if w == 'W')
                features['WIN_PCT_LAST_5'] = wins / 5
                
                wins_10 = sum(1 for w in team_recent['WL'] if w == 'W')
                features['WIN_PCT_LAST_10'] = wins_10 / len(team_recent)
        
        # Add rolling features - EXACTLY match training
        for window in [5, 10, 15]:
            for base_feature in ['TEAM_PTS', 'TEAM_WIN', 'TEAM_FG_PCT']:
                if base_feature == 'TEAM_PTS':
                    features[f'{base_feature}_ROLL_{window}'] = features.get('TEAM_PPG', 105.0)
                elif base_feature == 'TEAM_WIN':
                    features[f'{base_feature}_ROLL_{window}'] = features.get('WIN_PCT_LAST_10', 0.5)
                elif base_feature == 'TEAM_FG_PCT':
                    features[f'{base_feature}_ROLL_{window}'] = features.get('TEAM_FG_PCT', 0.45)
        
        return features
    
    def predict_game_outcomes(self, upcoming_games: pd.DataFrame) -> List[Dict]:
        """Predict outcomes for upcoming games"""
        logger.info("Predicting game outcomes...")
        
        if self.game_model is None:
            logger.error("No game model loaded")
            return []
        
        # Prepare features
        game_features_df = self.prepare_game_features(upcoming_games)
        
        if game_features_df.empty:
            logger.error("No game features prepared")
            return []
        
        predictions = []
        
        try:
            # Essential game features - MUST match training exactly (23 features)
            base_feature_columns = [
                'IS_HOME', 'TEAM_PPG', 'TEAM_FG_PCT', 'TEAM_FG3_PCT', 'TEAM_FT_PCT',
                'TEAM_REB_PG', 'TEAM_AST_PG', 'TEAM_TOV_PG', 'TEAM_STL_PG', 'TEAM_BLK_PG',
                'DAYS_REST', 'WIN_PCT_LAST_5', 'WIN_PCT_LAST_10', 'WIN_STREAK'
            ]
            
            # Add rolling features (9 features: 3 base features × 3 windows)
            rolling_feature_columns = []
            for window in [5, 10, 15]:
                for base_feature in ['TEAM_PTS', 'TEAM_WIN', 'TEAM_FG_PCT']:
                    rolling_feature_columns.append(f'{base_feature}_ROLL_{window}')
            
            # Complete feature list (14 + 9 = 23 features)
            feature_columns = base_feature_columns + rolling_feature_columns
            
            # Filter available features
            available_features = [col for col in feature_columns if col in game_features_df.columns]
            
            if len(available_features) != len(feature_columns):
                logger.warning(f"Feature mismatch: Expected {len(feature_columns)}, got {len(available_features)}")
                logger.warning(f"Missing features: {set(feature_columns) - set(available_features)}")
                
                # Fill missing features with defaults
                for missing_col in set(feature_columns) - set(available_features):
                    if 'ROLL' in missing_col:
                        game_features_df[missing_col] = 0.5  # Default rolling average
                    elif 'WIN_PCT' in missing_col:
                        game_features_df[missing_col] = 0.5
                    elif 'PCT' in missing_col:
                        game_features_df[missing_col] = 0.45
                    else:
                        game_features_df[missing_col] = 0.0
                available_features = feature_columns
            
            X = game_features_df[available_features].fillna(0)
            
            # Scale features if scaler is available
            if hasattr(self.preprocessor, 'scalers') and 'standard' in self.preprocessor.scalers:
                X_scaled = self.preprocessor.scalers['standard'].transform(X)
            else:
                X_scaled = X.values
            
            # Make predictions
            win_probabilities = self.game_model.predict_proba(X_scaled)[:, 1]  # Probability of home team winning
            
            for i, (_, game) in enumerate(game_features_df.iterrows()):
                home_win_prob = win_probabilities[i]
                away_win_prob = 1 - home_win_prob
                
                prediction = {
                    'game_id': game.get('game_id', f'game_{i}'),
                    'game_date': game.get('game_date', ''),
                    'home_team_id': int(game.get('home_team_id', 0)),
                    'away_team_id': int(game.get('away_team_id', 0)),
                    'home_team_win_probability': float(home_win_prob),
                    'away_team_win_probability': float(away_win_prob),
                    'predicted_winner': 'home' if home_win_prob > 0.5 else 'away',
                    'confidence': float(max(home_win_prob, away_win_prob)),
                    'prediction_timestamp': datetime.now().isoformat()
                }
                
                predictions.append(prediction)
            
            logger.info(f"Generated {len(predictions)} game outcome predictions")
            
        except Exception as e:
            logger.error(f"Error in game outcome prediction: {e}")
        
        return predictions
    
    def get_player_roster(self, team_id: int, season: str = None) -> List[Dict]:
        """Get current roster for a team"""
        try:
            # Try to get roster from processed data first
            processed_dir = os.path.join(self.data_dir, 'processed')
            player_stats_file = os.path.join(processed_dir, 'all_player_stats.csv')
            
            if os.path.exists(player_stats_file):
                player_stats = pd.read_csv(player_stats_file)
                
                # Get latest season players for this team
                latest_season = player_stats['SEASON'].max()
                team_players = player_stats[
                    (player_stats['TEAM_ID'] == team_id) & 
                    (player_stats['SEASON'] == latest_season)
                ]
                
                if not team_players.empty:
                    # Get top players by minutes played
                    team_players = team_players.sort_values('MIN', ascending=False).head(8)
                    
                    roster = []
                    for _, player in team_players.iterrows():
                        roster.append({
                            'player_id': str(int(player['PLAYER_ID'])),
                            'player_name': player.get('PLAYER_NAME', f'Player {player["PLAYER_ID"]}'),
                            'position': player.get('POSITION', 'G'),
                            'minutes_avg': float(player.get('MIN', 25.0))
                        })
                    
                    logger.info(f"Found {len(roster)} players for team {team_id}")
                    return roster
            
            # Fallback to NBA API if no processed data
            from nba_api.stats.endpoints import teamplayerdashboard
            
            # Get current season (2024-25)
            current_season = "2024-25"
            
            team_dashboard = teamplayerdashboard.TeamPlayerDashboard(
                team_id=team_id,
                season=current_season,
                season_type_all_star='Regular Season'
            )
            
            players_df = team_dashboard.get_data_frames()[1]  # Players general data
            
            if not players_df.empty:
                # Get key players (top 8 by minutes)
                key_players = players_df.sort_values('MIN', ascending=False).head(8)
                
                roster = []
                for _, player in key_players.iterrows():
                    roster.append({
                        'player_id': str(int(player['PLAYER_ID'])),
                        'player_name': player['PLAYER_NAME'],
                        'position': 'G',  # Default position
                        'minutes_avg': float(player['MIN'])
                    })
                
                logger.info(f"Found {len(roster)} players for team {team_id} from NBA API")
                return roster
            
        except Exception as e:
            logger.error(f"Error getting roster for team {team_id}: {e}")
        
        # Fallback mock data with real-looking player IDs
        mock_players = [
            {'player_id': f'{team_id}001', 'player_name': 'Star Player', 'position': 'G', 'minutes_avg': 35.0},
            {'player_id': f'{team_id}002', 'player_name': 'Key Forward', 'position': 'F', 'minutes_avg': 32.0},
            {'player_id': f'{team_id}003', 'player_name': 'Center', 'position': 'C', 'minutes_avg': 28.0},
            {'player_id': f'{team_id}004', 'player_name': 'Sixth Man', 'position': 'G', 'minutes_avg': 25.0},
            {'player_id': f'{team_id}005', 'player_name': 'Role Player', 'position': 'F', 'minutes_avg': 22.0},
        ]
        logger.warning(f"Using fallback mock data for team {team_id}")
        return mock_players
    
    def prepare_player_features(self, player_id: str, team_id: int) -> Dict:
        """Prepare features for player performance prediction - MUST match training feature set"""
        # Load latest player stats
        try:
            processed_dir = os.path.join(self.data_dir, 'processed')
            player_stats_file = os.path.join(processed_dir, 'all_player_stats.csv')
            
            if os.path.exists(player_stats_file):
                player_stats = pd.read_csv(player_stats_file)
                # Convert player_id to int properly
                try:
                    player_id_int = int(player_id)
                except:
                    # If player_id is composite like "team_id_player_id", extract player part
                    if '_' in str(player_id):
                        player_id_int = int(str(player_id).split('_')[-1])
                    else:
                        player_id_int = int(str(player_id).replace(str(team_id), ''))
                
                # Get latest season data for player
                latest_season = player_stats['SEASON'].max()
                player_data = player_stats[
                    (player_stats['PLAYER_ID'] == player_id_int) &
                    (player_stats['SEASON'] == latest_season)
                ]
                
                # If no data for latest season, try previous seasons
                if player_data.empty:
                    player_data = player_stats[player_stats['PLAYER_ID'] == player_id_int]
                    if not player_data.empty:
                        # Get most recent season for this player
                        player_data = player_data[player_data['SEASON'] == player_data['SEASON'].max()]
                
                logger.info(f"Player {player_id_int}: Found {len(player_data)} records")
            else:
                player_data = pd.DataFrame()
                logger.warning(f"Player stats file not found: {player_stats_file}")
        except Exception as e:
            logger.error(f"Error loading player data for {player_id}: {e}")
            player_data = pd.DataFrame()
        
        # Essential columns MUST match the training set exactly (13 features)
        essential_columns = [
            'GP', 'MIN', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'REB', 'AST', 'PTS',
            'PPG', 'RPG', 'APG', 'TS_PCT', 'EFG_PCT'
        ]
        
        # Default values for essential features only
        features = {}
        
        if not player_data.empty:
            logger.info(f"Player data found with columns: {list(player_data.columns)}")
            logger.info(f"Player data values: {player_data.iloc[0].to_dict()}")
        else:
            logger.warning(f"No player data found for player_id: {player_id}")
        
        for col in essential_columns:
            if not player_data.empty and col in player_data.columns:
                value = player_data.iloc[0][col]
                # Handle NaN/null values
                if pd.isna(value) or value is None:
                    features[col] = self._get_default_value(col)
                else:
                    features[col] = float(value)
                logger.debug(f"Player feature {col}: {features[col]} (from data)")
            else:
                features[col] = self._get_default_value(col)
                logger.debug(f"Player feature {col}: {features[col]} (default)")
        
        return features
    
    def _get_default_value(self, column: str) -> float:
        """Get default value for a column"""
        defaults = {
            'GP': 50.0,
            'MIN': 25.0,
            'FG_PCT': 0.45,
            'FG3_PCT': 0.35,
            'FT_PCT': 0.80,
            'REB': 5.0,
            'AST': 3.0,
            'PTS': 12.0,
            'PPG': 12.0,
            'RPG': 5.0,
            'APG': 3.0,
            'TS_PCT': 0.55,
            'EFG_PCT': 0.50
        }
        return defaults.get(column, 0.0)
    
    def predict_player_performance(self, upcoming_games: pd.DataFrame) -> List[Dict]:
        """Predict player performance for upcoming games"""
        logger.info("Predicting player performances...")
        
        if not self.player_models:
            logger.error("No player models loaded")
            return []
        
        predictions = []
        
        try:
            for _, game in upcoming_games.iterrows():
                game_predictions = {
                    'game_id': game.get('game_id', 'unknown'),
                    'game_date': game.get('game_date', ''),
                    'home_team_predictions': [],
                    'away_team_predictions': []
                }
                
                # Predict for both teams
                for team_type in ['home', 'away']:
                    team_id = game.get(f'{team_type}_team_id')
                    if team_id is None:
                        continue
                    
                    # Get roster (simplified)
                    roster = self.get_player_roster(team_id)
                    
                    team_predictions = []
                    
                    for player in roster:
                        player_id = player['player_id']
                        player_name = player['player_name']
                        
                        # Prepare player features
                        player_features = self.prepare_player_features(player_id, team_id)
                        
                        # Get feature columns - MUST match training exactly (13 features)
                        essential_columns = [
                            'GP', 'MIN', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'REB', 'AST', 'PTS',
                            'PPG', 'RPG', 'APG', 'TS_PCT', 'EFG_PCT'
                        ]
                        
                        # Use essential columns only
                        feature_columns = essential_columns
                        
                        # Create feature vector with exact same feature set as training
                        X = np.array([[player_features.get(col, 0) for col in feature_columns]])
                        
                        # Scale features if available
                        if hasattr(self.preprocessor, 'scalers') and 'standard' in self.preprocessor.scalers:
                            try:
                                X_scaled = self.preprocessor.scalers['standard'].transform(X)
                            except:
                                X_scaled = X
                        else:
                            X_scaled = X
                        
                        # Predict each stat
                        player_prediction = {
                            'player_id': player_id,
                            'player_name': player_name,
                            'position': player['position']
                        }
                        
                        # Get games played for per-game conversion (from player features)
                        games_played = player_features.get('GP', 72.0)  # Default to ~full season
                        if games_played <= 0:
                            games_played = 72.0  # Safety check
                        
                        for target, model in self.player_models.items():
                            try:
                                # Get season total prediction
                                season_prediction = model.predict(X_scaled)[0]
                                
                                # Convert to per-game average
                                per_game_prediction = season_prediction / games_played
                                
                                # Ensure non-negative predictions
                                per_game_prediction = max(0, per_game_prediction)
                                
                                # Apply reasonable caps for per-game stats
                                if target == 'points':
                                    per_game_prediction = min(per_game_prediction, 50.0)  # Cap at 50 PPG
                                elif target == 'assists':
                                    per_game_prediction = min(per_game_prediction, 20.0)  # Cap at 20 APG
                                elif target == 'rebounds':
                                    per_game_prediction = min(per_game_prediction, 25.0)  # Cap at 25 RPG
                                
                                player_prediction[f'predicted_{target}'] = round(per_game_prediction, 1)
                                
                            except Exception as e:
                                logger.warning(f"Could not predict {target} for {player_name}: {e}")
                                # Use historical per-game averages as fallback
                                fallback_values = {'points': 12.0, 'assists': 3.0, 'rebounds': 5.0}
                                player_prediction[f'predicted_{target}'] = fallback_values.get(target, 0)
                        
                        team_predictions.append(player_prediction)
                    
                    if team_type == 'home':
                        game_predictions['home_team_predictions'] = team_predictions
                    else:
                        game_predictions['away_team_predictions'] = team_predictions
                
                predictions.append(game_predictions)
            
            logger.info(f"Generated player predictions for {len(predictions)} games")
            
        except Exception as e:
            logger.error(f"Error in player performance prediction: {e}")
        
        return predictions
    
    def generate_comprehensive_predictions(self, days_ahead: int = 7) -> Dict:
        """Generate comprehensive predictions for upcoming games"""
        logger.info("Generating comprehensive NBA predictions...")
        
        try:
            # Get upcoming games
            upcoming_games = self.get_upcoming_games(days_ahead)
            
            if upcoming_games.empty:
                logger.warning("No upcoming games found")
                return {
                    'prediction_date': datetime.now().isoformat(),
                    'games_predicted': 0,
                    'game_outcomes': [],
                    'player_performances': [],
                    'summary': 'No upcoming games found'
                }
            
            logger.info(f"Found {len(upcoming_games)} upcoming games")
            
            # Predict game outcomes
            game_outcomes = self.predict_game_outcomes(upcoming_games)
            
            # Predict player performances
            player_performances = self.predict_player_performance(upcoming_games)
            
            # Compile comprehensive results
            comprehensive_predictions = {
                'prediction_date': datetime.now().isoformat(),
                'prediction_window_days': days_ahead,
                'games_predicted': len(upcoming_games),
                'game_outcomes': game_outcomes,
                'player_performances': player_performances,
                'model_info': {
                    'game_model_loaded': self.game_model is not None,
                    'player_models_loaded': list(self.player_models.keys()),
                    'preprocessors_loaded': hasattr(self.preprocessor, 'scalers')
                },
                'summary': f'Predictions generated for {len(upcoming_games)} games over {days_ahead} days'
            }
            
            # Save predictions
            predictions_dir = os.path.join(self.data_dir, 'predictions')
            os.makedirs(predictions_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            predictions_file = os.path.join(predictions_dir, f'nba_predictions_{timestamp}.json')
            
            with open(predictions_file, 'w') as f:
                json.dump(comprehensive_predictions, f, indent=2)
            
            logger.info(f"Predictions saved to: {predictions_file}")
            
            return comprehensive_predictions
            
        except Exception as e:
            logger.error(f"Error generating comprehensive predictions: {e}")
            return {
                'prediction_date': datetime.now().isoformat(),
                'error': str(e),
                'games_predicted': 0,
                'game_outcomes': [],
                'player_performances': []
            }
    
    def print_predictions_summary(self, predictions: Dict):
        """Print a formatted summary of predictions"""
        print("\n" + "=" * 80)
        print("🏀 NBA ML PREDICTIONS SUMMARY")
        print("=" * 80)
        
        print(f"Prediction Date: {predictions.get('prediction_date', 'Unknown')}")
        print(f"Games Predicted: {predictions.get('games_predicted', 0)}")
        
        # Game outcomes
        game_outcomes = predictions.get('game_outcomes', [])
        if game_outcomes:
            print("\n📊 GAME OUTCOME PREDICTIONS:")
            print("-" * 40)
            
            for game in game_outcomes:
                home_prob = game.get('home_team_win_probability', 0)
                away_prob = game.get('away_team_win_probability', 0)
                winner = game.get('predicted_winner', 'unknown')
                confidence = game.get('confidence', 0)
                
                print(f"Game {game.get('game_id', 'N/A')}: {game.get('game_date', 'N/A')}")
                print(f"  Home Team ({game.get('home_team_id', 'N/A')}): {home_prob:.1%}")
                print(f"  Away Team ({game.get('away_team_id', 'N/A')}): {away_prob:.1%}")
                print(f"  Predicted Winner: {winner.title()} (Confidence: {confidence:.1%})")
                print()
        
        # Player performances  
        player_performances = predictions.get('player_performances', [])
        if player_performances:
            print("⭐ TOP PLAYER PERFORMANCE PREDICTIONS:")
            print("-" * 40)
            
            for game_perf in player_performances[:3]:  # Show first 3 games
                print(f"Game {game_perf.get('game_id', 'N/A')}: {game_perf.get('game_date', 'N/A')}")
                
                # Show top performers from each team
                for team_type in ['home_team_predictions', 'away_team_predictions']:
                    team_preds = game_perf.get(team_type, [])
                    if team_preds:
                        top_scorer = max(team_preds, key=lambda x: x.get('predicted_points', 0))
                        print(f"  {team_type.replace('_', ' ').title()}:")
                        print(f"    {top_scorer.get('player_name', 'Unknown')}: "
                              f"{top_scorer.get('predicted_points', 0):.1f} pts, "
                              f"{top_scorer.get('predicted_rebounds', 0):.1f} reb, "
                              f"{top_scorer.get('predicted_assists', 0):.1f} ast")
                print()
        
        print("=" * 80)

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='NBA ML Prediction Service')
    parser.add_argument('--data-dir', default='nba_ml_data', help='Data directory')
    parser.add_argument('--days-ahead', type=int, default=7, help='Days ahead to predict')
    parser.add_argument('--output', help='Output file for predictions (JSON)')
    
    args = parser.parse_args()
    
    # Initialize predictor
    predictor = NBAMLPredictor(data_dir=args.data_dir)
    
    # Generate predictions
    predictions = predictor.generate_comprehensive_predictions(days_ahead=args.days_ahead)
    
    # Print summary
    predictor.print_predictions_summary(predictions)
    
    # Save to output file if specified
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(predictions, f, indent=2)
        print(f"\nPredictions saved to: {args.output}")
    
    return predictions

if __name__ == "__main__":
    predictions = main()