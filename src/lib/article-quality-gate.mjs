/**
 * Article Quality Gate — Section 12B
 * All articles must pass this gate before being stored or published.
 * A failed gate NEVER becomes a stored article.
 */

const AI_FLAGGED_WORDS = [
  // Classic AI tells
  'delve','tapestry','paradigm','synergy','leverage','unlock','empower',
  'utilize','pivotal','embark','underscore','paramount','seamlessly',
  'robust','beacon','foster','elevate','curate','curated','bespoke',
  'resonate','harness','intricate','plethora','myriad','comprehensive',
  // Marketing fluff
  'transformative','groundbreaking','innovative','cutting-edge','revolutionary',
  'state-of-the-art','ever-evolving','rapidly-evolving','game-changer','game-changing',
  'next-level','world-class','unparalleled','unprecedented','remarkable',
  'extraordinary','exceptional',
  // Abstract filler
  'profound','holistic','nuanced','multifaceted','stakeholders',
  'ecosystem','landscape','realm','sphere','domain',
  // Hedging
  'arguably','notably','crucially','importantly','essentially',
  'fundamentally','inherently','intrinsically','substantively',
  // Bullshit verbs
  'streamline','optimize','facilitate','amplify','catalyze',
  'propel','spearhead','orchestrate','navigate','traverse',
  // AI-favourite connectors
  'furthermore','moreover','additionally','consequently','subsequently',
  'thereby','thusly','wherein','whereby'
];

const AI_FLAGGED_PHRASES = [
  "it's important to note that","it's worth noting that","it's worth mentioning",
  "it's crucial to","it is essential to",
  "in conclusion,","in summary,","to summarize,",
  "a holistic approach","unlock your potential","unlock the power",
  "in the realm of","in the world of",
  "dive deep into","dive into","delve into",
  "at the end of the day",
  "in today's fast-paced world","in today's digital age","in today's modern world",
  "in this digital age","when it comes to","navigate the complexities",
  "a testament to","speaks volumes",
  "the power of","the beauty of","the art of","the journey of","the key lies in",
  "plays a crucial role","plays a vital role","plays a significant role","plays a pivotal role",
  "a wide array of","a wide range of","a plethora of","a myriad of",
  "stands as a","serves as a","acts as a","has emerged as",
  "continues to evolve","has revolutionized","cannot be overstated",
  "it goes without saying","needless to say","last but not least","first and foremost"
];

export function countWords(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped ? stripped.split(/\s+/).length : 0;
}

