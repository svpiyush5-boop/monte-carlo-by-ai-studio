import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { medianCashflow } = results;
  const { currentAge, retirementAge, lifeExpectancy } = params;
  const rows: CashflowRow[] = medianCashflow || [];

  const { accumulationRows, drawdownRows, accumTotals, drawdownTotals, grandTotals } = useMemo(() => {
    const accum = rows.filter(r => r.phase === 'accumulation');
    const draw = rows.filter(r => r.phase === 'drawdown');
    const sumField = (arr: CashflowRow[], field: keyof CashflowRow) => arr.reduce((s, r) => s + (r[field] as number), 0);
    return {
      accumulationRows: accum, drawdownRows: draw,
      accumTotals: { contributions: sumField(accum, 'contributions'), lumpsum: sumField(accum, 'lumpsum'), investmentReturn: sumField(accum, 'investmentReturn') },
      drawdownTotals: { withdrawals: sumField(draw, 'withdrawals'), partTimeIncome: sumField(draw, 'partTimeIncome'), investmentReturn: sumField(draw, 'investmentReturn') },
      grandTotals: {
        totalContributions: sumField(accum, 'contributions') + sumField(accum, 'lumpsum'),
        totalWithdrawals: sumField(draw, 'withdrawals'),
        totalPartTime: sumField(draw, 'partTimeIncome'),
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
  }, [visibleRows]);

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
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-['Outfit'] text-sm font-bold text-[var(--text-heading)]">Median Cashflow</h2>
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
      <div className="grid grid-cols-4 gap-2 mb-3">
        <SumPill label="Invested" value={formatINR(grandTotals.totalContributions)} />
        <SumPill label="Returns" value={formatSignedINR(grandTotals.totalReturn)} color={grandTotals.totalReturn >= 0 ? 'var(--semantic-success)' : 'var(--semantic-danger)'} />
        <SumPill label="Withdrawn" value={formatINR(grandTotals.totalWithdrawals)} color="var(--semantic-warning)" />
        <SumPill label="Final" value={formatINR(finalBalance)} color={finalBalance > 0 ? undefined : 'var(--semantic-danger)'} />
      </div>

      {/* Scrollable table */}
      <div className="relative">
        {canScrollLeft && (<><div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[var(--surface-card)] to-transparent z-10 pointer-events-none" /><button onClick={() => scrollBy(-1)} className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow flex items-center justify-center hover:bg-[var(--surface-card-alt)]"><ChevronLeft size={12} className="text-[var(--text-secondary)]" /></button></>)}
        {canScrollRight && (<><div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[var(--surface-card)] to-transparent z-10 pointer-events-none" /><button onClick={() => scrollBy(1)} className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow flex items-center justify-center hover:bg-[var(--surface-card-alt)]"><ChevronRight size={12} className="text-[var(--text-secondary)]" /></button></>)}
        <div ref={scrollRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '440px' }}>
          <table className="w-full text-[10px] border-collapse" style={{ minWidth: '820px' }}>
            <thead className="sticky top-0 z-[5]">
              <tr className="bg-[var(--surface-card-alt)]">
                {['Age','Year','Phase','Opening','Inflows','Outflows','Returns','Closing','Δ'].map(h => (
                  <th key={h} className={`py-1.5 px-2.5 font-bold text-[var(--text-muted)] uppercase tracking-wider text-[7px] border-b border-[var(--border-default)] whitespace-nowrap ${h === 'Age' ? 'text-left sticky left-0 bg-[var(--surface-card-alt)] z-[6]' : h === 'Year' || h === 'Phase' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => {
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

              {showAccum && accumulationRows.length > 0 && (
                <tr className="sticky bottom-[24px] z-[3] bg-[var(--surface-success)]/10 backdrop-blur-sm border-t border-[var(--semantic-success)]/15">
                  <td colSpan={3} className="py-1 px-2.5 text-[7px] font-bold uppercase tracking-wider text-[var(--semantic-success)] sticky left-0 bg-[var(--surface-success)]/10 backdrop-blur-sm z-[4]">Accumulation ({accumulationRows.length}y)</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] text-[var(--text-muted)]">{formatINRShort(accumulationRows[0]?.openingBalance || 0)}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold text-[var(--semantic-success)]">{formatINRShort(accumTotals.contributions + accumTotals.lumpsum)}</td>
                  <td className="py-1 px-2.5 text-right text-[var(--text-muted)] text-[9px]">—</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold" style={{ color: accumTotals.investmentReturn >= 0 ? 'var(--semantic-success)' : 'var(--semantic-danger)' }}>{formatSignedINR(accumTotals.investmentReturn)}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold text-[var(--text-heading)]">{formatINRShort(accumulationRows[accumulationRows.length - 1]?.closingBalance || 0)}</td>
                  <td />
                </tr>
              )}

              {showDrawdown && drawdownRows.length > 0 && (
                <tr className="sticky bottom-[24px] z-[3] bg-[var(--surface-warning)]/10 backdrop-blur-sm border-t border-[var(--semantic-warning)]/15">
                  <td colSpan={3} className="py-1 px-2.5 text-[7px] font-bold uppercase tracking-wider text-[var(--semantic-warning)] sticky left-0 bg-[var(--surface-warning)]/10 backdrop-blur-sm z-[4]">Drawdown ({drawdownRows.length}y)</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] text-[var(--text-muted)]">{formatINRShort(drawdownRows[0]?.openingBalance || 0)}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px]">{drawdownTotals.partTimeIncome > 0 ? formatINRShort(drawdownTotals.partTimeIncome) : '—'}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold text-[var(--semantic-danger)]">{formatINRShort(drawdownTotals.withdrawals)}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold" style={{ color: drawdownTotals.investmentReturn >= 0 ? 'var(--semantic-success)' : 'var(--semantic-danger)' }}>{formatSignedINR(drawdownTotals.investmentReturn)}</td>
                  <td className="py-1 px-2.5 text-right font-['JetBrains_Mono'] text-[9px] font-bold" style={{ color: (drawdownRows[drawdownRows.length - 1]?.closingBalance || 0) > 0 ? 'var(--text-heading)' : 'var(--semantic-danger)' }}>{formatINRShort(drawdownRows[drawdownRows.length - 1]?.closingBalance || 0)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SumPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[var(--surface-card-alt)]">
      <span className="text-[7px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <span className="text-[11px] font-bold font-['JetBrains_Mono']" style={{ color: color || 'var(--text-heading)' }}>{value}</span>
    </div>
  );
}
