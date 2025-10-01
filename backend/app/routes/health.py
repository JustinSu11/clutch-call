"""
File: app/routes/health.py
Author: Maaz Haque
Purpose: Defines a minimal health-check endpoint to verify the backend is reachable
         and responding. Useful for uptime monitoring, readiness/liveness probes,
         and basic sanity checks during development.
"""

from flask import Blueprint

# Create a blueprint for health endpoints. This blueprint is mounted under the
# global API prefix (e.g., /api/v1/health) by the application factory.
bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    """Return a simple JSON payload indicating service health."""
    return {"status": "healthy"}
