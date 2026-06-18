const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ready = initDb().catch(err => {
  console.error('DB init failed:', err.message);
  // Don't process.exit in serverless — let requests fail with a clear error
});

app.use((req, res, next) => {
  ready.then(() => next()).catch(() => {
    res.status(503).json({ error: 'Database unavailable — check POSTGRES_URL environment variable' });
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('./db');
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.use('/api/data', require('./routes/data'));
app.use('/api/export', require('./routes/export'));
// Legacy granular routes kept but not used by the frontend
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
