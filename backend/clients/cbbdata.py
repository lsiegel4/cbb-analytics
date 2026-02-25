"""
Client for the cbbdata REST API (https://cbbdata.aweatherman.com/).
All endpoints require an API key passed as a ?key= query parameter.
Responses are Apache Parquet files (not JSON) — parsed via pandas + pyarrow.
"""

import asyncio
import io
import math
import os
import httpx
import pandas as pd

BASE_URL = "https://www.cbbdata.com/api"

# In-memory cache: {year (int) → list[dict]} — populated on first use per year.
# Cleared by restarting the server (fine for now; add Redis later if needed).
_season_cache: dict[int, list[dict]] = {}


def _api_key() -> str:
    key = os.getenv("CBBDATA_API_KEY", "")
    if not key:
        raise RuntimeError(
            "CBBDATA_API_KEY is not set. "
            "Register at https://cbbdata.aweatherman.com/ and add your key to backend/.env"
        )
    return key


def _season_to_year(season: str) -> int:
    """Convert '2023-24' → 2024 (the end year Torvik uses)."""
    try:
        return int(season.split("-")[0]) + 1
    except (ValueError, IndexError):
        raise ValueError(f"Invalid season format '{season}'. Expected e.g. '2023-24'.")


def _year_to_season(year: int) -> str:
    """Convert 2024 → '2023-24'."""
    short = str(year)[2:]
    return f"{year - 1}-{short}"


# ---------------------------------------------------------------------------
# Field maps
# ---------------------------------------------------------------------------
PLAYER_FIELD_MAP = {
    # Identity
    "id":        "torvik_id",
    "player":    "name",
    "team":      "team",
    "conf":      "conference",
    "pos":       "position",
    "exp":       "year_in_school",
    "hgt":       "height",
    # Volume
    "g":         "games",
    "mpg":       "mpg",
    # Per-game box stats
    "ppg":       "pts",
    "rpg":       "reb",
    "apg":       "ast",
    "spg":       "stl",
    "bpg":       "blk",
    "tov":       "tov",
    # Efficiency (ts/efg/usg are 0–100 scale from Torvik)
    "usg":       "usg_pct",
    "ts":        "ts_pct",
    "efg":       "efg_pct",
    "ftr":       "ftr",
    # Ratings
    "ortg":      "ortg",
    "drtg":      "drtg",
    "bpm":       "bpm",
    "obpm":      "obpm",
    "dbpm":      "dbpm",
    # Torvik value metric
    "porpag":    "porpag",
    # Shooting splits (0–1 decimals)
    "fg_pct":    "fg_pct",
    "three_pct": "three_pct",
    "ft_pct":    "ft_pct",
}

TEAM_FIELD_MAP = {
    # Identity
    "team":         "name",
    "conf":         "conference",
    # Ratings (actual REST API column names)
    "adj_o":        "ortg",
    "adj_d":        "drtg",
    "adj_t":        "pace",
    "barthag":      "barthag",
    "wab":          "wab",
    # Schedule strength (0–1, higher = harder)
    "nc_cur_sos":   "nc_sos",
    "ov_cur_sos":   "ov_sos",
    # Projected seed
    "seed":         "seed",
}

TEAM_GAME_BOX_FIELD_MAP = {
    "game_id":  "game_id",
    "date":     "date",
    "type":     "type",
    "location": "location",
    "result":   "result",
    "team":     "team_name",   # used for team_id lookup
    "opp":      "opponent",
    "opp_conf": "opp_conf",
    "min":      "min",
    "pos":      "pos",
    "pts":      "pts",
    "fgm":      "fgm",
    "fga":      "fga",
    "tpm":      "tpm",
    "tpa":      "tpa",
    "ftm":      "ftm",
    "fta":      "fta",
    "oreb":     "oreb",
    "dreb":     "dreb",
    "reb":      "reb",
    "ast":      "ast",
    "stl":      "stl",
    "blk":      "blk",
    "to":       "tov",
    "opp_pts":  "opp_pts",
    "opp_fgm":  "opp_fgm",
    "opp_fga":  "opp_fga",
    "opp_tpm":  "opp_tpm",
    "opp_tpa":  "opp_tpa",
    "opp_ftm":  "opp_ftm",
    "opp_fta":  "opp_fta",
    "opp_oreb": "opp_oreb",
    "opp_dreb": "opp_dreb",
    "opp_reb":  "opp_reb",
    "opp_ast":  "opp_ast",
    "opp_stl":  "opp_stl",
    "opp_blk":  "opp_blk",
    "opp_to":   "opp_tov",
}

GAME_LOG_FIELD_MAP = {
    "date":     "date",
    "opp":      "opponent",
    "result":   "result",
    "loc":      "location",   # H / A / N
    "min":      "min",
    "pts":      "pts",
    "reb":      "reb",
    "ast":      "ast",
    "stl":      "stl",
    "blk":      "blk",
    "tov":      "tov",
    "two_m":    "two_m",
    "two_a":    "two_a",
    "three_m":  "three_m",
    "three_a":  "three_a",
    "ftm":      "ftm",
    "fta":      "fta",
    "ortg":     "ortg",
    "usg":      "usg",
    "efg":      "efg",
    "ts":       "ts",
    "bpm":      "bpm_game",
    "obpm":     "obpm_game",
    "dbpm":     "dbpm_game",
    "poss":     "poss",
}

# Stats where higher = better (used for percentile direction)
_HIGHER_IS_BETTER = {
    "bpm", "obpm", "dbpm", "pts", "reb", "ast", "stl", "blk",
    "ts_pct", "usg_pct", "efg_pct", "ortg", "fg_pct", "three_pct",
    "ft_pct", "porpag", "mpg",
}
_LOWER_IS_BETTER = {"drtg", "tov"}

