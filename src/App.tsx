/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  trackInteraction,
  syncPendingTelemetry,
} from "./services/telemetryService";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { DocGenerator } from "./components/DocGenerator";
import { DocPreview } from "./components/DocPreview";
import { RecordOfWork } from "./components/RecordOfWork";
import { ModuleManager } from "./components/ModuleManager";
import { CatchUpGenerator } from "./components/CatchUpGenerator";
import { AssignmentHub } from "./components/AssignmentHub";
import { AssessmentTracker } from "./components/AssessmentTracker";
import { UserManual } from "./components/UserManual";
import { VideoTutorialHub } from "./components/VideoTutorialHub";
import {
  GraduationCap,
  ArrowLeft,
  Download,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { GenerationParams } from "./services/geminiService";
import { DocType } from "./constants";
import { isDeveloperEmail } from "./constants";
import { useAuth } from "./components/FirebaseProvider";
import { InstallPrompt } from "./components/InstallPrompt";
import Settings from "./components/Settings";
import InstallAndDownload from "./components/InstallAndDownload";
import InformantTicker from "./components/InformantTicker";
import { ReviewSystem } from "./components/ReviewSystem";
import { TermsModal } from "./components/TermsModal";
import { SyllabusIntegrityAuditPanel } from "./components/SyllabusIntegrityAuditPanel";
import { FortunesLogo } from "./components/FortunesLogo";
import { SyllabusLibrary } from "./components/SyllabusLibrary";

import { Toaster, toast } from "react-hot-toast";
import { UserMonitor } from "./components/UserMonitor";
import { TeachersAssistant } from "./components/TeachersAssistant";
import {
  CurriculumPlanningHub,
  InstructionalDeliveryHub,
  ResearchVideoTaskHub,
  TeacherResourcesHub,
} from "./components/CombinedHubs";
import { MusicPlayerProvider } from "./components/MusicPlayerContext";

export default function App() {
  const {
    user,
    userType,
    signInWithGoogle,
    signInAsGuest,
    isLoggingIn,
    authError,
  } = useAuth();
  const isDeveloper = userType === "developer" || isDeveloperEmail(user?.email);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [generatorType, setGeneratorType] = useState<DocType | undefined>(
    undefined,
  );
  const [generatedDoc, setGeneratedDoc] = useState<{
    content: string;
    params: GenerationParams;
  } | null>(null);
  const [previewBackSection, setPreviewBackSection] = useState("generator");
  const [smartPlanningInitialMode, setSmartPlanningInitialMode] = useState<'timetable' | 'weekly_forecast' | 'lesson_plan'>('timetable');

  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    try {
      const hasQueryInstall =
        window.location.search.includes("install=true") ||
        localStorage.getItem("eduplan_auto_trigger_install") === "true";
      if (hasQueryInstall) {
        setActiveSection("downloads");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      syncPendingTelemetry();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      trackInteraction(activeSection, "view");
    }
  }, [activeSection, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 py-12 overflow-y-auto">
        <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-700 max-w-md w-full">
          {/* High-definition, ultra-sharp vector banner with dynamic version */}
          <div className="mx-auto w-full max-w-sm sm:max-w-md">
            <FortunesLogo variant="banner" subtitle="your CBC partner" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              FORTUNES EDUTECH
            </h1>
            <p className="text-xs text-[#00A86B] font-extrabold tracking-wider lowercase">
              your CBC partner
            </p>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">
              Universal Sign In & Free Trial Access
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/80 border border-slate-200/70 text-left space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Sign In / Google Access
              </h2>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                Sign in with your Google account. You will stay signed in permanently &mdash; even when offline without an internet connection.
              </p>
            </div>

            {/* Mandatory Terms Checkbox at sign-up */}
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl text-left transition-all">
              <input
                type="checkbox"
                id="agree-terms-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#00A86B] focus:ring-emerald-500 cursor-pointer shrink-0"
              />
              <label
                htmlFor="agree-terms-checkbox"
                className="text-xs text-slate-700 font-bold select-none cursor-pointer leading-tight"
              >
                I agree to{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#00A86B] font-extrabold underline hover:text-emerald-700 transition-colors"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>

            {/* Google OAuth Popup Button */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!agreedToTerms) {
                    toast.error(
                      'Please check "I agree to Terms and Conditions" before continuing.',
                    );
                    return;
                  }
                  signInWithGoogle();
                }}
                disabled={isLoggingIn || !agreedToTerms}
                className="w-full bg-[#00A86B] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-emerald-600 disabled:bg-slate-300 transition-all active:scale-95 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google Popup</span>
                  </>
                )}
              </button>
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  Permanent login: Your device stays signed in offline. You only sign out if you explicitly choose to.
                </p>
                <a
                  href={
                    typeof window !== "undefined" ? window.location.href : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={10} />
                  <span>
                    Open app in full tab (for 100% Google popup support)
                  </span>
                </a>
              </div>
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

          {/* Web App (PWA) Installation Card on Login Screen */}
          <div className="bg-white p-5 sm:p-6 rounded-[2.2rem] shadow-lg shadow-slate-200/60 border border-slate-200/70 text-left space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FortunesLogo variant="icon" className="w-12 h-12 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                    Install Official Web App (PWA)
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    Add to Home Screen • Works Offline • 1-Tap Access
                  </p>
                </div>
              </div>

              <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md">
                Offline Ready
              </span>
            </div>

            {/* Single Web App Install Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof (window as any).openAppInstallModal === "function") {
                  (window as any).openAppInstallModal();
                }
              }}
              className="w-full bg-[#00A86B] hover:bg-emerald-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              <span>Install Web App to Home Screen</span>
            </button>
          </div>

          <InstallPrompt />

          <TermsModal
            isOpen={showTermsModal}
            onClose={() => setShowTermsModal(false)}
          />

          {authError && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-700 font-black text-[9px] uppercase tracking-wider">
                  Authentication Notice
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                {authError}
              </p>
              <div className="bg-amber-100/50 p-2.5 rounded-xl text-[10px] font-bold text-slate-600 flex flex-col gap-1 leading-normal">
                <span>
                  💡 <strong>Tip for Mobile Browsers / Preview:</strong> If
                  Google Sign-In popup gives a 403 error due to browser iframe
                  restrictions, simply type your Gmail address in the box above
                  and click <strong>"Continue as Guest / Enter"</strong> for
                  instant trial access!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleGenerate = (content: string, params: GenerationParams) => {
    if (!content) return;
    trackInteraction("generator", "generate", params.type);
    setGeneratedDoc({ content, params });
    if (params.type) {
      setGeneratorType(params.type as DocType);
    }
    setPreviewBackSection(activeSection);
    setActiveSection("preview");
  };

  const handleStartNew = (type?: DocType) => {
    trackInteraction("generator", "start", type || "records_of_work");
    if (type === "records_of_work") {
      setActiveSection("records_of_work");
      return;
    }
    if (type === "syllabi") {
      setActiveSection("library");
      return;
    }
    setGeneratorType(type);
    setGeneratedDoc(null);
    setActiveSection("generator");
  };

  const renderContent = (section: string) => {
    try {
      switch (section) {
        case "dashboard":
          return (
            <Dashboard
              onStartNew={handleStartNew}
              onStartCatchUp={() => setActiveSection("catch_up")}
              onNavigate={(section) => setActiveSection(section)}
              onOpenUserMonitor={() => setActiveSection("admin_portal")}
            />
          );
        case "assessment_tracker":
          return (
            <AssessmentTracker
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
            />
          );
        case "user_manual":
          return <UserManual onBack={() => setActiveSection("dashboard")} />;
        case "video_tutorials":
          if (!isDeveloper) {
            return (
              <Dashboard
                onStartNew={handleStartNew}
                onStartCatchUp={() => setActiveSection("catch_up")}
                onNavigate={(s) => setActiveSection(s)}
                onOpenUserMonitor={() => setActiveSection("admin_portal")}
              />
            );
          }
          return (
            <VideoTutorialHub
              onNavigateToSection={(s) => setActiveSection(s)}
              onBack={() => setActiveSection("dashboard")}
            />
          );
        case "catch_up":
          return (
            <CatchUpGenerator
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
            />
          );
        case "records_of_work":
          return (
            <RecordOfWork
              onBack={() => setActiveSection("dashboard")}
              onPreviewDoc={(content, params) => {
                setGeneratedDoc({ content, params });
                setPreviewBackSection("records_of_work");
                setActiveSection("preview");
              }}
            />
          );
        case "knowledge_base":
          return <ModuleManager onBack={() => setActiveSection("dashboard")} />;
        case "syllabus_audit":
          return (
            <SyllabusIntegrityAuditPanel
              defaultView="audit"
              onBack={() => setActiveSection("dashboard")}
            />
          );
        case "curriculum_planning_hub":
          return (
            <CurriculumPlanningHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              onPreviewDoc={(content, params) => {
                setGeneratedDoc({ content, params });
                setPreviewBackSection("curriculum_planning_hub");
                setActiveSection("preview");
              }}
              defaultTab={generatorType}
            />
          );
        case "instructional_delivery_hub":
          return (
            <InstructionalDeliveryHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              defaultTab={generatorType}
            />
          );
        case "research_video_task_hub":
          return (
            <ResearchVideoTaskHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              defaultTab={generatorType}
            />
          );
        case "teacher_resources_hub":
          return (
            <TeacherResourcesHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              defaultTab={generatorType}
            />
          );
        case "generator":
          return (
            <DocGenerator
              initialType={generatorType}
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
            />
          );
        case "research":
          return <AssignmentHub onBack={() => setActiveSection("dashboard")} />;
        case "library":
          return (
            <SyllabusIntegrityAuditPanel
              defaultView="library"
              onBack={() => setActiveSection("dashboard")}
            />
          );
        case "settings":
          return <Settings onBack={() => setActiveSection("dashboard")} />;
        case "downloads":
          return (
            <InstallAndDownload onBack={() => setActiveSection("dashboard")} />
          );
        case "smart_planning":
          return (
            <CurriculumPlanningHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              initialSmartMode={smartPlanningInitialMode}
              onPreviewDoc={(content, params, backSec, smartMode) => {
                setGeneratedDoc({ content, params });
                setPreviewBackSection(backSec || "curriculum_planning_hub");
                if (smartMode) {
                  setSmartPlanningInitialMode(smartMode);
                }
                setActiveSection("preview");
              }}
              defaultTab="smart_planning"
            />
          );
        case "segmented_weekly":
          return (
            <CurriculumPlanningHub
              onGenerate={handleGenerate}
              onBack={() => setActiveSection("dashboard")}
              onNavigate={(section) => setActiveSection(section)}
              initialSmartMode={smartPlanningInitialMode}
              onPreviewDoc={(content, params, backSec, smartMode) => {
                setGeneratedDoc({ content, params });
                setPreviewBackSection(backSec || "curriculum_planning_hub");
                if (smartMode) {
                  setSmartPlanningInitialMode(smartMode);
                }
                setActiveSection("preview");
              }}
              defaultTab="segmented_weekly"
            />
          );
        case "admin_portal":
          return (
            <UserMonitor
              isOpen={true}
              onClose={() => setActiveSection("dashboard")}
            />
          );
        default:
          return (
            <Dashboard
              onStartNew={handleStartNew}
              onStartCatchUp={() => setActiveSection("catch_up")}
              onNavigate={(section) => setActiveSection(section)}
              onOpenUserMonitor={() => setActiveSection("admin_portal")}
            />
          );
      }
    } catch (error) {
      console.error("App render error:", error);
      return (
        <div className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">
            Something went wrong
          </h2>
          <button
            onClick={() => {
              setActiveSection("dashboard");
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
    <MusicPlayerProvider>
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
              if (
                [
                  "schemes_of_work",
                  "weekly_forecast",
                  "lesson_plan",
                  "lesson_notes",
                  "assessments",
                ].includes(section)
              ) {
                handleStartNew(section as DocType);
              } else {
                setActiveSection(section);
                if (section !== "preview") setGeneratedDoc(null);
              }
            }}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <InstallPrompt />
            <InformantTicker />

            <main
              id="main-scroll-container"
              className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full relative z-10 overscroll-x-none"
            >
              {activeSection === "preview" ? (
                generatedDoc ? (
                  <DocPreview
                    content={generatedDoc.content}
                    metadata={generatedDoc.params}
                    onBack={() =>
                      setActiveSection(previewBackSection || "generator")
                    }
                    onNavigate={(section) => setActiveSection(section)}
                  />
                ) : (
                  <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-200">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      No Active Document Loaded
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                      Please select or generate a document to preview it here.
                    </p>
                    <button
                      onClick={() =>
                        setActiveSection(previewBackSection || "generator")
                      }
                      className="px-6 py-3 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                    >
                      Return to Generator
                    </button>
                  </div>
                )
              ) : (
                renderContent(activeSection)
              )}
            </main>
          </div>
        </div>
        <TeachersAssistant />
      </div>
    </MusicPlayerProvider>
  );
}
