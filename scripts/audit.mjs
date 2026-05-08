import { readFileSync } from 'fs';

const articles = JSON.parse(readFileSync('scripts/seed-articles.json', 'utf8'));
const total = articles.length;

const now = new Date();
const published = articles.filter(a => new Date(a.published_at) <= now);
const future = articles.filter(a => new Date(a.published_at) > now);

const withImage = articles.filter(a => a.hero_url && a.hero_url.trim() !== '');
const noImage = articles.filter(a => !a.hero_url || a.hero_url.trim() === '');
const imageSet = new Set(articles.map(a => a.hero_url).filter(Boolean));

// Word count for all articles
const wordCounts = articles.map(a => ({
  slug: a.slug,
  words: a.body ? a.body.split(/\s+/).length : 0
}));
const under1800 = wordCounts.filter(a => a.words < 1800);
const avgWords = Math.round(wordCounts.reduce((s, a) => s + a.words, 0) / wordCounts.length);

const dates = articles.map(a => a.published_at).sort();

console.log('=== ARTICLE AUDIT ===');
console.log('Total articles:', total);
console.log('Published (visible today):', published.length);
console.log('Future-gated (not yet live):', future.length);
console.log('');
console.log('=== IMAGES ===');
console.log('Articles WITH hero image:', withImage.length);
console.log('Articles WITHOUT hero image:', noImage.length);
console.log('Unique image URLs:', imageSet.size);
console.log('');
console.log('=== WORD COUNTS ===');
console.log('Average word count:', avgWords);
console.log('Articles under 1800 words:', under1800.length);
if (under1800.length > 0 && under1800.length <= 10) {
  under1800.forEach(a => console.log(' -', a.slug, a.words, 'words'));
}
console.log('');
console.log('=== DATE RANGE ===');
console.log('Earliest publish date:', dates[0]);
console.log('Latest publish date:', dates[dates.length - 1]);
console.log('');

// Sample of future-gated dates
const futureDates = future.map(a => a.published_at).sort().slice(0, 5);
console.log('Next 5 scheduled publish dates:');
futureDates.forEach(d => console.log(' -', d));
