# NBA ML Predictions API - Confidence Scores and Decision Factors

## Overview

The NBA ML prediction system includes **confidence scores** and **decision factors** for game outcome predictions. These additions provide transparency into the AI model's decision-making process.

## Game Outcome Predictions

### Confidence Score
The `confidence` field represents the model's certainty in its prediction. It is calculated as the maximum probability between the home team winning and the away team winning.

- **Range**: 0.0 to 1.0 (0% to 100%)
- **Interpretation**: 
  - 0.5-0.6: Low confidence (close game)
  - 0.6-0.7: Moderate confidence
  - 0.7-0.8: High confidence
  - 0.8+: Very high confidence

### Decision Factors
The `decision_factors` field provides the top 5 factors that influenced the model's prediction, ranked by their contribution to the decision.

Each factor includes:
- **factor**: Human-readable name of the feature (e.g., "Home Court Advantage", "Points Per Game")
- **importance**: Feature importance score from the model (0.0 to 1.0)
- **value**: Actual value of the feature for this game
- **contribution**: Combined score (importance × normalized value)

## API Endpoints

### GET /api/v1/nba/predictions/games

Returns game outcome predictions with confidence scores and decision factors.

**Example Response:**
```json
{
  "prediction_date": "2025-10-15T21:30:00",
  "days_ahead": 1,
  "games_count": 2,
  "games": [
    {
      "game_id": "0022400123",
      "game_date": "10/16/2025",
      "home_team_id": 1610612738,
      "away_team_id": 1610612752,
      "predicted_winner": "home",
      "confidence": 0.685,
      "home_win_probability": 0.685,
      "away_win_probability": 0.315,
      "decision_factors": [
        {
          "factor": "Home Court Advantage",
          "importance": 0.15,
          "value": 1,
          "contribution": 0.15
        },
        {
          "factor": "Points Per Game",
          "importance": 0.12,
          "value": 115.5,
          "contribution": 0.102
        },
        {
          "factor": "Win Rate (Last 5 Games)",
          "importance": 0.08,
          "value": 0.8,
          "contribution": 0.064
        },
        {
          "factor": "Field Goal Percentage",
          "importance": 0.10,
          "value": 0.48,
          "contribution": 0.048
        },
        {
          "factor": "Three-Point Percentage",
          "importance": 0.08,
          "value": 0.37,
          "contribution": 0.0296
        }
      ]
    }
  ]
}
```

### GET /api/v1/nba/predictions/game/{game_id}

Returns detailed predictions for a specific game with confidence scores and decision factors.

## How Decision Factors Are Calculated

1. **Feature Importance**: Extracted from the trained machine learning models (RandomForest or GradientBoosting). This represents how important each feature is to the model overall.

2. **Feature Value**: The actual value of the feature for the specific game being predicted.

3. **Normalization**: Feature values are normalized to a 0-1 scale for fair comparison:
   - Percentages: Already in 0-1 range
   - Points Per Game: Normalized to typical range (90-120 for teams)
   - Rebounds/Assists: Normalized to typical ranges

4. **Contribution Score**: `importance × normalized_value` - represents the actual impact of this feature on this specific prediction.

5. **Ranking**: Factors are sorted by contribution score and the top N are returned.

## Implementation Details

The feature importance and decision factors are extracted from tree-based models (RandomForest and GradientBoosting) using their native `feature_importances_` attribute. This provides interpretable insights into what the model considers most important for each prediction.

## Benefits

1. **Transparency**: Users can understand why the model made a specific prediction
2. **Trust**: Seeing the reasoning helps build confidence in the predictions
3. **Analysis**: Analysts can identify patterns in what factors drive wins
4. **Debugging**: Developers can verify the model is using sensible features
