const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function getWeekBounds() {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
}

router.get('/weekly-summary', async (req, res) => {
  const { start, end } = getWeekBounds();
  const result = await pool.query(
    'SELECT * FROM sport_sessions WHERE date >= $1 AND date <= $2',
    [start, end]
  );
  const rows = result.rows;
  res.json({
    sessions: rows.length,
    totalMinutes: rows.reduce((s, r) => s + r.minutes, 0),
    holesWalked: rows.reduce((s, r) => s + (r.holes_walked || 0), 0),
    holesCart: rows.reduce((s, r) => s + (r.holes_cart || 0), 0),
  });
});

router.get('/', async (req, res) => {
  const { date } = req.query;
  const result = await pool.query('SELECT * FROM sport_sessions WHERE date = $1 ORDER BY id', [date]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { activity, minutes, holes_walked, holes_cart, date } = req.body;
  const result = await pool.query(
    'INSERT INTO sport_sessions (activity, minutes, holes_walked, holes_cart, date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [activity, minutes, holes_walked || 0, holes_cart || 0, date]
  );
  res.json({ id: result.rows[0].id });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sport_sessions WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
