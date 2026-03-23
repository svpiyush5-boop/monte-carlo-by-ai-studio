import React from 'react';
import { ShieldCheck, AlertTriangle, Info, Clock, Wallet, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function KPICards({ results, params, isCompact = false }: { results: any, params: any, isCompact?: boolean }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion } = results;
  const { retirementAge, lifeExpectancy, p10Path } = results;

  // Find worst-case depletion age (P10)
  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;

  const getVerdictData = () => {
    if (successRate >= 80) {
      return {
        color: '#059669',
        label: 'Safe',
        verdict: 'Your plan is on track for a secure retirement.',
        urgency: 'Your portfolio should last through age 100 in most market scenarios.',
        cta: 'Optimize for legacy →',
        ctaSuccess: '85%+',
        ctaTarget: '#fix-engine',
        icon: ShieldCheck
      };
    }
    if (successRate >= 60) {
      return {
        color: '#CA8A04',
        label: 'Moderate Risk',
        verdict: 'You are likely to run out of money before age 90.',
        urgency: p10DepletionAge ? `In weaker markets, depletion could happen as early as age ${p10DepletionAge}.` : `In weaker markets, this could happen as early as age ${Math.floor(medianAgeAtDepletion - 5)}.`,
        cta: 'Fix this plan →',
        ctaSuccess: '70%+',
        ctaTarget: '#fix-engine',
        icon: Info
      };
    }
    if (successRate >= 40) {
      return {
        color: '#DC2626',
        label: 'At Risk',
        verdict: 'You are likely to run out of money by age ' + Math.floor(medianAgeAtDepletion) + '.',
        urgency: p10DepletionAge ? `There's a 10% chance this happens as early as age ${p10DepletionAge}.` : `There's a 10% chance this happens as early as age ${Math.floor(medianAgeAtDepletion - 10)}.`,
        cta: 'Fix this plan →',
        ctaSuccess: '65%+',
        ctaTarget: '#fix-engine',
        icon: AlertTriangle
      };
    }
    return {
      color: '#B91C1C',
      label: 'Critical',
      verdict: 'You will likely deplete your corpus before age ' + Math.floor(medianAgeAtDepletion) + '.',
      urgency: p10DepletionAge ? `High risk of complete depletion. Worst case: age ${p10DepletionAge}.` : `High risk of complete depletion. Worst case: age ${Math.floor(medianAgeAtDepletion - 15)}.`,
      cta: 'Act now →',
      ctaSuccess: '60%+',
      ctaTarget: '#fix-engine',
      icon: AlertTriangle
    };
  };

  const verdict = getVerdictData();
  const p10 = corpusAtRetirement.p10;
  const p50 = corpusAtRetirement.p50;
  const p80 = corpusAtRetirement.p80;
  const p90 = corpusAtRetirement.p90;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / p50 * 100);

  const scrollToFix = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('fix-engine');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span 
            className="text-xl font-black font-['JetBrains_Mono']"
            style={{ color: verdict.color }}
          >
            {successRate.toFixed(0)}%
          </span>
          <span 
            className="text-[10px] font-bold uppercase"
            style={{ color: verdict.color }}
          >
            {verdict.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{formatINR(p50)}</span>
          <span>•</span>
          <span>Age {medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* MAIN VERDICT - Tight, connected layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 pb-5 border-b border-[var(--border-subtle)]">
        
        {/* LEFT: % + Label integrated */}
        <div className="flex items-baseline gap-3 shrink-0">
          <span 
            className="text-7xl lg:text-8xl font-black font-['JetBrains_Mono'] leading-none tracking-tight"
            style={{ color: verdict.color }}
          >
            {successRate.toFixed(0)}
          </span>
          <span className="text-3xl font-bold" style={{ color: verdict.color }}>%</span>
          <span 
            className="text-lg font-bold uppercase tracking-wider pb-1"
            style={{ color: verdict.color }}
          >
            {verdict.label}
          </span>
        </div>

        {/* RIGHT: Tight stacked content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Verdict */}
          <div className="text-xl lg:text-2xl font-bold text-[var(--text-heading)] leading-tight">
            {verdict.verdict}
          </div>
          
          {/* Time-based urgency */}
          <div className="text-sm font-medium text-[var(--text-muted)]">
            {verdict.urgency}
          </div>
          
          {/* CTA */}
          <div className="flex items-center gap-3 pt-1">
            <button 
              onClick={scrollToFix}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ backgroundColor: verdict.color, color: '#fff' }}
            >
              {verdict.cta}
              <ArrowRight size={16} />
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              Potential: <span className="font-bold" style={{ color: verdict.color }}>{verdict.ctaSuccess}</span>
            </span>
          </div>
        </div>
      </div>

      {/* METRICS - Visually de-emphasized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <div className="flex flex-col p-3 rounded-lg bg-[var(--surface-card-alt)]/60">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Corpus at Retirement</span>
          <div className="text-base font-bold text-[var(--text-heading)] font-['JetBrains_Mono']">
            {formatINR(p50)}
          </div>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-[var(--surface-card-alt)]/60">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Corpus Lasts Until</span>
          <div className="text-base font-bold text-[var(--text-heading)] font-['JetBrains_Mono']">
            Age {medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}
          </div>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-[var(--surface-card-alt)]/60">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Monthly Need</span>
          <div className="text-base font-bold text-[var(--text-heading)] font-['JetBrains_Mono']">
            {formatINR(adjustedMonthlyExpenses)}
          </div>
        </div>

        <div className="flex flex-col p-3 rounded-lg bg-[var(--surface-card-alt)]/60">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Withdrawal Rate</span>
          <div className={`text-base font-bold font-['JetBrains_Mono'] ${withdrawalRate > 4.5 ? 'text-[var(--semantic-danger)]' : 'text-[var(--text-heading)]'}`}>
            {withdrawalRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* DISTRIBUTION BAR - Minimal */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Outcome Range</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--surface-overlay)] rounded-full overflow-hidden flex">
          <div className="bg-[var(--chart-pessimistic)] h-full" style={{ width: '10%' }} />
          <div className="bg-[var(--chart-median)] h-full opacity-40" style={{ width: '40%' }} />
          <div className="bg-[var(--chart-median)] h-full opacity-80" style={{ width: '30%' }} />
          <div className="bg-[var(--chart-optimistic)] h-full" style={{ width: '20%' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[7px] text-[var(--text-muted)]">
          <span>{formatINR(p10)}</span>
          <span>{formatINR(p50)}</span>
          <span>{formatINR(p90)}</span>
        </div>
      </div>
    </div>
  );
}
