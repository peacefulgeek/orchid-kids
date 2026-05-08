import { Link } from 'react-router-dom';

interface Article {
  slug: string;
  title: string;
  meta_description?: string;
  category: string;
  hero_url?: string;
  reading_time?: number;
  published_at?: string;
}

interface ArticleCardProps {
  article: Article;
  view?: 'grid' | 'list';
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

const CATEGORY_EMOJIS: Record<string, string> = {
  'understanding-hsc': '🌸',
  'neuroscience': '🧠',
  'parenting-strategies': '💛',
  'school-social': '🏫',
  'sensory-environment': '🌿',
  'emotional-wellbeing': '💜',
  'family-dynamics': '👨‍👩‍👧',
  'tools-resources': '🛠️',
  'long-term': '🌱',
  'long-term-outcomes': '🌱',
};

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ArticleCard({ article, view = 'grid' }: ArticleCardProps) {
  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;
  const emoji = CATEGORY_EMOJIS[article.category] || '🌸';

  if (view === 'list') {
    return (
      <article className="article-list-item">
        <div className="article-list-image">
          {article.hero_url ? (
            <img src={article.hero_url} alt={article.title} loading="lazy" />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--bg-hero), var(--rose-pale))',
              fontSize: '1.5rem'
            }}>
              {emoji}
            </div>
          )}
        </div>
        <div className="article-list-body">
          <div className="article-card-category">{categoryLabel}</div>
          <h3 className="article-list-title">
            <Link to={`/articles/${article.slug}`}>{article.title}</Link>
          </h3>
          {article.meta_description && (
            <p className="article-card-excerpt">{article.meta_description}</p>
          )}
          <div className="article-card-meta">
            {article.reading_time && <span>{article.reading_time} min read</span>}
            {article.reading_time && article.published_at && (
              <span className="article-card-meta-dot" aria-hidden="true" />
            )}
            {article.published_at && <span>{formatDate(article.published_at)}</span>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="article-card">
      <div className="article-card-image">
        {article.hero_url ? (
          <img src={article.hero_url} alt={article.title} loading="lazy" />
        ) : (
          <div className="article-card-image-placeholder" aria-hidden="true">
            {emoji}
          </div>
        )}
      </div>
      <div className="article-card-body">
        <div className="article-card-category">{categoryLabel}</div>
        <h3 className="article-card-title">
          <Link to={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>
        {article.meta_description && (
          <p className="article-card-excerpt">{article.meta_description}</p>
        )}
        <div className="article-card-meta">
          {article.reading_time && <span>{article.reading_time} min read</span>}
          {article.reading_time && article.published_at && (
            <span className="article-card-meta-dot" aria-hidden="true" />
          )}
          {article.published_at && <span>{formatDate(article.published_at)}</span>}
        </div>
      </div>
    </article>
  );
}
