const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure DB tables exist before any request is handled
const ready = initDb().catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

app.use((req, res, next) => {
  ready.then(() => next()).catch(next);
});

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

// Start listening when run directly; export for Vercel serverless
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`FitLog server running on port ${PORT}`));
}

module.exports = app;
