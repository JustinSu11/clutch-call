"""
File: 3_train_nfl_model.py
Author: Aron Rios 
Purpose: Step 3 - Train the NFL prediction model using processed game data
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

print("="*60)
print("🏈 STEP 3: Training NFL Prediction Model")
print("="*60)

# Load the processed data
print("\n📂 Loading nfl_games.csv...")
try:
    df = pd.read_csv('nfl_games.csv')
    print(f"✅ Loaded {len(df)} games")
except FileNotFoundError:
    print("❌ ERROR: nfl_games.csv not found!")
    print("Please run 2_process_with_api_stats.py first")
    exit(1)

print(f"\n📊 Data Preview:")
print(df.head())
print(f"\n📈 Shape: {df.shape}")

# Check for missing values
print(f"\n🔍 Checking data quality...")
missing = df.isnull().sum()
if missing.any():
    print("⚠️ Missing values found:")
    print(missing[missing > 0])
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
X = df[['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']]
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
for i in range(min(5, len(X_test))):
    sample = X_test.iloc[i]
    actual = y_test.iloc[i]
    pred = y_pred[i]
    prob = y_pred_proba[i]
    
    print(f"\n  Game {i+1}:")
    print(f"    Home: Off={sample['HomeOffYards']:.1f} Def={sample['HomeDefYards']:.1f}")
    print(f"    Away: Off={sample['AwayOffYards']:.1f} Def={sample['AwayDefYards']:.1f}")
    print(f"    Predicted: {'Home' if pred == 1 else 'Away'} ({max(prob)*100:.1f}% conf)")
    print(f"    Actual: {'Home' if actual == 1 else 'Away'}")
    print(f"    {'✅ Correct' if pred == actual else '❌ Wrong'}")

# Save model
print("\n💾 Saving model...")
model_dir = os.path.join('..', 'saved_models')
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, 'nfl_model.pkl')
joblib.dump(model, model_path)
print(f"✅ Saved to: {model_path}")

# Verify
print("\n🔍 Verifying model...")
try:
    loaded = joblib.load(model_path)
    test_pred = loaded.predict(X_test.iloc[:1])
    print("✅ Model loads successfully")
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
print("\n⚠️ IMPORTANT: Your prediction service MUST use:")
print("   predicted_class == 0  →  'away'")
print("   predicted_class == 1  →  'home'")
print("="*60)