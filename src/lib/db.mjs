import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[db] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Initialize database schema — idempotent, safe to run on every startup.
 */
export async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS articles (
      id              SERIAL PRIMARY KEY,
      slug            TEXT NOT NULL UNIQUE,
      title           TEXT NOT NULL,
      meta_description TEXT,
      og_title        TEXT,
      og_description  TEXT,
      category        TEXT NOT NULL DEFAULT 'general',
      tags            TEXT[] NOT NULL DEFAULT '{}',
      image_alt       TEXT,
      reading_time    INT DEFAULT 7,
      author          TEXT NOT NULL DEFAULT 'The Oracle Lover',
      body            TEXT NOT NULL,
      word_count      INT,
      hero_url        TEXT,
      status          TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued', 'published')),
      queued_at       TIMESTAMPTZ DEFAULT NOW(),
      published_at    TIMESTAMPTZ,
      last_modified_at TIMESTAMPTZ DEFAULT NOW(),
      asins_used      TEXT[] NOT NULL DEFAULT '{}',
      internal_links_used TEXT[] NOT NULL DEFAULT '{}',
      cta_primary     TEXT,
      opener_type     TEXT,
      conclusion_type TEXT,
      faq_count       INT DEFAULT 0
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS articles_status_published_at
      ON articles (status, published_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS articles_status_queued_at
      ON articles (status, queued_at)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS articles_category
      ON articles (category)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id          SERIAL PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      description TEXT,
      questions   JSONB NOT NULL DEFAULT '[]',
      scoring     JSONB NOT NULL DEFAULT '{}',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS assessment_results (
      id            SERIAL PRIMARY KEY,
      assessment_id INT REFERENCES assessments(id),
      session_id    TEXT,
      answers       JSONB NOT NULL DEFAULT '{}',
      score         INT,
      result_label  TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log('[db] Schema initialized');
}
