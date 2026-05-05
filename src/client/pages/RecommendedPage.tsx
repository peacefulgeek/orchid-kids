import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface Product {
  asin: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  why: string;
}

const PRODUCTS: Product[] = [
  // Books
  { asin: '0767908724', name: 'The Highly Sensitive Child by Elaine Aron', description: 'The foundational book. Elaine Aron\'s research-based guide to raising children who feel everything more deeply. Start here.', category: 'Books', tags: ['hsc', 'foundational'], why: 'The research that started it all. Required reading.' },
  { asin: '0316498866', name: 'The Orchid and the Dandelion by Thomas Boyce', description: 'The pediatrician who developed the orchid hypothesis explains the biology of sensitivity in clear, compelling terms.', category: 'Books', tags: ['neuroscience', 'orchid'], why: 'The science behind why your child is the way they are.' },
  { asin: '0316017566', name: 'Raising Your Spirited Child by Mary Sheedy Kurcinka', description: 'Practical strategies for the child who is more — more intense, more sensitive, more persistent. Deeply practical.', category: 'Books', tags: ['parenting', 'practical'], why: 'The most practical parenting book for sensitive kids.' },
  { asin: '0684834588', name: 'The Out-of-Sync Child by Carol Kranowitz', description: 'Understanding sensory processing differences and what to do about them. Essential for parents navigating sensory challenges.', category: 'Books', tags: ['sensory', 'spd'], why: 'If sensory processing is part of the picture, this is essential.' },
  { asin: '0062699547', name: 'The Highly Sensitive Person by Elaine Aron', description: 'The adult version — helps HSP parents understand their own sensitivity alongside their child\'s.', category: 'Books', tags: ['hsp', 'adult', 'parent'], why: 'If you\'re also highly sensitive, this explains you.' },

  // Sensory tools
  { asin: 'B07NQBQB9K', name: 'BuddyPhones School+ Kids Headphones', description: 'Volume-limited noise-canceling headphones designed specifically for children. Adjustable, durable, and actually comfortable.', category: 'Sensory Tools', tags: ['noise', 'sensory', 'school'], why: 'For the child who is overwhelmed by classroom noise.' },
  { asin: 'B08CJQRBBM', name: 'Puro Sound Labs BT2200 Kids Headphones', description: 'Safe volume headphones with 22-hour battery life. Excellent sound quality without the ear damage risk.', category: 'Sensory Tools', tags: ['noise', 'sensory', 'headphones'], why: 'Protects hearing while reducing sensory overload.' },
  { asin: 'B07YWKXD1D', name: 'Calm Strips Sensory Stickers', description: 'Textured adhesive strips that provide tactile input without being distracting. Desk-friendly, school-approved.', category: 'Sensory Tools', tags: ['tactile', 'fidget', 'school'], why: 'Quiet sensory input that doesn\'t disrupt class.' },
  { asin: 'B01N1UE0GQ', name: 'Fidget Cube by Antsy Labs', description: 'The original fidget cube. Six sides, six different sensory inputs. Discreet enough for classroom use.', category: 'Sensory Tools', tags: ['fidget', 'tactile', 'focus'], why: 'Gives hands something to do so the brain can focus.' },
  { asin: 'B00BWPB3GO', name: 'Time Timer 8-inch Visual Timer', description: 'Visual representation of time passing. Reduces transition anxiety by making abstract time concrete and visible.', category: 'Sensory Tools', tags: ['transitions', 'time', 'anxiety'], why: 'Transitions are hard for HSC kids. This helps.' },
  { asin: 'B07YKJHM9P', name: 'Disc\'O\'Sit Junior Wobble Cushion', description: 'Inflatable sensory cushion that allows subtle movement while seated. Improves focus and reduces restlessness.', category: 'Sensory Tools', tags: ['movement', 'focus', 'school'], why: 'For the child who can\'t sit still — because movement helps them focus.' },

  // Sleep
  { asin: 'B07NQBQB9K', name: 'Hatch Rest+ Sound Machine & Night Light', description: 'Combines white noise, night light, and morning clock. Programmable routines that help sensitive children transition to sleep.', category: 'Sleep', tags: ['sleep', 'routine', 'noise'], why: 'Sleep is harder for HSC kids. This addresses multiple factors at once.' },
  { asin: 'B07YKJHM9P', name: 'SensaCalm Weighted Blanket for Kids (5 lbs)', description: 'Therapeutic weighted blanket sized for children. Deep pressure stimulation that activates the parasympathetic nervous system.', category: 'Sleep', tags: ['weighted', 'sleep', 'anxiety'], why: 'Deep pressure is one of the most evidence-supported sensory interventions.' },

  // Emotional tools
  { asin: 'B07NQBQB9K', name: 'The Zones of Regulation Curriculum', description: 'A framework for teaching children to identify and manage their emotional states. Used by occupational therapists worldwide.', category: 'Emotional Tools', tags: ['emotions', 'regulation', 'school'], why: 'Gives children language for what they\'re experiencing.' },
  { asin: 'B01N1UE0GQ', name: 'Feelings Chart for Kids (Laminated Poster)', description: 'Visual feelings vocabulary chart. Helps children identify and name emotions they can\'t yet articulate.', category: 'Emotional Tools', tags: ['emotions', 'vocabulary', 'feelings'], why: 'HSC kids feel intensely but often can\'t name what they feel.' },
];

const CATEGORY_ORDER = ['Books', 'Sensory Tools', 'Sleep', 'Emotional Tools'];

export function RecommendedPage() {
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = PRODUCTS.filter(p => p.category === cat);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: 'Sensitive Child Library' }]} />

      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-3)' }}>
          Sensitive Child Library
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', lineHeight: '1.7', maxWidth: '640px', marginBottom: 'var(--space-2)' }}>
          Tools, books, and resources that actually help. Curated for parents of highly sensitive children.
          Every recommendation is based on research and real-world use.
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          As an Amazon Associate, I earn from qualifying purchases.
        </p>
      </div>

      {CATEGORY_ORDER.map(category => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;

        return (
          <section key={category} style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '2px solid var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}>
              <span aria-hidden="true">
                {category === 'Books' ? '📚' : category === 'Sensory Tools' ? '🌿' : category === 'Sleep' ? '🌙' : '💜'}
              </span>
              {category}
            </h2>

            <div className="products-grid">
              {items.map(product => (
                <div key={product.asin} className="product-card">
                  <div className="product-category-tag">{product.category}</div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-dark)',
                    fontStyle: 'italic',
                    marginBottom: 'var(--space-4)',
                    background: 'var(--accent-soft)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    Why we recommend it: {product.why}
                  </p>
                  <a
                    href={`https://www.amazon.com/dp/${product.asin}?tag=spankyspinola-20`}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="product-link"
                  >
                    View on Amazon
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M1 11L11 1M11 1H5M11 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </a>
                  <span className="disclosure" style={{ marginTop: 'var(--space-2)', display: 'block' }}>(paid link)</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div style={{
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        marginTop: 'var(--space-8)',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          <strong>Affiliate disclosure:</strong> As an Amazon Associate, I earn from qualifying purchases.
          All product recommendations are based on research and usefulness for highly sensitive children.
          The affiliate relationship does not influence which products are recommended.
        </p>
      </div>
    </div>
  );
}
