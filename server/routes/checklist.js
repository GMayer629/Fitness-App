const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  const rows = db.prepare('SELECT * FROM checklist_completions WHERE date = ?').all(date);
  res.json(rows);
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

module.exports = router;
