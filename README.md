# Clutch Call
Clutch Call is a student built website that uses AI to determine the best players and teams in their leagues using sports statistics.
The project is built using python and react.

# Backend Server Setup

## Steps

```bash
# Move into backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Linux/macOS
source venv/bin/activate
# Windows CMD
venv\Scripts\activate
# Windows PowerShell
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

## Features

### Automatic NBA ML Model Training
The NBA machine learning models are now fully automated:
- **Automatic Training on Startup**: Models are automatically trained when the server starts if they don't exist
- **Scheduled Retraining**: Models are automatically retrained every night at 4:00 AM Central Time (CT/CDT/CST)
- **Zero Configuration**: No manual intervention needed - the system handles everything

See [backend/NBA_ML_AUTO_TRAINING.md](backend/NBA_ML_AUTO_TRAINING.md) for detailed documentation.
