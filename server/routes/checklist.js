const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const rows = db.prepare('SELECT item FROM checklist_completions WHERE date = ?').all(date);
  res.json(rows.map(r => r.item));
});

router.post('/', (req, res) => {
  const { item, date } = req.body;
  db.prepare('INSERT OR IGNORE INTO checklist_completions (item, date) VALUES (?, ?)').run(item, date);
  res.json({ ok: true });
});

router.delete('/:item/:date', (req, res) => {
  db.prepare('DELETE FROM checklist_completions WHERE item = ? AND date = ?').run(req.params.item, req.params.date);
  res.json({ ok: true });
});

router.get('/weekly', (req, res) => {
  const { weekStart } = req.query;
  const rows = db.prepare(`
    SELECT item, COUNT(*) as count FROM checklist_completions
    WHERE date >= ? AND date < date(?, '+7 days')
    GROUP BY item
  `).all(weekStart, weekStart);
  const result = {};
  for (const r of rows) result[r.item] = r.count;
  res.json(result);
});

module.exports = router;
