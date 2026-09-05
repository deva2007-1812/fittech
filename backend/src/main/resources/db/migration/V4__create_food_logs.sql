-- ─────────────────────────────────────────────────────────────────────────────
-- V4__create_food_logs.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id         UUID REFERENCES foods(id) ON DELETE SET NULL,
    food_name       VARCHAR(200) NOT NULL,
    quantity        DECIMAL(8,2) NOT NULL DEFAULT 1,
    unit            VARCHAR(30)  NOT NULL DEFAULT 'serving',
    meal_type       VARCHAR(20)  NOT NULL DEFAULT 'SNACK',
    calories        DECIMAL(8,2) NOT NULL DEFAULT 0,
    protein         DECIMAL(8,2) NOT NULL DEFAULT 0,
    carbohydrates   DECIMAL(8,2) NOT NULL DEFAULT 0,
    fat             DECIMAL(8,2) NOT NULL DEFAULT 0,
    logged_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_id       ON food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date     ON food_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at     ON food_logs(logged_at);
