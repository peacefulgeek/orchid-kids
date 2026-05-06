import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

interface Category {
  category: string;
  count: number;
}

interface Article {
  slug: string;
  title: string;
  category: string;
  published_at: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Record<string, string> = {
  'understanding-hsc': 'Understanding HSC',
  'neuroscience': 'Neuroscience',
  'parenting-strategies': 'Parenting Strategies',
  'school-social': 'School & Social',
  'sensory-environment': 'Sensory & Environment',
  'emotional-wellbeing': 'Emotional Wellbeing',
  'family-dynamics': 'Family Dynamics',
  'tools-resources': 'Tools & Resources',
  'long-term': 'Long-Term Outcomes',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [recent, setRecent] = useState<Article[]>([]);

  useEffect(() => {
    // Fetch categories
    fetch('/api/articles/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch popular
    fetch('/api/articles/popular')
      .then(r => r.json())
      .then(data => setPopular(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch recent
    fetch('/api/articles/recent')
      .then(r => r.json())
      .then(data => setRecent(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Site navigation sidebar"
      role="complementary"
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/" onClick={onClose}>
          <div className="sidebar-logo-icon" aria-hidden="true">🌸</div>
          <div>
            <div className="sidebar-logo-text">Raising Orchids</div>
            <div className="sidebar-logo-tagline">Parenting the child who feels everything</div>
          </div>
        </Link>
      </div>

      {/* Author */}
      <div className="sidebar-author">
        <div className="sidebar-author-photo" aria-hidden="true">
          <span>🌺</span>
        </div>
        <div className="sidebar-author-name">The Oracle Lover</div>
        <div className="sidebar-author-title">Intuitive Educator & Oracle Guide</div>
        <p className="sidebar-author-bio">
          Demystifying the science of sensitive children for exhausted, loving parents. No toxic positivity. No catastrophizing. Just clear neuroscience and practical tools.
        </p>
        <a
          href="https://theoraclelover.com"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-author-link"
        >
          theoraclelover.com
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav" aria-label="Categories">
        <div className="sidebar-nav-title">Categories</div>
        <ul className="sidebar-nav-list" role="list">
          <li className="sidebar-nav-item">
            <NavLink
              to="/articles"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
              end
            >
              <span>All Articles</span>
              <span className="sidebar-nav-badge">
                {categories.reduce((sum, c) => sum + c.count, 0) || ''}
              </span>
            </NavLink>
          </li>
          {categories.map(cat => (
            <li key={cat.category} className="sidebar-nav-item">
              <NavLink
                to={`/category/${cat.category}`}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={onClose}
              >
                <span>{CATEGORIES[cat.category] || cat.category}</span>
                <span className="sidebar-nav-badge">{cat.count}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Assessments */}
      <nav className="sidebar-nav" aria-label="Tools">
        <div className="sidebar-nav-title">Tools</div>
        <ul className="sidebar-nav-list" role="list">
          <li className="sidebar-nav-item">
            <NavLink
              to="/assessments"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
            >
              <span>🧪 Assessments</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink
              to="/recommended"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
            >
              <span>📚 Recommended</span>
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink
              to="/supplements"
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={onClose}
            >
              <span>🌿 Supplements & Herbs</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Popular */}
      {popular.length > 0 && (
        <div className="sidebar-module">
          <div className="sidebar-module-title">Popular</div>
          <ul className="sidebar-module-list" role="list">
            {popular.map(a => (
              <li key={a.slug} className="sidebar-module-item">
                <Link to={`/articles/${a.slug}`} onClick={onClose}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div className="sidebar-module">
          <div className="sidebar-module-title">Recent</div>
          <ul className="sidebar-module-list" role="list">
            {recent.map(a => (
              <li key={a.slug} className="sidebar-module-item">
                <Link to={`/articles/${a.slug}`} onClick={onClose}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom padding */}
      <div style={{ height: 'var(--space-8)' }} />
    </aside>
  );
}
