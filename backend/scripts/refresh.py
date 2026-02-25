"""
Data refresh script — fetches from cbbdata and upserts into Postgres.

Usage (from backend/):
  .venv/bin/python -m scripts.refresh                    # all seasons, all data
  .venv/bin/python -m scripts.refresh --seasons 2024     # single year
  .venv/bin/python -m scripts.refresh --seasons 2022 2025  # range (inclusive)
  .venv/bin/python -m scripts.refresh --no-games         # skip per-game logs
  .venv/bin/python -m scripts.refresh --seasons 2025 --no-games  # fast current-season refresh
"""

import argparse
import asyncio
import os
import sys
import time

# Allow running as `python -m scripts.refresh` from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

import asyncpg
from clients.cbbdata import (
    _fetch_parquet, _api_key, _year_to_season,
    PLAYER_FIELD_MAP, TEAM_FIELD_MAP, GAME_LOG_FIELD_MAP, TEAM_GAME_BOX_FIELD_MAP,
    _remap, _map_record,
    BASE_URL,
)
from db import create_pool, init_schema


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

async def upsert_player_seasons(conn: asyncpg.Connection, year: int, rows: list[dict]) -> int:
    """Upsert player_seasons rows. Returns count inserted/updated."""
    if not rows:
        return 0

    records = []
    for row in rows:
        records.append((
            row.get("player_id"),
            year,
            row.get("name"),
            row.get("team"),
            row.get("conference"),
            row.get("position"),
            row.get("year_in_school"),
            row.get("height"),
            row.get("games"),
            row.get("mpg"),
            row.get("pts"),
            row.get("reb"),
            row.get("ast"),
            row.get("stl"),
            row.get("blk"),
            row.get("tov"),
            row.get("usg_pct"),
            row.get("ts_pct"),
            row.get("efg_pct"),
            row.get("ftr"),
            row.get("fg_pct"),
            row.get("three_pct"),
            row.get("ft_pct"),
            row.get("ortg"),
            row.get("drtg"),
            row.get("bpm"),
            row.get("obpm"),
            row.get("dbpm"),
            row.get("porpag"),
        ))

    await conn.executemany(
        """
        INSERT INTO player_seasons (
            player_id, year, name, team, conference, position,
            year_in_school, height, games, mpg, pts, reb, ast, stl, blk, tov,
            usg_pct, ts_pct, efg_pct, ftr, fg_pct, three_pct, ft_pct,
            ortg, drtg, bpm, obpm, dbpm, porpag
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
                  $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
        ON CONFLICT (player_id, year) DO UPDATE SET
            name=EXCLUDED.name, team=EXCLUDED.team, conference=EXCLUDED.conference,
            position=EXCLUDED.position, year_in_school=EXCLUDED.year_in_school,
            height=EXCLUDED.height, games=EXCLUDED.games, mpg=EXCLUDED.mpg,
            pts=EXCLUDED.pts, reb=EXCLUDED.reb, ast=EXCLUDED.ast,
            stl=EXCLUDED.stl, blk=EXCLUDED.blk, tov=EXCLUDED.tov,
            usg_pct=EXCLUDED.usg_pct, ts_pct=EXCLUDED.ts_pct,
            efg_pct=EXCLUDED.efg_pct, ftr=EXCLUDED.ftr,
            fg_pct=EXCLUDED.fg_pct, three_pct=EXCLUDED.three_pct,
            ft_pct=EXCLUDED.ft_pct, ortg=EXCLUDED.ortg, drtg=EXCLUDED.drtg,
            bpm=EXCLUDED.bpm, obpm=EXCLUDED.obpm, dbpm=EXCLUDED.dbpm,
            porpag=EXCLUDED.porpag
        """,
        records,
    )
    return len(records)


async def upsert_team_seasons(conn: asyncpg.Connection, year: int, rows: list[dict]) -> int:
    """Upsert T-Rank fields only. Four-factor stats + W/L are filled by update_team_season_aggregates."""
    if not rows:
        return 0

    records = []
    for row in rows:
        records.append((
            row.get("team_id"),
            year,
            row.get("name"),
            row.get("conference"),
            row.get("ortg"),
            row.get("drtg"),
            row.get("net_rtg"),
            row.get("pace"),
            row.get("barthag"),
            row.get("wab"),
            row.get("nc_sos"),
            row.get("ov_sos"),
            row.get("seed"),
        ))

    await conn.executemany(
        """
        INSERT INTO team_seasons (
            team_id, year, name, conference,
            ortg, drtg, net_rtg, pace, barthag, wab,
            nc_sos, ov_sos, seed
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (team_id, year) DO UPDATE SET
            name=EXCLUDED.name, conference=EXCLUDED.conference,
            ortg=EXCLUDED.ortg, drtg=EXCLUDED.drtg, net_rtg=EXCLUDED.net_rtg,
            pace=EXCLUDED.pace, barthag=EXCLUDED.barthag, wab=EXCLUDED.wab,
            nc_sos=EXCLUDED.nc_sos, ov_sos=EXCLUDED.ov_sos, seed=EXCLUDED.seed
        """,
        records,
    )
    return len(records)


