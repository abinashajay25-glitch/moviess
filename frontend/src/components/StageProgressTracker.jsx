import React from 'react';
import { 
  Upload, 
  Volume2, 
  MessageSquare, 
  Users, 
  Languages, 
  Mic, 
  Clock, 
  Subtitles, 
  Film,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const PIPELINE_STAGES = [
  { index: 1, id: 'upload', title: 'Video Upload', icon: Upload, desc: 'Validate & store movie' },
  { index: 2, id: 'audio_extract', title: 'Audio Extraction', icon: Volume2, desc: 'FFmpeg 16kHz PCM stream' },
  { index: 3, id: 'speech_recognition', title: 'Speech Recognition', icon: MessageSquare, desc: 'Whisper sentence detection' },
  { index: 4, id: 'speaker_diarization', title: 'Speaker Diarization', icon: Users, desc: 'Detect & cast characters' },
  { index: 5, id: 'translation', title: 'Neural Translation', icon: Languages, desc: 'NLLB-200 multilingual model' },
  { index: 6, id: 'voice_generation', title: 'AI Voice Generation', icon: Mic, desc: 'Synthesize unique voices' },
  { index: 7, id: 'synchronization', title: 'Audio Synchronization', icon: Clock, desc: 'Align timestamps & speed' },
  { index: 8, id: 'subtitles', title: 'Subtitle Generation', icon: Subtitles, desc: 'Target, original & dual SRT' },
  { index: 9, id: 'rendering', title: 'Final Movie Render', icon: Film, desc: 'Mute original & export MP4' },
];

export default function StageProgressTracker({ project }) {
  if (!project) return null;

  const currentStageIdx = project.current_stage_index || (project.status === 'completed' ? 9 : 1);
  const isFailed = project.status === 'failed';
  const isCompleted = project.status === 'completed';

  return (
    <div className="w-full space-y-4">
      {/* Overall Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Current Stage: <span className="text-brand-purple">{project.current_stage || 'Ready to start'}</span>
          </span>
          <span className="font-mono font-bold text-sm text-brand-blue">
            {Math.round(project.progress)}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-surface-card rounded-full overflow-hidden border border-surface-border">
          <div 
            className="h-full bg-gradient-to-r from-brand-purple via-brand-neon to-brand-blue transition-all duration-500 rounded-full shadow-lg shadow-brand-purple/40"
            style={{ width: `${Math.max(project.progress, 2)}%` }}
          />
        </div>
      </div>

      {/* 9-Stage Grid Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2 pt-2">
        {PIPELINE_STAGES.map((st) => {
          const Icon = st.icon;
          const isDone = isCompleted || st.index < currentStageIdx;
          const isCurrent = !isCompleted && !isFailed && st.index === currentStageIdx;
          const isError = isFailed && st.index === currentStageIdx;
          const isPending = !isDone && !isCurrent && !isError;

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-brand-purple/20 border-brand-purple text-white shadow-lg shadow-brand-purple/20 ring-1 ring-brand-purple animate-pulse'
                  : isError
                  ? 'bg-red-950/30 border-red-500/50 text-red-400'
                  : 'bg-surface-card/40 border-surface-border text-slate-500'
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 relative">
                {isDone ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-7 h-7 rounded-full bg-brand-purple/30 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-brand-purple animate-spin" />
                  </div>
                ) : isError ? (
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                ) : (
                  <Icon className="w-4 h-4 text-slate-500" />
                )}
              </div>

              <span className="text-[10px] font-bold tracking-tight uppercase line-clamp-1">
                {st.title}
              </span>
              <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                {st.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
