import React, { useMemo } from 'react';
import { useAuth } from './FirebaseProvider';
import { Bell, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InformantTicker() {
  const { informantData, user } = useAuth();
  const tickerText = informantData.text;

  // Helper to extract clean user name for greeting
  const getUserName = (currentUser: any): string => {
    if (!currentUser) return 'Educator';

    let rawName = currentUser.displayName || '';

    // Check if name is generic like 'Teacher (Guest)', 'Developer (Guest)', 'Teacher', etc.
    const isGeneric = !rawName || 
      rawName.toLowerCase() === 'teacher' || 
      rawName.toLowerCase() === 'anonymous' ||
      rawName.toLowerCase().includes('guest') ||
      rawName.toLowerCase().includes('developer');

    if (isGeneric && currentUser.email) {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      let prefix = cleanEmail.split('@')[0].replace(/\d+$/, '');
      if (cleanEmail === 'kombefortune9@gmail.com' || prefix === 'kombefortune' || prefix === 'fortunekombe') {
        rawName = 'Fortune Kombe';
      } else if (cleanEmail === 'chisengaaskalbert51@gmail.com' || prefix.includes('chisenga')) {
        rawName = 'Chisenga Askalbert';
      } else if (prefix.includes('.')) {
        rawName = prefix.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      } else if (prefix.includes('_')) {
        rawName = prefix.split('_').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      } else {
        rawName = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
      }
    }

    // Remove generic tags
    let cleanName = rawName
      .replace(/\s*\(Guest\)/gi, '')
      .replace(/\s*\(Invited\)/gi, '')
      .replace(/\s*\(Developer\)/gi, '')
      .trim();

    if (cleanName) {
      cleanName = cleanName.split(' ').map((w: string) => {
        if (!w) return '';
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    }

    return cleanName || 'Educator';
  };

  const userName = getUserName(user);

  const DEFAULT_MESSAGE = `Dear ${userName}: Welcome to FORTUNES EDUTECH! Your professional, CBC/OBC-aligned lesson plans, schemes of work, weekly forecasts, and lesson notes generator is fully active and ready to help you plan.`;

  const isCustomActive = !!(informantData.isActive !== false && tickerText && tickerText.trim().length > 0);
  let baseGreeting = DEFAULT_MESSAGE;
  if (isCustomActive && tickerText) {
    let cleanText = tickerText.trim();
    // Strip hardcoded "Dear <Name>:" or "Dear <Name>," if saved in broadcast string so every user gets personalized greeting
    cleanText = cleanText.replace(/^dear\s+[^:]+:\s*/i, '').replace(/^dear\s+[^,]+,\s*/i, '');
    baseGreeting = `Dear ${userName}: ${cleanText}`;
  }

  // The Informant strictly displays official developer information and system broadcasts
  const activeMessage = useMemo(() => {
    return baseGreeting;
  }, [baseGreeting]);

  // Normal, comfortable reading pace for full sentences
  const animationDuration = useMemo(() => {
    const charLength = activeMessage.length || 100;
    // Steady, comfortable reading speed (e.g. ~28s for 250 chars, ~50s for 500 chars)
    return Math.max(25, Math.round(charLength * 0.10));
  }, [activeMessage]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
        className="w-full bg-blue-700 text-white py-0.5 sm:py-1 pl-1 sm:pl-1.5 pr-2.5 sm:pr-3.5 shadow-sm flex items-center gap-2 overflow-hidden relative z-50 border-b border-blue-800 select-none"
      >
        {/* Continuous Seamless Infinite Scrolling Marquee */}
        <style>{`
          @keyframes informantContinuous {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .informant-track {
            display: flex;
            width: max-content;
            will-change: transform;
            backface-visibility: hidden;
            transform-style: preserve-3d;
            animation: informantContinuous ${animationDuration}s linear infinite;
          }
          .informant-stage:hover .informant-track,
          .informant-stage:active .informant-track {
            animation-play-state: paused;
          }
        `}</style>

        {/* Informant Tab - Far to the left edge, Black styling */}
        <div className="flex items-center gap-1.5 shrink-0 bg-black text-white px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider z-10 shadow-sm border border-neutral-800">
          <Bell size={8} className="shake-notification shrink-0 sm:w-[8.5px] sm:h-[8.5px]" />
          <span>{isCustomActive ? 'INFORMANT' : 'SYSTEM'}</span>
        </div>

        {/* Ticker Stage with Complete Full Sentence from Start to End (Seamless Loop) */}
        <div className="informant-stage flex-1 overflow-hidden relative flex items-center pr-4 sm:pr-24 min-w-0">
          <div className="informant-track flex items-center text-[8.5px] sm:text-[9.5px] font-semibold tracking-normal text-white select-none whitespace-nowrap">
            {/* Cycle 1: Complete full sentence from start to end */}
            <div className="flex items-center shrink-0 pr-8 text-white">
              <span className="text-white">{activeMessage}</span>
              <span className="mx-4 text-white/80 font-bold">&bull;</span>
            </div>

            {/* Cycle 2: Identical full sentence mirror for seamless infinite loop */}
            <div className="flex items-center shrink-0 pr-8 text-white" aria-hidden="true">
              <span className="text-white">{activeMessage}</span>
              <span className="mx-4 text-white/80 font-bold">&bull;</span>
            </div>
          </div>
        </div>

        {/* Original Right Broadcast Badge */}
        <div className="hidden xs:flex absolute right-1.5 sm:right-2.5 bg-blue-800/95 pl-1.5 sm:pl-2 py-0.5 text-[6.5px] sm:text-[7.5px] text-blue-100 font-bold tracking-tight italic items-center gap-1 shrink-0 pointer-events-none rounded-l">
          <Info size={7.5} className="text-white shrink-0 sm:w-[8px] sm:h-[8px]" />
          <span className="hidden sm:inline">Broadcast</span>
          <span className="sm:hidden">Live</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
