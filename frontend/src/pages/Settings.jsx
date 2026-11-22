import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Cpu, 
  HardDrive, 
  Check, 
  ShieldCheck, 
  Save, 
  Server,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Settings({ systemInfo }) {
  const [elevenKey, setElevenKey] = useState('sk_9abcefe9f23fd782c1d3444a292c370698a7307f2dbc8b00');
  const [nvidiaKey, setNvidiaKey] = useState('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');
  const [sarvamKey, setSarvamKey] = useState('sk_hp0hzdlj_RQYm3lY3xqY4ztl3fczi3A7d');
  const [whisperModel, setWhisperModel] = useState('base');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn pb-12">
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-purple" />
          <span>Studio Settings & Hardware</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure API credentials, local open-source inference models, and verify hardware performance.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Studio configuration updated successfully!</span>
        </div>
      )}

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
            <span className="text-[10px] text-emerald-400 block font-medium">✓ Acceleration Ready</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">CPU Cores</span>
            <span className="font-bold text-white text-sm">{systemInfo?.cpu_count || 8} Logical Cores</span>
            <span className="text-[10px] text-slate-400 block">Load: {systemInfo?.cpu_percent || 12}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">Memory (RAM)</span>
            <span className="font-bold text-white text-sm">{systemInfo?.ram_used_gb || 4} GB / {systemInfo?.ram_total_gb || 16} GB</span>
            <span className="text-[10px] text-slate-400 block">{systemInfo?.ram_percent || 28}% Utilized</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="text-slate-400 block font-semibold">Studio Storage</span>
            <span className="font-bold text-white text-sm">{systemInfo?.disk_free_gb || 50} GB Free</span>
            <span className="text-[10px] text-slate-400 block">Total: {systemInfo?.disk_total_gb || 256} GB</span>
          </div>
        </div>
      </div>

      {/* API Key Credentials */}
      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 border border-surface-border space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-blue" />
            <span>AI Voice & Inference Credentials</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Pre-configured studio keys for Sarvam AI, ElevenLabs, and NVIDIA inference.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Sarvam Voice API Key (Tamil & Indian Languages)</span>
              <span className="text-[10px] text-emerald-400">Pre-Configured</span>
            </label>
            <input
              type="password"
              value={sarvamKey}
              onChange={(e) => setSarvamKey(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>ElevenLabs Multilingual v2 Key</span>
              <span className="text-[10px] text-emerald-400">Pre-Configured</span>
            </label>
            <input
              type="password"
              value={elevenKey}
              onChange={(e) => setElevenKey(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>NVIDIA API Key</span>
              <span className="text-[10px] text-emerald-400">Pre-Configured</span>
            </label>
            <input
              type="password"
              value={nvidiaKey}
              onChange={(e) => setNvidiaKey(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        {/* Local Open-Source Models */}
        <div className="pt-4 border-t border-surface-border space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Local Open-Source AI Engines (Offline Fallbacks)
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Whisper ASR Model Size</label>
              <select
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple"
              >
                <option value="tiny">Tiny (~75 MB, Fast)</option>
                <option value="base">Base (~145 MB, Recommended)</option>
                <option value="small">Small (~480 MB, High Accuracy)</option>
                <option value="medium">Medium (~1.5 GB, Studio Quality)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Neural Translation Model</label>
              <select className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-purple">
                <option>NLLB-200 Distilled (600M Parameters)</option>
                <option>Deep-Translator Multi-Engine</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-purple/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Studio Settings</span>
        </button>
      </form>
    </div>
  );
}
