import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';

interface Article {
  slug: string;
  title: string;
  meta_description?: string;
  category: string;
  hero_url?: string;
  reading_time?: number;
  published_at?: string;
}

const FEATURED_TOPICS = [
  { icon: '🧠', label: 'Neuroscience', slug: 'neuroscience', desc: 'The biology behind sensitivity' },
  { icon: '💛', label: 'Parenting Strategies', slug: 'parenting-strategies', desc: 'What actually works' },
  { icon: '🏫', label: 'School & Social', slug: 'school-social', desc: 'Navigating the outside world' },
  { icon: '🌿', label: 'Sensory Environment', slug: 'sensory-environment', desc: 'Creating calm at home' },
  { icon: '💜', label: 'Emotional Wellbeing', slug: 'emotional-wellbeing', desc: 'Feelings and regulation' },
  { icon: '🌱', label: 'Long-Term Outcomes', slug: 'long-term', desc: 'What sensitive kids become' },
];

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles?limit=6')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-eyebrow">For Parents of Highly Sensitive Children</div>
          <h1 className="hero-title">
            Your child doesn't need to be <em>fixed</em>.<br />
            They need the right environment.
          </h1>
          <p className="hero-description">
            The research-backed, shame-free resource for parents of orchid children.
            Clear neuroscience. Practical tools. No toxic positivity.
          </p>
          <div className="hero-cta-group">
            <Link to="/articles" className="btn-primary">
              Start Reading
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/assessments" className="btn-secondary">
              Take an Assessment
            </Link>
          </div>
        </div>
      </section>

      <div className="page-content">
        {/* What is an Orchid Child */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-accent-soft), var(--rose-pale))',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}>
            <div>
              <div className="hero-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>The Orchid Hypothesis</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', lineHeight: '1.2' }}>
                Some children are orchids. Most are dandelions.
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 'var(--space-4)' }}>
                Dandelion children thrive almost anywhere. Orchid children are exquisitely sensitive to their environment.
                In the wrong conditions, they struggle. In the right ones, they flourish beyond anything a dandelion can achieve.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                This isn't a metaphor. It's the science of differential susceptibility, developed by researchers Thomas Boyce and Michael Pluess.
                Your child's nervous system is genuinely different. Here's what that means in practice.
              </p>
              <Link to="/articles/the-orchid-and-the-dandelion-thomas-boyces-biology-of-sensitivity" className="btn-primary">
                Read the Science
              </Link>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-soft), var(--rose-pale))',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8)',
              textAlign: 'center',
              fontSize: '6rem',
              lineHeight: 1,
            }} aria-hidden="true">
              🌸
            </div>
          </div>
        </section>

        {/* Topic grid */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-accent" aria-hidden="true" />
              Explore by Topic
            </h2>
            <Link to="/articles" className="section-link">
              All articles
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-4)',
          }}>
            {FEATURED_TOPICS.map(topic => (
              <Link
                key={topic.slug}
                to={`/category/${topic.slug}`}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  transition: 'all var(--transition-base)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-light)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.borderColor = '';
                }}
              >
                <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
                  {topic.icon}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {topic.label}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {topic.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest articles */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-accent" aria-hidden="true" />
              Latest Articles
            </h2>
            <Link to="/articles" className="section-link">
              View all
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="card-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ height: '180px' }} />
                  <div style={{ padding: 'var(--space-5)' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60px', marginBottom: 'var(--space-3)' }} />
                    <div className="skeleton" style={{ height: '20px', marginBottom: 'var(--space-2)' }} />
                    <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="card-grid">
              {articles.map(article => (
                <ArticleCard key={article.slug} article={article} view="grid" />
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
                Articles coming soon
              </p>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                The content engine is warming up. Check back shortly.
              </p>
            </div>
          )}
        </section>

        {/* Assessment CTA */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--rose-deep) 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-10) var(--space-8)',
            color: 'white',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-3)', opacity: 0.8 }}>
                Free Assessment
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-3)', lineHeight: '1.2' }}>
                Is my child highly sensitive?
              </h2>
              <p style={{ opacity: 0.85, lineHeight: '1.7', maxWidth: '500px' }}>
                Take our research-based assessment. 15 questions. Clear results. No email required.
                Based on Elaine Aron's HSC scale.
              </p>
            </div>
            <div>
              <Link
                to="/assessments/is-my-child-highly-sensitive"
                style={{
                  background: 'white',
                  color: 'var(--accent-dark)',
                  padding: 'var(--space-4) var(--space-8)',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'var(--font-bold)',
                  fontSize: 'var(--text-base)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  textDecoration: 'none',
                }}
              >
                Take the Assessment
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Quote */}
        <section style={{ marginBottom: 'var(--space-12)', textAlign: 'center' }}>
          <blockquote style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: 'var(--space-8)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              marginBottom: 'var(--space-4)',
            }}>
              "The sensitivity is a feature, not a defect. But it needs a specific environment to thrive."
            </p>
            <footer style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontWeight: 'var(--font-semibold)' }}>
              — The Oracle Lover
            </footer>
          </blockquote>
        </section>
      </div>
    </div>
  );
}
