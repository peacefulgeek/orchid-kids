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
import { initSchema } from '../src/lib/db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

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
  // Serve images and other public files
  app.use('/images', express.static(path.join(clientDist, 'images'), {
    maxAge: '7d',
  }));
  app.use('/favicon.svg', express.static(path.join(clientDist, 'favicon.svg')));
  // Fallback: serve from public directory
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir, { maxAge: '7d' }));
}
// ── API / SEO routes ───────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/sitemap.xml', sitemapRouter);
app.use('/robots.txt', robotsRouter);
app.use('/', llmsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/assessments', assessmentsRouter);// ── SSR catch-all ───────────────────────────────────────────────
if (isProd) {
  const { renderPage } = await import('./ssr.js');
  app.get('*', renderPage);
} else {
  // In dev, Vite handles the frontend
  app.get('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));
}

// ── Start ───────────────────────────────────────────────────────
async function start() {
  try {
    if (process.env.DATABASE_URL) {
      await initSchema();
    } else {
      console.warn('[server] DATABASE_URL not set — skipping schema init');
    }
  } catch (err) {
    console.error('[server] Schema init failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] Raising Orchids running on port ${PORT} (${process.env.NODE_ENV})`);
  });
}

start();

export { app };
