import express from 'express';

export const assessmentsRouter = express.Router();

async function getStore() {
  if (process.env.DATABASE_URL) {
    const { query } = await import('../../src/lib/db.mjs' as any);
    return { mode: 'db', query };
  } else {
    const store = await import('../../src/lib/assessmentStore.mjs' as any);
    return { mode: 'file', store };
  }
}

// GET /api/assessments — list all assessments
assessmentsRouter.get('/', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;

    if (mode === 'file') {
      return res.json(store.getAssessments());
    }

    const { rows } = await query(
      `SELECT id, slug, title, description, category, questions, scoring, created_at
       FROM assessments ORDER BY created_at ASC`
    );
    const parsed = rows.map((r: any) => ({
      ...r,
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
      scoring: typeof r.scoring === 'string' ? JSON.parse(r.scoring) : r.scoring,
    }));
    res.json(parsed);
  } catch (err) {
    console.error('[assessments] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/assessments/results — save a result (graceful no-op without DB)
assessmentsRouter.post('/results', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      // No DB — just acknowledge
      return res.json({ ok: true, saved: false, message: 'Results acknowledged (no database configured)' });
    }

    const { query } = await import('../../src/lib/db.mjs' as any);
    const { assessment_slug, answers, score, result_label } = req.body;
    const session_id = req.headers['x-session-id'] as string || `anon_${Date.now()}`;

    await query(
      `INSERT INTO assessment_results (assessment_slug, session_id, answers, score, result_label)
       VALUES ($1, $2, $3, $4, $5)`,
      [assessment_slug, session_id, JSON.stringify(answers), score, result_label]
    );

    res.json({ ok: true, saved: true });
  } catch (err) {
    console.error('[assessments] results save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assessments/:slug
assessmentsRouter.get('/:slug', async (req, res) => {
  try {
    const { mode, store, query } = await getStore() as any;

    if (mode === 'file') {
      const assessment = store.getAssessmentBySlug(req.params.slug);
      if (!assessment) return res.status(404).json({ error: 'Not found' });
      return res.json(assessment);
    }

    const { rows } = await query(
      `SELECT id, slug, title, description, category, questions, scoring, created_at
       FROM assessments WHERE slug = $1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0] as any;
    res.json({
      ...r,
      questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
      scoring: typeof r.scoring === 'string' ? JSON.parse(r.scoring) : r.scoring,
    });
  } catch (err) {
    console.error('[assessments] get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
