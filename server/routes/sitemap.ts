import express from 'express';
import { getArticles } from '../../src/lib/articleStore.mjs';

export const sitemapRouter = express.Router();

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://raisingorchids.com';

sitemapRouter.get('/', async (req, res) => {
  try {
    const { articles } = await getArticles({ limit: 1000 });

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/articles', priority: '0.9', changefreq: 'daily' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
      { loc: '/recommended', priority: '0.8', changefreq: 'weekly' },
      { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { loc: '/assessments', priority: '0.8', changefreq: 'monthly' },
    ];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${SITE_ORIGIN}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
      ...articles.map((a: any) => `
  <url>
    <loc>${SITE_ORIGIN}/articles/${a.slug}</loc>
    <lastmod>${new Date(a.last_modified_at || a.published_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('[sitemap] error:', err);
    res.status(500).send('Error generating sitemap');
  }
});
