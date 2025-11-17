# NBA Predictions - Quick Start Guide

## Getting Started (First Time Setup)

After the recent refactoring to simplify the NBA prediction service, you need to train the NBA model before you can use predictions.

### Prerequisites

Make sure you have these Python packages installed:

```bash
cd backend
pip install -r requirements.txt
pip install nba_api  # If not already in requirements.txt
```

### Option 1: Quick Demo Model (Recommended for Testing)

Create a working model immediately using synthetic data:

```bash
cd backend/models/training_scripts
python train_nba_demo.py
```

**Time:** ~10 seconds  
**Output:** Creates `backend/models/saved_models/nba_model.pkl`

This demo model:
- ✅ Works immediately with your prediction service
- ✅ Uses realistic NBA scoring patterns (~110 ppg average)
- ✅ Has ~76% accuracy on synthetic data
- ⚠️ Uses synthetic data (not real NBA games)

### Option 2: Real NBA Data Model (Production)

Train with actual NBA game data from the API:

```bash
cd backend/models/training_scripts
python train_nba.py
```

**Time:** 2-5 minutes (depends on internet speed)  
**Requirements:** Internet connection, NBA API access

This production model:
- ✅ Uses real NBA game data from 2023-24 season
- ✅ Calculates team averages from actual games
- ✅ More accurate predictions
- ⚠️ Requires NBA API to be accessible

### After Training

1. **Verify the model was created:**
   ```bash
   ls backend/models/saved_models/nba_model.pkl
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   python run_server.py
   ```

3. **Test NBA predictions:**
   - Open the frontend
   - Navigate to Predictions page
   - Click on NBA tab
   - You should see predictions for upcoming games

## How It Works

### The Simplified NBA Service

After refactoring, the NBA service now mirrors the NFL pattern:

1. **Simple Model:** Uses just 2 features
   - `HomeAvgPts`: Home team's average points (last 5 games)
   - `AwayAvgPts`: Away team's average points (last 5 games)

2. **Direct API Calls:** Fetches data directly from NBA API when needed

3. **No Caching:** Predictions are calculated on-demand

4. **No CSV Storage:** No intermediate data files

### Prediction Flow

```
User Request → Get Game Info → Fetch Team Stats → Calculate Averages → Predict
```

## Troubleshooting

### "Model not loaded" error

**Problem:** The `nba_model.pkl` file doesn't exist

**Solution:** Run one of the training scripts (Option 1 or 2 above)

### NBA API connection errors

**Problem:** Can't reach stats.nba.com

**Solutions:**
- Check your internet connection
- Try Option 1 (demo model) instead
- NBA API may be temporarily down - try again later
- Some networks/firewalls block NBA API - use VPN or different network

### "Not enough games" warning during training

**Problem:** Early in the NBA season, teams haven't played 5+ games yet

**Solution:** 
- Use Option 1 (demo model) for testing
- Wait until teams have more games played
- Or modify `train_nba.py` to use fewer games (change `n_games=5` to `n_games=3`)

### Predictions work but seem inaccurate

**If using demo model:** This is expected - it's trained on synthetic data. Use Option 2 (real data) for better predictions.

**If using real data:** 
- The model is simple and uses only average points
- Consider retraining with more recent season data
- Model accuracy is typically 60-75% (similar to other simple models)

## Comparing with NFL

Both services now follow the same pattern:

| Aspect | NFL | NBA |
|--------|-----|-----|
| Model file | `nfl_model.pkl` | `nba_model.pkl` |
| Training script | `train_nfl.py` | `train_nba.py` |
| Features | 4 (yards) | 2 (points) |
| Algorithm | RandomForest | RandomForest |
| Data source | ESPN API | NBA API |
| Caching | None | None |
| CSV storage | None | None |

## API Endpoints

### Get Prediction
```
GET /api/v1/nba/predict/<game_id>
```

**Response:**
```json
{
  "prediction": "home",
  "predicted_winner": "home",
  "confidence": 62.5,
  "home_win_probability": 62.5,
  "away_win_probability": 37.5,
  "decision_factors": {
    "HomeAvgPts": {
      "importance": 56.8,
      "value": 112.3,
      "contribution": 1.3
    },
    "AwayAvgPts": {
      "importance": 43.2,
      "value": 108.1,
      "contribution": -0.9
    }
  },
  "features_used": {
    "HomeAvgPts": 112.3,
    "AwayAvgPts": 108.1,
    "PtsDiff": 4.2
  },
  "teams": {
    "home": "Lakers",
    "away": "Warriors"
  }
}
```

## Next Steps

1. ✅ Train the model (Option 1 or 2)
2. ✅ Start the server
3. ✅ Test predictions in the UI
4. 📈 (Optional) Retrain periodically with fresh data

## Support

If you still have issues after following this guide:

1. Check backend server logs for specific errors
2. Verify all dependencies are installed: `pip list | grep -E "nba_api|pandas|sklearn|joblib"`
3. Make sure the model file exists and is readable
4. Try the demo model first to verify the service works

---

**Note:** This simplified approach was introduced to match the NFL service pattern and remove unnecessary complexity from caching, CSV storage, and complex training pipelines.
