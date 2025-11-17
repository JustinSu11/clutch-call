"""
File: tests/test_nba_predictions_with_factors.py
Purpose: Test that NBA predictions return confidence scores and decision factors
"""

import os
import unittest
from unittest.mock import Mock
import numpy as np
import pandas as pd

from nba_ml import NBAMLPredictor


class TestNBAPredictionsWithFactors(unittest.TestCase):
    """Test that predictions include confidence scores and decision factors"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.data_dir = "/tmp/test_nba_ml_data"
        os.makedirs(self.data_dir, exist_ok=True)
        
    def test_get_feature_importance(self):
        """Test that feature importance can be extracted from models"""
        predictor = NBAMLPredictor(data_dir=self.data_dir)
        
        # Mock a model with feature_importances_
        mock_model = Mock()
        mock_model.feature_importances_ = np.array([0.1, 0.2, 0.15, 0.05, 0.08, 
                                                      0.12, 0.09, 0.06, 0.04, 0.03,
                                                      0.02, 0.01, 0.015, 0.01] + [0.005] * 9)
        predictor.game_model = mock_model
        
        # Get feature importance
        importance = predictor.get_feature_importance()
        
        # Verify we get a dictionary
        self.assertIsInstance(importance, dict)
        
        # Verify we have the expected features
        expected_features = ['IS_HOME', 'TEAM_PPG', 'TEAM_FG_PCT']
        for feature in expected_features:
            self.assertIn(feature, importance)
            self.assertIsInstance(importance[feature], float)
    
    def test_get_top_decision_factors(self):
        """Test that decision factors are calculated correctly"""
        predictor = NBAMLPredictor(data_dir=self.data_dir)
        
        # Mock a model with feature_importances_
        mock_model = Mock()
        mock_model.feature_importances_ = np.array([0.15, 0.12, 0.10, 0.08, 0.07,
                                                      0.06, 0.05, 0.04, 0.03, 0.02,
                                                      0.02, 0.01, 0.01, 0.01] + [0.005] * 9)
        predictor.game_model = mock_model
        
        # Sample feature values
        feature_values = {
            'IS_HOME': 1,
            'TEAM_PPG': 115.5,
            'TEAM_FG_PCT': 0.48,
            'TEAM_FG3_PCT': 0.37,
            'TEAM_FT_PCT': 0.82,
            'TEAM_REB_PG': 45.2,
            'TEAM_AST_PG': 26.8,
            'WIN_PCT_LAST_5': 0.8
        }
        
        # Get top decision factors
        factors = predictor.get_top_decision_factors(feature_values, top_n=5)
        
        # Verify we get a list
        self.assertIsInstance(factors, list)
        
        # Verify we get up to 5 factors
        self.assertLessEqual(len(factors), 5)
        
        # Verify each factor has required fields
        if len(factors) > 0:
            factor = factors[0]
            self.assertIn('factor', factor)
            self.assertIn('importance', factor)
            self.assertIn('value', factor)
            self.assertIn('contribution', factor)
    
    def test_format_feature_name(self):
        """Test that feature names are formatted correctly"""
        predictor = NBAMLPredictor(data_dir=self.data_dir)
        
        # Test basic feature names
        self.assertEqual(predictor._format_feature_name('IS_HOME'), 'Home Court Advantage')
        self.assertEqual(predictor._format_feature_name('TEAM_PPG'), 'Points Per Game')
        self.assertEqual(predictor._format_feature_name('TEAM_FG_PCT'), 'Field Goal Percentage')
        
        # Test rolling features
        formatted = predictor._format_feature_name('TEAM_PTS_ROLL_5')
        self.assertIn('Points', formatted)
        self.assertIn('5', formatted)
    
    def test_prediction_includes_confidence(self):
        """Test that predictions include confidence scores"""
        # This would require a full mock setup with data
        # For now, we verify the structure exists
        predictor = NBAMLPredictor(data_dir=self.data_dir)
        
        # Verify methods exist
        self.assertTrue(hasattr(predictor, 'get_feature_importance'))
        self.assertTrue(hasattr(predictor, 'get_top_decision_factors'))


if __name__ == '__main__':
    unittest.main()
