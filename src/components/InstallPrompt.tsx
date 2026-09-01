import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is already installed/running as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    
    // Check if we've dismissed it recently
    const hasDismissed = safeLocalStorage.getItem('installPromptDismissed_v2');

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasDismissed && !isStandalone) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // If we're on iOS or the browser doesn't support beforeinstallprompt but we still
    // want to show the manual UI
    if (!isStandalone && !hasDismissed) {
      const timer = setTimeout(() => {
        // Only show if we haven't already shown it natively or if we're on a non-PWA friendly browser (iOS)
        setShowPrompt(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    safeLocalStorage.setItem('installPromptDismissed_v2', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    } else {
      // Just dismiss if manual
      dismiss();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
          />
          
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl z-[110]"
          >
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Install App</h3>
                  <p className="text-xs font-black uppercase text-blue-600 tracking-[0.2em] mt-2">
                    For the best experience
                  </p>
                </div>
                <button 
                  onClick={dismiss}
                  className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Install FORTUNES EDUTECH directly on your device for quick access and a full-screen experience.
                </p>

                {(!deferredPrompt || isIOS) && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    {isIOS ? (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">1</span>
                          <p className="text-sm font-bold text-slate-700">Tap the Share icon <span className="inline-flex border border-slate-300 rounded px-1 pb-1 mx-1">↑</span> below</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">2</span>
                          <p className="text-sm font-bold text-slate-700">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">1</span>
                          <p className="text-sm font-bold text-slate-700">Tap the menu icon (⋮) in your browser</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">2</span>
                          <p className="text-sm font-bold text-slate-700">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={handleInstallClick}
                className="w-full py-6 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3"
              >
                {deferredPrompt ? 'Install Now' : 'Got it, Thanks'} <Download size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
