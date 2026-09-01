import React, { useState, useEffect } from 'react';
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

  const isCustomActive = !!(tickerText && tickerText.trim().length > 0);
  let activeMessage = DEFAULT_MESSAGE;
  if (isCustomActive && tickerText) {
    const trimmed = tickerText.trim();
    if (/^dear\s+/i.test(trimmed)) {
      activeMessage = trimmed;
    } else {
      activeMessage = `Dear ${userName}: ${trimmed}`;
    }
  }

  const charLength = activeMessage.length || 100;
  // Slow down the scrolling speed dynamically based on character length for a guaranteed steady slow pace
  const animationDuration = Math.max(95, Math.floor(charLength * 0.75));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
        className="w-full bg-[#1e293b] text-white py-2 px-4 shadow-md flex items-center gap-3 overflow-hidden relative z-50 border-b border-[#00A86B]/40"
      >
        {/* Custom Portable CSS for the sliding text marquee */}
        <style>{`
          @keyframes informantMarquee {
            0% { transform: translate3d(100%, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
          .informant-sliding-text {
            display: inline-block;
            white-space: nowrap;
            animation: informantMarquee ${animationDuration}s linear infinite;
            will-change: transform;
          }
        `}</style>

        {/* Icon alert badge */}
        <div className={`flex items-center gap-1.5 shrink-0 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest z-10 shadow-sm border animate-pulse ${
          isCustomActive ? 'bg-[#00A86B] border-emerald-500' : 'bg-blue-600 border-blue-500'
        }`}>
          <Bell size={11} className="shake-notification" />
          <span>{isCustomActive ? 'INFORMANT' : 'SYSTEM'}</span>
        </div>

        {/* Ticker Stage */}
        <div className="flex-1 overflow-hidden relative flex items-center pr-12">
          <div className="informant-sliding-text text-xs font-semibold tracking-wide text-emerald-50">
            {activeMessage} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {activeMessage}
          </div>
        </div>

        <div className="absolute right-3 bg-[#1e293b]/90 pl-3 py-1 text-[8px] text-slate-400 font-bold tracking-tight italic flex items-center gap-1">
          <Info size={10} className="text-[#00A86B]" />
          Real-time Broadcast
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
