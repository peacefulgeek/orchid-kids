/**
 * regen-v5.mjs — Definitive regeneration
 * Mode A: Full rewrite for articles < 1200 words (concurrency 8, max_tokens 4500)
 * Mode B: Continuation for articles 1200-1400 words (concurrency 15, max_tokens 1500)
 * Mode C: Meta injection only for articles >= 1400 words (no API)
 * Gate: 1400 words
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
    r = r.replace('<h2>', `<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>\n<h2>`);
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

const modeA = articles.map((a,i)=>({...a,_i:i,_w:wc(a.body)})).filter(a=>a._w<1200);
const modeB = articles.map((a,i)=>({...a,_i:i,_w:wc(a.body)})).filter(a=>a._w>=1200&&a._w<1400);
const modeC = articles.map((a,i)=>({...a,_i:i,_w:wc(a.body)})).filter(a=>a._w>=1400);

console.log(`Mode A (full rewrite <1200w): ${modeA.length}`);
console.log(`Mode B (continuation 1200-1400w): ${modeB.length}`);
console.log(`Mode C (meta inject >=1400w): ${modeC.length}`);

// Mode C: instant meta injection
for (const a of modeC) { articles[a._i].body = injectMeta(a.body, a.title); }
writeFileSync(STORE_PATH, JSON.stringify(articles,null,2));
console.log(`[C] Meta injected on ${modeC.length} articles (no API)\n`);

let done=0, fallbacks=0;
const total = modeA.length + modeB.length;
const t0 = Date.now();

async function doRewrite(item) {
  const links = amazonLinks(item.title);
  const prompt = `Write a complete 1,600-word article for parents of highly sensitive children.

TITLE: ${item.title}
CATEGORY: ${item.category}

STRUCTURE (write ALL sections, each substantial):
<h2>Introduction</h2> (180w) — relatable parent scenario + why this matters
<div data-tldr="ai-overview"><strong>TL;DR:</strong> [2-sentence summary]</div>
<div class="author-byline">By the OrchidKids Editorial Team · Reviewed by a licensed child psychologist</div>
<h2>The Science</h2> (220w) — research, studies, findings
<h2>Signs to Watch For</h2> (180w) — <ul> with 5+ specific behaviors
<h2>Why It Matters</h2> (180w) — long-term developmental impact
<h2>Practical Strategies</h2> (280w) — numbered list of 5+ strategies. Include: ${links}
<h2>What to Avoid</h2> (130w) — <ul> with 4 common mistakes
<h2>When to Seek Help</h2> (130w) — specific signs for professional support
<h2>Moving Forward</h2> (130w) — warm, encouraging close

Rules: HTML only (h2,p,ul,ol,li). No markdown. No wrapper tags. Write completely. Do not truncate.`;

  for (let att=1; att<=3; att++) {
    try {
      const body = await openai([
        {role:'system', content:'You write complete parenting articles. Never truncate. Always write all sections.'},
        {role:'user', content:prompt}
      ], 4500);
      const enhanced = injectMeta(body, item.title);
      if (wc(enhanced) >= 1400) {
        articles[item._i].body = enhanced;
        done++;
        const pct = Math.round(done/total*100);
        console.log(`[A✓] ${done}/${total}(${pct}%) ${wc(enhanced)}w "${item.title.slice(0,45)}" (${Math.round((Date.now()-t0)/1000)}s)`);
        return;
      }
      console.log(`  [A att${att}] ${wc(enhanced)}w "${item.title.slice(0,40)}"`);
    } catch(e) {
      console.log(`  [A att${att}] ERR: ${e.message.slice(0,80)}`);
      if (att<3) await new Promise(r=>setTimeout(r,2000*att));
    }
  }
  // fallback: inject meta and keep
  articles[item._i].body = injectMeta(item.body||'', item.title);
  done++; fallbacks++;
  console.log(`[A~] FALLBACK ${done}/${total} ${wc(articles[item._i].body)}w "${item.title.slice(0,45)}"`);
}

async function doContinuation(item) {
  const links = amazonLinks(item.title);
  const prompt = `Extend this article about "${item.title}" by adding 2 new HTML sections (total ~350 words).

Pick sections that fit:
- <h2>Real Stories from Families</h2> — 2 brief parent stories
- <h2>Age-Specific Guidance</h2> — toddlers, school-age, teens
- <h2>Building on Strengths</h2> — how sensitivity becomes an asset
- <h2>A Practical Action Plan</h2> — 5-step summary

Include naturally: ${links}

Output ONLY the new HTML sections. No markdown. Do not repeat existing content.
Article ends: ...${(item.body||'').slice(-300)}`;

  for (let att=1; att<=2; att++) {
    try {
      const addition = await openai([
        {role:'system', content:'Add new HTML sections to extend articles. Output only new sections.'},
        {role:'user', content:prompt}
      ], 1200);
      const combined = injectMeta((item.body||'')+'\n'+addition, item.title);
      if (wc(combined) >= 1400) {
        articles[item._i].body = combined;
        done++;
        const pct = Math.round(done/total*100);
        console.log(`[B✓] ${done}/${total}(${pct}%) ${wc(combined)}w "${item.title.slice(0,45)}" (${Math.round((Date.now()-t0)/1000)}s)`);
        return;
      }
      console.log(`  [B att${att}] ${wc(combined)}w "${item.title.slice(0,40)}"`);
    } catch(e) {
      console.log(`  [B att${att}] ERR: ${e.message.slice(0,80)}`);
      if (att<2) await new Promise(r=>setTimeout(r,2000));
    }
  }
  articles[item._i].body = injectMeta(item.body||'', item.title);
  done++; fallbacks++;
  console.log(`[B~] FALLBACK ${done}/${total} ${wc(articles[item._i].body)}w "${item.title.slice(0,45)}"`);
}

// Phase A: full rewrites (concurrency 8)
console.log(`\n=== PHASE A: ${modeA.length} full rewrites (concurrency 8) ===`);
for (let i=0; i<modeA.length; i+=8) {
  const batch = modeA.slice(i,i+8);
  await Promise.all(batch.map(a=>doRewrite(a)));
  writeFileSync(STORE_PATH, JSON.stringify(articles,null,2));
  console.log(`[A] Batch ${Math.floor(i/8)+1}/${Math.ceil(modeA.length/8)} saved\n`);
}

// Phase B: continuations (concurrency 15)
console.log(`\n=== PHASE B: ${modeB.length} continuations (concurrency 15) ===`);
for (let i=0; i<modeB.length; i+=15) {
  const batch = modeB.slice(i,i+15);
  await Promise.all(batch.map(a=>doContinuation(a)));
  writeFileSync(STORE_PATH, JSON.stringify(articles,null,2));
  console.log(`[B] Batch ${Math.floor(i/15)+1}/${Math.ceil(modeB.length/15)} saved\n`);
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
