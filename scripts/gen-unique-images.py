#!/usr/bin/env python3
"""
gen-unique-images.py
Generates 491 unique hero images for orchid-kids articles using OpenAI gpt-image-1,
uploads each to Bunny CDN as library/lib-NNN.webp, and updates seed-articles.json.

Run: python3 scripts/gen-unique-images.py
"""
import os
import json
import time
import base64
import requests
import concurrent.futures
from pathlib import Path
from io import BytesIO
from PIL import Image

# ── Config ──────────────────────────────────────────────────────────────────
OPENAI_API_KEY   = os.environ.get('OPENAI_API_KEY', '')
BUNNY_API_KEY    = 'e6cf9995-cda6-4ce8-a4d61093c099-18b2-4e5c'
BUNNY_ZONE       = 'orchid-kids2'
BUNNY_HOSTNAME   = 'ny.storage.bunnycdn.com'
BUNNY_PULL_ZONE  = 'https://orchid-kids2.b-cdn.net'
SEED_PATH        = Path(__file__).parent / 'seed-articles.json'
PROMPTS_PATH     = Path(__file__).parent / 'image-prompts.json'
PROGRESS_PATH    = Path(__file__).parent / 'image-gen-progress.json'
MAX_WORKERS      = 5   # parallel threads (OpenAI rate limit friendly)
RETRY_LIMIT      = 3

# ── Category visual styles ───────────────────────────────────────────────────
CATEGORY_STYLES = {
    'understanding-hsc':   'soft watercolor illustration, thoughtful child in a peaceful garden with orchid flowers, warm pastel tones, no text',
    'neuroscience':        'elegant scientific illustration, neural pathways and soft brain imagery, blue and lavender tones, orchid motif, no text',
    'parenting-strategies':'warm illustration of parent and child connection, cozy home, golden light, orchid flowers, no text',
    'school-social':       'gentle illustration of children in a nurturing classroom or playground, soft colors, orchid accent, no text',
    'sensory-environment': 'serene illustration of a calm sensory-friendly space, soft textures, muted earth tones, orchid flowers, no text',
    'emotional-wellbeing': 'tender watercolor illustration of emotional comfort and warmth, rose and lavender tones, no text',
    'family-dynamics':     'warm family scene illustration, cozy and connected, soft natural light, orchid flowers, no text',
    'tools-resources':     'gentle flat-lay illustration of helpful books and tools, soft pastels, orchid accent, no text',
    'long-term-outcomes':  'hopeful illustration of a flourishing orchid child growing into potential, sunrise tones, soft watercolor, no text',
}
DEFAULT_STYLE = 'soft watercolor illustration, orchid flowers, warm pastel tones, peaceful and nurturing, no text'

def make_prompt(title, category):
    style = CATEGORY_STYLES.get(category, DEFAULT_STYLE)
    return (
        f"A beautiful hero image for a parenting article titled \"{title}\". "
        f"Style: {style}. "
        f"Horizontal landscape format (1792x1024), suitable as a blog article hero. "
        f"High quality, professional, warm and inviting. "
        f"Absolutely no text, words, letters, or numbers anywhere in the image."
    )

def generate_image(prompt, retries=RETRY_LIMIT):
    """Call OpenAI gpt-image-1 and return raw PNG bytes."""
    for attempt in range(retries):
        try:
            resp = requests.post(
                'https://api.openai.com/v1/images/generations',
                headers={
                    'Authorization': f'Bearer {OPENAI_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'gpt-image-1',
                    'prompt': prompt,
                    'n': 1,
                    'size': '1792x1024',
                    'quality': 'medium',
                    'output_format': 'webp',
                },
                timeout=120,
            )
            if resp.status_code == 200:
                data = resp.json()
                # gpt-image-1 returns base64 by default
                b64 = data['data'][0].get('b64_json') or data['data'][0].get('url')
                if b64 and not b64.startswith('http'):
                    return base64.b64decode(b64)
                elif b64 and b64.startswith('http'):
                    # URL response — download it
                    img_resp = requests.get(b64, timeout=60)
                    return img_resp.content
            elif resp.status_code == 429:
                wait = 20 * (attempt + 1)
                print(f"  [rate-limit] waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [openai error] {resp.status_code}: {resp.text[:200]}")
                time.sleep(5)
        except Exception as e:
            print(f"  [exception] attempt {attempt+1}: {e}")
            time.sleep(5)
    return None

