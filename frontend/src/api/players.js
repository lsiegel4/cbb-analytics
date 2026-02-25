/**
 * Player data fetching with automatic fallback to mock data.
 *
 * Both sources are normalized to the same field schema (API field names)
 * so consuming components only need to know one set of field names.
 */

import {
  buildLeaderboard,
  PLAYER_PROFILES,
  getGameLog,
  getSimilarPlayers,
  getPercentile,
} from '../data/mockData';

const API_BASE = 'http://localhost:8000/api';
const BACKEND_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, timeoutMs = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Normalize a mock leaderboard row to match the API field schema. */
function normalizeMockLeaderboardRow(p) {
  return {
    ...p,
    pts: p.pts ?? p.ppg,
    reb: p.reb ?? p.rpg,
    ast: p.ast ?? p.apg,
    stl: p.stl ?? p.spg,
    blk: p.blk ?? p.bpg,
    year_in_school: p.year_in_school ?? p.class_year,
    // ts_pct: mock stores as 0–1 decimal, API returns 0–100
    ts_pct: p.ts_pct != null ? (p.ts_pct <= 1 ? p.ts_pct * 100 : p.ts_pct) : null,
  };
}

/** Normalize a mock player profile to match the nested API profile structure. */
function normalizeMockProfile(raw) {
  if (!raw) return null;
  const stats = {};
  for (const [s, rawStats] of Object.entries(raw.stats ?? {})) {
    const ts = rawStats.ts_pct != null
      ? (rawStats.ts_pct <= 1 ? rawStats.ts_pct * 100 : rawStats.ts_pct)
      : null;
    stats[s] = {
      games:        rawStats.games,
      mpg:          rawStats.mpg,
      pts:          rawStats.pts   ?? rawStats.ppg,
      reb:          rawStats.reb   ?? rawStats.rpg,
      ast:          rawStats.ast   ?? rawStats.apg,
      stl:          rawStats.stl   ?? rawStats.spg,
      blk:          rawStats.blk   ?? rawStats.bpg,
      tov:          rawStats.tov,
      ts_pct:       ts,
      usg_pct:      rawStats.usg_pct,
      efg_pct:      rawStats.efg_pct ?? null,
      fg_pct:       rawStats.fg_pct,
      three_pct:    rawStats.three_pct,
      ft_pct:       rawStats.ft_pct,
      bpm:          rawStats.bpm,
      obpm:         rawStats.obpm,
      dbpm:         rawStats.dbpm,
      ortg:         rawStats.ortg,
      drtg:         rawStats.drtg,
      porpag:       rawStats.porpag ?? null,
      percentiles: {
        bpm:     getPercentile('bpm',    rawStats.bpm,    s),
        pts:     getPercentile('ppg',    rawStats.ppg,    s),
        reb:     getPercentile('rpg',    rawStats.rpg,    s),
        ast:     getPercentile('apg',    rawStats.apg,    s),
        ts_pct:  getPercentile('ts_pct', rawStats.ts_pct, s),
        usg_pct: getPercentile('usg_pct',rawStats.usg_pct,s),
        ortg:    getPercentile('ortg',   rawStats.ortg,   s),
        drtg:    getPercentile('drtg',   rawStats.drtg,   s),
      },
    };
  }
  return {
    player_id:      raw.player_id,
    name:           raw.name,
    team:           raw.team,
    conference:     raw.conference,
    position:       raw.position,
    year_in_school: raw.class_year ?? raw.year_in_school,
    height:         raw.height,
    hometown:       raw.hometown,
    seasons:        raw.seasons ?? [],
    stats,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all players for a given season (leaderboard).
 * @returns {Promise<{ data: object[], source: 'api' | 'mock' }>}
 */
export async function fetchPlayers({ season } = {}) {
  const s = season ?? '2024-25';
  try {
    const data = await fetchWithTimeout(`${API_BASE}/players?season=${s}`);
    return { data, source: 'api' };
  } catch {
    const data = buildLeaderboard(s).map(normalizeMockLeaderboardRow);
    return { data, source: 'mock' };
  }
}

/**
 * Fetch a single player's full profile (all seasons + percentiles).
 * @returns {Promise<{ player: object|null, source: 'api' | 'mock' }>}
 */
export async function fetchPlayerProfile(playerId) {
  try {
    const player = await fetchWithTimeout(
      `${API_BASE}/players/${encodeURIComponent(playerId)}`,
      5000, // profile fetches multiple seasons — give it more time
    );
    return { player, source: 'api' };
  } catch {
    const raw = PLAYER_PROFILES[playerId] ?? null;
    return { player: normalizeMockProfile(raw), source: 'mock' };
  }
}

/**
 * Fetch per-game stats for a player in a given season.
 * @returns {Promise<{ gameLog: object[], source: 'api' | 'mock' }>}
 */
export async function fetchPlayerGames(playerId, season) {
  try {
    const gameLog = await fetchWithTimeout(
      `${API_BASE}/players/${encodeURIComponent(playerId)}/games?season=${season}`,
    );
    return { gameLog, source: 'api' };
  } catch {
    return { gameLog: getGameLog(playerId, season), source: 'mock' };
  }
}

/**
 * Fetch similar players (mock-only for now).
 * @returns {object[]}
 */
export function getMockSimilarPlayers(playerId, season) {
  return getSimilarPlayers(playerId, season);
}
