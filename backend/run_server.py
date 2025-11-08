"""
File: run_server.py
Purpose: Main entry point for starting the Flask server (dev).
"""
import logging
from flask import Flask
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi

# --- Route Imports ---
# This is the line that is failing.
# If you have your __init__.py files in place, this should work
# when run from the 'backend' directory.
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

# --- App Creation ---
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Model Loading ---

# 1. Load NFL Model (Original)
logging.info("✅ NFL model will be loaded by its route.")

# === 2. LOAD EPL MODEL (NEW) ===
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

# --- Blueprint Registration ---
app.register_blueprint(nfl.bp, url_prefix="/api/v1/nfl")
app.register_blueprint(health.bp, url_prefix="/api/v1/health")
app.register_blueprint(soccer.bp, url_prefix="/api/v1/soccer")
app.register_blueprint(historical.bp, url_prefix="/api/v1/historical")
app.register_blueprint(nba.bp, url_prefix="/api/v1/nba")

# --- ASGI Wrapper ---
asgi_app = WsgiToAsgi(app)

if __name__ == "__main__":
    import uvicorn
    logging.info("Starting development server at http://127.0.0.1:8000")
    uvicorn.run(
        "run_server:asgi_app",
        host="127.0.0.1",
        port=8000,
        reload=False  # <-- Keep this false to prevent import errors
    )