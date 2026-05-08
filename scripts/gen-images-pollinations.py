#!/usr/bin/env python3
"""
gen-images-pollinations.py
Generates unique hero images using Pollinations.ai (free, no auth),
uploads each to Bunny CDN as library/lib-NNN.webp, updates seed-articles.json.

Run: python3 scripts/gen-images-pollinations.py
Resume: just run again — progress is saved after each success
"""
import json
import time
import sys
import urllib.parse
import requests
from pathlib import Path
from io import BytesIO
from PIL import Image

# ── Config ───────────────────────────────────────────────────────────────────
BUNNY_API_KEY   = 'e6cf9995-cda6-4ce8-a4d61093c099-18b2-4e5c'
BUNNY_ZONE      = 'orchid-kids2'
BUNNY_HOSTNAME  = 'ny.storage.bunnycdn.com'
BUNNY_PULL_ZONE = 'https://orchid-kids2.b-cdn.net'
SEED_PATH       = Path(__file__).parent / 'seed-articles.json'
PROMPTS_PATH    = Path(__file__).parent / 'image-prompts.json'
PROGRESS_PATH   = Path(__file__).parent / 'image-gen-progress.json'
RETRY_LIMIT     = 4
IMG_WIDTH       = 1344
IMG_HEIGHT      = 768
DELAY_BETWEEN   = 3   # seconds between requests

# ── Category visual styles ────────────────────────────────────────────────────
CATEGORY_STYLES = {
    'understanding-hsc':
        'soft watercolor illustration of a thoughtful sensitive child in a peaceful garden with pink orchid flowers, warm pastel peach and rose tones, gentle light',
    'neuroscience':
        'elegant scientific watercolor illustration of glowing neural pathways and soft brain imagery, blue and lavender tones, orchid flower motif, ethereal light',
    'parenting-strategies':
        'warm watercolor illustration of a loving parent gently holding a child, cozy home setting, golden afternoon light, orchid flowers on windowsill',
    'school-social':
        'gentle watercolor illustration of a sensitive child in a nurturing classroom or garden, soft green and yellow tones, orchid flowers, peaceful atmosphere',
    'sensory-environment':
        'serene watercolor illustration of a calm cozy sensory-friendly bedroom nook, soft textures, muted earth tones, orchid plant, warm lamp light',
    'emotional-wellbeing':
        'tender watercolor illustration of a child expressing emotions with a caring adult nearby, soft rose and lavender tones, orchid flowers, warm and safe feeling',
    'family-dynamics':
        'warm watercolor illustration of a family sitting together in a cozy living room, soft natural light, orchid flowers in background, connected and peaceful',
    'tools-resources':
        'gentle watercolor flat-lay illustration of helpful books, a journal, and natural objects on a wooden table, soft pastels, orchid sprig accent',
    'long-term-outcomes':
        'hopeful watercolor illustration of a young person flourishing in a sunlit garden full of orchids, sunrise golden tones, growth and possibility',
}
DEFAULT_STYLE = 'soft watercolor illustration of a peaceful garden with orchid flowers, warm pastel tones, nurturing and gentle atmosphere'


def make_prompt(title, category):
    style = CATEGORY_STYLES.get(category, DEFAULT_STYLE)
    return (
        f"{style}, inspired by the theme of \"{title}\", "
        f"horizontal landscape blog hero image, "
        f"professional illustration, beautiful composition, "
        f"absolutely no text no words no letters no numbers"
    )


def fetch_image(prompt, seed):
    """Fetch image from Pollinations.ai and return bytes."""
    encoded = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={IMG_WIDTH}&height={IMG_HEIGHT}"
        f"&nologo=true&enhance=true&model=flux&seed={seed}"
    )
    for attempt in range(RETRY_LIMIT):
        try:
            resp = requests.get(url, timeout=120)
            if resp.status_code == 200 and len(resp.content) > 10000:
                return resp.content
            elif resp.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"    [rate-limit] waiting {wait}s...", flush=True)
                time.sleep(wait)
            else:
                print(f"    [retry {attempt+1}] status={resp.status_code}", flush=True)
                time.sleep(8)
        except Exception as e:
            print(f"    [exception attempt {attempt+1}] {e}", flush=True)
            time.sleep(15)
    return None


