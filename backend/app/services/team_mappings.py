"""
File: app/services/team_mappings.py
Author: Maaz Haque  
Purpose: Team ID mappings for NBA, NFL, and Soccer leagues to enable lookup by team name
         instead of requiring frontend to know team IDs.
"""

# NBA Team Mappings (30 teams)
NBA_TEAMS = {
    # Atlantic Division
    "boston_celtics": {"id": 1610612738, "name": "Boston Celtics", "abbreviation": "BOS", "city": "Boston"},
    "brooklyn_nets": {"id": 1610612751, "name": "Brooklyn Nets", "abbreviation": "BKN", "city": "Brooklyn"},
    "new_york_knicks": {"id": 1610612752, "name": "New York Knicks", "abbreviation": "NYK", "city": "New York"},
    "philadelphia_76ers": {"id": 1610612755, "name": "Philadelphia 76ers", "abbreviation": "PHI", "city": "Philadelphia"},
    "toronto_raptors": {"id": 1610612761, "name": "Toronto Raptors", "abbreviation": "TOR", "city": "Toronto"},
    
    # Central Division
    "chicago_bulls": {"id": 1610612741, "name": "Chicago Bulls", "abbreviation": "CHI", "city": "Chicago"},
    "cleveland_cavaliers": {"id": 1610612739, "name": "Cleveland Cavaliers", "abbreviation": "CLE", "city": "Cleveland"},
    "detroit_pistons": {"id": 1610612765, "name": "Detroit Pistons", "abbreviation": "DET", "city": "Detroit"},
    "indiana_pacers": {"id": 1610612754, "name": "Indiana Pacers", "abbreviation": "IND", "city": "Indianapolis"},
    "milwaukee_bucks": {"id": 1610612749, "name": "Milwaukee Bucks", "abbreviation": "MIL", "city": "Milwaukee"},
    
    # Southeast Division
    "atlanta_hawks": {"id": 1610612737, "name": "Atlanta Hawks", "abbreviation": "ATL", "city": "Atlanta"},
    "charlotte_hornets": {"id": 1610612766, "name": "Charlotte Hornets", "abbreviation": "CHA", "city": "Charlotte"},
    "miami_heat": {"id": 1610612748, "name": "Miami Heat", "abbreviation": "MIA", "city": "Miami"},
    "orlando_magic": {"id": 1610612753, "name": "Orlando Magic", "abbreviation": "ORL", "city": "Orlando"},
    "washington_wizards": {"id": 1610612764, "name": "Washington Wizards", "abbreviation": "WAS", "city": "Washington"},
    
    # Northwest Division
    "denver_nuggets": {"id": 1610612743, "name": "Denver Nuggets", "abbreviation": "DEN", "city": "Denver"},
    "minnesota_timberwolves": {"id": 1610612750, "name": "Minnesota Timberwolves", "abbreviation": "MIN", "city": "Minneapolis"},
    "oklahoma_city_thunder": {"id": 1610612760, "name": "Oklahoma City Thunder", "abbreviation": "OKC", "city": "Oklahoma City"},
    "portland_trail_blazers": {"id": 1610612757, "name": "Portland Trail Blazers", "abbreviation": "POR", "city": "Portland"},
    "utah_jazz": {"id": 1610612762, "name": "Utah Jazz", "abbreviation": "UTA", "city": "Salt Lake City"},
    
    # Pacific Division
    "golden_state_warriors": {"id": 1610612744, "name": "Golden State Warriors", "abbreviation": "GSW", "city": "San Francisco"},
    "los_angeles_clippers": {"id": 1610612746, "name": "Los Angeles Clippers", "abbreviation": "LAC", "city": "Los Angeles"},
    "los_angeles_lakers": {"id": 1610612747, "name": "Los Angeles Lakers", "abbreviation": "LAL", "city": "Los Angeles"},
    "phoenix_suns": {"id": 1610612756, "name": "Phoenix Suns", "abbreviation": "PHX", "city": "Phoenix"},
    "sacramento_kings": {"id": 1610612758, "name": "Sacramento Kings", "abbreviation": "SAC", "city": "Sacramento"},
    
    # Southwest Division
    "dallas_mavericks": {"id": 1610612742, "name": "Dallas Mavericks", "abbreviation": "DAL", "city": "Dallas"},
    "houston_rockets": {"id": 1610612745, "name": "Houston Rockets", "abbreviation": "HOU", "city": "Houston"},
    "memphis_grizzlies": {"id": 1610612763, "name": "Memphis Grizzlies", "abbreviation": "MEM", "city": "Memphis"},
    "new_orleans_pelicans": {"id": 1610612740, "name": "New Orleans Pelicans", "abbreviation": "NOP", "city": "New Orleans"},
    "san_antonio_spurs": {"id": 1610612759, "name": "San Antonio Spurs", "abbreviation": "SAS", "city": "San Antonio"},
}

