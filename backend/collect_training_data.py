import json
from app.services import nfl_service

def gather_season_data(season_year: int):
    """Fetches all game data for a given season and saves it to a JSON file."""
    print(f"--- Fetching game data for the {season_year} season... ---")
    
    # Use your existing service function to get all games for a past season
    # Note: ESPN's `dates` parameter can accept a year
    season_games = nfl_service.get_games(season=season_year)
    
    # Save the raw data to a file
    filename = f"nfl_season_{season_year}.json"
    with open(filename, "w") as f:
        json.dump(season_games, f, indent=4)
        
    print(f" Data saved successfully to {filename}")
    return filename

if __name__ == "__main__":
    # You can change the year to get data from different seasons
    gather_season_data(2023)