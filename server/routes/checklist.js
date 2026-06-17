const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const { date } = req.query;
  const result = await pool.query('SELECT * FROM checklist_completions WHERE date = $1', [date]);
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { item, date } = req.body;
  await pool.query(
    'INSERT INTO checklist_completions (item, date) VALUES ($1, $2) ON CONFLICT (item, date) DO NOTHING',
    [item, date]
  );
  res.json({ ok: true });
});

router.delete('/:item/:date', async (req, res) => {
  await pool.query(
    'DELETE FROM checklist_completions WHERE item = $1 AND date = $2',
    [req.params.item, req.params.date]
  );
  res.json({ ok: true });
});

module.exports = router;
