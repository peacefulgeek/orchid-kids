# 🌸 Raising Orchids

**The research-backed, shame-free resource for parents of highly sensitive children.**

A beautiful, full-featured content site built with React + TypeScript + Express, deployable to DigitalOcean App Platform with optional PostgreSQL and Bunny CDN.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + React Router v6 |
| Build | Vite 5 (client) + esbuild (server) |
| Server | Express + compression + SSR |
| Database | PostgreSQL via `pg` (optional — falls back to JSON) |
| CDN | Bunny CDN (optional — configure `BUNNY_*` env vars) |
| Deployment | DigitalOcean App Platform |
| Styling | Pure CSS with design tokens (no Tailwind) |

---

## Project Structure

```
raising-orchids/
├── .do/                    # DigitalOcean App Platform config
│   └── app.yaml
├── dist/                   # Built output (git-ignored)
│   ├── client/             # Vite client build
│   └── index.js            # esbuild server bundle
├── public/                 # Static assets
│   └── images/             # Hero images (10 images)
├── scripts/
│   ├── build-server.mjs    # esbuild server bundler
│   ├── cron.mjs            # Article date-gating cron
│   ├── seed.mjs            # Database seeder
│   ├── seed-articles.json  # 31 articles + 5 assessments data
│   └── start-with-cron.mjs # Production entry with cron
├── server/
│   ├── index.ts            # Express server entry
│   ├── ssr.ts              # SSR renderer
│   └── routes/             # API routes
│       ├── articles.ts
│       ├── assessments.ts
│       ├── health.ts
│       ├── sitemap.ts
│       ├── robots.ts
│       └── llms.ts
├── src/
│   ├── client/
│   │   ├── App.tsx         # React router + routes
│   │   ├── entry-client.tsx
│   │   ├── components/     # Shared components
│   │   ├── pages/          # Route pages
│   │   └── styles/         # CSS design tokens + global styles
│   └── lib/
│       ├── articleStore.mjs    # File-based article store (no-DB fallback)
│       ├── assessmentStore.mjs # File-based assessment store
│       ├── db.mjs              # PostgreSQL connection
│       ├── bunny.mjs           # Bunny CDN uploader
│       ├── aeo.mjs             # AEO / llms.txt helpers
│       └── articleJsonLd.mjs   # JSON-LD schema helpers
├── index.html              # Vite HTML template
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install & Dev

```bash
pnpm install
pnpm dev          # Starts Vite dev server on :5173
```

### Build & Production

```bash
pnpm build        # Builds client + server
pnpm start        # Starts production server on :3000
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `production` or `development` |
| `DATABASE_URL` | No | PostgreSQL connection string. If absent, falls back to JSON file store |
| `SITE_ORIGIN` | No | Canonical origin (e.g. `https://raisingorchids.com`) |
| `BUNNY_STORAGE_ZONE` | No | Bunny CDN storage zone name |
| `BUNNY_API_KEY` | No | Bunny CDN API key |
| `BUNNY_CDN_URL` | No | Bunny CDN pull zone URL |

---

## Database (Optional)

The site works **without a database** — it reads from `scripts/seed-articles.json` directly.

To use PostgreSQL:

1. Set `DATABASE_URL` in your environment
2. Run the seeder: `node scripts/seed.mjs`

The server auto-creates the schema on first start.

---

## DigitalOcean Deployment

The `.do/app.yaml` is pre-configured. To deploy:

1. Push this repo to GitHub
2. Create a new App in DigitalOcean App Platform
3. Connect your GitHub repo
4. DigitalOcean will auto-detect `.do/app.yaml`
5. Add environment variables in the App settings
6. Deploy

### Adding a Database

In DigitalOcean App Platform:
1. Add a PostgreSQL database component to your app
2. The `DATABASE_URL` will be auto-injected
3. On first deploy, the schema is created automatically
4. Run the seeder via the Console: `node scripts/seed.mjs`

---

## Bunny CDN (Optional)

When `BUNNY_*` environment variables are set, the server will:
- Upload images to Bunny CDN on seed
- Serve images from the CDN URL instead of local `/images/`

To add Bunny CDN later:
1. Create a storage zone in Bunny
2. Create a pull zone pointing to the storage zone
3. Set `BUNNY_STORAGE_ZONE`, `BUNNY_API_KEY`, and `BUNNY_CDN_URL`

---

## Content

### Articles (31)

Articles are organized into 8 categories:

| Category | Count |
|---|---|
| Parenting Strategies | 5 |
| Sensory & Environment | 5 |
| Emotional Wellbeing | 4 |
| Understanding HSC | 3 |
| Neuroscience | 3 |
| School & Social | 3 |
| Tools & Resources | 3 |
| Family Dynamics | 3 |
| Long-Term Outcomes | 2 |

### Assessments (5)

1. **Is My Child Highly Sensitive?** — 15 questions, ~5 min
2. **Sensory Sensitivity Profile** — 20 questions, ~7 min
3. **Emotional Regulation Readiness** — 12 questions, ~5 min
4. **School Environment Fit** — 14 questions, ~6 min
5. **Are You a Sensitive Parent?** — 12 questions, ~5 min

---

## SEO / AEO

- Sitemap at `/sitemap.xml`
- Robots at `/robots.txt`
- LLMs.txt at `/llms.txt`
- JSON-LD Article schema on every article page
- Canonical URLs injected server-side
- Reading progress bar
- Breadcrumb navigation

---

## License

Private — all rights reserved.
