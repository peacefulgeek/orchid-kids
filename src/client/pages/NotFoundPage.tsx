import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-content" style={{ textAlign: 'center', padding: 'var(--space-20) var(--space-8)' }}>
      <div style={{ fontSize: '5rem', marginBottom: 'var(--space-6)' }} aria-hidden="true">🌸</div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-4)' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-8)', maxWidth: '400px', margin: '0 auto var(--space-8)' }}>
        This page doesn't exist. Even orchid children can get lost sometimes.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/articles" className="btn-secondary">Browse Articles</Link>
      </div>
    </div>
  );
}
