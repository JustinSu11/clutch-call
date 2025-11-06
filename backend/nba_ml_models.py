"""
NBA TensorFlow Models
Advanced neural network architectures for NBA game outcome and player performance prediction
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers, callbacks
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union, Any
import logging
from datetime import datetime
import os
import json
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NBAGameOutcomeModel:
    """Advanced neural network for predicting NBA game outcomes"""
    
    def __init__(self, input_dim: int, model_name: str = "nba_game_outcome"):
        self.input_dim = input_dim
        self.model_name = model_name
        self.model = None
        self.history = None
        self.callbacks_list = []
        
    def build_model(self, hidden_layers: List[int] = [256, 128, 64, 32], 
                   dropout_rate: float = 0.3, l2_reg: float = 0.001,
                   learning_rate: float = 0.001) -> keras.Model:
        """Build advanced game outcome prediction model"""
        logger.info(f"Building game outcome model with input dimension: {self.input_dim}")
        
        # Input layer
        inputs = keras.Input(shape=(self.input_dim,), name='game_features')
        
        # Feature normalization
        x = layers.BatchNormalization(name='input_norm')(inputs)
        
        # Deep neural network with residual connections
        for i, units in enumerate(hidden_layers):
            # Main path
            y = layers.Dense(
                units, 
                activation='relu',
                kernel_regularizer=regularizers.l2(l2_reg),
                name=f'dense_{i+1}'
            )(x)
            y = layers.BatchNormalization(name=f'batch_norm_{i+1}')(y)
            y = layers.Dropout(dropout_rate, name=f'dropout_{i+1}')(y)
            
            # Residual connection (if dimensions match)
            if i > 0 and x.shape[-1] == units:
                x = layers.Add(name=f'residual_{i+1}')([x, y])
            else:
                x = y
        
        # Attention mechanism for feature importance
        attention_weights = layers.Dense(
            x.shape[-1], 
            activation='softmax',
            name='attention_weights'
        )(x)
        x = layers.Multiply(name='attention_applied')([x, attention_weights])
        
        # Final layers
        x = layers.Dense(16, activation='relu', name='penultimate_layer')(x)
        x = layers.Dropout(dropout_rate / 2, name='final_dropout')(x)
        
        # Output layer (binary classification for win/loss)
        outputs = layers.Dense(1, activation='sigmoid', name='win_probability')(x)
        
        # Create model
        model = keras.Model(inputs=inputs, outputs=outputs, name=self.model_name)
        
        # Compile with advanced optimizer
        optimizer = keras.optimizers.Adam(
            learning_rate=learning_rate,
            beta_1=0.9,
            beta_2=0.999,
            epsilon=1e-07
        )
        
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall', keras.metrics.AUC()]
        )
        
        self.model = model
        return model
    
    def setup_callbacks(self, model_dir: str, patience: int = 15) -> List[callbacks.Callback]:
        """Setup training callbacks"""
        self.callbacks_list = [
            callbacks.EarlyStopping(
                monitor='val_loss',
                patience=patience,
                restore_best_weights=True,
                verbose=1
            ),
            callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=8,
                min_lr=1e-7,
                verbose=1
            ),
            callbacks.ModelCheckpoint(
                filepath=os.path.join(model_dir, f'{self.model_name}_best.h5'),
                monitor='val_accuracy',
                save_best_only=True,
                save_weights_only=False,
                verbose=1
            ),
            callbacks.TensorBoard(
                log_dir=os.path.join(model_dir, 'logs', self.model_name),
                histogram_freq=1,
                write_graph=True
            )
        ]
        return self.callbacks_list
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 100, batch_size: int = 64,
              model_dir: str = 'models') -> Dict:
        """Train the game outcome model"""
        logger.info(f"Training {self.model_name} model...")
        
        if self.model is None:
            self.build_model()
        
        # Setup callbacks
        self.setup_callbacks(model_dir)
        
        # Train model
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=self.callbacks_list,
            verbose=1
        )
        
        return self.history.history
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """Evaluate model performance"""
        logger.info("Evaluating game outcome model...")
        
        # Predictions
        y_pred_prob = self.model.predict(X_test)
        y_pred = (y_pred_prob > 0.5).astype(int).flatten()
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        
        evaluation_results = {
            'accuracy': float(accuracy),
            'classification_report': classification_report(y_test, y_pred, output_dict=True),
            'predictions': {
                'probabilities': y_pred_prob.flatten().tolist(),
                'binary_predictions': y_pred.tolist(),
                'true_values': y_test.tolist()
            }
        }
        
        logger.info(f"Game outcome model accuracy: {accuracy:.4f}")
        
        return evaluation_results



class EnsembleNBAPredictor:
    """Ensemble model combining multiple predictors for robust predictions"""
    
    def __init__(self, models_config: Dict):
        self.models_config = models_config
        self.game_models = []
        
    def add_game_model(self, model: NBAGameOutcomeModel, weight: float = 1.0):
        """Add a game outcome model to the ensemble"""
        self.game_models.append({'model': model, 'weight': weight})
    
    def predict_game_outcome(self, X: np.ndarray) -> np.ndarray:
        """Ensemble prediction for game outcomes"""
        if not self.game_models:
            raise ValueError("No game models in ensemble")
        
        predictions = []
        weights = []
        
        for model_info in self.game_models:
            pred = model_info['model'].model.predict(X).flatten()
            predictions.append(pred)
            weights.append(model_info['weight'])
        
        # Weighted average
        weights = np.array(weights)
        weights = weights / weights.sum()
        
        ensemble_pred = np.average(predictions, axis=0, weights=weights)
        return ensemble_pred

class ModelTrainer:
    """Comprehensive model training and evaluation system"""
    
    def __init__(self, data_dir: str = "nba_ml_data"):
        self.data_dir = data_dir
        self.models_dir = os.path.join(data_dir, 'models')
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.game_model = None
        self.evaluation_results = {}
        
    def load_processed_data(self) -> Dict:
        """Load processed ML-ready data"""
        logger.info("Loading processed data...")
        
        processed_dir = os.path.join(self.data_dir, 'processed', 'ml_ready')
        
        data = {
            'game_prediction': {}
        }
        
        # Load game prediction data
        game_dir = os.path.join(processed_dir, 'game_prediction')
        if os.path.exists(game_dir):
            for split in ['X_train', 'y_train', 'X_val', 'y_val', 'X_test', 'y_test']:
                file_path = os.path.join(game_dir, f'{split}.csv')
                if os.path.exists(file_path):
                    data['game_prediction'][split] = pd.read_csv(file_path)
        
        return data
    
    def train_all_models(self, epochs_game: int = 100) -> Dict:
        """Train all models"""
        logger.info("Starting comprehensive model training...")
        
        data = self.load_processed_data()
        
        if not data['game_prediction']:
            logger.error("No game prediction data found")
            return {}
        
        results = {}
        
        # Train game outcome model
        logger.info("Training game outcome model...")
        game_data = data['game_prediction']
        
        X_train = game_data['X_train'].values
        y_train = game_data['y_train'].values.flatten()
        X_val = game_data['X_val'].values
        y_val = game_data['y_val'].values.flatten()
        X_test = game_data['X_test'].values
        y_test = game_data['y_test'].values.flatten()
        
        self.game_model = NBAGameOutcomeModel(input_dim=X_train.shape[1])
        self.game_model.build_model()
        
        game_history = self.game_model.train(
            X_train, y_train, X_val, y_val,
            epochs=epochs_game, model_dir=self.models_dir
        )
        
        game_evaluation = self.game_model.evaluate(X_test, y_test)
        results['game_outcome'] = {
            'history': game_history,
            'evaluation': game_evaluation
        }
        
        # Save results
        self.evaluation_results = results
        self.save_training_results()
        
        return results
    
    def save_training_results(self):
        """Save training results and model summaries"""
        results_file = os.path.join(self.models_dir, 'training_results.json')
        
        # Convert numpy arrays to lists for JSON serialization
        serializable_results = {}
        for key, value in self.evaluation_results.items():
            serializable_results[key] = self.make_json_serializable(value)
        
        with open(results_file, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        # Save model summaries
        summaries_file = os.path.join(self.models_dir, 'model_summaries.txt')
        with open(summaries_file, 'w') as f:
            f.write("NBA ML Models Summary\n")
            f.write("=" * 50 + "\n\n")
            
            if self.game_model:
                f.write("Game Outcome Model:\n")
                self.game_model.model.summary(print_fn=lambda x: f.write(x + '\n'))
                f.write("\n" + "=" * 50 + "\n\n")
        
        logger.info(f"Training results saved to {self.models_dir}")
    
    def make_json_serializable(self, obj):
        """Convert objects to JSON-serializable format"""
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, dict):
            return {key: self.make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self.make_json_serializable(item) for item in obj]
        else:
            return obj

def main():
    """Main execution function"""
    trainer = ModelTrainer()
    
    print("Starting NBA model training...")
    
    # Train all models
    results = trainer.train_all_models()
    
    if results:
        print("\nTraining complete! Results summary:")
        
        for model_name, result in results.items():
            print(f"\n{model_name.replace('_', ' ').title()}:")
            
            if 'evaluation' in result:
                eval_data = result['evaluation']
                
                if 'accuracy' in eval_data:
                    # Classification metrics
                    print(f"  Accuracy: {eval_data['accuracy']:.4f}")
        
        print(f"\nModels and results saved to: {trainer.models_dir}")
    else:
        print("Training failed. Check data preprocessing.")

if __name__ == "__main__":
    main()