import json
import csv

print("--- Processing raw season data into a training CSV... ---")

# Load the raw data we collected in Step 1
with open('nfl_season_2023.json', 'r') as f:
    season_data = json.load(f)

# Define the header for our new CSV file
header = ['HomeTeam', 'AwayTeam', 'HomeOffYards', 'HomeDefYards', 'AwayOffYards', 'AwayDefYards', 'HomeWin']

# Open the new CSV file to write to
with open('nfl_games.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header) # Write the header row

    # Loop through each game in the season data
    for event in season_data.get("events", []):
        competition = event.get("competitions", [{}])[0]
        competitors = competition.get("competitors", [])
        
        if len(competitors) != 2:
            continue

        home_team_data = next((c for c in competitors if c.get("homeAway") == "home"), None)
        away_team_data = next((c for c in competitors if c.get("homeAway") == "away"), None)

        if not home_team_data or not away_team_data:
            continue
            
        # Determine the winner
        home_win = 1 if home_team_data.get("winner") else 0

        # For this example, we'll use placeholder stats. A more advanced
        # version would look up the historical stats for each team at this point.
        home_off_yards, home_def_yards = (350.0, 320.0)
        away_off_yards, away_def_yards = (340.0, 330.0)

        # Write the processed row to our CSV
        writer.writerow([
            home_team_data["team"]["abbreviation"],
            away_team_data["team"]["abbreviation"],
            home_off_yards,
            home_def_yards,
            away_off_yards,
            away_def_yards,
            home_win
        ])

print("✅ nfl_games.csv created successfully.")