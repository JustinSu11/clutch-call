"""
File: app/services/nba_service.py
Author: Maaz Haque
Purpose: Thin service layer for NBA data using the python package `nba_api` (which
         calls stats.nba.com). Provides helpers to list games, fetch a specific
         game (summary), box score stats, team recent games, and upcoming games.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import requests

from nba_api.stats.endpoints import (
    boxscoretraditionalv2,
    boxscoresummaryv2,
    leaguegamelog,
    leaguestandingsv3,
    scoreboardv2,
    teamgamelog,
)


def _season_to_nba_format(season: Optional[str]) -> Optional[str]:
    """Convert a season like '2024' to '2024-25' required by stats.nba.com."""
    if not season:
        return None
    if "-" in season:
        return season
    try:
        start = int(season)
        end_short = (start + 1) % 100
        return f"{start}-{end_short:02d}"
    except ValueError:
        return season


def _paginate(items: List[Dict[str, Any]], page: int, per_page: int) -> Dict[str, Any]:
    total = len(items)
    start = max((page - 1), 0) * per_page
    end = start + per_page
    return {
        "data": items[start:end],
        "meta": {"page": page, "per_page": per_page, "total": total},
    }


def get_games(season: Optional[str] = None, team_id: Optional[str] = None, page: int = 1, per_page: int = 25):
    """List NBA games using LeagueGameLog.

    Note: stats.nba.com uses string game IDs like '0022300001'.
    """
    season_fmt = _season_to_nba_format(season)
    # LeagueGameLog returns game logs for all teams; filter optional team_id
    if season_fmt:
        logs = leaguegamelog.LeagueGameLog(
            season=season_fmt, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    else:
        logs = leaguegamelog.LeagueGameLog(
            season_type_all_star="Regular Season"
        ).get_normalized_dict()
    rows = logs.get("LeagueGameLog", [])
    # Optional team filter
    if team_id:
        rows = [r for r in rows if str(r.get("TEAM_ID")) == str(team_id)]
    # Map to a simpler shape
    items = [
        {
            "game_id": r.get("GAME_ID"),
            "game_date": r.get("GAME_DATE"),
            "team_id": r.get("TEAM_ID"),
            "team_abbreviation": r.get("TEAM_ABBREVIATION"),
            "matchup": r.get("MATCHUP"),
            "wl": r.get("WL"),
            "pts": r.get("PTS"),
        }
        for r in rows
    ]
    return _paginate(items, page=page, per_page=per_page)


def get_game_by_id(game_id: str):
    """Fetch a game summary by NBA game ID using BoxScoreSummaryV2."""
    summary = boxscoresummaryv2.BoxScoreSummaryV2(game_id=game_id).get_normalized_dict()
    return summary


def get_box_score(game_id: str):
    """Fetch traditional box score stats by NBA game ID."""
    box = boxscoretraditionalv2.BoxScoreTraditionalV2(game_id=game_id).get_normalized_dict()
    return box


def get_team_last_games(team_id: int, n: int = 5, season: Optional[str] = None):
    """Return the most recent N games for a team using TeamGameLog."""
    season_fmt = _season_to_nba_format(season)
    if season_fmt:
        tlog = teamgamelog.TeamGameLog(
            team_id=team_id, season=season_fmt, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    else:
        tlog = teamgamelog.TeamGameLog(
            team_id=team_id, season_type_all_star="Regular Season"
        ).get_normalized_dict()
    rows = tlog.get("TeamGameLog", [])
    # Rows are typically already recent-first; ensure slice of N
    items = [
        {
            "game_id": r.get("GAME_ID"),
            "game_date": r.get("GAME_DATE"),
            "matchup": r.get("MATCHUP"),
            "wl": r.get("WL"),
            "pts": r.get("PTS"),
        }
        for r in rows[:n]
    ]
    return {"data": items}


def get_upcoming_games(days: int = 7):
    """List upcoming games for the next N days using ScoreboardV2 day by day."""
    today = datetime.utcnow().date()
    all_items: List[Dict[str, Any]] = []
    for offset in range(0, max(days, 1)):
        d = today + timedelta(days=offset)
        ds = d.strftime("%m/%d/%Y")
        # day_offset parameter is optional; let it default
        sb = scoreboardv2.ScoreboardV2(game_date=ds).get_normalized_dict()
        # Linescores and GameHeader contain game info
        headers = sb.get("GameHeader", [])
        for h in headers:
            all_items.append(
                {
                    "game_id": h.get("GAME_ID"),
                    "game_date": ds,
                    "home_team_id": h.get("HOME_TEAM_ID"),
                    "visitor_team_id": h.get("VISITOR_TEAM_ID"),
                    "game_status": h.get("GAME_STATUS_TEXT"),
                }
            )
    return {"data": all_items}


def get_today_games():
    """List NBA games for today using ScoreboardV2."""
    today = datetime.utcnow().date()
    ds = today.strftime("%m/%d/%Y")
    sb = scoreboardv2.ScoreboardV2(game_date=ds).get_normalized_dict()
    
    # Get GameHeader data for today's games
    headers = sb.get("GameHeader", [])
    items = []
    for h in headers:
        items.append(
            {
                "game_id": h.get("GAME_ID"),
                "game_date": ds,
                "home_team_id": h.get("HOME_TEAM_ID"),
                "visitor_team_id": h.get("VISITOR_TEAM_ID"),
                "game_status": h.get("GAME_STATUS_TEXT"),
                "league": "NBA"
            }
        )
    return {"data": items}


def get_live_games():
    """Get currently live/active NBA games."""
    try:
        today = datetime.now().strftime("%m/%d/%Y")
        scoreboard = scoreboardv2.ScoreboardV2(game_date=today)
        data = scoreboard.get_data_frames()[0]
        
        if data.empty:
            return {"data": []}
        
        headers = data.to_dict("records")
        live_games = []
        
        for h in headers:
            game_status = h.get("GAME_STATUS_TEXT", "").lower()
            # Check if game is currently active
            if any(status in game_status for status in ["qtr", "half", "ot", "live", "progress"]):
                live_games.append({
                    "game_id": h.get("GAME_ID"),
                    "game_date": today,
                    "home_team_id": h.get("HOME_TEAM_ID"),
                    "visitor_team_id": h.get("VISITOR_TEAM_ID"),
                    "game_status": h.get("GAME_STATUS_TEXT"),
                    "home_score": h.get("PTS_HOME"),
                    "visitor_score": h.get("PTS_AWAY"),
                    "league": "NBA",
                    "live": True
                })
        
        return {"data": live_games}
    except Exception as e:
        return {"error": str(e), "data": []}


def get_historical_games(start_date=None, end_date=None, season=None, team_id=None, page=1, per_page=50):
    """Get historical NBA games with filtering options."""
    try:
        # Use get_games with appropriate filters
        if season:
            season_fmt = _season_to_nba_format(season)
            data = get_games(season=season_fmt, team_id=team_id, page=page, per_page=per_page)
        else:
            # For date range queries, we'll use a basic approach
            # In a real implementation, you'd want more sophisticated date filtering
            data = get_games(team_id=team_id, page=page, per_page=per_page)
        
        # Add historical context to the response
        if isinstance(data, dict) and "data" in data:
            for game in data["data"]:
                game["historical"] = True
                game["stats_context"] = "Historical statistics and performance data available"
        
        return data
    except Exception as e:
        return {"error": str(e), "data": [], "meta": {"page": page, "per_page": per_page, "total": 0}}


def _get_nba_team_logos():
    """Get NBA team logos mapping.
    
    Returns static mapping since ESPN API may not be accessible from backend.
    Returns:
        Dictionary mapping team slugs to logo URLs
    """
    # Static mapping of team slugs to ESPN logo URLs
    logo_map = {
        "atlanta-hawks": "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
        "boston-celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
        "brooklyn-nets": "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
        "charlotte-hornets": "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
        "chicago-bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
        "cleveland-cavaliers": "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
        "dallas-mavericks": "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
        "denver-nuggets": "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
        "detroit-pistons": "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
        "golden-state-warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
        "houston-rockets": "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
        "indiana-pacers": "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
        "la-clippers": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
        "los-angeles-lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
        "memphis-grizzlies": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
        "miami-heat": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
        "milwaukee-bucks": "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
        "minnesota-timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
        "new-orleans-pelicans": "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
        "new-york-knicks": "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
        "oklahoma-city-thunder": "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
        "orlando-magic": "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
        "philadelphia-76ers": "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
        "phoenix-suns": "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
        "portland-trail-blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
        "sacramento-kings": "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
        "san-antonio-spurs": "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
        "toronto-raptors": "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
        "utah-jazz": "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
        "washington-wizards": "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
        # Also add lowercase slug versions
        "hawks": "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
        "celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
        "nets": "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
        "hornets": "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
        "bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
        "cavaliers": "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
        "mavericks": "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
        "nuggets": "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
        "pistons": "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
        "warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
        "rockets": "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
        "pacers": "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
        "clippers": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
        "lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
        "grizzlies": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
        "heat": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
        "bucks": "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
        "timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
        "pelicans": "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
        "knicks": "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
        "thunder": "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
        "magic": "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
        "76ers": "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
        "suns": "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
        "trail-blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
        "blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
        "kings": "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
        "spurs": "https://a.espncdn.com/i/teamlogos/nba/500/sa.png",
        "raptors": "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
        "jazz": "https://a.espncdn.com/i/teamlogos/nba/500/utah.png",
        "wizards": "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png",
    }
    
    return logo_map


def get_standings(season: Optional[str] = None):
    """Fetch NBA standings using LeagueStandingsV3.
    
    Args:
        season: Optional season string (e.g., '2024' or '2024-25')
    
    Returns:
        Dictionary containing standings data organized by conference and division
    """
    try:
        season_fmt = _season_to_nba_format(season)
        standings_data = leaguestandingsv3.LeagueStandingsV3(
            league_id="00",
            season=season_fmt if season_fmt else "2024-25",
            season_type="Regular Season"
        ).get_normalized_dict()
        
        standings = standings_data.get("Standings", [])
        
        # Fetch team logos from ESPN
        logo_map = _get_nba_team_logos()
        
        # Organize by conference and division
        eastern_conf = []
        western_conf = []
        
        for team in standings:
            team_abbreviation = team.get("TeamAbbreviation") or team.get("TeamSlug", "").upper()
            team_slug = team.get("TeamSlug", "")
            # Get logo from ESPN API - try multiple variations
            team_logo = (logo_map.get(team_abbreviation) or 
                        logo_map.get(team_abbreviation.lower()) or
                        logo_map.get(team_slug) or 
                        logo_map.get(team_slug.lower()) or
                        logo_map.get(team_slug.upper()))
            
            if not team_logo:
                print(f"No logo found for team: {team.get('TeamCity')} {team.get('TeamName')} (abbr: {team_abbreviation}, slug: {team_slug})")
            
            team_data = {
                "team_id": team.get("TeamID"),
                "team_name": team.get("TeamName"),
                "team_city": team.get("TeamCity"),
                "team_abbreviation": team_abbreviation,
                "team_logo": team_logo,
                "team_slug": team.get("TeamSlug"),
                "conference": team.get("Conference"),
                "division": team.get("Division"),
                "wins": team.get("WINS"),
                "losses": team.get("LOSSES"),
                "win_pct": team.get("WinPCT"),
                "conference_rank": team.get("ConferenceRecord"),
                "division_rank": team.get("DivisionRank"),
                "home_record": team.get("HOME"),
                "road_record": team.get("ROAD"),
                "last_10": team.get("L10"),
                "streak": team.get("CurrentStreak"),
                "games_back": team.get("ConferenceGamesBack")
            }
            
            if team.get("Conference") == "East":
                eastern_conf.append(team_data)
            else:
                western_conf.append(team_data)
        
        # Sort by wins descending
        eastern_conf.sort(key=lambda x: (x["wins"], x["win_pct"]), reverse=True)
        western_conf.sort(key=lambda x: (x["wins"], x["win_pct"]), reverse=True)
        
        return {
            "league": "NBA",
            "season": season_fmt if season_fmt else "2024-25",
            "eastern_conference": eastern_conf,
            "western_conference": western_conf
        }
    except Exception as e:
        return {
            "error": str(e),
            "league": "NBA",
            "eastern_conference": [],
            "western_conference": []
        }
