const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM meal_bank ORDER BY name').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, calories, protein } = req.body;
  const result = db.prepare('INSERT INTO meal_bank (name, calories, protein) VALUES (?, ?, ?)').run(name, calories, protein);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meal_bank WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/add', (req, res) => {
  const { date } = req.body;
  const meal = db.prepare('SELECT * FROM meal_bank WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  const result = db.prepare('INSERT INTO food_log (name, calories, protein, date) VALUES (?, ?, ?, ?)').run(meal.name, meal.calories, meal.protein, date);
  res.json({ id: result.lastInsertRowid });
});

module.exports = router;
