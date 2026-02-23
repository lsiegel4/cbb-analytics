import { useState, useMemo } from 'react';
import { STAT_DEFINITIONS } from '../data/mockData';

const EXTENDED_GLOSSARY = {
  ...STAT_DEFINITIONS,
  // Add a few more that might appear in future features
  net_rtg: {
    label: 'NET RTG',
    full: 'Net Rating',
    group: 'advanced',
    definition: 'Offensive rating minus defensive rating. The best overall measure of a team\'s or player\'s two-way impact per 100 possessions.',
  },
  pace: {
    label: 'PACE',
    full: 'Pace',
    group: 'advanced',
    definition: 'Estimated number of possessions a team uses per 40 minutes. Higher pace means a faster-playing style with more possessions.',
  },
  tov_pct: {
    label: 'TOV%',
    full: 'Turnover Rate',
    group: 'advanced',
    definition: 'Percentage of possessions that end in a turnover. Lower is better. Formula: TO / (FGA + 0.44 × FTA + TO).',
  },
  astr: {
    label: 'AST%',
    full: 'Assist Percentage',
    group: 'advanced',
    definition: 'Percentage of teammates\' made field goals a player assisted on while the player was on the floor.',
  },
  blk_pct: {
    label: 'BLK%',
    full: 'Block Percentage',
    group: 'advanced',
    definition: 'Percentage of opponent two-point field goal attempts blocked by the player while they were on the floor.',
  },
  stl_pct: {
    label: 'STL%',
    full: 'Steal Percentage',
    group: 'advanced',
    definition: 'Percentage of opponent possessions that ended in a steal by the player while they were on the floor.',
  },
  efg_pct: {
    label: 'eFG%',
    full: 'Effective Field Goal %',
    group: 'advanced',
    definition: 'Adjusts FG% to account for the fact that 3-point shots are worth more. Formula: (FGM + 0.5 × 3PM) / FGA.',
  },
  orb_pct: {
    label: 'ORB%',
    full: 'Offensive Rebound %',
    group: 'advanced',
    definition: 'Percentage of available offensive rebounds a player grabbed while on the floor.',
  },
  drb_pct: {
    label: 'DRB%',
    full: 'Defensive Rebound %',
    group: 'advanced',
    definition: 'Percentage of available defensive rebounds a player grabbed while on the floor.',
  },
};

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return Object.entries(EXTENDED_GLOSSARY)
      .filter(([, def]) => {
        if (activeGroup !== 'all' && def.group !== activeGroup) return false;
        if (q) {
          return (
            def.label.toLowerCase().includes(q) ||
            def.full.toLowerCase().includes(q) ||
            def.definition.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a[1].label.localeCompare(b[1].label));
  }, [query, activeGroup]);

  // Group by first letter for alphabetical sections
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(([key, def]) => {
      const letter = def.label.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push([key, def]);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Stat Glossary
          </h1>
          <p style={{ fontSize: '0.90rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '600px' }}>
            Plain-English definitions for every statistic used on Court Vision.
            Whether you're new to advanced analytics or just need a refresher,
            start here.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stats..."
            style={{ maxWidth: '280px' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'traditional', 'advanced'].map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px' }}>
            {filtered.length} stat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Results */}
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            No stats match your search.
          </div>
        ) : (
          grouped.map(([letter, defs]) => (
            <div key={letter} style={{ marginBottom: '36px' }}>
              {/* Letter heading */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  lineHeight: 1,
                  minWidth: '24px',
                }}>
                  {letter}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Stat Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {defs.map(([key, def]) => (
                  <div
                    key={key}
                    id={`stat-${key}`}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr auto',
                      gap: '16px',
                      alignItems: 'start',
                      transition: 'border-color var(--transition)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    {/* Abbreviation */}
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                      }}>
                        {def.label}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{
                          fontSize: '0.60rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.10em',
                          padding: '2px 6px',
                          borderRadius: '100px',
                          background: def.group === 'advanced' ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          color: def.group === 'advanced' ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${def.group === 'advanced' ? 'var(--accent-glow)' : 'var(--border)'}`,
                          display: 'inline-block',
                        }}>
                          {def.group}
                        </span>
                      </div>
                    </div>

                    {/* Full name + definition */}
                    <div>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px',
                      }}>
                        {def.full}
                      </div>
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.65,
                        margin: 0,
                      }}>
                        {def.definition}
                      </p>
                    </div>

                    {/* Copy link */}
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}#stat-${key}`);
                      }}
                      title="Copy link to this stat"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-disabled)',
                        padding: '4px 8px',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                        flexShrink: 0,
                        alignSelf: 'flex-start',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-active)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-disabled)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      ⌗
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
