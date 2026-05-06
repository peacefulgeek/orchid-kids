/**
 * Cron: generate-article.mjs
 * Generates or releases one article per invocation.
 * Called by start-with-cron.mjs on schedule.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, '..', '..', 'scripts', 'seed-articles.json');
const MAX_ATTEMPTS = 4;

function loadStore() {
  if (!existsSync(STORE_PATH)) return { articles: [] };
  try { return JSON.parse(readFileSync(STORE_PATH, 'utf8')); }
  catch { return { articles: [] }; }
}

function saveStore(store) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

/**
 * Phase determination:
 *   Phase 1: published_count < 60  → 5 articles/day
 *   Phase 2: published_count >= 60 → 1 article/weekday
 */
export function getPhase(publishedCount) {
  return publishedCount < 60 ? 1 : 2;
}

/**
 * Main function called by cron.
 * @param {Object} opts
 * @param {number} opts.allowedPhase - 1 or 2
 */
export async function generateOrReleaseArticle({ allowedPhase = 1 } = {}) {
  const store = loadStore();
  const publishedCount = store.articles.filter(a => a.status === 'published').length;
  const currentPhase = getPhase(publishedCount);

  if (currentPhase !== allowedPhase) {
    console.log(`[generate-article] Phase mismatch: current=${currentPhase}, allowed=${allowedPhase}. Skip.`);
    return;
  }

  // Check if there's a queued article ready to publish
  const today = new Date().toISOString().split('T')[0];
  const queued = store.articles.find(a =>
    a.status === 'queued' && a.published_at && a.published_at <= today
  );

  if (queued) {
    queued.status = 'published';
    saveStore(store);
    console.log(`[generate-article] Released queued article: ${queued.slug}`);
    return;
  }

  // No queued article — generate a new one if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.log('[generate-article] No OPENAI_API_KEY set, cannot generate.');
    return;
  }

  const { generateArticle } = await import('../lib/deepseek-generate.mjs');
  const { runQualityGate } = await import('../lib/article-quality-gate.mjs');
  const { assignHeroImage } = await import('../lib/bunny.mjs');

  // Pick a topic not yet in the store
  const { ALL_TOPICS } = await import('../../scripts/bulk-seed.mjs').catch(() => ({ ALL_TOPICS: [] }));
  const existingSlugs = new Set(store.articles.map(a => a.slug));
  const pending = (ALL_TOPICS || []).filter(t => !existingSlugs.has(slugify(t.title)));

  if (pending.length === 0) {
    console.log('[generate-article] All topics exhausted.');
    return;
  }

  const topic = pending[0];
  const internalLinks = store.articles
    .filter(a => a.category === topic.category)
    .slice(0, 6)
    .map(a => ({ title: a.title, slug: a.slug }));

  let generated = null;
  let gate = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      generated = await generateArticle({ ...topic, internalLinks });
      gate = runQualityGate(generated.body);
      if (gate.passed) break;
      console.warn(`[generate-article] Gate attempt ${attempt} failed:`, gate.failures.slice(0, 3));
    } catch (err) {
      console.error(`[generate-article] Attempt ${attempt} error:`, err.message);
    }
  }

  if (!generated || !gate?.passed) {
    console.error(`[generate-article] Quality gate exhausted for: ${topic.title}`);
    return;
  }

  const heroUrl = await assignHeroImage(generated.slug).catch(() =>
    `https://orchid-kids2.b-cdn.net/library/lib-${String(Math.floor(Math.random() * 40) + 1).padStart(2, '0')}.webp`
  );

  const article = {
    id: store.articles.length + 1,
    slug: generated.slug,
    title: topic.title,
    category: topic.category,
    tags: topic.tags,
    excerpt: generated.excerpt,
    body: generated.body,
    hero_url: heroUrl,
    author: 'Dr. Maya Chen',
    read_time: Math.ceil(generated.body.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200),
    status: 'published',
    published_at: today,
    created_at: new Date().toISOString(),
    asins_used: generated.asins,
  };

  store.articles.push(article);
  saveStore(store);
  console.log(`[generate-article] Published: ${article.slug}`);
}
