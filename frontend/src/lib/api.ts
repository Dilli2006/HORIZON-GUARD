/**
 * ExpenseGuard Frontend API Client
 */

export const API_BASE = 'http://localhost:8000';

export interface Expense {
  id: number;
  date: string;
  time: string;
  merchant: string;
  amount: number;
  category: string;
  payment_method: string;
  location: string;
  notes: string;
  source: string;
  anomaly?: AnomalyBrief;
}

export interface AnomalyBrief {
  id: number;
  risk_score: number;
  severity: 'Low' | 'Medium' | 'High' | string;
  status: 'open' | 'legit' | 'fraud';
  reasons: string[];
  blocked_by_antibody_id?: number | null;
}

export interface Contribution {
  detector: string;
  label: string;
  score: number;
  reason: string;
}

export interface AnomalyDetail {
  id: number;
  expense_id: number;
  risk_score: number;
  severity: string;
  reasons: string[];
  contributions: Contribution[];
  counterfactuals: string[];
  status: 'open' | 'legit' | 'fraud';
  blocked_by_antibody_id: number | null;
  created_at: string;
  expense: {
    id: number;
    date: string;
    time: string;
    merchant: string;
    amount: number;
    category: string;
    payment_method: string;
    location: string;
  };
}

export interface BudgetStatus {
  category: string;
  monthly_limit: number;
  actual: number;
  pct: number;
  over: boolean;
}

export interface ImmunityInfo {
  score: number;
  label: string;
  components: {
    resolution: number;
    learning: number;
    budget: number;
  };
  resolved: number;
  open: number;
  antibodies: number;
  whitelist: number;
}

export interface SummaryData {
  user: string;
  total_spend: number;
  this_month: number;
  last_month: number;
  month_change_pct: number;
  transactions: number;
  transactions_this_month: number;
  open_anomalies: number;
  open_by_severity: Record<string, number>;
  amount_at_risk: number;
  by_category: { category: string; total: number }[];
  by_category_month: { category: string; total: number }[];
  daily: { date: string; label: string; total: number; count: number; anomalous: boolean; risk: number }[];
  weekday: { day: string; count: number }[];
  hourly: { hour: number; count: number }[];
  budgets: BudgetStatus[];
  immunity: ImmunityInfo;
  impulse: { avoided: number; cancelled: number; proceeded: number };
  learning: { kind: string; open_before: number; open_after: number; immunity_before: number; immunity_after: number; note: string; created_at: string }[];
  antibody_hits: number;
}

export interface CourtRound {
  speaker: 'prosecutor' | 'defender';
  round: number;
  text: string;
}

export interface CourtDebate {
  anomaly_id: number;
  source: 'gemini' | 'template';
  rounds: CourtRound[];
  evidence: Contribution[];
  counterfactuals: string[];
  history: Record<string, any>;
}

export interface AntibodyItem {
  id: number;
  pattern_signature: any;
  description: string;
  hits: number;
  origin: string;
  created_at: string;
}

export interface SpendDNAData {
  categories: { category: string; share: number }[];
  hours: number[];
  weekdays: number[];
  glitches: any[];
  fingerprint: string;
  traits: string[];
}

export interface ForecastItem {
  category: string;
  spent: number;
  projected: number;
  limit: number;
  status: 'ok' | 'warning' | 'over';
  day: number | null;
  message: string;
  pct_projected: number;
}

export interface SubscriptionItem {
  merchant: string;
  category: string;
  amount: number;
  previous_amount: number;
  change_pct: number;
  cadence: string;
  occurrences: number;
  next_expected: string;
  annual_cost: number;
  alert: string | null;
}

export interface TimelinePoint {
  date: string;
  label: string;
  spend: number;
  cumulative: number;
  flags: number;
  flagged_total: number;
  resolved_total: number;
  antibodies: number;
  temperature: number;
  immunity: number;
}

export interface MerchantTrustItem {
  merchant: string;
  trust: number;
  visits: number;
  first_seen: string;
  level: 'trusted' | 'neutral' | 'risky';
}

// Helper fetcher
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Summary
  getSummary: () => request<SummaryData>('/summary'),
  
  // Expenses
  getExpenses: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<Expense[]>(`/expenses?${query.toString()}`);
  },
  createExpense: (data: any) => request<Expense>('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteExpense: (id: number) => request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),

  // Seed
  seed: () => request<{ message: string; stats: any }>('/seed', { method: 'POST' }),

  // Anomalies
  getAnomalies: (params?: { status?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    return request<AnomalyDetail[]>(`/anomalies?${query.toString()}`);
  },
  runDetection: () => request<{ message: string; stats: any }>('/detect/run', { method: 'POST' }),

  // Court
  getCourtDebate: (anomalyId: number) => request<CourtDebate>(`/court/${anomalyId}`, { method: 'POST' }),
  recordVerdict: (anomalyId: number, verdict: 'legit' | 'fraud') => request<any>(`/verdict/${anomalyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verdict }),
  }),

  // Antibodies & Vaccines
  getAntibodies: () => request<{ antibodies: AntibodyItem[]; whitelist: any[] }>('/antibodies'),
  exportVaccine: () => request<any>('/vaccine/export'),
  importVaccine: (pack: any) => request<any>('/vaccine/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pack),
  }),

  // Budgets
  getBudgets: () => request<BudgetStatus[]>('/budgets'),
  updateBudget: (category: string, monthly_limit: number) => request<any>('/budgets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, monthly_limit }),
  }),

  // Simulator
  injectFraud: (kind: 'duplicate' | 'huge' | 'night' | 'travel') => request<any>(`/simulator/inject?kind=${kind}`, { method: 'POST' }),

  // Assistant
  askAssistant: (question: string) => request<any>('/assistant/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }),

  // Features
  getForecast: () => request<ForecastItem[]>('/forecast'),
  getSubscriptions: () => request<SubscriptionItem[]>('/subscriptions'),
  getTimeline: () => request<TimelinePoint[]>('/timeline'),
  getSpendDNA: () => request<SpendDNAData>('/spend-dna'),
  getMerchantTrust: () => request<Record<string, MerchantTrustItem>>('/merchant-trust'),

  // Impulse Guard
  checkGuard: (data: { merchant: string; amount: number; category?: string; time?: string }) => request<any>('/guard/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  logGuard: (data: { merchant: string; amount: number; category: string; reasons: string[]; decision: 'proceeded' | 'cancelled' }) => request<any>('/guard/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  // Receipt Scan
  scanReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/receipt/scan`, { method: 'POST', body: formData });
    return res.json();
  },
};

// INR Currency Formatter Helper
export function formatINR(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const isNeg = val < 0;
  const absVal = Math.round(Math.abs(val));
  let str = absVal.toString();
  if (str.length > 3) {
    let head = str.slice(0, -3);
    const tail = str.slice(-3);
    const parts: string[] = [];
    while (head.length > 2) {
      parts.unshift(head.slice(-2));
      head = head.slice(0, -2);
    }
    if (head.length > 0) parts.unshift(head);
    str = parts.join(',') + ',' + tail;
  }
  return `${isNeg ? '-' : ''}₹${str}`;
}
