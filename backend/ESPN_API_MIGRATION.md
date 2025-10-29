# ESPN API Migration for NBA Predictions

## Overview

The NBA prediction system has been migrated from using `nba_api` to ESPN's public API for all prediction-related data collection and machine learning. This provides more reliable and consistent data access while maintaining backward compatibility for frontend endpoints.

## Architecture Changes

### Before

```
NBA Predictions System
├── nba_ml_data_collector.py (nba_api)
├── nba_ml_prediction_service.py (nba_api)
└── app/services/nba_service.py (nba_api)
```

### After

```
NBA Predictions System
├── nba_ml_espn_data_collector.py (ESPN API) ← NEW
├── nba_ml_data_collector.py (ESPN API wrapper)
├── nba_ml_prediction_service.py (uses ESPN data)
└── app/services/nba_service.py (nba_api) ← UNCHANGED
```

## Files Modified

### 1. **nba_ml_espn_data_collector.py** (NEW)
- Comprehensive ESPN API client for NBA data
- Collects games, teams, player stats, and box scores
- Provides same interface as original collector
- Handles rate limiting and error handling

Key features:
- `get_teams_info()`: Collect team information
- `get_games_for_date_range()`: Collect games for date range
- `get_detailed_game_data()`: Get box scores and detailed stats
- `collect_historical_data()`: Bulk historical data collection
- `get_upcoming_games()`: Get future games for predictions

### 2. **nba_ml_data_collector.py** (MODIFIED)
- Now acts as a wrapper around ESPN collector
- Maintains original interface for backward compatibility
- Delegates all data collection to ESPN API
- No changes needed in dependent code

### 3. **nba_ml_prediction_service.py** (MINIMAL CHANGES)
- Added comment clarifying nba_api is only fallback for rosters
- Main prediction logic unchanged
- Uses ESPN-sourced data through data collector

### 4. **requirements.txt** (UPDATED)
- Updated comments to clarify nba_api usage
- nba_api: Only for non-prediction frontend endpoints
- requests: Now explicitly used for ESPN API

### 5. **nba_ml_main.py** (UPDATED)
- Updated documentation to reflect ESPN API
- Requirements file generation updated

### 6. **README.md** (UPDATED)
- Added ESPN API migration documentation
- Clarified dual-API architecture
- Updated system architecture section

## API Endpoints Used

### ESPN NBA API
```
Base URL: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/

Endpoints:
- /scoreboard?dates=YYYYMMDD          # Get games for date
- /summary?event={game_id}            # Get game details/box score
- /teams                              # Get all teams
```

### Data Collection Flow

```
1. Historical Data Collection
   ├── ESPN Scoreboard API (date range)
   ├── Parse games with teams, scores, dates
   └── Generate aggregated team statistics

2. Detailed Game Data
   ├── ESPN Summary API (per game)
   ├── Extract box scores
   └── Parse player and team statistics

3. Upcoming Games
   ├── ESPN Scoreboard API (future dates)
   └── Return games for prediction
```

## Backward Compatibility

### Maintained Interfaces
- `NBADataCollector` class maintains same method signatures
- Training pipeline (`nba_ml_training_pipeline.py`) works unchanged
- Prediction service (`nba_ml_prediction_service.py`) works unchanged
- Model files and preprocessors remain compatible

### What's Preserved
- ✅ All method names and parameters
- ✅ Return data structures (pandas DataFrames)
- ✅ File storage paths and formats
- ✅ Model training and prediction workflows

### What Changed
- ✅ Data source: nba_api → ESPN API (for predictions only)
- ✅ Internal data collection logic
- ✅ API rate limiting approach
- ✅ Team/player IDs may differ (ESPN vs NBA.com)

## Frontend Endpoints (Unchanged)

The following endpoints in `app/services/nba_service.py` continue to use `nba_api` and are **not affected** by this migration:

- `GET /api/v1/nba/games` - List games
- `GET /api/v1/nba/game/{game_id}` - Get game details
- `GET /api/v1/nba/game/{game_id}/boxscore` - Get box score
- `GET /api/v1/nba/teams/{team_id}/last` - Get team's recent games
- `GET /api/v1/nba/upcoming` - Get upcoming games

These remain unchanged to avoid disrupting frontend functionality.

## Testing

### Basic Import Test
```python
from nba_ml_espn_data_collector import ESPNNBADataCollector
from nba_ml_data_collector import NBADataCollector
from nba_ml_prediction_service import NBAMLPredictor

# All should import successfully
collector = ESPNNBADataCollector()
wrapper = NBADataCollector()
predictor = NBAMLPredictor()
```

### Data Collection Test
```python
collector = ESPNNBADataCollector()

# Test team collection
teams = collector.get_teams_info()
print(f"Collected {len(teams)} teams")

# Test upcoming games
upcoming = collector.get_upcoming_games(days_ahead=7)
print(f"Found {len(upcoming)} upcoming games")
```

### Full System Test
```bash
# Check system status
python nba_ml_main.py --status

# Collect data and train (when ESP endpoints accessible)
python nba_ml_main.py --train --force-retrain --seasons 2023-24

# Generate predictions
python nba_ml_main.py --predict --days-ahead 7
```

## Known Limitations

1. **ESPN API Access**: ESPN's public API may have rate limits or availability constraints
2. **Team IDs**: ESPN team IDs differ from NBA.com IDs - mapping may be needed
3. **Player Stats**: ESPN API doesn't provide season-aggregated player stats like nba_api
4. **Historical Data**: Detailed historical data requires per-game collection (slower)

## Rollback Plan

If issues arise, rollback is straightforward:

1. Revert `nba_ml_data_collector.py` to use nba_api directly
2. Remove `nba_ml_espn_data_collector.py`
3. Revert requirements.txt comment changes
4. Re-train models if data format changed

The git history preserves the original nba_api implementation.

## Future Enhancements

1. **Caching**: Add Redis/file caching for ESPN API responses
2. **Hybrid Approach**: Use both APIs and cross-validate data
3. **ID Mapping**: Create ESPN ↔ NBA.com team/player ID mapping
4. **Monitoring**: Add API health checks and fallback logic
5. **Player Stats**: Aggregate player stats from game-level data

## Migration Impact

### Positive
- ✅ More reliable public API (widely used by ESPN's website)
- ✅ Consistent with NFL/Soccer data sources
- ✅ No authentication required
- ✅ Better structured JSON responses

### Neutral
- ⚖️ Different data format requires transformation
- ⚖️ Rate limiting approach differs
- ⚖️ Team/player IDs use ESPN's schema

### Risks Mitigated
- ✅ Backward compatibility maintained through wrapper pattern
- ✅ Frontend endpoints unchanged
- ✅ Model training pipeline unchanged
- ✅ Can revert if needed

## Support

For questions or issues with the ESPN API migration:
1. Check ESPN API endpoints are accessible
2. Verify rate limits are respected (0.6s delay between calls)
3. Check logs for API errors
4. Review ESPN API response format if data parsing fails
