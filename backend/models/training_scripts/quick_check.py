"""
Simple retraining script using ONLY the 4 basic features
This matches what your API provides
Save as: backend/models/training_scripts/simple_retrain.py
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

print("="*60)
print("🏈 SIMPLE NFL MODEL RETRAINING")
print("="*60)

# Load existing data
print("\n📂 Loading nfl_games.csv...")
df = pd.read_csv('nfl_games.csv')
print(f"✅ Loaded {len(df)} games")

print(f"\n📊 Current data issues:")
print(f"   - All HomeDefYards are 350.0: {'YES ❌' if (df['HomeDefYards'] == 350.0).all() else 'NO ✅'}")
print(f"   - All AwayDefYards are 350.0: {'YES ❌' if (df['AwayDefYards'] == 350.0).all() else 'NO ✅'}")

# Since defensive yards are all defaults, let's use ONLY offensive yards
# and create a simple differential feature
print("\n🔧 Creating simplified features...")

# Use only offensive yards since defensive is all defaults
X = df[['HomeOffYards', 'AwayOffYards']].copy()
X['OffensiveDiff'] = X['HomeOffYards'] - X['AwayOffYards']

print("Features being used:")
print("  1. HomeOffYards")
print("  2. AwayOffYards")
print("  3. OffensiveDiff (HomeOff - AwayOff)")

y = df['HomeWin']

print(f"\n📊 Class Distribution:")
print(f"   Home Wins (1): {(y == 1).sum()}")
print(f"   Away Wins (0): {(y == 0).sum()}")
print(f"   Home Win Rate: {y.mean() * 100:.2f}%")

print(f"\n📈 Feature Statistics:")
print(X.describe())

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n✂️ Data Split:")
print(f"   Training: {len(X_train)} games")
print(f"   Testing: {len(X_test)} games")

# Train
print("\n🤖 Training Random Forest...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✅ Training complete!")

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n" + "="*60)
print("📊 MODEL EVALUATION")
print("="*60)
print(f"\n🎯 Accuracy: {accuracy * 100:.2f}%")

print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Away Win (0)', 'Home Win (1)']))

print("\n🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)
print(f"\nBreakdown:")
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

# Test with different scenarios
print("\n🧪 Testing Predictions:")
test_cases = [
    ("Strong Home Offense", [260, 200]),
    ("Strong Away Offense", [200, 260]),
    ("Balanced Teams", [220, 220]),
    ("Very Strong Home", [265, 180]),
    ("Very Strong Away", [180, 265]),
]

for name, [home_off, away_off] in test_cases:
    test_data = pd.DataFrame([[home_off, away_off, home_off - away_off]], 
                             columns=['HomeOffYards', 'AwayOffYards', 'OffensiveDiff'])
    pred = model.predict(test_data)[0]
    proba = model.predict_proba(test_data)[0]
    
    print(f"\n{name}:")
    print(f"  HomeOff: {home_off}, AwayOff: {away_off}")
    print(f"  Prediction: {'HOME' if pred == 1 else 'AWAY'}")
    print(f"  Probabilities: Home={proba[1]:.1%}, Away={proba[0]:.1%}")

# Check if model varies predictions
all_preds = [model.predict(pd.DataFrame([[tc[1][0], tc[1][1], tc[1][0]-tc[1][1]]], 
                                        columns=['HomeOffYards', 'AwayOffYards', 'OffensiveDiff']))[0] 
             for tc in test_cases]

if len(set(all_preds)) == 1:
    print("\n❌ WARNING: Model still predicts same result for all test cases!")
else:
    print(f"\n✅ Model makes {len(set(all_preds))} different predictions - GOOD!")

# Save model
model_dir = '../saved_models'
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'nfl_model.pkl')

# Backup old model
if os.path.exists(model_path):
    backup_path = os.path.join(model_dir, 'nfl_model_backup.pkl')
    import shutil
    shutil.copy(model_path, backup_path)
    print(f"\n💾 Backed up old model to: {backup_path}")

joblib.dump(model, model_path)
print(f"✅ New model saved to: {model_path}")

print("\n" + "="*60)
print("🎉 RETRAINING COMPLETE!")
print("="*60)
print(f"📊 Model Accuracy: {accuracy * 100:.2f}%")
print(f"🎯 Model uses 3 features (matches your API)")
print(f"📝 Label Mapping: 0=Away Win, 1=Home Win")
print("\n⚠️ IMPORTANT: Update your nfl_service.py to match!")
print("   Your API must send these 3 features:")
print("   1. HomeOffYards")
print("   2. AwayOffYards")
print("   3. OffensiveDiff (HomeOff - AwayOff)")
print("\n🔄 Next: Restart your backend")
print("   cd ../../")
print("   python run_server.py")
print("="*60)