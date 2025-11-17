"""
NBA ML Prediction Service
Real-time prediction service for NBA games and player performance
"""

import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
import warnings
warnings.filterwarnings('ignore')

# Import our custom modules
from .data_collector import NBADataCollector
from .preprocessor import NBADataPreprocessor
from .prediction_cache import NBAMLPredictionCache

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
        self.feature_directions: Dict[str, float] = {}
        
        # Preprocessors
        self.preprocessor = NBADataPreprocessor(data_dir)
        self.data_collector = NBADataCollector(data_dir)
        
        # Prediction cache
        self.cache = NBAMLPredictionCache(os.path.join(data_dir, 'predictions_cache.db'))
        
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
                logger.warning("❌ Game outcome model not found - initiating model training...")
                self._train_model_if_not_found()
            
            # Load preprocessors
            try:
                self.preprocessor.load_preprocessors()
                logger.info("✅ Preprocessors loaded")
            except Exception as e:
                logger.warning(f"❌ Could not load preprocessors: {e}")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def _train_model_if_not_found(self):
        """Train the model if it doesn't exist"""
        try:
            logger.info("🚀 Starting automatic model training...")
            from .training_pipeline import NBAMLPipeline
            
            # Create and run training pipeline
            pipeline = NBAMLPipeline(data_dir=self.data_dir, force_retrain=True)
            results = pipeline.run_full_pipeline(
                seasons=None,  # Will use default seasons
                epochs_game=50
            )
            
            # Check if training was successful
            if results.get('model_training', {}).get('status') == 'success':
                logger.info("✅ Model training completed successfully")
                # Reload the newly trained model
                game_model_path = os.path.join(self.models_dir, 'game_outcome_model.pkl')
                if os.path.exists(game_model_path):
                    self.game_model = joblib.load(game_model_path)
                    logger.info("✅ Newly trained model loaded")
                else:
                    logger.error("❌ Model file not found after training")
            else:
                logger.error(f"❌ Model training failed: {results}")
                
        except Exception as e:
            logger.error(f"❌ Error during automatic model training: {e}")
            logger.error("Please run the training pipeline manually to create the model")
    
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
                # Get latest season data (use most recent available, not necessarily current season)
                if not team_stats.empty and 'SEASON' in team_stats.columns:
                    latest_season = team_stats['SEASON'].max()
                    current_team_stats = team_stats[team_stats['SEASON'] == latest_season]
                    logger.info(f"Using team stats from season: {latest_season} ({len(current_team_stats)} teams)")
                else:
                    logger.warning("No SEASON column or empty team stats")
                    current_team_stats = pd.DataFrame()
            else:
                logger.warning(f"Team stats file not found: {team_stats_file}")
                current_team_stats = pd.DataFrame()
            
            # Load games for recent form
            games_file = os.path.join(processed_dir, 'all_games.csv')
            if os.path.exists(games_file):
                recent_games = pd.read_csv(games_file)
                # Use historical games to build form metrics; filter handled later per matchup
                recent_games['GAME_DATE'] = pd.to_datetime(recent_games['GAME_DATE'])
            else:
                logger.warning("No recent games found")
                recent_games = pd.DataFrame()
            
            # Prepare features for each game
            game_features = []
            
            # Log available team IDs for debugging
            if not current_team_stats.empty and 'TEAM_ID' in current_team_stats.columns:
                available_team_ids = current_team_stats['TEAM_ID'].unique()
                logger.info(f"Available team IDs in stats: {available_team_ids[:10]}... (total: {len(available_team_ids)})")
            
            # Ensure game dates are datetime for downstream calculations
            game_date_col = None
            if 'game_date' in upcoming_games.columns:
                game_date_col = 'game_date'
                upcoming_games[game_date_col] = pd.to_datetime(upcoming_games[game_date_col])
            elif 'GAME_DATE' in upcoming_games.columns:
                game_date_col = 'GAME_DATE'
                upcoming_games[game_date_col] = pd.to_datetime(upcoming_games[game_date_col])

            for _, game in upcoming_games.iterrows():
                home_team_id = game.get('home_team_id')
                away_team_id = game.get('away_team_id')
                raw_game_date = game.get(game_date_col) if game_date_col else None
                
                logger.info(f"Processing game: home_team_id={home_team_id}, away_team_id={away_team_id}")
                
                # Get features for HOME team only (matches training format)
                # During training, the model learns: given a team's stats and IS_HOME flag, predict if they win
                # So we predict from the home team's perspective with IS_HOME=1
                home_stats = self.get_team_features(
                    team_id=home_team_id,
                    team_stats=current_team_stats,
                    recent_games=recent_games,
                    game_date=raw_game_date,
                    is_home=True
                )
                
                # Convert game date to ISO string for downstream serialization
                if isinstance(raw_game_date, (pd.Timestamp, datetime)):
                    display_game_date = raw_game_date.isoformat()
                elif raw_game_date is not None:
                    display_game_date = str(raw_game_date)
                else:
                    display_game_date = ''

                # Create feature row for home team (matching training format exactly)
                game_feature = {
                    'game_id': game.get('game_id', 'unknown'),
                    'game_date': display_game_date,
                    'home_team_id': home_team_id,
                    'away_team_id': away_team_id,
                    **home_stats  # Only home team features, IS_HOME=1
                }
                
                game_features.append(game_feature)
            
            return pd.DataFrame(game_features)
            
        except Exception as e:
            logger.error(f"Error preparing game features: {e}")
            return pd.DataFrame()
    
    def get_team_features(self, team_id: int, team_stats: pd.DataFrame,
                         recent_games: pd.DataFrame, game_date: Optional[Any] = None,
                         is_home: bool = True) -> Dict:
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
        
        # Update with actual season data if available
        if not team_stats.empty and team_id is not None:
            team_data = team_stats[team_stats['TEAM_ID'] == team_id]
            if not team_data.empty:
                stats = team_data.iloc[0]
                logger.info(f"Found team stats for team_id {team_id}: GP={stats.get('GP')}, PTS={stats.get('PTS')}, FG_PCT={stats.get('FG_PCT')}")
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
            else:
                logger.warning(f"No team data found for team_id {team_id} in team_stats")
        else:
            if team_stats.empty:
                logger.warning(f"team_stats DataFrame is empty")
            if team_id is None:
                logger.warning(f"team_id is None")
        
        # Get recent form if available
        if not recent_games.empty and team_id is not None:
            if isinstance(game_date, pd.Timestamp):
                cutoff_date = game_date
            elif isinstance(game_date, str) and game_date:
                cutoff_date = pd.to_datetime(game_date)
            else:
                cutoff_date = datetime.now()

            team_recent = (
                recent_games[recent_games['TEAM_ID'] == team_id]
                .sort_values('GAME_DATE')
            )

            # Only use games that occurred before the matchup we are predicting
            team_recent = team_recent[team_recent['GAME_DATE'] < cutoff_date]

            if not team_recent.empty:
                recent_wins_flag = team_recent['WL'].apply(lambda x: 1 if x == 'W' else 0)

                last_5 = recent_wins_flag.tail(5)
                last_10 = recent_wins_flag.tail(10)

                if not last_5.empty:
                    features['WIN_PCT_LAST_5'] = last_5.mean()
                if not last_10.empty:
                    features['WIN_PCT_LAST_10'] = last_10.mean()

                # Days of rest based on last played game
                last_game_date = team_recent['GAME_DATE'].iloc[-1]
                features['DAYS_REST'] = max((cutoff_date - last_game_date).days, 1)

                # Win streak heading into the matchup
                features['WIN_STREAK'] = self._calculate_current_streak(recent_wins_flag)

                # Rolling feature blocks aligned with training definitions
                for window in [5, 10, 15]:
                    window_games = team_recent.tail(window)
                    if window_games.empty:
                        continue

                    if 'PTS' in window_games.columns:
                        features[f'TEAM_PTS_ROLL_{window}'] = window_games['PTS'].mean()
                    if 'WL' in window_games.columns:
                        features[f'TEAM_WIN_ROLL_{window}'] = window_games['WL'].apply(lambda x: 1 if x == 'W' else 0).mean()
                    if 'FG_PCT' in window_games.columns:
                        features[f'TEAM_FG_PCT_ROLL_{window}'] = window_games['FG_PCT'].mean()
        
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

    def _calculate_current_streak(self, recent_results: pd.Series) -> int:
        """Calculate win/loss streak entering the next game."""
        streak = 0
        for result in recent_results:
            if result:
                streak = streak + 1 if streak >= 0 else 1
            else:
                streak = streak - 1 if streak <= 0 else -1
        return streak
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the game outcome model"""
        if self.game_model is None:
            return {}

        base_feature_columns = [
            'IS_HOME', 'TEAM_PPG', 'TEAM_FG_PCT', 'TEAM_FG3_PCT', 'TEAM_FT_PCT',
            'TEAM_REB_PG', 'TEAM_AST_PG', 'TEAM_TOV_PG', 'TEAM_STL_PG', 'TEAM_BLK_PG',
            'DAYS_REST', 'WIN_PCT_LAST_5', 'WIN_PCT_LAST_10', 'WIN_STREAK'
        ]

        rolling_feature_columns = []
        for window in [5, 10, 15]:
            for base_feature in ['TEAM_PTS', 'TEAM_WIN', 'TEAM_FG_PCT']:
                rolling_feature_columns.append(f'{base_feature}_ROLL_{window}')

        feature_columns = base_feature_columns + rolling_feature_columns
        feature_importance: Dict[str, float] = {}
        self.feature_directions = {}

        # Tree-based models expose feature_importances_
        if hasattr(self.game_model, 'feature_importances_'):
            importances = self.game_model.feature_importances_
            for i, feature in enumerate(feature_columns):
                if i < len(importances):
                    feature_importance[feature] = float(importances[i])
                    self.feature_directions[feature] = 1.0  # direction unavailable for trees

        # Linear models (e.g., logistic regression) expose coef_
        elif hasattr(self.game_model, 'coef_'):
            coefficients = getattr(self.game_model, 'coef_')
            if coefficients is not None:
                coeffs = coefficients[0] if len(coefficients.shape) > 1 else coefficients
                abs_coeffs = np.abs(coeffs)
                total = abs_coeffs.sum()

                for i, feature in enumerate(feature_columns):
                    if i < len(abs_coeffs):
                        importance_value = abs_coeffs[i] if total == 0 else abs_coeffs[i] / total
                        feature_importance[feature] = float(importance_value)
                        self.feature_directions[feature] = float(np.sign(coeffs[i])) if coeffs[i] != 0 else 0.0

        return feature_importance
    
    def get_top_decision_factors(self, feature_values: Dict, top_n: int = 5) -> List[Dict]:
        """Get top factors influencing a prediction based on feature importance and values"""
        feature_importance = self.get_feature_importance()
        
        if not feature_importance:
            return []
        
        # Calculate weighted contributions (importance weighted by feature value impact)
        contributions = []
        total_weighted_importance = 0
        
        for feature, importance in feature_importance.items():
            if feature in feature_values:
                value = feature_values[feature]
                baseline, scale = self._get_feature_baseline(feature)
                delta = value - baseline
                normalized_delta = 0.0 if scale == 0 else delta / scale
                impact = min(abs(normalized_delta), 1.0)

                direction_multiplier = np.sign(delta) if delta != 0 else 0.0
                model_direction = self.feature_directions.get(feature, 1.0)
                combined_direction = direction_multiplier * model_direction

                # Weight importance by impact
                weighted_importance = importance * (1 + impact)
                total_weighted_importance += weighted_importance
                
                contributions.append({
                    'feature_name': feature,
                    'factor': self._format_feature_name(feature),
                    'importance': importance,
                    'value': value,
                    'impact': impact,
                    'weighted_importance': weighted_importance,
                    'direction': combined_direction,
                    'delta': delta
                })
        
        # Normalize contributions to sum to 100%
        for contrib in contributions:
            if total_weighted_importance > 0:
                contrib['contribution'] = contrib['weighted_importance'] / total_weighted_importance
            else:
                contrib['contribution'] = 0
        
        # Sort by contribution and return top N with cleaned output
        contributions.sort(key=lambda x: x['contribution'], reverse=True)
        
        return [
            {
                'factor': c['factor'],
                'importance': float(round(c['importance'], 4)),
                'value': float(round(c['value'], 2)),
                'contribution': float(round(c['contribution'], 4)),
                'impact': float(round(c['impact'], 4)),
                'effect': 'increases win probability' if c['direction'] > 0 else (
                    'decreases win probability' if c['direction'] < 0 else 'neutral'),
                'delta': float(round(c['delta'], 2))
            }
            for c in contributions[:top_n]
        ]

    def _get_feature_baseline(self, feature: str) -> Tuple[float, float]:
        """Return (baseline, scale) pairs used to contextualize feature deviations."""
        if feature == 'IS_HOME':
            return 0.5, 0.5
        if feature in {'TEAM_PPG', 'TEAM_PTS_ROLL_5', 'TEAM_PTS_ROLL_10', 'TEAM_PTS_ROLL_15'}:
            return 110.0, 20.0
        if feature in {'TEAM_FG_PCT', 'TEAM_FG3_PCT', 'TEAM_FG_PCT_ROLL_5', 'TEAM_FG_PCT_ROLL_10', 'TEAM_FG_PCT_ROLL_15'}:
            return 0.45, 0.08
        if feature in {'TEAM_FT_PCT'}:
            return 0.78, 0.1
        if feature in {'TEAM_REB_PG'}:
            return 45.0, 8.0
        if feature in {'TEAM_AST_PG'}:
            return 25.0, 6.0
        if feature in {'TEAM_TOV_PG'}:
            return 14.0, 5.0
        if feature in {'TEAM_STL_PG'}:
            return 8.0, 3.0
        if feature in {'TEAM_BLK_PG'}:
            return 5.0, 3.0
        if feature in {'DAYS_REST'}:
            return 2.0, 3.0
        if feature in {'WIN_PCT_LAST_5', 'WIN_PCT_LAST_10', 'TEAM_WIN_ROLL_5', 'TEAM_WIN_ROLL_10', 'TEAM_WIN_ROLL_15'}:
            return 0.5, 0.5
        if feature == 'WIN_STREAK':
            return 0.0, 5.0
        return 0.0, 10.0
    
    def _format_feature_name(self, feature: str) -> str:
        """Convert feature name to human-readable format"""
        name_mapping = {
            'IS_HOME': 'Home Court Advantage',
            'TEAM_PPG': 'Points Per Game',
            'TEAM_FG_PCT': 'Field Goal Percentage',
            'TEAM_FG3_PCT': 'Three-Point Percentage',
            'TEAM_FT_PCT': 'Free Throw Percentage',
            'TEAM_REB_PG': 'Rebounds Per Game',
            'TEAM_AST_PG': 'Assists Per Game',
            'TEAM_TOV_PG': 'Turnovers Per Game',
            'TEAM_STL_PG': 'Steals Per Game',
            'TEAM_BLK_PG': 'Blocks Per Game',
            'DAYS_REST': 'Days Rest',
            'WIN_PCT_LAST_5': 'Win Rate (Last 5 Games)',
            'WIN_PCT_LAST_10': 'Win Rate (Last 10 Games)',
            'WIN_STREAK': 'Current Win Streak'
        }
        
        # Handle rolling features
        if '_ROLL_' in feature:
            base = feature.split('_ROLL_')[0]
            window = feature.split('_ROLL_')[1]
            base_names = {
                'TEAM_PTS': 'Points',
                'TEAM_WIN': 'Win Rate',
                'TEAM_FG_PCT': 'Field Goal %'
            }
            base_name = base_names.get(base, base)
            return f'{base_name} (Rolling {window} games)'
        
        return name_mapping.get(feature, feature.replace('_', ' ').title())
    
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
            
            logger.info(f"Win probabilities range: {win_probabilities.min():.3f} to {win_probabilities.max():.3f}")
            logger.info(f"Mean confidence: {win_probabilities.mean():.3f}")
            
            for i, (_, game) in enumerate(game_features_df.iterrows()):
                home_win_prob = win_probabilities[i]
                away_win_prob = 1 - home_win_prob
                
                # Get feature values for this game
                feature_values = {col: X.iloc[i][col] for col in feature_columns if col in X.columns}
                
                # Get top decision factors
                decision_factors = self.get_top_decision_factors(feature_values, top_n=5)
                
                # Log decision factors for debugging
                if i == 0:  # Log first game's factors
                    logger.info(f"Sample decision factors for game {game.get('game_id')}:")
                    for factor in decision_factors:
                        logger.info(f"  {factor['factor']}: {factor['contribution']*100:.1f}% (importance: {factor['importance']:.3f}, value: {factor['value']:.2f})")
                
                prediction = {
                    'game_id': game.get('game_id', f'game_{i}'),
                    'game_date': game.get('game_date', ''),
                    'home_team_id': int(game.get('home_team_id', 0)),
                    'away_team_id': int(game.get('away_team_id', 0)),
                    'home_team_win_probability': float(home_win_prob),
                    'away_team_win_probability': float(away_win_prob),
                    'predicted_winner': 'home' if home_win_prob > 0.5 else 'away',
                    'confidence': float(max(home_win_prob, away_win_prob)),
                    'decision_factors': decision_factors,
                    'prediction_timestamp': datetime.now().isoformat()
                }
                
                predictions.append(prediction)
            
            logger.info(f"Generated {len(predictions)} game outcome predictions")
            
        except Exception as e:
            logger.error(f"Error in game outcome prediction: {e}")
        
        return predictions

    def _build_prediction_payload(
        self,
        predictions: Dict[str, Any],
        days_ahead: int,
        include_details: bool,
    ) -> Dict[str, Any]:
        """Normalize predictions into the cached/response payload shape."""

        games_payload: List[Dict[str, Any]] = []
        for game in predictions.get('game_outcomes', []) or []:
            game_payload = {
                "game_id": game.get('game_id'),
                "game_date": game.get('game_date'),
                "home_team_id": game.get('home_team_id'),
                "away_team_id": game.get('away_team_id'),
                "predicted_winner": game.get('predicted_winner'),
                "confidence": round(game.get('confidence', 0.0), 3),
                "home_win_probability": round(game.get('home_team_win_probability', 0.0), 3),
                "away_win_probability": round(game.get('away_team_win_probability', 0.0), 3),
                "decision_factors": game.get('decision_factors', []),
            }

            if include_details:
                game_payload['prediction_timestamp'] = game.get('prediction_timestamp')

            games_payload.append(game_payload)

        payload = {
            "prediction_date": datetime.now().isoformat(),
            "days_ahead": days_ahead,
            "games_count": len(games_payload),
            "games": games_payload,
        }

        return payload

    def refresh_prediction_cache(
        self,
        days_ahead: int = 1,
        include_details: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Force regeneration and caching of predictions for the requested window."""

        logger.info(
            "Refreshing NBA predictions cache (days_ahead=%s, include_details=%s)",
            days_ahead,
            include_details,
        )

        predictions = self.generate_comprehensive_predictions(days_ahead=days_ahead)

        if not isinstance(predictions, dict):
            logger.warning(
                "Prediction generation returned unexpected payload type %s", type(predictions)
            )
            return None

        payload = self._build_prediction_payload(predictions, days_ahead, include_details)

        # Persist payload regardless of game count so future requests can reuse it.
        self.cache.set_game_predictions(days_ahead, include_details, payload)
        logger.info(
            "Cached NBA predictions for days_ahead=%s (%s games)",
            days_ahead,
            payload["games_count"],
        )
        return payload

    def get_prediction_payload(
        self,
        days_ahead: int = 1,
        include_details: bool = False,
        force_refresh: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Return predictions data, optionally forcing a cache refresh."""

        if not force_refresh:
            cached = self.cache.get_game_predictions(days_ahead, include_details)
            if cached:
                if cached.get("games_count", 0) > 0:
                    logger.info(
                        "Serving NBA predictions from cache (days_ahead=%s, include_details=%s)",
                        days_ahead,
                        include_details,
                    )
                    return cached

                logger.info(
                    "Cached NBA predictions are empty; attempting refresh (days_ahead=%s, include_details=%s)",
                    days_ahead,
                    include_details,
                )
                refreshed = self.refresh_prediction_cache(days_ahead=days_ahead, include_details=include_details)
                if refreshed and refreshed.get("games_count", 0) > 0:
                    return refreshed

                logger.info("Refresh still returned no NBA predictions; returning cached response")
                return cached

        return self.refresh_prediction_cache(days_ahead=days_ahead, include_details=include_details)
    
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
                    'summary': 'No upcoming games found'
                }
            
            logger.info(f"Found {len(upcoming_games)} upcoming games")
            
            # Predict game outcomes
            game_outcomes = self.predict_game_outcomes(upcoming_games)
            
            # Compile comprehensive results
            comprehensive_predictions = {
                'prediction_date': datetime.now().isoformat(),
                'prediction_window_days': days_ahead,
                'games_predicted': len(upcoming_games),
                'game_outcomes': game_outcomes,
                'model_info': {
                    'game_model_loaded': self.game_model is not None,
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
                'game_outcomes': []
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
