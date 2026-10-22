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
import { DOC_TEMPLATES, DocType, ADMIN_EMAIL, SUBSCRIPTION_PLANS, isDeveloperEmail, APP_VERSION } from '../constants';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './FirebaseProvider';
import { toast } from 'react-hot-toast';
import { ReviewSystem, ReviewTicker } from './ReviewSystem';
import { ColorWaveText } from './ColorWaveText';
import { AccessModal } from './AccessModal';
import { SchoolCircleWidget } from './SchoolCircleWidget';
import ReceiptManager from './ReceiptManager';
import { IsometricDashboardBg } from './IsometricDashboardBg';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';
import { MtnMoMoLogo, AirtelLogo, ZamtelLogo } from './NetworkLogos';


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
  },
  curriculum_planning_hub: {
    bg: 'bg-white/85 bg-gradient-to-br from-emerald-50/70 to-white/95 border-emerald-500/30 backdrop-blur-md',
    text: 'text-emerald-700',
    hoverBorder: 'hover:border-emerald-500/60 hover:bg-white',
    iconBg: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20',
    accentBg: 'bg-emerald-500',
    shadow: 'hover:shadow-emerald-500/10 shadow-sm shadow-slate-200/50'
  },
  instructional_delivery_hub: {
    bg: 'bg-white/85 bg-gradient-to-br from-blue-50/70 to-white/95 border-blue-500/30 backdrop-blur-md',
    text: 'text-blue-700',
    hoverBorder: 'hover:border-blue-500/60 hover:bg-white',
    iconBg: 'bg-blue-500/15 text-blue-600 border border-blue-500/20',
    accentBg: 'bg-blue-500',
    shadow: 'hover:shadow-blue-500/10 shadow-sm shadow-slate-200/50'
  },
  research_video_task_hub: {
    bg: 'bg-white/85 bg-gradient-to-br from-purple-50/70 to-white/95 border-purple-500/30 backdrop-blur-md',
    text: 'text-purple-700',
    hoverBorder: 'hover:border-purple-500/60 hover:bg-white',
    iconBg: 'bg-purple-500/15 text-purple-600 border border-purple-500/20',
    accentBg: 'bg-purple-500',
    shadow: 'hover:shadow-purple-500/10 shadow-sm shadow-slate-200/50'
  },
  teacher_resources_hub: {
    bg: 'bg-white/85 bg-gradient-to-br from-indigo-50/70 to-white/95 border-indigo-500/30 backdrop-blur-md',
    text: 'text-indigo-700',
    hoverBorder: 'hover:border-indigo-500/60 hover:bg-white',
    iconBg: 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20',
    accentBg: 'bg-indigo-500',
    shadow: 'hover:shadow-indigo-500/10 shadow-sm shadow-slate-200/50'
  },
  whatsapp: {
    bg: 'bg-[#25D366]/10 bg-gradient-to-br from-[#E1F4E7] to-white/95 border-[#25D366]/30 backdrop-blur-md',
    text: 'text-[#128C7E]',
    hoverBorder: 'hover:border-[#25D366] hover:bg-white',
    iconBg: 'bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30',
    accentBg: 'bg-[#25D366]',
    shadow: 'hover:shadow-[#25D366]/10 shadow-sm shadow-slate-200/50'
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
  const { 
    user, 
    logout, 
    isWhitelisted, 
    userType, 
    subscriptionDetails, 
    registeredGrades,
    schoolCircle,
    schoolTeacher,
    isSchoolRepresentative,
    refreshSchoolCircle
  } = useAuth();
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
      case 'termly_individual': return 'Individual Termly Circle';
      case 'termly': return 'Whole School Termly Circle';
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
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Zamtel Kwacha' | undefined>(undefined);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [isVoiceGuideOpen, setIsVoiceGuideOpen] = useState(false);
  const [isCompactCard, setIsCompactCard] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  const categories = DOC_TEMPLATES;
  const userCleanEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '') || '';
  const isDev = userType === 'developer' || isDeveloperEmail(userCleanEmail) || userCleanEmail === ADMIN_EMAIL.toLowerCase().trim();
  const isUserGuestTier = (!isWhitelisted && userType === 'guest' && !isDev);
  
  const subType = subscriptionDetails?.subscriptionType || (isDev ? 'unlimited' : 'guest_trial');
  const isExpired = !isDev && !!subscriptionDetails?.isSubscriptionExpired;
  const hasAssignmentHubAccess = isDev || (isWhitelisted && !isExpired && (subType === 'termly' || subType === 'unlimited'));

  const currentPlan = useMemo(() => {
    if (isDev) return { label: 'Developer Master Key', price: 0, limit: 999999, durationDays: 3650, colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-100' };
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
      { id: 'curriculum_planning_hub', type: 'hub' },
      { id: 'instructional_delivery_hub', type: 'hub' },
      { id: 'research_video_task_hub', type: 'hub' },
      { id: 'teacher_resources_hub', type: 'hub' },
      { id: 'whatsapp', type: 'whatsapp' },
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
    <div className="w-full max-w-7xl mx-auto pt-2.5 sm:pt-4 pb-16 px-3 sm:px-5 md:px-6 space-y-3 sm:space-y-4 relative overflow-x-hidden min-h-full flex flex-col">
      <ReviewSystem 
        showFloatingButton={false} 
        isExternalOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />
      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
        initialNetwork={selectedPaymentNetwork}
      />
      <div className="flex-1 flex flex-col space-y-3 sm:space-y-4">
        {/* Header Profile Section */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-1 mt-0.5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-col gap-0.5 pl-0.5 sm:pl-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">FORTUNES EDUTECH</span>
              <span className="text-[9.5px] sm:text-[11px] text-[#00A86B] font-bold tracking-wider lowercase">your CBC partner</span>
            </div>
            <div className="space-y-1 pt-0.5">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-widest uppercase leading-none">
                WELCOME BACK, <span className="text-[#00A86B] font-extrabold">
                  {schoolCircle ? `${schoolCircle.schoolName} (${schoolTeacher?.name || user?.displayName || getFirstName()})` : getFirstName()}
                </span>
              </h1>
              <ColorWaveText />
            </div>
          </div>
        </div>
        
        <div className="w-full">
          <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 bg-white py-1 px-1.5 sm:py-1.5 sm:px-2.5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs w-full">
            <div className="text-right hidden lg:block pl-2 shrink-0">
              <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5">{user?.displayName || 'Teacher'}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{user?.email}</p>
            </div>

            <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2 flex-nowrap w-full min-w-0">
              {/* Download Latest E-Payslip Link */}
              <a
                href="https://epdmis.grz.gov.zm/request-payslip/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-7.5 sm:h-8 px-1.5 xs:px-2 sm:px-3 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center gap-1 hover:bg-blue-100 transition-all shadow-2xs border border-blue-200 group flex-1 min-w-0 cursor-pointer"
                title="Download latest e-payslip"
              >
                <FileText className="w-3 h-3 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate whitespace-nowrap">PAYSLIP</span>
                <ExternalLink className="hidden xs:inline w-2.5 h-2.5 text-blue-500 opacity-80 shrink-0" />
              </a>

              {/* Review Button - In Green as indicated */}
              <motion.button
                onClick={() => setIsReviewModalOpen(true)}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-7.5 sm:h-8 px-1.5 xs:px-2 sm:px-3 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center gap-1 hover:bg-emerald-100 transition-all shadow-2xs border border-emerald-200 group flex-1 min-w-0 cursor-pointer"
                title="Recommend our app"
              >
                <Heart fill="currentColor" className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate whitespace-nowrap">Review</span>
              </motion.button>

              {/* LISTEN DUAL PLAYBACK Button - In Blue as requested */}
              <button
                onClick={() => setIsVoiceGuideOpen(true)}
                className="h-7.5 sm:h-8 px-1.5 xs:px-2 sm:px-3 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 hover:scale-102 transition-all shadow-2xs border border-blue-500 group flex-1 min-w-0 cursor-pointer font-black"
                title="Listen to Fortunes Edutech App Intro Dual Voice Playback"
              >
                <Play size={11} fill="currentColor" className="text-white shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate whitespace-nowrap">
                  PLAYBACK
                </span>
              </button>

              {/* Dual App Install Chooser Button */}
              <button
                onClick={() => {
                  if (typeof (window as any).openAppInstallModal === 'function') {
                    (window as any).openAppInstallModal();
                  } else if (onNavigate) {
                    onNavigate('downloads');
                  }
                }}
                className="h-7.5 sm:h-8 px-1.5 xs:px-2 sm:px-3 rounded-lg sm:rounded-xl bg-emerald-50 text-[#00A86B] hover:bg-emerald-100 flex items-center justify-center gap-1 transition-all shadow-2xs border border-emerald-200 group flex-1 min-w-0 cursor-pointer font-black"
                title="Install Official Web App (PWA)"
              >
                <Download size={11} className="text-[#00A86B] group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[8.5px] xs:text-[9.5px] sm:text-xs font-black uppercase tracking-tight truncate whitespace-nowrap">
                  INSTALL APP
                </span>
              </button>

              {/* Profile Avatar - Preserved in good prominent size to be clearly seen */}
              <div className="relative shrink-0 ml-0.5">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-slate-200 shadow-xs transform hover:rotate-3 transition-transform cursor-pointer object-cover ring-1 ring-slate-100" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-auto pt-0.5"
        >
          <ReviewTicker className="w-full" />
        </motion.div>

        {/* Quick App Install Alert Bar */}
        <div className="w-full bg-white rounded-2xl border border-emerald-200 shadow-xs p-2 sm:p-2.5 flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 p-0.5 shrink-0 flex items-center justify-center">
              <img 
                src="/favicon.ico" 
                alt="Fortunes Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo192.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                Install Official Web App (PWA)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 ml-auto flex-wrap sm:flex-nowrap justify-end">
            {/* Quick Network USSD Pay with Pop-up */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentNetwork('MTN Mobile Money');
                    setIsAccessModalOpen(true);
                  }}
                  title="Pay with MTN MoMo (*115# Pop-up)"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-2xs border border-amber-300/80 bg-[#FFC700] p-0.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <MtnMoMoLogo className="w-full h-full rounded-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentNetwork('Airtel Money');
                    setIsAccessModalOpen(true);
                  }}
                  title="Pay with Airtel (*115# Pop-up)"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-2xs border border-rose-300/80 bg-[#ED1B24] p-0.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <AirtelLogo className="w-full h-full rounded-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentNetwork('Zamtel Kwacha');
                    setIsAccessModalOpen(true);
                  }}
                  title="Pay with Zamtel (*115# Pop-up)"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-2xs border border-emerald-300/80 bg-[#00A84D] p-0.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <ZamtelLogo className="w-full h-full rounded-xs" />
                </button>
              </div>
              <p className="text-[7px] sm:text-[7.5px] font-black text-slate-800 tracking-tight text-center uppercase whitespace-nowrap mt-1 leading-none animate-dim-1s">
                choose network &amp; pay with pop-up
              </p>
            </div>

            <button
              onClick={() => {
                if (typeof (window as any).openAppInstallModal === 'function') {
                  (window as any).openAppInstallModal();
                } else if (onNavigate) {
                  onNavigate('downloads');
                }
              }}
              className="bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-3 sm:px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Download size={12} />
              <span>Install Web App (PWA)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grouped core sections with tighter vertical spacing for compact, beautiful layout */}
      <div className="space-y-2.5 sm:space-y-3.5 flex flex-col w-full">
        {/* Whole School Termly Circle Hub */}
        {schoolCircle && (
          <SchoolCircleWidget
            schoolCircle={schoolCircle}
            currentTeacherEmail={user?.email}
            isRepresentative={isSchoolRepresentative}
            onRefresh={refreshSchoolCircle}
            className="mb-1"
          />
        )}

        {/* Identity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-[#050e14] bg-[#050e14]/95 bg-gradient-to-b from-[#02131b] to-[#041a24] rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 relative overflow-hidden shadow-lg border border-white/15 mb-0 group transition-all duration-300",
            isCompactCard ? "py-2.5 sm:py-3.5" : "py-3 sm:py-4"
          )}
        >
          {/* Full-coverage premium particle waves background */}
          <ParticleWavesBg className="opacity-95" />
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 relative z-10">
            {/* Left Area: Portal Status & Subscription Details */}
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner mt-0.5 sm:mt-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 space-y-1 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] xs:text-[11.5px] sm:text-xs font-black uppercase tracking-wider text-emerald-400">Portal: Active</span>
                  <span className="text-[9.5px] text-white/40">•</span>
                  <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-slate-300 tracking-wide truncate">Verified Educator Session</span>
                </div>
                
                {/* Subscription details with strict vertical stacking */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-white font-black px-2 sm:px-2.5 py-0.5 rounded-lg border text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] inline-block uppercase tracking-wider shadow-sm",
                      isUserGuestTier 
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                        : "bg-emerald-500/20 border-emerald-500/40 text-[#00A86B]"
                    )}>
                      {isUserGuestTier ? 'Free View-Only Trial' : (isDev ? 'Master Developer Access (Unlimited)' : currentPlan.label)}
                    </span>
                    {isUserGuestTier && (
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-1.5 py-0.5 rounded text-[9px] xs:text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider border border-[#00A86B]/40 text-emerald-300 bg-[#00A86B]/15 hover:bg-[#00A86B]/25 transition-all flex items-center gap-1 cursor-pointer"
                        title="Click here to manually refresh if you were just activated by an Admin"
                      >
                        <RefreshCw size={9} className="animate-spin" style={{ animationDuration: '4s' }} />
                        Verify Activation
                      </button>
                    )}
                    {!isUserGuestTier && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider border",
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
                          <span className="px-1.5 py-0.5 rounded text-[9px] xs:text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider border text-amber-300 bg-amber-500/10 border-amber-500/30">
                            Quota ({subscriptionDetails.circleDownloadsCount || 0}/{subscriptionDetails.circleDownloadsLimit})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[9.5px] xs:text-[10.5px] sm:text-xs font-bold text-slate-300 w-full pt-0.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full shrink-0" />
                        Activated: <strong className="text-white font-black">{isDev ? 'Master Developer Key' : (isUserGuestTier ? 'Pending Verification' : formatDateStamp(subscriptionDetails?.subscriptionStart))}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-300 truncate">
                        <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full shrink-0" />
                        Amount Paid: <strong className="text-cyan-200 font-black">ZMK {isUserGuestTier ? '0 (Free View-Only)' : (subscriptionDetails?.amountPaid ?? 0)}</strong>
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:items-end sm:text-right">
                      {(!isDev && !isUserGuestTier && subscriptionDetails?.subscriptionEnd) ? (
                        <span className="flex items-center sm:justify-end gap-1.5 text-amber-300 truncate">
                          <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full shrink-0" />
                          <span>{subscriptionDetails.isSubscriptionExpired ? 'Ended:' : 'Cycle ends:'} <strong className="text-amber-200 font-black">{formatDateStamp(subscriptionDetails?.subscriptionEnd)}</strong></span>
                        </span>
                      ) : (isUserGuestTier) ? (
                        <span className="flex items-center sm:justify-end gap-1.5 text-amber-300 truncate">
                          <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full shrink-0" />
                          <span>Cycle ends: <strong className="text-amber-200 font-black">N/A</strong></span>
                        </span>
                      ) : null}
                      {isUserGuestTier ? (
                        <span className="flex items-center sm:justify-end gap-1.5 text-amber-300 truncate font-extrabold uppercase tracking-wider text-[9px]">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 animate-ping" />
                          <span>Downloads: <strong className="text-amber-200 font-black">Upgrade to Download Word/PDF</strong></span>
                        </span>
                      ) : (subscriptionDetails?.circleDownloadsLimit !== undefined && subscriptionDetails?.circleDownloadsLimit < 999999) && (
                        <span className="flex items-center sm:justify-end gap-1.5 text-purple-300 truncate">
                          <span className="w-1.5 h-1.5 bg-purple-400/60 rounded-full shrink-0" />
                          <span>Circle Downloads: <strong className="text-purple-200 font-black">{subscriptionDetails?.circleDownloadsCount || 0}/{subscriptionDetails?.circleDownloadsLimit} docs</strong></span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area: Action Buttons in an equal, proportional grid that fits all phone sizes */}
            <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
              {isDev && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenUserMonitor?.()}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border border-indigo-400/40 transition-all shadow-md cursor-pointer"
                >
                  <Users size={12} className="text-white shrink-0" />
                  <span className="truncate">Monitor</span>
                </motion.button>
              )}

              {/* For standard users: Register Access Button */}
              {!isDev && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAccessModalOpen(true)}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white text-emerald-900 hover:bg-emerald-50 text-[9.5px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border border-emerald-200 transition-all shadow-sm cursor-pointer"
                >
                  <Users size={12} className="text-emerald-700 animate-pulse shrink-0" />
                  <span className="truncate">Access</span>
                </motion.button>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsReceiptsOpen(true)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-[#00A86B] hover:bg-emerald-600 text-white text-[9.5px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border border-emerald-400/20 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
              >
                <Receipt size={12} className="text-white shrink-0" />
                <span className="truncate">Receipt</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCompactCard(!isCompactCard)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white text-[9.5px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl border border-white/20 transition-all shadow-sm cursor-pointer"
                title={isCompactCard ? "Expand card height" : "Compact card height"}
              >
                {isCompactCard ? <Maximize2 size={12} className="text-white shrink-0" /> : <Minimize2 size={12} className="text-white shrink-0" />}
                <span className="truncate">{isCompactCard ? 'Expand' : 'Slim'}</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => logout()}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white/10 hover:bg-red-500/30 text-white text-[9.5px] xs:text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl transition-all border border-white/20 group cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={12} className="group-hover:rotate-12 transition-transform text-white shrink-0" />
                <span className="truncate">Sign Out</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Curriculum center section with clean bold typography and responsive 3-column layout */}
        <div className="space-y-2 w-full flex flex-col mt-0.5">
          {/* Centered Heading */}
          <div className="flex justify-center items-center gap-2.5 py-1 w-full text-center">
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
            <h3 className="text-xs xs:text-sm sm:text-base font-black text-black uppercase tracking-wider select-none">
              Curriculum center @2026.
            </h3>
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#050e14] bg-gradient-to-b from-[#02131b] to-[#041a24] p-3 xs:p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 grid grid-cols-3 gap-2 xs:gap-3 sm:gap-6 w-full relative overflow-hidden group"
          >
            {/* Full-coverage premium particle waves background */}
            <ParticleWavesBg className="opacity-95" />
            
            <div 
              className="space-y-1.5 sm:space-y-2 min-w-0 cursor-pointer relative z-10"
              onClick={() => setIsCbcCollapsed(!isCbcCollapsed)}
            >
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/15 w-full">
                <h4 className="text-white text-[10.5px] xs:text-[11.5px] sm:text-xs font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  PRIMARY
                </h4>
                <motion.div animate={{ rotate: isCbcCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80 shrink-0" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isCbcCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. ECE LVL 1",
                      "2. ECE LVL 2",
                      "3. GRD 1 - 6"
                    ].map((item, i) => (
                      <div key={`ece-${i}`} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-bold text-slate-100 uppercase tracking-tight truncate">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="space-y-1.5 sm:space-y-2 min-w-0 cursor-pointer relative z-10"
              onClick={() => setIsSecondaryCollapsed(!isSecondaryCollapsed)}
            >
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/15 w-full">
                <h4 className="text-white text-[10.5px] xs:text-[11.5px] sm:text-xs font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  O'LEVEL
                </h4>
                <motion.div animate={{ rotate: isSecondaryCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80 shrink-0" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isSecondaryCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. FORM 1",
                      "2. FORM 2",
                      "3. FORM 3",
                      "4. FORM 4"
                    ].map((item, i) => (
                      <div key={`form-${i}`} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-bold text-slate-100 uppercase tracking-tight truncate">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="space-y-1.5 sm:space-y-2 min-w-0 cursor-pointer relative z-10"
              onClick={() => setIsObeCollapsed(!isObeCollapsed)}
            >
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/15 w-full">
                <h4 className="text-white text-[10.5px] xs:text-[11.5px] sm:text-xs font-black uppercase tracking-wider leading-none whitespace-nowrap">
                  A'LEVEL
                </h4>
                <motion.div animate={{ rotate: isObeCollapsed ? 0 : 180 }}>
                  <ChevronRight size={12} className="text-white/80 shrink-0" />
                </motion.div>
              </div>
              <AnimatePresence>
                {!isObeCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col gap-1 pl-0.5 overflow-hidden"
                  >
                    {[
                      "1. FORM 5",
                      "2. FORM 6"
                    ].map((item, i) => (
                      <div key={`alevel-${i}`} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full shrink-0 shadow-sm" />
                        <p className="text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-bold text-slate-100 uppercase tracking-tight truncate">{item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Centered Heading for smart planning tools */}
          <div className="flex justify-center items-center gap-2.5 py-1 w-full text-center mt-1">
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
            <h3 className="text-xs xs:text-sm sm:text-base font-black text-black uppercase tracking-wider select-none">
              smart planning tools
            </h3>
            <span className="w-2 h-2 rounded-full bg-black shadow-[0_0_4px_rgba(0,0,0,0.5)] animate-pulse" />
          </div>
        </div>

      {/* Resource Carousel Slider */}
      <div className="relative pb-2 px-0 mb-1">
        {/* Absolute Background Panel containing Isometric Illustration */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/15 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-slate-50/50 bg-gradient-to-tr from-slate-100/60 via-blue-50/30 to-emerald-50/30" />
          <IsometricDashboardBg />
        </div>

        <div className="relative p-2.5 xs:p-3 sm:p-5 md:p-6">
          {/* Left Arrow */}
          {tabSets.length > 1 && (
            <button 
              onClick={prevSet}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all select-none cursor-pointer"
              title="Previous Tools"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Right Arrow */}
          {tabSets.length > 1 && (
            <button 
              onClick={nextSet}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all select-none cursor-pointer"
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
                className="grid gap-2 xs:gap-2.5 sm:gap-3.5 md:gap-4 w-full grid-cols-3 sm:grid-cols-3 md:grid-cols-6 justify-items-stretch"
              >
              {tabSets[currentSetIndex].map((item) => {
                const theme = cardThemeMap[item.id] || {
                  bg: 'bg-white/85 border-slate-200/50 backdrop-blur-md',
                  text: 'text-slate-800',
                  hoverBorder: 'hover:border-slate-300 hover:bg-white',
                  iconBg: 'bg-slate-100 text-slate-600 border border-slate-200/20',
                  accentBg: 'bg-slate-600',
                  shadow: 'hover:shadow-slate-100'
                };

                if (item.type === 'hub') {
                  let title = '';
                  let tag = '3-in-1 space';
                  let iconEmoji = '📂';
                  let destination = '';

                  if (item.id === 'curriculum_planning_hub') {
                    title = 'Academic Planning Hub';
                    tag = '3-in-1 Space';
                    iconEmoji = '📂';
                    destination = 'curriculum_planning_hub';
                  } else if (item.id === 'instructional_delivery_hub') {
                    title = 'Instructional Delivery';
                    tag = '3-in-1 Space';
                    iconEmoji = '📔';
                    destination = 'instructional_delivery_hub';
                  } else if (item.id === 'research_video_task_hub') {
                    title = 'Research, Video & Student Tasks';
                    tag = '3-in-1 Space';
                    iconEmoji = '🎓';
                    destination = 'research_video_task_hub';
                  } else if (item.id === 'teacher_resources_hub') {
                    title = 'Teacher Resources & Web App';
                    tag = 'Web App & Tools';
                    iconEmoji = '📲';
                    destination = 'teacher_resources_hub';
                  }

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate?.(destination)}
                      className={cn(
                        "p-1.5 xs:p-2 sm:p-3 rounded-2xl h-[92px] xs:h-[100px] sm:h-[114px] md:h-[124px] flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-sm hover:shadow-md border-2 relative overflow-hidden cursor-pointer group w-full",
                        theme.bg,
                        theme.hoverBorder,
                        theme.shadow
                      )}
                    >
                      <div 
                        className={cn("p-1.5 rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-xs flex items-center justify-center shrink-0", theme.iconBg)}
                      >
                        <span className="text-base xs:text-lg sm:text-xl md:text-2xl leading-none">{iconEmoji}</span>
                      </div>
                      <span className="font-black text-[10px] xs:text-[11px] sm:text-[12px] md:text-xs uppercase tracking-tight leading-snug line-clamp-2 max-w-full text-center px-0.5 text-slate-800">
                        {title}
                      </span>
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[7.5px] xs:text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs border border-white/20">
                        {tag}
                      </div>
                    </motion.button>
                  );
                }

                if (item.type === 'whatsapp') {
                  return (
                    <motion.button
                      key="whatsapp"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsWhatsappModalOpen(true)}
                      className={cn(
                        "p-1.5 xs:p-2 sm:p-3 rounded-2xl h-[92px] xs:h-[100px] sm:h-[114px] md:h-[124px] flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-sm hover:shadow-md border-2 relative overflow-hidden cursor-pointer group w-full",
                        theme.bg,
                        theme.hoverBorder,
                        theme.shadow
                      )}
                    >
                      <div 
                        className={cn("p-1.5 rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-xs flex items-center justify-center shrink-0", theme.iconBg)}
                      >
                        <span className="text-base xs:text-lg sm:text-xl md:text-2xl leading-none">💬</span>
                      </div>
                      <span className="font-black text-[10px] xs:text-[11px] sm:text-[12px] md:text-xs uppercase tracking-tight leading-snug line-clamp-2 max-w-full text-center px-0.5 text-slate-800">
                        Whatsapp
                      </span>
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[7.5px] xs:text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs border border-white/20">
                        Chat
                      </div>
                    </motion.button>
                  );
                }

                if (item.type === 'settings') {
                  return (
                    <motion.button
                      key="settings"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate?.('settings')}
                      className={cn(
                        "p-1.5 xs:p-2 sm:p-3 rounded-2xl h-[92px] xs:h-[100px] sm:h-[114px] md:h-[124px] flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-sm hover:shadow-md border-2 relative overflow-hidden cursor-pointer group w-full",
                        theme.bg,
                        theme.hoverBorder,
                        theme.shadow
                      )}
                    >
                      <div 
                        className={cn("p-1.5 rounded-xl transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-xs flex items-center justify-center shrink-0", theme.iconBg)}
                      >
                        <EmojiForType type="settings" />
                      </div>
                      <span className="font-black text-[10px] xs:text-[11px] sm:text-[12px] md:text-xs uppercase tracking-tight leading-snug line-clamp-2 max-w-full text-center px-0.5 text-slate-800">Settings</span>
                    </motion.button>
                  );
                }

                const cat = categories.find((c) => c.id === item.id);
                if (!cat) return null;

                return (
                  <motion.button
                    key={cat.id}
                    whileHover={isRestricted(cat.id) ? {} : { scale: 1.03, y: -2 }}
                    whileTap={isRestricted(cat.id) ? {} : { scale: 0.98 }}
                    onClick={() => isRestricted(cat.id) ? toast.error("Access Restricted: This tool is locked for free trial users. Please subscribe to unlock all generators.") : onStartNew(cat.id)}
                    className={cn(
                      "p-1.5 xs:p-2 sm:p-3 rounded-2xl h-[92px] xs:h-[100px] sm:h-[114px] md:h-[124px] flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-sm hover:shadow-md border-2 relative overflow-hidden group w-full",
                      isRestricted(cat.id) ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-80" : cn(theme.bg, theme.hoverBorder, theme.shadow, "cursor-pointer")
                    )}
                  >
                    <div 
                      className={cn("p-1.5 rounded-xl transition-all duration-300 transform shadow-xs flex items-center justify-center shrink-0", 
                        isRestricted(cat.id) ? "bg-slate-200 text-slate-400" : cn("group-hover:rotate-12 group-hover:scale-110", theme.iconBg)
                      )}
                    >
                      {isRestricted(cat.id) ? <Lock size={12} /> : <EmojiForType type={cat.id} />}
                    </div>
                    <span className={cn("font-black text-[10px] xs:text-[11px] sm:text-[12px] md:text-xs uppercase tracking-tight leading-snug line-clamp-2 max-w-full text-center px-0.5", isRestricted(cat.id) ? "text-slate-400" : "text-slate-800")}>{cat.title}</span>
                    {cat.id === 'syllabi' && !isRestricted(cat.id) && (
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white text-[7.5px] xs:text-[8.5px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs">
                        Library
                      </div>
                    )}
                    {isRestricted(cat.id) && (
                      <div className="absolute top-1 right-1 bg-slate-400 text-white text-[6px] xs:text-[6.5px] sm:text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs">
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
          <div className="flex justify-center gap-2 mt-2 relative z-20">
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

      {/* Syllabus Integrity Audit Banner (Knowledge Base Mother Tab) */}
      <motion.div 
        whileHover={{ scale: 1.002 }}
        className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg border border-emerald-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden my-1"
      >
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl shrink-0 shadow-inner">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500 text-slate-950 text-[8.5px] sm:text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                  CDC VERIFIED
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white">
                  100% SYLLABUS AUDIT
                </span>
              </div>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                KNOWLEDGE BASE
              </span>
            </div>
            <h4 className="font-bold text-[9.5px] sm:text-[11px] text-slate-300 tracking-tight uppercase truncate pt-0.5">
              Syllabus Integrity Audit & Library Panel
            </h4>
            <p className="text-slate-300 text-xs font-medium hidden md:block truncate max-w-xl">
              Side-by-side CDC syllabus verification, language health audits, and mother board access for extra reference modules and syllabuses.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('knowledge_base')}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer relative z-10 self-stretch sm:self-auto"
        >
          <span>Open Knowledge Base</span>
          <ChevronRight size={14} />
        </button>
      </motion.div>



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

      {/* WhatsApp Choices Modal */}
      {isWhatsappModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Choose WhatsApp Channel
                </h3>
              </div>
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
              How would you like to connect with Fortunes Edutech? Choose your preferred channel:
            </p>

            <div className="grid gap-3">
              {/* Option 1: Direct Support Chat */}
              <button
                onClick={() => {
                  window.open('https://wa.me/260961622222', '_blank');
                  setIsWhatsappModalOpen(false);
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-[#25D366]/40 hover:bg-emerald-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="p-3 bg-[#25D366]/10 text-[#128C7E] rounded-xl group-hover:scale-110 transition-transform shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs uppercase tracking-tight text-slate-900 truncate">
                    Direct Support Chat
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 leading-snug">
                    Ask questions, get help with billing & activate plans
                  </p>
                </div>
              </button>

              {/* Option 2: Teacher Community Group */}
              <button
                onClick={() => {
                  window.open('https://chat.whatsapp.com/EIRyFgQwKu4F6Hm2kvtqy9', '_blank');
                  setIsWhatsappModalOpen(false);
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-[#25D366]/40 hover:bg-emerald-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="p-3 bg-[#25D366]/15 text-[#128C7E] rounded-xl group-hover:scale-110 transition-transform shrink-0">
                  <Users size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs uppercase tracking-tight text-slate-900 truncate">
                    Join Teacher Community Link
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 leading-snug">
                    Connect, share lesson assets, and discuss updates with peers
                  </p>
                </div>
              </button>
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
