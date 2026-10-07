import React, { useState } from 'react';
import {
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Receipt,
  Moon,
  TrendingUp,
  Scale,
  Sparkles,
  ArrowRight,
  Dna,
  FileCheck,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { SummaryData, AnomalyDetail, TimelinePoint, formatINR } from '../lib/api';
import { HorizonWidget } from '../components/HorizonWidget';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { CountUp } from '../components/ui/CountUp';
import { AIPulseBadge } from '../components/ui/AIPulseBadge';
import { ShimmerButton } from '../components/ui/ShimmerButton';
import { NeuralWaveform } from '../components/ui/NeuralWaveform';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface OverviewTabProps {
  summary: SummaryData;
  timeline: TimelinePoint[];
  onOpenCourt: (anomalyId: number) => void;
  onExplorePrompt: (prompt: string) => void;
  onOpenDNA: () => void;
  onOpenVaccine: () => void;
  anomalies: AnomalyDetail[];
  onOpenAddExpense?: () => void;
  onOpenSimulator?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  summary,
  timeline,
  onOpenCourt,
  onExplorePrompt,
  onOpenDNA,
  onOpenVaccine,
  anomalies,
  onOpenAddExpense,
  onOpenSimulator,
}) => {
  const [promptText, setPromptText] = useState('');
  const [timelineIndex, setTimelineIndex] = useState(timeline.length - 1);
  const currentTimelinePoint = timeline[timelineIndex] || timeline[timeline.length - 1];

  const recentAnomalies = anomalies.slice(0, 5);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && promptText.trim()) {
      onExplorePrompt(promptText);
      setPromptText('');
    }
  };

  const chartData = (summary.daily || []).slice(-14).map((d) => ({
    name: d.label.split(' ')[0],
    amount: d.total,
    anomalous: d.anomalous,
  }));

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Top Quick Actions & Telemetry Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[22px] bg-white/80 dark:bg-navy-800/80 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-xl shadow-shadow-500/5 relative overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 p-0.5 shadow-md shadow-brand-500/20">
            <div className="w-full h-full bg-white dark:bg-navy-900 rounded-[14px] flex items-center justify-center text-brand-500 dark:text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-navy-700 dark:text-white font-poppins">
                Financial Immune Operations
              </h2>
              <AIPulseBadge status="shielded" text="AUTONOMOUS RADAR" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Real-time biometric spend radar & autonomous antibody defense pipeline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenAddExpense && (
            <ShimmerButton
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </ShimmerButton>
          )}
          {onOpenSimulator && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition border border-amber-500/25"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Fraud Simulator</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* 1. Horizon UI 6-Widget Metric Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5"
      >
        <HorizonWidget
          icon={DollarSign}
          title={formatINR(summary.this_month || 41540)}
          subtitle="Total Spend (Month)"
          iconBg="bg-brand-50 dark:bg-navy-700"
          iconColor="text-brand-500"
          extra={
            <span className="text-xs font-bold text-green-500 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40">
              +{Math.abs(summary.month_change_pct || 15)}%
            </span>
          }
        />

        <HorizonWidget
          icon={ShieldCheck}
          title={`${summary.immunity?.score || 75}%`}
          subtitle="Immunity Score"
          iconBg="bg-green-50 dark:bg-navy-700"
          iconColor="text-green-500"
          extra={
            <span className="text-xs font-bold text-brand-500 dark:text-brand-400">
              {summary.immunity?.label || 'Strong'}
            </span>
          }
        />

        <HorizonWidget
          icon={AlertTriangle}
          title={`${summary.open_anomalies || 33}`}
          subtitle="Open Threats"
          iconBg="bg-red-50 dark:bg-navy-700"
          iconColor="text-red-500"
          extra={
            <span className="text-xs font-bold text-red-500">
              {formatINR(summary.amount_at_risk)}
            </span>
          }
        />

        <HorizonWidget
          icon={Zap}
          title={`${summary.antibody_hits || 4}`}
          subtitle="Antibody Hits"
          iconBg="bg-purple-50 dark:bg-navy-700"
          iconColor="text-purple-500"
          extra={
            <span className="text-xs font-semibold text-gray-400">Auto-Blocked</span>
          }
        />

        <HorizonWidget
          icon={Receipt}
          title={`${summary.transactions || 269}`}
          subtitle="Processed Txns"
          iconBg="bg-cyan-50 dark:bg-navy-700"
          iconColor="text-cyan-500"
          extra={
            <span className="text-xs font-semibold text-gray-400">60 Days</span>
          }
        />

        <HorizonWidget
          icon={Moon}
          title={formatINR(summary.impulse?.avoided || 8240)}
          subtitle="Impulse Avoided"
          iconBg="bg-amber-50 dark:bg-navy-700"
          iconColor="text-amber-500"
          extra={
            <span className="text-xs font-bold text-amber-500">Saved</span>
          }
        />
      </motion.div>

      {/* 2. Horizon UI Main Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Horizon Area Spend Trend */}
        <SpotlightCard className="lg:col-span-8 !p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Daily Spend Telemetry
              </p>
              <h3 className="text-xl font-bold text-navy-700 dark:text-white font-poppins">
                Spending Activity & Anomaly Glitches
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <NeuralWaveform active={true} bars={8} color="from-brand-500 to-cyan-400" />
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-50 dark:bg-green-950/40 px-3 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="horizonBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4318FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4318FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#A3AED0"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#A3AED0"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Spend']}
                  contentStyle={{
                    backgroundColor: '#111C44',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#4318FF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#horizonBrand)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Explorer Prompt Inside Horizon Card */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              <span className="text-xs font-bold text-navy-700 dark:text-white">
                Horizon AI Natural Language Query:
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask e.g. 'How much spent on Food?' or 'Show 3 AM purchases'"
                className="w-full text-xs py-2.5 pl-3 pr-20 rounded-xl bg-lightPrimary dark:bg-navy-900 border border-transparent dark:border-white/10 text-navy-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (promptText.trim()) {
                    onExplorePrompt(promptText);
                    setPromptText('');
                  }
                }}
                className="absolute right-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition flex items-center gap-1 shadow-sm"
              >
                Query <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </SpotlightCard>

        {/* Right: Horizon Immunity Radar & Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card: Financial Immunity Gauge with BorderBeam */}
          <div className="card-horizon bg-gradient-to-br from-brand-500 via-brand-600 to-navy-700 text-white relative overflow-hidden shadow-xl shadow-brand-500/20">
            <BorderBeam colorFrom="#00F0FF" colorTo="#FFFFFF" size={240} duration={6} />

            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-100">
                Autonomous Immunity
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                Active Shield
              </span>
            </div>

            <div className="my-4">
              <h2 className="text-5xl font-extrabold font-poppins text-white flex items-center">
                <CountUp value={summary.immunity?.score || 75} suffix="%" />
              </h2>
              <p className="text-xs text-brand-100 mt-1">
                Resolution Ratio + Learned Antibodies + Budget Adherence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20 text-center">
              <div>
                <span className="text-[10px] text-brand-200 block uppercase font-bold">Antibodies</span>
                <span className="text-lg font-bold">
                  <CountUp value={summary.immunity?.antibodies || 2} />
                </span>
              </div>
              <div>
                <span className="text-[10px] text-brand-200 block uppercase font-bold">Whitelisted</span>
                <span className="text-lg font-bold">
                  <CountUp value={summary.immunity?.whitelist || 1} />
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenDNA}
                className="flex-1 py-2 px-3 rounded-xl bg-white text-brand-600 hover:bg-gray-50 text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
              >
                <Dna className="w-3.5 h-3.5" />
                <span>Spend DNA</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenVaccine}
                className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md transition flex items-center justify-center gap-1 border border-white/20"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Vaccine Pack</span>
              </motion.button>
            </div>
          </div>

          {/* Card: Financial Fever Index */}
          {currentTimelinePoint && (
            <SpotlightCard className="!p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                  Financial Fever Index
                </span>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                  {currentTimelinePoint.temperature}°C
                </span>
              </div>
              <p className="text-xs text-navy-700 dark:text-white font-semibold">
                Daily baseline temperature calculated from anomaly load and category budget overspend.
              </p>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <input
                  type="range"
                  min="0"
                  max={timeline.length - 1}
                  value={timelineIndex}
                  onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer h-1.5 bg-gray-200 dark:bg-navy-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Replay: {currentTimelinePoint.label}</span>
                  <span>{currentTimelinePoint.immunity}% Score</span>
                </div>
              </div>
            </SpotlightCard>
          )}
        </div>
      </motion.div>

      {/* 3. Horizon UI Complex Table: Threat Courtroom Docket */}
      <motion.div variants={itemVariants}>
        <SpotlightCard className="!p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Active Jurisdictions
              </p>
              <h3 className="text-xl font-bold text-navy-700 dark:text-white font-poppins">
                Threat Courtroom Docket
              </h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500">
              {summary.open_anomalies} Cases Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 font-bold uppercase text-[11px]">
                  <th className="pb-3 px-3">Case</th>
                  <th className="pb-3 px-3">Merchant</th>
                  <th className="pb-3 px-3">Primary Evidence</th>
                  <th className="pb-3 px-3">Risk Index</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Court Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {recentAnomalies.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-lightPrimary/50 dark:hover:bg-navy-700/50 transition group"
                  >
                    <td className="py-3.5 px-3 font-bold text-brand-500">
                      #{a.id}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-navy-700 dark:text-white block group-hover:text-brand-500 transition-colors">
                        {a.expense.merchant}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {a.expense.category} · {a.expense.date} {a.expense.time}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {a.reasons[0] || 'Flagged by detector pipeline'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        a.severity === 'High'
                          ? 'bg-red-50 dark:bg-red-950/60 text-red-500'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-500'
                      }`}>
                        {a.risk_score} / 100 ({a.severity})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-navy-700 dark:text-white text-sm">
                      {formatINR(a.expense.amount)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onOpenCourt(a.id)}
                        className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Take to Court</span>
                      </motion.button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      </motion.div>
    </motion.div>
  );
};
