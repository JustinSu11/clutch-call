"""
File: tests/run_all_tests.py
Author: Maaz Haque
Purpose: Minimal test runner that executes each smoke test script sequentially.
"""

import importlib
import os
import sys


# Ensure tests package is importable regardless of working directory
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def run(module_name: str) -> bool:
    try:
        mod = importlib.import_module(module_name)
        if hasattr(mod, "main"):
            mod.main()
        return True
    except Exception as e:
        print(f"[FAIL] {module_name}: {e}")
        return False


def main():
    modules = [
        "tests.test_health",
        "tests.test_nba",
        "tests.test_nfl",
        "tests.test_soccer",
    ]
    ok = True
    for m in modules:
        print(f"\n=== Running {m} ===")
        ok = run(m) and ok
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
