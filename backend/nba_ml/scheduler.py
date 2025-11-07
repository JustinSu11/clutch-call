"""
NBA ML Model Scheduler
Sets up scheduled retraining of NBA models and periodic prediction cache refreshes.
"""

import logging
import os
from datetime import datetime
from typing import List

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import pytz

from .model_manager import retrain_models_scheduled
from .prediction_service import NBAMLPredictor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler = None


def _parse_days_to_refresh(env_value: str) -> List[int]:
    """Translate the configured CSV list into valid day offsets."""

    days: List[int] = []
    for item in env_value.split(','):
        item = item.strip()
        if not item:
            continue
        try:
            day = int(item)
            if 1 <= day <= 7:
                days.append(day)
            else:
                logger.warning("Ignoring invalid prediction cache day '%s' (must be 1-7)", day)
        except ValueError:
            logger.warning("Ignoring non-integer prediction cache day token '%s'", item)

    if not days:
        days = [1]

    return sorted(set(days))


def refresh_predictions_cache(data_dir: str = "nba_ml_data") -> None:
    """Refresh cached NBA predictions for the configured day range."""

    include_details = os.getenv("NBA_PREDICTION_CACHE_INCLUDE_DETAILS", "false").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    days_config = os.getenv("NBA_PREDICTION_CACHE_DAYS", "1")
    days_to_refresh = _parse_days_to_refresh(days_config)

    logger.info(
        "Refreshing NBA prediction cache for days=%s (include_details=%s)",
        days_to_refresh,
        include_details,
    )

    predictor = NBAMLPredictor(data_dir=data_dir)

    for day in days_to_refresh:
        payload = predictor.get_prediction_payload(
            days_ahead=day,
            include_details=include_details,
            force_refresh=True,
        )
        if payload is None:
            logger.warning("No predictions generated for days_ahead=%s; cache not updated", day)


def start_model_retraining_scheduler(data_dir: str = "nba_ml_data"):
    """Start background scheduler for daily model retraining"""
    global _scheduler
    
    if _scheduler is not None:
        logger.warning("Scheduler already running")
        return _scheduler
    
    logger.info("=" * 60)
    logger.info("Starting NBA Model Retraining Scheduler")
    logger.info("=" * 60)
    
    _scheduler = BackgroundScheduler(
        timezone=pytz.timezone('America/Chicago')
    )
    
    _scheduler.add_job(
        func=lambda: retrain_models_scheduled(data_dir),
        trigger=CronTrigger(
            hour=4,
            minute=0,
            timezone=pytz.timezone('America/Chicago')
        ),
        id='nba_model_retraining',
        name='NBA Model Retraining',
        replace_existing=True,
        max_instances=1
    )

    _scheduler.add_job(
        func=lambda: refresh_predictions_cache(data_dir),
        trigger=IntervalTrigger(hours=1),
        id='nba_predictions_refresh',
        name='NBA Predictions Cache Refresh',
        replace_existing=True,
        max_instances=1
    )
    
    _scheduler.start()
    
    logger.info("✅ Scheduler started successfully")
    logger.info("📅 Daily retraining scheduled for 4:00 AM Central Time")
    logger.info(f"🕐 Current time: {datetime.now(pytz.timezone('America/Chicago'))}")
    
    retrain_job = _scheduler.get_job('nba_model_retraining')
    if retrain_job:
        logger.info(f"⏰ Next model retraining run: {retrain_job.next_run_time}")

    predictions_job = _scheduler.get_job('nba_predictions_refresh')
    if predictions_job:
        logger.info(f"🔄 Next predictions cache refresh: {predictions_job.next_run_time}")
    logger.info("=" * 60)
    
    return _scheduler


def stop_scheduler():
    """Stop the scheduler"""
    global _scheduler
    
    if _scheduler is not None:
        logger.info("Stopping scheduler...")
        _scheduler.shutdown()
        _scheduler = None
        logger.info("Scheduler stopped")


def get_scheduler():
    """Get the scheduler instance"""
    return _scheduler


if __name__ == "__main__":
    import time
    
    logger.info("Testing scheduler...")
    scheduler = start_model_retraining_scheduler()
    
    try:
        logger.info("Scheduler running. Press Ctrl+C to stop.")
        while True:
            time.sleep(60)
            if scheduler:
                jobs = scheduler.get_jobs()
                logger.info(f"Active jobs: {len(jobs)}")
                for job in jobs:
                    logger.info(f"  - {job.name}: next run at {job.next_run_time}")
    except KeyboardInterrupt:
        logger.info("Stopping scheduler...")
        stop_scheduler()
