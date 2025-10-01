# EPL Match Predictor - Team Setup Guide

## Team Quick Setup

### Prerequisites
- Python 3.8+ installed
- Git (for cloning)
- Internet connection

### 1. Environment Setup
```bash
# Navigate to project
cd clutch-call

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate    # macOS/Linux
# venv\Scripts\activate     # Windows

# Install all dependencies
pip install -r requirements.txt
```

### 2. Get API Access
1. Go to [football-data.org](https://www.football-data.org/)
2. Sign up for FREE account
3. Copy your API key from dashboard
4. Set environment variable:
```bash
export FOOTBALL_DATA_API_KEY="your_key_here"
```

### 3. Run & Test
```bash
# Start the API server
python main.py

# Should see: "Model loaded and cached successfully!"
# Server runs on: http://localhost:8000
```

## Testing the API

### Quick Health Check
```bash
curl http://localhost:8000/healthz
# Should return: {"ok": true, "model_ready": true}
```

### View API Documentation
Open in browser: `http://localhost:8000/docs`

### Test Predictions
```bash
# Basic prediction
curl "http://localhost:8000/predict?home=Arsenal&away=Chelsea"

# With team aliases
curl "http://localhost:8000/predict?home=spurs&away=man%20city"

# Get upcoming matches
curl "http://localhost:8000/upcoming"

# Get upcoming matches for specific season
curl "http://localhost:8000/upcoming?season=2024"
```

## File Structure (for team reference)
```
├── main.py          # API endpoints & FastAPI app
├── predictor.py     # ML model & data processing  
├── config.py        # Settings & team aliases
├── utils.py         # Helper functions
├── models.py        # API response models
├── exceptions.py    # Error handling
├── requirements.txt # Python packages
└── app.py          # Alternative entry point
```

## Common Issues & Fixes

### "Module not found" errors
```bash
# Ensure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

### API key errors
```bash
# Check if key is set
echo $FOOTBALL_DATA_API_KEY

# Set it if missing
export FOOTBALL_DATA_API_KEY="your_actual_key"
```

### NumPy/sklearn issues on macOS
```bash
pip uninstall numpy scikit-learn
pip install numpy scikit-learn --no-cache-dir
```

## Development Commands

```bash
# Run with auto-reload (for development)
uvicorn main:app --reload

# Test imports
python -c "import main, predictor, utils"

# Check installed packages
pip list
```

## API Endpoints Summary

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/healthz` | Check if API is running | `GET /healthz` |
| `/docs` | Interactive API docs | Open in browser |
| `/teams` | List all team names | `GET /teams` |
| `/predict` | Get match predictions | `GET /predict?home=Arsenal&away=Chelsea` |
| `/upcoming` | Get upcoming scheduled matches | `GET /upcoming?season=2024` |

## Team Notes

- **First run**: Takes 1-2 minutes to fetch data and train model
- **API rate limits**: Free tier has limits, be mindful during testing
- **Team names**: Use `/canonicalize` endpoint to check valid names
- **Updates**: Model retrains on each startup with latest data

## Need Help?

1. Check `/docs` endpoint for interactive testing
2. Verify all requirements are installed
3. Ensure API key is valid and set
4. Check server logs for specific errors
