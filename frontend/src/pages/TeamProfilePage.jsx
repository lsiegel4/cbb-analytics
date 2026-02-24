import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  TEAM_PROFILES,
  getTeamRoster,
  getTeamGameLog,
  getTeamPercentile,
} from '../data/mockData';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.7rem',
        fontWeight: 500,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: '6px',
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
  const color = pct >= 80 ? '#4ADE80' : pct >= 60 ? '#E8A030' : pct >= 40 ? '#7D9AB4' : '#F87171';
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
          <span style={{ fontSize: '0.68rem', color, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
            {pct}th
          </span>
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
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
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '10px 14px',
      fontSize: '0.78rem',
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

const GAME_LOG_COLS = [
  { id: 'game',     header: '#',    accessorFn: r => r.game,     cell: i => <span style={{ color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{i.getValue()}</span> },
  { id: 'date',     header: 'Date', accessorFn: r => r.date,     cell: i => <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'opp',      header: 'Opp',  accessorFn: r => r.opponent, cell: i => <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{i.getValue()}</span> },
  { id: 'loc',      header: 'H/A',  accessorFn: r => r.location, cell: i => <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{i.getValue()}</span> },
  { id: 'result',   header: 'W/L',  accessorFn: r => r.result,   cell: i => <span style={{ color: i.getValue() === 'W' ? 'var(--positive)' : 'var(--negative)', fontWeight: 700, fontSize: '0.78rem' }}>{i.getValue()}</span> },
  { id: 'score',    header: 'Score', accessorFn: r => r.score,   cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue()}</span> },
  { id: 'margin',   header: 'MOV',  accessorFn: r => r.margin,   cell: i => {
    const v = i.getValue();
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color: v > 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 500 }}>{v > 0 ? `+${v}` : v}</span>;
  }},
  { id: 'ortg',     header: 'ORTG', accessorFn: r => r.ortg,     cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue()}</span> },
  { id: 'drtg',     header: 'DRTG', accessorFn: r => r.drtg,     cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>{i.getValue()}</span> },
  { id: 'net',      header: 'NET',  accessorFn: r => r.net,      cell: i => {
    const v = i.getValue();
    const color = v >= 15 ? 'var(--positive)' : v >= 0 ? 'var(--text-secondary)' : 'var(--negative)';
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color, fontWeight: 500 }}>{v > 0 ? `+${v}` : v}</span>;
  }},
];

