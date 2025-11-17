"""
File: train_nba.py
Purpose: Train a simple NBA prediction model matching the NFL pattern
         Uses team average points from last 5 games to predict game outcomes
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os
import sys
from datetime import datetime, timedelta

# Add parent directory to path for NBA API imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from nba_api.stats.endpoints import leaguegamelog
    NBA_API_AVAILABLE = True
except ImportError:
    print("❌ ERROR: nba_api not installed!")
    print("Install it with: pip install nba_api")
    NBA_API_AVAILABLE = False
    sys.exit(1)

print("="*60)
print("🏀 NBA Prediction Model Training")
print("="*60)
print("\nThis script will:")
print("1. Collect NBA game data from the last season")
print("2. Calculate team average points (last 5 games)")
print("3. Train a RandomForest model to predict game outcomes")
print("4. Save the model as nba_model.pkl")
print("="*60)

# Function to get team recent games average
def get_team_stats(games_df, team_id, game_date, n_games=5):
    """Get team's average points from last n games before game_date"""
    team_games = games_df[
        (games_df['TEAM_ID'] == team_id) & 
        (games_df['GAME_DATE'] < game_date)
    ].sort_values('GAME_DATE', ascending=False).head(n_games)
    
    if len(team_games) == 0:
        return None
    
    avg_pts = team_games['PTS'].mean()
    return avg_pts

# Collect data
print("\n📡 Collecting NBA game data...")
print("This may take a few minutes...")

try:
    # Get games from the 2023-24 season
    game_log = leaguegamelog.LeagueGameLog(
        season='2023-24',
        season_type_all_star='Regular Season'
    )
    games_df = game_log.get_data_frames()[0]
    print(f"✅ Collected {len(games_df)} team-game records")
except Exception as e:
    print(f"❌ ERROR collecting data: {e}")
    print("\nTroubleshooting:")
    print("- Check your internet connection")
    print("- NBA API may be temporarily unavailable")
    print("- Try running the script again in a few minutes")
    sys.exit(1)

# Process data to get actual games (not team records)
print("\n🔄 Processing game data...")
games_df['GAME_DATE'] = pd.to_datetime(games_df['GAME_DATE'])

# Group by game to get matchups
game_matchups = []
processed_games = set()

for idx, row in games_df.iterrows():
    game_id = row['GAME_ID']
    
    if game_id in processed_games:
        continue
    
    # Find both teams for this game
    game_teams = games_df[games_df['GAME_ID'] == game_id]
    
    if len(game_teams) != 2:
        continue
    
    # Identify home and away based on matchup string
    team1 = game_teams.iloc[0]
    team2 = game_teams.iloc[1]
    
    # Determine home/away (@ symbol indicates away team in MATCHUP)
    if '@' in team1['MATCHUP']:
        away_team = team1
        home_team = team2
    else:
        home_team = team1
        away_team = team2
    
    # Calculate average points for each team from their last 5 games
    home_avg = get_team_stats(games_df, home_team['TEAM_ID'], home_team['GAME_DATE'])
    away_avg = get_team_stats(games_df, away_team['TEAM_ID'], away_team['GAME_DATE'])
    
    # Skip if we don't have enough history for either team
    if home_avg is None or away_avg is None:
        continue
    
    # Determine winner (1 = home win, 0 = away win)
    home_win = 1 if (home_team['WL'] == 'W') else 0
    
    game_matchups.append({
        'game_id': game_id,
        'game_date': home_team['GAME_DATE'],
        'home_team_id': home_team['TEAM_ID'],
        'away_team_id': away_team['TEAM_ID'],
        'home_team': home_team['TEAM_NAME'],
        'away_team': away_team['TEAM_NAME'],
        'HomeAvgPts': home_avg,
        'AwayAvgPts': away_avg,
        'home_actual_pts': home_team['PTS'],
        'away_actual_pts': away_team['PTS'],
        'HomeWin': home_win
    })
    
    processed_games.add(game_id)

df = pd.DataFrame(game_matchups)
print(f"✅ Processed {len(df)} games with complete data")

if len(df) < 100:
    print(f"\n⚠️ WARNING: Only {len(df)} games available")
    print("This may not be enough data for a reliable model")
    print("Consider using multiple seasons or a different approach")

print(f"\n📊 Data Preview:")
print(df.head())
print(f"\n📈 Shape: {df.shape}")

