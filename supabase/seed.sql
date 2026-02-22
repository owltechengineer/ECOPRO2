-- ═══════════════════════════════════════════════════════════
-- ECOPRO — Seed Data (Demo)
-- Run this AFTER 001_initial_schema.sql + 002_personal_setup.sql
-- UUID charset: 0-9 and a-f only
-- ═══════════════════════════════════════════════════════════

-- Pulizia opzionale (decommenta per ripartire da zero)
-- TRUNCATE forecast_scenarios, financial_records, tasks, projects, activities CASCADE;

-- ─────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────
-- IDs: a1…a3 (a = valid hex)

INSERT INTO activities (id, name, description, sector, business_models, geography, lifecycle_stage, capital_invested, weekly_time_allocated, color, is_active, settings)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'OWLTECH',
    'Studio di consulenza e sviluppo software per PMI. Specializzato in digitalizzazione processi, custom software e AI integration.',
    'Technology / Software',
    ARRAY['b2b','consulting','saas'],
    ARRAY['Italia','Europa'],
    'growth',
    45000.00, 35, '#6366f1', true,
    '{"currency":"EUR","alertThresholds":{"roiWarning":5,"marginWarning":10,"burnRateCritical":3,"budgetOverrunWarning":15},"aiEnabled":true,"marketIntelligenceEnabled":true}'::jsonb
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'ECOCEO',
    'Piattaforma SaaS per la gestione multi-attività dei founder. Dashboard intelligente per controllare tutti i business in un unico posto.',
    'SaaS / FinTech',
    ARRAY['saas','b2b2c'],
    ARRAY['Italia','Europa','USA'],
    'early_stage',
    28000.00, 20, '#10b981', true,
    '{"currency":"EUR","alertThresholds":{"roiWarning":5,"marginWarning":10,"burnRateCritical":3,"budgetOverrunWarning":15},"aiEnabled":true,"marketIntelligenceEnabled":true}'::jsonb
  ),
  (
    'a3000000-0000-0000-0000-000000000003',
    'DESIGNLAB',
    'Agenzia di branding e design strategico per startup e scale-up. Identità visiva, UI/UX, brand positioning.',
    'Design / Branding',
    ARRAY['b2b','consulting'],
    ARRAY['Italia'],
    'mature',
    12000.00, 15, '#f59e0b', true,
    '{"currency":"EUR","alertThresholds":{"roiWarning":5,"marginWarning":10,"burnRateCritical":3,"budgetOverrunWarning":15},"aiEnabled":false,"marketIntelligenceEnabled":true}'::jsonb
  );

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
-- IDs: b1…b4 = OWLTECH, b5…b6 = ECOCEO, b7…b8 = DESIGNLAB

INSERT INTO projects (id, activity_id, name, description, methodology, status, priority, start_date, end_date, budget_estimated, budget_actual, revenue_estimated, revenue_actual, completion_pct, tags)
VALUES
  -- OWLTECH
  ('b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Portale B2B Cliente XYZ','Sviluppo portale web per gestione ordini e reportistica per cliente manifatturiero.',
   'agile','in_progress','high','2025-11-01','2026-03-31',
   18000,9500,22000,11000,55, ARRAY['web','b2b','react','nodejs']),

  ('b2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',
   'AI Integration — Automazione Fatturazione','Integrazione modulo AI per automatizzare generazione e validazione fatture.',
   'kanban','planning','critical','2026-02-01','2026-05-31',
   12000,1200,15000,0,10, ARRAY['ai','automation','fintech']),

  ('b3000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',
   'Consulenza Digital Transform — PMI Lombardia','Consulenza strategica per trasformazione digitale di un consorzio di PMI.',
   'waterfall','completed','medium','2025-07-01','2025-12-31',
   8000,7800,10000,10000,100, ARRAY['consulting','pmi','digital']),

  ('b4000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001',
   'SaaS Dashboard Analytics','Piattaforma analytics white-label da rivendere ai clienti di consulenza.',
   'agile','backlog','medium','2026-04-01','2026-09-30',
   25000,0,40000,0,0, ARRAY['saas','analytics','white-label']),

  -- ECOCEO
  ('b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'MVP — Core Platform','Core della piattaforma: autenticazione, gestione attività, dashboard globale e modulo projects.',
   'agile','in_progress','critical','2025-10-01','2026-04-30',
   35000,18000,0,0,52, ARRAY['mvp','nextjs','supabase','core']),

  ('b6000000-0000-0000-0000-000000000006','a2000000-0000-0000-0000-000000000002',
   'Go-to-Market & Early Access','Strategia di lancio, landing page, early adopter program e onboarding flow.',
   'lean','planning','high','2026-03-01','2026-06-30',
   8000,500,12000,0,5, ARRAY['marketing','gtm','landing','growth']),

  -- DESIGNLAB
  ('b7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',
   'Rebranding Startup HealthTech','Brand identity completo: logo, palette, tipografia, brand book e kit UI.',
   'design_sprint','in_progress','high','2026-01-15','2026-03-31',
   6500,3200,7500,3750,48, ARRAY['branding','healthtech','identity']),

  ('b8000000-0000-0000-0000-000000000008','a3000000-0000-0000-0000-000000000003',
   'UI/UX — App Mobile Fintech','Progettazione completa UX/UI per app mobile di gestione investimenti personali.',
   'design_sprint','planning','medium','2026-03-01','2026-05-31',
   9000,0,9000,0,0, ARRAY['ux','ui','mobile','fintech']);

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────
-- IDs: c1…c6 = Portale B2B | c7…c9 = AI Fatturazione
--      c0a…c0f = ECOCEO MVP  | caa…cad = DESIGNLAB

