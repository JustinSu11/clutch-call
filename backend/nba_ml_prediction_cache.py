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
        
        # Create player predictions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS player_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                prediction_date TEXT NOT NULL,
                days_ahead INTEGER NOT NULL,
                game_id TEXT,
                team_id INTEGER,
                predictions_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        """)
        
        # Create top performers cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS top_performers_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                prediction_date TEXT NOT NULL,
                days_ahead INTEGER NOT NULL,
                stat_type TEXT NOT NULL,
                performers_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        """)
        
        # Create indices for faster lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_cache_key ON game_predictions(cache_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_game_expires ON game_predictions(expires_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_player_cache_key ON player_predictions(cache_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_player_expires ON player_predictions(expires_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_performers_cache_key ON top_performers_cache(cache_key)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_performers_expires ON top_performers_cache(expires_at)")
        
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
    
    def get_player_predictions(self, days_ahead: int, game_id: Optional[str] = None, 
                              team_id: Optional[int] = None, min_points: Optional[float] = None,
                              top_n: Optional[int] = None) -> Optional[Dict]:
        """Get cached player predictions"""
        cache_key = self._generate_cache_key(
            "player", 
            days_ahead=days_ahead, 
            game_id=game_id, 
            team_id=team_id,
            min_points=min_points,
            top_n=top_n
        )
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT predictions_json, expires_at
            FROM player_predictions
            WHERE cache_key = ? AND expires_at > ?
        """, (cache_key, datetime.now().isoformat()))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            predictions_json, expires_at = row
            logger.info(f"✅ Cache HIT for player predictions (expires={expires_at})")
            return json.loads(predictions_json)
        
        logger.info(f"❌ Cache MISS for player predictions")
        return None
    
    def set_player_predictions(self, days_ahead: int, predictions: Dict,
                              game_id: Optional[str] = None, team_id: Optional[int] = None,
                              min_points: Optional[float] = None, top_n: Optional[int] = None):
        """Store player predictions in cache"""
        cache_key = self._generate_cache_key(
            "player",
            days_ahead=days_ahead,
            game_id=game_id,
            team_id=team_id,
            min_points=min_points,
            top_n=top_n
        )
        now = datetime.now()
        expires_at = now + self.cache_duration
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO player_predictions 
            (cache_key, prediction_date, days_ahead, game_id, team_id, predictions_json, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cache_key,
            now.isoformat(),
            days_ahead,
            game_id,
            team_id,
            json.dumps(predictions),
            now.isoformat(),
            expires_at.isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Cached player predictions (expires={expires_at})")
    
    def get_top_performers(self, days_ahead: int, stat: str, limit: int, 
                          min_threshold: Optional[float] = None) -> Optional[Dict]:
        """Get cached top performers"""
        cache_key = self._generate_cache_key(
            "performers",
            days_ahead=days_ahead,
            stat=stat,
            limit=limit,
            min_threshold=min_threshold
        )
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT performers_json, expires_at
            FROM top_performers_cache
            WHERE cache_key = ? AND expires_at > ?
        """, (cache_key, datetime.now().isoformat()))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            performers_json, expires_at = row
            logger.info(f"✅ Cache HIT for top performers (stat={stat}, expires={expires_at})")
            return json.loads(performers_json)
        
        logger.info(f"❌ Cache MISS for top performers (stat={stat})")
        return None
    
    def set_top_performers(self, days_ahead: int, stat: str, limit: int, 
                          performers: Dict, min_threshold: Optional[float] = None):
        """Store top performers in cache"""
        cache_key = self._generate_cache_key(
            "performers",
            days_ahead=days_ahead,
            stat=stat,
            limit=limit,
            min_threshold=min_threshold
        )
        now = datetime.now()
        expires_at = now + self.cache_duration
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO top_performers_cache 
            (cache_key, prediction_date, days_ahead, stat_type, performers_json, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            cache_key,
            now.isoformat(),
            days_ahead,
            stat,
            json.dumps(performers),
            now.isoformat(),
            expires_at.isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"✅ Cached top performers (stat={stat}, expires={expires_at})")
    
    def clear_expired(self):
        """Remove expired cache entries"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Clear expired game predictions
        cursor.execute("DELETE FROM game_predictions WHERE expires_at <= ?", (now,))
        games_deleted = cursor.rowcount
        
        # Clear expired player predictions
        cursor.execute("DELETE FROM player_predictions WHERE expires_at <= ?", (now,))
        players_deleted = cursor.rowcount
        
        # Clear expired top performers
        cursor.execute("DELETE FROM top_performers_cache WHERE expires_at <= ?", (now,))
        performers_deleted = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        total = games_deleted + players_deleted + performers_deleted
        if total > 0:
            logger.info(f"🗑️ Cleared {total} expired cache entries "
                       f"(games={games_deleted}, players={players_deleted}, performers={performers_deleted})")
    
    def clear_all(self):
        """Clear all cached predictions"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM game_predictions")
        cursor.execute("DELETE FROM player_predictions")
        cursor.execute("DELETE FROM top_performers_cache")
        
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
        
        cursor.execute("SELECT COUNT(*) FROM player_predictions WHERE expires_at > ?", (now,))
        valid_players = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM top_performers_cache WHERE expires_at > ?", (now,))
        valid_performers = cursor.fetchone()[0]
        
        # Count expired entries
        cursor.execute("SELECT COUNT(*) FROM game_predictions WHERE expires_at <= ?", (now,))
        expired_games = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM player_predictions WHERE expires_at <= ?", (now,))
        expired_players = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM top_performers_cache WHERE expires_at <= ?", (now,))
        expired_performers = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "cache_duration_hours": self.cache_duration.total_seconds() / 3600,
            "valid_entries": {
                "game_predictions": valid_games,
                "player_predictions": valid_players,
                "top_performers": valid_performers,
                "total": valid_games + valid_players + valid_performers
            },
            "expired_entries": {
                "game_predictions": expired_games,
                "player_predictions": expired_players,
                "top_performers": expired_performers,
                "total": expired_games + expired_players + expired_performers
            }
        }
