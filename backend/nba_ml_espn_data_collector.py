"""
NBA Prediction System Data Collection using ESPN API
Comprehensive data collection using ESPN's public API for machine learning
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
import time
import os
import json
import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ESPN API Endpoints
ESPN_NBA_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
ESPN_NBA_SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary"
ESPN_NBA_TEAMS = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams"

class ESPNNBADataCollector:
    """Comprehensive NBA data collector using ESPN API for machine learning purposes"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.ensure_data_directory()
        self.rate_limit_delay = 0.6  # Respect ESPN API rate limits
        self.teams_cache = None
        
    def ensure_data_directory(self):
        """Create data directory structure"""
        subdirs = ['games', 'players', 'teams', 'processed', 'models', 'predictions']
        os.makedirs(self.data_dir, exist_ok=True)
        for subdir in subdirs:
            os.makedirs(os.path.join(self.data_dir, subdir), exist_ok=True)
            
    def rate_limit(self):
        """Apply rate limiting to API calls"""
        time.sleep(self.rate_limit_delay)
    
    def _get(self, url: str, params: Optional[Dict] = None) -> Dict:
        """Perform GET request against ESPN API"""
        try:
            self.rate_limit()
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            r = requests.get(url, params=params, headers=headers, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"Error fetching from {url}: {e}")
            return {}
    
    def get_teams_info(self) -> pd.DataFrame:
        """Collect NBA team information from ESPN"""
        logger.info("Collecting team information from ESPN...")
        
        if self.teams_cache is not None:
            return self.teams_cache
        
        try:
            data = self._get(ESPN_NBA_TEAMS)
            
            if not data or 'sports' not in data:
                logger.warning("No team data returned from ESPN API")
                return pd.DataFrame()
            
            teams_data = []
            sports = data.get('sports', [])
            for sport in sports:
                leagues = sport.get('leagues', [])
                for league in leagues:
                    teams = league.get('teams', [])
                    for team_entry in teams:
                        team = team_entry.get('team', {})
                        teams_data.append({
                            'team_id': team.get('id'),
                            'team_name': team.get('displayName', team.get('name', '')),
                            'team_abbreviation': team.get('abbreviation', ''),
                            'location': team.get('location', ''),
                            'team_slug': team.get('slug', ''),
                            'logo': team.get('logos', [{}])[0].get('href', '') if team.get('logos') else ''
                        })
            
            df = pd.DataFrame(teams_data)
            
            if not df.empty:
                # Save to file
                df.to_csv(os.path.join(self.data_dir, 'teams', 'team_info.csv'), index=False)
                self.teams_cache = df
                logger.info(f"Collected {len(df)} teams from ESPN")
            else:
                logger.warning("No teams collected")
            
            return df
        except Exception as e:
            logger.error(f"Error collecting team info: {e}")
            return pd.DataFrame()
    
    def get_games_for_date_range(self, start_date: date, end_date: date) -> pd.DataFrame:
        """Collect games for a date range from ESPN scoreboard"""
        logger.info(f"Collecting games from {start_date} to {end_date}...")
        
        all_games = []
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y%m%d")
            
            try:
                params = {"dates": date_str}
                data = self._get(ESPN_NBA_SCOREBOARD, params)
                
                if data and 'events' in data:
                    events = data.get('events', [])
                    logger.info(f"Found {len(events)} games on {current_date}")
                    
                    for event in events:
                        game_info = self._parse_game_event(event, current_date)
                        if game_info:
                            all_games.append(game_info)
                else:
                    logger.debug(f"No games found on {current_date}")
                    
            except Exception as e:
                logger.error(f"Error collecting games for {current_date}: {e}")
            
            current_date += timedelta(days=1)
        
        if all_games:
            df = pd.DataFrame(all_games)
            logger.info(f"Collected {len(df)} total games")
            return df
        else:
            logger.warning("No games collected")
            return pd.DataFrame()
    
    def _parse_game_event(self, event: Dict, game_date: date) -> Optional[Dict]:
        """Parse ESPN game event into structured data"""
        try:
            game_id = event.get('id')
            competitions = event.get('competitions', [])
            
            if not competitions:
                return None
            
            competition = competitions[0]
            competitors = competition.get('competitors', [])
            
            if len(competitors) < 2:
                return None
            
            # Determine home and away teams
            home_team = next((c for c in competitors if c.get('homeAway') == 'home'), None)
            away_team = next((c for c in competitors if c.get('homeAway') == 'away'), None)
            
            if not home_team or not away_team:
                return None
            
            # Get status
            status = event.get('status', {})
            status_type = status.get('type', {}).get('name', '')
            completed = status_type in ['STATUS_FINAL', 'STATUS_FINAL_OT']
            
            # Get scores
            home_score = int(home_team.get('score', 0))
            away_score = int(away_team.get('score', 0))
            
            # Determine winner
            home_win = None
            if completed and home_score > 0 and away_score > 0:
                home_win = home_score > away_score
            
            game_info = {
                'GAME_ID': game_id,
                'GAME_DATE': game_date.strftime('%Y-%m-%d'),
                'HOME_TEAM_ID': home_team.get('team', {}).get('id'),
                'HOME_TEAM_NAME': home_team.get('team', {}).get('displayName', ''),
                'HOME_TEAM_ABBR': home_team.get('team', {}).get('abbreviation', ''),
                'AWAY_TEAM_ID': away_team.get('team', {}).get('id'),
                'AWAY_TEAM_NAME': away_team.get('team', {}).get('displayName', ''),
                'AWAY_TEAM_ABBR': away_team.get('team', {}).get('abbreviation', ''),
                'HOME_SCORE': home_score,
                'AWAY_SCORE': away_score,
                'HOME_WIN': home_win,
                'STATUS': status_type,
                'COMPLETED': completed
            }
            
            return game_info
            
        except Exception as e:
            logger.error(f"Error parsing game event: {e}")
            return None
    
    def get_detailed_game_data(self, game_id: str) -> Dict:
        """Collect detailed data for a specific game including box score"""
        logger.info(f"Collecting detailed data for game {game_id}...")
        
        try:
            params = {"event": game_id}
            data = self._get(ESPN_NBA_SUMMARY, params)
            
            if not data:
                logger.warning(f"No data returned for game {game_id}")
                return {}
            
            # Extract box score if available
            boxscore = data.get('boxscore', {})
            
            # Extract team statistics
            team_stats = self._extract_team_stats(boxscore)
            
            # Extract player statistics
            player_stats = self._extract_player_stats(boxscore)
            
            return {
                'game_id': game_id,
                'team_stats': team_stats,
                'player_stats': player_stats,
                'raw_data': data
            }
            
        except Exception as e:
            logger.error(f"Error collecting detailed data for game {game_id}: {e}")
            return {}
    
    def _extract_team_stats(self, boxscore: Dict) -> List[Dict]:
        """Extract team statistics from boxscore"""
        team_stats = []
        
        try:
            teams = boxscore.get('teams', [])
            
            for team in teams:
                team_info = team.get('team', {})
                stats = team.get('statistics', [])
                
                # Create a dictionary of stats
                stats_dict = {
                    'team_id': team_info.get('id'),
                    'team_name': team_info.get('displayName', ''),
                    'team_abbr': team_info.get('abbreviation', '')
                }
                
                # Parse statistics
                for stat in stats:
                    name = stat.get('name', '')
                    value = stat.get('displayValue', 0)
                    
                    # Convert common stats to numeric
                    if name:
                        try:
                            stats_dict[name.upper().replace(' ', '_')] = float(value) if value else 0
                        except:
                            stats_dict[name.upper().replace(' ', '_')] = value
                
                team_stats.append(stats_dict)
                
        except Exception as e:
            logger.error(f"Error extracting team stats: {e}")
        
        return team_stats
    
    def _extract_player_stats(self, boxscore: Dict) -> List[Dict]:
        """Extract player statistics from boxscore"""
        player_stats = []
        
        try:
            players = boxscore.get('players', [])
            
            for team_players in players:
                team_info = team_players.get('team', {})
                team_id = team_info.get('id')
                
                statistics = team_players.get('statistics', [])
                for stat_group in statistics:
                    athletes = stat_group.get('athletes', [])
                    labels = stat_group.get('labels', [])
                    
                    for athlete_data in athletes:
                        athlete = athlete_data.get('athlete', {})
                        stats = athlete_data.get('stats', [])
                        
                        player_stat = {
                            'player_id': athlete.get('id'),
                            'player_name': athlete.get('displayName', ''),
                            'team_id': team_id,
                            'position': athlete.get('position', {}).get('abbreviation', ''),
                        }
                        
                        # Map stats to labels
                        for i, stat_value in enumerate(stats):
                            if i < len(labels):
                                label = labels[i].upper().replace(' ', '_')
                                try:
                                    player_stat[label] = float(stat_value) if stat_value else 0
                                except:
                                    player_stat[label] = stat_value
                        
                        player_stats.append(player_stat)
                        
        except Exception as e:
            logger.error(f"Error extracting player stats: {e}")
        
        return player_stats
    
    def collect_historical_data(self, start_year: int = 2020, end_year: Optional[int] = None, 
                               collect_detailed_games: bool = False):
        """Collect comprehensive historical data"""
        logger.info(f"Starting historical data collection from {start_year}...")
        
        if end_year is None:
            end_year = datetime.now().year
        
        # Collect team info first
        teams_df = self.get_teams_info()
        
        all_games = []
        
        # Collect games season by season
        for year in range(start_year, end_year + 1):
            # NBA season typically runs October to June
            season_start = date(year, 10, 1)
            season_end = date(year + 1, 6, 30)
            
            # Don't go into the future
            if season_start > date.today():
                break
                
            season_end = min(season_end, date.today())
            
            logger.info(f"Collecting {year}-{year+1} season...")
            games_df = self.get_games_for_date_range(season_start, season_end)
            
            if not games_df.empty:
                games_df['SEASON'] = f"{year}-{str(year+1)[-2:]}"
                all_games.append(games_df)
                
                # Save season data
                season_file = os.path.join(self.data_dir, 'games', f'games_{year}_{year+1}.csv')
                games_df.to_csv(season_file, index=False)
                logger.info(f"Saved {len(games_df)} games for {year}-{year+1} season")
                
                # Optionally collect detailed game data (slower)
                if collect_detailed_games:
                    # Limit to recent completed games for performance
                    completed_games = games_df[games_df['COMPLETED'] == True]
                    game_ids = completed_games['GAME_ID'].unique()[:50]  # Limit for demo
                    
                    logger.info(f"Collecting detailed data for {len(game_ids)} games...")
                    for game_id in game_ids:
                        detailed_data = self.get_detailed_game_data(game_id)
                        if detailed_data:
                            # Save detailed game data
                            game_dir = os.path.join(self.data_dir, 'games', 'detailed', str(game_id))
                            os.makedirs(game_dir, exist_ok=True)
                            
                            with open(os.path.join(game_dir, 'game_data.json'), 'w') as f:
                                json.dump(detailed_data, f, indent=2)
        
        # Combine and save all games
        if all_games:
            combined_games = pd.concat(all_games, ignore_index=True)
            combined_games.to_csv(os.path.join(self.data_dir, 'processed', 'all_games.csv'), index=False)
            logger.info(f"Saved {len(combined_games)} total game records")
            
            # Generate aggregated team stats from games
            self._generate_team_stats_from_games(combined_games)
            
            return combined_games
        else:
            logger.warning("No games collected")
            return pd.DataFrame()
    
    def _generate_team_stats_from_games(self, games_df: pd.DataFrame):
        """Generate team statistics from game data"""
        logger.info("Generating team statistics from games...")
        
        try:
            team_stats = []
            
            # Get unique seasons
            seasons = games_df['SEASON'].unique()
            
            for season in seasons:
                season_games = games_df[games_df['SEASON'] == season]
                
                # Get unique teams
                home_teams = season_games[['HOME_TEAM_ID', 'HOME_TEAM_NAME', 'HOME_TEAM_ABBR']].rename(
                    columns={'HOME_TEAM_ID': 'TEAM_ID', 'HOME_TEAM_NAME': 'TEAM_NAME', 'HOME_TEAM_ABBR': 'TEAM_ABBR'}
                )
                away_teams = season_games[['AWAY_TEAM_ID', 'AWAY_TEAM_NAME', 'AWAY_TEAM_ABBR']].rename(
                    columns={'AWAY_TEAM_ID': 'TEAM_ID', 'AWAY_TEAM_NAME': 'TEAM_NAME', 'AWAY_TEAM_ABBR': 'TEAM_ABBR'}
                )
                teams = pd.concat([home_teams, away_teams]).drop_duplicates('TEAM_ID')
                
                for _, team in teams.iterrows():
                    team_id = team['TEAM_ID']
                    
                    # Get all games for this team
                    home_games = season_games[season_games['HOME_TEAM_ID'] == team_id]
                    away_games = season_games[season_games['AWAY_TEAM_ID'] == team_id]
                    
                    # Calculate stats
                    total_games = len(home_games) + len(away_games)
                    
                    # Points scored
                    home_pts = home_games['HOME_SCORE'].sum()
                    away_pts = away_games['AWAY_SCORE'].sum()
                    total_pts = home_pts + away_pts
                    
                    # Points allowed
                    home_pts_allowed = home_games['AWAY_SCORE'].sum()
                    away_pts_allowed = away_games['HOME_SCORE'].sum()
                    total_pts_allowed = home_pts_allowed + away_pts_allowed
                    
                    # Wins
                    home_wins = (home_games['HOME_WIN'] == True).sum()
                    away_wins = (away_games['HOME_WIN'] == False).sum()
                    total_wins = home_wins + away_wins
                    
                    team_stat = {
                        'TEAM_ID': team_id,
                        'TEAM_NAME': team['TEAM_NAME'],
                        'TEAM_ABBR': team['TEAM_ABBR'],
                        'SEASON': season,
                        'GP': total_games,
                        'W': total_wins,
                        'L': total_games - total_wins,
                        'WIN_PCT': total_wins / total_games if total_games > 0 else 0,
                        'PTS': total_pts,
                        'PTS_PG': total_pts / total_games if total_games > 0 else 0,
                        'OPP_PTS': total_pts_allowed,
                        'OPP_PTS_PG': total_pts_allowed / total_games if total_games > 0 else 0,
                        'DIFF': (total_pts - total_pts_allowed) / total_games if total_games > 0 else 0
                    }
                    
                    team_stats.append(team_stat)
            
            if team_stats:
                team_stats_df = pd.DataFrame(team_stats)
                team_stats_df.to_csv(os.path.join(self.data_dir, 'processed', 'all_team_stats.csv'), index=False)
                logger.info(f"Generated stats for {len(team_stats_df)} team-seasons")
                
        except Exception as e:
            logger.error(f"Error generating team stats: {e}")
    
    def collect_recent_games_with_details(self, days_back: int = 30) -> List[Dict]:
        """Collect recent games with detailed box scores for training"""
        logger.info(f"Collecting recent games from last {days_back} days with details...")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days_back)
        
        # Get games for date range
        games_df = self.get_games_for_date_range(start_date, end_date)
        
        if games_df.empty:
            logger.warning("No recent games found")
            return []
        
        # Get completed games only
        completed_games = games_df[games_df['COMPLETED'] == True]
        
        recent_games = []
        for _, game in completed_games.iterrows():
            game_id = game['GAME_ID']
            
            # Get detailed data
            detailed_data = self.get_detailed_game_data(game_id)
            if detailed_data:
                detailed_data['game_date'] = game['GAME_DATE']
                recent_games.append(detailed_data)
        
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
        
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=days_ahead)
        
        upcoming_games = []
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y%m%d")
            
            try:
                params = {"dates": date_str}
                data = self._get(ESPN_NBA_SCOREBOARD, params)
                
                if data and 'events' in data:
                    events = data.get('events', [])
                    logger.info(f"Found {len(events)} games on {current_date}")
                    
                    for event in events:
                        game_info = self._parse_upcoming_game(event, current_date)
                        if game_info:
                            upcoming_games.append(game_info)
                            
            except Exception as e:
                logger.error(f"Error getting upcoming games for {current_date}: {e}")
            
            current_date += timedelta(days=1)
        
        df = pd.DataFrame(upcoming_games)
        logger.info(f"Total upcoming games found: {len(df)}")
        
        if not df.empty:
            df.to_csv(os.path.join(self.data_dir, 'processed', 'upcoming_games.csv'), index=False)
        
        return df
    
    def _parse_upcoming_game(self, event: Dict, game_date: date) -> Optional[Dict]:
        """Parse upcoming game event"""
        try:
            game_id = event.get('id')
            competitions = event.get('competitions', [])
            
            if not competitions:
                return None
            
            competition = competitions[0]
            competitors = competition.get('competitors', [])
            
            if len(competitors) < 2:
                return None
            
            # Determine home and away teams
            home_team = next((c for c in competitors if c.get('homeAway') == 'home'), None)
            away_team = next((c for c in competitors if c.get('homeAway') == 'away'), None)
            
            if not home_team or not away_team:
                return None
            
            # Get game time/status
            status = event.get('status', {})
            status_text = status.get('type', {}).get('detail', '')
            
            return {
                'game_id': game_id,
                'game_date': game_date.strftime('%Y-%m-%d'),
                'home_team_id': home_team.get('team', {}).get('id'),
                'home_team': home_team.get('team', {}).get('displayName', ''),
                'away_team_id': away_team.get('team', {}).get('id'),
                'away_team': away_team.get('team', {}).get('displayName', ''),
                'game_time': status_text
            }
            
        except Exception as e:
            logger.error(f"Error parsing upcoming game: {e}")
            return None


def main():
    """Main execution function"""
    collector = ESPNNBADataCollector()
    
    print("Starting ESPN NBA data collection...")
    
    # Collect team info
    teams = collector.get_teams_info()
    print(f"Collected {len(teams)} teams")
    
    # Collect historical data (recent seasons)
    print("\nCollecting historical data for recent seasons...")
    games = collector.collect_historical_data(start_year=2022, end_year=2024, collect_detailed_games=False)
    print(f"Collected {len(games)} historical games")
    
    # Collect recent games with details
    print("\nCollecting recent games with details...")
    recent = collector.collect_recent_games_with_details(days_back=30)
    print(f"Collected {len(recent)} recent games with details")
    
    # Get upcoming games
    print("\nGetting upcoming games...")
    upcoming = collector.get_upcoming_games(days_ahead=7)
    print(f"Found {len(upcoming)} upcoming games")
    
    print(f"\nData collection complete!")
    print(f"Data saved to: {collector.data_dir}")


if __name__ == "__main__":
    main()
