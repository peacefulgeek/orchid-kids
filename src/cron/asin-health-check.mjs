/**
 * Cron: asin-health-check.mjs
 * Checks that all ASINs in the catalog return valid Amazon product pages.
 * Runs Sunday 05:00 UTC.
 * Logs any dead ASINs for manual review.
 */
import { ASIN_CATALOG, AMAZON_TAG } from '../lib/asin-catalog.mjs';

export async function runAsinHealthCheck() {
  console.log(`[asin-health-check] Checking ${ASIN_CATALOG.length} ASINs...`);
  const dead = [];
  const ok = [];

  for (const product of ASIN_CATALOG) {
    const url = `https://www.amazon.com/dp/${product.asin}?tag=${AMAZON_TAG}`;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OrchidKids/1.0; +https://orchidkids.com)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 200 || res.status === 301 || res.status === 302) {
        ok.push(product.asin);
      } else if (res.status === 404) {
        dead.push({ asin: product.asin, name: product.name, status: res.status });
        console.warn(`[asin-health-check] DEAD: ${product.asin} (${product.name}) — ${res.status}`);
      } else {
        // 503, 429 etc — Amazon rate limiting, not a dead ASIN
        ok.push(product.asin);
      }
    } catch (err) {
      console.warn(`[asin-health-check] Error checking ${product.asin}: ${err.message}`);
    }
    // Rate limit: 500ms between checks
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[asin-health-check] Done: ${ok.length} OK, ${dead.length} dead.`);
  if (dead.length > 0) {
    console.error('[asin-health-check] Dead ASINs:', JSON.stringify(dead));
  }
  return { ok, dead };
}
