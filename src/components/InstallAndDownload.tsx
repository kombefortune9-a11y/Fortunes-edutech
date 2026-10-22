import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { FortunesLogo } from './FortunesLogo';
import { 
  Smartphone, 
  Laptop, 
  Download, 
  Share2, 
  CheckCircle, 
  DownloadCloud, 
  ChevronDown, 
  ChevronUp, 
  Monitor, 
  Sparkles,
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Copy,
  ArrowLeft,
  Apple,
  ExternalLink,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface InstallAndDownloadProps {
  onBack?: () => void;
}

export default function InstallAndDownload({ onBack }: InstallAndDownloadProps = {}) {
  const { user } = useAuth();
  const isDeveloper = isDeveloperEmail(user?.email);
  const [activeTab, setActiveTab] = useState<'pwa' | 'laptop' | 'offline'>('pwa');
  const [deviceSubTab, setDeviceSubTab] = useState<'android' | 'ios'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    // Detect device
    const userAgent = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      setDeviceSubTab('ios');
    } else {
      setDeviceSubTab('android');
    }

    // Check if app is already running as standalone (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          ('standalone' in window.navigator && (window.navigator as any).standalone);
    setIsPwaInstalled(isStandalone);

    try {
      const inIframe = window.self !== window.top || window.location.hostname.includes('aistudio.google.com');
      setIsInsideIframe(inIframe);
    } catch {
      setIsInsideIframe(true);
    }

    if ((window as any).__deferredPwaPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
      const autoTrigger = localStorage.getItem('eduplan_auto_trigger_install');
      if (autoTrigger === 'true') {
        setTimeout(() => {
          try {
            (window as any).__deferredPwaPrompt.prompt();
            localStorage.removeItem('eduplan_auto_trigger_install');
          } catch {}
        }, 1200);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPwaPrompt = e;
      
      const autoTrigger = localStorage.getItem('eduplan_auto_trigger_install');
      if (autoTrigger === 'true') {
        setTimeout(() => {
          try {
            (e as any).prompt();
            localStorage.removeItem('eduplan_auto_trigger_install');
          } catch {}
        }, 1200);
      }
    };

    const handlePromptAvailable = () => {
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPrompt((window as any).__deferredPwaPrompt);
        const autoTrigger = localStorage.getItem('eduplan_auto_trigger_install');
        if (autoTrigger === 'true') {
          setTimeout(() => {
            try {
              (window as any).__deferredPwaPrompt.prompt();
              localStorage.removeItem('eduplan_auto_trigger_install');
            } catch {}
          }, 1200);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
    };
  }, []);

  const triggerNativePwaInstall = async () => {
    const prompt = deferredPrompt || (window as any).__deferredPwaPrompt;
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('Thank you for installing FORTUNES EDUTECH!');
          setIsPwaInstalled(true);
          localStorage.removeItem('eduplan_auto_trigger_install');
        }
      } catch (err) {
        console.warn("PWA prompt error:", err);
      }
      setDeferredPrompt(null);
      (window as any).__deferredPwaPrompt = null;
    } else {
      if (isInsideIframe) {
        try {
          localStorage.setItem('eduplan_auto_trigger_install', 'true');
        } catch {}
        toast.success('Opening in a dedicated phone tab to trigger instant app installation...', { icon: '🚀', duration: 4000 });
        setTimeout(() => {
          window.open(window.location.origin + '?install=true', '_blank');
        }, 1000);
      } else {
        toast('Tap your browser menu (⋮) and select "Install app" to add to your Home Screen.');
      }
    }
  };

  const handleOpenInChrome = () => {
    const cleanHost = window.location.host;
    const chromeIntent = `intent://${cleanHost}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    try {
      window.location.href = chromeIntent;
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied! Open Chrome to install.');
    }
  };

  // PC / Laptop Desktop Shortcut Dynamic Generator
  const downloadLaptopShortcut = () => {
    const currentOrigin = window.location.origin;
    const shortcutContent = `[InternetShortcut]\r\nURL=${currentOrigin}\r\nIconIndex=0\r\nIconFile=${currentOrigin}/logo512.png\r\nProp3=19,2\r\n`;
    
    const blob = new Blob([shortcutContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FORTUNES_EDUTECH_Laptop.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Downloaded Desktop Shortcut!');
  };

  // Standalone Offline Tool Generator (.html)
  const downloadOfflineHtml = () => {
    const offlineHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FORTUNES EDUTECH - Standalone Offline Workpad</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
    }
    header {
      background: #00a86b;
      color: white;
      padding: 30px;
      text-align: center;
      border-bottom: 4px solid #008755;
    }
    .container {
      max-width: 800px;
      margin: 30px auto;
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    h2 {
      margin-top: 0;
      color: #1e293b;
    }
    textarea {
      width: 100%;
      height: 250px;
      padding: 15px;
      border-radius: 12px;
      border: 2px solid #cbd5e1;
      font-size: 16px;
      box-sizing: border-box;
      resize: vertical;
    }
    textarea:focus {
      outline: none;
      border-color: #00a86b;
    }
    .btn {
      background: #00a86b;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      display: inline-block;
      margin-top: 15px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #008755;
    }
    .note {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
  </style>
</head>
<body>
  <header>
    <h1>FORTUNES EDUTECH</h1>
    <p>Emergency Standalone Offline Workpad • Zambian Teachers Hub</p>
  </header>
  <div class="container">
    <div class="note">
      <strong>Zero Network Required:</strong> This self-contained file runs locally on any computer or phone without an internet connection. Draft lesson plans, schemes, or notes and click Save.
    </div>
    <h2>Lesson Plan & Scheme Drafter</h2>
    <textarea id="workpad" placeholder="Type your Zambian curriculum lesson plans, objectives, and teaching points here..."></textarea>
    <br>
    <button class="btn" onclick="saveDraft()">Download Saved File (.txt)</button>
  </div>
  <script>
    function saveDraft() {
      const text = document.getElementById("workpad").value;
      if (!text.trim()) {
        alert("Please write something first!");
        return;
      }
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "My_Zambian_Lesson_Plan_Draft.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;

    const blob = new Blob([offlineHtmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FORTUNES_EDUTECH_Offline_Workpad.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Offline Workpad file downloaded successfully!');
  };

  const faqs = [
    {
      q: "What is the Fortunes Edutech Web App (PWA)?",
      a: "A Progressive Web App (PWA) is the modern standard for mobile and desktop applications. When you tap 'Install App' or 'Add to Home Screen', it installs with an official launcher icon, opens without any browser address bars, and caches all Zambian curriculum content locally for fast offline access."
    },
    {
      q: "Does this application allow complete offline viewing?",
      a: "Yes! Our application has an integrated PWA (Progressive Web App) Service Worker cache database. Once you open files and syllabus reference content, the browser caches them permanently. You can browse Zambian ECE and Grade 1-3 modules even when there is totally zero mobile network coverage or internet bundle in rural classrooms."
    },
    {
      q: "How do I install on an iPhone or iPad?",
      a: "Open this website in Safari, tap the Share icon (square with upward arrow) at the bottom of the screen, scroll down and tap 'Add to Home Screen', then tap 'Add'. The app icon will immediately appear on your home screen."
    },
    {
      q: "How does the Laptop Shortcut work?",
      a: "On Google Chrome or Microsoft Edge, click the Install icon in the address bar to install Fortunes Edutech as a standalone desktop program. Alternatively, download the .url shortcut file to place on your Windows desktop."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-24 overflow-y-auto h-full pr-2">
      
      {/* Top Back Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer group"
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/15 text-emerald-800 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs flex items-center gap-1.5">
            <Zap size={11} className="fill-current animate-pulse text-[#00A86B]" /> Official Progressive Web App (PWA)
          </span>
          <span className="bg-blue-500/15 text-blue-700 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-blue-500/20 shadow-xs">
            100% Offline Ready
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
          Web App Setup &amp; Installation
        </h1>
        <p className="text-slate-500 font-bold text-base sm:text-lg max-w-2xl leading-relaxed">
          Install FORTUNES EDUTECH directly to your phone, tablet, or laptop. Works 100% offline, requires zero bulky downloads, and automatically synchronizes with the latest Zambian syllabus guidelines.
        </p>
      </div>

      {/* Primary Web App Installation Hero Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-teal-50 rounded-[2.5rem] border border-emerald-200 p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <FortunesLogo variant="icon" className="w-14 h-14 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00A86B] text-white text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  ⭐ Recommended
                </span>
                <span className="text-[11px] font-extrabold text-emerald-800">
                  Instant Setup
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                Install Web App (PWA) to Home Screen
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                Launches in dedicated full-screen mode without browser address bars • Always updated
              </p>
            </div>
          </div>

          <button
            onClick={triggerNativePwaInstall}
            className="bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Zap size={16} />
            <span>Install Web App Now</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[2rem] border border-slate-200/60 w-full gap-1">
        <button
          onClick={() => setActiveTab('pwa')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 cursor-pointer ${
            activeTab === 'pwa' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Smartphone size={16} />
          <span>Mobile Phone (PWA)</span>
        </button>

        <button
          onClick={() => setActiveTab('laptop')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 cursor-pointer ${
            activeTab === 'laptop' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Laptop size={16} />
          <span>Desktop (PC / Mac)</span>
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 cursor-pointer ${
            activeTab === 'offline' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <DownloadCloud size={16} />
          <span>Offline Workpad</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left hand main instructional/interactive area */}
        <div className="md:col-span-2 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeTab === 'pwa' && (
              <motion.div
                key="pwa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 sm:p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00A86B] flex items-center justify-center shrink-0">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      Mobile Device Installation
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Android phones &amp; Apple iOS (iPhone/iPad)
                    </p>
                  </div>
                </div>

                {/* Sub tabs: Android vs iOS */}
                <div className="flex gap-2 border-b border-slate-100 pb-3">
                  <button
                    onClick={() => setDeviceSubTab('android')}
                    className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      deviceSubTab === 'android'
                        ? 'bg-[#00A86B] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Android (Chrome)</span>
                  </button>
                  <button
                    onClick={() => setDeviceSubTab('ios')}
                    className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      deviceSubTab === 'ios'
                        ? 'bg-[#00A86B] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Apple size={14} />
                    <span>iPhone / iPad (Safari)</span>
                  </button>
                </div>

                {/* Android Steps */}
                {deviceSubTab === 'android' && (
                  <div className="space-y-5">
                    <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/70 space-y-4">
                      <h4 className="font-black text-slate-900 text-sm uppercase">Android Installation Guide (Google Chrome)</h4>
                      
                      <ol className="space-y-3.5 pl-4 list-decimal text-xs font-medium text-slate-700">
                        <li>
                          <strong className="text-slate-900">Open in Google Chrome:</strong> Ensure this page is running in Google Chrome for 1-tap real installation.
                        </li>
                        <li>
                          <strong className="text-slate-900">Tap Menu (3 Dots):</strong> In the top-right corner of Chrome, tap the <span className="text-[#00A86B] font-black">⋮</span> menu icon.
                        </li>
                        <li>
                          <strong className="text-slate-900">Select "Install app":</strong> Tap <strong className="text-slate-900">"Install app"</strong> or <strong className="text-slate-900">"Add to Home screen"</strong>.
                        </li>
                        <li>
                          <strong className="text-slate-900">Confirm Install:</strong> Tap "Install" on the confirmation prompt. The official Fortunes Edutech app icon will appear on your phone home screen!
                        </li>
                      </ol>
                    </div>

                    {/* Phoenix Browser Helper */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-700 shrink-0" />
                        <h5 className="text-xs font-black text-amber-950 uppercase">Using Phoenix Browser or Tecno Browser?</h5>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        Phoenix Browser only makes plain web bookmarks. To get the genuine standalone application with offline support, open in <strong>Google Chrome</strong>:
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleOpenInChrome}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          <span>Open in Google Chrome</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            toast.success('App link copied! Open Chrome and paste it.');
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase px-4 py-2.5 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy size={13} />
                          <span>Copy App Link</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* iOS Steps */}
                {deviceSubTab === 'ios' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50/70 space-y-4">
                      <h4 className="font-black text-slate-900 text-sm uppercase">iPhone / iPad Installation Guide (Apple Safari)</h4>
                      
                      <ol className="space-y-3.5 pl-4 list-decimal text-xs font-medium text-slate-700">
                        <li>
                          <strong className="text-slate-900">Open in Safari:</strong> Ensure you are viewing this page in Apple Safari.
                        </li>
                        <li>
                          <strong className="text-slate-900">Tap the Share Button:</strong> Tap the Share icon (the square with an upward arrow) in the bottom toolbar.
                        </li>
                        <li>
                          <strong className="text-slate-900">Select "Add to Home Screen":</strong> Scroll down the share sheet and tap <strong className="text-slate-900">Add to Home Screen</strong>.
                        </li>
                        <li>
                          <strong className="text-slate-900">Tap "Add":</strong> Tap <strong className="text-[#00A86B]">Add</strong> in the top-right corner. The app will be placed directly onto your iPhone home screen!
                        </li>
                      </ol>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'laptop' && (
              <motion.div
                key="laptop"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 sm:p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      Laptop &amp; Desktop PC Setup
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      For Windows, macOS, Linux, and Chromebook
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-150 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Method 1 (Recommended)
                      </div>
                      <p className="text-lg font-black text-slate-900">Install Native Desktop PWA</p>
                      <p className="text-xs font-bold text-slate-600">
                        Installs directly into Windows Start Menu or Mac Applications. Runs in its own borderless window with full offline support.
                      </p>
                    </div>
                    
                    <button
                      onClick={triggerNativePwaInstall}
                      className="bg-[#00A86B] hover:bg-[#008f5b] active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Download size={16} />
                      <span>Install Desktop App</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700">
                        Method 2 (Desktop Shortcut)
                      </div>
                      <p className="text-lg font-black text-slate-800">Desktop Shortcut File (.url)</p>
                      <p className="text-xs font-bold text-slate-400">
                        Downloads a .url shortcut file to place directly on your desktop for 1-click launching.
                      </p>
                    </div>
                    
                    <button
                      onClick={downloadLaptopShortcut}
                      className="bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <DownloadCloud size={16} />
                      <span>Download .URL File</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'offline' && (
              <motion.div
                key="offline"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 sm:p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <DownloadCloud size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                      Emergency Standalone Offline Workpad
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Zero dependencies, self-contained single HTML file
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    If you are travelling to an area with completely zero cellular coverage or network bundles, you can download this standalone single-file workpad. It opens on any laptop, tablet, or phone browser without needing any internet connection.
                  </p>

                  <button
                    onClick={downloadOfflineHtml}
                    className="bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Download Offline Workpad (.html)</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Frequently Asked Questions
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">{faq.q}</span>
                    {expandedFaq === i ? <ChevronUp size={16} className="shrink-0 text-slate-500" /> : <ChevronDown size={16} className="shrink-0 text-slate-500" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="p-4 bg-white text-xs font-medium text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right hand sidebar specs card */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-7 shadow-xl space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Application Architecture</span>
              <h4 className="text-xl font-black uppercase tracking-tight">Progressive Web App</h4>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">Instant Installation</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Zero disk bloat, sets up in 2 seconds.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">Auto-Synchronized</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Always synced with 2026 syllabus updates.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">Full-Scale Offline Database</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Caches schemes, lessons &amp; notes locally.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-5 mt-4 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>APP TYPE</span>
                <span className="text-emerald-400 font-extrabold bg-[#00A86B]/10 px-2 py-0.5 rounded uppercase">Web App (PWA)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>OFFLINE CACHE</span>
                <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Active (Service Worker)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>COMPATIBILITY</span>
                <span className="text-blue-400 font-extrabold bg-blue-500/10 px-2 py-0.5 rounded uppercase">Android, iOS, PC, Mac</span>
              </div>
            </div>
          </div>

          {/* Quick Share Widget */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 p-6 sm:p-7 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Share Web App with Teachers</h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Share the official app link directly with fellow teachers via WhatsApp, SMS, or school groups.
            </p>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'FORTUNES EDUTECH',
                    text: 'Install the official Fortunes Edutech lesson planning and syllabus manager app on your phone or computer!',
                    url: window.location.origin
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success('App link copied to clipboard!');
                }
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share App Link</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