def to_webp(image_bytes):
    """Convert any image bytes to WebP format."""
    try:
        img = Image.open(BytesIO(image_bytes))
        buf = BytesIO()
        img.convert('RGB').save(buf, format='WEBP', quality=85)
        return buf.getvalue()
    except Exception as e:
        print(f"  [webp-convert] {e}")
        return image_bytes

def upload_to_bunny(filename, webp_bytes):
    """Upload WebP bytes to Bunny CDN library folder."""
    url = f'https://{BUNNY_HOSTNAME}/{BUNNY_ZONE}/library/{filename}'
    resp = requests.put(
        url,
        headers={'AccessKey': BUNNY_API_KEY, 'Content-Type': 'image/webp'},
        data=webp_bytes,
        timeout=60,
    )
    if resp.status_code in (200, 201):
        return f'{BUNNY_PULL_ZONE}/library/{filename}'
    else:
        raise Exception(f'Bunny upload {resp.status_code}: {resp.text[:100]}')

def process_article(item):
    """Generate image for one article and upload to CDN. Returns (index, cdn_url) or (index, None)."""
    idx       = item['index']
    slug      = item['slug']
    title     = item['title']
    category  = item['category']
    filename  = item['filename']  # e.g. lib-041.webp
    cdn_url   = f'{BUNNY_PULL_ZONE}/library/{filename}'

    prompt = make_prompt(title, category)

    print(f"  [{idx+1:03d}] Generating: {title[:55]}...")
    image_bytes = generate_image(prompt)
    if not image_bytes:
        print(f"  [{idx+1:03d}] FAILED to generate — skipping")
        return (idx, None)

    webp_bytes = to_webp(image_bytes)

    try:
        url = upload_to_bunny(filename, webp_bytes)
        print(f"  [{idx+1:03d}] ✅ Uploaded → {filename}")
        return (idx, url)
    except Exception as e:
        print(f"  [{idx+1:03d}] Upload failed: {e}")
        return (idx, None)

def main():
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not set")
        return

    # Load prompts
    prompts = json.loads(PROMPTS_PATH.read_text())
    print(f"Total articles to process: {len(prompts)}")

    # Load progress (resume support)
    progress = {}
    if PROGRESS_PATH.exists():
        progress = json.loads(PROGRESS_PATH.read_text())
        print(f"Resuming — {len(progress)} already done")

    # Filter out already completed
    todo = [p for p in prompts if str(p['index']) not in progress]
    print(f"Remaining: {len(todo)}")

    if not todo:
        print("All done!")
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(process_article, item): item for item in todo}
            for future in concurrent.futures.as_completed(futures):
                idx, url = future.result()
                if url:
                    progress[str(idx)] = url
                    # Save progress after each success
                    PROGRESS_PATH.write_text(json.dumps(progress, indent=2))

    # Update seed-articles.json with new URLs
    articles = json.loads(SEED_PATH.read_text())
    updated = 0
    for str_idx, url in progress.items():
        i = int(str_idx)
        if i < len(articles) and url:
            articles[i]['hero_url'] = url
            updated += 1

    SEED_PATH.write_text(json.dumps(articles, indent=2))
    print(f"\n✅ Updated {updated} articles in seed-articles.json")

    # Final stats
    image_set = set(a.get('hero_url', '') for a in articles)
    print(f"Unique images now: {len(image_set)}")
    failed = [str(p['index']) for p in prompts if str(p['index']) not in progress]
    if failed:
        print(f"Failed ({len(failed)}): {failed[:10]}")

if __name__ == '__main__':
    main()
