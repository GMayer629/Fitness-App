const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const { date } = req.query;
  const result = await pool.query('SELECT * FROM food_log WHERE date = $1 ORDER BY id', [date]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, calories, protein, date } = req.body;
  const result = await pool.query(
    'INSERT INTO food_log (name, calories, protein, date) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, calories, protein, date]
  );
  res.json({ id: result.rows[0].id });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM food_log WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
