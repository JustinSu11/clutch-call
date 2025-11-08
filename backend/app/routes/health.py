"""
File: app/routes/health.py
Author: Maaz Haque
Purpose: Defines a minimal health-check endpoint to verify the backend is reachable
         and responding. Useful for uptime monitoring, readiness/liveness probes,
         and basic sanity checks during development.
"""

from flask import Blueprint, jsonify, request, make_response 
# --- END CHANGE ---

bp = Blueprint("health", __name__)

@bp.route("/", methods=["GET", "OPTIONS"], strict_slashes=False) 
def health_check():
    # Handle OPTIONS explicitly
    if request.method == 'OPTIONS': 
        response = make_response()
        # Add CORS headers
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
        
    # Handle GET request
    return jsonify({"status": "healthy"})