INSERT INTO tasks (id, project_id, activity_id, name, description, status, priority, owner, estimated_hours, actual_hours, start_date, deadline, completion_pct, tags)
VALUES
  -- Portale B2B (b1)
  ('c1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Setup infrastruttura cloud','Configurazione AWS EC2, RDS, S3, CloudFront, SSL.',
   'done','high','Marco R.',16,18,'2025-11-01','2025-11-15',100, ARRAY['devops','aws']),

  ('c2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Autenticazione & RBAC','Login, ruoli utente, permessi per cliente/admin/operatore.',
   'done','critical','Marco R.',24,22,'2025-11-10','2025-11-30',100, ARRAY['auth','security']),

  ('c3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Dashboard ordini & filtri avanzati','Tabella ordini con filtri per data, stato, cliente. Export CSV/PDF.',
   'in_progress','high','Sara V.',32,18,'2025-12-01','2026-01-31',60, ARRAY['frontend','react']),

  ('c4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'API REST ordini & integrazione ERP','Endpoint CRUD ordini + webhook per sync con ERP cliente.',
   'in_progress','high','Marco R.',40,20,'2025-12-15','2026-02-14',50, ARRAY['backend','api','erp']),

  ('c5000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Reportistica KPI avanzata','Grafici interattivi: fatturato mensile, top prodotti, mappa geografica ordini.',
   'todo','medium','Sara V.',28,0,'2026-02-15','2026-03-15',0, ARRAY['frontend','charts']),

  ('c6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Testing & QA finale','Test end-to-end, load test, penetration test base, documentazione utente.',
   'todo','high','Marco R.',20,0,'2026-03-16','2026-03-28',0, ARRAY['qa','testing']),

  -- AI Fatturazione (b2)
  ('c7000000-0000-0000-0000-000000000007','b2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',
   'Ricerca e selezione modello LLM','Benchmark GPT-4o vs Claude vs Mistral per parsing documenti fiscali.',
   'todo','critical','Marco R.',12,0,'2026-02-01','2026-02-28',0, ARRAY['ai','research']),

  ('c8000000-0000-0000-0000-000000000008','b2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',
   'Prototipo parsing fatture PDF','Pipeline OCR + LLM per estrazione dati strutturati da PDF.',
   'in_progress','high','Marco R.',24,5,'2026-02-10','2026-03-15',20, ARRAY['ai','nlp','pdf']),

  ('c9000000-0000-0000-0000-000000000009','b2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',
   'Validazione dati & regole business','Motore di validazione: IVA, codici fiscali, date competenza, soglie.',
   'todo','high','Sara V.',16,0,'2026-03-20','2026-04-15',0, ARRAY['backend','validation']),

  -- ECOCEO MVP (b5)
  ('ca000000-0000-0000-0000-000000000001','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Architettura DB & schema Supabase','Tabelle, RLS, relazioni, indici, migration scripts.',
   'done','critical','Dev',20,22,'2025-10-01','2025-11-30',100, ARRAY['db','supabase']),

  ('ca000000-0000-0000-0000-000000000002','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Dashboard globale + activity cards','Layout principale, sidebar, header, card attività con KPI.',
   'done','high','Dev',30,28,'2025-11-01','2025-12-31',100, ARRAY['frontend','dashboard']),

  ('ca000000-0000-0000-0000-000000000003','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Modulo Projects & Gantt','Gestione progetti con vista lista, Gantt timeline e task management.',
   'in_progress','high','Dev',40,20,'2026-01-01','2026-02-28',50, ARRAY['frontend','gantt']),

  ('ca000000-0000-0000-0000-000000000004','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Modulo Finance & simulazioni','Dashboard finanziaria, record entrate/uscite, scenari forecast.',
   'in_progress','medium','Dev',35,10,'2026-01-15','2026-03-31',28, ARRAY['frontend','finance']),

  ('ca000000-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Integrazione AI Reports','Chiamate OpenAI per analisi strategica automatica per ogni activity.',
   'todo','low','Dev',25,0,'2026-03-01','2026-04-30',0, ARRAY['ai','openai']),

  ('ca000000-0000-0000-0000-000000000006','b5000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
   'Mobile responsiveness & PWA','Ottimizzazione layout mobile, service worker, installabilità.',
   'todo','medium','Dev',18,0,'2026-04-01','2026-04-20',0, ARRAY['mobile','pwa']),

  -- DESIGNLAB Rebranding (b7)
  ('cb000000-0000-0000-0000-000000000001','b7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',
   'Audit brand attuale + brief creativo','Analisi posizionamento attuale, competitor, target audience.',
   'done','high','Giulia M.',8,9,'2026-01-15','2026-01-25',100, ARRAY['research','brief']),

  ('cb000000-0000-0000-0000-000000000002','b7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',
   'Concept logo — 3 varianti','Sviluppo 3 direzioni creative per il nuovo logo con moodboard.',
   'done','critical','Giulia M.',16,14,'2026-01-26','2026-02-10',100, ARRAY['logo','design']),

  ('cb000000-0000-0000-0000-000000000003','b7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',
   'Brand system completo','Palette, tipografia, iconografia, pattern, componenti UI base.',
   'in_progress','high','Giulia M.',24,10,'2026-02-11','2026-03-15',40, ARRAY['brand','system']),

  ('cb000000-0000-0000-0000-000000000004','b7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',
   'Brand book & deliverable finali','PDF brand guidelines, file sorgente, kit social, keynote template.',
   'todo','medium','Giulia M.',12,0,'2026-03-16','2026-03-28',0, ARRAY['brandbook','delivery']);

