import React from 'react';
import { Target, AlertTriangle, TrendingDown, Shield, CheckCircle } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function DiagnosisCard({ results, params }: { results: any; params: any }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion } = results;
  const { retirementAge, lifeExpectancy, currentAge } = params;

  const p50 = corpusAtRetirement.p50;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / p50) * 100;
  const drawdownYears = lifeExpectancy - retirementAge;
  const requiredCorpus = (adjustedMonthlyExpenses * 12) / 0.04;
  const corpusGap = requiredCorpus - p50;

  const risks: Array<{
    title: string;
    severity: 'danger' | 'warning' | 'info';
    icon: any;
    value: string;
    message: string;
  }> = [];

  if (withdrawalRate > 5) {
    risks.push({ title: 'Withdrawal Rate', severity: 'danger', icon: Target, value: `${withdrawalRate.toFixed(1)}%`, message: 'Well above the 4% safety rule. High risk of portfolio depletion.' });
  } else if (withdrawalRate > 4) {
    risks.push({ title: 'Withdrawal Rate', severity: 'warning', icon: Target, value: `${withdrawalRate.toFixed(1)}%`, message: 'Above the 4% rule. Margin for error is thin.' });
  } else {
    risks.push({ title: 'Withdrawal Rate', severity: 'info', icon: Target, value: `${withdrawalRate.toFixed(1)}%`, message: 'Below the 4% rule. This is sustainable.' });
  }

  if (corpusGap > 0) {
    risks.push({ title: 'Corpus Shortfall', severity: corpusGap > p50 * 0.5 ? 'danger' : 'warning', icon: TrendingDown, value: `${formatINR(corpusGap)} gap`, message: `Need ${formatINR(requiredCorpus)} to safely withdraw ${formatINR(adjustedMonthlyExpenses)}/mo at 4%.` });
  }

  if (drawdownYears > 30) {
    risks.push({ title: 'Longevity Risk', severity: 'warning', icon: Shield, value: `${drawdownYears} years`, message: 'Portfolio must sustain withdrawals for 30+ years. Increases sequence-of-returns risk.' });
  }

  if (risks.length === 0 && successRate >= 80) {
    risks.push({ title: 'All Clear', severity: 'info', icon: CheckCircle, value: 'Stable', message: 'Your plan passes all key risk checks.' });
  }

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)]">Risk Diagnosis</h2>
        <p className="text-[10px] text-[var(--text-muted)]">Key risk factors affecting your retirement plan</p>
      </div>
      <div className="space-y-0">
        {risks.map((risk, idx) => {
          const IconComponent = risk.icon;
          const dotColor = risk.severity === 'danger' ? 'var(--semantic-danger)' : risk.severity === 'warning' ? 'var(--semantic-warning)' : 'var(--semantic-success)';
          return (
            <div key={idx} className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
              <IconComponent size={14} style={{ color: dotColor }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-heading)]">{risk.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{risk.message}</div>
              </div>
              <div className="text-sm font-bold font-['JetBrains_Mono'] shrink-0" style={{ color: dotColor }}>
                {risk.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
