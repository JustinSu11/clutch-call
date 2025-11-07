"""Compatibility wrapper for the legacy NBA ML training pipeline module.

The full implementation now lives in ``nba_ml.training_pipeline``. This file
is retained so historical import paths do not break immediately.
"""

from warnings import warn

from nba_ml.training_pipeline import NBAMLPipeline, main

warn(
    "`nba_ml_training_pipeline` is deprecated. Use `nba_ml.training_pipeline`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBAMLPipeline", "main"]


if __name__ == "__main__":
    main()