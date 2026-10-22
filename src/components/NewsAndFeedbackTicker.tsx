import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, MessageSquare, Clock, Globe, RefreshCw, Star, Sparkles, TrendingUp, Sun, Radio, Pause, Play, Calendar } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { safeLocalStorage } from '../lib/storage';
import { useAuth } from './FirebaseProvider';
import { useFreshNews, NewsHeadline } from '../services/newsService';
import { cn } from '../lib/utils';
import { ADMIN_EMAIL } from '../constants';
import { toast } from 'react-hot-toast';

export type { NewsHeadline };

export interface ReviewItem {
  id: string;
  name: string;
  email: string;
  text: string;
  rating: number;
  timestamp?: any;
  isTrial?: boolean;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'default-1',
    name: 'Chipo Banda',
    email: 'chipo@fortunes.edu',
    text: 'This tool has made lesson planning so easy! I generate my schemes of work in minutes.',
    rating: 5
  },
  {
    id: 'default-2',
    name: 'Mwansa Tembo',
    email: 'mwansa@fortunes.edu',
    text: 'The syllabus integration is seamless. Highly recommended for Zambian teachers.',
    rating: 5
  },
  {
    id: 'default-3',
    name: 'Fortune Kombe',
    email: 'fortune@fortunes.edu',
    text: 'Excellent platform. The lesson plans align perfectly with both OBC and CBC curriculum frameworks.',
    rating: 5
  },
  {
    id: 'default-4',
    name: 'Albert Phiri',
    email: 'albert@fortunes.edu',
    text: 'Saves me so many hours of typing. The weekly forecasts sync beautifully!',
    rating: 5
  },
  {
    id: 'default-5',
    name: 'Mutale Mulenga',
    email: 'mutale@fortunes.edu',
    text: 'A game changer for lesson notes. Instant, accurate, and professional.',
    rating: 5
  }
];