export function countAmazonLinks(html) {
  return (html.match(/amazon\.com\/dp\//gi) || []).length;
}

export function extractAsinsFromText(html) {
  const matches = html.matchAll(/amazon\.com\/dp\/([A-Z0-9]{10})/gi);
  return [...new Set([...matches].map(m => m[1]))];
}

export function hasEmDash(text) {
  return text.includes('\u2014') || text.includes('\u2013');
}

export function findFlaggedWords(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').toLowerCase();
  const found = [];
  for (const w of AI_FLAGGED_WORDS) {
    const pat = w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (new RegExp(`\\b${pat}\\b`, 'i').test(stripped)) found.push(w);
  }
  return found;
}

export function findFlaggedPhrases(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').toLowerCase().replace(/\s+/g, ' ');
  return AI_FLAGGED_PHRASES.filter(p => stripped.includes(p));
}

/**
 * Voice signal analysis — measures conversational fingerprint.
 */
export function voiceSignals(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ');
  const lower = stripped.toLowerCase();

  const contractions = (lower.match(/\b\w+'(s|re|ve|d|ll|m|t)\b/g) || []).length;
  const directAddress = (lower.match(/\byou('re|r|rself|)?\b/g) || []).length;
  const firstPerson = (lower.match(/\b(i|i'm|i've|i'd|i'll|my|me|mine)\b/g) || []).length;

  const sentences = stripped.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);
  const shortSentences = lengths.filter(l => l <= 6).length;
  const longSentences = lengths.filter(l => l >= 25).length;

  const conversationalMarkers = [
    /\bhere's the thing\b/i, /\blook,\s/i, /\bhonestly,?\s/i, /\btruth is\b/i,
    /\bthe truth\b/i, /\bi'll tell you\b/i, /\bthink about it\b/i,
    /\bthat said\b/i, /\bbut here's\b/i, /\bso yeah\b/i, /\bkind of\b/i,
    /\bsort of\b/i, /\byou know\b/i, /\bright\?!?\b/i, /\bknow what i mean\?/i,
    /\bdoes that land\?/i, /\bhow does that make you feel\?/i
  ].filter(r => r.test(stripped)).length;

  return {
    contractions, directAddress, firstPerson,
    sentenceCount: sentences.length,
    avgSentenceLength: +avg.toFixed(1),
    sentenceStdDev: +stdDev.toFixed(1),
    shortSentences, longSentences,
    conversationalMarkers
  };
}

/**
 * EEAT signal counting (Section 14).
 */
export function eeatSignals(html) {
  const tldr = /<section[^>]*data-tldr="ai-overview"/i.test(html);
  const authorByline = /class="author-byline"/i.test(html) || /data-eeat="author"/i.test(html);
  const internalLinks = (html.match(/<a [^>]*href="\/[^"]*"/g) || []).length;
  const externalAuthLinks = (html.match(/<a [^>]*href="https?:\/\/[^"]*\.(gov|edu|nih\.gov|cdc\.gov|who\.int|nature\.com|sciencedirect\.com|pubmed\.ncbi\.nlm\.nih\.gov)[^"]*"/gi) || []).length;
  const lastUpdated = /datetime="\d{4}-\d{2}-\d{2}/.test(html);
  const selfRef = /\b(in our experience|when we tested|on this site|across our|we['']ve published|i['']ve seen|in my own practice|over the years (i['']ve|we['']ve)|after years of)\b/i.test(html);
  return { tldr, authorByline, internalLinks, externalAuthLinks, lastUpdated, selfRef };
}

/**
 * Full quality gate. If passed === false → REGENERATE.
 */
export function runQualityGate(articleBody) {
  const failures = [];
  const warnings = [];

  // 1. Word count: 1,200 to 2,500
  const words = countWords(articleBody);
  if (words < 1200) failures.push(`word-count-too-low:${words}`);
  if (words > 2500) failures.push(`word-count-too-high:${words}`);

  // 2. Amazon links: 3 to 4
  const amzCount = countAmazonLinks(articleBody);
  if (amzCount < 3) failures.push(`amazon-links-too-few:${amzCount}`);
  if (amzCount > 4) failures.push(`amazon-links-too-many:${amzCount}`);

  // 3. Em-dashes / en-dashes: zero tolerance
  if (hasEmDash(articleBody)) failures.push('contains-em-or-en-dash');

  // 4. AI-flagged words: zero tolerance
  const bw = findFlaggedWords(articleBody);
  if (bw.length > 0) failures.push(`ai-flagged-words:${bw.join(',')}`);

  // 5. AI-flagged phrases: zero tolerance
  const bp = findFlaggedPhrases(articleBody);
  if (bp.length > 0) failures.push(`ai-flagged-phrases:${bp.join('|')}`);

  // 6. Voice signal scoring
  const voice = voiceSignals(articleBody);
  const per1k = (n) => (n / (words || 1)) * 1000;

  if (per1k(voice.contractions) < 4) {
    failures.push(`contractions-too-few:${voice.contractions}(${per1k(voice.contractions).toFixed(1)}/1k)`);
  }
  if (voice.directAddress === 0 && voice.firstPerson === 0) {
    failures.push('no-direct-address-or-first-person');
  }
  if (voice.sentenceStdDev < 4) {
    failures.push(`sentence-variance-too-low:${voice.sentenceStdDev}`);
  }
  if (voice.shortSentences < 2) {
    failures.push(`too-few-short-sentences:${voice.shortSentences}`);
  }
  if (voice.conversationalMarkers < 2) {
    failures.push(`conversational-markers-too-few:${voice.conversationalMarkers}`);
  }

  // 7. EEAT signals — every article must hit all six
  const eeat = eeatSignals(articleBody);
  if (!eeat.tldr) failures.push('eeat-missing-tldr');
  if (!eeat.authorByline) failures.push('eeat-missing-author-byline');
  if (eeat.internalLinks < 3) failures.push(`eeat-internal-links-too-few:${eeat.internalLinks}`);
  if (eeat.externalAuthLinks < 1) failures.push(`eeat-external-auth-links-too-few:${eeat.externalAuthLinks}`);
  if (!eeat.lastUpdated) failures.push('eeat-missing-last-updated');
  if (!eeat.selfRef) failures.push('eeat-missing-self-reference');

  return {
    passed: failures.length === 0,
    failures, warnings,
    wordCount: words,
    amazonLinks: amzCount,
    asins: extractAsinsFromText(articleBody),
    voice, eeat
  };
}
