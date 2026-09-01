import React from 'react';

interface IsometricDashboardBgProps {
  className?: string;
}

export function IsometricDashboardBg({ className }: IsometricDashboardBgProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-0 ${className || ''}`}>
      {/* Absolute overlay for gentle vignette to keep contrast high */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
      
      <svg
        viewBox="0 0 1000 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-60 sm:opacity-75 md:opacity-85"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <defs>
          {/* Gradients for 3D Bars */}
          {/* Tall Deep Blue Column */}
          <linearGradient id="bar-blue-front-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="bar-blue-front-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="bar-blue-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Medium Sky Blue Column */}
          <linearGradient id="bar-sky-front-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <linearGradient id="bar-sky-front-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="bar-sky-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Emerald Column */}
          <linearGradient id="bar-emerald-front-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="bar-emerald-front-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="bar-emerald-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Amber Pulled Out Piece */}
          <linearGradient id="pie-amber-front-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="pie-amber-front-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="pie-amber-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>

          {/* Off-White Columns */}
          <linearGradient id="bar-slate-front-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="bar-slate-front-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="bar-slate-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>

          {/* Glow and Shadow Filters */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="shadow-iso" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>

          <style>{`
            @keyframes iso-float-y {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
              100% { transform: translateY(0px); }
            }
            @keyframes iso-float-diag {
              0% { transform: translateY(0px) translateX(0px); }
              50% { transform: translateY(-5px) translateX(4px); }
              100% { transform: translateY(0px) translateX(0px); }
            }
            @keyframes spin-slow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .iso-float-1 { animation: iso-float-y 6s ease-in-out infinite; }
            .iso-float-2 { animation: iso-float-diag 7s ease-in-out infinite; animation-delay: 1.5s; }
            .iso-float-3 { animation: iso-float-y 5s ease-in-out infinite; animation-delay: 3s; }
            .iso-spin { transform-origin: 500px 180px; animation: spin-slow 40s linear infinite; }
            .iso-pulse { animation: pulse 3s ease-in-out infinite; }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </defs>

        {/* 1. BACKGROUND GRID AND CIRCULAR TRACKS */}
        <g opacity="0.45" className="iso-pulse">
          {/* Concentric Isometric Ellipses (Isometric 2:1 ratio) */}
          <ellipse cx="500" cy="180" rx="440" ry="220" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5 15" />
          <ellipse cx="500" cy="180" rx="380" ry="190" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="8 8" />
          <ellipse cx="500" cy="180" rx="320" ry="160" stroke="#cbd5e1" strokeWidth="1" />
          <ellipse cx="500" cy="180" rx="260" ry="130" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="12 6" opacity="0.6" filter="url(#glow)" />
          <ellipse cx="500" cy="180" rx="200" ry="100" stroke="#e2e8f0" strokeWidth="1" />
          <ellipse cx="500" cy="180" rx="140" ry="70" stroke="#00D880" strokeWidth="1.5" strokeDasharray="3 9" opacity="0.4" />
        </g>

        {/* 2. ISOMETRIC DECORATIVE AXIS LINES */}
        <g opacity="0.25">
          <line x1="60" y1="310" x2="940" y2="50" stroke="#94a3b8" strokeWidth="1" />
          <line x1="60" y1="50" x2="940" y2="310" stroke="#94a3b8" strokeWidth="1" />
          <line x1="500" y1="0" x2="500" y2="360" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="4 4" />
        </g>

        {/* 3. CENTRAL 3D PIE CHART */}
        {/* Placed around center (X: 470, Y: 185) */}
        <g className="iso-float-1" filter="url(#shadow-iso)">
          {/* Base Shadow of central ring */}
          <ellipse cx="460" cy="195" rx="90" ry="45" fill="#0f172a" opacity="0.08" />

          {/* 3D Cylindrical Pie Sides - Blue Base */}
          {/* Left Arc Segment (Blue 3D Wall) */}
          <path d="M 370,185 A 90 45 0 0 0 460,230 L 460,210 A 90 45 0 0 1 370,165 Z" fill="#1d4ed8" />
          
          {/* Right Arc Segment (Blue/Light Blue 3D Wall) */}
          <path d="M 460,230 A 90 45 0 0 0 550,185 L 550,165 A 90 45 0 0 1 460,210 Z" fill="#1e40af" />

          {/* Top Ellipse Cap of central Ring (Blue) */}
          <ellipse cx="460" cy="185" rx="90" ry="45" fill="url(#bar-blue-front-r)" />

          {/* Inner hole cut (making it a 3D donut chart!) */}
          <ellipse cx="460" cy="185" rx="50" ry="25" fill="#f1f5f9" opacity="0.4" />
          <ellipse cx="460" cy="185" rx="42" ry="21" fill="url(#bar-slate-top)" />

          {/* Pie Slice 1: Emerald Segment (Isometric projection cut-out top cap) */}
          <path d="M 460,185 L 410,160 A 90 45 0 0 1 520,160 Z" fill="url(#bar-emerald-front-r)" opacity="0.85" />

          {/* Pie Slice 2: Pulled-Out Amber Slice (Pops offset to the right and top, like in screenshot 1!) */}
          <g transform="translate(18, -12)" filter="url(#glow)">
            {/* Shadow under the pulled-out slice */}
            <path d="M 460,200 L 415,178 A 90 45 0 0 0 505,178 Z" fill="#0f172a" opacity="0.12" />

            {/* Side wall left */}
            <path d="M 460,185 L 415,163 L 415,175 L 460,197 Z" fill="url(#pie-amber-front-l)" />
            
            {/* Side wall right */}
            <path d="M 460,185 L 505,163 L 505,175 L 460,197 Z" fill="url(#pie-amber-front-r)" />

            {/* Top wedge cap */}
            <path d="M 460,185 L 415,163 A 90 45 0 0 1 505,163 Z" fill="url(#pie-amber-top)" />
          </g>
        </g>

        {/* 4. TALL ISOMETRIC 3D BAR COLUMNS ON THE RIGHT SECTION */}
        {/* Renders a stunning 3D histogram/bar structure rising up */}
        <g className="iso-float-2" filter="url(#shadow-iso)">
          
          {/* Bar 1 (Deep Blue - Tallest) at (660, 180) */}
          <g>
            {/* Base Drop Shadow */}
            <ellipse cx="660" cy="184" rx="20" ry="10" fill="#0f172a" opacity="0.1" />
            {/* Left face */}
            <path d="M 642,112 L 660,121 L 660,180 L 642,171 Z" fill="url(#bar-blue-front-l)" />
            {/* Right face */}
            <path d="M 660,121 L 678,112 L 678,171 L 660,180 Z" fill="url(#bar-blue-front-r)" />
            {/* Top face */}
            <path d="M 660,121 L 678,112 L 660,103 L 642,112 Z" fill="url(#bar-blue-top)" />
          </g>

          {/* Bar 2 (Sky Blue - High) at (705, 205) */}
          <g>
            {/* Base Drop Shadow */}
            <ellipse cx="705" cy="209" rx="20" ry="10" fill="#0f172a" opacity="0.1" />
            {/* Left face */}
            <path d="M 687,147 L 705,156 L 705,205 L 687,196 Z" fill="url(#bar-sky-front-l)" />
            {/* Right face */}
            <path d="M 705,156 L 723,147 L 723,196 L 705,205 Z" fill="url(#bar-sky-front-r)" />
            {/* Top face */}
            <path d="M 705,156 L 723,147 L 705,138 L 687,147 Z" fill="url(#bar-sky-top)" />
          </g>

          {/* Bar 3 (Emerald - Medium) at (750, 230) */}
          <g>
            {/* Base Drop Shadow */}
            <ellipse cx="750" cy="234" rx="18" ry="9" fill="#0f172a" opacity="0.08" />
            {/* Left face */}
            <path d="M 732,182 L 750,191 L 750,230 L 732,221 Z" fill="url(#bar-emerald-front-l)" />
            {/* Right face */}
            <path d="M 750,191 L 768,182 L 768,221 L 750,230 Z" fill="url(#bar-emerald-front-r)" />
            {/* Top face */}
            <path d="M 750,191 L 768,182 L 750,173 L 732,182 Z" fill="url(#bar-emerald-top)" />
          </g>

          {/* Bar 4 (Light Slate - Tall Back Column) at (615, 155) */}
          <g opacity="0.9">
            {/* Base Drop Shadow */}
            <ellipse cx="615" cy="159" rx="18" ry="9" fill="#0f172a" opacity="0.05" />
            {/* Left face */}
            <path d="M 597,82 L 615,91 L 615,155 L 597,146 Z" fill="url(#bar-slate-front-l)" />
            {/* Right face */}
            <path d="M 615,91 L 633,82 L 633,146 L 615,155 Z" fill="url(#bar-slate-front-r)" />
            {/* Top face */}
            <path d="M 615,91 L 633,82 L 615,73 L 597,82 Z" fill="url(#bar-slate-top)" />
          </g>

          {/* Bar 5 (Teal Accent - Short) at (575, 140) */}
          <g>
            {/* Left face */}
            <path d="M 560,110 L 575,117 L 575,140 L 560,133 Z" fill="url(#bar-emerald-front-l)" />
            {/* Right face */}
            <path d="M 575,117 L 590,110 L 590,133 L 575,140 Z" fill="url(#bar-emerald-front-r)" />
            {/* Top face */}
            <path d="M 575,117 L 590,110 L 575,103 L 560,110 Z" fill="url(#bar-emerald-top)" />
          </g>
        </g>

        {/* 5. FLOATING 3D TECH SYMBOLS & ELEMENTS */}
        {/* Floating isometric elements (envelopes, cards, small cubes) representing curriculum resources */}
        
        {/* Floating Cube Left - (X: 250, Y: 130) */}
        <g className="iso-float-3" filter="url(#shadow-iso)" opacity="0.8">
          {/* Left face */}
          <path d="M 235,120 L 250,127 L 250,142 L 235,135 Z" fill="#475569" />
          {/* Right face */}
          <path d="M 250,127 L 265,120 L 265,135 L 250,142 Z" fill="#64748b" />
          {/* Top face */}
          <path d="M 250,127 L 265,120 L 250,113 L 235,120 Z" fill="#94a3b8" />
        </g>

        {/* Floating Mail / Document Envelope (X: 290, Y: 80) representing Schemes of work */}
        <g className="iso-float-1" transform="translate(290, 80)">
          {/* Main folder card background */}
          <path d="M -25,-12 L 15,-32 L 25,-22 L -15,-2 L -25,-12 Z" fill="#38bdf8" opacity="0.9" />
          {/* Highlight/White border flap */}
          <path d="M -15,-18 L 10,-30 L 18,-22 L -7,-10 Z" fill="#ffffff" opacity="0.8" />
          {/* Inner document sheet peeking out */}
          <path d="M -5,-25 L 10,-32 L 13,-29 L -2,-22 Z" fill="#ffffff" />
        </g>

        {/* Floating Lesson Note Card (X: 790, Y: 110) */}
        <g className="iso-float-2" transform="translate(800, 110)">
          {/* Shadow */}
          <path d="M -20,5 L 20,-15 L 25,-10 L -15,10 Z" fill="#0f172a" opacity="0.1" />
          {/* Card Body */}
          <path d="M -20,0 L 20,-20 L 28,-12 L -12,8 Z" fill="#34d399" />
          {/* Lines on Card */}
          <line x1="-8" y1="-8" x2="10" y2="-17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="-4" y1="-2" x2="14" y2="-11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="0" y1="4" x2="10" y2="-1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Floating Assess Clip / Checkmark Badge (X: 780, Y: 240) */}
        <g className="iso-float-3" transform="translate(790, 230)">
          {/* Circle base */}
          <ellipse cx="0" cy="0" rx="16" ry="8" fill="#f59e0b" />
          {/* Tick Mark */}
          <path d="M -6,-2 L -2,2 L 6,-4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 6. GLOWING PARTICLES AND ORBITING DATA NODES */}
        <g>
          {/* Sparkling white stars */}
          <path d="M 210,180 L 211.5,183.5 L 215,185 L 211.5,186.5 L 210,190 L 208.5,186.5 L 205,185 L 208.5,183.5 Z" fill="#ffffff" filter="url(#glow)" />
          <path d="M 330,220 L 331,222 L 333,223 L 331,224 L 330,226 L 329,224 L 327,223 L 329,222 Z" fill="#ffffff" />
          <path d="M 720,80 L 722,84 L 726,85 L 722,86 L 720,90 L 718,86 L 714,85 L 718,84 Z" fill="#38bdf8" filter="url(#glow)" />
          <path d="M 640,60 L 641,62.5 L 643.5,63 L 641,63.5 L 640,66 L 639,63.5 L 636.5,63 L 639,62.5 Z" fill="#ffffff" />
          <path d="M 520,70 L 521,72 L 523,73 L 521,74 L 520,76 L 519,74 L 517,73 L 519,72 Z" fill="#00D880" filter="url(#glow)" />
          <path d="M 120,90 L 122,94 L 126,95 L 122,96 L 120,100 L 118,96 L 114,95 L 118,94 Z" fill="#ffffff" />

          {/* Floating Data Spheres */}
          <circle cx="160" cy="220" r="4" fill="#00D880" opacity="0.7" filter="url(#glow)" />
          <circle cx="280" cy="270" r="2.5" fill="#38bdf8" opacity="0.6" />
          <circle cx="880" cy="190" r="3.5" fill="#38bdf8" opacity="0.7" filter="url(#glow)" />
          <circle cx="710" cy="270" r="3" fill="#f59e0b" opacity="0.6" />
          <circle cx="610" cy="220" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="490" cy="110" r="3.2" fill="#38bdf8" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
