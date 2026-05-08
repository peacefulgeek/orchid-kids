import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const articles = JSON.parse(readFileSync(STORE_PATH, 'utf8'));

// Find articles that share an image (used by more than 1 article)
// Articles 1-40 already have lib-01 through lib-40 (one each)
// Articles 41+ are sharing images from the pool of 40

// Build image usage map
const imageUsage = {};
articles.forEach((a, i) => {
  if (!imageUsage[a.hero_url]) imageUsage[a.hero_url] = [];
  imageUsage[a.hero_url].push(i);
});

// Articles that need new unique images = all articles beyond the first 40
// (index 40 onward, since 0-39 each have lib-01 through lib-40 uniquely)
// Actually let's check: find all articles whose hero_url is shared
const needsNewImage = [];
for (const [url, indices] of Object.entries(imageUsage)) {
  if (indices.length > 1) {
    // All but the first one need a new image
    indices.slice(1).forEach(i => needsNewImage.push(i));
  }
}
needsNewImage.sort((a, b) => a - b);

console.log('Articles needing new unique images:', needsNewImage.length);

// Category-to-visual-style mapping for consistent aesthetics
const CATEGORY_STYLES = {
  'understanding-hsc': 'soft watercolor illustration of a thoughtful child in a peaceful garden, orchid flowers, warm pastel tones',
  'neuroscience': 'elegant scientific illustration of neural pathways and brain activity, soft blue and purple tones, orchid motif',
  'parenting-strategies': 'warm illustration of parent and child connection, cozy home setting, soft golden light, orchid flowers',
  'school-social': 'gentle illustration of children in a nurturing classroom or playground, soft colors, orchid accent',
  'sensory-environment': 'serene illustration of a calm sensory-friendly space, soft textures, muted earth tones, orchid flowers',
  'emotional-wellbeing': 'tender illustration of emotional expression and comfort, soft watercolor, warm rose and lavender tones',
  'family-dynamics': 'warm family scene illustration, cozy and connected, soft natural light, orchid flowers in background',
  'tools-resources': 'gentle flat-lay illustration of helpful tools and books for sensitive children, soft pastels, orchid accent',
  'long-term-outcomes': 'hopeful illustration of a flourishing orchid child growing into their potential, sunrise tones, soft watercolor',
};

// Build prompts for each article needing a new image
const prompts = needsNewImage.map(i => {
  const article = articles[i];
  const style = CATEGORY_STYLES[article.category] || 'soft watercolor illustration, orchid flowers, warm pastel tones, peaceful and nurturing';
  const prompt = `Hero image for article titled "${article.title}". Style: ${style}. No text, no words, no letters in the image. Horizontal format, suitable as a blog hero image. High quality, professional, warm and inviting.`;
  return {
    index: i,
    slug: article.slug,
    title: article.title,
    category: article.category,
    prompt,
    filename: `lib-${String(i + 1).padStart(3, '0')}.webp`,
  };
});

writeFileSync('/home/ubuntu/raising-orchids/scripts/image-prompts.json', JSON.stringify(prompts, null, 2));
console.log('Saved', prompts.length, 'prompts to image-prompts.json');
console.log('Sample:', prompts[0]);
