import React from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Headphones, 
  SkipBack, 
  SkipForward, 
  Radio
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useMusicPlayer, SharedTrack, DEVELOPER_DEFAULT_TRACKS } from './MusicPlayerContext';

export { DEVELOPER_DEFAULT_TRACKS };
export type { SharedTrack };

export const DashboardMusicPlayer: React.FC<{ variant?: 'full' | 'compact' }> = () => {
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    handleNextTrack,
    handlePrevTrack,
    setVolume,
    setIsMuted,
    seekTo,
    formatTime
  } = useMusicPlayer();

  return (
    <div className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg text-white relative overflow-hidden transition-all my-2">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[70px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2">
        {/* Compact Single Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
              <Headphones size={15} />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white truncate">
                Preparation Mood Music
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold shrink-0">
                • Track #{currentTrackIndex + 1}/10
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              <Radio size={11} className={cn("text-emerald-400", isPlaying && "animate-pulse")} />
              <span>Auto-Flow</span>
            </div>

            {/* Compact Volume */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
              <button 
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-12 sm:w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Streamlined Controls Row */}
        <div className="flex items-center justify-between gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-inner">
          {/* Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrevTrack}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-700"
              title="Previous Track 🔙"
            >
              <SkipBack size={13} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer text-slate-950 font-black shadow-md",
                isPlaying 
                  ? "bg-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-500/30 scale-105" 
                  : "bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95"
              )}
              title={isPlaying ? "Pause Music" : "Play Music"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleNextTrack(isPlaying)}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-700"
              title="Next Track ⏭️"
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Current Track Name & Genre */}
          <div className="min-w-0 flex-1 px-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white truncate">
                {currentTrack.title}
              </p>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-1.5" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-2" />
                </div>
              )}
            </div>
            <p className="text-[9.5px] text-slate-400 truncate flex items-center gap-1">
              <span className="text-emerald-400 font-medium">{currentTrack.genre}</span>
              <span>•</span>
              <span>{currentTrack.artist}</span>
            </p>
          </div>

          {/* Time Display */}
          <div className="text-right shrink-0 text-[10px] font-mono font-semibold text-emerald-400/90">
            {formatTime(currentTime)} / {formatTime(duration > 0 ? duration : currentTrack.duration)}
          </div>
        </div>

        {/* Micro-Progress Slider */}
        <div className="w-full px-0.5">
          <input
            type="range"
            min="0"
            max={duration > 0 ? duration : currentTrack.duration}
            step="0.5"
            value={currentTime}
            onChange={(e) => {
              seekTo(parseFloat(e.target.value));
            }}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-all block"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardMusicPlayer;
