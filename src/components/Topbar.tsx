import React, { useState, useEffect } from 'react';
import { Moon, Sun, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface TopbarProps {
  toggleSidebar?: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const { user, signIn, logOut } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('seed-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('seed-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-[64px] bg-[var(--surface-card)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 md:px-8 shrink-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--accent-primary)] via-[#2dd4bf] to-[var(--accent-primary)] opacity-80" />
      
      <div className="flex items-center gap-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar}
            className="md:hidden w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] hover:shadow-sm transition-all"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#133c70] text-white flex items-center justify-center font-['Outfit'] font-bold text-lg shrink-0 shadow-[var(--shadow-md)] group-hover:shadow-[var(--shadow-lg)] transition-all group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-['Outfit'] text-[16px] font-bold text-[var(--text-heading)] leading-none tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">
              Seed Investments
            </span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest mt-1 hidden sm:inline-block font-bold uppercase">
              AMFI-Registered &middot; ARN: 260388
            </span>
          </div>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a className="text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wider hover:text-[var(--text-heading)] transition-colors cursor-pointer" title="Coming soon">Home</a>
        <a className="text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wider hover:text-[var(--text-heading)] transition-colors cursor-pointer" title="Coming soon">Services</a>
        <div className="relative">
          <a className="text-[13px] font-bold text-[var(--accent-primary)] uppercase tracking-wider cursor-pointer">Tools</a>
          <div className="absolute -bottom-[22px] left-0 w-full h-[3px] bg-[var(--accent-primary)] rounded-t-full shadow-[0_-2px_10px_rgba(13,148,136,0.5)]" />
        </div>
      </nav>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] hover:shadow-sm transition-all"
          title="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <button 
            onClick={logOut}
            className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:shadow-sm transition-all relative group"
            title="Sign out"
          >
            <UserIcon size={18} className="text-[var(--semantic-success)] group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--semantic-success)] rounded-full border-2 border-[var(--surface-card)]" />
          </button>
        ) : (
          <button 
            onClick={signIn}
            className="w-10 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card-alt)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-heading)] hover:shadow-sm transition-all group"
            title="Sign in with Google"
          >
            <UserIcon size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        )}

        <a 
          href="mailto:hello@seedinvestments.com" 
          className="btn-primary ml-2 hidden sm:flex items-center gap-2 h-10 px-5 text-[13px] font-bold tracking-wide shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all"
        >
          Book Clarity Session <span className="text-lg leading-none">&rarr;</span>
        </a>
      </div>
    </header>
  );
}
