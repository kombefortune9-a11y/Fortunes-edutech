import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop,
  Apple
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FortunesLogo } from './FortunesLogo';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export function AppInstallModal({ isOpen, onClose }: AppInstallModalProps) {
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect device to set default tab
    const userAgent = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      setDeviceTab('ios');
    } else if (/windows|macintosh|linux/i.test(userAgent) && !/android/i.test(userAgent)) {
      setDeviceTab('desktop');
    } else {
      setDeviceTab('android');
    }

    if ((window as any).__deferredPwaPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
    }

    const handlePrompt = (e: any) => {
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('pwa-prompt-available', () => {
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPrompt((window as any).__deferredPwaPrompt);
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    const prompt = deferredPrompt || (window as any).__deferredPwaPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('App installed successfully to your home screen!');
          onClose();
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
          localStorage.setItem('eduplan_auto_trigger_install', 'true');
        } catch {}
        toast.success('Opening in a dedicated phone tab to trigger instant app installation...', { icon: '🚀', duration: 4000 });
        setTimeout(() => {
          window.open(window.location.origin + '?install=true', '_blank');
        }, 1000);
        onClose();
      } else {
        const isAndroid = /android/i.test(navigator.userAgent);
        if (isAndroid) {
          handleOpenInChrome();
        } else {
          toast('Follow the step-by-step instructions below to add to your Home Screen', {
            icon: '📱',
            duration: 4000
          });
        }
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    toast.success('App link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenInChrome = () => {
    const cleanHost = window.location.host;
    const chromeIntent = `intent://${cleanHost}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    
    toast((t) => (
      <div className="text-xs space-y-2">
        <p className="font-bold">Opening in Google Chrome for 1-click Web App installation...</p>
        <div className="flex gap-2">
          <a 
            href={chromeIntent} 
            className="bg-[#00A86B] text-white px-3 py-1 rounded font-bold"
            onClick={() => toast.dismiss(t.id)}
          >
            Open Chrome
          </a>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied! Paste into Google Chrome.');
              toast.dismiss(t.id);
            }} 
            className="bg-slate-200 text-slate-800 px-3 py-1 rounded font-bold"
          >
            Copy Link
          </button>
        </div>
      </div>
    ), { duration: 6000 });

    try {
      window.location.href = chromeIntent;
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied! Open Chrome to install.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col z-[130]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
            <div className="flex items-center gap-3.5">
              <FortunesLogo variant="icon" className="w-12 h-12 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Install Fortunes Edutech
                </h3>
                <p className="text-[11px] font-extrabold text-[#00A86B] tracking-wider uppercase">
                  Official Progressive Web App (PWA)
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Device Tabs */}
          <div className="px-5 sm:px-6 pt-3 pb-2 flex gap-2 shrink-0 border-b border-slate-100 bg-white">
            <button
              onClick={() => setDeviceTab('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                deviceTab === 'android'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone size={13} />
              <span>Android</span>
            </button>
            <button
              onClick={() => setDeviceTab('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                deviceTab === 'ios'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Apple size={13} />
              <span>iPhone / iPad</span>
            </button>
            <button
              onClick={() => setDeviceTab('desktop')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                deviceTab === 'desktop'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Laptop size={13} />
              <span>PC / Mac</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Quick Hero Action */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-3xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="bg-[#00A86B] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  ⭐ Recommended Setup
                </span>
                <span className="text-[10.5px] font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck size={13} />
                  Safe &amp; Instant
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900 uppercase">
                  Install Directly to Home Screen
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  Enjoy the full app experience with a dedicated launcher icon, full-screen view without browser bars, and 100% offline lesson drafting.
                </p>
              </div>

              <button
                onClick={handleInstallPwa}
                className="w-full bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={15} />
                <span>Tap to Install Web App Now</span>
              </button>
            </div>

            {/* Android Instructions */}
            {deviceTab === 'android' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    How to Install on Android (Chrome):
                  </h4>

                  <ol className="space-y-3 text-xs font-medium text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="font-bold text-slate-900">Tap Browser Menu (3 Dots)</p>
                        <p className="text-slate-500 text-[11px]">In the top-right corner of Google Chrome, tap the <strong>⋮</strong> (three vertical dots).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="font-bold text-slate-900">Tap "Install app" or "Add to Home screen"</p>
                        <p className="text-slate-500 text-[11px]">Select <strong>Install app</strong> from the dropdown menu.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="font-bold text-slate-900">Confirm "Install"</p>
                        <p className="text-slate-500 text-[11px]">Fortunes Edutech will immediately appear in your phone's app list with the official icon!</p>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Phoenix Browser & Chrome Launcher */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe size={15} className="text-slate-700" />
                    <h5 className="text-[11px] font-black text-slate-900 uppercase">Using Phoenix Browser or Tecno Browser?</h5>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    For 1-tap real installation, open this app inside <strong>Google Chrome</strong>:
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenInChrome}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      <span>Open in Chrome</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-[10px] uppercase py-2.5 px-3 rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-[#00A86B]" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {deviceTab === 'ios' && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  How to Install on iPhone / iPad (Safari):
                </h4>

                <ol className="space-y-3 text-xs font-medium text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-900">Open in Safari</p>
                      <p className="text-slate-500 text-[11px]">Make sure you are viewing this page in Safari.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-900">Tap the Share Button</p>
                      <p className="text-slate-500 text-[11px]">Tap the Share icon at the bottom of the screen (square with arrow pointing upward).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-slate-900">Select "Add to Home Screen"</p>
                      <p className="text-slate-500 text-[11px]">Scroll down the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top-right.</p>
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {deviceTab === 'desktop' && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  How to Install on PC / Mac (Chrome, Edge, Brave):
                </h4>

                <ol className="space-y-3 text-xs font-medium text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-slate-900">Look at the Address Bar</p>
                      <p className="text-slate-500 text-[11px]">At the right end of the browser URL address bar, look for the <strong>Install</strong> computer icon.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00A86B] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-slate-900">Click "Install Fortunes Edutech"</p>
                      <p className="text-slate-500 text-[11px]">Click <strong>Install</strong> to add a desktop shortcut and open in a standalone desktop window.</p>
                    </div>
                  </li>
                </ol>
              </div>
            )}

            {/* Features list */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-[#00A86B] text-xs font-black">
                  <CheckCircle2 size={14} />
                  <span>Works Offline</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Access your schemes, lesson plans, and notes without active data.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-[#00A86B] text-xs font-black">
                  <CheckCircle2 size={14} />
                  <span>Auto-Updated</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Always synchronized with 2026 Zambian syllabus guidelines.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <p className="text-[11px] font-bold text-slate-400">
              Fortunes Edutech • Progressive Web App (PWA)
            </p>
            <button
              onClick={onClose}
              className="text-xs font-extrabold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
