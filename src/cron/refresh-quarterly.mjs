/**
 * Cron: refresh-quarterly.mjs
 * Bumps dateModified on all articles older than 90 days.
 * Runs Jan/Apr/Jul/Oct 1st at 04:00 UTC.
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

export async function refreshQuarterly() {
  console.log('[refresh-quarterly] Starting quarterly refresh...');
  const store = loadStore();
  const today = new Date().toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let refreshed = 0;

  store.articles = store.articles.map(a => {
    if (a.status === 'published' && a.published_at <= ninetyDaysAgo) {
      refreshed++;
      return { ...a, date_modified: today };
    }
    return a;
  });

  if (refreshed > 0) {
    saveStore(store);
    console.log(`[refresh-quarterly] Refreshed ${refreshed} articles.`);
  } else {
    console.log('[refresh-quarterly] No articles needed quarterly refresh.');
  }
}
