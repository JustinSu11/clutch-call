"""
Author: Harsh Vardhan Bhanot
Pydantic models for API request/response validation and data structure definitions.
"""

from typing import List
from pydantic import BaseModel


class RatesResponse(BaseModel):
    home_win: float
    draw: float
    home_loss: float


class TeamsResponse(BaseModel):
    teams: List[str]


class CanonicalizeResponse(BaseModel):
    input: str
    match: str
    suggestions: List[str]


class InfoResponse(BaseModel):
    seasons: List[int]
    n_matches: int
    train_window: List[str]