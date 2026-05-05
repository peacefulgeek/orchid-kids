import { getArticles } from './articleStore.mjs';

const STRIP_PARAMS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'fbclid','gclid','mc_eid','ref','source','_ga','_gl'
]);

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://raisingorchids.com';

export function buildCanonicalUrl(req) {
  const url = new URL(req.url, SITE_ORIGIN);
  // Strip tracking params
  for (const p of STRIP_PARAMS) url.searchParams.delete(p);
  // Remove trailing slash except root
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

Sitemap: ${origin}/sitemap.xml

# LLM discoverability
# Full site content: ${origin}/llms.txt
# Extended content: ${origin}/llms-full.txt
`;
}

export async function buildLlmsTxt() {
  const { articles } = await getArticles({ limit: 200 });

  const lines = [
    `# Raising Orchids`,
    `> The research-backed, shame-free resource for parents of highly sensitive children.`,
    ``,
    `## About`,
    `Raising Orchids covers the neuroscience of highly sensitive children (HSC), practical parenting strategies, school navigation, sensory tools, and the emotional reality of raising a child who feels everything more deeply.`,
    ``,
    `## Articles`,
    ...articles.map(a =>
      `- [${a.title}](${SITE_ORIGIN}/articles/${a.slug}): ${a.meta_description || ''}`
    ),
    ``,
    `## Assessments`,
    `- Is My Child Highly Sensitive? (${SITE_ORIGIN}/assessments/is-my-child-highly-sensitive)`,
    `- Sensory Sensitivity Profile (${SITE_ORIGIN}/assessments/sensory-profile-assessment)`,
    `- Emotional Regulation Readiness (${SITE_ORIGIN}/assessments/emotional-regulation-readiness)`,
    `- School Environment Fit (${SITE_ORIGIN}/assessments/school-environment-fit)`,
    `- Are You a Sensitive Parent? (${SITE_ORIGIN}/assessments/are-you-a-sensitive-parent)`,
    ``,
    `## Author`,
    `The Oracle Lover — Intuitive Educator & Oracle Guide. https://theoraclelover.com`,
  ];

  return lines.join('\n');
}

export async function buildLlmsFullTxt() {
  const { articles } = await getArticles({ limit: 50 });

  const sections = articles.map(a =>
    `## ${a.title}\nURL: ${SITE_ORIGIN}/articles/${a.slug}\nCategory: ${a.category}\n\n${(a.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
  );

  return `# Raising Orchids — Full Content Export\n\n${sections.join('\n\n---\n\n')}`;
}
