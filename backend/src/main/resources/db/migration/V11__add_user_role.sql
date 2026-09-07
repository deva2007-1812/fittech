-- ─────────────────────────────────────────────────────────────────────────────
-- V11__add_user_role.sql
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Promote specific admin account
UPDATE users SET role = 'ADMIN' WHERE LOWER(email) = 'devavelu2007@gmail.com';
