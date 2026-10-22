import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  GraduationCap, 
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  FileCode,
  Share2,
  History as HistoryIcon,
  BookMarked,
  Smartphone,
  Download,
  Video,
  Lock,
  ClipboardList,
  BookOpen,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Calendar,
  Database,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail, APP_VERSION } from '../constants';
import { FortunesInsignia } from './FortunesLogo';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { TopMusicPlayer } from './TopMusicPlayer';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const { user, userType, logout } = useAuth();
  const isDeveloper = userType === 'developer' || isDeveloperEmail(user?.email);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll when mobile menu sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuGroups = [
    {
      title: 'Main Navigation',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        ...(isDeveloper ? [{ id: 'admin_portal', label: 'Admin & User Monitor', icon: <ShieldCheck size={18} className="text-emerald-400" /> }] : []),
        { id: 'knowledge_base', label: 'Knowledge Base', icon: <Database size={18} /> },
        { id: 'assessment_tracker', label: 'Assessment Tracker', icon: <ClipboardList size={18} /> },
        ...(isDeveloper ? [{ id: 'video_tutorials', label: 'Video Demos & Tutorials', icon: <Video size={18} /> }] : []),
        { id: 'user_manual', label: 'User Manual (PDF)', icon: <BookOpen size={18} /> },
      ]
    },
    {
      title: 'Generators and Tools',
      items: [
        { id: 'schemes_of_work', label: '1. Schemes of work', icon: <BookMarked size={18} /> },
        { id: 'weekly_forecast', label: '2. Weekly forecast', icon: <Calendar size={18} /> },
        { id: 'lesson_plan', label: '3. Lesson planning', icon: <FileCode size={18} /> },
        { id: 'smart_planning', label: '⚡ Smart Planning (Segmented)', icon: <Sparkles size={18} className="text-emerald-500 animate-pulse" /> },
      ]
    },
    {
      title: 'Links',
      items: [
        { id: 'payslip', label: '1. Request payslips', icon: <ExternalLink size={18} />, isExternal: true, url: 'https://epdmis.grz.gov.zm/request-payslip/' },
        { id: 'moge', label: '2. Ministry portal', icon: <ExternalLink size={18} />, isExternal: true, url: 'https://www.edu.gov.zm/?page_id=1142' },
        { id: 'cbc', label: '3. Download CBC materials', icon: <ExternalLink size={18} />, isExternal: true, url: 'https://library.cdcrepository.info/' },
      ]
    },
    {
      title: 'System & Account',
      items: [
        { id: 'records_of_work', label: 'Recent Documents', icon: <HistoryIcon size={18} /> },
        { id: 'downloads', label: 'Install Web App (PWA)', icon: <Download size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  // Flat list for desktop nav bar
  const flatMenuItems = menuGroups.flatMap(group => group.items);

  const mobileDrawerContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="md:hidden">
          {/* Dimmed Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Full Vertical Left-Sliding Drawer Sheet */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[9999] w-[85vw] sm:w-[320px] max-w-[350px] bg-white shadow-2xl border-r border-slate-200/80 flex flex-col h-full overflow-hidden"
          >
            {/* Drawer Top Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00A86B] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                  <GraduationCap size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight block leading-none truncate">FORTUNES EDUTECH</span>
                    <span className="text-[8px] px-1 py-0.5 rounded font-black text-emerald-900 bg-emerald-100 border border-emerald-300 uppercase shrink-0">
                      {APP_VERSION}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-[#00A86B] font-bold tracking-wider lowercase leading-none">your CBC partner</span>
                    <span className={`text-[7.5px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider transition-all select-none ${
                      isOnline 
                        ? 'bg-emerald-100 text-[#00A86B]' 
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {isOnline ? 'Offline Ready' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'FORTUNES EDUTECH',
                        text: 'Teacher Resource Suite',
                        url: window.location.origin,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      toast.success("App link copied!");
                    }
                  }}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                  title="Share App"
                >
                  <Share2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors border border-slate-200/60 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Unfolded Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
              {menuGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{group.title}</span>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item, idx) => {
                      const isActive = activeSection === item.id;
                      const isLocked = 'isLocked' in item && item.isLocked;
                      const isExternal = 'isExternal' in item && item.isExternal;
                      const badge = 'badge' in item ? (item as any).badge : null;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (groupIdx * 3 + idx) * 0.015 }}
                          whileTap={isLocked ? {} : { scale: 0.98 }}
                          onClick={() => {
                            if (isLocked) {
                              toast.error("This tool is currently locked.");
                            } else if (isExternal && 'url' in item) {
                              window.open(item.url, '_blank');
                            } else {
                              onSectionChange(item.id);
                              setIsOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-tight transition-all text-left cursor-pointer ${
                            isActive 
                              ? 'bg-[#00A86B] text-white font-black shadow-md shadow-emerald-500/20' 
                              : isLocked
                                ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60 border border-dashed border-slate-200'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/50 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                              {isLocked ? <Lock size={16} className="text-slate-400 animate-pulse" /> : React.cloneElement(item.icon, { size: 16 })}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {badge && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-wider uppercase ${
                                isActive 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {badge}
                              </span>
                            )}
                            {!isLocked && (
                              <ChevronRight size={14} className={`shrink-0 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom User Session Info & Sign Out Button */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2">
              {user && (
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-slate-500">
                  <span className="truncate font-semibold text-slate-700">{user.email || 'Teacher Account'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase shrink-0">Active</span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest transition-all border border-red-200/80 cursor-pointer shadow-xs"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="relative z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/40 px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-sm min-w-0 gap-1.5 xs:gap-3">
      <motion.div 
        className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 shrink-0"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSectionChange('dashboard')}
      >
        <motion.div 
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden shrink-0 shadow-md bg-gradient-to-br from-[#064223] via-[#042e18] to-[#011a0d] border border-emerald-500/40 p-1 relative flex items-center justify-center"
          animate={{ rotate: [0, -2, 2, -2, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 6, duration: 1 }}
        >
          <FortunesInsignia size="90%" withGlow={false} />
        </motion.div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight uppercase">
              FORTUNES
            </span>
            <span className="text-xs xs:text-sm sm:text-base md:text-lg font-black text-[#65DB00] tracking-tight uppercase">
              EDUTECH
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
            <span className="text-[8px] xs:text-[9px] sm:text-[10px] text-[#00A86B] font-bold tracking-wider lowercase leading-none whitespace-nowrap">your CBC partner</span>
            <span className={`text-[6.5px] xs:text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded font-black uppercase tracking-wider transition-all select-none whitespace-nowrap ${
              isOnline 
                ? 'bg-emerald-100 text-[#00A86B]' 
                : 'bg-amber-100 text-amber-800 animate-pulse'
            }`}>
              {isOnline ? 'Offline Ready' : 'Offline'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Desktop Navigation Links */}
      <nav className="hidden xl:flex items-center gap-1 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/40">
        {flatMenuItems.filter(item => !('isExternal' in item)).map((item) => {
          const isActive = activeSection === item.id;
          const isLocked = 'isLocked' in item && item.isLocked;
          return (
            <motion.button
              key={item.id}
              whileHover={isLocked ? {} : { scale: 1.05 }}
              whileTap={isLocked ? {} : { scale: 0.95 }}
              onClick={() => {
                if (isLocked) {
                  toast.error("This tool is currently locked.");
                } else {
                  onSectionChange(item.id);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                isActive 
                  ? 'bg-[#00A86B] text-white shadow-md shadow-emerald-100/50' 
                  : isLocked
                    ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60 border border-dashed border-slate-200'
                    : 'text-slate-700 hover:text-[#0F172A] hover:bg-white/70'
              }`}
            >
              {isLocked ? <Lock size={16} className="text-slate-400 animate-pulse" /> : React.cloneElement(item.icon, { size: 16 })}
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Right Header Group: Music Player sitting right next to the green sliding menu button */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto z-50">
        <TopMusicPlayer activeSection={activeSection} onNavigateToDashboard={() => onSectionChange('dashboard')} />

        <motion.button 
          whileHover={{ scale: 1.08, rotate: 12 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'FORTUNES EDUTECH',
                text: 'Teacher Resource Suite',
                url: window.location.origin,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.origin);
              toast.success("App link copied!");
            }
          }}
          className="hidden sm:flex text-slate-600 p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors border-2 border-slate-200/80 hover:border-slate-400 shrink-0"
          title="Share App"
        >
          <Share2 size={18} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white bg-[#00A86B] hover:bg-emerald-700 active:bg-emerald-800 p-2 sm:p-2.5 rounded-xl transition-all border border-emerald-600 flex items-center justify-center cursor-pointer shrink-0 z-50 shadow-md active:scale-95"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
        </motion.button>
      </div>

      {/* Render Mobile Drawer Sheet via Portal into document.body */}
      {mounted && createPortal(mobileDrawerContent, document.body)}
    </header>
  );
}

