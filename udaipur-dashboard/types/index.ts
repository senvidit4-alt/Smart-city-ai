// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "normal";
export type ComplaintStatus = "pending" | "in_progress" | "resolved" | "closed";
export type Department =
  | "Water"
  | "Sanitation"
  | "Roads"
  | "Electricity"
  | "Parks"
  | "Health"
  | "Administration";

// ─── KPI ──────────────────────────────────────────────────────────────────────

export interface KPIData {
  pending_complaints: number;
  high_severity_pct: number;
  fateh_sagar_level: number;
  fateh_sagar_risk: RiskLevel;
  staff_efficiency: number;
  efficiency_trend: "up" | "down" | "stable";
  next_event_name: string;
  next_event_days: number;
  next_event_risk: RiskLevel;
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export interface Complaint {
  id: string;
  date: string;
  ward: string;
  type: string;
  severity: Severity;
  status: ComplaintStatus;
  description: string;
  location: string;
  assigned_to?: string;
  resolved_at?: string;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  total: number;
  pending: number;
  surge_pct: number;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface CityEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  crowd_estimate: number;
  risk_level: RiskLevel;
  trucks_required: number;
  officers_required: number;
  tankers_required: number;
  days_away: number;
  description: string;
  checklist: ChecklistItem[];
  cost_estimate: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  due_days_before: number;
  completed: boolean;
}

// ─── Water ────────────────────────────────────────────────────────────────────

export interface LakeData {
  name: string;
  current_level: number;
  max_capacity: number;
  min_safe: number;
  risk_level: RiskLevel;
  last_updated: string;
}

export interface WaterData {
  fateh_sagar: LakeData;
  pichola: LakeData;
  supply_mld: number;
  demand_mld: number;
  tankers_deployed: number;
  tankers_recommended: number;
  risk_areas: RiskArea[];
  forecast: WaterForecast[];
}

export interface RiskArea {
  name: string;
  ward: string;
  risk_level: RiskLevel;
  lat: number;
  lng: number;
}

export interface WaterForecast {
  month: string;
  fateh_sagar: number;
  pichola: number;
  supply_availability: number;
  risk_level: RiskLevel;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffDepartment {
  department: Department;
  total: number;
  available: number;
  deployed: number;
  efficiency_pct: number;
  overtime_hours: number;
}

export interface StaffData {
  departments: StaffDepartment[];
  potential_savings: number;
  overtime_cost: number;
  net_optimisation: number;
  recommendations: ShiftRecommendation[];
  weekly_trend: DayEfficiency[];
}

export interface ShiftRecommendation {
  id: string;
  department: Department;
  issue: string;
  action: string;
  impact_savings: number;
  impact_zones: number;
  icon: string;
}

export interface DayEfficiency {
  day: string;
  efficiency: number;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  severity: Severity;
  description: string;
  ward: string;
  time_ago: string;
  category: string;
  timestamp: string;
}

// ─── Briefing ─────────────────────────────────────────────────────────────────

export interface BriefingResponse {
  mode: "summary" | "full" | "critical";
  title: string;
  points: string[];
  generated_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "thinking";
  content: string;
  timestamp: string;
  tools_used?: string[];
  thinking_steps?: ThinkingStep[];
}

export interface ThinkingStep {
  tool: string;
  params: Record<string, string | number | boolean>;
  result_summary?: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  tools_used: string[];
  thinking_steps: ThinkingStep[];
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export interface WardStats {
  ward: string;
  complaints: number;
  risk_level: RiskLevel;
  lat: number;
  lng: number;
  population: number;
  top_issue: string;
}

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "landmark" | "ward_center" | "risk_area";
  stats?: WardStats;
}
