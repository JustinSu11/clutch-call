"""
File: run_server.py
Author: Aron Rios
Purpose: Creates the Flask application, registers blueprints, and runs the
         development server. Execute `python run_server.py` after installing
         requirements to start the server.

Environment variables:
 HOST (default 127.0.0.1)
 PORT (default 8000)
 API_PREFIX (default /api/v1)
 CORS_ORIGINS (default *)
"""

import os
from flask import Flask
from flask_cors import CORS

# --- UPDATE START ---
# Import all your sport blueprints
from app.routes import nba, nfl, soccer, today, health
# --- UPDATE END ---

def create_app():
    """Application factory to create and configure the Flask app."""
    app = Flask(__name__)

    # 1. Configure CORS
    # Reads allowed origins from env var, splitting by comma if needed
    origins = os.getenv("CORS_ORIGINS", "*").split(",")
    CORS(app, origins=origins)

    # 2. Register your blueprints
    api_prefix = os.getenv("API_PREFIX", "/api/v1")
    
    # Register each blueprint with its own URL prefix
    app.register_blueprint(nba.bp, url_prefix=f"{api_prefix}/nba")
    app.register_blueprint(nfl.bp, url_prefix=f"{api_prefix}/nfl")
    app.register_blueprint(soccer.bp, url_prefix=f"{api_prefix}/soccer")
    app.register_blueprint(today.bp, url_prefix=f"{api_prefix}/today")
    app.register_blueprint(health.bp, url_prefix=f"{api_prefix}/health")
    

    # A simple root endpoint to verify the app is running
    @app.get("/")
    def index():
        return {"status": "ok", "message": "Welcome to the True Sense API!"}

    return app


if __name__ == "__main__":
    app = create_app()
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    # debug=True enables auto-reloading when you save changes
    app.run(host=host, port=port, debug=True)