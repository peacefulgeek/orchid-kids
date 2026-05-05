import { Breadcrumbs } from '../components/Breadcrumbs';

export function PrivacyPage() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="page-content">
      <Breadcrumbs items={[{ name: 'Privacy Policy' }]} />

      <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-extrabold)', marginBottom: 'var(--space-3)' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Last updated: {today}
        </p>

        <div style={{ fontSize: 'var(--text-base)', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <h2 id="affiliate" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Amazon Affiliate Disclosure
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            Raising Orchids is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program
            designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            When you click on links to Amazon products on this site and make a purchase, we may earn a commission.
            This does not affect the price you pay. All product recommendations are based on genuine usefulness
            for highly sensitive children and their families.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            All Amazon affiliate links on this site are marked with "(paid link)" to ensure full transparency.
          </p>

          <h2 id="medical" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Medical Disclaimer
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            The content on Raising Orchids is for informational and educational purposes only. It is not intended
            to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice
            of your physician, pediatrician, psychologist, or other qualified health provider with any questions
            you may have regarding your child's health or development.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            High sensitivity (HSC/HSP) is not a medical diagnosis. The information on this site is based on
            published research and is intended to support parents in understanding their children, not to
            diagnose or treat any condition.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Information We Collect
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            Raising Orchids collects minimal data. When you use our assessments, we store your answers and results
            anonymously using a session identifier. We do not collect your name, email address, or any personally
            identifiable information unless you voluntarily provide it.
          </p>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            Like most websites, we collect standard server logs including IP addresses, browser type, and pages visited.
            This data is used for site maintenance and security purposes only.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Cookies
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            This site uses minimal cookies for basic functionality. We do not use tracking cookies or advertising cookies.
            We do not use Google Analytics or any third-party analytics service.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Third-Party Links
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            This site contains links to Amazon.com and other third-party websites. We are not responsible for the
            privacy practices of those sites. We encourage you to review the privacy policies of any third-party
            sites you visit.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', marginTop: 'var(--space-8)', color: 'var(--text-primary)' }}>
            Contact
          </h2>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            For privacy-related questions, please visit{' '}
            <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer">
              theoraclelover.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
