import os
import uvicorn


def main():
    """Entry point for starting the Uvicorn server programmatically."""
    # This is the crucial change for Render
    host = os.getenv("HOST", "0.0.0.0")
    
    # This will use the PORT environment variable Render provides
    port = int(os.getenv("PORT", "8000"))
    
    # Removed reload=True for production
    uvicorn.run("asgi:app", host=host, port=port)


if __name__ == "__main__":
    main()