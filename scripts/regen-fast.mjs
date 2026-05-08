/**
 * regen-fast.mjs
 * Regenerate all articles under 1750 words using gpt-4.1-mini
 * with an explicit section structure that forces 1800+ word output.
 * Concurrency: 10 workers for speed.
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
const MAX_TOKENS = 5000;
const CONCURRENCY = 10;
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
  const picks = [];
  if (t.includes('sensory')) picks.push('sensory-kit', 'sensory-swing', 'fidget-tools');
  else if (t.includes('sleep')) picks.push('weighted-blanket', 'lavender-oil', 'magnesium-kids');
  else if (t.includes('school') || t.includes('classroom')) picks.push('noise-cancelling', 'fidget-tools', 'hsc-book');
  else if (t.includes('emotion') || t.includes('meltdown')) picks.push('calm-journal', 'hsc-book', 'magnesium-kids');
  else if (t.includes('nutrition') || t.includes('supplement')) picks.push('magnesium-kids', 'omega3-kids', 'lavender-oil');
  else picks.push('hsc-book', 'calm-journal', 'magnesium-kids');
  return picks.slice(0, 3).map(k => ({ key: k, asin: ASINS[k] }));
}

function buildAmazonLinks(title) {
  const asins = pickAsins(title);
  return asins.map(({ key, asin }) => {
    const label = key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<a href="https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">${label}</a>`;
  }).join(', ');
}

function buildPrompt(article) {
  const amazonLinks = buildAmazonLinks(article.title);
  return `You are an expert child psychologist and parenting writer specializing in highly sensitive children (HSC). Write a comprehensive, research-backed article for parents.

TITLE: ${article.title}
CATEGORY: ${article.category}

CRITICAL REQUIREMENTS — YOU MUST FOLLOW EVERY ONE:
1. The article MUST be at least 1,900 words of readable text (not counting HTML tags).
2. You MUST include ALL of the following 8 sections with substantial content in each:
   - Introduction (200+ words): Hook with a relatable parent scenario, then explain why this topic matters for sensitive children.
   - Understanding the Science (250+ words): Research-backed explanation with specific studies, researchers, or statistics.
   - Signs and Patterns (200+ words): Specific observable behaviors parents will recognize. Use a <ul> list with at least 5 items.
   - Why This Matters (200+ words): Long-term impact on the child's development, wellbeing, and family.
   - Practical Strategies (300+ words): At least 5 concrete, actionable strategies parents can implement today. Use numbered list.
   - What to Avoid (150+ words): Common mistakes parents make. Use a <ul> list.
   - When to Seek Help (150+ words): Signs that professional support may be needed.
   - Conclusion (150+ words): Warm, encouraging close that validates the parent's journey.

3. Include this TL;DR box right after the introduction:
<div data-tldr="ai-overview"><strong>TL;DR:</strong> [2-3 sentence summary of the article's key insight]</div>

4. Include this author byline after the TL;DR:
<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>

5. Include these Amazon product recommendations in the Practical Strategies section:
${amazonLinks}
Use this exact format for each: <a href="https://www.amazon.com/dp/ASIN?tag=spankyspinola-20" rel="nofollow sponsored" target="_blank">Product Name</a>

6. Write in a warm, empathetic, expert tone — like a trusted child psychologist speaking directly to a worried parent.
7. Use proper HTML: <h2> for section headers, <p> for paragraphs, <ul>/<ol>/<li> for lists.
8. Do NOT include <html>, <head>, <body>, or <article> wrapper tags.
9. Do NOT use markdown — only HTML.

Write the complete article now. Do not truncate. Write all 8 sections in full.`;
}

function passesGate(body) {
  const words = wordCount(body);
  if (words < 1750) return { ok: false, reason: `too short: ${words} words` };
  if (!body.includes('data-tldr="ai-overview"')) return { ok: false, reason: 'missing TL;DR' };
  if (!body.includes('author-byline')) return { ok: false, reason: 'missing author byline' };
  if (!body.includes('amazon.com')) return { ok: false, reason: 'missing Amazon links' };
  return { ok: true };
}

async function generateArticle(article, attempt = 1) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are an expert child psychologist and parenting writer. You write comprehensive, research-backed articles for parents of highly sensitive children. You ALWAYS write complete articles with all requested sections. You NEVER truncate or summarize. You write at least 1,900 words per article.'
        },
        { role: 'user', content: buildPrompt(article) }
      ]
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

// Find articles under 1750 words
const shortArticles = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words < 1750);

console.log(`[regen] Found ${shortArticles.length} articles under 1750 words (using ${MODEL}, concurrency ${CONCURRENCY})`);
console.log(`[regen] Starting fast regeneration...`);

let completed = 0;
let failed = 0;
const startTime = Date.now();

async function processArticle(item) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const body = await generateArticle(item, attempt);
      const gate = passesGate(body);
      if (gate.ok) {
        articles[item._idx].body = body;
        articles[item._idx].hero_url = getUniqueHeroUrl(item._idx);
        completed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const pct = Math.round((completed / shortArticles.length) * 100);
        const wc = wordCount(body);
        console.log(`[✓] ${completed}/${shortArticles.length} (${pct}%) — ${wc}w — "${item.title.slice(0, 50)}" (${elapsed}s)`);
        return;
      } else {
        console.log(`  [attempt ${attempt}] GATE FAIL: ${gate.reason} — "${item.title.slice(0, 50)}"`);
      }
    } catch (e) {
      console.log(`  [attempt ${attempt}] ERROR: ${e.message.slice(0, 100)} — "${item.title.slice(0, 50)}"`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  failed++;
  console.log(`[✗] FAILED after ${maxAttempts} attempts: "${item.title.slice(0, 50)}"`);
}

// Process in batches of CONCURRENCY
for (let i = 0; i < shortArticles.length; i += CONCURRENCY) {
  const batch = shortArticles.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(item => processArticle(item)));
  
  // Save after every batch
  writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));
  const batchNum = Math.floor(i / CONCURRENCY) + 1;
  const totalBatches = Math.ceil(shortArticles.length / CONCURRENCY);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n[regen] Batch ${batchNum}/${totalBatches} saved — ${completed} done, ${failed} failed (${elapsed}s elapsed)\n`);
}

console.log(`\n[regen] COMPLETE — ${completed} regenerated, ${failed} failed`);

// Final audit
const finalCounts = articles.map(a => wordCount(a.body || ''));
const stillShort = finalCounts.filter(w => w < 1750).length;
const avgWords = Math.round(finalCounts.reduce((a, b) => a + b, 0) / finalCounts.length);
console.log(`[regen] Final: ${articles.length} articles, ${stillShort} still under 1750, avg ${avgWords} words`);
