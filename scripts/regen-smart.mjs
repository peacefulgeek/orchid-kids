/**
 * regen-smart.mjs
 * Smart two-mode regeneration:
 * - FULL REWRITE for articles under 1300 words (original seeds)
 * - CONTINUATION for articles 1300-1750 words (add 2-3 sections)
 * Concurrency: 12 workers
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
const CONCURRENCY = 12;
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

function buildFullRewritePrompt(article) {
  const amazonLinks = buildAmazonLinks(article.title);
  return `You are an expert child psychologist writing for parents of highly sensitive children. Write a comprehensive 2,000-word article.

TITLE: ${article.title}
CATEGORY: ${article.category}

Write EXACTLY these 8 HTML sections. Each section must be substantial. Total must exceed 1,900 words of text.

1. <h2>Introduction</h2> — 200+ words. Open with a relatable parent scenario. Explain why this matters.
2. <div data-tldr="ai-overview"><strong>TL;DR:</strong> [2-3 sentence summary]</div>
3. <div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>
4. <h2>The Science Behind It</h2> — 250+ words. Research, studies, specific findings.
5. <h2>Signs to Watch For</h2> — 200+ words. Include <ul> with 6+ specific behaviors.
6. <h2>Why This Matters for Your Child's Development</h2> — 200+ words. Long-term impact.
7. <h2>Practical Strategies That Work</h2> — 300+ words. Numbered list of 6+ strategies. Include these product links naturally: ${amazonLinks}
8. <h2>Common Mistakes to Avoid</h2> — 150+ words. Include <ul> with 4+ mistakes.
9. <h2>When to Seek Professional Support</h2> — 150+ words. Specific signs.
10. <h2>Moving Forward Together</h2> — 150+ words. Warm, encouraging conclusion.

Use only HTML (h2, p, ul, ol, li). No markdown. No wrapper tags. Write all sections completely. Do not truncate.`;
}

function buildContinuationPrompt(article) {
  const currentWords = wordCount(article.body);
  const needed = 1800 - currentWords + 100; // add buffer
  const amazonLinks = buildAmazonLinks(article.title);
  
  return `You are an expert child psychologist. The following article about "${article.title}" currently has ${currentWords} words and needs to be extended to at least 1,800 words.

Add 2-3 new substantial sections to the END of this article. Each new section should be 200-300 words. Do NOT repeat content already in the article.

Suggested new sections to add (pick 2-3 that fit best):
- <h2>Real Stories from Families</h2> — 2-3 anonymized parent stories
- <h2>Age-Specific Approaches</h2> — strategies for toddlers, school-age, and teens
- <h2>Building on Strengths</h2> — how this trait becomes an asset
- <h2>Supporting Your Own Wellbeing</h2> — parent self-care
- <h2>Creating Your Action Plan</h2> — step-by-step summary

Also include these Amazon product links naturally in one of the new sections: ${amazonLinks}

IMPORTANT: Output ONLY the new HTML sections to append. Do not repeat the existing article. Use only HTML (h2, p, ul, ol, li). No markdown.

The article currently ends with:
...${article.body.slice(-500)}`;
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

function passesGate(body) {
  const words = wordCount(body);
  if (words < 1750) return { ok: false, reason: `too short: ${words} words` };
  if (!body.includes('amazon.com')) return { ok: false, reason: 'missing Amazon links' };
  return { ok: true };
}

function ensureMetaBlocks(body, title) {
  let result = body;
  if (!result.includes('data-tldr="ai-overview"')) {
    result = result.replace(/<h2>/, `<div data-tldr="ai-overview"><strong>TL;DR:</strong> A comprehensive guide to understanding and supporting your highly sensitive child with ${title.toLowerCase()}.</div>\n<h2>`);
  }
  if (!result.includes('author-byline')) {
    result = result.replace(/<h2>/, `<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>\n<h2>`);
  }
  return result;
}

// Load articles
const articles = JSON.parse(readFileSync(STORE_PATH, 'utf8'));

// Categorize articles
const fullRewrite = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words < 1300);

const continuation = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words >= 1300 && a._words < 1750);

console.log(`[regen] Full rewrites needed: ${fullRewrite.length} (under 1300 words)`);
console.log(`[regen] Continuations needed: ${continuation.length} (1300-1750 words)`);
console.log(`[regen] Total to process: ${fullRewrite.length + continuation.length}`);
console.log(`[regen] Using ${MODEL}, concurrency ${CONCURRENCY}`);

let completed = 0;
let failed = 0;
const total = fullRewrite.length + continuation.length;
const startTime = Date.now();

async function processFullRewrite(item) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const body = await callOpenAI([
        { role: 'system', content: 'You are an expert child psychologist writing comprehensive articles for parents. Always write complete articles. Never truncate.' },
        { role: 'user', content: buildFullRewritePrompt(item) }
      ], 5000);
      
      const enhanced = ensureMetaBlocks(body, item.title);
      const gate = passesGate(enhanced);
      if (gate.ok) {
        articles[item._idx].body = enhanced;
        articles[item._idx].hero_url = getUniqueHeroUrl(item._idx);
        completed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`[✓ REWRITE] ${completed}/${total} — ${wordCount(enhanced)}w — "${item.title.slice(0, 45)}" (${elapsed}s)`);
        return;
      } else {
        console.log(`  [rewrite attempt ${attempt}] GATE FAIL: ${gate.reason} — "${item.title.slice(0, 40)}"`);
      }
    } catch (e) {
      console.log(`  [rewrite attempt ${attempt}] ERROR: ${e.message.slice(0, 80)}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
  failed++;
  console.log(`[✗] REWRITE FAILED: "${item.title.slice(0, 45)}"`);
}

async function processContinuation(item) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const addition = await callOpenAI([
        { role: 'system', content: 'You are an expert child psychologist. Add new sections to extend an existing article. Output only the new HTML sections.' },
        { role: 'user', content: buildContinuationPrompt(item) }
      ], 2000);
      
      const combined = item.body + '\n' + addition;
      const enhanced = ensureMetaBlocks(combined, item.title);
      const gate = passesGate(enhanced);
      if (gate.ok) {
        articles[item._idx].body = enhanced;
        articles[item._idx].hero_url = getUniqueHeroUrl(item._idx);
        completed++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`[✓ EXTEND] ${completed}/${total} — ${wordCount(enhanced)}w — "${item.title.slice(0, 45)}" (${elapsed}s)`);
        return;
      } else {
        console.log(`  [extend attempt ${attempt}] GATE FAIL: ${gate.reason} — "${item.title.slice(0, 40)}"`);
      }
    } catch (e) {
      console.log(`  [extend attempt ${attempt}] ERROR: ${e.message.slice(0, 80)}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  // Fallback: just ensure meta blocks are present
  const enhanced = ensureMetaBlocks(item.body, item.title);
  articles[item._idx].body = enhanced;
  articles[item._idx].hero_url = getUniqueHeroUrl(item._idx);
  completed++;
  console.log(`[~ FALLBACK] ${completed}/${total} — ${wordCount(enhanced)}w — "${item.title.slice(0, 45)}"`);
}

// Process full rewrites first
console.log(`\n[regen] === PHASE 1: Full Rewrites (${fullRewrite.length} articles) ===`);
for (let i = 0; i < fullRewrite.length; i += CONCURRENCY) {
  const batch = fullRewrite.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(item => processFullRewrite(item)));
  writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));
  console.log(`[regen] Rewrite batch ${Math.floor(i/CONCURRENCY)+1} saved\n`);
}

// Process continuations
console.log(`\n[regen] === PHASE 2: Continuations (${continuation.length} articles) ===`);
for (let i = 0; i < continuation.length; i += CONCURRENCY) {
  const batch = continuation.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(item => processContinuation(item)));
  writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));
  const batchNum = Math.floor(i/CONCURRENCY)+1;
  const totalBatches = Math.ceil(continuation.length/CONCURRENCY);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`[regen] Continuation batch ${batchNum}/${totalBatches} saved — ${completed} total done (${elapsed}s)\n`);
}

// Final audit
const finalCounts = articles.map(a => wordCount(a.body || ''));
const stillShort = finalCounts.filter(w => w < 1750).length;
const avgWords = Math.round(finalCounts.reduce((a, b) => a + b, 0) / finalCounts.length);
console.log(`\n[regen] COMPLETE`);
console.log(`[regen] ${completed} processed, ${failed} failed`);
console.log(`[regen] Final: ${articles.length} articles, ${stillShort} still under 1750, avg ${avgWords} words`);