# NFL Team Mappings (32 teams) - ESPN API IDs
NFL_TEAMS = {
    # AFC East
    "buffalo_bills": {"id": "2", "name": "Buffalo Bills", "abbreviation": "BUF", "city": "Buffalo"},
    "miami_dolphins": {"id": "15", "name": "Miami Dolphins", "abbreviation": "MIA", "city": "Miami"},
    "new_england_patriots": {"id": "17", "name": "New England Patriots", "abbreviation": "NE", "city": "Foxborough"},
    "new_york_jets": {"id": "20", "name": "New York Jets", "abbreviation": "NYJ", "city": "East Rutherford"},
    
    # AFC North
    "baltimore_ravens": {"id": "33", "name": "Baltimore Ravens", "abbreviation": "BAL", "city": "Baltimore"},
    "cincinnati_bengals": {"id": "4", "name": "Cincinnati Bengals", "abbreviation": "CIN", "city": "Cincinnati"},
    "cleveland_browns": {"id": "5", "name": "Cleveland Browns", "abbreviation": "CLE", "city": "Cleveland"},
    "pittsburgh_steelers": {"id": "23", "name": "Pittsburgh Steelers", "abbreviation": "PIT", "city": "Pittsburgh"},
    
    # AFC South
    "houston_texans": {"id": "34", "name": "Houston Texans", "abbreviation": "HOU", "city": "Houston"},
    "indianapolis_colts": {"id": "11", "name": "Indianapolis Colts", "abbreviation": "IND", "city": "Indianapolis"},
    "jacksonville_jaguars": {"id": "30", "name": "Jacksonville Jaguars", "abbreviation": "JAX", "city": "Jacksonville"},
    "tennessee_titans": {"id": "10", "name": "Tennessee Titans", "abbreviation": "TEN", "city": "Nashville"},
    
    # AFC West
    "denver_broncos": {"id": "7", "name": "Denver Broncos", "abbreviation": "DEN", "city": "Denver"},
    "kansas_city_chiefs": {"id": "12", "name": "Kansas City Chiefs", "abbreviation": "KC", "city": "Kansas City"},
    "las_vegas_raiders": {"id": "13", "name": "Las Vegas Raiders", "abbreviation": "LV", "city": "Las Vegas"},
    "los_angeles_chargers": {"id": "24", "name": "Los Angeles Chargers", "abbreviation": "LAC", "city": "Los Angeles"},
    
    # NFC East
    "dallas_cowboys": {"id": "6", "name": "Dallas Cowboys", "abbreviation": "DAL", "city": "Arlington"},
    "new_york_giants": {"id": "19", "name": "New York Giants", "abbreviation": "NYG", "city": "East Rutherford"},
    "philadelphia_eagles": {"id": "21", "name": "Philadelphia Eagles", "abbreviation": "PHI", "city": "Philadelphia"},
    "washington_commanders": {"id": "28", "name": "Washington Commanders", "abbreviation": "WAS", "city": "Landover"},
    
    # NFC North
    "chicago_bears": {"id": "3", "name": "Chicago Bears", "abbreviation": "CHI", "city": "Chicago"},
    "detroit_lions": {"id": "8", "name": "Detroit Lions", "abbreviation": "DET", "city": "Detroit"},
    "green_bay_packers": {"id": "9", "name": "Green Bay Packers", "abbreviation": "GB", "city": "Green Bay"},
    "minnesota_vikings": {"id": "16", "name": "Minnesota Vikings", "abbreviation": "MIN", "city": "Minneapolis"},
    
    # NFC South
    "atlanta_falcons": {"id": "1", "name": "Atlanta Falcons", "abbreviation": "ATL", "city": "Atlanta"},
    "carolina_panthers": {"id": "29", "name": "Carolina Panthers", "abbreviation": "CAR", "city": "Charlotte"},
    "new_orleans_saints": {"id": "18", "name": "New Orleans Saints", "abbreviation": "NO", "city": "New Orleans"},
    "tampa_bay_buccaneers": {"id": "27", "name": "Tampa Bay Buccaneers", "abbreviation": "TB", "city": "Tampa"},
    
    # NFC West
    "arizona_cardinals": {"id": "22", "name": "Arizona Cardinals", "abbreviation": "ARI", "city": "Glendale"},
    "los_angeles_rams": {"id": "14", "name": "Los Angeles Rams", "abbreviation": "LAR", "city": "Los Angeles"},
    "san_francisco_49ers": {"id": "25", "name": "San Francisco 49ers", "abbreviation": "SF", "city": "San Francisco"},
    "seattle_seahawks": {"id": "26", "name": "Seattle Seahawks", "abbreviation": "SEA", "city": "Seattle"},
}

