import React from 'react';
import { 
  Film, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  ExternalLink,
  Code2,
  HardDrive
} from 'lucide-react';

export default function About() {
  const models = [
    { name: 'faster-whisper / Whisper', role: 'Automatic Speech Recognition (ASR)', license: 'MIT License', commercial: 'Permitted' },
    { name: 'pyannote.audio', role: 'Speaker Diarization & Voice Clustering', license: 'MIT / Non-commercial gated', commercial: 'Requires license for commercial use' },
    { name: 'NLLB-200 (Meta AI)', role: 'Multilingual Neural Machine Translation', license: 'CC-BY-NC 4.0', commercial: 'Research / Personal dubbing' },
    { name: 'Edge-TTS / Piper TTS', role: 'Open-Source Neural Voice Generation', license: 'MIT / Apache 2.0', commercial: 'Permitted' },
    { name: 'Sarvam AI Voice API', role: 'High-Fidelity Indian Regional Voices', license: 'Commercial API', commercial: 'Commercial Ready' },
    { name: 'ElevenLabs Multilingual v2', role: 'Studio Expressive Voice Generation', license: 'Commercial API', commercial: 'Commercial Ready' },
    { name: 'FFmpeg Core', role: 'Audio/Video Demuxing & AAC Rendering', license: 'LGPL 2.1 / GPL 3.0', commercial: 'Permitted with dynamic linking' }
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-purple/20">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">About CineDub AI</h2>
            <p className="text-xs text-brand-purple font-semibold uppercase tracking-wider">
              "Every Movie. Every Language. One AI Studio."
            </p>
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span>Core Mission & Architecture</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          CineDub AI is an open-source, production-grade movie dubbing studio engineered to translate and vocalize full-length feature films (1–3 hours) across Indian and international languages. By uniting speech recognition, acoustic speaker diarization, neural translation, and multi-character text-to-speech, CineDub AI democratizes global cinema localization.
        </p>
      </div>

      {/* Hardware & Real Costs Disclosure */}
      <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-blue" />
          <span>Hardware & Computing Cost Transparency</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Processing a full-length 2-hour movie involves extracting 120 minutes of audio, inferencing hundreds of neural speech tokens, clustering dozens of speaker turns, and generating hundreds of synthesized audio clips.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="font-bold text-slate-200 block">Recommended Hardware</span>
            <p className="text-[11px] text-slate-400">
              NVIDIA RTX 3060 / 4070 or Apple Silicon M-Series. Minimum 16 GB RAM and 20 GB free scratch storage.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="font-bold text-slate-200 block">CPU Fallback</span>
            <p className="text-[11px] text-slate-400">
              Runs on any modern x86/x64 Intel or AMD processor using int8 quantization and asynchronous multi-threading.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <span className="font-bold text-slate-200 block">Hosting & Cloud Costs</span>
            <p className="text-[11px] text-slate-400">
              Self-hosting requires electricity and GPU compute. Cloud API engines (ElevenLabs/Sarvam) consume credits per audio character.
            </p>
          </div>
        </div>
      </div>

      {/* AI Models & Licensing Matrix */}
      <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AI Models & License Compliance</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-3">Model / Component</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">License</th>
                <th className="py-2.5 px-3">Commercial Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {models.map((m, idx) => (
                <tr key={idx} className="hover:bg-surface-hover/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-white">{m.name}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">{m.role}</td>
                  <td className="py-2.5 px-3 text-slate-300">{m.license}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.commercial.includes('Permitted') || m.commercial.includes('Ready') 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    }`}>
                      {m.commercial}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
