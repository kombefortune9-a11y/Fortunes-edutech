/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { trackInteraction, syncPendingTelemetry } from './services/telemetryService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocGenerator } from './components/DocGenerator';
import { DocPreview } from './components/DocPreview';
import { RecordOfWork } from './components/RecordOfWork';
import { ModuleManager } from './components/ModuleManager';
import { CatchUpGenerator } from './components/CatchUpGenerator';
import { AssignmentHub } from './components/AssignmentHub';
import { AssessmentTracker } from './components/AssessmentTracker';
import { UserManual } from './components/UserManual';
import { VideoTutorialHub } from './components/VideoTutorialHub';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { GenerationParams } from './services/geminiService';
import { DocType } from './constants';
import { isDeveloperEmail } from './constants';
import { useAuth } from './components/FirebaseProvider';
import { InstallPrompt } from './components/InstallPrompt';
import Settings from './components/Settings';
import InstallAndDownload from './components/InstallAndDownload';
import InformantTicker from './components/InformantTicker';
import { ReviewSystem } from './components/ReviewSystem';
import { TermsModal } from './components/TermsModal';
import { SyllabusIntegrityAuditPanel } from './components/SyllabusIntegrityAuditPanel';
import { SyllabusLibrary } from './components/SyllabusLibrary';

import { Toaster } from 'react-hot-toast';
import { UserMonitor } from './components/UserMonitor';
import { TeachersAssistant } from './components/TeachersAssistant';

