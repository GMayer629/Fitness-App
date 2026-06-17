const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

router.put('/', (req, res) => {
  const { weekday_target, friday_target, weekend_target, protein_target, start_weight, goal_weight, goal_waist, goal_date } = req.body;
  db.prepare(`
    UPDATE settings SET
      weekday_target = ?,
      friday_target = ?,
      weekend_target = ?,
      protein_target = ?,
      start_weight = ?,
      goal_weight = ?,
      goal_waist = ?,
      goal_date = ?
    WHERE id = 1
  `).run(weekday_target, friday_target, weekend_target, protein_target, start_weight, goal_weight, goal_waist, goal_date);
  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

module.exports = router;