-- ─────────────────────────────────────────────
-- FINANCIAL RECORDS — OWLTECH
-- ─────────────────────────────────────────────

INSERT INTO financial_records (activity_id, type, category, description, amount, currency, date, is_recurring, recurring_interval, tags)
VALUES
  ('a1000000-0000-0000-0000-000000000001','revenue','services','Acconto Portale B2B XYZ — Fase 1',5500,'EUR','2025-11-20',false,null,ARRAY['xyzproject']),
  ('a1000000-0000-0000-0000-000000000001','revenue','services','SAL Portale B2B XYZ — 50%',5500,'EUR','2026-01-15',false,null,ARRAY['xyzproject']),
  ('a1000000-0000-0000-0000-000000000001','revenue','consulting','Consulenza Digital PMI — saldo finale',10000,'EUR','2026-01-05',false,null,ARRAY['consulting']),
  ('a1000000-0000-0000-0000-000000000001','revenue','services','Canone manutenzione software — Gen 2026',1200,'EUR','2026-01-31',true,'monthly',ARRAY['maintenance']),
  ('a1000000-0000-0000-0000-000000000001','revenue','services','Canone manutenzione software — Feb 2026',1200,'EUR','2026-02-28',true,'monthly',ARRAY['maintenance']),
  ('a1000000-0000-0000-0000-000000000001','direct_cost','personnel','Collaboratore Marco R. — Nov/Dic 2025',3600,'EUR','2025-12-31',false,null,ARRAY['personnel']),
  ('a1000000-0000-0000-0000-000000000001','direct_cost','personnel','Collaboratrice Sara V. — Nov/Dic 2025',2800,'EUR','2025-12-31',false,null,ARRAY['personnel']),
  ('a1000000-0000-0000-0000-000000000001','direct_cost','personnel','Collaboratore Marco R. — Gen/Feb 2026',3800,'EUR','2026-02-28',false,null,ARRAY['personnel']),
  ('a1000000-0000-0000-0000-000000000001','indirect_cost','software','Licenze SaaS — Figma, GitHub, AWS',420,'EUR','2026-01-01',true,'monthly',ARRAY['tools']),
  ('a1000000-0000-0000-0000-000000000001','indirect_cost','marketing','LinkedIn Ads — Lead gen B2B',600,'EUR','2026-01-10',false,null,ARRAY['ads']),
  ('a1000000-0000-0000-0000-000000000001','indirect_cost','operations','Contabilità & commercialista — Q4 2025',850,'EUR','2026-01-20',false,null,ARRAY['admin']),
  ('a1000000-0000-0000-0000-000000000001','investment','equipment','MacBook Pro M3 — workstation principale',3200,'EUR','2025-11-05',false,null,ARRAY['hardware']);

