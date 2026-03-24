import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function SummaryBar({ results, params }: { results: any; params: any }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, p10Path } = results;
  const { retirementAge } = params;

  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / corpusAtRetirement.p50) * 100;

  // Hero colors
  const isSafe = successRate >= 80;
  const isModerate = successRate >= 60;
  const isAtRisk = successRate >= 40;
  
  let color, bgColor, label, subtext;
  
  if (isSafe) {
    color = '#059669';
    bgColor = '#ECFDF5';
    label = 'SAFE';
    subtext = `You are on track to sustain till age ${medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}`;
  } else if (isModerate) {
    color = '#B45309';
    bgColor = '#FFFBEB';
    label = 'MODERATE RISK';
    subtext = `Risk of depletion starts around age ${Math.floor(medianAgeAtDepletion - 5)}`;
  } else if (isAtRisk) {
    color = '#DC2626';
    bgColor = '#FEF2F2';
    label = 'AT RISK';
    subtext = `High chance of depletion by age ${Math.floor(medianAgeAtDepletion)}`;
  } else {
    color = '#B91C1C';
    bgColor = '#FEF2F2';
    label = 'CRITICAL';
    subtext = `Likely to deplete before age ${Math.floor(medianAgeAtDepletion)}`;
  }

  const scrollToFix = () => {
    document.getElementById('fix-engine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div 
      className="mx-4 md:mx-8 mt-4 rounded-2xl p-5 md:p-6 border-0"
      style={{ backgroundColor: bgColor, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
        {/* LEFT: Primary Focus - Plan Health */}
        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            <span 
              className="text-4xl md:text-5xl font-black font-['JetBrains_Mono'] leading-none"
              style={{ color }}
            >
              {successRate.toFixed(0)}%
            </span>
            <span 
              className="text-lg md:text-xl font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {label}
            </span>
          </div>
          <p className="text-sm md:text-base font-medium mt-2 text-[var(--text-body)]">
            {subtext}
          </p>
        </div>

        {/* RIGHT: Secondary Metrics - compressed */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <MetricPill label="Corpus at Retirement" value={formatINR(corpusAtRetirement.p50)} />
          <MetricPill label="Monthly Need" value={formatINR(adjustedMonthlyExpenses)} />
          <MetricPill 
            label="Funds Last Until" 
            value={`Age ${medianAgeAtDepletion >= 100 ? '100+' : Math.floor(medianAgeAtDepletion)}`}
            highlight={!isSafe}
          />
          
          <button
            onClick={scrollToFix}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ backgroundColor: isSafe ? color : '#1A56DB', color: '#fff' }}
          >
            {isSafe ? 'Optimize' : 'Fix Plan'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{label}</span>
      <span className={`text-sm font-bold font-['JetBrains_Mono'] ${highlight ? 'text-[var(--semantic-warning)]' : 'text-[var(--text-heading)]'}`}>
        {value}
      </span>
    </div>
  );
}