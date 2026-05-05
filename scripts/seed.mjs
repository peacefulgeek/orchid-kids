#!/usr/bin/env node
/**
 * Seed script — inserts all 30 articles + assessments into the DB.
 * Run: node scripts/seed.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

const articles = JSON.parse(
  readFileSync(join(__dirname, 'seed-articles.json'), 'utf8')
);

const assessments = [
  {
    slug: 'is-my-child-highly-sensitive',
    title: 'Is My Child Highly Sensitive? The HSC Screening Assessment',
    description: 'Based on Elaine Aron\'s research, this 20-question assessment helps you understand whether your child may be highly sensitive and what that means for your family.',
    category: 'understanding-hsc',
    questions: JSON.stringify([
      { id: 1, text: 'My child is bothered by scratchy clothing, seams in socks, or tags in shirts.', dimension: 'sensory' },
      { id: 2, text: 'My child is very sensitive to pain.', dimension: 'sensory' },
      { id: 3, text: 'My child doesn\'t do well with big changes.', dimension: 'adaptability' },
      { id: 4, text: 'My child notices and is bothered by subtle odors.', dimension: 'sensory' },
      { id: 5, text: 'My child has a fussy appetite and is particular about the texture or taste of food.', dimension: 'sensory' },
      { id: 6, text: 'My child is hard to get to sleep after an exciting day.', dimension: 'arousal' },
      { id: 7, text: 'My child doesn\'t do well with a lot of commotion.', dimension: 'arousal' },
      { id: 8, text: 'My child is deeply moved by music, art, or nature.', dimension: 'depth' },
      { id: 9, text: 'My child is very intuitive and seems to know things without being told.', dimension: 'depth' },
      { id: 10, text: 'My child has a rich and complex inner life.', dimension: 'depth' },
      { id: 11, text: 'My child is very empathetic and feels others\' emotions deeply.', dimension: 'empathy' },
      { id: 12, text: 'My child is deeply affected by violence or cruelty in movies or news.', dimension: 'empathy' },
      { id: 13, text: 'My child asks deep questions about life, death, and the meaning of things.', dimension: 'depth' },
      { id: 14, text: 'My child is very conscientious and has a strong sense of right and wrong.', dimension: 'depth' },
      { id: 15, text: 'My child is overwhelmed by crowded, noisy places like malls or parties.', dimension: 'arousal' },
      { id: 16, text: 'My child is very bothered by loud noises.', dimension: 'sensory' },
      { id: 17, text: 'My child notices subtle changes in their environment that others miss.', dimension: 'depth' },
      { id: 18, text: 'My child is very affected by other people\'s moods.', dimension: 'empathy' },
      { id: 19, text: 'My child has difficulty transitioning from one activity to another.', dimension: 'adaptability' },
      { id: 20, text: 'My child has very strong emotional reactions — both positive and negative.', dimension: 'empathy' },
    ]),
    scoring: JSON.stringify({
      low: { min: 0, max: 35, label: 'Low Sensitivity', description: 'Your child shows few signs of high sensitivity. They may be what researchers call a "dandelion child" — resilient and adaptable across a wide range of environments.' },
      moderate: { min: 36, max: 55, label: 'Moderate Sensitivity', description: 'Your child shows some signs of high sensitivity. They may benefit from some of the strategies on this site, particularly around transitions and emotional intensity.' },
      high: { min: 56, max: 80, label: 'High Sensitivity', description: 'Your child shows strong signs of high sensitivity. Understanding this trait and designing their environment accordingly can make a significant difference in their wellbeing and flourishing.' },
    }),
  },
  {
    slug: 'sensory-profile-assessment',
    title: 'Sensory Profile Assessment for Highly Sensitive Children',
    description: 'Identify which sensory channels are most sensitive for your child — tactile, auditory, visual, olfactory, or interoceptive — and get targeted strategies for each.',
    category: 'sensory-environment',
    questions: JSON.stringify([
      { id: 1, text: 'My child is bothered by clothing textures, seams, or tags.', dimension: 'tactile' },
      { id: 2, text: 'My child dislikes being touched unexpectedly or lightly.', dimension: 'tactile' },
      { id: 3, text: 'My child prefers firm hugs over light touches.', dimension: 'tactile' },
      { id: 4, text: 'My child is bothered by loud or sudden noises.', dimension: 'auditory' },
      { id: 5, text: 'My child is distracted by background sounds others don\'t notice.', dimension: 'auditory' },
      { id: 6, text: 'My child covers their ears in noisy environments.', dimension: 'auditory' },
      { id: 7, text: 'My child is bothered by bright or fluorescent lights.', dimension: 'visual' },
      { id: 8, text: 'My child is overwhelmed by visually busy or cluttered environments.', dimension: 'visual' },
      { id: 9, text: 'My child notices subtle visual details others miss.', dimension: 'visual' },
      { id: 10, text: 'My child is bothered by strong smells that others don\'t notice.', dimension: 'olfactory' },
      { id: 11, text: 'My child gags or is very bothered by certain food smells.', dimension: 'olfactory' },
      { id: 12, text: 'My child refuses foods based on texture rather than taste.', dimension: 'gustatory' },
      { id: 13, text: 'My child is very particular about food temperature.', dimension: 'gustatory' },
      { id: 14, text: 'My child is very aware of internal body sensations (hunger, heartbeat, discomfort).', dimension: 'interoceptive' },
      { id: 15, text: 'My child has difficulty identifying when they are hungry, tired, or need to use the bathroom.', dimension: 'interoceptive' },
    ]),
    scoring: JSON.stringify({
      tactile: 'Tactile sensitivity is high. Prioritize seamless socks, tagless clothing, and soft natural fabrics. Allow the child to control physical contact.',
      auditory: 'Auditory sensitivity is high. Consider noise-canceling headphones for overwhelming environments. Reduce background noise at home.',
      visual: 'Visual sensitivity is high. Replace fluorescent lighting with warm LED. Reduce visual clutter in learning and sleeping spaces.',
      olfactory: 'Olfactory sensitivity is high. Be mindful of strong scents in the home. Introduce new foods gradually, starting with smell.',
      gustatory: 'Gustatory sensitivity is high. Use the division of responsibility model for mealtimes. Allow sensory exploration of new foods without pressure.',
      interoceptive: 'Interoceptive sensitivity is notable. Help the child build body awareness through regular check-ins and mindfulness practices.',
    }),
  },
  {
    slug: 'family-stress-load-assessment',
    title: 'Family Stress Load Assessment',
    description: 'Highly sensitive children are more affected by family stress than other children. This assessment helps you identify the stress load in your family system and where to focus first.',
    category: 'family-dynamics',
    questions: JSON.stringify([
      { id: 1, text: 'There is frequent conflict between adults in our household.', dimension: 'conflict' },
      { id: 2, text: 'Our household routines are inconsistent or unpredictable.', dimension: 'predictability' },
      { id: 3, text: 'My child witnesses adult stress or anxiety regularly.', dimension: 'emotional-climate' },
      { id: 4, text: 'Our home is frequently chaotic, noisy, or disorganized.', dimension: 'sensory-load' },
      { id: 5, text: 'My child has experienced significant changes recently (move, school change, family change).', dimension: 'change' },
      { id: 6, text: 'I often feel overwhelmed by my child\'s emotional needs.', dimension: 'parent-capacity' },
      { id: 7, text: 'My child\'s schedule is very full with activities and commitments.', dimension: 'schedule' },
      { id: 8, text: 'There is significant tension between siblings in our household.', dimension: 'sibling-dynamics' },
      { id: 9, text: 'My child has limited downtime or unstructured time each day.', dimension: 'recovery' },
      { id: 10, text: 'I feel I don\'t have enough support in parenting my sensitive child.', dimension: 'parent-support' },
    ]),
    scoring: JSON.stringify({
      low: { min: 0, max: 15, label: 'Low Stress Load', description: 'Your family environment appears to be relatively low-stress. Focus on maintaining the positive elements and building on what\'s working.' },
      moderate: { min: 16, max: 25, label: 'Moderate Stress Load', description: 'Your family has some stress factors that may be affecting your sensitive child. Identify the highest-scoring areas and address them one at a time.' },
      high: { min: 26, max: 40, label: 'High Stress Load', description: 'Your family is carrying a significant stress load. For a highly sensitive child, this is having a measurable impact. Prioritizing stress reduction is the highest-leverage intervention available.' },
    }),
  },
];

async function createTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT,
      category VARCHAR(100),
      tags TEXT[],
      hero_url TEXT,
      reading_time INTEGER DEFAULT 5,
      author VARCHAR(255) DEFAULT 'The Oracle Lover',
      body TEXT,
      published BOOLEAN DEFAULT true,
      publish_date TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category VARCHAR(100),
      questions JSONB,
      scoring JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS assessment_results (
      id SERIAL PRIMARY KEY,
      assessment_slug VARCHAR(255),
      session_id VARCHAR(255),
      answers JSONB,
      score INTEGER,
      result_label VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Tables created');
}

async function seedArticles(client) {
  let inserted = 0;
  let skipped = 0;
  for (const article of articles) {
    try {
      await client.query(
        `INSERT INTO articles (slug, title, meta_description, category, tags, hero_url, reading_time, author, body, published, publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           meta_description = EXCLUDED.meta_description,
           body = EXCLUDED.body,
           updated_at = NOW()`,
        [
          article.slug,
          article.title,
          article.meta_description,
          article.category,
          article.tags,
          article.hero_url,
          article.reading_time,
          article.author,
          article.body,
        ]
      );
      inserted++;
    } catch (err) {
      console.error(`Failed to insert article ${article.slug}:`, err.message);
      skipped++;
    }
  }
  console.log(`✅ Articles: ${inserted} inserted/updated, ${skipped} skipped`);
}

async function seedAssessments(client) {
  let inserted = 0;
  for (const assessment of assessments) {
    await client.query(
      `INSERT INTO assessments (slug, title, description, category, questions, scoring)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         questions = EXCLUDED.questions,
         scoring = EXCLUDED.scoring`,
      [
        assessment.slug,
        assessment.title,
        assessment.description,
        assessment.category,
        assessment.questions,
        assessment.scoring,
      ]
    );
    inserted++;
  }
  console.log(`✅ Assessments: ${inserted} inserted/updated`);
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🌸 Seeding Raising Orchids database...');
    await createTables(client);
    await seedArticles(client);
    await seedAssessments(client);
    console.log('🌸 Seed complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
