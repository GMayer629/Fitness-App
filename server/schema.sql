-- Run this once in Supabase SQL Editor (supabase.com → project → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS public.app_data (
  id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.food_log (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meal_bank (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.lift_history (
  id SERIAL PRIMARY KEY,
  exercise TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.weigh_ins (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  weight REAL NOT NULL,
  waist REAL
);

CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id SERIAL PRIMARY KEY,
  item TEXT NOT NULL,
  date TEXT NOT NULL,
  UNIQUE(item, date)
);

CREATE TABLE IF NOT EXISTS public.sport_sessions (
  id SERIAL PRIMARY KEY,
  activity TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  holes_walked INTEGER NOT NULL DEFAULT 0,
  holes_cart INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY,
  weekday_target INTEGER NOT NULL DEFAULT 1900,
  friday_target INTEGER NOT NULL DEFAULT 2100,
  weekend_target INTEGER NOT NULL DEFAULT 2450,
  protein_target INTEGER NOT NULL DEFAULT 150,
  start_weight REAL NOT NULL DEFAULT 175,
  goal_weight REAL NOT NULL DEFAULT 156,
  goal_waist REAL NOT NULL DEFAULT 30.5,
  goal_date TEXT NOT NULL DEFAULT '2026-09-03'
);

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Added for LLM integration: daily check-in ratings
CREATE TABLE IF NOT EXISTS public.daily_ratings (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  energy INTEGER CHECK (energy BETWEEN 1 AND 10),
  sleep INTEGER CHECK (sleep BETWEEN 1 AND 10),
  feel INTEGER CHECK (feel BETWEEN 1 AND 10)
);

-- Added for LLM integration: lift session notes (one note per date)
ALTER TABLE public.lift_history ADD COLUMN IF NOT EXISTS notes TEXT;

-- Added for LLM integration: sport session notes
ALTER TABLE public.sport_sessions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Added for LLM integration: injury / symptom log
CREATE TABLE IF NOT EXISTS public.injuries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  body_part TEXT NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 10),
  notes TEXT
);
