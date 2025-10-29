# NBA ML Model Training - Automatic System

## Overview

The NBA ML model training system is now fully automated with two key features:

1. **Automatic Training on Startup**: When the server starts, if NBA ML models are not present, they will be automatically trained.
2. **Scheduled Retraining**: Models are automatically retrained every night at 4:00 AM Central Time to keep them up-to-date with the latest data.

## Components

### 1. Model Manager (`nba_ml_model_manager.py`)

The Model Manager handles the lifecycle of NBA ML models:

- **Model Detection**: Checks if all required models exist:
  - `game_outcome_model.pkl` - Predicts game outcomes (win/loss)
  - `points_prediction_model.pkl` - Predicts player points
  - `assists_prediction_model.pkl` - Predicts player assists
  - `rebounds_prediction_model.pkl` - Predicts player rebounds

- **Automatic Training**: If models are missing on startup, they are automatically trained
- **Manual Retraining**: Can be triggered manually for scheduled updates

### 2. Scheduler (`nba_ml_scheduler.py`)

The Scheduler manages the automatic retraining schedule:

- **Daily Retraining**: Automatically retrains models at 4:00 AM Central Time
- **Background Execution**: Runs in a background thread without blocking the server
- **Single Instance**: Ensures only one training job runs at a time

### 3. ASGI Integration (`asgi.py`)

The server startup has been modified to:

1. Initialize the Flask app
2. Check for NBA ML models (trains if missing)
3. Start the background scheduler for daily retraining
4. All in a background thread to not block server startup

## How It Works

### On Server Startup

```
Server Start
    ↓
Background Thread Starts
    ↓
Check for Models
    ├─→ Models Exist → Log "Models Ready"
    └─→ Models Missing → Start Training Pipeline
        ↓
    Training Complete
        ↓
Start Scheduler
    ↓
Schedule Daily Retraining (4am CT)
    ↓
Server Ready
```

### Daily Retraining Schedule

- **Time**: 4:00 AM Central Time (CDT/CST)
- **Frequency**: Daily
- **Action**: Full model retraining with latest data
- **Process**:
  1. Collect latest NBA data
  2. Preprocess data and engineer features
  3. Train all models (game outcome + player performance)
  4. Save trained models
  5. Models are immediately available for predictions

## Configuration

### Data Directory

By default, models are stored in:
```
backend/nba_ml_data/models/
```

### Customization

You can customize the behavior by modifying:

- **Training Time**: Edit the `CronTrigger` in `nba_ml_scheduler.py`
- **Training Parameters**: Modify epochs in `nba_ml_model_manager.py`
- **Data Directory**: Change `data_dir` parameter in initialization functions

## Manual Operations

### Check if Models Exist

```python
from nba_ml_model_manager import NBAModelManager

manager = NBAModelManager()
if manager.models_exist():
    print("Models are ready")
else:
    print("Models need to be trained")
```

### Manually Train Models

```python
from nba_ml_model_manager import NBAModelManager

manager = NBAModelManager()
success = manager.train_models(force_retrain=True)
```

### Check Scheduler Status

```python
from nba_ml_scheduler import get_scheduler

scheduler = get_scheduler()
if scheduler:
    jobs = scheduler.get_jobs()
    for job in jobs:
        print(f"Job: {job.name}")
        print(f"Next run: {job.next_run_time}")
```

## Logging

All model training and scheduling activities are logged:

- Model checks and training start/completion
- Scheduler initialization and job scheduling
- Next scheduled run times
- Training errors (if any)

Logs use the format:
```
YYYY-MM-DD HH:MM:SS - LEVEL - Message
```

## Requirements

The following packages are required (automatically installed from `requirements.txt`):

```
APScheduler>=3.10.0       # Job scheduling
pytz>=2023.3              # Timezone support
pandas>=1.5.0             # Data processing
numpy>=1.21.0             # Numerical computing
scikit-learn>=1.2.0       # Machine learning
joblib>=1.2.0             # Model persistence
nba_api>=1.1.11           # NBA data access
```

## Troubleshooting

### Models Not Training on Startup

Check the server logs for error messages. Common issues:
- Network connectivity (NBA API access required)
- Insufficient disk space for model storage
- Missing dependencies

**Accessing Server Logs:**
- **Development**: Logs are printed to console/stdout where the server is running
- **Production (systemd)**: Use `journalctl -u your-service-name -f` to follow logs
- **Production (Docker)**: Use `docker logs container-name -f`
- **Production (file-based)**: Check the log file location configured in your deployment

### Scheduler Not Running

Verify the scheduler is active:
```python
from nba_ml_scheduler import get_scheduler
print(get_scheduler() is not None)
```

### Training Takes Too Long

The training process runs in the background and won't block the server. However, if you need faster training:
- Reduce epochs in `nba_ml_model_manager.py` (see `train_models()` method)
- Use fewer seasons of data
- Reduce model complexity in the training pipeline

## Production Deployment

For production environments:

1. **First Deployment**: Allow extra time for initial model training
2. **Environment Variables**: Make training schedule configurable (optional):
   ```python
   # Example implementation in nba_ml_scheduler.py:
   import os
   training_hour = int(os.getenv('NBA_TRAINING_HOUR', '4'))
   training_minute = int(os.getenv('NBA_TRAINING_MINUTE', '0'))
   timezone = os.getenv('NBA_TRAINING_TIMEZONE', 'America/Chicago')
   ```
3. **Monitoring**: Set up alerts for training failures
4. **Resources**: Ensure sufficient CPU/memory for training (runs in background but still uses resources)
5. **Data Storage**: Ensure persistent storage for `nba_ml_data/` directory

## Testing

Test the system with:

```bash
# Test model manager (should print model detection status)
python nba_ml_model_manager.py
# Expected: Logs showing model check and training initiation if models are missing

# Test scheduler (runs for 60 seconds then stops with Ctrl+C)
python nba_ml_scheduler.py
# Expected: Scheduler starts, shows job scheduled for 4am CT, displays next run time
```

**Success Criteria:**
- Model manager should detect whether models exist
- Scheduler should show job scheduled for 4:00 AM Central Time
- Next run time should be calculated correctly
- No error messages or exceptions

## Architecture Benefits

1. **Zero Configuration**: Works out of the box - no manual model training needed
2. **Always Fresh**: Models are automatically updated with latest data
3. **Non-Blocking**: Training happens in background, server starts immediately
4. **Resilient**: Server starts even if training fails
5. **Scheduled**: Daily updates ensure models stay current
