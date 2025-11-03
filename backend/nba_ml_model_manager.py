"""
NBA ML Model Manager
Handles automatic model training on startup and scheduled retraining
"""

import os
import sys
import logging
from datetime import datetime
from typing import Dict, List, Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NBAModelManager:
    """Manager for NBA ML models - handles training and lifecycle"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.models_dir = os.path.join(data_dir, 'models')
        
    def models_exist(self) -> bool:
        """Check if all required models exist"""
        required_models = [
            'game_outcome_model.pkl'
        ]
        
        if not os.path.exists(self.models_dir):
            logger.info(f"Models directory does not exist: {self.models_dir}")
            return False
        
        for model_file in required_models:
            model_path = os.path.join(self.models_dir, model_file)
            if not os.path.exists(model_path):
                logger.info(f"Model file missing: {model_file}")
                return False
        
        logger.info("All required models exist")
        return True
    
    def train_models(self, force_retrain: bool = False) -> bool:
        """Train or retrain all NBA models"""
        logger.info("=" * 60)
        logger.info("NBA MODEL TRAINING")
        logger.info("=" * 60)
        logger.info(f"Start time: {datetime.now()}")
        logger.info(f"Force retrain: {force_retrain}")
        
        try:
            # Import the training pipeline
            from nba_ml_training_pipeline import NBAMLPipeline
            
            # Initialize pipeline
            pipeline = NBAMLPipeline(
                data_dir=self.data_dir,
                force_retrain=force_retrain
            )
            
            # Run the full training pipeline
            # Use fewer epochs for faster training (can be adjusted)
            results = pipeline.run_full_pipeline(
                seasons=None,  # Will use default seasons
                epochs_game=30  # Reduced for faster training
            )
            
            # Check if training was successful
            if results and results.get('pipeline_summary', {}).get('status') == 'completed_successfully':
                logger.info("✅ Model training completed successfully")
                return True
            else:
                logger.error("❌ Model training failed")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error during model training: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def ensure_models_ready(self) -> bool:
        """Ensure models are ready - train if they don't exist"""
        logger.info("Checking if NBA models are ready...")
        
        if self.models_exist():
            logger.info("✅ NBA models are ready")
            return True
        
        logger.info("⚠️  NBA models not found - starting training...")
        return self.train_models(force_retrain=False)
    
    def retrain_models(self) -> bool:
        """Retrain models (for scheduled updates)"""
        logger.info("🔄 Scheduled model retraining started...")
        return self.train_models(force_retrain=True)


def ensure_models_on_startup(data_dir: str = "nba_ml_data") -> bool:
    """
    Called on server startup to ensure models exist
    If models don't exist, trains them
    """
    manager = NBAModelManager(data_dir=data_dir)
    return manager.ensure_models_ready()


def retrain_models_scheduled(data_dir: str = "nba_ml_data") -> bool:
    """
    Called by scheduler to retrain models
    """
    manager = NBAModelManager(data_dir=data_dir)
    return manager.retrain_models()


if __name__ == "__main__":
    # For testing
    manager = NBAModelManager()
    manager.ensure_models_ready()
