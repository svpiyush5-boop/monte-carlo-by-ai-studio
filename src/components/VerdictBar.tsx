import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Info, ArrowRight } from 'lucide-react';

interface VerdictBarProps {
  results: any;
  params: any;
}

export default function VerdictBar({ results, params }: VerdictBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, p10Path } = results;

  // Find worst-case depletion age (P10)
  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;

  const getVerdictData = () => {
    if (successRate >= 80) {
      return {
        color: '#059669',
        label: 'Safe',
        verdict: 'Your plan is on track for a secure retirement.',
        shortVerdict: 'Plan is on track',
        urgency: 'Your portfolio should last through age 100 in most market scenarios.',
        contextLine: 'High probability of sustained income through retirement',
        cta: 'Optimize for legacy',
        ctaShort: 'Optimize →',
        icon: ShieldCheck
      };
    }
    if (successRate >= 60) {
      return {
        color: '#CA8A04',
        label: 'Moderate Risk',
        verdict: `You may run out of money by age ${Math.floor(medianAgeAtDepletion)}.`,
        shortVerdict: `Depletion by age ${Math.floor(medianAgeAtDepletion)}`,
        urgency: p10DepletionAge
          ? `In weaker markets, depletion could happen as early as age ${p10DepletionAge}.`
          : `In weaker markets, this could happen as early as age ${Math.floor(medianAgeAtDepletion - 5)}.`,
        contextLine: p10DepletionAge
          ? `Moderate risk of depletion by age ${p10DepletionAge} in weak markets`
          : `Moderate risk of depletion before age 90`,
        cta: 'Fix this plan',
        ctaShort: 'Fix this →',
        icon: Info
      };
    }
    if (successRate >= 40) {
      return {
        color: '#DC2626',
        label: 'At Risk',
        verdict: `You are likely to run out of money by age ${Math.floor(medianAgeAtDepletion)}.`,
        shortVerdict: `Likely depletion by ${Math.floor(medianAgeAtDepletion)}`,
        urgency: p10DepletionAge
          ? `There's a 10% chance this happens as early as age ${p10DepletionAge}.`
          : `There's a 10% chance this happens as early as age ${Math.floor(medianAgeAtDepletion - 10)}.`,
        contextLine: p10DepletionAge
          ? `High risk of depletion by age ${p10DepletionAge}`
          : `High risk of depletion before age 85`,
        cta: 'Fix this plan',
        ctaShort: 'Fix this →',
        icon: AlertTriangle
      };
    }
    return {
      color: '#B91C1C',
      label: 'Critical',
      verdict: `You will likely deplete your corpus before age ${Math.floor(medianAgeAtDepletion)}.`,
      shortVerdict: `Critical depletion risk`,
      urgency: p10DepletionAge
        ? `High risk of complete depletion. Worst case: age ${p10DepletionAge}.`
        : `High risk of complete depletion. Worst case: age ${Math.floor(medianAgeAtDepletion - 15)}.`,
      contextLine: p10DepletionAge
        ? `Very high risk of complete depletion by age ${p10DepletionAge}`
        : `Very high risk of complete depletion before age 80`,
      cta: 'Act now',
      ctaShort: 'Act now →',
      icon: AlertTriangle
    };
  };

  const verdict = getVerdictData();

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollY = window.scrollY;
    const threshold = 120; // px before full collapse
    const progress = Math.min(scrollY / threshold, 1);
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToFix = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('fix-engine');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Interpolate values based on scroll progress
  const percentageSize = 72 - (scrollProgress * 52); // 72px → 20px
  const percentageOpacity = 1;
  const labelSize = 16 - (scrollProgress * 6); // 16px → 10px
  const verdictOpacity = 1 - scrollProgress; // Fade out
  const urgencyOpacity = Math.max(1 - (scrollProgress * 2), 0); // Fade out faster
  const ctaOpacity = Math.max(1 - (scrollProgress * 2), 0); // Fade out faster
  const contextOpacity = 1 - scrollProgress; // Fade out
  const metricsOpacity = Math.max(1 - (scrollProgress * 3), 0); // Fade out quickest

  // Collapsed state elements
  const shortVerdictOpacity = scrollProgress;
  const ctaShortOpacity = scrollProgress;
  const shadowOpacity = scrollProgress * 0.08;
  const borderOpacity = scrollProgress * 0.15;

  const IconComponent = verdict.icon;

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-30"
      style={{
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        backgroundColor: `rgba(var(--surface-card-rgb, 255,255,255), ${0.92 + (scrollProgress * 0.08)})`,
        boxShadow: `0 ${scrollProgress * 8}px ${scrollProgress * 32}px rgba(0,0,0,${shadowOpacity})`,
        borderBottom: scrollProgress > 0.1 ? `1px solid rgba(var(--border-subtle-rgb, 0,0,0), ${borderOpacity})` : 'none',
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 md:px-8 relative overflow-hidden"
        style={{
          transition: 'padding 0.3s ease',
          paddingTop: `${24 - (scrollProgress * 16)}px`,
          paddingBottom: `${24 - (scrollProgress * 16)}px`,
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            backgroundColor: verdict.color,
            opacity: 0.03 * (1 - scrollProgress),
            filter: 'blur(80px)',
            transform: `scale(${1 - scrollProgress * 0.5})`,
            transition: 'all 0.3s ease',
          }}
        />

        <div
          className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-md)] relative overflow-hidden"
          style={{
            transition: 'padding 0.3s ease, border-radius 0.3s ease',
            padding: `${scrollProgress > 0.5 ? '12px 16px' : '16px 24px'}`,
            borderRadius: scrollProgress > 0.5 ? '12px' : '16px',
          }}
        >
          {/* EXPANDED STATE */}
          <div
            className="transition-all duration-300"
            style={{
              opacity: scrollProgress < 0.9 ? 1 : 0,
              transform: `translateY(${scrollProgress * -8}px)`,
              pointerEvents: scrollProgress > 0.9 ? 'none' : 'auto',
              position: scrollProgress > 0.5 ? 'absolute' : 'relative',
            }}
          >
            {/* Main verdict row */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
              {/* LEFT: % + Label */}
              <div className="flex items-baseline gap-3 shrink-0">
                <span
                  className="font-black font-['JetBrains_Mono'] leading-none tracking-tight"
                  style={{
                    color: verdict.color,
                    fontSize: `${percentageSize}px`,
                    transition: 'font-size 0.3s ease',
                    opacity: percentageOpacity,
                  }}
                >
                  {successRate.toFixed(0)}
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: verdict.color,
                    fontSize: `${percentageSize * 0.4}px`,
                    transition: 'font-size 0.3s ease',
                  }}
                >
                  %
                </span>
                <span
                  className="font-bold uppercase tracking-wider"
                  style={{
                    color: verdict.color,
                    fontSize: `${labelSize}px`,
                    transition: 'font-size 0.3s ease',
                  }}
                >
                  {verdict.label}
                </span>
              </div>

              {/* RIGHT: Stacked content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Verdict text */}
                <div
                  className="text-xl lg:text-2xl font-bold text-[var(--text-heading)] leading-tight"
                  style={{ opacity: verdictOpacity, transition: 'opacity 0.3s ease' }}
                >
                  {verdict.verdict}
                </div>

                {/* Urgency line */}
                <div
                  className="text-sm font-medium text-[var(--text-muted)]"
                  style={{ opacity: urgencyOpacity, transition: 'opacity 0.3s ease' }}
                >
                  {verdict.urgency}
                </div>

                {/* Context line */}
                <div
                  className="text-sm font-medium"
                  style={{
                    color: `color-mix(in srgb, ${verdict.color} 60%, var(--text-muted))`,
                    opacity: contextOpacity,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {verdict.contextLine}
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-3 pt-1"
                  style={{ opacity: ctaOpacity, transition: 'opacity 0.3s ease' }}
                >
                  <button
                    onClick={scrollToFix}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: verdict.color, color: '#fff' }}
                  >
                    {verdict.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>


          </div>

          {/* COLLAPSED STATE */}
          <div
            className="flex items-center justify-between gap-4"
            style={{
              opacity: scrollProgress > 0.1 ? 1 : 0,
              transform: `translateY(${(1 - scrollProgress) * 8}px)`,
              pointerEvents: scrollProgress > 0.1 ? 'auto' : 'none',
              position: scrollProgress > 0.1 ? 'relative' : 'absolute',
            }}
          >
            {/* LEFT: % + Label */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="font-black font-['JetBrains_Mono'] leading-none"
                style={{
                  color: verdict.color,
                  fontSize: `${20 + (scrollProgress * 2)}px`,
                  transition: 'font-size 0.2s ease',
                }}
              >
                {successRate.toFixed(0)}%
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: verdict.color }}
              >
                {verdict.label}
              </span>
            </div>

            {/* CENTER: Context line */}
            <div
              className="flex-1 min-w-0 text-center hidden sm:block"
              style={{ opacity: shortVerdictOpacity, transition: 'opacity 0.3s ease' }}
            >
              <span className="text-xs font-medium text-[var(--text-muted)] line-clamp-1">
                {verdict.shortVerdict}
              </span>
            </div>

            {/* RIGHT: CTA */}
            <div
              className="shrink-0"
              style={{ opacity: ctaShortOpacity, transition: 'opacity 0.3s ease' }}
            >
              <button
                onClick={scrollToFix}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                style={{ backgroundColor: verdict.color, color: '#fff' }}
              >
                {verdict.ctaShort}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
