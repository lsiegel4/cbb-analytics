/**
 * Team data fetching with automatic fallback to mock data.
 * All four-factor percentages are normalized to 0–100 scale regardless of source.
 */

import {
  buildTeamLeaderboard,
  TEAM_PROFILES,
  getTeamRoster,
  getTeamGameLog,
  getTeamPercentile,
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

// Normalize mock four-factor stats from 0–1 to 0–100 to match API format.
function normalizeMockTeamStats(s) {
  return {
    ...s,
    efg_pct:     s.efg_pct     != null ? +(s.efg_pct     * 100).toFixed(1) : null,
    opp_efg_pct: s.opp_efg_pct != null ? +(s.opp_efg_pct * 100).toFixed(1) : null,
    ftr:         s.ftr         != null ? +(s.ftr         * 100).toFixed(1) : null,
    opp_ftr:     s.opp_ftr     != null ? +(s.opp_ftr     * 100).toFixed(1) : null,
  };
}

/**
 * Fetch team ratings/leaderboard for a season.
 * @returns {Promise<{ data: object[], source: 'api'|'mock' }>}
 */
export async function fetchTeams({ season, conference } = {}) {
  const params = new URLSearchParams({ season: season ?? '2024-25' });
  if (conference) params.set('conference', conference);

  try {
    const data = await fetchWithTimeout(`${API_BASE}/teams?${params}`);
    return { data, source: 'api' };
  } catch {
    let data = buildTeamLeaderboard(season ?? '2024-25').map(t => ({
      ...normalizeMockTeamStats(t),
    }));
    if (conference) data = data.filter(t => t.conference === conference);
    return { data, source: 'mock' };
  }
}

/**
 * Fetch a single team's full multi-season profile.
 * Returns normalized data with percentiles included in each season's stats.
 * @returns {Promise<{ team: object|null, source: 'api'|'mock' }>}
 */
export async function fetchTeamProfile(teamId) {
  try {
    const team = await fetchWithTimeout(`${API_BASE}/teams/${encodeURIComponent(teamId)}`);
    return { team, source: 'api' };
  } catch {
    const profile = TEAM_PROFILES[teamId] ?? null;
    if (!profile) return { team: null, source: 'mock' };

    // Compute percentiles using original (un-normalized) mock values,
    // then normalize scale so the component sees a consistent format.
    const normalizedStats = {};
    for (const [season, s] of Object.entries(profile.stats)) {
      const percentiles = {
        net_rtg:     getTeamPercentile('net_rtg',     s.net_rtg,     season, true),
        ortg:        getTeamPercentile('ortg',         s.ortg,        season, true),
        drtg:        getTeamPercentile('drtg',         s.drtg,        season, false),
        efg_pct:     getTeamPercentile('efg_pct',     s.efg_pct,     season, true),
        opp_efg_pct: getTeamPercentile('opp_efg_pct', s.opp_efg_pct, season, false),
        tov_pct:     getTeamPercentile('tov_pct',     s.tov_pct,     season, false),
        opp_tov_pct: getTeamPercentile('opp_tov_pct', s.opp_tov_pct, season, true),
        orb_pct:     getTeamPercentile('orb_pct',     s.orb_pct,     season, true),
        drb_pct:     getTeamPercentile('drb_pct',     s.drb_pct,     season, true),
        ftr:         getTeamPercentile('ftr',          s.ftr,         season, true),
        opp_ftr:     getTeamPercentile('opp_ftr',     s.opp_ftr,     season, false),
        pace:        getTeamPercentile('pace',         s.pace,        season, true),
      };
      normalizedStats[season] = { ...normalizeMockTeamStats(s), percentiles };
    }

    return {
      team: {
        team_id:       teamId,
        name:          profile.name,
        conference:    profile.conference,
        _color:        profile.color,        // preserved for display
        _abbreviation: profile.abbreviation,
        seasons:       profile.seasons,
        stats:         normalizedStats,
      },
      source: 'mock',
    };
  }
}

/**
 * Fetch roster for a team in a given season.
 * Normalizes mock player fields to match API column names.
 * @returns {Promise<{ roster: object[], source: 'api'|'mock' }>}
 */
export async function fetchTeamRoster(teamId, season = '2024-25') {
  try {
    const data = await fetchWithTimeout(
      `${API_BASE}/teams/${encodeURIComponent(teamId)}/roster?season=${season}`
    );
    return { roster: data, source: 'api' };
  } catch {
    const mockRoster = getTeamRoster(teamId, season);
    const normalized = mockRoster.map(p => ({
      ...p,
      pts:            p.ppg ?? p.pts,
      reb:            p.rpg ?? p.reb,
      ast:            p.apg ?? p.ast,
      year_in_school: p.class_year ?? p.year_in_school,
      // Mock ts_pct is 0–1; API is 0–100
      ts_pct: p.ts_pct != null
        ? (p.ts_pct <= 1 ? +(p.ts_pct * 100).toFixed(1) : p.ts_pct)
        : null,
    }));
    return { roster: normalized, source: 'mock' };
  }
}

/**
 * Fetch game log for a team in a given season.
 * Adds sequential game number and normalizes per-game rating field names.
 * @returns {Promise<{ games: object[], source: 'api'|'mock' }>}
 */
export async function fetchTeamGames(teamId, season = '2024-25') {
  try {
    const data = await fetchWithTimeout(
      `${API_BASE}/teams/${encodeURIComponent(teamId)}/games?season=${season}`
    );
    const normalized = data.map((g, i) => ({
      ...g,
      game: i + 1,
      ortg: g.game_ortg,
      drtg: g.game_drtg,
      net:  g.game_net,
    }));
    return { games: normalized, source: 'api' };
  } catch {
    return { games: getTeamGameLog(teamId, season), source: 'mock' };
  }
}
