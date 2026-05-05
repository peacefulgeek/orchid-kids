import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ArticleCard } from '../components/ArticleCard';

interface Article {
  id: number;
  slug: string;
  title: string;
  meta_description?: string;
  category: string;
  tags?: string[];
  hero_url?: string;
  reading_time?: number;
  published_at?: string;
  last_modified_at?: string;
  body: string;
  author: string;
  word_count?: number;
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

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/articles/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setArticle(data.article);
        setRelated(data.related || []);
        setLoading(false);

        // Update document title
        if (data.article) {
          document.title = `${data.article.title} | Raising Orchids`;
        }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="article-body">
          <div className="skeleton" style={{ height: '40px', width: '60%', marginBottom: 'var(--space-4)' }} />
          <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-8)' }} />
          {[1,2,3,4].map(i => (
            <div key={i} style={{ marginBottom: 'var(--space-4)' }}>
              <div className="skeleton" style={{ height: '16px', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '16px', width: '90%', marginBottom: 'var(--space-2)' }} />
              <div className="skeleton" style={{ height: '16px', width: '75%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🌸</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>
          Article not found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          This article may have moved or isn't published yet.
        </p>
        <Link to="/articles" className="btn-primary">Browse all articles</Link>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;

  return (
    <div className="page-content">
      <Breadcrumbs items={[
        { name: 'Articles', path: '/articles' },
        { name: categoryLabel, path: `/category/${article.category}` },
        { name: article.title },
      ]} />

      <article className="article-body" itemScope itemType="https://schema.org/Article">

        {/* Hero image */}
        {article.hero_url ? (
          <img
            src={article.hero_url}
            alt={article.title}
            className="article-hero"
            itemProp="image"
            loading="eager"
          />
        ) : (
          <div className="article-hero-placeholder" aria-hidden="true">🌸</div>
        )}

        {/* Title */}
        <h1 className="article-title" itemProp="headline">{article.title}</h1>

        {/* Meta */}
        <div className="article-meta">
          <div className="article-meta-author">
            <div className="article-meta-author-avatar" aria-hidden="true">OL</div>
            <span itemProp="author" itemScope itemType="https://schema.org/Person">
              <span itemProp="name">
                <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>
                  {article.author}
                </a>
              </span>
            </span>
          </div>
          <span className="article-card-meta-dot" aria-hidden="true" />
          <span className="article-card-category">{categoryLabel}</span>
          {article.reading_time && (
            <>
              <span className="article-card-meta-dot" aria-hidden="true" />
              <span>{article.reading_time} min read</span>
            </>
          )}
          {article.published_at && (
            <>
              <span className="article-card-meta-dot" aria-hidden="true" />
              <time dateTime={article.published_at} itemProp="datePublished">
                {formatDate(article.published_at)}
              </time>
            </>
          )}
          {article.last_modified_at && (
            <time dateTime={article.last_modified_at} itemProp="dateModified" style={{ display: 'none' }}>
              {article.last_modified_at}
            </time>
          )}
        </div>

        {/* Article body */}
        <div
          className="article-content"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent-dark)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Affiliate disclosure */}
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          marginTop: 'var(--space-8)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}>
          As an Amazon Associate, I earn from qualifying purchases.
        </p>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section style={{ marginTop: 'var(--space-12)', maxWidth: 'var(--max-content-width)', margin: 'var(--space-12) auto 0' }}>
          <div className="section-header">
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>
              <span className="section-title-accent" aria-hidden="true" />
              Related Articles
            </h2>
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {related.map(a => (
              <ArticleCard key={a.slug} article={a} view="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
