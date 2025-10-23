"""
File: app/routes/soccer.py
Author: Maaz Haque
Purpose: Soccer endpoints backed by ESPN's public JSON APIs. Supports multiple leagues
         via a query param (default MLS). Provides listings, single game details,
         box scores, and upcoming games.
"""

from flask import Blueprint, request
from ..services.soccer_service import (
    get_games,
    get_game_by_id,
    get_box_score,
    get_upcoming_games,
    get_today_games,
    get_standings,
)

# Blueprint for Soccer routes; mounted at /api/v1/soccer
bp = Blueprint("soccer", __name__)


@bp.get("/games")
def soccer_games():
    """List soccer games for a given league and optional date (YYYYMMDD)."""
    league = request.args.get("league", "MLS")
    date = request.args.get("date")
    return get_games(league=league, date=date)


@bp.get("/game/<event_id>")
def soccer_game_by_id(event_id: str):
    """Fetch a single soccer game by ESPN event ID for a given league."""
    league = request.args.get("league", "MLS")
    return get_game_by_id(event_id, league=league)


@bp.get("/game/<event_id>/boxscore")
def soccer_box_score(event_id: str):
    """Fetch the box score for a soccer game by ESPN event ID for a given league."""
    league = request.args.get("league", "MLS")
    return get_box_score(event_id, league=league)


@bp.get("/upcoming")
def soccer_upcoming():
    """List upcoming soccer games for a league in the next N days (default 7)."""
    league = request.args.get("league", "MLS")
    days = int(request.args.get("days", 7))
    return get_upcoming_games(league=league, days=days)


@bp.get("/today")
def soccer_today():
    """List soccer games for today for a specific league."""
    league = request.args.get("league", "MLS")
    return get_today_games(league=league)


@bp.get("/standings")
def soccer_standings():
    """Get soccer standings for a given league.
    
    Query params:
        league (str): League key (MLS, EPL, LaLiga) - default MLS
        season (str): Optional season year (e.g., 2024)
    """
    league = request.args.get("league", "MLS")
    season = request.args.get("season")
    return get_standings(league=league, season=season)
