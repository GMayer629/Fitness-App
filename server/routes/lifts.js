const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/last-session/:exercise', (req, res) => {
  const { exercise } = req.params;
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = db.prepare(
    "SELECT date FROM lift_history WHERE exercise = ? AND date < ? GROUP BY date ORDER BY date DESC LIMIT 1"
  ).get(exercise, today);
  if (!lastDate) return res.json(null);
  const sets = db.prepare('SELECT * FROM lift_history WHERE exercise = ? AND date = ? ORDER BY id').all(exercise, lastDate.date);
  res.json({ date: lastDate.date, sets: sets.map(s => ({ id: s.id, weight: s.weight, reps: s.reps })) });
});

router.get('/progression/:exercise', (req, res) => {
  const { exercise } = req.params;
  const rows = db.prepare(
    'SELECT date, MAX(weight) as maxWeight FROM lift_history WHERE exercise = ? GROUP BY date ORDER BY date DESC LIMIT 20'
  ).all(exercise);
  res.json(rows.reverse());
});

router.get('/', (req, res) => {
  const { date } = req.query;
  const rows = db.prepare('SELECT * FROM lift_history WHERE date = ? ORDER BY id').all(date);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { exercise, weight, reps, date } = req.body;
  const result = db.prepare('INSERT INTO lift_history (exercise, weight, reps, date) VALUES (?, ?, ?, ?)').run(exercise, weight, reps, date);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM lift_history WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
