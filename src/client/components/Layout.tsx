import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { ReadingProgress } from './ReadingProgress';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const isHomePage = location.pathname === '/';

  return (
    <div className={`site-shell${isHomePage ? ' no-sidebar' : ''}`}>
      <ReadingProgress />

      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — hidden on homepage */}
      {!isHomePage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {isHomePage && sidebarOpen && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="main-content">
        {/* Top navigation bar */}
        <nav className="top-nav" role="navigation" aria-label="Main navigation">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <ul className="top-nav-links" role="list">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/articles" className={({ isActive }) => isActive ? 'active' : ''}>
                Articles
              </NavLink>
            </li>
            <li>
              <NavLink to="/assessments" className={({ isActive }) => isActive ? 'active' : ''}>
                Assessments
              </NavLink>
            </li>
            <li>
              <NavLink to="/recommended" className={({ isActive }) => isActive ? 'active' : ''}>
                Recommended
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                About
              </NavLink>
            </li>
          </ul>

          <div className="top-nav-search">
            <SearchBar />
          </div>
        </nav>

        {/* Page content */}
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/articles?search=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form onSubmit={handleSearch} role="search">
      <input
        type="search"
        className="search-input"
        placeholder="Search articles..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search articles"
      />
    </form>
  );
}
