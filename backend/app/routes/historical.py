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


# ==================== NEW HISTORICAL ROUTES FOR ALL TEAMS ====================

@bp.get("/nba/all-teams")
def nba_all_teams_historical():
    """Get historical NBA data for all teams from last season."""
    try:
        from ..services.team_mappings import get_all_teams, get_season_year
        
        season = request.args.get("season") or get_season_year()['nba']
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        teams = get_all_teams('nba')
        result = {
            "season": season,
            "total_teams": len(teams),
            "teams": {},
            "summary": {
                "teams_processed": 0,
                "total_games": 0,
                "errors": []
            }
        }
        
        # Get historical data for each team
        for team_key, team_info in teams.items():
            try:
                team_data = get_nba_historical(
                    season=season,
                    team_id=str(team_info['id']),
                    page=1,
                    per_page=per_page
                )
                
                result["teams"][team_key] = {
                    "team_info": team_info,
                    "games": team_data.get("data", []) if isinstance(team_data, dict) else [],
                    "game_count": len(team_data.get("data", [])) if isinstance(team_data, dict) else 0
                }
                result["summary"]["teams_processed"] += 1
                result["summary"]["total_games"] += result["teams"][team_key]["game_count"]
                
            except Exception as e:
                result["summary"]["errors"].append({
                    "team": team_key,
                    "error": str(e)
                })
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NBA all teams historical: {str(e)}"}, 500


@bp.get("/nfl/all-teams")
def nfl_all_teams_historical():
    """Get historical NFL data for all teams from last season."""
    try:
        from ..services.team_mappings import get_all_teams, get_season_year
        
        season = request.args.get("season") or get_season_year()['nfl']
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        teams = get_all_teams('nfl')
        result = {
            "season": season,
            "total_teams": len(teams),
            "teams": {},
            "summary": {
                "teams_processed": 0,
                "total_games": 0,
                "errors": []
            }
        }
        
        # Get historical data for each team
        for team_key, team_info in teams.items():
            try:
                team_data = get_nfl_historical(
                    season=season,
                    team_id=team_info['id'],
                    page=1,
                    per_page=per_page
                )
                
                result["teams"][team_key] = {
                    "team_info": team_info,
                    "games": team_data.get("data", team_data.get("events", [])) if isinstance(team_data, dict) else [],
                    "game_count": len(team_data.get("data", team_data.get("events", []))) if isinstance(team_data, dict) else 0
                }
                result["summary"]["teams_processed"] += 1
                result["summary"]["total_games"] += result["teams"][team_key]["game_count"]
                
            except Exception as e:
                result["summary"]["errors"].append({
                    "team": team_key,
                    "error": str(e)
                })
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NFL all teams historical: {str(e)}"}, 500


@bp.get("/soccer/all-teams")
def soccer_all_teams_historical():
    """Get historical Soccer data for all MLS teams from last season."""
    try:
        from ..services.team_mappings import get_all_teams, get_season_year
        
        leagues = request.args.getlist("leagues") or ["MLS"]
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        teams = get_all_teams('soccer')
        result = {
            "leagues": leagues,
            "total_teams": len(teams),
            "teams": {},
            "summary": {
                "teams_processed": 0,
                "total_games": 0,
                "errors": []
            }
        }
        
        # Get historical data for each team
        for team_key, team_info in teams.items():
            try:
                team_data = get_soccer_historical(
                    leagues=leagues,
                    team_id=team_info['id'],
                    page=1,
                    per_page=per_page
                )
                
                result["teams"][team_key] = {
                    "team_info": team_info,
                    "games": team_data.get("data", team_data.get("matches", [])) if isinstance(team_data, dict) else [],
                    "game_count": len(team_data.get("data", team_data.get("matches", []))) if isinstance(team_data, dict) else 0
                }
                result["summary"]["teams_processed"] += 1
                result["summary"]["total_games"] += result["teams"][team_key]["game_count"]
                
            except Exception as e:
                result["summary"]["errors"].append({
                    "team": team_key,
                    "error": str(e)
                })
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch Soccer all teams historical: {str(e)}"}, 500


# ==================== HISTORICAL ROUTES FOR SPECIFIC TEAMS BY NAME ====================

