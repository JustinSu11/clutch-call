# Clutch Call
Clutch Call is a student built website that uses AI to predict game outcomes using team statistics.
The project is built using python and react.

## Features

### Automatic NBA ML Model Training
The NBA machine learning models are now fully automated:
- **Automatic Training on Startup**: Models are automatically trained when the server starts if they don't exist
- **Scheduled Retraining**: Models are automatically retrained every night at 4:00 AM Central Time (CT/CDT/CST)
- **Zero Configuration**: No manual intervention needed - the system handles everything

See [backend/NBA_ML_AUTO_TRAINING.md](backend/NBA_ML_AUTO_TRAINING.md) for detailed documentation.
