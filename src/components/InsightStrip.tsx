import React from 'react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function InsightStrip({ results, params }: { results: any; params: any }) {
  const { corpusAtRetirement, medianAgeAtDepletion, successRate, p10Path } = results;
  const { retirementAge, lifeExpectancy, currentAge } = params;

  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;
  const isSafe = successRate >= 80;

  return (
    <div className="mx-4 md:mx-8 mt-6">
      <div className="px-4 py-3 rounded-xl bg-[var(--surface-card-alt)] border border-[var(--border-subtle)]">
        <div className="text-xs font-bold text-[var(--text-heading)] mb-1.5">What This Means</div>
        <p className="text-sm text-[var(--text-body)] leading-relaxed">
          You are likely to maintain wealth till age <span className="font-bold text-[var(--accent-primary)]">{medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}</span>. 
          Median corpus at retirement: <span className="font-bold">{formatINR(corpusAtRetirement.p50)}</span>. 
          {p10DepletionAge ? (
            <span className="text-[var(--semantic-danger)]"> Worst-case depletion risk begins at age {p10DepletionAge}.</span>
          ) : (
            <span className="text-[var(--semantic-success)]"> Your portfolio survives in all simulated scenarios.</span>
          )}
        </p>
      </div>
    </div>
  );
}