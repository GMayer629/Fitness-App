const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM settings WHERE id = 1');
  res.json(result.rows[0]);
});

router.put('/', async (req, res) => {
  const fields = ['weekday_target', 'friday_target', 'weekend_target', 'protein_target', 'start_weight', 'goal_weight', 'goal_waist', 'goal_date'];
  const updates = [];
  const values = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${i++}`);
      values.push(req.body[f]);
    }
  }
  if (updates.length > 0) {
    values.push(1);
    await pool.query(`UPDATE settings SET ${updates.join(', ')} WHERE id = $${i}`, values);
  }
  const result = await pool.query('SELECT * FROM settings WHERE id = 1');
  res.json(result.rows[0]);
});

module.exports = router;
