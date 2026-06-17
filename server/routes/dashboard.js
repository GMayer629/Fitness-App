const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/consistency', async (req, res) => {
  const { weekStart } = req.query;
  const weekEnd = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const [liftsResult, sportResult, checklistResult] = await Promise.all([
    pool.query(
      'SELECT COUNT(DISTINCT date) as count FROM lift_history WHERE date >= $1 AND date < $2',
      [weekStart, weekEnd]
    ),
    pool.query(
      'SELECT COUNT(*) as count FROM sport_sessions WHERE date >= $1 AND date < $2',
      [weekStart, weekEnd]
    ),
    pool.query(
      'SELECT item, COUNT(*) as count FROM checklist_completions WHERE date >= $1 AND date < $2 GROUP BY item',
      [weekStart, weekEnd]
    ),
  ]);

  const cl = {};
  for (const r of checklistResult.rows) cl[r.item] = parseInt(r.count);

  res.json({
    lifts: parseInt(liftsResult.rows[0].count),
    sport: parseInt(sportResult.rows[0].count),
    neck: cl.neck || 0,
    core: cl.core || 0,
    abs: cl.abs || 0,
    stretch: cl.stretch || 0,
  });
});

module.exports = router;
