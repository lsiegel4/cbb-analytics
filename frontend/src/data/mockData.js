// ─── Seasons & Reference Data ────────────────────────────────────────────────
export const SEASONS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16',
];

export const CONFERENCES = [
  'ACC', 'Big East', 'Big Ten', 'Big 12', 'SEC',
  'American', 'Mountain West', 'Atlantic 10', 'WCC',
  'MAC', 'Sun Belt', 'CUSA', 'Missouri Valley',
];

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// ─── Stat Definitions (used by Glossary + Tooltips) ──────────────────────────
export const STAT_DEFINITIONS = {
  ppg:        { label: 'PPG',    full: 'Points Per Game',             group: 'traditional', definition: 'Average number of points scored per game played.' },
  rpg:        { label: 'RPG',    full: 'Rebounds Per Game',           group: 'traditional', definition: 'Average total rebounds (offensive + defensive) per game.' },
  apg:        { label: 'APG',    full: 'Assists Per Game',            group: 'traditional', definition: 'Average number of assists per game.' },
  spg:        { label: 'SPG',    full: 'Steals Per Game',             group: 'traditional', definition: 'Average number of steals per game.' },
  bpg:        { label: 'BPG',    full: 'Blocks Per Game',             group: 'traditional', definition: 'Average number of blocks per game.' },
  fg_pct:     { label: 'FG%',    full: 'Field Goal Percentage',       group: 'traditional', definition: 'Percentage of field goal attempts made. Includes 2-pointers and 3-pointers.' },
  three_pct:  { label: '3P%',    full: 'Three-Point Percentage',      group: 'traditional', definition: 'Percentage of three-point attempts made.' },
  ft_pct:     { label: 'FT%',    full: 'Free Throw Percentage',       group: 'traditional', definition: 'Percentage of free throw attempts made.' },
  mpg:        { label: 'MPG',    full: 'Minutes Per Game',            group: 'traditional', definition: 'Average minutes played per game.' },
  games:      { label: 'G',      full: 'Games Played',                group: 'traditional', definition: 'Total number of games the player appeared in.' },
  ts_pct:     { label: 'TS%',    full: 'True Shooting Percentage',    group: 'advanced',    definition: 'A measure of shooting efficiency that accounts for 2-pointers, 3-pointers, and free throws. Formula: PTS / (2 × (FGA + 0.44 × FTA)).' },
  usg_pct:    { label: 'USG%',   full: 'Usage Rate',                  group: 'advanced',    definition: 'Percentage of team plays used by a player while on the floor. Captures shots, assists, and turnovers.' },
  bpm:        { label: 'BPM',    full: 'Box Plus/Minus',              group: 'advanced',    definition: 'A box-score-based estimate of a player\'s contribution in points per 100 possessions relative to a league-average player. Positive = above average.' },
  obpm:       { label: 'OBPM',   full: 'Offensive Box Plus/Minus',    group: 'advanced',    definition: 'The offensive component of BPM — how much a player contributes offensively per 100 possessions above average.' },
  dbpm:       { label: 'DBPM',   full: 'Defensive Box Plus/Minus',    group: 'advanced',    definition: 'The defensive component of BPM — how much a player contributes defensively per 100 possessions above average.' },
  ortg:       { label: 'ORTG',   full: 'Offensive Rating',            group: 'advanced',    definition: 'Points produced per 100 possessions by the player. Measures individual offensive efficiency.' },
  drtg:       { label: 'DRTG',   full: 'Defensive Rating',            group: 'advanced',    definition: 'Points allowed per 100 possessions while the player is on the floor. Lower is better.' },
  ws_per_40:  { label: 'WS/40',  full: 'Win Shares Per 40 Minutes',   group: 'advanced',    definition: 'Win Shares attributed to the player, scaled to 40 minutes. Combines offensive and defensive contributions.' },
  per:        { label: 'PER',    full: 'Player Efficiency Rating',    group: 'advanced',    definition: 'John Hollinger\'s all-in-one rating of a player\'s per-minute performance. League average is ~15.' },
};

