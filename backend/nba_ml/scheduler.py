"""
NBA ML Model Scheduler
Sets up scheduled retraining of NBA models at 4am Central Time daily
"""

import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from .model_manager import retrain_models_scheduled

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler = None


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
    
    _scheduler.start()
    
    logger.info("✅ Scheduler started successfully")
    logger.info("📅 Daily retraining scheduled for 4:00 AM Central Time")
    logger.info(f"🕐 Current time: {datetime.now(pytz.timezone('America/Chicago'))}")
    
    next_run = _scheduler.get_job('nba_model_retraining').next_run_time
    logger.info(f"⏰ Next scheduled run: {next_run}")
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
