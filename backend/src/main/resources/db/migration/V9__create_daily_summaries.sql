-- ─────────────────────────────────────────────────────────────────────────────
-- V9__create_daily_summaries.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_summaries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    calories_consumed   DECIMAL(8,2) DEFAULT 0,
    protein             DECIMAL(8,2) DEFAULT 0,
    carbohydrates       DECIMAL(8,2) DEFAULT 0,
    fat                 DECIMAL(8,2) DEFAULT 0,
    water               INTEGER DEFAULT 0,          -- ml
    workout_duration    INTEGER DEFAULT 0,          -- minutes
    sleep_duration      DECIMAL(4,2) DEFAULT 0,     -- hours
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, date);
