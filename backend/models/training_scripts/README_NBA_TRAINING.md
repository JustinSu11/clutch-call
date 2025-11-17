# NBA Model Training - Quick Start Guide

## Overview

After the refactoring to simplify the NBA prediction service, you now need to train a simple NBA model that matches the NFL pattern.

## Prerequisites

Make sure you have the required dependencies installed:

```bash
pip install nba_api pandas numpy scikit-learn joblib
```

## Training the NBA Model (First Time Setup)

### Step 1: Navigate to the training scripts directory

```bash
cd backend/models/training_scripts
```

### Step 2: Run the training script

```bash
python train_nba.py
```

This script will:
1. Collect NBA game data from the 2023-24 season using the NBA API
2. Calculate each team's average points from their last 5 games
3. Train a RandomForest model to predict game outcomes
4. Save the model as `backend/models/saved_models/nba_model.pkl`

**Expected time:** 2-5 minutes (depending on internet speed and NBA API response time)

### Step 3: Verify the model was created

```bash
ls ../saved_models/nba_model.pkl
```

You should see the file listed.

## What the Model Does

The simplified NBA model uses just 2 features:
- **HomeAvgPts**: Home team's average points from last 5 games
- **AwayAvgPts**: Away team's average points from last 5 games

This matches the NFL pattern of using simple, recent team statistics to make predictions.

## How the Prediction Service Uses the Model

When you call `/api/v1/nba/predict/<game_id>`:

1. The service fetches the game details from the NBA API
2. It gets the last 5 games for both teams
3. It calculates the average points for each team
4. It uses these 2 features to predict the game outcome
5. It returns the prediction with probabilities

## Troubleshooting

### "nba_api not installed"
```bash
pip install nba_api
```

### "NBA API timeout or error"
- Check your internet connection
- The NBA API may be temporarily unavailable
- Try running the script again in a few minutes

### "Not enough games available"
The script needs teams to have played at least 5 games to calculate averages. If you're training during the early season, this may be an issue. The script will warn you if there aren't enough games.

### Model loads but predictions fail
Make sure your backend service is using the correct feature names:
- `HomeAvgPts`
- `AwayAvgPts`

These should match exactly what's in `backend/app/services/nba_service.py`.

## Retraining

To retrain the model with updated data:

```bash
cd backend/models/training_scripts
python train_nba.py
```

The script will overwrite the existing model.

## Comparison with NFL Model

| Aspect | NFL Model | NBA Model |
|--------|-----------|-----------|
| **Data Source** | ESPN API | NBA API |
| **Features** | 4 (HomeOffYards, HomeDefYards, AwayOffYards, AwayDefYards) | 2 (HomeAvgPts, AwayAvgPts) |
| **Algorithm** | RandomForest | RandomForest |
| **Prediction Target** | Home Win (1) / Away Win (0) | Home Win (1) / Away Win (0) |
| **Model File** | `nfl_model.pkl` | `nba_model.pkl` |

Both models follow the same pattern for consistency.

## Next Steps

After training the model:

1. **Start the backend server:**
   ```bash
   cd backend
   python run_server.py
   ```

2. **Test the NBA predictions:**
   - Navigate to the predictions page
   - Click on the NBA tab
   - You should see predictions for upcoming games

3. **Make API calls:**
   ```bash
   curl http://localhost:8000/api/v1/nba/predict/<game_id>
   ```

## Support

If you encounter issues:
1. Check the backend server logs for error messages
2. Verify the model file exists at `backend/models/saved_models/nba_model.pkl`
3. Ensure all dependencies are installed
4. Check that the NBA API is accessible from your network
