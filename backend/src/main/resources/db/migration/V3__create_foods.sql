-- ─────────────────────────────────────────────────────────────────────────────
-- V3__create_foods.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS foods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200)     NOT NULL UNIQUE,
    name_lower      VARCHAR(200)     GENERATED ALWAYS AS (LOWER(name)) STORED,
    serving_size    DECIMAL(8,2)     NOT NULL DEFAULT 100,
    serving_unit    VARCHAR(30)      NOT NULL DEFAULT 'g',
    calories        DECIMAL(8,2)     NOT NULL DEFAULT 0,
    protein         DECIMAL(8,2)     NOT NULL DEFAULT 0,
    carbohydrates   DECIMAL(8,2)     NOT NULL DEFAULT 0,
    fat             DECIMAL(8,2)     NOT NULL DEFAULT 0,
    fiber           DECIMAL(8,2)     DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON foods(name_lower);
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);
