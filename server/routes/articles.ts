import express from 'express';

export const articlesRouter = express.Router();

// Dynamic import to handle both DB and file-based modes
async function getStore() {
  if (process.env.DATABASE_URL) {
    // Use DB-backed store
    const { query } = await import('../../src/lib/db.mjs' as any);
    return { mode: 'db', query };
  } else {
    // Use file-based store
    const store = await import('../../src/lib/articleStore.mjs' as any);
    return { mode: 'file', store };
  }
}

// GET /api/articles — list published articles
articlesRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20')));
    const category = req.query.category as string;
    const search = req.query.search as string;

    const { mode, store, query } = await getStore() as any;

    if (mode === 'file') {
      const result = store.getArticles({ page, limit, category, search });
      return res.json(result);
    }

    // DB mode
    let whereClause = `WHERE status = 'published'`;
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      whereClause += ` AND category = $${paramIdx++}`;
      params.push(category);
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIdx} OR meta_description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const { rows: articles } = await query(
      `SELECT id, slug, title, meta_description, category, tags, hero_url,
              reading_time, author, published_at, last_modified_at, word_count
       FROM articles ${whereClause}
       ORDER BY published_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM articles ${whereClause}`,
      params
    );

    res.json({
      articles,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('[articles] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/categories
articlesRouter.get('/categories', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;
    if (mode === 'file') {
      return res.json(store.getCategories());
    }
    const { rows } = await query(
      `SELECT category, COUNT(*)::int AS count FROM articles WHERE status = 'published' GROUP BY category ORDER BY count DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/popular
articlesRouter.get('/popular', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;
    if (mode === 'file') {
      return res.json(store.getRecentArticles(5));
    }
    const { rows } = await query(
      `SELECT id, slug, title, hero_url, category, reading_time, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/recent
articlesRouter.get('/recent', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;
    if (mode === 'file') {
      return res.json(store.getRecentArticles(5));
    }
    const { rows } = await query(
      `SELECT id, slug, title, hero_url, category, reading_time, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/slugs — for sitemap
articlesRouter.get('/slugs', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;
    if (mode === 'file') {
      return res.json(store.getAllSlugs());
    }
    const { rows } = await query(
      `SELECT slug FROM articles WHERE status = 'published' ORDER BY published_at DESC`
    );
    res.json(rows.map((r: any) => r.slug));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/articles/:slug — single article
articlesRouter.get('/:slug', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;

    if (mode === 'file') {
      const result = store.getArticleBySlug(req.params.slug);
      if (!result) return res.status(404).json({ error: 'Article not found' });
      return res.json(result);
    }

    const { rows } = await query(
      `SELECT * FROM articles WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });

    const article = rows[0];
    const { rows: related } = await query(
      `SELECT id, slug, title, hero_url, category, reading_time, published_at
       FROM articles WHERE status = 'published' AND category = $1 AND slug != $2
       ORDER BY published_at DESC LIMIT 3`,
      [article.category, article.slug]
    );

    res.json({ article, related });
  } catch (err) {
    console.error('[articles] single error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
