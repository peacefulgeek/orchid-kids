/**
 * gen500.mjs — Fast parallel 500-article generator
 * Uses OpenAI GPT-4.1-mini with 10 concurrent workers.
 * Date-gates at 3/day starting today.
 * Assigns Bunny CDN hero images (random from lib-01..lib-40).
 * Saves progress after every article — safe to re-run.
 *
 * Run: OPENAI_API_KEY=sk-... node scripts/gen500.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('[gen500] Set OPENAI_API_KEY env var to run: OPENAI_API_KEY=sk-... node scripts/gen500.mjs'); process.exit(1); }
const MODEL = 'gpt-4.1-mini';
const MAX_TOKENS = 4500;
const CONCURRENCY = 8;
const ARTICLES_PER_DAY = 3;
const BUNNY_CDN = 'https://orchid-kids2.b-cdn.net';
const AMAZON_TAG = 'spankyspinola-20';

// Amazon ASINs by category
const ASINS = {
  'understanding-hsc': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child by Elaine Aron' },
    { asin: '0767908724', name: 'The Highly Sensitive Person by Elaine Aron' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: '0062409670', name: 'Quiet: The Power of Introverts' },
  ],
  'neuroscience': [
    { asin: '0393706079', name: 'The Whole-Brain Child' },
    { asin: '1623369851', name: 'No-Drama Discipline' },
    { asin: '1250313007', name: 'The Body Keeps the Score' },
    { asin: '0525559175', name: 'How to Raise an Adult' },
  ],
  'parenting-strategies': [
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet Power' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: 'B00CQBDQJW', name: 'Sensory Processing Disorder Checklist' },
  ],
  'sensory-environment': [
    { asin: 'B07X8XMKQY', name: 'Weighted Lap Pad for Kids' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: 'B07WFPMKBR', name: 'Sensory Chew Necklace' },
    { asin: 'B07D5XHKRK', name: 'Fidget Cube Toy' },
    { asin: 'B08L5XHKRK', name: 'Calm Strips Sensory Stickers' },
  ],
  'emotional-wellbeing': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0393706079', name: 'The Whole-Brain Child' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: 'B07X8XMKQY', name: 'Weighted Blanket for Kids' },
    { asin: '1623369851', name: 'No-Drama Discipline' },
  ],
  'school-social': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet Power' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
  ],
  'family-dynamics': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: '1572246650', name: 'Raising Your Spirited Child' },
    { asin: '0393706079', name: 'The Whole-Brain Child' },
  ],
  'long-term-outcomes': [
    { asin: '0767908724', name: 'The Highly Sensitive Person' },
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: '0062409670', name: 'Quiet: The Power of Introverts' },
    { asin: '0525559175', name: 'How to Raise an Adult' },
  ],
  'tools-resources': [
    { asin: 'B07BFGWX1B', name: 'The Highly Sensitive Child' },
    { asin: 'B07X8XMKQY', name: 'Weighted Lap Pad for Kids' },
    { asin: 'B08GKZWQXN', name: 'Noise Cancelling Headphones for Kids' },
    { asin: 'B07WFPMKBR', name: 'Sensory Chew Necklace' },
    { asin: 'B07D5XHKRK', name: 'Fidget Cube Toy' },
  ],
};

function getAsins(category) {
  const pool = ASINS[category] || ASINS['tools-resources'];
  // Pick 3 random
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomHero() {
  const n = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
  return `${BUNNY_CDN}/library/lib-${n}.webp`;
}

function buildPrompt(title, category, tags, asins, internalLinks) {
  const affiliateLinks = asins.map(a =>
    `<a href="https://www.amazon.com/dp/${a.asin}?tag=${AMAZON_TAG}" rel="nofollow sponsored" target="_blank">${a.name}</a> (paid link)`
  ).join(', ');

  const internalLinkHtml = internalLinks.length > 0
    ? internalLinks.map(l => `<a href="/articles/${l.slug}">${l.title}</a>`).join(', ')
    : '';

  const today = new Date().toISOString().split('T')[0];

  return `You are an expert child development writer for OrchidKids.com — the leading research-backed resource for parents of highly sensitive children (HSC). Write a complete, publication-ready HTML article.

TITLE: ${title}
CATEGORY: ${category}
TAGS: ${tags.join(', ')}

HARD RULES — follow every one or the article is rejected:
1. Write EXACTLY 1,800–2,200 words of article body (not counting HTML tags)
2. Use contractions naturally (don't, can't, it's, you'll, they're)
3. Use "you" and "your child" throughout — direct address
4. Use "we" and "in our experience" at least twice (first-person site voice)
5. NO em dashes (—) or en dashes (–) — use commas or rewrite
6. NO banned AI phrases: "delve into", "tapestry", "nuanced", "it's worth noting", "in conclusion", "to summarize", "in summary", "game-changer", "transformative", "groundbreaking", "paradigm", "holistic", "synergy", "leverage", "robust", "comprehensive", "crucial", "vital", "essential", "significant", "moreover", "furthermore", "in today's world", "it is important to note", "as an AI"
7. Include EXACTLY 3 Amazon affiliate links using these products: ${affiliateLinks}
8. Include at least 3 internal links to other OrchidKids articles${internalLinkHtml ? ': ' + internalLinkHtml : ' (create plausible slugs like /articles/topic-name)'}
9. Include at least 1 outbound authority link (PubMed, AAP, NCBI, APA, or similar)
10. Start with a TL;DR section wrapped in: <section data-tldr="ai-overview" aria-label="In short">
11. End with an author byline: <aside class="author-byline" data-eeat="author">
12. Include a <time datetime="${today}">${today}</time> last-updated reference
13. Write from a warm, direct, shame-free parenting perspective — no toxic positivity, no catastrophizing
14. Vary sentence length — mix short punchy sentences with longer explanatory ones
15. Use <h2> and <h3> subheadings throughout
16. IMPORTANT: Write a FULL, COMPLETE article. Do not truncate. Include all sections, all subheadings, the full body, and the complete author byline. Aim for 1,800 words minimum.

OUTPUT FORMAT: Return ONLY the HTML article body starting with <section data-tldr="ai-overview"> and ending with </aside>. No markdown, no code fences, no preamble. Write the COMPLETE article — do not stop early.`;
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert child development writer. Output only clean HTML article body content.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

function countWords(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
}

function passesGate(body) {
  const words = countWords(body);
  if (words < 1300) return { ok: false, reason: `too short: ${words} words` };
  if (!body.includes('data-tldr="ai-overview"')) return { ok: false, reason: 'missing TL;DR section' };
  if (!body.includes('author-byline')) return { ok: false, reason: 'missing author byline' };
  if (!body.includes('amazon.com')) return { ok: false, reason: 'missing Amazon links' };
  const banned = ['delve into', 'tapestry', 'it\'s worth noting', 'in conclusion', 'game-changer', 'transformative', 'groundbreaking', 'paradigm', 'synergy', 'as an AI'];
  for (const b of banned) {
    if (body.toLowerCase().includes(b)) return { ok: false, reason: `banned phrase: "${b}"` };
  }
  return { ok: true };
}

let _store = null;
let _lock = false;

function loadStore() {
  if (_store) return _store;
  if (existsSync(STORE_PATH)) {
    const raw = readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Handle both array and object format
    _store = Array.isArray(parsed) ? { articles: parsed } : parsed;
    if (!_store.articles) _store.articles = [];
  } else {
    _store = { articles: [] };
  }
  return _store;
}

async function saveStore() {
  while (_lock) await new Promise(r => setTimeout(r, 50));
  _lock = true;
  try {
    writeFileSync(STORE_PATH, JSON.stringify(_store.articles, null, 2));
  } finally {
    _lock = false;
  }
}

// ─── 500 Topics ───────────────────────────────────────────────────────────────
const ALL_TOPICS = [
  // Understanding HSC (60)
  { title: "What Is a Highly Sensitive Child? The Complete Parent Guide", category: "understanding-hsc", tags: ["hsc", "definition", "basics"] },
  { title: "The Orchid and Dandelion Hypothesis: Why Some Children Thrive With the Right Support", category: "understanding-hsc", tags: ["orchid hypothesis", "research", "genetics"] },
  { title: "15 Signs Your Child Might Be Highly Sensitive", category: "understanding-hsc", tags: ["signs", "checklist", "identification"] },
  { title: "HSC vs. Sensory Processing Disorder: What's the Difference?", category: "understanding-hsc", tags: ["spd", "diagnosis", "comparison"] },
  { title: "Is High Sensitivity a Disorder? What the Research Actually Says", category: "understanding-hsc", tags: ["research", "disorder", "myth-busting"] },
  { title: "The Four Core Traits of Highly Sensitive Children (DOES Framework)", category: "understanding-hsc", tags: ["does", "traits", "elaine aron"] },
  { title: "Why Highly Sensitive Children Feel Everything More Deeply", category: "understanding-hsc", tags: ["emotions", "depth of processing", "neuroscience"] },
  { title: "How Many Children Are Highly Sensitive? The Statistics Explained", category: "understanding-hsc", tags: ["statistics", "prevalence", "research"] },
  { title: "Highly Sensitive Boys: Breaking the Stigma", category: "understanding-hsc", tags: ["boys", "gender", "stigma"] },
  { title: "Highly Sensitive Girls: Unique Challenges and Strengths", category: "understanding-hsc", tags: ["girls", "gender", "strengths"] },
  { title: "The Difference Between Introversion and High Sensitivity", category: "understanding-hsc", tags: ["introversion", "comparison", "personality"] },
  { title: "HSC and Giftedness: The Overlap You Need to Know About", category: "understanding-hsc", tags: ["gifted", "2e", "overlap"] },
  { title: "Why Highly Sensitive Children Are Often Misdiagnosed", category: "understanding-hsc", tags: ["misdiagnosis", "adhd", "anxiety"] },
  { title: "The Strengths of Highly Sensitive Children That Schools Miss", category: "understanding-hsc", tags: ["strengths", "school", "gifts"] },
  { title: "How High Sensitivity Is Inherited: The Genetics of HSC", category: "understanding-hsc", tags: ["genetics", "hereditary", "family"] },
  { title: "Highly Sensitive Children and Empathy: The Science Behind Feeling Others' Pain", category: "understanding-hsc", tags: ["empathy", "mirror neurons", "science"] },
  { title: "What Triggers Overwhelm in Highly Sensitive Children", category: "understanding-hsc", tags: ["triggers", "overwhelm", "management"] },
  { title: "The Nervous System of a Highly Sensitive Child: A Plain-English Explanation", category: "understanding-hsc", tags: ["nervous system", "neuroscience", "explanation"] },
  { title: "HSC and the Stress Response: Why They React So Strongly", category: "understanding-hsc", tags: ["stress response", "cortisol", "fight or flight"] },
  { title: "Positive Aspects of Raising a Highly Sensitive Child", category: "understanding-hsc", tags: ["positives", "gifts", "perspective"] },
  { title: "How to Explain High Sensitivity to Your Child", category: "understanding-hsc", tags: ["explaining", "child conversation", "self-awareness"] },
  { title: "The History of High Sensitivity Research: From Aron to Today", category: "understanding-hsc", tags: ["history", "elaine aron", "research timeline"] },
  { title: "HSC and the Highly Sensitive Person (HSP): How They're Related", category: "understanding-hsc", tags: ["hsp", "adults", "connection"] },
  { title: "Cultural Differences in How High Sensitivity Is Perceived", category: "understanding-hsc", tags: ["culture", "global", "perception"] },
  { title: "Why Highly Sensitive Children Often Have Intense Reactions to Change", category: "understanding-hsc", tags: ["change", "transitions", "reactions"] },
  { title: "How Highly Sensitive Children Experience Joy Differently", category: "understanding-hsc", tags: ["joy", "experience", "depth"] },
  { title: "The Highly Sensitive Child and Humor: Why They Often Have a Unique Sense of Funny", category: "understanding-hsc", tags: ["humor", "unique", "personality"] },
  { title: "The Highly Sensitive Child and Intuition: Trusting Their Inner Knowing", category: "understanding-hsc", tags: ["intuition", "inner knowing", "trust"] },
  { title: "The Highly Sensitive Child and Imagination: When Fantasy Feels Real", category: "understanding-hsc", tags: ["imagination", "fantasy", "reality"] },
  { title: "The Highly Sensitive Toddler: Early Signs and Early Support", category: "understanding-hsc", tags: ["toddler", "early signs", "support"] },
  { title: "The Highly Sensitive Teenager: New Challenges and New Strengths", category: "understanding-hsc", tags: ["teenager", "challenges", "strengths"] },
  { title: "The Highly Sensitive Child and Eye Contact: Why It Can Be Overwhelming", category: "understanding-hsc", tags: ["eye contact", "overwhelm", "social"] },
  { title: "The Highly Sensitive Child and Waiting: Why Anticipation Is So Hard", category: "understanding-hsc", tags: ["waiting", "anticipation", "difficulty"] },
  { title: "HSC and ADHD: Understanding the Overlap", category: "understanding-hsc", tags: ["adhd", "overlap", "diagnosis"] },
  { title: "HSC and Autism: Key Similarities and Differences", category: "understanding-hsc", tags: ["autism", "asd", "comparison"] },
  { title: "The Highly Sensitive Child and Perfectionism: Why They're Wired This Way", category: "understanding-hsc", tags: ["perfectionism", "wiring", "understanding"] },
  { title: "What It Feels Like to Be a Highly Sensitive Child: A Parent's Guide to Empathy", category: "understanding-hsc", tags: ["empathy", "perspective", "understanding"] },
  { title: "HSC and the Orchid Hypothesis: Thomas Boyce's Groundbreaking Research", category: "understanding-hsc", tags: ["thomas boyce", "research", "orchid"] },
  { title: "The Highly Sensitive Child at Different Ages: What to Expect", category: "understanding-hsc", tags: ["development", "ages", "stages"] },
  { title: "Why Highly Sensitive Children Need More Recovery Time", category: "understanding-hsc", tags: ["recovery", "downtime", "overstimulation"] },
  { title: "The Highly Sensitive Child and Moral Sensitivity: When They Care Too Much", category: "understanding-hsc", tags: ["moral", "caring", "sensitivity"] },
  { title: "How to Tell If Your Child Is Highly Sensitive or Just Going Through a Phase", category: "understanding-hsc", tags: ["phase", "temporary", "identification"] },
  { title: "The Highly Sensitive Child and Beauty: Why They're Moved by Art and Nature", category: "understanding-hsc", tags: ["beauty", "art", "nature"] },
  { title: "HSC and the Gifted Child: Twice Exceptional Parenting", category: "understanding-hsc", tags: ["twice exceptional", "2e", "gifted"] },
  { title: "The Highly Sensitive Child and Deep Thinking: When They Ask the Big Questions", category: "understanding-hsc", tags: ["deep thinking", "questions", "philosophy"] },
  { title: "Why Highly Sensitive Children Often Feel Overwhelmed by Crowds", category: "understanding-hsc", tags: ["crowds", "overwhelm", "social"] },
  { title: "The Highly Sensitive Child and Fairness: Why Injustice Hits Them Hard", category: "understanding-hsc", tags: ["fairness", "justice", "moral"] },
  { title: "HSC and Sensory Seeking: When Sensitivity Looks Like the Opposite", category: "understanding-hsc", tags: ["sensory seeking", "paradox", "behavior"] },
  { title: "The Highly Sensitive Child and Transition Anxiety: Why Change Is So Hard", category: "understanding-hsc", tags: ["transition", "anxiety", "change"] },
  { title: "Understanding Your Highly Sensitive Child's Emotional Intensity", category: "understanding-hsc", tags: ["emotional intensity", "understanding", "parent"] },
  { title: "The Highly Sensitive Child and Nighttime Fears: What's Really Going On", category: "understanding-hsc", tags: ["nighttime", "fears", "sleep"] },
  { title: "Why Highly Sensitive Children Often Struggle With New Situations", category: "understanding-hsc", tags: ["new situations", "anxiety", "adjustment"] },
  { title: "The Highly Sensitive Child and Physical Sensitivity: Beyond Emotions", category: "understanding-hsc", tags: ["physical", "sensory", "body"] },
  { title: "HSC and the Highly Sensitive Parent: When You Both Feel Everything", category: "understanding-hsc", tags: ["hsp parent", "double", "family"] },
  { title: "The Highly Sensitive Child and Separation Anxiety: A Deeper Look", category: "understanding-hsc", tags: ["separation", "anxiety", "attachment"] },
  { title: "What Neuroscience Tells Us About the Highly Sensitive Child's Brain", category: "understanding-hsc", tags: ["neuroscience", "brain", "research"] },
  { title: "The Highly Sensitive Child and Creativity: How Sensitivity Fuels Imagination", category: "understanding-hsc", tags: ["creativity", "imagination", "gift"] },
  { title: "How to Build a Strength-Based Narrative Around Your Child's Sensitivity", category: "understanding-hsc", tags: ["strengths", "narrative", "framing"] },
  { title: "The Highly Sensitive Child and Spirituality: A Deep Inner Life", category: "understanding-hsc", tags: ["spirituality", "inner life", "meaning"] },
  { title: "HSC and Anxiety Disorders: When Sensitivity Becomes Clinical", category: "understanding-hsc", tags: ["anxiety disorder", "clinical", "threshold"] },
  { title: "The Highly Sensitive Child and Their Relationship With Animals", category: "understanding-hsc", tags: ["animals", "pets", "connection"] },

  // Neuroscience (40)
  { title: "The Role of Cortisol in Highly Sensitive Children's Stress Responses", category: "neuroscience", tags: ["cortisol", "stress", "biology"] },
  { title: "Mirror Neurons and Empathy in Highly Sensitive Children", category: "neuroscience", tags: ["mirror neurons", "empathy", "brain"] },
  { title: "The Amygdala's Role in HSC Emotional Reactivity", category: "neuroscience", tags: ["amygdala", "emotional reactivity", "brain"] },
  { title: "How the Vagus Nerve Affects Highly Sensitive Children", category: "neuroscience", tags: ["vagus nerve", "nervous system", "regulation"] },
  { title: "Neuroplasticity and the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["neuroplasticity", "brain development", "growth"] },
  { title: "The Differential Susceptibility Hypothesis: Why HSC Respond More to Everything", category: "neuroscience", tags: ["differential susceptibility", "research", "theory"] },
  { title: "Sensory Processing and the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["sensory processing", "brain", "science"] },
  { title: "The HPA Axis and Stress in Highly Sensitive Children", category: "neuroscience", tags: ["hpa axis", "stress", "biology"] },
  { title: "How Sleep Affects the Highly Sensitive Child's Nervous System", category: "neuroscience", tags: ["sleep", "nervous system", "impact"] },
  { title: "The Gut-Brain Connection in Highly Sensitive Children", category: "neuroscience", tags: ["gut-brain", "microbiome", "connection"] },
  { title: "Interoception and the Highly Sensitive Child: Feeling From the Inside Out", category: "neuroscience", tags: ["interoception", "body awareness", "science"] },
  { title: "How Exercise Regulates the Highly Sensitive Child's Nervous System", category: "neuroscience", tags: ["exercise", "regulation", "movement"] },
  { title: "The Science of Emotional Contagion in Highly Sensitive Children", category: "neuroscience", tags: ["emotional contagion", "science", "empathy"] },
  { title: "Polyvagal Theory and the Highly Sensitive Child", category: "neuroscience", tags: ["polyvagal", "theory", "nervous system"] },
  { title: "How Trauma Affects the Highly Sensitive Child's Nervous System Differently", category: "neuroscience", tags: ["trauma", "nervous system", "impact"] },
  { title: "The Serotonin Connection: Why HSC May Have Different Neurotransmitter Profiles", category: "neuroscience", tags: ["serotonin", "neurotransmitter", "biology"] },
  { title: "Dopamine and the Highly Sensitive Child: Reward Processing Differences", category: "neuroscience", tags: ["dopamine", "reward", "brain"] },
  { title: "The Prefrontal Cortex and Emotional Regulation in HSC", category: "neuroscience", tags: ["prefrontal cortex", "regulation", "development"] },
  { title: "How the Highly Sensitive Child's Brain Processes Sensory Information Differently", category: "neuroscience", tags: ["sensory processing", "brain", "difference"] },
  { title: "The Insula and Body Awareness in Highly Sensitive Children", category: "neuroscience", tags: ["insula", "body awareness", "neuroscience"] },
  { title: "Epigenetics and High Sensitivity: How Environment Shapes the HSC Brain", category: "neuroscience", tags: ["epigenetics", "environment", "brain"] },
  { title: "The Default Mode Network in Highly Sensitive Children: Why They Overthink", category: "neuroscience", tags: ["default mode network", "overthinking", "brain"] },
  { title: "How Attachment Security Affects the Highly Sensitive Child's Brain Development", category: "neuroscience", tags: ["attachment", "brain development", "security"] },
  { title: "The Science of Sensory Gating in Highly Sensitive Children", category: "neuroscience", tags: ["sensory gating", "filtering", "science"] },
  { title: "Cortisol Awakening Response in Highly Sensitive Children: Morning Challenges Explained", category: "neuroscience", tags: ["cortisol", "morning", "awakening"] },
  { title: "How the Highly Sensitive Child's Brain Responds to Criticism", category: "neuroscience", tags: ["criticism", "brain response", "sensitivity"] },
  { title: "The Neuroscience of Meltdowns in Highly Sensitive Children", category: "neuroscience", tags: ["meltdowns", "neuroscience", "brain"] },
  { title: "Allostatic Load: Why Chronic Stress Hits HSC Harder", category: "neuroscience", tags: ["allostatic load", "chronic stress", "impact"] },
  { title: "The Role of Oxytocin in Highly Sensitive Children's Social Bonding", category: "neuroscience", tags: ["oxytocin", "bonding", "social"] },
  { title: "How Music Affects the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["music", "brain", "effect"] },
  { title: "The Neuroscience of Empathy Overload in Highly Sensitive Children", category: "neuroscience", tags: ["empathy overload", "neuroscience", "overwhelm"] },
  { title: "How Nature Exposure Changes the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["nature", "brain", "neurological"] },
  { title: "The Science Behind Why HSC Need More Sleep", category: "neuroscience", tags: ["sleep", "science", "need"] },
  { title: "Inflammatory Markers and Sensitivity: What the Research Shows", category: "neuroscience", tags: ["inflammation", "research", "biology"] },
  { title: "The Highly Sensitive Child's Brain Under Stress: A Visual Guide for Parents", category: "neuroscience", tags: ["stress", "brain", "visual"] },
  { title: "How Mindfulness Changes the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["mindfulness", "brain change", "neuroplasticity"] },
  { title: "The Neuroscience of Emotional Memory in Highly Sensitive Children", category: "neuroscience", tags: ["emotional memory", "neuroscience", "storage"] },
  { title: "GABA and Anxiety in Highly Sensitive Children: The Inhibitory Neurotransmitter", category: "neuroscience", tags: ["gaba", "anxiety", "neurotransmitter"] },
  { title: "How the Highly Sensitive Child's Brain Processes Social Rejection", category: "neuroscience", tags: ["social rejection", "brain", "processing"] },
  { title: "The Neuroscience of Overstimulation: What Happens in the HSC Brain", category: "neuroscience", tags: ["overstimulation", "neuroscience", "brain"] },

  // Parenting Strategies (80)
  { title: "The 5 Parenting Mistakes That Overwhelm Highly Sensitive Children", category: "parenting-strategies", tags: ["mistakes", "parenting", "overwhelm"] },
  { title: "How to Respond When Your Highly Sensitive Child Has a Meltdown", category: "parenting-strategies", tags: ["meltdown", "response", "co-regulation"] },
  { title: "Building a Predictable Routine for Your Highly Sensitive Child", category: "parenting-strategies", tags: ["routine", "predictability", "structure"] },
  { title: "How to Set Boundaries With a Highly Sensitive Child Without Shame", category: "parenting-strategies", tags: ["boundaries", "shame-free", "limits"] },
  { title: "The Art of Co-Regulation: Calming Your Child by Calming Yourself", category: "parenting-strategies", tags: ["co-regulation", "calm", "nervous system"] },
  { title: "Positive Discipline Strategies for Highly Sensitive Children", category: "parenting-strategies", tags: ["discipline", "positive", "strategies"] },
  { title: "How to Validate Your Highly Sensitive Child's Feelings Without Enabling", category: "parenting-strategies", tags: ["validation", "enabling", "balance"] },
  { title: "Transition Strategies: Helping Your HSC Move Between Activities", category: "parenting-strategies", tags: ["transitions", "strategies", "daily life"] },
  { title: "How to Handle Your HSC's Intense Reactions to 'Small' Things", category: "parenting-strategies", tags: ["intense reactions", "proportionality", "understanding"] },
  { title: "The Power of Naming Emotions: A Practical Guide for HSC Parents", category: "parenting-strategies", tags: ["naming emotions", "emotional literacy", "practical"] },
  { title: "How to Prepare Your Highly Sensitive Child for New Situations", category: "parenting-strategies", tags: ["preparation", "new situations", "anxiety"] },
  { title: "Parenting a Highly Sensitive Child When You're Not Sensitive Yourself", category: "parenting-strategies", tags: ["non-hsp parent", "understanding", "bridge"] },
  { title: "When Both Parent and Child Are Highly Sensitive: Navigating the Intensity", category: "parenting-strategies", tags: ["hsp parent", "double sensitivity", "intensity"] },
  { title: "How to Talk to Your HSC About Their Sensitivity Without Making It a Problem", category: "parenting-strategies", tags: ["conversation", "framing", "positive"] },
  { title: "Screen Time and the Highly Sensitive Child: What the Research Shows", category: "parenting-strategies", tags: ["screen time", "research", "limits"] },
  { title: "How to Choose the Right Extracurricular Activities for Your HSC", category: "parenting-strategies", tags: ["activities", "extracurricular", "fit"] },
  { title: "Helping Your Highly Sensitive Child Build Resilience Without Toughening Them Up", category: "parenting-strategies", tags: ["resilience", "toughening up", "balance"] },
  { title: "The Difference Between Accommodating and Enabling Your HSC", category: "parenting-strategies", tags: ["accommodating", "enabling", "distinction"] },
  { title: "How to Handle Sibling Dynamics When One Child Is Highly Sensitive", category: "parenting-strategies", tags: ["siblings", "dynamics", "fairness"] },
  { title: "Parenting the Highly Sensitive Child Through Big Life Changes", category: "parenting-strategies", tags: ["life changes", "divorce", "moving"] },
  { title: "How to Handle Your HSC's Intense Reaction to Violence in Media", category: "parenting-strategies", tags: ["media", "violence", "reaction"] },
  { title: "Birthday Parties and the Highly Sensitive Child: Planning for Success", category: "parenting-strategies", tags: ["birthday", "parties", "planning"] },
  { title: "How to Help Your HSC Develop a Growth Mindset", category: "parenting-strategies", tags: ["growth mindset", "development", "resilience"] },
  { title: "How to Handle Your HSC's Intense Reaction to Goodbyes", category: "parenting-strategies", tags: ["goodbyes", "separation", "reaction"] },
  { title: "How to Handle Your HSC's Intense Reaction to Scary Movies", category: "parenting-strategies", tags: ["scary movies", "media", "reaction"] },
  { title: "How to Help Your HSC Through a Medical Procedure", category: "parenting-strategies", tags: ["medical", "procedure", "preparation"] },
  { title: "How to Handle Your HSC's Reaction to Criticism From Peers", category: "parenting-strategies", tags: ["peer criticism", "reaction", "support"] },
  { title: "How to Help Your HSC When They Feel Like They Don't Fit In", category: "parenting-strategies", tags: ["belonging", "fitting in", "support"] },
  { title: "How to Handle Your HSC's Reaction to a New Baby Sibling", category: "parenting-strategies", tags: ["new baby", "sibling", "adjustment"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Choices", category: "parenting-strategies", tags: ["choices", "overwhelm", "decision"] },
  { title: "The Language of Sensitivity: Words That Help vs. Words That Hurt", category: "parenting-strategies", tags: ["language", "words", "communication"] },
  { title: "How to Debrief With Your HSC After a Hard Day", category: "parenting-strategies", tags: ["debrief", "communication", "evening"] },
  { title: "Morning Routines That Work for Highly Sensitive Children", category: "parenting-strategies", tags: ["morning", "routine", "strategies"] },
  { title: "How to Handle Public Meltdowns With a Highly Sensitive Child", category: "parenting-strategies", tags: ["public", "meltdown", "strategies"] },
  { title: "The Importance of Downtime for Highly Sensitive Children", category: "parenting-strategies", tags: ["downtime", "recovery", "importance"] },
  { title: "How to Use Natural Consequences With a Highly Sensitive Child", category: "parenting-strategies", tags: ["natural consequences", "discipline", "gentle"] },
  { title: "Parenting Scripts: What to Say When Your HSC Is Overwhelmed", category: "parenting-strategies", tags: ["scripts", "what to say", "practical"] },
  { title: "How to Help Your HSC When They're Overwhelmed by World Events", category: "parenting-strategies", tags: ["world events", "news", "overwhelm"] },
  { title: "The Highly Sensitive Child and Chores: Making It Work", category: "parenting-strategies", tags: ["chores", "responsibilities", "strategies"] },
  { title: "How to Celebrate Your Highly Sensitive Child's Wins Without Overstimulating Them", category: "parenting-strategies", tags: ["celebration", "wins", "balance"] },
  { title: "Parenting the Highly Sensitive Child During Illness", category: "parenting-strategies", tags: ["illness", "sick", "extra care"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Homework", category: "parenting-strategies", tags: ["homework", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and Bedtime Resistance: Gentle Solutions", category: "parenting-strategies", tags: ["bedtime", "resistance", "gentle"] },
  { title: "How to Handle Your HSC's Fear of Getting in Trouble", category: "parenting-strategies", tags: ["fear", "trouble", "perfectionism"] },
  { title: "Parenting Highly Sensitive Children in a Loud, Fast World", category: "parenting-strategies", tags: ["modern world", "overstimulation", "navigation"] },
  { title: "How to Use Storytelling to Help Your HSC Process Emotions", category: "parenting-strategies", tags: ["storytelling", "emotions", "processing"] },
  { title: "The Highly Sensitive Child and Apologies: Teaching Accountability Without Shame", category: "parenting-strategies", tags: ["apologies", "accountability", "shame-free"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Sensory Input at Restaurants", category: "parenting-strategies", tags: ["restaurants", "sensory", "strategies"] },
  { title: "The Highly Sensitive Child and Playdates: Setting Up for Success", category: "parenting-strategies", tags: ["playdates", "social", "preparation"] },
  { title: "How to Talk to Other Adults About Your Child's Sensitivity", category: "parenting-strategies", tags: ["other adults", "explanation", "advocacy"] },
  { title: "Parenting the Highly Sensitive Child: A Year-by-Year Guide", category: "parenting-strategies", tags: ["year by year", "guide", "development"] },
  { title: "How to Help Your HSC When They're Overwhelmed by a Busy Schedule", category: "parenting-strategies", tags: ["busy schedule", "overwhelm", "simplify"] },
  { title: "The Highly Sensitive Child and Anger: When Big Feelings Explode", category: "parenting-strategies", tags: ["anger", "big feelings", "management"] },
  { title: "How to Use Humor to Defuse Tension With Your Highly Sensitive Child", category: "parenting-strategies", tags: ["humor", "defuse", "connection"] },
  { title: "The Highly Sensitive Child and Disappointment: Helping Them Through It", category: "parenting-strategies", tags: ["disappointment", "coping", "support"] },
  { title: "How to Build a Sensory Diet for Your Highly Sensitive Child", category: "parenting-strategies", tags: ["sensory diet", "building", "practical"] },
  { title: "Parenting the Highly Sensitive Child When You're Exhausted", category: "parenting-strategies", tags: ["exhausted", "parent", "self-care"] },
  { title: "How to Use Countdown Timers and Visual Schedules With Your HSC", category: "parenting-strategies", tags: ["timers", "visual schedules", "tools"] },
  { title: "The Highly Sensitive Child and Gratitude: Cultivating Appreciation", category: "parenting-strategies", tags: ["gratitude", "appreciation", "positive"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Expectations", category: "parenting-strategies", tags: ["social expectations", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Lying: Why They Do It and What to Do", category: "parenting-strategies", tags: ["lying", "behavior", "response"] },
  { title: "How to Prepare Your HSC for a New School Year", category: "parenting-strategies", tags: ["new school year", "preparation", "anxiety"] },

  // Sensory & Environment (60)
  { title: "Creating a Sensory-Friendly Home for Your Highly Sensitive Child", category: "sensory-environment", tags: ["sensory-friendly", "home", "environment"] },
  { title: "The Best Clothing Choices for Sensory-Sensitive Children", category: "sensory-environment", tags: ["clothing", "sensory", "comfort"] },
  { title: "How Lighting Affects Highly Sensitive Children (And What to Do About It)", category: "sensory-environment", tags: ["lighting", "sensory", "environment"] },
  { title: "Sound Sensitivity in Highly Sensitive Children: Causes and Solutions", category: "sensory-environment", tags: ["sound", "noise", "sensitivity"] },
  { title: "Food Sensitivities and the Highly Sensitive Child: What's the Connection?", category: "sensory-environment", tags: ["food", "sensitivities", "nutrition"] },
  { title: "How to Create a Calm-Down Corner That Actually Works", category: "sensory-environment", tags: ["calm-down corner", "regulation", "space"] },
  { title: "Weighted Blankets for Highly Sensitive Children: Do They Work?", category: "sensory-environment", tags: ["weighted blanket", "research", "effectiveness"] },
  { title: "The Best Sensory Tools for Highly Sensitive Children in 2025", category: "sensory-environment", tags: ["sensory tools", "products", "recommendations"] },
  { title: "How to Make Car Trips Less Overwhelming for Your HSC", category: "sensory-environment", tags: ["car trips", "travel", "strategies"] },
  { title: "Grocery Store Overwhelm: Strategies for Sensitive Children", category: "sensory-environment", tags: ["grocery store", "overwhelm", "strategies"] },
  { title: "Creating a Sensory-Friendly Bedroom for Your HSC", category: "sensory-environment", tags: ["bedroom", "sensory", "sleep"] },
  { title: "How Temperature Sensitivity Affects Highly Sensitive Children", category: "sensory-environment", tags: ["temperature", "sensitivity", "comfort"] },
  { title: "Smell Sensitivity in HSC: Understanding Olfactory Overwhelm", category: "sensory-environment", tags: ["smell", "olfactory", "sensitivity"] },
  { title: "Texture Sensitivity: Why Your HSC Won't Wear Certain Clothes", category: "sensory-environment", tags: ["texture", "clothing", "tactile"] },
  { title: "Nature as a Sensory Regulator for Highly Sensitive Children", category: "sensory-environment", tags: ["nature", "outdoor", "regulation"] },
  { title: "Why Highly Sensitive Children Have More Sleep Problems", category: "sensory-environment", tags: ["sleep", "problems", "causes"] },
  { title: "Bedtime Routines That Work for Highly Sensitive Children", category: "sensory-environment", tags: ["bedtime", "routine", "sleep"] },
  { title: "Night Terrors vs. Nightmares in Highly Sensitive Children", category: "sensory-environment", tags: ["night terrors", "nightmares", "difference"] },
  { title: "How to Handle Your HSC's Fear of the Dark", category: "sensory-environment", tags: ["fear of dark", "bedtime", "strategies"] },
  { title: "Co-Sleeping With a Highly Sensitive Child: Pros, Cons, and Transitions", category: "sensory-environment", tags: ["co-sleeping", "pros cons", "transition"] },
  { title: "Melatonin for Highly Sensitive Children: Is It Safe?", category: "sensory-environment", tags: ["melatonin", "safety", "sleep"] },
  { title: "How to Create a Sleep-Friendly Environment for Your HSC", category: "sensory-environment", tags: ["sleep environment", "setup", "practical"] },
  { title: "The Connection Between Daytime Overwhelm and Nighttime Sleep Problems", category: "sensory-environment", tags: ["daytime", "nighttime", "connection"] },
  { title: "How to Handle Your HSC's Intense Reaction to Loud Noises", category: "sensory-environment", tags: ["loud noises", "reaction", "strategies"] },
  { title: "The Highly Sensitive Child and Dental Anxiety: Practical Solutions", category: "sensory-environment", tags: ["dental", "anxiety", "practical"] },
  { title: "The Highly Sensitive Child and Haircuts: Making It Less Traumatic", category: "sensory-environment", tags: ["haircuts", "sensory", "strategies"] },
  { title: "The Highly Sensitive Child and Cooking: Using the Kitchen as a Sensory Tool", category: "sensory-environment", tags: ["cooking", "sensory", "activity"] },
  { title: "The Highly Sensitive Child and Nature: A Deep Connection", category: "sensory-environment", tags: ["nature", "connection", "healing"] },
  { title: "Sensory-Friendly Holiday Decorating: Keeping the Magic Without the Overwhelm", category: "sensory-environment", tags: ["holidays", "decorating", "sensory"] },
  { title: "The Highly Sensitive Child and Water: Why Baths and Swimming Can Be Challenging", category: "sensory-environment", tags: ["water", "bath", "swimming"] },
  { title: "How to Make Doctor's Office Visits Less Overwhelming for Your HSC", category: "sensory-environment", tags: ["doctor", "medical", "sensory"] },
  { title: "The Highly Sensitive Child and Crowds: Practical Navigation Strategies", category: "sensory-environment", tags: ["crowds", "navigation", "strategies"] },
  { title: "Sensory Processing and Picky Eating in Highly Sensitive Children", category: "sensory-environment", tags: ["picky eating", "food", "sensory"] },
  { title: "How to Use White Noise and Sound Machines With Your HSC", category: "sensory-environment", tags: ["white noise", "sound machine", "sleep"] },
  { title: "The Highly Sensitive Child and Clothing Tags: Simple Fixes That Help", category: "sensory-environment", tags: ["clothing tags", "sensory", "comfort"] },
  { title: "Creating a Sensory-Friendly Classroom: A Guide for Teachers", category: "sensory-environment", tags: ["classroom", "teacher", "sensory-friendly"] },
  { title: "The Highly Sensitive Child and Screen Glare: Protecting Their Eyes and Brain", category: "sensory-environment", tags: ["screen glare", "eyes", "protection"] },
  { title: "How to Set Up a Sensory Corner in a Small Space", category: "sensory-environment", tags: ["sensory corner", "small space", "setup"] },
  { title: "The Highly Sensitive Child and Perfumes and Chemicals: Managing Olfactory Sensitivity", category: "sensory-environment", tags: ["perfumes", "chemicals", "olfactory"] },
  { title: "How to Help Your HSC at Amusement Parks and Fairs", category: "sensory-environment", tags: ["amusement parks", "fairs", "strategies"] },
  { title: "The Highly Sensitive Child and Fluorescent Lighting: What to Do at School", category: "sensory-environment", tags: ["fluorescent", "school", "lighting"] },
  { title: "Sensory-Friendly Birthday Party Ideas for Highly Sensitive Children", category: "sensory-environment", tags: ["birthday party", "sensory-friendly", "ideas"] },
  { title: "How to Use Essential Oils Safely With Highly Sensitive Children", category: "sensory-environment", tags: ["essential oils", "safety", "sensory"] },
  { title: "The Highly Sensitive Child and Public Restrooms: Overcoming the Overwhelm", category: "sensory-environment", tags: ["public restrooms", "overwhelm", "strategies"] },
  { title: "How to Choose Sensory-Friendly Toys for Highly Sensitive Children", category: "sensory-environment", tags: ["toys", "sensory-friendly", "choosing"] },
  { title: "The Highly Sensitive Child and Tight Spaces: Managing Claustrophobia", category: "sensory-environment", tags: ["tight spaces", "claustrophobia", "management"] },
  { title: "How to Create a Morning Sensory Routine That Sets Your HSC Up for Success", category: "sensory-environment", tags: ["morning", "sensory routine", "success"] },
  { title: "The Highly Sensitive Child and Transitions Between Environments", category: "sensory-environment", tags: ["environment transitions", "adjustment", "strategies"] },
  { title: "Sensory Integration Therapy: What It Is and Whether It Helps HSC", category: "sensory-environment", tags: ["sensory integration", "therapy", "effectiveness"] },
  { title: "How to Make Grocery Shopping Less Stressful for Your Highly Sensitive Child", category: "sensory-environment", tags: ["grocery", "shopping", "strategies"] },
  { title: "The Highly Sensitive Child and Uniforms: When School Dress Codes Are Painful", category: "sensory-environment", tags: ["uniforms", "school", "sensory"] },
  { title: "How to Help Your HSC at Loud Family Gatherings", category: "sensory-environment", tags: ["family gatherings", "noise", "strategies"] },
  { title: "The Highly Sensitive Child and Fireworks: Managing Sensory Overload on Holidays", category: "sensory-environment", tags: ["fireworks", "holidays", "sensory"] },
  { title: "Creating a Sensory-Friendly Car Environment for Long Trips", category: "sensory-environment", tags: ["car", "long trips", "sensory-friendly"] },
  { title: "The Highly Sensitive Child and Open-Plan Classrooms: Challenges and Solutions", category: "sensory-environment", tags: ["open-plan", "classroom", "solutions"] },
  { title: "How to Use Compression Clothing With Highly Sensitive Children", category: "sensory-environment", tags: ["compression", "clothing", "sensory"] },
  { title: "The Highly Sensitive Child and Airplane Travel: Preparation and Strategies", category: "sensory-environment", tags: ["airplane", "travel", "preparation"] },
  { title: "How to Create a Sensory-Friendly Workspace for Your HSC's Homework", category: "sensory-environment", tags: ["workspace", "homework", "sensory-friendly"] },
  { title: "The Highly Sensitive Child and Seasonal Changes: Managing Sensory Shifts", category: "sensory-environment", tags: ["seasonal", "changes", "sensory"] },
  { title: "Sensory-Friendly Holiday Travel: Keeping Your HSC Regulated on the Road", category: "sensory-environment", tags: ["holiday travel", "road trip", "sensory"] },

  // Emotional Wellbeing (70)
  { title: "Anxiety in Highly Sensitive Children: What's Normal and What's Not", category: "emotional-wellbeing", tags: ["anxiety", "normal", "threshold"] },
  { title: "How to Help Your HSC Process Big Emotions Without Shutting Down", category: "emotional-wellbeing", tags: ["big emotions", "processing", "shutdown"] },
  { title: "Perfectionism in Highly Sensitive Children: Causes and Solutions", category: "emotional-wellbeing", tags: ["perfectionism", "causes", "solutions"] },
  { title: "Why Highly Sensitive Children Often Fear Failure More Than Others", category: "emotional-wellbeing", tags: ["fear of failure", "perfectionism", "self-esteem"] },
  { title: "Building Self-Esteem in Your Highly Sensitive Child", category: "emotional-wellbeing", tags: ["self-esteem", "confidence", "building"] },
  { title: "How to Help Your HSC Manage Worry and Catastrophic Thinking", category: "emotional-wellbeing", tags: ["worry", "catastrophizing", "cognitive"] },
  { title: "The Link Between High Sensitivity and Depression in Children", category: "emotional-wellbeing", tags: ["depression", "link", "awareness"] },
  { title: "Helping Your Highly Sensitive Child Navigate Friendship Challenges", category: "emotional-wellbeing", tags: ["friendship", "social", "challenges"] },
  { title: "Why Highly Sensitive Children Often Feel Misunderstood", category: "emotional-wellbeing", tags: ["misunderstood", "validation", "connection"] },
  { title: "Emotional Regulation Techniques That Work for HSC", category: "emotional-wellbeing", tags: ["emotional regulation", "techniques", "practical"] },
  { title: "How to Help Your HSC Recover After a Meltdown", category: "emotional-wellbeing", tags: ["recovery", "meltdown", "aftermath"] },
  { title: "The Role of Shame in Highly Sensitive Children's Emotional Lives", category: "emotional-wellbeing", tags: ["shame", "emotional", "healing"] },
  { title: "Helping Your HSC Develop Emotional Vocabulary", category: "emotional-wellbeing", tags: ["vocabulary", "emotional literacy", "language"] },
  { title: "When Your Highly Sensitive Child Says 'I Hate Myself'", category: "emotional-wellbeing", tags: ["self-hatred", "crisis", "response"] },
  { title: "Mindfulness for Highly Sensitive Children: Age-Appropriate Practices", category: "emotional-wellbeing", tags: ["mindfulness", "age-appropriate", "practices"] },
  { title: "The Highly Sensitive Child and Pets: Why Animals Can Be Therapeutic", category: "emotional-wellbeing", tags: ["pets", "animals", "therapeutic"] },
  { title: "Music and the Highly Sensitive Child: Why They Often Excel", category: "emotional-wellbeing", tags: ["music", "excellence", "sensitivity"] },
  { title: "How to Handle Your HSC's Intense Reaction to Injustice", category: "emotional-wellbeing", tags: ["injustice", "reaction", "moral"] },
  { title: "The Highly Sensitive Child and Creativity: Nurturing Their Gift", category: "emotional-wellbeing", tags: ["creativity", "nurturing", "gift"] },
  { title: "The Highly Sensitive Child and Perfectionism in Art and Creative Work", category: "emotional-wellbeing", tags: ["perfectionism", "art", "creative"] },
  { title: "How to Help Your HSC When a Pet Dies", category: "emotional-wellbeing", tags: ["pet death", "grief", "support"] },
  { title: "How to Handle Your HSC's Intense Reaction to Unfairness", category: "emotional-wellbeing", tags: ["unfairness", "reaction", "justice"] },
  { title: "How to Help Your HSC When They're Excluded From a Friend Group", category: "emotional-wellbeing", tags: ["exclusion", "friendship", "support"] },
  { title: "How to Handle Your HSC's Reaction to Seeing Someone Hurt or Upset", category: "emotional-wellbeing", tags: ["empathy", "reaction", "others pain"] },
  { title: "The Highly Sensitive Child and Grief: Supporting Them Through Loss", category: "emotional-wellbeing", tags: ["grief", "loss", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Empathy", category: "emotional-wellbeing", tags: ["empathy overwhelm", "support", "strategies"] },
  { title: "The Highly Sensitive Child and Jealousy: Understanding and Managing It", category: "emotional-wellbeing", tags: ["jealousy", "understanding", "management"] },
  { title: "How to Help Your HSC Build Emotional Resilience", category: "emotional-wellbeing", tags: ["emotional resilience", "building", "strategies"] },
  { title: "The Highly Sensitive Child and Loneliness: When They Feel Deeply Alone", category: "emotional-wellbeing", tags: ["loneliness", "connection", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Feelings", category: "emotional-wellbeing", tags: ["overwhelmed", "feelings", "support"] },
  { title: "The Highly Sensitive Child and Fear of Death: Age-Appropriate Conversations", category: "emotional-wellbeing", tags: ["fear of death", "conversation", "age-appropriate"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Change", category: "emotional-wellbeing", tags: ["change", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Disappointment: Building Coping Skills", category: "emotional-wellbeing", tags: ["disappointment", "coping", "skills"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Sensory Input", category: "emotional-wellbeing", tags: ["sensory input", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Worry: Practical Tools for Anxious Minds", category: "emotional-wellbeing", tags: ["worry", "anxiety", "tools"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Situations", category: "emotional-wellbeing", tags: ["social", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Flooding: What It Is and How to Help", category: "emotional-wellbeing", tags: ["emotional flooding", "overwhelm", "help"] },
  { title: "How to Help Your HSC Develop a Positive Self-Image", category: "emotional-wellbeing", tags: ["self-image", "positive", "development"] },
  { title: "The Highly Sensitive Child and Emotional Contagion: When They Absorb Everyone's Feelings", category: "emotional-wellbeing", tags: ["emotional contagion", "absorbing", "boundaries"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Transitions", category: "emotional-wellbeing", tags: ["transitions", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Intrusive Thoughts: What Parents Need to Know", category: "emotional-wellbeing", tags: ["intrusive thoughts", "awareness", "support"] },
  { title: "How to Help Your HSC Build Emotional Boundaries With Others", category: "emotional-wellbeing", tags: ["emotional boundaries", "building", "protection"] },
  { title: "The Highly Sensitive Child and Emotional Exhaustion: Signs and Solutions", category: "emotional-wellbeing", tags: ["emotional exhaustion", "signs", "solutions"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Criticism", category: "emotional-wellbeing", tags: ["criticism", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Intelligence: Nurturing Their Superpower", category: "emotional-wellbeing", tags: ["emotional intelligence", "superpower", "nurturing"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Expectations", category: "emotional-wellbeing", tags: ["expectations", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Regulation: A Parent's Complete Guide", category: "emotional-wellbeing", tags: ["emotional regulation", "complete guide", "parent"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Noise", category: "emotional-wellbeing", tags: ["noise", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Safety: Creating a Secure Base", category: "emotional-wellbeing", tags: ["emotional safety", "secure base", "attachment"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Uncertainty", category: "emotional-wellbeing", tags: ["uncertainty", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Healing: After Difficult Experiences", category: "emotional-wellbeing", tags: ["healing", "difficult experiences", "recovery"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Sensitivity", category: "emotional-wellbeing", tags: ["self-awareness", "sensitivity", "acceptance"] },
  { title: "The Highly Sensitive Child and Emotional Triggers: Identifying and Managing Them", category: "emotional-wellbeing", tags: ["triggers", "identifying", "managing"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Friendship Drama", category: "emotional-wellbeing", tags: ["friendship drama", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Overwhelm: A Parent's Survival Guide", category: "emotional-wellbeing", tags: ["emotional overwhelm", "survival guide", "parent"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Academic Pressure", category: "emotional-wellbeing", tags: ["academic pressure", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Awareness: Teaching Them to Read Their Own Signals", category: "emotional-wellbeing", tags: ["emotional awareness", "signals", "self-knowledge"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Family Conflict", category: "emotional-wellbeing", tags: ["family conflict", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Processing: Why They Need More Time", category: "emotional-wellbeing", tags: ["emotional processing", "time", "understanding"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Media", category: "emotional-wellbeing", tags: ["social media", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Regulation at School", category: "emotional-wellbeing", tags: ["school", "emotional regulation", "strategies"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Perfectionism", category: "emotional-wellbeing", tags: ["perfectionism", "overwhelm", "self-compassion"] },
  { title: "The Highly Sensitive Child and Emotional Connection: Why Relationships Matter More", category: "emotional-wellbeing", tags: ["emotional connection", "relationships", "importance"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Peer Pressure", category: "emotional-wellbeing", tags: ["peer pressure", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Growth: Celebrating Progress", category: "emotional-wellbeing", tags: ["emotional growth", "progress", "celebration"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Big Life Events", category: "emotional-wellbeing", tags: ["big life events", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Emotional Wellbeing: A Holistic Approach", category: "emotional-wellbeing", tags: ["wellbeing", "holistic", "approach"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Emotions", category: "emotional-wellbeing", tags: ["own emotions", "overwhelm", "self-regulation"] },
  { title: "The Highly Sensitive Child and Emotional Strength: Reframing Sensitivity as Power", category: "emotional-wellbeing", tags: ["emotional strength", "reframing", "power"] },

  // School & Social (70)
  { title: "How to Advocate for Your Highly Sensitive Child at School", category: "school-social", tags: ["advocacy", "school", "IEP"] },
  { title: "The Best School Environments for Highly Sensitive Children", category: "school-social", tags: ["school environment", "fit", "types"] },
  { title: "How to Talk to Your Child's Teacher About High Sensitivity", category: "school-social", tags: ["teacher", "communication", "advocacy"] },
  { title: "Homework Struggles in Highly Sensitive Children: Causes and Solutions", category: "school-social", tags: ["homework", "struggles", "solutions"] },
  { title: "How to Help Your HSC Navigate the Cafeteria and Lunch Overwhelm", category: "school-social", tags: ["cafeteria", "lunch", "overwhelm"] },
  { title: "Recess and the Highly Sensitive Child: Social Challenges and Support", category: "school-social", tags: ["recess", "social", "support"] },
  { title: "How Highly Sensitive Children Experience Test Anxiety", category: "school-social", tags: ["test anxiety", "school", "performance"] },
  { title: "Bullying and the Highly Sensitive Child: Prevention and Response", category: "school-social", tags: ["bullying", "prevention", "response"] },
  { title: "How to Help Your HSC Make and Keep Friends", category: "school-social", tags: ["friendship", "social skills", "support"] },
  { title: "Homeschooling a Highly Sensitive Child: Is It Right for Your Family?", category: "school-social", tags: ["homeschooling", "decision", "pros cons"] },
  { title: "After-School Meltdowns: Why They Happen and How to Handle Them", category: "school-social", tags: ["after-school", "meltdown", "decompression"] },
  { title: "How to Help Your HSC Transition Back to School After Summer", category: "school-social", tags: ["back to school", "transition", "anxiety"] },
  { title: "Social Anxiety in Highly Sensitive Children: A Parent's Guide", category: "school-social", tags: ["social anxiety", "guide", "strategies"] },
  { title: "The Highly Sensitive Child and Group Projects: Navigating Collaboration", category: "school-social", tags: ["group projects", "collaboration", "school"] },
  { title: "How to Help Your HSC Handle Criticism From Teachers", category: "school-social", tags: ["criticism", "teacher", "response"] },
  { title: "Sports and the Highly Sensitive Child: Finding the Right Fit", category: "school-social", tags: ["sports", "fit", "activities"] },
  { title: "How to Help Your HSC Navigate Social Media as a Teenager", category: "school-social", tags: ["social media", "teenager", "navigation"] },
  { title: "The Highly Sensitive Child and Competitive Sports: When to Push and When to Back Off", category: "school-social", tags: ["competitive sports", "balance", "pressure"] },
  { title: "The Highly Sensitive Child and Public Speaking: Building Confidence Gently", category: "school-social", tags: ["public speaking", "confidence", "gentle"] },
  { title: "IEP vs. 504 Plan: Which Is Right for Your Highly Sensitive Child?", category: "school-social", tags: ["iep", "504", "comparison"] },
  { title: "How to Document Your Child's Sensitivity for School Accommodations", category: "school-social", tags: ["documentation", "accommodations", "school"] },
  { title: "The Highly Sensitive Child and Competitive Games: Handling Winning and Losing", category: "school-social", tags: ["games", "winning", "losing"] },
  { title: "The Highly Sensitive Child and Sleepover Anxiety", category: "school-social", tags: ["sleepover", "anxiety", "strategies"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Homework", category: "school-social", tags: ["homework", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and School Transitions: Moving to Middle School", category: "school-social", tags: ["middle school", "transition", "support"] },
  { title: "How to Help Your HSC When They Don't Want to Go to School", category: "school-social", tags: ["school refusal", "anxiety", "strategies"] },
  { title: "The Highly Sensitive Child and Classroom Noise: Strategies That Work", category: "school-social", tags: ["classroom noise", "strategies", "focus"] },
  { title: "How to Help Your HSC When They're Overwhelmed by a Substitute Teacher", category: "school-social", tags: ["substitute teacher", "change", "anxiety"] },
  { title: "The Highly Sensitive Child and Peer Relationships: Building Genuine Connections", category: "school-social", tags: ["peer relationships", "genuine", "connection"] },
  { title: "How to Help Your HSC When They're Overwhelmed by School Performances", category: "school-social", tags: ["school performances", "anxiety", "support"] },
  { title: "The Highly Sensitive Child and School Lunch: Navigating Sensory Challenges", category: "school-social", tags: ["school lunch", "sensory", "strategies"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Field Trips", category: "school-social", tags: ["field trips", "overwhelm", "preparation"] },
  { title: "The Highly Sensitive Child and School Friendships: Quality Over Quantity", category: "school-social", tags: ["school friendships", "quality", "depth"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Group Work", category: "school-social", tags: ["group work", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and School Anxiety: A Comprehensive Guide", category: "school-social", tags: ["school anxiety", "comprehensive", "guide"] },
  { title: "How to Help Your HSC When They're Overwhelmed by School Transitions", category: "school-social", tags: ["school transitions", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and Classroom Seating: Why It Matters", category: "school-social", tags: ["classroom seating", "importance", "arrangement"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Standardized Testing", category: "school-social", tags: ["standardized testing", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and After-School Activities: Finding the Right Balance", category: "school-social", tags: ["after-school activities", "balance", "fit"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Hierarchies", category: "school-social", tags: ["social hierarchies", "overwhelm", "navigation"] },
  { title: "The Highly Sensitive Child and School Discipline: When Consequences Hit Too Hard", category: "school-social", tags: ["school discipline", "consequences", "sensitivity"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Classroom Changes", category: "school-social", tags: ["classroom changes", "overwhelm", "adaptation"] },
  { title: "The Highly Sensitive Child and School Performance: Managing Expectations", category: "school-social", tags: ["school performance", "expectations", "management"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Extracurricular Commitments", category: "school-social", tags: ["extracurricular", "overwhelm", "balance"] },
  { title: "The Highly Sensitive Child and School Culture: Finding Their Place", category: "school-social", tags: ["school culture", "belonging", "place"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Academic Competition", category: "school-social", tags: ["academic competition", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and School Safety: When They Feel Unsafe", category: "school-social", tags: ["school safety", "feeling unsafe", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Expectations at School", category: "school-social", tags: ["social expectations", "school", "overwhelm"] },
  { title: "The Highly Sensitive Child and School Transitions: Moving to High School", category: "school-social", tags: ["high school", "transition", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Peer Conflict", category: "school-social", tags: ["peer conflict", "overwhelm", "resolution"] },
  { title: "The Highly Sensitive Child and School Belonging: Creating a Sense of Community", category: "school-social", tags: ["belonging", "community", "school"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Teacher Expectations", category: "school-social", tags: ["teacher expectations", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and School Routines: Why Consistency Matters", category: "school-social", tags: ["school routines", "consistency", "importance"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Classroom Dynamics", category: "school-social", tags: ["classroom dynamics", "overwhelm", "navigation"] },
  { title: "The Highly Sensitive Child and School Success: Redefining What It Means", category: "school-social", tags: ["school success", "redefining", "perspective"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Social Media at School", category: "school-social", tags: ["social media", "school", "overwhelm"] },
  { title: "The Highly Sensitive Child and School Friendships: Navigating Complexity", category: "school-social", tags: ["friendships", "complexity", "navigation"] },
  { title: "How to Help Your HSC When They're Overwhelmed by School Events", category: "school-social", tags: ["school events", "overwhelm", "preparation"] },
  { title: "The Highly Sensitive Child and School Advocacy: Teaching Them to Speak Up", category: "school-social", tags: ["self-advocacy", "teaching", "empowerment"] },
  { title: "How to Help Your HSC When They're Overwhelmed by the School Day", category: "school-social", tags: ["school day", "overwhelm", "decompression"] },
  { title: "The Highly Sensitive Child and School Relationships: Building Positive Connections", category: "school-social", tags: ["school relationships", "positive", "building"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Homework Load", category: "school-social", tags: ["homework load", "overwhelm", "management"] },
  { title: "The Highly Sensitive Child and School Environment: What Makes a Difference", category: "school-social", tags: ["school environment", "difference", "factors"] },
  { title: "How to Help Your HSC When They're Overwhelmed by School Pressure", category: "school-social", tags: ["school pressure", "overwhelm", "support"] },
  { title: "The Highly Sensitive Child and School Wellbeing: A Parent's Advocacy Guide", category: "school-social", tags: ["school wellbeing", "advocacy", "guide"] },
  { title: "How to Help Your HSC When They're Overwhelmed by School Social Dynamics", category: "school-social", tags: ["social dynamics", "overwhelm", "navigation"] },
  { title: "The Highly Sensitive Child and School Transitions: Kindergarten to Elementary", category: "school-social", tags: ["kindergarten", "transition", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Classroom Sensory Input", category: "school-social", tags: ["classroom sensory", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and School Confidence: Building It Gently", category: "school-social", tags: ["school confidence", "building", "gentle"] },

  // Family Dynamics (50)
  { title: "How High Sensitivity Affects the Whole Family System", category: "family-dynamics", tags: ["family system", "impact", "dynamics"] },
  { title: "Parental Burnout When Raising a Highly Sensitive Child", category: "family-dynamics", tags: ["burnout", "parent", "self-care"] },
  { title: "How to Explain Your HSC's Sensitivity to Grandparents", category: "family-dynamics", tags: ["grandparents", "explanation", "family"] },
  { title: "When Your Partner Doesn't Understand Your Child's Sensitivity", category: "family-dynamics", tags: ["partner", "disagreement", "co-parenting"] },
  { title: "Sibling Jealousy When One Child Gets More Attention", category: "family-dynamics", tags: ["siblings", "jealousy", "fairness"] },
  { title: "How to Take Care of Yourself as a Parent of an HSC", category: "family-dynamics", tags: ["self-care", "parent", "wellbeing"] },
  { title: "Family Vacations With a Highly Sensitive Child: Planning for Success", category: "family-dynamics", tags: ["vacation", "planning", "travel"] },
  { title: "Holiday Overwhelm: Helping Your HSC Through Festive Chaos", category: "family-dynamics", tags: ["holidays", "overwhelm", "strategies"] },
  { title: "How Divorce Affects Highly Sensitive Children Differently", category: "family-dynamics", tags: ["divorce", "impact", "support"] },
  { title: "Raising a Highly Sensitive Child as a Single Parent", category: "family-dynamics", tags: ["single parent", "challenges", "support"] },
  { title: "How to Build a Support Network as an HSC Parent", category: "family-dynamics", tags: ["support network", "community", "resources"] },
  { title: "The Guilt of HSC Parenting: You're Not Doing It Wrong", category: "family-dynamics", tags: ["guilt", "reassurance", "perspective"] },
  { title: "How to Disagree With Your Partner About HSC Parenting Approaches", category: "family-dynamics", tags: ["disagreement", "partner", "resolution"] },
  { title: "Extended Family Gatherings and the Highly Sensitive Child", category: "family-dynamics", tags: ["extended family", "gatherings", "strategies"] },
  { title: "When Your Highly Sensitive Child Has a Highly Sensitive Sibling", category: "family-dynamics", tags: ["two hsc", "siblings", "dynamics"] },
  { title: "The Highly Sensitive Child and Moving to a New Home", category: "family-dynamics", tags: ["moving", "transition", "support"] },
  { title: "How to Handle Your HSC's Reaction to a New Baby Sibling", category: "family-dynamics", tags: ["new baby", "sibling", "adjustment"] },
  { title: "The Highly Sensitive Child and Family Conflict: Protecting Them From the Storm", category: "family-dynamics", tags: ["family conflict", "protection", "support"] },
  { title: "How to Create a Family Culture That Honors Sensitivity", category: "family-dynamics", tags: ["family culture", "honoring", "sensitivity"] },
  { title: "The Highly Sensitive Child and Parental Stress: How It Affects Them", category: "family-dynamics", tags: ["parental stress", "impact", "awareness"] },
  { title: "How to Talk to Your HSC About Family Financial Stress", category: "family-dynamics", tags: ["financial stress", "conversation", "age-appropriate"] },
  { title: "The Highly Sensitive Child and Parental Mental Health: What You Need to Know", category: "family-dynamics", tags: ["parental mental health", "impact", "awareness"] },
  { title: "How to Create Family Rituals That Support Your Highly Sensitive Child", category: "family-dynamics", tags: ["family rituals", "support", "connection"] },
  { title: "The Highly Sensitive Child and Blended Families: Extra Challenges", category: "family-dynamics", tags: ["blended families", "challenges", "support"] },
  { title: "How to Help Your HSC When a Grandparent Dies", category: "family-dynamics", tags: ["grandparent death", "grief", "support"] },
  { title: "The Highly Sensitive Child and Family Routines: Why They Need Them More", category: "family-dynamics", tags: ["family routines", "need", "importance"] },
  { title: "How to Maintain Your Relationship While Parenting an HSC", category: "family-dynamics", tags: ["relationship", "maintaining", "parenting"] },
  { title: "The Highly Sensitive Child and Parental Disagreements: Minimizing the Impact", category: "family-dynamics", tags: ["parental disagreements", "impact", "minimizing"] },
  { title: "How to Explain Your HSC's Sensitivity to Other Children", category: "family-dynamics", tags: ["other children", "explanation", "understanding"] },
  { title: "The Highly Sensitive Child and Family Celebrations: Making Them Work", category: "family-dynamics", tags: ["celebrations", "family", "strategies"] },
  { title: "How to Handle Unsolicited Parenting Advice About Your HSC", category: "family-dynamics", tags: ["unsolicited advice", "handling", "boundaries"] },
  { title: "The Highly Sensitive Child and Parental Boundaries: Modeling Healthy Limits", category: "family-dynamics", tags: ["parental boundaries", "modeling", "healthy"] },
  { title: "How to Build Resilience as an HSC Parent", category: "family-dynamics", tags: ["parent resilience", "building", "self-care"] },
  { title: "The Highly Sensitive Child and Family Dynamics: When Everyone Is Affected", category: "family-dynamics", tags: ["family dynamics", "everyone", "impact"] },
  { title: "How to Create a Family Communication Style That Works for Your HSC", category: "family-dynamics", tags: ["communication style", "family", "HSC-friendly"] },
  { title: "The Highly Sensitive Child and Parental Expectations: Recalibrating What Success Looks Like", category: "family-dynamics", tags: ["expectations", "recalibrating", "success"] },
  { title: "How to Help Your HSC When a Parent Is Ill or Hospitalized", category: "family-dynamics", tags: ["parent illness", "support", "communication"] },
  { title: "The Highly Sensitive Child and Family Stress: Building a Buffer", category: "family-dynamics", tags: ["family stress", "buffer", "protection"] },
  { title: "How to Celebrate Your Highly Sensitive Child Without Overwhelming Them", category: "family-dynamics", tags: ["celebration", "balance", "strategies"] },
  { title: "The Highly Sensitive Child and Parental Burnout: Recovery and Prevention", category: "family-dynamics", tags: ["parental burnout", "recovery", "prevention"] },
  { title: "How to Build a Village Around Your Highly Sensitive Child", category: "family-dynamics", tags: ["village", "community", "support"] },
  { title: "The Highly Sensitive Child and Family Identity: Embracing What Makes You Different", category: "family-dynamics", tags: ["family identity", "embracing", "difference"] },
  { title: "How to Help Your HSC When Family Relationships Are Complicated", category: "family-dynamics", tags: ["complicated relationships", "navigation", "support"] },
  { title: "The Highly Sensitive Child and Parenting Partnerships: Working as a Team", category: "family-dynamics", tags: ["parenting partnership", "teamwork", "alignment"] },
  { title: "How to Protect Your HSC From Toxic Family Members", category: "family-dynamics", tags: ["toxic family", "protection", "boundaries"] },
  { title: "The Highly Sensitive Child and Family Healing: When the Whole System Needs Support", category: "family-dynamics", tags: ["family healing", "system", "support"] },
  { title: "How to Create a Sensory-Friendly Family Home", category: "family-dynamics", tags: ["sensory-friendly", "home", "family"] },
  { title: "The Highly Sensitive Child and Parental Self-Compassion: You're Doing Better Than You Think", category: "family-dynamics", tags: ["self-compassion", "parent", "reassurance"] },
  { title: "How to Talk to Your HSC About Their Sensitivity in a Family Context", category: "family-dynamics", tags: ["family context", "conversation", "sensitivity"] },
  { title: "The Highly Sensitive Child and Family Wellbeing: A Whole-Family Approach", category: "family-dynamics", tags: ["family wellbeing", "whole-family", "approach"] },

  // Long-Term Outcomes (40)
  { title: "What Happens to Highly Sensitive Children When They Grow Up?", category: "long-term-outcomes", tags: ["adult", "outcomes", "research"] },
  { title: "Highly Sensitive Adults: What Your Child's Future Could Look Like", category: "long-term-outcomes", tags: ["adult hsp", "future", "positive"] },
  { title: "The Career Strengths of Adults Who Were Highly Sensitive Children", category: "long-term-outcomes", tags: ["career", "strengths", "adult"] },
  { title: "How Childhood Experiences Shape the Highly Sensitive Adult", category: "long-term-outcomes", tags: ["childhood", "adult", "shaping"] },
  { title: "Relationships and the Highly Sensitive Adult: What HSC Parents Should Know", category: "long-term-outcomes", tags: ["relationships", "adult", "awareness"] },
  { title: "The Link Between HSC and Creative Achievement in Adulthood", category: "long-term-outcomes", tags: ["creativity", "achievement", "adult"] },
  { title: "How to Raise a Highly Sensitive Child Who Becomes a Confident Adult", category: "long-term-outcomes", tags: ["confidence", "adult", "raising"] },
  { title: "Resilience Research: What Protects Highly Sensitive Children Long-Term", category: "long-term-outcomes", tags: ["resilience", "research", "protection"] },
  { title: "The Role of Parenting Quality in HSC Long-Term Outcomes", category: "long-term-outcomes", tags: ["parenting quality", "outcomes", "research"] },
  { title: "When Highly Sensitive Children Become Highly Sensitive Parents", category: "long-term-outcomes", tags: ["hsp parent", "cycle", "awareness"] },
  { title: "The Highly Sensitive Adult at Work: Career Challenges and Strengths", category: "long-term-outcomes", tags: ["work", "career", "adult"] },
  { title: "How Secure Attachment Shapes the Highly Sensitive Child's Future", category: "long-term-outcomes", tags: ["secure attachment", "future", "impact"] },
  { title: "The Highly Sensitive Adult and Relationships: What Childhood Taught Them", category: "long-term-outcomes", tags: ["adult relationships", "childhood lessons", "patterns"] },
  { title: "How Highly Sensitive Children Fare in Different Educational Paths", category: "long-term-outcomes", tags: ["educational paths", "outcomes", "research"] },
  { title: "The Highly Sensitive Adult and Mental Health: Long-Term Patterns", category: "long-term-outcomes", tags: ["mental health", "long-term", "patterns"] },
  { title: "How Childhood Trauma Affects the Highly Sensitive Adult Differently", category: "long-term-outcomes", tags: ["childhood trauma", "adult", "impact"] },
  { title: "The Highly Sensitive Adult and Creativity: Lifelong Gifts", category: "long-term-outcomes", tags: ["creativity", "lifelong", "gifts"] },
  { title: "How Parental Support Shapes the Highly Sensitive Child's Outcomes", category: "long-term-outcomes", tags: ["parental support", "outcomes", "research"] },
  { title: "The Highly Sensitive Adult and Self-Awareness: A Lifelong Journey", category: "long-term-outcomes", tags: ["self-awareness", "lifelong", "journey"] },
  { title: "How Highly Sensitive Children Develop Their Identity as Adults", category: "long-term-outcomes", tags: ["identity", "development", "adult"] },
  { title: "The Highly Sensitive Adult and Emotional Intelligence: A Lifelong Strength", category: "long-term-outcomes", tags: ["emotional intelligence", "strength", "adult"] },
  { title: "How Highly Sensitive Children Navigate the Transition to Adulthood", category: "long-term-outcomes", tags: ["transition", "adulthood", "navigation"] },
  { title: "The Highly Sensitive Adult and Parenting: Breaking Cycles and Building New Ones", category: "long-term-outcomes", tags: ["adult parenting", "cycles", "building"] },
  { title: "How Childhood Experiences of Being Understood Shape the Highly Sensitive Adult", category: "long-term-outcomes", tags: ["being understood", "childhood", "adult"] },
  { title: "The Highly Sensitive Adult and Friendship: Deep Connections Over Many", category: "long-term-outcomes", tags: ["friendship", "deep connections", "adult"] },
  { title: "How Highly Sensitive Children Develop Coping Strategies That Last a Lifetime", category: "long-term-outcomes", tags: ["coping strategies", "lifetime", "development"] },
  { title: "The Highly Sensitive Adult and Purpose: Finding Meaning Through Sensitivity", category: "long-term-outcomes", tags: ["purpose", "meaning", "sensitivity"] },
  { title: "How Early Intervention Shapes the Highly Sensitive Child's Long-Term Outcomes", category: "long-term-outcomes", tags: ["early intervention", "outcomes", "impact"] },
  { title: "The Highly Sensitive Adult and Boundaries: Learning to Protect Their Energy", category: "long-term-outcomes", tags: ["boundaries", "energy", "protection"] },
  { title: "How Highly Sensitive Children Become Empathetic Leaders", category: "long-term-outcomes", tags: ["leadership", "empathy", "adult"] },
  { title: "The Highly Sensitive Adult and Wellbeing: What the Research Shows", category: "long-term-outcomes", tags: ["wellbeing", "research", "adult"] },
  { title: "How Childhood Validation Shapes the Highly Sensitive Adult's Self-Worth", category: "long-term-outcomes", tags: ["validation", "self-worth", "childhood"] },
  { title: "The Highly Sensitive Adult and Spirituality: A Deepened Inner Life", category: "long-term-outcomes", tags: ["spirituality", "inner life", "adult"] },
  { title: "How Highly Sensitive Children Develop Their Unique Gifts Over Time", category: "long-term-outcomes", tags: ["unique gifts", "development", "time"] },
  { title: "The Highly Sensitive Adult and Therapy: Why It Often Helps More", category: "long-term-outcomes", tags: ["therapy", "adult", "effectiveness"] },
  { title: "How Highly Sensitive Children Learn to Thrive in a Non-Sensitive World", category: "long-term-outcomes", tags: ["thriving", "non-sensitive world", "adaptation"] },
  { title: "The Highly Sensitive Adult and Nature: A Lifelong Relationship", category: "long-term-outcomes", tags: ["nature", "lifelong", "relationship"] },
  { title: "How Highly Sensitive Children Develop Emotional Wisdom as Adults", category: "long-term-outcomes", tags: ["emotional wisdom", "development", "adult"] },
  { title: "The Highly Sensitive Adult and Community: Finding Their People", category: "long-term-outcomes", tags: ["community", "belonging", "adult"] },
  { title: "How Highly Sensitive Children Become the World's Best Listeners", category: "long-term-outcomes", tags: ["listening", "skill", "adult"] },

  // Tools & Resources (50)
  { title: "The Best Books for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["books", "resources", "reading"] },
  { title: "Apps That Help Highly Sensitive Children Regulate Emotions", category: "tools-resources", tags: ["apps", "technology", "regulation"] },
  { title: "The Best Therapists for Highly Sensitive Children: What to Look For", category: "tools-resources", tags: ["therapists", "finding", "criteria"] },
  { title: "How to Find an HSC-Informed School Counselor", category: "tools-resources", tags: ["school counselor", "finding", "criteria"] },
  { title: "Journaling for Highly Sensitive Children: A Practical Guide", category: "tools-resources", tags: ["journaling", "practical", "emotional"] },
  { title: "Art Therapy for Highly Sensitive Children: What It Is and How It Helps", category: "tools-resources", tags: ["art therapy", "benefits", "guide"] },
  { title: "Music Therapy and the Highly Sensitive Child", category: "tools-resources", tags: ["music therapy", "benefits", "research"] },
  { title: "Play Therapy for Highly Sensitive Children: A Parent's Guide", category: "tools-resources", tags: ["play therapy", "guide", "benefits"] },
  { title: "How to Use Social Stories With Highly Sensitive Children", category: "tools-resources", tags: ["social stories", "practical", "tool"] },
  { title: "The Best Podcasts for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["podcasts", "resources", "listening"] },
  { title: "YouTube Channels That Help Highly Sensitive Children Regulate", category: "tools-resources", tags: ["youtube", "videos", "regulation"] },
  { title: "How to Use Breathing Exercises With Your Highly Sensitive Child", category: "tools-resources", tags: ["breathing", "exercises", "practical"] },
  { title: "Progressive Muscle Relaxation for Highly Sensitive Children", category: "tools-resources", tags: ["relaxation", "body", "technique"] },
  { title: "How to Use a Feelings Chart With Your Highly Sensitive Child", category: "tools-resources", tags: ["feelings chart", "tool", "practical"] },
  { title: "Omega-3 Fatty Acids and Highly Sensitive Children: What the Research Shows", category: "tools-resources", tags: ["omega-3", "supplements", "research"] },
  { title: "Magnesium for Highly Sensitive Children: Benefits and Dosing", category: "tools-resources", tags: ["magnesium", "supplements", "calm"] },
  { title: "Probiotics and the Highly Sensitive Child's Gut-Brain Axis", category: "tools-resources", tags: ["probiotics", "gut", "brain"] },
  { title: "The Role of Iron Deficiency in Sensory Sensitivity and Mood", category: "tools-resources", tags: ["iron", "deficiency", "mood"] },
  { title: "Vitamin D and Emotional Regulation in Highly Sensitive Children", category: "tools-resources", tags: ["vitamin d", "emotional", "regulation"] },
  { title: "Sugar and the Highly Sensitive Child: What Parents Need to Know", category: "tools-resources", tags: ["sugar", "diet", "behavior"] },
  { title: "Food Dyes and Behavioral Sensitivity: The Evidence", category: "tools-resources", tags: ["food dyes", "behavior", "evidence"] },
  { title: "Gluten Sensitivity and Emotional Reactivity in Children", category: "tools-resources", tags: ["gluten", "sensitivity", "emotional"] },
  { title: "The Best Anti-Inflammatory Diet for Highly Sensitive Children", category: "tools-resources", tags: ["anti-inflammatory", "diet", "nutrition"] },
  { title: "Herbal Remedies for Anxiety in Highly Sensitive Children: What's Safe?", category: "tools-resources", tags: ["herbal", "anxiety", "safety"] },
  { title: "When to Seek Professional Help for Your Highly Sensitive Child", category: "tools-resources", tags: ["professional help", "when", "criteria"] },
  { title: "What to Expect From a Sensory Processing Evaluation", category: "tools-resources", tags: ["evaluation", "sensory", "process"] },
  { title: "How to Find a Therapist Who Understands High Sensitivity", category: "tools-resources", tags: ["therapist", "finding", "criteria"] },
  { title: "Occupational Therapy for Highly Sensitive Children: What It Involves", category: "tools-resources", tags: ["occupational therapy", "process", "benefits"] },
  { title: "Neurofeedback for Highly Sensitive Children: What the Research Shows", category: "tools-resources", tags: ["neurofeedback", "research", "treatment"] },
  { title: "EMDR Therapy for Highly Sensitive Children With Trauma", category: "tools-resources", tags: ["emdr", "trauma", "therapy"] },
  { title: "How to Prepare Your HSC for a Therapy Appointment", category: "tools-resources", tags: ["therapy prep", "appointment", "child"] },
  { title: "Finding an HSC-Friendly Pediatrician: What to Look For", category: "tools-resources", tags: ["pediatrician", "finding", "criteria"] },
  { title: "The Best Online Communities for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["online communities", "support", "connection"] },
  { title: "How to Use Yoga With Your Highly Sensitive Child", category: "tools-resources", tags: ["yoga", "movement", "regulation"] },
  { title: "The Best Fidget Tools for Highly Sensitive Children at School", category: "tools-resources", tags: ["fidget tools", "school", "focus"] },
  { title: "How to Use Aromatherapy Safely With Highly Sensitive Children", category: "tools-resources", tags: ["aromatherapy", "safety", "calm"] },
  { title: "The Best Workbooks for Highly Sensitive Children", category: "tools-resources", tags: ["workbooks", "self-help", "children"] },
  { title: "How to Use Tapping (EFT) With Your Highly Sensitive Child", category: "tools-resources", tags: ["tapping", "eft", "anxiety"] },
  { title: "The Best Sand Tray Therapy Resources for Highly Sensitive Children", category: "tools-resources", tags: ["sand tray", "therapy", "resources"] },
  { title: "How to Use Guided Imagery With Your Highly Sensitive Child", category: "tools-resources", tags: ["guided imagery", "relaxation", "tool"] },
  { title: "The Best Sensory Bins and Sensory Play Ideas for Highly Sensitive Children", category: "tools-resources", tags: ["sensory bins", "play", "ideas"] },
  { title: "How to Use Movement Breaks With Your Highly Sensitive Child", category: "tools-resources", tags: ["movement breaks", "regulation", "school"] },
  { title: "The Best Calm-Down Kits for Highly Sensitive Children", category: "tools-resources", tags: ["calm-down kit", "tools", "regulation"] },
  { title: "How to Use Bibliotherapy With Your Highly Sensitive Child", category: "tools-resources", tags: ["bibliotherapy", "books", "healing"] },
  { title: "The Best Weighted Products for Highly Sensitive Children", category: "tools-resources", tags: ["weighted products", "sensory", "calm"] },
  { title: "How to Use Nature Therapy With Your Highly Sensitive Child", category: "tools-resources", tags: ["nature therapy", "outdoor", "healing"] },
  { title: "The Best Mindfulness Apps for Highly Sensitive Children", category: "tools-resources", tags: ["mindfulness apps", "technology", "calm"] },
  { title: "How to Use Creative Arts Therapy With Your Highly Sensitive Child", category: "tools-resources", tags: ["creative arts", "therapy", "expression"] },
  { title: "The Best Sensory-Friendly Toys and Games for Highly Sensitive Children", category: "tools-resources", tags: ["toys", "games", "sensory-friendly"] },
  { title: "How to Build a Comprehensive Support Plan for Your Highly Sensitive Child", category: "tools-resources", tags: ["support plan", "comprehensive", "building"] },
];

async function generateOne(topic, idx, total, existingArticles) {
  const slug = slugify(topic.title);
  const asins = getAsins(topic.category);

  // Get internal links from existing articles in same category
  const internalLinks = existingArticles
    .filter(a => a.category === topic.category && a.slug !== slug)
    .slice(0, 4)
    .map(a => ({ title: a.title, slug: a.slug }));

  const prompt = buildPrompt(topic.title, topic.category, topic.tags, asins, internalLinks);

  let body = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      body = await callOpenAI(prompt);
      const gate = passesGate(body);
      if (gate.ok) break;
      console.log(`  [${idx}/${total}] attempt ${attempt} gate fail: ${gate.reason}`);
      body = null;
    } catch (err) {
      lastError = err;
      console.log(`  [${idx}/${total}] attempt ${attempt} error: ${err.message.slice(0, 80)}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!body) {
    console.log(`  [${idx}/${total}] SKIP ${slug} — ${lastError?.message || 'gate failed'}`);
    return null;
  }

  const wordCount = countWords(body);
  const readTime = Math.ceil(wordCount / 200);
  const heroUrl = randomHero();

  console.log(`  [${idx}/${total}] OK ${slug} (${wordCount}w, ${readTime}min)`);

  return {
    slug,
    title: topic.title,
    category: topic.category,
    tags: topic.tags,
    excerpt: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
    body,
    hero_url: heroUrl,
    author: 'Dr. Maya Chen',
    read_time: readTime,
    word_count: wordCount,
    status: 'published',
    asins_used: asins.map(a => a.asin),
  };
}

async function runBatch(topics, startIdx, total, existingArticles) {
  const results = await Promise.allSettled(
    topics.map((topic, i) => generateOne(topic, startIdx + i + 1, total, existingArticles))
  );
  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

async function main() {
  console.log('\n[gen500] Starting 500-article generation with GPT-4.1-mini');
  console.log(`[gen500] Concurrency: ${CONCURRENCY}, Articles/day: ${ARTICLES_PER_DAY}`);

  const store = loadStore();
  const existingSlugs = new Set(store.articles.map(a => a.slug));
  const pending = ALL_TOPICS.filter(t => !existingSlugs.has(slugify(t.title)));

  console.log(`[gen500] ${store.articles.length} existing, ${pending.length} pending`);

  if (pending.length === 0) {
    console.log('[gen500] All articles already generated!');
    return;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const existingCount = store.articles.length;

  let generated = 0;
  let failed = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const batchResults = await runBatch(batch, i, pending.length, store.articles);

    for (const article of batchResults) {
      const totalIndex = existingCount + generated;
      const daysOffset = Math.floor(totalIndex / ARTICLES_PER_DAY);
      const publishDate = addDays(startDate, daysOffset);
      const publishDateStr = publishDate.toISOString().split('T')[0];

      article.id = store.articles.length + 1;
      article.published_at = publishDateStr;
      article.created_at = new Date().toISOString();

      store.articles.push(article);
      generated++;
    }

    failed += batch.length - batchResults.length;

    // Save after each batch
    await saveStore();
    console.log(`[gen500] Batch ${Math.floor(i/CONCURRENCY)+1} done. Total: ${store.articles.length} articles (${failed} failed)`);

    // Small delay between batches to respect rate limits
    if (i + CONCURRENCY < pending.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n[gen500] Complete! Generated: ${generated}, Failed: ${failed}`);
  console.log(`[gen500] Total articles in store: ${store.articles.length}`);
  console.log(`[gen500] Date range: ${store.articles[0]?.published_at} to ${store.articles[store.articles.length-1]?.published_at}`);
}

main().catch(err => {
  console.error('[gen500] Fatal:', err);
  process.exit(1);
});