def to_webp(image_bytes):
    """Convert image bytes to WebP."""
    try:
        img = Image.open(BytesIO(image_bytes))
        buf = BytesIO()
        img.convert('RGB').save(buf, format='WEBP', quality=85)
        return buf.getvalue()
    except Exception as e:
        print(f"    [webp-convert] {e}", flush=True)
        return image_bytes


def upload_to_bunny(filename, webp_bytes):
    """Upload WebP bytes to Bunny CDN library folder."""
    url = f'https://{BUNNY_HOSTNAME}/{BUNNY_ZONE}/library/{filename}'
    for attempt in range(3):
        try:
            resp = requests.put(
                url,
                headers={'AccessKey': BUNNY_API_KEY, 'Content-Type': 'image/webp'},
                data=webp_bytes,
                timeout=60,
            )
            if resp.status_code in (200, 201):
                return f'{BUNNY_PULL_ZONE}/library/{filename}'
            else:
                print(f"    [bunny retry {attempt+1}] {resp.status_code}", flush=True)
                time.sleep(5)
        except Exception as e:
            print(f"    [bunny exception] {e}", flush=True)
            time.sleep(5)
    raise Exception(f'Bunny upload failed for {filename}')


def main():
    # Load prompts
    prompts = json.loads(PROMPTS_PATH.read_text())
    total = len(prompts)
    print(f"Total articles: {total}", flush=True)

    # Load progress (resume support)
    progress = {}
    if PROGRESS_PATH.exists():
        progress = json.loads(PROGRESS_PATH.read_text())
        print(f"Already done: {len(progress)}", flush=True)

    # Filter out already completed
    todo = [p for p in prompts if str(p['index']) not in progress]
    print(f"Remaining: {len(todo)}", flush=True)
    print(f"Estimated time: ~{len(todo) * 35 // 60} minutes", flush=True)
    print(flush=True)

    failed = []

    for i, item in enumerate(todo):
        idx      = item['index']
        title    = item['title']
        category = item['category']
        filename = item['filename']
        prompt   = make_prompt(title, category)
        seed     = idx + 1000

        print(f"  [{i+1}/{len(todo)}] #{idx+1} {title[:55]}...", flush=True)

        image_bytes = fetch_image(prompt, seed)
        if not image_bytes:
            print(f"    ❌ FAILED", flush=True)
            failed.append(idx)
            time.sleep(DELAY_BETWEEN)
            continue

        webp_bytes = to_webp(image_bytes)

        try:
            cdn_url = upload_to_bunny(filename, webp_bytes)
            progress[str(idx)] = cdn_url
            PROGRESS_PATH.write_text(json.dumps(progress, indent=2))
            print(f"    ✅ {filename}", flush=True)
        except Exception as e:
            print(f"    ❌ Upload: {e}", flush=True)
            failed.append(idx)

        # Rate limit protection
        time.sleep(DELAY_BETWEEN)

        # Progress report every 50
        if (i + 1) % 50 == 0:
            print(f"\n  === {i+1}/{len(todo)} done, {len(failed)} failed ===\n", flush=True)

    # Update seed-articles.json
    articles = json.loads(SEED_PATH.read_text())
    updated = 0
    for str_idx, url in progress.items():
        i = int(str_idx)
        if i < len(articles) and url:
            articles[i]['hero_url'] = url
            updated += 1
    SEED_PATH.write_text(json.dumps(articles, indent=2))

    # Final report
    image_set = set(a.get('hero_url', '') for a in articles)
    print(f"\n✅ Updated {updated} articles in seed-articles.json", flush=True)
    print(f"Unique images: {len(image_set)}", flush=True)
    if failed:
        print(f"Failed ({len(failed)}): {failed[:20]}", flush=True)
    else:
        print("All images generated successfully!", flush=True)


if __name__ == '__main__':
    main()
