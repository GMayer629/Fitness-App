const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Fire-and-forget: attempt DB init on startup, but don't block routes
initDb().catch(err => console.error('[initDb] startup init failed:', err.message));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    let dataCount = 0;
    try {
      const r = await pool.query('SELECT COUNT(*) FROM app_data');
      dataCount = parseInt(r.rows[0].count, 10);
    } catch {}
    res.json({ ok: true, db: 'connected', tables: tables.rows.map(r => r.table_name), dataRows: dataCount });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.get('/api/init', async (req, res) => {
  try {
    const { results, tablesFound } = await initDb();
    const failed = results.filter(r => !r.ok);
    res.json({
      ok: failed.length === 0,
      message: failed.length === 0 ? 'Database initialized' : 'Some tables failed — check errors',
      tablesCreated: results,
      tablesVerified: tablesFound,
    });
  } catch (err) {
    console.error('[/api/init] error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/data', require('./routes/data'));
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
