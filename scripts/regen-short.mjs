/**
 * regen-short.mjs — Regenerate all articles under 1800 words
 * Uses GPT-4.1-mini with 6000 max_tokens and stronger word-count instruction.
 * Also assigns unique article-specific hero images (cycling through lib-01..lib-40).
 * Run: OPENAI_API_KEY=sk-... node scripts/regen-short.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('[regen] Set OPENAI_API_KEY env var'); process.exit(1); }

const MODEL = 'gpt-4.1';
const MAX_TOKENS = 8000;
const CONCURRENCY = 4;
const BUNNY_CDN = 'https://orchid-kids2.b-cdn.net';
const AMAZON_TAG = 'spankyspinola-20';

const ASINS = {
  'understanding-hsc': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child by Elaine Aron' },
    { asin: '0767908724', name: 'The Highly Sensitive Person by Elaine Aron' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: '0062409670', name: 'Quiet: The Power of Introverts' },
  ],
  'neuroscience': [
    { asin: '0393706079', name: 'The Whole-Brain Child' },
    { asin: '1623369851', name: 'No-Drama Discipline' },
    { asin: '1250313007', name: 'The Body Keeps the Score' },
    { asin: '0525559175', name: 'How to Raise an Adult' },
  ],
  'parenting-strategies': [
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet Power' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
  ],
  'sensory-environment': [
    { asin: 'B07X8XMKQY', name: 'Weighted Lap Pad for Kids' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: 'B07WFPMKBR', name: 'Sensory Chew Necklace' },
    { asin: 'B07D5XHKRK', name: 'Fidget Cube Toy' },
  ],
  'emotional-wellbeing': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0393706079', name: 'The Whole-Brain Child' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: 'B07X8XMKQY', name: 'Weighted Blanket for Kids' },
  ],
  'school-social': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet Power' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
  ],
  'family-dynamics': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: '0393706079', name: 'The Whole-Brain Child' },
  ],
  'long-term-outcomes': [
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet: The Power of Introverts' },
    { asin: '0525559175', name: 'How to Raise an Adult' },
  ],
  'tools-resources': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: 'B07X8XMKQY', name: 'Weighted Lap Pad for Kids' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: 'B07WFPMKBR', name: 'Sensory Chew Necklace' },
  ],
};

function getAsins(category) {
  const pool = ASINS[category] || ASINS['tools-resources'];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
}

function wordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function buildPrompt(title, category, tags, asins) {
  const affiliateLinks = asins.map(a =>
    `<a href="https://www.amazon.com/dp/${a.asin}?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">${a.name}</a> (paid link)`
  ).join(', ');
  const today = new Date().toISOString().split('T')[0];

  return `You are an expert child development writer for OrchidKids.com — the leading research-backed resource for parents of highly sensitive children (HSC).

TITLE: ${title}
CATEGORY: ${category}
TAGS: ${tags.join(', ')}

CRITICAL WORD COUNT REQUIREMENT: Your article body MUST contain AT LEAST 1,900 words of readable text (not counting HTML tags). Count carefully. If you reach 1,900 words and haven't finished, keep writing. Do NOT stop early.

HARD RULES:
1. Write AT LEAST 1,900 words of article body text (count: strip HTML tags, count remaining words)
2. Use contractions naturally (don't, can't, it's, you'll, they're)
3. Use "you" and "your child" throughout — direct address
4. Use "we" and "in our experience" at least twice
5. NO em dashes (—) or en dashes (–) — use commas or rewrite
6. NO banned phrases: "delve into", "tapestry", "nuanced", "it's worth noting", "in conclusion", "to summarize", "game-changer", "transformative", "groundbreaking", "paradigm", "holistic", "synergy", "leverage", "robust", "comprehensive", "crucial", "vital", "essential", "significant", "moreover", "furthermore", "in today's world", "as an AI"
7. Include EXACTLY 3 Amazon affiliate links: ${affiliateLinks}
8. Include at least 3 internal links to other OrchidKids articles (use plausible slugs like /articles/topic-name)
9. Include at least 1 outbound authority link (PubMed, AAP, NCBI, APA, or similar)
10. Start with a TL;DR section: <section data-tldr="ai-overview" aria-label="In short">
11. End with author byline: <aside class="author-byline" data-eeat="author">Written by the OrchidKids editorial team. Last updated <time datetime="${today}">${today}</time>.</aside>
12. Use <h2> and <h3> subheadings throughout — at least 5 h2 sections
13. Write from a warm, direct, shame-free parenting perspective
14. Vary sentence length — mix short punchy sentences with longer explanatory ones
15. Include a practical "What You Can Do Today" or "Action Steps" section near the end
16. Include a "Key Takeaways" or summary box using <div class="key-takeaways">

STRUCTURE GUIDE (use all sections, write fully):
- TL;DR (3-4 sentences)
- Introduction (150-200 words)
- Section 1: Background/Science (300-350 words)
- Section 2: What This Means for Your Child (300-350 words)  
- Section 3: Common Challenges and Misconceptions (250-300 words)
- Section 4: Practical Strategies (300-350 words)
- Section 5: Action Steps / What You Can Do Today (200-250 words)
- Key Takeaways box
- Recommended Resources (with the 3 affiliate links)
- Author byline

OUTPUT FORMAT: Return ONLY the HTML article body starting with <section data-tldr="ai-overview"> and ending with </aside>. No markdown, no code fences, no preamble. Write the COMPLETE article — do not truncate or stop early.`;
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert child development writer. Output only clean HTML article body content. NEVER stop early. Always write at least 1900 words of body text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function passesGate(body) {
  const words = wordCount(body);
  if (words < 1750) return { ok: false, reason: `too short: ${words} words` };
  if (!body.includes('data-tldr="ai-overview"')) return { ok: false, reason: 'missing TL;DR' };
  if (!body.includes('author-byline')) return { ok: false, reason: 'missing author byline' };
  if (!body.includes('amazon.com')) return { ok: false, reason: 'missing Amazon links' };
  return { ok: true };
}

// Load store
const raw = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
const articles = Array.isArray(raw) ? raw : (raw.articles || []);

// Find articles under 1800 words
const shortArticles = articles
  .map((a, i) => ({ ...a, _idx: i, _words: wordCount(a.body || '') }))
  .filter(a => a._words < 1750);

console.log(`[regen] Found ${shortArticles.length} articles under 1750 words (using gpt-4.1)`);
console.log(`[regen] Starting regeneration with ${CONCURRENCY} concurrent workers...`);

// Assign unique images — cycle through lib-01..lib-40 based on article index
function getUniqueHeroUrl(articleIndex) {
  const n = String((articleIndex % 40) + 1).padStart(2, '0');
  return `${BUNNY_CDN}/library/lib-${n}.webp`;
}

let completed = 0;
let failed = 0;
const startTime = Date.now();

async function processArticle(article) {
  const asins = getAsins(article.category || 'tools-resources');
  const tags = article.tags || [article.category || 'hsc'];
  const prompt = buildPrompt(article.title, article.category || 'understanding-hsc', tags, asins);

  let body = null;
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const result = await callOpenAI(prompt);
      const gate = passesGate(result);
      if (gate.ok) {
        body = result;
        break;
      } else {
        console.log(`  [attempt ${attempts}] GATE FAIL: ${gate.reason} — "${article.title.slice(0, 50)}"`);
      }
    } catch (err) {
      console.log(`  [attempt ${attempts}] ERROR: ${err.message} — "${article.title.slice(0, 50)}"`);
      if (err.message.includes('429')) await new Promise(r => setTimeout(r, 10000));
    }
  }

  return { article, body };
}

// Process in batches of CONCURRENCY
let batchNum = 0;
for (let i = 0; i < shortArticles.length; i += CONCURRENCY) {
  batchNum++;
  const batch = shortArticles.slice(i, i + CONCURRENCY);
  const results = await Promise.all(batch.map(processArticle));

  // Update articles in place
  for (const { article, body } of results) {
    if (body) {
      articles[article._idx].body = body;
      articles[article._idx].hero_url = getUniqueHeroUrl(article._idx);
      completed++;
    } else {
      failed++;
      console.log(`  [FAILED] ${article.title.slice(0, 60)}`);
    }
  }

  // Save after each batch
  writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const pct = Math.round(((i + batch.length) / shortArticles.length) * 100);
  console.log(`[regen] Batch ${batchNum} done — ${completed} regenerated, ${failed} failed, ${pct}% complete (${elapsed}s elapsed)`);
}

// Also assign unique images to ALL articles (not just regenerated ones)
console.log('\n[regen] Assigning unique images to all articles...');
articles.forEach((a, i) => {
  a.hero_url = getUniqueHeroUrl(i);
});
writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));

console.log(`\n[regen] COMPLETE — ${completed} regenerated, ${failed} failed`);
console.log('[regen] All articles now have unique cycling hero images');

// Final audit
const finalCounts = articles.map(a => wordCount(a.body || ''));
const stillShort = finalCounts.filter(w => w < 1750).length;
const avgWords = Math.round(finalCounts.reduce((a, b) => a + b, 0) / finalCounts.length);
console.log(`[regen] Final: ${articles.length} articles, ${stillShort} still under 1800, avg ${avgWords} words`);
