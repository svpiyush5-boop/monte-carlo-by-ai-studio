import React from 'react';
import { SimulationParams } from '../types';
import SummaryBar from './SummaryBar';
import Charts from './Charts';
import TabbedPanel from './TabbedPanel';
import CashflowTable from './CashflowTable';
import DiagnosisCard from './DiagnosisCard';
import InsightCard from './InsightCard';
import WhatIfStrip from './WhatIfStrip';
import NarrativeCard from './NarrativeCard';
import { ArrowRight, Target, Sparkles, Sliders } from 'lucide-react';

interface MainContentProps {
  results: any;
  params: SimulationParams;
}

export default function MainContent({ results, params }: MainContentProps) {
  if (!results) {
    return (
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-primary)]">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-heading)] mb-2">Chart Your Financial Future</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Enter your details in the sidebar and click "Chart My Future" to run a Monte Carlo simulation.
          </p>
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-success)] animate-pulse" />
            <span>10,000 simulations</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--surface-page)]">
      {/* PANEL 1: Summary Bar */}
      <SummaryBar results={results} params={params} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-8">
        {/* PANEL 2: Charts */}
        <Charts results={results} params={params} />

        {/* PANEL 3: Tabbed Analysis */}
        <div className="mt-8">
          <TabbedPanel
            tabs={[
              { id: 'cashflow', label: 'Cashflow', icon: ArrowRight },
              { id: 'diagnosis', label: 'Risk Diagnosis', icon: Target },
              { id: 'advisor', label: 'Advisor', icon: Sparkles },
              { id: 'whatif', label: 'What-If', icon: Sliders },
            ]}
          >
            <CashflowTable results={results} params={params} />
            <DiagnosisCard results={results} params={params} />
            <InsightCard results={results} params={params} />
            <WhatIfStrip results={results} params={params} />
          </TabbedPanel>
        </div>

        {/* Narrative — inline at bottom */}
        <NarrativeCard results={results} params={params} />
      </div>
    </main>
  );
}
