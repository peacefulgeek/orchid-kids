import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  'long-term-outcomes': 'Long-Term Outcomes',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'understanding-hsc': 'The foundational science of highly sensitive children — what the research actually says, and what it means for your family.',
  'neuroscience': 'The biology behind sensitivity. Differential susceptibility, stress reactivity, and the orchid hypothesis explained clearly.',
  'parenting-strategies': 'What works for highly sensitive children that doesn\'t work for most kids. Practical, evidence-based approaches.',
  'school-social': 'Navigating school, friendships, and the social world with a child whose nervous system processes everything more deeply.',
  'sensory-environment': 'Creating home environments that support rather than overwhelm. Sensory tools, sleep, food, and space.',
  'emotional-wellbeing': 'Understanding emotional intensity, meltdowns, empathy overload, and how to support your child\'s inner world.',
  'family-dynamics': 'Siblings, grandparents, partners, and the whole family system when one child is highly sensitive.',
  'tools-resources': 'Occupational therapy, weighted blankets, sensory tools, and what the evidence actually shows.',
  'long-term': 'What highly sensitive children become as adults. Building resilience without breaking the sensitivity.',
  'long-term-outcomes': 'What highly sensitive children become as adults. Building resilience without breaking the sensitivity.',
};

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    fetch(`/api/articles?category=${category}&limit=50`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  const label = CATEGORY_LABELS[category || ''] || category || 'Category';
  const description = CATEGORY_DESCRIPTIONS[category || ''];

  return (
    <div className="page-content">
      <Breadcrumbs items={[
        { name: 'Articles', path: '/articles' },
        { name: label },
      ]} />

      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-3)' }}>
          {label}
        </h1>
        {description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', lineHeight: '1.7', maxWidth: '640px' }}>
            {description}
          </p>
        )}
      </div>

      <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {loading ? 'Loading...' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
        </div>
        <div className="view-toggle" role="group" aria-label="View mode">
          <button className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} aria-label="Grid view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} aria-label="List view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="2.5" rx="1" fill="currentColor"/>
              <rect x="1" y="6.75" width="14" height="2.5" rx="1" fill="currentColor"/>
              <rect x="1" y="11.5" width="14" height="2.5" rx="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: '180px' }} />
              <div style={{ padding: 'var(--space-5)' }}>
                <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: 'var(--space-3)' }} />
                <div className="skeleton" style={{ height: '16px', marginBottom: 'var(--space-2)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className={view === 'grid' ? 'card-grid' : 'article-list'}>
          {articles.map(a => <ArticleCard key={a.slug} article={a} view={view} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🌸</div>
          <p>No articles in this category yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
