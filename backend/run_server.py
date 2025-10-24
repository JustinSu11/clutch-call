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
from app.routes import nfl, health # Ensure health is imported

def create_app():
    app = Flask(__name__)

    # Apply robust CORS configuration
    CORS(app,
         origins=["http://localhost:3000"],
         methods=["GET", "POST", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True,
         automatic_options=True
    )

    api_prefix = os.getenv("API_PREFIX", "/api/v1")

    # Register both blueprints
    app.register_blueprint(nfl.bp, url_prefix=f"{api_prefix}/nfl")
    # This registration should correctly map "/" within the blueprint to "/api/v1/health"
    app.register_blueprint(health.bp, url_prefix=f"{api_prefix}/health")

    @app.get("/")
    def index():
        return {"status": "ok", "message": "Welcome to the True Sense API!"}
    return app

if __name__ == "__main__":
    app = create_app()
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    app.run(host=host, port=port, debug=True)