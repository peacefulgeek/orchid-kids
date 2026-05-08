#!/usr/bin/env node
/**
 * upload-site-heroes.mjs
 * Uploads the 10 site hero WebP images to Bunny CDN under /site/
 * then prints the CDN URLs for updating the codebase.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');

const BUNNY_API_KEY  = 'e6cf9995-cda6-4ce8-a4d61093c099-18b2-4e5c';
const BUNNY_ZONE     = 'orchid-kids2';
const BUNNY_HOSTNAME = 'ny.storage.bunnycdn.com';
const BUNNY_PULL     = 'https://orchid-kids2.b-cdn.net';

async function upload(localPath, remoteName) {
  const bytes = readFileSync(localPath);
  const url = `https://${BUNNY_HOSTNAME}/${BUNNY_ZONE}/site/${remoteName}`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_API_KEY, 'Content-Type': 'image/webp' },
    body: bytes,
  });
  if (resp.status === 200 || resp.status === 201) {
    return `${BUNNY_PULL}/site/${remoteName}`;
  }
  throw new Error(`Upload failed: ${resp.status} for ${remoteName}`);
}

const webpDir = join(root, 'public/images-webp');
const files = readdirSync(webpDir).filter(f => f.endsWith('.webp'));

console.log(`Uploading ${files.length} site hero images to Bunny CDN...`);
const mapping = {};

for (const file of files) {
  const localPath = join(webpDir, file);
  // site_hero-home.webp → site-hero-home.webp
  const remoteName = file.replace('site_', '');
  try {
    const cdnUrl = await upload(localPath, remoteName);
    mapping[file] = cdnUrl;
    console.log(`  ✅ ${file} → ${cdnUrl}`);
  } catch (err) {
    console.error(`  ❌ ${file}: ${err.message}`);
  }
}

console.log('\n=== CDN URL Mapping ===');
for (const [local, cdn] of Object.entries(mapping)) {
  // Extract the key name: site_hero-home.webp → hero-home
  const key = local.replace('site_', '').replace('.webp', '');
  console.log(`  '${key}': '${cdn}',`);
}
