"""
Court Vision — FastAPI backend
Run: .venv/bin/uvicorn main:app --reload --port 8000
"""

import math
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from db import create_pool, init_schema


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean(value):
    """Replace float NaN/Inf with None so they serialize to JSON null."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _row_to_dict(record) -> dict:
    """Convert asyncpg Record to plain dict, cleaning non-finite floats."""
    return {k: _clean(v) for k, v in dict(record).items()}


# Player stats where higher = better
_HIGHER_IS_BETTER = {
    "bpm", "obpm", "dbpm", "pts", "reb", "ast", "stl", "blk",
    "ts_pct", "usg_pct", "efg_pct", "ortg", "fg_pct", "three_pct",
    "ft_pct", "porpag", "mpg",
}
_LOWER_IS_BETTER = {"drtg", "tov"}

# Team stats where higher = better
_TEAM_HIGHER = {"ortg", "net_rtg", "efg_pct", "opp_tov_pct", "orb_pct", "drb_pct", "barthag", "wab", "pace"}
_TEAM_LOWER  = {"drtg", "opp_efg_pct", "tov_pct", "opp_ftr", "ftr"}  # ftr lower = fewer fouls drawn against


def _compute_team_percentiles(team: dict, all_teams: list[dict]) -> dict:
    result: dict[str, int | None] = {}
    for stat in _TEAM_HIGHER | _TEAM_LOWER:
        value = team.get(stat)
        if value is None:
            result[stat] = None
            continue
        values = [t[stat] for t in all_teams if t.get(stat) is not None]
        if not values:
            result[stat] = None
            continue
        if stat in _TEAM_HIGHER:
            pct = round(100 * sum(1 for v in values if v <= value) / len(values))
        else:
            pct = round(100 * sum(1 for v in values if v >= value) / len(values))
        result[stat] = pct
    return result


def _compute_percentiles(player: dict, all_players: list[dict]) -> dict:
    """Return a {stat: percentile (0–100)} dict for key stats."""
    result: dict[str, int | None] = {}
    for stat in _HIGHER_IS_BETTER | _LOWER_IS_BETTER:
        value = player.get(stat)
        if value is None:
            result[stat] = None
            continue
        values = [p[stat] for p in all_players if p.get(stat) is not None]
        if not values:
            result[stat] = None
            continue
        if stat in _HIGHER_IS_BETTER:
            pct = round(100 * sum(1 for v in values if v <= value) / len(values))
        else:
            pct = round(100 * sum(1 for v in values if v >= value) / len(values))
        result[stat] = pct
    return result


def _season_to_year(season: str) -> int:
    try:
        return int(season.split("-")[0]) + 1
    except (ValueError, IndexError):
        raise ValueError(f"Invalid season format '{season}'. Expected e.g. '2023-24'.")


def _year_to_season(year: int) -> str:
    short = str(year)[2:]
    return f"{year - 1}-{short}"


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify env vars
    if not os.getenv("DATABASE_URL"):
        print("\n⚠️  DATABASE_URL not set — DB endpoints will fail.\n")
    if not os.getenv("CBBDATA_API_KEY"):
        print("\n⚠️  CBBDATA_API_KEY not set — refresh script will fail.\n")

    # Create DB connection pool and ensure schema exists
    pool = await create_pool()
    await init_schema(pool)
    app.state.pool = pool

    yield

    await pool.close()


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
    request: Request,
    season: str = Query("2024-25", description="Season in 'YYYY-YY' format"),
    conference: str = Query(None, description="Filter by conference abbreviation"),
    position: str = Query(None, description="Filter by position"),
    min_mpg: float = Query(None, description="Minimum minutes per game"),
):
    """Player season averages from DB."""
    try:
        year = _season_to_year(season)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conditions = ["year = $1"]
    params: list = [year]

    if conference:
        params.append(conference.upper())
        conditions.append(f"UPPER(conference) = ${len(params)}")
    if position:
        params.append(position.upper() + "%")
        conditions.append(f"UPPER(position) LIKE ${len(params)}")
    if min_mpg is not None:
        params.append(min_mpg)
        conditions.append(f"mpg >= ${len(params)}")

    where = " AND ".join(conditions)
    sql = f"SELECT * FROM player_seasons WHERE {where} ORDER BY bpm DESC NULLS LAST"

    try:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    if not rows:
        # Check if the table is simply empty for this year (DB not yet seeded)
        async with request.app.state.pool.acquire() as conn:
            count = await conn.fetchval("SELECT COUNT(*) FROM player_seasons WHERE year = $1", year)
        if count == 0:
            raise HTTPException(
                status_code=503,
                detail=f"No data for season {season}. Run: .venv/bin/python -m scripts.refresh --seasons {year} --no-games",
            )

    return [_row_to_dict(r) for r in rows]


@app.get("/api/players/{player_id}")
async def player_profile(
    player_id: str,
    request: Request,
):
    """Full career profile with per-season percentiles (all seasons in DB)."""
    try:
        async with request.app.state.pool.acquire() as conn:
            # Fetch all seasons for this player
            player_rows = await conn.fetch(
                "SELECT * FROM player_seasons WHERE player_id = $1 ORDER BY year",
                player_id,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    if not player_rows:
        raise HTTPException(status_code=404, detail=f"Player '{player_id}' not found.")

    # Use the most recent season's identity fields
    latest = _row_to_dict(player_rows[-1])
    player_meta = {
        k: latest.get(k)
        for k in ("name", "team", "conference", "position", "year_in_school", "height")
    }

    stats_by_season: dict[str, dict] = {}
    for row in player_rows:
        player = _row_to_dict(row)
        year = player["year"]
        season_str = _year_to_season(year)

        # Fetch the full season population for percentile computation
        async with request.app.state.pool.acquire() as conn:
            pop_rows = await conn.fetch(
                "SELECT * FROM player_seasons WHERE year = $1", year
            )
        all_players = [_row_to_dict(r) for r in pop_rows]

        stat_keys = {
            "games", "mpg", "pts", "reb", "ast", "stl", "blk", "tov",
            "usg_pct", "ts_pct", "efg_pct", "ftr", "fg_pct", "three_pct", "ft_pct",
            "ortg", "drtg", "bpm", "obpm", "dbpm", "porpag",
        }
        season_stats = {k: player.get(k) for k in stat_keys}
        season_stats["percentiles"] = _compute_percentiles(player, all_players)
        stats_by_season[season_str] = season_stats

    return {
        "player_id": player_id,
        **player_meta,
        "seasons": sorted(stats_by_season.keys()),
        "stats": stats_by_season,
    }


@app.get("/api/players/{player_id}/games")
async def player_games(
    player_id: str,
    request: Request,
    season: str = Query("2024-25", description="Season in 'YYYY-YY' format"),
):
    """Per-game stats for a player in a given season."""
    try:
        year = _season_to_year(season)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM player_games
                WHERE player_id = $1 AND year = $2
                ORDER BY date DESC NULLS LAST
                """,
                player_id, year,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    result = []
    for row in rows:
        g = _row_to_dict(row)
        # Compute combined FG string
        two_m = g.get("two_m") or 0
        two_a = g.get("two_a") or 0
        thr_m = g.get("three_m") or 0
        thr_a = g.get("three_a") or 0
        g["fg"] = f"{two_m + thr_m}-{two_a + thr_a}"
        result.append(g)

    return result


