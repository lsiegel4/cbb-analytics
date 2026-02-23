import { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { PLAYER_PROFILES, searchPlayers, SEASONS } from '../data/mockData';

const RADAR_DIMS = [
  { key: 'bpm',      label: 'BPM',       min: -5, max: 12 },
  { key: 'ts_pct',   label: 'Shooting',  min: 0.40, max: 0.70 },
  { key: 'rpg',      label: 'Rebounding', min: 0, max: 14 },
  { key: 'apg',      label: 'Playmaking', min: 0, max: 8 },
  { key: 'dbpm',     label: 'Defense',   min: -3, max: 6 },
  { key: 'usg_pct',  label: 'Usage',     min: 10, max: 35 },
];

function normalize(value, min, max) {
  if (value == null) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

const COLORS = {
  A: { line: '#E8A030', fill: 'rgba(232, 160, 48, 0.15)' },
  B: { line: '#2DD4BF', fill: 'rgba(45, 212, 191, 0.10)' },
};

function PlayerSelector({ label, selected, selectedSeason, onSelect, onSeasonChange, color }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    if (q.length >= 2) {
      setResults(searchPlayers(q));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function pick(player) {
    onSelect(player);
    setQuery('');
    setOpen(false);
  }

  const availableSeasons = selected?.seasons ?? [];

  return (
    <div style={{
      flex: 1,
      background: 'var(--bg-card)',
      border: `1px solid ${selected ? color + '44' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Accent top border */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: color,
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        opacity: selected ? 0.8 : 0.2,
      }} />

      <div className="section-label" style={{ color, opacity: 0.7 }}>{label}</div>

      {selected ? (
        <div>
          {/* Player Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: `2px solid ${color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', color: 'var(--text-muted)',
              flexShrink: 0,
            }}>
              {selected.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selected.name}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                {selected.team} · {selected.position} · {selected.class_year}
              </div>
            </div>
            <button
              onClick={() => onSelect(null)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-muted)',
                fontSize: '0.70rem',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Season Selector */}
          {availableSeasons.length > 0 && (
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '6px' }}>Season</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {availableSeasons.map(s => (
                  <button
                    key={s}
                    onClick={() => onSeasonChange(s)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      background: selectedSeason === s ? color + '22' : 'transparent',
                      borderColor: selectedSeason === s ? color + '88' : 'var(--border)',
                      color: selectedSeason === s ? color : 'var(--text-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Search */
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            value={query}
            onChange={handleInput}
            placeholder="Search for a player..."
            style={{ marginTop: '4px' }}
          />
          {open && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0, right: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {results.map(r => (
                <button
                  key={r.player_id}
                  onClick={() => pick(r)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{r.team} · {r.conference}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', background: 'var(--bg-card)', padding: '2px 7px', borderRadius: '100px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {r.position}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.74rem', color: 'var(--text-disabled)', marginTop: '8px' }}>
            Type at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  );
}

const STAT_ROWS = [
  { key: 'ppg',      label: 'Points Per Game',        format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'rpg',      label: 'Rebounds Per Game',       format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'apg',      label: 'Assists Per Game',        format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'spg',      label: 'Steals Per Game',         format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'bpg',      label: 'Blocks Per Game',         format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'fg_pct',   label: 'Field Goal %',            format: v => v != null ? `${(v * 100).toFixed(1)}%` : '—', higherBetter: true },
  { key: 'three_pct', label: 'Three-Point %',          format: v => v != null ? `${(v * 100).toFixed(1)}%` : '—', higherBetter: true },
  { key: 'ft_pct',   label: 'Free Throw %',            format: v => v != null ? `${(v * 100).toFixed(1)}%` : '—', higherBetter: true },
  { key: 'ts_pct',   label: 'True Shooting %',         format: v => v != null ? `${(v * 100).toFixed(1)}%` : '—', higherBetter: true },
  { key: 'usg_pct',  label: 'Usage Rate',              format: v => v != null ? `${v.toFixed(1)}%` : '—', higherBetter: null },
  { key: 'bpm',      label: 'Box Plus/Minus',          format: v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—', higherBetter: true },
  { key: 'obpm',     label: 'Offensive BPM',           format: v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—', higherBetter: true },
  { key: 'dbpm',     label: 'Defensive BPM',           format: v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—', higherBetter: true },
  { key: 'ortg',     label: 'Offensive Rating',        format: v => v?.toFixed(1) ?? '—', higherBetter: true },
  { key: 'drtg',     label: 'Defensive Rating',        format: v => v?.toFixed(1) ?? '—', higherBetter: false },
  { key: 'ws_per_40', label: 'Win Shares / 40 Min',   format: v => v?.toFixed(3) ?? '—', higherBetter: true },
  { key: 'per',      label: 'Player Efficiency Rating', format: v => v?.toFixed(1) ?? '—', higherBetter: true },
];

function StatComparisonRow({ label, valA, valB, fmtA, fmtB, colorA, colorB, higherBetter }) {
  const aWins = higherBetter === null ? null : (higherBetter ? valA > valB : valA < valB);
  const bWins = higherBetter === null ? null : (higherBetter ? valB > valA : valB < valA);

  // Build bar widths for side-by-side visual
  const maxVal = Math.max(Math.abs(valA ?? 0), Math.abs(valB ?? 0), 0.01);
  const barA = valA != null ? Math.min(100, (Math.abs(valA) / maxVal) * 100) : 0;
  const barB = valB != null ? Math.min(100, (Math.abs(valB) / maxVal) * 100) : 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 140px 1fr',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Player A */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.88rem',
          fontWeight: aWins ? 600 : 400,
          color: aWins ? colorA : 'var(--text-secondary)',
        }}>
          {fmtA}
        </span>
        <div style={{ width: '80px', height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${barA}%`,
            background: colorA,
            borderRadius: '2px',
            marginLeft: 'auto',
            opacity: aWins ? 0.9 : 0.4,
          }} />
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>

      {/* Player B */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '80px', height: '4px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            height: '100%',
            width: `${barB}%`,
            background: colorB,
            borderRadius: '2px',
            opacity: bWins ? 0.9 : 0.4,
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.88rem',
          fontWeight: bWins ? 600 : 400,
          color: bWins ? colorB : 'var(--text-secondary)',
        }}>
          {fmtB}
        </span>
      </div>
    </div>
  );
}

export default function ComparisonPage({ onNavigate }) {
  const [playerA, setPlayerA] = useState(PLAYER_PROFILES['zach-edey'] ?? null);
  const [playerB, setPlayerB] = useState(PLAYER_PROFILES['hunter-dickinson'] ?? null);
  const [seasonA, setSeasonA] = useState('2023-24');
  const [seasonB, setSeasonB] = useState('2023-24');

  const statsA = playerA?.stats[seasonA] ?? null;
  const statsB = playerB?.stats[seasonB] ?? null;

  const radarData = useMemo(() => {
    return RADAR_DIMS.map(dim => ({
      label: dim.label,
      A: statsA ? normalize(statsA[dim.key], dim.min, dim.max) : 0,
      B: statsB ? normalize(statsB[dim.key], dim.min, dim.max) : 0,
    }));
  }, [statsA, statsB]);

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            Player Comparison
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Compare two players across any seasons side-by-side
          </p>
        </div>

        {/* Player Selectors */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <PlayerSelector
            label="Player A"
            selected={playerA}
            selectedSeason={seasonA}
            onSelect={p => {
              setPlayerA(p);
              if (p?.seasons?.length) setSeasonA(p.seasons[p.seasons.length - 1]);
            }}
            onSeasonChange={setSeasonA}
            color={COLORS.A.line}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', flexShrink: 0 }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-disabled)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              VS
            </span>
          </div>
          <PlayerSelector
            label="Player B"
            selected={playerB}
            selectedSeason={seasonB}
            onSelect={p => {
              setPlayerB(p);
              if (p?.seasons?.length) setSeasonB(p.seasons[p.seasons.length - 1]);
            }}
            onSeasonChange={setSeasonB}
            color={COLORS.B.line}
          />
        </div>

        {playerA && playerB && statsA && statsB && (
          <div style={{ animation: 'fadeUp 300ms ease' }}>
            {/* Header: Name comparison */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 1fr',
              gap: '12px',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '20px 24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: COLORS.A.line }}>
                  {playerA.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {playerA.team} · {playerA.position} · {seasonA}
                </div>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.2em', color: 'var(--text-disabled)' }}>
                VS
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: COLORS.B.line }}>
                  {playerB.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {playerB.team} · {playerB.position} · {seasonB}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
              {/* Stat Comparison */}
              <div className="card" style={{ padding: '24px' }}>
                <div className="section-label" style={{ marginBottom: '4px' }}>Head to Head</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 1fr',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '10px', height: '10px',
                      borderRadius: '50%',
                      background: COLORS.A.line,
                      marginRight: '6px',
                    }} />
                    <span style={{ fontSize: '0.72rem', color: COLORS.A.line, fontWeight: 600 }}>
                      {playerA.name.split(' ')[1] || playerA.name}
                    </span>
                  </div>
                  <div />
                  <div>
                    <div style={{
                      display: 'inline-block',
                      width: '10px', height: '10px',
                      borderRadius: '50%',
                      background: COLORS.B.line,
                      marginRight: '6px',
                    }} />
                    <span style={{ fontSize: '0.72rem', color: COLORS.B.line, fontWeight: 600 }}>
                      {playerB.name.split(' ')[1] || playerB.name}
                    </span>
                  </div>
                </div>
                {STAT_ROWS.map(row => (
                  <StatComparisonRow
                    key={row.key}
                    label={row.label}
                    valA={statsA[row.key] ?? 0}
                    valB={statsB[row.key] ?? 0}
                    fmtA={row.format(statsA[row.key])}
                    fmtB={row.format(statsB[row.key])}
                    colorA={COLORS.A.line}
                    colorB={COLORS.B.line}
                    higherBetter={row.higherBetter}
                  />
                ))}
              </div>

              {/* Radar Chart */}
              <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 24px)' }}>
                <div className="card">
                  <div className="section-label" style={{ marginBottom: '16px' }}>Stat Profile</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                      />
                      <Radar
                        name={playerA.name.split(' ')[1] || playerA.name}
                        dataKey="A"
                        stroke={COLORS.A.line}
                        fill={COLORS.A.line}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                      <Radar
                        name={playerB.name.split(' ')[1] || playerB.name}
                        dataKey="B"
                        stroke={COLORS.B.line}
                        fill={COLORS.B.line}
                        fillOpacity={0.10}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.76rem',
                          color: 'var(--text-primary)',
                        }}
                        formatter={v => [`${v.toFixed(0)}`, '']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
                    {[
                      { color: COLORS.A.line, label: playerA.name.split(' ')[1] || playerA.name, season: seasonA },
                      { color: COLORS.B.line, label: playerB.name.split(' ')[1] || playerB.name, season: seasonB },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {item.label} <span style={{ color: 'var(--text-muted)' }}>({item.season})</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Radar note */}
                  <p style={{ fontSize: '0.66rem', color: 'var(--text-disabled)', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
                    Values normalized relative to D1 range
                  </p>
                </div>

                {/* Quick edge count */}
                <div className="card" style={{ marginTop: '12px', padding: '16px' }}>
                  <div className="section-label">Statistical Edge</div>
                  {(() => {
                    let aEdge = 0, bEdge = 0;
                    STAT_ROWS.forEach(row => {
                      if (row.higherBetter === null) return;
                      const va = statsA[row.key] ?? 0;
                      const vb = statsB[row.key] ?? 0;
                      if (row.higherBetter ? va > vb : va < vb) aEdge++;
                      else if (row.higherBetter ? vb > va : vb < va) bEdge++;
                    });
                    return (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid var(--accent-glow)' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 500, color: COLORS.A.line }}>{aEdge}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{playerA.name.split(' ')[1]}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--teal-dim)', borderRadius: 'var(--radius)', border: '1px solid rgba(45,212,191,0.2)' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 500, color: COLORS.B.line }}>{bEdge}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{playerB.name.split(' ')[1]}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {(!playerA || !playerB) && (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }}>⚖</div>
            <div style={{ fontSize: '0.9rem' }}>Select two players above to begin comparison</div>
          </div>
        )}
      </div>
    </div>
  );
}
