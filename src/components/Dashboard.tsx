import { 
  ShieldCheck, 
  Download, 
  BookOpen, 
  FileText, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Calendar,
  Layers,
  Map,
  Smartphone,
  Send,
  Share2,
  Check,
  X,
  Plus,
  LogOut,
  Users,
  History as HistoryIcon,
  BookMarked,
  MessageSquare,
  Settings as SettingsIcon,
  Lock,
  Heart,
  Video,
  Receipt,
  ExternalLink,
  Play,
  Radio,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { DOC_TEMPLATES, DocType, ADMIN_EMAIL, SUBSCRIPTION_PLANS, isDeveloperEmail } from '../constants';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './FirebaseProvider';
import { toast } from 'react-hot-toast';
import { ReviewSystem, ReviewTicker } from './ReviewSystem';
import { ColorWaveText } from './ColorWaveText';
import { AccessModal } from './AccessModal';
import ReceiptManager from './ReceiptManager';
import { IsometricDashboardBg } from './IsometricDashboardBg';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';

const cardThemeMap: Record<string, { bg: string, text: string, hoverBorder: string, iconBg: string, accentBg: string, shadow: string }> = {
  research: {
    bg: 'bg-white/85 bg-gradient-to-br from-purple-50/70 to-white/95 border-purple-500/30 backdrop-blur-md',
    text: 'text-purple-700',
    hoverBorder: 'hover:border-purple-500/60 hover:bg-white',
    iconBg: 'bg-purple-500/15 text-purple-600 border border-purple-500/20',
    accentBg: 'bg-purple-500',
    shadow: 'hover:shadow-purple-500/10 shadow-sm shadow-slate-200/50'
  },
  lesson_plan: {
    bg: 'bg-white/85 bg-gradient-to-br from-emerald-50/70 to-white/95 border-emerald-500/30 backdrop-blur-md',
    text: 'text-emerald-700',
    hoverBorder: 'hover:border-emerald-500/60 hover:bg-white',
    iconBg: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20',
    accentBg: 'bg-emerald-500',
    shadow: 'hover:shadow-emerald-500/10 shadow-sm shadow-slate-200/50'
  },
  assessments: {
    bg: 'bg-white/85 bg-gradient-to-br from-orange-50/70 to-white/95 border-orange-500/30 backdrop-blur-md',
    text: 'text-orange-700',
    hoverBorder: 'hover:border-orange-500/60 hover:bg-white',
    iconBg: 'bg-orange-500/15 text-orange-600 border border-orange-500/20',
    accentBg: 'bg-orange-500',
    shadow: 'hover:shadow-orange-500/10 shadow-sm shadow-slate-200/50'
  },
  syllabi: {
    bg: 'bg-white/85 bg-gradient-to-br from-rose-50/70 to-white/95 border-rose-500/30 backdrop-blur-md',
    text: 'text-rose-700',
    hoverBorder: 'hover:border-rose-500/60 hover:bg-white',
    iconBg: 'bg-rose-500/15 text-rose-600 border border-rose-500/20',
    accentBg: 'bg-rose-500',
    shadow: 'hover:shadow-rose-500/10 shadow-sm shadow-slate-200/50'
  },
  schemes_of_work: {
    bg: 'bg-white/85 bg-gradient-to-br from-cyan-50/70 to-white/95 border-cyan-500/30 backdrop-blur-md',
    text: 'text-cyan-700',
    hoverBorder: 'hover:border-cyan-500/60 hover:bg-white',
    iconBg: 'bg-cyan-500/15 text-cyan-600 border border-cyan-500/20',
    accentBg: 'bg-cyan-500',
    shadow: 'hover:shadow-cyan-500/10 shadow-sm shadow-slate-200/50'
  },
  weekly_forecast: {
    bg: 'bg-white/85 bg-gradient-to-br from-sky-50/70 to-white/95 border-sky-500/30 backdrop-blur-md',
    text: 'text-sky-700',
    hoverBorder: 'hover:border-sky-500/60 hover:bg-white',
    iconBg: 'bg-sky-500/15 text-sky-600 border border-sky-500/20',
    accentBg: 'bg-sky-500',
    shadow: 'hover:shadow-sky-500/10 shadow-sm shadow-slate-200/50'
  },
  catch_up: {
    bg: 'bg-white/85 bg-gradient-to-br from-emerald-50/70 to-white/95 border-emerald-600/30 backdrop-blur-md',
    text: 'text-emerald-700',
    hoverBorder: 'hover:border-emerald-600/60 hover:bg-white',
    iconBg: 'bg-emerald-600/15 text-emerald-600 border border-emerald-600/20',
    accentBg: 'bg-emerald-600',
    shadow: 'hover:shadow-emerald-600/10 shadow-sm shadow-slate-200/50'
  },
  lesson_notes: {
    bg: 'bg-white/85 bg-gradient-to-br from-indigo-50/70 to-white/95 border-indigo-500/30 backdrop-blur-md',
    text: 'text-indigo-700',
    hoverBorder: 'hover:border-indigo-500/60 hover:bg-white',
    iconBg: 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20',
    accentBg: 'bg-indigo-500',
    shadow: 'hover:shadow-indigo-500/10 shadow-sm shadow-slate-200/50'
  },
  individual_work_plan: {
    bg: 'bg-white/85 bg-gradient-to-br from-violet-50/70 to-white/95 border-violet-500/30 backdrop-blur-md',
    text: 'text-violet-700',
    hoverBorder: 'hover:border-violet-500/60 hover:bg-white',
    iconBg: 'bg-violet-500/15 text-violet-600 border border-violet-500/20',
    accentBg: 'bg-violet-500',
    shadow: 'hover:shadow-violet-500/10 shadow-sm shadow-slate-200/50'
  },
  video_script: {
    bg: 'bg-white/85 bg-gradient-to-br from-teal-50/70 to-white/95 border-teal-500/30 backdrop-blur-md',
    text: 'text-teal-700',
    hoverBorder: 'hover:border-teal-500/60 hover:bg-white',
    iconBg: 'bg-teal-500/15 text-teal-600 border border-teal-500/20',
    accentBg: 'bg-teal-500',
    shadow: 'hover:shadow-teal-500/10 shadow-sm shadow-slate-200/50'
  },
  records_of_work: {
    bg: 'bg-white/85 bg-gradient-to-br from-slate-50/70 to-white/95 border-slate-500/30 backdrop-blur-md',
    text: 'text-slate-700',
    hoverBorder: 'hover:border-slate-500/60 hover:bg-white',
    iconBg: 'bg-slate-500/15 text-slate-700 border border-slate-500/20',
    accentBg: 'bg-slate-600',
    shadow: 'hover:shadow-slate-500/10 shadow-sm shadow-slate-200/50'
  },
  settings: {
    bg: 'bg-white/85 bg-gradient-to-br from-emerald-50/70 to-white/95 border-emerald-500/30 backdrop-blur-md',
    text: 'text-emerald-700',
    hoverBorder: 'hover:border-emerald-500/60 hover:bg-white',
    iconBg: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20',
    accentBg: 'bg-emerald-500',
    shadow: 'hover:shadow-emerald-500/10 shadow-sm shadow-slate-200/50'
  }
};

function EmojiForType({ type }: { type: string }) {
  switch (type) {
    case 'schemes_of_work':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📚</span>;
    case 'weekly_forecast':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">🎒🖊️</span>;
    case 'lesson_plan':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📝</span>;
    case 'catch_up':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">🚲</span>;
    case 'lesson_notes':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📔</span>;
    case 'assessments':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📋</span>;
    case 'individual_work_plan':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">🎯</span>;
    case 'syllabi':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📜</span>;
    case 'video_script':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">✍️</span>;
    case 'research':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">🎓</span>;
    case 'records_of_work':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">⏳</span>;
    case 'settings':
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">⚙️</span>;
    default:
      return <span className="text-sm sm:text-base md:text-xl select-none leading-none">📄</span>;
  }
}

function ParticleWavesBg({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1000 300" 
      preserveAspectRatio="none" 
      className={cn("absolute inset-0 w-full h-full pointer-events-none select-none", className)}
    >
      <defs>
        <filter id="glow-wave" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-bar" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bokeh-deep">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        
        <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D880" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00D880" stopOpacity="0" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes float-p {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-12px) translateX(6px); }
        }
        @keyframes twinkle-p {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.85; }
        }
        @keyframes wave-sway {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(3px) scaleY(1.03); }
        }
        .anim-p-1 { animation: float-p 8s ease-in-out infinite, twinkle-p 4s ease-in-out infinite; }
        .anim-p-2 { animation: float-p 12s ease-in-out infinite, twinkle-p 6s ease-in-out infinite; animation-delay: 2s; }
        .anim-p-3 { animation: float-p 10s ease-in-out infinite, twinkle-p 5s ease-in-out infinite; animation-delay: 4s; }
        .anim-p-static { animation: twinkle-p 7s ease-in-out infinite; }
        .anim-wave { animation: wave-sway 14s ease-in-out infinite; transform-origin: bottom center; }
        .anim-wave-delayed { animation: wave-sway 18s ease-in-out infinite; animation-delay: 3s; transform-origin: bottom center; }
      `}</style>

      {/* Grid background for technical/scientific HUD feel of the image */}
      <g opacity="0.03">
        <path d="M 0,50 L 1000,50 M 0,100 L 1000,100 M 0,150 L 1000,150 M 0,200 L 1000,200 M 0,250 L 1000,250" stroke="#38bdf8" strokeWidth="1" />
        <path d="M 100,0 L 100,300 M 200,0 L 200,300 M 300,0 L 300,300 M 400,0 L 400,300 M 500,0 L 500,300 M 600,0 L 600,300 M 700,0 L 700,300 M 800,0 L 800,300 M 900,0 L 900,300" stroke="#38bdf8" strokeWidth="1" />
      </g>

      {/* 1. DEEP BACKGROUND BOKEH / BLURRED WAVES */}
      <g filter="url(#bokeh-deep)" opacity="0.35" className="anim-wave-delayed">
        {/* Soft thick blue wave */}
        <path d="M -50,180 C 120,110 320,250 520,170 C 720,90 850,220 1050,150" fill="none" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" />
        {/* Soft thick cyan wave */}
        <path d="M -50,210 C 180,140 280,260 480,190 C 680,120 880,230 1050,160" fill="none" stroke="#00A86B" strokeWidth="10" strokeLinecap="round" />
        
        {/* Massive bokeh circular lights scattered allover */}
        <circle cx="120" cy="80" r="16" fill="#38bdf8" />
        <circle cx="480" cy="60" r="22" fill="#00D880" />
        <circle cx="750" cy="90" r="18" fill="#3b82f6" />
        <circle cx="920" cy="70" r="14" fill="#ffffff" />
      </g>

      {/* 2. MIDDLEGROUND DETAILED WAVES WITH VOLUME FILLS */}
      <g className="anim-wave" opacity="0.65">
        {/* Wave 1 fill */}
        <path d="M -50,230 C 180,170 320,275 520,210 C 720,145 820,245 1050,180 L 1050,300 L -50,300 Z" fill="url(#wave-grad-1)" />
        {/* Wave 1 stroke */}
        <path d="M -50,230 C 180,170 320,275 520,210 C 720,145 820,245 1050,180" fill="none" stroke="#0ea5e9" strokeWidth="2.5" filter="url(#glow-wave)" />

        {/* Wave 2 fill */}
        <path d="M -50,195 C 120,235 380,140 550,215 C 720,290 880,185 1050,220 L 1050,300 L -50,300 Z" fill="url(#wave-grad-2)" />
        {/* Wave 2 stroke */}
        <path d="M -50,195 C 120,235 380,140 550,215 C 720,290 880,185 1050,220" fill="none" stroke="#00D880" strokeWidth="2" filter="url(#glow-wave)" />

        {/* Wave 3 (Thin, sharp white wave line) */}
        <path d="M -50,210 C 200,265 300,165 480,235 C 660,305 800,195 1050,245" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
      </g>

      {/* 3. VERTICAL DATA COLUMNS (SPECTROGRAM / HISTOGRAM BARS) RISING FROM WAVES */}
      <g filter="url(#glow-bar)" opacity="0.75" className="anim-wave">
        {/* Cluster Left */}
        <line x1="110" y1="210" x2="110" y2="175" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="212" x2="120" y2="150" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="130" y1="215" x2="130" y2="185" stroke="#00D880" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="145" y1="218" x2="145" y2="135" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        <line x1="155" y1="220" x2="155" y2="190" stroke="#00D880" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cluster Mid-Left */}
        <line x1="280" y1="225" x2="280" y2="170" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="295" y1="230" x2="295" y2="145" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <line x1="310" y1="232" x2="310" y2="195" stroke="#00D880" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="325" y1="235" x2="325" y2="130" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

        {/* Cluster Center-Right */}
        <line x1="480" y1="220" x2="480" y2="160" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <line x1="495" y1="222" x2="495" y2="115" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="510" y1="223" x2="510" y2="95" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
        <line x1="525" y1="225" x2="525" y2="140" stroke="#00D880" strokeWidth="3.8" strokeLinecap="round" />
        <line x1="540" y1="228" x2="540" y2="180" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* High Column Peak Cluster */}
        <line x1="730" y1="225" x2="730" y2="150" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="745" y1="215" x2="745" y2="110" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <line x1="760" y1="205" x2="760" y2="70" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="775" y1="198" x2="775" y2="125" stroke="#00D880" strokeWidth="4" strokeLinecap="round" />
        <line x1="790" y1="192" x2="790" y2="160" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <line x1="805" y1="188" x2="805" y2="90" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        <line x1="820" y1="185" x2="820" y2="145" stroke="#00D880" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* 4. FLOATING PARTICLES SCATTERED ALL OVER */}
      <g>
        <circle cx="60" cy="110" r="1.5" fill="#ffffff" className="anim-p-1" />
        <circle cx="150" cy="70" r="2.2" fill="#38bdf8" className="anim-p-1" filter="url(#glow-bar)" />
        <circle cx="230" cy="40" r="1.2" fill="#ffffff" className="anim-p-1" />
        <circle cx="310" cy="140" r="2" fill="#00D880" className="anim-p-1" filter="url(#glow-bar)" />
        <circle cx="450" cy="90" r="1.8" fill="#38bdf8" className="anim-p-1" />
        <circle cx="560" cy="50" r="2.5" fill="#ffffff" className="anim-p-1" filter="url(#glow-bar)" />
        <circle cx="680" cy="130" r="1.5" fill="#00D880" className="anim-p-1" />
        <circle cx="790" cy="60" r="2" fill="#38bdf8" className="anim-p-1" />
        <circle cx="870" cy="120" r="1.2" fill="#ffffff" className="anim-p-1" />
        <circle cx="940" cy="80" r="2.5" fill="#00D880" className="anim-p-1" filter="url(#glow-bar)" />

        <circle cx="90" cy="40" r="2.5" fill="#38bdf8" className="anim-p-2" filter="url(#glow-bar)" />
        <circle cx="180" cy="150" r="1.5" fill="#ffffff" className="anim-p-2" />
        <circle cx="270" cy="90" r="2" fill="#00D880" className="anim-p-2" />
        <circle cx="380" cy="60" r="1.2" fill="#ffffff" className="anim-p-2" />
        <circle cx="490" cy="150" r="2.2" fill="#38bdf8" className="anim-p-2" filter="url(#glow-bar)" />
        <circle cx="620" cy="80" r="1.5" fill="#ffffff" className="anim-p-2" />
        <circle cx="720" cy="40" r="2.8" fill="#00D880" className="anim-p-2" filter="url(#glow-bar)" />
        <circle cx="840" cy="160" r="1.8" fill="#38bdf8" className="anim-p-2" />
        <circle cx="910" cy="50" r="1.2" fill="#ffffff" className="anim-p-2" />

        <circle cx="40" cy="160" r="1.2" fill="#ffffff" className="anim-p-3" />
        <circle cx="120" cy="240" r="1.8" fill="#00D880" className="anim-p-3" />
        <circle cx="210" cy="100" r="2.5" fill="#38bdf8" className="anim-p-3" filter="url(#glow-bar)" />
        <circle cx="340" cy="220" r="1.5" fill="#ffffff" className="anim-p-3" />
        <circle cx="420" cy="30" r="2" fill="#38bdf8" className="anim-p-3" />
        <circle cx="530" cy="170" r="1.2" fill="#ffffff" className="anim-p-3" />
        <circle cx="650" cy="240" r="2" fill="#00D880" className="anim-p-3" />
        <circle cx="760" cy="110" r="1.5" fill="#ffffff" className="anim-p-3" />
        <circle cx="890" cy="230" r="2.2" fill="#38bdf8" className="anim-p-3" filter="url(#glow-bar)" />
        <circle cx="970" cy="150" r="1.2" fill="#ffffff" className="anim-p-3" />

        <circle cx="250" cy="15" r="1.2" fill="#ffffff" className="anim-p-static" />
        <circle cx="320" cy="35" r="1" fill="#38bdf8" className="anim-p-static" />
        <circle cx="580" cy="25" r="1.2" fill="#ffffff" className="anim-p-static" />
        <circle cx="640" cy="15" r="1" fill="#00D880" className="anim-p-static" />
        <circle cx="810" cy="20" r="1.2" fill="#ffffff" className="anim-p-static" />
        <circle cx="860" cy="35" r="1" fill="#38bdf8" className="anim-p-static" />
      </g>
    </svg>
  );
}

interface DashboardProps {
  onStartNew: (type?: DocType) => void;
  onStartCatchUp?: () => void;
  onNavigate?: (section: string) => void;
  onOpenUserMonitor?: () => void;
}

export function Dashboard({ onStartNew, onStartCatchUp, onNavigate, onOpenUserMonitor }: DashboardProps) {
  const { user, logout, isWhitelisted, userType, subscriptionDetails, registeredGrades } = useAuth();
  const isDeveloper = userType === 'developer' || isDeveloperEmail(user?.email);

  const formatDateStamp = (date: any) => {
    if (!date) return 'N/A';
    let d: Date | null = null;
    if (date instanceof Date) d = date;
    else if (typeof date?.toDate === 'function') d = date.toDate();
    else if (typeof date === 'number') d = new Date(date);
    else if (date?.seconds !== undefined) d = new Date(date.seconds * 1000);
    else if (date?._seconds !== undefined) d = new Date(date._seconds * 1000);
    else d = new Date(date);

    if (!d || isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCircleName = (type: string) => {
    switch (type) {
      case 'weekly': return 'Weekly Circle';
      case '14days': return '14 Days Circle';
      case 'monthly': return 'Monthly Circle';
      case 'termly': return 'Termly Circle';
      case 'unlimited': return 'Unlimited Access (Lifetime)';
      default: return type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Trial Access';
    }
  };

  const formatUserGrades = (grades: string[]) => {
    return 'All Grades';
  };

  const [mobileEmail, setMobileEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCbcCollapsed, setIsCbcCollapsed] = useState(false);
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(false);
  const [isObeCollapsed, setIsObeCollapsed] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const [isCompactCard, setIsCompactCard] = useState(false);

  const categories = DOC_TEMPLATES;
  const userCleanEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
  const isDev = userType === 'developer' || isDeveloperEmail(userCleanEmail) || userCleanEmail === ADMIN_EMAIL.toLowerCase().trim();
  const isUserGuestTier = (!isWhitelisted && userType === 'guest' && !isDev);
  
  const subType = subscriptionDetails?.subscriptionType || (isDev ? 'unlimited' : 'guest_trial');
  const isExpired = !isDev && !!subscriptionDetails?.isSubscriptionExpired;
  const hasAssignmentHubAccess = isDev || (isWhitelisted && !isExpired && (subType === 'termly' || subType === 'unlimited'));

  const currentPlan = useMemo(() => {
    if (isDev) return SUBSCRIPTION_PLANS.unlimited;
    if (!subscriptionDetails?.subscriptionType) return SUBSCRIPTION_PLANS.guest_trial;
    return SUBSCRIPTION_PLANS[subscriptionDetails.subscriptionType] || SUBSCRIPTION_PLANS.monthly;
  }, [subscriptionDetails, isDev]);
  const allowedTypesTierA = ['schemes_of_work', 'weekly_forecast', 'lesson_plan'];

  const isRestricted = (id: string) => {
    // Under open access policy, all users (subscribed or trial) can access and explore all generators
    return false;
  };

  const getFirstName = () => {
    if (!user) return "Teacher's portal";
    if (user.displayName) return user.displayName.split(' ')[0];
    return user.email?.split('@')[0] || "Teacher's portal";
  };

  const handleMobileLinkRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileEmail) return;
    setIsSubmitting(true);
    // Simulate sending a secure link that would contain a signed APK for Android
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setMobileEmail('');
    }, 1500);
  };

  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const tabSets = [
    [
      { id: 'schemes_of_work', type: 'template' },
      { id: 'weekly_forecast', type: 'template' },
      { id: 'lesson_plan', type: 'template' },
      { id: 'catch_up', type: 'catch_up' },
      { id: 'lesson_notes', type: 'template' },
      { id: 'assessments', type: 'template' },
      { id: 'research', type: 'research' },
      { id: 'individual_work_plan', type: 'template' },
      { id: 'syllabi', type: 'template' },
      { id: 'records_of_work', type: 'template' },
      { id: 'video_script', type: 'template' },
      { id: 'settings', type: 'settings' }
    ]
  ];

  const nextSet = () => {
    setCurrentSetIndex((prev) => (prev + 1) % tabSets.length);
  };

  const prevSet = () => {
    setCurrentSetIndex((prev) => (prev - 1 + tabSets.length) % tabSets.length);
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto pt-5 sm:pt-6 pb-16 px-4 sm:px-8 md:px-12 lg:px-16 space-y-8 sm:space-y-12 relative overflow-x-hidden min-h-full flex flex-col">
      <ReviewSystem 
        showFloatingButton={false} 
        isExternalOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />
      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
      <div className="flex-1 flex flex-col space-y-8 sm:space-y-12">
        {/* Header Profile Section */}
        <div className="flex flex-col gap-4 mb-4 mt-1 animate-in fade-in duration-500">
        <div className="space-y-4">
          <div className="flex flex-col gap-0.5 pl-1.5 sm:pl-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">FORTUNES EDUTECH</span>
            <span className="text-[10px] text-[#00A86B] font-bold tracking-wider lowercase">plan competently.</span>
          </div>
          <div className="space-y-2.5 pt-2">
            <h1 className="text-xs md:text-sm font-bold text-slate-900 tracking-widest uppercase leading-none">
              WELCOME BACK, <span className="text-[#00A86B] font-extrabold">{getFirstName()}</span>
            </h1>
            <ColorWaveText />
          </div>
        </div>
        
        <div className="w-full">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs w-full">
            <div className="text-right hidden lg:block pl-2 shrink-0">
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5">{user?.displayName || 'Teacher'}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{user?.email}</p>
            </div>

            <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap w-full">
              {/* Download Latest E-Payslip Link */}
              <a
                href="https://epdmis.grz.gov.zm/request-payslip/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center gap-1 hover:bg-blue-100 transition-all shadow-2xs border border-blue-200 group flex-1 min-w-0"
                title="Download latest e-payslip"
              >
                <FileText size={12} className="text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight whitespace-nowrap">E-PAYSLIP</span>
                <ExternalLink size={10} className="text-blue-500 opacity-80 shrink-0" />
              </a>

              {/* Pulsing Heart Button next to profile picture */}
              <motion.button
                onClick={() => setIsReviewModalOpen(true)}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-red-50 text-red-600 flex items-center justify-center gap-1 hover:bg-red-100 transition-all shadow-2xs border border-red-100 group flex-1 min-w-0"
                title="Recommend our app"
              >
                <Heart fill="currentColor" size={12} className="group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight whitespace-nowrap">Review</span>
              </motion.button>

              {/* LISTEN DUAL PLAYBACK Shortcut Button replacing Video Demos */}
              <button
                onClick={() => setIsVoiceGuideOpen(true)}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-[#00A86B] hover:bg-emerald-700 text-white flex items-center justify-center gap-1 hover:scale-102 transition-all shadow-2xs border border-emerald-500 group flex-1 min-w-0 cursor-pointer font-black"
                title="Listen to Fortunes Edutech App Intro Dual Voice Playback"
              >
                <Play size={11} fill="currentColor" className="text-white shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight whitespace-nowrap">LISTEN DUAL PLAYBACK</span>
              </button>

              {/* Active Grades Tab next to Review */}
              {!isUserGuestTier && (
                <div className="min-h-8 h-8 py-0.5 px-2 sm:px-3 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center gap-1.5 hover:bg-indigo-100 border border-indigo-100 transition-all shadow-2xs flex-1 min-w-0">
                  <Sparkles size={11} className="text-indigo-600 shrink-0" />
                  <div className="flex flex-col text-left min-w-0">
                    <p className="text-[6px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Your Grades</p>
                    <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-tight leading-none truncate" title={formatUserGrades(registeredGrades)}>
                      {formatUserGrades(registeredGrades)}
                    </p>
                  </div>
                </div>
              )}

              {/* App Full Access Button */}
              <div className="relative pt-1 flex-1 min-w-0">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-emerald-600 text-white text-[6px] font-black uppercase rounded tracking-wider shadow-2xs border border-emerald-500 whitespace-nowrap pointer-events-none z-10">
                  PACKAGES
                </div>
                <motion.button
                  onClick={() => setIsAccessModalOpen(true)}
                  className="h-8 sm:h-9 w-full px-2 sm:px-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center gap-1 hover:bg-emerald-100 transition-all shadow-2xs border border-emerald-100 group font-black"
                  title="App Full Access & Pricing"
                >
                  <span className="text-xs">♿</span>
                  <span className="text-[8px] sm:text-[9.5px] font-black uppercase tracking-tight whitespace-nowrap">Access</span>
                </motion.button>
              </div>

              <div className="relative shrink-0">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-emerald-100 shadow-sm transform hover:rotate-3 transition-transform cursor-pointer object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-auto pt-8"
        >
          <ReviewTicker className="w-full" />
        </motion.div>
      </div>

      {/* Grouped core sections with tighter vertical spacing for compact, beautiful layout */}
      <div className="space-y-2 sm:space-y-3 flex flex-col w-full">
        {/* Identity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-[#050e14] bg-[#050e14]/95 bg-gradient-to-b from-[#02131b] to-[#041a24] rounded-2xl px-5 relative overflow-hidden shadow-lg border border-white/15 mb-0 group transition-all duration-300",
            isCompactCard ? "py-2.5 sm:py-3" : "py-3.5 sm:py-4"
          )}
        >
          {/* Full-coverage premium particle waves background */}
          <ParticleWavesBg className="opacity-95" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            {/* Left Area: Portal Status & Subscription Details */}
            <div className="flex items-center gap-3.5 flex-wrap min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Portal: Active</span>
                  <span className="text-[10px] text-white/40">•</span>
                  <span className="text-[10px] font-bold text-slate-300 tracking-wide">Verified Educator Session</span>
                </div>
                
                {/* Subscription details with strict vertical stacking */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-white font-black px-2.5 py-0.5 rounded-lg border text-[10px] inline-block uppercase tracking-widest shadow-sm",
                      isUserGuestTier 
                        ? "bg-slate-500/20 border-slate-500/30 text-slate-300" 
                        : "bg-emerald-500/20 border-emerald-500/40 text-[#00A86B]"
                    )}>
                      {isUserGuestTier ? 'Trial Access (6 Downloads)' : (isDev ? 'Master Developer Access (Unlimited)' : currentPlan.label)}
                    </span>
                    {isUserGuestTier && (
                      <button 
                        onClick={() => setIsAccessModalOpen(true)}
                        className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border border-amber-500/40 text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={9} className="animate-spin" style={{ animationDuration: '4s' }} />
                        Verify Activation
                      </button>
                    )}
                    {!isUserGuestTier && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                          (subscriptionDetails?.isSubscriptionExpired && !isDev)
                            ? "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse"
                            : "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                        )}>
                          {(subscriptionDetails?.isSubscriptionExpired && !isDev)
                            ? 'Cycle Ended'
                            : (isDev || subscriptionDetails?.subscriptionType === 'unlimited'
                                ? 'Lifetime Unlocked'
                                : `${subscriptionDetails?.daysRemaining ?? 0}d left`)}
                        </span>
                        {subscriptionDetails?.isQuotaExhausted && !isDev && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border text-amber-300 bg-amber-500/10 border-amber-500/30">
                            Quota Reached ({subscriptionDetails.circleDownloadsCount || 0}/{subscriptionDetails.circleDownloadsLimit})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!isUserGuestTier && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold text-slate-300 w-full pt-1">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full shrink-0" />
                          Activated: <strong className="text-white font-black">{isDev ? 'Master Developer Key (Permanent)' : formatDateStamp(subscriptionDetails?.subscriptionStart)}</strong>
                        </span>
                        {subscriptionDetails?.amountPaid !== undefined && (
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full shrink-0" />
                            Amount Paid: <strong className="text-cyan-200 font-black">ZMK {subscriptionDetails.amountPaid}</strong>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 sm:items-end sm:text-right">
                        {!isDev && subscriptionDetails?.subscriptionEnd && (
                          <span className="flex items-center sm:justify-end gap-1.5 text-amber-300">
                            <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full shrink-0" />
                            <span>{subscriptionDetails.isSubscriptionExpired ? 'Ended on:' : 'Cycle ends:'} <strong className="text-amber-200 font-black">{formatDateStamp(subscriptionDetails?.subscriptionEnd)}</strong></span>
                          </span>
                        )}
                        {subscriptionDetails?.circleDownloadsLimit !== undefined && subscriptionDetails?.circleDownloadsLimit < 999999 && (
                          <span className="flex items-center sm:justify-end gap-1.5 text-purple-300">
                            <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full shrink-0" />
                            <span>Circle Downloads: <strong className="text-purple-200 font-black">{subscriptionDetails.circleDownloadsCount || 0} / {subscriptionDetails.circleDownloadsLimit} docs</strong></span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Area: Action Buttons (Receipt, Sign Out, Sizing Toggle) */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto justify-end">
              {user?.email?.toLowerCase().trim() === ADMIN_EMAIL && user?.uid !== 'guest_teacher' && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenUserMonitor?.()}
                  className="flex items-center justify-center gap-1 py-1 px-2.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/20 transition-all shadow-sm"
                >
                  <Users size={11} className="text-white" />
                  Monitor
                </motion.button>
              )}

              {/* For standard users: prominent Register Access Button circled in white */}
              {user?.email?.toLowerCase().trim() !== ADMIN_EMAIL && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAccessModalOpen(true)}
                  className="flex items-center justify-center gap-1 py-1 px-2.5 bg-white text-emerald-900 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-wider rounded-lg border border-emerald-200 transition-all shadow-sm cursor-pointer"
                >
                  <Users size={11} className="text-emerald-700 animate-pulse" />
                  Register Access
                </motion.button>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsReceiptsOpen(true)}
                className="flex items-center justify-center gap-1 py-1 px-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg border border-emerald-400/20 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
              >
                <Receipt size={11} className="text-white" />
                Receipt
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCompactCard(!isCompactCard)}
                className="flex items-center justify-center gap-1 py-1 px-2.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/20 transition-all shadow-sm"
                title={isCompactCard ? "Expand card height" : "Compact card height"}
              >
                {isCompactCard ? <Maximize2 size={11} className="text-white" /> : <Minimize2 size={11} className="text-white" />}
                <span>{isCompactCard ? 'Expand' : 'Slim'}</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => logout()}
                className="py-1 px-2.5 bg-white/10 hover:bg-red-500/30 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border border-white/20 flex items-center gap-1 group"
                title="Sign Out"
              >
                <LogOut size={11} className="group-hover:rotate-12 transition-transform text-white" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Curriculum center section with smaller font, bold black, beautifully organized */}
        <div className="space-y-2 w-full flex flex-col mt-0">
          {/* Centered Heading with Special Monospace Typographic Style */}
          <div className="flex justify-center items-center gap-3 py-1.5 w-full text-center">
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
            <h3 
              className="font-black text-black uppercase select-none"
              style={{ fontSize: '13pt', letterSpacing: 'normal' }}
            >
              Curriculum center @2026.
            </h3>
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#050e14] bg-gradient-to-b from-[#02131b] to-[#041a24] p-4 sm:p-5 rounded-3xl shadow-xl border border-white/20 flex gap-6 sm:gap-10 overflow-x-auto w-full relative overflow-hidden group"
          >
            {/* Full-coverage premium particle waves background */}
            <ParticleWavesBg className="opacity-95" />
            
            <div 
              className="space-y-2 flex-1 min-w-[120px] cursor-pointer select-none relative z-10"
              onClick={() => setIsCbcCollapsed(!isCbcCollapsed)}
            >
              <div className="flex items-center gap-2 pb-0.5 border-b border-white/10 w-full">
                <h4 className="text-white text-[9px] font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  CBC
                </h4>
                <motion.div animate={{ rotate: isCbcCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isCbcCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1.5 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. ECE level 1",
                      "2. ECE level 2",
                      "3. Grade: 1-3",
                      "4. Grade: 4-6"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-100 uppercase tracking-wide whitespace-nowrap">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="space-y-2 flex-1 min-w-[120px] cursor-pointer select-none relative z-10"
              onClick={() => setIsSecondaryCollapsed(!isSecondaryCollapsed)}
            >
              <div className="flex items-center gap-2 pb-0.5 border-b border-white/10 w-full">
                <h4 className="text-white text-[9px] font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  Secondary
                </h4>
                <motion.div animate={{ rotate: isSecondaryCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isSecondaryCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1.5 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. Form 1 O Level",
                      "2. Form 2 O Level",
                      "3. Form 3 O Level",
                      "4. Form 4 O Level",
                      "5. Form 5-6 A Level"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[8px] xs:text-[9px] sm:text-[9.5px] font-bold text-slate-100 uppercase tracking-tighter whitespace-nowrap">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="space-y-2 flex-1 min-w-[120px] cursor-pointer select-none relative z-10"
              onClick={() => setIsObeCollapsed(!isObeCollapsed)}
            >
              <div className="flex items-center gap-2 pb-0.5 border-b border-white/10 w-full">
                <h4 className="text-white text-[9px] font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  OBC
                </h4>
                <motion.div animate={{ rotate: isObeCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isObeCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1.5 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. Grade 3",
                      "2. Grade 5",
                      "3. Grade 6",
                      "4. Grade 7",
                      "5. Grade 10-12"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[8px] xs:text-[9px] sm:text-[9.5px] font-bold text-slate-100 uppercase tracking-tighter whitespace-nowrap">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Centered Heading for smart planning tools with Special Monospace Typographic Style */}
          <div className="flex justify-center items-center gap-3 py-1.5 w-full text-center mt-1">
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
            <h3 
              className="font-black text-black uppercase select-none"
              style={{ fontSize: '13pt', letterSpacing: 'normal' }}
            >
              smart planning tools
            </h3>
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
          </div>
        </div>

      {/* Resource Carousel Slider (Four per Page) */}
      <div className="relative pb-6 px-0">
        {/* Absolute Background Panel containing Isometric Illustration with Rounded Corners & Shadow */}
        <div className="absolute inset-0 rounded-[2rem] border border-slate-200/50 shadow-xl shadow-slate-200/10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-slate-50/45 bg-gradient-to-tr from-slate-100/50 via-blue-50/20 to-emerald-50/20" />
          <IsometricDashboardBg />
        </div>

        <div className="relative p-5 sm:p-7 md:p-8">
          {/* Left Arrow */}
          {tabSets.length > 1 && (
            <button 
              onClick={prevSet}
              className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all select-none"
              title="Previous Tools"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Right Arrow */}
          {tabSets.length > 1 && (
            <button 
              onClick={nextSet}
              className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all select-none"
              title="Next Tools"
            >
              <ChevronRight size={16} />
            </button>
          )}

          <div className="relative overflow-hidden z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSetIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full justify-items-center grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
              >
              {tabSets[currentSetIndex].map((item) => {
                const theme = cardThemeMap[item.id] || {
                  bg: 'bg-white/80 border-slate-200/40 backdrop-blur-md',
                  text: 'text-slate-800',
                  hoverBorder: 'hover:border-slate-300 hover:bg-white',
                  iconBg: 'bg-slate-100 text-slate-600 border border-slate-200/20',
                  accentBg: 'bg-slate-600',
                  shadow: 'hover:shadow-slate-100'
                };

                if (item.type === 'catch_up') {
                  return (
                    <motion.button
                      key="catch_up"
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={isRestricted('catch_up') ? undefined : onStartCatchUp}
                      className={cn(
                        "p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none group w-full",
                        isRestricted('catch_up') ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80" : cn(theme.bg, theme.hoverBorder, theme.shadow, "cursor-pointer")
                      )}
                    >
                      <div 
                        className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform shadow-sm flex items-center justify-center shrink-0", 
                          isRestricted('catch_up') ? "bg-slate-200 text-slate-400" : cn("group-hover:rotate-12 group-hover:scale-110", theme.iconBg)
                        )}
                      >
                        {isRestricted('catch_up') ? <Lock size={12} /> : <EmojiForType type="catch_up" />}
                      </div>
                      <span className={cn("font-black text-[8.5px] xs:text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5", isRestricted('catch_up') ? "text-slate-400" : "text-slate-800")}>Catch-Up Lessons</span>
                      <div className={cn("absolute top-1 right-1 sm:top-2 sm:right-2 text-white text-[5.5px] sm:text-[6px] font-black uppercase px-1.5 sm:px-1.5 py-0.5 rounded-full shadow-xs border", isRestricted('catch_up') ? "bg-slate-400 border-slate-300" : "bg-[#00A86B] border-white/20")}>
                        {isRestricted('catch_up') ? "Locked" : "Planner"}
                      </div>
                    </motion.button>
                  );
                }

                if (item.type === 'research') {
                  return (
                    <motion.button
                      key="research"
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate?.('research')}
                      className={cn(
                        "p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none cursor-pointer group w-full",
                        theme.bg,
                        theme.hoverBorder,
                        theme.shadow
                      )}
                    >
                      <div 
                        className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-sm flex items-center justify-center shrink-0", theme.iconBg)}
                      >
                        <EmojiForType type="research" />
                      </div>
                      <span className="font-black text-[8.5px] xs:text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5 text-slate-800">Assignment & Research Writing Hub</span>
                      {hasAssignmentHubAccess ? (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-600 text-white text-[5.5px] sm:text-[6px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs border border-white/20 flex items-center gap-0.5">
                          <Sparkles size={7} />
                          Active
                        </div>
                      ) : (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-indigo-600 text-white text-[5.5px] sm:text-[6px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs border border-white/20 flex items-center gap-0.5">
                          <Lock size={7} />
                          Termly Only
                        </div>
                      )}
                    </motion.button>
                  );
                }

                if (item.type === 'settings') {
                  return (
                    <motion.button
                      key="settings"
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate?.('settings')}
                      className={cn(
                        "p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none cursor-pointer group w-full",
                        theme.bg,
                        theme.hoverBorder,
                        theme.shadow
                      )}
                    >
                      <div 
                        className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-sm flex items-center justify-center shrink-0", theme.iconBg)}
                      >
                        <EmojiForType type="settings" />
                      </div>
                      <span className="font-black text-[8.5px] xs:text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5 text-slate-800">Settings</span>
                    </motion.button>
                  );
                }

                const cat = categories.find((c) => c.id === item.id);
                if (!cat) return null;

                return (
                  <motion.button
                    key={cat.id}
                    whileHover={isRestricted(cat.id) ? {} : { scale: 1.04, y: -2 }}
                    whileTap={isRestricted(cat.id) ? {} : { scale: 0.98 }}
                    onClick={() => isRestricted(cat.id) ? toast.error("Access Restricted: This tool is locked for free trial users. Please subscribe to unlock all generators.") : onStartNew(cat.id)}
                    className={cn(
                      "p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none group w-full",
                      isRestricted(cat.id) ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80" : cn(theme.bg, theme.hoverBorder, theme.shadow, "cursor-pointer")
                    )}
                  >
                    <div 
                      className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform shadow-sm flex items-center justify-center shrink-0", 
                        isRestricted(cat.id) ? "bg-slate-200 text-slate-400" : cn("group-hover:rotate-12 group-hover:scale-110", theme.iconBg)
                      )}
                    >
                      {isRestricted(cat.id) ? <Lock size={12} /> : <EmojiForType type={cat.id} />}
                    </div>
                    <span className={cn("font-black text-[8.5px] xs:text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5", isRestricted(cat.id) ? "text-slate-400" : "text-slate-800")}>{cat.title}</span>
                    {cat.id === 'syllabi' && !isRestricted(cat.id) && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-600 text-white text-[5.5px] sm:text-[6px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs">
                        Library
                      </div>
                    )}
                    {isRestricted(cat.id) && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-slate-400 text-white text-[5.5px] sm:text-[6px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs">
                        Locked
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
        </div>

        {/* Slide Indicators / Dots */}
        {tabSets.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 relative z-20">
            {tabSets.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSetIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentSetIndex ? "bg-[#00A86B] w-5" : "bg-slate-300 hover:bg-slate-400"
                )}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Syllabus Integrity Audit Banner */}
      <motion.div 
        whileHover={{ scale: 1.002 }}
        className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500/40 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0 shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-emerald-500 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                CDC VERIFIED
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                100% SYLLABUS AUDIT
              </span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight uppercase truncate">
              Syllabus Integrity Audit & Library Panel
            </h4>
            <p className="text-slate-300 text-[11px] font-medium hidden md:block truncate max-w-xl">
              Side-by-side CDC syllabus verification, language health audits, and official Zambian curriculum library directory.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('syllabus_audit')}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer relative z-10 self-stretch sm:self-auto"
        >
          <span>Open Integrity Audit & Library</span>
          <ChevronRight size={14} />
        </button>
      </motion.div>

      {/* Assessment Record Tracker Summary Compact Tab */}
      <motion.div 
        whileHover={{ scale: 1.002 }}
        className="bg-gradient-to-r from-[#032532] via-[#0A3D50] to-[#021B25] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0 shadow-inner">
            <ClipboardList size={18} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                FEATURED
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                CLASSROOM RESULTS SUITE
              </span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight uppercase truncate">
              Assessment Tracker
            </h4>
            <p className="text-slate-300 text-[11px] font-medium hidden md:block truncate max-w-xl">
              Record learner scores (Boys/Girls max 20) and auto-calculate raw-to-% marks.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('assessment_tracker')}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer relative z-10 self-stretch sm:self-auto"
        >
          <span>Open Assessment Tracker</span>
          <ChevronRight size={14} />
        </button>
      </motion.div>

      {/* Three Square Accent Tabs in Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
        {/* 1. User manual */}
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate?.('user_manual')}
          className="p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none group w-full cursor-pointer bg-emerald-950 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-900/20 shadow-sm"
        >
          {/* Background image in full (object-contain) with vibrant green */}
          <img
            src="/images/fortunes_green_logo_1786220424646.jpg"
            alt="Fortunes Edutech logo background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-contain p-1.5 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 pointer-events-none z-0"
          />
          {/* Subtle gradient overlay to preserve white text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none" />

          <div className="relative z-20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-sm flex items-center justify-center shrink-0 bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            <BookOpen size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]" />
          </div>
          <span className="relative z-20 font-black text-[9px] xs:text-[10px] sm:text-xs md:text-[13px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
            User manual
          </span>
        </motion.button>

        {/* 2. Download & Installation */}
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate?.('downloads')}
          className="p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none group w-full cursor-pointer bg-emerald-950 border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-900/20 shadow-sm"
        >
          {/* Background image in full (object-contain) - crisp mockup */}
          <img
            src="/images/apk_download_bg_1786221217338.jpg"
            alt="APK Download & Installation background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-contain p-1.5 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 pointer-events-none z-0"
          />
          {/* Subtle gradient overlay to preserve white text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none" />

          <div className="relative z-20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-sm flex items-center justify-center shrink-0 bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            <Smartphone size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]" />
          </div>
          <span className="relative z-20 font-black text-[9px] xs:text-[10px] sm:text-xs md:text-[13px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
            Download & Installation
          </span>
        </motion.button>

        {/* 3. Whatsapp */}
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('https://wa.me/260961622222', '_blank')}
          className="p-2 sm:p-3 md:p-4 rounded-2xl sm:rounded-[1.6rem] md:rounded-[1.8rem] h-[82px] sm:h-[100px] md:h-[110px] flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg border-2 relative overflow-hidden select-none group w-full cursor-pointer bg-[#25D366] border-emerald-500/40"
        >
          {/* Background image */}
          <img
            src="/images/whatsapp_bg_1786218975337.jpg"
            alt="WhatsApp background"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 pointer-events-none z-0"
          />
          {/* Dark gradient overlay to preserve legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent z-10 pointer-events-none" />

          <div className="relative z-20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-sm flex items-center justify-center shrink-0 bg-white/20 text-white border border-white/30 backdrop-blur-sm">
            <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px]" />
          </div>
          <span className="relative z-20 font-black text-[9px] xs:text-[10px] sm:text-xs md:text-[13px] uppercase tracking-normal sm:tracking-widest leading-none sm:leading-tight line-clamp-2 max-w-full text-center px-0.5 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
            Whatsapp
          </span>
        </motion.button>
      </div>

      <ReceiptManager isOpen={isReceiptsOpen} onClose={() => setIsReceiptsOpen(false)} />

      {/* FORTUNES EDUTECH AI Voice Studio Modal */}
      {isVoiceGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#00A86B] animate-pulse" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    FORTUNES EDUTECH AI Voice Studio
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Dual-Voice Narration, Speed Controls & Audio Download
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVoiceGuideOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer"
                title="Close Voice Studio"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <AIPlanningVoiceGuide 
                toolType="app_intro" 
                toolTitle="FORTUNES EDUTECH App Intro & Platform Overview" 
                variant="card"
                className="shadow-none border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

function IconForType({ type }: { type: DocType }) {
  switch (type) {
    case 'lesson_plan': return <BookOpen size={13} />;
    case 'assessments': return <ClipboardList size={13} />;
    case 'syllabi': return <Layers size={13} />;
    case 'schemes_of_work': return <Calendar size={13} />;
    case 'weekly_forecast': return <Calendar size={13} />;
    case 'records_of_work': return <HistoryIcon size={13} />;
    case 'individual_work_plan': return <FileText size={13} />;
    case 'lesson_notes': return <BookMarked size={13} />;
    default: return <FileText size={13} />;
  }
}
