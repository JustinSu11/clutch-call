"""
Demonstration of NBA ML Predictions with Confidence Scores and Decision Factors

This script shows example output structures for the enhanced prediction system.
"""

import json

# Example Game Outcome Prediction with Confidence and Decision Factors
game_prediction_example = {
    "prediction_date": "2025-10-15T21:30:00",
    "days_ahead": 1,
    "games_count": 1,
    "games": [
        {
            "game_id": "0022400123",
            "game_date": "10/16/2025",
            "home_team_id": 1610612738,  # Boston Celtics
            "away_team_id": 1610612752,  # New York Knicks
            "predicted_winner": "home",
            "confidence": 0.685,  # 68.5% confidence
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

# Example Player Performance Prediction with Decision Factors
player_prediction_example = {
    "prediction_date": "2025-10-15T21:30:00",
    "days_ahead": 1,
    "total_predictions": 1,
    "predictions": [
        {
            "game_id": "0022400123",
            "game_date": "10/16/2025",
            "team_type": "home",
            "team_id": 1610612738,
            "player_id": "203507",
            "player_name": "Giannis Antetokounmpo",
            "position": "F",
            "predicted_points": 28.5,
            "predicted_assists": 5.8,
            "predicted_rebounds": 11.2,
            "decision_factors": {
                "points": [
                    {
                        "factor": "Minutes Per Game",
                        "importance": 0.15,
                        "value": 34.5,
                        "contribution": 0.129
                    },
                    {
                        "factor": "Field Goal Percentage",
                        "importance": 0.12,
                        "value": 0.58,
                        "contribution": 0.0696
                    },
                    {
                        "factor": "Points Per Game",
                        "importance": 0.13,
                        "value": 28.2,
                        "contribution": 0.122
                    }
                ],
                "assists": [
                    {
                        "factor": "Assists Per Game",
                        "importance": 0.13,
                        "value": 5.6,
                        "contribution": 0.097
                    },
                    {
                        "factor": "Minutes Per Game",
                        "importance": 0.10,
                        "value": 34.5,
                        "contribution": 0.086
                    },
                    {
                        "factor": "Field Goal Percentage",
                        "importance": 0.09,
                        "value": 0.58,
                        "contribution": 0.052
                    }
                ],
                "rebounds": [
                    {
                        "factor": "Rebounds Per Game",
                        "importance": 0.14,
                        "value": 10.9,
                        "contribution": 0.102
                    },
                    {
                        "factor": "Minutes Per Game",
                        "importance": 0.11,
                        "value": 34.5,
                        "contribution": 0.095
                    },
                    {
                        "factor": "Games Played",
                        "importance": 0.08,
                        "value": 68,
                        "contribution": 0.066
                    }
                ]
            }
        }
    ]
}


def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def print_game_prediction(game):
    """Pretty print a game prediction"""
    print(f"\nGame: {game['game_date']}")
    print(f"  Teams: Home ({game['home_team_id']}) vs Away ({game['away_team_id']})")
    print(f"  Predicted Winner: {game['predicted_winner'].upper()}")
    print(f"  Confidence: {game['confidence']:.1%}")
    print(f"  Home Win Probability: {game['home_win_probability']:.1%}")
    print(f"  Away Win Probability: {game['away_win_probability']:.1%}")
    
    print(f"\n  Top Decision Factors:")
    for i, factor in enumerate(game['decision_factors'], 1):
        print(f"    {i}. {factor['factor']}")
        print(f"       • Importance: {factor['importance']:.4f}")
        print(f"       • Value: {factor['value']:.2f}")
        print(f"       • Contribution: {factor['contribution']:.4f}")


def print_player_prediction(player):
    """Pretty print a player prediction"""
    print(f"\nPlayer: {player['player_name']} ({player['position']})")
    print(f"  Team: {player['team_id']} ({player['team_type']})")
    print(f"  Game: {player['game_date']}")
    print(f"\n  Predictions:")
    print(f"    • Points: {player['predicted_points']:.1f}")
    print(f"    • Assists: {player['predicted_assists']:.1f}")
    print(f"    • Rebounds: {player['predicted_rebounds']:.1f}")
    
    print(f"\n  Decision Factors:")
    for stat_type in ['points', 'assists', 'rebounds']:
        factors = player['decision_factors'][stat_type]
        print(f"\n    {stat_type.upper()}:")
        for i, factor in enumerate(factors, 1):
            print(f"      {i}. {factor['factor']}")
            print(f"         • Importance: {factor['importance']:.4f}")
            print(f"         • Value: {factor['value']:.2f}")
            print(f"         • Contribution: {factor['contribution']:.4f}")


def main():
    """Demonstrate the enhanced prediction output"""
    print_section("NBA ML PREDICTIONS - Enhanced with Confidence and Decision Factors")
    
    print("\nThis demonstration shows the structure of predictions that now include:")
    print("  1. Confidence scores - How certain the model is about its prediction")
    print("  2. Decision factors - What features influenced the prediction the most")
    print("\n" + "-" * 80)
    
    # Game Prediction Demo
    print_section("GAME OUTCOME PREDICTION")
    print("\nEndpoint: GET /api/v1/nba/predictions/games")
    print("\nExample Response:")
    print(json.dumps(game_prediction_example, indent=2))
    
    print("\n" + "-" * 80)
    print("INTERPRETATION:")
    for game in game_prediction_example['games']:
        print_game_prediction(game)
    
    print("\n" + "-" * 80)
    print("\nKey Insights:")
    print("  • Home Court Advantage (15% importance) is the strongest factor")
    print("  • The home team scores 115.5 PPG (12% importance)")
    print("  • Recent form (80% win rate in last 5) contributes significantly")
    print("  • Model is 68.5% confident in home team victory")
    
    # Player Prediction Demo
    print_section("PLAYER PERFORMANCE PREDICTION")
    print("\nEndpoint: GET /api/v1/nba/predictions/players")
    print("\nExample Response:")
    print(json.dumps(player_prediction_example, indent=2))
    
    print("\n" + "-" * 80)
    print("INTERPRETATION:")
    for player in player_prediction_example['predictions']:
        print_player_prediction(player)
    
    print("\n" + "-" * 80)
    print("\nKey Insights:")
    print("  • Minutes Per Game is a strong predictor across all stat types")
    print("  • Each stat (points, assists, rebounds) has different key factors")
    print("  • Historical averages (PPG, APG, RPG) are important predictors")
    print("  • Shooting efficiency (FG%) influences points and assists")
    
    print_section("BENEFITS OF THIS ENHANCEMENT")
    print("""
1. TRANSPARENCY
   • Users can see why the AI made specific predictions
   • No more "black box" - the reasoning is clear

2. TRUST
   • Understanding the factors builds confidence in predictions
   • Users can validate if the factors make basketball sense

3. ANALYSIS
   • Analysts can study what factors drive wins/performance
   • Coaches can identify areas to focus on

4. DEBUGGING
   • Developers can verify the model uses sensible features
   • Easier to identify when the model might be wrong

5. EDUCATION
   • Casual fans learn what matters in basketball
   • Advanced stats become more accessible
    """)
    
    print("=" * 80)
    print("Ready to use! Try the API endpoints with real predictions.")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
