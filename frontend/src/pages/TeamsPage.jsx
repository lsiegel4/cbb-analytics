import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchTeams } from '../api/teams';

const FMT = {
  dec:  v => v != null ? v.toFixed(1) : '—',
  prob: v => v != null ? v.toFixed(3) : '—',   // 0–1 probability (barthag)
  int:  v => v != null ? String(v) : '—',
  pct1: v => v != null ? `${v.toFixed(1)}%` : '—',  // already-percentage (0–100)
  net:  v => v != null ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—',
  sos:  v => v != null ? v.toFixed(3) : '—',
  seed: v => v != null ? String(Math.round(v)) : '—',
};

const EFFICIENCY_COLS = [
  { id: 'net_rtg', header: 'NET RTG', accessor: r => r.net_rtg, fmt: FMT.net,  highlight: true, tip: 'Points per 100 possessions better than opponent.' },
  { id: 'ortg',    header: 'ORTG',    accessor: r => r.ortg,    fmt: FMT.dec,  tip: 'Points scored per 100 possessions.' },
  { id: 'drtg',    header: 'DRTG',    accessor: r => r.drtg,    fmt: FMT.dec,  tip: 'Points allowed per 100 possessions. Lower is better.' },
  { id: 'pace',    header: 'PACE',    accessor: r => r.pace,    fmt: FMT.dec,  tip: 'Adjusted tempo — possessions per 40 min.' },
  { id: 'wab',     header: 'WAB',     accessor: r => r.wab,     fmt: FMT.net,  tip: 'Wins Above Bubble — positive = safely in tournament picture.' },
];

const FOUR_FACTORS_COLS = [
  { id: 'efg_pct',     header: 'O-eFG%', accessor: r => r.efg_pct,     fmt: FMT.pct1, tip: 'Effective FG% — weights 3-pointers at 1.5× a 2.' },
  { id: 'tov_pct',     header: 'O-TOV%', accessor: r => r.tov_pct,     fmt: FMT.pct1, tip: 'Offensive turnover rate. Lower is better.' },
  { id: 'orb_pct',     header: 'ORB%',   accessor: r => r.orb_pct,     fmt: FMT.pct1, tip: 'Offensive rebound rate.' },
  { id: 'ftr',         header: 'O-FTR',  accessor: r => r.ftr,         fmt: FMT.dec,  tip: 'Free throw rate (FTA/FGA × 100).' },
  { id: 'opp_efg_pct', header: 'D-eFG%', accessor: r => r.opp_efg_pct, fmt: FMT.pct1, tip: 'Opponent eFG% allowed. Lower is better.' },
  { id: 'opp_tov_pct', header: 'D-TOV%', accessor: r => r.opp_tov_pct, fmt: FMT.pct1, tip: 'Forced turnover rate — higher is better.' },
  { id: 'drb_pct',     header: 'DRB%',   accessor: r => r.drb_pct,     fmt: FMT.pct1, tip: 'Defensive rebound rate.' },
  { id: 'opp_ftr',     header: 'D-FTR',  accessor: r => r.opp_ftr,     fmt: FMT.dec,  tip: 'Opponent free throw rate allowed. Lower = better defense.' },
];

const SCHEDULE_COLS = [
  { id: 'barthag', header: 'BARTH',   accessor: r => r.barthag, fmt: FMT.prob, tip: 'Barthag — probability of beating average D1 team.' },
  { id: 'nc_sos',  header: 'NC SOS',  accessor: r => r.nc_sos,  fmt: FMT.sos,  tip: 'Non-conference strength of schedule (0–1, higher = harder).' },
  { id: 'ov_sos',  header: 'OV SOS',  accessor: r => r.ov_sos,  fmt: FMT.sos,  tip: 'Overall strength of schedule (0–1, higher = harder).' },
  { id: 'seed',    header: 'SEED',    accessor: r => r.seed,    fmt: FMT.seed, tip: 'Projected NCAA tournament seed.' },
];

const STAT_GROUPS = [
  { id: 'efficiency',   label: 'Efficiency' },
  { id: 'four-factors', label: 'Four Factors' },
  { id: 'schedule',     label: 'Schedule' },
];

function NetRtgBar({ value }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, ((value + 5) / 38) * 100));
  const color = value >= 20 ? '#4ADE80' : value >= 10 ? '#E8A030' : value >= 0 ? '#7D9AB4' : '#F87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', minWidth: '48px', textAlign: 'right' }}>
        {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
      </span>
      <div style={{ width: '56px', height: '3px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', opacity: 0.8 }} />
      </div>
    </div>
  );
}

