import React from 'react';
import { 
  Film, 
  Sparkles, 
  Clock, 
  Layers, 
  Cpu, 
  HardDrive, 
  Play, 
  Download,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { CineDubAPI } from '../api/client';

export default function Dashboard({ 
  projects = [], 
  onSelectProject, 
  onNewProjectClick, 
  systemInfo,
  onNavigate 
}) {
  const completedProjects = projects.filter(p => p.status === 'completed');
  const activeProjects = projects.filter(p => p.status === 'processing');

  const totalMinutesDubbed = Math.round(
    completedProjects.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-glow p-8 md:p-10 border border-brand-purple/20 bg-gradient-to-r from-surface-card via-[#161828] to-surface">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/20 border border-brand-purple/30 text-xs font-semibold text-brand-purple">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Movie Dubbing Studio</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Every Movie. Every Language. <br />
            <span className="gradient-text">One AI Studio.</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Full-length movie dubbing powered by Whisper speech recognition, open-source speaker diarization, NLLB neural translation, and multi-character AI voice casting.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onNewProjectClick}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:from-brand-purple-dark hover:to-brand-blue-dark text-white font-semibold text-sm shadow-xl shadow-brand-purple/25 transition-all transform hover:scale-[1.02] flex items-center gap-2"
            >
              <Film className="w-4 h-4" />
              <span>Start New Dubbing Project</span>
            </button>
            <button
              onClick={() => onNavigate('my_movies')}
              className="px-5 py-3 rounded-xl glass-card text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center gap-2"
            >
              <span>Explore My Movies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-surface-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-purple/15 text-brand-purple flex items-center justify-center shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Movies</span>
            <h4 className="text-2xl font-bold text-white mt-0.5">{projects.length}</h4>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-surface-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Minutes Dubbed</span>
            <h4 className="text-2xl font-bold text-white mt-0.5">{totalMinutesDubbed} min</h4>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-surface-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Pipeline</span>
            <h4 className="text-2xl font-bold text-white mt-0.5">{activeProjects.length} Active</h4>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-surface-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Storage Available</span>
            <h4 className="text-2xl font-bold text-white mt-0.5">{systemInfo?.disk_free_gb || 50} GB</h4>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="glass-panel rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-bold text-white">Recent Movie Projects</h3>
            <p className="text-xs text-slate-400">Manage and track movie dubbing jobs</p>
          </div>
          <button 
            onClick={() => onNavigate('my_movies')}
            className="text-xs font-semibold text-brand-purple hover:underline"
          >
            View All ({projects.length})
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-500">
              <Film className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-400">No movies in studio yet.</p>
            <button
              onClick={onNewProjectClick}
              className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-semibold hover:bg-brand-purple-dark transition-all"
            >
              Upload First Movie
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Movie Project</th>
                  <th className="py-3 px-4">Languages</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {projects.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-brand-purple shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{p.name}</span>
                          <p className="text-xs font-normal text-slate-500">{p.original_filename || 'Video Upload'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-300 uppercase">
                        {p.source_language}
                      </span>
                      <span className="mx-1 text-slate-500">→</span>
                      <span className="px-2 py-0.5 rounded bg-brand-purple/20 border border-brand-purple/40 text-brand-purple uppercase font-bold">
                        {p.target_language}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {p.duration ? `${Math.round(p.duration / 60)} min` : '--'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{Math.round(p.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-card rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-purple rounded-full" 
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-medium text-slate-200 transition-all"
                      >
                        Open Studio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
