const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  const rows = date
    ? db.prepare('SELECT * FROM sport_sessions WHERE date = ? ORDER BY id DESC').all(date)
    : db.prepare('SELECT * FROM sport_sessions ORDER BY date DESC, id DESC LIMIT 20').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { activity, minutes, holes_walked = 0, holes_cart = 0, date } = req.body;
  const result = db.prepare('INSERT INTO sport_sessions (activity, minutes, holes_walked, holes_cart, date) VALUES (?, ?, ?, ?, ?)').run(activity, minutes, holes_walked, holes_cart, date);
  res.json({ id: result.lastInsertRowid, activity, minutes, holes_walked, holes_cart, date });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sport_sessions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/weekly-summary', (req, res) => {
  const { weekStart } = req.query;
  const row = db.prepare(`
    SELECT
      COUNT(*) as sessions,
      COALESCE(SUM(minutes), 0) as totalMinutes,
      COALESCE(SUM(holes_walked), 0) as holesWalked,
      COALESCE(SUM(holes_cart), 0) as holesCart
    FROM sport_sessions
    WHERE date >= ? AND date < date(?, '+7 days')
  `).get(weekStart, weekStart);
  res.json(row);
});

module.exports = router;
