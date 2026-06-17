const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 3,
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL
      )
    `);
    await client.query(`CREATE TABLE IF NOT EXISTS food_log (id SERIAL PRIMARY KEY, name TEXT, calories INTEGER, protein INTEGER, date TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS meal_bank (id SERIAL PRIMARY KEY, name TEXT, calories INTEGER, protein INTEGER)`);
    await client.query(`CREATE TABLE IF NOT EXISTS lift_history (id SERIAL PRIMARY KEY, exercise TEXT, weight REAL, reps INTEGER, date TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS weigh_ins (id SERIAL PRIMARY KEY, date TEXT UNIQUE, weight REAL, waist REAL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS checklist_completions (id SERIAL PRIMARY KEY, item TEXT, date TEXT, UNIQUE(item, date))`);
    await client.query(`CREATE TABLE IF NOT EXISTS sport_sessions (id SERIAL PRIMARY KEY, activity TEXT, minutes INTEGER, holes_walked INTEGER DEFAULT 0, holes_cart INTEGER DEFAULT 0, date TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, weekday_target INTEGER DEFAULT 1900, friday_target INTEGER DEFAULT 2100, weekend_target INTEGER DEFAULT 2450, protein_target INTEGER DEFAULT 150, start_weight REAL DEFAULT 175, goal_weight REAL DEFAULT 156, goal_waist REAL DEFAULT 30.5, goal_date TEXT DEFAULT '2026-09-03')`);
    await client.query('INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
