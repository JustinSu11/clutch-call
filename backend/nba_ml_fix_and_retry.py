"""
NBA ML System - Quick Fix and Retry
Cleans up failed data and retries the training process with memory optimizations
"""

import os
import shutil
import sys
import gc

def cleanup_and_retry():
    """Clean up failed data and retrain with consistent feature pipeline"""
    
    # Remove models directory to force retrain with consistent features
    models_dir = "nba_ml_data\\models"
    if os.path.exists(models_dir):
        print(f"🧹 Removing models directory to fix feature mismatch: {models_dir}")
        try:
            shutil.rmtree(models_dir)
            print("✅ Models cleanup complete - will retrain with consistent 13 features")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
    
    # Force garbage collection to free memory
    gc.collect()
    
    print("\n🔄 Retraining models with consistent feature pipeline...")
    print("🎯 Fixed: Training and prediction now both use exactly 13 player features")
    print("📊 Essential features: GP, MIN, FG_PCT, FG3_PCT, FT_PCT, REB, AST, PTS, PPG, RPG, APG, TS_PCT, EFG_PCT")
    
    # Run training with consistent features
    os.system("python nba_ml_main.py --train --predict --days-ahead 7")

def quick_predict_only():
    """Skip training and just try predictions with existing models"""
    print("🔮 Attempting predictions only...")
    os.system("python nba_ml_main.py --predict --days-ahead 7")

def status_check():
    """Check system status"""
    print("📊 Checking system status...")
    os.system("python nba_ml_main.py --status")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "predict":
            quick_predict_only()
        elif command == "status":
            status_check()
        else:
            cleanup_and_retry()
    else:
        cleanup_and_retry()