#!/usr/bin/env node
/**
 * Cron System — OrchidKids
 * All crons are in-code only (no external cron service, no Manus scheduler).
 * Works with file-based article store (no database required).
 *
 * Crons:
 *   1. Article Generator    — 03:00 UTC daily, generates 6 new articles via DeepSeek
 *   2. Sitemap Refresher    — 04:00 UTC daily, pings sitemap endpoint
 *   3. dateModified Bumper  — 05:00 UTC daily, bumps dateModified on edited articles
 *   4. Quality Gate Audit   — 06:00 UTC Sunday, audits all articles
 *   5. Product Spotlight    — 07:00 UTC Monday, rotates featured products
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const ARTICLES_PER_DAY = 6;
const AUTO_GEN_ENABLED = process.env.AUTO_GEN_ENABLED === 'true';
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://orchidkids.com';

function log(cron, msg) {
  console.log(`[cron:${cron}] ${new Date().toISOString()} ${msg}`);
}

function loadStore() {
  if (!existsSync(STORE_PATH)) return { articles: [] };
  try { return JSON.parse(readFileSync(STORE_PATH, 'utf8')); }
  catch { return { articles: [] }; }
}

function saveStore(store) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// ─── Cron 1: Article Generator ────────────────────────────────────────────────
async function runArticleGenerator() {
  if (!AUTO_GEN_ENABLED) {
    log('article-gen', 'AUTO_GEN_ENABLED=false, skipping');
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    log('article-gen', 'OPENAI_API_KEY not set, skipping');
    return;
  }
  log('article-gen', `Generating ${ARTICLES_PER_DAY} articles...`);
  try {
    const { execSync } = await import('child_process');
    execSync(`node ${join(__dirname, 'bulk-seed.mjs')}`, {
      stdio: 'inherit',
      env: { ...process.env, SEED_BATCH_SIZE: String(ARTICLES_PER_DAY) },
      timeout: 300000,
    });
    log('article-gen', 'Done.');
  } catch (err) {
    log('article-gen', `Error: ${err.message}`);
  }
}

// ─── Cron 2: Sitemap Refresher ────────────────────────────────────────────────
async function runSitemapRefresher() {
  log('sitemap', 'Refreshing sitemap...');
  try {
    const port = process.env.PORT || 3000;
    const res = await fetch(`http://localhost:${port}/sitemap.xml`);
    log('sitemap', `Status: ${res.status}`);
  } catch (err) {
    log('sitemap', `Error: ${err.message}`);
  }
}

// ─── Cron 3: dateModified Bumper ─────────────────────────────────────────────
async function runDateModifiedBumper() {
  log('date-modified', 'Checking for dateModified bumps...');
  try {
    const store = loadStore();
    const today = new Date().toISOString().split('T')[0];
    let bumped = 0;
    store.articles = store.articles.map(a => {
      if (a.updated_at && (!a.date_modified || a.updated_at > a.date_modified)) {
        bumped++;
        return { ...a, date_modified: today };
      }
      return a;
    });
    if (bumped > 0) { saveStore(store); log('date-modified', `Bumped ${bumped} articles.`); }
    else log('date-modified', 'No bumps needed.');
  } catch (err) {
    log('date-modified', `Error: ${err.message}`);
  }
}

// ─── Cron 4: Quality Gate Audit ───────────────────────────────────────────────
async function runQualityGateAudit() {
  log('quality-audit', 'Starting weekly audit...');
  try {
    const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');
    const store = loadStore();
    let passed = 0, failed = 0;
    const failures = [];
    for (const a of store.articles) {
      if (!a.body) continue;
      const r = runQualityGate(a.body);
      if (r.passed) passed++;
      else { failed++; failures.push({ slug: a.slug, f: r.failures.slice(0, 3) }); }
    }
    log('quality-audit', `${passed} passed, ${failed} failed.`);
    if (failures.length) log('quality-audit', JSON.stringify(failures.slice(0, 5)));
  } catch (err) {
    log('quality-audit', `Error: ${err.message}`);
  }
}

// ─── Cron 5: Product Spotlight Rotator ───────────────────────────────────────
async function runProductSpotlightRotator() {
  log('product-spotlight', 'Rotating featured products...');
  try {
    const { ASIN_CATALOG } = await import('../src/lib/asin-catalog.mjs');
    const store = loadStore();
    const shuffled = [...ASIN_CATALOG].sort(() => Math.random() - 0.5);
    store.featured_products = shuffled.slice(0, 6).map(p => p.asin);
    store.featured_products_updated = new Date().toISOString();
    saveStore(store);
    log('product-spotlight', `Featured: ${store.featured_products.join(', ')}`);
  } catch (err) {
    log('product-spotlight', `Error: ${err.message}`);
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
function scheduleDaily(hour, minute, fn, name) {
  function getNextMs() {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime() - now.getTime();
  }
  function schedule() {
    const ms = getNextMs();
    log(name, `Next run in ${Math.round(ms / 60000)}m`);
    setTimeout(async () => {
      try { await fn(); } catch (e) { log(name, `Error: ${e.message}`); }
      schedule();
    }, ms);
  }
  schedule();
}

function scheduleWeekly(dow, hour, minute, fn, name) {
  function getNextMs() {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(hour, minute, 0, 0);
    const days = (dow - now.getUTCDay() + 7) % 7;
    next.setUTCDate(now.getUTCDate() + (days === 0 && next <= now ? 7 : days));
    return next.getTime() - now.getTime();
  }
  function schedule() {
    const ms = getNextMs();
    log(name, `Next run in ${Math.round(ms / 3600000)}h`);
    setTimeout(async () => {
      try { await fn(); } catch (e) { log(name, `Error: ${e.message}`); }
      schedule();
    }, ms);
  }
  schedule();
}

export function startCrons() {
  log('system', 'Starting cron system...');
  scheduleDaily(3, 0, runArticleGenerator, 'article-gen');
  scheduleDaily(4, 0, runSitemapRefresher, 'sitemap');
  scheduleDaily(5, 0, runDateModifiedBumper, 'date-modified');
  scheduleWeekly(0, 6, 0, runQualityGateAudit, 'quality-audit');
  scheduleWeekly(1, 7, 0, runProductSpotlightRotator, 'product-spotlight');
  log('system', 'All crons scheduled.');
}

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startCrons();
  setInterval(() => {}, 1000 * 60 * 60);
}
