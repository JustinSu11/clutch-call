"""
Emergency fix: Collect REAL data with REAL stats and retrain
This will take 10-15 minutes but will actually work
Save as: backend/models/training_scripts/emergency_fix.py
"""

import requests
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import time
import os

print("="*60)
print("🚨 EMERGENCY FIX - Getting Real Data")
print("="*60)

# Step 1: Get games from ESPN
print("\n📥 Step 1: Fetching 2023 NFL games...")
SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
# --- NEW ---
# This summary endpoint is needed to get detailed stats for each game
SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary"

def get_games(year, month):
    params = {"dates": f"{year}{month:02d}01-{year}{month:02d}30"}
    try:
        r = requests.get(SCOREBOARD, params=params, timeout=20)
        return r.json().get("events", [])
    except:
        return []

all_games = []
for month in [9, 10, 11, 12]:
    print(f"   {2023}-{month:02d}...", end=" ")
    games = get_games(2023, month)
    all_games.extend(games)
    print(f"✅ {len(games)}")
    time.sleep(0.3)

# January 2024
print(f"   2024-01...", end=" ")
params = {"dates": "20240101-20240110"}
r = requests.get(SCOREBOARD, params=params, timeout=20)
all_games.extend(r.json().get("events", []))
print(f"✅ {len(r.json().get('events', []))}")

print(f"\nTotal games: {len(all_games)}")

# Step 2: Process games and calculate stats from ACTUAL game results
print("\n⚙️ Step 2: Processing games with ACTUAL statistics...")
print("   (This will be slower as it fetches summary for each game)")

processed = []
for idx, game in enumerate(all_games):
    if idx % 30 == 0:
        print(f"   Progress: {idx}/{len(all_games)}...")
    
    # Check if game is complete from the scoreboard
    status = game.get("status", {}).get("type", {}).get("name", "")
    if status.lower() not in ["final", "status_final"]:
        continue

    # --- NEW LOGIC ---
    # The scoreboard list doesn't have stats. We must fetch the summary.
    game_id = game.get("id")
    if not game_id:
        continue
        
    try:
        # Make a separate API call for the game summary
        summary_resp = requests.get(SUMMARY, params={"event": game_id}, timeout=10)
        summary_data = summary_resp.json()
        
        # Get competitors from the *summary* data
        boxscore = summary_data.get("boxscore", {})
        teams = boxscore.get("teams", [])
        
        if len(teams) != 2:
            continue
            
        home = next((t for t in teams if t.get("homeAway") == "home"), None)
        away = next((t for t in teams if t.get("homeAway") == "away"), None)
        
        if not home or not away:
            continue
        
        # Extract total yards from actual game stats in the boxscore
        home_yards = 300.0
        away_yards = 300.0
        
        home_stats = home.get("statistics", [])
        away_stats = away.get("statistics", [])
        
        for stat in home_stats:
            if stat.get("name") == "totalYards":
                val_str = stat.get("displayValue", "300").replace(",", "")
                home_yards = float(val_str)
        
        for stat in away_stats:
            if stat.get("name") == "totalYards":
                val_str = stat.get("displayValue", "300").replace(",", "")
                away_yards = float(val_str)

        # Get winner from the *scoreboard* data (more reliable)
        home_comp = next((c for c in game.get("competitions", [{}])[0].get("competitors", []) if c.get("homeAway") == "home"), None)
        home_win = 1 if home_comp and home_comp.get("winner") else 0
        
        processed.append({
            "HomeTeam": home["team"]["abbreviation"],
            "AwayTeam": away["team"]["abbreviation"],
            "HomeYards": home_yards,
            "AwayYards": away_yards,
            "HomeWin": home_win
        })
        
        # Be nice to the API
        time.sleep(0.1)

    except Exception as e:
        print(f"   - Error processing game {game_id}: {e}")
    # --- END NEW LOGIC ---


print(f"\n✅ Processed {len(processed)} complete games")

# Step 3: Create DataFrame
df = pd.DataFrame(processed)

# Remove any games with default values (if both are default)
df = df[(df['HomeYards'] != 300.0) | (df['AwayYards'] != 300.0)]

print(f"📊 Valid games with real stats: {len(df)}")
print(f"\n📈 Statistics:")
print(df.describe())

# --- SAFETY CHECK ---
# Check if the DataFrame is empty before trying to train
if df.empty:
    print("\n" + "="*60)
    print("❌ ERROR: No valid game data found after filtering.")
    print("   This likely means the 'totalYards' stat name is incorrect or")
    print("   no games with stats were found in the API.")
    print("   Aborting model training.")
    print("="*60)
# --- END SAFETY CHECK ---
else:
    # Step 4: Train model
    print("\n🤖 Step 3: Training model...")

    # Simple features: just the yards and difference
    X = df[['HomeYards', 'AwayYards']].copy()
    X['YardDiff'] = X['HomeYards'] - X['AwayYards']

    y = df['HomeWin']

    print(f"\nClass distribution:")
    print(f"   Home Wins: {(y==1).sum()}")
    print(f"   Away Wins: {(y==0).sum()}")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Train
    model = RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_split=10, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n🎯 Accuracy: {accuracy * 100:.2f}%")

    # Test predictions
    print("\n🧪 Testing predictions:")
    tests = [
        ("Strong Home (400 vs 280)", [400, 280, 120]),
        ("Strong Away (280 vs 400)", [280, 400, -120]),
        ("Balanced (340 vs 340)", [340, 340, 0]),
        ("Slight Home Edge (360 vs 330)", [360, 330, 30]),
        ("Slight Away Edge (330 vs 360)", [330, 360, -30]),
    ]

    all_same = True
    last_pred = None

    for name, features in tests:
        test_df = pd.DataFrame([features], columns=['HomeYards', 'AwayYards', 'YardDiff'])
        pred = model.predict(test_df)[0]
        proba = model.predict_proba(test_df)[0]
        
        print(f"\n{name}:")
        print(f"   Prediction: {'HOME' if pred == 1 else 'AWAY'}")
        print(f"   Confidence: Home={proba[1]:.1%}, Away={proba[0]:.1%}")
        
        if last_pred is not None and last_pred != pred:
            all_same = False
        last_pred = pred

    if all_same:
        print("\n❌ WARNING: Model still predicts same for all cases!")
        print("    Training data may still be too similar.")
    else:
        print("\n✅ Model makes DIFFERENT predictions - Good!")

    # Save
    model_dir = '../saved_models'
    # --- FIX for older Python versions ---
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
    # --- END FIX ---
    model_path = os.path.join(model_dir, 'nfl_model.pkl')
    joblib.dump(model, model_path)

    # Save data
    df.to_csv('nfl_games_fixed.csv', index=False)

    print(f"\n💾 Model saved: {model_path}")
    print(f"💾 Data saved: nfl_games_fixed.csv")

    print("\n" + "="*60)
    print("✅ EMERGENCY FIX COMPLETE!")
    print("="*60)
    print("\n⚠️ IMPORTANT: Update your nfl_service.py!")
    print("   Model now expects 3 features:")
    print("   1. HomeYards (total yards)")
    print("   2. AwayYards (total yards)")
    print("   3. YardDiff (HomeYards - AwayYards)")
    print("\n🔄 Restart backend after updating nfl_service.py")
    print("="*60)


