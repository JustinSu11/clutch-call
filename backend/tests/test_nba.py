"""
File: tests/test_nba.py
Author: Maaz Haque
Purpose: Smoke tests for NBA endpoints using the public balldontlie API via our service.
"""

import os
import sys

# Ensure this script can import utils whether run from repo root or tests folder
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from utils import get_json


def main():
    print("[INFO] Testing: GET /nba/games")
    # List games (no filters)
    data = get_json("/nba/games")
    assert isinstance(data, dict) and "data" in data, "Expected paginated games response"
    print("[PASS] /nba/games")

    print("[INFO] Testing: GET /nba/upcoming")
    # Upcoming games
    up = get_json("/nba/upcoming")
    assert isinstance(up, dict) and "data" in up, "Expected upcoming games with data array"
    print("[PASS] /nba/upcoming")

    # If there is at least one game in the list, test game by id and boxscore
    games = data.get("data", [])
    if games:
        gid = games[0].get("id")
        if gid is not None:
            print(f"[INFO] Testing: GET /nba/game/{gid}")
            g = get_json(f"/nba/game/{gid}")
            assert isinstance(g, dict) and g.get("id") == gid, "Expected specific game payload"
            print("[PASS] /nba/game/{id}")

            print(f"[INFO] Testing: GET /nba/game/{gid}/boxscore")
            box = get_json(f"/nba/game/{gid}/boxscore")
            assert isinstance(box, dict) and "data" in box, "Expected stats list for boxscore"
            print("[PASS] /nba/game/{id}/boxscore")
    else:
        print("[SKIP] No games available to test game-by-id/boxscore")
    
    with open("nba_output.json", "w") as f:
        import json

        json.dump(games, f, indent=2)
        


if __name__ == "__main__":
    main()
