"""
File: app/routes/historical.py
Author: Maaz Haque
Purpose: Endpoint for fetching historical game data from all supported leagues with
         comprehensive filtering options. Designed for sports statistics analysis, trends,
         and performance research across different time periods and teams.
"""

from flask import Blueprint, request
from datetime import datetime, timedelta
from ..services.nba_service import get_historical_games as get_nba_historical
from ..services.nfl_service import get_historical_games as get_nfl_historical
from ..services.soccer_service import get_historical_games as get_soccer_historical

# Blueprint for historical games data across all leagues
bp = Blueprint("historical", __name__)


@bp.get("/")
@bp.get("")
def all_leagues_historical():
    """Get historical games from all supported leagues with filtering options."""
    try:
        # Parse query parameters
        start_date = request.args.get("start_date")  # YYYY-MM-DD format
        end_date = request.args.get("end_date")      # YYYY-MM-DD format
        season = request.args.get("season")          # e.g., "2023", "2023-24"
        team_id = request.args.get("team_id")        # Filter by specific team
        league = request.args.get("league")          # Filter by specific league
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        # Default date range if not provided (last 30 days)
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        # Soccer leagues filter
        soccer_leagues = request.args.getlist("soccer_leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        
        result = {
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "season": season,
                "team_id": team_id,
                "league": league,
                "page": page,
                "per_page": per_page
            },
            "leagues": {
                "NBA": {"games": [], "error": None, "total_games": 0},
                "NFL": {"games": [], "error": None, "total_games": 0},
                "Soccer": {"games": [], "error": None, "total_games": 0}
            },
            "stats_analysis": {
                "historical_data_available": True,
                "supported_analysis": ["trend_analysis", "team_performance", "head_to_head", "season_patterns"],
                "note": "Complete statistical data available for analysis and trend identification"
            }
        }
        
        # Filter by specific league if requested
        leagues_to_fetch = ["NBA", "NFL", "Soccer"]
        if league:
            league_upper = league.upper()
            if league_upper in leagues_to_fetch:
                leagues_to_fetch = [league_upper]
        
        # Get NBA historical games
        if "NBA" in leagues_to_fetch:
            try:
                nba_data = get_nba_historical(
                    start_date=start_date,
                    end_date=end_date,
                    season=season,
                    team_id=team_id,
                    page=page,
                    per_page=per_page
                )
                if isinstance(nba_data, dict):
                    result["leagues"]["NBA"]["games"] = nba_data.get("data", [])
                    result["leagues"]["NBA"]["total_games"] = len(result["leagues"]["NBA"]["games"])
                    if "meta" in nba_data:
                        result["leagues"]["NBA"]["meta"] = nba_data["meta"]
            except Exception as e:
                result["leagues"]["NBA"]["error"] = str(e)
        
        # Get NFL historical games
        if "NFL" in leagues_to_fetch:
            try:
                nfl_data = get_nfl_historical(
                    start_date=start_date,
                    end_date=end_date,
                    season=season,
                    team_id=team_id,
                    page=page,
                    per_page=per_page
                )
                if isinstance(nfl_data, dict):
                    result["leagues"]["NFL"]["games"] = nfl_data.get("data", nfl_data.get("events", []))
                    result["leagues"]["NFL"]["total_games"] = len(result["leagues"]["NFL"]["games"])
                    if "meta" in nfl_data:
                        result["leagues"]["NFL"]["meta"] = nfl_data["meta"]
            except Exception as e:
                result["leagues"]["NFL"]["error"] = str(e)
        
        # Get Soccer historical games
        if "Soccer" in leagues_to_fetch:
            try:
                soccer_data = get_soccer_historical(
                    start_date=start_date,
                    end_date=end_date,
                    leagues=soccer_leagues,
                    team_id=team_id,
                    page=page,
                    per_page=per_page
                )
                if isinstance(soccer_data, dict):
                    result["leagues"]["Soccer"]["games"] = soccer_data.get("data", soccer_data.get("matches", []))
                    result["leagues"]["Soccer"]["total_games"] = len(result["leagues"]["Soccer"]["games"])
                    if "meta" in soccer_data:
                        result["leagues"]["Soccer"]["meta"] = soccer_data["meta"]
            except Exception as e:
                result["leagues"]["Soccer"]["error"] = str(e)
        
        # Calculate summary statistics
        total_games = sum([
            result["leagues"]["NBA"]["total_games"],
            result["leagues"]["NFL"]["total_games"],
            result["leagues"]["Soccer"]["total_games"]
        ])
        
        result["summary"] = {
            "total_games_found": total_games,
            "date_range_days": (datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")).days,
            "leagues_with_data": [
                league for league, data in result["leagues"].items() 
                if data["total_games"] > 0
            ]
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch historical games: {str(e)}"}, 500


@bp.get("/nba")
def nba_historical():
    """Get NBA historical games only."""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        season = request.args.get("season")
        team_id = request.args.get("team_id")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        return get_nba_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        return {"error": f"Failed to fetch NBA historical games: {str(e)}"}, 500


@bp.get("/nfl")
def nfl_historical():
    """Get NFL historical games only."""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        season = request.args.get("season")
        team_id = request.args.get("team_id")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        return get_nfl_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        return {"error": f"Failed to fetch NFL historical games: {str(e)}"}, 500


@bp.get("/soccer")
def soccer_historical():
    """Get Soccer historical games only."""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        leagues = request.args.getlist("leagues") or ["MLS", "EPL", "LaLiga", "UCL"]
        team_id = request.args.get("team_id")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        return get_soccer_historical(
            start_date=start_date,
            end_date=end_date,
            leagues=leagues,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        return {"error": f"Failed to fetch Soccer historical games: {str(e)}"}, 500


@bp.get("/trends")
def statistical_trends():
    """Get statistical trends and analysis from historical data."""
    try:
        league = request.args.get("league", "").upper()
        team_id = request.args.get("team_id")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        stat_type = request.args.get("stat_type", "all")  # scoring, defensive, team_performance, all
        
        # Default to last 90 days if no date range provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        result = {
            "filters": {
                "league": league or "ALL",
                "team_id": team_id,
                "start_date": start_date,
                "end_date": end_date,
                "stat_type": stat_type
            },
            "trends": {
                "note": "Statistical trends analysis based on historical game data",
                "supported_metrics": [
                    "win_rate", "scoring_average", "defensive_rating", 
                    "home_advantage", "scoring_trends", "performance_trends"
                ]
            },
            "analysis": {
                "team_performance": {},
                "scoring_patterns": {},
                "seasonal_trends": {}
            }
        }
        
        # Note: This would be populated with actual statistical analysis
        result["analysis"]["note"] = "Statistical analysis based on historical game performance and team statistics"
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to generate statistical trends: {str(e)}"}, 500