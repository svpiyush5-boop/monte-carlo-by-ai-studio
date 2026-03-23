import React from 'react';
import { Sprout, Shield, Clock } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function NarrativeCard({ results, params }: { results: any, params: any }) {
  const { corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, successRate } = results;
  const { currentAge, retirementAge, lifeExpectancy, monthlySavings, sipStepUp } = params;

  const accumYears = retirementAge - currentAge;
  const drawYears = lifeExpectancy - retirementAge;

  return (
    <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[var(--accent-primary)]" />
          <h3 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">Your Wealth Story</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          How your retirement unfolds across three phases
        </p>
      </div>
      
      <div className="p-5 space-y-3">
        {/* Phase 1: Accumulation */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-card-alt)]/50 border border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-success)] flex items-center justify-center shrink-0">
            <Sprout size={20} className="text-[var(--semantic-success)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Phase 1</span>
              <span className="text-[10px] text-[var(--semantic-success)]">• Accumulation</span>
            </div>
            <h4 className="text-base font-bold text-[var(--text-heading)]">
              Age {currentAge} → {retirementAge}
            </h4>
            <p className="text-sm text-[var(--text-body)] mt-2">
              Investing <span className="font-bold">{formatINR(monthlySavings)}/mo</span> with <span className="font-bold">{sipStepUp}%</span> step-up. 
              Targeting <span className="font-bold text-[var(--accent-primary)]">{formatINR(corpusAtRetirement.p50)}</span> median corpus.
            </p>
          </div>
        </div>

        {/* Phase 2: Drawdown */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-card-alt)]/50 border border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-warning)] flex items-center justify-center shrink-0">
            <Shield size={20} className="text-[var(--semantic-warning)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Phase 2</span>
              <span className="text-[10px] text-[var(--semantic-warning)]">• Drawdown</span>
            </div>
            <h4 className="text-base font-bold text-[var(--text-heading)]">
              Age {retirementAge} → {lifeExpectancy}
            </h4>
            <p className="text-sm text-[var(--text-body)] mt-2">
              Monthly withdrawals of <span className="font-bold">{formatINR(adjustedMonthlyExpenses)}</span>. 
              Median: lasts to age <span className="font-bold">{medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}</span>.
            </p>
            {successRate < 80 && (
              <p className="text-xs text-[var(--semantic-danger)] mt-1 font-medium">
                ⚠️ {100 - successRate.toFixed(0)}% chance of early depletion
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
