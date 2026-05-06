/**
 * DeepSeek Article Generator
 * Uses OpenAI client pointed at DeepSeek API.
 * Called by the cron system and bulk-seed script.
 */
import { buildHardRulesPrompt } from './hard-rules.mjs';
import { getProductsForArticle } from './asin-catalog.mjs';

const MODEL   = process.env.OPENAI_MODEL   || 'deepseek-chat';
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const API_KEY  = process.env.OPENAI_API_KEY  || '';

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate a single article via DeepSeek.
 * @param {Object} ctx
 * @param {string} ctx.title         - Article title
 * @param {string} ctx.category      - Category slug
 * @param {string[]} ctx.tags        - Tags array
 * @param {Array}  ctx.internalLinks - [{title, slug}] for internal linking
 * @param {string} [ctx.excerpt]     - Optional excerpt hint
 * @returns {Object} { title, slug, category, tags, excerpt, body, asins }
 */
export async function generateArticle({ title, category, tags = [], internalLinks = [], excerpt = '' }) {
  if (!API_KEY) throw new Error('OPENAI_API_KEY not set');

  const products = getProductsForArticle(category, 5);
  const hardRules = buildHardRulesPrompt({ products, internalLinks });

  const systemPrompt = `You are a warm, direct, research-backed parenting writer for OrchidKids.com — a site dedicated to parents of highly sensitive children (HSC). You write in a voice that is tender but not soft, direct but not harsh, and always grounded in real neuroscience and lived experience. You are NOT an AI assistant. You are a writer who has spent years working with HSC families.

${hardRules}`;

  const userPrompt = `Write a complete, publication-ready HTML article for OrchidKids.com on this topic:

TITLE: ${title}
CATEGORY: ${category}
TAGS: ${tags.join(', ')}
${excerpt ? `ANGLE: ${excerpt}` : ''}

The article must be 1,600 to 2,000 words. Return ONLY the HTML body content (no <html>, <head>, or <body> tags). Start with the TL;DR section block. End with the author byline.`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const body = data.choices?.[0]?.message?.content?.trim();
  if (!body) throw new Error('DeepSeek returned empty content');

  // Extract excerpt from TL;DR if not provided
  let finalExcerpt = excerpt;
  if (!finalExcerpt) {
    const tldrMatch = body.match(/<section[^>]*data-tldr[^>]*>[\s\S]*?<p>(.*?)<\/p>/i);
    if (tldrMatch) {
      finalExcerpt = tldrMatch[1].replace(/<[^>]+>/g, '').slice(0, 200);
    } else {
      finalExcerpt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    }
  }

  // Extract ASINs used
  const asinMatches = body.matchAll(/amazon\.com\/dp\/([A-Z0-9]{10})/gi);
  const asins = [...new Set([...asinMatches].map(m => m[1]))];

  return {
    title,
    slug: slugify(title),
    category,
    tags,
    excerpt: finalExcerpt,
    body,
    asins,
  };
}

/**
 * Generate an excerpt/meta description for an article.
 */
export async function generateExcerpt(title, body) {
  if (!API_KEY) return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: `Write a 150-160 character meta description for this article titled "${title}". Return ONLY the meta description text, no quotes. It must be compelling, specific, and end naturally (not mid-sentence).`
      }],
      temperature: 0.5,
      max_tokens: 100,
    }),
  });

  if (!response.ok) return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