// ─── Player Data ──────────────────────────────────────────────────────────────
// Each player has nested season data for profile pages
export const PLAYER_PROFILES = {
  'zach-edey': {
    player_id: 'zach-edey',
    name: 'Zach Edey',
    team: 'Purdue',
    conference: 'Big Ten',
    position: 'C',
    class_year: 'Senior',
    jersey: '15',
    height: "7'4\"",
    hometown: 'Toronto, ON',
    seasons: ['2021-22', '2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 39, mpg: 31.2, ppg: 25.2, rpg: 12.2, apg: 2.0, spg: 0.9, bpg: 2.1, fg_pct: 0.621, three_pct: null, ft_pct: 0.654, ts_pct: 0.651, usg_pct: 32.8, bpm: 9.1, obpm: 6.8, dbpm: 2.3, ortg: 122.4, drtg: 96.2, ws_per_40: 0.267, per: 30.1 },
      '2022-23': { games: 37, mpg: 29.8, ppg: 22.3, rpg: 12.9, apg: 1.4, spg: 0.6, bpg: 2.2, fg_pct: 0.598, three_pct: null, ft_pct: 0.628, ts_pct: 0.631, usg_pct: 30.1, bpm: 8.2, obpm: 6.0, dbpm: 2.2, ortg: 119.8, drtg: 97.4, ws_per_40: 0.243, per: 28.4 },
      '2021-22': { games: 33, mpg: 22.4, ppg: 14.4, rpg: 7.7, apg: 0.9, spg: 0.4, bpg: 1.7, fg_pct: 0.581, three_pct: null, ft_pct: 0.598, ts_pct: 0.601, usg_pct: 24.4, bpm: 5.4, obpm: 3.8, dbpm: 1.6, ortg: 116.2, drtg: 99.1, ws_per_40: 0.198, per: 22.1 },
    },
  },
  'hunter-dickinson': {
    player_id: 'hunter-dickinson',
    name: 'Hunter Dickinson',
    team: 'Kansas',
    conference: 'Big 12',
    position: 'C',
    class_year: 'Senior',
    jersey: '1',
    height: "7'1\"",
    hometown: 'Alexandria, VA',
    seasons: ['2020-21', '2021-22', '2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 37, mpg: 29.6, ppg: 18.9, rpg: 10.9, apg: 2.4, spg: 0.6, bpg: 1.7, fg_pct: 0.580, three_pct: 0.321, ft_pct: 0.734, ts_pct: 0.619, usg_pct: 27.3, bpm: 7.4, obpm: 5.1, dbpm: 2.3, ortg: 119.2, drtg: 97.8, ws_per_40: 0.241, per: 26.2 },
      '2022-23': { games: 36, mpg: 30.8, ppg: 18.6, rpg: 9.0, apg: 2.2, spg: 0.5, bpg: 1.1, fg_pct: 0.558, three_pct: 0.302, ft_pct: 0.741, ts_pct: 0.598, usg_pct: 25.8, bpm: 6.1, obpm: 4.2, dbpm: 1.9, ortg: 117.1, drtg: 98.6, ws_per_40: 0.218, per: 23.8 },
      '2021-22': { games: 33, mpg: 31.0, ppg: 18.6, rpg: 8.6, apg: 2.3, spg: 0.6, bpg: 1.2, fg_pct: 0.540, three_pct: 0.278, ft_pct: 0.722, ts_pct: 0.581, usg_pct: 26.2, bpm: 5.8, obpm: 3.9, dbpm: 1.9, ortg: 114.8, drtg: 99.2, ws_per_40: 0.207, per: 22.4 },
      '2020-21': { games: 20, mpg: 25.1, ppg: 14.1, rpg: 8.0, apg: 1.3, spg: 0.5, bpg: 1.0, fg_pct: 0.567, three_pct: 0.167, ft_pct: 0.701, ts_pct: 0.592, usg_pct: 21.8, bpm: 4.2, obpm: 2.8, dbpm: 1.4, ortg: 112.2, drtg: 101.4, ws_per_40: 0.177, per: 19.2 },
    },
  },
  'cooper-flagg': {
    player_id: 'cooper-flagg',
    name: 'Cooper Flagg',
    team: 'Duke',
    conference: 'ACC',
    position: 'SF',
    class_year: 'Freshman',
    jersey: '2',
    height: "6'9\"",
    hometown: 'Newport, ME',
    seasons: ['2024-25'],
    stats: {
      '2024-25': { games: 29, mpg: 33.2, ppg: 19.2, rpg: 7.8, apg: 4.2, spg: 1.6, bpg: 1.3, fg_pct: 0.488, three_pct: 0.362, ft_pct: 0.774, ts_pct: 0.591, usg_pct: 28.4, bpm: 8.8, obpm: 5.4, dbpm: 3.4, ortg: 118.6, drtg: 93.8, ws_per_40: 0.258, per: 27.4 },
    },
  },
  'dylan-harper': {
    player_id: 'dylan-harper',
    name: 'Dylan Harper',
    team: 'Rutgers',
    conference: 'Big Ten',
    position: 'SG',
    class_year: 'Freshman',
    jersey: '2',
    height: "6'6\"",
    hometown: 'Pearce, NJ',
    seasons: ['2024-25'],
    stats: {
      '2024-25': { games: 29, mpg: 34.0, ppg: 19.4, rpg: 4.6, apg: 5.0, spg: 1.4, bpg: 0.4, fg_pct: 0.462, three_pct: 0.338, ft_pct: 0.812, ts_pct: 0.572, usg_pct: 30.2, bpm: 7.2, obpm: 5.8, dbpm: 1.4, ortg: 116.8, drtg: 97.4, ws_per_40: 0.224, per: 24.8 },
    },
  },
  'VJ-edgecombe': {
    player_id: 'VJ-edgecombe',
    name: 'VJ Edgecombe',
    team: 'Baylor',
    conference: 'Big 12',
    position: 'SG',
    class_year: 'Freshman',
    jersey: '7',
    height: "6'5\"",
    hometown: 'Nassau, Bahamas',
    seasons: ['2024-25'],
    stats: {
      '2024-25': { games: 28, mpg: 31.8, ppg: 17.4, rpg: 4.4, apg: 3.0, spg: 1.8, bpg: 0.6, fg_pct: 0.474, three_pct: 0.348, ft_pct: 0.798, ts_pct: 0.576, usg_pct: 27.6, bpm: 6.4, obpm: 4.4, dbpm: 2.0, ortg: 117.2, drtg: 96.4, ws_per_40: 0.214, per: 22.8 },
    },
  },
  'paige-bueckers': {
    player_id: 'paige-bueckers',
    name: 'Paige Bueckers',
    team: 'UConn',
    conference: 'Big East',
    position: 'PG',
    class_year: 'Senior',
    jersey: '5',
    height: "6'0\"",
    hometown: 'Hopkins, MN',
    seasons: ['2020-21', '2021-22', '2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 30, mpg: 34.8, ppg: 21.9, rpg: 5.0, apg: 4.0, spg: 1.7, bpg: 0.4, fg_pct: 0.524, three_pct: 0.404, ft_pct: 0.846, ts_pct: 0.624, usg_pct: 29.4, bpm: 8.4, obpm: 6.6, dbpm: 1.8, ortg: 120.8, drtg: 95.4, ws_per_40: 0.252, per: 28.6 },
      '2022-23': { games: 31, mpg: 33.4, ppg: 22.9, rpg: 5.0, apg: 6.0, spg: 1.9, bpg: 0.5, fg_pct: 0.512, three_pct: 0.398, ft_pct: 0.868, ts_pct: 0.614, usg_pct: 30.8, bpm: 8.8, obpm: 7.1, dbpm: 1.7, ortg: 119.4, drtg: 94.8, ws_per_40: 0.261, per: 29.8 },
    },
  },
  'kyle-filipowski': {
    player_id: 'kyle-filipowski',
    name: 'Kyle Filipowski',
    team: 'Duke',
    conference: 'ACC',
    position: 'C',
    class_year: 'Sophomore',
    jersey: '30',
    height: "7'0\"",
    hometown: 'Westlake, OH',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 34, mpg: 28.4, ppg: 16.4, rpg: 8.1, apg: 2.9, spg: 0.8, bpg: 1.4, fg_pct: 0.512, three_pct: 0.342, ft_pct: 0.761, ts_pct: 0.594, usg_pct: 25.3, bpm: 7.2, obpm: 4.8, dbpm: 2.4, ortg: 118.3, drtg: 98.1, ws_per_40: 0.218, per: 23.4 },
      '2022-23': { games: 35, mpg: 27.1, ppg: 14.8, rpg: 7.8, apg: 2.2, spg: 0.7, bpg: 1.1, fg_pct: 0.495, three_pct: 0.318, ft_pct: 0.744, ts_pct: 0.574, usg_pct: 24.1, bpm: 5.8, obpm: 3.9, dbpm: 1.9, ortg: 115.4, drtg: 99.6, ws_per_40: 0.191, per: 20.8 },
    },
  },
  'mark-sears': {
    player_id: 'mark-sears',
    name: 'Mark Sears',
    team: 'Alabama',
    conference: 'SEC',
    position: 'PG',
    class_year: 'Senior',
    jersey: '1',
    height: "6'1\"",
    hometown: 'Hartselle, AL',
    seasons: ['2020-21', '2021-22', '2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 39, mpg: 33.2, ppg: 21.3, rpg: 4.0, apg: 3.9, spg: 1.6, bpg: 0.3, fg_pct: 0.469, three_pct: 0.384, ft_pct: 0.844, ts_pct: 0.604, usg_pct: 29.1, bpm: 6.8, obpm: 5.7, dbpm: 1.1, ortg: 118.4, drtg: 98.8, ws_per_40: 0.210, per: 24.1 },
      '2022-23': { games: 35, mpg: 31.8, ppg: 18.4, rpg: 3.8, apg: 3.4, spg: 1.4, bpg: 0.2, fg_pct: 0.448, three_pct: 0.361, ft_pct: 0.812, ts_pct: 0.578, usg_pct: 26.8, bpm: 5.4, obpm: 4.4, dbpm: 1.0, ortg: 115.8, drtg: 100.2, ws_per_40: 0.188, per: 21.4 },
    },
  },
  'ryan-dunn': {
    player_id: 'ryan-dunn',
    name: 'Ryan Dunn',
    team: 'Virginia',
    conference: 'ACC',
    position: 'SF',
    class_year: 'Sophomore',
    jersey: '7',
    height: "6'7\"",
    hometown: 'Branford, CT',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 33, mpg: 26.8, ppg: 8.4, rpg: 4.8, apg: 1.2, spg: 2.1, bpg: 1.8, fg_pct: 0.524, three_pct: 0.348, ft_pct: 0.622, ts_pct: 0.568, usg_pct: 15.8, bpm: 5.1, obpm: 0.8, dbpm: 4.3, ortg: 112.8, drtg: 91.4, ws_per_40: 0.198, per: 17.8 },
      '2022-23': { games: 31, mpg: 21.4, ppg: 5.8, rpg: 3.4, apg: 0.8, spg: 1.6, bpg: 1.4, fg_pct: 0.502, three_pct: 0.318, ft_pct: 0.594, ts_pct: 0.541, usg_pct: 13.2, bpm: 3.8, obpm: 0.2, dbpm: 3.6, ortg: 110.2, drtg: 93.8, ws_per_40: 0.162, per: 14.4 },
    },
  },
  'donovan-clingan': {
    player_id: 'donovan-clingan',
    name: 'Donovan Clingan',
    team: 'UConn',
    conference: 'Big East',
    position: 'C',
    class_year: 'Sophomore',
    jersey: '32',
    height: "7'2\"",
    hometown: 'Bristol, CT',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': { games: 38, mpg: 24.1, ppg: 13.0, rpg: 7.4, apg: 1.8, spg: 0.6, bpg: 2.9, fg_pct: 0.694, three_pct: null, ft_pct: 0.518, ts_pct: 0.694, usg_pct: 18.8, bpm: 6.8, obpm: 3.4, dbpm: 3.4, ortg: 122.8, drtg: 94.6, ws_per_40: 0.238, per: 24.8 },
      '2022-23': { games: 34, mpg: 18.4, ppg: 7.4, rpg: 5.0, apg: 0.8, spg: 0.4, bpg: 2.2, fg_pct: 0.668, three_pct: null, ft_pct: 0.511, ts_pct: 0.668, usg_pct: 13.4, bpm: 4.8, obpm: 2.0, dbpm: 2.8, ortg: 118.4, drtg: 95.8, ws_per_40: 0.204, per: 19.8 },
    },
  },
};

