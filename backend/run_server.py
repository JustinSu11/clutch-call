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
import logging
from flask import Flask, make_response, request
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
from app.routes import nfl, health, soccer, historical, nba

# === HVB/EPL MODEL IMPORT ===
try:
    from app.services.epl_prediction.predictor import build_model
    HVB_MODEL_ENABLED = True
    logging.info("Imported EPL model builder.")
except ImportError as e:
    logging.critical(f"❌ CRITICAL: Could not import EPL model builder. Error: {e}")
    HVB_MODEL_ENABLED = False
# ==================================

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

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
        if request.method == "OPTIONS":
            res = make_response()
            # Add necessary CORS headers manually just in case
            res.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            res.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers', '*')) # Allow requested headers
            res.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method', 'GET, OPTIONS')) # Allow requested method
            res.headers.add('Access-Control-Allow-Credentials', 'true')
            return res # Send the response immediately
    # --- END ADDITION ---

    # === EPL MODEL LOADING ===
    if HVB_MODEL_ENABLED:
        try:
            logging.info("Loading EPL Predictor Model... (This may take 10-20 seconds)")
            app.epl_predictor = build_model()
            app.epl_model_loaded = True
            logging.info("✅ EPL Predictor Model loaded successfully.")
        except Exception as e:
            # Note: Set your FOOTBALL_DATA_API_KEY environment variable!
            logging.critical(f"❌ CRITICAL: EPL Predictor 'build_model()' failed. API key set? Error: {e}")
            app.epl_predictor = None
            app.epl_model_loaded = False
    else:
        logging.warning("EPL model imports failed. EPL routes will be disabled.")
        app.epl_predictor = None
        app.epl_model_loaded = False
    # ================================

    api_prefix = os.getenv("API_PREFIX", "/api/v1")
    app.register_blueprint(nfl.bp, url_prefix=f"{api_prefix}/nfl")
    app.register_blueprint(health.bp, url_prefix=f"{api_prefix}/health")
    app.register_blueprint(soccer.bp, url_prefix=f"{api_prefix}/soccer")
    app.register_blueprint(historical.bp, url_prefix=f"{api_prefix}/historical")
    app.register_blueprint(nba.bp, url_prefix=f"{api_prefix}/nba") 

    @app.get("/")
    def index():
        return {"status": "ok", "message": "Welcome to the True Sense API!"}
    return app

# --- ASGI Wrapper ---
asgi_app = WsgiToAsgi(create_app())

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    
    logging.info(f"Starting development server at http://{host}:{port}")
    uvicorn.run(
        "run_server:asgi_app",
        host=host,
        port=port,
        reload=False  # <-- Keep this false to prevent import errors
    )
