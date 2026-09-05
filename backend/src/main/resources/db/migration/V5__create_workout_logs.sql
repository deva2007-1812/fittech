-- ─────────────────────────────────────────────────────────────────────────────
-- V5__create_workout_logs.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise        VARCHAR(200) NOT NULL,
    duration        INTEGER NOT NULL DEFAULT 0,  -- minutes
    sets            INTEGER,
    repetitions     INTEGER,
    notes           TEXT,
    calories_burned DECIMAL(8,2),
    workout_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id   ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
