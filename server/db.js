const { Pool } = require('pg');

// Strip non-pg URL params (e.g. pgbouncer=true from Supabase pooler URLs)
function cleanUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete('pgbouncer');
    u.searchParams.delete('workaround');
    return u.toString();
  } catch {
    return url;
  }
}

const sslConfig = process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: cleanUrl(process.env.POSTGRES_URL),
  ssl: sslConfig,
  max: 3,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[pool] unexpected error:', err.message);
});

async function initDb() {
  // Prefer non-pooling URL for DDL — Supabase pooler in transaction mode
  // can reject DDL in some configurations
  const connStr = cleanUrl(
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
  );
  console.log('[initDb] starting, using', process.env.POSTGRES_URL_NON_POOLING ? 'non-pooling URL' : 'pooling URL');

  const initPool = new Pool({
    connectionString: connStr,
    ssl: sslConfig,
    max: 1,
    connectionTimeoutMillis: 8000,
  });

  const client = await initPool.connect();
  console.log('[initDb] connected');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_log (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        calories INTEGER NOT NULL DEFAULT 0,
        protein INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS meal_bank (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        calories INTEGER NOT NULL DEFAULT 0,
        protein INTEGER NOT NULL DEFAULT 0
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS lift_history (
        id SERIAL PRIMARY KEY,
        exercise TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 0,
        reps INTEGER NOT NULL,
        date TEXT NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS weigh_ins (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        waist REAL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklist_completions (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        date TEXT NOT NULL,
        UNIQUE(item, date)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS sport_sessions (
        id SERIAL PRIMARY KEY,
        activity TEXT NOT NULL,
        minutes INTEGER NOT NULL DEFAULT 0,
        holes_walked INTEGER NOT NULL DEFAULT 0,
        holes_cart INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        weekday_target INTEGER NOT NULL DEFAULT 1900,
        friday_target INTEGER NOT NULL DEFAULT 2100,
        weekend_target INTEGER NOT NULL DEFAULT 2450,
        protein_target INTEGER NOT NULL DEFAULT 150,
        start_weight REAL NOT NULL DEFAULT 175,
        goal_weight REAL NOT NULL DEFAULT 156,
        goal_waist REAL NOT NULL DEFAULT 30.5,
        goal_date TEXT NOT NULL DEFAULT '2026-09-03'
      )
    `);
    await client.query(`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    console.log('[initDb] all tables created ok');
  } finally {
    client.release();
    await initPool.end();
  }
}

module.exports = { pool, initDb };
