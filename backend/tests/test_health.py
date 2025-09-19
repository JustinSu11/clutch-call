"""
File: tests/test_health.py
Author: Maaz Haque
Purpose: Smoke test for the health endpoint.
"""

import os
import sys

# Ensure this script can import utils whether run from repo root or tests folder
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from utils import get_json


def main():
    print("[INFO] Testing: GET /health")
    data = get_json("/health")
    assert isinstance(data, dict), "Expected dict JSON"
    assert data.get("status") == "healthy", "Health status mismatch"
    print("[PASS] /health")
    with open("health_check_output.json", "w") as f:
        import json

        json.dump(data, f, indent=2)


if __name__ == "__main__":
    main()
