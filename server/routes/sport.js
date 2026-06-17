const express = require('express');
const router = express.Router();
const db = require('../db');

function getWeekBounds() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10)
  };
}

router.get('/weekly-summary', (req, res) => {
  const { start, end } = getWeekBounds();
  const rows = db.prepare('SELECT * FROM sport_sessions WHERE date >= ? AND date <= ?').all(start, end);
  res.json({
    sessions: rows.length,
    totalMinutes: rows.reduce((s, r) => s + r.minutes, 0),
    holesWalked: rows.reduce((s, r) => s + (r.holes_walked || 0), 0),
    holesCart: rows.reduce((s, r) => s + (r.holes_cart || 0), 0)
  });
});

router.get('/', (req, res) => {
  const { date } = req.query;
  const rows = db.prepare('SELECT * FROM sport_sessions WHERE date = ? ORDER BY id').all(date);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { activity, minutes, holes_walked, holes_cart, date } = req.body;
  const result = db.prepare('INSERT INTO sport_sessions (activity, minutes, holes_walked, holes_cart, date) VALUES (?, ?, ?, ?, ?)').run(activity, minutes, holes_walked || 0, holes_cart || 0, date);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sport_sessions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
