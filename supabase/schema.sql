-- ============================================================
-- AceTheDAT Portal — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- 1. PROFILES
-- Single table for coach + students. No separate auth layer.
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT PRIMARY KEY,                -- 'coach-thomas', 'student-S01', etc.
  role          TEXT NOT NULL CHECK (role IN ('coach', 'student')),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,                   -- plain-text for now (demo); move to Supabase Auth later
  student_id    TEXT,                            -- NULL for coach, 'S01' etc. for students
  home_path     TEXT NOT NULL DEFAULT '/student/dashboard',
  -- student-specific fields (NULL for coach)
  phone         TEXT DEFAULT '',
  status        TEXT DEFAULT 'Active',
  program       TEXT DEFAULT 'DAT Coaching',
  phase         TEXT DEFAULT 'Foundation',
  test_date     TEXT DEFAULT '',
  weekly_commitment_hours NUMERIC DEFAULT 15,
  coach_note    TEXT DEFAULT '',
  color         TEXT DEFAULT '#C9A84C',
  amount_paid   NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  next_payment_date TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. WEEKLY PLANS
-- days stored as JSONB array matching React shape exactly
CREATE TABLE IF NOT EXISTS weekly_plans (
  id            TEXT PRIMARY KEY,                -- '{studentId}-{weekStart}'
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start    TEXT NOT NULL,                   -- ISO date 'YYYY-MM-DD'
  week_label    TEXT,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  days          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- full 7-day array with tasks
  published_at  TIMESTAMPTZ,
  saved_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_start)
);

-- 3. TASK COMPLETIONS
-- Relational: one row per student:task toggle
CREATE TABLE IF NOT EXISTS task_completions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id       TEXT NOT NULL,
  completed     BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, task_id)
);

-- 4. DAY NOTES
CREATE TABLE IF NOT EXISTS day_notes (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_id        TEXT NOT NULL,
  text          TEXT DEFAULT '',
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, day_id)
);

-- 5. PRACTICE TESTS (relational — enables analytics)
CREATE TABLE IF NOT EXISTS practice_tests (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_number   INTEGER NOT NULL CHECK (test_number BETWEEN 1 AND 15),
  date          TEXT NOT NULL,                   -- ISO date
  sections      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { Bio: 20, GChem: 18, ... }
  section_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- { BIO: 20, GCH: 18, ... }
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, test_number)
);

-- 6. MQL ENTRIES (relational — enables error pattern analytics)
CREATE TABLE IF NOT EXISTS mql_entries (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  section       TEXT DEFAULT '',
  error_type    TEXT DEFAULT '',
  question_reference TEXT DEFAULT '',
  explanation   TEXT DEFAULT '',
  correct_reasoning  TEXT DEFAULT '',
  action_item   TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 7. CHECK-INS
CREATE TABLE IF NOT EXISTS check_ins (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 8. SELF ASSESSMENTS
CREATE TABLE IF NOT EXISTS self_assessments (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 9. STUDENT PAYMENTS (relational — financial analytics)
CREATE TABLE IF NOT EXISTS student_payments (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  amount        NUMERIC NOT NULL DEFAULT 0,
  method        TEXT DEFAULT 'Manual',
  note          TEXT DEFAULT '',
  kind          TEXT DEFAULT 'Payment',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 10. TEAM PAYMENTS
CREATE TABLE IF NOT EXISTS team_payments (
  id            TEXT PRIMARY KEY,
  payee         TEXT DEFAULT '',
  date          TEXT NOT NULL,
  amount        NUMERIC NOT NULL DEFAULT 0,
  note          TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_weekly_plans_student ON weekly_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_student ON task_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_day_notes_student ON day_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_tests_student ON practice_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_mql_entries_student ON mql_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

-- ============================================================
-- SEED: Bootstrap coach account
-- ============================================================
INSERT INTO profiles (id, role, name, email, password, student_id, home_path)
VALUES ('coach-thomas', 'coach', 'Thomas', 'thomas@acethedat.com', 'Coach2024!', NULL, '/coach/dashboard')
ON CONFLICT (id) DO NOTHING;
