import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchTeamProfile, fetchTeamRoster, fetchTeamGames } from '../api/teams';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teamAbbr(name) {
  if (!name) return '??';
  const words = name.split(/\s+/).filter(w => !/^(the|of|at|&)$/i.test(w));
  if (words.length === 1) return name.slice(0, 4).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.7rem', fontWeight: 500,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
        letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '0.68rem', color: 'var(--accent)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PercentileBar({ label, value, pct, format, note }) {
  const safePct = pct ?? 50;
  const color = safePct >= 80 ? '#4ADE80' : safePct >= 60 ? '#E8A030' : safePct >= 40 ? '#7D9AB4' : '#F87171';
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            {label}
          </span>
          {note && (
            <span style={{ fontSize: '0.60rem', color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {note}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {format(value)}
          </span>
          {pct != null && (
            <span style={{ fontSize: '0.68rem', color, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              {safePct}th
            </span>
          )}
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${safePct}%`, height: '100%',
          background: color, borderRadius: '2px',
          transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '0.78rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>Game {label}</div>
      {payload.map(entry => (
        <div key={entry.name} style={{ color: entry.color, fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
          {entry.name}: {Number(entry.value).toFixed(1)}
        </div>
      ))}
    </div>
  );
};

// ─── Column definitions ────────────────────────────────────────────────────────

const GAME_LOG_COLS = [
  { id: 'game',   header: '#',     accessorFn: r => r.game,     cell: i => <span style={{ color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{i.getValue()}</span> },
  { id: 'date',   header: 'Date',  accessorFn: r => r.date,     cell: i => <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'opp',    header: 'Opp',   accessorFn: r => r.opponent, cell: i => <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{i.getValue()}</span> },
  { id: 'loc',    header: 'H/A',   accessorFn: r => r.location, cell: i => <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{i.getValue()}</span> },
  { id: 'result', header: 'W/L',   accessorFn: r => r.result,   cell: i => <span style={{ color: i.getValue() === 'W' ? 'var(--positive)' : 'var(--negative)', fontWeight: 700, fontSize: '0.78rem' }}>{i.getValue()}</span> },
  { id: 'score',  header: 'Score', accessorFn: r => r.score,    cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue()}</span> },
  { id: 'margin', header: 'MOV',   accessorFn: r => r.margin,   cell: i => {
    const v = i.getValue();
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color: v > 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 500 }}>{v > 0 ? `+${v}` : v}</span>;
  }},
  { id: 'ortg',   header: 'ORTG',  accessorFn: r => r.ortg,     cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue() != null ? Number(i.getValue()).toFixed(1) : '—'}</span> },
  { id: 'drtg',   header: 'DRTG',  accessorFn: r => r.drtg,     cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue() != null ? Number(i.getValue()).toFixed(1) : '—'}</span> },
  { id: 'net',    header: 'NET',   accessorFn: r => r.net,      cell: i => {
    const v = i.getValue();
    if (v == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const color = v >= 15 ? 'var(--positive)' : v >= 0 ? 'var(--text-secondary)' : 'var(--negative)';
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color, fontWeight: 500 }}>{v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}</span>;
  }},
];

// Roster uses API field names (pts/reb/ast, ts_pct already 0–100)
const ROSTER_COLS = [
  { id: 'name',          header: 'Player',  accessorFn: r => r.name,           cell: null },  // handled specially
  { id: 'position',      header: 'Pos',     accessorFn: r => r.position,        cell: i => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{i.getValue()}</span> },
  { id: 'mpg',           header: 'MPG',     accessorFn: r => r.mpg,             cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'pts',           header: 'PPG',     accessorFn: r => r.pts,             cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'reb',           header: 'RPG',     accessorFn: r => r.reb,             cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'ast',           header: 'APG',     accessorFn: r => r.ast,             cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'bpm',           header: 'BPM',     accessorFn: r => r.bpm,             cell: i => {
    const v = i.getValue();
    const color = v >= 6 ? 'var(--positive)' : v >= 2 ? '#E8A030' : 'var(--text-secondary)';
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color, fontWeight: 500 }}>{v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—'}</span>;
  }},
  { id: 'ts_pct',        header: 'TS%',     accessorFn: r => r.ts_pct,          cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue() != null ? `${i.getValue().toFixed(1)}%` : '—'}</span> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamProfilePage({ teamId, season: globalSeason, onNavigate }) {
  const [profile, setProfile]             = useState(null);
  const [roster, setRoster]               = useState([]);
  const [games, setGames]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [source, setSource]               = useState('api');
  const [selectedSeason, setSelectedSeason] = useState(globalSeason ?? '2024-25');
  const [glSorting, setGlSorting]         = useState([]);

  // Load profile on mount (or when teamId changes)
  useEffect(() => {
    setProfile(null);
    setRoster([]);
    setGames([]);
    setLoading(true);

    fetchTeamProfile(teamId).then(({ team, source }) => {
      if (!team) { setLoading(false); return; }
      setProfile(team);
      setSource(source);
      // If current season not available, pick the latest
      if (team.seasons?.length && !team.seasons.includes(selectedSeason)) {
        setSelectedSeason(team.seasons[team.seasons.length - 1]);
      }
      setLoading(false);
    });
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load roster + games whenever season or profile changes
  useEffect(() => {
    if (!profile) return;
    fetchTeamRoster(teamId, selectedSeason).then(({ roster }) => setRoster(roster));
    fetchTeamGames(teamId, selectedSeason).then(({ games }) => setGames(games));
  }, [teamId, selectedSeason, profile]);

  // Trend chart: 5-game rolling avg of ORTG / DRTG
  const trendData = useMemo(() => {
    return games.map((g, i) => {
      const window = games.slice(Math.max(0, i - 2), i + 3);
      const ov = window.filter(x => x.ortg != null);
      const dv = window.filter(x => x.drtg != null);
      return {
        game: g.game,
        ORTG: ov.length ? parseFloat((ov.reduce((s, x) => s + x.ortg, 0) / ov.length).toFixed(1)) : null,
        DRTG: dv.length ? parseFloat((dv.reduce((s, x) => s + x.drtg, 0) / dv.length).toFixed(1)) : null,
      };
    });
  }, [games]);

  const gamesReversed = useMemo(() => [...games].reverse(), [games]);

  const glColumns = useMemo(() => GAME_LOG_COLS.map(col => ({
    id: col.id, header: col.header, accessorFn: col.accessorFn, cell: col.cell,
  })), []); // eslint-disable-line react-hooks/exhaustive-deps

  const glTable = useReactTable({
    data: gamesReversed,
    columns: glColumns,
    state: { sorting: glSorting },
    onSortingChange: setGlSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const rosterColumns = useMemo(() => ROSTER_COLS.map(col => {
    if (col.id === 'name') {
      return {
        id: 'name', header: 'Player', accessorFn: r => r.name,
        cell: info => (
          <button
            onClick={() => onNavigate('player', info.row.original.player_id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
              {info.getValue()}
            </div>
            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              {info.row.original.year_in_school}
            </div>
          </button>
        ),
      };
    }
    return { id: col.id, header: col.header, accessorFn: col.accessorFn, cell: col.cell };
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const rosterTable = useReactTable({
    data: roster,
    columns: rosterColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: 'mpg', desc: true }] },
  });

  // ─── Loading / not-found states ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <p style={{ color: 'var(--text-muted)', padding: '60px 0', textAlign: 'center' }}>Loading team profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-content">
        <div className="container">
          <p style={{ color: 'var(--text-muted)' }}>Team not found.</p>
        </div>
      </div>
    );
  }

  // ─── Derived display values ────────────────────────────────────────────────

  const abbr = profile._abbreviation || teamAbbr(profile.name);
  const availableSeasons = profile.seasons ?? [];
  const stats = profile.stats?.[selectedSeason];

  const fmtDec  = v => v != null ? v.toFixed(1) : '—';
  const fmtPct1 = v => v != null ? `${v.toFixed(1)}%` : '—';
  const fmtNet  = v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—';
  const fmtProb = v => v != null ? v.toFixed(3) : '—';

  const getPct = stat => stats?.percentiles?.[stat] ?? null;

  return (
    <div className="page-content">
      <div className="container">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => onNavigate('teams')}
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Teams
          </button>
          <span style={{ color: 'var(--text-disabled)' }}>›</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{profile.name}</span>
          {source === 'mock' && (
            <span className="chip" style={{ fontSize: '0.62rem', color: 'var(--text-disabled)', marginLeft: '4px' }}>demo</span>
          )}
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px', marginBottom: '28px',
        }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Shield */}
            <div style={{
              width: '72px', height: '72px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-dim)', border: '2px solid var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '1rem', letterSpacing: '0.04em',
                color: 'var(--accent)', textTransform: 'uppercase',
              }}>
                {abbr}
              </span>
            </div>

            {/* Team Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: '2rem',
                  fontWeight: 800, letterSpacing: '-0.02em',
                  color: 'var(--text-primary)', lineHeight: 1,
                }}>
                  {profile.name}
                </h1>
                {stats?.wins != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {stats.wins}–{stats.losses}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {profile.conference}
                </span>
                {stats?.wab != null && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    WAB {stats.wab > 0 ? `+${stats.wab.toFixed(1)}` : stats.wab.toFixed(1)}
                  </span>
                </>}
                {stats?.seed != null && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Seed {Math.round(stats.seed)}
                  </span>
                </>}
              </div>
            </div>

            {/* Season Selector */}
            <div style={{ flexShrink: 0 }}>
              <div className="section-label" style={{ textAlign: 'right' }}>Season</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {availableSeasons.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 'var(--radius)',
                      border: '1px solid', fontSize: '0.76rem',
                      fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
                      transition: 'all var(--transition)',
                      background: selectedSeason === s ? 'var(--accent-dim)' : 'transparent',
                      borderColor: selectedSeason === s ? 'var(--accent-glow)' : 'var(--border)',
                      color: selectedSeason === s ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <>
            {/* Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '12px', marginBottom: '28px',
            }}>
              <StatCard label="Net Rtg"  value={fmtNet(stats.net_rtg)}   accent />
              <StatCard label="ORTG"     value={fmtDec(stats.ortg)} />
              <StatCard label="DRTG"     value={fmtDec(stats.drtg)} />
              <StatCard label="Pace"     value={fmtDec(stats.pace)} />
              <StatCard label="O-eFG%"   value={fmtPct1(stats.efg_pct)} />
              <StatCard label="D-eFG%"   value={fmtPct1(stats.opp_efg_pct)} />
              <StatCard label="Win%"     value={stats.wins != null ? `${((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)}%` : '—'} />
              <StatCard label="Barthag"  value={fmtProb(stats.barthag)} />
            </div>

            {/* Two-Column: Percentile Bars + Trend Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Percentile Rankings */}
              <div className="card">
                <div className="section-label">Efficiency Profile · {selectedSeason}</div>
                <PercentileBar label="Net Rtg"  value={stats.net_rtg}     format={fmtNet}  pct={getPct('net_rtg')} />
                <PercentileBar label="ORTG"      value={stats.ortg}        format={fmtDec}  pct={getPct('ortg')} />
                <PercentileBar label="DRTG"      value={stats.drtg}        format={fmtDec}  pct={getPct('drtg')}   note="lower=better" />
                <PercentileBar label="O-eFG%"    value={stats.efg_pct}     format={fmtPct1} pct={getPct('efg_pct')} />
                <PercentileBar label="D-eFG%"    value={stats.opp_efg_pct} format={fmtPct1} pct={getPct('opp_efg_pct')} note="lower=better" />
                <PercentileBar label="ORB%"      value={stats.orb_pct}     format={fmtPct1} pct={getPct('orb_pct')} />
              </div>

              {/* Efficiency Trend Chart */}
              <div className="card">
                <div className="section-label">Efficiency Trend · {selectedSeason}</div>
                {games.length > 0 ? (
                  <>
                    <ResponsiveContainer key={`${selectedSeason}-${teamId}`} width="100%" height={230}>
                      <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis
                          dataKey="game"
                          tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                          axisLine={false} tickLine={false}
                          label={{ value: 'Game', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'var(--text-disabled)' }}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                          axisLine={false} tickLine={false}
                        />
                        <ReferenceLine y={stats.ortg} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <ReferenceLine y={stats.drtg} stroke="var(--teal)"   strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="ORTG" stroke="var(--accent)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                        <Line type="monotone" dataKey="DRTG" stroke="var(--teal)"   strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      {[{ label: 'ORTG', color: 'var(--accent)' }, { label: 'DRTG', color: 'var(--teal)' }].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '16px', height: '2px', background: item.color, borderRadius: '1px' }} />
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</span>
                        </div>
                      ))}
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-disabled)', marginLeft: 'auto' }}>
                        5-game rolling avg
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No game data for this season
                  </div>
                )}
              </div>
            </div>

            {/* Four Factors */}
            <div className="card" style={{ marginBottom: '28px' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>Four Factors · {selectedSeason}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '12px' }}>
                    Offense
                  </div>
                  {[
                    { key: 'efg_pct', label: 'eFG%',  fmt: fmtPct1, note: undefined },
                    { key: 'tov_pct', label: 'TOV%',  fmt: fmtPct1, note: 'lower=better' },
                    { key: 'orb_pct', label: 'ORB%',  fmt: fmtPct1, note: undefined },
                    { key: 'ftr',     label: 'FTR',   fmt: fmtDec,  note: undefined },
                  ].map(({ key, label, fmt, note }) => (
                    <PercentileBar key={key} label={label} value={stats[key]} format={fmt} note={note} pct={getPct(key)} />
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '12px' }}>
                    Defense
                  </div>
                  {[
                    { key: 'opp_efg_pct', label: 'D-eFG%', fmt: fmtPct1, note: 'lower=better' },
                    { key: 'opp_tov_pct', label: 'D-TOV%', fmt: fmtPct1, note: undefined },
                    { key: 'drb_pct',     label: 'DRB%',   fmt: fmtPct1, note: undefined },
                    { key: 'opp_ftr',     label: 'D-FTR',  fmt: fmtDec,  note: 'lower=better' },
                  ].map(({ key, label, fmt, note }) => (
                    <PercentileBar key={key} label={label} value={stats[key]} format={fmt} note={note} pct={getPct(key)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Roster */}
            {roster.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Roster
                  </h2>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{roster.length} players · {selectedSeason}</span>
                </div>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="stat-table">
                      <thead>
                        {rosterTable.getHeaderGroups().map(hg => (
                          <tr key={hg.id}>
                            {hg.headers.map(h => (
                              <th key={h.id} onClick={h.column.getToggleSortingHandler()} className={h.column.getIsSorted() ? 'sorted' : ''} style={{ cursor: 'pointer' }}>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                                {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {rosterTable.getRowModel().rows.map(row => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Game Log */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Game Log
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{selectedSeason} · most recent first</span>
              </div>
              {games.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', padding: '16px 0' }}>No game log data for this season.</p>
              ) : (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="stat-table">
                      <thead>
                        {glTable.getHeaderGroups().map(hg => (
                          <tr key={hg.id}>
                            {hg.headers.map(h => (
                              <th key={h.id} onClick={h.column.getToggleSortingHandler()} className={h.column.getIsSorted() ? 'sorted' : ''}>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                                {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {glTable.getRowModel().rows.map(row => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Showing {glTable.getRowModel().rows.length} of {games.length} games
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost" onClick={() => glTable.previousPage()} disabled={!glTable.getCanPreviousPage()} style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanPreviousPage() ? 0.3 : 1 }}>← Prev</button>
                      <button className="btn btn-ghost" onClick={() => glTable.nextPage()} disabled={!glTable.getCanNextPage()} style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanNextPage() ? 0.3 : 1 }}>Next →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