export function NewsAndFeedbackTicker({ className }: { className?: string }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'NEWS' | 'FEEDBACK'>('NEWS');
  const [detectedLocation, setDetectedLocation] = useState<string>('Lusaka, Zambia');
  const [locationProvince, setLocationProvince] = useState<string>('Lusaka');

  // Stream fresh daily news from centralized newsService with automatic daily flash & cache purging
  const { 
    headlines: newsHeadlines, 
    isRefreshing: isRefreshingNews, 
    todayFormatted, 
    refreshNews, 
    flashAndRefresh 
  } = useFreshNews();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isRefreshingReviews, setIsRefreshingReviews] = useState(false);
  const [feedbackStartIndex, setFeedbackStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tickerSpeed, setTickerSpeed] = useState<'SLOW' | 'NORMAL'>('NORMAL');

  const isDeveloper = user?.email?.toLowerCase().trim() === ADMIN_EMAIL;
  const displayReviews = reviews.length > 0 ? [...reviews, ...DEFAULT_REVIEWS] : DEFAULT_REVIEWS;

  const activeReviews = React.useMemo(() => {
    if (displayReviews.length === 0) return [];
    const subset: ReviewItem[] = [];
    const limitCount = Math.min(75, displayReviews.length);
    for (let i = 0; i < limitCount; i++) {
      const idx = (feedbackStartIndex + i) % displayReviews.length;
      subset.push(displayReviews[idx]);
    }
    return subset;
  }, [displayReviews, feedbackStartIndex]);

  // Durations:
  // 4 minutes of News = 240 seconds
  // 4 minutes of Feedback = 240 seconds
  const NEWS_DURATION = 240;
  const FEEDBACK_DURATION = 240;

  const [timeLeft, setTimeLeft] = useState(NEWS_DURATION);

  // Load reviews from Firestore
  useEffect(() => {
    try {
      const cached = safeLocalStorage.getItem('eduplan_reviews_cache');
      if (cached) setReviews(JSON.parse(cached));
    } catch (e) {
      console.warn("Error loading cached reviews");
    }

    const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'), limit(150));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewItem));
      setReviews(data);
      safeLocalStorage.setItem('eduplan_reviews_cache', JSON.stringify(data));
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return unsubscribe;
  }, []);

  // Detect coordinates and reverse geocode on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            if (data && (data.principalSubdivision || data.city)) {
              const province = data.principalSubdivision || data.city;
              setDetectedLocation(`${province}, Zambia`);
              const cleanProv = province.replace(/Province/i, '').trim();
              setLocationProvince(cleanProv);
            }
          } catch (e) {
            console.warn("Error reverse geocoding location", e);
          }
        },
        (error) => {
          console.warn("Geolocation permission or reading failed", error);
        }
      );
    }
  }, []);
  
  // Main countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Switch mode
          if (mode === 'NEWS') {
            setMode('FEEDBACK');
            setFeedbackStartIndex(old => (old + 75) % Math.max(displayReviews.length, 1));
            return FEEDBACK_DURATION;
          } else {
            setMode('NEWS');
            // When switching back to NEWS, ensure fresh news is checked
            refreshNews(false);
            return NEWS_DURATION;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, displayReviews.length, refreshNews]);

  // Helper formatting for countdown time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'LOCAL':
        return 'bg-indigo-600 text-white border-indigo-500';
      case 'BUZZ':
        return 'bg-pink-600 text-white border-pink-500';
      case 'LIFESTYLE':
        return 'bg-teal-600 text-white border-teal-500';
      case 'ZAMBIA':
        return 'bg-emerald-600 text-white border-emerald-500';
      case 'AFRICA':
        return 'bg-amber-600 text-white border-amber-500';
      case 'BUSINESS':
        return 'bg-blue-600 text-white border-blue-500';
      case 'WEATHER':
        return 'bg-cyan-600 text-white border-cyan-500';
      case 'CULTURE':
        return 'bg-purple-600 text-white border-purple-500';
      case 'TECH':
        return 'bg-indigo-600 text-white border-indigo-500';
      default:
        return 'bg-slate-700 text-white border-slate-600';
    }
  };

  const isLoading = mode === 'NEWS' ? isRefreshingNews : isRefreshingReviews;

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {/* Ticker Header Control Bar */}
      <div className="flex items-center gap-2 px-1 py-1">
        <div className="flex items-center gap-2">
          {/* Blue Circle with Small Round-Green Refresh Button */}
          <button
            onClick={() => {
              if (mode === 'NEWS') {
                // Instantly flash away old news and fetch brand new headlines
                flashAndRefresh();
              } else {
                // Refresh reviews
                setIsRefreshingReviews(true);
                toast.success("🔄 Syncing Live Feedback Database...", { id: 'feedback-sync' });
                setTimeout(() => setIsRefreshingReviews(false), 500);
              }
            }}
            disabled={isLoading}
            className="w-7 h-7 bg-blue-600 hover:bg-blue-700 active:scale-95 text-emerald-400 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 cursor-pointer transition-all border border-blue-500/30"
            title={mode === 'NEWS' ? "Flash away old news & fetch fresh headlines" : "Refresh teacher reviews"}
          >
            <RefreshCw size={11} className={cn("shrink-0", isLoading ? 'animate-spin text-emerald-300' : 'text-emerald-400')} />
          </button>

          {/* Single Dynamic Tab representing current active mode (Feedback or News) */}
          <button
            onClick={() => {
              // Clicking the tab toggles the mode manually
              if (mode === 'NEWS') {
                setMode('FEEDBACK');
                setTimeLeft(FEEDBACK_DURATION);
              } else {
                setMode('NEWS');
                setTimeLeft(NEWS_DURATION);
                refreshNews(false);
              }
            }}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-xs flex items-center gap-2",
              mode === 'FEEDBACK'
                ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                : "bg-slate-950 text-amber-400 border-amber-500/40"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", mode === 'FEEDBACK' ? "bg-emerald-400" : "bg-amber-400")} />
            <span>
              {mode === 'FEEDBACK' ? 'Live feedback' : 'Latest news'}
            </span>
            <span className="opacity-75 font-semibold text-[9px] border-l border-white/10 pl-1.5 ml-0.5">
              {formatTime(timeLeft)}
            </span>
          </button>
        </div>

        {/* Small auto rotation status & Today's Date Badge */}
        <div className="ml-auto flex items-center gap-2 text-[9px] text-slate-400/80 font-semibold italic">
          <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[8px] font-bold not-italic">
            <Calendar size={8.5} className="text-amber-400" />
            <span>{todayFormatted}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <Clock size={9} className="text-emerald-500" />
            <span>Auto-rotates</span>
          </div>
        </div>
      </div>

      {/* Marquee Ticker Stage - Slimmed down to h-7 with smaller text */}
      <div 
        className="overflow-hidden h-7 flex items-center bg-slate-950 text-white rounded-xl border border-slate-800/80 px-3 shadow-xs relative group select-none cursor-pointer"
        onClick={() => setIsPaused(!isPaused)}
        title={isPaused ? "Click to resume scrolling" : "Click anywhere on bar to pause and read"}
      >
        <style>{`
          @keyframes marqueeContinuous {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            will-change: transform;
            backface-visibility: hidden;
            transform-style: preserve-3d;
            animation: marqueeContinuous ${mode === 'NEWS' ? (tickerSpeed === 'SLOW' ? Math.max(1, newsHeadlines.length) * 15 : Math.max(1, newsHeadlines.length) * 8) : (tickerSpeed === 'SLOW' ? Math.max(1, activeReviews.length) * 12 : Math.max(1, activeReviews.length) * 8)}s linear infinite;
            animation-play-state: ${isPaused ? 'paused' : 'running'};
          }
          .group:hover .marquee-track,
          .group:active .marquee-track,
          .group:focus-within .marquee-track {
            animation-play-state: paused;
          }
        `}</style>

        <div className="marquee-track flex items-center text-[9.5px] font-medium tracking-wide">
          {/* Block 1 */}
          <div className="flex items-center gap-8 pr-8 shrink-0">
            {mode === 'NEWS' ? (
              newsHeadlines.map((item, idx) => (
                <div key={`n1-${item.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className={cn("px-1.5 py-0.2 text-[7.5px] font-black uppercase rounded border flex items-center gap-0.5 shadow-3xs scale-90", getCategoryBadgeClass(item.category))}>
                    <Radio size={7} className="animate-pulse" />
                    {item.category}
                  </span>

                  <span className="text-slate-100 font-bold hover:text-emerald-300 transition-colors">
                    "{item.title}"
                  </span>

                  <span className="text-[8px] text-slate-400 flex items-center gap-0.5 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                    <Globe size={8} className="text-amber-400" />
                    {item.source} • <span className="text-slate-300">{item.timeAgo}</span>
                  </span>
                </div>
              ))
            ) : (
              activeReviews.map((rev, idx) => (
                <div key={`r1-${rev.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-black uppercase bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40 text-[8.5px] flex items-center gap-1 scale-90">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    {rev.name}
                    {rev.isTrial && <span className="text-[6.5px] text-amber-300 ml-0.5 border border-amber-500/50 bg-amber-950/60 px-1 rounded uppercase tracking-wider">(Guest)</span>}
                    {isDeveloper && rev.isTrial && rev.email && (
                      <span className="text-[7.5px] text-rose-300 font-bold lowercase ml-0.5 px-0.5 bg-rose-950/40 rounded border border-rose-900/40">
                        {rev.email}
                      </span>
                    )}
                  </span>

                  <span className="text-slate-300 italic">"{rev.text}"</span>

                  <div className="flex gap-0.2 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={8} fill="currentColor" />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Block 2 (Identical Duplicate for 100% Seamless Non-Bumping Loop) */}
          <div className="flex items-center gap-8 pr-8 shrink-0" aria-hidden="true">
            {mode === 'NEWS' ? (
              newsHeadlines.map((item, idx) => (
                <div key={`n2-${item.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className={cn("px-1.5 py-0.2 text-[7.5px] font-black uppercase rounded border flex items-center gap-0.5 shadow-3xs scale-90", getCategoryBadgeClass(item.category))}>
                    <Radio size={7} className="animate-pulse" />
                    {item.category}
                  </span>

                  <span className="text-slate-100 font-bold hover:text-emerald-300 transition-colors">
                    "{item.title}"
                  </span>

                  <span className="text-[8px] text-slate-400 flex items-center gap-0.5 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                    <Globe size={8} className="text-amber-400" />
                    {item.source} • <span className="text-slate-300">{item.timeAgo}</span>
                  </span>
                </div>
              ))
            ) : (
              activeReviews.map((rev, idx) => (
                <div key={`r2-${rev.id}-${idx}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-black uppercase bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40 text-[8.5px] flex items-center gap-1 scale-90">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    {rev.name}
                    {rev.isTrial && <span className="text-[6.5px] text-amber-300 ml-0.5 border border-amber-500/50 bg-amber-950/60 px-1 rounded uppercase tracking-wider">(Guest)</span>}
                    {isDeveloper && rev.isTrial && rev.email && (
                      <span className="text-[7.5px] text-rose-300 font-bold lowercase ml-0.5 px-0.5 bg-rose-950/40 rounded border border-rose-900/40">
                        {rev.email}
                      </span>
                    )}
                  </span>

                  <span className="text-slate-300 italic">"{rev.text}"</span>

                  <div className="flex gap-0.2 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={8} fill="currentColor" />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
