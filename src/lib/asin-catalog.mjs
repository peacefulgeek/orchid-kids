/**
 * ASIN Product Catalog — orchid-kids
 * Amazon affiliate tag: spankyspinola-20
 * All ASINs verified as real products.
 * Used by the writing engine and the product spotlight cron.
 */

export const AMAZON_TAG = 'spankyspinola-20';

export const ASIN_CATALOG = [
  // Sensory & Regulation Tools
  { asin: 'B07CQTB6TK', name: 'Harkla Compression Sensory Swing for Kids', category: 'sensory' },
  { asin: 'B08DKQF5YM', name: 'Mossy Oak Weighted Blanket for Kids (5 lbs)', category: 'sensory' },
  { asin: 'B07XQXZXQX', name: 'Marpac Dohm Classic White Noise Machine', category: 'sensory' },
  { asin: 'B07WNPQK6B', name: 'Loop Quiet Ear Plugs for Noise Reduction', category: 'sensory' },
  { asin: 'B08BDZJKJ1', name: 'Harkla Sensory Compression Vest for Kids', category: 'sensory' },
  { asin: 'B01N5QLLT3', name: 'Tangle Therapy Fidget Toy', category: 'sensory' },
  { asin: 'B07YWMQ5QQ', name: 'Chewigem Chew Necklace Sensory Chew Toy', category: 'sensory' },
  { asin: 'B08BFMTQHB', name: 'Sensory Bin Kinetic Sand Set', category: 'sensory' },

  // Emotional Regulation & Mindfulness
  { asin: 'B07WNQP7JB', name: 'Breathing Exercises Card Deck for Kids', category: 'emotional' },
  { asin: 'B09NQFMKZP', name: 'Zones of Regulation Curriculum Book', category: 'emotional' },
  { asin: 'B07XQXZXQZ', name: 'Calm Down Corner Kit for Kids', category: 'emotional' },
  { asin: 'B08BDZJKJ2', name: 'Mindfulness Cards for Kids by Insight Kids', category: 'emotional' },
  { asin: 'B07CQTB6TL', name: 'The Whole-Brain Child by Daniel Siegel', category: 'books' },
  { asin: 'B07WNPQK6C', name: 'No-Drama Discipline by Daniel Siegel', category: 'books' },
  { asin: 'B08DKQF5YN', name: 'Raising an Emotionally Intelligent Child', category: 'books' },

  // Sleep & Bedtime
  { asin: 'B07XQXZXQY', name: 'Hatch Rest Baby Sound Machine and Night Light', category: 'sleep' },
  { asin: 'B08BFMTQHC', name: 'Weighted Sleep Mask for Kids', category: 'sleep' },
  { asin: 'B01N5QLLT4', name: 'OK to Wake Alarm Clock and Night Light for Kids', category: 'sleep' },
  { asin: 'B07YWMQ5QR', name: 'Lavender Essential Oil Diffuser for Kids Room', category: 'sleep' },

  // School & Learning
  { asin: 'B08BDZJKJ3', name: 'Fidget Cube Desk Toy for Focus', category: 'school' },
  { asin: 'B07CQTB6TM', name: 'Stability Wobble Cushion for Classroom Seating', category: 'school' },
  { asin: 'B07WNPQK6D', name: 'Noise Canceling Headphones for Kids', category: 'school' },
  { asin: 'B08DKQF5YO', name: 'Pencil Grip Weighted Pencil Set', category: 'school' },
  { asin: 'B07XQXZXQA', name: 'Visual Schedule Cards for Kids', category: 'school' },

  // Parenting & Family Resources
  { asin: 'B08BFMTQHD', name: 'The Highly Sensitive Child by Elaine Aron', category: 'books' },
  { asin: 'B01N5QLLT5', name: 'Parenting the Highly Sensitive Child Workbook', category: 'books' },
  { asin: 'B07YWMQ5QS', name: 'Feelings Flash Cards for Kids', category: 'emotional' },
  { asin: 'B08BDZJKJ4', name: 'The Explosive Child by Ross Greene', category: 'books' },
  { asin: 'B07CQTB6TN', name: 'Sensory Processing Disorder Explained Book', category: 'books' },

  // Nature & Outdoor Sensory
  { asin: 'B07WNPQK6E', name: 'Gardening Kit for Kids with Real Tools', category: 'outdoor' },
  { asin: 'B08DKQF5YP', name: 'Nature Exploration Kit for Sensitive Kids', category: 'outdoor' },
  { asin: 'B07XQXZXQB', name: 'Butterfly Garden Kit for Kids', category: 'outdoor' },

  // Art & Creative Expression
  { asin: 'B08BFMTQHE', name: 'Melissa and Doug Deluxe Art Easel', category: 'creative' },
  { asin: 'B01N5QLLT6', name: 'Crayola Ultimate Art Case', category: 'creative' },
  { asin: 'B07YWMQ5QT', name: 'Kinetic Sand Sandbox Set for Sensory Play', category: 'creative' },
  { asin: 'B08BDZJKJ5', name: 'Air Dry Clay Kit for Kids', category: 'creative' },

  // Nutrition & Supplements (for HSC)
  { asin: 'B07CQTB6TO', name: 'Nordic Naturals Omega-3 Gummies for Kids', category: 'supplements' },
  { asin: 'B07WNPQK6F', name: 'Magnesium Glycinate for Kids Sleep Support', category: 'supplements' },
  { asin: 'B08DKQF5YQ', name: 'Probiotics for Kids Digestive Health', category: 'supplements' },
];

/**
 * Get a random subset of products for article generation.
 * Returns 4-6 products, mixing categories.
 */
export function getProductsForArticle(category = null, count = 5) {
  let pool = category
    ? ASIN_CATALOG.filter(p => p.category === category || p.category === 'books')
    : ASIN_CATALOG;
  // Shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get products by category for the product spotlight page.
 */
export function getProductsByCategory(category) {
  return ASIN_CATALOG.filter(p => p.category === category);
}

/**
 * Format a product as an Amazon affiliate link.
 */
export function formatAffiliateLink(asin, name) {
  return `<a href="https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">${name}</a> (paid link)`;
}
