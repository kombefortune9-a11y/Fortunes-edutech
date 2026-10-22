import { useState, useEffect } from 'react';
import { DocGenerator } from './DocGenerator';
import { CatchUpGenerator } from './CatchUpGenerator';
import { AssignmentHub } from './AssignmentHub';
import { AssessmentTracker } from './AssessmentTracker';
import { UserManual } from './UserManual';
import InstallAndDownload from './InstallAndDownload';
import { RecordOfWork } from './RecordOfWork';
import { SmartPlanningHub } from './SmartPlanningHub';
import { Sparkles, ClipboardList, BookOpen, Layers, Target, Video, GraduationCap, CheckCircle2, ChevronLeft, Smartphone, History, Download, Compass, Zap } from 'lucide-react';
import { GenerationParams } from '../services/geminiService';
import { DocType } from '../constants';

interface HubProps {
  onGenerate: (content: string, params: GenerationParams) => void;
  onBack: () => void;
  onNavigate: (section: string) => void;
  onPreviewDoc?: (content: string, params: any, backSection?: string, smartMode?: 'timetable' | 'weekly_forecast' | 'lesson_plan') => void;
  defaultTab?: string;
  initialSmartMode?: 'timetable' | 'weekly_forecast' | 'lesson_plan';
}

/**
 * 1. Curriculum Planning Hub (Academic Planning Hub)
 * Groups: Smart Planning (Segmented Weekly & Lesson Plans), Schemes of Work, Weekly Forecast, Lesson Plans, Recent Documents
 */
