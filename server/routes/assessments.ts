import express from 'express';

export const assessmentsRouter = express.Router();

// File-based store only — no database
async function getStore() {
  const store = await import('../../src/lib/assessmentStore.mjs' as any);
  return store;
}

// GET /api/assessments — list all assessments
assessmentsRouter.get('/', async (req, res) => {
  try {
    const store = await getStore();
    return res.json(store.getAssessments());
  } catch (err) {
    console.error('[assessments] list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/assessments/results — graceful no-op (no database)
assessmentsRouter.post('/results', async (req, res) => {
  // No database — just acknowledge the result
  return res.json({ ok: true, saved: false, message: 'Results acknowledged (no database configured)' });
});

// GET /api/assessments/:slug
assessmentsRouter.get('/:slug', async (req, res) => {
  try {
    const store = await getStore();
    const assessment = store.getAssessmentBySlug(req.params.slug);
    if (!assessment) return res.status(404).json({ error: 'Not found' });
    return res.json(assessment);
  } catch (err) {
    console.error('[assessments] get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
