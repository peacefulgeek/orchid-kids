import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.resolve(__dirname, '../dist/client');
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://orchidkids.com';
const SITE_NAME = 'OrchidKids';
const DEFAULT_IMAGE = 'https://orchid-kids2.b-cdn.net/library/lib-01.webp';
const PINTEREST_VERIFICATION = process.env.PINTEREST_VERIFICATION || '';

let indexHtml: string;

function getIndexHtml(): string {
  if (!indexHtml) {
    indexHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
  }
  return indexHtml;
}

function escapeAttr(str: string): string {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  type?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  articleSection?: string;
}

function buildMeta(canonical: string, meta: PageMeta): string {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const image = meta.image || DEFAULT_IMAGE;
  const type = meta.type || 'website';

  const breadcrumbJsonLd = meta.breadcrumbs && meta.breadcrumbs.length > 0 ? `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    ${meta.breadcrumbs.map((b, i) => `{
      "@type": "ListItem",
      "position": ${i + 1},
      "name": "${(b.name || '').replace(/"/g, '\\"')}",
      "item": "${b.url || ''}"
    }`).join(',\n    ')}
  ]
}
</script>` : '';

  const articleJsonLd = type === 'article' ? `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title.replace(/&quot;/g, '\\"')}",
  "description": "${description.replace(/&quot;/g, '\\"')}",
  "image": "${image}",
  "datePublished": "${meta.datePublished || new Date().toISOString()}",
  "dateModified": "${meta.dateModified || meta.datePublished || new Date().toISOString()}",
  "author": {
    "@type": "Person",
    "name": "${(meta.author || 'The Oracle Lover').replace(/"/g, '\\"')}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "${SITE_NAME}",
    "url": "${SITE_ORIGIN}",
    "logo": {
      "@type": "ImageObject",
      "url": "${SITE_ORIGIN}/favicon.svg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "${canonical}"
  }
}
</script>` : '';

  const pinterestMeta = PINTEREST_VERIFICATION
    ? `<meta name="p:domain_verify" content="${PINTEREST_VERIFICATION}" />`
    : '';

  return `
  <link rel="canonical" href="${canonical}" />
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${SITE_NAME}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Pinterest -->
  ${pinterestMeta}
  <meta name="pinterest-rich-pin" content="true" />

  <!-- Article-specific meta -->
  ${meta.datePublished ? `<meta property="article:published_time" content="${meta.datePublished}" />` : ''}
  ${meta.dateModified ? `<meta property="article:modified_time" content="${meta.dateModified}" />` : ''}
  ${meta.author ? `<meta property="article:author" content="${escapeAttr(meta.author)}" />` : ''}
  ${meta.articleSection ? `<meta property="article:section" content="${escapeAttr(meta.articleSection)}" />` : ''}

  ${breadcrumbJsonLd}
  ${articleJsonLd}
`;
}

export async function renderPage(req: Request, res: Response) {
  try {
    const html = getIndexHtml();
    const urlPath = req.url.split('?')[0].replace(/\/$/, '') || '/';
    const canonical = `${SITE_ORIGIN}${urlPath}`;

    // Determine page meta based on URL
    let meta: PageMeta = {
      title: 'OrchidKids — Parenting the Child Who Feels Everything',
      description: 'Research-backed guidance for parents of highly sensitive children. Neuroscience, parenting strategies, sensory tools, assessments, and more.',
      breadcrumbs: [{ name: 'Home', url: SITE_ORIGIN }],
    };

    const segments = urlPath.split('/').filter(Boolean);

    if (segments[0] === 'articles' && segments[1]) {
      // Article page — try to get article data for rich meta
      try {
        const { getArticleBySlug } = await import('../src/lib/articleStore.mjs');
        const result = getArticleBySlug(segments[1]);
        const article = result?.article || result;
        if (article && article.title) {
          meta = {
            title: `${article.title} — OrchidKids`,
            description: article.meta_description || article.excerpt || '',
            image: article.hero_url,
            type: 'article',
            datePublished: article.published_at,
            dateModified: article.last_modified_at || article.published_at,
            author: article.author,
            articleSection: article.category,
            breadcrumbs: [
              { name: 'Home', url: SITE_ORIGIN },
              { name: 'Articles', url: `${SITE_ORIGIN}/articles` },
              { name: article.title, url: canonical },
            ],
          };
        }
      } catch {}
    } else if (segments[0] === 'assessments' && segments[1]) {
      meta = {
        title: 'HSC Assessment — OrchidKids',
        description: 'Take our validated assessment to understand your highly sensitive child.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Assessments', url: `${SITE_ORIGIN}/assessments` },
        ],
      };
    } else if (segments[0] === 'assessments') {
      meta = {
        title: 'Assessments for Highly Sensitive Children — OrchidKids',
        description: '9 validated assessments to help you understand and support your highly sensitive child.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Assessments', url: canonical },
        ],
      };
    } else if (segments[0] === 'articles') {
      meta = {
        title: 'All Articles — OrchidKids',
        description: 'Browse all research-backed articles on highly sensitive children, parenting strategies, neuroscience, and more.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Articles', url: canonical },
        ],
      };
    } else if (segments[0] === 'category' && segments[1]) {
      const catName = segments[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      meta = {
        title: `${catName} — OrchidKids`,
        description: `Articles about ${catName} for parents of highly sensitive children.`,
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: catName, url: canonical },
        ],
      };
    } else if (segments[0] === 'supplements') {
      meta = {
        title: 'Supplements, Herbs & TCM for Sensitive Children — OrchidKids',
        description: '200+ evidence-graded supplements, herbs, and TCM remedies for highly sensitive nervous systems.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Supplements & Herbs', url: canonical },
        ],
      };
    } else if (segments[0] === 'recommended') {
      meta = {
        title: 'Recommended Resources — OrchidKids',
        description: 'Books, tools, and products recommended for parents of highly sensitive children.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Recommended', url: canonical },
        ],
      };
    } else if (segments[0] === 'about') {
      meta = {
        title: 'About OrchidKids — Parenting the Child Who Feels Everything',
        description: 'OrchidKids is a research-backed resource for parents of highly sensitive children.',
        breadcrumbs: [
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'About', url: canonical },
        ],
      };
    }

    const metaTags = buildMeta(canonical, meta);
    const finalHtml = html.replace('</head>', `${metaTags}\n</head>`);

    res.status(200).type('html').send(finalHtml);
  } catch (err) {
    console.error('[ssr] render error:', err);
    res.status(500).send('Server error');
  }
}