async def upsert_team_games(conn: asyncpg.Connection, year: int, rows: list[dict]) -> int:
    """Replace all team games for a year then re-insert."""
    if not rows:
        return 0
    await conn.execute("DELETE FROM team_games WHERE year = $1", year)

    records = []
    for row in rows:
        d = row.get("date")
        if d is not None and not isinstance(d, str):
            d = d.isoformat()
        records.append((
            row.get("team_id"),
            year,
            row.get("game_id"),
            d,
            row.get("type"),
            row.get("location"),
            row.get("result"),
            row.get("opponent"),
            row.get("opp_conf"),
            row.get("min"),
            row.get("pos"),
            row.get("pts"),
            row.get("fgm"),
            row.get("fga"),
            row.get("tpm"),
            row.get("tpa"),
            row.get("ftm"),
            row.get("fta"),
            row.get("oreb"),
            row.get("dreb"),
            row.get("reb"),
            row.get("ast"),
            row.get("stl"),
            row.get("blk"),
            row.get("tov"),
            row.get("opp_pts"),
            row.get("opp_fgm"),
            row.get("opp_fga"),
            row.get("opp_tpm"),
            row.get("opp_tpa"),
            row.get("opp_ftm"),
            row.get("opp_fta"),
            row.get("opp_oreb"),
            row.get("opp_dreb"),
            row.get("opp_reb"),
            row.get("opp_ast"),
            row.get("opp_stl"),
            row.get("opp_blk"),
            row.get("opp_tov"),
        ))

    await conn.executemany(
        """
        INSERT INTO team_games (
            team_id, year, game_id, date, type, location, result, opponent, opp_conf,
            min, pos, pts, fgm, fga, tpm, tpa, ftm, fta,
            oreb, dreb, reb, ast, stl, blk, tov,
            opp_pts, opp_fgm, opp_fga, opp_tpm, opp_tpa, opp_ftm, opp_fta,
            opp_oreb, opp_dreb, opp_reb, opp_ast, opp_stl, opp_blk, opp_tov
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
            $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,
            $35,$36,$37,$38,$39
        )
        ON CONFLICT (team_id, year, game_id) DO NOTHING
        """,
        records,
    )
    return len(records)


async def update_team_season_aggregates(conn: asyncpg.Connection, year: int) -> int:
    """
    Compute W/L and four-factor stats from team_games and update team_seasons.
    Four factors stored at 0-100 scale (pct * 100) to match Torvik display convention.
    """
    await conn.execute(
        """
        UPDATE team_seasons ts SET
            wins    = agg.wins,
            losses  = agg.losses,
            record  = agg.wins || '-' || agg.losses,
            -- eFG% = (fgm + 0.5*tpm) / fga * 100
            efg_pct     = ROUND(CAST(agg.efg_raw     * 100 AS NUMERIC), 1),
            opp_efg_pct = ROUND(CAST(agg.opp_efg_raw * 100 AS NUMERIC), 1),
            -- TOV% = tov / (fga + 0.44*fta + tov) * 100
            tov_pct     = ROUND(CAST(agg.tov_raw     * 100 AS NUMERIC), 1),
            opp_tov_pct = ROUND(CAST(agg.opp_tov_raw * 100 AS NUMERIC), 1),
            -- ORB% = oreb / (oreb + opp_dreb) * 100
            orb_pct     = ROUND(CAST(agg.orb_raw     * 100 AS NUMERIC), 1),
            -- DRB% = dreb / (dreb + opp_oreb) * 100
            drb_pct     = ROUND(CAST(agg.drb_raw     * 100 AS NUMERIC), 1),
            -- FTR  = fta / fga * 100
            ftr         = ROUND(CAST(agg.ftr_raw     * 100 AS NUMERIC), 1),
            opp_ftr     = ROUND(CAST(agg.opp_ftr_raw * 100 AS NUMERIC), 1)
        FROM (
            SELECT
                team_id,
                COUNT(*) FILTER (WHERE result = 'W') AS wins,
                COUNT(*) FILTER (WHERE result = 'L') AS losses,
                -- eFG% numerator/denominator summed across season
                NULLIF(SUM(fgm + 0.5*tpm), 0) / NULLIF(SUM(fga), 0) AS efg_raw,
                NULLIF(SUM(opp_fgm + 0.5*opp_tpm), 0) / NULLIF(SUM(opp_fga), 0) AS opp_efg_raw,
                NULLIF(SUM(tov)::float, 0) / NULLIF(SUM(fga + 0.44*fta + tov), 0) AS tov_raw,
                NULLIF(SUM(opp_tov)::float, 0) / NULLIF(SUM(opp_fga + 0.44*opp_fta + opp_tov), 0) AS opp_tov_raw,
                NULLIF(SUM(oreb)::float, 0) / NULLIF(SUM(oreb + opp_dreb), 0) AS orb_raw,
                NULLIF(SUM(dreb)::float, 0) / NULLIF(SUM(dreb + opp_oreb), 0) AS drb_raw,
                NULLIF(SUM(fta)::float, 0) / NULLIF(SUM(fga), 0) AS ftr_raw,
                NULLIF(SUM(opp_fta)::float, 0) / NULLIF(SUM(opp_fga), 0) AS opp_ftr_raw
            FROM team_games
            WHERE year = $1
            GROUP BY team_id
        ) agg
        WHERE ts.team_id = agg.team_id AND ts.year = $1
        """,
        year,
    )
    # Return number of team_seasons rows updated
    result = await conn.fetchval(
        "SELECT COUNT(*) FROM team_seasons WHERE year = $1 AND wins IS NOT NULL", year
    )
    return result or 0


