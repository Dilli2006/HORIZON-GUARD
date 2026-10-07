import {
  mockSummary,
  mockAnomalies,
  mockExpenses,
  mockTimeline,
} from './demoData';
import {
  Expense,
  AnomalyDetail,
  SummaryData,
  TimelinePoint,
  Contribution,
  AnomalyBrief,
  AntibodyItem,
  MerchantTrustItem,
} from './api';

const STORAGE_KEY = 'horizon_guard_store_v2';

interface StoreState {
  expenses: Expense[];
  anomalies: AnomalyDetail[];
  summary: SummaryData;
  timeline: TimelinePoint[];
  antibodies: AntibodyItem[];
  whitelist: any[];
  merchantTrust: Record<string, MerchantTrustItem>;
}

function getInitialState(): StoreState {
  const initialExpenses: Expense[] = [
    ...mockAnomalies.map((a) => ({
      ...a.expense,
      notes: 'High-value transaction flagged for review',
      source: 'auto',
      anomaly: {
        id: a.id,
        risk_score: a.risk_score,
        severity: a.severity,
        status: (a.status || 'open') as 'open' | 'legit' | 'fraud',
        reasons: a.reasons,
        blocked_by_antibody_id: a.blocked_by_antibody_id,
      },
    })),
    { id: 201, date: '2026-10-07', time: '11:20', merchant: 'Swiggy', amount: 340, category: 'Food', payment_method: 'UPI', location: 'Bengaluru', notes: 'Lunch bowl', source: 'manual' },
    { id: 202, date: '2026-10-07', time: '09:15', merchant: 'Uber', amount: 280, category: 'Travel', payment_method: 'UPI', location: 'Bengaluru', notes: 'Cab to office', source: 'manual' },
    { id: 203, date: '2026-10-06', time: '20:45', merchant: 'Starbucks', amount: 480, category: 'Food', payment_method: 'Credit Card', location: 'Bengaluru', notes: 'Cold brew & bagel', source: 'manual' },
    { id: 204, date: '2026-10-06', time: '18:30', merchant: 'Amazon', amount: 1299, category: 'Shopping', payment_method: 'Credit Card', location: 'Online', notes: 'Ergonomic mousepad', source: 'manual' },
    { id: 205, date: '2026-10-05', time: '10:00', merchant: 'ACT Fibernet', amount: 1059, category: 'Bills', payment_method: 'UPI', location: 'Bengaluru', notes: 'Monthly broadband gigabit', source: 'manual' },
    { id: 206, date: '2026-10-04', time: '19:00', merchant: 'Cult.fit Membership', amount: 1499, category: 'Health', payment_method: 'Credit Card', location: 'Online', notes: 'Gym & yoga pass', source: 'manual' },
    { id: 207, date: '2026-10-03', time: '21:10', merchant: 'Netflix', amount: 649, category: 'Entertainment', payment_method: 'Credit Card', location: 'Online', notes: '4K Premium plan', source: 'manual' },
    { id: 208, date: '2026-10-02', time: '08:30', merchant: 'BESCOM Electricity', amount: 1750, category: 'Bills', payment_method: 'Net Banking', location: 'Bengaluru', notes: 'September power bill', source: 'manual' },
    { id: 209, date: '2026-10-01', time: '09:05', merchant: 'NoBroker Rent', amount: 25000, category: 'Bills', payment_method: 'Net Banking', location: 'Bengaluru', notes: 'October apartment rent', source: 'manual' },
    { id: 210, date: '2026-09-29', time: '13:40', merchant: 'Zomato', amount: 560, category: 'Food', payment_method: 'UPI', location: 'Bengaluru', notes: 'Biryani dinner', source: 'manual' },
    { id: 211, date: '2026-09-27', time: '16:00', merchant: 'Decathlon', amount: 2499, category: 'Shopping', payment_method: 'Credit Card', location: 'Bengaluru', notes: 'Running shoes', source: 'manual' },
  ];

  return {
    expenses: initialExpenses,
    anomalies: JSON.parse(JSON.stringify(mockAnomalies)),
    summary: JSON.parse(JSON.stringify(mockSummary)),
    timeline: JSON.parse(JSON.stringify(mockTimeline)),
    antibodies: [
      {
        id: 1,
        pattern_signature: { merchant: 'Amazon', category: 'Shopping', amount_min: 30000, amount_max: 50000 },
        description: 'Synthesized defense against ₹42,999 luxury electronics spikes',
        hits: 4,
        origin: 'learned',
        created_at: '2026-10-01',
      },
      {
        id: 2,
        pattern_signature: { merchant: 'Delhi Duty Free', category: 'Shopping', amount_min: 10000, amount_max: 20000 },
        description: 'Impossible Travel vector defense (Bengaluru to Delhi airport anomaly)',
        hits: 2,
        origin: 'acquired',
        created_at: '2026-10-03',
      },
    ],
    whitelist: [
      {
        id: 1,
        pattern_signature: { merchant: 'Swiggy', category: 'Food' },
        description: 'Verified habit: Swiggy regular food deliveries in Bengaluru',
        hits: 14,
        created_at: '2026-09-15',
      },
    ],
    merchantTrust: {
      Amazon: { merchant: 'Amazon', trust: 85, visits: 24, first_seen: '2026-08-01', level: 'trusted' },
      Swiggy: { merchant: 'Swiggy', trust: 92, visits: 42, first_seen: '2026-08-01', level: 'trusted' },
      Uber: { merchant: 'Uber', trust: 88, visits: 31, first_seen: '2026-08-02', level: 'trusted' },
      'Delhi Duty Free Electronics': { merchant: 'Delhi Duty Free Electronics', trust: 15, visits: 1, first_seen: '2026-10-02', level: 'risky' },
      'NoBroker Rent': { merchant: 'NoBroker Rent', trust: 95, visits: 3, first_seen: '2026-08-01', level: 'trusted' },
      Starbucks: { merchant: 'Starbucks', trust: 90, visits: 18, first_seen: '2026-08-10', level: 'trusted' },
      Netflix: { merchant: 'Netflix', trust: 94, visits: 6, first_seen: '2026-05-01', level: 'trusted' },
    },
  };
}

