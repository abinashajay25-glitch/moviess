import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Film, 
  Sparkles, 
  Check, 
  AlertCircle, 
  VolumeX, 
  Music, 
  Subtitles, 
  Users, 
  ArrowRight,
  FileVideo,
  Play
} from 'lucide-react';
import { CineDubAPI } from '../api/client';

export default function NewProject({ 
  languages = { source_languages: [], target_languages: [] }, 
  onProjectCreated,
  onNavigate 
}) {
  const [file, setFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [movieName, setMovieName] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ta');
  const [voicePreference, setVoicePreference] = useState('mixed'); // male, female, mixed
  const [ttsEngine, setTtsEngine] = useState('hybrid');
  const [removeOriginalAudio, setRemoveOriginalAudio] = useState(true);
  const [preserveBgm, setPreserveBgm] = useState(false);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [bilingualSubtitles, setBilingualSubtitles] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, size: 0, name: '' });

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setError(null);

    // Validate format
    const validExts = ['.mp4', '.mkv', '.mov', '.webm', '.avi'];
    const hasValidExt = validExts.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError(`Invalid format. Please upload MP4, MKV, MOV, or WebM video file.`);
      return;
    }

    setFile(selectedFile);
    if (!movieName) {
      const clean = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setMovieName(clean);
    }

    // Video preview & duration extraction
    const previewUrl = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(previewUrl);

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      setVideoMeta({
        duration: Math.round(tempVideo.duration),
        size: selectedFile.size,
        name: selectedFile.name
      });
    };
    tempVideo.src = previewUrl;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartDubbing = async () => {
    if (!file) {
      setError("Please select a movie file first.");
      return;
    }
    if (!movieName.trim()) {
      setError("Please enter a project title.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Create Project
      const project = await CineDubAPI.createProject({
        name: movieName,
        source_language: sourceLang,
        target_language: targetLang,
        voice_preference: voicePreference,
        tts_engine: ttsEngine,
        remove_original_audio: removeOriginalAudio,
        preserve_background_music: preserveBgm,
        generate_subtitles: generateSubtitles,
        bilingual_subtitles: bilingualSubtitles
      });

      // 2. Upload Movie file
      await CineDubAPI.uploadMovie(project.id, file, (pct) => {
        setUploadProgress(pct);
      });

      // 3. Start Processing Pipeline
      await CineDubAPI.startProcessing(project.id);

      // 4. Navigate to Processing Queue
      onProjectCreated(project);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Upload failed. Please check network connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (secs) => {
    if (!secs) return '0 min';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
          New Movie Dubbing Project
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload any complete movie, configure languages, character casting, and start automatic AI dubbing.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Drag & Drop Upload + Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              file
                ? 'border-brand-purple/50 bg-brand-purple/5'
                : 'border-surface-border hover:border-brand-purple/40 bg-surface-card/40 hover:bg-surface-card/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept=".mp4,.mkv,.mov,.webm,.avi"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple/20 to-brand-blue/20 flex items-center justify-center text-brand-purple mb-4 shadow-xl border border-brand-purple/30">
              <Upload className="w-8 h-8" />
            </div>

            <h4 className="text-base font-semibold text-white">
              {file ? file.name : 'Drag and drop movie file here'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports MP4, MKV, MOV, WebM. Support for full-length 1–3 hour movies (up to 10 GB).
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-slate-200 transition-all"
            >
              Browse Movie Files
            </button>
          </div>

          {/* Video Metadata & Live Preview Player */}
          {file && (
            <div className="glass-panel rounded-2xl p-4 border border-surface-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-brand-purple" />
                  <span>Movie Inspector</span>
                </span>
                <span className="text-emerald-400 font-medium">✓ Valid Movie Stream</span>
              </div>

              {videoPreviewUrl && (
                <div className="rounded-xl overflow-hidden aspect-video bg-black relative border border-surface-border">
                  <video 
                    src={videoPreviewUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">File Size</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{formatFileSize(videoMeta.size)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{formatDuration(videoMeta.duration)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Format</span>
                  <p className="text-xs font-bold text-brand-blue mt-0.5">{file.name.split('.').pop().toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Language & Dubbing Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-surface-border space-y-5">
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-purple" />
              <span>Studio Configuration</span>
            </h3>

            {/* Movie Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Movie / Project Title</label>
              <input
                type="text"
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                placeholder="e.g. Inception 2010"
                className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-purple"
              />
            </div>

            {/* Language Selection: Source & Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Original Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-purple"
                >
                  {(languages.source_languages || []).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.native})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Dub Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-surface-card border border-brand-purple/40 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-brand-purple ring-1 ring-brand-purple/20"
                >
                  {(languages.target_languages || []).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Voice & Casting Preferences */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Voice Casting Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mixed', label: 'Dynamic Cast', desc: 'Hero & Heroine' },
                  { id: 'male', label: 'All Male', desc: 'Action cast' },
                  { id: 'female', label: 'All Female', desc: 'Narrative' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setVoicePreference(mode.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      voicePreference === mode.id
                        ? 'bg-brand-purple/20 border-brand-purple text-white shadow-md'
                        : 'bg-surface-card/60 border-surface-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-xs font-bold">{mode.label}</span>
                    <span className="text-[10px] text-slate-400">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Requirement Toggles */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              {/* Original Audio Removal (Default ON) */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-card/40 border border-surface-border cursor-pointer hover:bg-surface-card/70 transition-all">
                <input
                  type="checkbox"
                  checked={removeOriginalAudio}
                  onChange={(e) => setRemoveOriginalAudio(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-purple focus:ring-brand-purple accent-brand-purple"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <VolumeX className="w-3.5 h-3.5 text-brand-purple" />
                    <span>Mute Original Movie Audio (Default)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Completely silences original dialogue & soundtrack so only the target AI speech is heard.
                  </p>
                </div>
              </label>

              {/* BGM Preservation Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-card/40 border border-surface-border cursor-pointer hover:bg-surface-card/70 transition-all">
                <input
                  type="checkbox"
                  checked={preserveBgm}
                  onChange={(e) => setPreserveBgm(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-purple focus:ring-brand-purple accent-brand-purple"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Preserve Background Music & SFX</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Separates dialogue using vocal isolation to preserve ambient movie score and sound effects.
                  </p>
                </div>
              </label>

              {/* Subtitle Generation Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-card/40 border border-surface-border cursor-pointer hover:bg-surface-card/70 transition-all">
                <input
                  type="checkbox"
                  checked={generateSubtitles}
                  onChange={(e) => setGenerateSubtitles(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-brand-purple focus:ring-brand-purple accent-brand-purple"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Subtitles (SRT & VTT)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Exports synchronized target language and dual bilingual subtitle files.
                  </p>
                </div>
              </label>
            </div>

            {/* Start Dubbing Button */}
            <div className="pt-3">
              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Uploading Movie File...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-purple transition-all duration-200 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartDubbing}
                  disabled={!file}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue hover:from-brand-purple-dark hover:to-brand-blue-dark disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm shadow-xl shadow-brand-purple/25 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Automatic Movie Dubbing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
