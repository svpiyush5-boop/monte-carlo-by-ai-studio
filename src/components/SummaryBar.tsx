import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function SummaryBar({ results, params }: { results: any; params: any }) {
  const [compact, setCompact] = useState(false);

  const { successRate, corpusAtRetirement, adjustedMonthlyExpenses, medianAgeAtDepletion, p10Path } = results;
  const { retirementAge } = params;

  const p10DepletionAge = p10Path?.find((p: any) => p.balance <= 0)?.age || null;
  const withdrawalRate = ((adjustedMonthlyExpenses * 12) / corpusAtRetirement.p50) * 100;

  const color = successRate >= 80 ? '#059669' : successRate >= 60 ? '#CA8A04' : successRate >= 40 ? '#DC2626' : '#B91C1C';
  const label = successRate >= 80 ? 'Safe' : successRate >= 60 ? 'Moderate' : successRate >= 40 ? 'At Risk' : 'Critical';
  const cta = successRate >= 80 ? 'Optimize' : 'Fix This';

  const handleScroll = useCallback(() => {
    setCompact(window.scrollY > 80);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToFix = () => {
    document.getElementById('fix-engine')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="sticky top-0 z-30 border-b border-[var(--border-subtle)]"
      style={{
        backgroundColor: `rgba(var(--surface-card-rgb, 255,255,255), ${compact ? 0.98 : 0.95})`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4"
        style={{
          paddingTop: compact ? '8px' : '14px',
          paddingBottom: compact ? '8px' : '14px',
          transition: 'padding 0.25s ease',
        }}
      >
        {/* Left: success rate */}
        <div className="flex items-baseline gap-1.5 shrink-0">
          <span
            className="font-black font-['JetBrains_Mono'] leading-none"
            style={{ color, fontSize: compact ? '22px' : '30px', transition: 'font-size 0.25s ease' }}
          >
            {successRate.toFixed(0)}
          </span>
          <span className="font-bold" style={{ color, fontSize: compact ? '11px' : '14px', transition: 'font-size 0.25s ease' }}>%</span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded hidden sm:inline"
            style={{ color, backgroundColor: `${color}12` }}
          >
            {label}
          </span>
        </div>

        {/* Center: metric pills */}
        <div className="hidden md:flex items-center flex-1 justify-center min-w-0">
          <div className="flex items-center gap-1 overflow-hidden">
            <Pill label="Corpus" value={formatINR(corpusAtRetirement.p50)} />
            <Sep />
            <Pill label="Lasts" value={medianAgeAtDepletion >= 100 ? '100+' : `Age ${Math.floor(medianAgeAtDepletion)}`} />
            <Sep />
            <Pill label="Monthly" value={formatINR(adjustedMonthlyExpenses)} />
            <Sep />
            <Pill label="WR" value={`${withdrawalRate.toFixed(1)}%`} warn={withdrawalRate > 4.5} />
            {p10DepletionAge && (
              <>
                <Sep />
                <Pill label="Worst" value={`Age ${p10DepletionAge}`} danger />
              </>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        <button
          onClick={scrollToFix}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 shrink-0"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {cta}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function Pill({ label, value, warn, danger }: { label: string; value: string; warn?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--surface-card-alt)]">
      <span className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">{label}</span>
      <span className={`text-[11px] font-bold font-['JetBrains_Mono'] whitespace-nowrap ${danger ? 'text-[var(--semantic-danger)]' : warn ? 'text-[var(--semantic-warning)]' : 'text-[var(--text-heading)]'}`}>
        {value}
      </span>
    </div>
  );
}

function Sep() {
  return <span className="w-px h-3 bg-[var(--border-subtle)] mx-0.5 shrink-0" />;
}
