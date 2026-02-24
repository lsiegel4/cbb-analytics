"""
Court Vision — FastAPI backend
Run: uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from clients.cbbdata import get_player_season, get_team_ratings


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    key = os.getenv("CBBDATA_API_KEY", "")
    if not key:
        print(
            "\n⚠️  CBBDATA_API_KEY not set — endpoints will return 503 until configured.\n"
            "   Copy backend/.env.example → backend/.env and add your key.\n"
        )
    yield


app = FastAPI(title="Court Vision API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5177"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/players")
async def players(
    season: str = Query("2023-24", description="Season in 'YYYY-YY' format, e.g. '2023-24'"),
    conference: str = Query(None, description="Filter by conference abbreviation, e.g. 'ACC'"),
    position: str = Query(None, description="Filter by position, e.g. 'G'"),
    min_mpg: float = Query(None, description="Minimum minutes per game"),
):
    """Player season averages (Barttorvik via cbbdata)."""
    try:
        data = await get_player_season(season)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

    # Apply optional filters
    if conference:
        data = [p for p in data if p.get("conference", "").upper() == conference.upper()]
    if position:
        data = [p for p in data if p.get("position", "").upper().startswith(position.upper())]
    if min_mpg is not None:
        data = [p for p in data if float(p.get("mpg") or 0) >= min_mpg]

    return data


@app.get("/api/teams")
async def teams(
    season: str = Query("2023-24", description="Season in 'YYYY-YY' format"),
    conference: str = Query(None, description="Filter by conference abbreviation"),
):
    """Team ratings (Barttorvik T-Rank via cbbdata)."""
    try:
        data = await get_team_ratings(season)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

    if conference:
        data = [t for t in data if t.get("conference", "").upper() == conference.upper()]

    return data
