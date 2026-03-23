import React from 'react';
import { Target, AlertTriangle, TrendingDown, Shield } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function DiagnosisCard({ results, params }: { results: any, params: any }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion } = results;
  const { retirementAge, lifeExpectancy, withdrawalInflation, currentAge } = params;

  const p50 = corpusAtRetirement.p50;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / p50) * 100;
  const drawdownYears = lifeExpectancy - retirementAge;

  // Calculate required corpus (4% rule)
  const requiredCorpus = (adjustedMonthlyExpenses * 12) / 0.04;
  const corpusGap = requiredCorpus - p50;

  // Risk factors
  const risks: Array<{
    title: string;
    severity: 'danger' | 'warning' | 'info';
    icon: any;
    value: string;
    message: string;
  }> = [];

  // Withdrawal rate risk
  if (withdrawalRate > 5) {
    risks.push({
      title: 'Withdrawal Rate',
      severity: 'danger',
      icon: Target,
      value: `${withdrawalRate.toFixed(1)}%`,
      message: 'Well above the 4% safety rule. High risk of portfolio depletion.'
    });
  } else if (withdrawalRate > 4) {
    risks.push({
      title: 'Withdrawal Rate',
      severity: 'warning',
      icon: Target,
      value: `${withdrawalRate.toFixed(1)}%`,
      message: 'Above the 4% rule. Margin for error is thin.'
    });
  } else {
    risks.push({
      title: 'Withdrawal Rate',
      severity: 'info',
      icon: Target,
      value: `${withdrawalRate.toFixed(1)}%`,
      message: 'Below the 4% rule. This is sustainable.'
    });
  }

  // Corpus gap risk
  if (corpusGap > 0) {
    risks.push({
      title: 'Corpus Shortfall',
      severity: corpusGap > p50 * 0.5 ? 'danger' : 'warning',
      icon: TrendingDown,
      value: `${formatINR(corpusGap)} gap`,
      message: `You need ${formatINR(requiredCorpus)} to safely withdraw ${formatINR(adjustedMonthlyExpenses)}/mo at 4%.`
    });
  }

  // Longevity risk
  if (drawdownYears > 30) {
    risks.push({
      title: 'Longevity Risk',
      severity: 'warning',
      icon: Shield,
      value: `${drawdownYears} years`,
      message: 'Your portfolio must sustain withdrawals for 30+ years. Long drawdown periods increase sequence-of-returns risk.'
    });
  }

  if (risks.length === 0 && successRate >= 80) {
    risks.push({
      title: 'All Clear',
      severity: 'info',
      icon: Shield,
      value: 'Stable',
      message: 'Your plan passes all key risk checks. No critical issues found.'
    });
  }

  return (
    <div className="space-y-4" id="diagnosis">
      <div className="flex items-center gap-2 mb-2">
        <Target size={18} className="text-[var(--accent-primary)]" />
        <h3 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">Why This Is Happening</h3>
      </div>
      
      <div className="space-y-3">
        {risks.map((risk, idx) => {
          const bgColor = risk.severity === 'danger' 
            ? 'bg-[var(--surface-danger)]/50' 
            : risk.severity === 'warning' 
              ? 'bg-[var(--surface-warning)]/50' 
              : 'bg-[var(--surface-success)]/50';
          
          const borderColor = risk.severity === 'danger' 
            ? 'border-[var(--semantic-danger)]/30' 
            : risk.severity === 'warning' 
              ? 'border-[var(--semantic-warning)]/30' 
              : 'border-[var(--semantic-success)]/30';
          
          const textColor = risk.severity === 'danger' 
            ? 'text-[var(--semantic-danger)]' 
            : risk.severity === 'warning' 
              ? 'text-[var(--semantic-warning)]' 
              : 'text-[var(--semantic-success)]';
          
          const IconComponent = risk.icon;
          
          return (
            <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${borderColor} ${bgColor}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
                <IconComponent size={16} className={textColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{risk.title}</span>
                  <span className={`text-sm font-bold font-['JetBrains_Mono'] ${textColor}`}>{risk.value}</span>
                </div>
                <p className="text-sm text-[var(--text-body)] mt-1">{risk.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
