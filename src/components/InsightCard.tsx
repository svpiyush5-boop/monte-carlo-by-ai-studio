import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Sparkles, ArrowRight, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2, TrendingUp, Gift, Clock, Heart } from 'lucide-react';
import { runMonteCarlo } from '../utils/simulation';

interface StrategyOption {
  id: string;
  title: string;
  description: string;
  success: number;
  delta: number;
  effort: 'Low' | 'Medium' | 'High';
  impact?: string;
  icon: any;
  category: 'fix' | 'legacy';
  isSecure: boolean;
}

export default function InsightCard({ results, params }: { results: any, params: any }) {
  const { successRate } = results;
  const [showAll, setShowAll] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const isSafe = successRate >= 80;

  const calculateStrategies = useCallback(() => {
    if (hasCalculated) return;

    setIsCalculating(true);

    setTimeout(() => {
      try {
        const threshold = 80;
        const options: StrategyOption[] = [];

        if (isSafe) {
          // ── LEGACY MODE: Lifestyle upgrades & optimization ──
          const legacyActions: Array<{
            id: string;
            title: string;
            description: string;
            p: Record<string, any>;
            effort: 'Low' | 'Medium' | 'High';
            impact: string;
            icon: any;
          }> = [
            // Early retirement
            {
              id: 'early-2',
              title: `Retire at ${params.retirementAge - 2}`,
              description: `Retire 2 years earlier than planned`,
              p: { retirementAge: params.retirementAge - 2 },
              effort: 'Low',
              impact: 'Gain 2 years of freedom',
              icon: Clock
            },
            {
              id: 'early-3',
              title: `Retire at ${params.retirementAge - 3}`,
              description: `Retire 3 years earlier than planned`,
              p: { retirementAge: Math.max(params.retirementAge - 3, params.currentAge + 2) },
              effort: 'Medium',
              impact: 'Gain 3 years of freedom',
              icon: Clock
            },
            {
              id: 'early-5',
              title: `Retire at ${params.retirementAge - 5}`,
              description: `Retire 5 years earlier than planned`,
              p: { retirementAge: Math.max(params.retirementAge - 5, params.currentAge + 2) },
              effort: 'High',
              impact: 'Gain 5 years of freedom',
              icon: Clock
            },
            // Lifestyle upgrades
            {
              id: 'lifestyle-10',
              title: 'Upgrade lifestyle by ₹10,000/mo',
              description: 'Enjoy a more comfortable retirement',
              p: { monthlyExpenses: params.monthlyExpenses + 10000 },
              effort: 'Low',
              impact: `Spend ₹${((params.monthlyExpenses + 10000) / 1000).toFixed(0)}K/month in retirement`,
              icon: Heart
            },
            {
              id: 'lifestyle-20',
              title: 'Upgrade lifestyle by ₹20,000/mo',
              description: 'Significantly improve your quality of life',
              p: { monthlyExpenses: params.monthlyExpenses + 20000 },
              effort: 'Medium',
              impact: `Spend ₹${((params.monthlyExpenses + 20000) / 1000).toFixed(0)}K/month in retirement`,
              icon: Heart
            },
            {
              id: 'lifestyle-30',
              title: 'Upgrade lifestyle by ₹30,000/mo',
              description: 'Luxury retirement lifestyle',
              p: { monthlyExpenses: params.monthlyExpenses + 30000 },
              effort: 'High',
              impact: `Spend ₹${((params.monthlyExpenses + 30000) / 1000).toFixed(0)}K/month in retirement`,
              icon: Heart
            },
            // Extended life planning
            {
              id: 'age90',
              title: 'Plan for age 90',
              description: 'Ensure your corpus lasts even longer',
              p: { lifeExpectancy: 90 },
              effort: 'Low',
              impact: 'Extra 5 years of safety',
              icon: TrendingUp
            },
            {
              id: 'age95',
              title: 'Plan for age 95',
              description: 'Extra safety margin for longevity',
              p: { lifeExpectancy: 95 },
              effort: 'Medium',
              impact: 'Extra 10 years of safety',
              icon: TrendingUp
            },
            // Gift to family
            {
              id: 'gift-25',
              title: 'Gift ₹25L to family now',
              description: 'Help your family while you can see them enjoy it',
              p: { additionalLumpsum: -2500000, lumpsumYear: 1 },
              effort: 'Medium',
              impact: 'Generosity with guardrails',
              icon: Gift
            },
            {
              id: 'gift-50',
              title: 'Gift ₹50L to family now',
              description: 'Significant legacy gift during your lifetime',
              p: { additionalLumpsum: -5000000, lumpsumYear: 1 },
              effort: 'High',
              impact: 'Maximum lifetime giving',
              icon: Gift
            },
          ];

          legacyActions.forEach(action => {
            const result = runMonteCarlo({
              ...params,
              ...action.p,
              numSimulations: 500,
            } as any);
            const newSuccess = result.successRate;

            options.push({
              id: action.id,
              title: action.title,
              description: action.description,
              success: newSuccess,
              delta: newSuccess - successRate,
              effort: action.effort,
              impact: action.impact,
              icon: action.icon,
              category: 'legacy',
              isSecure: newSuccess >= threshold,
            });
          });

          // Sort: secure options first (by delta desc), then insecure (by delta desc)
          options.sort((a, b) => {
            if (a.isSecure !== b.isSecure) return a.isSecure ? -1 : 1;
            return b.delta - a.delta;
          });

        } else {
          // ── FIX MODE: Strategies to improve success rate ──
          const fixActions: Array<{
            id: string;
            title: string;
            description: string;
            p: Record<string, any>;
            effort: 'Low' | 'Medium' | 'High';
            impact?: string;
          }> = [
            {
              id: 'sip+15',
              title: `Increase SIP by ₹15,000`,
              description: `Save ₹15,000 more per month`,
              p: { monthlySavings: params.monthlySavings + 15000 },
              effort: 'Low',
            },
            {
              id: 'sip+20',
              title: `Increase SIP by ₹20,000`,
              description: `Save ₹20,000 more per month`,
              p: { monthlySavings: params.monthlySavings + 20000 },
              effort: 'Medium',
            },
            {
              id: 'sip+25',
              title: `Increase SIP by ₹25,000`,
              description: `Save ₹25,000 more per month`,
              p: { monthlySavings: params.monthlySavings + 25000 },
              effort: 'High',
            },
            {
              id: 'retire+2',
              title: `Retire at ${params.retirementAge + 2}`,
              description: `Work 2 more years before retiring`,
              p: { retirementAge: params.retirementAge + 2 },
              effort: 'Low',
              impact: 'Delays retirement by 2 years',
            },
            {
              id: 'retire+3',
              title: `Retire at ${params.retirementAge + 3}`,
              description: `Work 3 more years before retiring`,
              p: { retirementAge: params.retirementAge + 3 },
              effort: 'Medium',
              impact: 'Delays retirement by 3 years',
            },
            {
              id: 'retire+5',
              title: `Retire at ${params.retirementAge + 5}`,
              description: `Work 5 more years before retiring`,
              p: { retirementAge: params.retirementAge + 5 },
              effort: 'High',
              impact: 'Delays retirement by 5 years',
            },
            {
              id: 'expenses-10',
              title: 'Reduce expenses by ₹10,000/mo',
              description: 'Lower your retirement spending needs',
              p: { monthlyExpenses: Math.max(params.monthlyExpenses - 10000, 20000) },
              effort: 'Medium',
              impact: 'More frugal retirement lifestyle',
            },
          ];

          fixActions.forEach(action => {
            const result = runMonteCarlo({
              ...params,
              ...action.p,
              numSimulations: 500,
            } as any);
            const newSuccess = result.successRate;
            const delta = newSuccess - successRate;

            // Only include strategies that actually improve success rate
            if (delta > 0) {
              options.push({
                id: action.id,
                title: action.title,
                description: action.description,
                success: newSuccess,
                delta,
                effort: action.effort,
                impact: action.impact,
                icon: Shield,
                category: 'fix',
                isSecure: newSuccess >= threshold,
              });
            }
          });

          // Sort by delta (highest improvement first)
          options.sort((a, b) => b.delta - a.delta);
        }

        setStrategies(options);
        setHasCalculated(true);
      } catch (err) {
        console.error("Error calculating strategies:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated, isSafe]);

  useEffect(() => {
    if (!hasCalculated) {
      calculateStrategies();
    }
  }, [calculateStrategies, hasCalculated]);

  // Reset calculation when params or results change
  useEffect(() => {
    setHasCalculated(false);
    setStrategies([]);
  }, [params, successRate]);

  const primaryStrategies = strategies.slice(0, 3);
  const secondaryStrategies = strategies.slice(3);

  const getEffortColor = (effort: string) => {
    if (effort === 'Low') return 'text-[var(--semantic-success)]';
    if (effort === 'Medium') return 'text-[var(--semantic-warning)]';
    return 'text-[var(--semantic-danger)]';
  };

  const accentColor = isSafe ? 'var(--accent-primary)' : 'var(--semantic-success)';
  const borderColor = isSafe ? 'border-[var(--accent-primary)]/20' : 'border-[var(--semantic-success)]/20';
  const hoverBorderColor = isSafe ? 'hover:border-[var(--accent-primary)]' : 'hover:border-[var(--semantic-success)]';

  return (
    <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]" id="fix-engine">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {isSafe ? (
            <Sparkles size={18} className="text-[var(--accent-primary)]" />
          ) : (
            <Shield size={18} className="text-[var(--accent-primary)]" />
          )}
          <h3 className="font-['Outfit'] text-lg font-bold text-[var(--text-heading)]">
            {isSafe ? 'What You Can Do Next' : 'Make Your Plan Work'}
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {isSafe
            ? 'Your plan is secure. Here\'s how to optimize further.'
            : 'Strategies to secure your retirement'
          }
        </p>
      </div>

      <div className="p-5 space-y-3">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Analyzing strategies...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Primary strategies */}
            {primaryStrategies.length > 0 && (
              <div className="space-y-3">
                {primaryStrategies.map((strategy) => {
                  const IconComponent = strategy.icon;
                  return (
                    <div
                      key={strategy.id}
                      className={`relative overflow-hidden rounded-xl border-2 ${borderColor} ${hoverBorderColor} bg-[var(--surface-card)] hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${getEffortColor(strategy.effort)}`}>
                                {strategy.effort} Effort
                              </span>
                              {strategy.isSecure && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--semantic-success)]">
                                  ✦ Secure
                                </span>
                              )}
                            </div>
                            <h4 className="font-['Outfit'] text-base font-bold text-[var(--text-heading)]">
                              {strategy.title}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {strategy.description}
                            </p>
                            {strategy.impact && (
                              <p className={`text-[10px] mt-1 ${strategy.isSecure ? 'text-[var(--accent-primary)]' : 'text-[var(--semantic-warning)]'}`}>
                                {strategy.impact}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className="text-2xl font-black font-['JetBrains_Mono']"
                              style={{ color: strategy.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}
                            >
                              {strategy.success.toFixed(0)}%
                            </div>
                            <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">
                              {strategy.delta > 0 ? '+' : ''}{strategy.delta.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {strategy.isSecure ? (
                              <>
                                <CheckCircle size={14} className="text-[var(--semantic-success)]" />
                                <span className="text-xs font-bold text-[var(--semantic-success)]">
                                  {isSafe ? 'Your plan stays secure' : 'This fixes your plan'}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={14} className="text-[var(--semantic-warning)]" />
                                <span className="text-xs font-bold text-[var(--semantic-warning)]">
                                  May reduce your safety margin
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {primaryStrategies.length === 0 && !isSafe && (
              <div className="text-center py-4 text-[var(--text-muted)]">
                <AlertTriangle size={20} className="mx-auto mb-2 text-[var(--semantic-warning)]" />
                <p className="text-sm">No single action achieves 80% success rate.</p>
                <p className="text-xs mt-1">Try combining multiple strategies.</p>
              </div>
            )}

            {primaryStrategies.length === 0 && isSafe && (
              <div className="text-center py-4 text-[var(--text-muted)]">
                <Sparkles size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                <p className="text-sm">Your plan is highly optimized.</p>
                <p className="text-xs mt-1">Consider consulting an advisor for personalized legacy planning.</p>
              </div>
            )}

            {/* Secondary strategies */}
            {secondaryStrategies.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-heading)]">
                      {isSafe ? 'More Options' : 'Partial Improvements'}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-overlay)] px-2 py-0.5 rounded">
                      {secondaryStrategies.length} options
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <span>{showAll ? 'Hide' : 'Show'}</span>
                    {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {showAll && (
                  <div className="mt-3 space-y-2">
                    {secondaryStrategies.map((strategy) => {
                      const IconComponent = strategy.icon;
                      return (
                        <div
                          key={strategy.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card-alt)]/50 border border-[var(--border-subtle)]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--text-heading)]">
                                {strategy.title}
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${getEffortColor(strategy.effort)}`}>
                                {strategy.effort}
                              </span>
                              {strategy.isSecure && (
                                <span className="text-[9px] font-bold uppercase text-[var(--semantic-success)]">
                                  ✓
                                </span>
                              )}
                            </div>
                            {strategy.impact && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{strategy.impact}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="text-base font-bold font-['JetBrains_Mono'] text-[var(--text-heading)]">
                              {strategy.success.toFixed(0)}%
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)]">
                              {strategy.delta > 0 ? '+' : ''}{strategy.delta.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!isSafe && (
                      <div className="p-3 rounded-lg bg-[var(--surface-danger)]/10 border border-[var(--semantic-danger)]/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-[var(--semantic-danger)] mt-0.5 shrink-0" />
                          <p className="text-[10px] text-[var(--semantic-danger)]">
                            These improve your outcome but do NOT secure your plan. Aim for 80%+ to ensure long-term viability.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
