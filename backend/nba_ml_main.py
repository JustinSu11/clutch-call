"""
NBA ML System - Main Entry Point
Complete NBA prediction system using nba_api and machine learning
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# Import our custom modules
from nba_ml import NBAMLPipeline, NBAMLPredictor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('nba_ml_system.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NBAMLSystem:
    """Complete NBA Machine Learning Prediction System"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.pipeline = NBAMLPipeline(data_dir)
        self.predictor = None
        
    def train_models(self, force_retrain: bool = False, 
                    seasons: Optional[List[str]] = None,
                    epochs_game: int = 50, epochs_player: int = 75) -> Dict:
        """Train or retrain the NBA prediction models"""
        logger.info("🏀 Starting NBA ML Model Training...")
        
        # Set force retrain
        self.pipeline.force_retrain = force_retrain
        
        # Run training pipeline
        results = self.pipeline.run_full_pipeline(
            seasons=seasons,
            epochs_game=epochs_game,
            epochs_player=epochs_player
        )
        
        return results
    
    def make_predictions(self, days_ahead: int = 7) -> Dict:
        """Generate predictions for upcoming games"""
        logger.info("🔮 Generating NBA Predictions...")
        
        # Initialize predictor
        self.predictor = NBAMLPredictor(self.data_dir)
        
        # Generate predictions
        predictions = self.predictor.generate_comprehensive_predictions(days_ahead)
        
        return predictions
    
    def update_and_predict(self, days_ahead: int = 7) -> Dict:
        """Update models with recent data and make predictions"""
        logger.info("🔄 Updating Models and Generating Predictions...")
        
        # Update with recent data (don't retrain full models, just recent games)
        self.pipeline.force_retrain = False
        
        # Run data collection and preprocessing only
        if self.pipeline.step_1_collect_data(days_back=7):
            self.pipeline.step_2_preprocess_data()
        
        # Make predictions
        return self.make_predictions(days_ahead)
    
    def system_status(self) -> Dict:
        """Check the status of the NBA ML system"""
        logger.info("📊 Checking System Status...")
        
        status = {
            'timestamp': datetime.now().isoformat(),
            'data_directory': self.data_dir,
            'data_directory_exists': os.path.exists(self.data_dir),
            'models_available': {},
            'preprocessors_available': False,
            'recent_data_available': False,
            'system_ready': False
        }
        
        # Check models directory
        models_dir = os.path.join(self.data_dir, 'models')
        if os.path.exists(models_dir):
            # Check for specific model files
            model_files = {
                'game_outcome': 'game_outcome_model.pkl',
                'points_prediction': 'points_prediction_model.pkl',
                'assists_prediction': 'assists_prediction_model.pkl',
                'rebounds_prediction': 'rebounds_prediction_model.pkl'
            }
            
            for model_name, filename in model_files.items():
                model_path = os.path.join(models_dir, filename)
                status['models_available'][model_name] = os.path.exists(model_path)
        
        # Check preprocessors
        preprocessors_dir = os.path.join(self.data_dir, 'models', 'preprocessors')
        if os.path.exists(preprocessors_dir):
            scaler_file = os.path.join(preprocessors_dir, 'standard_scaler.pkl')
            features_file = os.path.join(preprocessors_dir, 'feature_columns.json')
            status['preprocessors_available'] = os.path.exists(scaler_file) or os.path.exists(features_file)
        
        # Check recent data
        processed_dir = os.path.join(self.data_dir, 'processed')
        games_file = os.path.join(processed_dir, 'all_games.csv')
        status['recent_data_available'] = os.path.exists(games_file)
        
        # Overall system readiness
        models_ready = any(status['models_available'].values())
        status['system_ready'] = (
            status['data_directory_exists'] and
            models_ready and
            status['recent_data_available']
        )
        
        return status
    
    def print_system_info(self):
        """Print comprehensive system information"""
        print("\n" + "=" * 80)
        print("🏀 NBA ML PREDICTION SYSTEM")
        print("=" * 80)
        
        status = self.system_status()
        
        print(f"System Status: {'✅ Ready' if status['system_ready'] else '❌ Not Ready'}")
        print(f"Data Directory: {status['data_directory']}")
        print(f"Timestamp: {status['timestamp']}")
        
        print("\n📁 Component Status:")
        print("-" * 40)
        print(f"Data Directory: {'✅' if status['data_directory_exists'] else '❌'}")
        print(f"Recent Data: {'✅' if status['recent_data_available'] else '❌'}")
        print(f"Preprocessors: {'✅' if status['preprocessors_available'] else '❌'}")
        
        print("\n🤖 Model Status:")
        print("-" * 40)
        for model_name, available in status['models_available'].items():
            print(f"{model_name.replace('_', ' ').title()}: {'✅' if available else '❌'}")
        
        if not status['system_ready']:
            print("\n💡 Next Steps:")
            print("-" * 40)
            if not any(status['models_available'].values()):
                print("• Run training to create models: python nba_ml_main.py --train")
            if not status['recent_data_available']:
                print("• Collect data: python nba_ml_main.py --train --force-retrain")
            if not status['preprocessors_available']:
                print("• Preprocessing will be handled during training")
        
        print("=" * 80)

