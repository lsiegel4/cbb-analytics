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
import { fetchPlayerProfile, fetchPlayerGames, getMockSimilarPlayers } from '../api/players';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
const fmtDec  = v => v != null ? v.toFixed(1) : '—';
const fmtBpm  = v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—';
const fmtPct  = v => v != null ? `${(v * 100).toFixed(1)}%` : '—';  // 0–1 decimal
const fmtPctX = v => v != null ? `${v.toFixed(1)}%` : '—';           // 0–100 value

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function PercentileBar({ label, value, pct, format }) {
  const p = pct ?? 50;
  const color = p >= 80 ? '#4ADE80' : p >= 60 ? '#E8A030' : p >= 40 ? '#7D9AB4' : '#F87171';
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {format(value)}
          </span>
          {pct != null && (
            <span style={{ fontSize: '0.70rem', color, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              {p}th
            </span>
          )}
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${p}%`, height: '100%', background: color, borderRadius: '2px',
          transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, subLabel }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </div>
      {subLabel && (
        <div style={{ fontSize: '0.68rem', color: 'var(--accent)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      {payload.map(entry => (
        <div key={entry.name} style={{ color: entry.color, fontFamily: 'var(--font-mono)' }}>
          {entry.name}: {entry.value > 0 ? '+' : ''}{Number(entry.value).toFixed(1)}
        </div>
      ))}
    </div>
  );
};

const GAME_LOG_COLUMNS = [
  { id: 'date',     header: 'Date',  accessorFn: r => r.date,     cell: i => <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'opp',      header: 'Opp',   accessorFn: r => r.opponent, cell: i => <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{i.getValue()}</span> },
  { id: 'result',   header: 'W/L',   accessorFn: r => r.result,   cell: i => <span style={{ color: i.getValue() === 'W' ? 'var(--positive)' : 'var(--negative)', fontWeight: 700, fontSize: '0.78rem' }}>{i.getValue()}</span> },
  { id: 'min',      header: 'MIN',   accessorFn: r => r.min,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDec(i.getValue())}</span> },
  { id: 'pts',      header: 'PTS',   accessorFn: r => r.pts,      cell: i => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>{i.getValue()}</span> },
  { id: 'reb',      header: 'REB',   accessorFn: r => r.reb,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'ast',      header: 'AST',   accessorFn: r => r.ast,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'stl',      header: 'STL',   accessorFn: r => r.stl,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'blk',      header: 'BLK',   accessorFn: r => r.blk,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'fg',       header: 'FG',    accessorFn: r => r.fg,       cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'bpm_game', header: 'BPM',   accessorFn: r => r.bpm_game, cell: i => {
    const v = i.getValue();
    if (v == null) return <span style={{ color: 'var(--text-disabled)' }}>—</span>;
    const color = v >= 5 ? 'var(--positive)' : v >= 0 ? 'var(--text-secondary)' : 'var(--negative)';
    return <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 500 }}>{v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}</span>;
  }},
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PlayerProfilePage({ playerId, season: globalSeason, onNavigate }) {
  const [player, setPlayer]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [source, setSource]               = useState(null);

  const [selectedSeason, setSelectedSeason] = useState(globalSeason ?? '2024-25');

  const [gameLog, setGameLog]             = useState([]);
  const [gamesLoading, setGamesLoading]   = useState(false);
  const [gameLogSorting, setGameLogSorting] = useState([]);

  const similarPlayers = useMemo(
    () => getMockSimilarPlayers(playerId, selectedSeason),
    [playerId, selectedSeason],
  );

  // Fetch player profile when playerId changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlayer(null);

    fetchPlayerProfile(playerId).then(({ player: p, source: src }) => {
      if (cancelled) return;
      setPlayer(p);
      setSource(src);
      setLoading(false);
      // Pick the best default season
      if (p?.seasons?.length) {
        const best = p.seasons.includes(globalSeason)
          ? globalSeason
          : p.seasons[p.seasons.length - 1];
        setSelectedSeason(best);
      }
    }).catch(err => {
      if (cancelled) return;
      setError(err.message);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch game log when player or season changes
  useEffect(() => {
    if (!player || !selectedSeason) return;
    let cancelled = false;
    setGamesLoading(true);

    fetchPlayerGames(playerId, selectedSeason).then(({ gameLog: gl }) => {
      if (!cancelled) { setGameLog(gl); setGamesLoading(false); }
    }).catch(() => {
      if (!cancelled) { setGameLog([]); setGamesLoading(false); }
    });

    return () => { cancelled = true; };
  }, [playerId, selectedSeason]);

  // Memoize game log for TanStack Table stability
  const stableGameLog = useMemo(() => gameLog, [gameLog]);

  const glTable = useReactTable({
    data: stableGameLog,
    columns: GAME_LOG_COLUMNS,
    state: { sorting: gameLogSorting },
    onSortingChange: setGameLogSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Career progression chart data
  const progressionData = useMemo(() => {
    if (!player?.seasons) return [];
    return player.seasons.map(s => ({
      season: s.replace('20', "'"),
      BPM:  player.stats[s]?.bpm  ?? null,
      OBPM: player.stats[s]?.obpm ?? null,
      DBPM: player.stats[s]?.dbpm ?? null,
      PPG:  player.stats[s]?.pts  ?? null,
    }));
  }, [player]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="page-content">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 16" />
          </svg>
          Loading player…
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="page-content">
        <div className="container">
          <button onClick={() => onNavigate('leaderboard')} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
            ← Rankings
          </button>
          <p style={{ color: 'var(--text-muted)' }}>{error ?? 'Player not found.'}</p>
        </div>
      </div>
    );
  }

  const stats = player.stats?.[selectedSeason];
  const pct   = stats?.percentiles ?? {};
  const availableSeasons = player.seasons ?? [];
  const posClass = `pos-${player.position?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="page-content">
      <div className="container">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => onNavigate('leaderboard')} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Rankings
          </button>
          <span style={{ color: 'var(--text-disabled)' }}>›</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{player.name}</span>
          {source === 'mock' && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-disabled)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              DEMO
            </span>
          )}
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)', padding: '32px 36px', marginBottom: '28px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '240px', height: '240px', background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '2rem', color: 'var(--text-muted)' }}>
              {player.name.charAt(0)}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {player.name}
                </h1>
                <span className={`chip ${posClass}`} style={{ borderColor: 'currentColor', opacity: 0.8 }}>
                  {player.position}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{player.team}</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.conference}</span>
                {(player.year_in_school || player.class_year) && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.year_in_school ?? player.class_year}</span>
                </>}
                {player.height && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.height}</span>
                </>}
                {player.hometown && <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.hometown}</span>
                </>}
              </div>
            </div>

            {/* Season selector */}
            <div style={{ flexShrink: 0 }}>
              <div className="section-label" style={{ textAlign: 'right' }}>Season</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {availableSeasons.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 'var(--radius)', border: '1px solid',
                      fontSize: '0.76rem', fontFamily: 'var(--font-body)', fontWeight: 500,
                      cursor: 'pointer', transition: 'all var(--transition)',
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

        {stats ? (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              <StatCard label="PPG"  value={fmtDec(stats.pts)} />
              <StatCard label="RPG"  value={fmtDec(stats.reb)} />
              <StatCard label="APG"  value={fmtDec(stats.ast)} />
              <StatCard label="BPM"  value={fmtBpm(stats.bpm)} subLabel={pct.bpm != null ? `${pct.bpm}th pct` : null} />
              <StatCard label="TS%"  value={fmtPctX(stats.ts_pct)} />
              <StatCard label="USG%" value={fmtPctX(stats.usg_pct)} />
              <StatCard label="ORTG" value={fmtDec(stats.ortg)} />
              <StatCard label="DRTG" value={fmtDec(stats.drtg)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Percentile bars */}
              <div className="card">
                <div className="section-label">Percentile Rankings · {selectedSeason}</div>
                <PercentileBar label="BPM"    value={stats.bpm}     pct={pct.bpm}     format={fmtBpm} />
                <PercentileBar label="PPG"    value={stats.pts}     pct={pct.pts}     format={fmtDec} />
                <PercentileBar label="TS%"    value={stats.ts_pct}  pct={pct.ts_pct}  format={fmtPctX} />
                <PercentileBar label="USG%"   value={stats.usg_pct} pct={pct.usg_pct} format={fmtPctX} />
                <PercentileBar label="RPG"    value={stats.reb}     pct={pct.reb}     format={fmtDec} />
                {stats.efg_pct != null
                  ? <PercentileBar label="eFG%"  value={stats.efg_pct} pct={pct.efg_pct} format={fmtPctX} />
                  : <PercentileBar label="FG%"   value={stats.fg_pct}  pct={pct.fg_pct}  format={fmtPct} />
                }
              </div>

              {/* Career progression chart */}
              <div className="card">
                <div className="section-label">Career Progression · BPM</div>
                {progressionData.length > 1 ? (
                  <ResponsiveContainer key={selectedSeason} width="100%" height={220}>
                    <LineChart data={progressionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="season" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="BPM"  stroke="var(--accent)"    strokeWidth={2}   dot={{ fill: 'var(--accent)', r: 4 }}   connectNulls isAnimationActive={false} />
                      <Line type="monotone" dataKey="OBPM" stroke="var(--positive)"  strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
                      <Line type="monotone" dataKey="DBPM" stroke="var(--teal)"      strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Only one season of data available
                  </div>
                )}
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {[{ label: 'BPM', color: 'var(--accent)' }, { label: 'OBPM', color: 'var(--positive)' }, { label: 'DBPM', color: 'var(--teal)' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '16px', height: '2px', background: item.color, borderRadius: '1px' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Game Log */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Game Log
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{selectedSeason}</span>
              </div>

              {gamesLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  Loading game log…
                </div>
              ) : stableGameLog.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  No game log available for {selectedSeason}
                </div>
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
                      Showing {glTable.getRowModel().rows.length} of {stableGameLog.length} games
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost" onClick={() => glTable.previousPage()} disabled={!glTable.getCanPreviousPage()} style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanPreviousPage() ? 0.3 : 1 }}>← Prev</button>
                      <button className="btn btn-ghost" onClick={() => glTable.nextPage()}     disabled={!glTable.getCanNextPage()}     style={{ padding: '4px 10px', fontSize: '0.76rem', opacity: !glTable.getCanNextPage()     ? 0.3 : 1 }}>Next →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '28px' }}>
            No stats available for {selectedSeason}
          </div>
        )}

        {/* Similar Players (mock-sourced for now) */}
        {similarPlayers.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Most Similar Players
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>by analytical profile · {selectedSeason}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {similarPlayers.map(sim => (
                <button
                  key={sim.player_id}
                  onClick={() => onNavigate('player', sim.player_id)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition-slow)', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.90rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{sim.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{sim.team} · {sim.position}</div>
                    </div>
                    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 500 }}>
                      {sim.similarity}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { label: 'BPM', value: sim.bpm != null ? (sim.bpm > 0 ? `+${sim.bpm.toFixed(1)}` : sim.bpm.toFixed(1)) : '—' },
                      { label: 'PPG', value: (sim.pts ?? sim.ppg)?.toFixed(1) ?? '—' },
                      { label: 'TS%', value: sim.ts_pct != null ? fmtPctX(sim.ts_pct <= 1 ? sim.ts_pct * 100 : sim.ts_pct) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.90rem', color: 'var(--text-primary)' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
