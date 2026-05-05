import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface Article {
  slug: string;
  title: string;
  meta_description?: string;
  category: string;
  hero_url?: string;
  reading_time?: number;
  published_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Category {
  category: string;
  count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
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

export function ArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetch('/api/articles/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '12',
      page: String(currentPage),
    });
    if (currentCategory) params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);

    fetch(`/api/articles?${params}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setPagination(data.pagination || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentCategory, currentSearch, currentPage]);

  const setCategory = (cat: string) => {
    const p = new URLSearchParams(searchParams);
    if (cat) p.set('category', cat);
    else p.delete('category');
    p.delete('page');
    setSearchParams(p);
  };

  const setPage = (page: number) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(page));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = currentSearch
    ? `Search: "${currentSearch}"`
    : currentCategory
    ? (CATEGORY_LABELS[currentCategory] || currentCategory)
    : 'All Articles';

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: 'Articles' }]} />

      <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h1 className="section-title">
          <span className="section-title-accent" aria-hidden="true" />
          {pageTitle}
          {pagination && (
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-normal)', color: 'var(--text-muted)', marginLeft: 'var(--space-3)' }}>
              ({pagination.total})
            </span>
          )}
        </h1>

        {/* View toggle */}
        <div className="view-toggle" role="group" aria-label="View mode">
          <button
            className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button
            className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="2.5" rx="1" fill="currentColor"/>
              <rect x="1" y="6.75" width="14" height="2.5" rx="1" fill="currentColor"/>
              <rect x="1" y="11.5" width="14" height="2.5" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="category-filters" role="group" aria-label="Filter by category">
        <button
          className={`category-pill ${!currentCategory ? 'active' : ''}`}
          onClick={() => setCategory('')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.category}
            className={`category-pill ${currentCategory === cat.category ? 'active' : ''}`}
            onClick={() => setCategory(cat.category)}
          >
            {CATEGORY_LABELS[cat.category] || cat.category}
            <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '0.8em' }}>({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Search result notice */}
      {currentSearch && (
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          Showing results for "{currentSearch}" —{' '}
          <button
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.delete('search');
              setSearchParams(p);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'inherit' }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Articles */}
      {loading ? (
        <div className={view === 'grid' ? 'card-grid' : 'article-list'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {view === 'grid' && <div className="skeleton" style={{ height: '180px' }} />}
              <div style={{ padding: 'var(--space-5)' }}>
                <div className="skeleton" style={{ height: '12px', width: '60px', marginBottom: 'var(--space-3)' }} />
                <div className="skeleton" style={{ height: '20px', marginBottom: 'var(--space-2)' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className={view === 'grid' ? 'card-grid' : 'article-list'}>
          {articles.map(article => (
            <ArticleCard key={article.slug} article={article} view={view} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-16)',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🌸</div>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
            No articles found
          </p>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            {currentSearch ? 'Try a different search term.' : 'Articles are being published. Check back soon.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-10)',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn-secondary"
            style={{ padding: 'var(--space-2) var(--space-4)', minHeight: 'var(--tap-target-min)' }}
          >
            ← Previous
          </button>
          {Array.from({ length: Math.min(7, pagination.totalPages) }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setPage(page)}
                style={{
                  background: page === currentPage ? 'var(--accent)' : 'var(--bg-card)',
                  color: page === currentPage ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${page === currentPage ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-3)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--font-medium)',
                  minHeight: 'var(--tap-target-min)',
                  minWidth: '44px',
                }}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pagination.totalPages}
            className="btn-secondary"
            style={{ padding: 'var(--space-2) var(--space-4)', minHeight: 'var(--tap-target-min)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
