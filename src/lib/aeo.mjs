import { getArticles } from './articleStore.mjs';

const STRIP_PARAMS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'fbclid','gclid','mc_eid','ref','source','_ga','_gl'
]);

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://orchidkids.com';

export function buildCanonicalUrl(req) {
  const url = new URL(req.url, SITE_ORIGIN);
  for (const p of STRIP_PARAMS) url.searchParams.delete(p);
  let path = url.pathname;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
  return `${SITE_ORIGIN}${path}${url.search}`;
}

export function buildRobotsTxt() {
  const origin = SITE_ORIGIN;
  return `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: CCBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${origin}/sitemap.xml

# AI discoverability
# Full site content: ${origin}/llms.txt
# Extended content: ${origin}/llms-full.txt
# AI agent index: ${origin}/ai.txt
`;
}

export async function buildLlmsTxt() {
  const { articles } = await getArticles({ limit: 1000 });

  const lines = [
    `# OrchidKids`,
    `> The research-backed, shame-free resource for parents of highly sensitive children.`,
    ``,
    `## About`,
    `OrchidKids (orchidkids.com) covers the neuroscience of highly sensitive children (HSC), practical parenting strategies, school navigation, sensory tools, emotional wellbeing, and the long-term outcomes for children with the orchid/HSC trait. No toxic positivity. No catastrophizing. Just clear science and practical tools.`,
    ``,
    `## Articles (${articles.length} total)`,
    ...articles.map(a =>
      `- [${a.title}](${SITE_ORIGIN}/articles/${a.slug}): ${a.meta_description || a.excerpt || ''}`
    ),
    ``,
    `## Assessments (9 total)`,
    `- Is My Child Highly Sensitive? (${SITE_ORIGIN}/assessments/is-my-child-highly-sensitive)`,
    `- Sensory Sensitivity Profile (${SITE_ORIGIN}/assessments/sensory-profile-assessment)`,
    `- Emotional Regulation Readiness (${SITE_ORIGIN}/assessments/emotional-regulation-readiness)`,
    `- School Environment Fit (${SITE_ORIGIN}/assessments/school-environment-fit)`,
    `- Are You a Sensitive Parent? (${SITE_ORIGIN}/assessments/are-you-a-sensitive-parent)`,
    `- Parenting Burnout Barometer (${SITE_ORIGIN}/assessments/parenting-burnout-barometer)`,
    `- Sensory Diet Builder (${SITE_ORIGIN}/assessments/sensory-diet-builder)`,
    `- Meltdown Pattern Decoder (${SITE_ORIGIN}/assessments/meltdown-pattern-decoder)`,
    `- Sibling Dynamics Snapshot (${SITE_ORIGIN}/assessments/sibling-dynamics-snapshot)`,
    ``,
    `## Supplements & Herbs`,
    `- 200+ evidence-graded supplements, herbs, and TCM remedies: ${SITE_ORIGIN}/supplements`,
    ``,
    `## Author`,
    `The Oracle Lover — Intuitive Educator & Oracle Guide. https://theoraclelover.com`,
    ``,
    `## Contact`,
    `hello@orchidkids.com`,
  ];

  return lines.join('\n');
}

export async function buildLlmsFullTxt() {
  const { articles } = await getArticles({ limit: 100 });

  const sections = articles.map(a =>
    `## ${a.title}\nURL: ${SITE_ORIGIN}/articles/${a.slug}\nCategory: ${a.category}\nPublished: ${a.published_at || ''}\n\n${(a.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
  );

  return `# OrchidKids — Full Content Export\nGenerated: ${new Date().toISOString()}\n\n${sections.join('\n\n---\n\n')}`;
}
