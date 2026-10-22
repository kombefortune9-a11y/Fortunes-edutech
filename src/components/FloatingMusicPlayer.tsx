import React from 'react';
import { TopMusicPlayer } from './TopMusicPlayer';

export { TopMusicPlayer };

interface FloatingMusicPlayerProps {
  activeSection: string;
  onNavigateToDashboard?: () => void;
}

/**
 * FloatingMusicPlayer is now consolidated as TopMusicPlayer,
 * positioned at the top header navbar to keep document forms,
 * schemes of work, and lesson plan fields completely unobstructed.
 */
export function FloatingMusicPlayer(props: FloatingMusicPlayerProps) {
  return <TopMusicPlayer {...props} />;
}

export default FloatingMusicPlayer;
