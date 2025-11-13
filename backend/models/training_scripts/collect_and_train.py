"""
All-in-one script: Collect data, process it, and train model
Save as: backend/models/training_scripts/collect_and_train.py
"""

import requests
import json
import csv
import time
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("="*60)
print("🏈 NFL MODEL - COMPLETE PIPELINE")
print("="*60)

# ============================================================
# PART 1: COLLECT SEASON DATA
# ============================================================
print("\n📥 PART 1: Collecting 2023 NFL Season...")

SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"

def get_games_for_month(year, month):
    """Get all games for a specific month."""
    if month == 12:
        start_day = f"{year}{month:02d}01"
        end_day = f"{year}{month:02d}31"
    elif month == 1:
        start_day = f"{year}{month:02d}01"
        end_day = f"{year}{month:02d}10"
    else:
        start_day = f"{year}{month:02d}01"
        end_day = f"{year}{month:02d}30"
    
    params = {"dates": f"{start_day}-{end_day}"}
    try:
        r = requests.get(SCOREBOARD, params=params, timeout=20)
        r.raise_for_status()
        return r.json().get("events", [])
    except Exception as e:
        print(f"   Error fetching {year}-{month}: {e}")
        return []

# Collect 2023 season
all_games = []
months = [(2023, 9), (2023, 10), (2023, 11), (2023, 12), (2024, 1)]

for year, month in months:
    print(f"   Fetching {year}-{month:02d}...", end=" ")
    games = get_games_for_month(year, month)
    all_games.extend(games)
    print(f"✅ {len(games)} games")
    time.sleep(0.5)

print(f"\n✅ Collected {len(all_games)} total games")

# ============================================================
# PART 2: PROCESS WITH REAL STATS
# ============================================================
print("\n⚙️ PART 2: Processing games with team stats...")

TEAM_STATS = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{}/statistics"

def get_team_stats(team_id):
    """Fetch team statistics from ESPN."""
    url = TEAM_STATS.format(team_id)
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        
        # Try to extract stats
        stats = data.get("splits", {}).get("categories", [])
        off_yards = 350.0
        def_yards = 350.0
        
        for category in stats:
            for stat in category.get("stats", []):
                name = stat.get("name", "").lower()
                if "yards per game" in name and "opponent" not in name:
                    off_yards = float(stat.get("value", 350.0))
                elif "opponent" in name and "yards" in name:
                    def_yards = float(stat.get("value", 350.0))
        
        return off_yards, def_yards
    except Exception:
        return 350.0, 350.0

# Cache for team stats
team_cache = {}

# Process games
processed_games = []
total = len(all_games)

for idx, game in enumerate(all_games, 1):
    if idx % 20 == 0:
        print(f"   Progress: {idx}/{total} games...")
    
    competition = game.get("competitions", [{}])[0]
    competitors = competition.get("competitors", [])
    
    if len(competitors) != 2:
        continue
    
    home = next((c for c in competitors if c.get("homeAway") == "home"), None)
    away = next((c for c in competitors if c.get("homeAway") == "away"), None)
    
    if not home or not away:
        continue
    
    # Check if game is complete
    status = game.get("status", {}).get("type", {}).get("name", "")
    if status.lower() not in ["final", "status_final"]:
        continue
    
    home_id = home["team"]["id"]
    away_id = away["team"]["id"]
    home_abbr = home["team"]["abbreviation"]
    away_abbr = away["team"]["abbreviation"]
    home_win = 1 if home.get("winner") else 0
    
    # Get team stats (with caching)
    if home_id not in team_cache:
        team_cache[home_id] = get_team_stats(home_id)
        time.sleep(0.3)  # Rate limiting
    
    if away_id not in team_cache:
        team_cache[away_id] = get_team_stats(away_id)
        time.sleep(0.3)
    
    home_off, home_def = team_cache[home_id]
    away_off, away_def = team_cache[away_id]
    
    processed_games.append({
        "HomeTeam": home_abbr,
        "AwayTeam": away_abbr,
        "HomeOffYards": home_off,
        "HomeDefYards": home_def,
        "AwayOffYards": away_off,
        "AwayDefYards": away_def,
        "HomeWin": home_win
    })

print(f"\n✅ Processed {len(processed_games)} games")
print(f"💾 Cached {len(team_cache)} teams")

# Save to CSV
csv_file = "nfl_games.csv"
df = pd.DataFrame(processed_games)
df.to_csv(csv_file, index=False)
print(f"💾 Saved to {csv_file}")

# ============================================================
# PART 3: TRAIN MODEL
# ============================================================
print("\n🤖 PART 3: Training model...")

print(f"\n📊 Data Statistics:")
print(df[['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']].describe())

print(f"\n📊 Class Distribution:")
print(f"Home Wins: {(df['HomeWin'] == 1).sum()}")
print(f"Away Wins: {(df['HomeWin'] == 0).sum()}")

# Prepare features
X = df[['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']]
y = df['HomeWin']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Train
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n🎯 Accuracy: {accuracy * 100:.2f}%")
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Away Win', 'Home Win']))

# Test with varied inputs
print("\n🧪 Testing with different scenarios:")
test_cases = [
    ("Strong Home", [400, 300, 320, 380]),
    ("Strong Away", [320, 380, 400, 300]),
    ("Balanced", [350, 350, 350, 350])
]

for name, features in test_cases:
    test_df = pd.DataFrame([features], columns=['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards'])
    pred = model.predict(test_df)[0]
    proba = model.predict_proba(test_df)[0]
    print(f"\n{name}: {features}")
    print(f"  Prediction: {'HOME' if pred == 1 else 'AWAY'}")
    print(f"  Home: {proba[1]:.1%}, Away: {proba[0]:.1%}")

# Save model
model_dir = '../saved_models'
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'nfl_model.pkl')
joblib.dump(model, model_path)

print(f"\n✅ Model saved to: {model_path}")
print("\n" + "="*60)
print("🎉 COMPLETE! Now restart your backend:")
print("   cd backend")
print("   python run_server.py")
print("="*60)