@app.get("/api/teams")
async def teams(
    request: Request,
    season: str = Query("2024-25", description="Season in 'YYYY-YY' format"),
    conference: str = Query(None, description="Filter by conference abbreviation"),
):
    """Team ratings from DB."""
    try:
        year = _season_to_year(season)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    conditions = ["year = $1"]
    params: list = [year]

    if conference:
        params.append(conference.upper())
        conditions.append(f"UPPER(conference) = ${len(params)}")

    where = " AND ".join(conditions)
    sql = f"SELECT * FROM team_seasons WHERE {where} ORDER BY barthag DESC NULLS LAST"

    try:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    return [_row_to_dict(r) for r in rows]


@app.get("/api/teams/{team_id}")
async def team_profile(
    team_id: str,
    request: Request,
):
    """Full multi-season profile for a team, with per-season percentiles."""
    try:
        async with request.app.state.pool.acquire() as conn:
            team_rows = await conn.fetch(
                "SELECT * FROM team_seasons WHERE team_id = $1 ORDER BY year",
                team_id,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    if not team_rows:
        raise HTTPException(status_code=404, detail=f"Team '{team_id}' not found.")

    latest = _row_to_dict(team_rows[-1])
    team_meta = {k: latest.get(k) for k in ("name", "conference")}

    stat_keys = {
        "wins", "losses", "record",
        "ortg", "drtg", "net_rtg", "pace", "barthag", "wab",
        "efg_pct", "opp_efg_pct", "tov_pct", "opp_tov_pct",
        "orb_pct", "drb_pct", "ftr", "opp_ftr",
        "nc_sos", "ov_sos", "seed",
    }

    stats_by_season: dict[str, dict] = {}
    for row in team_rows:
        team = _row_to_dict(row)
        year = team["year"]
        season_str = _year_to_season(year)

        async with request.app.state.pool.acquire() as conn:
            pop_rows = await conn.fetch(
                "SELECT * FROM team_seasons WHERE year = $1", year
            )
        all_teams = [_row_to_dict(r) for r in pop_rows]

        season_stats = {k: team.get(k) for k in stat_keys}
        season_stats["percentiles"] = _compute_team_percentiles(team, all_teams)
        stats_by_season[season_str] = season_stats

    return {
        "team_id": team_id,
        **team_meta,
        "seasons": sorted(stats_by_season.keys()),
        "stats": stats_by_season,
    }


@app.get("/api/teams/{team_id}/roster")
async def team_roster(
    team_id: str,
    request: Request,
    season: str = Query("2024-25", description="Season in 'YYYY-YY' format"),
):
    """Players on the team's roster for a given season."""
    try:
        year = _season_to_year(season)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Resolve team name from team_seasons
    try:
        async with request.app.state.pool.acquire() as conn:
            team_name = await conn.fetchval(
                "SELECT name FROM team_seasons WHERE team_id = $1 AND year = $2",
                team_id, year,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    if not team_name:
        raise HTTPException(status_code=404, detail=f"Team '{team_id}' not found for season {season}.")

    try:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT player_id, name, position, year_in_school, height,
                       games, mpg, pts, reb, ast, stl, blk, tov,
                       bpm, obpm, dbpm, ts_pct, usg_pct
                FROM player_seasons
                WHERE team = $1 AND year = $2
                ORDER BY mpg DESC NULLS LAST
                """,
                team_name, year,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    return [_row_to_dict(r) for r in rows]


@app.get("/api/teams/{team_id}/games")
async def team_games_log(
    team_id: str,
    request: Request,
    season: str = Query("2024-25", description="Season in 'YYYY-YY' format"),
):
    """Game log for a team in a given season."""
    try:
        year = _season_to_year(season)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT date, type, location, result, opponent, opp_conf,
                       pts, opp_pts,
                       fgm, fga, tpm, tpa, ftm, fta,
                       oreb, dreb, reb, ast, stl, blk, tov,
                       pos, min
                FROM team_games
                WHERE team_id = $1 AND year = $2
                ORDER BY date ASC NULLS LAST
                """,
                team_id, year,
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {e}")

    result = []
    for row in rows:
        g = _row_to_dict(row)
        pts = g.get("pts") or 0
        opp_pts = g.get("opp_pts") or 0
        g["score"] = f"{pts}-{opp_pts}"
        g["margin"] = pts - opp_pts
        # Per-game ortg/drtg from box (pts per 100 possessions)
        pos = g.get("pos") or 0
        if pos > 0:
            g["game_ortg"] = round(pts / pos * 100, 1)
            g["game_drtg"] = round(opp_pts / pos * 100, 1)
            g["game_net"] = round((pts - opp_pts) / pos * 100, 1)
        else:
            g["game_ortg"] = None
            g["game_drtg"] = None
            g["game_net"] = None
        result.append(g)

    return result