# Major Soccer League Mappings (MLS, EPL, LaLiga, etc.)
SOCCER_TEAMS = {
    # Major League Soccer (MLS) - ESPN API IDs
    "mls": {
        "atlanta_united": {"id": "659", "name": "Atlanta United FC", "abbreviation": "ATL", "city": "Atlanta"},
        "austin_fc": {"id": "12506", "name": "Austin FC", "abbreviation": "ATX", "city": "Austin"},
        "charlotte_fc": {"id": "12507", "name": "Charlotte FC", "abbreviation": "CLT", "city": "Charlotte"},
        "chicago_fire": {"id": "356", "name": "Chicago Fire FC", "abbreviation": "CHI", "city": "Chicago"},
        "fc_cincinnati": {"id": "2747", "name": "FC Cincinnati", "abbreviation": "CIN", "city": "Cincinnati"},
        "colorado_rapids": {"id": "387", "name": "Colorado Rapids", "abbreviation": "COL", "city": "Commerce City"},
        "columbus_crew": {"id": "368", "name": "Columbus Crew", "abbreviation": "CLB", "city": "Columbus"},
        "dc_united": {"id": "355", "name": "D.C. United", "abbreviation": "DC", "city": "Washington"},
        "fc_dallas": {"id": "370", "name": "FC Dallas", "abbreviation": "DAL", "city": "Frisco"},
        "houston_dynamo": {"id": "399", "name": "Houston Dynamo FC", "abbreviation": "HOU", "city": "Houston"},
        "inter_miami": {"id": "2708", "name": "Inter Miami CF", "abbreviation": "MIA", "city": "Fort Lauderdale"},
        "la_galaxy": {"id": "364", "name": "LA Galaxy", "abbreviation": "LA", "city": "Carson"},
        "lafc": {"id": "2271", "name": "Los Angeles FC", "abbreviation": "LAFC", "city": "Los Angeles"},
        "minnesota_united": {"id": "1947", "name": "Minnesota United FC", "abbreviation": "MIN", "city": "Saint Paul"},
        "montreal_impact": {"id": "1883", "name": "CF Montréal", "abbreviation": "MTL", "city": "Montreal"},
        "nashville_sc": {"id": "2282", "name": "Nashville SC", "abbreviation": "NSH", "city": "Nashville"},
        "new_england_revolution": {"id": "353", "name": "New England Revolution", "abbreviation": "NE", "city": "Foxborough"},
        "new_york_city_fc": {"id": "1872", "name": "New York City FC", "abbreviation": "NYC", "city": "New York"},
        "new_york_red_bulls": {"id": "352", "name": "New York Red Bulls", "abbreviation": "NY", "city": "Harrison"},
        "orlando_city": {"id": "1823", "name": "Orlando City SC", "abbreviation": "ORL", "city": "Orlando"},
        "philadelphia_union": {"id": "382", "name": "Philadelphia Union", "abbreviation": "PHI", "city": "Chester"},
        "portland_timbers": {"id": "388", "name": "Portland Timbers", "abbreviation": "POR", "city": "Portland"},
        "real_salt_lake": {"id": "377", "name": "Real Salt Lake", "abbreviation": "RSL", "city": "Sandy"},
        "san_jose_earthquakes": {"id": "396", "name": "San Jose Earthquakes", "abbreviation": "SJ", "city": "San Jose"},
        "seattle_sounders": {"id": "379", "name": "Seattle Sounders FC", "abbreviation": "SEA", "city": "Seattle"},
        "sporting_kansas_city": {"id": "376", "name": "Sporting Kansas City", "abbreviation": "SKC", "city": "Kansas City"},
        "st_louis_city": {"id": "12508", "name": "St. Louis City SC", "abbreviation": "STL", "city": "St. Louis"},
        "toronto_fc": {"id": "398", "name": "Toronto FC", "abbreviation": "TOR", "city": "Toronto"},
        "vancouver_whitecaps": {"id": "389", "name": "Vancouver Whitecaps FC", "abbreviation": "VAN", "city": "Vancouver"},
    }
}

