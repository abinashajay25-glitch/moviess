import React, { useState, useEffect } from 'react';
import { 
  Mic2, 
  Users, 
  Save, 
  Check, 
  Sparkles, 
  Volume2, 
  Layers,
  Info
} from 'lucide-react';
import CharacterCard from '../components/CharacterCard';
import { CineDubAPI } from '../api/client';

export default function VoiceStudio({ project }) {
  const [speakers, setSpeakers] = useState({});
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!project?.id) return;
    const loadData = async () => {
      try {
        const spkData = await CineDubAPI.getSpeakers(project.id);
        const voiceData = await CineDubAPI.getVoices(project.target_language || 'ta');
        setSpeakers(spkData || {});
        setAvailableVoices(voiceData.voices || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [project?.id, project?.target_language]);

  const handleUpdateSpeaker = (updated) => {
    setSpeakers(prev => ({
      ...prev,
      [updated.id]: updated
    }));
  };

  const handleSave = async () => {
    if (!project?.id) return;
    setIsSaving(true);
    try {
      await CineDubAPI.updateSpeakers(project.id, speakers);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!project) {
    return (
      <div className="py-20 text-center space-y-3">
        <Users className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Select a Project First</h3>
        <p className="text-sm text-slate-400">Open a movie from Dashboard to configure character voice casting.</p>
      </div>
    );
  }

  const speakerList = Object.values(speakers);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-surface-border">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-brand-purple" />
            <span>Character & AI Voice Casting Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {project.name} • {speakerList.length} unique movie characters detected
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-purple/20"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Casting Saved!' : isSaving ? 'Saving...' : 'Save Voice Casting'}</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">
            Rule: Every character gets a unique, distinct voice.
          </p>
          <p className="text-slate-400 leading-relaxed">
            CineDub AI guarantees that no two characters sound the same. You can click the Audition button to preview any actor's voice, adjust pitch and speaking rate, or assign Sarvam / ElevenLabs voices.
          </p>
        </div>
      </div>

      {/* Character Cards Grid */}
      {speakerList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <p>No characters identified yet. Start the dubbing pipeline to auto-diarize speakers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {speakerList.map((spk) => (
            <CharacterCard
              key={spk.id}
              speaker={spk}
              availableVoices={availableVoices}
              onUpdateSpeaker={handleUpdateSpeaker}
              targetLanguage={project.target_language}
            />
          ))}
        </div>
      )}
    </div>
  );
}
