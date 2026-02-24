/**
 * Player data fetching with automatic fallback to mock data.
 *
 * When the FastAPI backend is running (localhost:8000), real data is used.
 * Otherwise, mock data is returned so the frontend stays fully functional
 * during development without the backend.
 *
 * Both sources are normalized to the same field schema (API field names).
 */

import { buildLeaderboard, PLAYER_PROFILES, getGameLog, getSimilarPlayers } from '../data/mockData';

const API_BASE = 'http://localhost:8000/api';
const BACKEND_TIMEOUT_MS = 2000;

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

/**
 * Normalize a mock player row to match the API field schema so that
 * consuming components only need to know one set of field names.
 */
function normalizeMock(p) {
  return {
    ...p,
    // Per-game stats: mock uses ppg/rpg/apg/spg/bpg, API uses pts/reb/ast/stl/blk
    pts: p.pts ?? p.ppg,
    reb: p.reb ?? p.rpg,
    ast: p.ast ?? p.apg,
    stl: p.stl ?? p.spg,
    blk: p.blk ?? p.bpg,
    // Class year: mock uses class_year ("Senior"), API uses year_in_school ("Sr")
    year_in_school: p.year_in_school ?? p.class_year,
    // ts_pct: mock stores as 0–1 decimal, API returns 0–100
    ts_pct: p.ts_pct != null ? (p.ts_pct <= 1 ? p.ts_pct * 100 : p.ts_pct) : null,
    // efg_pct and porpag not in mock — will be undefined (shown as —)
  };
}

/**
 * Fetch all players for a given season.
 * Returns real data from the backend, or mock data as a fallback.
 *
 * @param {object} opts
 * @param {string} opts.season     e.g. '2023-24'
 * @returns {Promise<{ data: object[], source: 'api' | 'mock' }>}
 */
export async function fetchPlayers({ season } = {}) {
  const s = season ?? '2023-24';
  const params = new URLSearchParams({ season: s });

  try {
    const data = await fetchWithTimeout(`${API_BASE}/players?${params}`);
    return { data, source: 'api' };
  } catch {
    const data = buildLeaderboard(s).map(normalizeMock);
    return { data, source: 'mock' };
  }
}

/**
 * Fetch a single player's full profile (season stats + game log + similar players).
 * Falls back to mock data if the backend is unavailable.
 *
 * @param {string} playerId
 * @param {string} season
 * @returns {Promise<{ player: object, gameLog: object[], similarPlayers: object[], source: 'api' | 'mock' }>}
 */
export async function fetchPlayerProfile(playerId, season) {
  try {
    const [player, gameLog] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/players/${encodeURIComponent(playerId)}?season=${season}`),
      fetchWithTimeout(`${API_BASE}/players/${encodeURIComponent(playerId)}/games?season=${season}`),
    ]);
    return { player, gameLog, similarPlayers: [], source: 'api' };
  } catch {
    const player = PLAYER_PROFILES[playerId] ?? null;
    const gameLog = getGameLog(playerId, season);
    const similarPlayers = getSimilarPlayers(playerId, season);
    return { player, gameLog, similarPlayers, source: 'mock' };
  }
}
