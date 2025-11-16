"""
Author: Harsh Vardhan Bhanot
Utility functions for data processing, feature extraction, and statistical calculations.
"""

from typing import List
import numpy as np
import pandas as pd
from difflib import get_close_matches


def inverse_frequency_weights(y_encoded: np.ndarray) -> np.ndarray:
    vals, counts = np.unique(y_encoded, return_counts=True)
    n_classes = len(vals)
    total = len(y_encoded)
    per_class_weight = {v: total / (n_classes * c) for v, c in zip(vals, counts)}
    return np.array([per_class_weight[v] for v in y_encoded], dtype=float)


def team_features(hist: pd.DataFrame, team: str) -> dict:
    goals_scored, goals_conceded, points = [], [], []
    clean, fts = 0, 0
    if hist.empty:
        return {
            'avg_goals_scored': 0.0, 'avg_goals_conceded': 0.0, 'avg_points': 0.0,
            'form_last3': 0, 'win_rate': 0.0, 'clean_sheets': 0.0,
            'failed_to_score': 0.0, 'days_since_last': 7.0
        }
    for _, m in hist.iterrows():
        if m['home_team'] == team:
            scored, conceded = m['home_score'], m['away_score']
            win_cond = (m['winner'] == 'HOME')
        else:
            scored, conceded = m['away_score'], m['home_score']
            win_cond = (m['winner'] == 'AWAY')
        goals_scored.append(scored)
        goals_conceded.append(conceded)
        clean += int(conceded == 0)
        fts += int(scored == 0)
        if win_cond:
            points.append(3)
        elif m['winner'] == 'DRAW':
            points.append(1)
        else:
            points.append(0)
    last3 = points[-3:] if len(points) >= 3 else points
    days_since_last = (hist['date'].max() - hist['date'].min()).days / max(len(hist), 1)
    return {
        'avg_goals_scored': float(np.mean(goals_scored) if goals_scored else 0.0),
        'avg_goals_conceded': float(np.mean(goals_conceded) if goals_conceded else 0.0),
        'avg_points': float(np.mean(points) if points else 0.0),
        'form_last3': int(sum(last3)),
        'win_rate': float(sum(p == 3 for p in points) / len(points) if points else 0.0),
        'clean_sheets': float(clean / len(hist) if len(hist) else 0.0),
        'failed_to_score': float(fts / len(hist) if len(hist) else 0.0),
        'days_since_last': float(days_since_last if not np.isnan(days_since_last) else 7.0),
    }


def h2h_features(h2h: pd.DataFrame, home: str, away: str) -> dict:
    if h2h.empty:
        return {'home_wins': 0.0, 'away_wins': 0.0, 'draws': 0.0, 'avg_goals': 2.5}
    hw = aw = dr = 0
    goals = []
    for _, m in h2h.iterrows():
        goals.append(m['home_score'] + m['away_score'])
        if m['home_team'] == home:
            if m['winner'] == 'HOME':
                hw += 1
            elif m['winner'] == 'AWAY':
                aw += 1
            else:
                dr += 1
        else:
            if m['winner'] == 'HOME':
                aw += 1
            elif m['winner'] == 'AWAY':
                hw += 1
            else:
                dr += 1
    n = len(h2h)
    return {'home_wins': hw / n, 'away_wins': aw / n, 'draws': dr / n, 'avg_goals': float(np.mean(goals))}


def similar_team(name: str, pool: List[str]) -> str:
    m = get_close_matches(name, pool, n=1, cutoff=0.6)
    return m[0] if m else name