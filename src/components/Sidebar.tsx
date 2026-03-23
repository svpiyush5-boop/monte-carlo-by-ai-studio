import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Save, Loader2, Check, User, Wallet, BarChart3, Target } from 'lucide-react';
import { SimulationParams } from '../types';
import { useAuth } from '../AuthContext';

interface SidebarProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onRun: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isRunning?: boolean;
  results?: any;
  onLiveRun?: (params: SimulationParams) => void;
  hasRunOnce?: boolean;
}

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${(val).toLocaleString('en-IN')}`;
};

const formatINRFull = (val: number) => {
  return `₹${val.toLocaleString('en-IN')}`;
};

const steps = [
  { num: 1, label: 'Profile', icon: User },
  { num: 2, label: 'Investments', icon: Wallet },
  { num: 3, label: 'Risk & Returns', icon: BarChart3 },
  { num: 4, label: 'Goals', icon: Target },
];

export default function Sidebar({ params, onChange, onRun, isOpen, setIsOpen, isRunning = false, results, onLiveRun, hasRunOnce = false }: SidebarProps) {
  const { user, saveScenario, scenarios } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const liveRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = (key: keyof SimulationParams, value: any) => {
    const newParams = { ...params, [key]: value };
    onChange(newParams);

    // Trigger live run on param change (debounced)
    if (hasRunOnce && onLiveRun) {
      if (liveRunTimer.current) clearTimeout(liveRunTimer.current);
      liveRunTimer.current = setTimeout(() => {
        onLiveRun(newParams);
      }, 400);
    }
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

  const successRate = results?.successRate;
  const successColor = successRate >= 80 ? 'var(--semantic-success)' : successRate >= 60 ? 'var(--semantic-warning)' : 'var(--semantic-danger)';

  const sipPresets = [25000, 35000, 50000, 75000, 100000];
  const expensePresets = [50000, 75000, 100000, 125000, 150000];

  return (
    <aside className={`bg-[var(--surface-card)] border-r border-[var(--border-subtle)] flex flex-col transition-all duration-300 absolute md:relative z-40 shrink-0 h-full shadow-[var(--shadow-lg)] ${isOpen ? 'w-[360px] translate-x-0' : 'w-[60px] -translate-x-full md:translate-x-0'}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {isOpen ? (
          <>
            {/* Header */}
            <div className="p-5 pb-4 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--surface-card-alt)] to-[var(--surface-card)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)] opacity-[0.04] blur-3xl rounded-full" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h1 className="font-['Outfit'] text-lg font-bold text-[var(--text-heading)] tracking-tight">Retirement Planner</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-success)] animate-pulse" />
                      Monte Carlo
                    </span>
                    {successRate !== undefined && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-xl font-black font-['JetBrains_Mono'] leading-none" style={{ color: successColor }}>
                          {successRate.toFixed(0)}%
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: successColor }}>
                          {successRate >= 80 ? 'Safe' : successRate >= 60 ? 'Risk' : 'Critical'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] transition-colors shrink-0" title="Collapse sidebar">
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <div className="flex items-center gap-1">
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <React.Fragment key={step.num}>
                      <button
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-[var(--surface-overlay)] group"
                        title={step.label}
                      >
                        <StepIcon size={14} className="text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors hidden lg:inline">
                          {step.label}
                        </span>
                      </button>
                      {idx < steps.length - 1 && (
                        <div className="flex-1 h-[2px] bg-[var(--border-subtle)] rounded-full min-w-[8px]" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Steps Content */}
            <div className="p-4 space-y-1">

              {/* ── STEP 1: PROFILE ── */}
              <div className="rounded-xl p-4 border-l-2 border-[var(--accent-primary)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px] font-bold font-['JetBrains_Mono']">1</div>
                  <span className="text-[13px] font-bold text-[var(--text-heading)] font-['Outfit']">Profile</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Client Name</label>
                    <input
                      type="text"
                      className="input-field w-full font-medium text-[13px] h-10"
                      placeholder="e.g. Piyush Sharma"
                      value={params.clientName}
                      onChange={(e) => updateParam('clientName', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Age</label>
                      <input
                        type="number"
                        className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-bold text-[14px] h-10"
                        value={params.currentAge}
                        onChange={e => updateParam('currentAge', +e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Retire</label>
                      <input
                        type="number"
                        className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-bold text-[14px] h-10"
                        value={params.retirementAge}
                        onChange={e => updateParam('retirementAge', +e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Until</label>
                      <input
                        type="number"
                        className="input-field w-full px-2 text-center font-['JetBrains_Mono'] font-bold text-[14px] h-10"
                        value={params.lifeExpectancy}
                        onChange={e => updateParam('lifeExpectancy', +e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <span className="font-['JetBrains_Mono']">{params.retirementAge - params.currentAge}yr</span>
                    <span>to retirement</span>
                    <span>•</span>
                    <span className="font-['JetBrains_Mono']">{params.lifeExpectancy - params.retirementAge}yr</span>
                    <span>in retirement</span>
                  </div>
                </div>
              </div>

              {/* ── STEP 2: INVESTMENTS ── */}
              <div className="rounded-xl p-4 border-l-2 border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center text-[10px] font-bold font-['JetBrains_Mono']">2</div>
                  <span className="text-[13px] font-bold text-[var(--text-heading)] font-['Outfit']">Investments</span>
                </div>
                <div className="space-y-4">
                  {/* Current Corpus */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>Current Corpus</span>
                      <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">{formatINR(params.currentSavings)}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium text-[13px]">₹</span>
                      <input
                        type="text"
                        className="input-field w-full pl-7 font-['JetBrains_Mono'] font-bold text-[13px] h-10"
                        value={activeField === 'corpus' ? params.currentSavings : params.currentSavings.toLocaleString('en-IN')}
                        onFocus={() => setActiveField('corpus')}
                        onBlur={() => setActiveField(null)}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          updateParam('currentSavings', +raw);
                        }}
                      />
                    </div>
                  </div>

                  {/* Monthly SIP */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>Monthly SIP</span>
                      <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">{formatINR(params.monthlySavings * 12)}/yr</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium text-[13px]">₹</span>
                      <input
                        type="text"
                        className="input-field w-full pl-7 font-['JetBrains_Mono'] font-bold text-[13px] h-10"
                        value={activeField === 'sip' ? params.monthlySavings : params.monthlySavings.toLocaleString('en-IN')}
                        onFocus={() => setActiveField('sip')}
                        onBlur={() => setActiveField(null)}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          updateParam('monthlySavings', +raw);
                        }}
                      />
                    </div>
                    {/* Preset buttons */}
                    <div className="flex gap-1.5 mt-2">
                      {sipPresets.map(preset => (
                        <button
                          key={preset}
                          onClick={() => updateParam('monthlySavings', preset)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            params.monthlySavings === preset
                              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                              : 'bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-card-alt)]'
                          }`}
                        >
                          {preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}K`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SIP Step-Up */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Annual Step-Up</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0" max="20"
                        className="flex-1"
                        style={getSliderStyle(params.sipStepUp, 0, 20)}
                        value={params.sipStepUp}
                        onChange={e => updateParam('sipStepUp', +e.target.value)}
                      />
                      <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">
                        {params.sipStepUp}%
                      </span>
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-1">
                      SIP grows to ₹{formatINR(params.monthlySavings * Math.pow(1 + params.sipStepUp / 100, 5))}/mo in 5yr
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STEP 3: RISK & RETURNS ── */}
              <div className="rounded-xl p-4 border-l-2 border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center text-[10px] font-bold font-['JetBrains_Mono']">3</div>
                  <span className="text-[13px] font-bold text-[var(--text-heading)] font-['Outfit']">Risk & Returns</span>
                </div>
                <div className="space-y-4">
                  {/* Profile Selector */}
                  <div className="flex bg-[var(--surface-card-alt)] p-1 rounded-lg border border-[var(--border-subtle)]">
                    {[
                      { label: 'Conservative', ret: 9, std: 8, postRet: 6, postStd: 5 },
                      { label: 'Balanced', ret: 12, std: 15, postRet: 7, postStd: 8 },
                      { label: 'Aggressive', ret: 15, std: 22, postRet: 8, postStd: 12 },
                    ].map(profile => (
                      <button
                        key={profile.label}
                        className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-md transition-all ${
                          params.expectedReturn === profile.ret
                            ? 'bg-[var(--surface-card)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-subtle)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
                        }`}
                        onClick={() => onChange({
                          ...params,
                          expectedReturn: profile.ret,
                          returnStdDevPre: profile.std,
                          postRetirementReturn: profile.postRet,
                          returnStdDevPost: profile.postStd,
                        })}
                      >
                        {profile.label.slice(0, 5)}
                      </button>
                    ))}
                  </div>

                  {/* Pre-Retire Return */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Pre-Retirement Return</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="20"
                        className="flex-1"
                        style={getSliderStyle(params.expectedReturn, 1, 20)}
                        value={params.expectedReturn}
                        onChange={e => updateParam('expectedReturn', +e.target.value)}
                      />
                      <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">
                        {params.expectedReturn}%
                      </span>
                    </div>
                  </div>

                  {/* Volatility */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Volatility (σ)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="3" max="28"
                        className="flex-1"
                        style={getSliderStyle(params.returnStdDevPre, 3, 28)}
                        value={params.returnStdDevPre}
                        onChange={e => updateParam('returnStdDevPre', +e.target.value)}
                      />
                      <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">
                        {params.returnStdDevPre}%
                      </span>
                    </div>
                  </div>

                  {/* Post-Retire Return */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Post-Retirement Return</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="15"
                        className="flex-1"
                        style={getSliderStyle(params.postRetirementReturn, 1, 15)}
                        value={params.postRetirementReturn}
                        onChange={e => updateParam('postRetirementReturn', +e.target.value)}
                      />
                      <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">
                        {params.postRetirementReturn}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STEP 4: GOALS ── */}
              <div className="rounded-xl p-4 border-l-2 border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center text-[10px] font-bold font-['JetBrains_Mono']">4</div>
                  <span className="text-[13px] font-bold text-[var(--text-heading)] font-['Outfit']">Goals</span>
                </div>
                <div className="space-y-4">
                  {/* Monthly Expenses */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>Monthly Need (today)</span>
                      <span className="text-[var(--accent-primary)] font-['JetBrains_Mono']">
                        {formatINR(params.monthlyExpenses * Math.pow(1 + params.withdrawalInflation / 100, Math.max(0, params.retirementAge - params.currentAge)))}/mo at retire
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium text-[13px]">₹</span>
                      <input
                        type="text"
                        className="input-field w-full pl-7 font-['JetBrains_Mono'] font-bold text-[13px] h-10"
                        value={activeField === 'expenses' ? params.monthlyExpenses : params.monthlyExpenses.toLocaleString('en-IN')}
                        onFocus={() => setActiveField('expenses')}
                        onBlur={() => setActiveField(null)}
                        onChange={e => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          updateParam('monthlyExpenses', +raw);
                        }}
                      />
                    </div>
                    {/* Preset buttons */}
                    <div className="flex gap-1.5 mt-2">
                      {expensePresets.map(preset => (
                        <button
                          key={preset}
                          onClick={() => updateParam('monthlyExpenses', preset)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            params.monthlyExpenses === preset
                              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                              : 'bg-[var(--surface-overlay)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-card-alt)]'
                          }`}
                        >
                          {preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}K`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inflation */}
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Inflation</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="2" max="12"
                        className="flex-1"
                        style={getSliderStyle(params.withdrawalInflation, 2, 12)}
                        value={params.withdrawalInflation}
                        onChange={e => updateParam('withdrawalInflation', +e.target.value)}
                      />
                      <span className="text-[13px] font-['JetBrains_Mono'] font-bold text-[var(--accent-primary)] bg-[var(--surface-info)] border border-[var(--border-subtle)] rounded-md px-2 py-1 min-w-[48px] text-center shadow-sm">
                        {params.withdrawalInflation}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* Collapsed sidebar */
          <div className="flex flex-col items-center py-6 gap-4">
            <button onClick={() => setIsOpen(true)} className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--surface-overlay)] hover:shadow-sm transition-all" title="Expand">
              <User size={18} />
            </button>
            <button onClick={onRun} disabled={isRunning} className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] shadow-md transition-all disabled:opacity-70" title="Run simulation">
              {isRunning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {isOpen && (
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] hover:border-[var(--accent-primary)] transition-all flex items-center justify-center gap-1.5"
            >
              <Save size={13} />
              {isSaving ? 'Saving...' : `Save (${scenarios.length}/3)`}
            </button>
          </div>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="w-full btn-primary h-11 text-[14px] font-bold tracking-wide flex items-center justify-center gap-2 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Calculating...
              </>
            ) : hasRunOnce ? (
              <>Recalculate Plan <ChevronRight size={16} /></>
            ) : (
              <>Chart My Future <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
