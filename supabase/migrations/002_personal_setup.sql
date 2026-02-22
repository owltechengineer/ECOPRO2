-- ═══════════════════════════════════════════════════════════
-- ECOPRO — Personal Setup Migration
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema.sql
-- Adapts the schema for single-user personal use (no auth required)
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Make user_id nullable on all tables
--    (personal app — no logged-in user needed)
-- ─────────────────────────────────────────────
ALTER TABLE activities             ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE projects               ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE tasks                  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE financial_records      ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE forecast_scenarios     ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE market_profiles        ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE competitors            ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE ai_reports             ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE alerts                 ALTER COLUMN user_id DROP NOT NULL;

-- ─────────────────────────────────────────────
-- 2. Disable Row Level Security on all tables
--    (single-user — no multi-tenant isolation needed)
-- ─────────────────────────────────────────────
ALTER TABLE profiles               DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities             DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects               DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones             DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records      DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_scenarios     DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_profiles        DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitors            DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports             DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                 DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 3. Drop foreign key constraints on user_id
--    (no longer referencing auth.users)
-- ─────────────────────────────────────────────
ALTER TABLE activities        DROP CONSTRAINT IF EXISTS activities_user_id_fkey;
ALTER TABLE projects          DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE projects          DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE tasks             DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE financial_records DROP CONSTRAINT IF EXISTS financial_records_user_id_fkey;
ALTER TABLE forecast_scenarios DROP CONSTRAINT IF EXISTS forecast_scenarios_user_id_fkey;
ALTER TABLE market_profiles   DROP CONSTRAINT IF EXISTS market_profiles_user_id_fkey;
ALTER TABLE competitors       DROP CONSTRAINT IF EXISTS competitors_user_id_fkey;
ALTER TABLE ai_reports        DROP CONSTRAINT IF EXISTS ai_reports_user_id_fkey;
ALTER TABLE alerts            DROP CONSTRAINT IF EXISTS alerts_user_id_fkey;

-- Done. The app can now read/write without authentication.