def main():
    """Main execution function with comprehensive CLI"""
    parser = argparse.ArgumentParser(
        description='NBA ML Prediction System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train models from scratch
  python nba_ml_main.py --train --force-retrain
  
  # Make predictions (requires trained models)
  python nba_ml_main.py --predict --days-ahead 7
  
  # Update with recent data and predict
  python nba_ml_main.py --update-predict
  
  # Check system status
  python nba_ml_main.py --status
  
  # Complete workflow: train and predict
  python nba_ml_main.py --train --predict
        """
    )
    
    # Main actions
    parser.add_argument('--train', action='store_true', help='Train ML models')
    parser.add_argument('--predict', action='store_true', help='Generate predictions')
    parser.add_argument('--update-predict', action='store_true', help='Update data and predict')
    parser.add_argument('--status', action='store_true', help='Check system status')
    
    # Configuration options
    parser.add_argument('--data-dir', default='nba_ml_data', help='Data directory (default: nba_ml_data)')
    parser.add_argument('--force-retrain', action='store_true', help='Force retraining of models')
    parser.add_argument('--seasons', nargs='+', help='Seasons to train on (e.g., 2020-21 2021-22)')
    parser.add_argument('--days-ahead', type=int, default=7, help='Days ahead for predictions (default: 7)')
    parser.add_argument('--epochs-game', type=int, default=50, help='Training epochs for game model (default: 50)')
    parser.add_argument('--epochs-player', type=int, default=75, help='Training epochs for player models (default: 75)')
    
    # Output options
    parser.add_argument('--output-predictions', help='Save predictions to JSON file')
    parser.add_argument('--output-results', help='Save training results to JSON file')
    
    args = parser.parse_args()
    
    # Initialize system
    system = NBAMLSystem(data_dir=args.data_dir)
    
    # Show system info if no specific action requested
    if not any([args.train, args.predict, args.update_predict, args.status]):
        system.print_system_info()
        return
    
    results = {}
    
    # Status check
    if args.status:
        system.print_system_info()
        results['status'] = system.system_status()
    
    # Training
    if args.train:
        print(f"\n🏀 Training NBA ML Models...")
        training_results = system.train_models(
            force_retrain=args.force_retrain,
            seasons=args.seasons,
            epochs_game=args.epochs_game,
            epochs_player=args.epochs_player
        )
        results['training'] = training_results
        
        # Save training results if requested
        if args.output_results:
            with open(args.output_results, 'w') as f:
                json.dump(training_results, f, indent=2)
            print(f"Training results saved to: {args.output_results}")
    
    # Prediction
    if args.predict:
        print(f"\n🔮 Generating Predictions for next {args.days_ahead} days...")
        predictions = system.make_predictions(days_ahead=args.days_ahead)
        results['predictions'] = predictions
        
        # Print summary
        if system.predictor:
            system.predictor.print_predictions_summary(predictions)
        
        # Save predictions if requested
        if args.output_predictions:
            with open(args.output_predictions, 'w') as f:
                json.dump(predictions, f, indent=2)
            print(f"Predictions saved to: {args.output_predictions}")
    
    # Update and predict
    if args.update_predict:
        print(f"\n🔄 Updating Data and Generating Predictions...")
        predictions = system.update_and_predict(days_ahead=args.days_ahead)
        results['update_predictions'] = predictions
        
        # Print summary
        if system.predictor:
            system.predictor.print_predictions_summary(predictions)
    
    # Final summary
    if results:
        print(f"\n✅ NBA ML System execution completed successfully!")
        print(f"Results saved to system logs and data directory: {args.data_dir}")
    
    return results

def create_requirements_file():
    """Create requirements.txt with all necessary dependencies"""
    requirements = """# NBA ML Prediction System Requirements
nba_api>=1.1.11
pandas>=1.5.0
numpy>=1.21.0
scikit-learn>=1.2.0
joblib>=1.2.0
matplotlib>=3.5.0
seaborn>=0.11.0

# Optional: TensorFlow for advanced models
# tensorflow>=2.10.0

# Data processing
requests>=2.28.0

# Existing backend dependencies
Flask>=2.2.0
Flask-Cors>=3.0.0
gunicorn>=20.1.0
uvicorn>=0.18.0
asgiref>=3.5.0
"""
    
    with open('requirements_nba_ml.txt', 'w') as f:
        f.write(requirements)
    
    print("Created requirements_nba_ml.txt with all dependencies")

if __name__ == "__main__":
    print("🏀 NBA ML Prediction System")
    print("=" * 50)
    
    # Create requirements file
    create_requirements_file()
    
    # Run main system
    try:
        results = main()
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\n⚠️ Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"System error: {e}")
        print(f"\n❌ System error: {e}")
        sys.exit(1)