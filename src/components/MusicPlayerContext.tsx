import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface SharedTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationFormatted: string;
  audioUrl: string;
  genre: 'Amapiano' | 'Slow Blues' | 'Local Kalindula';
}

// Exactly 10 curated tracks: 8 Amapiano & Slow Blues + 2 Local Kalindula tracks
export const DEVELOPER_DEFAULT_TRACKS: SharedTrack[] = [
  {
    id: 'default_amapiano_drum',
    title: 'Amapiano Log Drum Groove',
    artist: 'Amapiano Beats',
    duration: 372.7,
    durationFormatted: '6:12',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Amapiano'
  },
  {
    id: 'default_midnight_blues',
    title: 'Midnight Slow Blues',
    artist: 'Slow Blues Instrumentals',
    duration: 426.0,
    durationFormatted: '7:05',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Slow Blues'
  },
  {
    id: 'default_amapiano_sax',
    title: 'Sultry Saxophone Amapiano',
    artist: 'African Lounge',
    duration: 344.1,
    durationFormatted: '5:44',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'Amapiano'
  },
  {
    id: 'default_texas_blues',
    title: 'Texas Guitar Slow Blues',
    artist: 'Deep South Blues',
    duration: 302.5,
    durationFormatted: '5:02',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Slow Blues'
  },
  {
    id: 'default_amapiano_shaker',
    title: 'Amapiano Shaker & Percussion',
    artist: 'Township Rhythm',
    duration: 354.0,
    durationFormatted: '5:53',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    genre: 'Amapiano'
  },
  {
    id: 'default_delta_blues',
    title: 'Classic Delta Blues Acoustic',
    artist: 'Mississippi Strings',
    duration: 279.6,
    durationFormatted: '4:39',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    genre: 'Slow Blues'
  },
  {
    id: 'default_amapiano_keyboard',
    title: 'Smooth Amapiano Keyboard',
    artist: 'Piano Soul Groove',
    duration: 420.6,
    durationFormatted: '7:00',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    genre: 'Amapiano'
  },
  {
    id: 'default_rainy_blues',
    title: 'Rainy Day Electric Blues',
    artist: 'Velvet Blues Band',
    duration: 325.3,
    durationFormatted: '5:25',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Slow Blues'
  },
  {
    id: 'default_coconut_island',
    title: 'Coconut Island Kalindula Groove',
    artist: 'Local Folk Heritage',
    duration: 389.4,
    durationFormatted: '6:29',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    genre: 'Local Kalindula'
  },
  {
    id: 'default_coconut_tree',
    title: 'Sweet Coconut Tree Kalindula',
    artist: 'Traditional Zambian Acoustic',
    duration: 527.4,
    durationFormatted: '8:47',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Local Kalindula'
  }
];

interface MusicPlayerContextType {
  allTracks: SharedTrack[];
  currentTrack: SharedTrack;
  currentTrackIndex: number;
  selectedTrackId: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  togglePlay: () => Promise<void>;
  handleSelectTrack: (track: SharedTrack, startPlaying?: boolean) => Promise<void>;
  handleNextTrack: (startPlaying?: boolean) => void;
  handlePrevTrack: () => void;
  setVolume: (volume: number) => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  seekTo: (seconds: number) => void;
  formatTime: (secs: number) => string;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const allTracks = DEVELOPER_DEFAULT_TRACKS;
  const [selectedTrackId, setSelectedTrackId] = useState<string>(allTracks[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(allTracks[0].duration);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = allTracks.find(t => t.id === selectedTrackId) || allTracks[0];
  const currentTrackIndex = allTracks.findIndex(t => t.id === currentTrack.id);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const setVolume = (newVol: number) => {
    setVolumeState(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const handleSelectTrack = async (track: SharedTrack, startPlaying: boolean = true) => {
    setSelectedTrackId(track.id);
    setCurrentTime(0);
    setDuration(track.duration);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();

      if (startPlaying) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          const tIdx = allTracks.findIndex(t => t.id === track.id) + 1;
          toast.success(`Playing #${tIdx}: ${track.title}`, { id: 'play-toast', icon: '🎶' });
        } catch (err) {
          console.warn("Playback error or autoplay restriction:", err);
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleNextTrack = (startPlaying: boolean = isPlaying) => {
    const currIdx = allTracks.findIndex(t => t.id === currentTrack.id);
    const nextIdx = (currIdx + 1) % allTracks.length;
    handleSelectTrack(allTracks[nextIdx], startPlaying);
  };

  const handlePrevTrack = () => {
    const currIdx = allTracks.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (currIdx - 1 + allTracks.length) % allTracks.length;
    handleSelectTrack(allTracks[prevIdx], isPlaying);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || !audioRef.current.src.includes('soundhelix')) {
        audioRef.current.src = currentTrack.audioUrl;
        audioRef.current.load();
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        toast.success(`Playing: ${currentTrack.title}`, { id: 'play-toast', icon: '🎶' });
      } catch (err) {
        console.warn("Play interrupted:", err);
        toast.error("Tap Play again to start audio playback.");
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        allTracks,
        currentTrack,
        currentTrackIndex,
        selectedTrackId,
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        togglePlay,
        handleSelectTrack,
        handleNextTrack,
        handlePrevTrack,
        setVolume,
        setIsMuted,
        seekTo,
        formatTime,
      }}
    >
      {/* Root-Level Persistent HTML5 Audio Element */}
      {/* Stays mounted across ALL tabs, enabling seamless background music during preparation */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
              setDuration(audioRef.current.duration);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            setDuration(audioRef.current.duration);
          } else {
            setDuration(currentTrack.duration);
          }
        }}
        onEnded={() => {
          // Automatic sequential playback across all 10 tracks continuously
          setCurrentTime(0);
          handleNextTrack(true);
        }}
      />
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
