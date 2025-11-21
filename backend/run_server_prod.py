import os
import uvicorn


def main():
    """Entry point for starting the Uvicorn server programmatically."""
    # Import the ASGI app directly for Render compatibility
    from asgi import app
    
    # This is the crucial change for Render
    host = os.getenv("HOST", "0.0.0.0")
    
    # This will use the PORT environment variable Render provides
    port = int(os.getenv("PORT", "8000"))
    
    # Removed reload=True for production
    # Pass the app object directly instead of using string reference
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()