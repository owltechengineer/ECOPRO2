// ═══════════════════════════════════════════════════════════
// ECOPRO — Domain Type System
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type LifecycleStage =
  | "idea"
  | "validation"
  | "early_stage"
  | "growth"
  | "scale"
  | "mature"
  | "exit";

export type BusinessModel =
  | "b2b"
  | "b2c"
  | "b2b2c"
  | "marketplace"
  | "saas"
  | "consulting"
  | "product"
  | "ecommerce"
  | "franchise"
  | "licensing";

export type ProjectStatus =
  | "backlog"
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked";

export type ProjectMethodology =
  | "agile"
  | "waterfall"
  | "kanban"
  | "scrum"
  | "lean"
  | "hybrid";

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export type AlertType =
  | "budget_overrun"
  | "task_delayed"
  | "margin_below_threshold"
  | "burn_rate_critical"
  | "milestone_reached"
  | "revenue_target_met"
  | "roi_negative"
  | "deadline_approaching";

export type Currency = "EUR" | "USD" | "GBP" | "CHF";

export type AIReportType =
  | "strategic"
  | "project_optimization"
  | "market_analysis"
  | "financial_forecast"
  | "competitor_analysis";

export type ScenarioType = "optimistic" | "base" | "pessimistic" | "custom";

// ─────────────────────────────────────────────
// CORE ENTITY: USER
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  globalSettings: GlobalSettings;
}

export interface GlobalSettings {
  currency: Currency;
  fiscalYearStart: number; // month 1-12
  language: string;
  timezone: string;
  kpiThresholds: KPIThresholds;
  notifications: NotificationSettings;
}

export interface KPIThresholds {
  roiWarning: number;        // % below which ROI triggers warning
  marginWarning: number;     // % below which margin triggers warning
  burnRateCritical: number;  // months of runway below which burn is critical
  budgetOverrunWarning: number; // % over budget to trigger warning
}

export interface NotificationSettings {
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyDigest: boolean;
  alertTypes: AlertType[];
}

// ─────────────────────────────────────────────
// CORE ENTITY: ACTIVITY
// ─────────────────────────────────────────────

export interface Activity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  sector: string;
  businessModels: BusinessModel[];
  geography: string[];
  lifecycleStage: LifecycleStage;
  capitalInvested: number;
  weeklyTimeAllocated: number; // hours
  color: string;              // brand color for UI
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: ActivitySettings;

  // Computed / aggregated (not in DB)
  kpis?: ActivityKPIs;
  alerts?: Alert[];
}

export interface ActivitySettings {
  currency: Currency;
  alertThresholds: Partial<KPIThresholds>;
  aiEnabled: boolean;
  marketIntelligenceEnabled: boolean;
  customKPIs?: CustomKPI[];
}

export interface CustomKPI {
  id: string;
  name: string;
  formula: string;
  unit: string;
  target: number;
  warningThreshold: number;
}

// ─────────────────────────────────────────────
// ACTIVITY KPIs (computed)
// ─────────────────────────────────────────────

export interface ActivityKPIs {
  // Revenue & Profitability
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  grossMarginPct: number;
  netMargin: number;
  netMarginPct: number;
  ebitda: number;
  ebitdaPct: number;

  // Return
  roi: number;             // %
  paybackPeriodMonths: number;

  // Cash Flow
  cashFlow: number;
  burnRate: number;        // per month
  runwayMonths: number;

  // Growth
  revenueGrowthRate: number; // YoY %
  costVariance: number;      // actual vs budget
  revenueVariance: number;

  // Efficiency
  productivityIndex: number;
  healthScore: number;      // 0–100 composite

  // Time
  budgetUtilizationPct: number;
  period: string; // e.g. "2025-Q1"
}

// ─────────────────────────────────────────────
// ENTITY: PROJECT
// ─────────────────────────────────────────────

export interface Project {
  id: string;
  activityId: string;
  name: string;
  description?: string;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerId: string;

  // Dates
  startDate: string;
  endDate: string;
  actualEndDate?: string;

  // Budget
  budgetEstimated: number;
  budgetActual: number;

  // Revenue
  revenueEstimated: number;
  revenueActual: number;

  // Progress
  completionPct: number;

  tags: string[];
  createdAt: string;
  updatedAt: string;

