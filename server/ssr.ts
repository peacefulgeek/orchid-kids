import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.resolve(__dirname, '../dist/client');

let indexHtml: string;

function getIndexHtml(): string {
  if (!indexHtml) {
    indexHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8');
  }
  return indexHtml;
}

export async function renderPage(req: Request, res: Response) {
  try {
    const html = getIndexHtml();

    // Inject canonical URL and basic meta
    const origin = process.env.SITE_ORIGIN || 'https://raisingorchids.com';
    const url = req.url.split('?')[0].replace(/\/$/, '') || '/';
    const canonical = `${origin}${url}`;

    const finalHtml = html.replace(
      '</head>',
      `<link rel="canonical" href="${canonical}" />\n</head>`
    );

    res.status(200).type('html').send(finalHtml);
  } catch (err) {
    console.error('[ssr] render error:', err);
    res.status(500).send('Server error');
  }
}
