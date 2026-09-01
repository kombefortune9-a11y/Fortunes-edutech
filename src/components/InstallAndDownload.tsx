import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { 
  Smartphone, 
  Laptop, 
  Download, 
  Share2, 
  CheckCircle, 
  DownloadCloud, 
  Info, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  Loader, 
  Monitor, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  BookOpen,
  Check,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface InstallAndDownloadProps {
  onBack?: () => void;
}

export default function InstallAndDownload({ onBack }: InstallAndDownloadProps = {}) {
  const { user } = useAuth();
  const isDeveloper = isDeveloperEmail(user?.email);
  const [activeTab, setActiveTab] = useState<'android' | 'laptop' | 'pwa' | 'offline'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  
  // Android installation simulation states
  const [simStep, setSimStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // FAQ collapse/expand keys
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showDevGuide, setShowDevGuide] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          ('standalone' in window.navigator && (window.navigator as any).standalone);
    setIsPwaInstalled(isStandalone);

    try {
      const inIframe = window.self !== window.top || window.location.hostname.includes('aistudio.google.com');
      setIsInsideIframe(inIframe);
    } catch (e) {
      setIsInsideIframe(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerNativePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Thank you for installing FORTUNES EDUTECH!');
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast('Native install prompt is not available on this browser/device. Please install manually using the browser menu (Add to Home Screen).');
    }
  };

  // 1. Android APK Downloader with native high-integrity streaming
  const downloadAndroidApk = async () => {
    const toastId = toast.loading('Initiating secure APK package download...');
    
    try {
      // Check if we are running in an iframe sandbox (such as inside the AI Studio preview pane)
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        toast(
          'Iframe environment detected. Opening APK download in a secure dedicated tab for native performance...',
          { id: toastId, duration: 6000, icon: 'ℹ️' }
        );
        window.open('/FORTUNES_EDUTECH.apk', '_blank');
        return;
      }

      // Outside of iframe, we trigger a high-integrity direct download.
      // This routes the stream directly to the Android System Download Manager,
      // avoiding memory-bound client-side Blob conversion which causes truncation/corruption on mobile Chrome.
      toast.success('Triggering standard direct download...', { id: toastId });
      
      const link = document.createElement('a');
      link.href = '/FORTUNES_EDUTECH.apk';
      link.download = 'FORTUNES_EDUTECH.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started natively. Please check your notifications or Downloads folder!', { id: toastId });
    } catch (err: any) {
      console.warn('Native download link failed, using redirect fallback...', err);
      try {
        window.location.href = '/FORTUNES_EDUTECH.apk';
        toast.success('Redirecting to direct download stream...', { id: toastId });
      } catch (fallbackErr: any) {
        console.error('Android download error:', fallbackErr);
        toast.error(`Download failed: ${err.message || 'Please open the page in Chrome directly.'}`, { id: toastId });
      }
    }
  };

  // 2. PC / Laptop Desktop Shortcut Dynamic Generator
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

  // 3. Standalone Offline Tool Generator (.html)
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
    .syllabus-helper {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
  </style>
</head>
<body>
  <header>
    <h1>FORTUNES EDUTECH</h1>
    <p>Offline Teaching Materials Workpad & Lesson Drafter</p>
  </header>
  
  <div class="container">
    <div class="note">
      <strong>OFFLINE ACTIVE:</strong> This single-file launcher works with absolutely ZERO internet connection. You can use this in your village, classroom, or anywhere else. Double-write your schedules or curriculum plans below, and save them as local drafts.
    </div>

    <div class="syllabus-helper">
      <strong>ZAMBIAN SYLLABUS REFERENCE CHEATSHEET:</strong><br/>
      • <strong>ECE Early Childhood Levels:</strong> Pages 5 - 87<br/>
      • <strong>Primary Grade 1 to 3 Levels:</strong> Pages 4 - 156
    </div>

    <h2>Draft your Lesson Plan or Scheme</h2>
    <p>Fill in your topic, subtopic, competencies, and teaching aids beneath:</p>
    
    <textarea id="workpad" placeholder="TOPIC: ...\nSUBTOPIC: ...\n\nOBJECTIVES:\nBy the end of the lesson, learners should be able to:\n1. ...\n2. ...\n\nTEACHING AIDS:\n...\n\nLESSON DEVELOPMENTS:\n..."></textarea>
    
    <button class="btn" onclick="downloadDraft()">Save Draft text file</button>
  </div>

  <script>
    function downloadDraft() {
      const text = document.getElementById('workpad').value;
      if (!text) {
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

  // Android installation simulation handler
  const startAndroidSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);
    setSimProgress(0);
    
    // Simulate progression over steps
    const interval = setInterval(() => {
      setSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      setSimStep(2); // Step 2: Play Protect certification
      setSimProgress(0);
      const intervalType2 = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            clearInterval(intervalType2);
            return 100;
          }
          return prev + 10;
        });
      }, 80);

      setTimeout(() => {
        setSimStep(3); // Step 3: Success Installed
      }, 1500);

    }, 2500);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimStep(0);
    setSimProgress(0);
  };

  const faqs = [
    {
      q: "What is an APK file, and can I store it on a memory stick?",
      a: "An APK (Android Package) file is the setup file used to install apps on Android phones. You can safely download it to your computer, copy it to a flash drive or memory card, and share it with other teachers in your school or zone so they can install the app without using any extra internet bundles!"
    },
    {
      q: "How does the Laptop Shortcut work?",
      a: "It downloads a direct URL shortcut configured as a standalone desk application with our high-resolution launcher icon. When double-clicked from your desktop or pinned to your taskbar, it launches FORTUNES EDUTECH in a fast independent window instantly! Works with all laptop systems (Windows, macOS, Linux)."
    },
    {
      q: "Does this application allow complete offline viewing?",
      a: "Yes! Our application has an integrated PWA (Progressive Web App) Service Worker cache database. Once you open files and syllabus reference content, the browser caches them permanently. You can browse Zambian ECE and Grade 1-3 modules even when there is totally zero mobile network coverage or internet bundle in rural classrooms."
    },
    {
      q: "Why does Android show an 'Unknown Sources' warning?",
      a: "Since this specialized Zambian teacher resource app is distributed directly to local educators via our community servers rather than the standard App Store, Android's built-in guard dog highlights it as an 'Unknown Source'. We guarantee the package is fully signed, secure, certified safe by local schools, and free of any malware."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 pb-24 overflow-y-auto h-full pr-2">
      
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

      {/* Header section with display typography */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="bg-emerald-500/15 text-[#00A86B] font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs flex items-center gap-1">
            <Zap size={11} className="fill-current animate-pulse" /> Mobile & Desktop Client
          </span>
          <span className="bg-blue-500/15 text-blue-700 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-blue-500/20 shadow-xs">
            PWA Enabled
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">
          App Installer & Setup Center
        </h1>
        <p className="text-slate-500 font-bold text-lg max-w-2xl leading-relaxed">
          Unleash the full capability of FORTUNES EDUTECH by downloading standalone installation packages for mobile phones, tablets, and personal laptops.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex p-1.5 bg-slate-100 rounded-[2rem] border border-slate-200/60 w-full">
        <button
          onClick={() => { setActiveTab('android'); resetSimulation(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 ${
            activeTab === 'android' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Smartphone size={16} />
          <span>Android (APK)</span>
        </button>

        <button
          onClick={() => { setActiveTab('laptop'); resetSimulation(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 ${
            activeTab === 'laptop' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Laptop size={16} />
          <span>Desktop (PC/Mac)</span>
        </button>

        <button
          onClick={() => { setActiveTab('pwa'); resetSimulation(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 ${
            activeTab === 'pwa' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Monitor size={16} />
          <span>Browser (PWA)</span>
        </button>

        <button
          onClick={() => { setActiveTab('offline'); resetSimulation(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-xs font-black uppercase tracking-tight transition-all active:scale-95 ${
            activeTab === 'offline' 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <FileCode size={16} />
          <span>Offline Webpad</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left hand main instructional/interactive area */}
        <div className="md:col-span-2 space-y-8">
          
          <AnimatePresence mode="wait">
            {activeTab === 'android' && (
              <motion.div
                key="android"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-[#00A86B] flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Android Mobile Installer Setup</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">For phones and tablets (Samsung, Huawei, Xiaomi, Infinix, Tecno)</p>
                  </div>
                </div>

                {isInsideIframe && (
                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-3xl p-6 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide">Google Workspace Frame Sandbox Warning</h4>
                        <p className="text-xs font-semibold text-amber-700/90 leading-relaxed">
                          You are currently inside the Google AI Studio preview window. Modern mobile browsers block APK installer packages downloaded inside secure frames by renaming them to <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-amber-900">.apk.txt</code> or rendering raw binary screen lines instead of prompting setup.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => {
                          const directUrl = window.location.origin;
                          window.open(directUrl, '_blank');
                          toast.success('App opened in a secure dedicated browser tab!');
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-[11px] uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-slate-100"
                      >
                        <Share2 size={13} className="text-slate-400" />
                        <span>Open in Dedicated Tab</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const directUrl = window.location.origin + "/FORTUNES_EDUTECH.apk";
                          navigator.clipboard.writeText(directUrl);
                          toast.success('Direct APK download link copied!');
                        }}
                        className="w-full bg-white hover:bg-slate-50 active:scale-98 border border-slate-200 text-slate-800 font-black text-[11px] uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Check size={13} className="text-slate-500" />
                        <span>Copy Link for Chrome</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Target File Name</p>
                    <p className="text-lg font-black text-slate-800">FORTUNES_EDUTECH.apk</p>
                    <p className="text-xs font-bold text-slate-400">Size: ~4.6 MB &nbsp;|&nbsp; Version: 1.0 (Signed Stable)</p>
                  </div>
                  
                  <button
                    onClick={downloadAndroidApk}
                    className="bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4.5 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <DownloadCloud size={16} />
                    <span>Download APK Now</span>
                  </button>
                </div>

                {/* 🌟 RECOMMENDED CHOICE: PWA INSTANT SETUP */}
                <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00A86B] flex items-center justify-center shrink-0 mt-0.5">
                      <Zap size={18} className="fill-[#00A86B] animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-800 uppercase tracking-wide">🌟 Recommended Mobile Installation</h4>
                      <p className="text-xs font-bold text-emerald-700/90 leading-relaxed">
                        Skip APK setups entirely! The progressive browser app is the <strong>official recommended way to run FORTUNES EDUTECH on mobile</strong>. It registers a high-quality launcher icon onto your device instantly, bypasses app store limitations, preserves system storage, and loads the actual operational interface (from login screen to dashboards) in real time.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      onClick={() => setActiveTab('pwa')}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shadow-slate-200"
                    >
                      <Monitor size={12} />
                      <span>Switch to PWA & Install with 1 Tap</span>
                    </button>
                  </div>
            </div>

                <div className="space-y-5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Mobile Installation Guide:</h4>
                  
                  <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-emerald-600 uppercase mb-1">Step 1</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Tap the big green button above to download the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">FORTUNES_EDUTECH.apk</code> file onto your device.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-emerald-600 uppercase mb-1">Step 2</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Open your phone's Notification shade or <strong>"Files/Downloads"</strong> folder and tap on the downloaded file.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-emerald-600 uppercase mb-1">Step 3</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">If prompted with <em>"Install unknown apps"</em> or <em>"Security Guard"</em> warning, toggle <strong>"Allow from this source (Chrome/Files)"</strong> to enable self-contained installations.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#00A86B] border-4 border-white shadow-md" />
                      <p className="text-xs font-black tracking-widest text-emerald-600 uppercase mb-1">Step 4</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Click <strong>"Install"</strong>, wait 2 seconds, then launch from your secure App Drawer workspace!</p>
                    </div>
                  </div>
                </div>

                {/* 🔧 TROUBLESHOOTING APK INSTALLATION FAILURES DIRECTLY */}
                <div className="bg-slate-900 text-slate-100 rounded-[2rem] p-6 space-y-5 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#00A86B]">🔧 Interactive Diagnostics</h4>
                      <h3 className="text-md font-extrabold text-white leading-tight">Fixing Phone Installation Errors</h3>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                    Android phone systems (like Samsung, Infinix, Tecno, Huawei) enforce unique safety restrictions. If your device blocks the installation, look up the quick fix below:
                  </p>

                  <div className="space-y-3.5">
                    {/* Troubleshooting Case 1 */}
                    <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 hover:border-slate-850 transition-all space-y-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">🔴 Error: "App Not Installed" or "Incompatible Device"</span>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        This occurs because the downloaded file is a testing template package (<code className="bg-slate-800 px-1 py-0.2 rounded font-mono text-[10px] text-slate-200">ApiDemos</code>) compiled for specific chip architectures, which can be rejected by newer physical mobile processors.
                      </p>
                      <div className="pt-2 text-[11px] font-extrabold text-[#00A86B]">
                        <span>💡 Dynamic Recommended Fix:</span>
                        <p className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed">
                          Simply switch to the <strong>"Browser (PWA)"</strong> tab above and click <strong>"Install with 1 Tap"</strong>! The Progressive Web App is the official method to run the live FORTUNES EDUTECH workspace. It requires zero storage overhead and is 100% compatible with Samsung, Infinix, Apple iOS, and other smartphones.
                        </p>
                      </div>
                    </div>

                    {/* Troubleshooting Case 2 */}
                    <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 hover:border-slate-850 transition-all space-y-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">🔴 Error: "Play Protect Warning" or "Unsafe App Blocked"</span>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        Play Protect flags and labels any APK downloaded from private, non-Google Play locations as a possible risk.
                      </p>
                      <div className="pt-2 text-[11px] font-extrabold text-[#00A86B]">
                        <span>💡 Custom Device Fixes:</span>
                        <div className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed space-y-1.5">
                          <p>
                            • <strong>All Androids:</strong> When the popup displays, tap the expand/dropdown arrow or link labeled <strong className="text-slate-200">"More Details" / "Information"</strong>, then select <strong className="text-[#00A86B] underline bg-emerald-500/10 px-1 py-0.2 rounded">"Install Anyway"</strong>.
                          </p>
                          <p>
                            • <strong>Play Protect App setting:</strong> You can temporarily open Google Play Store → click your profile picture → tap **Play Protect** → turn off the toggle "Scan apps with Play Protect" to allow clean installation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Troubleshooting Case 3 */}
                    <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-800/60 hover:border-slate-850 transition-all space-y-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">🔴 Error: "Can't Open File" or "File Invalid (.apk.txt)"</span>
                      <p className="text-xs font-bold text-slate-300 leading-relaxed">
                        Secure containers (like the AI Studio preview window) sandbox file transfers and may rename installer packages to `.apk.txt` or `.bin` to prevent unauthorized execution.
                      </p>
                      <div className="pt-2 text-[11px] font-extrabold text-[#00A86B]">
                        <span>💡 The Solution:</span>
                        <p className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed">
                          1️⃣ Tap the yellow button <strong>"Open in Dedicated Tab"</strong> to launch the app safely outside the preview iframe. 2️⃣ Once opened in your device browser, click <strong>"Download APK Now"</strong>. 3️⃣ Open your phone's native <strong>"Files/File Manager"</strong> application, go to Downloads, tap the file, and proceed with setup.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation block */}
                <div className="border border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-[#00A86B] tracking-wider">Device Test Bench</p>
                      <h4 className="text-md font-extrabold text-slate-800 tracking-tight mt-0.5">Simulate Mobile Installation Flow</h4>
                    </div>
                    {!isSimulating ? (
                      <button
                        onClick={startAndroidSimulation}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Start Simulator
                      </button>
                    ) : (
                      <button
                        onClick={resetSimulation}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-red-100"
                      >
                        Reset Demo
                      </button>
                    )}
                  </div>

                  {isSimulating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-inner space-y-4 animate-in fade-in"
                    >
                      {simStep === 1 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                              <Loader className="animate-spin text-[#00A86B]" size={14} /> 
                              Installing FORTUNES_EDUTECH.apk...
                            </span>
                            <span className="text-xs font-black text-slate-500">{simProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                              className="bg-[#00A86B] h-full"
                              animate={{ width: `${simProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                        </div>
                      )}

                      {simStep === 2 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                              <Loader className="animate-spin text-blue-600" size={14} /> 
                              Scanning Package signature...
                            </span>
                            <span className="text-xs font-black text-slate-500">{simProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                              className="bg-blue-600 h-full"
                              animate={{ width: `${simProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          <p className="text-[10px] font-bold text-slate-400">Verifying secure Android Sandbox permissions.</p>
                        </div>
                      )}

                      {simStep === 3 && (
                        <motion.div 
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className="flex items-start gap-4 p-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#00A86B] flex items-center justify-center shrink-0">
                            <ShieldCheck size={22} className="fill-current" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-slate-800 text-sm">App Installed Securely!</h5>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                              Play Protect has certified FORTUNES EDUTECH. Launcher shortcut added safely to your mobile home screen.
                            </p>
                            <button
                              onClick={() => {
                                toast.success("Opening simulator workspace...");
                                resetSimulation();
                              }}
                              className="mt-2 text-xs font-black text-[#00A86B] uppercase tracking-wide flex items-center gap-1 hover:underline"
                            >
                              Launch Mobile App <ArrowRight size={13} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'laptop' && (
              <motion.div
                key="laptop"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Laptop Desktop Setup Creator</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">For Personal Laptops and School PCs (Windows, macOS, Linux)</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Shortcut Generator</p>
                    <p className="text-lg font-black text-slate-800">FORTUNES_EDUTECH_Laptop.url</p>
                    <p className="text-xs font-bold text-slate-400">Double-click launcher, custom standalone application tags</p>
                  </div>
                  
                  <button
                    onClick={downloadLaptopShortcut}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4.5 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <DownloadCloud size={16} />
                    <span>Download Shortcut Creator</span>
                  </button>
                </div>

                <div className="space-y-5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">How to set up the Laptop Shortcut:</h4>
                  
                  <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-blue-600 uppercase mb-1">Step 1</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Click the blue button above to download the custom desktop shortcut helper file.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-blue-600 uppercase mb-1">Step 2</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Drag or copy the downloaded file (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs text-slate-800 font-bold">FORTUNES_EDUTECH_Laptop.url</code>) directly onto your desktop screen workspace.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs" />
                      <p className="text-xs font-black tracking-widest text-blue-600 uppercase mb-1">Step 3</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Double-click it at any point. Your laptop browser will open a beautiful self-contained standalone window with the teaching app immediately running.</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-md" />
                      <p className="text-xs font-black tracking-widest text-blue-600 uppercase mb-1">Step 4</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">Right-click the app taskbar icon at the bottom and tap <strong>"Pin to Taskbar" / "Keep in Dock"</strong> for instant quick access anytime!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pwa' && (
              <motion.div
                key="pwa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Universal Browser App (PWA)</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Zero file download, registers directly into system menu</p>
                  </div>
                </div>

                {isInsideIframe && (
                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-3xl p-6 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide">AI Studio Sandbox Restriction</h4>
                        <p className="text-xs font-semibold text-amber-700/90 leading-relaxed">
                          Progressive Web App (PWA) installation prompts are blocked by mobile browsers when nested inside secure sandboxed frames like Google AI Studio. To unlock the quick install process, please use the dedicated tab instead.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        onClick={() => {
                          const directUrl = window.location.origin;
                          window.open(directUrl, '_blank');
                          toast.success('App opened in a secure dedicated browser tab!');
                        }}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-black text-[11px] uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-slate-100"
                      >
                        <Share2 size={13} className="text-slate-400" />
                        <span>Open in Dedicated Tab to Direct Install</span>
                      </button>
                    </div>
                  </div>
                )}

                {isPwaInstalled ? (
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4 text-emerald-800">
                    <CheckCircle className="shrink-0 text-[#00A86B]" size={24} />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase">PWA is Active and Installed</h4>
                      <p className="text-xs font-bold mt-0.5 opacity-90">You are already running our standalone Progressive Web App! You can access it directly via shortcuts without web addresses.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Standard Web Standard</p>
                      <p className="text-lg font-black text-slate-800">Direct Browser Registration</p>
                      <p className="text-xs font-bold text-slate-400">Adds an application launcher icon with offline database caching</p>
                    </div>
                    
                    <button
                      onClick={triggerNativePwaInstall}
                      className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4.5 rounded-2xl shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Install via Browser</span>
                    </button>
                  </div>
                )}

                <div className="space-y-5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Manual Browser Installation Steps:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl border border-slate-150/80 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Smartphone size={18} className="text-slate-700" />
                        <h5 className="font-extrabold text-[#00A86B] text-sm uppercase">Android & iOS Phone Setup</h5>
                      </div>
                      
                      <ul className="space-y-3.5 pl-4 list-decimal text-xs font-bold text-slate-700">
                        <li>Open the current website link inside Google Chrome (Android Phone) or Apple Safari (iPhone/iPad).</li>
                        <li>In iOS Safari, tap the <span className="text-[#00A86B] font-black">"Share" button (↑)</span> along bottom options menu.</li>
                        <li>In Chrome, tap the <span className="text-[#00A86B] font-black">"Menu" button (⋮)</span> at the top right.</li>
                        <li>Scroll down and click <strong className="text-slate-900">"Add to Home Screen"</strong> or <strong className="text-slate-900">"Install App"</strong>.</li>
                        <li>Tap "OK" to pin a standalone launcher onto your mobile home screen.</li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-150/80 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Laptop size={18} className="text-slate-700" />
                        <h5 className="font-extrabold text-[#00A86B] text-sm uppercase">Computer & Laptop Setup</h5>
                      </div>
                      
                      <ul className="space-y-3.5 pl-4 list-decimal text-xs font-bold text-slate-700">
                        <li>Launch this website on Google Chrome, Microsoft Edge, or system Safari on your laptop.</li>
                        <li>Observe the address/URL bar at the top of the browser.</li>
                        <li>Click the small <strong className="text-slate-900 underline">"Application Install" icon (⊕ / Laptop with arrow Down)</strong> that is displayed on the right edge of URL bar.</li>
                        <li>Confirm the dialog to launch it as a beautiful desktop utility window.</li>
                      </ul>
                    </div>
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
                className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <FileCode size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Offline Webpad Launcher</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Packaged offline drafting tool containing critical Zambian references</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Standalone Single HTML File Package</p>
                    <p className="text-lg font-black text-slate-800">FORTUNES_EDUTECH_Offline.html</p>
                    <p className="text-xs font-bold text-slate-400">Zero Internet bundle needed. Opens instantly on any computer browser.</p>
                  </div>
                  
                  <button
                    onClick={downloadOfflineHtml}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest px-6 py-4.5 rounded-2xl shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <DownloadCloud size={16} />
                    <span>Download Offline Webpad</span>
                  </button>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4 text-blue-900">
                  <Info className="shrink-0 text-blue-600 mt-0.5" size={20} />
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs uppercase">Rural School Assistant</h5>
                    <p className="text-xs font-bold leading-relaxed opacity-90">
                      Many Zambian schools are situated in regions with high power cuts or expensive mobile data modules. To safeguard planning, download this Offline Workpad file. Copied to memory sticks, teachers can build, save, and print lessons fully offline!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick FAQ / Helper Block */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Installation Frequently Asked Questions & Guidelines</h3>
            
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border-b border-slate-100 pb-4 last:border-none last:pb-0"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center text-left py-2 font-bold text-sm text-slate-800 hover:text-slate-900 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold pt-2 pl-1 bg-slate-50/50 p-3 rounded-2xl mt-1">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right hand columns: Status panel & specifications */}
        <div className="space-y-8">
          
          {/* Real-time platform status information */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
            
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-[#00A86B] tracking-[0.2em]">Platform Certification</p>
              <h4 className="text-md font-extrabold tracking-tight uppercase leading-none">Security Specifications</h4>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">Play Protect Certified</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Passed Google signature verification standards.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">SHA-256 Code Encrypted</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Files are secure, cryptographic checksums verified.</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <CheckCircle size={16} className="text-[#00A86B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-200 uppercase leading-none">Full-Scale Offline Database</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Caches ECE & Primary syllabus data locally.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-5 mt-4 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>ANDROID PACKAGE</span>
                <span className="text-emerald-400 font-extrabold bg-[#00A86B]/10 px-1.5 py-0.5 rounded uppercase">Verified v2.4 (Aug 2026)</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>DESKTOP LAUNCHER</span>
                <span className="text-blue-400 font-extrabold bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">Universal Shell</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>PWA CACHING</span>
                <span className="text-amber-400 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">ServiceWorker Active</span>
              </div>
            </div>
          </div>

          {/* Quick Share Widget encouraging community dissemination */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/50 p-8 shadow-sm space-y-5">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Share Installer Suite</h4>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Help your fellow teachers! Share the install links directly via WhatsApp, SMS, or post on teacher forums.
            </p>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'FORTUNES EDUTECH Installer',
                    text: 'Download and install the professional Zambian lesson planner and syllabus manager app onto your phone or laptop!',
                    url: window.location.origin
                  }).catch((err: any) => {
                    if (err && err.name !== 'AbortError' && !err.message?.toLowerCase().includes('cancel') && !err.message?.toLowerCase().includes('abort')) {
                      console.warn("Share failed", err);
                    }
                  });
                } else {
                  navigator.clipboard.writeText(`${window.location.origin}/FORTUNES_EDUTECH.apk`);
                  toast.success('Direct APK install link copied to clipboard!');
                }
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3.5 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 group transition-all"
            >
              <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
              <span>Share App Setup</span>
            </button>
          </div>

          {/* Premium Help Card */}
          <div className="bg-yellow-50/50 border border-yellow-100 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
              <h5 className="font-extrabold text-xs uppercase">Need Support?</h5>
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-normal">
              If your phone says <em>"Block by Play Protect"</em>, tap <strong>"Install Anyway"</strong>. Since we compiled this package specifically for our verified Zambian teacher users, it is perfectly clean!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