  // Relations
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectMetrics {
  budgetVariance: number;
  budgetVariancePct: number;
  revenueVariance: number;
  revenueVariancePct: number;
  scheduleVarianceDays: number;
  projectROI: number;
  delayRisk: "low" | "medium" | "high" | "critical";
  completionForecastDate: string;
}

// ─────────────────────────────────────────────
// ENTITY: TASK
// ─────────────────────────────────────────────

export interface Task {
  id: string;
  projectId: string;
  activityId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  owner?: string;
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  deadline: string;
  completionPct: number;
  dependencies?: string[];  // task IDs
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// ENTITY: MILESTONE
// ─────────────────────────────────────────────

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  completedDate?: string;
  isCompleted: boolean;
  deliverables: string[];
}

// ─────────────────────────────────────────────
// ENTITY: FINANCIAL RECORD
// ─────────────────────────────────────────────

export type FinancialRecordType =
  | "revenue"
  | "direct_cost"
  | "indirect_cost"
  | "investment"
  | "tax"
  | "financing";

export type FinancialCategory =
  | "sales"
  | "services"
  | "subscriptions"
  | "advertising"
  | "personnel"
  | "operations"
  | "marketing"
  | "technology"
  | "legal"
  | "rent"
  | "equipment"
  | "other";

export interface FinancialRecord {
  id: string;
  activityId: string;
  projectId?: string;
  type: FinancialRecordType;
  category: FinancialCategory;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  isRecurring: boolean;
  recurringInterval?: "monthly" | "quarterly" | "annual";
  invoiceRef?: string;
  tags: string[];
  createdAt: string;
}

// Monthly aggregation
export interface MonthlyCashFlow {
  month: string; // YYYY-MM
  inflows: number;
  outflows: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

// ─────────────────────────────────────────────
// ENTITY: FORECAST SCENARIO
// ─────────────────────────────────────────────

export interface ForecastScenario {
  id: string;
  activityId: string;
  name: string;
  type: ScenarioType;
  description?: string;
  isActive: boolean;

  assumptions: ScenarioAssumptions;
  projections: MonthlyProjection[];

  projectedRevenue: number;      // annual
  projectedCosts: number;
  projectedMargin: number;
  projectedMarginPct: number;
  projectedROI: number;
  breakEvenMonth?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ScenarioAssumptions {
  revenueGrowthRate: number;     // % monthly
  costInflationRate: number;
  newCustomersPerMonth: number;
  averageOrderValue: number;
  churnRate: number;             // % monthly (SaaS)
  marketingSpend: number;
  hiringPlan: HiringPlanEntry[];
  capitalEvents: CapitalEvent[];
}

export interface HiringPlanEntry {
  month: string;
  role: string;
  monthlyCost: number;
}

export interface CapitalEvent {
  month: string;
  type: "investment" | "loan" | "grant" | "exit";
  amount: number;
  description: string;
}

export interface MonthlyProjection {
  month: string;
  revenue: number;
  costs: number;
  margin: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  employees?: number;
  customers?: number;
}

// ─────────────────────────────────────────────
// ENTITY: MARKET PROFILE
// ─────────────────────────────────────────────

export interface MarketProfile {
  id: string;
  activityId: string;
  marketSize: number;           // TAM €
  servicableMarket: number;     // SAM €
  targetMarket: number;         // SOM €
  growthRate: number;           // % annual
  competitorIntensity: "low" | "medium" | "high" | "very_high";
  pricingAverage: number;
  /** Contesto del prezzo medio, es. "per licenza SaaS/mese" */
  pricingLabel?: string;
  barriersToEntry: string[];
  keyTrends: string[];
  lastUpdated: string;
}

export interface Competitor {
  id: string;
  activityId: string;
  name: string;
  website?: string;
  strengths: string[];
  weaknesses: string[];
  estimatedRevenue?: number;
  marketShare?: number;
  pricing?: number;
  notes: string;
}

// ─────────────────────────────────────────────
// ENTITY: AI REPORT
// ─────────────────────────────────────────────

export interface AIReport {
  id: string;
  activityId: string;
  type: AIReportType;
  title: string;
  summary: string;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  generatedAt: string;
  dataSnapshot: Record<string, unknown>;
}

export interface AIInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  metric?: string;
  value?: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: ProjectPriority;
  estimatedImpact: string;
  effort: "low" | "medium" | "high";
  timeframe: "immediate" | "short_term" | "medium_term" | "long_term";
}

// ─────────────────────────────────────────────
// ENTITY: ALERT
// ─────────────────────────────────────────────

export interface Alert {
  id: string;
  activityId: string;
  projectId?: string;
  taskId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// UI STATE TYPES
// ─────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface FilterState {
  search: string;
  status?: string[];
  priority?: string[];
  dateRange?: { from: string; to: string };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
  color?: string;
}

// ─────────────────────────────────────────────
// STORE TYPES
// ─────────────────────────────────────────────

export interface AppStore {
  currentUser: User | null;
  currentActivityId: string | null;
  activities: Activity[];
  sidebarOpen: boolean;

  setCurrentActivity: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivities: (activities: Activity[]) => void;
}
