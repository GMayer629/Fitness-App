const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/consistency', (req, res) => {
  const { weekStart } = req.query;
  const weekEnd = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const lifts = db.prepare(`
    SELECT COUNT(DISTINCT date) as count FROM lift_history
    WHERE date >= ? AND date < ?
  `).get(weekStart, weekEnd);

  const sport = db.prepare(`
    SELECT COUNT(*) as count FROM sport_sessions
    WHERE date >= ? AND date < ?
  `).get(weekStart, weekEnd);

  const checklist = db.prepare(`
    SELECT item, COUNT(*) as count FROM checklist_completions
    WHERE date >= ? AND date < ?
    GROUP BY item
  `).all(weekStart, weekEnd);

  const cl = {};
  for (const r of checklist) cl[r.item] = r.count;

  res.json({
    lifts: lifts.count,
    sport: sport.count,
    neck: cl.neck || 0,
    core: cl.core || 0,
    abs: cl.abs || 0,
    stretch: cl.stretch || 0,
  });
});

module.exports = router;
