import React, { useState, useCallback, useEffect } from 'react';
import { Sliders, TrendingUp, Clock, Zap, Heart, Gift, ChevronRight, Loader2 } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

export default function WhatIfStrip({ results, params }: { results: any, params: any }) {
  const { successRate } = results;
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
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
          // ── LEGACY MODE SCENARIOS ──
          const earlyRetireParams = { ...baseParams, retirementAge: Math.max(baseParams.retirementAge - 3, baseParams.currentAge + 2) };
          const earlyRetireRes = runMonteCarlo(earlyRetireParams);

          const lifestyleParams = { ...baseParams, monthlyExpenses: baseParams.monthlyExpenses + 20000 };
          const lifestyleRes = runMonteCarlo(lifestyleParams);

          const age90Params = { ...baseParams, lifeExpectancy: 90 };
          const age90Res = runMonteCarlo(age90Params);

          const giftParams = { ...baseParams, additionalLumpsum: -2500000, lumpsumYear: 1 };
          const giftRes = runMonteCarlo(giftParams);

          scenarios = [
            { id: 1, label: `Retire ${3}yr earlier`, success: earlyRetireRes.successRate, delta: earlyRetireRes.successRate - successRate, icon: Clock },
            { id: 2, label: '+₹20K/mo lifestyle', success: lifestyleRes.successRate, delta: lifestyleRes.successRate - successRate, icon: Heart },
            { id: 3, label: 'Plan until age 90', success: age90Res.successRate, delta: age90Res.successRate - successRate, icon: TrendingUp },
            { id: 4, label: 'Gift ₹25L to family', success: giftRes.successRate, delta: giftRes.successRate - successRate, icon: Gift },
          ];
        } else {
          // ── FIX MODE SCENARIOS ──
          const sipParams = { ...baseParams, monthlySavings: baseParams.monthlySavings + 20000 };
          const sipRes = runMonteCarlo(sipParams);

          const retireParams = { ...baseParams, retirementAge: baseParams.retirementAge + 3 };
          const retireRes = runMonteCarlo(retireParams);

          const stepUpParams = { ...baseParams, sipStepUp: baseParams.sipStepUp + 3 };
          const stepUpRes = runMonteCarlo(stepUpParams);

          const expenseParams = { ...baseParams, monthlyExpenses: Math.max(baseParams.monthlyExpenses - 10000, 20000) };
          const expenseRes = runMonteCarlo(expenseParams);

          scenarios = [
            { id: 1, label: '+₹20K SIP/mo', success: sipRes.successRate, delta: sipRes.successRate - successRate, icon: TrendingUp },
            { id: 2, label: `Retire at ${params.retirementAge + 3}`, success: retireRes.successRate, delta: retireRes.successRate - successRate, icon: Clock },
            { id: 3, label: '+3% Step-up', success: stepUpRes.successRate, delta: stepUpRes.successRate - successRate, icon: Zap },
            { id: 4, label: '-₹10K/mo expenses', success: expenseRes.successRate, delta: expenseRes.successRate - successRate, icon: Heart },
          ];
        }

        // Sort by delta descending
        scenarios.sort((a, b) => b.delta - a.delta);

        setWhatIfResults(scenarios);
        setHasCalculated(true);
      } catch (err) {
        console.error("Error calculating what-ifs:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated, isSafe]);

  // Auto-calculate on mount
  useEffect(() => {
    if (!hasCalculated) {
      calculateWhatIfs();
    }
  }, [calculateWhatIfs, hasCalculated]);

  // Reset when params/results change
  useEffect(() => {
    setHasCalculated(false);
    setWhatIfResults([]);
  }, [params, successRate]);

  const getBestOption = () => {
    if (!whatIfResults.length) return null;
    return whatIfResults.reduce((prev, current) => 
      current.delta > prev.delta ? current : prev
    );
  };

  const bestOption = getBestOption();

  return (
    <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[var(--accent-primary)]" />
          <h3 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">
            {isSafe ? 'Test Optimizations' : 'Test Scenarios'}
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {isSafe 
            ? 'See how each optimization affects your plan'
            : 'See how each change affects your success probability'
          }
        </p>
      </div>
      
      <div className="p-5">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Analyzing scenarios...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {whatIfResults.map((scenario, idx) => {
              const IconComponent = scenario.icon;
              const isBest = scenario.id === bestOption?.id;
              const isSecure = scenario.success >= 80;
              return (
                <button 
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id === selectedScenario ? null : scenario.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    selectedScenario === scenario.id 
                      ? 'border-[var(--accent-primary)] bg-[var(--surface-info)] shadow-md' 
                      : isBest
                        ? isSafe
                          ? 'border-[var(--accent-primary)] bg-[var(--surface-info)]/10 hover:shadow-md'
                          : 'border-[var(--semantic-success)] bg-[var(--surface-success)]/20 hover:shadow-md'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--accent-primary)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isBest 
                        ? isSafe ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--semantic-success)]/10'
                        : 'bg-[var(--surface-overlay)]'
                    }`}>
                      <IconComponent size={16} className={
                        isBest 
                          ? isSafe ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-success)]'
                          : 'text-[var(--text-heading)]'
                      } />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${
                        isBest 
                          ? isSafe ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-success)]'
                          : 'text-[var(--text-heading)]'
                      }`}>
                        {scenario.label}
                      </div>
                      {isBest && (
                        <div className={`text-[10px] font-bold uppercase ${
                          isSafe ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-success)]'
                        }`}>
                          {isSafe ? 'Best for legacy' : 'Best option'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`text-lg font-bold font-['JetBrains_Mono'] ${
                        isSecure ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-warning)]'
                      }`}>
                        {scenario.success.toFixed(0)}%
                      </div>
                      <div className={`text-xs font-bold ${scenario.delta > 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-warning)]'}`}>
                        {scenario.delta > 0 ? '+' : ''}{scenario.delta.toFixed(0)}%
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)]" />
                  </div>
                </button>
              );
            })}
            
            {whatIfResults.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--surface-card-alt)] border border-[var(--border-subtle)]">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Summary</div>
                <div className="text-sm text-[var(--text-body)]">
                  Current: <span className="font-bold text-[var(--text-heading)]">{successRate.toFixed(0)}%</span> • 
                  Best: <span className={`font-bold ${isSafe ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-success)]'}`}>{bestOption?.label}</span> → <span className={`font-bold ${isSafe ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-success)]'}`}>{bestOption?.success.toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
