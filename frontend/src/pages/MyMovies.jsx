import React, { useState } from 'react';
import { 
  Film, 
  Download, 
  Trash2, 
  Play, 
  Clock, 
  Subtitles, 
  Layers, 
  Search,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MoviePlayer from '../components/MoviePlayer';
import { CineDubAPI } from '../api/client';

export default function MyMovies({ 
  projects = [], 
  onSelectProject, 
  onRefresh, 
  onNewProjectClick 
}) {
  const [search, setSearch] = useState('');
  const [previewMovie, setPreviewMovie] = useState(null);

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.target_language.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project and all dubbed files?")) return;
    try {
      await CineDubAPI.deleteProject(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-surface-border">
        <div>
          <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-brand-purple" />
            <span>My Movie Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, preview, and export completed full-length movie dubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-card border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            onClick={onNewProjectClick}
            className="px-4 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold transition-all shrink-0"
          >
            + New Movie
          </button>
        </div>
      </div>

      {/* Video Preview Modal / Drawer */}
      {previewMovie && (
        <div className="glass-panel-glow p-6 rounded-3xl border border-brand-purple/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{previewMovie.name}</h3>
              <p className="text-xs text-brand-purple font-medium uppercase">
                {previewMovie.target_language} Dubbed Output Player
              </p>
            </div>
            <button
              onClick={() => setPreviewMovie(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover text-slate-300"
            >
              Close Player
            </button>
          </div>

          <MoviePlayer 
            src={CineDubAPI.getMediaStreamUrl(previewMovie.id, previewMovie.status === 'completed' ? 'dubbed_video' : 'original_video')}
            showAudioTrackToggle={true}
          />
        </div>
      )}

      {/* Movie Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Movies Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {projects.length === 0 ? 'Start by uploading your first movie project!' : 'No movies matched your search query.'}
          </p>
          <button
            onClick={onNewProjectClick}
            className="px-5 py-2.5 rounded-xl bg-brand-purple text-white text-xs font-bold hover:bg-brand-purple-dark transition-all"
          >
            Create New Dub
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => {
            const isDone = proj.status === 'completed';
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="glass-card rounded-3xl p-5 border border-surface-border flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                {/* Movie Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={proj.status} />
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-purple transition-colors line-clamp-1">
                    {proj.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-300 uppercase">
                      {proj.source_language}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="px-2 py-0.5 rounded bg-brand-purple/20 border border-brand-purple/40 text-brand-purple font-bold uppercase">
                      {proj.target_language}
                    </span>
                  </div>
                </div>

                {/* Movie Metadata */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-400 py-1 border-y border-surface-border">
                  <div>
                    <span className="text-[10px] block uppercase text-slate-500 font-semibold">Duration</span>
                    <span className="text-slate-200 font-mono font-medium">
                      {proj.duration ? `${Math.round(proj.duration/60)} min` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block uppercase text-slate-500 font-semibold">Resolution</span>
                    <span className="text-slate-200 font-mono font-medium">
                      {proj.resolution || '1080p'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setPreviewMovie(proj)}
                    className="flex-1 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  {isDone ? (
                    <a
                      href={CineDubAPI.getDownloadUrl(proj.id)}
                      download
                      className="flex-1 py-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-brand-purple/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export MP4</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="flex-1 py-2 rounded-xl bg-brand-blue/20 border border-brand-blue/40 text-brand-blue text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <span>Open Queue</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
