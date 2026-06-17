const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/latest', async (req, res) => {
  const result = await pool.query('SELECT * FROM weigh_ins ORDER BY date DESC LIMIT 1');
  res.json(result.rows[0] || null);
});

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM weigh_ins ORDER BY date ASC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { date, weight, waist } = req.body;
  await pool.query(
    'INSERT INTO weigh_ins (date, weight, waist) VALUES ($1, $2, $3) ON CONFLICT (date) DO UPDATE SET weight = EXCLUDED.weight, waist = EXCLUDED.waist',
    [date, weight, waist || null]
  );
  res.json({ ok: true });
});

module.exports = router;
