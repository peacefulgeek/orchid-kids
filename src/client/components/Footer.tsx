import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-name">🌸 Raising Orchids</div>
          <p className="footer-brand-desc">
            The research-backed, shame-free resource for parents of highly sensitive children.
            What the sensitivity actually is, why standard parenting advice doesn't work, and what does.
          </p>
          <p className="footer-affiliate-disclosure">
            As an Amazon Associate I earn from qualifying purchases.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Explore</div>
          <ul className="footer-links" role="list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/articles">All Articles</Link></li>
            <li><Link to="/assessments">Assessments</Link></li>
            <li><Link to="/recommended">Recommended</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links" role="list">
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/privacy#affiliate">Affiliate Disclosure</Link></li>
            <li><Link to="/privacy#medical">Medical Disclaimer</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Connect</div>
          <ul className="footer-links" role="list">
            <li>
              <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer">
                The Oracle Lover ↗
              </a>
            </li>
          </ul>
          <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)' }}>
            Parenting the orchid child
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Raising Orchids. All rights reserved.</span>
        <span>
          Written by{' '}
          <a
            href="https://theoraclelover.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            The Oracle Lover
          </a>
        </span>
      </div>
    </footer>
  );
}
