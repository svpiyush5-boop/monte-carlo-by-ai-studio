import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Sparkles, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2, Target } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

interface AdvisorOption {
  id: string;
  title: string;
  success: number;
  delta: number;
  isSecure: boolean;
  reasoning: string[];
  tradeoffs: string[];
  params: Record<string, any>;
}

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function InsightCard({ results, params }: { results: any; params: any }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, p10Path } = results;
  const [showExplore, setShowExplore] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [primary, setPrimary] = useState<AdvisorOption | null>(null);
  const [alternatives, setAlternatives] = useState<AdvisorOption[]>([]);
  const [exploreOptions, setExploreOptions] = useState<AdvisorOption[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const isSafe = successRate >= 80;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / corpusAtRetirement.p50) * 100;
  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;

  const calculate = useCallback(() => {
    if (hasCalculated) return;
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const threshold = 80;
        const allOptions: AdvisorOption[] = [];

        if (isSafe) {
          const legacyActions = [
            { id: 'retire-3', title: `Retire at ${params.retirementAge - 3}`, p: { retirementAge: Math.max(params.retirementAge - 3, params.currentAge + 2) } },
            { id: 'retire-2', title: `Retire at ${params.retirementAge - 2}`, p: { retirementAge: Math.max(params.retirementAge - 2, params.currentAge + 2) } },
            { id: 'lifestyle-10', title: `Upgrade lifestyle by ₹10,000/mo`, p: { monthlyExpenses: params.monthlyExpenses + 10000 } },
            { id: 'lifestyle-20', title: `Upgrade lifestyle by ₹20,000/mo`, p: { monthlyExpenses: params.monthlyExpenses + 20000 } },
            { id: 'lifestyle-30', title: `Upgrade lifestyle by ₹30,000/mo`, p: { monthlyExpenses: params.monthlyExpenses + 30000 } },
            { id: 'age90', title: `Plan for age 90`, p: { lifeExpectancy: 90 } },
            { id: 'age95', title: `Plan for age 95`, p: { lifeExpectancy: 95 } },
            { id: 'gift-25', title: `Gift ₹25L to family now`, p: { additionalLumpsum: -2500000, lumpsumYear: 1 } },
            { id: 'gift-50', title: `Gift ₹50L to family now`, p: { additionalLumpsum: -5000000, lumpsumYear: 1 } },
          ];

          legacyActions.forEach(action => {
            const result = runMonteCarlo({ ...params, ...action.p, numSimulations: 500 } as any);
            allOptions.push({
              id: action.id, title: action.title, success: result.successRate,
              delta: result.successRate - successRate, isSecure: result.successRate >= threshold,
              reasoning: [], tradeoffs: [], params: action.p,
            });
          });

          allOptions.sort((a, b) => a.isSecure !== b.isSecure ? (a.isSecure ? -1 : 1) : b.delta - a.delta);

          const chosen = allOptions.find(o => o.isSecure && o.delta < 0) || allOptions[0];
          if (chosen) {
            const reasoning: string[] = [];
            const tradeoffs: string[] = [];
            if (chosen.id.startsWith('retire-')) {
              const yrs = parseInt(chosen.id.split('-')[1]);
              reasoning.push(`${successRate.toFixed(0)}% success means your corpus can absorb ${yrs} fewer earning years.`);
              tradeoffs.push(`Success drops to ${chosen.success.toFixed(0)}% — still above 80%.`);
            } else if (chosen.id.startsWith('lifestyle')) {
              const extra = parseInt(chosen.id.split('-')[1]) * 1000;
              reasoning.push(`${withdrawalRate.toFixed(1)}% withdrawal rate is conservative. Room to increase by ${formatINR(extra)}/mo.`);
              tradeoffs.push(`Higher spending reduces safety margin in adverse markets.`);
            } else if (chosen.id.startsWith('age')) {
              const age = parseInt(chosen.id.replace('age', ''));
              reasoning.push(`Extending to ${age} adds ${age - params.lifeExpectancy} years of longevity buffer.`);
              tradeoffs.push(`More conservative spending assumptions needed.`);
            } else if (chosen.id.startsWith('gift')) {
              const amt = parseInt(chosen.id.split('-')[1]);
              reasoning.push(`With ${successRate.toFixed(0)}% success, you can afford a ${formatINR(amt * 100000)} lifetime gift.`);
              tradeoffs.push(`Reduces worst-case buffer.`);
            }
            setPrimary({ ...chosen, reasoning, tradeoffs });
          }

          const noChange: AdvisorOption = { id: 'no-change', title: 'Keep current plan', success: successRate, delta: 0, isSecure: true, reasoning: ['Already passes 80% threshold.'], tradeoffs: [], params: {} };
          const aggressive = allOptions.find(o => o.isSecure && o.delta < -5) || allOptions.find(o => !o.isSecure) || allOptions[allOptions.length - 1];
          const altList: AdvisorOption[] = [noChange];
          if (aggressive && aggressive.id !== chosen?.id && aggressive.id !== 'no-change') {
            altList.push({ ...aggressive, reasoning: ['A bolder move with higher impact.'], tradeoffs: [`Success: ${aggressive.success.toFixed(0)}%.`] });
          }
          setAlternatives(altList);
          const usedIds = new Set([chosen?.id, ...altList.map(a => a.id)]);
          setExploreOptions(allOptions.filter(o => !usedIds.has(o.id)));
        } else {
          const fixActions = [
            { id: 'sip+25', title: `+₹25K SIP/mo`, p: { monthlySavings: params.monthlySavings + 25000 } },
            { id: 'sip+20', title: `+₹20K SIP/mo`, p: { monthlySavings: params.monthlySavings + 20000 } },
            { id: 'sip+15', title: `+₹15K SIP/mo`, p: { monthlySavings: params.monthlySavings + 15000 } },
            { id: 'retire+5', title: `Retire at ${params.retirementAge + 5}`, p: { retirementAge: params.retirementAge + 5 } },
            { id: 'retire+3', title: `Retire at ${params.retirementAge + 3}`, p: { retirementAge: params.retirementAge + 3 } },
            { id: 'retire+2', title: `Retire at ${params.retirementAge + 2}`, p: { retirementAge: params.retirementAge + 2 } },
            { id: 'expenses-10', title: `-₹10K/mo expenses`, p: { monthlyExpenses: Math.max(params.monthlyExpenses - 10000, 20000) } },
          ];

          fixActions.forEach(action => {
            const result = runMonteCarlo({ ...params, ...action.p, numSimulations: 500 } as any);
            const delta = result.successRate - successRate;
            if (delta > 0) {
              allOptions.push({
                id: action.id, title: action.title, success: result.successRate,
                delta, isSecure: result.successRate >= threshold,
                reasoning: [], tradeoffs: [], params: action.p,
              });
            }
          });

          allOptions.sort((a, b) => a.isSecure !== b.isSecure ? (a.isSecure ? -1 : 1) : b.delta - a.delta);
          const chosen = allOptions.find(o => o.isSecure) || allOptions[0];
          if (chosen) {
            const reasoning: string[] = [];
            const tradeoffs: string[] = [];
            if (chosen.id.startsWith('sip+')) {
              const extra = parseInt(chosen.id.replace('sip+', '')) * 1000;
              reasoning.push(`Adding ${formatINR(extra)}/mo bridges the corpus gap over ${params.retirementAge - params.currentAge} years.`);
              tradeoffs.push(chosen.isSecure ? `Requires reducing current spending by ${formatINR(extra)}/mo.` : `Still below 80%. Combine with other strategies.`);
            } else if (chosen.id.startsWith('retire+')) {
              const yrs = parseInt(chosen.id.replace('retire+', ''));
              reasoning.push(`${yrs} more years of compounding meaningfully improves resilience.`);
              tradeoffs.push(`Delays retirement by ${yrs} years.`);
            } else if (chosen.id.startsWith('expenses')) {
              reasoning.push(`Lower expenses directly reduce withdrawal rate.`);
              tradeoffs.push(`More frugal retirement lifestyle.`);
            }
            setPrimary({ ...chosen, reasoning, tradeoffs });
          }

          const usedIds = new Set([chosen?.id]);
          const altCandidates = allOptions.filter(o => !usedIds.has(o.id));
          const altList: AdvisorOption[] = [];
          const anotherFix = altCandidates.find(o => o.isSecure);
          if (anotherFix) altList.push({ ...anotherFix, reasoning: [`Also achieves ${anotherFix.success.toFixed(0)}% success.`], tradeoffs: [] });
          const partialFix = altCandidates.find(o => !o.isSecure && !altList.some(a => a.id === o.id));
          if (partialFix) altList.push({ ...partialFix, reasoning: [`+${partialFix.delta.toFixed(0)}% but below 80%.`], tradeoffs: [] });
          setAlternatives(altList.slice(0, 2));
          const allUsedIds = new Set([chosen?.id, ...altList.map(a => a.id)]);
          setExploreOptions(allOptions.filter(o => !allUsedIds.has(o.id)));
        }
        setHasCalculated(true);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated, isSafe, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, withdrawalRate, p10Path]);

  useEffect(() => { if (!hasCalculated) calculate(); }, [calculate, hasCalculated]);
  useEffect(() => { setHasCalculated(false); setPrimary(null); setAlternatives([]); setExploreOptions([]); }, [params, successRate]);

  const successColor = (s: number) => s >= 80 ? 'var(--semantic-success)' : s >= 60 ? 'var(--semantic-warning)' : 'var(--semantic-danger)';

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs">Analyzing your plan...</span>
        </div>
      </div>
    );
  }

  if (!primary) return null;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)]">
          {isSafe ? 'Advisor Recommendation' : 'Recommended Strategy'}
        </h2>
      </div>

      {/* Primary — flat, left-accent bar */}
      <div className="pl-3 border-l-[3px] mb-4" style={{ borderColor: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}>
              {isSafe ? 'Recommended Optimization' : 'Primary Fix'}
            </div>
            <h4 className="text-base font-bold text-[var(--text-heading)]">{primary.title}</h4>
            {primary.reasoning.length > 0 && (
              <p className="text-xs text-[var(--text-body)] mt-1.5">{primary.reasoning.join(' ')}</p>
            )}
            {primary.tradeoffs.length > 0 && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                <AlertTriangle size={10} /> {primary.tradeoffs.join(' ')}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black font-['JetBrains_Mono']" style={{ color: successColor(primary.success) }}>
              {primary.success.toFixed(0)}%
            </div>
            <div className="text-[9px] font-bold text-[var(--text-muted)]">
              {primary.delta > 0 ? '+' : ''}{primary.delta.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Alternatives — compact rows */}
      {alternatives.length > 0 && (
        <div className="space-y-0 mb-3">
          {alternatives.map(alt => (
            <div key={alt.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--text-heading)] truncate">{alt.title}</div>
                {alt.isSecure && <CheckCircle size={10} className="text-[var(--semantic-success)] shrink-0" />}
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0 ml-2">
                <span className="text-sm font-bold font-['JetBrains_Mono']" style={{ color: successColor(alt.success) }}>
                  {alt.success.toFixed(0)}%
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {alt.delta > 0 ? '+' : ''}{alt.delta.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explore */}
      {exploreOptions.length > 0 && (
        <div>
          <button onClick={() => setShowExplore(!showExplore)} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
            {showExplore ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {exploreOptions.length} more scenarios
          </button>
          {showExplore && (
            <div className="mt-2 space-y-0">
              {exploreOptions.map(opt => (
                <div key={opt.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[11px] text-[var(--text-body)]">{opt.title}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-bold font-['JetBrains_Mono']" style={{ color: successColor(opt.success) }}>{opt.success.toFixed(0)}%</span>
                    <span className="text-[8px] text-[var(--text-muted)]">{opt.delta > 0 ? '+' : ''}{opt.delta.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
