import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Film, 
  Activity, 
  Subtitles, 
  Mic2, 
  Settings, 
  Info,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, activeQueueCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_project', label: 'New Dubbing Project', icon: UploadCloud, highlight: true },
    { id: 'my_movies', label: 'My Movies', icon: Film },
    { 
      id: 'processing_queue', 
      label: 'Processing Queue', 
      icon: Activity, 
      badge: activeQueueCount > 0 ? activeQueueCount : null 
    },
    { id: 'subtitle_studio', label: 'Subtitle Studio', icon: Subtitles },
    { id: 'voice_studio', label: 'Voice & Casting', icon: Mic2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About CineDub AI', icon: Info },
  ];

  return (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col justify-between py-6 shrink-0 z-10">
      <div className="space-y-1 px-3">
        <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Studio Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-purple/20 to-brand-blue/10 text-white border border-brand-purple/30 shadow-lg shadow-brand-purple/10'
                  : item.highlight
                  ? 'text-brand-blue hover:bg-brand-blue/10 border border-brand-blue/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-purple' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-purple text-white animate-pulse">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-brand-purple" />
              )}
            </button>
          );
        })}
      </div>

      {/* Pipeline Engine Status */}
      <div className="px-4 mt-6">
        <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Pipeline Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Ready
            </span>
          </div>
          <div className="text-[11px] text-slate-400 leading-tight">
            NLLB-200 • Whisper Base • Sarvam & ElevenLabs Engine
          </div>
        </div>
      </div>
    </aside>
  );
}
