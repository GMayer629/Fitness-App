const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(row);
});

router.put('/', (req, res) => {
  const fields = ['weekday_target', 'friday_target', 'weekend_target', 'protein_target', 'start_weight', 'goal_weight', 'goal_waist', 'goal_date'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length > 0) {
    db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`).run(...values);
  }
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(row);
});

module.exports = router;
