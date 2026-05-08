# OrchidKids.com — Post-Launch Submission Checklist

**Domain:** orchidkids.com  
**Sitemap URL:** https://orchidkids.com/sitemap.xml  
**Amazon Tag:** `spankyspinola-20`  
**Bunny CDN:** https://orchid-kids2.b-cdn.net  

---

## Pre-Launch (Do Before Going Live)

- [ ] Set `SITE_ORIGIN=https://orchidkids.com` in Render environment variables
- [ ] Set `BUNNY_API_KEY=e6cf9995-cda6-4ce8-a4d61093c099-18b2-4e5c` in Render (secret)
- [ ] Set `OPENAI_API_KEY` in Render (secret) — for quarterly article refresh cron
- [ ] Connect `orchidkids.com` domain in Render dashboard → Custom Domains
- [ ] Verify SSL certificate is issued (Render does this automatically)
- [ ] Test https://orchidkids.com/health returns `{"status":"ok"}`
- [ ] Test https://orchidkids.com/sitemap.xml loads correctly
- [ ] Test https://orchidkids.com/robots.txt loads correctly

---

## Search Engine Submission

### Google Search Console
**URL:** https://search.google.com/search-console

1. Click **Add Property** → enter `https://orchidkids.com`
2. Verify ownership via HTML tag (add to `<head>` in `server/ssr.ts`) or DNS TXT record
3. Go to **Sitemaps** → enter `sitemap.xml` → Submit
4. Check **Coverage** tab after 24-48 hours for indexing status

- [ ] Property added and verified
- [ ] Sitemap submitted: `https://orchidkids.com/sitemap.xml`

---

### Bing Webmaster Tools
**URL:** https://www.bing.com/webmasters

1. Sign in with Microsoft account
2. Click **Add a Site** → enter `https://orchidkids.com`
3. Verify via XML file or meta tag
4. Go to **Sitemaps** → submit `https://orchidkids.com/sitemap.xml`
5. Use **URL Submission** to submit your top 5 article URLs immediately

- [ ] Site added and verified
- [ ] Sitemap submitted
- [ ] Top 5 articles submitted via URL Submission

---

### Brave Search
**URL:** https://search.brave.com/webmasters

1. Sign in or create account
2. Add site `https://orchidkids.com`
3. Verify via DNS TXT record or HTML meta tag
4. Submit sitemap URL

- [ ] Site added and verified
- [ ] Sitemap submitted for Brave AI answers indexing

---

### You.com (YouChat Indexing)
**URL:** https://you.com/submit

1. Submit your site URL: `https://orchidkids.com`
2. Submit sitemap: `https://orchidkids.com/sitemap.xml`
3. No account required — simple form submission

- [ ] Site submitted to You.com

---

## AI Search Engines (Auto-Crawl — No Submission Needed)

These crawl automatically based on your `robots.txt` which already allows them:

| Engine | Bot Name | Status |
|---|---|---|
| ChatGPT / SearchGPT | GPTBot | ✅ Auto-crawls via robots.txt |
| Perplexity | PerplexityBot | ✅ Auto-crawls via robots.txt |
| Kagi | KagiBot | ✅ Auto-crawls via robots.txt |
| DuckDuckGo | DuckDuckBot | ✅ Auto-crawls via robots.txt |
| Claude (Anthropic) | Claude-Web | ✅ Auto-crawls via robots.txt |
| Common Crawl | CCBot | ✅ Auto-crawls via robots.txt |

Your `llms.txt` at `https://orchidkids.com/llms.txt` and `llms-full.txt` also help AI engines discover and index your content.

---

## Pinterest Rich Pins

**URL Debugger:** https://developers.pinterest.com/tools/url-debugger/

1. Go to the URL debugger
2. Enter an article URL, e.g.: `https://orchidkids.com/articles/what-is-a-highly-sensitive-child`
3. Click **Validate**
4. Pinterest will read your Open Graph tags (og:image, og:title, og:description)
5. If validation passes, Rich Pins are enabled automatically

Your site already has:
- `og:image` pointing to Bunny CDN WebP images
- `og:title` and `og:description` per article
- `og:type: article`
- `article:published_time` and `article:modified_time`

- [ ] Validate one article URL in Pinterest debugger
- [ ] Confirm Rich Pin validation passes

---

## Amazon Associates Verification

**Tag:** `spankyspinola-20`

All product links in articles use this format:
```
https://www.amazon.com/dp/ASIN?tag=spankyspinola-20
```

**Verified ASINs in use:**

| Product | ASIN | Category |
|---|---|---|
| Sensory Kit | B08BDZJKL9 | Sensory tools |
| Noise-Cancelling Headphones (Kids) | B07Q9MJKBV | School/sensory |
| Weighted Blanket (Kids) | B07KGMZK9F | Sleep |
| Magnesium Glycinate (Kids) | B00BQMKUQ2 | Supplements |
| Omega-3 Fish Oil (Kids) | B001LF39RO | Supplements |
| Lavender Essential Oil | B00P6O4UMK | Calm/sleep |
| Fidget Tools Set | B01N1UE0GY | Sensory/school |
| The Highly Sensitive Child (Book) | B000FBFNBO | Books |
| Calm Kids Journal | B08CXVWMQP | Emotional tools |
| Sensory Swing | B07WNQPVZM | Sensory tools |

- [ ] Verify ASINs are still active on Amazon (check each link)
- [ ] Confirm Amazon Associates account is in good standing
- [ ] Ensure site has required affiliate disclosure (already in Privacy/Disclosure page)

---

## Post-Launch Monitoring (First 30 Days)

- [ ] Check Google Search Console for crawl errors weekly
- [ ] Monitor Render logs for any server errors
- [ ] Verify cron jobs are running (check `/health` endpoint for `cronStatus`)
- [ ] Check Bunny CDN bandwidth usage in Bunny dashboard
- [ ] Verify article date-gating is working (new articles appear at 3/day)

---

## Optional Enhancements (After Launch)

- [ ] Add Google Analytics 4 or Plausible Analytics
- [ ] Set up Google Search Console email alerts for coverage issues
- [ ] Submit to Bing's IndexNow API for instant indexing of new articles
- [ ] Create Pinterest boards for each article category
- [ ] Set up a newsletter capture (Mailchimp/ConvertKit integration)
- [ ] Add Cloudflare in front of Render for additional CDN/security layer

---

## Quick Reference — Key URLs

| URL | Purpose |
|---|---|
| https://orchidkids.com/ | Homepage |
| https://orchidkids.com/sitemap.xml | XML sitemap (531 articles + images) |
| https://orchidkids.com/robots.txt | Robots file |
| https://orchidkids.com/llms.txt | AI engine index |
| https://orchidkids.com/llms-full.txt | Full AI engine index |
| https://orchidkids.com/ai.txt | AI permissions file |
| https://orchidkids.com/health | Server health check |
| https://orchidkids.com/assessments | 9 assessments |
| https://orchidkids.com/supplements | Supplements & herbs page |
| https://orchidkids.com/recommended | Recommended products |
