const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/latest', (req, res) => {
  const row = db.prepare('SELECT * FROM weigh_ins ORDER BY date DESC LIMIT 1').get();
  res.json(row || null);
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM weigh_ins ORDER BY date ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { date, weight, waist } = req.body;
  db.prepare('INSERT OR REPLACE INTO weigh_ins (date, weight, waist) VALUES (?, ?, ?)').run(date, weight, waist || null);
  res.json({ ok: true });
});

module.exports = router;
