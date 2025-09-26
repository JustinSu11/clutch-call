
"""
File: app/models/training_scripts/train_nba.py
Author: Aron Rios
Purpose: Script to train a simple machine learning model to predict NBA game outcomes.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

print("--- Starting Model Training ---")

# 1. Load Data from the CSV file
data = pd.read_csv('nba_games.csv')

# 2. Define features (X) and the target (y)
features = ['HomeAvgPts', 'AwayAvgPts']
target = 'HomeWin'

X = data[features]
y = data[target]

# 3. Split data for training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# 4. Train the model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
print("Model training complete.")

# 5. Evaluate the model's accuracy
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# 6. Save the trained model to a file
# Ensure the saved_models directory exists
os.makedirs('models/saved_models', exist_ok=True)
model_filename = 'models/saved_models/nba_model.pkl'
joblib.dump(model, model_filename)

print(f"--- Model saved successfully to {model_filename} ---")