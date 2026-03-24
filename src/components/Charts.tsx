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

const COLORS = {
  median: '#0F172A',      // Darker for emphasis
  optimistic: '#059669',
  pessimistic: '#DC2626',
  retirement: '#6366F1',
  bandOuter: 'rgba(30, 41, 59, 0.04)',
  bandInner: 'rgba(30, 41, 59, 0.06)',
  grid: 'rgba(15,23,42,0.03)',
};

export default function Charts({ results, params }: { results: any; params: any }) {
  const { p10Path, p50Path, p80Path, p90Path, corpusHistogram } = results;
  const { currentAge, lifeExpectancy, retirementAge } = params;
  const [showDistribution, setShowDistribution] = useState(false);

  const retirementIndex = retirementAge - currentAge;

  const findDepletionAge = (path: any[]) => {
    for (const p of path) {
      if (p.balance <= 0) return p.age;
    }
    return null;
  };

  const p10DepletionAge = findDepletionAge(p10Path);
  const depletionIndex = p10DepletionAge ? p10DepletionAge - currentAge : null;

  // Increase max value for taller chart
  const maxValue = useMemo(() => {
    const p80max = Math.max(...p80Path.map((p: any) => p.balance));
    return Math.ceil(p80max / 10000000) * 10000000 * 1.2;
  }, [p80Path]);

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
        // Best Case (P90) - thin dashed
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
        // P80 reference
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
        // Expected (P50) - THICK, DARK - PRIMARY
        {
          label: 'Expected',
          data: p50,
          borderColor: COLORS.median,
          backgroundColor: 'transparent',
          borderWidth: 3.5,
          tension: 0.3,
          pointRadius: 0,
          fill: false,
          order: 2
        },
        // Worst Case (P10) - thin dashed
        {
          label: 'Worst Case',
          data: p10,
          borderColor: COLORS.pessimistic,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 0,
          borderDash: [3, 3],
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
      label: {
        display: true,
        content: 'Retirement',
        position: 'start',
        yAdjust: -30,
        backgroundColor: COLORS.retirement,
        color: 'white',
        font: { family: "'Outfit'", size: 10, weight: 'bold' },
        padding: { x: 8, y: 4 },
        borderRadius: 4
      }
    }
  };

  if (depletionIndex !== null && p10DepletionAge) {
    annotations.depletionMarker = {
      type: 'line',
      xMin: depletionIndex,
      xMax: depletionIndex,
      borderColor: COLORS.pessimistic,
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: true,
        content: `Depletion risk: ${p10DepletionAge}`,
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
    clip: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255,255,255,0.98)',
        titleColor: COLORS.median,
        bodyColor: '#64748B',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 8,
        titleFont: { family: "'Outfit'", size: 13, weight: 'bold' as const },
        bodyFont: { family: "'JetBrains Mono'", size: 11 },
        callbacks: {
          title: (items: any[]) => {
            const age = parseInt(items[0].label);
            const yearsPostRetirement = age - retirementAge;
            if (yearsPostRetirement > 0) return [`Age ${age}`, `${yearsPostRetirement} years post-retirement`];
            if (yearsPostRetirement < 0) return [`Age ${age}`, `${Math.abs(yearsPostRetirement)} years to retirement`];
            return [`Age ${age}`, 'Retirement Year'];
          },
          label: (ctx: any) => {
            if (['Outer Band', 'Inner Band', 'P80 Ref'].includes(ctx.dataset.label)) return null;
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
          maxTicksLimit: 10,
          font: { family: "'JetBrains Mono'", size: 10 },
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
          font: { family: "'JetBrains Mono'", size: 10 },
          color: '#94A3B8',
          maxTicksLimit: 6
        },
        border: { display: false },
        beginAtZero: true,
        max: maxValue
      }
    }
  };

  const histogramData = useMemo(() => {
    const bins = corpusHistogram.bins;
    const p10val = results.corpusAtRetirement.p10;
    const p80val = results.corpusAtRetirement.p80;

    const bgColors = bins.map((b: any) => {
      const mid = (b.min + b.max) / 2;
      if (mid < p10val) return 'rgba(220,38,38,0.6)';
      if (mid > p80val) return 'rgba(5,150,103,0.6)';
      return 'rgba(30,41,59,0.5)';
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
        bodyColor: '#64748B',
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
      y: { grid: { color: COLORS.grid }, ticks: { maxTicksLimit: 3, font: { size: 9 }, color: '#94A3B8' } }
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="font-['Outfit'] text-lg font-bold text-[var(--text-heading)]">Wealth Projection</h2>
        <div className="flex items-center gap-3 text-[9px]">
          <LegendItem color="#DC2626" dashed label="Worst (P10)" />
          <span className="mx-1 text-[var(--border-subtle)]">|</span>
          <LegendItem color="rgba(30,41,59,0.15)" solid label="Range" />
          <span className="mx-1 text-[var(--border-subtle)]">|</span>
          <LegendItem color="#0F172A" solid label="Expected" bold />
          <span className="mx-1 text-[var(--border-subtle)]">|</span>
          <LegendItem color="#059669" dashed label="Best (P90)" />
        </div>
      </div>

      {/* Main chart - 500px tall (40% increase) */}
      <div className="px-4 md:px-8" style={{ height: '500px' }}>
        <Line data={journeyData} options={journeyOptions as any} />
      </div>

      {/* COLLAPSIBLE: Risk Distribution */}
      <div className="px-4 md:px-8 mt-4">
        <button 
          onClick={() => setShowDistribution(!showDistribution)}
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors flex items-center gap-1"
        >
          <span>{showDistribution ? '▼' : '▶'}</span>
          See Risk Distribution
        </button>
        
        {showDistribution && (
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-heading)]">Corpus Distribution at Retirement</span>
              <div className="flex items-center gap-3 text-[9px]">
                <span className="text-[var(--semantic-danger)] font-bold">P10: {formatINR(results.corpusAtRetirement.p10)}</span>
                <span className="text-[var(--text-heading)] font-bold">P50: {formatINR(results.corpusAtRetirement.p50)}</span>
                <span className="text-[var(--semantic-success)] font-bold">P90: {formatINR(results.corpusAtRetirement.p90)}</span>
              </div>
            </div>
            <div style={{ height: '140px' }}>
              <Bar data={histogramData} options={histogramOptions as any} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, dashed, solid, label, bold }: { color: string; dashed?: boolean; solid?: boolean; label: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-5 h-[2px]"
        style={{
          backgroundColor: solid ? color : 'transparent',
          borderBottom: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      <span className={`text-[var(--text-muted)] ${bold ? 'font-bold text-[var(--text-heading)]' : ''}`}>{label}</span>
    </div>
  );
}