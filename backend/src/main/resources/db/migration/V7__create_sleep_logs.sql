-- ─────────────────────────────────────────────────────────────────────────────
-- V7__create_sleep_logs.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration    DECIMAL(4,2) NOT NULL DEFAULT 0,  -- hours
    bedtime     VARCHAR(10),   -- HH:MM
    wake_time   VARCHAR(10),   -- HH:MM
    sleep_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id   ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, sleep_date);