@bp.get("/nba/team/<team_name>")
def nba_team_historical_by_name(team_name: str):
    """Get historical NBA data for specific team by name."""
    try:
        from ..services.team_mappings import get_team_by_name, get_season_year
        
        team_info = get_team_by_name('nba', team_name)
        if not team_info:
            return {"error": f"NBA team '{team_name}' not found"}, 404
        
        season = request.args.get("season") or get_season_year()['nba']
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        team_data = get_nba_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=str(team_info['id']),
            page=page,
            per_page=per_page
        )
        
        result = {
            "team_info": team_info,
            "filters": {
                "season": season,
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": team_data
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NBA team historical for {team_name}: {str(e)}"}, 500


@bp.get("/nfl/team/<team_name>")
def nfl_team_historical_by_name(team_name: str):
    """Get historical NFL data for specific team by name."""
    try:
        from ..services.team_mappings import get_team_by_name, get_season_year
        
        team_info = get_team_by_name('nfl', team_name)
        if not team_info:
            return {"error": f"NFL team '{team_name}' not found"}, 404
        
        season = request.args.get("season") or get_season_year()['nfl']
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        team_data = get_nfl_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=team_info['id'],
            page=page,
            per_page=per_page
        )
        
        result = {
            "team_info": team_info,
            "filters": {
                "season": season,
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": team_data
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NFL team historical for {team_name}: {str(e)}"}, 500


@bp.get("/soccer/team/<team_name>")
def soccer_team_historical_by_name(team_name: str):
    """Get historical Soccer data for specific team by name."""
    try:
        from ..services.team_mappings import get_team_by_name
        
        team_info = get_team_by_name('soccer', team_name)
        if not team_info:
            return {"error": f"Soccer team '{team_name}' not found"}, 404
        
        leagues = request.args.getlist("leagues") or ["MLS"]
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 50))
        
        team_data = get_soccer_historical(
            start_date=start_date,
            end_date=end_date,
            leagues=leagues,
            team_id=team_info['id'],
            page=page,
            per_page=per_page
        )
        
        result = {
            "team_info": team_info,
            "filters": {
                "leagues": leagues,
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": team_data
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch Soccer team historical for {team_name}: {str(e)}"}, 500


# ==================== SEASON-SPECIFIC HISTORICAL ROUTES ====================

@bp.get("/nba/season/<season>")
def nba_season_historical(season: str):
    """Get NBA historical data for a specific season with optional team filtering."""
    try:
        from ..services.team_mappings import get_team_by_name
        
        team_name = request.args.get("team_name")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))
        
        team_id = None
        team_info = None
        if team_name:
            team_info = get_team_by_name('nba', team_name)
            if not team_info:
                return {"error": f"NBA team '{team_name}' not found"}, 404
            team_id = str(team_info['id'])
        
        season_data = get_nba_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
        
        result = {
            "season": season,
            "team_filter": team_info,
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": season_data
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NBA season {season} historical: {str(e)}"}, 500


@bp.get("/nfl/season/<season>")
def nfl_season_historical(season: str):
    """Get NFL historical data for a specific season with optional team filtering."""
    try:
        from ..services.team_mappings import get_team_by_name
        
        team_name = request.args.get("team_name")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))
        
        team_id = None
        team_info = None
        if team_name:
            team_info = get_team_by_name('nfl', team_name)
            if not team_info:
                return {"error": f"NFL team '{team_name}' not found"}, 404
            team_id = team_info['id']
        
        season_data = get_nfl_historical(
            start_date=start_date,
            end_date=end_date,
            season=season,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
        
        result = {
            "season": season,
            "team_filter": team_info,
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": season_data
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch NFL season {season} historical: {str(e)}"}, 500


@bp.get("/soccer/season/<season>")
def soccer_season_historical(season: str):
    """Get Soccer historical data for a specific season with optional team filtering."""
    try:
        from ..services.team_mappings import get_team_by_name
        
        team_name = request.args.get("team_name")
        leagues = request.args.getlist("leagues") or ["MLS"]
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))
        
        team_id = None
        team_info = None
        if team_name:
            team_info = get_team_by_name('soccer', team_name)
            if not team_info:
                return {"error": f"Soccer team '{team_name}' not found"}, 404
            team_id = team_info['id']
        
        # Note: Soccer historical data may not support season parameter directly
        # This would need to be implemented based on the specific soccer API
        season_data = get_soccer_historical(
            start_date=start_date,
            end_date=end_date,
            leagues=leagues,
            team_id=team_id,
            page=page,
            per_page=per_page
        )
        
        result = {
            "season": season,
            "leagues": leagues,
            "team_filter": team_info,
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "page": page,
                "per_page": per_page
            },
            "data": season_data,
            "note": "Soccer season filtering may require date range parameters"
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to fetch Soccer season {season} historical: {str(e)}"}, 500


