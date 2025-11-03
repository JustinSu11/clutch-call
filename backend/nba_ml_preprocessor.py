"""
NBA ML Data Preprocessing Pipeline
Advanced feature engineering and data preparation for machine learning models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import logging
import os
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split
import joblib
import warnings
warnings.filterwarnings('ignore')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBADataPreprocessor:
    """Advanced NBA data preprocessor for machine learning"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = {
            'game_features': [],
            'team_features': []
        }
        
    def load_raw_data(self) -> Dict[str, pd.DataFrame]:
        """Load all preprocessed raw data"""
        logger.info("Loading raw data files...")
        
        data = {}
        processed_dir = os.path.join(self.data_dir, 'processed')
        
        # Load main datasets
        file_mappings = {
            'games': 'all_games.csv',
            'player_stats': 'all_player_stats.csv', 
            'team_stats': 'all_team_stats.csv',
            'team_info': os.path.join('..', 'teams', 'team_info.csv'),
            'upcoming_games': 'upcoming_games.csv'
        }
        
        for key, filename in file_mappings.items():
            filepath = os.path.join(processed_dir, filename)
            if os.path.exists(filepath):
                data[key] = pd.read_csv(filepath)
                logger.info(f"Loaded {key}: {len(data[key])} records")
            else:
                logger.warning(f"File not found: {filepath}")
                data[key] = pd.DataFrame()
        
        return data
    
    def engineer_team_features(self, team_stats_df: pd.DataFrame, games_df: pd.DataFrame) -> pd.DataFrame:
        """Engineer advanced team features"""
        logger.info("Engineering team features...")
        
        # Basic team stats processing
        team_features = team_stats_df.copy()
        
        # Calculate advanced metrics (with safe division and missing column handling)
        # Estimate possessions if not available
        if 'POSS' not in team_features.columns:
            team_features['POSS'] = team_features.get('FGA', 0) + 0.44 * team_features.get('FTA', 0) - team_features.get('OREB', 0) + team_features.get('TOV', 0)
        
        # Handle missing opponent stats
        if 'OPP_PTS' not in team_features.columns:
            team_features['OPP_PTS'] = team_features.get('PTS', 105)  # Default opponent points
        if 'OPP_REB' not in team_features.columns:
            team_features['OPP_REB'] = team_features.get('REB', 45)  # Default opponent rebounds
        
        # Safe division function
        def safe_divide(numerator, denominator, default=0):
            return np.where(denominator != 0, numerator / denominator, default)
        
        team_features['OFF_RTG'] = safe_divide(team_features['PTS'], team_features['POSS'], 105) * 100
        team_features['DEF_RTG'] = safe_divide(team_features['OPP_PTS'], team_features['POSS'], 105) * 100
        team_features['NET_RTG'] = team_features['OFF_RTG'] - team_features['DEF_RTG']
        team_features['EFG_PCT'] = safe_divide(
            (team_features.get('FGM', 0) + 0.5 * team_features.get('FG3M', 0)), 
            team_features.get('FGA', 1), 0.45
        )
        team_features['TS_PCT'] = safe_divide(
            team_features['PTS'], 
            (2 * (team_features.get('FGA', 1) + 0.44 * team_features.get('FTA', 0))), 0.55
        )
        team_features['AST_TO_RATIO'] = safe_divide(
            team_features.get('AST', 0), team_features.get('TOV', 1), 1.5
        )
        team_features['REB_PCT'] = safe_divide(
            team_features.get('REB', 0), 
            (team_features.get('REB', 0) + team_features.get('OPP_REB', 45)), 0.5
        )
        
        # Four factors (handle missing columns)
        team_features['FOUR_FACTOR_EFG'] = team_features['EFG_PCT']
        team_features['FOUR_FACTOR_TOV'] = team_features.get('TOV_PCT', 0.14)
        team_features['FOUR_FACTOR_OREB'] = team_features.get('OREB_PCT', 0.25)
        team_features['FOUR_FACTOR_FT'] = safe_divide(
            team_features.get('FTA', 0), team_features.get('FGA', 1), 0.2
        )
        
        # Pace and style metrics
        team_features['PACE'] = safe_divide(team_features['POSS'], team_features.get('GP', 1), 100)
        team_features['PIE'] = safe_divide(
            (team_features.get('PTS', 0) + team_features.get('FGM', 0) + team_features.get('FTM', 0) - 
             team_features.get('FGA', 0) - team_features.get('FTA', 0) + team_features.get('DREB', 0) + 
             0.5 * team_features.get('OREB', 0) + team_features.get('AST', 0) + team_features.get('STL', 0) + 
             0.5 * team_features.get('BLK', 0) - team_features.get('PF', 0) - team_features.get('TOV', 0)), 
            team_features.get('GP', 1), 10.0
        )
        
        return team_features
    
    def engineer_player_features(self, player_stats_df: pd.DataFrame) -> pd.DataFrame:
        """Engineer advanced player features"""
        logger.info("Engineering player features...")
        
        player_features = player_stats_df.copy()
        
        # Safe division function for player stats
        def safe_divide_player(numerator, denominator, default=0):
            return np.where((denominator != 0) & (~np.isnan(denominator)), numerator / denominator, default)
        
        # Advanced player metrics
        player_features['PER'] = self.calculate_per(player_features)
        player_features['TS_PCT'] = safe_divide_player(
            player_features['PTS'], 
            (2 * (player_features.get('FGA', 1) + 0.44 * player_features.get('FTA', 0))), 0.55
        )
        player_features['EFG_PCT'] = safe_divide_player(
            (player_features.get('FGM', 0) + 0.5 * player_features.get('FG3M', 0)), 
            player_features.get('FGA', 1), 0.5
        )
        player_features['USG_PCT'] = safe_divide_player(
            ((player_features.get('FGA', 0) + 0.44 * player_features.get('FTA', 0) + player_features.get('TOV', 0)) * 40 * 5), 
            (player_features.get('MIN', 1) * 10), 20.0
        )
        player_features['AST_TO_RATIO'] = safe_divide_player(
            player_features.get('AST', 0), player_features.get('TOV', 1), 1.5
        )
        
        # Per game stats
        player_features['PPG'] = safe_divide_player(player_features['PTS'], player_features.get('GP', 1), 0)
        player_features['RPG'] = safe_divide_player(player_features.get('REB', 0), player_features.get('GP', 1), 0)
        player_features['APG'] = safe_divide_player(player_features.get('AST', 0), player_features.get('GP', 1), 0)
        
        # Per 36 minutes stats
        player_features['PTS_PER_36'] = safe_divide_player(
            (player_features['PTS'] * 36), player_features.get('MIN', 1), 0
        )
        player_features['REB_PER_36'] = safe_divide_player(
            (player_features.get('REB', 0) * 36), player_features.get('MIN', 1), 0
        )
        player_features['AST_PER_36'] = safe_divide_player(
            (player_features.get('AST', 0) * 36), player_features.get('MIN', 1), 0
        )
        
        # Efficiency metrics
        player_features['POINTS_PER_SHOT'] = safe_divide_player(
            player_features['PTS'], 
            (player_features.get('FGA', 1) + 0.44 * player_features.get('FTA', 0)), 1.0
        )
        player_features['SHOOTING_EFF'] = safe_divide_player(
            (player_features.get('FGM', 0) + 0.5 * player_features.get('FG3M', 0)), 
            player_features.get('FGA', 1), 0.5
        )
        
        return player_features
    
    def calculate_per(self, player_df: pd.DataFrame) -> pd.Series:
        """Calculate Player Efficiency Rating (simplified version)"""
        # Simplified PER calculation with safe column access
        per = (player_df.get('PTS', 0) + player_df.get('REB', 0) + player_df.get('AST', 0) + 
               player_df.get('STL', 0) + player_df.get('BLK', 0) - player_df.get('TOV', 0) - 
               (player_df.get('FGA', 0) - player_df.get('FGM', 0)) - 
               (player_df.get('FTA', 0) - player_df.get('FTM', 0))) / np.maximum(player_df.get('GP', 1), 1)
        return pd.Series(per).fillna(15.0)  # Default PER of 15
    
    def create_matchup_features(self, games_df: pd.DataFrame, team_stats_df: pd.DataFrame) -> pd.DataFrame:
        """Create head-to-head matchup features"""
        logger.info("Creating matchup features...")
        
        # Limit games to prevent memory issues
        max_games = 10000  # Limit to recent games
        if len(games_df) > max_games:
            games_df = games_df.tail(max_games)  # Take most recent games
            logger.info(f"Limited to {max_games} most recent games to prevent memory issues")
        
        # Group games by matchups
        games_df['HOME_TEAM'] = games_df['MATCHUP'].str.contains('vs', na=False).astype(int)
        
        matchup_features = []
        
        for _, game in games_df.iterrows():
            team_id = game['TEAM_ID']
            
            # Get team stats for this season
            team_season_stats = team_stats_df[
                (team_stats_df['TEAM_ID'] == team_id) & 
                (team_stats_df['SEASON'] == game['SEASON'])
            ]
            
            if not team_season_stats.empty:
                team_stats = team_season_stats.iloc[0]
                
                # Extract opponent info from matchup
                opponent_abbrev = self.extract_opponent_from_matchup(game['MATCHUP'])
                
                matchup_feature = {
                    'GAME_ID': game['GAME_ID'],
                    'TEAM_ID': team_id,
                    'SEASON': game['SEASON'],
                    'GAME_DATE': game['GAME_DATE'],
                    'IS_HOME': game['HOME_TEAM'],
                    'OPPONENT': opponent_abbrev,
                    'TEAM_WIN': 1 if game['WL'] == 'W' else 0,
                    'TEAM_PTS': game['PTS'],
                    
                    # Team performance features
                    'TEAM_PPG': team_stats.get('PTS', 0) / team_stats.get('GP', 1),
                    'TEAM_FG_PCT': team_stats.get('FG_PCT', 0),
                    'TEAM_FG3_PCT': team_stats.get('FG3_PCT', 0),
                    'TEAM_FT_PCT': team_stats.get('FT_PCT', 0),
                    'TEAM_REB_PG': team_stats.get('REB', 0) / team_stats.get('GP', 1),
                    'TEAM_AST_PG': team_stats.get('AST', 0) / team_stats.get('GP', 1),
                    'TEAM_TOV_PG': team_stats.get('TOV', 0) / team_stats.get('GP', 1),
                    'TEAM_STL_PG': team_stats.get('STL', 0) / team_stats.get('GP', 1),
                    'TEAM_BLK_PG': team_stats.get('BLK', 0) / team_stats.get('GP', 1),
                }
                
                matchup_features.append(matchup_feature)
        
        return pd.DataFrame(matchup_features)
    
    def extract_opponent_from_matchup(self, matchup: str) -> str:
        """Extract opponent abbreviation from matchup string"""
        if 'vs.' in matchup:
            return matchup.split('vs. ')[-1]
        elif '@ ' in matchup:
            return matchup.split('@ ')[-1]
        return ''
    
    def create_rolling_features(self, matchup_df: pd.DataFrame, window_sizes: List[int] = [5, 10, 15]) -> pd.DataFrame:
        """Create rolling average features for teams"""
        logger.info("Creating rolling features...")
        
        rolling_df = matchup_df.copy()
        
        # Sort by team and date
        rolling_df['GAME_DATE'] = pd.to_datetime(rolling_df['GAME_DATE'])
        rolling_df = rolling_df.sort_values(['TEAM_ID', 'GAME_DATE'])
        
        # Features to calculate rolling averages for
        rolling_features = ['TEAM_PTS', 'TEAM_WIN', 'TEAM_PPG', 'TEAM_FG_PCT', 
                           'TEAM_FG3_PCT', 'TEAM_REB_PG', 'TEAM_AST_PG', 'TEAM_TOV_PG']
        
        for window in window_sizes:
            for feature in rolling_features:
                if feature in rolling_df.columns:
                    rolling_df[f'{feature}_ROLL_{window}'] = (
                        rolling_df.groupby('TEAM_ID')[feature]
                        .transform(lambda x: x.rolling(window, min_periods=1).mean())
                    )
        
        return rolling_df
    
    def create_recent_form_features(self, matchup_df: pd.DataFrame) -> pd.DataFrame:
        """Create recent form and momentum features"""
        logger.info("Creating recent form features...")
        
        form_df = matchup_df.copy()
        form_df = form_df.sort_values(['TEAM_ID', 'GAME_DATE'])
        
        # Recent wins (last 5, 10 games)
        for window in [5, 10]:
            form_df[f'WINS_LAST_{window}'] = (
                form_df.groupby('TEAM_ID')['TEAM_WIN']
                .transform(lambda x: x.rolling(window, min_periods=1).sum())
            )
            form_df[f'WIN_PCT_LAST_{window}'] = form_df[f'WINS_LAST_{window}'] / window
        
        # Streak features
        form_df['WIN_STREAK'] = self.calculate_win_streaks(form_df)
        
        # Rest days (simplified - assume 1 day between games on average)
        form_df['DAYS_REST'] = form_df.groupby('TEAM_ID')['GAME_DATE'].diff().dt.days.fillna(3)
        
        return form_df
    
    def calculate_win_streaks(self, df: pd.DataFrame) -> pd.Series:
        """Calculate current win/loss streaks"""
        streaks = []
        
        for team_id in df['TEAM_ID'].unique():
            team_df = df[df['TEAM_ID'] == team_id].sort_values('GAME_DATE')
            team_streaks = []
            
            current_streak = 0
            last_result = None
            
            for _, row in team_df.iterrows():
                if last_result is None:
                    current_streak = 1 if row['TEAM_WIN'] else -1
                elif (row['TEAM_WIN'] and last_result > 0) or (not row['TEAM_WIN'] and last_result < 0):
                    current_streak += 1 if row['TEAM_WIN'] else -1
                else:
                    current_streak = 1 if row['TEAM_WIN'] else -1
                
                team_streaks.append(current_streak)
                last_result = current_streak
            
            streaks.extend(team_streaks)
        
        return pd.Series(streaks, index=df.index)
    
    def prepare_game_outcome_features(self, processed_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features for game outcome prediction"""
        logger.info("Preparing game outcome features...")
        
        # Features for game prediction
        feature_columns = [
            'IS_HOME', 'TEAM_PPG', 'TEAM_FG_PCT', 'TEAM_FG3_PCT', 'TEAM_FT_PCT',
            'TEAM_REB_PG', 'TEAM_AST_PG', 'TEAM_TOV_PG', 'TEAM_STL_PG', 'TEAM_BLK_PG',
            'DAYS_REST', 'WIN_PCT_LAST_5', 'WIN_PCT_LAST_10', 'WIN_STREAK'
        ]
        
        # Add rolling features
        for window in [5, 10, 15]:
            for base_feature in ['TEAM_PTS', 'TEAM_WIN', 'TEAM_FG_PCT']:
                feature_columns.append(f'{base_feature}_ROLL_{window}')
        
        # Filter available columns
        available_features = [col for col in feature_columns if col in processed_df.columns]
        
        X = processed_df[available_features].fillna(0)
        y = processed_df['TEAM_WIN']
        
        self.feature_columns['game_features'] = available_features
        
        return X, y
    
    def prepare_player_performance_features(self, player_stats_df: pd.DataFrame, games_df: pd.DataFrame) -> Dict[str, Tuple[pd.DataFrame, pd.Series]]:
        """Prepare features for player performance prediction (points, assists, rebounds)"""
        logger.info("Preparing player performance features...")
        
        # Limit data size to prevent memory issues
        max_players = 2000  # Limit to top 2000 players
        if len(player_stats_df) > max_players:
            # Sort by games played and minutes to get most active players
            player_stats_df = player_stats_df.nlargest(max_players, ['GP', 'MIN'])
            logger.info(f"Limited to {max_players} most active players to prevent memory issues")
        
        # Use player stats directly without massive merge
        player_game_df = player_stats_df.copy()
        
        # Feature engineering for player prediction - only use essential columns
        essential_columns = [
            'GP', 'MIN', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'REB', 'AST', 'PTS',
            'PPG', 'RPG', 'APG', 'TS_PCT', 'EFG_PCT'
        ]
        
        # Filter available columns and ensure they exist
        available_features = []
        for col in essential_columns:
            if col in player_game_df.columns:
                available_features.append(col)
            else:
                # Create missing columns with default values
                if col == 'PPG':
                    player_game_df[col] = player_game_df.get('PTS', 0) / np.maximum(player_game_df.get('GP', 1), 1)
                elif col == 'RPG':
                    player_game_df[col] = player_game_df.get('REB', 0) / np.maximum(player_game_df.get('GP', 1), 1)
                elif col == 'APG':
                    player_game_df[col] = player_game_df.get('AST', 0) / np.maximum(player_game_df.get('GP', 1), 1)
                elif col == 'TS_PCT':
                    player_game_df[col] = 0.55  # Default true shooting
                elif col == 'EFG_PCT':
                    player_game_df[col] = 0.50  # Default effective field goal
                else:
                    player_game_df[col] = 0
                available_features.append(col)
        
        # Limit to essential features only
        X = player_game_df[available_features].fillna(0)
        
        # Ensure data types are numeric
        X = X.select_dtypes(include=[np.number])
        
        # Prepare targets for different predictions
        targets = {
            'points': player_game_df.get('PTS', pd.Series([0] * len(player_game_df))),
            'assists': player_game_df.get('AST', pd.Series([0] * len(player_game_df))), 
            'rebounds': player_game_df.get('REB', pd.Series([0] * len(player_game_df)))
        }
        
        self.feature_columns['player_features'] = available_features
        
        return {target_name: (X, target_values) for target_name, target_values in targets.items()}
    
    def scale_features(self, X_train: pd.DataFrame, X_val: pd.DataFrame = None, X_test: pd.DataFrame = None, 
                      scaler_type: str = 'standard') -> Tuple[np.ndarray, ...]:
        """Scale features using specified scaler"""
        logger.info(f"Scaling features using {scaler_type} scaler...")
        
        if scaler_type == 'standard':
            scaler = StandardScaler()
        elif scaler_type == 'robust':
            scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaler type: {scaler_type}")
        
        # Fit and transform training data
        X_train_scaled = scaler.fit_transform(X_train)
        
        results = [X_train_scaled]
        
        # Transform validation and test data if provided
        if X_val is not None:
            X_val_scaled = scaler.transform(X_val)
            results.append(X_val_scaled)
        
        if X_test is not None:
            X_test_scaled = scaler.transform(X_test)
            results.append(X_test_scaled)
        
        # Save scaler
        self.scalers[scaler_type] = scaler
        
        return tuple(results)
    
    def save_preprocessors(self):
        """Save scalers and encoders"""
        preprocessors_dir = os.path.join(self.data_dir, 'models', 'preprocessors')
        os.makedirs(preprocessors_dir, exist_ok=True)
        
        # Save scalers
        for name, scaler in self.scalers.items():
            joblib.dump(scaler, os.path.join(preprocessors_dir, f'{name}_scaler.pkl'))
        
        # Save encoders
        for name, encoder in self.encoders.items():
            joblib.dump(encoder, os.path.join(preprocessors_dir, f'{name}_encoder.pkl'))
        
        # Save feature columns
        import json
        with open(os.path.join(preprocessors_dir, 'feature_columns.json'), 'w') as f:
            json.dump(self.feature_columns, f, indent=2)
        
        logger.info(f"Preprocessors saved to {preprocessors_dir}")
    
    def load_preprocessors(self):
        """Load saved scalers and encoders"""
        preprocessors_dir = os.path.join(self.data_dir, 'models', 'preprocessors')
        
        # Check if preprocessors directory exists
        if not os.path.exists(preprocessors_dir):
            raise FileNotFoundError(f"Preprocessors directory not found: {preprocessors_dir}. Models may need to be trained.")
        
        # Load scalers
        for filename in os.listdir(preprocessors_dir):
            if filename.endswith('_scaler.pkl'):
                name = filename.replace('_scaler.pkl', '')
                self.scalers[name] = joblib.load(os.path.join(preprocessors_dir, filename))
        
        # Load encoders
        for filename in os.listdir(preprocessors_dir):
            if filename.endswith('_encoder.pkl'):
                name = filename.replace('_encoder.pkl', '')
                self.encoders[name] = joblib.load(os.path.join(preprocessors_dir, filename))
        
        # Load feature columns
        import json
        feature_file = os.path.join(preprocessors_dir, 'feature_columns.json')
        if os.path.exists(feature_file):
            with open(feature_file, 'r') as f:
                self.feature_columns = json.load(f)
        
        logger.info("Preprocessors loaded successfully")
    
    def process_all_data(self) -> Dict[str, Dict]:
        """Main processing pipeline"""
        logger.info("Starting data preprocessing...")
        
        # Load raw data
        raw_data = self.load_raw_data()
        
        if raw_data['games'].empty:
            logger.error("No games data found. Run data collection first.")
            return {}
        
        # Engineer features
        team_features = self.engineer_team_features(raw_data['team_stats'], raw_data['games'])
        
        # Create matchup features
        matchup_features = self.create_matchup_features(raw_data['games'], team_features)
        
        # Add rolling and form features
        rolling_features = self.create_rolling_features(matchup_features)
        final_features = self.create_recent_form_features(rolling_features)
        
        # Prepare datasets for game prediction
        game_X, game_y = self.prepare_game_outcome_features(final_features)
        
        # Split data
        processed_data = {
            'game_prediction': self.create_train_val_test_split(game_X, game_y)
        }
        
        # Save processed data
        self.save_processed_data(processed_data)
        
        return processed_data
    
    def create_train_val_test_split(self, X: pd.DataFrame, y: pd.Series, 
                                   train_size: float = 0.7, val_size: float = 0.15, 
                                   random_state: int = 42) -> Dict:
        """Create train/validation/test splits"""
        # First split: train vs temp (val + test)
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=(1 - train_size), random_state=random_state, stratify=y if len(y.unique()) < 50 else None
        )
        
        # Second split: val vs test
        test_size_adj = (1 - train_size - val_size) / (1 - train_size)
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=test_size_adj, random_state=random_state,
            stratify=y_temp if len(y_temp.unique()) < 50 else None
        )
        
        return {
            'X_train': X_train, 'y_train': y_train,
            'X_val': X_val, 'y_val': y_val,
            'X_test': X_test, 'y_test': y_test
        }
    
    def save_processed_data(self, processed_data: Dict):
        """Save processed datasets"""
        processed_dir = os.path.join(self.data_dir, 'processed', 'ml_ready')
        os.makedirs(processed_dir, exist_ok=True)
        
        for task_name, datasets in processed_data.items():
            task_dir = os.path.join(processed_dir, task_name)
            os.makedirs(task_dir, exist_ok=True)
            
            if isinstance(datasets, dict) and 'X_train' in datasets:
                # Single dataset
                for split_name, data in datasets.items():
                    if isinstance(data, pd.DataFrame):
                        data.to_csv(os.path.join(task_dir, f'{split_name}.csv'), index=False)
                    elif isinstance(data, pd.Series):
                        data.to_csv(os.path.join(task_dir, f'{split_name}.csv'), index=False)
            else:
                # Multiple datasets (like player predictions)
                for sub_task, sub_datasets in datasets.items():
                    sub_task_dir = os.path.join(task_dir, sub_task)
                    os.makedirs(sub_task_dir, exist_ok=True)
                    
                    for split_name, data in sub_datasets.items():
                        if isinstance(data, pd.DataFrame):
                            data.to_csv(os.path.join(sub_task_dir, f'{split_name}.csv'), index=False)
                        elif isinstance(data, pd.Series):
                            data.to_csv(os.path.join(sub_task_dir, f'{split_name}.csv'), index=False)
        
        logger.info(f"Processed data saved to {processed_dir}")

def main():
    """Main execution function"""
    preprocessor = NBADataPreprocessor()
    
    print("Starting NBA data preprocessing...")
    
    # Process all data
    processed_data = preprocessor.process_all_data()
    
    if processed_data:
        # Save preprocessors
        preprocessor.save_preprocessors()
        
        print("Data preprocessing complete!")
        print(f"Processed data saved to: {preprocessor.data_dir}/processed/ml_ready/")
        
        # Print summary
        for task, data in processed_data.items():
            print(f"\n{task}:")
            if isinstance(data, dict) and 'X_train' in data:
                print(f"  Training samples: {len(data['X_train'])}")
                print(f"  Features: {data['X_train'].shape[1]}")
            else:
                for subtask, subdata in data.items():
                    print(f"  {subtask} - Training samples: {len(subdata['X_train'])}")
    else:
        print("Preprocessing failed. Check data collection.")

if __name__ == "__main__":
    main()