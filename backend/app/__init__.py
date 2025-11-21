"""
File: app/__init__.py
Author: Maaz Haque
Purpose: Flask application factory. This module creates and configures the Flask app,
         sets up CORS, registers all API blueprints (health, NBA, NFL, Soccer),
         and adds simple JSON error handlers. All routes are served under a
         configurable API prefix (default: /api/v1).
"""

import os
from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    """Create and configure the Flask application instance.

    Returns:
        Flask: A configured Flask app with CORS and blueprints registered.
    """
    app = Flask(__name__)

    # Basic config
    # Disable alphabetical sorting of JSON keys to preserve semantic order in responses
    app.config.setdefault("JSON_SORT_KEYS", False)
    # Allow overriding the API base path via environment variable
    app.config.setdefault("API_PREFIX", os.getenv("API_PREFIX", "/api/v1"))

    # CORS: allow local frontend dev by default
    # The CORS_ORIGINS env var (comma-separated or *) controls which origins can call the API.
    # For development, defaults to * to simplify cross-origin calls.
    CORS(app, resources={
        r"/*": {
            "origins": os.getenv("CORS_ORIGINS", "*"),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints under API prefix
    # Import here (inside the factory) to avoid circular imports when app is created
    from .routes.health import bp as health_bp
    from .routes.nba import bp as nba_bp
    from .routes.nfl import bp as nfl_bp
    from .routes.soccer import bp as soccer_bp
    from .routes.today import bp as today_bp
    from .routes.weekly import bp as weekly_bp
    from .routes.live import bp as live_bp
    from .routes.historical import bp as historical_bp

    prefix = app.config["API_PREFIX"]
    # Mount each blueprint under the desired subpath
    app.register_blueprint(health_bp, url_prefix=f"{prefix}/health")
    app.register_blueprint(nba_bp, url_prefix=f"{prefix}/nba")
    app.register_blueprint(nfl_bp, url_prefix=f"{prefix}/nfl")
    app.register_blueprint(soccer_bp, url_prefix=f"{prefix}/soccer")
    app.register_blueprint(today_bp, url_prefix=f"{prefix}/today")
    app.register_blueprint(weekly_bp, url_prefix=f"{prefix}/weekly")
    app.register_blueprint(live_bp, url_prefix=f"{prefix}/live")
    app.register_blueprint(historical_bp, url_prefix=f"{prefix}/historical")

    # Error handlers for consistent JSON responses
    @app.errorhandler(404)
    def _not_found(e):
        # Return a simple and consistent JSON payload for missing resources
        return {"error": "not_found", "message": str(e)}, 404

    @app.errorhandler(500)
    def _server_error(e):
        # Do not leak stack traces here; keep responses minimal and consistent
        return {"error": "server_error", "message": str(e)}, 500

    @app.get("/")
    def _root():
        """Simple root endpoint to enumerate key routes and confirm the app is running."""
        return {
            "name": "Clutch Call Backend - Sports Statistics",
            "status": "ok",
            "prefix": prefix,
            "routes": [
                f"{prefix}/health",
                f"{prefix}/today",
                f"{prefix}/weekly",
                f"{prefix}/live",
                f"{prefix}/historical",
                f"{prefix}/nba/games",
                f"{prefix}/nba/game/<game_id>",
                f"{prefix}/nba/game/<game_id>/boxscore",
                f"{prefix}/nba/teams/<team_id>/last",
                f"{prefix}/nba/upcoming",
                f"{prefix}/nfl/games",
                f"{prefix}/nfl/game/<event_id>",
                f"{prefix}/nfl/game/<event_id>/boxscore",
                f"{prefix}/nfl/upcoming",
                f"{prefix}/soccer/games",
                f"{prefix}/soccer/game/<event_id>",
                f"{prefix}/soccer/game/<event_id>/boxscore",
                f"{prefix}/soccer/upcoming",
            ],
            "stats_features": [
                "Daily games with comprehensive statistics",
                "Weekly upcoming games analysis",
                "Live games with real-time updates",
                "Historical data for statistical analysis"
            ]
        }

    return app
