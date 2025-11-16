"""
Author: Harsh Vardhan Bhanot
Core EPL prediction system with machine learning model, feature engineering, and API data fetching.
MODIFIED: for relative imports.
"""

import os
import time
from typing import Dict, List, Optional
from collections import defaultdict
from dotenv import load_dotenv

import numpy as np
import pandas as pd
import requests
import xgboost as xgb
from difflib import get_close_matches

# --- MODIFIED IMPORTS ---
# Added '.' for relative imports to fix module loading
from .config import (
    BASE_URL, SEASONS, MIN_HISTORY_MATCHES, REQUEST_TIMEOUT,
    ELO_K, ELO_HFA, EWM_ALPHA, ALIAS
)
from .exceptions import APIError, DataError
from .utils import inverse_frequency_weights, team_features, h2h_features
# --- END MODIFIED IMPORTS ---


class EPLPredictor:
    def __init__(self, api_key: str):
        if not api_key:
            raise APIError("Missing FOOTBALL_DATA_API_KEY environment variable.")
        self.api_key = api_key
        self.headers = {'X-Auth-Token': api_key}
        self.matches_df: Optional[pd.DataFrame] = None
        self.features_df: Optional[pd.DataFrame] = None
        self.feature_cols: Optional[List[str]] = None
        self.label_order_: Optional[List[str]] = None
        self.model: Optional[xgb.XGBClassifier] = None

    def get_available_teams(self) -> List[str]:
        if self.matches_df is None or self.matches_df.empty:
            return []
        return sorted(set(self.matches_df['home_team']).union(set(self.matches_df['away_team'])))

    def canonicalize_team(self, name: str) -> str:
        teams = self.get_available_teams()
        if not teams:
            return name
        key = name.strip().lower()
        if key in ALIAS:
            return ALIAS[key]
        # Fuzzy to known set
        m = get_close_matches(name, teams, n=1, cutoff=0.72)
        return m[0] if m else name

    def _fetch_season(self, season: int, status: str = "FINISHED") -> pd.DataFrame:
        url = f"{BASE_URL}/competitions/PL/matches"
        params = {'season': season, 'status': status}
        r = requests.get(url, headers=self.headers, params=params, timeout=REQUEST_TIMEOUT)
        if r.status_code == 403:
            raise APIError("football-data.org: 403 (invalid key / plan).")
        if r.status_code == 429:
            raise APIError("football-data.org: 429 (rate limit).")
        if r.status_code == 404:
            return pd.DataFrame([])
        r.raise_for_status()
        data = r.json()
        rows = []
        winner_map = {'HOME_TEAM': 'HOME', 'AWAY_TEAM': 'AWAY', 'DRAW': 'DRAW', None: None}
        for m in data.get('matches', []):
            ft = m['score']['fullTime']
            if status == 'FINISHED' and (ft['home'] is None or ft['away'] is None):
                continue
            raw_w = m['score']['winner']
            winner = winner_map.get(raw_w, raw_w)
            rows.append({
                'match_id': m['id'],
                'date': m['utcDate'],
                'matchday': m.get('matchday'),
                'home_team': m['homeTeam']['name'],
                'away_team': m['awayTeam']['name'],
                'home_score': ft['home'],
                'away_score': ft['away'],
                'winner': winner,
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)
        return df

    def fetch_all(self, seasons: List[int]) -> pd.DataFrame:
        frames = []
        for s in seasons:
            try:
                frames.append(self._fetch_season(s))
                time.sleep(0.6)  # be kind to free tier
            except requests.exceptions.RequestException as e:
                raise APIError(f"Network/API error for season {s}: {e}")
        df = pd.concat([f for f in frames if not f.empty], ignore_index=True) if frames else pd.DataFrame([])
        if df.empty:
            raise DataError("No completed matches found to train.")
        self.matches_df = df.sort_values('date').reset_index(drop=True)
        return self.matches_df

    def fetch_upcoming_matches(self, season: int = None) -> pd.DataFrame:
        if season is None:
            season = max(SEASONS)

        url = f"{BASE_URL}/competitions/PL/matches"
        params = {'season': season, 'status': 'SCHEDULED'}
        r = requests.get(url, headers=self.headers, params=params, timeout=REQUEST_TIMEOUT)

        if r.status_code == 403:
            raise APIError("football-data.org: 403 (invalid key / plan).")
        if r.status_code == 429:
            raise APIError("football-data.org: 429 (rate limit).")
        if r.status_code == 404:
            return pd.DataFrame([])

        r.raise_for_status()
        data = r.json()
        rows = []

        for m in data.get('matches', []):
            rows.append({
                'match_id': m['id'],
                'date': m['utcDate'],
                'matchday': m.get('matchday'),
                'home_team': m['homeTeam']['name'],
                'away_team': m['awayTeam']['name'],
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)

        return df

    def create_features(self, min_history_matches: int = MIN_HISTORY_MATCHES) -> pd.DataFrame:
        if self.matches_df is None or self.matches_df.empty:
            raise DataError("No matches to featurize.")
        df = self.matches_df.copy().sort_values('date').reset_index(drop=True)

        elo = defaultdict(lambda: 1500.0)
        ewm_gf = defaultdict(lambda: 1.4)
        ewm_ga = defaultdict(lambda: 1.4)
        ewm_pts = defaultdict(lambda: 1.3)
        feats = []

        for _, row in df.iterrows():
            home, away, when = row['home_team'], row['away_team'], row['date']

            home_hist = df[((df.home_team == home) | (df.away_team == home)) & (df.date < when)].tail(min_history_matches)
            away_hist = df[((df.home_team == away) | (df.away_team == away)) & (df.date < when)].tail(min_history_matches)
            h2h_hist = df[(((df.home_team == home) & (df.away_team == away)) |
                           ((df.home_team == away) & (df.away_team == home))) & (df.date < when)].tail(5)

            if len(home_hist) < min_history_matches or len(away_hist) < min_history_matches:
                result_home = 1.0 if row['winner'] == 'HOME' else (0.5 if row['winner'] == 'DRAW' else 0.0)
                eh = 1.0 / (1.0 + 10 ** (-(((elo[home] + ELO_HFA) - elo[away]) / 400.0)))
                elo[home] += ELO_K * (result_home - eh)
                elo[away] += ELO_K * ((1.0 - result_home) - (1.0 - eh))
                gf_h, ga_h = row['home_score'], row['away_score']
                gf_a, ga_a = row['away_score'], row['home_score']
                pts_h = 3 if row['winner'] == 'HOME' else (1 if row['winner'] == 'DRAW' else 0)
                pts_a = 3 if row['winner'] == 'AWAY' else (1 if row['winner'] == 'DRAW' else 0)
                ewm_gf[home] = EWM_ALPHA * gf_h + (1 - EWM_ALPHA) * ewm_gf[home]
                ewm_ga[home] = EWM_ALPHA * ga_h + (1 - EWM_ALPHA) * ewm_ga[home]
                ewm_pts[home] = EWM_ALPHA * pts_h + (1 - EWM_ALPHA) * ewm_pts[home]
                ewm_gf[away] = EWM_ALPHA * gf_a + (1 - EWM_ALPHA) * ewm_gf[away]
                ewm_ga[away] = EWM_ALPHA * ga_a + (1 - EWM_ALPHA) * ewm_ga[away]
                ewm_pts[away] = EWM_ALPHA * pts_a + (1 - EWM_ALPHA) * ewm_pts[away]
                continue

            elo_home_prematch = elo[home] + ELO_HFA
            elo_away_prematch = elo[away]
            elo_diff = elo_home_prematch - elo_away_prematch

            home_f = team_features(home_hist, home)
            away_f = team_features(away_hist, away)
            h2h_f = h2h_features(h2h_hist, home, away)

            feats.append({
                'date': when,
                'matchday': int(row['matchday']) if pd.notna(row['matchday']) else 0,
                'home_team': home, 'away_team': away,
                # rolling features
                'home_avg_goals_scored': home_f['avg_goals_scored'],
                'home_avg_goals_conceded': home_f['avg_goals_conceded'],
                'home_goal_diff': home_f['avg_goals_scored'] - home_f['avg_goals_conceded'],
                'home_avg_points': home_f['avg_points'],
                'home_form_pts_last3': home_f['form_last3'],
                'home_win_rate': home_f['win_rate'],
                'home_clean_sheet_rate': home_f['clean_sheets'],
                'home_fail_to_score_rate': home_f['failed_to_score'],
                'home_days_since_last': home_f['days_since_last'],
                'away_avg_goals_scored': away_f['avg_goals_scored'],
                'away_avg_goals_conceded': away_f['avg_goals_conceded'],
                'away_goal_diff': away_f['avg_goals_scored'] - away_f['avg_goals_conceded'],
                'away_avg_points': away_f['avg_points'],
                'away_form_pts_last3': away_f['form_last3'],
                'away_win_rate': away_f['win_rate'],
                'away_clean_sheet_rate': away_f['clean_sheets'],
                'away_fail_to_score_rate': away_f['failed_to_score'],
                'away_days_since_last': away_f['days_since_last'],
                # Elo/EWM
                'elo_home': elo_home_prematch,
                'elo_away': elo_away_prematch,
                'elo_diff': elo_diff,
                'ewm_home_gf': ewm_gf[home],
                'ewm_home_ga': ewm_ga[home],
                'ewm_home_pts': ewm_pts[home],
                'ewm_away_gf': ewm_gf[away],
                'ewm_away_ga': ewm_ga[away],
                'ewm_away_pts': ewm_pts[away],
                'elo_close_band': float(abs(elo_diff) <= 25),
                # H2H
                'h2h_home_wins': h2h_f['home_wins'],
                'h2h_away_wins': h2h_f['away_wins'],
                'h2h_draws': h2h_f['draws'],
                'h2h_avg_goals': h2h_f['avg_goals'],
                # target
                'target': row['winner'],
            })

            result_home = 1.0 if row['winner'] == 'HOME' else (0.5 if row['winner'] == 'DRAW' else 0.0)
            eh = 1.0 / (1.0 + 10 ** (-(((elo[home] + ELO_HFA) - elo[away]) / 400.0)))
            elo[home] += ELO_K * (result_home - eh)
            elo[away] += ELO_K * ((1.0 - result_home) - (1.0 - eh))
            gf_h, ga_h = row['home_score'], row['away_score']
            gf_a, ga_a = row['away_score'], row['home_score']
            pts_h = 3 if row['winner'] == 'HOME' else (1 if row['winner'] == 'DRAW' else 0)
            pts_a = 3 if row['winner'] == 'AWAY' else (1 if row['winner'] == 'DRAW' else 0)
            ewm_gf[home] = EWM_ALPHA * gf_h + (1 - EWM_ALPHA) * ewm_gf[home]
            ewm_ga[home] = EWM_ALPHA * ga_h + (1 - EWM_ALPHA) * ewm_ga[home]
            ewm_pts[home] = EWM_ALPHA * pts_h + (1 - EWM_ALPHA) * ewm_pts[home]
            ewm_gf[away] = EWM_ALPHA * gf_a + (1 - EWM_ALPHA) * ewm_gf[away]
            ewm_ga[away] = EWM_ALPHA * ga_a + (1 - EWM_ALPHA) * ewm_ga[away]
            ewm_pts[away] = EWM_ALPHA * pts_a + (1 - EWM_ALPHA) * ewm_pts[away]

        if not feats:
            raise DataError("Insufficient history to build features. Try lowering MIN_HISTORY_MATCHES.")
        self.features_df = pd.DataFrame(feats).sort_values('date').reset_index(drop=True)
        return self.features_df

    def latest_team_state(self, team: str, elo_hfa: float = ELO_HFA) -> dict:
        if self.features_df is None or self.features_df.empty:
            return {"elo": 1500.0, "ewm_gf": 1.4, "ewm_ga": 1.4, "ewm_pts": 1.3}

        df = self.features_df
        last_home = df[df.home_team == team].tail(1)
        last_away = df[df.away_team == team].tail(1)

        base_elos, ewms_gf, ewms_ga, ewms_pts = [], [], [], []
        if not last_home.empty:
            base_elos.append(float(last_home["elo_home"].iloc[0] - elo_hfa))
            ewms_gf.append(float(last_home["ewm_home_gf"].iloc[0]))
            ewms_ga.append(float(last_home["ewm_home_ga"].iloc[0]))
            ewms_pts.append(float(last_home["ewm_home_pts"].iloc[0]))
        if not last_away.empty:
            base_elos.append(float(last_away["elo_away"].iloc[0]))
            ewms_gf.append(float(last_away["ewm_away_gf"].iloc[0]))
            ewms_ga.append(float(last_away["ewm_away_ga"].iloc[0]))
            ewms_pts.append(float(last_away["ewm_away_pts"].iloc[0]))

        if not base_elos:
            return {"elo": 1500.0, "ewm_gf": 1.4, "ewm_ga": 1.4, "ewm_pts": 1.3}

        return {
            "elo": float(np.mean(base_elos)),
            "ewm_gf": float(np.mean(ewms_gf)),
            "ewm_ga": float(np.mean(ewms_ga)),
            "ewm_pts": float(np.mean(ewms_pts)),
        }

    def train(self) -> None:
        if self.features_df is None or self.features_df.empty:
            raise DataError("No features to train on.")
        drop_cols = {'date', 'home_team', 'away_team', 'target'}
        self.feature_cols = [c for c in self.features_df.columns if c not in drop_cols]
        y = self.features_df['target']
        self.label_order_ = sorted(y.unique().tolist())
        label_to_int = {lbl: i for i, lbl in enumerate(self.label_order_)}
        y_enc = y.map(label_to_int).values
        X = self.features_df[self.feature_cols]
        w = inverse_frequency_weights(y_enc)
        params = dict(
            objective='multi:softprob',
            num_class=len(self.label_order_),
            n_estimators=900,
            learning_rate=0.05,
            max_depth=6,
            min_child_weight=3,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            tree_method='hist',
            eval_metric='mlogloss',
            n_jobs=-1,
            random_state=42
        )
        self.model = xgb.XGBClassifier(**params)
        self.model.fit(X, y_enc, sample_weight=w, verbose=False)

    def predict_rates(self, home: str, away: str, last_n: int = 10) -> Dict[str, float]:
        if self.model is None or self.feature_cols is None:
            raise DataError("Model not trained.")
        teams = self.get_available_teams()
        if not teams:
            raise DataError("No teams available in training data.")

        home = self.canonicalize_team(home)
        away = self.canonicalize_team(away)
        if home == away:
            raise DataError("Home and away teams must differ.")

        df = self.matches_df
        home_hist = df[(df.home_team == home) | (df.away_team == home)].sort_values('date').tail(last_n)
        away_hist = df[(df.home_team == away) | (df.away_team == away)].sort_values('date').tail(last_n)
        h2h = df[(((df.home_team == home) & (df.away_team == away)) |
                  ((df.home_team == away) & (df.away_team == home)))].sort_values('date').tail(10)

        hs = team_features(home_hist, home)
        as_ = team_features(away_hist, away)
        h2h_f = h2h_features(h2h, home, away)

        H = self.latest_team_state(home, elo_hfa=ELO_HFA)
        A = self.latest_team_state(away, elo_hfa=ELO_HFA)
        elo_home = H["elo"] + ELO_HFA
        elo_away = A["elo"]
        elo_diff = elo_home - elo_away

        row = {
            'matchday': int(df['matchday'].max()) if pd.notna(df['matchday']).any() else 0,
            'home_avg_goals_scored': hs['avg_goals_scored'],
            'home_avg_goals_conceded': hs['avg_goals_conceded'],
            'home_goal_diff': hs['avg_goals_scored'] - hs['avg_goals_conceded'],
            'home_avg_points': hs['avg_points'],
            'home_form_pts_last3': hs['form_last3'],
            'home_win_rate': hs['win_rate'],
            'home_clean_sheet_rate': hs['clean_sheets'],
            'home_fail_to_score_rate': hs['failed_to_score'],
            'home_days_since_last': hs['days_since_last'],
            'away_avg_goals_scored': as_['avg_goals_scored'],
            'away_avg_goals_conceded': as_['avg_goals_conceded'],
            'away_goal_diff': as_['avg_goals_scored'] - as_['avg_goals_conceded'],
            'away_avg_points': as_['avg_points'],
            'away_form_pts_last3': as_['form_last3'],
            'away_win_rate': as_['win_rate'],
            'away_clean_sheet_rate': as_['clean_sheets'],
            'away_fail_to_score_rate': as_['failed_to_score'],
            'away_days_since_last': as_['days_since_last'],
            'elo_home': elo_home,
            'elo_away': elo_away,
            'elo_diff': elo_diff,
            'ewm_home_gf': H['ewm_gf'],
            'ewm_home_ga': H['ewm_ga'],
            'ewm_home_pts': H['ewm_pts'],
            'ewm_away_gf': A['ewm_gf'],
            'ewm_away_ga': A['ewm_ga'],
            'ewm_away_pts': A['ewm_pts'],
            'elo_close_band': float(abs(elo_diff) <= 25),
            'h2h_home_wins': h2h_f['home_wins'],
            'h2h_away_wins': h2h_f['away_wins'],
            'h2h_draws': h2h_f['draws'],
            'h2h_avg_goals': h2h_f['avg_goals'],
        }

        X = pd.DataFrame([row])
        for c in self.feature_cols:
            if c not in X.columns:
                X[c] = 0.0
        X = X[self.feature_cols]

        proba = self.model.predict_proba(X)[0]
        label_to_prob = {self.label_order_[i]: float(proba[i]) for i in range(len(self.label_order_))}
        home_win = label_to_prob.get('HOME', label_to_prob.get('HOME_TEAM', 0.0))
        draw     = label_to_prob.get('DRAW', 0.0)
        away_win = label_to_prob.get('AWAY', label_to_prob.get('AWAY_TEAM', 0.0))
        return {'home_win': home_win, 'draw': draw, 'home_loss': away_win}


def build_model() -> EPLPredictor:
    load_dotenv()
    api_key = os.environ.get("FOOTBALL_DATA_API_KEY", "")
    predictor = EPLPredictor(api_key=api_key)
    predictor.fetch_all(SEASONS)
    predictor.create_features(MIN_HISTORY_MATCHES)
    predictor.train()
    return predictor