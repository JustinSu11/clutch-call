"""
File: app/routes/nba.py
Author: Maaz Haque
Purpose: Exposes NBA endpoints using the free balldontlie API. Endpoints return JSON
         data for games, single-game details, basic box scores (via stats), a team's
         recent games, and upcoming games within a date window.
"""

from flask import Blueprint, request
from ..services.nba_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_team_last_games,
    get_upcoming_games,
)

# Blueprint for NBA-related routes; mounted by the app factory at /api/v1/nba
bp = Blueprint("nba", __name__)


@bp.get("/games")
def nba_games():
    """List games with optional filters.

    Query params:
        season (str): Season year (e.g., 2024)
        team_id (str): Team ID filter
        page (int): Pagination page (default 1)
        per_page (int): Items per page (default 25)
    """
    season = request.args.get("season")
    team_id = request.args.get("team_id")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 25))
    data = get_games(season=season, team_id=team_id, page=page, per_page=per_page)
    return data


@bp.get("/game/<int:game_id>")
def nba_game_by_id(game_id: int):
    """Fetch a single game by its balldontlie game ID."""
    return get_game_by_id(game_id)


@bp.get("/game/<int:game_id>/boxscore")
def nba_box_score(game_id: int):
    """Fetch basic per-player stats for the specified game."""
    return get_box_score(game_id)


@bp.get("/teams/<int:team_id>/last")
def nba_team_last(team_id: int):
    """Get a team's recent games.

    Query params:
        n (int): Number of recent games to return (default 5)
        season (str): Optional season filter (e.g., 2024)
    """
    n = int(request.args.get("n", 5))
    season = request.args.get("season")
    return get_team_last_games(team_id, n=n, season=season)


@bp.get("/upcoming")
def nba_upcoming():
    """List games between today and today+days (default 7)."""
    days = int(request.args.get("days", 7))
    return get_upcoming_games(days=days)
