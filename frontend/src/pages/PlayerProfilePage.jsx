import { useState, useMemo } from 'react';
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
import {
  PLAYER_PROFILES,
  getGameLog,
  getSimilarPlayers,
  getPercentile,
  STAT_DEFINITIONS,
} from '../data/mockData';

function PercentileBar({ value, pct, label, format }) {
  const color = pct >= 80 ? '#4ADE80' : pct >= 60 ? '#E8A030' : pct >= 40 ? '#7D9AB4' : '#F87171';
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
          <span style={{ fontSize: '0.70rem', color, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
            {pct}th
          </span>
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
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

function StatCard({ label, value, subLabel }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.8rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: '6px',
      }}>
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
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '10px 14px',
      fontSize: '0.78rem',
    }}>
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
  { id: 'date',     header: 'Date',    accessorFn: r => r.date,    cell: i => <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'opp',      header: 'Opp',     accessorFn: r => r.opponent, cell: i => <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{i.getValue()}</span> },
  { id: 'result',   header: 'W/L',     accessorFn: r => r.result,   cell: i => <span style={{ color: i.getValue() === 'W' ? 'var(--positive)' : 'var(--negative)', fontWeight: 700, fontSize: '0.78rem' }}>{i.getValue()}</span> },
  { id: 'min',      header: 'MIN',     accessorFn: r => r.min,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'pts',      header: 'PTS',     accessorFn: r => r.pts,      cell: i => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>{i.getValue()}</span> },
  { id: 'reb',      header: 'REB',     accessorFn: r => r.reb,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'ast',      header: 'AST',     accessorFn: r => r.ast,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'stl',      header: 'STL',     accessorFn: r => r.stl,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'blk',      header: 'BLK',     accessorFn: r => r.blk,      cell: i => <span style={{ fontFamily: 'var(--font-mono)' }}>{i.getValue()}</span> },
  { id: 'fg',       header: 'FG',      accessorFn: r => r.fg,       cell: i => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>{i.getValue()}</span> },
  { id: 'bpm_game', header: 'BPM',     accessorFn: r => r.bpm_game, cell: i => {
    const v = i.getValue();
    const color = v >= 5 ? 'var(--positive)' : v >= 0 ? 'var(--text-secondary)' : 'var(--negative)';
    return <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 500 }}>{v > 0 ? `+${v}` : v}</span>;
  }},
];

