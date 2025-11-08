"""
Final working nfl_service.py - Matches emergency_fix model
Replace: backend/app/services/nfl_service.py

FIXES:
- Added game status check to prevent predictions on upcoming games
- Returns clear error message for pre-game predictions
- Model only works on in-progress or completed games with actual statistics
- Enhanced debugging to track where errors occur
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import requests
import joblib
import pandas as pd
import os
import traceback

SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
EVENT = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary"
STANDINGS = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings"

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../models/saved_models/nfl_model.pkl')
try:
    model = joblib.load(MODEL_PATH)
    print("✅ NFL model loaded")
    print(f"   Features: {model.n_features_in_}")
except Exception as e:
    print(f"❌ Model load error: {e}")
    model = None


def generate_prediction_for_game(event_id: str):
    """Generate prediction using actual game yard statistics."""
    print(f"\n{'='*60}")
    print(f"🏈 PREDICTION FOR: {event_id}")
    
    if model is None:
        print("❌ Model not loaded")
        return {"error": "Model not loaded"}
    
    try:
        # Step 1: Fetch game data
        print(f"📡 Fetching game data...")
        game_data = get_game_by_id(event_id)
        
        # DEBUG: Show top-level keys
        print(f"🔍 Top-level keys in response: {list(game_data.keys())}")
        
        # Step 2: Access competitions - check different possible locations
        competitions = game_data.get("competitions", [])
        
        # If not found at top level, check inside 'header'
        if not competitions and "header" in game_data:
            competitions = game_data.get("header", {}).get("competitions", [])
            print(f"🔍 Found competitions in 'header'")
        
        if not competitions:
            print(f"❌ No competitions data found")
            print(f"🔍 Available keys: {list(game_data.keys())}")
            return {"error": f"No competitions data found for event {event_id}"}
        
        comp = competitions[0]
        print(f"✅ Competition data retrieved")
        
        # Step 3: CHECK GAME STATUS
        status = comp.get("status", {})
        status_type = status.get("type", {}).get("name", "unknown").lower()
        status_state = status.get("type", {}).get("state", "unknown").lower()
        
        print(f"📋 Game Status: '{status_type}' (state: '{status_state}')")
        
        # Check if game is scheduled/upcoming
        if status_state == "pre":
            print(f"⚠️  Game has NOT started - status_state is 'pre'")
            return {
                "error": "Cannot predict upcoming games",
                "message": "This model predicts outcomes based on in-game yard statistics. The game must be in progress or completed.",
                "game_status": status_type,
                "status_state": status_state,
                "event_id": event_id,
                "suggestion": "Please wait until the game starts to get a prediction."
            }
        
        if status_type in ["scheduled", "pre"]:
            print(f"⚠️  Game has NOT started - status_type is '{status_type}'")
            return {
                "error": "Cannot predict upcoming games",
                "message": "This model predicts outcomes based on in-game yard statistics. The game must be in progress or completed.",
                "game_status": status_type,
                "status_state": status_state,
                "event_id": event_id,
                "suggestion": "Please wait until the game starts to get a prediction."
            }
        
        print(f"✅ Game is live or completed - proceeding with prediction")
        
        # Step 4: Get competitors
        competitors = comp.get("competitors", [])
        
        home = next((c for c in competitors if c.get("homeAway") == "home"), None)
        away = next((c for c in competitors if c.get("homeAway") == "away"), None)
        
        if not home or not away:
            # Fallback: Check boxscore teams if not in main competitors list
            boxscore_teams = game_data.get("boxscore", {}).get("teams", [])
            if len(boxscore_teams) == 2:
                home = next((t for t in boxscore_teams if t.get("homeAway") == "home"), None)
                away = next((t for t in boxscore_teams if t.get("homeAway") == "away"), None)

        if not home or not away:
            print(f"❌ Cannot find home/away teams")
            return {"error": f"Cannot find teams for event {event_id}"}
        
        home_team_name = home.get("team", {}).get("displayName", "Unknown")
        away_team_name = away.get("team", {}).get("displayName", "Unknown")
        print(f"🏟️  {away_team_name} @ {home_team_name}")
        
        # Step 5: Extract total yards from statistics
        home_yards = 300.0
        away_yards = 300.0
        
        home_stats = home.get("statistics", [])
        away_stats = away.get("statistics", [])
        
        print(f"📊 Extracting statistics...")
        print(f"   Home stats available: {len(home_stats)} items")
        print(f"   Away stats available: {len(away_stats)} items")
        
        for stat in home_stats:
            if stat.get("name") == "totalYards":
                val_str = stat.get("displayValue") or "300"
                home_yards = float(val_str.replace(",", ""))
                print(f"   ✓ Home yards from stats: {home_yards}")
        
        for stat in away_stats:
            if stat.get("name") == "totalYards":
                val_str = stat.get("displayValue") or "300"
                away_yards = float(val_str.replace(",", ""))
                print(f"   ✓ Away yards from stats: {away_yards}")
        
        # Fallback: use boxscore stats if available
        if home_yards == 300.0 or away_yards == 300.0:
            print(f"⚠️  Missing stats, checking boxscore...")
            boxscore = game_data.get("boxscore", {})
            teams = boxscore.get("teams", [])
            
            for team in teams:
                if team.get("homeAway") == "home":
                    for stat in team.get("statistics", []):
                        if stat.get("name") == "totalYards":
                            val_str = stat.get("displayValue") or "300"
                            home_yards = float(val_str.replace(",", ""))
                            print(f"   ✓ Home yards from boxscore: {home_yards}")
                elif team.get("homeAway") == "away":
                    for stat in team.get("statistics", []):
                        if stat.get("name") == "totalYards":
                            val_str = stat.get("displayValue") or "300"
                            away_yards = float(val_str.replace(",", ""))
                            print(f"   ✓ Away yards from boxscore: {away_yards}")
        
        # Check if we still have default values (no stats found)
        if home_yards == 300.0 and away_yards == 300.0:
            print(f"⚠️  No yard statistics found - using defaults")
            print(f"⚠️  This likely means the game hasn't generated stats yet")
            return {
                "error": "Insufficient game data",
                "message": "No yard statistics available for this game yet. The game may have just started.",
                "game_status": status_type,
                "status_state": status_state,
                "event_id": event_id
            }
        
        yard_diff = home_yards - away_yards
        
        print(f"📊 FEATURES:")
        print(f"   Home Total Yards: {home_yards:.1f}")
        print(f"   Away Total Yards: {away_yards:.1f}")
        print(f"   Yard Differential: {yard_diff:+.1f}")
        
        # Step 6: Create features and predict
        features = pd.DataFrame(
            [[home_yards, away_yards, yard_diff]], 
            columns=['HomeYards', 'AwayYards', 'YardDiff']
        )
        
                # Predict
        prediction = model.predict(features)
        proba = model.predict_proba(features)
        
        predicted_class = int(prediction[0])
        home_prob = float(proba[0][1])
        away_prob = float(proba[0][0])
        
        predicted_winner = "home" if predicted_class == 1 else "away"
        confidence = home_prob if predicted_class == 1 else away_prob
        
        # Calculate decision_factors using feature importances
        # This shows which features most influenced the model's decision
        feature_names = ['HomeYards', 'AwayYards', 'YardDiff']
        feature_importances = model.feature_importances_
        
        # Calculate decision factors for this specific prediction
        decision_factors = {}
        for i, feature_name in enumerate(feature_names):
            importance = float(feature_importances[i])
            feature_value = float(features.iloc[0][feature_name])
            
            # Calculate contribution (how much this feature value influenced the prediction)
            # For home yards: higher = more home win
            # For away yards: higher = less home win (more away win)
            # For yard diff: positive = home advantage
            if feature_name == 'HomeYards':
                contribution = (home_yards - 300) * importance  # 300 is rough average
            elif feature_name == 'AwayYards':
                contribution = -(away_yards - 300) * importance  # Negative because higher away = less home win
            else:  # YardDiff
                contribution = yard_diff * importance
            
            decision_factors[feature_name] = {
                "importance": round(importance * 100, 2),  # Feature importance percentage
                "value": round(feature_value, 1),
                "contribution": round(contribution, 2)  # How much this feature influenced this prediction
            }
        
        print(f"\n🤖 PREDICTION:")
        print(f"   Winner: {predicted_winner.upper()}")
        print(f"   Home: {home_prob:.1%}, Away: {away_prob:.1%}")
        print(f"   Confidence: {confidence:.1%}")
        print(f"{'='*60}\n")
        
        return {
            "prediction": predicted_winner,
            "predicted_winner": predicted_winner,
            "confidence": round(confidence * 100, 2),
            "home_win_probability": round(home_prob * 100, 2),
            "away_win_probability": round(away_prob * 100, 2),
            "decision_factors": decision_factors,  # Add this line
            "model_info": {
                "type": "RandomForestClassifier",
                "raw_prediction": predicted_class
            },
            "features_used": {
                "HomeYards": round(home_yards, 1),
                "AwayYards": round(away_yards, 1),
                "YardDiff": round(yard_diff, 1)
            },
            "game_status": status_type,
            "teams": {
                "home": home_team_name,
                "away": away_team_name
            }
        }
        
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
        print(f"❌ ERROR: {traceback.format_exc()}")
        return {"error": str(e), "event_id": event_id}


def _get(url: str, params: Optional[Dict[str, Any]] = None):
    r = requests.get(url, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


def get_games(week: Optional[str] = None, season: Optional[str] = None):
    params: Dict[str, Any] = {}
    if week:
        params["week"] = week
    if season:
        params["dates"] = season
    return _get(SCOREBOARD, params)


def get_game_by_id(event_id: str):
    """Fetch game data from ESPN summary API with fallback to scoreboard."""
    try:
        # Try summary endpoint first
        data = _get(EVENT, {"event": event_id})
        
        # Check if we got valid competition data
        if data.get("competitions") or data.get("header", {}).get("competitions"):
            return data
        
        # If summary didn't work, try finding in scoreboard
        print(f"⚠️  Summary API didn't return competitions, trying scoreboard...")
        today_data = get_today_games()
        for event in today_data.get("events", []):
            if str(event.get("id")) == str(event_id):
                print(f"✅ Found game {event_id} in scoreboard")
                return event
        
        # Return original data even if incomplete
        return data
    except Exception as e:
        print(f"❌ Error fetching game {event_id}: {e}")
        # Try scoreboard as last resort
        try:
            today_data = get_today_games()
            for event in today_data.get("events", []):
                if str(event.get("id")) == str(event_id):
                    return event
        except:
            pass
        raise


def get_box_score(event_id: str):
    data = _get(EVENT, {"event": event_id})
    comps = (data or {}).get("competitions", [])
    if comps:
        box = comps[0].get("boxscore") or data.get("boxscore")
    else:
        box = data.get("boxscore")
    return {"eventId": event_id, "boxscore": box}


def get_upcoming_games(days: int = 7):
    today = datetime.utcnow().date()
    end = today + timedelta(days=days)
    fmt = "%Y%m%d"
    params = {"dates": f"{today.strftime(fmt)}-{end.strftime(fmt)}"}
    return _get(SCOREBOARD, params)


def get_today_games():
    today = datetime.utcnow().date()
    fmt = "%Y%m%d"
    params = {"dates": today.strftime(fmt)}
    data = _get(SCOREBOARD, params)
    if "events" in data:
        for event in data["events"]:
            event["league"] = "NFL"
    return data


def get_live_games():
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
                if status_type in ["in-progress", "live"]:
                    event["league"] = "NFL"
                    event["live"] = True
                    live_events.append(event)
        
        result = data.copy()
        result["events"] = live_events
        return result
    except Exception as e:
        return {"error": str(e), "events": []}


def get_historical_games(start_date=None, end_date=None, season=None, team_id=None, page=1, per_page=50):
    try:
        params = {}
        if start_date and end_date:
            params["dates"] = f"{start_date.replace('-', '')}-{end_date.replace('-', '')}"
        elif season:
            params["dates"] = season
        else:
            today = datetime.utcnow().date()
            start = today - timedelta(days=30)
            params["dates"] = f"{start.strftime('%Y%m%d')}-{today.strftime('%Y%m%d')}"
        
        data = _get(SCOREBOARD, params)
        
        if "events" in data:
            events = data["events"]
            if team_id:
                filtered_events = []
                for event in events:
                    competitors = event.get("competitions", [{}])[0].get("competitors", [])
                    for comp in competitors:
                        if comp.get("team", {}).get("id") == team_id:
                            filtered_events.append(event)
                            break
                events = filtered_events
            
            for event in events:
                event["league"] = "NFL"
                event["historical"] = True
            
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            result = data.copy()
            result["events"] = events[start_idx:end_idx]
            result["meta"] = {"page": page, "per_page": per_page, "total": len(events)}
            return result
        return data
    except Exception as e:
        return {"error": str(e), "events": [], "meta": {"page": page, "per_page": per_page, "total": 0}}


def get_standings(season: Optional[str] = None):
    """Fetch NFL standings from ESPN API.
    
    Args:
        season: Optional season year (e.g., '2024')
    
    Returns:
        Dictionary containing standings data organized by conference and division
    """
    try:
        params = {}
        if season:
            params["season"] = season
            
        data = _get(STANDINGS, params)
        
        # ESPN API returns data with children array directly at top level
        afc_standings = []
        nfc_standings = []
        
        # Get the children array (conferences)
        conferences = data.get("children", [])
        
        if not conferences:
            return {
                "error": "No children data in API response",
                "league": "NFL",
                "afc_standings": [],
                "nfc_standings": []
            }
        
        # Process each conference
        for conference in conferences:
            conference_name = conference.get("name", "")
            conference_abbr = conference.get("abbreviation", "")
            
            # Check if this conference has divisions as children
            divisions = conference.get("children", [])
            
            if divisions:
                # Process divisions within conference
                for division in divisions:
                    division_name = division.get("name", "")
                    standings_entries = division.get("standings", {}).get("entries", [])
                    
                    for entry in standings_entries:
                        team = entry.get("team", {})
                        stats = entry.get("stats", [])
                        
                        # Parse stats array into a dictionary
                        stats_dict = {}
                        for stat in stats:
                            stat_name = stat.get("name", "").lower().replace(" ", "_")
                            stat_value = stat.get("value", 0)
                            stats_dict[stat_name] = stat_value
                        
                        team_data = {
                            "team_id": team.get("id"),
                            "team_name": team.get("displayName"),
                            "team_abbreviation": team.get("abbreviation"),
                            "team_logo": team.get("logo"),
                            "conference": conference_name,
                            "conference_abbr": conference_abbr,
                            "division": division_name,
                            "wins": stats_dict.get("wins", 0),
                            "losses": stats_dict.get("losses", 0),
                            "ties": stats_dict.get("ties", 0),
                            "win_pct": stats_dict.get("win_percentage", 0.0),
                            "points_for": stats_dict.get("points_for", 0),
                            "points_against": stats_dict.get("points_against", 0),
                            "point_differential": stats_dict.get("point_differential", 0),
                            "home_record": stats_dict.get("home_record", ""),
                            "road_record": stats_dict.get("road_record", ""),
                            "division_record": stats_dict.get("division_record", ""),
                            "conference_record": stats_dict.get("conference_record", ""),
                            "streak": stats_dict.get("streak", ""),
                            "last_5": stats_dict.get("last_5", "")
                        }
                        
                        if conference_abbr == "AFC":
                            afc_standings.append(team_data)
                        else:
                            nfc_standings.append(team_data)
            else:
                # If no divisions, process teams directly in conference
                standings_entries = conference.get("standings", {}).get("entries", [])
                
                for entry in standings_entries:
                    team = entry.get("team", {})
                    stats = entry.get("stats", [])
                    
                    stats_dict = {}
                    for stat in stats:
                        stat_name = stat.get("name", "").lower().replace(" ", "_")
                        stat_value = stat.get("value", 0)
                        stats_dict[stat_name] = stat_value
                    
                    team_data = {
                        "team_id": team.get("id"),
                        "team_name": team.get("displayName"),
                        "team_abbreviation": team.get("abbreviation"),
                        "team_logo": team.get("logo"),
                        "conference": conference_name,
                        "conference_abbr": conference_abbr,
                        "division": None,
                        "wins": stats_dict.get("wins", 0),
                        "losses": stats_dict.get("losses", 0),
                        "ties": stats_dict.get("ties", 0),
                        "win_pct": stats_dict.get("win_percentage", 0.0),
                        "points_for": stats_dict.get("points_for", 0),
                        "points_against": stats_dict.get("points_against", 0),
                        "point_differential": stats_dict.get("point_differential", 0),
                        "home_record": stats_dict.get("home_record", ""),
                        "road_record": stats_dict.get("road_record", ""),
                        "division_record": stats_dict.get("division_record", ""),
                        "conference_record": stats_dict.get("conference_record", ""),
                        "streak": stats_dict.get("streak", ""),
                        "last_5": stats_dict.get("last_5", "")
                    }
                    
                    if conference_abbr == "AFC":
                        afc_standings.append(team_data)
                    else:
                        nfc_standings.append(team_data)
        
        # Sort by wins descending, then win percentage
        afc_standings.sort(key=lambda x: (x["wins"], x["win_pct"]), reverse=True)
        nfc_standings.sort(key=lambda x: (x["wins"], x["win_pct"]), reverse=True)
        
        return {
            "league": "NFL",
            "season": season or "2024",
            "afc_standings": afc_standings,
            "nfc_standings": nfc_standings
        }
    except Exception as e:
        return {
            "error": str(e),
            "league": "NFL",
            "afc_standings": [],
            "nfc_standings": []
        }
