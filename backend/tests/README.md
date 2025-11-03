# Backend API Smoke Tests

These are lightweight Python scripts to exercise the Flask backend endpoints.
They are not unit tests; they just hit the running server and validate shapes.

## Prerequisites

- The backend server is running locally (e.g., `python run_server.py`).
- Python environment has `requests` installed.

## How to run (Windows cmd)

- Run all tests:

```
python tests\run_all_tests.py
```

- Run a specific test:

```
python tests\test_health.py
python tests\test_nba.py
python tests\test_nfl.py
python tests\test_soccer.py
```

You can customize the base URL by setting environment variables:
- `HOST` (default 127.0.0.1)
- `PORT` (default 8000)
- `API_PREFIX` (default /api/v1)