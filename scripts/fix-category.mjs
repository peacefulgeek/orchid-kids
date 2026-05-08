import { readFileSync, writeFileSync } from 'fs';

const articles = JSON.parse(readFileSync('scripts/seed-articles.json', 'utf8'));
let fixed = 0;
for (const a of articles) {
  if (a.category === 'long-term') {
    a.category = 'long-term-outcomes';
    fixed++;
  }
}
writeFileSync('scripts/seed-articles.json', JSON.stringify(articles, null, 2));
console.log(`Fixed ${fixed} articles. Total: ${articles.length}`);