-- ─────────────────────────────────────────────
-- FINANCIAL RECORDS — ECOCEO
-- ─────────────────────────────────────────────

INSERT INTO financial_records (activity_id, type, category, description, amount, currency, date, is_recurring, tags)
VALUES
  ('a2000000-0000-0000-0000-000000000002','direct_cost','personnel','Dev time (ore interne) — Q4 2025',8000,'EUR','2025-12-31',false,ARRAY['dev']),
  ('a2000000-0000-0000-0000-000000000002','direct_cost','personnel','Dev time (ore interne) — Gen 2026',3500,'EUR','2026-01-31',false,ARRAY['dev']),
  ('a2000000-0000-0000-0000-000000000002','direct_cost','personnel','Dev time (ore interne) — Feb 2026',3500,'EUR','2026-02-28',false,ARRAY['dev']),
  ('a2000000-0000-0000-0000-000000000002','indirect_cost','software','Supabase Pro — hosting DB',25,'EUR','2026-01-01',true,ARRAY['hosting']),
  ('a2000000-0000-0000-0000-000000000002','indirect_cost','software','Vercel Pro — hosting frontend',20,'EUR','2026-01-01',true,ARRAY['hosting']),
  ('a2000000-0000-0000-0000-000000000002','indirect_cost','marketing','Dominio + email professionale',65,'EUR','2025-10-15',false,ARRAY['domain']),
  ('a2000000-0000-0000-0000-000000000002','investment','equipment','Investimento iniziale fondatore',28000,'EUR','2025-10-01',false,ARRAY['capital']);

-- ─────────────────────────────────────────────
-- FINANCIAL RECORDS — DESIGNLAB
-- ─────────────────────────────────────────────

INSERT INTO financial_records (activity_id, type, category, description, amount, currency, date, is_recurring, tags)
VALUES
  ('a3000000-0000-0000-0000-000000000003','revenue','services','Acconto Rebranding HealthTech — 50%',3750,'EUR','2026-01-20',false,ARRAY['healthtech']),
  ('a3000000-0000-0000-0000-000000000003','revenue','services','Canone retainer mensile — Gen 2026',1800,'EUR','2026-01-31',true,ARRAY['retainer']),
  ('a3000000-0000-0000-0000-000000000003','revenue','services','Canone retainer mensile — Feb 2026',1800,'EUR','2026-02-28',true,ARRAY['retainer']),
  ('a3000000-0000-0000-0000-000000000003','direct_cost','personnel','Giulia M. — ore lavoro Gen/Feb 2026',2400,'EUR','2026-02-28',false,ARRAY['personnel']),
  ('a3000000-0000-0000-0000-000000000003','indirect_cost','software','Adobe CC + Figma',110,'EUR','2026-01-01',true,ARRAY['tools']),
  ('a3000000-0000-0000-0000-000000000003','indirect_cost','operations','Affitto postazione coworking',350,'EUR','2026-01-01',true,ARRAY['office']);

-- ─────────────────────────────────────────────
-- FORECAST SCENARIOS
-- ─────────────────────────────────────────────

