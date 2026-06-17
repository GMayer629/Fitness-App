const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  res.json(db.prepare('SELECT * FROM lift_history WHERE date = ? ORDER BY id').all(date));
});

router.post('/', (req, res) => {
  const { exercise, weight, reps, date } = req.body;
  const result = db.prepare('INSERT INTO lift_history (exercise, weight, reps, date) VALUES (?, ?, ?, ?)').run(exercise, weight, reps, date);
  res.json({ id: result.lastInsertRowid, exercise, weight, reps, date });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM lift_history WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/last-session/:exercise', (req, res) => {
  const exercise = decodeURIComponent(req.params.exercise);
  const lastDate = db.prepare(`
    SELECT date FROM lift_history WHERE exercise = ? ORDER BY date DESC, id DESC LIMIT 1
  `).get(exercise);
  if (!lastDate) return res.json({ date: null, sets: [] });
  const sets = db.prepare('SELECT * FROM lift_history WHERE exercise = ? AND date = ? ORDER BY id').all(exercise, lastDate.date);
  res.json({ date: lastDate.date, sets });
});

router.get('/progression/:exercise', (req, res) => {
  const exercise = decodeURIComponent(req.params.exercise);
  const rows = db.prepare(`
    SELECT date, MAX(weight) as topWeight, reps
    FROM lift_history
    WHERE exercise = ?
    GROUP BY date
    ORDER BY date DESC
    LIMIT 30
  `).all(exercise);
  res.json(rows.reverse());
});

router.get('/weekly-count', (req, res) => {
  const { weekStart } = req.query;
  const row = db.prepare(`
    SELECT COUNT(DISTINCT date) as count FROM lift_history
    WHERE date >= ? AND date < date(?, '+7 days')
  `).get(weekStart, weekStart);
  res.json(row);
});

module.exports = router;