// ─── Flatten for Leaderboard ─────────────────────────────────────────────────
export function buildLeaderboard(season = '2023-24') {
  return Object.values(PLAYER_PROFILES)
    .filter(p => p.stats[season])
    .map(p => ({ ...p, ...p.stats[season], season }))
    .sort((a, b) => b.bpm - a.bpm);
}

// ─── All seasons flat (for leaderboard season switching) ─────────────────────
export function buildAllSeasonLeaderboard() {
  const rows = [];
  for (const player of Object.values(PLAYER_PROFILES)) {
    for (const [season, stats] of Object.entries(player.stats)) {
      rows.push({ ...player, ...stats, season });
    }
  }
  return rows.sort((a, b) => b.bpm - a.bpm);
}

// ─── Game Log Mock Data ──────────────────────────────────────────────────────
export function getGameLog(playerId, season) {
  const rng = (min, max, seed = 1) => Math.round((Math.sin(seed * 9301 + 49297) * 0.5 + 0.5) * (max - min) + min);
  const opponents = [
    'Michigan St.', 'Iowa', 'Indiana', 'Northwestern', 'Wisconsin',
    'Ohio St.', 'Penn St.', 'Minnesota', 'Nebraska', 'Rutgers',
    'Illinois', 'Maryland', 'Michigan', 'Memphis', 'Gonzaga',
    'Kansas', 'Houston', 'Tennessee', 'Duke', 'Kentucky',
  ];
  const profile = PLAYER_PROFILES[playerId];
  if (!profile || !profile.stats[season]) return [];
  const stats = profile.stats[season];
  return Array.from({ length: Math.min(stats.games, 20) }, (_, i) => ({
    date: new Date(2024, i < 10 ? i + 1 : i + 2, (i * 3 % 28) + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    opponent: opponents[i % opponents.length],
    result: i % 4 === 3 ? 'L' : 'W',
    pts: Math.max(2, Math.round(stats.ppg + (Math.sin(i * 7.3) * 6))),
    reb: Math.max(1, Math.round(stats.rpg + (Math.sin(i * 3.7) * 3))),
    ast: Math.max(0, Math.round(stats.apg + (Math.sin(i * 5.1) * 2))),
    stl: Math.max(0, Math.round(stats.spg + (Math.sin(i * 2.3) * 1))),
    blk: Math.max(0, Math.round(stats.bpg + (Math.sin(i * 4.1) * 1))),
    min: Math.max(10, Math.round(stats.mpg + (Math.sin(i * 1.9) * 4))),
    fg: `${Math.max(1, Math.round(stats.fg_pct * (Math.max(4, Math.round(stats.ppg / 2 + 1)))))}/${Math.max(3, Math.round(stats.ppg / 2 + 1))}`,
    bpm_game: parseFloat((stats.bpm + (Math.sin(i * 6.7) * 4)).toFixed(1)),
  }));
}

// ─── Similar Players ─────────────────────────────────────────────────────────
export function getSimilarPlayers(playerId, season) {
  const current = PLAYER_PROFILES[playerId];
  if (!current || !current.stats[season]) return [];
  const currentStats = current.stats[season];

  return Object.entries(PLAYER_PROFILES)
    .filter(([id]) => id !== playerId)
    .filter(([, p]) => p.stats[season])
    .map(([id, p]) => {
      const s = p.stats[season];
      // Simple Euclidean similarity on key stats (normalized)
      const diff = Math.sqrt(
        Math.pow((s.bpm - currentStats.bpm) / 10, 2) +
        Math.pow((s.ts_pct - currentStats.ts_pct) / 0.15, 2) +
        Math.pow((s.usg_pct - currentStats.usg_pct) / 15, 2) +
        Math.pow((s.rpg - currentStats.rpg) / 10, 2)
      );
      const similarity = Math.max(0, Math.round((1 - diff / 2) * 100));
      return { ...p, ...s, season, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 4);
}

// ─── Percentile Calculator ───────────────────────────────────────────────────
// Returns 0-100 percentile for a given stat value among all players in season
export function getPercentile(stat, value, season = '2023-24') {
  const allPlayers = buildLeaderboard(season);
  const values = allPlayers.map(p => p[stat]).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return 50;
  const below = values.filter(v => v < value).length;
  return Math.round((below / values.length) * 100);
}

// ─── Search Index ────────────────────────────────────────────────────────────
export function searchPlayers(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return Object.values(PLAYER_PROFILES)
    .filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
    .slice(0, 8);
}

// ─── Team Data ───────────────────────────────────────────────────────────────
export const TEAM_PROFILES = {
  'uconn': {
    team_id: 'uconn',
    name: 'UConn',
    abbreviation: 'UCONN',
    conference: 'Big East',
    color: '#000E2F',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 37, losses: 3, conf_wins: 17, conf_losses: 3,
        NET: 1, sos_rank: 15,
        quad1: { w: 16, l: 3 }, quad2: { w: 11, l: 0 }, quad3: { w: 6, l: 0 }, quad4: { w: 4, l: 0 },
        ortg: 121.8, drtg: 91.4, net_rtg: 30.4,
        efg_pct: 0.565, tov_pct: 13.8, orb_pct: 34.2, ftr: 0.284,
        opp_efg_pct: 0.422, opp_tov_pct: 19.6, drb_pct: 74.8, opp_ftr: 0.248,
        pace: 68.2,
      },
      '2022-23': {
        wins: 31, losses: 8, conf_wins: 15, conf_losses: 5,
        NET: 4, sos_rank: 22,
        quad1: { w: 10, l: 7 }, quad2: { w: 11, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 4, l: 0 },
        ortg: 117.4, drtg: 94.8, net_rtg: 22.6,
        efg_pct: 0.541, tov_pct: 14.4, orb_pct: 31.8, ftr: 0.298,
        opp_efg_pct: 0.444, opp_tov_pct: 18.4, drb_pct: 73.2, opp_ftr: 0.268,
        pace: 67.8,
      },
    },
  },
  'purdue': {
    team_id: 'purdue',
    name: 'Purdue',
    abbreviation: 'PUR',
    conference: 'Big Ten',
    color: '#CEB888',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 34, losses: 5, conf_wins: 15, conf_losses: 5,
        NET: 2, sos_rank: 18,
        quad1: { w: 12, l: 4 }, quad2: { w: 11, l: 1 }, quad3: { w: 7, l: 0 }, quad4: { w: 4, l: 0 },
        ortg: 119.4, drtg: 94.8, net_rtg: 24.6,
        efg_pct: 0.558, tov_pct: 14.4, orb_pct: 32.6, ftr: 0.314,
        opp_efg_pct: 0.444, opp_tov_pct: 17.2, drb_pct: 72.4, opp_ftr: 0.262,
        pace: 66.8,
      },
      '2022-23': {
        wins: 29, losses: 6, conf_wins: 14, conf_losses: 6,
        NET: 3, sos_rank: 14,
        quad1: { w: 10, l: 5 }, quad2: { w: 9, l: 1 }, quad3: { w: 7, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 116.8, drtg: 97.2, net_rtg: 19.6,
        efg_pct: 0.544, tov_pct: 15.2, orb_pct: 30.8, ftr: 0.322,
        opp_efg_pct: 0.452, opp_tov_pct: 16.4, drb_pct: 70.8, opp_ftr: 0.274,
        pace: 67.2,
      },
    },
  },
  'houston': {
    team_id: 'houston',
    name: 'Houston',
    abbreviation: 'HOU',
    conference: 'Big 12',
    color: '#C8102E',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 32, losses: 5, conf_wins: 15, conf_losses: 4,
        NET: 3, sos_rank: 8,
        quad1: { w: 14, l: 4 }, quad2: { w: 10, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 114.8, drtg: 91.2, net_rtg: 23.6,
        efg_pct: 0.528, tov_pct: 14.8, orb_pct: 36.4, ftr: 0.358,
        opp_efg_pct: 0.432, opp_tov_pct: 20.2, drb_pct: 76.2, opp_ftr: 0.262,
        pace: 64.4,
      },
      '2022-23': {
        wins: 33, losses: 4, conf_wins: 14, conf_losses: 4,
        NET: 1, sos_rank: 6,
        quad1: { w: 14, l: 3 }, quad2: { w: 11, l: 0 }, quad3: { w: 5, l: 1 }, quad4: { w: 3, l: 0 },
        ortg: 112.8, drtg: 88.4, net_rtg: 24.4,
        efg_pct: 0.514, tov_pct: 14.4, orb_pct: 38.2, ftr: 0.374,
        opp_efg_pct: 0.424, opp_tov_pct: 21.4, drb_pct: 78.4, opp_ftr: 0.248,
        pace: 63.8,
      },
    },
  },
  'duke': {
    team_id: 'duke',
    name: 'Duke',
    abbreviation: 'DUKE',
    conference: 'ACC',
    color: '#003087',
    seasons: ['2022-23', '2023-24', '2024-25'],
    stats: {
      '2024-25': {
        wins: 22, losses: 7, conf_wins: 13, conf_losses: 5,
        NET: 4, sos_rank: 6,
        quad1: { w: 10, l: 6 }, quad2: { w: 7, l: 1 }, quad3: { w: 4, l: 0 }, quad4: { w: 1, l: 0 },
        ortg: 120.4, drtg: 93.8, net_rtg: 26.6,
        efg_pct: 0.561, tov_pct: 13.4, orb_pct: 30.8, ftr: 0.292,
        opp_efg_pct: 0.438, opp_tov_pct: 18.8, drb_pct: 73.4, opp_ftr: 0.254,
        pace: 70.4,
      },
      '2023-24': {
        wins: 27, losses: 9, conf_wins: 14, conf_losses: 6,
        NET: 8, sos_rank: 12,
        quad1: { w: 10, l: 8 }, quad2: { w: 8, l: 1 }, quad3: { w: 7, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 118.4, drtg: 97.2, net_rtg: 21.2,
        efg_pct: 0.548, tov_pct: 14.8, orb_pct: 28.4, ftr: 0.274,
        opp_efg_pct: 0.454, opp_tov_pct: 17.4, drb_pct: 70.8, opp_ftr: 0.268,
        pace: 69.8,
      },
      '2022-23': {
        wins: 27, losses: 9, conf_wins: 13, conf_losses: 7,
        NET: 11, sos_rank: 10,
        quad1: { w: 10, l: 8 }, quad2: { w: 8, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 115.8, drtg: 99.4, net_rtg: 16.4,
        efg_pct: 0.528, tov_pct: 15.4, orb_pct: 26.8, ftr: 0.286,
        opp_efg_pct: 0.462, opp_tov_pct: 16.8, drb_pct: 68.4, opp_ftr: 0.278,
        pace: 71.2,
      },
    },
  },
  'tennessee': {
    team_id: 'tennessee',
    name: 'Tennessee',
    abbreviation: 'TENN',
    conference: 'SEC',
    color: '#FF8200',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 27, losses: 8, conf_wins: 14, conf_losses: 4,
        NET: 5, sos_rank: 3,
        quad1: { w: 12, l: 7 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 113.8, drtg: 90.4, net_rtg: 23.4,
        efg_pct: 0.514, tov_pct: 13.2, orb_pct: 32.8, ftr: 0.368,
        opp_efg_pct: 0.438, opp_tov_pct: 19.8, drb_pct: 75.4, opp_ftr: 0.244,
        pace: 65.8,
      },
      '2022-23': {
        wins: 25, losses: 11, conf_wins: 13, conf_losses: 5,
        NET: 7, sos_rank: 2,
        quad1: { w: 11, l: 10 }, quad2: { w: 8, l: 1 }, quad3: { w: 4, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 110.4, drtg: 92.8, net_rtg: 17.6,
        efg_pct: 0.498, tov_pct: 13.8, orb_pct: 34.2, ftr: 0.382,
        opp_efg_pct: 0.448, opp_tov_pct: 19.2, drb_pct: 74.2, opp_ftr: 0.252,
        pace: 66.2,
      },
    },
  },
  'iowa-state': {
    team_id: 'iowa-state',
    name: 'Iowa State',
    abbreviation: 'ISU',
    conference: 'Big 12',
    color: '#C8102E',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 29, losses: 8, conf_wins: 13, conf_losses: 6,
        NET: 6, sos_rank: 7,
        quad1: { w: 11, l: 7 }, quad2: { w: 10, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 116.4, drtg: 95.8, net_rtg: 20.6,
        efg_pct: 0.534, tov_pct: 15.4, orb_pct: 29.6, ftr: 0.304,
        opp_efg_pct: 0.448, opp_tov_pct: 18.2, drb_pct: 71.8, opp_ftr: 0.266,
        pace: 68.8,
      },
      '2022-23': {
        wins: 19, losses: 14, conf_wins: 9, conf_losses: 9,
        NET: 28, sos_rank: 9,
        quad1: { w: 5, l: 12 }, quad2: { w: 6, l: 2 }, quad3: { w: 5, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 111.4, drtg: 100.8, net_rtg: 10.6,
        efg_pct: 0.508, tov_pct: 16.8, orb_pct: 27.8, ftr: 0.318,
        opp_efg_pct: 0.468, opp_tov_pct: 17.2, drb_pct: 69.2, opp_ftr: 0.284,
        pace: 69.2,
      },
    },
  },
  'arizona': {
    team_id: 'arizona',
    name: 'Arizona',
    abbreviation: 'ARIZ',
    conference: 'Pac-12',
    color: '#AB0520',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 27, losses: 9, conf_wins: 14, conf_losses: 6,
        NET: 4, sos_rank: 10,
        quad1: { w: 11, l: 8 }, quad2: { w: 8, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 120.4, drtg: 97.6, net_rtg: 22.8,
        efg_pct: 0.558, tov_pct: 14.2, orb_pct: 30.4, ftr: 0.298,
        opp_efg_pct: 0.458, opp_tov_pct: 17.8, drb_pct: 71.2, opp_ftr: 0.272,
        pace: 72.4,
      },
      '2022-23': {
        wins: 28, losses: 7, conf_wins: 15, conf_losses: 5,
        NET: 6, sos_rank: 14,
        quad1: { w: 10, l: 6 }, quad2: { w: 9, l: 1 }, quad3: { w: 7, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 117.8, drtg: 96.4, net_rtg: 21.4,
        efg_pct: 0.544, tov_pct: 14.8, orb_pct: 28.8, ftr: 0.314,
        opp_efg_pct: 0.452, opp_tov_pct: 17.2, drb_pct: 69.8, opp_ftr: 0.278,
        pace: 73.2,
      },
    },
  },
  'gonzaga': {
    team_id: 'gonzaga',
    name: 'Gonzaga',
    abbreviation: 'GONZ',
    conference: 'WCC',
    color: '#002967',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 27, losses: 8, conf_wins: 15, conf_losses: 3,
        NET: 7, sos_rank: 28,
        quad1: { w: 8, l: 7 }, quad2: { w: 8, l: 1 }, quad3: { w: 8, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 121.2, drtg: 98.4, net_rtg: 22.8,
        efg_pct: 0.568, tov_pct: 14.6, orb_pct: 28.8, ftr: 0.288,
        opp_efg_pct: 0.468, opp_tov_pct: 16.4, drb_pct: 70.4, opp_ftr: 0.258,
        pace: 74.8,
      },
      '2022-23': {
        wins: 31, losses: 6, conf_wins: 17, conf_losses: 1,
        NET: 3, sos_rank: 32,
        quad1: { w: 9, l: 5 }, quad2: { w: 9, l: 1 }, quad3: { w: 9, l: 0 }, quad4: { w: 4, l: 0 },
        ortg: 122.4, drtg: 97.2, net_rtg: 25.2,
        efg_pct: 0.574, tov_pct: 13.8, orb_pct: 30.4, ftr: 0.278,
        opp_efg_pct: 0.458, opp_tov_pct: 16.8, drb_pct: 72.8, opp_ftr: 0.244,
        pace: 75.4,
      },
    },
  },
  'kansas': {
    team_id: 'kansas',
    name: 'Kansas',
    abbreviation: 'KU',
    conference: 'Big 12',
    color: '#0051A5',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 23, losses: 11, conf_wins: 10, conf_losses: 8,
        NET: 10, sos_rank: 5,
        quad1: { w: 8, l: 10 }, quad2: { w: 9, l: 1 }, quad3: { w: 4, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 116.8, drtg: 100.4, net_rtg: 16.4,
        efg_pct: 0.534, tov_pct: 15.2, orb_pct: 29.8, ftr: 0.308,
        opp_efg_pct: 0.468, opp_tov_pct: 16.8, drb_pct: 69.4, opp_ftr: 0.282,
        pace: 70.2,
      },
      '2022-23': {
        wins: 28, losses: 8, conf_wins: 14, conf_losses: 4,
        NET: 5, sos_rank: 4,
        quad1: { w: 12, l: 7 }, quad2: { w: 9, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 118.4, drtg: 98.2, net_rtg: 20.2,
        efg_pct: 0.548, tov_pct: 14.8, orb_pct: 31.2, ftr: 0.318,
        opp_efg_pct: 0.458, opp_tov_pct: 17.4, drb_pct: 71.6, opp_ftr: 0.274,
        pace: 71.4,
      },
    },
  },
  'baylor': {
    team_id: 'baylor',
    name: 'Baylor',
    abbreviation: 'BAY',
    conference: 'Big 12',
    color: '#003015',
    seasons: ['2023-24', '2024-25'],
    stats: {
      '2024-25': {
        wins: 19, losses: 10, conf_wins: 10, conf_losses: 8,
        NET: 22, sos_rank: 8,
        quad1: { w: 6, l: 9 }, quad2: { w: 7, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 1, l: 0 },
        ortg: 114.8, drtg: 100.4, net_rtg: 14.4,
        efg_pct: 0.524, tov_pct: 15.8, orb_pct: 27.4, ftr: 0.328,
        opp_efg_pct: 0.478, opp_tov_pct: 17.6, drb_pct: 69.8, opp_ftr: 0.278,
        pace: 68.4,
      },
      '2023-24': {
        wins: 24, losses: 11, conf_wins: 11, conf_losses: 7,
        NET: 12, sos_rank: 6,
        quad1: { w: 9, l: 10 }, quad2: { w: 7, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 116.4, drtg: 99.8, net_rtg: 16.6,
        efg_pct: 0.528, tov_pct: 15.2, orb_pct: 28.8, ftr: 0.338,
        opp_efg_pct: 0.464, opp_tov_pct: 17.8, drb_pct: 70.4, opp_ftr: 0.276,
        pace: 67.8,
      },
    },
  },
  'alabama': {
    team_id: 'alabama',
    name: 'Alabama',
    abbreviation: 'ALA',
    conference: 'SEC',
    color: '#9E1B32',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 25, losses: 13, conf_wins: 12, conf_losses: 6,
        NET: 15, sos_rank: 4,
        quad1: { w: 6, l: 11 }, quad2: { w: 9, l: 2 }, quad3: { w: 6, l: 0 }, quad4: { w: 4, l: 0 },
        ortg: 115.8, drtg: 101.2, net_rtg: 14.6,
        efg_pct: 0.518, tov_pct: 17.4, orb_pct: 31.4, ftr: 0.354,
        opp_efg_pct: 0.468, opp_tov_pct: 17.2, drb_pct: 68.8, opp_ftr: 0.286,
        pace: 73.8,
      },
      '2022-23': {
        wins: 21, losses: 13, conf_wins: 10, conf_losses: 8,
        NET: 19, sos_rank: 6,
        quad1: { w: 5, l: 12 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 112.4, drtg: 103.8, net_rtg: 8.6,
        efg_pct: 0.498, tov_pct: 18.2, orb_pct: 29.8, ftr: 0.368,
        opp_efg_pct: 0.478, opp_tov_pct: 16.8, drb_pct: 67.4, opp_ftr: 0.292,
        pace: 74.2,
      },
    },
  },
  'kentucky': {
    team_id: 'kentucky',
    name: 'Kentucky',
    abbreviation: 'UK',
    conference: 'SEC',
    color: '#0033A0',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 23, losses: 14, conf_wins: 12, conf_losses: 6,
        NET: 20, sos_rank: 2,
        quad1: { w: 7, l: 13 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 113.4, drtg: 101.8, net_rtg: 11.6,
        efg_pct: 0.512, tov_pct: 15.8, orb_pct: 29.2, ftr: 0.342,
        opp_efg_pct: 0.474, opp_tov_pct: 16.4, drb_pct: 69.2, opp_ftr: 0.288,
        pace: 69.4,
      },
      '2022-23': {
        wins: 22, losses: 11, conf_wins: 11, conf_losses: 7,
        NET: 16, sos_rank: 3,
        quad1: { w: 8, l: 10 }, quad2: { w: 7, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 115.8, drtg: 100.4, net_rtg: 15.4,
        efg_pct: 0.528, tov_pct: 15.2, orb_pct: 30.8, ftr: 0.338,
        opp_efg_pct: 0.464, opp_tov_pct: 16.8, drb_pct: 70.4, opp_ftr: 0.278,
        pace: 70.8,
      },
    },
  },
  'michigan-st': {
    team_id: 'michigan-st',
    name: 'Michigan St.',
    abbreviation: 'MSU',
    conference: 'Big Ten',
    color: '#18453B',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 20, losses: 14, conf_wins: 10, conf_losses: 10,
        NET: 25, sos_rank: 16,
        quad1: { w: 5, l: 13 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 110.8, drtg: 99.4, net_rtg: 11.4,
        efg_pct: 0.504, tov_pct: 16.2, orb_pct: 28.4, ftr: 0.298,
        opp_efg_pct: 0.468, opp_tov_pct: 16.2, drb_pct: 69.8, opp_ftr: 0.272,
        pace: 68.2,
      },
      '2022-23': {
        wins: 21, losses: 13, conf_wins: 10, conf_losses: 10,
        NET: 22, sos_rank: 14,
        quad1: { w: 6, l: 12 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 113.8, drtg: 101.4, net_rtg: 12.4,
        efg_pct: 0.518, tov_pct: 15.8, orb_pct: 29.8, ftr: 0.314,
        opp_efg_pct: 0.472, opp_tov_pct: 16.8, drb_pct: 70.2, opp_ftr: 0.278,
        pace: 69.4,
      },
    },
  },
  'virginia': {
    team_id: 'virginia',
    name: 'Virginia',
    abbreviation: 'UVA',
    conference: 'ACC',
    color: '#232D4B',
    seasons: ['2022-23', '2023-24'],
    stats: {
      '2023-24': {
        wins: 18, losses: 14, conf_wins: 9, conf_losses: 11,
        NET: 42, sos_rank: 11,
        quad1: { w: 3, l: 13 }, quad2: { w: 8, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 109.4, drtg: 98.2, net_rtg: 11.2,
        efg_pct: 0.494, tov_pct: 14.8, orb_pct: 24.8, ftr: 0.274,
        opp_efg_pct: 0.454, opp_tov_pct: 18.4, drb_pct: 72.8, opp_ftr: 0.252,
        pace: 63.4,
      },
      '2022-23': {
        wins: 25, losses: 8, conf_wins: 14, conf_losses: 6,
        NET: 9, sos_rank: 8,
        quad1: { w: 9, l: 7 }, quad2: { w: 8, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 2, l: 0 },
        ortg: 112.8, drtg: 95.6, net_rtg: 17.2,
        efg_pct: 0.508, tov_pct: 14.4, orb_pct: 25.8, ftr: 0.284,
        opp_efg_pct: 0.448, opp_tov_pct: 18.8, drb_pct: 74.2, opp_ftr: 0.248,
        pace: 62.8,
      },
    },
  },
  'rutgers': {
    team_id: 'rutgers',
    name: 'Rutgers',
    abbreviation: 'RUT',
    conference: 'Big Ten',
    color: '#CC0033',
    seasons: ['2023-24', '2024-25'],
    stats: {
      '2024-25': {
        wins: 18, losses: 11, conf_wins: 10, conf_losses: 10,
        NET: 38, sos_rank: 20,
        quad1: { w: 4, l: 10 }, quad2: { w: 7, l: 1 }, quad3: { w: 6, l: 0 }, quad4: { w: 1, l: 0 },
        ortg: 113.4, drtg: 101.8, net_rtg: 11.6,
        efg_pct: 0.508, tov_pct: 16.8, orb_pct: 27.2, ftr: 0.318,
        opp_efg_pct: 0.478, opp_tov_pct: 17.2, drb_pct: 68.4, opp_ftr: 0.282,
        pace: 71.8,
      },
      '2023-24': {
        wins: 16, losses: 16, conf_wins: 8, conf_losses: 12,
        NET: 58, sos_rank: 18,
        quad1: { w: 2, l: 15 }, quad2: { w: 6, l: 1 }, quad3: { w: 5, l: 0 }, quad4: { w: 3, l: 0 },
        ortg: 107.8, drtg: 105.2, net_rtg: 2.6,
        efg_pct: 0.488, tov_pct: 17.4, orb_pct: 25.8, ftr: 0.324,
        opp_efg_pct: 0.492, opp_tov_pct: 16.8, drb_pct: 67.2, opp_ftr: 0.288,
        pace: 70.8,
      },
    },
  },
};

// ─── Team Helpers ─────────────────────────────────────────────────────────────
export function buildTeamLeaderboard(season = '2023-24') {
  return Object.values(TEAM_PROFILES)
    .filter(t => t.stats[season])
    .map(t => ({ ...t, ...t.stats[season], season }))
    .sort((a, b) => b.net_rtg - a.net_rtg);
}

export function getTeamRoster(teamId, season) {
  const team = TEAM_PROFILES[teamId];
  if (!team) return [];
  return Object.values(PLAYER_PROFILES)
    .filter(p => p.team === team.name && p.stats[season])
    .map(p => ({ ...p, ...p.stats[season], season }));
}

export function getTeamGameLog(teamId, season) {
  const team = TEAM_PROFILES[teamId];
  if (!team || !team.stats[season]) return [];
  const s = team.stats[season];
  const total = s.wins + s.losses;
  const gameCount = Math.min(total, 20);
  const c0 = team.name.charCodeAt(0);

  const opponents = [
    'Michigan St.', 'Iowa', 'Indiana', 'Northwestern', 'Wisconsin',
    'Ohio St.', 'Penn St.', 'Minnesota', 'Nebraska', 'Maryland',
    'Illinois', 'Kansas', 'Houston', 'Tennessee', 'Duke',
    'Kentucky', 'Arizona', 'Iowa State', 'Gonzaga', 'Baylor',
  ];

  return Array.from({ length: gameCount }, (_, i) => {
    const isWin = ((i * 1013 + c0 * 31) % total) < s.wins;
    const ortg_game = Math.round(s.ortg + Math.sin(i * 5.1) * 9);
    const drtg_game = Math.round(s.drtg + Math.sin(i * 6.3) * 8);
    const tScore = isWin
      ? 72 + Math.round(Math.abs(Math.sin(i * 3.7) * 12))
      : 68 - Math.round(Math.abs(Math.sin(i * 4.1) * 6));
    const oScore = isWin
      ? tScore - Math.round(Math.abs(Math.sin(i * 2.9) * 7) + 2)
      : tScore + Math.round(Math.abs(Math.sin(i * 3.3) * 9) + 2);
    return {
      game: i + 1,
      date: new Date(2024, 10 + Math.floor(i / 5), (i % 5) * 6 + 2)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      opponent: opponents[i % opponents.length],
      location: ['H', 'A', 'N'][i % 3],
      result: isWin ? 'W' : 'L',
      score: `${tScore}–${oScore}`,
      margin: tScore - oScore,
      ortg: ortg_game,
      drtg: drtg_game,
      net: ortg_game - drtg_game,
    };
  });
}

export function getTeamPercentile(stat, value, season = '2023-24', higherIsBetter = true) {
  const allTeams = buildTeamLeaderboard(season);
  const values = allTeams.map(t => t[stat]).filter(v => v != null);
  if (values.length === 0) return 50;
  const below = values.filter(v => v < value).length;
  const raw = Math.round((below / values.length) * 100);
  return higherIsBetter ? raw : 100 - raw;
}

export function searchTeams(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return Object.values(TEAM_PROFILES)
    .filter(t => t.name.toLowerCase().includes(q) || t.conference.toLowerCase().includes(q))
    .slice(0, 6);
}
