import { useState, useRef, useEffect } from 'react';
import { searchPlayers, searchTeams, SEASONS } from '../data/mockData';

// Court Vision Logo Mark
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="#E8A030" strokeWidth="1.5" />
      <path d="M4 14 Q14 4 24 14" stroke="#E8A030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="14" r="2.5" fill="#E8A030" />
      <line x1="14" y1="1" x2="14" y2="27" stroke="#E8A030" strokeWidth="0.75" opacity="0.4" />
    </svg>
  );
}

export default function Navigation({ currentPage, onNavigate, season, onSeasonChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const players = searchPlayers(searchQuery).map(p => ({ ...p, _type: 'player' }));
      const teams = searchTeams(searchQuery).map(t => ({ ...t, _type: 'team' }));
      setSearchResults([...players, ...teams]);
      setSearchOpen(true);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'compare',     label: 'Compare' },
    { id: 'teams',       label: 'Teams' },
    { id: 'glossary',    label: 'Glossary' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      background: 'rgba(6, 9, 14, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>

        {/* Logo */}
        <button
          onClick={() => onNavigate('leaderboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <LogoMark />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}>
            Court <span style={{ color: 'var(--accent)' }}>Vision</span>
          </span>
        </button>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => !link.disabled && onNavigate(link.id)}
              disabled={link.disabled}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                color: link.disabled
                  ? 'var(--text-disabled)'
                  : currentPage === link.id
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                background: currentPage === link.id ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                cursor: link.disabled ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition)',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!link.disabled && currentPage !== link.id)
                  e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                if (!link.disabled && currentPage !== link.id)
                  e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {link.label}
              {link.disabled && (
                <span style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-disabled)',
                  marginLeft: '4px',
                  verticalAlign: 'super',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>SOON</span>
              )}
            </button>
          ))}
        </div>

        {/* Right Side: Season Selector + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Season Badge */}
          <select
            value={season}
            onChange={e => onSeasonChange(e.target.value)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              padding: '5px 10px',
              cursor: 'pointer',
              outline: 'none',
              letterSpacing: '0.04em',
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: '24px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23E8A030' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            {SEASONS.map(s => (
              <option key={s} value={s} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {s}
              </option>
            ))}
          </select>

          {/* Search */}
          <div ref={searchRef} style={{ position: 'relative', width: '220px' }}>
            <div style={{ position: 'relative' }}>
              <svg
                width="14" height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              >
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                className="input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players or teams..."
                style={{ paddingLeft: '32px', fontSize: '0.80rem', height: '34px' }}
              />
            </div>

            {/* Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 200,
              }}>
                {searchResults.map(result => (
                  <button
                    key={result._type === 'team' ? `team-${result.team_id}` : result.player_id}
                    onClick={() => {
                      if (result._type === 'team') {
                        onNavigate('team', result.team_id);
                      } else {
                        onNavigate('player', result.player_id);
                      }
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background var(--transition)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                      {result._type === 'team' && (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: result.color, flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.15)',
                        }} />
                      )}
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {result.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {result._type === 'team'
                            ? result.conference
                            : `${result.team} · ${result.conference}`}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '100px',
                      background: result._type === 'team' ? `${result.color}22` : 'var(--bg-elevated)',
                      color: result._type === 'team' ? result.color : 'var(--text-secondary)',
                      border: result._type === 'team' ? `1px solid ${result.color}44` : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {result._type === 'team' ? 'TEAM' : result.position}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
