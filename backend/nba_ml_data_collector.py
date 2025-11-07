"""Compatibility wrapper for the legacy NBA ML data collector module.

Use ``nba_ml.data_collector`` directly when writing new code.
"""

from warnings import warn

from nba_ml.data_collector import NBADataCollector, main

warn(
    "`nba_ml_data_collector` is deprecated. Use `nba_ml.data_collector`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["NBADataCollector", "main"]


if __name__ == "__main__":
    main()