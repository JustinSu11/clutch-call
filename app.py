"""
Author: Harsh Vardhan Bhanot
Legacy entry point for EPL Match Rates API - imports from modular structure for backward compatibility.
"""

from main import app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)