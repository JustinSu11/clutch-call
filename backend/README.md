
# Clutch Call Backend (Flask + Uvicorn)

A simple Flask backend exposing sports data endpoints for NBA, NFL, and Soccer using free public APIs (no scraping).

## NBA Prediction System - ESPN API Integration

**Important**: The NBA prediction system now uses ESPN's public API for data collection and machine learning. This provides more reliable and consistent data for predictions.

### API Sources by Use Case:
- **NBA Predictions (ML System)**: ESPN API via `nba_ml_espn_data_collector.py`
- **NBA Frontend Endpoints**: nba_api (stats.nba.com) via `app/services/nba_service.py`
- **NFL Data**: ESPN public endpoints
- **Soccer Data**: ESPN public endpoints

## Endpoints (prefixed by /api/v1)

- GET /api/v1/health
- NBA
  - GET /api/v1/nba/games?season=2024&team_id=14&page=1&per_page=25
  - GET /api/v1/nba/game/{game_id}
  - GET /api/v1/nba/game/{game_id}/boxscore
  - GET /api/v1/nba/teams/{team_id}/last?n=5&season=2024
  - GET /api/v1/nba/upcoming?days=7
- NFL
  - GET /api/v1/nfl/games?week=1&season=2024
  - GET /api/v1/nfl/game/{event_id}
  - GET /api/v1/nfl/game/{event_id}/boxscore
  - GET /api/v1/nfl/upcoming?days=7
- Soccer (league supports MLS, EPL, LaLiga)
  - GET /api/v1/soccer/games?league=MLS&date=2025-09-12
  - GET /api/v1/soccer/game/{event_id}
  - GET /api/v1/soccer/game/{event_id}/boxscore
  - GET /api/v1/soccer/upcoming?league=MLS&days=7

## How to run

1. Create a virtual environment (recommended) and install dependencies:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Start the server (no need to type uvicorn args):

```
python run_server.py
```

By default it listens on http://127.0.0.1:8000. You can change host/port via env vars HOST/PORT.

## Notes

- **NBA Predictions**: ESPN public API (via `nba_ml_espn_data_collector.py` and `nba_ml_data_collector.py`)
- **NBA Frontend**: nba_api (for non-prediction endpoints like game listings, box scores)
- **NFL and Soccer**: ESPN public endpoints used by their websites (no auth). These are publicly accessible JSON endpoints.

## NBA Prediction System Architecture

The NBA prediction system uses a dual-API approach:
1. **ESPN API** (`nba_ml_espn_data_collector.py`): Collects training data for ML models
2. **Prediction Service** (`nba_ml_prediction_service.py`): Uses ESPN-sourced data for predictions
3. **Frontend Service** (`app/services/nba_service.py`): Uses nba_api for game listings (unchanged)
