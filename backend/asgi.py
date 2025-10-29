"""
File: asgi.py
Author: Maaz Haque
Purpose: ASGI wrapper for the Flask app so it can be served by ASGI servers like
		 Uvicorn or Hypercorn. Converts the WSGI Flask app to an ASGI app using
		 asgiref's WsgiToAsgi adapter.
"""

import os
import logging
import threading
from asgiref.wsgi import WsgiToAsgi
from app import create_app

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the underlying Flask WSGI app via the application factory
flask_app = create_app()

# Wrap the WSGI app with an ASGI adapter so async servers can host it
app = WsgiToAsgi(flask_app)

# NBA ML Model Management: Ensure models exist on startup and schedule retraining
def initialize_nba_models():
    """Initialize NBA models on startup in a background thread"""
    try:
        logger.info("Initializing NBA ML models...")
        
        # Import model manager and scheduler
        from nba_ml_model_manager import ensure_models_on_startup
        from nba_ml_scheduler import start_model_retraining_scheduler
        
        # Data directory for models
        data_dir = os.path.join(os.path.dirname(__file__), 'nba_ml_data')
        
        # Ensure models exist (train if necessary)
        models_ready = ensure_models_on_startup(data_dir)
        
        if models_ready:
            logger.info("✅ NBA ML models are ready")
        else:
            logger.warning("⚠️  NBA ML models initialization had issues, but server will continue")
        
        # Start the scheduler for daily retraining at 4am CT
        start_model_retraining_scheduler(data_dir)
        
    except Exception as e:
        logger.error(f"❌ Error initializing NBA models: {e}")
        logger.error("Server will continue without NBA ML models")

# Run model initialization in a background thread to not block server startup
model_init_thread = threading.Thread(target=initialize_nba_models, daemon=True)
model_init_thread.start()
logger.info("🚀 NBA ML model initialization started in background")
