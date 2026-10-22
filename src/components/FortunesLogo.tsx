import React from 'react';
import { APP_VERSION } from '../constants';

export interface FortunesLogoProps {
  /**
   * Display mode:
   * - 'banner': Full 16:9 cinematic faceted crystal background with insignia, FORTUNES, EDUTECH, and version badge
   * - 'card': Compact rounded card format for login/modals
   * - 'horizontal': Inline lockup with insignia on left, bold text & version on right
   * - 'icon': Just the graduation cap + highway 'F' mark in a crystal emerald tile
   */
  variant?: 'banner' | 'card' | 'horizontal' | 'icon';
  /** Whether to display the app version under FORTUNES EDUTECH (defaults to true) */
  showVersion?: boolean;
  /** Custom version text override (defaults to current APP_VERSION) */
  versionText?: string;
  /** Additional CSS class names */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Subtitle text (optional, e.g. 'plan competently.') */
  subtitle?: string;
}

/**
 * High-definition vector Insignia: Academic Mortarboard Cap + Highway Road 'F'
 */
export const FortunesInsignia: React.FC<{
  size?: number | string;
  className?: string;
  withGlow?: boolean;
}> = ({ size = '100%', className = '', withGlow = true }) => {
  return (
    <svg
      viewBox="0 0 240 220"
      width={size}
      height={size}
      className={`select-none overflow-visible ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="insigniaLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8CF519" />
          <stop offset="50%" stopColor="#76E000" />
          <stop offset="100%" stopColor="#58C400" />
        </linearGradient>

        <linearGradient id="insigniaRoadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#022112" />
          <stop offset="100%" stopColor="#064223" />
        </linearGradient>

        <filter id="insigniaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient lime glow behind insignia */}
      {withGlow && (
        <circle cx="120" cy="110" r="70" fill="#76E000" opacity="0.12" filter="url(#insigniaGlow)" />
      )}

      {/* === GRADUATION CAP (MORTARBOARD) === */}
      <g id="academic-cap">
        {/* Diamond Mortarboard Top */}
        <polygon
          points="120,12 186,45 120,78 54,45"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.5"
        />
        {/* Left facet shadow for clean 3D crispness */}
        <polygon points="120,12 54,45 120,78" fill="#F8FAFC" opacity="0.95" />

        {/* Skullcap Headband Arch */}
        <path
          d="M 82,60 Q 120,82 158,60 L 158,72 Q 120,94 82,72 Z"
          fill="#E2E8F0"
        />

        {/* Tassel Button */}
        <circle cx="120" cy="42" r="3" fill="#FFFFFF" />

        {/* Tassel Cord & Hanging Bell */}
        <path
          d="M 120,42 Q 80,45 70,68 L 70,95"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="70" cy="98" rx="4" ry="5.5" fill="#FFFFFF" />
      </g>

      {/* === THE HIGHWAY ROAD & 'F' EMBLEM === */}
      <g id="highway-f-mark">
        {/* 1. Left Highway Outer White Curb (Perspective sweep) */}
        <path
          d="M 38,198 C 50,154 78,110 106,88 L 124,88 C 98,112 74,152 62,198 Z"
          fill="#FFFFFF"
        />

        {/* 2. Asphalt Road Surface */}
        <path
          d="M 62,198 C 74,152 98,112 124,88 L 142,88 C 120,114 100,154 88,198 Z"
          fill="url(#insigniaRoadGrad)"
        />

        {/* 3. Road Dashed Centerline (Perspective lane dividers) */}
        {/* Dash 1 (Bottom, widest) */}
        <polygon points="74,198 83,198 90,178 82,178" fill="url(#insigniaLimeGrad)" />
        {/* Dash 2 */}
        <polygon points="86,172 93,172 99,155 93,155" fill="url(#insigniaLimeGrad)" />
        {/* Dash 3 */}
        <polygon points="97,150 102,150 107,136 102,136" fill="url(#insigniaLimeGrad)" />
        {/* Dash 4 (Top, near vanishing point) */}
        <polygon points="105,131 109,131 113,120 109,120" fill="url(#insigniaLimeGrad)" />

        {/* 4. Top Wing of 'F' (Vibrant Lime Swoosh) */}
        <path
          d="M 128,88 L 194,88 C 210,88 214,99 204,110 C 192,122 170,128 134,128 L 117,128 C 122,115 126,101 128,88 Z"
          fill="url(#insigniaLimeGrad)"
        />

        {/* 5. Middle Crossbar Wing of 'F' (Vibrant Lime Lower Sweep) */}
        <path
          d="M 100,144 C 128,144 174,147 174,168 C 174,182 159,198 126,198 L 108,198 C 104,179 101,162 100,144 Z"
          fill="url(#insigniaLimeGrad)"
        />
      </g>
    </svg>
  );
};

export const FortunesLogo: React.FC<FortunesLogoProps> = ({
  variant = 'banner',
  showVersion = true,
  versionText,
  className = '',
  onClick,
  subtitle
}) => {
  // Use explicit version or read from central APP_VERSION (e.g. 'v2.4.0')
  const currentVersion = versionText || APP_VERSION;
  // Clean version string: ensure it displays clearly, e.g. "VERSION 2.4.0" or "v2.4.0"
  const formattedVersion = currentVersion.toUpperCase().startsWith('V')
    ? `VERSION ${currentVersion.substring(1)}`
    : currentVersion.toUpperCase().startsWith('VERSION')
    ? currentVersion.toUpperCase()
    : `VERSION ${currentVersion}`;

  // === 1. ICON VARIANT (For small square headers, avatars, nav buttons) ===
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#064223] via-[#042e18] to-[#011a0d] border border-emerald-500/40 p-1.5 shadow-md flex items-center justify-center group ${
          onClick ? 'cursor-pointer hover:border-emerald-400 active:scale-95 transition-all' : ''
        } ${className}`}
        title={`FORTUNES EDUTECH • ${currentVersion}`}
      >
        {/* Subtle crystal background polygon */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        <FortunesInsignia size="90%" withGlow={true} />
      </div>
    );
  }

  // === 2. HORIZONTAL VARIANT (For navbar brand locks & compact toolbars) ===
  if (variant === 'horizontal') {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-3 select-none ${
          onClick ? 'cursor-pointer group' : ''
        } ${className}`}
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#064223] via-[#042e18] to-[#011a0d] border border-emerald-500/40 p-1 shadow-sm shrink-0 flex items-center justify-center">
          <FortunesInsignia size="88%" withGlow={false} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
              FORTUNES
            </span>
            <span className="text-sm sm:text-base font-black text-[#76E000] tracking-tight uppercase">
              EDUTECH
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {subtitle && (
              <span className="text-[9px] font-bold text-emerald-700 tracking-wide lowercase">
                {subtitle}
              </span>
            )}
            {showVersion && (
              <span className="text-[8px] font-black text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.2 rounded uppercase tracking-wider">
                {currentVersion}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === 3. BANNER / CARD VARIANT (Matches the exact clean screenshot, crystal emerald, bold white & electric lime, plus version) ===
  return (
    <div
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-[2rem] border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 select-none ${
        onClick ? 'cursor-pointer hover:border-emerald-400/60 transition-all' : ''
      } ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 38%, #084c28 0%, #04311a 55%, #021a0d 100%)'
      }}
    >
      {/* Faceted Crystal Geometric Triangles (SVG layer matching the user screenshot) */}
      <svg
        viewBox="0 0 960 540"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="facet1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="facet2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Top left polygon crystal shards */}
        <polygon points="0,0 360,0 180,260" fill="url(#facet1)" />
        <polygon points="0,0 0,380 180,260" fill="#044422" opacity="0.45" />
        <polygon points="180,260 360,0 460,160" fill="#10b981" opacity="0.16" />

        {/* Top right polygon crystal shards */}
        <polygon points="600,0 960,0 800,250" fill="url(#facet2)" />
        <polygon points="800,250 960,0 960,370" fill="#065f46" opacity="0.38" />
        <polygon points="520,130 740,0 800,250" fill="#34d399" opacity="0.16" />

        {/* Bottom shards */}
        <polygon points="0,370 240,540 0,540" fill="#059669" opacity="0.25" />
        <polygon points="720,540 960,350 960,540" fill="url(#facet1)" />
        <polygon points="620,460 860,540 960,540" fill="#34d399" opacity="0.2" />

        {/* Dynamic laser/speed lines */}
        <line x1="50" y1="20" x2="290" y2="340" stroke="#34d399" strokeWidth="1.5" opacity="0.35" />
        <line x1="910" y1="40" x2="690" y2="340" stroke="#10b981" strokeWidth="1.5" opacity="0.35" />
      </svg>

      {/* Main Content: Insignia + FORTUNES + EDUTECH + Slogan 'plan competently.' */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-10 md:py-12">
        {/* Center Logo Insignia */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-3 sm:mb-4 drop-shadow-2xl">
          <FortunesInsignia size="100%" withGlow={true} />
        </div>

        {/* Typography: FORTUNES (Pure White) & EDUTECH (Brilliant Lime) */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-[0.14em] leading-none drop-shadow-md">
            FORTUNES
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#76E000] uppercase tracking-[0.12em] leading-none drop-shadow-sm">
            EDUTECH
          </h2>
          {/* 'your CBC partner' follows FORTUNES EDUTECH directly */}
          <p className="pt-1 sm:pt-1.5 text-xs sm:text-sm md:text-base font-extrabold text-emerald-400 tracking-[0.18em] lowercase leading-none drop-shadow-xs">
            {subtitle || 'your CBC partner'}
          </p>
        </div>
      </div>

      {/* Dynamic App Version Badge - Positioned in the RIGHT CORNER ALONE */}
      {showVersion && (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#022212]/95 border border-[#76E000]/60 shadow-lg shadow-black/50 backdrop-blur-md transition-transform hover:scale-105">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#76E000] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#76E000]" />
            </span>
            <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-white uppercase select-all">
              {formattedVersion}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FortunesLogo;
