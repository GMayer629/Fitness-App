const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const SEED = {
  settings: {
    weekdayTarget: 1900, fridayTarget: 2100, weekendTarget: 2450, proteinTarget: 150,
    startWeight: 175, goalWeight: 156, goalWaist: 30.5, goalDate: "2026-09-03",
  },
  meals: [
    { id: "m001", name: "Homemade protein shake", cal: 415, protein: 37 },
    { id: "m002", name: "Flank steak dinner", cal: 950, protein: 72 },
    { id: "m003", name: "Salmon + broccoli", cal: 650, protein: 45 },
    { id: "m004", name: "Chicken breast + asparagus", cal: 540, protein: 75 },
    { id: "m005", name: "Greek salad + chicken", cal: 700, protein: 60 },
    { id: "m006", name: "NY strip + broccoli", cal: 750, protein: 58 },
    { id: "m007", name: "Premier protein shake", cal: 160, protein: 30 },
    { id: "m008", name: "Turkey hoagie 6 inch", cal: 700, protein: 40 },
    { id: "m009", name: "Chobani coconut yogurt", cal: 140, protein: 12 },
    { id: "m010", name: "Wine — glass red", cal: 125, protein: 0 },
    { id: "m011", name: "Wine — glass white", cal: 125, protein: 0 },
    { id: "m012", name: "Vodka soda", cal: 100, protein: 0 },
    { id: "m013", name: "Pilsner beer", cal: 150, protein: 0 },
    { id: "m014", name: "Surfside vodka iced tea", cal: 160, protein: 0 },
    { id: "m015", name: "Two eggs griddle-fried", cal: 200, protein: 12 },
    { id: "m016", name: "Pork roll (3 slices)", cal: 200, protein: 14 },
    { id: "m017", name: "Two toast with butter", cal: 250, protein: 6 },
    { id: "m018", name: "Two pancakes butter + syrup", cal: 650, protein: 8 },
    { id: "m019", name: "Pizza slice (cheese)", cal: 300, protein: 12 },
    { id: "m020", name: "Salad (side)", cal: 200, protein: 3 },
  ],
  foodLog: {},
  lifts: {},
  weighIns: [
    { date: "2026-01-01", weight: 175 },
    { date: "2026-06-17", weight: 160, waist: 32 },
  ],
  checklist: {},
  sports: {},
};

router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const result = await pool.query('SELECT data FROM public.app_data WHERE id = 1');
    if (!result.rows[0]) {
      console.log('[GET /api/data] no row found, seeding');
      await pool.query('INSERT INTO public.app_data (id, data) VALUES (1, $1)', [JSON.stringify(SEED)]);
      return res.json(SEED);
    }
    console.log('[GET /api/data] returning saved data');
    res.json(JSON.parse(result.rows[0].data));
  } catch (err) {
    console.error('[GET /api/data] error:', err.message);
    res.status(503).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const sql = 'INSERT INTO public.app_data (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()';
  const payload = JSON.stringify(req.body);
  console.log('[PUT /api/data] executing INSERT, payload size:', payload.length, 'bytes');
  try {
    const result = await pool.query(sql, [payload]);
    console.log('[PUT /api/data] success, rowCount:', result.rowCount);
    res.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/data] FAILED:', err.message, '| code:', err.code);
    res.status(503).json({ error: err.message });
  }
});

module.exports = router;
