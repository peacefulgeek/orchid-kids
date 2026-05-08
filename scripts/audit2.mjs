import { readFileSync } from 'fs';

const articles = JSON.parse(readFileSync('scripts/seed-articles.json', 'utf8'));
const total = articles.length;
const now = new Date();
const todayStr = now.toISOString().slice(0, 10);

// Date status
const noDate = articles.filter(a => !a.published_at);
const future = articles.filter(a => a.published_at && a.published_at > todayStr);
const past = articles.filter(a => a.published_at && a.published_at <= todayStr);

// Images
const withImage = articles.filter(a => a.hero_url && a.hero_url.trim() !== '');
const noImage = articles.filter(a => !a.hero_url || a.hero_url.trim() === '');
const imageSet = new Set(articles.map(a => a.hero_url).filter(Boolean));

// Word counts
const wordCounts = articles.map(a => ({
  slug: a.slug,
  words: a.body ? a.body.split(/\s+/).length : 0
}));
const under1800 = wordCounts.filter(a => a.words < 1800);
const avgWords = Math.round(wordCounts.reduce((s, a) => s + a.words, 0) / wordCounts.length);
const minWords = Math.min(...wordCounts.map(a => a.words));
const maxWords = Math.max(...wordCounts.map(a => a.words));

// Date range
const datesWithValues = articles.filter(a => a.published_at).map(a => a.published_at).sort();
const earliest = datesWithValues[0];
const latest = datesWithValues[datesWithValues.length - 1];

console.log('=== RAISING ORCHIDS — FULL AUDIT ===');
console.log('Today:', todayStr);
console.log('');
console.log('--- ARTICLES ---');
console.log('Total in JSON:', total);
console.log('No published_at (undefined):', noDate.length);
console.log('Past/live (published_at <= today):', past.length);
console.log('Future/gated (published_at > today):', future.length);
console.log('Earliest date:', earliest);
console.log('Latest date:', latest);
console.log('');
console.log('--- IMAGES ---');
console.log('Articles with hero_url:', withImage.length);
console.log('Articles without hero_url:', noImage.length);
console.log('Unique image URLs:', imageSet.size);
console.log('');
console.log('--- WORD COUNTS ---');
console.log('Average:', avgWords, 'words');
console.log('Min:', minWords, 'words');
console.log('Max:', maxWords, 'words');
console.log('Under 1800 words:', under1800.length);
if (under1800.length > 0 && under1800.length <= 15) {
  under1800.slice(0, 10).forEach(a => console.log('  -', a.slug.slice(0, 50), a.words));
}
console.log('');
console.log('--- WHAT THE SERVER SERVES ---');
console.log('articleStore.mjs ignores published_at from JSON — it OVERWRITES it with:');
console.log('  new Date(Date.now() - (data.length - i) * 24 * 60 * 60 * 1000)');
console.log('  = articles get dates going back from today, all in the PAST');
console.log('  = ALL 531 articles are served immediately (no gating at serve time)');
console.log('');
console.log('--- CONCLUSION ---');
console.log('The JSON has date-gating (500 future, 31 no date)');
console.log('BUT articleStore.mjs overwrites published_at with past dates for all articles');
console.log('So currently ALL 531 articles are visible on the live site');
