-- ─────────────────────────────────────────────────────────────────────────────
-- V2__create_user_profiles.sql
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age                         INTEGER,
    height                      DECIMAL(5,2),   -- cm
    weight                      DECIMAL(5,2),   -- kg
    activity_level              VARCHAR(30),
    fitness_goal                VARCHAR(30),
    daily_calorie_target        INTEGER,
    daily_protein_target        DECIMAL(6,2),   -- grams
    daily_carbohydrate_target   DECIMAL(6,2),   -- grams
    daily_fat_target            DECIMAL(6,2),   -- grams
    daily_water_target          INTEGER DEFAULT 2500, -- ml
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
