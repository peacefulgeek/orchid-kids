/**
 * Hard Rules Prompt Block — Section 12C
 * Injected into every article generation prompt.
 */
export function buildHardRulesPrompt({ products, internalLinks }) {
  const productList = products.map(p =>
    `  - ASIN ${p.asin}: ${p.name}`
  ).join('\n');

  const internalList = internalLinks.map(l =>
    `  - "${l.title}" -> /articles/${l.slug}`
  ).join('\n');

  return `HARD RULES for this article:

WORD COUNT
- 1,600 to 2,000 words (strict; under 1,200 or over 2,500 = regenerate)

NEVER USE EM-DASHES OR EN-DASHES
- Zero (--) (-). Use commas, periods, colons, parentheses, or " - " (hyphen with spaces).
- No em-dashes. No em-dashes. No em-dashes.

NEVER USE THESE WORDS
delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize,
pivotal, embark, underscore, paramount, seamlessly, robust, beacon,
foster, elevate, curate, curated, bespoke, resonate, harness, intricate,
plethora, myriad, comprehensive, transformative, groundbreaking,
innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving,
profound, holistic, nuanced, multifaceted, stakeholders, ecosystem,
landscape, realm, sphere, domain, arguably, notably, crucially,
importantly, essentially, fundamentally, inherently, intrinsically,
substantively, streamline, optimize, facilitate, amplify, catalyze,
propel, spearhead, orchestrate, navigate, traverse, furthermore,
moreover, additionally, consequently, subsequently, thereby.

NEVER USE THESE PHRASES
"it's important to note", "it's worth noting", "in conclusion,",
"in summary,", "in the realm of", "dive deep into", "delve into",
"at the end of the day", "in today's fast-paced world",
"in today's digital age", "plays a crucial role", "a testament to",
"when it comes to", "cannot be overstated", "needless to say",
"first and foremost", "last but not least".

VOICE
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long. Some three words.
- Direct address ("you") OR first-person ("I/we/my/our") throughout. Pick one and commit.
- Include at least 2 conversational openers from this list:
  "Here's the thing,", "Honestly,", "Look,", "Truth is,",
  "But here's what's interesting,", "Think about it,", "That said,",
  "Right?!", "Know what I mean?", "Does that land?",
  "How does that make you feel?".
- Concrete specifics over abstractions. A name. A number. A moment.

E-E-A-T STRUCTURE (mandatory)
- Open with a 3-sentence TL;DR block, wrapped exactly as:
  <section data-tldr="ai-overview" aria-label="In short">
    <p>Sentence one. Sentence two. Sentence three.</p>
  </section>
- Include at least one self-referencing line that anchors first-hand knowledge,
  using one of these patterns: "In our experience on this site...",
  "Across the dozens of articles we've published on [topic]...",
  "When I tested...", "Over the years I've seen...", "In my own practice...".
- Include at least 3 internal links to other articles on this site.
  Use natural anchor text drawn from this list (vary the anchors, do not
  reuse the same anchor for two links):
${internalList}
- Include at least 1 outbound link to an authoritative source
  (.gov, .edu, peer-reviewed journal, NIH, CDC, WHO, Nature, ScienceDirect,
  PubMed). The link is rel="nofollow noopener" and opens in a new tab.
- End with an author byline block, exactly:
  <aside class="author-byline" data-eeat="author">
    <p><strong>Reviewed by Dr. Maya Chen</strong>, Child Development Specialist.
    Last updated <time datetime="YYYY-MM-DD">Month DD, YYYY</time>.</p>
    <p>[1-2 sentences of self-referencing context]</p>
  </aside>

AMAZON AFFILIATE LINKS
- Exactly 3 or 4 Amazon affiliate links embedded naturally in prose.
- Each formatted as:
  <a href="https://www.amazon.com/dp/ASIN?tag=spankyspinola-20"
     target="_blank" rel="nofollow sponsored noopener">Product Name</a>
  followed by " (paid link)" in plain text.
- Use ONLY ASINs from this catalog (do not invent ASINs):
${productList}

NO EM-DASHES. NO EM-DASHES. NO EM-DASHES.`;
}
