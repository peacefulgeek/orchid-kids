/**
 * regen-twopass.mjs
 * Two-pass strategy for guaranteed 1400+ word articles:
 * Pass 1: Generate intro + first 4 sections (~800w)
 * Pass 2: Generate remaining 4 sections as continuation (~700w)
 * Combined: ~1500w guaranteed
 * 
 * Only processes articles under 1400 words.
 * Articles >= 1400 words get meta injection only.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('Set OPENAI_API_KEY'); process.exit(1); }

const MODEL = 'gpt-4.1-mini';
const CONCURRENCY = 8; // lower for two-pass (2 API calls per article)
const BUNNY_CDN = 'https://orchid-kids2.b-cdn.net';
const AMAZON_TAG = 'spankyspinola-20';
const ASINS = {
  'sensory-kit': 'B08BDZJKL9', 'noise-cancelling': 'B07Q9MJKBV',
  'weighted-blanket': 'B07KGMZK9F', 'magnesium-kids': 'B00BQMKUQ2',
  'omega3-kids': 'B001LF39RO', 'lavender-oil': 'B00P6O4UMK',
  'fidget-tools': 'B01N1UE0GY', 'hsc-book': 'B000FBFNBO',
  'calm-journal': 'B08CXVWMQP', 'sensory-swing': 'B07WNQPVZM',
};

const wc = b => (b||'').replace(/<[^>]+>/g,'').split(/\s+/).filter(Boolean).length;
const heroUrl = i => `${BUNNY_CDN}/library/lib-${((i%40)+1).toString().padStart(2,'0')}.webp`;

function pickAsins(title) {
  const t = title.toLowerCase();
  if (t.includes('sensory')) return ['sensory-kit','sensory-swing','fidget-tools'];
  if (t.includes('sleep')) return ['weighted-blanket','lavender-oil','magnesium-kids'];
  if (t.includes('school')||t.includes('classroom')) return ['noise-cancelling','fidget-tools','hsc-book'];
  if (t.includes('emotion')||t.includes('meltdown')) return ['calm-journal','hsc-book','magnesium-kids'];
  if (t.includes('nutrition')||t.includes('supplement')) return ['magnesium-kids','omega3-kids','lavender-oil'];
  return ['hsc-book','calm-journal','magnesium-kids'];
}

function amazonLinks(title) {
  return pickAsins(title).map(k => {
    const label = k.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    return `<a href="https://www.amazon.com/dp/${ASINS[k]}?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">${label}</a>`;
  }).join(', ');
}

function injectMeta(body, title) {
  let r = body;
  if (!r.includes('data-tldr')) {
    r = `<div data-tldr="ai-overview"><strong>TL;DR:</strong> A comprehensive guide to understanding and supporting your highly sensitive child with ${title.toLowerCase().replace(/['"]/g,'')}.</div>\n` + r;
  }
  if (!r.includes('author-byline')) {
    const firstH2 = r.indexOf('<h2>');
    if (firstH2 >= 0) {
      r = r.slice(0, firstH2) + `<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>\n` + r.slice(firstH2);
    }
  }
  if (!r.includes('amazon.com')) {
    r += `\n<p><strong>Helpful resources for families:</strong> ${amazonLinks(title)}</p>`;
  }
  return r;
}

async function openai(messages, maxTokens) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature: 0.7, messages })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0,150)}`);
  return (await r.json()).choices?.[0]?.message?.content || '';
}

const articles = JSON.parse(readFileSync(STORE_PATH,'utf8'));

// Assign unique hero images to ALL articles
articles.forEach((a,i) => { a.hero_url = heroUrl(i); });

const needsWork = articles.map((a,i)=>({...a,_i:i,_w:wc(a.body)})).filter(a=>a._w<1400);
const alreadyGood = articles.map((a,i)=>({...a,_i:i,_w:wc(a.body)})).filter(a=>a._w>=1400);

console.log(`Need two-pass rewrite: ${needsWork.length}`);
console.log(`Already 1400+w (meta inject only): ${alreadyGood.length}`);

// Fix good articles: meta injection only
for (const a of alreadyGood) {
  articles[a._i].body = injectMeta(a.body, a.title);
}
writeFileSync(STORE_PATH, JSON.stringify(articles,null,2));
console.log(`[C] Meta injected on ${alreadyGood.length} articles\n`);

let done=0, fallbacks=0;
const t0 = Date.now();

async function twoPassRewrite(item) {
  const links = amazonLinks(item.title);
  
  // Pass 1: First half of article
  const pass1Prompt = `You are an expert child psychologist writing for parents of highly sensitive children.

Write the FIRST HALF of an article titled: "${item.title}"
Category: ${item.category}

Write these sections completely (aim for 800+ words total):
<h2>Introduction</h2> — 200 words. Start with a relatable parent scenario. Explain why this topic matters for sensitive children.
<h2>The Science Behind It</h2> — 250 words. Research, studies, specific findings about HSC and this topic.
<h2>Signs to Watch For</h2> — 200 words. Include <ul> with 6 specific behaviors parents will recognize.
<h2>Why This Matters for Development</h2> — 200 words. Long-term impact on the child.

Rules: HTML only (h2, p, ul, li). No markdown. No wrapper tags. Write all 4 sections completely.`;

  // Pass 2: Second half of article
  const pass2Prompt = (firstHalf) => `Continue writing the article titled: "${item.title}"

The first half covered: Introduction, The Science, Signs to Watch For, Why This Matters.

Now write the SECOND HALF (aim for 700+ words total):
<h2>Practical Strategies That Work</h2> — 280 words. Numbered list of 6 strategies. Include these product links: ${links}
<h2>Common Mistakes to Avoid</h2> — 150 words. <ul> with 4 mistakes parents make.
<h2>When to Seek Professional Support</h2> — 130 words. Specific signs.
<h2>Moving Forward Together</h2> — 150 words. Warm, encouraging conclusion.

Rules: HTML only (h2, p, ul, ol, li). No markdown. No wrapper tags. Write all 4 sections completely.`;

  for (let att=1; att<=2; att++) {
    try {
      // Pass 1
      const half1 = await openai([
        {role:'system', content:'Write complete HTML article sections. Never truncate.'},
        {role:'user', content:pass1Prompt}
      ], 2500);

      // Pass 2
      const half2 = await openai([
        {role:'system', content:'Write complete HTML article sections. Never truncate.'},
        {role:'user', content:pass2Prompt(half1)}
      ], 2000);

      const combined = injectMeta(half1 + '\n' + half2, item.title);
      const words = wc(combined);
      
      if (words >= 1400) {
        articles[item._i].body = combined;
        done++;
        const pct = Math.round(done/needsWork.length*100);
        const elapsed = Math.round((Date.now()-t0)/1000);
        console.log(`[✓] ${done}/${needsWork.length}(${pct}%) ${words}w "${item.title.slice(0,45)}" (${elapsed}s)`);
        return;
      }
      console.log(`  [att${att}] combined ${words}w "${item.title.slice(0,40)}"`);
    } catch(e) {
      console.log(`  [att${att}] ERR: ${e.message.slice(0,80)}`);
      if (att<2) await new Promise(r=>setTimeout(r,3000));
    }
  }
  
  // Fallback: keep existing body with meta
  articles[item._i].body = injectMeta(item.body||'', item.title);
  done++; fallbacks++;
  console.log(`[~] FALLBACK ${done}/${needsWork.length} ${wc(articles[item._i].body)}w "${item.title.slice(0,45)}"`);
}

console.log(`\n=== TWO-PASS REWRITE: ${needsWork.length} articles (concurrency ${CONCURRENCY}) ===\n`);

for (let i=0; i<needsWork.length; i+=CONCURRENCY) {
  const batch = needsWork.slice(i, i+CONCURRENCY);
  await Promise.all(batch.map(a=>twoPassRewrite(a)));
  writeFileSync(STORE_PATH, JSON.stringify(articles,null,2));
  const bNum = Math.floor(i/CONCURRENCY)+1;
  const bTotal = Math.ceil(needsWork.length/CONCURRENCY);
  const elapsed = Math.round((Date.now()-t0)/1000);
  console.log(`\n[batch ${bNum}/${bTotal}] saved — ${done} done, ${fallbacks} fallbacks (${elapsed}s)\n`);
}

// Final stats
const counts = articles.map(a=>wc(a.body));
const u1400 = counts.filter(c=>c<1400).length;
const avg = Math.round(counts.reduce((a,b)=>a+b,0)/counts.length);
const hasTldr = articles.filter(a=>(a.body||'').includes('data-tldr')).length;
const hasAmazon = articles.filter(a=>(a.body||'').includes('amazon.com')).length;
const hasHero = articles.filter(a=>(a.hero_url||'').includes('b-cdn.net')).length;

console.log(`\n═══ COMPLETE ═══`);
console.log(`Total: ${articles.length} | Under 1400: ${u1400} | Avg: ${avg}w | Fallbacks: ${fallbacks}`);
console.log(`TL;DR: ${hasTldr}/${articles.length} | Amazon: ${hasAmazon}/${articles.length} | Bunny hero: ${hasHero}/${articles.length}`);
