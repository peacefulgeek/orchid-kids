/**
 * Cron: product-spotlight.mjs
 * Rotates the featured product spotlight — runs Saturday 08:00 UTC.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, '..', '..', 'scripts', 'seed-articles.json');

function loadStore() {
  if (!existsSync(STORE_PATH)) return { articles: [] };
  try { return JSON.parse(readFileSync(STORE_PATH, 'utf8')); }
  catch { return { articles: [] }; }
}

function saveStore(store) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function generateProductSpotlight() {
  console.log('[product-spotlight] Rotating featured products...');
  try {
    const { ASIN_CATALOG } = await import('../lib/asin-catalog.mjs');
    const store = loadStore();
    const shuffled = [...ASIN_CATALOG].sort(() => Math.random() - 0.5);
    store.featured_products = shuffled.slice(0, 6).map(p => ({
      asin: p.asin,
      name: p.name,
      category: p.category,
      url: `https://www.amazon.com/dp/${p.asin}?tag=spankyspinola-20`,
    }));
    store.featured_products_updated = new Date().toISOString();
    saveStore(store);
    console.log('[product-spotlight] Done:', store.featured_products.map(p => p.asin).join(', '));
  } catch (err) {
    console.error('[product-spotlight] Error:', err.message);
  }
}
