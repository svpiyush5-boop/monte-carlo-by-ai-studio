import React, { useState, useCallback } from 'react';
import { Shield, ArrowRight, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

interface FixOption {
  id: string;
  title: string;
  description: string;
  success: number;
  delta: number;
  effort: 'Low' | 'Medium' | 'High';
  timeImpact?: string;
  isCombined?: boolean;
  isFix: boolean;
}

export default function InsightCard({ results, params }: { results: any, params: any }) {
  const { successRate } = results;
  const [showImprovements, setShowImprovements] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fixOptions, setFixOptions] = useState<FixOption[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateFixes = useCallback(() => {
    if (hasCalculated) return;
    
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to render loading state
    setTimeout(() => {
      try {
        const baseParams = { ...params, numSimulations: 500 };
        const currentSuccess = successRate;
        const threshold = 80;

        const options: FixOption[] = [];

        // Generate only the most impactful single-action options
        const singleActions = [
          { id: 'sip+25', title: 'Increase SIP by ₹25,000', params: { monthlySavings: baseParams.monthlySavings + 25000 }, effort: 'High' as const, desc: 'Save ₹25,000 more per month' },
          { id: 'sip+20', title: 'Increase SIP by ₹20,000', params: { monthlySavings: baseParams.monthlySavings + 20000 }, effort: 'Medium' as const, desc: 'Save ₹20,000 more per month' },
          { id: 'sip+15', title: 'Increase SIP by ₹15,000', params: { monthlySavings: baseParams.monthlySavings + 15000 }, effort: 'Medium' as const, desc: 'Save ₹15,000 more per month' },
          { id: 'retire+5', title: 'Retire at ' + (params.retirementAge + 5), params: { retirementAge: baseParams.retirementAge + 5 }, effort: 'High' as const, desc: 'Work 5 more years before retiring', timeImpact: 'Delays retirement by 5 years' },
          { id: 'retire+3', title: 'Retire at ' + (params.retirementAge + 3), params: { retirementAge: baseParams.retirementAge + 3 }, effort: 'Medium' as const, desc: 'Work 3 more years before retiring', timeImpact: 'Delays retirement by 3 years' },
          { id: 'retire+2', title: 'Retire at ' + (params.retirementAge + 2), params: { retirementAge: baseParams.retirementAge + 2 }, effort: 'Low' as const, desc: 'Work 2 more years before retiring', timeImpact: 'Delays retirement by 2 years' },
        ];

        // Calculate outcomes for all options
        singleActions.forEach(action => {
          const result = runMonteCarlo({ ...action.params, numSimulations: 500 });
          const newSuccess = result.successRate;
          const delta = newSuccess - currentSuccess;
          
          options.push({
            id: action.id,
            title: action.title,
            description: action.desc,
            success: newSuccess,
            delta: delta,
            effort: action.effort,
            timeImpact: action.timeImpact,
            isCombined: false,
            isFix: newSuccess >= threshold
          });
        });

        // Sort by success rate descending
        options.sort((a, b) => b.success - a.success);

        setFixOptions(options);
        setHasCalculated(true);
      } catch (err) {
        console.error("Error calculating fixes:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated]);

  const trueFixes = fixOptions.filter(f => f.isFix);
  const improvements = fixOptions.filter(f => !f.isFix);

  const getEffortColor = (effort: string) => {
    if (effort === 'Low') return 'text-[var(--semantic-success)]';
    if (effort === 'Medium') return 'text-[var(--semantic-warning)]';
    return 'text-[var(--semantic-danger)]';
  };

  return (
    <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]" id="fix-engine">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[var(--accent-primary)]" />
          <h3 className="font-['Outfit'] text-lg font-bold text-[var(--text-heading)]">Make Your Plan Work</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Strategies that make your retirement financially sustainable
        </p>
      </div>
      
      <div className="p-5 space-y-3">
        {/* TRUE FIXES - Primary */}
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Calculating strategies...</span>
            </div>
          </div>
        ) : !hasCalculated ? (
          <div className="flex items-center justify-center py-8">
            <button 
              onClick={calculateFixes}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Calculate Fix Strategies
            </button>
          </div>
        ) : (
          <>
            {trueFixes.length > 0 && (
              <div className="space-y-3">
                {trueFixes.map((fix) => (
                  <div 
                    key={fix.id}
                    className="relative overflow-hidden rounded-xl border-2 border-[var(--semantic-success)]/20 bg-[var(--surface-card)] hover:border-[var(--semantic-success)] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{fix.effort} Effort</span>
                          </div>
                          <h4 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">{fix.title}</h4>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{fix.description}</p>
                          {fix.timeImpact && (
                            <p className="text-[10px] text-[var(--semantic-warning)] mt-1">{fix.timeImpact}</p>
                          )}
                        </div>
                        
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black font-['JetBrains_Mono'] text-[var(--semantic-success)]">
                            {fix.success.toFixed(0)}%
                          </div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">
                            +{fix.delta.toFixed(0)}% improvement
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-[var(--semantic-success)]" />
                          <span className="text-xs font-bold text-[var(--semantic-success)]">This fixes your plan</span>
                        </div>
                        <button className="text-xs font-bold text-[var(--accent-primary)] hover:text-[var(--accent-hover)] flex items-center gap-1">
                          Simulate <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {trueFixes.length === 0 && (
              <div className="text-center py-4 text-[var(--text-muted)]">
                <AlertTriangle size={20} className="mx-auto mb-2 text-[var(--semantic-warning)]" />
                <p className="text-sm">No single action achieves 80% success rate.</p>
                <p className="text-xs mt-1">Try combining multiple strategies.</p>
              </div>
            )}

            {/* IMPROVEMENTS - Secondary */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <button 
                onClick={() => setShowImprovements(!showImprovements)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-heading)]">Partial Improvements</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-overlay)] px-2 py-0.5 rounded">{improvements.length} options</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <span>{showImprovements ? 'Hide' : 'Show'}</span>
                  {showImprovements ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>
              
              {showImprovements && (
                <div className="mt-3 space-y-2">
                  {improvements.map((imp) => (
                    <div 
                      key={imp.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card-alt)]/50 border border-[var(--border-subtle)]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[var(--text-heading)]">{imp.title}</span>
                          <span className={`text-[9px] font-bold uppercase ${getEffortColor(imp.effort)}`}>{imp.effort}</span>
                        </div>
                        {imp.timeImpact && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{imp.timeImpact}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-base font-bold font-['JetBrains_Mono'] text-[var(--text-heading)]">
                          {imp.success.toFixed(0)}%
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)]">
                          +{imp.delta.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 rounded-lg bg-[var(--surface-danger)]/10 border border-[var(--semantic-danger)]/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[var(--semantic-danger)] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-[var(--semantic-danger)]">
                        These improve your outcome but do NOT secure your plan. Aim for 80%+ to ensure long-term viability.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
