const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'fitlog.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS food_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meal_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lift_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS weigh_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL,
    waist REAL
  );
  CREATE TABLE IF NOT EXISTS checklist_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL,
    date TEXT NOT NULL,
    UNIQUE(item, date)
  );
  CREATE TABLE IF NOT EXISTS sport_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    holes_walked INTEGER DEFAULT 0,
    holes_cart INTEGER DEFAULT 0,
    date TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    weekday_target INTEGER DEFAULT 1900,
    friday_target INTEGER DEFAULT 2100,
    weekend_target INTEGER DEFAULT 2450,
    protein_target INTEGER DEFAULT 150,
    start_weight REAL DEFAULT 175,
    goal_weight REAL DEFAULT 156,
    goal_waist REAL DEFAULT 30.5,
    goal_date TEXT DEFAULT '2026-09-03'
  );
`);

db.prepare('INSERT OR IGNORE INTO settings (id) VALUES (1)').run();

module.exports = db;
