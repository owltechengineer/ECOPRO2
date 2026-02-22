-- ═══════════════════════════════════════════════════════════
-- ECOPRO — Initial Database Schema
-- Supabase PostgreSQL + Row Level Security
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  global_settings JSONB NOT NULL DEFAULT '{
    "currency": "EUR",
    "fiscalYearStart": 1,
    "language": "it",
    "timezone": "Europe/Rome",
    "kpiThresholds": {
      "roiWarning": 5,
      "marginWarning": 10,
      "burnRateCritical": 3,
      "budgetOverrunWarning": 15
    },
    "notifications": {
      "emailAlerts": true,
      "pushAlerts": true,
      "weeklyDigest": true,
      "alertTypes": ["budget_overrun","task_delayed","margin_below_threshold","burn_rate_critical"]
    }
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT NOT NULL,
  business_models TEXT[] NOT NULL DEFAULT '{}',
  geography TEXT[] NOT NULL DEFAULT '{}',
  lifecycle_stage TEXT NOT NULL DEFAULT 'early_stage',
  capital_invested DECIMAL(15,2) NOT NULL DEFAULT 0,
  weekly_time_allocated DECIMAL(5,1) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{
    "currency": "EUR",
    "alertThresholds": {},
    "aiEnabled": true,
    "marketIntelligenceEnabled": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_is_active ON activities(is_active);

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  methodology TEXT NOT NULL DEFAULT 'agile',
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner_id UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_end_date DATE,
  budget_estimated DECIMAL(15,2) NOT NULL DEFAULT 0,
  budget_actual DECIMAL(15,2) NOT NULL DEFAULT 0,
  revenue_estimated DECIMAL(15,2) NOT NULL DEFAULT 0,
  revenue_actual DECIMAL(15,2) NOT NULL DEFAULT 0,
  completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_activity_id ON projects(activity_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ─────────────────────────────────────────────
-- MILESTONES
-- ─────────────────────────────────────────────

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner TEXT,
  estimated_hours DECIMAL(6,1) NOT NULL DEFAULT 0,
  actual_hours DECIMAL(6,1) NOT NULL DEFAULT 0,
  start_date DATE,
  deadline DATE NOT NULL,
  completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  dependencies UUID[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_activity_id ON tasks(activity_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- ─────────────────────────────────────────────
-- FINANCIAL RECORDS
-- ─────────────────────────────────────────────

CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- revenue | direct_cost | indirect_cost | investment | tax | financing
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT, -- monthly | quarterly | annual
  invoice_ref TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_records_activity_id ON financial_records(activity_id);
CREATE INDEX idx_financial_records_user_id ON financial_records(user_id);
CREATE INDEX idx_financial_records_date ON financial_records(date);
CREATE INDEX idx_financial_records_type ON financial_records(type);

-- ─────────────────────────────────────────────
-- FORECAST SCENARIOS
-- ─────────────────────────────────────────────

CREATE TABLE forecast_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'base',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  assumptions JSONB NOT NULL DEFAULT '{}',
  projections JSONB NOT NULL DEFAULT '[]',
  projected_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  projected_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
  projected_margin DECIMAL(15,2) NOT NULL DEFAULT 0,
  projected_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  projected_roi DECIMAL(7,2) NOT NULL DEFAULT 0,
  break_even_month TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forecast_scenarios_activity_id ON forecast_scenarios(activity_id);
CREATE INDEX idx_forecast_scenarios_user_id ON forecast_scenarios(user_id);

-- ─────────────────────────────────────────────
-- MARKET PROFILES
-- ─────────────────────────────────────────────

CREATE TABLE market_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  market_size DECIMAL(20,2) NOT NULL DEFAULT 0,
  servicable_market DECIMAL(20,2) NOT NULL DEFAULT 0,
  target_market DECIMAL(20,2) NOT NULL DEFAULT 0,
  growth_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  competitor_intensity TEXT NOT NULL DEFAULT 'medium',
  pricing_average DECIMAL(10,2) NOT NULL DEFAULT 0,
  barriers_to_entry TEXT[] NOT NULL DEFAULT '{}',
  key_trends TEXT[] NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_profiles_activity_id ON market_profiles(activity_id);

-- ─────────────────────────────────────────────
-- COMPETITORS
-- ─────────────────────────────────────────────

CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  estimated_revenue DECIMAL(15,2),
  market_share DECIMAL(5,2),
  pricing DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitors_activity_id ON competitors(activity_id);

-- ─────────────────────────────────────────────
-- AI REPORTS
-- ─────────────────────────────────────────────

CREATE TABLE ai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  data_snapshot JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reports_activity_id ON ai_reports(activity_id);
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);

-- ─────────────────────────────────────────────
-- ALERTS
-- ─────────────────────────────────────────────

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_activity_id ON alerts(activity_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- Activities: users see only their own
CREATE POLICY "activities_own" ON activities
  FOR ALL USING (user_id = auth.uid());

-- Projects
CREATE POLICY "projects_own" ON projects
  FOR ALL USING (user_id = auth.uid());

-- Milestones: via project ownership
CREATE POLICY "milestones_own" ON milestones
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Tasks
CREATE POLICY "tasks_own" ON tasks
  FOR ALL USING (user_id = auth.uid());

-- Financial records
CREATE POLICY "financial_records_own" ON financial_records
  FOR ALL USING (user_id = auth.uid());

-- Forecast scenarios
CREATE POLICY "forecast_scenarios_own" ON forecast_scenarios
  FOR ALL USING (user_id = auth.uid());

-- Market profiles
CREATE POLICY "market_profiles_own" ON market_profiles
  FOR ALL USING (user_id = auth.uid());

-- Competitors
CREATE POLICY "competitors_own" ON competitors
  FOR ALL USING (user_id = auth.uid());

-- AI reports
CREATE POLICY "ai_reports_own" ON ai_reports
  FOR ALL USING (user_id = auth.uid());

-- Alerts
CREATE POLICY "alerts_own" ON alerts
  FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: auto-update updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER forecast_scenarios_updated_at
  BEFORE UPDATE ON forecast_scenarios
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile on user signup
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- VIEWS: aggregated KPIs per activity
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW activity_financial_summary AS
SELECT
  a.id AS activity_id,
  a.user_id,
  a.name AS activity_name,
  COALESCE(SUM(CASE WHEN fr.type = 'revenue' THEN fr.amount ELSE 0 END), 0) AS total_revenue,
  COALESCE(SUM(CASE WHEN fr.type IN ('direct_cost','indirect_cost') THEN fr.amount ELSE 0 END), 0) AS total_costs,
  COALESCE(SUM(CASE WHEN fr.type = 'revenue' THEN fr.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN fr.type IN ('direct_cost','indirect_cost') THEN fr.amount ELSE 0 END), 0) AS gross_margin,
  a.capital_invested
FROM activities a
LEFT JOIN financial_records fr ON fr.activity_id = a.id
GROUP BY a.id, a.user_id, a.name, a.capital_invested;

CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.id,
  p.activity_id,
  p.user_id,
  p.name,
  p.status,
  p.priority,
  p.completion_pct,
  p.budget_estimated,
  p.budget_actual,
  p.revenue_estimated,
  p.revenue_actual,
  p.budget_actual - p.budget_estimated AS budget_variance,
  p.revenue_actual - p.revenue_estimated AS revenue_variance,
  p.end_date,
  COUNT(t.id) AS total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS completed_tasks,
  COUNT(CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'done' THEN 1 END) AS overdue_tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id, p.activity_id, p.user_id, p.name, p.status, p.priority,
         p.completion_pct, p.budget_estimated, p.budget_actual,
         p.revenue_estimated, p.revenue_actual, p.end_date;
