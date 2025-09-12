"""
File: tests/test_soccer.py
Author: Maaz Haque
Purpose: Smoke tests for Soccer endpoints (default MLS).
"""

import os
import sys

# Ensure this script can import utils whether run from repo root or tests folder
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from utils import get_json


def main():
    print("[INFO] Testing: GET /soccer/games")
    # Scoreboard list for default MLS
    data = get_json("/soccer/games")
    assert isinstance(data, dict), "Expected dict JSON"
    print("[PASS] /soccer/games")

    print("[INFO] Testing: GET /soccer/upcoming")
    # Upcoming
    up = get_json("/soccer/upcoming")
    assert isinstance(up, dict), "Expected dict JSON"
    print("[PASS] /soccer/upcoming")

    # Try to locate an event id for deeper tests if available
    events = (data.get("events") or []) if isinstance(data, dict) else []
    if events:
        event_id = events[0].get("id")
        if event_id:
            print(f"[INFO] Testing: GET /soccer/game/{event_id}")
            g = get_json(f"/soccer/game/{event_id}")
            assert isinstance(g, dict), "Expected dict JSON for event"
            print("[PASS] /soccer/game/{event_id}")

            print(f"[INFO] Testing: GET /soccer/game/{event_id}/boxscore")
            box = get_json(f"/soccer/game/{event_id}/boxscore")
            assert isinstance(box, dict) and "eventId" in box, "Expected boxscore wrapper"
            print("[PASS] /soccer/game/{event_id}/boxscore")
    else:
        print("[SKIP] No events available to test game-by-id/boxscore")


if __name__ == "__main__":
    main()
