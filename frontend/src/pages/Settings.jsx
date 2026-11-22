import { 
  Settings as SettingsIcon, 
  Key,
  Cpu, 
  HardDrive
} from 'lucide-react';

export default function Settings({ systemInfo }) {
  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn pb-12">
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-purple" />
          <span>Studio Settings & Hardware</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review host hardware and configure provider credentials on the backend.
        </p>
      </div>

      {/* Hardware Inspector */}
      <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-purple" />
          <span>Host Hardware & Acceleration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">Compute Device</span>
            <span className="font-bold text-white text-sm">
              {systemInfo?.gpu_available ? systemInfo.gpu_name : 'CPU Multi-Threading'}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              {systemInfo?.gpu_available ? 'GPU acceleration available' : 'CPU processing mode'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">CPU Cores</span>
            <span className="font-bold text-white text-sm">{systemInfo?.cpu_count ?? '—'} Logical Cores</span>
            <span className="text-[10px] text-slate-400 block">Load: {systemInfo?.cpu_percent ?? '—'}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">Memory (RAM)</span>
            <span className="font-bold text-white text-sm">{systemInfo?.ram_used_gb ?? '—'} GB / {systemInfo?.ram_total_gb ?? '—'} GB</span>
            <span className="text-[10px] text-slate-400 block">{systemInfo?.ram_percent ?? '—'}% Utilized</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">Studio Storage</span>
            <span className="font-bold text-white text-sm">{systemInfo?.disk_free_gb ?? '—'} GB Free</span>
            <span className="text-[10px] text-slate-400 block">Total: {systemInfo?.disk_total_gb ?? '—'} GB</span>
          </div>
        </div>
      </div>

      <section className="glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-blue" />
            <span>AI Voice & Inference Credentials</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Provider keys are kept on the backend and are never embedded in the browser.
          </p>
        </div>
        <p className="text-xs text-slate-300">
          Set provider keys in <code>backend/.env</code> for local development or the project <code>.env</code> file for Docker Compose, then restart the backend. Leave keys unset to use the free Edge-TTS fallback.
        </p>
      </section>
    </div>
  );
}