INSERT INTO forecast_scenarios (id, activity_id, name, type, description, is_active, assumptions, projections, projected_revenue, projected_costs, projected_margin, projected_margin_pct, projected_roi, break_even_month)
VALUES
  (
    'dc000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Base 2026',
    'base',
    'Scenario conservativo: clienti esistenti + 2 nuovi contratti nel semestre.',
    true,
    '{"revenueGrowthRate":15,"costGrowthRate":8,"newClients":2,"avgContractValue":12000,"churnRate":5}'::jsonb,
    '[
      {"month":"2026-01","revenue":8400,"costs":5200,"margin":3200,"cumulativeRevenue":8400,"cumulativeCosts":5200},
      {"month":"2026-02","revenue":9100,"costs":5400,"margin":3700,"cumulativeRevenue":17500,"cumulativeCosts":10600},
      {"month":"2026-03","revenue":9800,"costs":5600,"margin":4200,"cumulativeRevenue":27300,"cumulativeCosts":16200},
      {"month":"2026-04","revenue":11000,"costs":5800,"margin":5200,"cumulativeRevenue":38300,"cumulativeCosts":22000},
      {"month":"2026-05","revenue":11500,"costs":6000,"margin":5500,"cumulativeRevenue":49800,"cumulativeCosts":28000},
      {"month":"2026-06","revenue":12000,"costs":6200,"margin":5800,"cumulativeRevenue":61800,"cumulativeCosts":34200}
    ]'::jsonb,
    61800, 34200, 27600, 44.66, 28.5, '2026-02'
  ),
  (
    'dc000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Ottimistico 2026',
    'optimistic',
    'Scenario ottimistico: lancio SaaS + 4 nuovi clienti enterprise nel semestre.',
    false,
    '{"revenueGrowthRate":40,"costGrowthRate":18,"newClients":4,"avgContractValue":18000,"churnRate":2}'::jsonb,
    '[
      {"month":"2026-01","revenue":10000,"costs":6000,"margin":4000,"cumulativeRevenue":10000,"cumulativeCosts":6000},
      {"month":"2026-02","revenue":12000,"costs":6500,"margin":5500,"cumulativeRevenue":22000,"cumulativeCosts":12500},
      {"month":"2026-03","revenue":14000,"costs":7000,"margin":7000,"cumulativeRevenue":36000,"cumulativeCosts":19500},
      {"month":"2026-04","revenue":18000,"costs":8000,"margin":10000,"cumulativeRevenue":54000,"cumulativeCosts":27500},
      {"month":"2026-05","revenue":20000,"costs":8500,"margin":11500,"cumulativeRevenue":74000,"cumulativeCosts":36000},
      {"month":"2026-06","revenue":22000,"costs":9000,"margin":13000,"cumulativeRevenue":96000,"cumulativeCosts":45000}
    ]'::jsonb,
    96000, 45000, 51000, 53.13, 62.0, '2026-01'
  ),
  (
    'dc000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000002',
    'Launch Plan H2 2026',
    'base',
    'Lancio pubblico a Luglio 2026. Target: 50 clienti paganti a fine anno.',
    true,
    '{"revenueGrowthRate":0,"costGrowthRate":5,"launchMonth":"2026-07","targetUsers":50,"avgMRR":49}'::jsonb,
    '[
      {"month":"2026-03","revenue":0,"costs":4000,"margin":-4000,"cumulativeRevenue":0,"cumulativeCosts":4000},
      {"month":"2026-04","revenue":0,"costs":4000,"margin":-4000,"cumulativeRevenue":0,"cumulativeCosts":8000},
      {"month":"2026-05","revenue":0,"costs":3500,"margin":-3500,"cumulativeRevenue":0,"cumulativeCosts":11500},
      {"month":"2026-06","revenue":0,"costs":3500,"margin":-3500,"cumulativeRevenue":0,"cumulativeCosts":15000},
      {"month":"2026-07","revenue":980,"costs":2500,"margin":-1520,"cumulativeRevenue":980,"cumulativeCosts":17500},
      {"month":"2026-08","revenue":2450,"costs":2500,"margin":-50,"cumulativeRevenue":3430,"cumulativeCosts":20000},
      {"month":"2026-09","revenue":3920,"costs":2500,"margin":1420,"cumulativeRevenue":7350,"cumulativeCosts":22500},
      {"month":"2026-10","revenue":5390,"costs":2800,"margin":2590,"cumulativeRevenue":12740,"cumulativeCosts":25300},
      {"month":"2026-11","revenue":6370,"costs":2800,"margin":3570,"cumulativeRevenue":19110,"cumulativeCosts":28100},
      {"month":"2026-12","revenue":7350,"costs":3000,"margin":4350,"cumulativeRevenue":26460,"cumulativeCosts":31100}
    ]'::jsonb,
    26460, 31100, -4640, -17.53, -16.7, '2026-09'
  );