export default function TeamsPage({ season, onNavigate }) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('api');
  const [sorting, setSorting] = useState([{ id: 'net_rtg', desc: true }]);
  const [activeGroup, setActiveGroup] = useState('efficiency');
  const [selectedConfs, setSelectedConfs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchTeams({ season }).then(({ data, source }) => {
      setRawData(data);
      setSource(source);
      setLoading(false);
    });
  }, [season]);

  const availableConfs = useMemo(() => {
    const confs = [...new Set(rawData.map(t => t.conference).filter(Boolean))];
    return confs.sort();
  }, [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(t => {
      if (selectedConfs.length && !selectedConfs.includes(t.conference)) return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        if (!t.name?.toLowerCase().includes(q) && !t.conference?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rawData, selectedConfs, globalFilter]);

  const statCols = activeGroup === 'efficiency'
    ? EFFICIENCY_COLS
    : activeGroup === 'four-factors'
      ? FOUR_FACTORS_COLS
      : SCHEDULE_COLS;

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
      header: 'Team',
      accessorFn: r => r.name,
      cell: info => {
        const row = info.row.original;
        return (
          <button
            onClick={() => onNavigate('team', row.team_id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
              {info.getValue()}
            </div>
            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {row.conference}
            </div>
          </button>
        );
      },
      size: 200,
    },
    {
      id: 'record',
      header: 'W-L',
      accessorFn: r => r.wins,
      cell: info => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {info.row.original.wins ?? '—'}–{info.row.original.losses ?? '—'}
        </span>
      ),
      size: 64,
    },
    ...statCols.map(col => ({
      id: col.id,
      header: col.header,
      accessorFn: col.accessor,
      cell: info => {
        const val = info.getValue();
        if (col.id === 'net_rtg') return <NetRtgBar value={val} />;
        const formatted = col.fmt ? col.fmt(val) : String(val ?? '—');
        let numColor = 'var(--text-secondary)';
        if (col.id === 'ortg' && val != null) {
          numColor = val >= 118 ? '#4ADE80' : val >= 112 ? '#E8A030' : 'var(--text-secondary)';
        } else if (col.id === 'drtg' && val != null) {
          numColor = val <= 93 ? '#4ADE80' : val <= 98 ? '#E8A030' : 'var(--text-secondary)';
        }
        return (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: numColor }}>
            {formatted}
          </span>
        );
      },
      sortingFn: 'auto',
      meta: { tip: col.tip },
      size: col.id === 'net_rtg' ? 140 : 80,
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

  return (
    <div className="page-content">
      <div className="container">
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem', fontWeight: 800,
              letterSpacing: '-0.01em', color: 'var(--text-primary)',
            }}>
              Team Rankings
            </h1>
            <span className="chip chip-accent">{season}</span>
            {source === 'mock' && (
              <span className="chip" style={{ fontSize: '0.65rem', color: 'var(--text-disabled)' }}>
                demo data
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${filteredData.length} teams · Sorted by ${sorting[0]?.id?.toUpperCase().replace('_', ' ') ?? 'NET RTG'}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <div style={{
            width: '200px', flexShrink: 0,
            position: 'sticky', top: 'calc(var(--nav-height) + 24px)',
          }}>
            <div className="card" style={{ padding: '16px' }}>
              <div className="section-label">Stat Group</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
                {STAT_GROUPS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 'var(--radius)',
                      border: '1px solid', fontSize: '0.78rem', fontWeight: 500,
                      fontFamily: 'var(--font-body)', cursor: 'pointer',
                      transition: 'all var(--transition)', textAlign: 'left',
                      background: activeGroup === g.id ? 'var(--accent-dim)' : 'transparent',
                      borderColor: activeGroup === g.id ? 'var(--accent-glow)' : 'var(--border)',
                      color: activeGroup === g.id ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="divider" style={{ margin: '0 0 16px 0' }} />

              <div className="section-label">Conference</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {availableConfs.map(conf => (
                  <button
                    key={conf}
                    onClick={() => toggleConf(conf)}
                    style={{
                      padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid', fontSize: '0.74rem',
                      fontFamily: 'var(--font-body)', cursor: 'pointer',
                      transition: 'all var(--transition)', textAlign: 'left',
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

              {selectedConfs.length > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedConfs([])}
                  style={{ width: '100%', marginTop: '12px', fontSize: '0.74rem' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '16px' }}>
              <input
                className="input"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Filter by team or conference..."
                style={{ maxWidth: '340px' }}
              />
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Loading team data…
              </div>
            ) : (
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
                        <tr key={row.id} className="fade-up" style={{ animationDelay: `${i * 20}ms` }}>
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
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {filteredData.length} teams
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
