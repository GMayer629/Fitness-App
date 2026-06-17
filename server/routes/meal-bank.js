const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM meal_bank ORDER BY name');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, calories, protein } = req.body;
  const result = await pool.query(
    'INSERT INTO meal_bank (name, calories, protein) VALUES ($1, $2, $3) RETURNING id',
    [name, calories, protein]
  );
  res.json({ id: result.rows[0].id });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM meal_bank WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/add', async (req, res) => {
  const { date } = req.body;
  const mealResult = await pool.query('SELECT * FROM meal_bank WHERE id = $1', [req.params.id]);
  const meal = mealResult.rows[0];
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  const result = await pool.query(
    'INSERT INTO food_log (name, calories, protein, date) VALUES ($1, $2, $3, $4) RETURNING id',
    [meal.name, meal.calories, meal.protein, date]
  );
  res.json({ id: result.rows[0].id });
});

module.exports = router;
