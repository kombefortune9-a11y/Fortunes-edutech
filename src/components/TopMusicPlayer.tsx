import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Headphones, 
  SkipBack, 
  SkipForward, 
  ChevronUp, 
  ChevronDown,
  Music,
  X,
  RotateCcw
} from 'lucide-react';
import { useMusicPlayer } from './MusicPlayerContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TopMusicPlayerProps {
  activeSection: string;
  onNavigateToDashboard?: () => void;
}

export function TopMusicPlayer({ activeSection, onNavigateToDashboard }: TopMusicPlayerProps) {
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
    formatTime,
    seekTo
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close expanded card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Music Player stays permanently anchored in top header navbar across all sections

  return (
    <div ref={containerRef} className="relative z-40 select-none shrink min-w-0">
      {/* Top Header Minimized Music Pill (Matches the circled screenshot component) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -6 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 xs:gap-1.5 bg-slate-900/95 hover:bg-slate-900 backdrop-blur-md border border-emerald-500/50 hover:border-emerald-400 rounded-full py-0.5 xs:py-1 px-1.5 xs:px-2 sm:px-2.5 shadow-sm text-white transition-all cursor-pointer group shrink min-w-0 max-w-[105px] xxs:max-w-[130px] xs:max-w-[170px] sm:max-w-[260px] md:max-w-[320px]"
        title="Background Music Player (Click to expand controls)"
      >
        {/* Animated Music Icon */}
        <div className={cn(
          "w-4 h-4 xs:w-5 xs:h-5 rounded-full flex items-center justify-center shrink-0 text-slate-950 font-black transition-transform group-hover:scale-105",
          isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-700 text-slate-300"
        )}>
          {isPlaying ? <Music size={9} /> : <Headphones size={9} />}
        </div>

        {/* Track Title & Background Status */}
        <div className="min-w-0 shrink truncate leading-tight">
          <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-white truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="hidden xs:block text-[6.5px] xs:text-[7.5px] text-emerald-400 font-semibold leading-tight truncate">
            {isPlaying ? 'Playing' : 'Paused'}
          </p>
        </div>

        {/* Quick Play/Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "w-4.5 h-4.5 xs:w-5 xs:h-5 rounded-full flex items-center justify-center transition-all cursor-pointer text-slate-950 font-black shrink-0 hover:scale-105 active:scale-95",
            isPlaying ? "bg-emerald-400 hover:bg-emerald-300" : "bg-emerald-500 hover:bg-emerald-400"
          )}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={8} /> : <Play size={8} className="ml-0.5" />}
        </button>

        {/* Quick Next Track Button - hidden on tiny mobile screens */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextTrack(isPlaying);
          }}
          className="hidden xxs:flex w-3.5 h-3.5 xs:w-4 xs:h-4 text-slate-400 hover:text-white items-center justify-center shrink-0 cursor-pointer transition-colors"
          title="Next Track"
        >
          <SkipForward size={10} />
        </button>

        {/* Expand/Collapse Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-slate-400 hover:text-emerald-400 p-0.5 shrink-0 cursor-pointer transition-colors"
          title={isExpanded ? "Collapse Controls" : "Expand Controls"}
        >
          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </motion.div>

      {/* Expanded Dropdown Sheet positioned right below the header bar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-72 xs:w-80 bg-slate-900/98 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl text-white flex flex-col gap-2.5"
          >
            {/* Expanded Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <Headphones size={14} />
                </div>
                <div className="truncate">
                  <p className="text-[10.5px] font-black uppercase tracking-wider text-white truncate">
                    Preparation Music Engine
                  </p>
                  <p className="text-[9px] text-emerald-400 font-semibold truncate">
                    Track #{currentTrackIndex + 1}/10 • {currentTrack.genre}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Close Controls"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Track Info Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-white truncate">
                  {currentTrack.title}
                </p>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 shrink-0">
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-2.5" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {currentTrack.artist}
              </p>

              {/* Progress Slider */}
              <div className="w-full mt-1">
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : currentTrack.duration}
                  step="0.5"
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 block"
                />
                <div className="flex justify-between text-[9px] font-mono text-emerald-400/90 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration > 0 ? duration : currentTrack.duration)}</span>
                </div>
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                  title="Previous Track"
                >
                  <SkipBack size={12} />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer text-slate-950 font-black shadow-md",
                    isPlaying 
                      ? "bg-emerald-400 shadow-emerald-500/30 ring-2 ring-emerald-500/30" 
                      : "bg-emerald-500 hover:bg-emerald-400"
                  )}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNextTrack(isPlaying)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                  title="Next Track"
                >
                  <SkipForward size={12} />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700/60">
                <button 
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-14 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
