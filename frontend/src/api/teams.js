/**
 * Team data fetching with automatic fallback to mock data.
 */

import { buildTeamLeaderboard, TEAM_PROFILES } from '../data/mockData';

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
 * Fetch team ratings/leaderboard for a season.
 *
 * @param {object} opts
 * @param {string} opts.season     e.g. '2023-24'
 * @param {string} [opts.conference]
 * @returns {Promise<{ data: object[], source: 'api' | 'mock' }>}
 */
export async function fetchTeams({ season, conference } = {}) {
  const params = new URLSearchParams({ season: season ?? '2023-24' });
  if (conference) params.set('conference', conference);

  try {
    const data = await fetchWithTimeout(`${API_BASE}/teams?${params}`);
    return { data, source: 'api' };
  } catch {
    let data = buildTeamLeaderboard(season ?? '2023-24');
    if (conference) data = data.filter(t => t.conference === conference);
    return { data, source: 'mock' };
  }
}

/**
 * Fetch a single team's full profile.
 * Falls back to mock data.
 *
 * @param {string} teamId
 * @param {string} season
 * @returns {Promise<{ team: object|null, source: 'api' | 'mock' }>}
 */
export async function fetchTeamProfile(teamId, season) {
  try {
    const team = await fetchWithTimeout(
      `${API_BASE}/teams/${encodeURIComponent(teamId)}?season=${season}`
    );
    return { team, source: 'api' };
  } catch {
    const profile = TEAM_PROFILES[teamId] ?? null;
    return { team: profile, source: 'mock' };
  }
}
