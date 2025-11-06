"""
NBA ML Prediction Cache
SQLite-based caching system for NBA predictions to avoid re-computation
"""

import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os

logger = logging.getLogger(__name__)

class NBAMLPredictionCache:
    """SQLite-based cache for NBA ML predictions"""
    
    def __init__(self, db_path: str = "nba_ml_data/predictions_cache.db"):
        """Initialize the prediction cache"""
        self.db_path = db_path
        self.cache_duration = timedelta(hours=1)  # Cache valid for 1 hour
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize database
        self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create game predictions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS game_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                prediction_date TEXT NOT NULL,
                days_ahead INTEGER NOT NULL,
                predictions_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        """)
        
        # Create indices for faster lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_cache_key ON game_predictions(cache_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_expires ON game_predictions(expires_at)")
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Prediction cache database initialized at {self.db_path}")
    
    def _generate_cache_key(self, prediction_type: str, **kwargs) -> str:
        """Generate unique cache key based on prediction parameters"""
        # Sort kwargs for consistent key generation
        params = sorted(kwargs.items())
        params_str = "_".join(f"{k}={v}" for k, v in params if v is not None)
        return f"{prediction_type}_{params_str}"
    
    def get_game_predictions(self, days_ahead: int, include_details: bool = False) -> Optional[Dict]:
        """Get cached game predictions"""
        cache_key = self._generate_cache_key("game", days_ahead=days_ahead, details=include_details)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Query cache
        cursor.execute("""
            SELECT predictions_json, expires_at
            FROM game_predictions
            WHERE cache_key = ? AND expires_at > ?
        """, (cache_key, datetime.now().isoformat()))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            predictions_json, expires_at = row
            logger.info(f"✅ Cache HIT for game predictions (days_ahead={days_ahead}, expires={expires_at})")
            return json.loads(predictions_json)
        
        logger.info(f"❌ Cache MISS for game predictions (days_ahead={days_ahead})")
        return None
    
    def set_game_predictions(self, days_ahead: int, include_details: bool, predictions: Dict):
        """Store game predictions in cache"""
        cache_key = self._generate_cache_key("game", days_ahead=days_ahead, details=include_details)
        now = datetime.now()
        expires_at = now + self.cache_duration
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert or replace cache entry
        cursor.execute("""
            INSERT OR REPLACE INTO game_predictions 
            (cache_key, prediction_date, days_ahead, predictions_json, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            cache_key,
            now.isoformat(),
            days_ahead,
            json.dumps(predictions),
            now.isoformat(),
            expires_at.isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Cached game predictions (days_ahead={days_ahead}, expires={expires_at})")
    
    def clear_expired(self):
        """Remove expired cache entries"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Clear expired game predictions
        cursor.execute("DELETE FROM game_predictions WHERE expires_at <= ?", (now,))
        games_deleted = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        if games_deleted > 0:
            logger.info(f"🗑️ Cleared {games_deleted} expired cache entries")
    
    def clear_all(self):
        """Clear all cached predictions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM game_predictions")
        
        conn.commit()
        conn.close()
        
        logger.info("🗑️ Cleared all cached predictions")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Count valid entries
        cursor.execute("SELECT COUNT(*) FROM game_predictions WHERE expires_at > ?", (now,))
        valid_games = cursor.fetchone()[0]
        
        # Count expired entries
        cursor.execute("SELECT COUNT(*) FROM game_predictions WHERE expires_at <= ?", (now,))
        expired_games = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "cache_duration_hours": self.cache_duration.total_seconds() / 3600,
            "valid_entries": {
                "game_predictions": valid_games,
                "total": valid_games
            },
            "expired_entries": {
                "game_predictions": expired_games,
                "total": expired_games
            }
        }
