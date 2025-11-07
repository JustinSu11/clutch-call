"""Compatibility wrapper for the legacy NBA ML preprocessor module.

Use `nba_ml.preprocessor` in new code.
"""

from warnings import warn

from nba_ml.preprocessor import NBADataPreprocessor, main

warn(
    "`nba_ml_preprocessor` is deprecated. Use `nba_ml.preprocessor`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBADataPreprocessor", "main"]


if __name__ == "__main__":
    main()
