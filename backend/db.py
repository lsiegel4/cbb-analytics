"""
Database module — asyncpg connection pool + schema DDL.

The pool is created once at FastAPI startup (via lifespan) and stored on
app.state.pool.  All route handlers acquire a connection via:

    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(...)
"""

import os
import asyncpg


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS player_seasons (
    player_id   TEXT    NOT NULL,
    year        INTEGER NOT NULL,

    -- Identity
    name        TEXT,
    team        TEXT,
    conference  TEXT,
    position    TEXT,
    year_in_school TEXT,
    height      TEXT,

    -- Volume
    games       INTEGER,
    mpg         REAL,

    -- Per-game box stats
    pts         REAL,
    reb         REAL,
    ast         REAL,
    stl         REAL,
    blk         REAL,
    tov         REAL,

    -- Efficiency (0–100 scale from Torvik)
    usg_pct     REAL,
    ts_pct      REAL,
    efg_pct     REAL,
    ftr         REAL,

    -- Shooting splits (0–1 decimal)
    fg_pct      REAL,
    three_pct   REAL,
    ft_pct      REAL,

    -- Ratings
    ortg        REAL,
    drtg        REAL,
    bpm         REAL,
    obpm        REAL,
    dbpm        REAL,

    -- Torvik value metric
    porpag      REAL,

    PRIMARY KEY (player_id, year)
);

CREATE TABLE IF NOT EXISTS player_games (
    player_id   TEXT    NOT NULL,
    year        INTEGER NOT NULL,
    date        TEXT,           -- ISO date string e.g. '2024-01-15'
    opponent    TEXT,
    result      TEXT,
    location    TEXT,           -- H / A / N
    min         INTEGER,
    pts         INTEGER,
    reb         INTEGER,
    ast         INTEGER,
    stl         INTEGER,
    blk         INTEGER,
    tov         INTEGER,
    two_m       INTEGER,
    two_a       INTEGER,
    three_m     INTEGER,
    three_a     INTEGER,
    ftm         INTEGER,
    fta         INTEGER,
    ortg        REAL,
    usg         REAL,
    efg         REAL,
    ts          REAL,
    bpm_game    REAL,
    obpm_game   REAL,
    dbpm_game   REAL,
    poss        REAL,

    -- game_num is a tie-breaker for players who face the same opponent twice
    game_num    SERIAL,
    PRIMARY KEY (player_id, year, date, opponent, game_num)
);

CREATE INDEX IF NOT EXISTS idx_player_games_lookup
    ON player_games (player_id, year);

CREATE TABLE IF NOT EXISTS team_seasons (
    team_id     TEXT    NOT NULL,
    year        INTEGER NOT NULL,

    name        TEXT,
    conference  TEXT,
    record      TEXT,
    wins        INTEGER,
    losses      INTEGER,

    -- T-Rank ratings
    ortg        REAL,
    drtg        REAL,
    net_rtg     REAL,
    pace        REAL,
    barthag     REAL,
    wab         REAL,

    -- Four factors (0–100 scale: efg/tov/orb/drb as pct, ftr as fta/fga*100)
    efg_pct     REAL,
    opp_efg_pct REAL,
    tov_pct     REAL,
    opp_tov_pct REAL,
    orb_pct     REAL,
    drb_pct     REAL,
    ftr         REAL,
    opp_ftr     REAL,

    -- Schedule strength (0–1, higher = harder)
    nc_sos      REAL,
    ov_sos      REAL,

    -- Projected tournament seed (NULL if not projected)
    seed        REAL,

    PRIMARY KEY (team_id, year)
);

CREATE TABLE IF NOT EXISTS team_games (
    team_id     TEXT    NOT NULL,
    year        INTEGER NOT NULL,
    game_id     TEXT    NOT NULL,

    date        TEXT,
    type        TEXT,       -- 'reg', 'post', 'conf-t', etc.
    location    TEXT,       -- H / A / N
    result      TEXT,       -- W / L
    opponent    TEXT,
    opp_conf    TEXT,

    -- Team box
    min         REAL,
    pos         REAL,       -- possessions
    pts         INTEGER,
    fgm         INTEGER,
    fga         INTEGER,
    tpm         INTEGER,    -- 3-pointers made
    tpa         INTEGER,
    ftm         INTEGER,
    fta         INTEGER,
    oreb        INTEGER,
    dreb        INTEGER,
    reb         INTEGER,
    ast         INTEGER,
    stl         INTEGER,
    blk         INTEGER,
    tov         INTEGER,

    -- Opponent box
    opp_pts     INTEGER,
    opp_fgm     INTEGER,
    opp_fga     INTEGER,
    opp_tpm     INTEGER,
    opp_tpa     INTEGER,
    opp_ftm     INTEGER,
    opp_fta     INTEGER,
    opp_oreb    INTEGER,
    opp_dreb    INTEGER,
    opp_reb     INTEGER,
    opp_ast     INTEGER,
    opp_stl     INTEGER,
    opp_blk     INTEGER,
    opp_tov     INTEGER,

    PRIMARY KEY (team_id, year, game_id)
);

CREATE INDEX IF NOT EXISTS idx_team_games_lookup
    ON team_games (team_id, year);
"""


# ---------------------------------------------------------------------------
# Pool lifecycle
# ---------------------------------------------------------------------------

async def create_pool() -> asyncpg.Pool:
    """Create and return an asyncpg connection pool."""
    dsn = os.getenv("DATABASE_URL", "")
    if not dsn:
        raise RuntimeError(
            "DATABASE_URL is not set. "
            "Add it to backend/.env — e.g. postgresql://lucas@localhost/court_vision"
        )
    pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)
    return pool


async def init_schema(pool: asyncpg.Pool) -> None:
    """Create tables if they don't exist (idempotent)."""
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
