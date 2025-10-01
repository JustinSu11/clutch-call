"""
File: run_server.py
Author: Maaz Haque
Purpose: Convenience launcher to run the backend using Uvicorn without typing
         command-line arguments. Execute `python run_server.py` after installing
         requirements to start the server.

Environment variables:
  HOST (default 127.0.0.1)
  PORT (default 8000)
  API_PREFIX (default /api/v1)
  CORS_ORIGINS (default *)
"""
import os
import uvicorn


def main():
    """Entry point for starting the Uvicorn server programmatically."""
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    # Import here so env config applies to app factory
    uvicorn.run("asgi:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    main()
