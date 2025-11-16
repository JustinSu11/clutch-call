"""
File: asgi.py
Author: Maaz Haque
Purpose: ASGI wrapper for the Flask app so it can be served by ASGI servers like
         Uvicorn or Hypercorn. Converts the WSGI Flask app to an ASGI app using
         asgiref's WsgiToAsgi adapter.
"""

import os
import logging
from asgiref.wsgi import WsgiToAsgi
from app import create_app

BACKEND_ROOT = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_ROOT, ".."))

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

logger.info("🚀 Server started successfully")
