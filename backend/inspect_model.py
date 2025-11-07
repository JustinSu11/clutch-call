import joblib
import pandas as pd
import os

# --- DEFINE FILE PATHS ---
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(script_dir, 'models/saved_models/nfl_model.pkl'))
CSV_PATH = os.path.abspath(os.path.join(script_dir, 'nfl_games.csv'))

# --- PART 1: INSPECT THE MODEL FILE ---
print(f"--- Inspecting model at: {MODEL_PATH} ---")
try:
    model = joblib.load(MODEL_PATH)
    print("\n Model loaded successfully!")
    print("\n--- Model Details ---")
    print(f"Model Type: {type(model)}")
    if hasattr(model, 'feature_names_in_'):
        print(f"Features the model was trained on: {model.feature_names_in_}")
except Exception as e:
    print(f"\n An error occurred during model inspection: {e}")
    exit()

# --- PART 2: SEE MODEL ESTIMATES ON ORIGINAL CSV DATA ---
try:
    data = pd.read_csv(CSV_PATH)
    features = data[['HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards']]
    predictions = model.predict(features)
    data['Model_Prediction'] = predictions

    print("\n\n--- Model Estimates vs. Actual Outcomes (from nfl_games.csv) ---")
    print(data[['HomeTeam', 'AwayTeam', 'HomeWin', 'Model_Prediction']])
except FileNotFoundError:
    print(f"\n Error: Could not find the data file at {CSV_PATH}")
except Exception as e:
    print(f"\n An error occurred while processing the CSV file: {e}")