async def upsert_player_games(conn: asyncpg.Connection, year: int, rows: list[dict]) -> int:
    if not rows:
        return 0

    # Delete existing rows for this year before re-inserting.
    # game_num is SERIAL so we can't cleanly upsert — easier to replace per year.
    await conn.execute("DELETE FROM player_games WHERE year = $1", year)

    records = []
    for row in rows:
        records.append((
            row.get("player_id"),
            year,
            row.get("date"),
            row.get("opponent"),
            row.get("result"),
            row.get("location"),
            row.get("min"),
            row.get("pts"),
            row.get("reb"),
            row.get("ast"),
            row.get("stl"),
            row.get("blk"),
            row.get("tov"),
            row.get("two_m"),
            row.get("two_a"),
            row.get("three_m"),
            row.get("three_a"),
            row.get("ftm"),
            row.get("fta"),
            row.get("ortg"),
            row.get("usg"),
            row.get("efg"),
            row.get("ts"),
            row.get("bpm_game"),
            row.get("obpm_game"),
            row.get("dbpm_game"),
            row.get("poss"),
        ))

    await conn.executemany(
        """
        INSERT INTO player_games (
            player_id, year, date, opponent, result, location,
            min, pts, reb, ast, stl, blk, tov,
            two_m, two_a, three_m, three_a, ftm, fta,
            ortg, usg, efg, ts, bpm_game, obpm_game, dbpm_game, poss
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
                  $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
        """,
        records,
    )
    return len(records)


# ---------------------------------------------------------------------------
# Per-year fetch helpers
# ---------------------------------------------------------------------------

import math

def _clean(v):
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


async def fetch_and_store_players(pool: asyncpg.Pool, year: int) -> int:
    """Fetch player season averages for one year and upsert to DB."""
    season = _year_to_season(year)
    rows_raw = await _fetch_parquet(
        f"{BASE_URL}/torvik/player/season",
        {"year": year, "key": _api_key()},
    )
    result = []
    for i, row in enumerate(rows_raw):
        mapped = _remap(row, PLAYER_FIELD_MAP)
        tid = mapped.pop("torvik_id", None)
        if "player_id" not in mapped:
            if tid is not None:
                mapped["player_id"] = str(int(tid))
            else:
                name_slug = str(mapped.get("name", f"p{i}")).lower().replace(" ", "_")
                team_slug = str(mapped.get("team", "unk")).lower().replace(" ", "_")
                mapped["player_id"] = f"{name_slug}_{team_slug}"
        result.append(mapped)

    async with pool.acquire() as conn:
        return await upsert_player_seasons(conn, year, result)


async def fetch_and_store_teams(pool: asyncpg.Pool, year: int) -> int:
    """Fetch team ratings for one year and upsert to DB."""
    rows_raw = await _fetch_parquet(
        f"{BASE_URL}/torvik/ratings",
        {"year": year, "key": _api_key()},
    )
    result = []
    for row in rows_raw:
        row = _map_record(row)
        mapped = _remap(row, TEAM_FIELD_MAP)
        if "team_id" not in mapped:
            mapped["team_id"] = str(mapped.get("name", "unk")).lower().replace(" ", "_")
        if "net_rtg" in row:
            mapped["net_rtg"] = row["net_rtg"]
        result.append(mapped)

    async with pool.acquire() as conn:
        return await upsert_team_seasons(conn, year, result)


