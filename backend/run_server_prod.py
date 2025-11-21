import os
import uvicorn
# Import the ASGI app directly for Render compatibility
from asgi import app


def main():
    """Entry point for starting the Uvicorn server programmatically."""
    # Bind to 0.0.0.0 to accept external connections (required for Render)
    host = os.getenv("HOST", "0.0.0.0")
    
    # Use the PORT environment variable that Render provides
    port = int(os.getenv("PORT", "8000"))
    
    # Pass the app object directly instead of using string reference
    # This ensures compatibility with Render's deployment environment
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()