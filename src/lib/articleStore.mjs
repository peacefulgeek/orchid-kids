/**
 * articleStore.mjs
 * Provides article data from either PostgreSQL (when DATABASE_URL is set)
 * or from the local JSON seed file (fallback for development / no-DB mode).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

let _articles = null;

function findSeedPath() {
  // Try multiple possible locations (works in both dev and bundled dist)
  const candidates = [
    // Relative to CWD (works when running from project root)
    resolve(process.cwd(), 'scripts/seed-articles.json'),
    // Relative to dist/index.js location
    resolve(process.cwd(), '../scripts/seed-articles.json'),
    // Absolute from known project root
    '/home/ubuntu/raising-orchids/scripts/seed-articles.json',
  ];
  for (const p of candidates) {
    try { readFileSync(p, 'utf8'); return p; } catch {}
  }
  return candidates[0]; // fallback
}

function loadArticles() {
  if (_articles) return _articles;
  try {
    const seedPath = findSeedPath();
    const raw = readFileSync(seedPath, 'utf8');
    const data = JSON.parse(raw);
    // Normalize fields
    _articles = data.map((a, i) => ({
      id: i + 1,
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description || a.excerpt || '',
      category: a.category,
      tags: a.tags || [],
      hero_url: a.hero_url || a.image_url || '/images/hero-home.jpg',
      reading_time: a.reading_time || a.read_time || 7,
      author: a.author || 'The Raising Orchids Team',
      body: a.body || a.content || '',
      word_count: a.word_count || Math.round((a.body || a.content || '').split(' ').length),
      status: 'published',
      published_at: new Date(Date.now() - (data.length - i) * 24 * 60 * 60 * 1000).toISOString(),
      last_modified_at: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[articleStore] Failed to load seed articles:', err.message);
    _articles = [];
  }
  return _articles;
}

export function getArticles({ page = 1, limit = 20, category, search } = {}) {
  let articles = loadArticles();

  if (category) {
    articles = articles.filter(a => a.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.meta_description.toLowerCase().includes(q)
    );
  }

  const total = articles.length;
  const offset = (page - 1) * limit;
  const paginated = articles.slice(offset, offset + limit);

  return {
    articles: paginated.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description,
      category: a.category,
      tags: a.tags,
      hero_url: a.hero_url,
      reading_time: a.reading_time,
      author: a.author,
      published_at: a.published_at,
      last_modified_at: a.last_modified_at,
      word_count: a.word_count,
    })),
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function getArticleBySlug(slug) {
  const articles = loadArticles();
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;

  const related = articles
    .filter(a => a.category === article.category && a.slug !== slug)
    .slice(0, 3)
    .map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      hero_url: a.hero_url,
      category: a.category,
      reading_time: a.reading_time,
      published_at: a.published_at,
    }));

  return { article, related };
}

export function getCategories() {
  const articles = loadArticles();
  const counts = {};
  for (const a of articles) {
    counts[a.category] = (counts[a.category] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRecentArticles(limit = 5) {
  const articles = loadArticles();
  return articles.slice(0, limit).map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    hero_url: a.hero_url,
    category: a.category,
    reading_time: a.reading_time,
    published_at: a.published_at,
  }));
}

export function getAllSlugs() {
  return loadArticles().map(a => a.slug);
}
