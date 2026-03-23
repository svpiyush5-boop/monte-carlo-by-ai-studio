import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, Settings, Save, Loader2 } from 'lucide-react';
import { SimulationParams } from '../types';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onRun: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isRunning?: boolean;
}

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export default function Sidebar({ params, onChange, onRun, isOpen, setIsOpen, isRunning = false }: SidebarProps) {
  const { user, saveScenario, scenarios } = useAuth();
  const [openSection, setOpenSection] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const updateParam = (key: keyof SimulationParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const getSliderStyle = (value: number, min: number, max: number) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return { background: `linear-gradient(to right, var(--accent-primary) ${percentage}%, var(--border-subtle) ${percentage}%)` };
  };

  const handleSave = async () => {
    if (!user) {
      alert("Please sign in to save scenarios.");
      return;
    }
    const name = prompt("Enter a name for this scenario:");
    if (name) {
      setIsSaving(true);
      await saveScenario(name, params);
      setIsSaving(false);
    }
  };

  const AccordionHeader = ({ num, title, section }: { num: React.ReactNode, title: string, section: number }) => (
    <button 
      className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-overlay)] transition-colors text-left group"
      onClick={() => setOpenSection(openSection === section ? 0 : section)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-['JetBrains_Mono'] transition-colors ${openSection === section ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_10px_rgba(13,148,136,0.3)]' : 'bg-[var(--surface-card-alt)] text-[var(--text-secondary)] group-hover:bg-[var(--surface-overlay)] group-hover:text-[var(--text-heading)]'}`}>
          {num}
        </div>
        <span className={`font-['Outfit'] text-[14.5px] font-bold tracking-tight transition-colors ${openSection === section ? 'text-[var(--accent-primary)]' : 'text-[var(--text-heading)]'}`}>
          {title}
        </span>
      </div>
      <div className={`transition-transform duration-300 ${openSection === section ? 'text-[var(--accent-primary)] rotate-180' : 'text-[var(--text-muted)]'}`}>
        <ChevronDown size={16} />
      </div>
    </button>
  );

  return (
    <aside className={`bg-[var(--surface-card)] border-r border-[var(--border-subtle)] flex flex-col transition-all duration-300 absolute md:relative z-40 shrink-0 h-full shadow-[var(--shadow-lg)] ${isOpen ? 'w-[340px] translate-x-0' : 'w-[60px] -translate-x-full md:translate-x-0'}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {isOpen ? (
          <>
            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-start bg-gradient-to-b from-[var(--surface-card-alt)] to-[var(--surface-card)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)] opacity-5 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h1 className="font-['Outfit'] text-xl font-bold text-[var(--text-heading)] mb-1 tracking-tight">Retirement Planner</h1>
                <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-success)] animate-pulse" />
                  10,000 Monte Carlo simulations
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-md border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] transition-colors shrink-0 relative z-10" title="Collapse sidebar">
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Section 1: About You */}
              <div className="card overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
                <AccordionHeader num="1" title="About You" section={1} />
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 1 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 space-y-5 border-t border-[var(--border-subtle)] mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Client Name</label>
                      <input 
                        type="text" 
                        className="input-field w-full font-medium" 
                        placeholder="e.g. Piyush Sharma" 
                        value={params.clientName}
                        onChange={(e) => updateParam('clientName', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Age</label>
                        <input type="number" className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-medium" value={params.currentAge} onChange={e => updateParam('currentAge', +e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Retire At</label>
                        <input type="number" className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-medium" value={params.retirementAge} onChange={e => updateParam('retirementAge', +e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Until</label>
                        <input type="number" className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-medium" value={params.lifeExpectancy} onChange={e => updateParam('lifeExpectancy', +e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Your Money Today */}
              <div className="card overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
                <AccordionHeader num="2" title="Your Money Today" section={2} />
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 2 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 space-y-5 border-t border-[var(--border-subtle)] mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2 flex justify-between">
                        <span>Current Invested Corpus</span>
                        <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">{formatINR(params.currentSavings)}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">₹</span>
                        <input type="number" className="input-field w-full pl-7 font-['JetBrains_Mono'] font-medium" value={params.currentSavings} onChange={e => updateParam('currentSavings', +e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2 flex justify-between">
                        <span>Monthly SIP</span>
                        <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">{formatINR(params.monthlySavings * 12)}/yr</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">₹</span>
                        <input type="number" className="input-field w-full pl-7 font-['JetBrains_Mono'] font-medium" value={params.monthlySavings} onChange={e => updateParam('monthlySavings', +e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Annual SIP Step-Up</label>
                      <div className="flex items-center gap-3 mt-2">
                        <input type="range" min="0" max="20" className="flex-1" style={getSliderStyle(params.sipStepUp, 0, 20)} value={params.sipStepUp} onChange={e => updateParam('sipStepUp', +e.target.value)} />
                        <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">{params.sipStepUp}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Returns & Risk */}
              <div className="card overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
                <AccordionHeader num="3" title="Returns & Risk" section={3} />
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 3 ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 space-y-5 border-t border-[var(--border-subtle)] mt-2">
                    <div className="flex bg-[var(--surface-card-alt)] p-1 rounded-lg border border-[var(--border-subtle)] shadow-inner">
                      <button className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${params.expectedReturn === 9 ? 'bg-[var(--surface-card)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'}`} onClick={() => onChange({ ...params, expectedReturn: 9, returnStdDevPre: 8, postRetirementReturn: 6, returnStdDevPost: 5 })}>Conservative</button>
                      <button className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${params.expectedReturn === 12 ? 'bg-[var(--surface-card)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'}`} onClick={() => onChange({ ...params, expectedReturn: 12, returnStdDevPre: 15, postRetirementReturn: 7, returnStdDevPost: 8 })}>Balanced</button>
                      <button className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${params.expectedReturn === 15 ? 'bg-[var(--surface-card)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'}`} onClick={() => onChange({ ...params, expectedReturn: 15, returnStdDevPre: 22, postRetirementReturn: 8, returnStdDevPost: 12 })}>Aggressive</button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Pre-Retire Return</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min="1" max="20" className="flex-1" style={getSliderStyle(params.expectedReturn, 1, 20)} value={params.expectedReturn} onChange={e => updateParam('expectedReturn', +e.target.value)} />
                        <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">{params.expectedReturn}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Pre-Retire Volatility (σ)</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min="3" max="28" className="flex-1" style={getSliderStyle(params.returnStdDevPre, 3, 28)} value={params.returnStdDevPre} onChange={e => updateParam('returnStdDevPre', +e.target.value)} />
                        <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">{params.returnStdDevPre}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Post-Retire Return</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min="1" max="15" className="flex-1" style={getSliderStyle(params.postRetirementReturn, 1, 15)} value={params.postRetirementReturn} onChange={e => updateParam('postRetirementReturn', +e.target.value)} />
                        <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">{params.postRetirementReturn}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Expenses & Goals */}
              <div className="card overflow-hidden border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
                <AccordionHeader num="4" title="Expenses & Goals" section={4} />
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 4 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 space-y-5 border-t border-[var(--border-subtle)] mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2 flex justify-between">
                        <span>Monthly Need (today's ₹)</span>
                        <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">{formatINR(params.monthlyExpenses * Math.pow(1 + params.withdrawalInflation / 100, Math.max(0, params.retirementAge - params.currentAge)))}/mo at ret.</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium">₹</span>
                        <input type="number" className="input-field w-full pl-7 font-['JetBrains_Mono'] font-medium" value={params.monthlyExpenses} onChange={e => updateParam('monthlyExpenses', +e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Assumed Inflation</label>
                      <div className="flex items-center gap-3 mt-2">
                        <input type="range" min="2" max="12" className="flex-1" style={getSliderStyle(params.withdrawalInflation, 2, 12)} value={params.withdrawalInflation} onChange={e => updateParam('withdrawalInflation', +e.target.value)} />
                        <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">{params.withdrawalInflation}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 gap-4">
            <button onClick={() => setIsOpen(true)} className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--surface-overlay)] hover:shadow-[var(--shadow-sm)] transition-all" title="Expand">
              <Settings size={18} />
            </button>
            <button onClick={onRun} disabled={isRunning} className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] shadow-[var(--shadow-md)] transition-all disabled:opacity-70" title="Run simulation">
              {isRunning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="p-5 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-10 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] hover:border-[var(--accent-primary)] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Scenario'}
            </button>
            <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest shrink-0 bg-[var(--surface-overlay)] px-2 py-1 rounded-md">{scenarios.length} / 3</div>
          </div>
          <button 
            onClick={onRun}
            disabled={isRunning}
            className="w-full btn-primary h-12 text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>Calculating...</>
            ) : (
              <>Chart My Future <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
