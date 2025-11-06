"""
Integration test to verify NBA predictions API returns confidence scores and decision factors.

This test demonstrates how the API endpoints return the new fields.
Note: This requires the server to be running and models to be trained.
"""

import sys
import os

# Add tests directory to path
sys.path.insert(0, os.path.dirname(__file__))

from utils import get_json


def test_game_predictions_with_factors():
    """Test that game predictions include confidence and decision factors"""
    print("\n" + "=" * 80)
    print("TEST: Game Predictions with Confidence and Decision Factors")
    print("=" * 80)
    
    try:
        # Get game predictions
        print("\n[INFO] Requesting game predictions from /nba/predictions/games")
        data = get_json("/nba/predictions/games?days_ahead=1")
        
        print(f"[PASS] Successfully retrieved predictions")
        print(f"  - Prediction date: {data.get('prediction_date')}")
        print(f"  - Games count: {data.get('games_count')}")
        
        # Check if we have games
        games = data.get('games', [])
        if games:
            game = games[0]
            print(f"\n[INFO] Examining first game prediction:")
            print(f"  - Game ID: {game.get('game_id')}")
            print(f"  - Game Date: {game.get('game_date')}")
            print(f"  - Home Team: {game.get('home_team_id')}")
            print(f"  - Away Team: {game.get('away_team_id')}")
            
            # Verify confidence score
            assert 'confidence' in game, "Missing 'confidence' field"
            confidence = game['confidence']
            print(f"  - Confidence: {confidence:.3f} ({confidence*100:.1f}%)")
            assert 0 <= confidence <= 1, "Confidence should be between 0 and 1"
            print("[PASS] Confidence score present and valid")
            
            # Verify probabilities
            assert 'home_win_probability' in game, "Missing 'home_win_probability'"
            assert 'away_win_probability' in game, "Missing 'away_win_probability'"
            print(f"  - Home win probability: {game['home_win_probability']:.3f}")
            print(f"  - Away win probability: {game['away_win_probability']:.3f}")
            print("[PASS] Win probabilities present")
            
            # Verify decision factors
            assert 'decision_factors' in game, "Missing 'decision_factors' field"
            factors = game['decision_factors']
            print(f"\n[INFO] Decision Factors (Top {len(factors)}):")
            
            for i, factor in enumerate(factors[:5], 1):
                assert 'factor' in factor, "Factor missing 'factor' name"
                assert 'importance' in factor, "Factor missing 'importance'"
                assert 'value' in factor, "Factor missing 'value'"
                assert 'contribution' in factor, "Factor missing 'contribution'"
                
                print(f"  {i}. {factor['factor']}")
                print(f"     - Importance: {factor['importance']:.4f}")
                print(f"     - Value: {factor['value']:.2f}")
                print(f"     - Contribution: {factor['contribution']:.4f}")
            
            print("\n[PASS] All decision factors are present and valid")
            print("[SUCCESS] Game predictions include confidence scores and decision factors!")
        else:
            print("[SKIP] No upcoming games available for testing")
    
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        raise




def main():
    """Run all integration tests"""
    print("\n" + "=" * 80)
    print("NBA PREDICTIONS API - CONFIDENCE AND FACTORS INTEGRATION TESTS")
    print("=" * 80)
    print("\nNote: These tests require:")
    print("  1. The server to be running (e.g., python run_server.py)")
    print("  2. ML models to be trained (e.g., via /nba/predictions/train)")
    print("  3. Upcoming games to be available")
    print("=" * 80)
    
    try:
        test_game_predictions_with_factors()
        
        print("\n" + "=" * 80)
        print("ALL TESTS PASSED!")
        print("=" * 80)
        print("\nThe NBA predictions API successfully returns:")
        print("  ✓ Confidence scores for game outcome predictions")
        print("  ✓ Decision factors explaining what influenced each prediction")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("TESTS FAILED")
        print("=" * 80)
        print(f"\nError: {e}")
        print("\nPossible reasons:")
        print("  - Server is not running")
        print("  - Models are not trained")
        print("  - No upcoming games available")
        print("  - API endpoint changed")
        print("=" * 80 + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
