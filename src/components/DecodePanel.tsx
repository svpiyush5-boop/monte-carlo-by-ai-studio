import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, HelpCircle, BarChart3, Activity, TrendingDown } from 'lucide-react';

export default function DecodePanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[12px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-heading)] transition-colors uppercase tracking-widest font-['Outfit'] w-full justify-between group"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={14} className="group-hover:text-[var(--accent-primary)] transition-colors" />
          Understanding the Projections
        </div>
        <div className="w-6 h-6 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center group-hover:bg-[var(--surface-card-alt)] transition-colors">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="group relative p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--chart-pessimistic)] via-[var(--chart-median)] to-[var(--chart-optimistic)] opacity-50 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
            <div className="mb-4 w-10 h-10 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center text-[var(--text-heading)]">
              <BarChart3 size={18} />
            </div>
            <h4 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)] mb-3 tracking-wide">Percentile Outcomes</h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              We simulate 1,000 possible market futures. <span className="text-[var(--text-heading)] font-semibold">p50 (Median)</span> is the middle path. <span className="text-[var(--chart-pessimistic)] font-semibold">p10</span> represents a severe market downturn (bottom 10%), while <span className="text-[var(--chart-optimistic)] font-semibold">p90</span> shows an optimistic growth scenario.
            </p>
          </div>

          <div className="group relative p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--semantic-success)] opacity-50 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
            <div className="mb-4 w-10 h-10 rounded-full bg-[var(--surface-success)] flex items-center justify-center text-[var(--semantic-success)]">
              <Activity size={18} />
            </div>
            <h4 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)] mb-3 tracking-wide">Success Probability</h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              The percentage of simulations where your portfolio survives until life expectancy. A score above <span className="text-[var(--semantic-success)] font-semibold">85%</span> indicates high resilience. Below <span className="text-[var(--semantic-danger)] font-semibold">70%</span> suggests a need to adjust savings or retirement age.
            </p>
          </div>

          <div className="group relative p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--semantic-warning)] opacity-50 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
            <div className="mb-4 w-10 h-10 rounded-full bg-[var(--surface-warning)] flex items-center justify-center text-[var(--semantic-warning)]">
              <TrendingDown size={18} />
            </div>
            <h4 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)] mb-3 tracking-wide">Inflation Impact</h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              All projections account for inflation. Your "Monthly Need at Retirement" is the future cost of your current lifestyle. The model automatically adjusts withdrawals annually to maintain purchasing power.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
