#!/usr/bin/env node
/**
 * Cron system for Raising Orchids
 * - Publishes scheduled articles (date-gating)
 * - Regenerates sitemap cache
 * - Runs daily at 06:00 UTC
 */
import pg from 'pg';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

async function publishScheduledArticles() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE articles
      SET published = true
      WHERE published = false
        AND publish_date <= NOW()
      RETURNING slug, title
    `);
    if (result.rows.length > 0) {
      console.log(`[cron] Published ${result.rows.length} scheduled articles:`);
      result.rows.forEach((r) => console.log(`  - ${r.slug}`));
    } else {
      console.log('[cron] No articles to publish');
    }
    return result.rows;
  } finally {
    client.release();
  }
}

async function regenerateSitemapCache() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT slug, updated_at FROM articles WHERE published = true ORDER BY updated_at DESC
    `);
    const baseUrl = process.env.SITE_URL || 'https://raisingorchids.com';
    const urls = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/articles</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/assessments</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      `<url><loc>${baseUrl}/recommended</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      `<url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
      ...rows.map(
        (r) =>
          `<url><loc>${baseUrl}/articles/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
      ),
    ];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    // Write to public dir for static serving
    const publicDir = join(__dirname, '..', 'dist', 'client');
    try {
      writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);
      console.log('[cron] Sitemap regenerated');
    } catch {
      console.log('[cron] Could not write sitemap to dist (build may not exist yet)');
    }
  } finally {
    client.release();
  }
}

async function runCron() {
  console.log(`[cron] Running at ${new Date().toISOString()}`);
  try {
    await publishScheduledArticles();
    await regenerateSitemapCache();
    console.log('[cron] Complete');
  } catch (err) {
    console.error('[cron] Error:', err);
  }
}

// If run directly
runCron().then(() => process.exit(0)).catch(() => process.exit(1));

export { runCron };
