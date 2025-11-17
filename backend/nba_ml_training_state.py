"""Compatibility wrapper for the legacy NBA ML training state helpers.

Import ``nba_ml.training_state`` directly for the maintained implementation.
"""

from warnings import warn

from nba_ml.training_state import (
    get_training_status,
    mark_training_complete,
    mark_training_failed,
    mark_training_start,
)

warn(
    "`nba_ml_training_state` is deprecated. Use `nba_ml.training_state`",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = [
    "get_training_status",
    "mark_training_complete",
    "mark_training_failed",
    "mark_training_start",
]
