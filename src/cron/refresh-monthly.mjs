/**
 * Cron: refresh-monthly.mjs
 * Bumps dateModified on articles that are 30+ days old and have been viewed recently.
 * Runs 1st of each month at 03:00 UTC.
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

export async function refreshMonthly() {
  console.log('[refresh-monthly] Starting monthly refresh...');
  const store = loadStore();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let refreshed = 0;

  store.articles = store.articles.map(a => {
    if (a.status === 'published' && a.published_at <= thirtyDaysAgo && !a.date_modified) {
      refreshed++;
      return { ...a, date_modified: today };
    }
    return a;
  });

  if (refreshed > 0) {
    saveStore(store);
    console.log(`[refresh-monthly] Refreshed dateModified on ${refreshed} articles.`);
  } else {
    console.log('[refresh-monthly] No articles needed refresh.');
  }
}
