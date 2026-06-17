const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  const rows = db.prepare('SELECT * FROM food_log WHERE date = ? ORDER BY id').all(date);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, calories, protein, date } = req.body;
  const result = db.prepare('INSERT INTO food_log (name, calories, protein, date) VALUES (?, ?, ?, ?)').run(name, calories, protein, date);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM food_log WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
