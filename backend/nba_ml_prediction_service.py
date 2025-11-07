"""Compatibility wrapper for the legacy NBA ML prediction service module.

This file remains so older import paths keep working. Prefer importing from
``nba_ml.prediction_service`` directly in new code.
"""

from warnings import warn

from nba_ml.prediction_service import NBAMLPredictor, main

warn(
    "`nba_ml_prediction_service` is deprecated. Use `nba_ml.prediction_service`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBAMLPredictor", "main"]


if __name__ == "__main__":
    main()