import React, { useState } from 'react';
import { AuthProvider } from './AuthContext';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { SimulationParams } from './types';
import { runMonteCarlo } from './utils/simulation';

const defaultParams: SimulationParams = {
  currentAge: 33,
  retirementAge: 60,
  lifeExpectancy: 85,
  currentSavings: 1000000,
  monthlySavings: 35000,
  sipStepUp: 5,
  expectedReturn: 12,
  returnStdDevPre: 15,
  postRetirementReturn: 7,
  returnStdDevPost: 8,
  monthlyExpenses: 75000,
  withdrawalInflation: 6,
  numSimulations: 10000,
  taxDragPct: 0.5,
  additionalLumpsum: 0,
  lumpsumYear: 5,
  partTimeIncome: 0,
  partTimeUntilAge: 70,
  clientName: ''
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [results, setResults] = useState<any>(null);
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = (newParams: SimulationParams) => {
    setParams(newParams);
    setIsRunning(true);
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const res = runMonteCarlo(newParams);
        setResults(res);
        setHasRunOnce(true);
      } catch (err) {
        console.error("Simulation error:", err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  return (
    <AuthProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--surface-page)] text-[var(--text-body)] font-['Inter']">
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          {isSidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <Sidebar 
            params={params} 
            onChange={setParams} 
            onRun={() => handleRunSimulation(params)} 
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isRunning={isRunning}
          />
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-page)] relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-heading) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <MainContent results={results} params={params} />
            
            <footer className="bg-[var(--surface-card)] border-t border-[var(--border-subtle)] px-6 py-4 text-[11px] text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-4 shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--text-secondary)] tracking-wide uppercase">Seed Investments</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="font-medium">AMFI-Registered MFD</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="font-['JetBrains_Mono']">ARN: 260388</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline font-medium">For illustrative purposes only. Not investment advice.</span>
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="font-medium">&copy; {new Date().getFullYear()} Seed Investments</span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