# Seasons fetched for career profiles (2008-09 through current)
_PROFILE_YEARS = list(range(2009, 2026))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean(value):
    """Replace float NaN/Inf with None so they serialize to JSON null."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _remap(row: dict, field_map: dict) -> dict:
    """Apply a field map, keeping only mapped keys and cleaning values."""
    out = {}
    for src, dst in field_map.items():
        if src in row:
            out[dst] = _clean(row[src])
    for key in ("player_id", "team_id"):
        if key in row:
            out[key] = row[key]
    return out


def _map_record(raw: dict) -> dict:
    if "adj_o" in raw and "adj_d" in raw:
        try:
            raw["net_rtg"] = round(float(raw["adj_o"]) - float(raw["adj_d"]), 1)
        except (TypeError, ValueError):
            pass
    return raw


def _compute_percentiles(player: dict, all_players: list[dict]) -> dict:
    """Return a {stat: percentile (0-100)} dict for the key stats."""
    result: dict[str, int | None] = {}
    stats_to_rank = _HIGHER_IS_BETTER | _LOWER_IS_BETTER
    for stat in stats_to_rank:
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


async def _fetch_parquet(url: str, params: dict) -> list[dict]:
    """Fetch a Parquet endpoint and return cleaned list of dicts."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        df = pd.read_parquet(io.BytesIO(resp.content))
        return df.where(df.notna(), other=None).to_dict(orient="records")


# ---------------------------------------------------------------------------
# Season data with cache
# ---------------------------------------------------------------------------

async def _get_season_players(year: int) -> list[dict]:
    """Return all players for a season year, using cache."""
    if year in _season_cache:
        return _season_cache[year]
    season = _year_to_season(year)
    players = await get_player_season(season)
    _season_cache[year] = players
    return players


# ---------------------------------------------------------------------------
# Public API functions
# ---------------------------------------------------------------------------

async def get_player_season(season: str) -> list[dict]:
    """Fetch all player season averages for a given season (cached per year)."""
    year = _season_to_year(season)
    if year in _season_cache:
        return _season_cache[year]

    rows = await _fetch_parquet(
        f"{BASE_URL}/torvik/player/season",
        {"year": year, "key": _api_key()},
    )
    result = []
    for i, row in enumerate(rows):
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

    _season_cache[year] = result
    return result


async def get_player_profile(torvik_id: str) -> dict | None:
    """
    Build a full player profile across all available seasons.
    Fetches multiple seasons in parallel using the season cache.
    Returns None if the player is not found in any season.
    """
    # Fetch all seasons concurrently (cache makes repeat calls instant)
    seasons_data = await asyncio.gather(
        *[_get_season_players(y) for y in _PROFILE_YEARS]
    )

    player_meta: dict | None = None
    stats_by_season: dict[str, dict] = {}

    for year, season_players in zip(_PROFILE_YEARS, seasons_data):
        season_str = _year_to_season(year)
        player = next(
            (p for p in season_players if p.get("player_id") == torvik_id), None
        )
        if not player:
            continue

        # Capture identity fields from the most recent season found
        if player_meta is None:
            player_meta = {
                k: player.get(k)
                for k in ("name", "team", "conference", "position", "year_in_school", "height")
            }

        # Per-season stats (strip identity + player_id)
        stat_keys = set(PLAYER_FIELD_MAP.values()) - {
            "torvik_id", "name", "team", "conference", "position", "year_in_school", "height"
        }
        season_stats = {k: player.get(k) for k in stat_keys if k in player}
        season_stats["percentiles"] = _compute_percentiles(player, season_players)
        stats_by_season[season_str] = season_stats

    if not player_meta:
        return None

    return {
        "player_id": torvik_id,
        **player_meta,
        "seasons": sorted(stats_by_season.keys()),
        "stats": stats_by_season,
    }


async def get_player_games(torvik_id: str, season: str) -> list[dict]:
    """
    Fetch per-game stats for a player in a given season.
    Filters in-memory by Torvik numeric ID since server-side player filter
    is unreliable.
    """
    year = _season_to_year(season)
    try:
        rows = await _fetch_parquet(
            f"{BASE_URL}/torvik/player/game",
            {"year": year, "key": _api_key()},
        )
    except Exception:
        return []  # Game log data may not be available for all seasons

    result = []
    for row in rows:
        row_id = row.get("id")
        if row_id is None or str(int(row_id)) != str(torvik_id):
            continue
        mapped = _remap(row, GAME_LOG_FIELD_MAP)
        # Compute FG string from 2P + 3P
        two_m = int(row.get("two_m") or 0)
        two_a = int(row.get("two_a") or 0)
        thr_m = int(row.get("three_m") or 0)
        thr_a = int(row.get("three_a") or 0)
        mapped["fg"] = f"{two_m + thr_m}-{two_a + thr_a}"
        result.append(mapped)

    # Most recent game first
    result.sort(key=lambda r: r.get("date") or "", reverse=True)
    return result


async def get_team_ratings(season: str) -> list[dict]:
    """Fetch team ratings (Torvik T-Rank) for a season."""
    year = _season_to_year(season)
    rows = await _fetch_parquet(
        f"{BASE_URL}/torvik/ratings",
        {"year": year, "key": _api_key()},
    )
    result = []
    for row in rows:
        row = _map_record(row)
        mapped = _remap(row, TEAM_FIELD_MAP)
        if "team_id" not in mapped:
            mapped["team_id"] = str(mapped.get("name", "unk")).lower().replace(" ", "_")
        result.append(mapped)
    return result
