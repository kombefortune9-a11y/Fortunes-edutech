import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AppInstallModal } from './AppInstallModal';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is already running as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          ('standalone' in window.navigator && (window.navigator as any).standalone);
    
    const hasDismissed = safeLocalStorage.getItem('installPromptDismissed_v5');

    if ((window as any).__deferredPwaPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
      if (!hasDismissed && !isStandalone) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPwaPrompt = e;
      if (!hasDismissed && !isStandalone) {
        setShowPrompt(true);
      }
    };

    const handlePromptAvailable = () => {
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPrompt((window as any).__deferredPwaPrompt);
        if (!hasDismissed && !isStandalone) {
          setShowPrompt(true);
        }
      }
    };

    const handleOpenModal = () => {
      setShowPrompt(false);
      setShowFullModal(true);
    };

    // Global hook to open install modal
    (window as any).openAppInstallModal = () => {
      setShowPrompt(false);
      setShowFullModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('open-app-install-modal', handleOpenModal);
    
    // Auto-show prompt for mobile visitors after brief load
    if (!isStandalone && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
        window.removeEventListener('open-app-install-modal', handleOpenModal);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('open-app-install-modal', handleOpenModal);
    };
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    safeLocalStorage.setItem('installPromptDismissed_v5', 'true');
  };

  const handlePwaInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).__deferredPwaPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
          safeLocalStorage.removeItem('eduplan_auto_trigger_install');
        }
      } catch (err) {
        console.warn("PWA prompt error:", err);
      }
      setDeferredPrompt(null);
      (window as any).__deferredPwaPrompt = null;
    } else {
      let isInsideIframe = false;
      try {
        isInsideIframe = window.self !== window.top || window.location.hostname.includes('aistudio.google.com');
      } catch {
        isInsideIframe = true;
      }

      if (isInsideIframe) {
        try {
          safeLocalStorage.setItem('eduplan_auto_trigger_install', 'true');
        } catch {}
        toast.success('Opening in a dedicated phone tab to trigger instant app installation...', { icon: '🚀', duration: 4000 });
        setTimeout(() => {
          window.open(window.location.origin + '?install=true', '_blank');
        }, 1000);
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
        setShowFullModal(true);
      }
    }
  };

  return (
    <>
      {/* Official Web App (PWA) Install Modal */}
      <AppInstallModal 
        isOpen={showFullModal} 
        onClose={() => setShowFullModal(false)} 
      />

      {/* Floating Bottom Install Prompt */}
      <AnimatePresence>
        {showPrompt && !showFullModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismiss}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs pointer-events-auto cursor-pointer"
            />
            
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl z-[110] border border-slate-100 pointer-events-auto"
            >
              <div className="p-6 sm:p-7 space-y-4">
                {/* Header with App Logo */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white p-1 shrink-0 flex items-center justify-center">
                      <img 
                        src="/favicon.ico" 
                        alt="Fortunes Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logo192.png';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight uppercase leading-tight">
                        FORTUNES EDUTECH
                      </h3>
                      <p className="text-[11px] font-extrabold text-[#00A86B] tracking-wider uppercase mt-0.5">
                        Official Web App (PWA)
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={dismiss}
                    className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Install Fortunes Edutech on your device for 1-tap offline lesson planning, auto-cached syllabi, and full-screen workspace.
                </p>

                {/* Single Focused PWA Install Action */}
                <button
                  onClick={handlePwaInstallClick}
                  className="w-full bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-4 px-5 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Zap size={16} />
                  <span>Install Web App (PWA) Now</span>
                </button>

                {/* Secondary Help Link & Dismiss */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    onClick={() => {
                      setShowPrompt(false);
                      setShowFullModal(true);
                    }}
                    className="text-[#00A86B] hover:text-emerald-800 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>How to add to Home Screen</span>
                  </button>
                  <button
                    onClick={dismiss}
                    className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
