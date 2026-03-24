import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { CashflowRow } from '../utils/simulation';

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

const formatINRShort = (val: number) => {
  if (Math.abs(val) >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (Math.abs(val) >= 100000) return `${(val / 100000).toFixed(1)}L`;
  return `${Math.round(val).toLocaleString('en-IN')}`;
};

const formatSignedINR = (val: number) => {
  const prefix = val >= 0 ? '+' : '';
  if (Math.abs(val) >= 10000000) return `${prefix}${(val / 10000000).toFixed(2)}Cr`;
  if (Math.abs(val) >= 100000) return `${prefix}${(val / 100000).toFixed(1)}L`;
  return `${prefix}${Math.round(val).toLocaleString('en-IN')}`;
};

export default function CashflowTable({ results, params }: { results: any; params: any }) {
  const [showAccum, setShowAccum] = useState(true);
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [expanded, setExpanded] = useState(false); // COLLAPSED BY DEFAULT
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { medianCashflow } = results;
  const { currentAge, retirementAge, lifeExpectancy } = params;
  const rows: CashflowRow[] = medianCashflow || [];

  const { accumulationRows, drawdownRows, grandTotals } = useMemo(() => {
    const accum = rows.filter(r => r.phase === 'accumulation');
    const draw = rows.filter(r => r.phase === 'drawdown');
    const sumField = (arr: CashflowRow[], field: keyof CashflowRow) => arr.reduce((s, r) => s + (r[field] as number), 0);
    return {
      accumulationRows: accum,
      drawdownRows: draw,
      grandTotals: {
        totalContributions: sumField(accum, 'contributions') + sumField(accum, 'lumpsum'),
        totalWithdrawals: sumField(draw, 'withdrawals'),
        totalReturn: sumField(accum, 'investmentReturn') + sumField(draw, 'investmentReturn'),
      },
    };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const r: CashflowRow[] = [];
    if (showAccum) r.push(...accumulationRows);
    if (showDrawdown) r.push(...drawdownRows);
    return r;
  }, [showAccum, showDrawdown, accumulationRows, drawdownRows]);

  // PREVIEW MODE: only 3 rows
  const displayRows = expanded ? visibleRows : visibleRows.slice(0, 3);

  const lastRow = rows[rows.length - 1];
  const finalBalance = lastRow?.closingBalance || 0;
  const depletionAge = finalBalance <= 0 ? lastRow?.age : null;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      const ro = new ResizeObserver(checkScroll);
      ro.observe(el);
      return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
    }
  }, [displayRows]);

  const scrollBy = (dir: number) => { scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' }); };

  const exportCSV = () => {
    const headers = ['Age','Year','Phase','Opening','Contributions','Lumpsum','Withdrawals','PartTime','Returns','Closing','Net'];
    const csvRows = rows.map(r => [r.age,r.year,r.phase,Math.round(r.openingBalance),Math.round(r.contributions),Math.round(r.lumpsum),Math.round(r.withdrawals),Math.round(r.partTimeIncome),Math.round(r.investmentReturn),Math.round(r.closingBalance),Math.round(r.netCashflow)].join(','));
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'retirement_cashflow.csv';
    a.click();
  };

  if (!rows.length) return null;

  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" checked={showAccum} onChange={e => setShowAccum(e.target.checked)} className="w-3 h-3 rounded accent-[var(--semantic-success)]" />
              <span className="text-[8px] font-bold uppercase text-[var(--semantic-success)]">Accum</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" checked={showDrawdown} onChange={e => setShowDrawdown(e.target.checked)} className="w-3 h-3 rounded accent-[var(--semantic-warning)]" />
              <span className="text-[8px] font-bold uppercase text-[var(--semantic-warning)]">Draw</span>
            </label>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--surface-info)] transition-colors">
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-px bg-[var(--border-subtle)]">
        <div className="bg-[var(--surface-card)] p-2.5">
          <div className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Invested</div>
          <div className="text-xs font-bold font-['JetBrains_Mono'] text-[var(--text-heading)]">{formatINR(grandTotals.totalContributions)}</div>
        </div>
        <div className="bg-[var(--surface-card)] p-2.5">
          <div className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Returns</div>
          <div className={`text-xs font-bold font-['JetBrains_Mono'] ${grandTotals.totalReturn >= 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-danger)]'}`}>{formatSignedINR(grandTotals.totalReturn)}</div>
        </div>
        <div className="bg-[var(--surface-card)] p-2.5">
          <div className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Withdrawn</div>
          <div className="text-xs font-bold font-['JetBrains_Mono'] text-[var(--semantic-warning)]">{formatINR(grandTotals.totalWithdrawals)}</div>
        </div>
        <div className="bg-[var(--surface-card)] p-2.5">
          <div className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Final</div>
          <div className={`text-xs font-bold font-['JetBrains_Mono'] ${finalBalance > 0 ? 'text-[var(--text-heading)]' : 'text-[var(--semantic-danger)]'}`}>{formatINR(finalBalance)}</div>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="relative">
        {canScrollLeft && (<><div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--surface-card)] to-transparent z-10 pointer-events-none" /><button onClick={() => scrollBy(-1)} className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow flex items-center justify-center hover:bg-[var(--surface-card-alt)]"><ChevronLeft size={12} className="text-[var(--text-secondary)]" /></button></>)}
        {canScrollRight && (<><div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--surface-card)] to-transparent z-10 pointer-events-none" /><button onClick={() => scrollBy(1)} className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow flex items-center justify-center hover:bg-[var(--surface-card-alt)]"><ChevronRight size={12} className="text-[var(--text-secondary)]" /></button></>)}
        <div ref={scrollRef} className="overflow-x-auto" style={{ maxHeight: expanded ? '400px' : '140px' }}>
          <table className="w-full text-[10px] border-collapse" style={{ minWidth: '820px' }}>
            <thead className="sticky top-0 z-[5] bg-[var(--surface-card-alt)]">
              <tr>
                {['Age','Year','Phase','Opening','Inflows','Outflows','Returns','Closing','Δ'].map(h => (
                  <th key={h} className={`py-1.5 px-2.5 font-bold text-[var(--text-muted)] uppercase tracking-wider text-[7px] border-b border-[var(--border-default)] whitespace-nowrap ${h === 'Age' ? 'text-left sticky left-0 bg-[var(--surface-card-alt)] z-[6]' : h === 'Year' || h === 'Phase' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => {
                const isRet = row.age === retirementAge;
                const isDep = depletionAge && row.age === depletionAge;
                const isAccum = row.phase === 'accumulation';
                const inflows = row.contributions + row.lumpsum + row.partTimeIncome;
                const delta = row.closingBalance - row.openingBalance;
                const even = idx % 2 === 0;
                const bgClass = isRet ? 'bg-[var(--surface-info)]/20' : isDep ? 'bg-[var(--surface-danger)]/20' : even ? 'bg-[var(--surface-card)]' : 'bg-[var(--surface-card-alt)]/20';

                return (
                  <tr key={`${row.age}-${row.phase}`} className={`${bgClass} hover:bg-[var(--surface-card-alt)]/50 transition-colors ${isRet ? 'border-l-[2px] border-l-[var(--accent-primary)]' : ''} ${isDep ? 'border-l-[2px] border-l-[var(--semantic-danger)]' : ''}`}>
                    <td className={`py-1 px-2.5 font-bold font-['JetBrains_Mono'] text-[var(--text-heading)] whitespace-nowrap border-b border-[var(--border-subtle)]/30 sticky left-0 z-[1] ${bgClass}`}>
                      {row.age}
                      {isRet && <span className="ml-0.5 text-[6px] font-bold uppercase text-[var(--accent-primary)] bg-[var(--surface-info)] px-0.5 rounded">R</span>}
                      {isDep && <span className="ml-0.5 text-[6px] font-bold uppercase text-[var(--semantic-danger)] bg-[var(--surface-danger)] px-0.5 rounded">$0</span>}
                    </td>
                    <td className="py-1 px-2.5 text-[var(--text-muted)] font-['JetBrains_Mono'] whitespace-nowrap border-b border-[var(--border-subtle)]/30">Y{row.year}</td>
                    <td className="py-1 px-2.5 whitespace-nowrap border-b border-[var(--border-subtle)]/30">
                      <span className={`inline-flex items-center gap-0.5 text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm ${isAccum ? 'text-[var(--semantic-success)] bg-[var(--surface-success)]' : 'text-[var(--semantic-warning)] bg-[var(--surface-warning)]'}`}>
                        {isAccum ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                        {isAccum ? 'ACC' : 'DRW'}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[var(--text-secondary)] whitespace-nowrap border-b border-[var(--border-subtle)]/30">{formatINRShort(row.openingBalance)}</td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] whitespace-nowrap border-b border-[var(--border-subtle)]/30">{inflows > 0 ? <span className="text-[var(--semantic-success)]">{formatINRShort(inflows)}</span> : '—'}</td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] whitespace-nowrap border-b border-[var(--border-subtle)]/30">{row.withdrawals > 0 ? <span className="text-[var(--semantic-danger)]">{formatINRShort(row.withdrawals)}</span> : '—'}</td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] whitespace-nowrap border-b border-[var(--border-subtle)]/30">
                      <span className={row.investmentReturn >= 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-danger)]'}>{formatSignedINR(row.investmentReturn)}</span>
                    </td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] font-bold text-[var(--text-heading)] whitespace-nowrap border-b border-[var(--border-subtle)]/30">{formatINRShort(row.closingBalance)}</td>
                    <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] whitespace-nowrap border-b border-[var(--border-subtle)]/30">
                      <span className={delta >= 0 ? 'text-[var(--semantic-success)]' : 'text-[var(--semantic-danger)]'}>{formatSignedINR(delta)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expand/Collapse button */}
      <div className="border-t border-[var(--border-subtle)]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-[var(--accent-primary)] hover:bg-[var(--surface-info)]/30 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Expand Full Cashflow ({visibleRows.length} years)
            </>
          )}
        </button>
      </div>
    </div>
  );
}