# Check for missing values
print(f"\n🔍 Checking data quality...")
missing = df[['HomeAvgPts', 'AwayAvgPts', 'HomeWin']].isnull().sum()
if missing.any():
    print("⚠️ Missing values found:")
    print(missing[missing > 0])
    df = df.dropna(subset=['HomeAvgPts', 'AwayAvgPts', 'HomeWin'])
    print(f"Dropped rows with missing values. Remaining: {len(df)}")
else:
    print("✅ No missing values")

# Class distribution
print(f"\n📊 Class Distribution:")
class_counts = df['HomeWin'].value_counts()
print(f"Home Wins (1): {class_counts.get(1, 0)}")
print(f"Away Wins (0): {class_counts.get(0, 0)}")
print(f"Home Win Rate: {df['HomeWin'].mean() * 100:.2f}%")

# Prepare features and target
print("\n🎯 Preparing features...")
X = df[['HomeAvgPts', 'AwayAvgPts']]
y = df['HomeWin']

print(f"Features: {list(X.columns)}")
print(f"Samples: {len(X)}")

print(f"\n📋 Feature Statistics:")
print(X.describe())

# Split data
print("\n✂️ Splitting data (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training: {len(X_train)} games")
print(f"Testing: {len(X_test)} games")

# Train model
print("\n🤖 Training Random Forest Classifier...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✅ Training complete!")

# Predictions
print("\n🎲 Generating predictions...")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)

# Evaluation
print("\n" + "="*60)
print("📊 MODEL EVALUATION")
print("="*60)

accuracy = accuracy_score(y_test, y_pred)
print(f"\n🎯 Accuracy: {accuracy * 100:.2f}%")

print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Away Win (0)', 'Home Win (1)']))

print("\n🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)
print("\nBreakdown:")
print(f"  Correct Away predictions: {cm[0][0]}")
print(f"  Wrong (predicted Home, was Away): {cm[0][1]}")
print(f"  Wrong (predicted Away, was Home): {cm[1][0]}")
print(f"  Correct Home predictions: {cm[1][1]}")

# Feature importance
print("\n🎨 Feature Importance:")
importance_df = pd.DataFrame({
    'Feature': X.columns,
    'Importance': model.feature_importances_
}).sort_values('Importance', ascending=False)
print(importance_df.to_string(index=False))

# Sample predictions
print("\n🧪 Sample Predictions (first 5 test games):")
test_df = df.iloc[X_test.index].reset_index(drop=True)
for i in range(min(5, len(X_test))):
    sample = X_test.iloc[i]
    actual = y_test.iloc[i]
    pred = y_pred[i]
    prob = y_pred_proba[i]
    game_info = test_df.iloc[i]
    
    print(f"\n  Game {i+1}: {game_info['away_team']} @ {game_info['home_team']}")
    print(f"    Home Avg: {sample['HomeAvgPts']:.1f} pts")
    print(f"    Away Avg: {sample['AwayAvgPts']:.1f} pts")
    print(f"    Predicted: {'Home' if pred == 1 else 'Away'} ({max(prob)*100:.1f}% conf)")
    print(f"    Actual: {'Home' if actual == 1 else 'Away'}")
    print(f"    {'✅ Correct' if pred == actual else '❌ Wrong'}")

# Save model
print("\n💾 Saving model...")
model_dir = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, 'nba_model.pkl')
joblib.dump(model, model_path)
print(f"✅ Saved to: {model_path}")

# Verify
print("\n🔍 Verifying model...")
try:
    loaded = joblib.load(model_path)
    test_pred = loaded.predict(X_test.iloc[:1])
    print("✅ Model loads successfully")
    print(f"   Model has {loaded.n_features_in_} features: {list(X.columns)}")
except Exception as e:
    print(f"❌ Verification failed: {e}")

# Summary
print("\n" + "="*60)
print("🎉 TRAINING COMPLETE!")
print("="*60)
print(f"📊 Final Accuracy: {accuracy * 100:.2f}%")
print(f"💾 Model Location: {model_path}")
print(f"🎯 Model Classes: {list(model.classes_)}")
print(f"📝 Label Mapping:")
print(f"   0 = Away Win")
print(f"   1 = Home Win")
print(f"\n📌 Model Features:")
print(f"   - HomeAvgPts: Home team's average points (last 5 games)")
print(f"   - AwayAvgPts: Away team's average points (last 5 games)")
print("\n✨ Your NBA prediction service is now ready to use!")
print("="*60)