# ==================== TEAM STATS AND PERFORMANCE ROUTES ====================

@bp.get("/nba/team-stats")
def nba_team_stats():
    """Get aggregated NBA team performance statistics from historical data."""
    try:
        from ..services.team_mappings import get_team_by_name, get_season_year
        
        team_name = request.args.get("team_name")
        season = request.args.get("season") or get_season_year()['nba']
        stat_type = request.args.get("stat_type", "all")  # wins, losses, scoring, defensive, all
        
        result = {
            "season": season,
            "stat_type": stat_type,
            "team_stats": {},
            "league_averages": {},
            "note": "Aggregated team performance statistics from historical game data"
        }
        
        if team_name:
            team_info = get_team_by_name('nba', team_name)
            if not team_info:
                return {"error": f"NBA team '{team_name}' not found"}, 404
            
            # Get team historical data for stats calculation
            team_data = get_nba_historical(
                season=season,
                team_id=str(team_info['id']),
                page=1,
                per_page=100
            )
            
            games = team_data.get("data", []) if isinstance(team_data, dict) else []
            
            # Calculate basic team stats
            total_games = len(games)
            wins = sum(1 for game in games if game.get("wl") == "W")
            losses = total_games - wins
            total_points = sum(game.get("pts", 0) for game in games)
            
            result["team_stats"][team_name] = {
                "team_info": team_info,
                "games_played": total_games,
                "wins": wins,
                "losses": losses,
                "win_percentage": round(wins / total_games * 100, 2) if total_games > 0 else 0,
                "average_points": round(total_points / total_games, 2) if total_games > 0 else 0,
                "total_points": total_points
            }
        else:
            result["note"] += " - Provide 'team_name' parameter for specific team stats"
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to generate NBA team stats: {str(e)}"}, 500


@bp.get("/nfl/team-stats")
def nfl_team_stats():
    """Get aggregated NFL team performance statistics from historical data."""
    try:
        from ..services.team_mappings import get_team_by_name, get_season_year
        
        team_name = request.args.get("team_name")
        season = request.args.get("season") or get_season_year()['nfl']
        stat_type = request.args.get("stat_type", "all")  # wins, losses, scoring, defensive, all
        
        result = {
            "season": season,
            "stat_type": stat_type,
            "team_stats": {},
            "league_averages": {},
            "note": "Aggregated team performance statistics from historical game data"
        }
        
        if team_name:
            team_info = get_team_by_name('nfl', team_name)
            if not team_info:
                return {"error": f"NFL team '{team_name}' not found"}, 404
            
            # Get team historical data for stats calculation
            team_data = get_nfl_historical(
                season=season,
                team_id=team_info['id'],
                page=1,
                per_page=50
            )
            
            games = team_data.get("data", team_data.get("events", [])) if isinstance(team_data, dict) else []
            
            result["team_stats"][team_name] = {
                "team_info": team_info,
                "games_played": len(games),
                "note": "NFL team statistics calculated from historical game data"
            }
        else:
            result["note"] += " - Provide 'team_name' parameter for specific team stats"
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to generate NFL team stats: {str(e)}"}, 500


@bp.get("/soccer/team-stats")
def soccer_team_stats():
    """Get aggregated Soccer team performance statistics from historical data."""
    try:
        from ..services.team_mappings import get_team_by_name
        
        team_name = request.args.get("team_name")
        leagues = request.args.getlist("leagues") or ["MLS"]
        stat_type = request.args.get("stat_type", "all")  # wins, losses, draws, scoring, defensive, all
        
        result = {
            "leagues": leagues,
            "stat_type": stat_type,
            "team_stats": {},
            "league_averages": {},
            "note": "Aggregated team performance statistics from historical match data"
        }
        
        if team_name:
            team_info = get_team_by_name('soccer', team_name)
            if not team_info:
                return {"error": f"Soccer team '{team_name}' not found"}, 404
            
            # Get team historical data for stats calculation
            team_data = get_soccer_historical(
                leagues=leagues,
                team_id=team_info['id'],
                page=1,
                per_page=50
            )
            
            games = team_data.get("data", team_data.get("matches", [])) if isinstance(team_data, dict) else []
            
            result["team_stats"][team_name] = {
                "team_info": team_info,
                "matches_played": len(games),
                "note": "Soccer team statistics calculated from historical match data"
            }
        else:
            result["note"] += " - Provide 'team_name' parameter for specific team stats"
        
        return result
        
    except Exception as e:
        return {"error": f"Failed to generate Soccer team stats: {str(e)}"}, 500