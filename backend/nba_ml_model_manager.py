"""Compatibility wrapper for the legacy NBA ML model manager module.

Import ``nba_ml.model_manager`` instead of this file in new code.
"""

from warnings import warn

from nba_ml.model_manager import NBAModelManager, main

warn(
    "`nba_ml_model_manager` is deprecated. Use `nba_ml.model_manager`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBAModelManager", "main"]


if __name__ == "__main__":
    main()
