"""Compatibility wrapper for the legacy NBA ML scheduler module.

Use ``nba_ml.scheduler`` going forward.
"""

from warnings import warn

from nba_ml.scheduler import NBAMLScheduler, main

warn(
    "`nba_ml_scheduler` is deprecated. Use `nba_ml.scheduler`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBAMLScheduler", "main"]


if __name__ == "__main__":
    main()
