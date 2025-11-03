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
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the game outcome model"""
        if self.game_model is None:
            return {}
        
        # Check if model has feature_importances_ attribute (tree-based models)
        if hasattr(self.game_model, 'feature_importances_'):
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
            importances = self.game_model.feature_importances_
            
            # Create feature importance dictionary
            feature_importance = {}
            for i, feature in enumerate(feature_columns):
                if i < len(importances):
                    feature_importance[feature] = float(importances[i])
            
            return feature_importance
        
        return {}
    
    def get_top_decision_factors(self, feature_values: Dict, top_n: int = 5) -> List[Dict]:
        """Get top factors influencing a prediction based on feature importance and values"""
        feature_importance = self.get_feature_importance()
        
        if not feature_importance:
            return []
        
        # Calculate contribution scores (importance * normalized feature value)
        contributions = []
        for feature, importance in feature_importance.items():
            if feature in feature_values:
                value = feature_values[feature]
                # Normalize value for contribution calculation
                if 'PCT' in feature or 'WIN_PCT' in feature:
                    # Already in 0-1 range
                    normalized_value = value
                elif 'PPG' in feature or 'PTS' in feature:
                    # Points per game - normalize to ~0-1 (typical range 90-120)
                    normalized_value = min(max((value - 90) / 30, 0), 1)
                elif 'REB' in feature or 'AST' in feature:
                    # Per game stats
                    normalized_value = min(value / 50, 1)
                elif 'IS_HOME' in feature:
                    normalized_value = value
                else:
                    # Default normalization
                    normalized_value = min(abs(value) / 10, 1)
                
                contribution_score = importance * normalized_value
                
                contributions.append({
                    'factor': self._format_feature_name(feature),
                    'importance': round(importance, 4),
                    'value': round(value, 2),
                    'contribution': round(contribution_score, 4)
                })
        
        # Sort by contribution and return top N
        contributions.sort(key=lambda x: x['contribution'], reverse=True)
        return contributions[:top_n]
    
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
            
            for i, (_, game) in enumerate(game_features_df.iterrows()):
                home_win_prob = win_probabilities[i]
                away_win_prob = 1 - home_win_prob
                
                # Get feature values for this game
                feature_values = {col: X.iloc[i][col] for col in feature_columns if col in X.columns}
                
                # Get top decision factors
                decision_factors = self.get_top_decision_factors(feature_values, top_n=5)
                
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
    
    def generate_comprehensive_predictions(self, days_ahead: int = 7) -> Dict:
        """Generate predictions for upcoming games"""
        logger.info("Generating NBA game predictions...")
        
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
            
            # Compile results
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