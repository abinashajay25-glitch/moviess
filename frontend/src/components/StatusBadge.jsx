import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';

export default function StatusBadge({ status }) {
  const configs = {
    draft: { label: 'Draft', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Clock },
    uploaded: { label: 'Uploaded', bg: 'bg-blue-950/60 text-blue-300 border-blue-800/50', icon: Clock },
    processing: { label: 'Processing', bg: 'bg-purple-950/60 text-purple-300 border-purple-800/50 animate-pulse', icon: Loader2, spin: true },
    completed: { label: 'Dubbed & Ready', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50', icon: CheckCircle2 },
    failed: { label: 'Failed', bg: 'bg-red-950/60 text-red-300 border-red-800/50', icon: AlertCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-zinc-800 text-zinc-400 border-zinc-700', icon: XCircle },
  };

  const cfg = configs[status] || configs.draft;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
      <span>{cfg.label}</span>
    </span>
  );
}
