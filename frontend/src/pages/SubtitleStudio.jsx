import React, { useState, useEffect } from 'react';
import { 
  Subtitles, 
  Search, 
  Save, 
  Download, 
  Play, 
  Pause, 
  Check, 
  Layers, 
  Clock, 
  User,
  Film
} from 'lucide-react';
import MoviePlayer from '../components/MoviePlayer';
import { CineDubAPI } from '../api/client';

export default function SubtitleStudio({ project }) {
  const [segments, setSegments] = useState([]);
  const [speakers, setSpeakers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegmentId, setActiveSegmentId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!project?.id) return;
    const fetchTranscripts = async () => {
      try {
        const transData = await CineDubAPI.getTranscript(project.id);
        const spkData = await CineDubAPI.getSpeakers(project.id);
        setSegments(transData.translations || transData.transcript || []);
        setSpeakers(spkData || {});
      } catch (err) {
        console.error("Failed to load transcripts", err);
      }
    };
    fetchTranscripts();
  }, [project?.id]);

  const handleTextChange = (id, newText) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, translated_text: newText } : s));
  };

  const handleSave = async () => {
    if (!project?.id) return;
    setIsSaving(true);
    try {
      await CineDubAPI.updateTranscript(project.id, segments);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSegments = segments.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.translated_text || '').toLowerCase().includes(q) ||
      (s.original_text || s.text || '').toLowerCase().includes(q)
    );
  });

  const videoStreamUrl = project ? CineDubAPI.getMediaStreamUrl(project.id, project.status === 'completed' ? 'dubbed_video' : 'original_video') : '';

  if (!project) {
    return (
      <div className="py-20 text-center space-y-3">
        <Subtitles className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Select a Project First</h3>
        <p className="text-sm text-slate-400">Open a movie from My Movies or Dashboard to edit subtitles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-surface-border">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-brand-purple" />
            <span>Subtitle & Dialogue Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {project.name} • {segments.length} dialogue sentences detected
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand-purple/20"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved Changes!' : isSaving ? 'Saving...' : 'Save Translations'}</span>
          </button>

          <a
            href={CineDubAPI.getSubtitleDownloadUrl(project.id, 'target')}
            download
            className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-medium flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export SRT</span>
          </a>
        </div>
      </div>

      {/* Studio Workspace: Player on Left, Synchronized Dialogue List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-4 border border-surface-border space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-brand-purple" />
              <span>Reference Player</span>
            </h3>

            <MoviePlayer 
              src={videoStreamUrl}
              subtitles={segments}
              onTimeUpdate={(t) => {
                const cur = segments.find(s => t >= s.start && t <= s.end);
                if (cur && cur.id !== activeSegmentId) {
                  setActiveSegmentId(cur.id);
                }
              }}
            />

            <div className="p-3 rounded-xl bg-surface-card/60 border border-surface-border text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300">Synchronized Playback:</span>
              <p className="text-[11px] leading-relaxed">
                As the movie plays, dialogues automatically highlight in real-time. You can edit any translated sentence directly and save it to the dubbing timeline.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Dialogue List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-surface-border space-y-4">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dialogue by original or translated text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-purple"
              />
            </div>

            {/* Dialogue Cards List */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-2">
              {filteredSegments.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  {segments.length === 0 ? 'No dialogue segments extracted yet.' : 'No dialogues matching search.'}
                </div>
              ) : (
                filteredSegments.map((seg) => {
                  const isActive = seg.id === activeSegmentId;
                  const spk = speakers[seg.speaker_id] || { name: seg.speaker_id, color: '#8b5cf6' };

                  return (
                    <div
                      key={seg.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-brand-purple/15 border-brand-purple ring-1 ring-brand-purple/30'
                          : 'bg-surface-card/50 border-surface-border hover:border-slate-600'
                      }`}
                    >
                      {/* Segment Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: spk.color || '#8b5cf6' }} 
                          />
                          <span className="text-xs font-bold text-slate-200">
                            {spk.name || seg.speaker_id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{seg.start?.toFixed(1)}s → {seg.end?.toFixed(1)}s</span>
                        </div>
                      </div>

                      {/* Original Speech */}
                      <div className="text-xs text-slate-400 mb-2 italic">
                        "{seg.original_text || seg.text}"
                      </div>

                      {/* Translated Speech Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase text-brand-purple">
                          Translated Dialogue ({project.target_language.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={seg.translated_text || ''}
                          onChange={(e) => handleTextChange(seg.id, e.target.value)}
                          className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand-purple resize-none"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
