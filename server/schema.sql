-- Swim RPG / 100JUZ database schema

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,        -- Strava athlete id
  name           TEXT NOT NULL,
  avatar         TEXT,
  gender         TEXT,
  access_token   TEXT,
  refresh_token  TEXT,
  expires_at     BIGINT,
  total_km       NUMERIC DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workouts (
  id             BIGINT PRIMARY KEY,      -- Strava activity id
  user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
  date           TIMESTAMPTZ,
  distance_m     NUMERIC,
  duration_sec   INTEGER,
  name           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_total_km ON users(total_km DESC);
