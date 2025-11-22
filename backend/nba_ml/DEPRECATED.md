# DEPRECATED: NBA ML Module

**Status:** This module is deprecated and no longer used in the application.

## Background

This module previously contained a complex NBA prediction system with:
- CSV-based data collection and storage
- SQLite-based prediction caching
- Complex training pipelines
- Scheduled model retraining

## Current Status

The NBA prediction service has been simplified to match the NFL service pattern:
- Direct predictions using the NBA API
- Simple model loading with joblib
- No caching infrastructure
- No CSV file storage

## Migration

The NBA prediction logic is now located in:
- `backend/app/services/nba_service.py` - Simplified service with direct API calls
- `backend/app/routes/nba.py` - Simplified routes matching NFL pattern

## Files in This Directory

All files in this directory are deprecated and can be removed:
- `__init__.py` - Module initialization
- `data_collector.py` - CSV-based data collection
- `model_manager.py` - Model management utilities
- `prediction_cache.py` - SQLite caching system
- `prediction_service.py` - Complex prediction service
- `preprocessor.py` - Data preprocessing utilities
- `scheduler.py` - Scheduled retraining
- `training_pipeline.py` - Training pipeline
- `training_state.py` - Training state management

## Related Deprecated Files

Other deprecated files that can be removed:
- `backend/nba_ml_*.py` - Legacy ML module files in backend root
- `nba_ml_data/` - Data directory (now in .gitignore)

---

For the current NBA prediction implementation, see `backend/app/services/nba_service.py`.
