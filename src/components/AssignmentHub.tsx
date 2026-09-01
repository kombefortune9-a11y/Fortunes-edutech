import { getDownloadAccessStatus } from "../lib/downloadCheck";
import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Search, 
  Send, 
  Copy, 
  Check, 
  Download, 
  ArrowLeft,
  RefreshCw,
  FileText,
  Bookmark,
  Sparkles,
  Info,
  Lock,
  Crown,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { generateResearchReport } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { loadHtml2Pdf } from '../lib/pdfLoader';
import { downloadBlobDirect } from '../lib/pdfShareHelper';
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from '../lib/pdfUtils';
import { useAuth } from './FirebaseProvider';
import { AccessModal } from './AccessModal';
import { SUBSCRIPTION_PLANS, ADMIN_EMAIL } from '../constants';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';

interface AssignmentHubProps {
  onBack: () => void;
}

export function AssignmentHub({ onBack }: AssignmentHubProps) {
  const { user, isWhitelisted, userType, subscriptionDetails } = useAuth();
  const [showAccessModal, setShowAccessModal] = useState(false);

  const isDev = userType === 'developer' || user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  const subType = subscriptionDetails?.subscriptionType || 'guest_trial';
  const isExpired = !!subscriptionDetails?.isSubscriptionExpired;
  const isEligibleTier = subType === 'termly' || subType === 'unlimited' || isDev;
  const hasAccess = isDev || (isWhitelisted && isEligibleTier && !isExpired);

  const [question, setQuestion] = useState('');
  const [docType, setDocType] = useState<'assignment' | 'research'>('assignment');
  const [researchPhase, setResearchPhase] = useState<'proposal' | 'thesis'>('proposal');
  const [level, setLevel] = useState('Undergraduate College / Diploma');
  const [subject, setSubject] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedReport, setGeneratedReport] = useState('');
  const [copied, setCopied] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const steps = [
    "Consulting scholarly databases and digital literature...",
    "Drafting foundational theoretical frameworks...",
    "Synthesizing structured multi-perspective analysis...",
    "Formatting APA 7th edition citation bibliography...",
    "Polishing academic syntax and structural layout..."
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) {
      const status = getDownloadAccessStatus(user, subscriptionDetails);
      toast.error(status.message || "You have depleted your allocated downloads. Please renew or upgrade your subscription circle to continue downloading.");
      setShowAccessModal(true);
      return;
    }

    if (!question.trim()) {
      toast.error("Please enter an assignment question or study case.");
      return;
    }

    setIsGenerating(true);
    setLoadingStep(0);
    setGeneratedReport('');

    // Advance steps periodically for a highly interactive feeling
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);

    try {
      const response = await generateResearchReport(question, docType, level, subject, researchPhase);
      setGeneratedReport(response);
      toast.success("Comprehensive report compiled successfully!");
    } catch (err: any) {
      console.error("Research Hub Error:", err);
      toast.error(err.message || "Failed to generate scholastic analysis.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReport) return;
    navigator.clipboard.writeText(generatedReport);
    setCopied(true);
    toast.success("Report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!hasAccess) {
      const status = getDownloadAccessStatus(user, subscriptionDetails);
      toast.error(status.message || "You have depleted your allocated downloads. Please renew or upgrade your subscription circle to continue downloading.");
      setShowAccessModal(true);
      return;
    }

    if (!reportRef.current) {
      toast.error("Report content element not found.");
      return;
    }

    const toastId = toast.loading("Generating scholarly PDF document...");
    const cleanFilename = `Scholarly_Report_${subject ? subject.replace(/\s+/g, '_') : 'Research'}.pdf`;

    const opt = {
      margin:       [15, 15, 15, 15],
      filename:     cleanFilename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        onclone: (clonedDoc: Document) => {
          sanitizeClonedDoc(clonedDoc);
        }
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['h1', 'h2', 'h3', 'table', 'li'] }
    };

    let restoreStyles: (() => void) | null = null;
    try {
      restoreStyles = prepareDocumentForPdfExport(true);
      const h2p = await loadHtml2Pdf();
      const worker = h2p().from(reportRef.current).set(opt);
      const pdfBlob = await worker.output('blob');
      
      if (pdfBlob && pdfBlob.size > 0) {
        downloadBlobDirect(pdfBlob, cleanFilename);
        toast.success("PDF report downloaded!", { id: toastId });
      } else {
        await worker.save();
        toast.success("PDF report saved!", { id: toastId });
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to compile PDF. Try copying the content instead.", { id: toastId });
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
    }
  };

  // If user does not have Termly or Yearly Circle subscription, render exclusive lock screen
  if (!hasAccess) {
    const currentPlanLabel = SUBSCRIPTION_PLANS[subType]?.label || (isWhitelisted ? subType : 'Trial / Guest Access');

    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in zoom-in duration-500">
        <AccessModal 
          isOpen={showAccessModal} 
          onClose={() => setShowAccessModal(false)} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 leading-tight">Assignment & Research Writing Hub</h1>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Lock size={10} />
                  Termly & Unlimited Only
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">AI-powered senior scholar companion for students and academic researchers</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200"
          >
            <ArrowLeft size={14} />
            Go to Dashboard
          </button>
        </div>

        {/* Locked Feature Gate Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-indigo-900/50 shadow-2xl relative overflow-hidden space-y-8">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-indigo-800/40">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/15 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black uppercase tracking-wider">
                <Crown size={14} className="text-amber-400" />
                <span>Termly & Unlimited Circle Exclusive Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Unlock Scholarly Research & Model Assignments
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                The Assignment & Research Writing Hub conducts in-depth academic inquiry, multi-chapter research proposals, thesis methodologies, and comprehensive APA/Harvard literature synthesis. Due to the high compute and long-form analysis involved, this advanced tool is strictly reserved for <strong className="text-white">Termly Circle (90 Days)</strong> and <strong className="text-white">Unlimited Access</strong> subscribers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0 text-center w-full md:w-auto min-w-[200px]">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Your Current Plan</span>
              <span className="text-sm font-extrabold text-amber-300 mt-1 block uppercase">
                {currentPlanLabel}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {isExpired ? 'Subscription Expired' : 'Upgrade to unlock'}
              </span>
            </div>
          </div>

          {/* Features Comparison Grid */}
          <div className="relative z-10 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <Sparkles size={14} />
              Included Exclusively in Termly & Unlimited Circles:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Model Academic Assignments</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Complete structured student assignments with introduction, multi-perspective thematic body paragraphs, and synthesizing conclusions.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Research Proposals (Phase 1)</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Kwame Nkrumah / CBC aligned research proposal framework, problem statements, theoretical models, sample designs, and research budgets.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Dissertation & Thesis (Phase 2)</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Full 5-chapter dissertation architectures: Literature Review, Methodology, Data Analysis presentations, and Recommendations.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">APA 7th & Harvard Citations</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Standardized alphabetized bibliography references and contextual in-text citation formatting for scholastic rigor.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">High Quota Allocation</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Enjoy generous download limits: 500 documents for Termly Circle (90 Days) and Unlimited downloads for Unlimited Access.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 space-y-2 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Instant Scholarly PDF Export</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Export publication-ready A4 PDF reports directly to your device or copy full markdown content in one click.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Options Cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-indigo-900/40 border-2 border-indigo-400/50 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Termly Circle</span>
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase rounded-md border border-indigo-400/30">90 Days</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">K250</span>
                  <span className="text-xs text-slate-400 font-semibold">/ term</span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-2">
                  Complete access to all Lesson Plans, SOW, Forecasts, Catch-Up cards + <strong>Assignment & Research Writing Hub</strong> with 500 document limit.
                </p>
              </div>
              <button
                onClick={() => setShowAccessModal(true)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Subscribe to Termly Circle</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="bg-blue-900/40 border-2 border-emerald-400/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600 text-slate-950 text-[8px] font-black uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
                Best Value
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Unlimited Access</span>
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase rounded-md border border-emerald-400/30">Lifetime</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">K1500</span>
                  <span className="text-xs text-slate-400 font-semibold">/ school</span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-2">
                  Ultimate lifetime access across all grades and school terms + full <strong>Assignment & Research Writing Hub</strong> with zero download limits.
                </p>
              </div>
              <button
                onClick={() => setShowAccessModal(true)}
                className="w-full py-2.5 px-4 bg-[#00A86B] hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Subscribe to Unlimited Access</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-indigo-800/40">
            <button
              onClick={() => setShowAccessModal(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-[#00A86B] hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={16} />
              <span>View All Subscription Packages & Payment Details</span>
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Assignment & Research Writing Hub</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={10} />
                Unlocked ({SUBSCRIPTION_PLANS[subType]?.label || 'Active Circle'})
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500">AI-powered senior scholar companion for students and academic researchers</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200"
        >
          <ArrowLeft size={14} />
          Go to Dashboard
        </button>
      </div>

      {/* AI Voice Playback & Planning Guide */}
      <AIPlanningVoiceGuide 
        toolType="research" 
        toolTitle="Assignment & Research Writing Hub"
        className="animate-in fade-in duration-300"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-5">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Bookmark size={15} className="text-emerald-500" />
              Configure Scholarly Scope
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Document Type / Goal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocType('assignment')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
                      docType === 'assignment' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Model Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('research')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
                      docType === 'research' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Research Paper
                  </button>
                </div>
              </div>

              {docType === 'research' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span>Research Phase & Structure</span>
                    <span className="text-emerald-500 font-bold">(Matched format)</span>
                  </label>
                  <select
                    value={researchPhase}
                    onChange={(e) => setResearchPhase(e.target.value as 'proposal' | 'thesis')}
                    className="w-full text-xs font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-50/10 focus:border-emerald-500 focus:outline-hidden text-slate-800 cursor-pointer"
                  >
                    <option value="proposal">Phase 1: The Research Proposal Stages</option>
                    <option value="thesis">Phase 2: The Final Research Report/Thesis Chapters</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Academic Standard Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full text-xs font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800 bg-slate-50/40 cursor-pointer"
                >
                  <option value="High School Advanced level">High School Advanced Level</option>
                  <option value="Undergraduate College / Diploma">Undergraduate College / Diploma</option>
                  <option value="Master's Scholarly Level">Master's Scholarly Level</option>
                  <option value="Post-graduate Academic Thesis">Post-graduate Academic Thesis</option>
                  <option value="Exploratory General Summary">Exploratory General Summary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Discipline / Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Political Science, Education, Biology"
                  className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Question or Case Study Prompt</span>
                  <span className={`${question.length > 500 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {question.length} chars
                  </span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the full question, study case, research topic, or essay assignment instructions..."
                  className="w-full text-xs font-bold p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden text-slate-800 leading-relaxed custom-scrollbar"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className={`w-full py-3 px-5 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider text-white shadow-md transition-all ${
                  isGenerating 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-[#00A86B] hover:bg-emerald-600 hover:scale-102 active:scale-98'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={15} />
                    Synthesizing Scholarly Analysis...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Compile Comprehensive Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Academic Info Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex gap-3 text-xs leading-relaxed text-slate-600">
            <Info className="text-emerald-600 shrink-0 mt-0.5" size={16} />
            <div>
              <h5 className="font-black text-[10px] text-slate-800 uppercase tracking-wide mb-1">Academic Integrity Policy</h5>
              <p className="font-semibold text-slate-500">
                This hub generates state-of-the-art academic reference guides, comprehensive briefs, and fully annotated literature maps. Use generated materials as advanced model responses and learning templates to guide your actual study submission.
              </p>
            </div>
          </div>

          {/* Matched Format Guidelines Box */}
          <div className="bg-emerald-50/30 border border-emerald-500/15 rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-600" />
              <h5 className="font-black text-[10px] text-emerald-800 uppercase tracking-wide">Target Format & Structure Mapping</h5>
            </div>
            
            {docType === 'research' && researchPhase === 'proposal' && (
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <p className="text-slate-800 font-bold border-b border-emerald-500/10 pb-1">Phase 1: The Research Proposal Stages</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong className="text-slate-700">Cover Page:</strong> Title, details, Kwame Nkrumah University, Kabwe affiliation</li>
                  <li><strong className="text-slate-700">Introduction:</strong> Background context, research problem statement, objectives</li>
                  <li><strong className="text-slate-700">Literature Review:</strong> Survey, theoretical/conceptual framework, knowledge gap</li>
                  <li><strong className="text-slate-700">Research Methodology:</strong> Design, target population, sample techniques, instruments</li>
                  <li><strong className="text-slate-700">Work Plan & References:</strong> Timeline schedule, budget estimate, alphabetized bibliography</li>
                </ul>
              </div>
            )}

            {docType === 'research' && researchPhase === 'thesis' && (
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <p className="text-slate-800 font-bold border-b border-emerald-500/10 pb-1">Phase 2: The Final Research Report/Thesis Chapters</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong className="text-slate-700">Preliminary Pages:</strong> Declarations, certifications, acknowledgments, abstract, TOC</li>
                  <li><strong className="text-slate-700">Chapter 1:</strong> Introduction (Refined background & statement of the problem)</li>
                  <li><strong className="text-slate-700">Chapter 2:</strong> Literature Review (Expanded empirical & theoretical literature)</li>
                  <li><strong className="text-slate-700">Chapter 3:</strong> Methodology (Detailed practical execution guide)</li>
                  <li><strong className="text-slate-700">Chapter 4:</strong> Presentation & Analysis of Results (simulated thematic data tables)</li>
                  <li><strong className="text-slate-700">Chapter 5:</strong> Discussion, Conclusions & Recommendations (implications)</li>
                </ul>
              </div>
            )}

            {docType === 'assignment' && (
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <p className="text-slate-800 font-bold border-b border-emerald-500/10 pb-1">Model Academic Assignment Format</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Structural Composition Stages</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-0.5">
                      <li><strong className="text-slate-700">Introduction:</strong> Background, definitions, and guiding central thesis</li>
                      <li><strong className="text-slate-700">Main Body:</strong> 3+ logical paragraphs with citations & examples</li>
                      <li><strong className="text-slate-700">Conclusion:</strong> Synthesis summary, thesis addressing, closing thought</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 block">Finalization Stages</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-0.5">
                      <li><strong className="text-slate-700">Referencing:</strong> Standard alphabetized APA / Harvard citations</li>
                      <li><strong className="text-slate-700">Proofreading & Editing:</strong> Formal tone and transitional checks</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7">
          {isGenerating ? (
            <div className="bg-white rounded-3xl border border-slate-150 p-12 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin"></div>
                <GraduationCap className="text-emerald-500 animate-pulse" size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">Compiling Scholar Report</h3>
                <p className="text-xs font-bold text-emerald-600 animate-pulse">{steps[loadingStep]}</p>
                <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto mt-3">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : generatedReport ? (
            <div className="bg-white rounded-3xl border border-slate-150 overflow-hidden flex flex-col shadow-xs min-h-[500px]">
              {/* Output Actions Bar */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Academic Report Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-black text-[11px] uppercase tracking-wider py-1.5 px-3.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="text-emerald-500" size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download size={13} />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Research Report Sheet */}
              <div className="p-8 md:p-10 overflow-y-auto max-h-[600px] custom-scrollbar bg-white">
                <div 
                  ref={reportRef} 
                  className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-950 prose-p:leading-relaxed prose-li:font-semibold prose-strong:font-black text-slate-800"
                >
                  <ReactMarkdown>{generatedReport}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-3xl border border-dashed border-slate-250 p-12 flex flex-col items-center justify-center text-center min-h-[500px] text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-white border border-slate-150 text-slate-400 rounded-2xl flex items-center justify-center shadow-xs">
                <Search size={24} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-black text-slate-700 uppercase text-xs tracking-wider">Awaiting Question Input</h3>
                <p className="text-xs font-bold text-slate-400">Enter a query or study case in the left panel and click compile to generate a rigorous scholarly report.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