def get_team_by_name(league: str, team_name: str):
    """
    Get team information by team name (case-insensitive).
    
    Args:
        league: 'nba', 'nfl', or 'soccer' (or specific soccer league like 'mls')
        team_name: Team name (can include spaces, case-insensitive)
    
    Returns:
        Team dictionary with id, name, abbreviation, city or None if not found
    """
    # Normalize the team name to match our keys
    normalized_name = team_name.lower().replace(" ", "_").replace(".", "").replace("'", "")
    
    if league.lower() == 'nba':
        return NBA_TEAMS.get(normalized_name)
    elif league.lower() == 'nfl':
        return NFL_TEAMS.get(normalized_name)
    elif league.lower() in ['soccer', 'mls']:
        return SOCCER_TEAMS.get('mls', {}).get(normalized_name)
    
    return None

def get_all_teams(league: str):
    """
    Get all teams for a specific league.
    
    Args:
        league: 'nba', 'nfl', or 'soccer'/'mls'
    
    Returns:
        Dictionary of all teams in the league
    """
    if league.lower() == 'nba':
        return NBA_TEAMS
    elif league.lower() == 'nfl':
        return NFL_TEAMS  
    elif league.lower() in ['soccer', 'mls']:
        return SOCCER_TEAMS.get('mls', {})
    
    return {}

def get_team_id(league: str, team_name: str):
    """
    Get team ID by team name.
    
    Args:
        league: 'nba', 'nfl', or 'soccer'/'mls'
        team_name: Team name
    
    Returns:
        Team ID as string or None if not found
    """
    team = get_team_by_name(league, team_name)
    return str(team["id"]) if team else None

def get_season_year():
    """
    Get the previous season year for historical data.
    For NBA: 2023-24 season
    For NFL: 2023 season  
    For Soccer: 2023 season
    
    Returns:
        Dictionary with season info for each league
    """
    from datetime import datetime
    current_year = datetime.now().year
    
    return {
        'nba': f"{current_year - 1}-{str(current_year)[-2:]}",  # e.g., "2024-25"
        'nfl': str(current_year - 1),  # e.g., "2024"
        'soccer': str(current_year - 1),  # e.g., "2024"
    }