export function CurriculumPlanningHub({ onGenerate, onBack, onNavigate, onPreviewDoc, defaultTab, initialSmartMode }: HubProps) {
  const [activeMainTab, setActiveMainTab] = useState<'normal_planning' | 'smart_planning' | 'records_of_work'>(
    defaultTab === 'smart_planning' || defaultTab === 'segmented_weekly'
      ? 'smart_planning'
      : (defaultTab === 'records_of_work' ? 'records_of_work' : 'normal_planning')
  );

  const [normalSubTab, setNormalSubTab] = useState<'schemes_of_work' | 'weekly_forecast' | 'lesson_plan'>(
    (defaultTab === 'schemes_of_work' || defaultTab === 'weekly_forecast' || defaultTab === 'lesson_plan')
      ? (defaultTab as any)
      : 'schemes_of_work'
  );

  useEffect(() => {
    if (defaultTab) {
      if (defaultTab === 'schemes_of_work' || defaultTab === 'weekly_forecast' || defaultTab === 'lesson_plan') {
        setActiveMainTab('normal_planning');
        setNormalSubTab(defaultTab as any);
      } else if (defaultTab === 'records_of_work') {
        setActiveMainTab('records_of_work');
      } else if (defaultTab === 'smart_planning' || defaultTab === 'segmented_weekly') {
        setActiveMainTab('smart_planning');
      }
    }
  }, [defaultTab]);

  const mainTabs = [
    { id: 'normal_planning', label: 'Normal Planning', icon: BookOpen, color: 'text-cyan-600' },
    { id: 'smart_planning', label: 'Smart Planning', icon: Zap, color: 'text-emerald-500' },
    { id: 'records_of_work', label: 'Recent Documents', icon: History, color: 'text-amber-600' }
  ] as const;

  const normalSubTabs = [
    { id: 'schemes_of_work', label: 'Schemes of Work', icon: BookOpen, color: 'text-cyan-600' },
    { id: 'weekly_forecast', label: 'Weekly Forecast', icon: Layers, color: 'text-sky-600' },
    { id: 'lesson_plan', label: 'Lesson Plans', icon: ClipboardList, color: 'text-emerald-600' }
  ] as const;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* Sleek, professional tab switcher bar at the top with horizontal scrolling */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shadow-2xs group cursor-pointer"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <div className="hidden sm:block text-left">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Planning Hub</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Planning & Normal Planning Modes</p>
          </div>
        </div>

        {/* 3 Main Tabs: Smart Planning, Normal Planning, Recent Documents */}
        <div className="flex p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60 w-full md:w-auto overflow-x-auto gap-1 scrollbar-thin scrollbar-thumb-slate-300">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 justify-center ${
                  isActive
                    ? 'bg-[#00A86B] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white shrink-0' : `${tab.color} shrink-0`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* If Normal Planning is active, show the sub-bar horizontal scroll for Schemes, Weekly Forecast, Lesson Plans */}
      {activeMainTab === 'normal_planning' && (
        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-black uppercase text-slate-400 px-2 shrink-0">Normal Planning Tools:</span>
          {normalSubTabs.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = normalSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setNormalSubTab(sub.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSubActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <SubIcon size={13} className={isSubActive ? 'text-emerald-400' : sub.color} />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Embedded Tool Container */}
      <div className="w-full">
        {activeMainTab === 'smart_planning' ? (
          <SmartPlanningHub
            initialMode={initialSmartMode}
            onNavigateToPreview={(doc, mode) => {
              if (onPreviewDoc) {
                onPreviewDoc(doc.content, doc.params, 'curriculum_planning_hub', mode);
              } else {
                onGenerate(doc.content, doc.params);
              }
            }}
            onNavigateToGenerator={(type) => {
              setActiveMainTab('normal_planning');
              setNormalSubTab(type as any);
            }}
          />
        ) : activeMainTab === 'records_of_work' ? (
          <RecordOfWork
            onBack={() => setActiveMainTab('smart_planning')}
            onPreviewDoc={onPreviewDoc}
          />
        ) : (
          <DocGenerator
            initialType={normalSubTab}
            onGenerate={onGenerate}
            onBack={onBack}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 2. Instructional Delivery Hub
 * Groups: Catch-up Lessons, Lesson Notes, Assessments
 */
export function InstructionalDeliveryHub({ onGenerate, onBack, onNavigate, defaultTab }: HubProps) {
  const [activeTab, setActiveTab] = useState<'catch_up' | 'lesson_notes' | 'assessments'>(
    (defaultTab as any) || 'catch_up'
  );

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab as any);
    }
  }, [defaultTab]);

  const tabs = [
    { id: 'catch_up', label: 'Catch-up Lessons', icon: Sparkles, color: 'text-emerald-600' },
    { id: 'lesson_notes', label: 'Lesson Notes', icon: BookOpen, color: 'text-indigo-600' },
    { id: 'assessments', label: 'Assessments', icon: CheckCircle2, color: 'text-orange-600' }
  ] as const;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* Sleek, professional tab switcher bar at the top */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shadow-2xs group cursor-pointer"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <div className="hidden sm:block text-left">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Instructional Delivery Hub</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">3 Core Class Delivery Tools</p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60 w-full md:w-auto overflow-x-auto gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-initial justify-center ${
                  isActive
                    ? 'bg-[#00A86B] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white shrink-0' : `${tab.color} shrink-0`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Tool Container */}
      <div key={activeTab} className="w-full">
        {activeTab === 'catch_up' ? (
          <CatchUpGenerator
            onGenerate={onGenerate}
            onBack={onBack}
          />
        ) : (
          <DocGenerator
            initialType={activeTab}
            onGenerate={onGenerate}
            onBack={onBack}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 3. Research, Video & Student Tasks Hub
 * Groups: Assignment & Research, Video Lesson Scripts, Individual Work Plan
 */
export function ResearchVideoTaskHub({ onGenerate, onBack, onNavigate, defaultTab }: HubProps) {
  const [activeTab, setActiveTab] = useState<'research' | 'video_script' | 'individual_work_plan'>(
    (defaultTab as any) || 'research'
  );

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab as any);
    }
  }, [defaultTab]);

  const tabs = [
    { id: 'research', label: 'Assignment & Research', icon: GraduationCap, color: 'text-purple-600' },
    { id: 'video_script', label: 'Video Lesson Scripts', icon: Video, color: 'text-teal-600' },
    { id: 'individual_work_plan', label: 'Individual Work Plan', icon: Target, color: 'text-violet-600' }
  ] as const;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* Sleek, professional tab switcher bar at the top */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shadow-2xs group cursor-pointer"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <div className="hidden sm:block text-left">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Research, Video & Student Tasks</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">3 Creative Task Creators</p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60 w-full md:w-auto overflow-x-auto gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-initial justify-center ${
                  isActive
                    ? 'bg-[#00A86B] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white shrink-0' : `${tab.color} shrink-0`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Tool Container */}
      <div key={activeTab} className="w-full">
        {activeTab === 'research' ? (
          <AssignmentHub
            onBack={onBack}
          />
        ) : (
          <DocGenerator
            initialType={activeTab}
            onGenerate={onGenerate}
            onBack={onBack}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 4. Support, User Manual & Downloads Hub
 * Groups: Assessment Tracker, User Manual, Download and Installation
 */
export function TeacherResourcesHub({ onGenerate, onBack, onNavigate, defaultTab }: HubProps) {
  const [activeTab, setActiveTab] = useState<'assessment_tracker' | 'user_manual' | 'downloads'>(
    (defaultTab as any) || 'assessment_tracker'
  );

  const tabs = [
    { id: 'assessment_tracker', label: 'Assessment Tracker', icon: ClipboardList, color: 'text-sky-600' },
    { id: 'user_manual', label: 'User Manual', icon: BookOpen, color: 'text-emerald-600' },
    { id: 'downloads', label: 'Web App & Installation', icon: Download, color: 'text-emerald-600' }
  ] as const;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-4 sm:space-y-6">
      {/* Sleek, professional tab switcher bar at the top */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shadow-2xs group cursor-pointer"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <div className="hidden sm:block text-left">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Teacher Resources & Web App Setup</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Support, Manuals, Trackers & Web App Installation</p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/60 w-full md:w-auto overflow-x-auto gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-4 py-1.5 xs:py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9.5px] xs:text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-initial justify-center ${
                  isActive
                    ? 'bg-[#00A86B] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white shrink-0' : `${tab.color} shrink-0`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Tool Container */}
      <div key={activeTab} className="w-full">
        {activeTab === 'assessment_tracker' ? (
          <AssessmentTracker
            onBack={onBack}
            onNavigate={onNavigate}
          />
        ) : activeTab === 'user_manual' ? (
          <UserManual
            onBack={onBack}
          />
        ) : (
          <InstallAndDownload
            onBack={onBack}
          />
        )}
      </div>
    </div>
  );
}
