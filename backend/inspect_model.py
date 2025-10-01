import joblib
import pandas as pd

# --- PART 1: INSPECT THE MODEL FILE ---

MODEL_PATH = 'models/saved_models/nba_model.pkl'
CSV_PATH = 'nba_games.csv'  # Path to the original CSV file

print(f"--- Inspecting model at: {MODEL_PATH} ---")

try:
    # Load the model from the file
    model = joblib.load(MODEL_PATH)
    
    print("\n✅ Model loaded successfully!")
    
    print("\n--- Model Details ---")
    print(f"Model Type: {type(model)}")
    
    if hasattr(model, 'n_estimators'):
        print(f"Number of Estimators (Trees): {model.n_estimators}")
        
    if hasattr(model, 'feature_names_in_'):
        print(f"Features the model was trained on: {model.feature_names_in_}")

except Exception as e:
    print(f"\n❌ An error occurred during model inspection: {e}")
    # Exit the script if the model can't be loaded
    exit()


# --- PART 2: SEE MODEL ESTIMATES ON ORIGINAL CSV DATA ---

try:
    # Load the original data from the nba_games.csv file
    data = pd.read_csv(CSV_PATH)
    features = data[['HomeAvgPts', 'AwayAvgPts']]

    # Use the loaded model to make predictions
    predictions = model.predict(features)
    data['Model_Prediction'] = predictions

    # Display the results
    print("\n\n--- Model Estimates vs. Actual Outcomes (from nba_games.csv) ---")
    print(data[['HomeTeam', 'AwayTeam', 'HomeWin', 'Model_Prediction']])

except FileNotFoundError:
    print(f"\n❌ Error: Could not find the data file at {CSV_PATH}")
except Exception as e:
    print(f"\n❌ An error occurred while processing the CSV file: {e}")