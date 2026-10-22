import React, { useState } from 'react';
import { 
  Info, 
  Layers, 
  Volume2, 
  CreditCard, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  HelpCircle,
  Sliders,
  Check
} from 'lucide-react';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';
import { getDocGuidanceInfo, getDocTypeTitle } from './DocGenerator';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

interface InformationCenterProps {
  toolType?: string;
  toolTitle?: string;
  customText?: string;
  subscriptionDetails?: any;
  isUserGuestTier?: boolean;
  usageCounts?: {
    schemes_of_work: number;
    weekly_forecast: number;
    lesson_plan: number;
    [key: string]: number;
  };
  registeredGrades?: string[];
  defaultOpen?: boolean;
  className?: string;
}

export default function InformationCenter({
  toolType = 'schemes_of_work',
  toolTitle,
  customText,
  subscriptionDetails,
  isUserGuestTier = false,
  usageCounts = { schemes_of_work: 0, weekly_forecast: 0, lesson_plan: 0 },
  registeredGrades = [],
  defaultOpen = false,
  className = ''
}: InformationCenterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'notices' | 'scales' | 'voice' | 'subscription' | 'recycle'>('notices');

  const guidance = getDocGuidanceInfo(toolType, toolTitle || getDocTypeTitle(toolType));
  const methods = guidance.methods || [];

  return (
    <div className={cn("w-full mb-4 font-sans", className)}>
      {/* Fixed Small Tab Bar at the top of the General Information block */}
      <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl p-1.5 xs:p-2 sm:p-2.5 shadow-md border border-slate-800 transition-all hover:border-emerald-500/40">
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 px-1 xs:px-2 min-w-0">
          <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <Info size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
              <span className="text-[10px] xs:text-xs font-black uppercase tracking-wider text-emerald-400 truncate">
                Information Center
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[8px] xs:text-[9px] font-bold px-1.5 xs:px-2 py-0.5 rounded-full border border-emerald-500/30">
                Notice & Tools
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium hidden sm:block">
              Scale limits, preparation methods, voice studio & recycle guides
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "px-2 xs:px-3 py-1 xs:py-1.5 rounded-xl font-black text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs",
              isOpen 
                ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40" 
                : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95"
            )}
          >
            {isOpen ? (
              <>
                <X size={13} />
                <span>Close Center</span>
              </>
            ) : (
              <>
                <Info size={13} />
                <span>Open Info Center</span>
                <ChevronDown size={13} className="animate-bounce" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Information Center Panel */}
      {isOpen && (
        <div className="mt-2 bg-white border-2 border-emerald-500/30 rounded-3xl p-3 xs:p-4 sm:p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Internal Tab Switcher */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 xs:gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 sm:mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('notices')}
              className={cn(
                "py-1.5 xs:py-2 px-2 xs:px-3 rounded-xl font-black text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-wide transition-all flex items-center justify-center gap-1 xs:gap-1.5 cursor-pointer",
                activeTab === 'notices'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              )}
            >
              <Layers size={13} />
              <span className="truncate">Preparation Methods</span>
              {methods.length > 0 && (
                <span className={cn(
                  "text-[8px] px-1.5 py-0.2 rounded-full font-extrabold",
                  activeTab === 'notices' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {methods.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scales')}
              className={cn(
                "py-1.5 xs:py-2 px-2 xs:px-3 rounded-xl font-black text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-wide transition-all flex items-center justify-center gap-1 xs:gap-1.5 cursor-pointer",
                activeTab === 'scales'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              )}
            >
              <Sliders size={13} />
              <span className="truncate">Scale & Page Limits</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={cn(
                "py-1.5 xs:py-2 px-2 xs:px-3 rounded-xl font-black text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-wide transition-all flex items-center justify-center gap-1 xs:gap-1.5 cursor-pointer",
                activeTab === 'voice'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              )}
            >
              <Volume2 size={13} />
              <span className="truncate">Voice Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className={cn(
                "py-1.5 xs:py-2 px-2 xs:px-3 rounded-xl font-black text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-wide transition-all flex items-center justify-center gap-1 xs:gap-1.5 cursor-pointer",
                activeTab === 'subscription'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              )}
            >
              <CreditCard size={13} />
              <span className="truncate">Plan & Limits</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recycle')}
              className={cn(
                "py-1.5 xs:py-2 px-2 xs:px-3 rounded-xl font-black text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-wide transition-all flex items-center justify-center gap-1 xs:gap-1.5 cursor-pointer",
                activeTab === 'recycle'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              )}
            >
              <RefreshCw size={13} />
              <span className="truncate">Recycle Method</span>
            </button>
          </div>

          {/* TAB 1: PREPARATION METHODS & NOTICE */}
          {activeTab === 'notices' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 text-left shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      {guidance.badge && (
                        <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          {guidance.badge}
                        </span>
                      )}
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">
                        {guidance.header || `${toolTitle || 'DOCUMENT'} • PREPARATION METHODS`}
                      </h4>
                    </div>
                  </div>
                  {methods.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shrink-0 self-start sm:self-auto shadow-2xs">
                      {methods.length} Methods Available
                    </span>
                  )}
                </div>

                {guidance.description && (
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {guidance.description}
                  </p>
                )}

                {/* Numbered Methods Cards Grid */}
                {methods.length > 0 && (
                  <div className={cn(
                    "grid grid-cols-1 gap-2.5 pt-1",
                    methods.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : methods.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  )}>
                    {methods.map((method) => {
                      const colorStyles = {
                        blue: {
                          badge: 'bg-blue-600 text-white',
                          border: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50',
                          title: 'text-blue-950',
                          desc: 'text-blue-800/80',
                          hint: 'text-blue-700 bg-blue-100/60'
                        },
                        emerald: {
                          badge: 'bg-emerald-600 text-white',
                          border: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
                          title: 'text-emerald-950',
                          desc: 'text-emerald-800/80',
                          hint: 'text-emerald-700 bg-emerald-100/60'
                        },
                        indigo: {
                          badge: 'bg-indigo-600 text-white',
                          border: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50',
                          title: 'text-indigo-950',
                          desc: 'text-indigo-800/80',
                          hint: 'text-indigo-700 bg-indigo-100/60'
                        },
                        purple: {
                          badge: 'bg-purple-600 text-white',
                          border: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50',
                          title: 'text-purple-950',
                          desc: 'text-purple-800/80',
                          hint: 'text-purple-700 bg-purple-100/60'
                        },
                        amber: {
                          badge: 'bg-amber-600 text-white',
                          border: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
                          title: 'text-amber-950',
                          desc: 'text-amber-800/80',
                          hint: 'text-amber-700 bg-amber-100/60'
                        }
                      }[(method.color as 'blue' | 'emerald' | 'indigo' | 'purple' | 'amber') || 'blue'];

                      return (
                        <div 
                          key={method.number} 
                          className={cn(
                            "p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-2xs",
                            colorStyles.border
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs", colorStyles.badge)}>
                                {method.number}
                              </span>
                              <span className={cn("text-[10px] font-black uppercase tracking-wider", colorStyles.title)}>
                                METHOD {method.number}
                              </span>
                            </div>
                            <h5 className={cn("text-xs font-bold leading-snug", colorStyles.title)}>
                              {method.name}
                            </h5>
                            <p className={cn("text-[11px] font-medium leading-relaxed", colorStyles.desc)}>
                              {method.description}
                            </p>
                          </div>
                          {method.actionHint && (
                            <span className={cn("text-[9.5px] font-semibold px-2 py-1 rounded-lg mt-1 block leading-tight", colorStyles.hint)}>
                              👉 {method.actionHint}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {guidance.subnote && (
                  <p className="text-[10.5px] text-slate-500 font-medium italic border-t border-slate-200/60 pt-2 flex items-center gap-1.5">
                    <span>ℹ️</span>
                    <span>{guidance.subnote}</span>
                  </p>
                )}
              </div>

              {/* Standard Preparation Notice Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200/90 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
                <div className="p-2.5 bg-[#00A86B] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                  <Layers size={18} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Standard Preparation Notice
                    </span>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      Existing Standard Preparation Methods
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 font-semibold leading-relaxed mt-1">
                    Existing standard preparation methods: direct syllabus drop-down selection, manual planning and uploading documents to recycle ♻️ are available in preparations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCUMENT SCALE & PAGE LIMITS GUIDE */}
          {activeTab === 'scales' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-left">
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Sliders size={18} />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                        Page Budget & Content Scale Architecture
                      </span>
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white mt-1">
                        Document Scale & Table Length Control
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 self-start sm:self-auto">
                    CBC & OBC Verified Standard
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Both scale settings use auto-budgeting rules to ensure strict page adherence during generation, on-screen reading, Word export, and print/PDF output.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Lighter Scale */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🪶</span>
                        <h5 className="text-xs font-black uppercase text-emerald-400">1. Lighter Scale</h5>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                        1.5 – 2 Pages Free Size
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Table content is streamlined to fit freely within 1.5 to 2 pages max. Employs concise syllabus definitions and streamlined action bullets with fewer expanded sub-points.
                    </p>
                    <ul className="text-[10px] text-slate-400 space-y-1 pl-1 font-medium">
                      <li>• Compact table rows with high-tempo delivery notes</li>
                      <li>• Faster generation and minimal print page footprint</li>
                      <li>• Weekly Forecast fits in a single clean landscape page</li>
                    </ul>
                  </div>

                  {/* Medium Scale */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-emerald-500/50 space-y-2.5 relative shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <h5 className="text-xs font-black uppercase text-emerald-300">2. Medium Scale (Standard Default)</h5>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500 text-slate-950 rounded-md">
                        Full 2 Pages Standard
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Information is explained in brief context with practical cited examples so teachers can deliver with know-how and confidence.
                    </p>
                    <ul className="text-[10px] text-slate-300 space-y-1 pl-1 font-medium">
                      <li>• Rich pedagogical steps with concrete classroom illustrations</li>
                      <li>• Table body, homework & evaluation strictly conclude on Page 2</li>
                      <li>• 0% chance of spilling onto a blank 3rd page</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-[10px] text-slate-400 leading-relaxed">
                  💡 <b className="text-slate-200">Switching Scale:</b> Use the two switches positioned on top of the <span className="text-emerald-400 font-bold">Generate Document</span> button at the bottom of the generator to pick your preferred scale before clicking Generate.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI VOICE STUDIO */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <AIPlanningVoiceGuide 
                toolType={toolType} 
                toolTitle={toolTitle} 
                customText={customText}
              />
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION & GRADE TRACKERS */}
          {activeTab === 'subscription' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {isUserGuestTier ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 text-emerald-800">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <Sparkles size={20} className="text-[#00A86B]" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase tracking-tight text-xs">Free Trial Access Mode Active</h4>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Stipulated Document Limits Active</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium mb-3">
                    Your trial document limits for each generator type:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className={cn("p-3 rounded-xl border text-center", (usageCounts?.schemes_of_work || 0) >= 1 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-emerald-100 text-emerald-900")}>
                      <div className="text-[9px] font-black uppercase mb-0.5">Schemes of Work</div>
                      <div className="text-lg font-black">{usageCounts?.schemes_of_work || 0}/1</div>
                      <div className="text-[9px] font-bold text-slate-500">{Math.max(0, 1 - (usageCounts?.schemes_of_work || 0))} left</div>
                    </div>
                    <div className={cn("p-3 rounded-xl border text-center", (usageCounts?.weekly_forecast || 0) >= 1 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-emerald-100 text-emerald-900")}>
                      <div className="text-[9px] font-black uppercase mb-0.5">Weekly Forecast</div>
                      <div className="text-lg font-black">{usageCounts?.weekly_forecast || 0}/1</div>
                      <div className="text-[9px] font-bold text-slate-500">{Math.max(0, 1 - (usageCounts?.weekly_forecast || 0))} left</div>
                    </div>
                    <div className={cn("p-3 rounded-xl border text-center", (usageCounts?.lesson_plan || 0) >= 2 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-emerald-100 text-emerald-900")}>
                      <div className="text-[9px] font-black uppercase mb-0.5">Lesson Planning</div>
                      <div className="text-lg font-black">{usageCounts?.lesson_plan || 0}/2</div>
                      <div className="text-[9px] font-bold text-slate-500">{Math.max(0, 2 - (usageCounts?.lesson_plan || 0))} left</div>
                    </div>
                  </div>
                </div>
              ) : subscriptionDetails && subscriptionDetails.subscriptionType ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-emerald-800">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CreditCard size={20} className="text-[#00A86B]" />
                      </div>
                      <div>
                        <h4 className="font-bold uppercase tracking-tight text-xs">Active Subscription: {subscriptionDetails.subscriptionType}</h4>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          {subscriptionDetails.unlimitedDownloads 
                            ? "Unlimited Downloads Allowed" 
                            : `Downloaded: ${subscriptionDetails.circleDownloadsCount || 0} / ${subscriptionDetails.circleDownloadsLimit} docs (${Math.max(0, subscriptionDetails.circleDownloadsLimit - (subscriptionDetails.circleDownloadsCount || 0))} remaining)`}
                        </p>
                      </div>
                    </div>
                    <div className="text-emerald-800 font-bold text-[10px] uppercase bg-emerald-200/60 px-3 py-1 rounded-full border border-emerald-300">
                      {subscriptionDetails.daysRemaining} days left
                    </div>
                  </div>

                  {!subscriptionDetails.unlimitedDownloads && (
                    <div className="space-y-3 mt-3 border-t border-emerald-200/60 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                        Grade Download Trackers:
                      </p>
                      {(() => {
                        const baseLimit = subscriptionDetails.circleDownloadsLimit || subscriptionDetails.baseLimit || 180;
                        const gradeCounts = subscriptionDetails.gradeCounts || {};
                        const gradesToRender = (registeredGrades && registeredGrades.length > 0) ? registeredGrades : ['all'];

                        return gradesToRender.map((grade) => {
                          const used = (grade.toLowerCase() === 'all' || registeredGrades.includes('all')) 
                            ? (subscriptionDetails.circleDownloadsCount || 0) 
                            : (gradeCounts[grade] || 0);
                          const remaining = Math.max(0, baseLimit - used);
                          const pct = Math.min(100, (used / baseLimit) * 100);
                          const isDepleted = used >= baseLimit;

                          return (
                            <div key={grade} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                                <span>{grade === 'all' ? 'All Registered Grades' : grade}</span>
                                <span className={isDepleted ? "text-rose-600 font-bold" : ""}>
                                  Used: {used} / {baseLimit} ({remaining} Left)
                                </span>
                              </div>
                              <div className="w-full bg-emerald-200/70 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all duration-500", isDepleted ? "bg-rose-500" : "bg-[#00A86B]")} 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-xs font-semibold text-center">
                  Standard Account Active. Unlimited generation capabilities ready.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECYCLE METHOD */}
          {activeTab === 'recycle' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-left shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {guidance.badge && (
                      <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300/60">
                        {guidance.badge}
                      </span>
                    )}
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                      {guidance.header}
                    </h4>
                    <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                      {guidance.description}
                    </p>
                    {guidance.subnote && (
                      <p className="text-[10px] text-emerald-700/90 font-medium italic border-t border-emerald-200/50 pt-1.5 mt-1">
                        {guidance.subnote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
