"""
Author: Harsh Vardhan Bhanot
Configuration module containing constants, API settings, and team aliases for EPL prediction system.
"""

from typing import Dict

BASE_URL = "https://api.football-data.org/v4"
SEASONS = [2023, 2024, 2025]
MIN_HISTORY_MATCHES = 5
REQUEST_TIMEOUT = 25

ELO_K = 20.0
ELO_HFA = 60.0
EWM_ALPHA = 0.3
ALIAS: Dict[str, str] = {
    "man city": "Manchester City FC",
    "manchester city": "Manchester City FC",
    "mancity": "Manchester City FC",
    "city": "Manchester City FC",
    "man utd": "Manchester United FC",
    "man united": "Manchester United FC",
    "manchester united": "Manchester United FC",
    "united": "Manchester United FC",
    "spurs": "Tottenham Hotspur FC",
    "tottenham": "Tottenham Hotspur FC",
    "tottenham hotspur": "Tottenham Hotspur FC",
    "wolves": "Wolverhampton Wanderers FC",
    "west ham": "West Ham United FC",
    "bournemouth": "AFC Bournemouth",
    "nottingham forest": "Nottingham Forest FC",
    "forest": "Nottingham Forest FC",
    "sheffield utd": "Sheffield United FC",
    "sheffield united": "Sheffield United FC",
    "newcastle": "Newcastle United FC",
    "brighton": "Brighton & Hove Albion FC",
    "palace": "Crystal Palace FC",
    "crystal palace": "Crystal Palace FC",
    "aston villa": "Aston Villa FC",
    "villa": "Aston Villa FC",
    "brentford": "Brentford FC",
    "chelsea": "Chelsea FC",
    "arsenal": "Arsenal FC",
    "liverpool": "Liverpool FC",
    "everton": "Everton FC",
    "fulham": "Fulham FC",
    "leicester": "Leicester City FC",
    "ipswich": "Ipswich Town FC",
    "southampton": "Southampton FC",
}