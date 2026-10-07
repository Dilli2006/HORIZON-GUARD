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

import { mockSummary, mockAnomalies, mockExpenses, mockTimeline } from './demoData';

// Helper fetcher with seamless static demo fallback for GitHub Pages
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`API Error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // Graceful offline / GitHub Pages demo fallback
    if (path.startsWith('/summary')) return mockSummary as any;
    if (path.startsWith('/anomalies')) return mockAnomalies as any;
    if (path.startsWith('/expenses')) return mockExpenses as any;
    if (path.startsWith('/timeline')) return mockTimeline as any;
    if (path.startsWith('/budgets')) return mockSummary.budgets as any;
    if (path.startsWith('/forecast')) {
      return [
        { category: "Shopping", spent: 12400, projected: 18500, limit: 9000, status: "over", day: 22, message: "Shopping exceeded budget by 38%", pct_projected: 205 },
        { category: "Food", spent: 11450, projected: 13800, limit: 14000, status: "ok", day: null, message: "Food is on track", pct_projected: 98 },
        { category: "Bills", spent: 26858, projected: 31500, limit: 32000, status: "ok", day: null, message: "Bills within safe limits", pct_projected: 98 },
      ] as any;
    }
    if (path.startsWith('/subscriptions')) {
      return [
        { merchant: "Spotify Premium", category: "Entertainment", amount: 139, previous_amount: 119, change_pct: 16.8, cadence: "monthly", occurrences: 4, next_expected: "2026-11-12", annual_cost: 1668, alert: "Silent price increase detected (+17%)" },
        { merchant: "Netflix", category: "Entertainment", amount: 649, previous_amount: 649, change_pct: 0, cadence: "monthly", occurrences: 4, next_expected: "2026-11-07", annual_cost: 7788, alert: null },
        { merchant: "Cult.fit", category: "Health", amount: 1499, previous_amount: 1499, change_pct: 0, cadence: "monthly", occurrences: 3, next_expected: "2026-11-15", annual_cost: 17988, alert: null },
      ] as any;
    }
    if (path.startsWith('/court')) {
      return {
        anomaly_id: 1,
        source: "template",
        rounds: [
          { speaker: "prosecutor", round: 1, text: "Your Honour, transaction #1 is an extreme 14.3× outlier over the user's shopping median. A single swipe of ₹42,999 violates all historical norms." },
          { speaker: "defender", round: 1, text: "Objection! My client has made over 260 legitimate transactions and previously purchased appliances during festival seasons. This is a planned family electronics purchase." },
          { speaker: "prosecutor", round: 2, text: "The arithmetic is undeniable. The user has never spent above ₹3,200 on this account without 2FA pre-authorization." },
          { speaker: "defender", round: 2, text: "Closing: The transaction took place during daylight hours with clean geolocation. I request a ruling of Legit unless the user reports card theft." },
        ],
        evidence: mockAnomalies[0].contributions,
        counterfactuals: mockAnomalies[0].counterfactuals,
        history: { merchant_visits: 12, category_median: 3000, total_txns: 269 },
      } as any;
    }
    if (path.startsWith('/verdict')) {
      return {
        verdict: (options?.body ? JSON.parse(options.body as string).verdict : 'fraud'),
        open_before: 19,
        open_after: 18,
        immunity_before: 75,
        immunity_after: 78,
        note: "Antibody synthesized. Model updated.",
      } as any;
    }
    if (path.startsWith('/antibodies')) {
      return {
        antibodies: [
          { id: 1, pattern_signature: { merchant: "Amazon", category: "Shopping", amount_min: 30000, amount_max: 50000, hour_start: 14, hour_end: 18 }, description: "Learned from ₹42,999 luxury electronics anomaly", hits: 4, origin: "learned", created_at: "2026-10-01" },
          { id: 2, pattern_signature: { merchant: "Delhi Duty Free", category: "Shopping", amount_min: 10000, amount_max: 20000, hour_start: 12, hour_end: 16 }, description: "Learned from Impossible Travel Delhi vector", hits: 2, origin: "acquired", created_at: "2026-10-03" },
        ],
        whitelist: [
          { id: 1, pattern_signature: { merchant: "Swiggy", category: "Food", amount_min: 200, amount_max: 900, hour_start: 11, hour_end: 23 }, description: "Confirmed legit: Swiggy regular orders", hits: 14, created_at: "2026-09-15" }
        ],
      } as any;
    }
    if (path.startsWith('/spend-dna')) {
      return {
        categories: [
          { category: "Bills", share: 0.35 },
          { category: "Shopping", share: 0.28 },
          { category: "Food", share: 0.18 },
          { category: "Travel", share: 0.10 },
          { category: "Entertainment", share: 0.05 },
          { category: "Health", share: 0.04 },
        ],
        hours: [0.05, 0.02, 0.08, 0.15, 0.04, 0.02, 0.05, 0.2, 0.45, 0.65, 0.75, 0.85, 0.9, 0.8, 0.7, 0.65, 0.7, 0.85, 0.95, 0.8, 0.6, 0.4, 0.2, 0.1],
        weekdays: [0.6, 0.7, 0.95, 0.8, 0.85, 1.0, 0.75],
        glitches: [
          { anomaly_id: 1, hour: 15.2, category: "Shopping", weekday: 3, score: 92, severity: "High", merchant: "Amazon", amount: 42999 },
          { anomaly_id: 2, hour: 13.8, category: "Shopping", weekday: 5, score: 85, severity: "High", merchant: "Delhi Duty Free", amount: 16450 },
          { anomaly_id: 4, hour: 3.8, category: "Food", weekday: 6, score: 68, severity: "High", merchant: "Swiggy Instamart", amount: 1240 },
        ],
        fingerprint: "e89c204b71",
        traits: ["Shopping-Spike Tendency", "Peak hour 19:00", "Busiest day Saturday"],
      } as any;
    }
    if (path.startsWith('/merchant-trust')) {
      return {
        "Amazon": { merchant: "Amazon", trust: 85, visits: 24, first_seen: "2026-08-01", level: "trusted" },
        "Swiggy": { merchant: "Swiggy", trust: 92, visits: 42, first_seen: "2026-08-01", level: "trusted" },
        "Uber": { merchant: "Uber", trust: 88, visits: 31, first_seen: "2026-08-02", level: "trusted" },
        "Delhi Duty Free Electronics": { merchant: "Delhi Duty Free Electronics", trust: 15, visits: 1, first_seen: "2026-10-02", level: "risky" },
        "NoBroker Rent": { merchant: "NoBroker Rent", trust: 95, visits: 3, first_seen: "2026-08-01", level: "trusted" },
      } as any;
    }
    if (path.startsWith('/assistant/ask')) {
      return {
        answer: "Based on your records for the last 30 days, you spent **₹14,200** on Food across 28 transactions. Your largest single food expense was **₹900** at Meghana Foods.",
        intent: { category: "Food", aggregation: "sum", period: "last_30_days" },
        chart: {
          type: "bar",
          data: [
            { label: "Swiggy", value: 5200 },
            { label: "Zomato", value: 3800 },
            { label: "Meghana Foods", value: 2400 },
            { label: "Starbucks", value: 1600 },
            { label: "Chai Point", value: 1200 },
          ],
        },
        source: "rules",
      } as any;
    }
    if (path.startsWith('/simulator/inject')) {
      return {
        kind: "travel",
        label: "Impossible Travel",
        events: [{ type: "anomaly", merchant: "Delhi Duty Free", amount: 16450, risk_score: 85, severity: "High", reason: "Bengaluru → Delhi in 45 min" }],
      } as any;
    }
    return {} as any;
  }
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
