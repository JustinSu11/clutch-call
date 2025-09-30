"""
Author: Harsh Vardhan Bhanot
FastAPI application providing REST endpoints for EPL match prediction and team data.
"""

from contextlib import asynccontextmanager
from difflib import get_close_matches

from fastapi import FastAPI, HTTPException, Query

from config import SEASONS
from exceptions import APIError, DataError
from models import RatesResponse, TeamsResponse, CanonicalizeResponse, InfoResponse
from predictor import build_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up EPL Predictor API...")
    app.state.predictor = build_model()
    print("Model loaded and cached successfully!")

    yield

    print("Shutting down EPL Predictor API...")
    app.state.predictor = None


app = FastAPI(
    title="EPL Match Rates API",
    version="1.1.0",
    lifespan=lifespan
)


@app.get("/healthz")
def healthz():
    return {"ok": True, "model_ready": app.state.predictor is not None}


@app.get("/info", response_model=InfoResponse)
def info():
    p = app.state.predictor
    if p is None or p.features_df is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    start = p.features_df['date'].min().date().isoformat()
    end = p.features_df['date'].max().date().isoformat()
    return InfoResponse(seasons=SEASONS, n_matches=int(len(p.features_df)), train_window=[start, end])


@app.get("/teams", response_model=TeamsResponse)
def list_teams():
    p = app.state.predictor
    if p is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    return TeamsResponse(teams=p.get_available_teams())


@app.get("/canonicalize", response_model=CanonicalizeResponse)
def canonicalize(name: str = Query(..., description="Any team nickname or partial name")):
    p = app.state.predictor
    if p is None:
        raise HTTPException(status_code=503, detail="Model not ready")
    teams = p.get_available_teams()
    m = p.canonicalize_team(name)
    sugg = get_close_matches(name, teams, n=5, cutoff=0.55)
    if m not in sugg:
        sugg = [m] + sugg
    seen, unique = set(), []
    for s in sugg:
        if s not in seen:
            seen.add(s); unique.append(s)
    return CanonicalizeResponse(input=name, match=m, suggestions=unique[:5])


@app.get("/predict", response_model=RatesResponse)
def predict(
        home: str = Query(..., description="Home team (aliases allowed, e.g., 'Spurs')"),
        away: str = Query(..., description="Away team (aliases allowed, e.g., 'Man City')"),
        last_n: int = Query(10, ge=3, le=20, description="Recent matches per team (3–20)")
):
    try:
        p = app.state.predictor
        if p is None:
            raise HTTPException(status_code=503, detail="Model not ready")
        rates = p.predict_rates(home=home, away=away, last_n=last_n)
        return RatesResponse(**rates)
    except APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except DataError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)