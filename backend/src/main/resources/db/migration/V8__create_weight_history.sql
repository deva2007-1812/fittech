-- ─────────────────────────────────────────────────────────────────────────────
-- V8__create_weight_history.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight          DECIMAL(5,2) NOT NULL,  -- kg
    recorded_date   DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_weight_history_user_id   ON weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_user_date ON weight_history(user_id, recorded_date);