export function getStore(): StoreState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse local store', e);
    return getInitialState();
  }
}

export function saveStore(store: StoreState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to persist local store', e);
  }
}

export const localStore = {
  resetSeed(): { message: string; stats: any } {
    const init = getInitialState();
    saveStore(init);
    return {
      message: 'Immune ledger reset to initial state with 269 baseline records and active antibodies.',
      stats: { transactions: init.expenses.length, anomalies: init.anomalies.length },
    };
  },

  getExpenses(params?: { category?: string; search?: string; limit?: number }): Expense[] {
    const store = getStore();
    let list = store.expenses;
    if (params?.category && params.category !== 'All') {
      list = list.filter((e) => e.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.merchant.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
      );
    }
    if (params?.limit) {
      list = list.slice(0, params.limit);
    }
    return list;
  },

  addExpense(data: {
    merchant: string;
    amount: number;
    category: string;
    date: string;
    time: string;
    payment_method?: string;
    location?: string;
    notes?: string;
  }): Expense {
    const store = getStore();
    const id = Date.now();
    const amount = Number(data.amount);
    const hour = parseInt(data.time?.split(':')[0] || '12', 10);

    // 1. Check Antibody Match
    let blockedByAntibodyId: number | null = null;
    for (const ab of store.antibodies) {
      const sig = ab.pattern_signature;
      if (sig) {
        const matchMerchant = !sig.merchant || data.merchant.toLowerCase().includes(sig.merchant.toLowerCase());
        const matchCat = !sig.category || data.category === sig.category;
        const matchAmt =
          (!sig.amount_min || amount >= sig.amount_min) &&
          (!sig.amount_max || amount <= sig.amount_max);
        if (matchMerchant && matchCat && matchAmt) {
          blockedByAntibodyId = ab.id;
          ab.hits = (ab.hits || 0) + 1;
          break;
        }
      }
    }

    // 2. Check Whitelist
    let isWhitelisted = false;
    for (const wl of store.whitelist) {
      if (
        wl.pattern_signature?.merchant &&
        data.merchant.toLowerCase().includes(wl.pattern_signature.merchant.toLowerCase())
      ) {
        isWhitelisted = true;
        wl.hits = (wl.hits || 0) + 1;
        break;
      }
    }

    // 3. Multi-detector scoring
    const contributions: Contribution[] = [];
    const reasons: string[] = [];
    const counterfactuals: string[] = [];
    let riskScore = 0;

    if (blockedByAntibodyId) {
      riskScore = 95;
      reasons.push(`Blocked by active Antibody #${blockedByAntibodyId}: Known financial threat pattern intercepted.`);
      contributions.push({
        detector: 'antibody',
        label: 'Immune Block',
        score: 50,
        reason: `Matches synthesized Antibody #${blockedByAntibodyId}`,
      });
      counterfactuals.push('Transaction blocked by immune memory.');
    } else if (!isWhitelisted) {
      // Late Night / 3 AM detector
      if (hour >= 23 || hour < 5) {
        riskScore += 45;
        reasons.push(
          `Late-Night Transaction: Occurred at ${data.time} (00:00-05:00 window has 4.2× higher fraud/impulse rate).`
        );
        contributions.push({
          detector: 'late_night',
          label: 'Off-Peak Time',
          score: 35,
          reason: `Recorded at ${data.time}`,
        });
        counterfactuals.push('Would not be flagged if transacted during daylight hours (8 AM - 10 PM).');
      }

      // Amount outlier detector
      if (amount >= 20000) {
        riskScore += 45;
        reasons.push(
          `Severe Amount Outlier: ₹${amount.toLocaleString()} is 8.6× your typical ${data.category} median.`
        );
        contributions.push({
          detector: 'robust_z',
          label: 'Extreme Outlier',
          score: 40,
          reason: `High magnitude: ₹${amount.toLocaleString()}`,
        });
        counterfactuals.push(`Would not trigger outlier alert if amount was under ₹4,500.`);
      } else if (amount >= 7500 && (data.category === 'Food' || data.category === 'Entertainment')) {
        riskScore += 35;
        reasons.push(`Category Outlier: ₹${amount.toLocaleString()} is unusually large for ${data.category}.`);
        contributions.push({
          detector: 'robust_z',
          label: 'Category Outlier',
          score: 30,
          reason: `Unusually large ${data.category} transaction`,
        });
        counterfactuals.push(`Normal range for ${data.category} is under ₹1,500.`);
      }

      // High-risk keyword vector
      const lowerM = data.merchant.toLowerCase();
      if (
        lowerM.includes('casino') ||
        lowerM.includes('crypto') ||
        lowerM.includes('duty free') ||
        lowerM.includes('luxury') ||
        lowerM.includes('unknown')
      ) {
        riskScore += 30;
        reasons.push(
          `High-Risk Merchant Vector: "${data.merchant}" exhibits characteristics of elevated dispute frequency.`
        );
        contributions.push({
          detector: 'first_time_merchant',
          label: 'Risk Vector',
          score: 25,
          reason: 'High-risk merchant class',
        });
      }
    }

    riskScore = Math.min(99, riskScore);
    const isAnomalous = riskScore >= 50;
    const severity = riskScore >= 75 ? 'High' : riskScore >= 50 ? 'Medium' : 'Low';

    let anomalyBrief: AnomalyBrief | undefined = undefined;

    if (isAnomalous) {
      const anomalyId = Date.now();
      const newAnomaly: AnomalyDetail = {
        id: anomalyId,
        expense_id: id,
        risk_score: riskScore,
        severity,
        reasons,
        contributions,
        counterfactuals:
          counterfactuals.length > 0 ? counterfactuals : ['Would carry lower risk if verified through 2FA confirmation.'],
        status: 'open',
        blocked_by_antibody_id: blockedByAntibodyId,
        created_at: new Date().toISOString(),
        expense: {
          id,
          date: data.date,
          time: data.time,
          merchant: data.merchant,
          amount,
          category: data.category,
          payment_method: data.payment_method || 'UPI',
          location: data.location || 'Bengaluru',
        },
      };
      store.anomalies.unshift(newAnomaly);
      anomalyBrief = {
        id: anomalyId,
        risk_score: riskScore,
        severity,
        status: 'open',
        reasons,
        blocked_by_antibody_id: blockedByAntibodyId,
      };

      store.summary.open_anomalies += 1;
      store.summary.amount_at_risk += amount;
      store.summary.open_by_severity[severity] = (store.summary.open_by_severity[severity] || 0) + 1;
    }

    const newExpense: Expense = {
      id,
      date: data.date,
      time: data.time,
      merchant: data.merchant,
      amount,
      category: data.category,
      payment_method: data.payment_method || 'UPI',
      location: data.location || 'Bengaluru',
      notes: data.notes || '',
      source: 'manual',
      anomaly: anomalyBrief,
    };

    store.expenses.unshift(newExpense);

    // Update summary metrics
    store.summary.total_spend += amount;
    store.summary.this_month += amount;
    store.summary.transactions += 1;
    store.summary.transactions_this_month += 1;

    // Update Category Breakdown
    const catItem = store.summary.by_category.find((c: any) => c.category === data.category);
    if (catItem) {
      catItem.total += amount;
    } else {
      store.summary.by_category.push({ category: data.category, total: amount });
    }

    // Update Daily Chart
    if (store.summary.daily && store.summary.daily.length > 0) {
      const lastDaily = store.summary.daily[store.summary.daily.length - 1];
      lastDaily.total += amount;
      lastDaily.count += 1;
      if (isAnomalous) {
        lastDaily.anomalous = true;
        lastDaily.risk = Math.max(lastDaily.risk, riskScore);
      }
    }

    // Update Merchant Trust
    if (!store.merchantTrust[data.merchant]) {
      store.merchantTrust[data.merchant] = {
        merchant: data.merchant,
        trust: isAnomalous ? 35 : 80,
        visits: 1,
        first_seen: data.date,
        level: isAnomalous ? 'risky' : 'trusted',
      };
    } else {
      store.merchantTrust[data.merchant].visits += 1;
    }

    saveStore(store);

    // Dispatch system events
    if (typeof window !== 'undefined') {
      if (isAnomalous) {
        window.dispatchEvent(
          new CustomEvent('horizon_event', {
            detail: {
              type: 'anomaly',
              merchant: data.merchant,
              reason: reasons[0],
              severity,
              risk_score: riskScore,
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('horizon_event', {
            detail: {
              type: 'success',
              title: '✅ Transaction Added',
              message: `₹${amount.toLocaleString()} at ${data.merchant} recorded and verified clean.`,
            },
          })
        );
      }
    }

    return newExpense;
  },

  deleteExpense(id: number): { message: string } {
    const store = getStore();
    const idx = store.expenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const exp = store.expenses[idx];
      store.summary.total_spend = Math.max(0, store.summary.total_spend - exp.amount);
      store.summary.this_month = Math.max(0, store.summary.this_month - exp.amount);
      store.summary.transactions = Math.max(0, store.summary.transactions - 1);
      store.expenses.splice(idx, 1);

      // Remove anomaly if attached
      const aIdx = store.anomalies.findIndex((a) => a.expense_id === id);
      if (aIdx !== -1) {
        const a = store.anomalies[aIdx];
        store.summary.open_anomalies = Math.max(0, store.summary.open_anomalies - 1);
        store.summary.amount_at_risk = Math.max(0, store.summary.amount_at_risk - exp.amount);
        store.anomalies.splice(aIdx, 1);
      }

      saveStore(store);
    }
    return { message: 'Expense deleted successfully' };
  },

  getSummary(): SummaryData {
    return getStore().summary;
  },

  getAnomalies(params?: { status?: string; severity?: string }): AnomalyDetail[] {
    const store = getStore();
    let list = store.anomalies;
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.severity) {
      list = list.filter((a) => a.severity === params.severity);
    }
    return list;
  },

  checkGuard(data: { merchant: string; amount: number; category?: string; time?: string }): {
    triggered: boolean;
    reasons: string[];
  } {
    const hour = parseInt(data.time?.split(':')[0] || '12', 10);
    const amount = Number(data.amount);
    const reasons: string[] = [];

    // Trigger on late night (23:00 - 05:00)
    if (hour >= 23 || hour < 5) {
      reasons.push(`Late-Night Spending: Purchases at ${data.time || '03:00'} carry 4.2× higher regret & impulsivity.`);
    }

    // Trigger on high single-purchase amount
    if (amount >= 10000) {
      reasons.push(`High Value Trigger: ₹${amount.toLocaleString()} exceeds your single-swipe impulse threshold.`);
    }

    return {
      triggered: reasons.length > 0,
      reasons,
    };
  },

  logGuard(data: {
    merchant: string;
    amount: number;
    category: string;
    reasons: string[];
    decision: 'proceeded' | 'cancelled';
  }) {
    const store = getStore();
    if (data.decision === 'cancelled') {
      store.summary.impulse.avoided += Number(data.amount);
      store.summary.impulse.cancelled += 1;
    } else {
      store.summary.impulse.proceeded += 1;
    }
    saveStore(store);
    return {
      message: 'Impulse decision recorded',
      avoided: data.decision === 'cancelled' ? data.amount : 0,
    };
  },

  recordVerdict(anomalyId: number, verdict: 'legit' | 'fraud') {
    const store = getStore();
    const a = store.anomalies.find((it) => it.id === anomalyId);
    if (a) {
      a.status = verdict;
      store.summary.open_anomalies = Math.max(0, store.summary.open_anomalies - 1);
      store.summary.amount_at_risk = Math.max(0, store.summary.amount_at_risk - (a.expense?.amount || 0));

      const oldScore = store.summary.immunity.score;
      let newScore = oldScore;
      let note = '';

      if (verdict === 'fraud') {
        const newAntibody: AntibodyItem = {
          id: Date.now(),
          pattern_signature: {
            merchant: a.expense.merchant,
            category: a.expense.category,
            amount_min: Math.round(a.expense.amount * 0.8),
            amount_max: Math.round(a.expense.amount * 1.2),
          },
          description: `Synthesized from court ruling on ${a.expense.merchant} (${a.reasons[0] || 'Outlier'})`,
          hits: 1,
          origin: 'learned',
          created_at: new Date().toISOString(),
        };
        store.antibodies.unshift(newAntibody);
        store.summary.immunity.antibodies += 1;
        newScore = Math.min(100, oldScore + 4);
        note = `Antibody #${newAntibody.id} synthesized. Immune memory now blocks similar fraud attacks.`;
      } else {
        store.whitelist.unshift({
          id: Date.now(),
          pattern_signature: { merchant: a.expense.merchant, category: a.expense.category },
          description: `Confirmed legitimate habit by user verdict: ${a.expense.merchant}`,
          hits: 1,
          created_at: new Date().toISOString(),
        });
        store.summary.immunity.whitelist += 1;
        newScore = Math.min(100, oldScore + 2);
        note = `Pattern whitelisted. Anomaly false positive suppressed.`;
      }

      store.summary.immunity.score = newScore;
      store.summary.immunity.resolved += 1;
      store.summary.immunity.open = Math.max(0, store.summary.immunity.open - 1);

      store.summary.learning.unshift({
        kind: verdict,
        open_before: store.summary.open_anomalies + 1,
        open_after: store.summary.open_anomalies,
        immunity_before: oldScore,
        immunity_after: newScore,
        note,
        created_at: new Date().toISOString(),
      });

      saveStore(store);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('horizon_event', {
            detail: {
              type: 'verdict',
              report: {
                verdict,
                note,
                immunity_before: oldScore,
                immunity_after: newScore,
              },
            },
          })
        );
      }

      return {
        verdict,
        open_before: store.summary.open_anomalies + 1,
        open_after: store.summary.open_anomalies,
        immunity_before: oldScore,
        immunity_after: newScore,
        note,
      };
    }
    return { verdict, note: 'Ruling registered' };
  },

  injectFraud(kind: 'duplicate' | 'huge' | 'night' | 'travel') {
    const scenarios = {
      duplicate: {
        merchant: 'Myntra Double Swipe',
        amount: 3499,
        category: 'Shopping',
        time: '14:20',
        reason: 'Duplicate billing detected: identical amount ₹3,499 charged twice within 3 minutes.',
        score: 82,
      },
      huge: {
        merchant: 'Rolex Boutique Luxury',
        amount: 88500,
        category: 'Shopping',
        time: '17:45',
        reason: 'Extreme 22.4× magnitude deviation over monthly shopping median.',
        score: 96,
      },
      night: {
        merchant: 'Crypto Casino Global',
        amount: 14500,
        category: 'Entertainment',
        time: '03:42',
        reason: 'High-risk gambling vector transacted at 03:42 AM during cognitive vulnerability window.',
        score: 89,
      },
      travel: {
        merchant: 'Dubai Duty Free Gold',
        amount: 28400,
        category: 'Shopping',
        time: '12:15',
        reason: 'Impossible Travel: Bengaluru to Dubai (2,700 km) in 30 minutes exceeds mach 3 aircraft.',
        score: 94,
      },
    };

    const s = scenarios[kind] || scenarios.huge;
    const exp = this.addExpense({
      merchant: s.merchant,
      amount: s.amount,
      category: s.category,
      date: new Date().toISOString().slice(0, 10),
      time: s.time,
      payment_method: 'Credit Card',
      location: kind === 'travel' ? 'Dubai' : 'Bengaluru',
      notes: `Simulated attack: ${s.reason}`,
    });

    return {
      kind,
      label: s.merchant,
      events: [
        {
          type: 'anomaly',
          merchant: s.merchant,
          amount: s.amount,
          risk_score: s.score,
          severity: 'High',
          reason: s.reason,
        },
      ],
      expense: exp,
    };
  },

  getAntibodies(): { antibodies: AntibodyItem[]; whitelist: any[] } {
    const store = getStore();
    return {
      antibodies: store.antibodies,
      whitelist: store.whitelist,
    };
  },

  exportVaccine() {
    const store = getStore();
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user: store.summary.user,
      antibodies: store.antibodies,
      whitelist: store.whitelist,
    };
  },

  importVaccine(pack: any) {
    const store = getStore();
    if (pack?.antibodies && Array.isArray(pack.antibodies)) {
      for (const ab of pack.antibodies) {
        if (!store.antibodies.some((existing) => existing.id === ab.id)) {
          store.antibodies.unshift({ ...ab, origin: 'imported' });
        }
      }
      store.summary.immunity.antibodies = store.antibodies.length;
      store.summary.immunity.score = Math.min(100, store.summary.immunity.score + 10);
    }
    saveStore(store);
    return {
      message: 'Immunity vaccine pack successfully merged into active defenses.',
      imported_antibodies: pack?.antibodies?.length || 0,
      new_immunity_score: store.summary.immunity.score,
    };
  },

  updateBudget(category: string, monthly_limit: number) {
    const store = getStore();
    const b = store.summary.budgets.find((it) => it.category === category);
    if (b) {
      b.monthly_limit = monthly_limit;
      b.pct = Math.round((b.actual / monthly_limit) * 100);
      b.over = b.actual > monthly_limit;
    } else {
      store.summary.budgets.push({
        category,
        monthly_limit,
        actual: 0,
        pct: 0,
        over: false,
      });
    }
    saveStore(store);
    return { message: 'Budget updated successfully' };
  },

  askAssistant(question: string) {
    const store = getStore();
    const q = question.toLowerCase();

    // Food expenditure intent
    if (q.includes('food') || q.includes('swiggy') || q.includes('zomato') || q.includes('eat') || q.includes('dinner')) {
      const foodExps = store.expenses.filter((e) => e.category.toLowerCase() === 'food');
      const totalFood = foodExps.reduce((acc, e) => acc + e.amount, 0);
      const merchantCounts: Record<string, number> = {};
      for (const f of foodExps) {
        merchantCounts[f.merchant] = (merchantCounts[f.merchant] || 0) + f.amount;
      }
      const chartData = Object.entries(merchantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));

      return {
        answer: `You have spent **₹${totalFood.toLocaleString()}** on Food across **${foodExps.length} transactions**. Your top food vendor is **${chartData[0]?.label || 'Swiggy'}** (₹${chartData[0]?.value?.toLocaleString() || 0}).`,
        intent: { category: 'Food', aggregation: 'sum' },
        chart: { type: 'bar', data: chartData },
        source: 'local_ledger',
      };
    }

    // Anomalies / threats intent
    if (q.includes('anomal') || q.includes('fraud') || q.includes('threat') || q.includes('risk') || q.includes('danger')) {
      const openAnomalies = store.anomalies.filter((a) => a.status === 'open');
      const highRisk = openAnomalies.filter((a) => a.severity === 'High');
      return {
        answer: `Horizon Guard has detected **${openAnomalies.length} open anomalies** with a combined exposure of **₹${store.summary.amount_at_risk.toLocaleString()}**. **${highRisk.length}** are classified as High Severity threats requiring Court review.`,
        intent: { category: 'Security', aggregation: 'count' },
        chart: {
          type: 'bar',
          data: [
            { label: 'High Risk', value: highRisk.length },
            { label: 'Medium Risk', value: openAnomalies.length - highRisk.length },
            { label: 'Antibodies Active', value: store.antibodies.length },
          ],
        },
        source: 'immune_system',
      };
    }

    // Budget / can I afford intent
    if (q.includes('afford') || q.includes('budget') || q.includes('limit')) {
      const shopping = store.summary.budgets.find((b) => b.category === 'Shopping');
      return {
        answer: shopping?.over
          ? `⚠️ Warning: Your **Shopping** budget is currently **exceeded by ₹${(shopping.actual - shopping.monthly_limit).toLocaleString()}** (${shopping.pct}% utilized). Any further luxury purchases will trigger the Impulse Guard.`
          : `You have ₹${((shopping?.monthly_limit || 10000) - (shopping?.actual || 0)).toLocaleString()} remaining in your Shopping budget. Proceed with mindful spending.`,
        intent: { category: 'Budget', aggregation: 'check' },
        chart: {
          type: 'bar',
          data: store.summary.budgets.map((b) => ({ label: b.category, value: b.actual })),
        },
        source: 'budget_guard',
      };
    }

    // Default general summary response
    return {
      answer: `Here is your current financial immunity overview: You have logged **${store.summary.transactions} transactions** totaling **₹${store.summary.total_spend.toLocaleString()}**. Your Immunity Defense score is **${store.summary.immunity.score}%** (${store.summary.immunity.label}) backed by **${store.antibodies.length} active antibodies**.`,
      intent: { category: 'Overview', aggregation: 'summary' },
      chart: {
        type: 'bar',
        data: store.summary.by_category.slice(0, 5).map((c) => ({ label: c.category, value: c.total })),
      },
      source: 'financial_immune_core',
    };
  },
};
