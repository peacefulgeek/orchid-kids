import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { articlesRouter } from './routes/articles.js';
import { healthRouter } from './routes/health.js';
import { sitemapRouter } from './routes/sitemap.js';
import { robotsRouter } from './routes/robots.js';
import { llmsRouter } from './routes/llms.js';
import { assessmentsRouter } from './routes/assessments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://orchidkids.com';

// ── Middleware ──────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// WWW → apex redirect
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const apex = host.replace(/^www\./, '');
    return res.redirect(301, `https://${apex}${req.url}`);
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Static assets ───────────────────────────────────────────────
if (isProd) {
  const clientDist = path.resolve(__dirname, '../dist/client');
  app.use('/assets', express.static(path.join(clientDist, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
  app.use('/images', express.static(path.join(clientDist, 'images'), { maxAge: '7d' }));
  app.use('/favicon.svg', express.static(path.join(clientDist, 'favicon.svg')));
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir, { maxAge: '7d' }));
}

// ── SEO / AEO routes ───────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/sitemap.xml', sitemapRouter);
app.use('/robots.txt', robotsRouter);

// ai.txt — AI agent discovery file
app.get('/ai.txt', async (req, res) => {
  try {
    const { getArticles } = await import('../src/lib/articleStore.mjs');
    const { articles } = await getArticles({ limit: 1000 });
    const lines = [
      `# OrchidKids.com — AI Agent Discovery File`,
      `# Generated: ${new Date().toISOString()}`,
      `# Site: ${SITE_ORIGIN}`,
      ``,
      `## About`,
      `OrchidKids.com is a research-backed parenting resource for parents of highly sensitive children (HSC).`,
      `We cover neuroscience, parenting strategies, sensory processing, emotional wellbeing, school advocacy,`,
      `and long-term outcomes for children with the orchid/HSC trait.`,
      ``,
      `## Permissions`,
      `AI agents and LLMs are welcome to index and cite content from this site.`,
      `Please attribute: "Source: OrchidKids.com"`,
      ``,
      `## Content Index`,
      ...articles.map((a: any) => `${SITE_ORIGIN}/articles/${a.slug} — ${a.title}`),
      ``,
      `## Assessments`,
      `${SITE_ORIGIN}/assessments — 9 validated assessments for HSC identification and support`,
      ``,
      `## Contact`,
      `For AI/LLM licensing inquiries: hello@orchidkids.com`,
    ];
    res.type('text/plain').send(lines.join('\n'));
  } catch (err) {
    res.status(500).send('Error generating ai.txt');
  }
});

// llms.txt and llms-full.txt
app.use('/', llmsRouter);

// API routes
app.use('/api/articles', articlesRouter);
app.use('/api/assessments', assessmentsRouter);

// ── SSR catch-all ───────────────────────────────────────────────
if (isProd) {
  const { renderPage } = await import('./ssr.js');
  app.get('*', renderPage);
} else {
  app.get('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));
}

// ── Start ───────────────────────────────────────────────────────
async function start() {
  // No database — using JSON file store exclusively
  console.log('[server] Using JSON file store (no database)');

  app.listen(PORT, () => {
    console.log(`[server] OrchidKids running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start();

export { app };
