import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function AboutPage() {
  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: 'About' }]} />

      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        {/* Author hero */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-accent-soft), var(--rose-pale))',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-10)',
          marginBottom: 'var(--space-10)',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--rose-deep))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3.5rem',
            flexShrink: 0,
            boxShadow: '0 8px 32px rgba(138, 96, 128, 0.3)',
          }} aria-hidden="true">
            🌺
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
              Author
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-2)' }}>
              The Oracle Lover
            </h1>
            <p style={{ color: 'var(--accent)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
              Intuitive Educator & Oracle Guide
            </p>
            <a
              href="https://theoraclelover.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'inline-flex' }}
            >
              Visit theoraclelover.com ↗
            </a>
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-base)', lineHeight: '1.8', color: 'var(--text-primary)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            About Raising Orchids
          </h2>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            Look, here's the thing. Most parenting advice is written for dandelion children. The ones who thrive almost anywhere.
            Standard discipline works for them. Standard sleep advice works for them. Standard school environments work for them.
          </p>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            But some children are orchids. Their nervous systems are genuinely, biologically different. They process everything more deeply.
            They feel more. They notice more. They respond more intensely to both good environments and bad ones.
          </p>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            This isn't a parenting style. It's neuroscience. The orchid hypothesis, developed by researchers Thomas Boyce and Michael Pluess,
            describes differential susceptibility — the biological reality that some children are more sensitive to environmental influence
            in both directions. In the wrong environment, they struggle. In the right one, they flourish beyond what most children can achieve.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            What You'll Find Here
          </h2>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            Raising Orchids is built on three commitments. No toxic positivity about how "orchid children are so gifted!"
            No catastrophizing either. And no standard parenting advice dressed up in sensitivity language.
          </p>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            What you'll find instead: the actual research, explained clearly. Practical tools that work specifically for highly sensitive children.
            Honest acknowledgment that this is hard. And the long view — what these children become when they get the right environment.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            The Research Foundation
          </h2>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            The work here draws primarily on Elaine Aron's foundational research on high sensitivity, Thomas Boyce's orchid/dandelion framework,
            Michael Pluess's differential susceptibility research, Jerome Kagan's temperament studies, and Mary Sheedy Kurcinka's practical work
            with spirited children.
          </p>
          <p style={{ marginBottom: 'var(--space-5)', color: 'var(--text-secondary)' }}>
            The 30% that isn't strictly neuroscience draws on Carl Jung's work on unique temperament, Angeles Arrien's frameworks,
            and Joseph Campbell's understanding of the unusual hero. Because sensitive children often grow into remarkable adults,
            and that deserves acknowledgment too.
          </p>

          <div style={{
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            marginTop: 'var(--space-8)',
          }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              "You're not a bad parent for finding this exhausting. The orchid child asks more of you.
              That's not a character flaw in either of you. It's biology."
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontWeight: 'var(--font-semibold)' }}>
              — The Oracle Lover
            </p>
          </div>

          <div style={{ marginTop: 'var(--space-10)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/articles" className="btn-primary">Read the Articles</Link>
            <Link to="/assessments" className="btn-secondary">Take an Assessment</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
