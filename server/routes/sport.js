const express = require('express');
const router = express.Router();
const { pool } = require('../db');

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