export default function App() {
  const { user, userType, signInWithGoogle, signInAsGuest, isLoggingIn, authError } = useAuth();
  const isDeveloper = userType === 'developer' || isDeveloperEmail(user?.email);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [generatorType, setGeneratorType] = useState<DocType | undefined>(undefined);
  const [generatedDoc, setGeneratedDoc] = useState<{
    content: string;
    params: GenerationParams;
  } | null>(null);

  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [isVerifyingGuest, setIsVerifyingGuest] = useState(false);

  useEffect(() => {
    if (user) {
      syncPendingTelemetry();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      trackInteraction(activeSection, 'view');
    }
  }, [activeSection, user]);

  const handleVerifyAndLoginGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = guestEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    setIsVerifyingGuest(true);
    try {
      await signInAsGuest(cleanEmail);
    } finally {
      setIsVerifyingGuest(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] px-4 py-8">
        <div className="text-center space-y-6 animate-in fade-in duration-700 max-w-md w-full">
           <div className="mx-auto w-20 h-20 bg-[#00A86B] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
             <GraduationCap size={40} />
           </div>
           
           <div className="space-y-1.5">
             <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">FORTUNES EDUTECH</h1>
             <p className="text-xs text-[#00A86B] font-extrabold tracking-wider lowercase">plan competently.</p>
             <p className="text-slate-500 font-medium text-xs sm:text-sm">Universal Sign In & Free Trial Access</p>
           </div>
           
           <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-left space-y-5">
             <div>
               <h2 className="text-base font-black text-slate-900 tracking-tight">Sign In / Instant Free Trial</h2>
               <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                 Enter your Gmail or email address for instant access. Subscribed accounts unlock full features automatically, while new users get instant Trial Access.
               </p>
             </div>

             {/* Primary Option 1: Instant Email / Gmail Sign-In Form */}
             <form onSubmit={handleVerifyAndLoginGuest} className="space-y-3">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 pl-1 flex items-center justify-between">
                   <span>Email / Gmail Address</span>
                   <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold lowercase">100% reliable</span>
                 </label>
                 <input
                   type="email"
                   value={guestEmail}
                   onChange={(e) => setGuestEmail(e.target.value)}
                   placeholder="e.g. teacher@gmail.com"
                   required
                   disabled={isVerifyingGuest}
                   className="w-full bg-slate-50 border-2 border-emerald-500/30 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                 />
               </div>

               <button
                 type="submit"
                 disabled={isVerifyingGuest || !guestEmail.trim()}
                 className="w-full bg-[#00A86B] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-200 active:scale-95"
               >
                 {isVerifyingGuest ? (
                   <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 ) : null}
                 {isVerifyingGuest ? 'Accessing Account...' : 'Continue with Email / Enter'}
               </button>
             </form>

             <div className="relative flex items-center justify-center my-2">
               <div className="border-t border-slate-200 w-full"></div>
               <span className="bg-white px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider absolute">OR USE GOOGLE POPUP</span>
             </div>

             {/* Secondary Option 2: Google OAuth Button */}
             <div className="space-y-2">
               <button
                 onClick={signInWithGoogle}
                 disabled={isLoggingIn}
                 className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-800 disabled:bg-slate-400 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
               >
                 {isLoggingIn ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     <span>Connecting to Google...</span>
                   </>
                 ) : (
                   <>
                     <svg className="w-4 h-4" viewBox="0 0 24 24">
                       <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                       <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                       <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                       <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                     </svg>
                     <span>Login with Google Popup</span>
                   </>
                 )}
               </button>
               <p className="text-[10px] text-slate-400 text-center font-medium">
                 If mobile browser blocks Google popup with a 403 error, use the green Email box above.
               </p>
             </div>

             {/* Terms Agreement Footer */}
             <div className="pt-2 text-center text-slate-400 text-[11px] font-medium leading-normal border-t border-slate-100">
               <span>By logging in or continuing, you agree to our </span>
               <button 
                 type="button"
                 onClick={() => setShowTermsModal(true)}
                 className="text-[#00A86B] font-bold underline hover:text-emerald-700 transition-colors inline-block cursor-pointer"
               >
                 Terms of Use & Privacy Policy
               </button>
             </div>
           </div>

           <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

           {authError && (
             <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2 animate-in fade-in duration-200">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                 <span className="text-amber-700 font-black text-[9px] uppercase tracking-wider">Authentication Notice</span>
               </div>
               <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                 {authError}
               </p>
               <div className="bg-amber-100/50 p-2.5 rounded-xl text-[10px] font-bold text-slate-600 flex flex-col gap-1 leading-normal">
                 <span>💡 <strong>Tip for Mobile Browsers / Preview:</strong> If Google Sign-In popup gives a 403 error due to browser iframe restrictions, simply type your Gmail address in the box above and click <strong>"Continue as Guest / Enter"</strong> for instant trial access!</span>
               </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  const handleGenerate = (content: string, params: GenerationParams) => {
    if (!content) return;
    trackInteraction('generator', 'generate', params.type);
    setGeneratedDoc({ content, params });
    setActiveSection('preview');
  };

  const handleStartNew = (type?: DocType) => {
    trackInteraction('generator', 'start', type || 'records_of_work');
    if (type === 'records_of_work') {
      setActiveSection('records_of_work');
      return;
    }
    if (type === 'syllabi') {
      setActiveSection('library');
      return;
    }
    setGeneratorType(type);
    setGeneratedDoc(null);
    setActiveSection('generator');
  };

  const renderContent = () => {
    try {
      if (activeSection === 'preview') {
        if (generatedDoc) {
          return (
            <DocPreview 
              content={generatedDoc.content} 
              metadata={generatedDoc.params}
              onBack={() => setActiveSection('generator')}
            />
          );
        } else {
          setActiveSection('dashboard');
          return null;
        }
      }

      switch (activeSection) {
        case 'dashboard':
          return (
            <Dashboard 
              onStartNew={handleStartNew} 
              onStartCatchUp={() => setActiveSection('catch_up')} 
              onNavigate={(section) => setActiveSection(section)}
              onOpenUserMonitor={() => setActiveSection('admin_portal')}
            />
          );
        case 'assessment_tracker':
          return (
            <AssessmentTracker 
              onBack={() => setActiveSection('dashboard')}
              onNavigate={(section) => setActiveSection(section)}
            />
          );
        case 'user_manual':
          return (
            <UserManual 
              onBack={() => setActiveSection('dashboard')}
            />
          );
        case 'video_tutorials':
          if (!isDeveloper) {
            return (
              <Dashboard 
                onStartNew={handleStartNew} 
                onStartCatchUp={() => setActiveSection('catch_up')} 
                onNavigate={(s) => setActiveSection(s)}
                onOpenUserMonitor={() => setActiveSection('admin_portal')}
              />
            );
          }
          return <VideoTutorialHub onNavigateToSection={(s) => setActiveSection(s)} onBack={() => setActiveSection('dashboard')} />;
        case 'catch_up':
          return (
            <CatchUpGenerator 
              onGenerate={handleGenerate}
              onBack={() => setActiveSection('dashboard')}
            />
          );
        case 'records_of_work':
          return <RecordOfWork onBack={() => setActiveSection('dashboard')} />;
        case 'knowledge_base':
          return <ModuleManager onBack={() => setActiveSection('dashboard')} />;
        case 'syllabus_audit':
          return <SyllabusIntegrityAuditPanel defaultView="audit" onBack={() => setActiveSection('dashboard')} />;
        case 'generator':
          return (
            <DocGenerator 
              initialType={generatorType}
              onGenerate={handleGenerate} 
              onBack={() => setActiveSection('dashboard')}
              onNavigate={(section) => setActiveSection(section)}
            />
          );
        case 'research':
          return <AssignmentHub onBack={() => setActiveSection('dashboard')} />;
        case 'library':
          return <SyllabusIntegrityAuditPanel defaultView="library" onBack={() => setActiveSection('dashboard')} />;
        case 'settings':
          return <Settings onBack={() => setActiveSection('dashboard')} />;
        case 'downloads':
          return <InstallAndDownload onBack={() => setActiveSection('dashboard')} />;
        case 'admin_portal':
          return <UserMonitor isOpen={true} onClose={() => setActiveSection('dashboard')} />;
        default:
          return (
            <Dashboard 
              onStartNew={handleStartNew} 
              onStartCatchUp={() => setActiveSection('catch_up')} 
              onNavigate={(section) => setActiveSection(section)}
              onOpenUserMonitor={() => setActiveSection('admin_portal')}
            />
          );
      }
    } catch (error) {
      console.error("App render error:", error);
      return (
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
          <button 
            onClick={() => {
              setActiveSection('dashboard');
              setGeneratedDoc(null);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="h-screen bg-slate-50 font-sans flex flex-col overflow-hidden relative">
      {/* Ambient background blur blobs for gorgeous glassmorphism depth */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#00A86B]/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row h-full overflow-hidden">
        <Toaster position="top-right" />
        
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            if (['schemes_of_work', 'weekly_forecast', 'lesson_plan', 'lesson_notes', 'assessments'].includes(section)) {
              handleStartNew(section as DocType);
            } else {
              setActiveSection(section);
              if (section !== 'preview') setGeneratedDoc(null);
            }
          }} 
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <InstallPrompt />
          <InformantTicker />
          
          <main className="flex-1 overflow-y-auto w-full relative z-10">
            {renderContent()}
          </main>
        </div>
      </div>
      <TeachersAssistant />
    </div>
  );
}
