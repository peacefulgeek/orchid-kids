// Bunny CDN config for orchid-kids2 storage zone
// Storage zone: orchid-kids2 | Pull zone: orchid-kids2.b-cdn.net | Region: New York
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'orchid-kids2';
const BUNNY_API_KEY      = process.env.BUNNY_API_KEY || 'e6cf9995-cda6-4ce8-a4d61093c099-18b2-4e5c';
const BUNNY_PULL_ZONE    = process.env.BUNNY_PULL_ZONE || 'https://orchid-kids2.b-cdn.net';
const BUNNY_HOSTNAME     = process.env.BUNNY_HOSTNAME || 'ny.storage.bunnycdn.com';

export { BUNNY_PULL_ZONE, BUNNY_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_HOSTNAME };

/**
 * Pick a random library image (lib-01 through lib-40), copy it to
 * /images/{slug}.webp, and return the public CDN URL.
 * Falls back to the library URL itself if the copy upload fails.
 */
export async function assignHeroImage(slug) {
  const idx = String(Math.floor(Math.random() * 40) + 1).padStart(2, '0');
  const sourceFile = `lib-${idx}.webp`;
  const destFile   = `${slug}.webp`;

  try {
    const sourceUrl = `${BUNNY_PULL_ZONE}/library/${sourceFile}`;
    const downloadRes = await fetch(sourceUrl);
    if (!downloadRes.ok) throw new Error(`download ${downloadRes.status}`);
    const imageBuffer = await downloadRes.arrayBuffer();

    const uploadUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/images/${destFile}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': 'image/webp' },
      body: imageBuffer,
    });
    if (!uploadRes.ok) throw new Error(`upload ${uploadRes.status}`);
    return `${BUNNY_PULL_ZONE}/images/${destFile}`;
  } catch (err) {
    console.warn(`[bunny.assignHeroImage] copy failed (${err.message}), falling back to library URL`);
    return `${BUNNY_PULL_ZONE}/library/${sourceFile}`;
  }
}

/**
 * Upload an arbitrary WebP buffer to a target path under the storage zone.
 */
export async function uploadWebP(targetPath, buffer) {
  const url = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${targetPath.replace(/^\//, '')}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': 'image/webp' },
    body: buffer,
  });
  if (!res.ok) throw new Error(`bunny upload ${res.status} for ${targetPath}`);
  return `${BUNNY_PULL_ZONE}/${targetPath.replace(/^\//, '')}`;
}

/**
 * Upload a site UI asset (hero, OG image, etc.) to Bunny under /site/{filename}
 */
export async function uploadSiteAsset(filename, buffer, contentType = 'image/webp') {
  const url = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/site/${filename}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': contentType },
    body: buffer,
  });
  if (!res.ok) throw new Error(`bunny site asset upload ${res.status} for ${filename}`);
  return `${BUNNY_PULL_ZONE}/site/${filename}`;
}

/**
 * List files in a Bunny storage directory.
 */
export async function listBunnyDir(dir = '') {
  const path = dir ? `/${dir}/` : '/';
  const url = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}${path}`;
  const res = await fetch(url, { headers: { AccessKey: BUNNY_API_KEY } });
  if (!res.ok) return [];
  return await res.json();
}

/**
 * Delete a file from Bunny storage.
 */
export async function deleteBunnyFile(remotePath) {
  const url = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${remotePath.replace(/^\//, '')}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: BUNNY_API_KEY }
  });
  return res.ok;
}
