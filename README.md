# Clutch Call
Clutch Call is a student built website that uses AI to determine the best players and teams in their leagues using sports statistics.
The project is built using python and react.

# Backend Server Setup

## Steps

```bash
# Move into backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Linux/macOS
source venv/bin/activate
# Windows CMD
venv\Scripts\activate
# Windows PowerShell
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Set API key
# Linux/macOS
export FOOTBALL_DATA_API_KEY="1411541d70b844749154f102e4d18a99"
# Windows CMD
set FOOTBALL_DATA_API_KEY="1411541d70b844749154f102e4d18a99"
# Windows PowerShell
$env:FOOTBALL_DATA_API_KEY="1411541d70b844749154f102e4d18a99"

# Start server
python run_server.py
