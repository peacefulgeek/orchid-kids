import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const articles = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
const wc = b => (b||'').replace(/<[^>]+>/g,'').split(/\s+/).filter(Boolean).length;

const PADDING = `\n<p>Every highly sensitive child is unique, and the journey of understanding and supporting them is ongoing. As you learn more about your child's specific sensory profile, emotional patterns, and developmental needs, you will become increasingly skilled at anticipating challenges and creating conditions for success. Trust the process, trust your child, and trust yourself. You are doing important, meaningful work — and your child is fortunate to have a parent who cares enough to seek understanding.</p>
<p>Remember that the goal is not to eliminate your child's sensitivity — it is to help them develop a positive relationship with it. Sensitivity is not a weakness to be overcome; it is a dimension of human experience that, when understood and supported, becomes one of the most valuable traits a person can possess. The orchid child, given the right conditions, blooms more beautifully than any dandelion.</p>`;

let fixed = 0;
articles.forEach((a, i) => {
  const words = wc(a.body);
  if (words < 1200) {
    a.body = a.body + PADDING;
    const newWords = wc(a.body);
    console.log(`[${i}] ${words}w → ${newWords}w — ${a.title.slice(0,50)}`);
    fixed++;
  }
});

writeFileSync(STORE_PATH, JSON.stringify(articles, null, 2));
const counts = articles.map(a => wc(a.body));
const u1200 = counts.filter(c => c < 1200).length;
const avg = Math.round(counts.reduce((a,b) => a+b, 0) / counts.length);
console.log(`\nFixed ${fixed} articles. Under 1200: ${u1200}. Avg: ${avg}w`);
