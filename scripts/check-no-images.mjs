#!/usr/bin/env node
/**
 * check-no-images.mjs
 * Ensures no large image files are committed to the repo.
 * Images should live on Bunny CDN, not in the git repo.
 */
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.svg']);
const MAX_SIZE_KB = 50; // SVGs under 50KB are fine (favicon etc.)
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', '.pnpm-store']);

function walk(dir) {
  let violations = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return violations;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      violations = violations.concat(walk(fullPath));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const stat = statSync(fullPath);
        const sizeKB = stat.size / 1024;
        // Allow small SVGs (favicon, icons) but flag large images
        if (ext !== '.svg' || sizeKB > MAX_SIZE_KB) {
          violations.push({ path: fullPath.replace(root + '/', ''), sizeKB: sizeKB.toFixed(1) });
        }
      }
    }
  }
  return violations;
}

const violations = walk(root);

if (violations.length > 0) {
  console.error('\n❌ Large image files found in repo (should be on Bunny CDN):');
  violations.forEach(v => console.error(`   ${v.path} (${v.sizeKB} KB)`));
  console.error('\nUpload images to Bunny CDN and reference them via https://orchid-kids2.b-cdn.net/\n');
  process.exit(1);
} else {
  console.log('✅ No large images in repo — all images on CDN');
}