async def fetch_and_store_team_games(pool: asyncpg.Pool, year: int) -> tuple[int, int]:
    """
    Fetch team game box scores for one year.
    Returns (game_rows, teams_updated_with_aggregates).
    """
    try:
        rows_raw = await _fetch_parquet(
            f"{BASE_URL}/torvik/game/box",
            {"year": year, "key": _api_key()},
        )
    except Exception as e:
        print(f"    [skip] team games for {year}: {e}")
        return 0, 0

    if not rows_raw:
        print(f"    [skip] team games for {year}: no data")
        return 0, 0

    # Build a team_name → team_id lookup from what we already have in DB
    async with pool.acquire() as conn:
        existing = await conn.fetch(
            "SELECT team_id, name FROM team_seasons WHERE year = $1", year
        )
    name_to_id = {r["name"]: r["team_id"] for r in existing}

    result = []
    for row in rows_raw:
        mapped = _remap(row, TEAM_GAME_BOX_FIELD_MAP)
        team_name = mapped.pop("team_name", None)
        if not team_name:
            continue
        # Look up team_id or derive it
        team_id = name_to_id.get(team_name) or team_name.lower().replace(" ", "_")
        mapped["team_id"] = team_id
        # Convert date
        d = mapped.get("date")
        if d is not None and not isinstance(d, str):
            mapped["date"] = d.isoformat()
        result.append(mapped)

    async with pool.acquire() as conn:
        n_games = await upsert_team_games(conn, year, result)
        n_teams = await update_team_season_aggregates(conn, year)

    return n_games, n_teams


async def fetch_and_store_games(pool: asyncpg.Pool, year: int) -> int:
    """Fetch all player game logs for one year and store to DB."""
    try:
        rows_raw = await _fetch_parquet(
            f"{BASE_URL}/torvik/player/game",
            {"year": year, "key": _api_key()},
        )
    except Exception as e:
        print(f"    [skip] game logs for {year}: {e}")
        return 0

    if not rows_raw:
        print(f"    [skip] game logs for {year}: no data returned")
        return 0

    result = []
    for row in rows_raw:
        mapped = _remap(row, GAME_LOG_FIELD_MAP)
        # Set player_id from the id field
        raw_id = row.get("id")
        if raw_id is not None:
            mapped["player_id"] = str(int(raw_id))
        else:
            continue  # Can't associate without an id
        # Parquet returns date as datetime.date — convert to ISO string for TEXT column
        if mapped.get("date") is not None and not isinstance(mapped["date"], str):
            mapped["date"] = mapped["date"].isoformat()
        result.append(mapped)

    async with pool.acquire() as conn:
        return await upsert_player_games(conn, year, result)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def run(years: list[int], include_games: bool) -> None:
    pool = await create_pool()
    await init_schema(pool)

    total_players = 0
    total_teams = 0
    total_player_games = 0
    total_team_games = 0

    for year in years:
        season = _year_to_season(year)
        t0 = time.time()
        print(f"  {season} ({year}) ", end="", flush=True)

        # Players + teams (T-Rank) in parallel
        players_task = asyncio.create_task(fetch_and_store_players(pool, year))
        teams_task = asyncio.create_task(fetch_and_store_teams(pool, year))
        n_players, n_teams = await asyncio.gather(players_task, teams_task)
        total_players += n_players
        total_teams += n_teams
        print(f"players={n_players:,}  teams={n_teams}  ({time.time()-t0:.1f}s)", end="")

        if include_games:
            # Player game logs
            t1 = time.time()
            n_pg = await fetch_and_store_games(pool, year)
            total_player_games += n_pg
            print(f"  player_games={n_pg:,}  (+{time.time()-t1:.1f}s)", end="")

            # Team game box (also computes W/L + four-factor aggregates)
            t2 = time.time()
            n_tg, n_agg = await fetch_and_store_team_games(pool, year)
            total_team_games += n_tg
            print(f"  team_games={n_tg:,}  agg={n_agg}  (+{time.time()-t2:.1f}s)", end="")

        print()

    await pool.close()
    print(
        f"\nDone. {total_players:,} player-seasons, {total_teams:,} team-seasons, "
        f"{total_player_games:,} player-game rows, {total_team_games:,} team-game rows."
    )


def parse_args():
    parser = argparse.ArgumentParser(description="Refresh cbbdata → Postgres")
    parser.add_argument(
        "--seasons", nargs="+", type=int, metavar="YEAR",
        help="End year(s) to fetch. One value = single year; two values = inclusive range. Default: 2009–2025.",
    )
    parser.add_argument(
        "--no-games", action="store_true",
        help="Skip per-game logs (much faster — use for initial season-averages-only load).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.seasons is None:
        years = list(range(2009, 2026))
    elif len(args.seasons) == 1:
        years = args.seasons
    elif len(args.seasons) == 2:
        years = list(range(args.seasons[0], args.seasons[1] + 1))
    else:
        years = args.seasons

    print(f"Refreshing years: {years[0]}–{years[-1]}  (games={'yes' if not args.no_games else 'no'})\n")
    asyncio.run(run(years, include_games=not args.no_games))
