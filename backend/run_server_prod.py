"""
Production server entry point using Gunicorn with Uvicorn workers.

This script is designed for production deployments (e.g., Render) and uses
Gunicorn as the process manager with Uvicorn workers for better stability
and performance when serving ASGI applications.

Usage:
    python run_server_prod.py

Environment variables:
    HOST: Host to bind to (default: 0.0.0.0)
    PORT: Port to bind to (default: 8000)
    WORKERS: Number of worker processes (default: 4)
"""

import os
import sys
from gunicorn.app.base import BaseApplication


class StandaloneApplication(BaseApplication):
    """Custom Gunicorn application to run the ASGI app."""

    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        """Load configuration into Gunicorn."""
        config = {
            key: value for key, value in self.options.items()
            if key in self.cfg.settings and value is not None
        }
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        """Return the ASGI application."""
        return self.application


def main():
    """Entry point for starting the production server."""
    # Import the ASGI app
    from asgi import app
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "4"))
    
    # Gunicorn options optimized for ASGI with Uvicorn workers
    options = {
        "bind": f"{host}:{port}",
        "workers": workers,
        "worker_class": "uvicorn.workers.UvicornWorker",
        "timeout": 120,
        "keepalive": 5,
        "accesslog": "-",  # Log to stdout
        "errorlog": "-",   # Log to stderr
        "loglevel": "info",
    }
    
    print(f"Starting Gunicorn with {workers} Uvicorn workers on {host}:{port}")
    StandaloneApplication(app, options).run()


if __name__ == "__main__":
    main()