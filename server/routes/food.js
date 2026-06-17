const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });
  const rows = db.prepare('SELECT * FROM food_log WHERE date = ? ORDER BY id').all(date);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, calories, protein, date } = req.body;
  const result = db.prepare('INSERT INTO food_log (name, calories, protein, date) VALUES (?, ?, ?, ?)').run(name, calories, protein, date);
  res.json({ id: result.lastInsertRowid, name, calories, protein, date });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM food_log WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/repeat-previous', (req, res) => {
  const { date } = req.body;
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  const prev = d.toISOString().slice(0, 10);
  const prevEntries = db.prepare('SELECT name, calories, protein FROM food_log WHERE date = ?').all(prev);
  const insert = db.prepare('INSERT INTO food_log (name, calories, protein, date) VALUES (?, ?, ?, ?)');
  const insertMany = db.transaction((entries) => {
    for (const e of entries) insert.run(e.name, e.calories, e.protein, date);
  });
  insertMany(prevEntries);
  const rows = db.prepare('SELECT * FROM food_log WHERE date = ? ORDER BY id').all(date);
  res.json(rows);
});

router.get('/weekly', (req, res) => {
  const { weekStart } = req.query;
  const rows = db.prepare(`
    SELECT date, SUM(calories) as calories, SUM(protein) as protein
    FROM food_log
    WHERE date >= ? AND date < date(?, '+7 days')
    GROUP BY date
    ORDER BY date
  `).all(weekStart, weekStart);
  res.json(rows);
});

router.get('/weekly-multi', (req, res) => {
  const { weeksBack = 4 } = req.query;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const weeks = [];
  for (let w = parseInt(weeksBack) - 1; w >= 0; w--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - w * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const rows = db.prepare(`
      SELECT date, SUM(calories) as calories
      FROM food_log
      WHERE date >= ? AND date < ?
      GROUP BY date ORDER BY date
    `).all(startStr, endStr);
    weeks.push({ weekStart: startStr, days: rows });
  }
  res.json(weeks);
});

module.exports = router;