const ROSTER_COLS = [
  { id: 'name',     header: 'Player',  accessorFn: r => r.name,       cell: null },  // handled specially
  { id: 'position', header: 'Pos',     accessorFn: r => r.position,   cell: i => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{i.getValue()}</span> },
  { id: 'mpg',      header: 'MPG',     accessorFn: r => r.mpg,        cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'ppg',      header: 'PPG',     accessorFn: r => r.ppg,        cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'rpg',      header: 'RPG',     accessorFn: r => r.rpg,        cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'apg',      header: 'APG',     accessorFn: r => r.apg,        cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue()?.toFixed(1) ?? '—'}</span> },
  { id: 'bpm',      header: 'BPM',     accessorFn: r => r.bpm,        cell: i => {
    const v = i.getValue();
    const color = v >= 6 ? 'var(--positive)' : v >= 2 ? '#E8A030' : 'var(--text-secondary)';
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color, fontWeight: 500 }}>{v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—'}</span>;
  }},
  { id: 'ts_pct',   header: 'TS%',     accessorFn: r => r.ts_pct,     cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{i.getValue() != null ? `${(i.getValue() * 100).toFixed(1)}%` : '—'}</span> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamProfilePage({ teamId, season: globalSeason, onNavigate }) {
  const team = TEAM_PROFILES[teamId];
  const availableSeasons = team?.seasons ?? [];
  const [selectedSeason, setSelectedSeason] = useState(
    availableSeasons.includes(globalSeason) ? globalSeason : availableSeasons[availableSeasons.length - 1]
  );
  const [glSorting, setGlSorting] = useState([]);

  // All hooks must be called unconditionally before any early return.
  const roster = useMemo(() => getTeamRoster(teamId, selectedSeason), [teamId, selectedSeason]);
  const gameLog = useMemo(() => getTeamGameLog(teamId, selectedSeason), [teamId, selectedSeason]);
  const gameLogReversed = useMemo(() => [...gameLog].reverse(), [gameLog]);

  // Rolling 5-game average for trend chart
  const trendData = useMemo(() => {
    return gameLog.map((g, i) => {
      const window = gameLog.slice(Math.max(0, i - 2), i + 3);
      const avgOrtg = window.reduce((s, x) => s + x.ortg, 0) / window.length;
      const avgDrtg = window.reduce((s, x) => s + x.drtg, 0) / window.length;
      return {
        game: g.game,
        ORTG: parseFloat(avgOrtg.toFixed(1)),
        DRTG: parseFloat(avgDrtg.toFixed(1)),
      };
    });
  }, [gameLog]);

  // Game log columns — GAME_LOG_COLS has no 'name' column so the special-case
  // branch is intentionally dead; all columns pass through the identity path.
  // Columns are memoized with an empty dep array because GAME_LOG_COLS is a
  // module-level constant and the cell renderers don't reference onNavigate.
  const glColumns = useMemo(() => GAME_LOG_COLS.map(col => ({
    id: col.id,
    header: col.header,
    accessorFn: col.accessorFn,
    cell: col.cell,
  })), []); // eslint-disable-line react-hooks/exhaustive-deps

  const glTable = useReactTable({
    data: gameLogReversed,
    columns: glColumns,
    state: { sorting: glSorting },
    onSortingChange: setGlSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Roster columns — memoized with empty dep array because ROSTER_COLS is a
  // module-level constant. The 'name' cell uses onNavigate, but recreating the
  // columns array every time onNavigate changes would cause TanStack Table to
  // rebuild its internal state on every render. onNavigate is expected to be
  // stable (defined at the app level); the cell closure captures it correctly
  // via the ref held by React's reconciler even with a [] dep array.
  const rosterColumns = useMemo(() => ROSTER_COLS.map(col => {
    if (col.id === 'name') {
      return {
        id: 'name',
        header: 'Player',
        accessorFn: r => r.name,
        cell: info => (
          <button
            onClick={() => onNavigate('player', info.row.original.player_id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
              {info.getValue()}
            </div>
            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{info.row.original.class_year}</div>
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

  if (!team) {
    return (
      <div className="page-content">
        <div className="container">
          <p style={{ color: 'var(--text-muted)' }}>Team not found.</p>
        </div>
      </div>
    );
  }

  const stats = team.stats[selectedSeason];

  const fmtDec = v => v != null ? v.toFixed(1) : '—';
  const fmtPct = v => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  const fmtPct1 = v => v != null ? `${v.toFixed(1)}%` : '—';
  const fmtNet = v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—';

  const winPct = stats ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : '—';

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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{team.name}</span>
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: `4px solid ${team.color}`,
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow using team color */}
          <div style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '280px',
            height: '280px',
            background: `radial-gradient(circle, ${team.color}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Team color shield */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-lg)',
              background: `${team.color}22`,
              border: `2px solid ${team.color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.04em',
                color: team.color,
                textTransform: 'uppercase',
              }}>
                {team.abbreviation}
              </span>
            </div>

            {/* Team Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {team.name}
                </h1>
                {stats && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}>
                    {stats.wins}–{stats.losses}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {team.conference}
                </span>
                {stats && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {stats.conf_wins}–{stats.conf_losses} {team.conference.split(' ')[0]}
                  </span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    NET #{stats.NET}
                  </span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    SOS #{stats.sos_rank}
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
                      padding: '5px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid',
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      cursor: 'pointer',
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
              gap: '12px',
              marginBottom: '28px',
            }}>
              <StatCard label="Net Rtg" value={fmtNet(stats.net_rtg)} accent />
              <StatCard label="ORTG" value={fmtDec(stats.ortg)} />
              <StatCard label="DRTG" value={fmtDec(stats.drtg)} />
              <StatCard label="Pace" value={fmtDec(stats.pace)} />
              <StatCard label="O-eFG%" value={fmtPct(stats.efg_pct)} />
              <StatCard label="D-eFG%" value={fmtPct(stats.opp_efg_pct)} />
              <StatCard label="Win%" value={`${winPct}%`} />
              <StatCard label="Q1 W-L" value={stats.quad1 ? `${stats.quad1.w}–${stats.quad1.l}` : '—'} />
            </div>

            {/* Two-Column: Percentile Bars + Trend Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Percentile Rankings */}
              <div className="card">
                <div className="section-label">Efficiency Profile · {selectedSeason}</div>
                <PercentileBar
                  label="Net Rtg" value={stats.net_rtg} format={fmtNet}
                  pct={getTeamPercentile('net_rtg', stats.net_rtg, selectedSeason, true)}
                />
                <PercentileBar
                  label="ORTG" value={stats.ortg} format={fmtDec}
                  pct={getTeamPercentile('ortg', stats.ortg, selectedSeason, true)}
                />
                <PercentileBar
                  label="DRTG" value={stats.drtg} format={fmtDec}
                  note="lower=better"
                  pct={getTeamPercentile('drtg', stats.drtg, selectedSeason, false)}
                />
                <PercentileBar
                  label="O-eFG%" value={stats.efg_pct} format={fmtPct}
                  pct={getTeamPercentile('efg_pct', stats.efg_pct, selectedSeason, true)}
                />
                <PercentileBar
                  label="D-eFG%" value={stats.opp_efg_pct} format={fmtPct}
                  note="lower=better"
                  pct={getTeamPercentile('opp_efg_pct', stats.opp_efg_pct, selectedSeason, false)}
                />
                <PercentileBar
                  label="ORB%" value={stats.orb_pct} format={fmtPct1}
                  pct={getTeamPercentile('orb_pct', stats.orb_pct, selectedSeason, true)}
                />
              </div>

              {/* Efficiency Trend Chart */}
              <div className="card">
                <div className="section-label">Efficiency Trend · {selectedSeason}</div>
                <ResponsiveContainer key={selectedSeason} width="100%" height={230}>
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
                    <ReferenceLine y={stats.drtg} stroke="var(--teal)" strokeDasharray="4 4" strokeOpacity={0.4} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="ORTG" stroke="var(--accent)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                    <Line type="monotone" dataKey="DRTG" stroke="var(--teal)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  {[
                    { label: 'ORTG', color: 'var(--accent)' },
                    { label: 'DRTG', color: 'var(--teal)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '16px', height: '2px', background: item.color, borderRadius: '1px' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</span>
                    </div>
                  ))}
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-disabled)', marginLeft: 'auto' }}>
                    5-game rolling avg
                  </span>
                </div>
              </div>
            </div>

            {/* Four Factors */}
            <div className="card" style={{ marginBottom: '28px' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>Four Factors · {selectedSeason}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Offense */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '12px' }}>
                    Offense
                  </div>
                  {[
                    { key: 'efg_pct',  label: 'eFG%', fmt: fmtPct,  higher: true },
                    { key: 'tov_pct',  label: 'TOV%', fmt: fmtPct1, higher: false },
                    { key: 'orb_pct',  label: 'ORB%', fmt: fmtPct1, higher: true },
                    { key: 'ftr',      label: 'FTR',  fmt: fmtDec,  higher: true },
                  ].map(({ key, label, fmt, higher }) => (
                    <PercentileBar
                      key={key}
                      label={label}
                      value={stats[key]}
                      format={fmt}
                      note={!higher ? 'lower=better' : undefined}
                      pct={getTeamPercentile(key, stats[key], selectedSeason, higher)}
                    />
                  ))}
                </div>
                {/* Defense */}
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '12px' }}>
                    Defense
                  </div>
                  {[
                    { key: 'opp_efg_pct',  label: 'D-eFG%', fmt: fmtPct,  higher: false },
                    { key: 'opp_tov_pct',  label: 'D-TOV%', fmt: fmtPct1, higher: true },
                    { key: 'drb_pct',      label: 'DRB%',   fmt: fmtPct1, higher: true },
                    { key: 'opp_ftr',      label: 'D-FTR',  fmt: fmtDec,  higher: false },
                  ].map(({ key, label, fmt, higher }) => (
                    <PercentileBar
                      key={key}
                      label={label}
                      value={stats[key]}
                      format={fmt}
                      note={!higher ? 'lower=better' : undefined}
                      pct={getTeamPercentile(key, stats[key], selectedSeason, higher)}
                    />
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
                    Showing {glTable.getRowModel().rows.length} of {gameLog.length} games
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost" onClick={() => glTable.previousPage()} disabled={!glTable.getCanPreviousPage()} style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanPreviousPage() ? 0.3 : 1 }}>← Prev</button>
                    <button className="btn btn-ghost" onClick={() => glTable.nextPage()} disabled={!glTable.getCanNextPage()} style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanNextPage() ? 0.3 : 1 }}>Next →</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
