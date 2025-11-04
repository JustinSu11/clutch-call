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
from flask import Flask, make_response # Import make_response
from flask_cors import CORS

from app.routes import nfl, health, soccer, historical 

def create_app():
    app = Flask(__name__)

    # Apply robust CORS configuration 
    CORS(app, 
         origins=["http://localhost:3000"], 
         methods=["GET", "POST", "OPTIONS"], 
         # allow_headers=["Content-Type", "Authorization"], # Keep headers open for now
         supports_credentials=True, 
         automatic_options=True 
    )

    # --- ADD THIS BEFORE BLUEPRINTS ---
    # Attempt to handle OPTIONS requests globally if CORS doesn't catch them
    @app.before_request
    def handle_preflight():
        # Check if it's an OPTIONS request
        from flask import request # Import request here
        if request.method == "OPTIONS":
            res = make_response()
            # Add necessary CORS headers manually just in case
            res.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            res.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers', '*')) # Allow requested headers
            res.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method', 'GET, OPTIONS')) # Allow requested method
            res.headers.add('Access-Control-Allow-Credentials', 'true')
            return res # Send the response immediately
    # --- END ADDITION ---

    api_prefix = os.getenv("API_PREFIX", "/api/v1")
    app.register_blueprint(nfl.bp, url_prefix=f"{api_prefix}/nfl")
    app.register_blueprint(health.bp, url_prefix=f"{api_prefix}/health")
    app.register_blueprint(soccer.bp, url_prefix=f"{api_prefix}/soccer")
    app.register_blueprint(historical.bp, url_prefix=f"{api_prefix}/historical") 

    @app.get("/")
    def index():
        return {"status": "ok", "message": "Welcome to the True Sense API!"}
    return app

if __name__ == "__main__":
    app = create_app()
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    app.run(host=host, port=port, debug=True)