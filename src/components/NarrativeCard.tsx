import React from 'react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function NarrativeCard({ results, params }: { results: any; params: any }) {
  const { corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, successRate } = results;
  const { currentAge, retirementAge, lifeExpectancy, monthlySavings, sipStepUp } = params;

  const accumYears = retirementAge - currentAge;
  const drawYears = lifeExpectancy - retirementAge;

  return (
    <div className="border-t border-[var(--border-subtle)] pt-4 pb-2">
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        <span className="font-bold text-[var(--text-heading)]">Your Wealth Story:</span>{' '}
        Investing <span className="font-bold">{formatINR(monthlySavings)}/mo</span> with <span className="font-bold">{sipStepUp}%</span> step-up
        for <span className="font-bold">{accumYears}yr</span> to build a{' '}
        <span className="font-bold text-[var(--accent-primary)]">{formatINR(corpusAtRetirement.p50)}</span> median corpus.
        Then withdrawing <span className="font-bold">{formatINR(adjustedMonthlyExpenses)}/mo</span> for{' '}
        <span className="font-bold">{drawYears}yr</span>.
        Median plan lasts to age <span className="font-bold">{medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}</span>.
        {successRate < 80 && (
          <span className="text-[var(--semantic-danger)] font-bold"> {' '}⚠ {100 - successRate.toFixed(0)}% chance of early depletion.</span>
        )}
      </p>
    </div>
  );
}
