import React from 'react';
import { Shield, Sparkles, Thermometer, Dna, FileCheck, ArrowUpRight } from 'lucide-react';
import { SummaryData } from '../lib/api';

interface ImmunityCardProps {
  summary: SummaryData;
  onOpenDNA: () => void;
  onOpenVaccine: () => void;
}

export const ImmunityCard: React.FC<ImmunityCardProps> = ({ summary, onOpenDNA, onOpenVaccine }) => {
  const score = summary.immunity?.score || 75;
  const label = summary.immunity?.label || 'Strong';
  const antibodies = summary.immunity?.antibodies || 2;
  const resolved = summary.immunity?.resolved || 0;
  const open = summary.immunity?.open || 33;

  return (
    <div className="fintech-card relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#0284C7] text-white p-6 shadow-lg shadow-blue-500/15 flex flex-col justify-between min-h-[300px]">
      {/* Decorative background blurs */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-blue-900/40 blur-3xl pointer-events-none" />

      {/* Header with pill (Screenshot 1 bottom right exact style) */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span>Immune Insights</span>
        </div>
        <span className="text-xs font-medium text-cyan-100/80">Self-Learning</span>
      </div>

      {/* Hero Percentage (Screenshot 1: "75%" large numeral) */}
      <div className="my-6 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {score}%
          </span>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-cyan-100">
            {label}
          </span>
        </div>
        <p className="text-xs text-blue-100/90 font-medium mt-1">
          Immunity against fraud vectors & automated antibody barriers.
        </p>
      </div>

      {/* Mini metric pills */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/15 relative z-10 text-center">
        <div>
          <span className="text-[10px] text-blue-200 block uppercase font-medium">Antibodies</span>
          <span className="text-base font-bold text-white">{antibodies}</span>
        </div>
        <div>
          <span className="text-[10px] text-blue-200 block uppercase font-medium">Neutralized</span>
          <span className="text-base font-bold text-white">{resolved}</span>
        </div>
        <div>
          <span className="text-[10px] text-blue-200 block uppercase font-medium">Under Review</span>
          <span className="text-base font-bold text-white">{open}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 relative z-10">
        <button
          onClick={onOpenDNA}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition shadow-sm"
        >
          <Dna className="w-3.5 h-3.5" />
          <span>Spend DNA</span>
        </button>
        <button
          onClick={onOpenVaccine}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition border border-white/20"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Vaccine Pack</span>
        </button>
      </div>
    </div>
  );
};
