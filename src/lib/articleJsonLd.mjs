const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://raisingorchids.com';
const SITE_NAME = 'Raising Orchids';

export function buildArticleJsonLd(article) {
  const url = `${SITE_ORIGIN}/articles/${article.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description || '',
    url,
    datePublished: article.published_at,
    dateModified: article.last_modified_at || article.published_at,
    author: {
      '@type': 'Person',
      name: 'The Oracle Lover',
      url: 'https://theoraclelover.com',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_ORIGIN,
    },
    image: article.hero_url || `${SITE_ORIGIN}/og-default.webp`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: (article.tags || []).join(', '),
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export function buildFaqJsonLd(faqs) {
  if (!faqs || faqs.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: 'The research-backed, shame-free resource for parents of highly sensitive children.',
    knowsAbout: [
      'Highly Sensitive Children',
      'Orchid Child',
      'Sensory Processing',
      'Child Development',
      'Parenting Highly Sensitive Children',
      'Differential Susceptibility',
    ],
  };
}

export function buildPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'The Oracle Lover',
    url: 'https://theoraclelover.com',
    jobTitle: 'Intuitive Educator & Oracle Guide',
    sameAs: ['https://theoraclelover.com'],
    knowsAbout: [
      'Highly Sensitive Children',
      'Child Psychology',
      'Parenting',
      'Neuroscience of Sensitivity',
    ],
  };
}
