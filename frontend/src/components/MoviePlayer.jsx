import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw,
  FastForward,
  Subtitles,
  Layers
} from 'lucide-react';

export default function MoviePlayer({ 
  src, 
  subtitles = [], 
  onTimeUpdate, 
  poster,
  showAudioTrackToggle = false,
  onAudioTrackChange
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubs, setShowSubs] = useState(true);
  const [activeSubtitle, setActiveSubtitle] = useState('');
  const [audioTrack, setAudioTrack] = useState('dubbed'); // dubbed vs original

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    if (onTimeUpdate) onTimeUpdate(t);

    // Sync subtitles
    if (subtitles && subtitles.length > 0) {
      const current = subtitles.find(s => t >= s.start && t <= s.end);
      setActiveSubtitle(current ? (current.translated_text || current.original_text || current.text) : '');
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative group w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-surface-border">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="w-full h-full max-h-[520px] object-contain cursor-pointer aspect-video"
      />

      {/* Subtitle Overlay */}
      {showSubs && activeSubtitle && (
        <div className="absolute bottom-16 left-0 right-0 px-6 flex justify-center pointer-events-none transition-all">
          <div className="bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center max-w-[85%] shadow-2xl">
            <p className="text-white font-medium text-base sm:text-lg leading-relaxed tracking-wide drop-shadow-md">
              {activeSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Player Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Seek Bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-purple hover:h-2 transition-all"
        />

        <div className="flex items-center justify-between mt-2 text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button 
              onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 5; }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300"
              title="Back 5s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => {
                  const muted = !isMuted;
                  setIsMuted(muted);
                  if (videoRef.current) videoRef.current.muted = muted;
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Track Toggle (Dubbed vs Original) */}
            {showAudioTrackToggle && (
              <button
                onClick={() => {
                  const nextTrack = audioTrack === 'dubbed' ? 'original' : 'dubbed';
                  setAudioTrack(nextTrack);
                  if (onAudioTrackChange) onAudioTrackChange(nextTrack);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  audioTrack === 'dubbed' 
                    ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/40' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{audioTrack === 'dubbed' ? 'AI Dubbed Track' : 'Original Audio'}</span>
              </button>
            )}

            {/* Subtitle Toggle */}
            <button
              onClick={() => setShowSubs(!showSubs)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                showSubs ? 'bg-brand-purple/20 text-brand-purple border-brand-purple/40' : 'text-slate-400 border-transparent hover:bg-white/10'
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
