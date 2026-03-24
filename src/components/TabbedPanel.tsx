import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabbedPanelProps {
  tabs: Tab[];
  children: React.ReactNode[];
}

export default function TabbedPanel({ tabs, children }: TabbedPanelProps) {
  const [active, setActive] = useState(0); // Default to CASHFLOW (index 0)

  return (
    <div className="mx-4 md:mx-8 mt-6">
      {/* Tab row - segmented control style */}
      <div className="flex items-center bg-[var(--surface-card-alt)] rounded-xl p-1 border border-[var(--border-subtle)]">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = idx === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(idx)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[var(--surface-card)] text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {children[active]}
      </div>
    </div>
  );
}