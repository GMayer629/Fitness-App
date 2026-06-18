#!/usr/bin/env node
// Usage: npm run check-data
// Requires POSTGRES_URL in environment (copy from .env or Vercel dashboard)

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function main() {
  console.log('\nConnecting to database…');
  const result = await pool.query('SELECT data FROM app_data WHERE id = 1');

  if (!result.rows[0]) {
    console.log('No data row found — database is empty or not yet seeded.\n');
    await pool.end();
    return;
  }

  const data = JSON.parse(result.rows[0].data);

  const foodDays = Object.keys(data.foodLog || {});
  const foodEntries = foodDays.reduce((n, d) => n + (data.foodLog[d] || []).length, 0);

  const exercises = Object.keys(data.lifts || {});
  const liftSets = exercises.reduce((n, ex) => n + (data.lifts[ex] || []).length, 0);

  const weighIns = (data.weighIns || []).length;

  const sportDays = Object.keys(data.sports || {});
  const sportSessions = sportDays.reduce((n, d) => n + (data.sports[d] || []).length, 0);

  const checklistDays = Object.keys(data.checklist || {});
  const checklistEntries = checklistDays.reduce((n, d) => n + Object.values(data.checklist[d] || {}).filter(Boolean).length, 0);

  const meals = (data.meals || []).length;

  const blobKb = Math.round(JSON.stringify(data).length / 1024);

  console.log('\nFitLog Database Summary');
  console.log('═══════════════════════════════════');
  console.log(`Food log entries:      ${foodEntries}  (across ${foodDays.length} days)`);
  console.log(`Lift sets:             ${liftSets}  (${exercises.length} exercises)`);
  console.log(`Weigh-ins:             ${weighIns}`);
  console.log(`Sport sessions:        ${sportSessions}  (across ${sportDays.length} days)`);
  console.log(`Checklist completions: ${checklistEntries}  (across ${checklistDays.length} days)`);
  console.log(`Meal bank items:       ${meals}`);
  console.log('───────────────────────────────────');
  console.log(`Blob size:             ${blobKb} KB`);
  console.log('');

  if (foodDays.length > 0) {
    const sorted = foodDays.sort();
    console.log(`Food log range:  ${sorted[0]}  →  ${sorted[sorted.length - 1]}`);
  }
  if (data.weighIns && data.weighIns.length > 0) {
    const sorted = [...data.weighIns].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0], last = sorted[sorted.length - 1];
    console.log(`Weight range:    ${first.date} ${first.weight}lb  →  ${last.date} ${last.weight}lb`);
  }
  console.log('');

  await pool.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
