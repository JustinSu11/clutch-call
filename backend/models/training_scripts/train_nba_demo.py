"""
File: train_nba_demo.py
Purpose: Demo NBA model training with synthetic data (for testing when NBA API is unavailable)
         Creates a working nba_model.pkl file for development/testing
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("="*60)
print("🏀 NBA Model Training (Demo Mode)")
print("="*60)
print("\nℹ️  This creates a demo model using synthetic data")
print("   Use train_nba.py for production with real NBA data")
print("="*60)

# Generate synthetic NBA game data
print("\n📊 Generating synthetic NBA game data...")
np.random.seed(42)

n_games = 500
games = []

for i in range(n_games):
    # Simulate home and away team average points
    home_avg = np.random.normal(110, 10)  # NBA average ~110 ppg
    away_avg = np.random.normal(110, 10)
    
    # Higher scoring team more likely to win (with some randomness)
    pts_diff = home_avg - away_avg
    win_prob = 1 / (1 + np.exp(-pts_diff / 5))  # Sigmoid function
    home_win = 1 if np.random.random() < win_prob else 0
    
    games.append({
        'HomeAvgPts': home_avg,
        'AwayAvgPts': away_avg,
        'HomeWin': home_win
    })

df = pd.DataFrame(games)
print(f"✅ Generated {len(df)} synthetic games")

print(f"\n📊 Data Preview:")
print(df.head(10))

print(f"\n📈 Statistics:")
print(df.describe())

# Class distribution
print(f"\n📊 Class Distribution:")
class_counts = df['HomeWin'].value_counts()
print(f"Home Wins (1): {class_counts.get(1, 0)}")
print(f"Away Wins (0): {class_counts.get(0, 0)}")
print(f"Home Win Rate: {df['HomeWin'].mean() * 100:.2f}%")

# Prepare features
print("\n🎯 Preparing features...")
X = df[['HomeAvgPts', 'AwayAvgPts']]
y = df['HomeWin']

print(f"Features: {list(X.columns)}")
print(f"Samples: {len(X)}")

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

# Evaluate
print("\n📊 Model Evaluation:")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy * 100:.2f}%")

print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Away Win', 'Home Win']))

# Feature importance
print("\n🎨 Feature Importance:")
for feature, importance in zip(X.columns, model.feature_importances_):
    print(f"  {feature}: {importance*100:.2f}%")

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
    test_sample = [[110.0, 105.0]]  # Home team averaging 110, away 105
    pred = loaded.predict(test_sample)
    proba = loaded.predict_proba(test_sample)
    print("✅ Model loads successfully")
    print(f"\n🧪 Test Prediction:")
    print(f"   Input: Home=110 pts, Away=105 pts")
    print(f"   Prediction: {'Home Win' if pred[0] == 1 else 'Away Win'}")
    print(f"   Probabilities: Away={proba[0][0]*100:.1f}%, Home={proba[0][1]*100:.1f}%")
except Exception as e:
    print(f"❌ Verification failed: {e}")

print("\n" + "="*60)
print("🎉 DEMO MODEL CREATED!")
print("="*60)
print(f"📊 Accuracy: {accuracy * 100:.2f}%")
print(f"💾 Location: {model_path}")
print(f"🎯 Features: HomeAvgPts, AwayAvgPts")
print(f"\n⚠️  NOTE: This is a DEMO model with synthetic data")
print("   For production, run train_nba.py with real NBA data")
print("   The demo model will still work with your prediction service!")
print("="*60)