export default function PlayerProfilePage({ playerId, season: globalSeason, onNavigate }) {
  const player = PLAYER_PROFILES[playerId];
  const availableSeasons = player?.seasons ?? [];
  const [selectedSeason, setSelectedSeason] = useState(
    availableSeasons.includes(globalSeason) ? globalSeason : availableSeasons[availableSeasons.length - 1]
  );
  const [gameLogSorting, setGameLogSorting] = useState([]);

  if (!player) {
    return (
      <div className="page-content">
        <div className="container">
          <p style={{ color: 'var(--text-muted)' }}>Player not found.</p>
        </div>
      </div>
    );
  }

  const stats = player.stats[selectedSeason];
  const gameLog = getGameLog(playerId, selectedSeason);
  const similarPlayers = getSimilarPlayers(playerId, selectedSeason);

  // Progression data for chart
  const progressionData = availableSeasons.map(s => ({
    season: s.replace('20', "'"),
    BPM:  player.stats[s]?.bpm  ?? null,
    OBPM: player.stats[s]?.obpm ?? null,
    DBPM: player.stats[s]?.dbpm ?? null,
    PPG:  player.stats[s]?.ppg  ?? null,
  }));

  const fmtPct = v => v != null ? `${(v * 100).toFixed(1)}%` : '—';
  const fmtDec = v => v != null ? v.toFixed(1) : '—';
  const fmtBpm = v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—';
  const fmtUsg = v => v != null ? `${v.toFixed(1)}%` : '—';

  const glTable = useReactTable({
    data: gameLog,
    columns: GAME_LOG_COLUMNS,
    state: { sorting: gameLogSorting },
    onSortingChange: setGameLogSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const posClass = `pos-${player.position?.toLowerCase()}`;

  return (
    <div className="page-content">
      <div className="container">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => onNavigate('leaderboard')}
            style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Rankings
          </button>
          <span style={{ color: 'var(--text-disabled)' }}>›</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{player.name}</span>
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Headshot Placeholder */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '2rem',
              color: 'var(--text-muted)',
            }}>
              {player.name.charAt(0)}
            </div>

            {/* Player Info */}
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
                  {player.name}
                </h1>
                <span className={`chip ${posClass}`} style={{ borderColor: 'currentColor', opacity: 0.8 }}>
                  {player.position}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {player.team}
                </span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.conference}</span>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{player.class_year}</span>
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
            {/* Quick Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '12px',
              marginBottom: '28px',
            }}>
              <StatCard label="PPG" value={fmtDec(stats.ppg)} />
              <StatCard label="RPG" value={fmtDec(stats.rpg)} />
              <StatCard label="APG" value={fmtDec(stats.apg)} />
              <StatCard label="BPM" value={fmtBpm(stats.bpm)} subLabel={`${getPercentile('bpm', stats.bpm, selectedSeason)}th pct`} />
              <StatCard label="TS%" value={fmtPct(stats.ts_pct)} />
              <StatCard label="USG%" value={fmtUsg(stats.usg_pct)} />
              <StatCard label="ORTG" value={fmtDec(stats.ortg)} />
              <StatCard label="DRTG" value={fmtDec(stats.drtg)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              {/* Percentile Rankings */}
              <div className="card">
                <div className="section-label">Percentile Rankings · {selectedSeason}</div>
                <PercentileBar label="BPM" value={stats.bpm} pct={getPercentile('bpm', stats.bpm, selectedSeason)} format={fmtBpm} />
                <PercentileBar label="PPG" value={stats.ppg} pct={getPercentile('ppg', stats.ppg, selectedSeason)} format={fmtDec} />
                <PercentileBar label="TS%" value={stats.ts_pct} pct={getPercentile('ts_pct', stats.ts_pct, selectedSeason)} format={fmtPct} />
                <PercentileBar label="USG%" value={stats.usg_pct} pct={getPercentile('usg_pct', stats.usg_pct, selectedSeason)} format={fmtUsg} />
                <PercentileBar label="RPG" value={stats.rpg} pct={getPercentile('rpg', stats.rpg, selectedSeason)} format={fmtDec} />
                <PercentileBar label="WS/40" value={stats.ws_per_40} pct={getPercentile('ws_per_40', stats.ws_per_40, selectedSeason)} format={v => v?.toFixed(3) ?? '—'} />
              </div>

              {/* Season Progression Chart */}
              <div className="card">
                <div className="section-label">Career Progression · BPM</div>
                {progressionData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={progressionData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="season" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="BPM" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} connectNulls />
                      <Line type="monotone" dataKey="OBPM" stroke="var(--positive)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
                      <Line type="monotone" dataKey="DBPM" stroke="var(--teal)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Only one season available
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

        {/* Similar Players */}
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
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-slow)',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.90rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{sim.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{sim.team} · {sim.position}</div>
                    </div>
                    <div style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-glow)',
                      borderRadius: 'var(--radius)',
                      padding: '4px 10px',
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                      fontWeight: 500,
                    }}>
                      {sim.similarity}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { label: 'BPM', value: sim.bpm > 0 ? `+${sim.bpm?.toFixed(1)}` : sim.bpm?.toFixed(1) },
                      { label: 'PPG', value: sim.ppg?.toFixed(1) },
                      { label: 'TS%', value: sim.ts_pct ? `${(sim.ts_pct * 100).toFixed(1)}%` : '—' },
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
