"""
NBA Prediction System Data Collection
Comprehensive data collection using ESPN API for machine learning
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
import time
import os
import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# ESPN API data collector
from nba_ml_espn_data_collector import ESPNNBADataCollector

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBADataCollector:
    """Comprehensive NBA data collector for machine learning purposes - Now using ESPN API"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.espn_collector = ESPNNBADataCollector(data_dir)
        self.rate_limit_delay = 0.6  # Respect ESPN API rate limits
        
    def ensure_data_directory(self):
        """Create data directory structure - delegated to ESPN collector"""
        self.espn_collector.ensure_data_directory()
            
    def rate_limit(self):
        """Apply rate limiting to API calls"""
        time.sleep(self.rate_limit_delay)
    
    def get_seasons_list(self, start_year: int = 2018, end_year: Optional[int] = None) -> List[str]:
        """Generate list of NBA seasons in format '2018-19', '2019-20', etc."""
        if end_year is None:
            end_year = datetime.now().year
        
        seasons = []
        for year in range(start_year, end_year + 1):
            seasons.append(f"{year}-{str(year + 1)[-2:]}")
        return seasons
    
    def collect_team_info(self) -> pd.DataFrame:
        """Collect basic team information using ESPN API"""
        return self.espn_collector.get_teams_info()
    
    def collect_games_for_season(self, season: str) -> pd.DataFrame:
        """Collect all games for a given season using ESPN API"""
        logger.info(f"Collecting games for season {season} using ESPN API...")
        
        # Parse season string like "2023-24" to get years
        start_year = int(season.split('-')[0])
        end_year_short = season.split('-')[1]
        end_year = int(f"20{end_year_short}") if len(end_year_short) == 2 else int(end_year_short)
        
        # NBA season runs October to June
        season_start = date(start_year, 10, 1)
        season_end = date(end_year, 6, 30)
        
        # Don't go into the future
        if season_start > date.today():
            return pd.DataFrame()
        season_end = min(season_end, date.today())
        
        games_df = self.espn_collector.get_games_for_date_range(season_start, season_end)
        
        if not games_df.empty:
            games_df['SEASON'] = season
            filename = os.path.join(self.data_dir, 'games', f'games_{season.replace("-", "_")}.csv')
            games_df.to_csv(filename, index=False)
        
        return games_df
    
    def collect_detailed_game_data(self, game_id: str) -> Dict:
        """Collect detailed data for a specific game using ESPN API"""
        return self.espn_collector.get_detailed_game_data(game_id)
    
    def collect_player_season_stats(self, season: str) -> pd.DataFrame:
        """Collect player statistics for entire season
        Note: ESPN API doesn't provide season-aggregated player stats directly.
        This will return empty DataFrame - player stats are collected per-game.
        """
        logger.info(f"Player season stats not available via ESPN API for season {season}")
        return pd.DataFrame()
    
    def collect_team_season_stats(self, season: str) -> pd.DataFrame:
        """Collect team statistics for entire season
        Note: Team stats are generated from game results in ESPN collector
        """
        logger.info(f"Team stats will be generated from game data for season {season}")
        return pd.DataFrame()
    
    def collect_historical_data(self, seasons: List[str], collect_detailed_games: bool = False):
        """Collect comprehensive historical data for multiple seasons using ESPN API"""
        logger.info(f"Starting ESPN-based historical data collection for {len(seasons)} seasons...")
        
        # Convert seasons to year range
        if seasons:
            # Parse first and last season
            start_year = int(seasons[0].split('-')[0])
            last_season = seasons[-1]
            end_year_short = last_season.split('-')[1]
            end_year = int(f"20{end_year_short}") if len(end_year_short) == 2 else int(end_year_short)
        else:
            # Default to recent seasons
            current_year = datetime.now().year
            start_year = current_year - 2
            end_year = current_year
        
        # Use ESPN collector to get historical data
        games_df = self.espn_collector.collect_historical_data(
            start_year=start_year, 
            end_year=end_year, 
            collect_detailed_games=collect_detailed_games
        )
        
        logger.info(f"ESPN historical data collection complete")
        return games_df
    
    def collect_recent_games_with_details(self, days_back: int = 30) -> List[Dict]:
        """Collect recent games with detailed box scores for training using ESPN API"""
        return self.espn_collector.collect_recent_games_with_details(days_back)
    
    def get_upcoming_games(self, days_ahead: int = 7) -> pd.DataFrame:
        """Get upcoming games for prediction using ESPN API"""
        return self.espn_collector.get_upcoming_games(days_ahead)

def main():
    """Main execution function"""
    collector = NBADataCollector()
    
    # Collect data for recent seasons
    seasons = collector.get_seasons_list(start_year=2020, end_year=2024)
    
    print("Starting NBA data collection using ESPN API...")
    print(f"Collecting data for seasons: {seasons}")
    
    # Collect historical data
    collector.collect_historical_data(seasons, collect_detailed_games=False)
    
    # Collect recent games with details
    collector.collect_recent_games_with_details(days_back=30)
    
    # Get upcoming games
    upcoming = collector.get_upcoming_games(days_ahead=7)
    print(f"Found {len(upcoming)} upcoming games")
    
    print("Data collection complete!")
    print(f"Data saved to: {collector.data_dir}")
    print("Note: Now using ESPN API instead of nba_api for prediction data collection")

if __name__ == "__main__":
    main()