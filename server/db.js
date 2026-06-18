const { Pool } = require('pg');

function cleanUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Remove params not understood by postgres itself
    u.searchParams.delete('pgbouncer');
    u.searchParams.delete('workaround');
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return url;
  }
}

const pool = new Pool({
  connectionString: cleanUrl(process.env.POSTGRES_URL),
  ssl: process.env.POSTGRES_URL ? { rejectUnauthorized: false } : false,
  max: 3,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
});

pool.on('connect', (client) => {
  client.query('SET search_path TO public').catch(() => {});
});

pool.on('error', (err) => {
  console.error('[pool] error:', err.message);
});

module.exports = { pool };
