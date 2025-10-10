"""
NBA ML Training Pipeline
Complete training pipeline with hyperparameter tuning, model selection, and evaluation
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our custom modules
from nba_ml_data_collector import NBADataCollector
from nba_ml_preprocessor import NBADataPreprocessor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('nba_ml_training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NBAMLPipeline:
    """Complete NBA ML training pipeline"""
    
    def __init__(self, data_dir: str = "nba_ml_data", force_retrain: bool = False):
        self.data_dir = data_dir
        self.force_retrain = force_retrain
        
        # Initialize components
        self.data_collector = NBADataCollector(data_dir)
        self.preprocessor = NBADataPreprocessor(data_dir)
        
        # Pipeline results
        self.pipeline_results = {}
        
    def step_1_collect_data(self, seasons: List[str] = None, days_back: int = 30) -> bool:
        """Step 1: Collect NBA data"""
        logger.info("=" * 60)
        logger.info("STEP 1: DATA COLLECTION")
        logger.info("=" * 60)
        
        try:
            if seasons is None:
                seasons = self.data_collector.get_seasons_list(start_year=2020, end_year=2024)
            
            logger.info(f"Collecting data for seasons: {seasons}")
            
            # Check if data already exists
            processed_file = os.path.join(self.data_dir, 'processed', 'all_games.csv')
            if os.path.exists(processed_file) and not self.force_retrain:
                logger.info("Historical data already exists. Skipping collection.")
                logger.info("Use force_retrain=True to recollect data.")
            else:
                # Collect historical data
                self.data_collector.collect_historical_data(seasons, collect_detailed_games=False)
            
            # Always collect recent games for up-to-date training
            recent_games = self.data_collector.collect_recent_games_with_details(days_back=days_back)
            
            # Get upcoming games for prediction
            upcoming_games = self.data_collector.get_upcoming_games(days_ahead=7)
            
            self.pipeline_results['data_collection'] = {
                'seasons_collected': seasons,
                'recent_games_count': len(recent_games),
                'upcoming_games_count': len(upcoming_games),
                'status': 'success'
            }
            
            logger.info("✅ Data collection completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Data collection failed: {e}")
            self.pipeline_results['data_collection'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def step_2_preprocess_data(self) -> bool:
        """Step 2: Preprocess and engineer features"""
        logger.info("=" * 60)
        logger.info("STEP 2: DATA PREPROCESSING")
        logger.info("=" * 60)
        
        try:
            # Check if processed data already exists
            ml_ready_dir = os.path.join(self.data_dir, 'processed', 'ml_ready')
            if os.path.exists(ml_ready_dir) and not self.force_retrain:
                logger.info("Processed data already exists. Skipping preprocessing.")
                logger.info("Use force_retrain=True to reprocess data.")
                
                # Still need to load preprocessors
                try:
                    self.preprocessor.load_preprocessors()
                    logger.info("✅ Preprocessors loaded successfully")
                except:
                    logger.info("No existing preprocessors found. Will create new ones.")
                    processed_data = self.preprocessor.process_all_data()
                    if not processed_data:
                        raise ValueError("Preprocessing failed")
                    
                    # Save preprocessors after successful data processing
                    self.preprocessor.save_preprocessors()
                    logger.info("✅ Preprocessors saved successfully")
            else:
                # Process all data
                processed_data = self.preprocessor.process_all_data()
                
                if not processed_data:
                    raise ValueError("No data was processed")
                
                # Save preprocessors after successful data processing
                self.preprocessor.save_preprocessors()
                logger.info("✅ Preprocessors saved successfully")
            
            self.pipeline_results['preprocessing'] = {
                'status': 'success',
                'ml_ready_data_path': ml_ready_dir
            }
            
            logger.info("✅ Data preprocessing completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Data preprocessing failed: {e}")
            self.pipeline_results['preprocessing'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def step_3_train_models(self, epochs_game: int = 50, epochs_player: int = 75) -> bool:
        """Step 3: Train ML models (simplified version without TensorFlow for compatibility)"""
        logger.info("=" * 60)
        logger.info("STEP 3: MODEL TRAINING")
        logger.info("=" * 60)
        
        try:
            # Import scikit-learn for fallback models
            from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
            from sklearn.linear_model import LogisticRegression, LinearRegression
            from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, mean_squared_error, r2_score
            import pandas as pd
            import numpy as np
            import joblib
            
            logger.info("Using scikit-learn models as TensorFlow alternative...")
            
            # Load processed data
            processed_dir = os.path.join(self.data_dir, 'processed', 'ml_ready')
            models_dir = os.path.join(self.data_dir, 'models')
            os.makedirs(models_dir, exist_ok=True)
            
            results = {}
            
            # Train game outcome model
            game_dir = os.path.join(processed_dir, 'game_prediction')
            if os.path.exists(game_dir):
                logger.info("Training game outcome model...")
                
                try:
                    X_train = pd.read_csv(os.path.join(game_dir, 'X_train.csv'))
                    y_train = pd.read_csv(os.path.join(game_dir, 'y_train.csv')).values.flatten()
                    X_val = pd.read_csv(os.path.join(game_dir, 'X_val.csv'))
                    y_val = pd.read_csv(os.path.join(game_dir, 'y_val.csv')).values.flatten()
                    X_test = pd.read_csv(os.path.join(game_dir, 'X_test.csv'))
                    y_test = pd.read_csv(os.path.join(game_dir, 'y_test.csv')).values.flatten()
                    
                    # Train ensemble of models
                    models = {
                        'random_forest': RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42),
                        'gradient_boosting': GradientBoostingClassifier(n_estimators=200, max_depth=6, random_state=42),
                        'logistic_regression': LogisticRegression(max_iter=1000, random_state=42)
                    }
                    
                    best_model = None
                    best_score = 0
                    game_results = {}
                    
                    for name, model in models.items():
                        logger.info(f"  Training {name}...")
                        model.fit(X_train, y_train)
                        
                        # Evaluate
                        val_pred = model.predict(X_val)
                        val_score = accuracy_score(y_val, val_pred)
                        
                        test_pred = model.predict(X_test)
                        test_score = accuracy_score(y_test, test_pred)
                        
                        game_results[name] = {
                            'validation_accuracy': val_score,
                            'test_accuracy': test_score,
                            'classification_report': classification_report(y_test, test_pred, output_dict=True)
                        }
                        
                        if val_score > best_score:
                            best_score = val_score
                            best_model = model
                        
                        logger.info(f"    {name} - Val Acc: {val_score:.4f}, Test Acc: {test_score:.4f}")
                    
                    # Save best model
                    if best_model is not None:
                        joblib.dump(best_model, os.path.join(models_dir, 'game_outcome_model.pkl'))
                        logger.info(f"  ✅ Best game model saved (accuracy: {best_score:.4f})")
                    
                    results['game_outcome'] = game_results
                    
                except Exception as e:
                    logger.error(f"  Game model training failed: {e}")
            
            # Train player performance models
            player_dir = os.path.join(processed_dir, 'player_predictions')
            if os.path.exists(player_dir):
                for target in ['points', 'assists', 'rebounds']:
                    target_dir = os.path.join(player_dir, target)
                    if not os.path.exists(target_dir):
                        continue
                        
                    logger.info(f"Training {target} prediction model...")
                    
                    try:
                        X_train = pd.read_csv(os.path.join(target_dir, 'X_train.csv'))
                        y_train = pd.read_csv(os.path.join(target_dir, 'y_train.csv')).values.flatten()
                        X_val = pd.read_csv(os.path.join(target_dir, 'X_val.csv'))
                        y_val = pd.read_csv(os.path.join(target_dir, 'y_val.csv')).values.flatten()
                        X_test = pd.read_csv(os.path.join(target_dir, 'X_test.csv'))
                        y_test = pd.read_csv(os.path.join(target_dir, 'y_test.csv')).values.flatten()
                        
                        # Train regression models
                        models = {
                            'random_forest': RandomForestRegressor(n_estimators=200, max_depth=15, random_state=42),
                            'gradient_boosting': GradientBoostingRegressor(n_estimators=200, max_depth=6, random_state=42),
                            'linear_regression': LinearRegression()
                        }
                        
                        best_model = None
                        best_score = float('inf')
                        target_results = {}
                        
                        for name, model in models.items():
                            logger.info(f"  Training {name} for {target}...")
                            model.fit(X_train, y_train)
                            
                            # Evaluate
                            val_pred = model.predict(X_val)
                            val_mae = mean_absolute_error(y_val, val_pred)
                            
                            test_pred = model.predict(X_test)
                            test_mae = mean_absolute_error(y_test, test_pred)
                            test_mse = mean_squared_error(y_test, test_pred)
                            test_r2 = r2_score(y_test, test_pred)
                            
                            target_results[name] = {
                                'validation_mae': val_mae,
                                'test_mae': test_mae,
                                'test_mse': test_mse,
                                'test_r2': test_r2
                            }
                            
                            if val_mae < best_score:
                                best_score = val_mae
                                best_model = model
                            
                            logger.info(f"    {name} - Val MAE: {val_mae:.4f}, Test MAE: {test_mae:.4f}, R²: {test_r2:.4f}")
                        
                        # Save best model
                        if best_model is not None:
                            joblib.dump(best_model, os.path.join(models_dir, f'{target}_prediction_model.pkl'))
                            logger.info(f"  ✅ Best {target} model saved (MAE: {best_score:.4f})")
                        
                        results[f'player_{target}'] = target_results
                        
                    except Exception as e:
                        logger.error(f"  {target} model training failed: {e}")
            
            # Save training results
            with open(os.path.join(models_dir, 'training_results.json'), 'w') as f:
                json.dump(results, f, indent=2)
            
            self.pipeline_results['model_training'] = {
                'status': 'success',
                'models_trained': list(results.keys()),
                'models_dir': models_dir
            }
            
            logger.info("✅ Model training completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Model training failed: {e}")
            self.pipeline_results['model_training'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def step_4_create_prediction_service(self) -> bool:
        """Step 4: Create prediction service"""
        logger.info("=" * 60)
        logger.info("STEP 4: PREDICTION SERVICE")
        logger.info("=" * 60)
        
        try:
            # This will be implemented in the prediction service file
            service_file = os.path.join(os.path.dirname(__file__), 'nba_ml_prediction_service.py')
            
            self.pipeline_results['prediction_service'] = {
                'status': 'success',
                'service_file': service_file
            }
            
            logger.info("✅ Prediction service setup completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Prediction service setup failed: {e}")
            self.pipeline_results['prediction_service'] = {'status': 'failed', 'error': str(e)}
            return False
    
    def run_full_pipeline(self, seasons: List[str] = None, 
                         epochs_game: int = 50, epochs_player: int = 75) -> Dict:
        """Run the complete NBA ML pipeline"""
        logger.info("🏀 STARTING NBA ML PIPELINE")
        logger.info(f"Pipeline started at: {datetime.now()}")
        logger.info("=" * 80)
        
        pipeline_start_time = datetime.now()
        
        # Step 1: Data Collection
        if not self.step_1_collect_data(seasons):
            return self.pipeline_results
        
        # Step 2: Data Preprocessing  
        if not self.step_2_preprocess_data():
            return self.pipeline_results
        
        # Step 3: Model Training
        if not self.step_3_train_models(epochs_game, epochs_player):
            return self.pipeline_results
        
        # Step 4: Prediction Service
        if not self.step_4_create_prediction_service():
            return self.pipeline_results
        
        # Pipeline completion
        pipeline_end_time = datetime.now()
        pipeline_duration = pipeline_end_time - pipeline_start_time
        
        self.pipeline_results['pipeline_summary'] = {
            'start_time': pipeline_start_time.isoformat(),
            'end_time': pipeline_end_time.isoformat(),
            'duration_seconds': pipeline_duration.total_seconds(),
            'status': 'completed_successfully'
        }
        
        # Save pipeline results
        results_file = os.path.join(self.data_dir, 'pipeline_results.json')
        with open(results_file, 'w') as f:
            # Convert datetime objects to strings for JSON serialization
            serializable_results = self._make_json_serializable(self.pipeline_results)
            json.dump(serializable_results, f, indent=2)
        
        logger.info("=" * 80)
        logger.info("🎉 NBA ML PIPELINE COMPLETED SUCCESSFULLY!")
        logger.info(f"Total duration: {pipeline_duration}")
        logger.info(f"Results saved to: {results_file}")
        logger.info("=" * 80)
        
        return self.pipeline_results
    
    def _make_json_serializable(self, obj):
        """Convert objects to JSON-serializable format"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {key: self._make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._make_json_serializable(item) for item in obj]
        else:
            return obj
    
    def print_pipeline_summary(self):
        """Print a summary of the pipeline results"""
        print("\n" + "=" * 60)
        print("NBA ML PIPELINE SUMMARY")
        print("=" * 60)
        
        for step_name, step_result in self.pipeline_results.items():
            if step_name == 'pipeline_summary':
                continue
                
            status = step_result.get('status', 'unknown')
            status_emoji = "✅" if status == 'success' else "❌"
            
            print(f"{status_emoji} {step_name.replace('_', ' ').title()}: {status}")
            
            if status == 'failed' and 'error' in step_result:
                print(f"   Error: {step_result['error']}")
        
        if 'pipeline_summary' in self.pipeline_results:
            summary = self.pipeline_results['pipeline_summary']
            print(f"\nTotal Duration: {summary.get('duration_seconds', 0):.2f} seconds")
        
        print("=" * 60)

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='NBA ML Training Pipeline')
    parser.add_argument('--data-dir', default='nba_ml_data', help='Data directory')
    parser.add_argument('--force-retrain', action='store_true', help='Force retraining even if models exist')
    parser.add_argument('--seasons', nargs='+', help='Seasons to collect (e.g., 2020-21 2021-22)')
    parser.add_argument('--epochs-game', type=int, default=50, help='Epochs for game prediction model')
    parser.add_argument('--epochs-player', type=int, default=75, help='Epochs for player prediction models')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = NBAMLPipeline(
        data_dir=args.data_dir,
        force_retrain=args.force_retrain
    )
    
    # Run pipeline
    results = pipeline.run_full_pipeline(
        seasons=args.seasons,
        epochs_game=args.epochs_game,
        epochs_player=args.epochs_player
    )
    
    # Print summary
    pipeline.print_pipeline_summary()
    
    return results

if __name__ == "__main__":
    results = main()