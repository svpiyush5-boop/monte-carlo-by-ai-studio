import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

// Institutional-grade color palette
const COLORS = {
  median: '#1E293B',          // Deep charcoal
  optimistic: '#059669',     // Muted green
  pessimistic: '#DC2626',     // Controlled red
  retirement: '#6366F1',      // Indigo accent
  bandOuter: 'rgba(30, 41, 59, 0.05)',
  bandInner: 'rgba(30, 41, 59, 0.08)',
  grid: 'rgba(15,23,42,0.04)',
  text: '#64748B',
  depletion: 'rgba(220, 38, 38, 0.04)'
};

export default function Charts({ results, params }: { results: any, params: any }) {
  const { p10Path, p50Path, p80Path, p90Path, corpusHistogram } = results;
  const { currentAge, lifeExpectancy, retirementAge } = params;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const retirementIndex = retirementAge - currentAge;

  // Find depletion points for annotations
  const findDepletionAge = (path: any[]) => {
    for (const p of path) {
      if (p.balance <= 0) return p.age;
    }
    return null;
  };

  const p10DepletionAge = findDepletionAge(p10Path);
  const depletionIndex = p10DepletionAge ? p10DepletionAge - currentAge : null;

  // Calculate max value for better Y-axis scaling
  const maxValue = useMemo(() => {
    const p90max = Math.max(...p90Path.map((p: any) => p.balance));
    return Math.ceil(p90max / 10000000) * 10000000 * 1.1;
  }, [p90Path]);

  const journeyData = useMemo(() => {
    const labels = [];
    const p10 = [];
    const p50 = [];
    const p80 = [];
    const p90 = [];

    for (let a = currentAge; a <= lifeExpectancy; a++) {
      labels.push(a);
      p10.push(p10Path.find((p: any) => p.age === a)?.balance || 0);
      p50.push(p50Path.find((p: any) => p.age === a)?.balance || 0);
      p80.push(p80Path.find((p: any) => p.age === a)?.balance || 0);
      p90.push(p90Path.find((p: any) => p.age === a)?.balance || 0);
    }

    return {
      labels,
      datasets: [
        // Best Case (P90) - dashed
        {
          label: 'Best Case',
          data: p90,
          borderColor: COLORS.optimistic,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 0,
          borderDash: [4, 4],
          fill: false,
          order: 1
        },
        // Outer Band (P10-P90)
        {
          label: 'Outer Band',
          data: p90,
          borderColor: 'transparent',
          backgroundColor: COLORS.bandOuter,
          borderWidth: 0,
          tension: 0.3,
          pointRadius: 0,
          fill: '+1',
          order: 5
        },
        // P80 reference for inner band
        {
          label: 'P80 Ref',
          data: p80,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          borderWidth: 0,
          tension: 0.3,
          pointRadius: 0,
          fill: false,
          order: 6
        },
        // Inner Band (P20-P80)
        {
          label: 'Inner Band',
          data: p80,
          borderColor: 'transparent',
          backgroundColor: COLORS.bandInner,
          borderWidth: 0,
          tension: 0.3,
          pointRadius: 0,
          fill: '-1',
          order: 4
        },
        // Median (P50) - dominant
        {
          label: 'Expected',
          data: p50,
          borderColor: COLORS.median,
          backgroundColor: 'transparent',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 0,
          fill: false,
          order: 2
        },
        // Worst Case (P10) - emphasized
        {
          label: 'Worst Case',
          data: p10,
          borderColor: COLORS.pessimistic,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          borderDash: [2, 2],
          fill: false,
          order: 3
        }
      ]
    };
  }, [p10Path, p50Path, p80Path, p90Path, currentAge, lifeExpectancy]);

  const annotations: any = {
    retirementLine: {
      type: 'line',
      xMin: retirementIndex,
      xMax: retirementIndex,
      borderColor: COLORS.retirement,
      borderWidth: 2,
      borderDash: [6, 4],
    }
  };

  // Add depletion marker if P10 goes to zero
  if (depletionIndex !== null) {
    annotations.depletionMarker = {
      type: 'line',
      xMin: depletionIndex,
      xMax: depletionIndex,
      borderColor: COLORS.pessimistic,
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: true,
        content: 'Funds exhausted',
        position: 'start',
        yAdjust: -10,
        backgroundColor: 'rgba(220,38,38,0.9)',
        color: 'white',
        font: { family: "'Outfit'", size: 9, weight: 'bold' },
        padding: { x: 6, y: 3 },
        borderRadius: 3
      }
    };
  }

  const journeyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    onHover: (_: any, elements: any[]) => {
      setHoveredIndex(elements.length > 0 ? elements[0].index : null);
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255,255,255,0.98)',
        titleColor: COLORS.median,
        bodyColor: COLORS.text,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 6,
        titleFont: { family: "'Outfit'", size: 13, weight: 'bold' as const },
        bodyFont: { family: "'JetBrains Mono'", size: 11 },
        callbacks: {
          title: (items: any[]) => {
            const age = parseInt(items[0].label);
            const yearsPostRetirement = age - retirementAge;
            if (yearsPostRetirement > 0) {
              return [`Age ${age}`, `${yearsPostRetirement} years post-retirement`];
            } else if (yearsPostRetirement < 0) {
              return [`Age ${age}`, `${Math.abs(yearsPostRetirement)} years to retirement`];
            }
            return ['Age ${age}', 'Retirement Year'];
          },
          label: (ctx: any) => {
            if (ctx.dataset.label === 'Outer Band' || ctx.dataset.label === 'Inner Band' || ctx.dataset.label === 'P80 Ref') return null;
            return `  ${ctx.dataset.label}: ${formatINR(ctx.raw)}`;
          }
        }
      },
      annotation: { annotations }
    },
    scales: {
      x: {
        grid: { color: COLORS.grid, drawTicks: false },
        ticks: { 
          maxTicksLimit: 8,
          font: { family: "'JetBrains Mono'", size: 9 },
          color: '#94A3B8',
          callback: (v: any, i: number) => {
            const age = currentAge + i;
            return age % 5 === 0 || age === retirementAge ? age : '';
          }
        },
        border: { display: false }
      },
      y: {
        grid: { color: COLORS.grid, drawTicks: false },
        ticks: {
          callback: (v: any) => {
            if (v === 0) return '₹0';
            if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)}Cr`;
            if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
            return '';
          },
          font: { family: "'JetBrains Mono'", size: 9 },
          color: '#94A3B8',
          maxTicksLimit: 5
        },
        border: { display: false },
        beginAtZero: true,
        max: maxValue
      }
    }
  };

  // Histogram
  const histogramData = useMemo(() => {
    const bins = corpusHistogram.bins;
    const p10val = results.corpusAtRetirement.p10;
    const p80val = results.corpusAtRetirement.p80;

    const bgColors = bins.map((b: any) => {
      const mid = (b.min + b.max) / 2;
      if (mid < p10val) return 'rgba(220,38,38,0.5)';
      if (mid > p80val) return 'rgba(5,150,103,0.5)';
      return 'rgba(30,41,59,0.4)';
    });

    return {
      labels: bins.map((_: any, i: number) => i),
      datasets: [{
        data: bins.map((b: any) => b.count),
        backgroundColor: bgColors,
        borderWidth: 0,
        barPercentage: 1.0,
        categoryPercentage: 1.0
      }]
    };
  }, [corpusHistogram, results.corpusAtRetirement]);

  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        titleColor: COLORS.median,
        bodyColor: COLORS.text,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: { family: "'Outfit'", size: 12, weight: 'bold' as const },
        bodyFont: { family: "'JetBrains Mono'", size: 11 },
        callbacks: {
          title: (items: any[]) => {
            const b = corpusHistogram.bins[items[0].dataIndex];
            return `₹${(b.min / 10000000).toFixed(1)} – ${(b.max / 10000000).toFixed(1)} Cr`;
          },
          label: (items: any) => `  ${items.formattedValue} simulations`
        }
      }
    },
    scales: {
      x: { display: false },
      y: { grid: { color: COLORS.grid }, ticks: { maxTicksLimit: 4, font: { size: 9 }, color: '#94A3B8' } }
    }
  };

  return (
    <div className="space-y-8">
      {/* WEALTH JOURNEY - Institutional Grade */}
      <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]">
        <div className="p-5 md:p-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[var(--text-heading)]">Wealth Journey</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Portfolio projection across 10,000 Monte Carlo simulations
              </p>
            </div>
            {/* Retirement Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-info)] rounded-md border border-[var(--accent-primary)]/20">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
              <span className="text-xs font-bold text-[var(--accent-primary)]">Retirement (Age {retirementAge})</span>
            </div>
          </div>
        </div>

        {/* Premium Compact Legend */}
        <div className="px-5 md:px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card-alt)]/30">
          <div className="flex flex-wrap items-center gap-5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-[#DC2626]" style={{ borderStyle: 'dashed' }} />
              <span className="text-[var(--text-muted)]">Worst Case (P10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-[#1E293B] opacity-20" />
              <span className="text-[var(--text-muted)]">P20–P80 Range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-[#1E293B]" />
              <span className="font-bold text-[var(--text-heading)]">Expected (P50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-[#059669]" style={{ borderStyle: 'dashed' }} />
              <span className="text-[var(--text-muted)]">Best Case (P90)</span>
            </div>
            {p10DepletionAge && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span className="text-[#DC2626] font-bold">Funds exhausted: Age {p10DepletionAge}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[360px] p-5 md:p-6">
          <Line data={journeyData} options={journeyOptions as any} />
        </div>
      </div>

      {/* CORPUS DISTRIBUTION */}
      <div className="card overflow-hidden border-0 shadow-[var(--shadow-md)] bg-[var(--surface-card)]">
        <div className="p-5 md:p-6 border-b border-[var(--border-subtle)]">
          <h2 className="font-['Outfit'] text-xl font-bold text-[var(--text-heading)]">Corpus at Retirement</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Distribution at age {retirementAge}
          </p>
        </div>
        <div className="h-[240px] p-5 md:p-6">
          <Bar data={histogramData} options={histogramOptions as any} />
        </div>
        <div className="px-5 md:px-6 py-3 bg-[var(--surface-card-alt)]/50 border-t border-[var(--border-subtle)]">
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#DC2626]">Bottom 10%</div>
              <div className="text-sm font-bold text-[var(--text-heading)] mt-0.5">{formatINR(results.corpusAtRetirement.p10)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-heading)]">Median</div>
              <div className="text-sm font-bold text-[var(--text-heading)] mt-0.5">{formatINR(results.corpusAtRetirement.p50)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-heading)]">Top 20%</div>
              <div className="text-sm font-bold text-[var(--text-heading)] mt-0.5">{formatINR(results.corpusAtRetirement.p80)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#059669]">Top 10%</div>
              <div className="text-sm font-bold text-[var(--text-heading)] mt-0.5">{formatINR(results.corpusAtRetirement.p90)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
