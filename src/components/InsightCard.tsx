import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Sparkles, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2, Target, TrendingUp, ArrowRight } from 'lucide-react';
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

export default function InsightCard({ results, params }: { results: any, params: any }) {
  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, withdrawalRate: wr, p10Path } = results;
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
          // ── SAFE MODE: Legacy & Lifestyle Optimization ──
          const legacyActions = [
            {
              id: 'retire-3',
              title: `Retire at ${params.retirementAge - 3}`,
              p: { retirementAge: Math.max(params.retirementAge - 3, params.currentAge + 2) },
            },
            {
              id: 'retire-2',
              title: `Retire at ${params.retirementAge - 2}`,
              p: { retirementAge: Math.max(params.retirementAge - 2, params.currentAge + 2) },
            },
            {
              id: 'lifestyle-10',
              title: `Upgrade lifestyle by ₹10,000/mo`,
              p: { monthlyExpenses: params.monthlyExpenses + 10000 },
            },
            {
              id: 'lifestyle-20',
              title: `Upgrade lifestyle by ₹20,000/mo`,
              p: { monthlyExpenses: params.monthlyExpenses + 20000 },
            },
            {
              id: 'lifestyle-30',
              title: `Upgrade lifestyle by ₹30,000/mo`,
              p: { monthlyExpenses: params.monthlyExpenses + 30000 },
            },
            {
              id: 'age90',
              title: `Plan for age 90`,
              p: { lifeExpectancy: 90 },
            },
            {
              id: 'age95',
              title: `Plan for age 95`,
              p: { lifeExpectancy: 95 },
            },
            {
              id: 'gift-25',
              title: `Gift ₹25L to family now`,
              p: { additionalLumpsum: -2500000, lumpsumYear: 1 },
            },
            {
              id: 'gift-50',
              title: `Gift ₹50L to family now`,
              p: { additionalLumpsum: -5000000, lumpsumYear: 1 },
            },
          ];

          legacyActions.forEach(action => {
            const result = runMonteCarlo({ ...params, ...action.p, numSimulations: 500 } as any);
            const newSuccess = result.successRate;
            const delta = newSuccess - successRate;

            allOptions.push({
              id: action.id,
              title: action.title,
              success: newSuccess,
              delta,
              isSecure: newSuccess >= threshold,
              reasoning: [],
              tradeoffs: [],
              params: action.p,
            });
          });

          // Sort: secure first, then by delta desc
          allOptions.sort((a, b) => {
            if (a.isSecure !== b.isSecure) return a.isSecure ? -1 : 1;
            return b.delta - a.delta;
          });

          // Pick primary: best secure option with meaningful impact
          const bestSecure = allOptions.find(o => o.isSecure && o.delta < 0);
          const bestAny = allOptions[0];

          const chosen = bestSecure || bestAny;

          if (chosen) {
            // Generate personalized reasoning
            const reasoning: string[] = [];
            const tradeoffs: string[] = [];

            if (chosen.id.startsWith('retire-')) {
              const years = parseInt(chosen.id.split('-')[1]);
              reasoning.push(
                `With a ${successRate.toFixed(0)}% success rate, your corpus can sustain an earlier exit from work.`
              );
              reasoning.push(
                `Your projected corpus of ${formatINR(corpusAtRetirement.p50)} provides enough buffer to absorb ${years} fewer earning years.`
              );
              tradeoffs.push(
                `${years} fewer years of income and compounding reduces your worst-case buffer.`
              );
              tradeoffs.push(
                `Success drops to ${chosen.success.toFixed(0)}% — still above the 80% safety threshold.`
              );
            } else if (chosen.id.startsWith('lifestyle')) {
              const extra = parseInt(chosen.id.split('-')[1]) * 1000;
              reasoning.push(
                `Your current withdrawal rate of ${withdrawalRate.toFixed(1)}% is conservative. There is room to increase spending.`
              );
              reasoning.push(
                `Even with an additional ${formatINR(extra)}/mo, your corpus sustains through age ${Math.floor(medianAgeAtDepletion)} in most scenarios.`
              );
              tradeoffs.push(
                `Higher monthly spending reduces your safety margin in adverse market conditions.`
              );
              tradeoffs.push(
                `Success drops to ${chosen.success.toFixed(0)}%. Monitor annually.`
              );
            } else if (chosen.id.startsWith('age')) {
              const age = parseInt(chosen.id.replace('age', ''));
              reasoning.push(
                `Your current plan covers until age ${params.lifeExpectancy}. Extending to ${age} adds a longevity buffer.`
              );
              reasoning.push(
                `With a ${successRate.toFixed(0)}% success rate, your corpus has enough headroom for the additional ${age - params.lifeExpectancy} years.`
              );
              tradeoffs.push(
                `Planning for a longer life means more conservative spending assumptions.`
              );
              tradeoffs.push(
                `Success drops to ${chosen.success.toFixed(0)}% — your plan adapts to a longer horizon.`
              );
            } else if (chosen.id.startsWith('gift')) {
              const amount = parseInt(chosen.id.split('-')[1]);
              reasoning.push(
                `With ${successRate.toFixed(0)}% success and a corpus of ${formatINR(corpusAtRetirement.p50)}, you can afford a ${formatINR(amount * 100000)} lifetime gift.`
              );
              reasoning.push(
                `Gifting now lets your family benefit while you can see the impact — a growing trend among wealthy families.`
              );
              tradeoffs.push(
                `Removing ${formatINR(amount * 100000)} from your corpus reduces your worst-case buffer.`
              );
              tradeoffs.push(
                `Success drops to ${chosen.success.toFixed(0)}%. Still above the 80% threshold.`
              );
            }

            setPrimary({ ...chosen, reasoning, tradeoffs });
          }

          // Pick 2 alternatives: one conservative (no change), one aggressive
          const noChange: AdvisorOption = {
            id: 'no-change',
            title: 'Keep current plan unchanged',
            success: successRate,
            delta: 0,
            isSecure: true,
            reasoning: ['Your current plan already passes the 80% safety threshold.'],
            tradeoffs: ['No lifestyle upgrade or legacy optimization.'],
            params: {},
          };

          const aggressive = allOptions.find(o => o.isSecure && o.delta < -5) || allOptions.find(o => !o.isSecure) || allOptions[allOptions.length - 1];

          const altList: AdvisorOption[] = [noChange];
          if (aggressive && aggressive.id !== chosen?.id && aggressive.id !== 'no-change') {
            const aggrReasoning: string[] = [];
            const aggrTradeoffs: string[] = [];

            if (aggressive.id.startsWith('lifestyle-30') || aggressive.id.startsWith('gift-50')) {
              aggrReasoning.push('Maximizes your quality of life or family impact.');
              aggrTradeoffs.push(`Success drops to ${aggressive.success.toFixed(0)}%. ${aggressive.isSecure ? 'Still safe.' : 'Below 80% — monitor closely.'}`);
            } else {
              aggrReasoning.push('A bolder move with higher impact.');
              aggrTradeoffs.push(`Success: ${aggressive.success.toFixed(0)}%. ${aggressive.isSecure ? 'Within safety limits.' : 'Below threshold.'}`);
            }

            altList.push({ ...aggressive, reasoning: aggrReasoning, tradeoffs: aggrTradeoffs });
          }

          setAlternatives(altList);

          // Rest go to explore
          const usedIds = new Set([chosen?.id, ...altList.map(a => a.id)]);
          setExploreOptions(allOptions.filter(o => !usedIds.has(o.id)));

        } else {
          // ── AT-RISK MODE: Fix Strategies ──
          const fixActions = [
            { id: 'sip+25', title: `Increase SIP by ₹25,000/mo`, p: { monthlySavings: params.monthlySavings + 25000 } },
            { id: 'sip+20', title: `Increase SIP by ₹20,000/mo`, p: { monthlySavings: params.monthlySavings + 20000 } },
            { id: 'sip+15', title: `Increase SIP by ₹15,000/mo`, p: { monthlySavings: params.monthlySavings + 15000 } },
            { id: 'retire+5', title: `Retire at ${params.retirementAge + 5}`, p: { retirementAge: params.retirementAge + 5 } },
            { id: 'retire+3', title: `Retire at ${params.retirementAge + 3}`, p: { retirementAge: params.retirementAge + 3 } },
            { id: 'retire+2', title: `Retire at ${params.retirementAge + 2}`, p: { retirementAge: params.retirementAge + 2 } },
            { id: 'expenses-10', title: `Reduce expenses by ₹10,000/mo`, p: { monthlyExpenses: Math.max(params.monthlyExpenses - 10000, 20000) } },
          ];

          fixActions.forEach(action => {
            const result = runMonteCarlo({ ...params, ...action.p, numSimulations: 500 } as any);
            const newSuccess = result.successRate;
            const delta = newSuccess - successRate;

            if (delta > 0) {
              allOptions.push({
                id: action.id,
                title: action.title,
                success: newSuccess,
                delta,
                isSecure: newSuccess >= threshold,
                reasoning: [],
                tradeoffs: [],
                params: action.p,
              });
            }
          });

          allOptions.sort((a, b) => {
            if (a.isSecure !== b.isSecure) return a.isSecure ? -1 : 1;
            return b.delta - a.delta;
          });

          // Pick primary: best fix that reaches 80%
          const bestFix = allOptions.find(o => o.isSecure);
          const bestAny = allOptions[0];

          const chosen = bestFix || bestAny;

          if (chosen) {
            const reasoning: string[] = [];
            const tradeoffs: string[] = [];

            if (chosen.id.startsWith('sip+')) {
              const extra = parseInt(chosen.id.replace('sip+', '')) * 1000;
              reasoning.push(
                `Your current SIP of ${formatINR(params.monthlySavings)}/mo builds a corpus of ${formatINR(corpusAtRetirement.p50)} — insufficient for your ${formatINR(adjustedMonthlyExpenses)}/mo retirement need.`
              );
              reasoning.push(
                `Adding ${formatINR(extra)}/mo bridges the gap. The additional compounding over ${params.retirementAge - params.currentAge} years is significant.`
              );
              if (chosen.isSecure) {
                tradeoffs.push(
                  `Requires reducing current spending by ${formatINR(extra)}/mo.`
                );
              } else {
                tradeoffs.push(
                  `Improves success to ${chosen.success.toFixed(0)}%, but still below the 80% safety threshold. Consider combining with other strategies.`
                );
              }
            } else if (chosen.id.startsWith('retire+')) {
              const years = parseInt(chosen.id.replace('retire+', ''));
              reasoning.push(
                `Working ${years} more years adds both earning capacity and reduces the drawdown period from ${params.lifeExpectancy - params.retirementAge} to ${params.lifeExpectancy - params.retirementAge - years} years.`
              );
              reasoning.push(
                `Each additional year of compounding on your ${formatINR(corpusAtRetirement.p50)} corpus meaningfully improves resilience.`
              );
              if (chosen.isSecure) {
                tradeoffs.push(
                  `Delays your retirement by ${years} years. You trade time for security.`
                );
              } else {
                tradeoffs.push(
                  `Gets you to ${chosen.success.toFixed(0)}%, but still short of 80%. May need to combine with SIP increase.`
                );
              }
            } else if (chosen.id.startsWith('expenses')) {
              reasoning.push(
                `Reducing monthly expenses from ${formatINR(params.monthlyExpenses)} to ${formatINR(params.monthlyExpenses - 10000)} directly lowers your withdrawal rate.`
              );
              reasoning.push(
                `A lower withdrawal rate means your corpus lasts longer in adverse scenarios.`
              );
              tradeoffs.push(
                `Requires a more frugal retirement lifestyle.`
              );
            }

            setPrimary({ ...chosen, reasoning, tradeoffs });
          }

          // Alternatives
          const usedIds = new Set([chosen?.id]);
          const altCandidates = allOptions.filter(o => !usedIds.has(o.id));
          const altList: AdvisorOption[] = [];

          // One option that reaches 80% (if exists and different from primary)
          const anotherFix = altCandidates.find(o => o.isSecure);
          if (anotherFix) {
            altList.push({
              ...anotherFix,
              reasoning: [`Also achieves ${anotherFix.success.toFixed(0)}% success with a different approach.`],
              tradeoffs: [anotherFix.id.startsWith('retire') ? 'Delays retirement.' : 'Requires higher monthly savings.'],
            });
          }

          // One option that doesn't reach 80%
          const partialFix = altCandidates.find(o => !o.isSecure && !altList.some(a => a.id === o.id));
          if (partialFix) {
            altList.push({
              ...partialFix,
              reasoning: [`Improves success by +${partialFix.delta.toFixed(0)}% but does not reach the 80% safety threshold.`],
              tradeoffs: ['May need to combine with other strategies.'],
            });
          }

          setAlternatives(altList.slice(0, 2));

          // Rest to explore
          const allUsedIds = new Set([chosen?.id, ...altList.map(a => a.id)]);
          setExploreOptions(allOptions.filter(o => !allUsedIds.has(o.id)));
        }

        setHasCalculated(true);
      } catch (err) {
        console.error("Error calculating:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [params, successRate, hasCalculated, isSafe, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, withdrawalRate, p10Path]);

  useEffect(() => {
    if (!hasCalculated) calculate();
  }, [calculate, hasCalculated]);

  useEffect(() => {
    setHasCalculated(false);
    setPrimary(null);
    setAlternatives([]);
    setExploreOptions([]);
  }, [params, successRate]);

  const successColor = (s: number) =>
    s >= 80 ? 'var(--semantic-success)' :
    s >= 60 ? 'var(--semantic-warning)' :
    'var(--semantic-danger)';

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
            {isSafe ? 'Advisor Recommendation' : 'Recommended Strategy'}
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {isSafe
            ? 'Personalized guidance based on your current plan.'
            : 'The highest-impact action to secure your retirement.'
          }
        </p>
      </div>

      <div className="p-5 space-y-5">
        {isCalculating ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Analyzing your plan...</span>
            </div>
          </div>
        ) : primary ? (
          <>
            {/* ── PRIMARY RECOMMENDATION ── */}
            <div className="rounded-xl border-2 p-5 relative overflow-hidden"
              style={{
                borderColor: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)',
                backgroundColor: primary.isSecure ? 'var(--surface-success)' : 'var(--surface-warning)',
              }}
            >
              {/* Accent bar */}
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
                style={{ backgroundColor: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}
              />

              {/* Label */}
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} style={{ color: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}
                >
                  {isSafe ? 'Recommended Optimization' : 'Primary Fix'}
                </span>
              </div>

              {/* Title + Outcome */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-['Outfit'] text-xl font-bold text-[var(--text-heading)]">
                    {primary.title}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black font-['JetBrains_Mono']"
                    style={{ color: successColor(primary.success) }}
                  >
                    {primary.success.toFixed(0)}%
                  </div>
                  <div className="text-[10px] font-bold text-[var(--text-muted)]">
                    {primary.delta > 0 ? '+' : ''}{primary.delta.toFixed(0)}% from current
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              {primary.reasoning.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Why this works for you</div>
                  <ul className="space-y-1.5">
                    {primary.reasoning.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-body)]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: primary.isSecure ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trade-offs */}
              {primary.tradeoffs.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: primary.isSecure ? 'var(--semantic-success)20' : 'var(--semantic-warning)20' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Trade-offs</div>
                  <ul className="space-y-1.5">
                    {primary.tradeoffs.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)]">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status badge */}
              <div className="mt-4 pt-3 border-t flex items-center gap-2"
                style={{ borderColor: primary.isSecure ? 'var(--semantic-success)20' : 'var(--semantic-warning)20' }}
              >
                {primary.isSecure ? (
                  <>
                    <CheckCircle size={14} className="text-[var(--semantic-success)]" />
                    <span className="text-xs font-bold text-[var(--semantic-success)]">
                      {isSafe ? 'Your plan remains secure' : 'This reaches the 80% safety threshold'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} className="text-[var(--semantic-warning)]" />
                    <span className="text-xs font-bold text-[var(--semantic-warning)]">
                      {isSafe ? 'Slightly reduces safety margin' : 'Improves but does not fully secure — consider combining strategies'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── ALTERNATIVES ── */}
            {alternatives.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Alternatives</div>
                <div className="space-y-2">
                  {alternatives.map((alt) => (
                    <div key={alt.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card-alt)] border border-[var(--border-subtle)]">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--text-heading)]">{alt.title}</div>
                        {alt.reasoning.length > 0 && (
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{alt.reasoning[0]}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-lg font-bold font-['JetBrains_Mono']" style={{ color: successColor(alt.success) }}>
                          {alt.success.toFixed(0)}%
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)]">
                          {alt.delta > 0 ? '+' : ''}{alt.delta.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EXPLORE ── */}
            {exploreOptions.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setShowExplore(!showExplore)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-heading)]">Explore other scenarios</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-overlay)] px-2 py-0.5 rounded">
                      {exploreOptions.length} more
                    </span>
                  </div>
                  {showExplore ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
                </button>

                {showExplore && (
                  <div className="mt-3 space-y-2">
                    {exploreOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-card-alt)]/50 border border-[var(--border-subtle)]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--text-heading)]">{opt.title}</span>
                            {opt.isSecure && <span className="text-[9px] font-bold text-[var(--semantic-success)]">✓</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-sm font-bold font-['JetBrains_Mono']" style={{ color: successColor(opt.success) }}>
                            {opt.success.toFixed(0)}%
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] ml-1">
                            {opt.delta > 0 ? '+' : ''}{opt.delta.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p className="text-sm">Run a simulation to get recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
