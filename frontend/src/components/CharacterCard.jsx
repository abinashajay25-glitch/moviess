import React, { useState } from 'react';
import { Play, Pause, Volume2, User, Sliders, Check } from 'lucide-react';
import { CineDubAPI } from '../api/client';

export default function CharacterCard({ 
  speaker, 
  availableVoices = [], 
  onUpdateSpeaker, 
  targetLanguage = 'ta' 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioElem, setAudioElem] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAudition = async () => {
    if (isPlaying && audioElem) {
      audioElem.pause();
      setIsPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const url = await CineDubAPI.previewVoice({
        text: `Hello, I am ${speaker.name}. This is my dubbed movie voice for CineDub AI.`,
        voice_id: speaker.voice_id || 'tamil-male-1',
        engine: speaker.engine || 'sarvam',
        language: targetLanguage,
        gender: speaker.gender || 'male',
        speed: speaker.speed || 1.0,
        pitch: speaker.pitch || 1.0
      });

      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      setAudioElem(audio);
      audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Voice audition failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-surface-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
            style={{ backgroundColor: speaker.color || '#8b5cf6' }}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={speaker.name || ''}
                onChange={(e) => onUpdateSpeaker({ ...speaker, name: e.target.value })}
                className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-brand-purple font-semibold text-slate-100 text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-400">{speaker.role || 'Character'} • {speaker.dialogue_count || 0} lines</p>
          </div>
        </div>

        {/* Gender Badge */}
        <select
          value={speaker.gender || 'male'}
          onChange={(e) => onUpdateSpeaker({ ...speaker, gender: e.target.value })}
          className="text-xs bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-brand-purple"
        >
          <option value="male">Male Voice</option>
          <option value="female">Female Voice</option>
        </select>
      </div>

      {/* Voice Selection Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Assigned AI Voice
        </label>
        <div className="flex items-center gap-2">
          <select
            value={speaker.voice_id || ''}
            onChange={(e) => {
              const selected = availableVoices.find(v => v.id === e.target.value);
              onUpdateSpeaker({ 
                ...speaker, 
                voice_id: e.target.value,
                voice_name: selected ? selected.name : e.target.value,
                engine: selected ? selected.engine : 'sarvam'
              });
            }}
            className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-purple"
          >
            {availableVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.badge || v.engine})
              </option>
            ))}
          </select>

          {/* Audition Button */}
          <button
            onClick={handleAudition}
            disabled={loading}
            className="shrink-0 p-2 rounded-xl bg-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white border border-brand-purple/40 transition-all flex items-center justify-center"
            title="Audition Character Voice"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Sliders: Speed & Pitch */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Speech Rate</span>
            <span>{speaker.speed || 1.0}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.05"
            value={speaker.speed || 1.0}
            onChange={(e) => onUpdateSpeaker({ ...speaker, speed: parseFloat(e.target.value) })}
            className="w-full h-1 bg-surface-border rounded-lg appearance-none accent-brand-purple cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Volume</span>
            <span>{Math.round((speaker.volume || 1.0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speaker.volume || 1.0}
            onChange={(e) => onUpdateSpeaker({ ...speaker, volume: parseFloat(e.target.value) })}
            className="w-full h-1 bg-surface-border rounded-lg appearance-none accent-brand-blue cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
