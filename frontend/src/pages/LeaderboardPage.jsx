import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { buildLeaderboard, CONFERENCES, POSITIONS, STAT_DEFINITIONS } from '../data/mockData';

const FMT = {
  pct:   v => v != null ? `${(v * 100).toFixed(1)}%` : '—',
  dec:   v => v != null ? v.toFixed(1) : '—',
  int:   v => v != null ? v : '—',
  bpm:   v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—',
  ws40:  v => v != null ? v.toFixed(3) : '—',
};

const TRADITIONAL_COLS = [
  { id: 'games',     header: 'G',    accessor: r => r.games,    fmt: FMT.int,  tip: STAT_DEFINITIONS.games?.definition },
  { id: 'mpg',       header: 'MPG',  accessor: r => r.mpg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.mpg?.definition },
  { id: 'ppg',       header: 'PPG',  accessor: r => r.ppg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.ppg.definition },
  { id: 'rpg',       header: 'RPG',  accessor: r => r.rpg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.rpg.definition },
  { id: 'apg',       header: 'APG',  accessor: r => r.apg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.apg.definition },
  { id: 'spg',       header: 'SPG',  accessor: r => r.spg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.spg.definition },
  { id: 'bpg',       header: 'BPG',  accessor: r => r.bpg,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.bpg.definition },
  { id: 'fg_pct',    header: 'FG%',  accessor: r => r.fg_pct,   fmt: FMT.pct,  tip: STAT_DEFINITIONS.fg_pct.definition },
  { id: 'three_pct', header: '3P%',  accessor: r => r.three_pct, fmt: FMT.pct, tip: STAT_DEFINITIONS.three_pct.definition },
  { id: 'ft_pct',    header: 'FT%',  accessor: r => r.ft_pct,   fmt: FMT.pct,  tip: STAT_DEFINITIONS.ft_pct.definition },
];

const ADVANCED_COLS = [
  { id: 'bpm',       header: 'BPM',    accessor: r => r.bpm,      fmt: FMT.bpm,  tip: STAT_DEFINITIONS.bpm.definition,    highlight: true },
  { id: 'obpm',      header: 'OBPM',   accessor: r => r.obpm,     fmt: FMT.bpm,  tip: STAT_DEFINITIONS.obpm.definition },
  { id: 'dbpm',      header: 'DBPM',   accessor: r => r.dbpm,     fmt: FMT.bpm,  tip: STAT_DEFINITIONS.dbpm.definition },
  { id: 'ts_pct',    header: 'TS%',    accessor: r => r.ts_pct,   fmt: FMT.pct,  tip: STAT_DEFINITIONS.ts_pct.definition },
  { id: 'usg_pct',   header: 'USG%',   accessor: r => r.usg_pct,  fmt: v => v != null ? `${v.toFixed(1)}%` : '—', tip: STAT_DEFINITIONS.usg_pct.definition },
  { id: 'ortg',      header: 'ORTG',   accessor: r => r.ortg,     fmt: FMT.dec,  tip: STAT_DEFINITIONS.ortg.definition },
  { id: 'drtg',      header: 'DRTG',   accessor: r => r.drtg,     fmt: FMT.dec,  tip: STAT_DEFINITIONS.drtg.definition },
  { id: 'ws_per_40', header: 'WS/40',  accessor: r => r.ws_per_40, fmt: FMT.ws40, tip: STAT_DEFINITIONS.ws_per_40.definition },
  { id: 'per',       header: 'PER',    accessor: r => r.per,      fmt: FMT.dec,  tip: STAT_DEFINITIONS.per.definition },
];

function BpmBar({ value }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, ((value + 5) / 15) * 100));
  const color = value >= 8 ? '#4ADE80' : value >= 4 ? '#E8A030' : value >= 0 ? '#7D9AB4' : '#F87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', minWidth: '42px', textAlign: 'right' }}>
        {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
      </span>
      <div style={{
        width: '60px',
        height: '3px',
        background: 'var(--bg-hover)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          opacity: 0.8,
        }} />
      </div>
    </div>
  );
}

