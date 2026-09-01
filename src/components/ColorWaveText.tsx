import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

export function ColorWaveText() {
  const sentence = "Experience excellency in material production with fortunes edutech app at your finger tips & within the comfort of your home";
  const words = sentence.split(" ");
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const colorTimer = setInterval(() => {
      setColorIndex(prev => (prev + 1) % words.length);
    }, 350); // Speed set to 350ms for a fast, lively color wave flow

    return () => {
      clearInterval(colorTimer);
    };
  }, [words.length]);

  // Premium dark colors that are extremely high contrast and easily legible
  const darkColors = [
    'text-emerald-800',
    'text-[#00A86B]',
    'text-teal-800',
    'text-indigo-900',
    'text-blue-900',
    'text-violet-900',
    'text-purple-900',
    'text-rose-900',
    'text-slate-900',
  ];

  return (
    <div className="transition-all duration-1000 mt-0.5 min-h-[32px] flex items-center">
      <p className="text-sm md:text-base font-bold tracking-tight flex flex-wrap gap-x-1.5 gap-y-0.5">
        {words.map((word, idx) => {
          const isActive = idx === colorIndex;
          // Use beautiful, easily readable dark colors for the active/highlighted word, and solid dark slate for non-active words
          const activeColorClass = darkColors[idx % darkColors.length];

          return (
            <span 
              key={idx}
              className={cn(
                "transition-all duration-300 transform inline-block origin-center",
                isActive 
                  ? cn("scale-105 font-black", activeColorClass) 
                  : "scale-100 font-semibold text-slate-700" // Always 100% visible, dark slate text
              )}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
}
