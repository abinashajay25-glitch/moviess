import React, { useEffect, useState } from 'react';
import { 
  Play, 
  RotateCw, 
  XCircle, 
  Film, 
  Clock, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Download,
  Subtitles,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import StageProgressTracker from '../components/StageProgressTracker';
import { CineDubAPI } from '../api/client';

export default function ProcessingQueue({ 
  currentProject, 
  onSelectProject, 
  onNavigate 
}) {
  const [project, setProject] = useState(currentProject);
  const [pollInterval, setPollInterval] = useState(2500);

  useEffect(() => {
    if (!project?.id) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const data = await CineDubAPI.getProjectStatus(project.id);
        if (isMounted) {
          setProject(data);
          // If completed or failed, slow down poll interval
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            setPollInterval(10000);
          }
        }
      } catch (err) {
        console.error("Status polling error", err);
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, pollInterval);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [project?.id, pollInterval]);

  const handleCancel = async () => {
    if (!project?.id) return;
    try {
      await CineDubAPI.cancelProcessing(project.id);
      const data = await CineDubAPI.getProjectStatus(project.id);
      setProject(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetry = async () => {
    if (!project?.id) return;
    try {
      await CineDubAPI.retryProcessing(project.id);
      const data = await CineDubAPI.getProjectStatus(project.id);
      setProject(data);
      setPollInterval(2500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-500">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No Active Processing Job</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Select an existing project or start a new movie dub to track the live 9-stage pipeline.
        </p>
        <button
          onClick={() => onNavigate('new_project')}
          className="px-5 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-semibold hover:bg-brand-purple-dark transition-all"
        >
          Create New Movie Dub
        </button>
      </div>
    );
  }

  const isCompleted = project.status === 'completed';
  const isFailed = project.status === 'failed';
  const isProcessing = project.status === 'processing';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-surface-border">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-bold text-white">{project.name}</h2>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dubbing from <span className="uppercase text-slate-200 font-semibold">{project.source_language}</span> to <span className="uppercase text-brand-purple font-bold">{project.target_language}</span> • Duration: {project.duration ? `${Math.round(project.duration/60)} min` : '--'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isProcessing && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Job</span>
            </button>
          )}

          {(isFailed || project.status === 'cancelled') && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-purple/20"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry Pipeline</span>
            </button>
          )}

          {isCompleted && (
            <a
              href={CineDubAPI.getDownloadUrl(project.id)}
              download
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Download Dubbed Movie (MP4)</span>
            </a>
          )}
        </div>
      </div>

      {/* Stage Progress Tracker */}
      <div className="glass-panel p-6 rounded-3xl border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Live 9-Stage Processing Pipeline
          </h3>
          {project.estimated_time_remaining > 0 && isProcessing && (
            <span className="flex items-center gap-1.5 text-xs text-brand-blue font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Est. {Math.round(project.estimated_time_remaining / 60)} min remaining</span>
            </span>
          )}
        </div>

        <StageProgressTracker project={project} />
      </div>

      {/* Main Content Grid: Live Console + Project Metadata & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Audio Studio Terminal / Event Logs */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-purple" />
              <h3 className="text-sm font-semibold text-white">Live Audio Pipeline Console</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real-time Backend Stream</span>
          </div>

          <div className="bg-black/80 rounded-2xl p-4 font-mono text-xs border border-surface-border max-h-72 overflow-y-auto space-y-2">
            {project.logs && project.logs.length > 0 ? (
              project.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 ${
                    log.level === 'error' ? 'bg-red-950 text-red-400' :
                    log.level === 'warning' ? 'bg-amber-950 text-amber-400' :
                    log.level === 'success' ? 'bg-emerald-950 text-emerald-400' :
                    'bg-slate-800 text-brand-purple'
                  }`}>
                    {log.stage}
                  </span>
                  <span className="leading-relaxed">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic py-6 text-center">
                Awaiting pipeline initialization...
              </div>
            )}
          </div>
        </div>

        {/* Right Studio Actions & Next Steps */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Studios
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('subtitle_studio')}
                className="w-full p-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <Subtitles className="w-4 h-4 text-brand-purple" />
                  <div>
                    <span className="text-xs font-bold text-white block">Subtitle Studio</span>
                    <span className="text-[10px] text-slate-400">Review & edit translated dialogue</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('voice_studio')}
                className="w-full p-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-brand-blue" />
                  <div>
                    <span className="text-xs font-bold text-white block">Voice & Casting</span>
                    <span className="text-[10px] text-slate-400">Reassign character voices</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Subtitle Downloads */}
            <div className="pt-2 border-t border-surface-border space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Export Subtitles Separately
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={CineDubAPI.getSubtitleDownloadUrl(project.id, 'target')}
                  download
                  className="px-2.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-[11px] font-medium text-slate-300 text-center block transition-all"
                >
                  Target SRT
                </a>
                <a
                  href={CineDubAPI.getSubtitleDownloadUrl(project.id, 'bilingual')}
                  download
                  className="px-2.5 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-[11px] font-medium text-slate-300 text-center block transition-all"
                >
                  Dual Bilingual SRT
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
