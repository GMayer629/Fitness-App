const { Pool } = require('pg');

// Strip params that confuse node-postgres (pgbouncer mode flag, sslmode — we set ssl via Pool options)
function cleanUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete('pgbouncer');
    u.searchParams.delete('workaround');
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return url;
  }
}

const sslConfig = (process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING)
  ? { rejectUnauthorized: false }
  : false;

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

const TABLES = [
  {
    name: 'app_data',
    sql: `CREATE TABLE IF NOT EXISTS app_data (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'food_log',
    sql: `CREATE TABLE IF NOT EXISTS food_log (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL DEFAULT 0,
      protein INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL
    )`,
  },
  {
    name: 'meal_bank',
    sql: `CREATE TABLE IF NOT EXISTS meal_bank (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL DEFAULT 0,
      protein INTEGER NOT NULL DEFAULT 0
    )`,
  },
  {
    name: 'lift_history',
    sql: `CREATE TABLE IF NOT EXISTS lift_history (
      id SERIAL PRIMARY KEY,
      exercise TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL
    )`,
  },
  {
    name: 'weigh_ins',
    sql: `CREATE TABLE IF NOT EXISTS weigh_ins (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      weight REAL NOT NULL,
      waist REAL
    )`,
  },
  {
    name: 'checklist_completions',
    sql: `CREATE TABLE IF NOT EXISTS checklist_completions (
      id SERIAL PRIMARY KEY,
      item TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(item, date)
    )`,
  },
  {
    name: 'sport_sessions',
    sql: `CREATE TABLE IF NOT EXISTS sport_sessions (
      id SERIAL PRIMARY KEY,
      activity TEXT NOT NULL,
      minutes INTEGER NOT NULL DEFAULT 0,
      holes_walked INTEGER NOT NULL DEFAULT 0,
      holes_cart INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL
    )`,
  },
  {
    name: 'settings',
    sql: `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      weekday_target INTEGER NOT NULL DEFAULT 1900,
      friday_target INTEGER NOT NULL DEFAULT 2100,
      weekend_target INTEGER NOT NULL DEFAULT 2450,
      protein_target INTEGER NOT NULL DEFAULT 150,
      start_weight REAL NOT NULL DEFAULT 175,
      goal_weight REAL NOT NULL DEFAULT 156,
      goal_waist REAL NOT NULL DEFAULT 30.5,
      goal_date TEXT NOT NULL DEFAULT '2026-09-03'
    )`,
  },
];

async function initDb() {
  const connStr = cleanUrl(
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
  );
  const usingNonPooling = !!process.env.POSTGRES_URL_NON_POOLING;
  console.log('[initDb] starting — url type:', usingNonPooling ? 'non-pooling' : 'pooling');
  console.log('[initDb] ssl config:', JSON.stringify(sslConfig));

  const initPool = new Pool({
    connectionString: connStr,
    ssl: sslConfig,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  const client = await initPool.connect();
  console.log('[initDb] connected ok');

  // Log which user/db we connected as, to catch wrong-DB issues
  try {
    const whoami = await client.query('SELECT current_user, current_database(), version()');
    console.log('[initDb] connected as:', JSON.stringify(whoami.rows[0]));
  } catch (e) {
    console.warn('[initDb] could not query current_user:', e.message);
  }

  const results = [];
  try {
    for (const { name, sql } of TABLES) {
      try {
        await client.query(sql);
        console.log(`[initDb] CREATE TABLE ${name}: ok`);
        results.push({ table: name, ok: true });
      } catch (err) {
        console.error(`[initDb] CREATE TABLE ${name}: FAILED — ${err.message}`);
        results.push({ table: name, ok: false, error: err.message });
      }
    }

    // Seed settings row
    try {
      await client.query(`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
      console.log('[initDb] settings seed: ok');
    } catch (err) {
      console.error('[initDb] settings seed failed:', err.message);
    }

    // Verify by querying information_schema through the SAME connection
    const verify = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const found = verify.rows.map(r => r.table_name);
    console.log('[initDb] verified tables in public schema:', found);
    return { results, tablesFound: found };
  } finally {
    client.release();
    await initPool.end();
  }
}

module.exports = { pool, initDb };