function PosChip({ pos }) {
  const cls = `pos-${pos?.toLowerCase()}`;
  return (
    <span style={{
      fontSize: '0.68rem',
      fontWeight: 700,
      fontFamily: 'var(--font-body)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }} className={cls}>
      {pos}
    </span>
  );
}

export default function LeaderboardPage({ season, onNavigate }) {
  const [sorting, setSorting] = useState([{ id: 'bpm', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeGroup, setActiveGroup] = useState('advanced');
  const [selectedConfs, setSelectedConfs] = useState([]);
  const [selectedPos, setSelectedPos] = useState([]);
  const [minMinutes, setMinMinutes] = useState(15);

  const rawData = useMemo(() => buildLeaderboard(season), [season]);

  const filteredData = useMemo(() => {
    return rawData.filter(p => {
      if (selectedConfs.length && !selectedConfs.includes(p.conference)) return false;
      if (selectedPos.length && !selectedPos.includes(p.position)) return false;
      if (p.mpg < minMinutes) return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rawData, selectedConfs, selectedPos, minMinutes, globalFilter]);

  const statCols = activeGroup === 'traditional' ? TRADITIONAL_COLS : ADVANCED_COLS;

  const columns = useMemo(() => [
    {
      id: 'rank',
      header: '#',
      cell: info => (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          {info.row.index + 1}
        </span>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      id: 'name',
      header: 'Player',
      accessorFn: r => r.name,
      cell: info => (
        <button
          onClick={() => onNavigate('player', info.row.original.player_id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
          }}
        >
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
            {info.getValue()}
          </div>
          <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {info.row.original.team}
          </div>
        </button>
      ),
      size: 180,
    },
    {
      id: 'conference',
      header: 'Conf',
      accessorFn: r => r.conference,
      cell: info => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{info.getValue()}</span>
      ),
      size: 90,
    },
    {
      id: 'position',
      header: 'Pos',
      accessorFn: r => r.position,
      cell: info => <PosChip pos={info.getValue()} />,
      size: 50,
    },
    {
      id: 'class_year',
      header: 'Yr',
      accessorFn: r => r.class_year,
      cell: info => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {info.getValue()?.slice(0, 2) ?? '—'}
        </span>
      ),
      size: 40,
    },
    ...statCols.map(col => ({
      id: col.id,
      header: col.header,
      accessorFn: col.accessor,
      cell: info => {
        const val = info.getValue();
        if (col.id === 'bpm') return <BpmBar value={val} />;
        return (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {col.fmt(val)}
          </span>
        );
      },
      sortingFn: 'auto',
      meta: { tip: col.tip },
    })),
  ], [statCols, onNavigate]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  function toggleConf(conf) {
    setSelectedConfs(prev =>
      prev.includes(conf) ? prev.filter(c => c !== conf) : [...prev, conf]
    );
  }
  function togglePos(pos) {
    setSelectedPos(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
            }}>
              Player Rankings
            </h1>
            <span className="chip chip-accent">{season}</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {filteredData.length} players · Sorted by {sorting[0]?.id?.toUpperCase() ?? 'BPM'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Sidebar Filters */}
          <div style={{
            width: '200px',
            flexShrink: 0,
            position: 'sticky',
            top: 'calc(var(--nav-height) + 24px)',
          }}>
            <div className="card" style={{ padding: '16px' }}>

              {/* Stat Group Toggle */}
              <div className="section-label">Stat Group</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                {['advanced', 'traditional'].map(g => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      textAlign: 'left',
                      textTransform: 'capitalize',
                      background: activeGroup === g ? 'var(--accent-dim)' : 'transparent',
                      borderColor: activeGroup === g ? 'var(--accent-glow)' : 'var(--border)',
                      color: activeGroup === g ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="divider" style={{ margin: '0 0 16px 0' }} />

              {/* Min Minutes */}
              <div className="section-label">Min. MPG</div>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="range"
                  min="0" max="35" step="1"
                  value={minMinutes}
                  onChange={e => setMinMinutes(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>0</span>
                  <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                    {minMinutes}
                  </span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>35</span>
                </div>
              </div>

              <div className="divider" style={{ margin: '0 0 16px 0' }} />

              {/* Position Filter */}
              <div className="section-label">Position</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '20px' }}>
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => togglePos(pos)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      background: selectedPos.includes(pos) ? 'var(--accent-dim)' : 'transparent',
                      borderColor: selectedPos.includes(pos) ? 'var(--accent-glow)' : 'var(--border)',
                      color: selectedPos.includes(pos) ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              <div className="divider" style={{ margin: '0 0 16px 0' }} />

              {/* Conference Filter */}
              <div className="section-label">Conference</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '220px', overflowY: 'auto' }}>
                {CONFERENCES.map(conf => (
                  <button
                    key={conf}
                    onClick={() => toggleConf(conf)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      textAlign: 'left',
                      background: selectedConfs.includes(conf) ? 'var(--accent-dim)' : 'transparent',
                      borderColor: selectedConfs.includes(conf) ? 'var(--accent-glow)' : 'transparent',
                      color: selectedConfs.includes(conf) ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => { if (!selectedConfs.includes(conf)) e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { if (!selectedConfs.includes(conf)) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {conf}
                  </button>
                ))}
              </div>

              {(selectedConfs.length || selectedPos.length || minMinutes > 0) > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => { setSelectedConfs([]); setSelectedPos([]); setMinMinutes(15); }}
                  style={{ width: '100%', marginTop: '12px', fontSize: '0.74rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
              <input
                className="input"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Filter by player name or team..."
                style={{ maxWidth: '340px' }}
              />
            </div>

            {/* Table */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="stat-table">
                  <thead>
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map(header => {
                          const isSorted = header.column.getIsSorted();
                          const meta = header.column.columnDef.meta;
                          return (
                            <th
                              key={header.id}
                              className={isSorted ? 'sorted' : ''}
                              onClick={header.column.getToggleSortingHandler()}
                              data-tooltip={meta?.tip}
                              style={{ width: header.getSize() }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {isSorted === 'asc' && ' ↑'}
                                {isSorted === 'desc' && ' ↓'}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        style={{ animationDelay: `${i * 20}ms` }}
                        className="fade-up"
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {filteredData.length} players
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    style={{ padding: '5px 12px', fontSize: '0.78rem', opacity: !table.getCanPreviousPage() ? 0.3 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    style={{ padding: '5px 12px', fontSize: '0.78rem', opacity: !table.getCanNextPage() ? 0.3 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
