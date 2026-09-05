-- ═════════════════════════════════════════════════════════════════════════════════
-- FitMind AI – Supabase Database Schema & Seed Data
-- ═════════════════════════════════════════════════════════════════════════════════
-- HOW TO USE IN SUPABASE:
-- 1. Log in to your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Open the "SQL Editor" tab from the left sidebar
-- 3. Click "+ New query"
-- 4. Paste the entire content of this file and click "Run" (or Ctrl + Enter)
-- 5. All tables, indexes, triggers, and 70+ reference foods will be created!
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Step 2: Utility Functions & Triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Step 3: Users Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)        NOT NULL,
    email       VARCHAR(255)        NOT NULL UNIQUE,
    password    VARCHAR(255)        NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Step 4: User Profiles Table ──────────────────────────────────────────────
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

-- ─── Step 5: Foods Reference Table ────────────────────────────────────────────
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

-- ─── Step 6: Food Logs Table ──────────────────────────────────────────────────
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

-- ─── Step 7: Workout Logs Table ───────────────────────────────────────────────
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

-- ─── Step 8: Water Logs Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL DEFAULT 0,  -- ml
    logged_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_id   ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at);

-- ─── Step 9: Sleep Logs Table ─────────────────────────────────────────────────
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

-- ─── Step 10: Weight History Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight          DECIMAL(5,2) NOT NULL,  -- kg
    recorded_date   DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_weight_history_user_id   ON weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_user_date ON weight_history(user_id, recorded_date);

-- ─── Step 11: Daily Summaries Table ───────────────────────────────────────────
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

