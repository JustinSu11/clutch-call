"""
NBA Prediction System Data Collection
Comprehensive data collection using nba_api for machine learning
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

# NBA API imports
from nba_api.stats.endpoints import (
    boxscoretraditionalv2, 
    boxscoresummaryv2, 
    boxscoreadvancedv2,
    boxscoreplayertrackv2,
    leaguegamelog,
    teamgamelog,
    playergamelog,
    scoreboardv2,
    leaguestandings,
    teamdashboardbygeneralsplits,
    playerdashboardbygeneralsplits,
    commonplayerinfo,
    commonteamroster,
    teamyearbyyearstats,
    playercareerstats,
    teamestimatedmetrics,
    leaguedashteamstats,
    leaguedashplayerstats
)
from nba_api.stats.static import teams, players

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBADataCollector:
    """Comprehensive NBA data collector for machine learning purposes"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.ensure_data_directory()
        self.teams_info = teams.get_teams()
        self.rate_limit_delay = 0.6  # Respect NBA API rate limits
        
    def ensure_data_directory(self):
        """Create data directory structure"""
        subdirs = ['games', 'players', 'teams', 'processed', 'models']
        os.makedirs(self.data_dir, exist_ok=True)
        for subdir in subdirs:
            os.makedirs(os.path.join(self.data_dir, subdir), exist_ok=True)
            
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
        """Collect basic team information"""
        logger.info("Collecting team information...")
        
        team_data = []
        for team in self.teams_info:
            team_data.append({
                'team_id': team['id'],
                'team_name': team['full_name'],
                'team_abbreviation': team['abbreviation'],
                'city': team['city'],
                'state': team['state']
            })
        
        df = pd.DataFrame(team_data)
        df.to_csv(os.path.join(self.data_dir, 'teams', 'team_info.csv'), index=False)
        return df
    
    def collect_games_for_season(self, season: str) -> pd.DataFrame:
        """Collect all games for a given season"""
        logger.info(f"Collecting games for season {season}...")
        
        self.rate_limit()
        try:
            game_log = leaguegamelog.LeagueGameLog(season=season, season_type_all_star="Regular Season")
            games_df = game_log.get_data_frames()[0]
            
            # Add season column
            games_df['SEASON'] = season
            
            # Save raw data
            filename = os.path.join(self.data_dir, 'games', f'games_{season.replace("-", "_")}.csv')
            games_df.to_csv(filename, index=False)
            
            return games_df
        except Exception as e:
            logger.error(f"Error collecting games for season {season}: {e}")
            return pd.DataFrame()
    
    def collect_detailed_game_data(self, game_id: str) -> Dict:
        """Collect detailed data for a specific game"""
        # Skip preseason games early to avoid slow/failed calls
        if str(game_id).startswith('001'):
            logger.info(f"Skipping preseason game {game_id} in detailed data collection")
            return {}

        self.rate_limit()
        
        try:
            # Get traditional box score
            try:
                traditional = boxscoretraditionalv2.BoxScoreTraditionalV2(game_id=game_id)
            except Exception as e:
                logger.warning(f"Game {game_id}: Traditional box score request failed ({e})")
                return {}

            try:
                traditional_dfs = traditional.get_data_frames()
            except (KeyError, AttributeError, TypeError) as e:
                logger.warning(f"Game {game_id}: Traditional box score unavailable ({e})")
                return {}
            
            # Get advanced box score
            self.rate_limit()
            try:
                advanced = boxscoreadvancedv2.BoxScoreAdvancedV2(game_id=game_id)
                advanced_dfs = advanced.get_data_frames()
            except (KeyError, AttributeError, TypeError) as e:
                logger.warning(f"Game {game_id}: Advanced box score unavailable ({e})")
                advanced_dfs = []
            except Exception as e:
                logger.warning(f"Game {game_id}: Advanced box score request failed ({e})")
                advanced_dfs = []
            
            # Get game summary
            self.rate_limit()
            try:
                summary = boxscoresummaryv2.BoxScoreSummaryV2(game_id=game_id)
                summary_dfs = summary.get_data_frames()
            except (KeyError, AttributeError, TypeError) as e:
                logger.warning(f"Game {game_id}: Game summary unavailable ({e})")
                summary_dfs = []
            except Exception as e:
                logger.warning(f"Game {game_id}: Game summary request failed ({e})")
                summary_dfs = []
            
            return {
                'game_id': game_id,
                'player_traditional': traditional_dfs[0] if len(traditional_dfs) > 0 else pd.DataFrame(),
                'team_traditional': traditional_dfs[1] if len(traditional_dfs) > 1 else pd.DataFrame(),
                'player_advanced': advanced_dfs[0] if len(advanced_dfs) > 0 else pd.DataFrame(),
                'team_advanced': advanced_dfs[1] if len(advanced_dfs) > 1 else pd.DataFrame(),
                'game_summary': summary_dfs[0] if len(summary_dfs) > 0 else pd.DataFrame(),
                'line_score': summary_dfs[1] if len(summary_dfs) > 1 else pd.DataFrame()
            }
        except Exception as e:
            logger.error(f"Error collecting detailed data for game {game_id}: {e}")
            return {}
    
    def collect_player_season_stats(self, season: str) -> pd.DataFrame:
        """Collect player statistics for entire season"""
        logger.info(f"Collecting player stats for season {season}...")
        
        self.rate_limit()
        try:
            player_stats = leaguedashplayerstats.LeagueDashPlayerStats(season=season, season_type_all_star="Regular Season")
            df = player_stats.get_data_frames()[0]
            df['SEASON'] = season
            
            filename = os.path.join(self.data_dir, 'players', f'player_stats_{season.replace("-", "_")}.csv')
            df.to_csv(filename, index=False)
            
            return df
        except Exception as e:
            logger.error(f"Error collecting player stats for season {season}: {e}")
            return pd.DataFrame()
    
    def collect_team_season_stats(self, season: str) -> pd.DataFrame:
        """Collect team statistics for entire season"""
        logger.info(f"Collecting team stats for season {season}...")
        
        self.rate_limit()
        try:
            team_stats = leaguedashteamstats.LeagueDashTeamStats(season=season, season_type_all_star="Regular Season")
            df = team_stats.get_data_frames()[0]
            df['SEASON'] = season
            
            filename = os.path.join(self.data_dir, 'teams', f'team_stats_{season.replace("-", "_")}.csv')
            df.to_csv(filename, index=False)
            
            return df
        except Exception as e:
            logger.error(f"Error collecting team stats for season {season}: {e}")
            return pd.DataFrame()
    
    def collect_historical_data(self, seasons: List[str], collect_detailed_games: bool = False):
        """Collect comprehensive historical data for multiple seasons"""
        logger.info(f"Starting historical data collection for {len(seasons)} seasons...")
        
        # Collect team info
        self.collect_team_info()
        
        all_games = []
        all_player_stats = []
        all_team_stats = []
        
        for season in seasons:
            logger.info(f"Processing season {season}...")
            
            # Collect games
            games_df = self.collect_games_for_season(season)
            if not games_df.empty:
                all_games.append(games_df)
            
            # Collect player stats
            player_stats_df = self.collect_player_season_stats(season)
            if not player_stats_df.empty:
                all_player_stats.append(player_stats_df)
            
            # Collect team stats  
            team_stats_df = self.collect_team_season_stats(season)
            if not team_stats_df.empty:
                all_team_stats.append(team_stats_df)
            
            # Optional: Collect detailed game data (slower)
            if collect_detailed_games and not games_df.empty:
                unique_games = games_df['GAME_ID'].unique()[:50]  # Limit for demo
                logger.info(f"Collecting detailed data for {len(unique_games)} games...")
                
                for game_id in unique_games:
                    detailed_data = self.collect_detailed_game_data(game_id)
                    if detailed_data:
                        # Save detailed game data
                        game_dir = os.path.join(self.data_dir, 'games', 'detailed', str(game_id))
                        os.makedirs(game_dir, exist_ok=True)
                        
                        for key, df in detailed_data.items():
                            if isinstance(df, pd.DataFrame) and not df.empty:
                                df.to_csv(os.path.join(game_dir, f'{key}.csv'), index=False)
        
        # Combine and save all data
        if all_games:
            combined_games = pd.concat(all_games, ignore_index=True)
            combined_games.to_csv(os.path.join(self.data_dir, 'processed', 'all_games.csv'), index=False)
            logger.info(f"Saved {len(combined_games)} game records")
        
        if all_player_stats:
            combined_player_stats = pd.concat(all_player_stats, ignore_index=True)
            combined_player_stats.to_csv(os.path.join(self.data_dir, 'processed', 'all_player_stats.csv'), index=False)
            logger.info(f"Saved {len(combined_player_stats)} player stat records")
        
        if all_team_stats:
            combined_team_stats = pd.concat(all_team_stats, ignore_index=True)
            combined_team_stats.to_csv(os.path.join(self.data_dir, 'processed', 'all_team_stats.csv'), index=False)
            logger.info(f"Saved {len(combined_team_stats)} team stat records")
    
    def collect_recent_games_with_details(self, days_back: int = 30) -> List[Dict]:
        """Collect recent games with detailed box scores for training"""
        logger.info(f"Collecting recent games from last {days_back} days with details...")
        
        recent_games = []
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)
        
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%m/%d/%Y")
            logger.info(f"Collecting games for {date_str}...")
            
            try:
                self.rate_limit()
                scoreboard = scoreboardv2.ScoreboardV2(game_date=date_str)
                games_data = scoreboard.get_data_frames()[0]
                
                if not games_data.empty:
                    for _, game in games_data.iterrows():
                        game_id = game['GAME_ID']
                        
                        # Get detailed data for each game
                        detailed_data = self.collect_detailed_game_data(game_id)
                        if detailed_data:
                            detailed_data['game_date'] = date_str
                            recent_games.append(detailed_data)
                
            except Exception as e:
                logger.error(f"Error collecting games for {date_str}: {e}")
            
            current_date += timedelta(days=1)
        
        # Save recent games data
        if recent_games:
            recent_games_dir = os.path.join(self.data_dir, 'games', 'recent')
            os.makedirs(recent_games_dir, exist_ok=True)
            
            with open(os.path.join(recent_games_dir, 'recent_games_metadata.json'), 'w') as f:
                metadata = {
                    'collection_date': datetime.now().isoformat(),
                    'days_collected': days_back,
                    'games_count': len(recent_games),
                    'game_ids': [g.get('game_id', 'unknown') for g in recent_games]
                }
                json.dump(metadata, f, indent=2)
        
        logger.info(f"Collected {len(recent_games)} recent games with details")
        return recent_games
    
    def get_upcoming_games(self, days_ahead: int = 7) -> pd.DataFrame:
        """Get upcoming games for prediction"""
        logger.info(f"Getting upcoming games for next {days_ahead} days...")
        logger.info(f"Date range: {datetime.now().date()} to {datetime.now().date() + timedelta(days=days_ahead)}")
        
        upcoming_games = []
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=days_ahead)
        
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%m/%d/%Y")
            
            try:
                self.rate_limit()
                scoreboard = scoreboardv2.ScoreboardV2(game_date=date_str)
                games_data = scoreboard.get_data_frames()[0]
                
                logger.info(f"Checking {date_str}: Found {len(games_data)} games")
                
                if not games_data.empty:
                    for _, game in games_data.iterrows():
                        game_id = game['GAME_ID']

                        # Skip preseason games (game_id starts with '001')
                        if str(game_id).startswith('001'):
                            logger.info(f"Skipping preseason game {game_id} on {date_str}")
                            continue
                        upcoming_games.append({
                            'game_id': game_id,
                            'game_date': date_str,
                            'home_team_id': game.get('HOME_TEAM_ID'),
                            'away_team_id': game.get('VISITOR_TEAM_ID'),
                            'home_team': game.get('HOME_TEAM_NAME', ''),
                            'away_team': game.get('VISITOR_TEAM_NAME', ''),
                            'game_time': game.get('GAME_STATUS_TEXT', '')
                        })
                        
            except Exception as e:
                logger.error(f"Error getting upcoming games for {date_str}: {e}")
            
            current_date += timedelta(days=1)
        
        df = pd.DataFrame(upcoming_games)
        logger.info(f"Total upcoming games found: {len(df)}")
        
        if not df.empty:
            df.to_csv(os.path.join(self.data_dir, 'processed', 'upcoming_games.csv'), index=False)
            logger.info(f"Upcoming games saved to: {os.path.join(self.data_dir, 'processed', 'upcoming_games.csv')}")
        else:
            logger.warning("No upcoming games found in the specified date range")
        
        return df

def main():
    """Main execution function"""
    collector = NBADataCollector()
    
    # Collect data for recent seasons
    seasons = collector.get_seasons_list(start_year=2020, end_year=2024)
    
    print("Starting NBA data collection...")
    print(f"Collecting data for seasons: {seasons}")
    
    # Collect historical data
    collector.collect_historical_data(seasons, collect_detailed_games=True)
    
    # Collect recent games with details
    collector.collect_recent_games_with_details(days_back=30)
    
    # Get upcoming games
    upcoming = collector.get_upcoming_games(days_ahead=7)
    print(f"Found {len(upcoming)} upcoming games")
    
    print("Data collection complete!")
    print(f"Data saved to: {collector.data_dir}")

if __name__ == "__main__":
    main()
