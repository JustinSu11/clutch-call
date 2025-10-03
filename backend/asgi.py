"""
File: asgi.py
Author: Maaz Haque
Purpose: ASGI wrapper for the Flask app so it can be served by ASGI servers like
		 Uvicorn or Hypercorn. Converts the WSGI Flask app to an ASGI app using
		 asgiref's WsgiToAsgi adapter.
"""

from asgiref.wsgi import WsgiToAsgi
from app import create_app

# Create the underlying Flask WSGI app via the application factory
flask_app = create_app()

# Wrap the WSGI app with an ASGI adapter so async servers can host it
app = WsgiToAsgi(flask_app)
