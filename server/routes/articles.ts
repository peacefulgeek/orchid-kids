import express from 'express';

export const articlesRouter = express.Router();

// File-based store only — no database
async function getStore() {
  const store = await import('../../src/lib/articleStore.mjs' as any);
  return store;
}

// GET /api/articles — list published articles
articlesRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20')));
    const category = req.query.category as string;
    const search = req.query.search as string;

    const store = await getStore();
    const result = store.getArticles({ page, limit, category, search });
    return res.json(result);
  } catch (err) {
    console.error('[articles] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/categories
articlesRouter.get('/categories', async (req, res) => {
  try {
    const store = await getStore();
    return res.json(store.getCategories());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/popular
articlesRouter.get('/popular', async (req, res) => {
  try {
    const store = await getStore();
    return res.json(store.getRecentArticles(5));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/recent
articlesRouter.get('/recent', async (req, res) => {
  try {
    const store = await getStore();
    return res.json(store.getRecentArticles(5));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/slugs — for sitemap
articlesRouter.get('/slugs', async (req, res) => {
  try {
    const store = await getStore();
    return res.json(store.getAllSlugs());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/:slug — single article
articlesRouter.get('/:slug', async (req, res) => {
  try {
    const store = await getStore();
    const result = store.getArticleBySlug(req.params.slug);
    if (!result) return res.status(404).json({ error: 'Article not found' });
    return res.json(result);
  } catch (err) {
    console.error('[articles] single error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
