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
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Tab row */}
      <div className="flex items-center border-b border-[var(--border-subtle)]">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = idx === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(idx)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all relative ${
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-primary)] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {children[active]}
      </div>
    </div>
  );
}
