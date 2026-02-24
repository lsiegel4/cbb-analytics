"""
Client for the cbbdata REST API (https://cbbdata.aweatherman.com/).
All endpoints require an API key passed as a ?key= query parameter.
Responses are Apache Parquet files (not JSON) — parsed via pandas + pyarrow.
"""

import io
import math
import os
import httpx
import pandas as pd

BASE_URL = "https://www.cbbdata.com/api"


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


# ---------------------------------------------------------------------------
# Field mapping: cbbdata/Torvik column names → our internal field names
# ---------------------------------------------------------------------------
PLAYER_FIELD_MAP = {
    # Identity
    "id":        "torvik_id",   # Torvik's numeric player ID
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
    # Efficiency
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
    # Shooting splits (returned as 0–1 decimals)
    "fg_pct":    "fg_pct",
    "three_pct": "three_pct",
    "ft_pct":    "ft_pct",
}

TEAM_FIELD_MAP = {
    "team":      "name",
    "conf":      "conference",
    "adj_o":     "ortg",
    "adj_d":     "drtg",
    "adj_t":     "pace",
    "barthag":   "barthag",
    "wab":       "wab",
    "rec":       "record",
    "efg_o":     "efg_pct",
    "efg_d":     "opp_efg_pct",
    "to_o":      "tov_pct",
    "to_d":      "opp_tov_pct",
    "or_o":      "orb_pct",
    "or_d":      "drb_pct",
    "ft_o":      "ftr",
    "ft_d":      "opp_ftr",
}


def _map_record(raw: dict) -> dict:
    """
    Calculate wins/losses from the 'rec' field if present ('W-L' string),
    and derive net_rtg from adj_o - adj_d.
    """
    if "adj_o" in raw and "adj_d" in raw:
        try:
            raw["net_rtg"] = round(float(raw["adj_o"]) - float(raw["adj_d"]), 1)
        except (TypeError, ValueError):
            pass

    rec = raw.get("rec", "")
    if rec and isinstance(rec, str) and "-" in rec:
        parts = rec.split("-")
        try:
            raw["wins"] = int(parts[0])
            raw["losses"] = int(parts[1])
        except ValueError:
            pass

    return raw


def _clean(value):
    """Replace float NaN/Inf with None so they serialize cleanly to JSON null."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _remap(row: dict, field_map: dict) -> dict:
    """Apply a field map to a row dict, keeping only mapped keys."""
    out = {}
    for src, dst in field_map.items():
        if src in row:
            out[dst] = _clean(row[src])
    # Always pass through any id-like fields verbatim
    for key in ("player_id", "team_id"):
        if key in row:
            out[key] = row[key]
    return out


# ---------------------------------------------------------------------------
# API calls
# ---------------------------------------------------------------------------

async def get_player_season(season: str) -> list[dict]:
    """
    Fetch player season averages from Torvik via cbbdata REST API.
    Returns a list of player dicts with normalized field names.
    """
    year = _season_to_year(season)
    url = f"{BASE_URL}/torvik/player/season"
    params = {"year": year, "key": _api_key()}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        df = pd.read_parquet(io.BytesIO(resp.content))
        rows = df.where(df.notna(), other=None).to_dict(orient="records")

    result = []
    for i, row in enumerate(rows):
        mapped = _remap(row, PLAYER_FIELD_MAP)
        # Use Torvik's numeric id as player_id, fall back to slug
        if "player_id" not in mapped:
            tid = mapped.pop("torvik_id", None)
            if tid is not None:
                mapped["player_id"] = str(int(tid))
            else:
                name_slug = str(mapped.get("name", f"player_{i}")).lower().replace(" ", "_")
                team_slug = str(mapped.get("team", "unk")).lower().replace(" ", "_")
                mapped["player_id"] = f"{name_slug}_{team_slug}"
        else:
            mapped.pop("torvik_id", None)
        result.append(mapped)

    return result


async def get_team_ratings(season: str) -> list[dict]:
    """
    Fetch team ratings (Torvik T-Rank) via cbbdata REST API.
    Returns a list of team dicts with normalized field names.
    """
    year = _season_to_year(season)
    url = f"{BASE_URL}/torvik/ratings"
    params = {"year": year, "key": _api_key()}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        df = pd.read_parquet(io.BytesIO(resp.content))
        rows = df.where(df.notna(), other=None).to_dict(orient="records")

    result = []
    for row in rows:
        row = _map_record(row)
        mapped = _remap(row, TEAM_FIELD_MAP)
        if "team_id" not in mapped:
            name_slug = str(mapped.get("name", "unk")).lower().replace(" ", "_")
            mapped["team_id"] = name_slug
        result.append(mapped)

    return result
