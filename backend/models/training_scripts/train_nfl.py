import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# --- THIS IS THE KEY FIX ---
# Get the absolute path of the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Build a robust, absolute path to the CSV file
CSV_PATH = os.path.abspath(os.path.join(script_dir, '../../nfl_games.csv'))
# -----------------------------


print("--- Starting NFL Model Training ---")

# Define paths for the model files
MODEL_DIR = os.path.abspath(os.path.join(script_dir, '../../models/saved_models'))
MODEL_PATH = os.path.join(MODEL_DIR, 'nfl_model.pkl')

# Load the historical NFL data using the absolute path
data = pd.read_csv(CSV_PATH)

# Define the features and target
features = ['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']
target = 'HomeWin'

X = data[features]
y = data[target]

# Split data: 80% for training, 20% for testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model ONLY on the training data
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Make predictions on the test data
predictions = model.predict(X_test)

# Calculate and print the accuracy
accuracy = accuracy_score(y_test, predictions)
print(f"✅ Model Accuracy on test data: {accuracy * 100:.2f}%")

print("NFL Model training complete.")

# Saving the model
os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model, MODEL_PATH)

print(f"--- NFL Model saved successfully to {MODEL_PATH} ---")