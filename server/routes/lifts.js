const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/last-session/:exercise', async (req, res) => {
  const { exercise } = req.params;
  const today = new Date().toISOString().slice(0, 10);
  const dateResult = await pool.query(
    'SELECT date FROM lift_history WHERE exercise = $1 AND date < $2 GROUP BY date ORDER BY date DESC LIMIT 1',
    [exercise, today]
  );
  if (!dateResult.rows[0]) return res.json(null);
  const lastDate = dateResult.rows[0].date;
  const setsResult = await pool.query(
    'SELECT * FROM lift_history WHERE exercise = $1 AND date = $2 ORDER BY id',
    [exercise, lastDate]
  );
  res.json({ date: lastDate, sets: setsResult.rows.map(s => ({ id: s.id, weight: s.weight, reps: s.reps })) });
});

router.get('/progression/:exercise', async (req, res) => {
  const { exercise } = req.params;
  const result = await pool.query(
    'SELECT date, MAX(weight) as "maxWeight" FROM lift_history WHERE exercise = $1 GROUP BY date ORDER BY date DESC LIMIT 20',
    [exercise]
  );
  res.json(result.rows.reverse());
});

router.get('/', async (req, res) => {
  const { date } = req.query;
  const result = await pool.query('SELECT * FROM lift_history WHERE date = $1 ORDER BY id', [date]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { exercise, weight, reps, date } = req.body;
  const result = await pool.query(
    'INSERT INTO lift_history (exercise, weight, reps, date) VALUES ($1, $2, $3, $4) RETURNING id',
    [exercise, weight, reps, date]
  );
  res.json({ id: result.rows[0].id });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM lift_history WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
