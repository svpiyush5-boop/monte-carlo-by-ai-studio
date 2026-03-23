import React, { useState, useCallback } from 'react';
import { Sliders, TrendingUp, Clock, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

export default function WhatIfStrip({ results, params }: { results: any, params: any }) {
  const { successRate } = results;
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [whatIfResults, setWhatIfResults] = useState<any[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateWhatIfs = useCallback(() => {
    if (hasCalculated) return;
    
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const baseParams = { ...params, numSimulations: 500 };
        
        const sipParams = { ...baseParams, monthlySavings: baseParams.monthlySavings + 10000 };
        const sipRes = runMonteCarlo(sipParams);
        
        const retireParams = { ...baseParams, retirementAge: baseParams.retirementAge + 3 };
        const retireRes = runMonteCarlo(retireParams);
        
        const stepUpParams = { ...baseParams, sipStepUp: baseParams.sipStepUp + 2 };
        const stepUpRes = runMonteCarlo(stepUpParams);
        
        const results = [
          { id: 1, label: '+₹10K SIP/mo', success: sipRes.successRate, delta: sipRes.successRate - successRate, icon: TrendingUp },
          { id: 2, label: `Retire at ${params.retirementAge + 3}`, success: retireRes.successRate, delta: retireRes.successRate - successRate, icon: Clock },
          { id: 3, label: '+2% Step-up', success: stepUpRes.successRate, delta: stepUpRes.successRate - successRate, icon: Zap },
        ];

        setWhatIfResults(results);
        setHasCalculated(true);
      } catch (err) {
        console.error("Error calculating what-ifs:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated]);

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
          <h3 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">Test Scenarios</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          See how each change affects your success probability
        </p>
      </div>
      
      <div className="p-5">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Calculating...</span>
            </div>
          </div>
        ) : !hasCalculated ? (
          <div className="flex items-center justify-center py-8">
            <button 
              onClick={calculateWhatIfs}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Test Scenarios
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {whatIfResults.map((scenario) => {
              const IconComponent = scenario.icon;
              const isBest = scenario.id === bestOption?.id;
              return (
                <button 
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    selectedScenario === scenario.id 
                      ? 'border-[var(--accent-primary)] bg-[var(--surface-info)] shadow-md' 
                      : isBest
                        ? 'border-[var(--semantic-success)] bg-[var(--surface-success)]/20 hover:shadow-md'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--accent-primary)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isBest ? 'bg-[var(--semantic-success)]/10' : 'bg-[var(--surface-overlay)]'
                    }`}>
                      <IconComponent size={16} className={isBest ? 'text-[var(--semantic-success)]' : 'text-[var(--text-heading)]'} />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${isBest ? 'text-[var(--semantic-success)]' : 'text-[var(--text-heading)]'}`}>
                        {scenario.label}
                      </div>
                      {isBest && (
                        <div className="text-[10px] font-bold text-[var(--semantic-success)] uppercase">Best Option</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`text-lg font-bold font-['JetBrains_Mono'] ${isBest ? 'text-[var(--semantic-success)]' : 'text-[var(--text-heading)]'}`}>
                        {scenario.success.toFixed(0)}%
                      </div>
                      <div className={`text-xs font-bold ${scenario.delta > 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--text-muted)]'}`}>
                        {scenario.delta > 0 ? '+' : ''}{scenario.delta.toFixed(0)}%
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)]" />
                  </div>
                </button>
              );
            })}
            
            {hasCalculated && whatIfResults.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--surface-card-alt)] border border-[var(--border-subtle)]">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Summary</div>
                <div className="text-sm text-[var(--text-body)]">
                  Current: <span className="font-bold text-[var(--text-heading)]">{successRate.toFixed(0)}%</span> • 
                  Best: <span className="font-bold text-[var(--semantic-success)]">{bestOption?.label}</span> → <span className="font-bold text-[var(--semantic-success)]">{bestOption?.success.toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
