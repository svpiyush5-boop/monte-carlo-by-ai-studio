import React, { useState, useCallback, useEffect } from 'react';
import { Sliders, TrendingUp, Clock, Zap, Heart, Gift, Loader2 } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

export default function WhatIfStrip({ results, params }: { results: any; params: any }) {
  const { successRate } = results;
  const [isCalculating, setIsCalculating] = useState(false);
  const [whatIfResults, setWhatIfResults] = useState<any[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const isSafe = successRate >= 80;

  const calculateWhatIfs = useCallback(() => {
    if (hasCalculated) return;
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const baseParams = { ...params, numSimulations: 500 };
        let scenarios: any[] = [];

        if (isSafe) {
          const earlyRetireRes = runMonteCarlo({ ...baseParams, retirementAge: Math.max(baseParams.retirementAge - 3, baseParams.currentAge + 2) });
          const lifestyleRes = runMonteCarlo({ ...baseParams, monthlyExpenses: baseParams.monthlyExpenses + 20000 });
          const age90Res = runMonteCarlo({ ...baseParams, lifeExpectancy: 90 });
          const giftRes = runMonteCarlo({ ...baseParams, additionalLumpsum: -2500000, lumpsumYear: 1 });
          scenarios = [
            { id: 1, label: `Retire 3yr earlier`, success: earlyRetireRes.successRate, delta: earlyRetireRes.successRate - successRate, icon: Clock },
            { id: 2, label: '+₹20K/mo lifestyle', success: lifestyleRes.successRate, delta: lifestyleRes.successRate - successRate, icon: Heart },
            { id: 3, label: 'Plan until age 90', success: age90Res.successRate, delta: age90Res.successRate - successRate, icon: TrendingUp },
            { id: 4, label: 'Gift ₹25L to family', success: giftRes.successRate, delta: giftRes.successRate - successRate, icon: Gift },
          ];
        } else {
          const sipRes = runMonteCarlo({ ...baseParams, monthlySavings: baseParams.monthlySavings + 20000 });
          const retireRes = runMonteCarlo({ ...baseParams, retirementAge: baseParams.retirementAge + 3 });
          const stepUpRes = runMonteCarlo({ ...baseParams, sipStepUp: baseParams.sipStepUp + 3 });
          const expenseRes = runMonteCarlo({ ...baseParams, monthlyExpenses: Math.max(baseParams.monthlyExpenses - 10000, 20000) });
          scenarios = [
            { id: 1, label: '+₹20K SIP/mo', success: sipRes.successRate, delta: sipRes.successRate - successRate, icon: TrendingUp },
            { id: 2, label: `Retire at ${params.retirementAge + 3}`, success: retireRes.successRate, delta: retireRes.successRate - successRate, icon: Clock },
            { id: 3, label: '+3% Step-up', success: stepUpRes.successRate, delta: stepUpRes.successRate - successRate, icon: Zap },
            { id: 4, label: '-₹10K/mo expenses', success: expenseRes.successRate, delta: expenseRes.successRate - successRate, icon: Heart },
          ];
        }
        scenarios.sort((a, b) => b.delta - a.delta);
        setWhatIfResults(scenarios);
        setHasCalculated(true);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated, isSafe]);

  useEffect(() => { if (!hasCalculated) calculateWhatIfs(); }, [calculateWhatIfs, hasCalculated]);
  useEffect(() => { setHasCalculated(false); setWhatIfResults([]); }, [params, successRate]);

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  const bestOption = whatIfResults.length ? whatIfResults.reduce((a, b) => b.delta > a.delta ? b : a) : null;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)]">
          {isSafe ? 'Test Optimizations' : 'Test Scenarios'}
        </h2>
      </div>

      <div className="space-y-0">
        {whatIfResults.map(scenario => {
          const IconComponent = scenario.icon;
          const isBest = scenario.id === bestOption?.id;
          const isSecure = scenario.success >= 80;
          return (
            <div key={scenario.id} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <IconComponent size={14} className={isBest ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'} />
                <div>
                  <div className={`text-xs font-bold ${isBest ? 'text-[var(--accent-primary)]' : 'text-[var(--text-heading)]'}`}>
                    {scenario.label}
                  </div>
                  {isBest && (
                    <div className="text-[8px] font-bold uppercase text-[var(--accent-primary)]">Best option</div>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className={`text-sm font-bold font-['JetBrains_Mono'] ${isSecure ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-warning)]'}`}>
                  {scenario.success.toFixed(0)}%
                </span>
                <span className={`text-[9px] font-bold ${scenario.delta > 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-warning)]'}`}>
                  {scenario.delta > 0 ? '+' : ''}{scenario.delta.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
