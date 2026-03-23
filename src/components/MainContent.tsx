import React from 'react';
import { SimulationParams } from '../types';
import VerdictBar from './VerdictBar';
import DiagnosisCard from './DiagnosisCard';
import InsightCard from './InsightCard';
import Charts from './Charts';
import NarrativeCard from './NarrativeCard';
import WhatIfStrip from './WhatIfStrip';

interface MainContentProps {
  results: any;
  params: SimulationParams;
}

export default function MainContent({ results, params }: MainContentProps) {
  if (!results) {
    return (
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-primary)]">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] mb-2">Chart Your Financial Future</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Enter your details in the sidebar and click "Chart My Future" to run a Monte Carlo simulation and see your retirement projection.
          </p>
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs">
            <div className="w-2 h-2 rounded-full bg-[var(--semantic-success)] animate-pulse" />
            <span>10,000 simulations • AI-powered analysis</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--surface-page)] custom-scrollbar relative">
      {/* SECTION 1: MORPHING VERDICT BAR */}
      <VerdictBar results={results} params={params} />
      
      <div className="px-4 md:px-8 py-4 pb-12 space-y-8 max-w-7xl mx-auto relative z-10">
        {/* SECTION 2: DIAGNOSIS */}
        <DiagnosisCard results={results} params={params} />
        
        {/* SECTION 3: WEALTH JOURNEY (CHART) */}
        <Charts results={results} params={params} />
        
        {/* SECTION 4: FIX ENGINE */}
        <InsightCard results={results} params={params} />
        
        {/* SECTION 5: WEALTH STORY + WHAT-IF (Merged) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <NarrativeCard results={results} params={params} />
          </div>
          <div>
            <WhatIfStrip results={results} params={params} />
          </div>
        </div>
      </div>
    </main>
  );
}
