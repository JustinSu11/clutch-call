"""Compatibility wrapper for the legacy NBA ML prediction cache module.

Use ``nba_ml.prediction_cache`` instead.
"""

from warnings import warn

from nba_ml.prediction_cache import NBAMLPredictionCache, main

warn(
    "`nba_ml_prediction_cache` is deprecated. Use `nba_ml.prediction_cache`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBAMLPredictionCache", "main"]


if __name__ == "__main__":
    main()