-- ─── Step 12: Seed 70+ Verified Reference Foods ──────────────────────────────
INSERT INTO foods (name, serving_size, serving_unit, calories, protein, carbohydrates, fat, fiber) VALUES
-- Indian Staples
('Idli',             40,   'piece',   39,   1.5,  8.0,  0.2,  0.3),
('Dosa',             90,   'piece',  168,   3.7, 31.0,  3.7,  1.2),
('Masala Dosa',     170,   'piece',  292,   6.3, 47.0,  8.5,  2.1),
('Chapati',          35,   'piece',  100,   3.1, 18.3,  1.9,  1.9),
('Roti',             35,   'piece',   96,   3.0, 17.6,  1.7,  2.0),
('Paratha',          80,   'piece',  260,   5.4, 35.0, 11.0,  2.5),
('Puri',             30,   'piece',  136,   2.3, 17.5,  6.5,  0.8),
('Steamed Rice',    150,   'g',      195,   3.6, 43.0,  0.4,  0.4),
('Brown Rice',      150,   'g',      165,   3.5, 34.0,  1.3,  1.8),
('Poha',            150,   'g',      250,   4.2, 51.0,  2.9,  1.1),
('Upma',            150,   'g',      176,   4.6, 31.0,  3.8,  1.5),
('Sambar',          150,   'ml',      59,   3.5,  8.2,  1.1,  2.3),
('Dal Tadka',       150,   'g',      140,   8.0, 18.0,  4.0,  4.5),
('Rajma',           150,   'g',      162,   9.1, 28.0,  1.3,  7.5),
('Chole (Chickpea)',150,   'g',      160,   8.5, 26.0,  2.6,  6.8),
('Palak Paneer',    200,   'g',      280,  12.0, 12.0, 20.0,  2.5),
('Paneer Butter Masala', 200, 'g',  380,  13.0, 15.0, 30.0,  2.0),
('Biryani (Chicken)',250,  'g',      450,  22.0, 58.0, 13.0,  2.0),
('Biryani (Veg)',   250,   'g',      340,   8.0, 63.0,  7.0,  3.5),
('Curd / Yogurt',   100,   'g',       61,   3.5,  4.7,  3.3,  0.0),
('Buttermilk',      200,   'ml',      40,   2.6,  5.3,  0.7,  0.0),
('Lassi (Plain)',   200,   'ml',     120,   6.0, 16.0,  3.0,  0.0),
('Khichdi',         200,   'g',      210,   7.0, 40.0,  2.5,  3.0),
('Idiyappam',        80,   'piece',  150,   3.0, 33.0,  0.5,  0.5),
('Appam',            60,   'piece',  103,   2.4, 21.0,  0.8,  0.4),
('Uttapam',         100,   'piece',  139,   4.2, 25.0,  2.5,  1.5),
('Vada',             50,   'piece',  147,   5.0, 16.0,  7.0,  2.0),
('Aloo Paratha',    100,   'piece',  265,   6.0, 41.0,  8.5,  3.0),
-- Vegetables
('Spinach (cooked)', 100,  'g',       23,   2.9,  3.6,  0.4,  2.2),
('Broccoli (cooked)',100,  'g',       35,   2.4,  7.2,  0.4,  2.6),
('Carrot (cooked)', 100,   'g',       35,   0.8,  8.2,  0.2,  3.0),
('Potato (boiled)', 100,   'g',       77,   1.9, 17.5,  0.1,  1.8),
('Tomato',          100,   'g',       18,   0.9,  3.9,  0.2,  1.2),
('Onion',           100,   'g',       40,   1.1,  9.3,  0.1,  1.7),
('Cauliflower',     100,   'g',       25,   1.9,  5.0,  0.3,  2.0),
('Bitter Gourd',    100,   'g',       17,   1.0,  3.7,  0.2,  2.8),
('Bottle Gourd',    100,   'g',       15,   0.5,  3.4,  0.1,  0.5),
('Lady Finger (Okra)',100, 'g',       33,   1.9,  7.5,  0.2,  3.2),
-- Fruits
('Banana',          100,   'g',       89,   1.1, 23.0,  0.3,  2.6),
('Apple',           100,   'g',       52,   0.3, 14.0,  0.2,  2.4),
('Mango',           100,   'g',       60,   0.8, 15.0,  0.4,  1.6),
('Orange',          100,   'g',       47,   0.9, 12.0,  0.1,  2.4),
('Papaya',          100,   'g',       43,   0.5, 11.0,  0.3,  1.7),
('Guava',           100,   'g',       68,   2.6, 14.0,  1.0,  5.4),
('Watermelon',      100,   'g',       30,   0.6,  7.6,  0.2,  0.4),
('Grapes',          100,   'g',       69,   0.7, 18.0,  0.2,  0.9),
('Pineapple',       100,   'g',       50,   0.5, 13.0,  0.1,  1.4),
('Pomegranate',     100,   'g',       83,   1.7, 19.0,  1.2,  4.0),
-- Proteins
('Egg (whole)',       50,  'piece',   78,   6.3,  0.6,  5.3,  0.0),
('Egg White',        33,  'piece',   17,   3.6,  0.2,  0.1,  0.0),
('Chicken Breast',  100,  'g',      165,  31.0,  0.0,  3.6,  0.0),
('Chicken Thigh',   100,  'g',      209,  26.0,  0.0, 10.9,  0.0),
('Fish (Salmon)',   100,  'g',      208,  20.0,  0.0, 13.0,  0.0),
('Fish (Rohu)',     100,  'g',       97,  17.0,  0.0,  2.9,  0.0),
('Mutton',          100,  'g',      294,  25.0,  0.0, 21.0,  0.0),
('Prawn / Shrimp',  100,  'g',       99,  24.0,  0.9,  0.3,  0.0),
('Tofu',            100,  'g',       76,   8.1,  1.9,  4.8,  0.3),
('Soya Chunks',     100,  'g',      336,  52.0, 33.0,  0.5,  13.0),
-- Dairy
('Milk (Full Fat)',  200, 'ml',      122,   6.6,  9.6,  6.4,  0.0),
('Milk (Skimmed)',   200, 'ml',       74,   7.6, 10.8,  0.2,  0.0),
('Paneer',          100, 'g',       265,  18.3,  1.2, 20.8,  0.0),
('Ghee',             10, 'g',        90,   0.0,  0.0, 10.0,  0.0),
('Butter',           10, 'g',        72,   0.1,  0.1,  8.0,  0.0),
('Cheese (Cheddar)', 30, 'g',       120,   7.4,  0.4, 10.0,  0.0),
-- Grains & Legumes
('Oats',            100, 'g',       389,  17.0, 66.0,  7.0, 11.0),
('Wheat Flour (Atta)',100,'g',      340,  12.0, 71.0,  1.7,  11.0),
('Maida (Refined Flour)',100,'g',   348,   8.0, 73.0,  1.0,   2.0),
('Sooji / Rava',    100, 'g',       360,  12.0, 74.0,  1.0,   3.5),
('Corn Flour',      100, 'g',       361,   6.9, 79.0,  3.9,   7.3),
('Lentils (Masoor)',100, 'g',       353,  26.0, 60.0,  1.1,  11.0),
('Chickpeas (raw)', 100, 'g',       364,  19.0, 61.0,  6.0,  17.0),
('Moong Dal',       100, 'g',       347,  24.0, 63.0,  1.2,  16.0),
-- Nuts & Seeds
('Almonds',          30, 'g',       174,   6.3,  6.1, 15.0,   3.5),
('Walnuts',          30, 'g',       196,   4.6,  4.1, 19.6,   2.0),
('Peanuts',          30, 'g',       171,   7.7,  6.1, 14.5,   2.4),
('Cashews',          30, 'g',       163,   4.3,  9.3, 13.0,   0.9),
('Chia Seeds',       30, 'g',       138,   4.4, 12.3,  8.7,  10.6),
('Flaxseeds',        30, 'g',       150,   5.2,  8.2, 11.8,   8.1),
-- Beverages
('Chai (Milk Tea)',  150,'ml',       60,   2.0,  8.0,  1.5,   0.0),
('Black Coffee',    200, 'ml',        5,   0.3,  0.8,  0.0,   0.0),
('Green Tea',       200, 'ml',        2,   0.0,  0.4,  0.0,   0.0),
('Fresh Lime Soda', 200, 'ml',       25,   0.2,  6.0,  0.0,   0.1),
('Coconut Water',   200, 'ml',       38,   1.4,  8.9,  0.1,   1.1),
('Orange Juice',    200, 'ml',       94,   1.4, 22.0,  0.5,   0.5),
('Protein Shake',   300, 'ml',      200,  25.0, 15.0,  3.0,   2.0),
-- Snacks & Street Food
('Samosa',           80, 'piece',   260,   5.0, 32.0, 13.0,   2.5),
('Bhel Puri',       150, 'g',       230,   6.0, 38.0,  6.0,   3.0),
('Pani Puri (6 pcs)',100,'serving', 200,   4.0, 36.0,  5.0,   2.0),
('Dahi Puri (6 pcs)',150,'serving', 245,   7.0, 38.0,  7.0,   2.5),
('Pakora',           80, 'piece',   220,   6.0, 26.0, 10.0,   2.0),
('Bread (White)',    25, 'slice',    63,   2.1, 12.4,  0.5,   0.5),
('Bread (Brown)',    25, 'slice',    59,   2.5, 11.0,  0.8,   1.6),
-- International / Common
('Pizza (slice)',   100, 'g',       266,  11.0, 33.0, 10.0,   2.3),
('Burger',         200, 'g',       500,  22.0, 49.0, 24.0,   3.0),
('French Fries',   100, 'g',       312,   3.4, 41.0, 15.0,   3.8),
('White Pasta',    100, 'g',       371,  13.0, 75.0,  1.5,   3.2),
('Sandwich',       150, 'g',       290,  12.0, 43.0,  8.0,   3.5),
('Salad (Garden)', 100, 'g',        20,   1.2,  3.8,  0.3,   1.5),
('Chocolate Bar',   40, 'g',       215,   2.4, 26.0, 12.0,   1.2)
ON CONFLICT (name) DO NOTHING;
