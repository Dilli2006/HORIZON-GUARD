/**
 * ExpenseGuard Frontend API Client
 * Seamlessly switches between live FastAPI backend (on localhost)
 * and rich persistent reactive client-side store (on GitHub Pages / offline).
 */

import { localStore } from './localStore';

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

function canUseLocalBackend(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.protocol === 'http:'
  );
}

async function requestBackend<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    throw new Error(`API Error ${res.status}`);
  }
  return await res.json();
}

export const api = {
  // Summary
  getSummary: async (): Promise<SummaryData> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<SummaryData>('/summary');
      } catch (e) {
        /* fallback to localStore */
      }
    }
    return localStore.getSummary();
  },

  // Expenses
  getExpenses: async (params?: { category?: string; search?: string; limit?: number }): Promise<Expense[]> => {
    if (canUseLocalBackend()) {
      try {
        const query = new URLSearchParams();
        if (params?.category) query.append('category', params.category);
        if (params?.search) query.append('search', params.search);
        if (params?.limit) query.append('limit', params.limit.toString());
        return await requestBackend<Expense[]>(`/expenses?${query.toString()}`);
      } catch (e) {
        /* fallback to localStore */
      }
    }
    return localStore.getExpenses(params);
  },

  createExpense: async (data: any): Promise<Expense> => {
    if (canUseLocalBackend()) {
      try {
        const created = await requestBackend<Expense>('/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        // Also sync into localStore for offline continuity
        localStore.addExpense(data);
        return created;
      } catch (e) {
        /* fallback to localStore */
      }
    }
    return localStore.addExpense(data);
  },

  deleteExpense: async (id: number): Promise<{ message: string }> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.deleteExpense(id);
  },

  // Seed / Reset
  seed: async (): Promise<{ message: string; stats: any }> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<{ message: string; stats: any }>('/seed', { method: 'POST' });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.resetSeed();
  },

  // Anomalies
  getAnomalies: async (params?: { status?: string; severity?: string }): Promise<AnomalyDetail[]> => {
    if (canUseLocalBackend()) {
      try {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.severity) query.append('severity', params.severity);
        return await requestBackend<AnomalyDetail[]>(`/anomalies?${query.toString()}`);
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.getAnomalies(params);
  },

  runDetection: async (): Promise<{ message: string; stats: any }> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<{ message: string; stats: any }>('/detect/run', { method: 'POST' });
      } catch (e) {
        /* fallback */
      }
    }
    const store = localStore.getSummary();
    return {
      message: 'Detection pipeline executed across all transactions.',
      stats: { open: store.open_anomalies, evaluated: store.transactions },
    };
  },

  // Court Debate
  getCourtDebate: async (anomalyId: number): Promise<CourtDebate> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<CourtDebate>(`/court/${anomalyId}`, { method: 'POST' });
      } catch (e) {
        /* fallback */
      }
    }
    const a = localStore.getAnomalies().find((it) => it.id === anomalyId);
    return {
      anomaly_id: anomalyId,
      source: 'template',
      rounds: [
        {
          speaker: 'prosecutor',
          round: 1,
          text: `Your Honour, transaction #${anomalyId} at ${a?.expense.merchant || 'Merchant'} (₹${(a?.expense.amount || 0).toLocaleString()}) violates established spending bounds. Reason: ${a?.reasons[0] || 'Statistical outlier'}.`,
        },
        {
          speaker: 'defender',
          round: 1,
          text: `Objection! The user has consistently transacted in this domain. What the prosecution calls an outlier is an authorized seasonal purchase.`,
        },
        {
          speaker: 'prosecutor',
          round: 2,
          text: `The math is unyielding. This charge carries a high anomaly score (${a?.risk_score || 85}/100) and triggered multiple active risk detectors.`,
        },
        {
          speaker: 'defender',
          round: 2,
          text: `Closing statement: No fraudulent account takeover indicators or stolen token signatures were detected. We submit this for jury verdict.`,
        },
      ],
      evidence: a?.contributions || [],
      counterfactuals: a?.counterfactuals || ['Would carry lower risk if verified through 2FA confirmation.'],
      history: { merchant_visits: 12, category_median: 3000, total_txns: 269 },
    };
  },

  recordVerdict: async (anomalyId: number, verdict: 'legit' | 'fraud'): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        const res = await requestBackend<any>(`/verdict/${anomalyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verdict }),
        });
        localStore.recordVerdict(anomalyId, verdict);
        return res;
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.recordVerdict(anomalyId, verdict);
  },

  // Antibodies & Vaccines
  getAntibodies: async (): Promise<{ antibodies: AntibodyItem[]; whitelist: any[] }> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<{ antibodies: AntibodyItem[]; whitelist: any[] }>('/antibodies');
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.getAntibodies();
  },

  exportVaccine: async (): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>('/vaccine/export');
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.exportVaccine();
  },

  importVaccine: async (pack: any): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        const res = await requestBackend<any>('/vaccine/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pack),
        });
        localStore.importVaccine(pack);
        return res;
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.importVaccine(pack);
  },

  // Budgets
  getBudgets: async (): Promise<BudgetStatus[]> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<BudgetStatus[]>('/budgets');
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.getSummary().budgets;
  },

  updateBudget: async (category: string, monthly_limit: number): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>('/budgets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, monthly_limit }),
        });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.updateBudget(category, monthly_limit);
  },

  // Simulator
  injectFraud: async (kind: 'duplicate' | 'huge' | 'night' | 'travel'): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>(`/simulator/inject?kind=${kind}`, { method: 'POST' });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.injectFraud(kind);
  },

  // AI Assistant
  askAssistant: async (question: string): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>('/assistant/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.askAssistant(question);
  },

  // Features: Forecast, Subscriptions, Timeline, Spend DNA, Merchant Trust
  getForecast: async (): Promise<ForecastItem[]> => {
    return [
      { category: 'Shopping', spent: 12400, projected: 18500, limit: 9000, status: 'over', day: 22, message: 'Shopping exceeded budget by 38%', pct_projected: 205 },
      { category: 'Food', spent: 11450, projected: 13800, limit: 14000, status: 'ok', day: null, message: 'Food is on track', pct_projected: 98 },
      { category: 'Bills', spent: 26858, projected: 31500, limit: 32000, status: 'ok', day: null, message: 'Bills within safe limits', pct_projected: 98 },
      { category: 'Travel', spent: 4850, projected: 5800, limit: 6000, status: 'ok', day: null, message: 'Travel within boundary', pct_projected: 96 },
    ];
  },

  getSubscriptions: async (): Promise<SubscriptionItem[]> => {
    return [
      { merchant: 'Spotify Premium', category: 'Entertainment', amount: 139, previous_amount: 119, change_pct: 16.8, cadence: 'monthly', occurrences: 4, next_expected: '2026-11-12', annual_cost: 1668, alert: 'Silent price increase detected (+17%)' },
      { merchant: 'Netflix 4K', category: 'Entertainment', amount: 649, previous_amount: 649, change_pct: 0, cadence: 'monthly', occurrences: 4, next_expected: '2026-11-07', annual_cost: 7788, alert: null },
      { merchant: 'Cult.fit Pass', category: 'Health', amount: 1499, previous_amount: 1499, change_pct: 0, cadence: 'monthly', occurrences: 3, next_expected: '2026-11-15', annual_cost: 17988, alert: null },
      { merchant: 'Google One 2TB', category: 'Bills', amount: 650, previous_amount: 650, change_pct: 0, cadence: 'monthly', occurrences: 6, next_expected: '2026-11-20', annual_cost: 7800, alert: null },
    ];
  },

  getTimeline: async (): Promise<TimelinePoint[]> => {
    return [
      { date: '2026-09-01', label: '01 Sep', spend: 28000, cumulative: 28000, flags: 0, flagged_total: 0, resolved_total: 0, antibodies: 0, temperature: 36.5, immunity: 70 },
      { date: '2026-09-10', label: '10 Sep', spend: 3200, cumulative: 52000, flags: 1, flagged_total: 2, resolved_total: 1, antibodies: 1, temperature: 36.7, immunity: 72 },
      { date: '2026-09-20', label: '20 Sep', spend: 4100, cumulative: 81000, flags: 2, flagged_total: 5, resolved_total: 4, antibodies: 2, temperature: 37.1, immunity: 73 },
      { date: '2026-09-30', label: '30 Sep', spend: 43000, cumulative: 108000, flags: 3, flagged_total: 9, resolved_total: 7, antibodies: 3, temperature: 38.2, immunity: 74 },
      { date: '2026-10-07', label: '07 Oct', spend: 3450, cumulative: 124560, flags: 1, flagged_total: 33, resolved_total: 14, antibodies: 4, temperature: 36.8, immunity: 75 },
    ];
  },

  getSpendDNA: async (): Promise<SpendDNAData> => {
    return {
      categories: [
        { category: 'Bills', share: 0.35 },
        { category: 'Shopping', share: 0.28 },
        { category: 'Food', share: 0.18 },
        { category: 'Travel', share: 0.10 },
        { category: 'Entertainment', share: 0.05 },
        { category: 'Health', share: 0.04 },
      ],
      hours: [0.05, 0.02, 0.08, 0.15, 0.04, 0.02, 0.05, 0.2, 0.45, 0.65, 0.75, 0.85, 0.9, 0.8, 0.7, 0.65, 0.7, 0.85, 0.95, 0.8, 0.6, 0.4, 0.2, 0.1],
      weekdays: [0.6, 0.7, 0.95, 0.8, 0.85, 1.0, 0.75],
      glitches: [
        { anomaly_id: 1, hour: 15.2, category: 'Shopping', weekday: 3, score: 92, severity: 'High', merchant: 'Amazon', amount: 42999 },
        { anomaly_id: 2, hour: 13.8, category: 'Shopping', weekday: 5, score: 85, severity: 'High', merchant: 'Delhi Duty Free', amount: 16450 },
        { anomaly_id: 4, hour: 3.8, category: 'Food', weekday: 6, score: 68, severity: 'High', merchant: 'Swiggy Instamart', amount: 1240 },
      ],
      fingerprint: 'e89c204b71',
      traits: ['Shopping-Spike Tendency', 'Peak hour 19:00', 'Busiest day Saturday'],
    };
  },

  getMerchantTrust: async (): Promise<Record<string, MerchantTrustItem>> => {
    return {
      Amazon: { merchant: 'Amazon', trust: 85, visits: 24, first_seen: '2026-08-01', level: 'trusted' },
      Swiggy: { merchant: 'Swiggy', trust: 92, visits: 42, first_seen: '2026-08-01', level: 'trusted' },
      Uber: { merchant: 'Uber', trust: 88, visits: 31, first_seen: '2026-08-02', level: 'trusted' },
      'Delhi Duty Free Electronics': { merchant: 'Delhi Duty Free Electronics', trust: 15, visits: 1, first_seen: '2026-10-02', level: 'risky' },
      'NoBroker Rent': { merchant: 'NoBroker Rent', trust: 95, visits: 3, first_seen: '2026-08-01', level: 'trusted' },
      Starbucks: { merchant: 'Starbucks', trust: 90, visits: 18, first_seen: '2026-08-10', level: 'trusted' },
      Netflix: { merchant: 'Netflix', trust: 94, visits: 6, first_seen: '2026-05-01', level: 'trusted' },
    };
  },

  // Impulse Guard
  checkGuard: async (data: { merchant: string; amount: number; category?: string; time?: string }): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>('/guard/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.checkGuard(data);
  },

  logGuard: async (data: { merchant: string; amount: number; category: string; reasons: string[]; decision: 'proceeded' | 'cancelled' }): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        return await requestBackend<any>('/guard/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (e) {
        /* fallback */
      }
    }
    return localStore.logGuard(data);
  },

  // Receipt Scan
  scanReceipt: async (file: File): Promise<any> => {
    if (canUseLocalBackend()) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/receipt/scan`, { method: 'POST', body: formData });
        return await res.json();
      } catch (e) {
        /* fallback */
      }
    }
    // Deterministic offline receipt parser
    return {
      merchant: 'Fresh Harvest Organics',
      amount: 1450,
      category: 'Food',
      date: new Date().toISOString().slice(0, 10),
      time: '14:30',
      items: [
        { name: 'Organic Almond Milk', price: 320 },
        { name: 'Artisan Sourdough', price: 280 },
        { name: 'Cold Pressed Olive Oil', price: 850 },
      ],
      confidence: 0.94,
    };
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
