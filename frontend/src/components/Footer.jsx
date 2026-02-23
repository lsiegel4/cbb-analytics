export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '28px 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Court <span style={{ color: 'var(--accent)', opacity: 0.7 }}>Vision</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Data sourced from Barttorvik / CBBData · Updated nightly
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-disabled)' }}>
            For analytical purposes only
          </span>
        </div>
      </div>
    </footer>
  );
}
