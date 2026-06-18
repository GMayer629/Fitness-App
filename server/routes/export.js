const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT data FROM app_data WHERE id = 1');
  if (!result.rows[0]) return res.status(404).json({ error: 'No data found' });
  const data = JSON.parse(result.rows[0].data);
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: 'fitlog-v1',
    ...data,
  };
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="fitlog-export-${date}.json"`);
  res.json(payload);
});

module.exports = router;
