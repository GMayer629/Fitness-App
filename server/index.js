const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    let dataCount = 0;
    try {
      const r = await pool.query('SELECT COUNT(*) FROM public.app_data');
      dataCount = parseInt(r.rows[0].count, 10);
    } catch {}
    res.json({ ok: true, db: 'connected', tables: tables.rows.map(r => r.table_name), dataRows: dataCount });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// Returns connection info (no passwords) to diagnose env var issues
app.get('/api/debug', (req, res) => {
  const scrub = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      return { host: u.hostname, port: u.port || '5432', db: u.pathname };
    } catch { return 'invalid url'; }
  };
  res.json({
    POSTGRES_URL: scrub(process.env.POSTGRES_URL),
    NODE_ENV: process.env.NODE_ENV,
  });
});

// Verifies that all required tables exist — does NOT create them.
// To create tables, run the SQL from server/schema.sql in Supabase SQL Editor.
app.get('/api/init', async (req, res) => {
  const REQUIRED = ['app_data', 'food_log', 'meal_bank', 'lift_history', 'weigh_ins', 'checklist_completions', 'sport_sessions', 'settings'];
  try {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)
    `, [REQUIRED]);
    const found = result.rows.map(r => r.table_name);
    const missing = REQUIRED.filter(t => !found.includes(t));
    res.json({
      ok: missing.length === 0,
      tablesFound: found,
      tablesMissing: missing,
      message: missing.length === 0
        ? 'All tables present — app is ready'
        : `Missing tables: ${missing.join(', ')}. Run server/schema.sql in Supabase SQL Editor.`,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Direct write test
app.get('/api/test-write', async (req, res) => {
  console.log('[/api/test-write] hit');
  try {
    await pool.query(`
      INSERT INTO public.weigh_ins (date, weight, waist)
      VALUES ('2026-01-01', 175, 34)
      ON CONFLICT (date) DO UPDATE SET weight = EXCLUDED.weight
    `);
    const check = await pool.query('SELECT * FROM public.weigh_ins ORDER BY date');
    console.log('[/api/test-write] success, rows:', check.rows.length);
    res.json({ ok: true, rows: check.rows });
  } catch (err) {
    console.error('[/api/test-write] FAILED:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/data', (req, res, next) => {
  console.log(`[/api/data] ${req.method} hit`);
  next();
}, require('./routes/data'));

app.use('/api/export', require('./routes/export'));
app.use('/api/food', require('./routes/food'));
app.use('/api/meal-bank', require('./routes/meal-bank'));
app.use('/api/lifts', require('./routes/lifts'));
app.use('/api/weigh-ins', require('./routes/weigh-ins'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/sport', require('./routes/sport'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`FitLog server running on port ${PORT}`));
}

module.exports = app;
