
# Clutch Call Backend (Flask + Uvicorn)

A simple Flask backend exposing sports data endpoints for NBA, NFL, and Soccer using free public APIs (no scraping).

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

2. Start the server:

**For Development:**
```
python run_server.py
```

**For Production:**
```
python run_server_prod.py
```

By default it listens on http://127.0.0.1:8000 (development) or http://0.0.0.0:8000 (production). You can change host/port via env vars HOST/PORT.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## Notes

- NBA data: nba_api
- NFL and Soccer data: ESPN public endpoints used by their websites (no auth). These are publicly accessible JSON endpoints.
