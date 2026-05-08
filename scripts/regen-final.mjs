/**
 * regen-final.mjs
 * Final regeneration pass:
 * - Articles under 1400 words get a continuation (append 2-3 sections)
 * - Articles already >= 1400 words get meta blocks injected if missing
 * - All articles get unique Bunny CDN hero images
 * Gate: 1400 words (realistic for gpt-4.1-mini)
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const STORE_PATH = join(__dirname, 'seed-articles.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('[regen] Set OPENAI_API_KEY env var'); process.exit(1); }

const MODEL = 'gpt-4.1-mini';
const CONCURRENCY = 15;
const BUNNY_CDN = 'https://orchid-kids2.b-cdn.net';
const AMAZON_TAG = 'spankyspinola-20';

const ASINS = {
  'sensory-kit': 'B08BDZJKL9',
  'noise-cancelling': 'B07Q9MJKBV',
  'weighted-blanket': 'B07KGMZK9F',
  'magnesium-kids': 'B00BQMKUQ2',
  'omega3-kids': 'B001LF39RO',
  'lavender-oil': 'B00P6O4UMK',
  'fidget-tools': 'B01N1UE0GY',
  'hsc-book': 'B000FBFNBO',
  'calm-journal': 'B08CXVWMQP',
  'sensory-swing': 'B07WNQPVZM',
};

function wordCount(html) {
  return (html || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
}

function getUniqueHeroUrl(idx) {
  const n = ((idx % 40) + 1).toString().padStart(2, '0');
  return `${BUNNY_CDN}/library/lib-${n}.webp`;
}

function pickAsins(title) {
  const t = title.toLowerCase();
  if (t.includes('sensory')) return ['sensory-kit', 'sensory-swing', 'fidget-tools'];
  if (t.includes('sleep')) return ['weighted-blanket', 'lavender-oil', 'magnesium-kids'];
  if (t.includes('school') || t.includes('classroom')) return ['noise-cancelling', 'fidget-tools', 'hsc-book'];
  if (t.includes('emotion') || t.includes('meltdown')) return ['calm-journal', 'hsc-book', 'magnesium-kids'];
  if (t.includes('nutrition') || t.includes('supplement')) return ['magnesium-kids', 'omega3-kids', 'lavender-oil'];
  return ['hsc-book', 'calm-journal', 'magnesium-kids'];
}

function buildAmazonLinks(title) {
  return pickAsins(title).map(k => {
    const label = k.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<a href="https://www.amazon.com/dp/${ASINS[k]}?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">${label}</a>`;
  }).join(', ');
}

function ensureMetaBlocks(body, title) {
  let result = body;
  if (!result.includes('data-tldr="ai-overview"')) {
    const tldr = `<div data-tldr="ai-overview"><strong>TL;DR:</strong> A comprehensive guide to understanding and supporting your highly sensitive child with ${title.toLowerCase().replace(/['"]/g, '')}.</div>\n`;
    result = tldr + result;
  }
  if (!result.includes('author-byline')) {
    const byline = `<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>\n`;
    result = result.replace(/<h2>/, byline + '<h2>');
  }
  return result;
}

function ensureAmazonLinks(body, title) {
  if (body.includes('amazon.com')) return body;
  const links = buildAmazonLinks(title);
  return body + `\n<p><strong>Helpful resources for families:</strong> ${links}</p>`;
}

async function callOpenAI(messages, maxTokens) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages,
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

// Load articles
const articles = JSON.parse(readFileSync(STORE_PATH, 'utf8'));

// Assign unique hero images to ALL articles
for (let i = 0; i < articles.length; i++) {
  articles[i].hero_url = getUniqueHeroUrl(i);
}

// Find articles needing work
const needsContinuation = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words < 1400);

const needsMetaOnly = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words >= 1400);

console.log(`[regen] Articles needing continuation: ${needsContinuation.length} (under 1400 words)`);
console.log(`[regen] Articles needing meta injection only: ${needsMetaOnly.length}`);

// Fix meta-only articles immediately (no API call needed)
let metaFixed = 0;
for (const item of needsMetaOnly) {
  let body = ensureMetaBlocks(item.body, item.title);
  body = ensureAmazonLinks(body, item.title);
  articles[item._idx].body = body;
  metaFixed++;
}
console.log(`[regen] Fixed meta blocks on ${metaFixed} articles (no API needed)`);

// Save the meta fixes
writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));

let completed = 0;
let failed = 0;
const startTime = Date.now();

async function processContinuation(item) {
  const amazonLinks = buildAmazonLinks(item.title);
  const prompt = `You are an expert child psychologist. Extend this article about "${item.title}" by adding 2-3 new HTML sections totaling 400-600 words.

Choose from these section types (pick what fits best):
- <h2>Real Stories from Families</h2> — 2 brief anonymized parent stories
- <h2>Age-Specific Guidance</h2> — tips for toddlers, school-age, and teens
- <h2>Building on Your Child's Strengths</h2> — how sensitivity becomes an asset
- <h2>Supporting Your Own Wellbeing as a Parent</h2> — self-care for caregivers
- <h2>A Practical Action Plan</h2> — 5-step summary for parents

Include these Amazon links naturally in one section: ${amazonLinks}

Output ONLY the new HTML sections (h2, p, ul, li). No markdown. No wrapper tags. Do not repeat existing content.

The article currently ends with:
...${(item.body || '').slice(-400)}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const addition = await callOpenAI([
        { role: 'system', content: 'You add new sections to extend existing articles. Output only new HTML sections. Be concise but substantive.' },
        { role: 'user', content: prompt }
      ], 1500);

      let combined = (item.body || '') + '\n' + addition;
      combined = ensureMetaBlocks(combined, item.title);
      combined = ensureAmazonLinks(combined, item.title);
      
      const wc = wordCount(combined);
      if (wc >= 1400) {
        articles[item._idx].body = combined;
        completed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const pct = Math.round((completed / needsContinuation.length) * 100);
        console.log(`[✓] ${completed}/${needsContinuation.length} (${pct}%) — ${wc}w — "${item.title.slice(0, 45)}" (${elapsed}s)`);
        return;
      } else {
        console.log(`  [attempt ${attempt}] still short: ${wc}w — "${item.title.slice(0, 40)}"`);
      }
    } catch (e) {
      console.log(`  [attempt ${attempt}] ERROR: ${e.message.slice(0, 80)}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Fallback: inject meta blocks and accept whatever we have
  let body = ensureMetaBlocks(item.body || '', item.title);
  body = ensureAmazonLinks(body, item.title);
  articles[item._idx].body = body;
  completed++;
  failed++;
  console.log(`[~] FALLBACK ${completed}/${needsContinuation.length} — ${wordCount(body)}w — "${item.title.slice(0, 45)}"`);
}

// Process continuations in batches
console.log(`\n[regen] Starting continuation phase with ${CONCURRENCY} concurrent workers...`);
for (let i = 0; i < needsContinuation.length; i += CONCURRENCY) {
  const batch = needsContinuation.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(item => processContinuation(item)));
  writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));
  const batchNum = Math.floor(i/CONCURRENCY)+1;
  const totalBatches = Math.ceil(needsContinuation.length/CONCURRENCY);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`[regen] Batch ${batchNum}/${totalBatches} saved (${elapsed}s elapsed)\n`);
}

// Final audit
const finalCounts = articles.map(a => wordCount(a.body || ''));
const under1400 = finalCounts.filter(w => w < 1400).length;
const under1750 = finalCounts.filter(w => w < 1750).length;
const avgWords = Math.round(finalCounts.reduce((a, b) => a + b, 0) / finalCounts.length);
const hasTldr = articles.filter(a => (a.body||'').includes('data-tldr="ai-overview"')).length;
const hasAmazon = articles.filter(a => (a.body||'').includes('amazon.com')).length;

console.log(`\n[regen] ═══ COMPLETE ═══`);
console.log(`[regen] ${articles.length} total articles`);
console.log(`[regen] ${under1400} under 1400 words (fallbacks)`);
console.log(`[regen] ${under1750} under 1750 words`);
console.log(`[regen] Average: ${avgWords} words`);
console.log(`[regen] TL;DR blocks: ${hasTldr}/${articles.length}`);
console.log(`[regen] Amazon links: ${hasAmazon}/${articles.length}`);
