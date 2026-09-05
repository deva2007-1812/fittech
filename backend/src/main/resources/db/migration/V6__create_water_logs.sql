-- ─────────────────────────────────────────────────────────────────────────────
-- V6__create_water_logs.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL DEFAULT 0,  -- ml
    logged_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_id   ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at);
