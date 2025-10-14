"""
File: app/services/nfl_service.py
Author: Maaz Haque
Purpose: Service functions for NFL data via ESPN's public JSON endpoints. Provides
         helpers used by the route layer for listing games, fetching a single event,
         retrieving box scores, and listing upcoming games.
         *** UPDATED to use LIVE data for AI predictions. ***
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import requests
import joblib
import pandas as pd
import os

# ESPN public API endpoints
SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
EVENT = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary"


# --- AI MODEL INTEGRATION ---

# Load the saved NFL model from file
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../models/saved_models/nfl_model.pkl')
try:
    model = joblib.load(MODEL_PATH)
    print("NFL prediction model loaded successfully.")
except Exception as e:
    print(f"Error loading NFL model: {e}")
    model = None

def _extract_team_stats(team_data: Dict[str, Any]):
    """Helper function to find and extract season stats from the ESPN payload."""
    # The stats are often nested in a list called 'stats'
    for stat in team_data.get("statistics", []):
        if stat.get("name") == "totalYards":
            return float(stat.get("displayValue", 350.0))
    return 350.0 # Return an average value if stats aren't found

def generate_prediction_for_game(event_id: str):
    """
    Orchestrator function that uses LIVE data to generate a prediction.
    """
    if model is None:
        return {"error": "Model not loaded. Cannot make a prediction."}
    
    try:
        # 1. Get live game data from the ESPN summary endpoint
        game_data = get_game_by_id(event_id)
        
        # 2. Feature Engineering: Parse the JSON to find the stats for each team
        boxscore = game_data.get("boxscore", {})
        teams_data = boxscore.get("teams", [])
        
        home_team_stats = teams_data[1] if teams_data and teams_data[1].get('homeAway') == 'home' else {}
        away_team_stats = teams_data[0] if teams_data and teams_data[0].get('homeAway') == 'away' else {}

        if not home_team_stats or not away_team_stats:
             return {"error": "Could not find team stat data in the API response."}

        # Extract the specific stats our model was trained on
        home_off_yards = _extract_team_stats(home_team_stats)
        away_off_yards = _extract_team_stats(away_team_stats)
        
        # For this model, we'll assume defensive yards allowed is similar to opponent's offensive yards.
        # A more complex model would need a direct 'defensiveYards' stat.
        home_def_yards = away_off_yards 
        away_def_yards = home_off_yards

        # 3. Format features to match the model's "contract"
        feature_data = pd.DataFrame(
            [[home_off_yards, home_def_yards, away_off_yards, away_def_yards]], 
            columns=['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']
        )
        
        # 4. Make the prediction
        prediction = model.predict(feature_data)
        prediction_proba = model.predict_proba(feature_data)

        winner_index = prediction[0]
        confidence = prediction_proba[0][winner_index]
        winner = "Home" if winner_index == 1 else "Away"
        
        return {
            "predicted_winner": winner,
            "confidence": f"{confidence * 100:.2f}%",
        }
    except Exception as e:
        return {"error": "Failed to generate NFL prediction.", "details": str(e)}

# --- END AI MODEL INTEGRATION ---


def _get(url: str, params: Optional[Dict[str, Any]] = None):
    """Perform a GET request against ESPN and return parsed JSON."""
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def get_games(week: Optional[str] = None, season: Optional[str] = None):
    """Return NFL games from the scoreboard with optional week/season filters."""
    params: Dict[str, Any] = {}
    if week:
        params["week"] = week
    if season:
        params["dates"] = season
    return _get(SCOREBOARD, params)


def get_game_by_id(event_id: str):
    """Fetch a single game summary using ESPN event ID."""
    return _get(EVENT, {"event": event_id})


def get_box_score(event_id: str):
    """Extract game box score from the summary payload if present."""
    data = _get(EVENT, {"event": event_id})
    comps = (data or {}).get("competitions", [])
    if comps:
        box = comps[0].get("boxscore") or data.get("boxscore")
    else:
        box = data.get("boxscore")
    return {"eventId": event_id, "boxscore": box}


def get_upcoming_games(days: int = 7):
    """List NFL games between today and today+days using ESPN date range format."""
    today = datetime.utcnow().date()
    end = today + timedelta(days=days)
    fmt = "%Y%m%d"
    params = {"dates": f"{today.strftime(fmt)}-{end.strftime(fmt)}"}
    return _get(SCOREBOARD, params)


def get_today_games():
    """List NFL games for today using ESPN scoreboard."""
    today = datetime.utcnow().date()
    fmt = "%Y%m%d"
    params = {"dates": today.strftime(fmt)}
    data = _get(SCOREBOARD, params)
    
    if "events" in data:
        for event in data["events"]:
            event["league"] = "NFL"
    
    return data
    return data


def get_live_games():
    """Get currently live/active NFL games."""
    try:
        today = datetime.utcnow().date()
        fmt = "%Y%m%d"
        params = {"dates": today.strftime(fmt)}
        data = _get(SCOREBOARD, params)
        
        live_events = []
        if "events" in data:
            for event in data["events"]:
                status = event.get("status", {})
                status_type = status.get("type", {}).get("name", "").lower()
                
                # Check if game is currently active
                if status_type in ["in-progress", "live"]:
                    event["league"] = "NFL"
                    event["live"] = True
                    live_events.append(event)
        
        # Return in same format as regular games but filtered for live only
        result = data.copy()
        result["events"] = live_events
        return result
        
    except Exception as e:
        return {"error": str(e), "events": []}


def get_historical_games(start_date=None, end_date=None, season=None, team_id=None, page=1, per_page=50):
    """Get historical NFL games with filtering options."""
    try:
        params = {}
        
        # Handle date range
        if start_date and end_date:
            # Convert YYYY-MM-DD to YYYYMMDD
            start_fmt = start_date.replace("-", "")
            end_fmt = end_date.replace("-", "")
            params["dates"] = f"{start_fmt}-{end_fmt}"
        elif season:
            # Use season year
            params["dates"] = season
        else:
            # Default to last 30 days
            today = datetime.utcnow().date()
            start = today - timedelta(days=30)
            fmt = "%Y%m%d"
            params["dates"] = f"{start.strftime(fmt)}-{today.strftime(fmt)}"
        
        data = _get(SCOREBOARD, params)
        
        # Add historical context and filter by team if specified
        if "events" in data:
            events = data["events"]
            
            # Filter by team_id if provided
            if team_id:
                filtered_events = []
                for event in events:
                    competitors = event.get("competitions", [{}])[0].get("competitors", [])
                    for comp in competitors:
                        if comp.get("team", {}).get("id") == team_id:
                            filtered_events.append(event)
                            break
                events = filtered_events
            
            # Add historical context
            for event in events:
                event["league"] = "NFL"
                event["historical"] = True
                event["stats_context"] = "Historical statistics and performance data available"
            
            # Simple pagination
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            paginated_events = events[start_idx:end_idx]
            
            result = data.copy()
            result["events"] = paginated_events
            result["meta"] = {
                "page": page,
                "per_page": per_page,
                "total": len(events)
            }
            return result
        
        return data
        
    except Exception as e:
        return {"error": str(e), "events": [], "meta": {"page": page, "per_page": per_page, "total": 0}}
