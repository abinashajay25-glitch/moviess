import React from 'react';
import { Film, Sparkles, Cpu, Layers } from 'lucide-react';

export default function Navbar({ activeProject, onNewProjectClick, systemInfo }) {
  return (
    <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-wide gradient-text">CineDub AI</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              Studio Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Every Movie. Every Language. One AI Studio.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Hardware Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs text-slate-300">
          <Cpu className={`w-3.5 h-3.5 ${systemInfo?.gpu_available ? 'text-emerald-400 animate-pulse' : 'text-brand-blue'}`} />
          <span>{systemInfo?.gpu_available ? systemInfo.gpu_name : 'CPU Multi-Core Acceleration'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* Quick New Project Button */}
        <button
          onClick={onNewProjectClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:from-brand-purple-dark hover:to-brand-blue-dark text-white text-sm font-semibold shadow-lg shadow-brand-purple/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Movie Dub</span>
        </button>
      </div>
    </header>
  );
}
