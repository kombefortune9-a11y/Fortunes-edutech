import React, { useState } from 'react';
import { loadHtml2Pdf } from '../lib/pdfLoader';
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from '../lib/pdfUtils';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { trackInteraction } from '../services/telemetryService';
import { 
  BookOpen, 
  Download, 
  Printer, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Calendar, 
  BookMarked, 
  ClipboardList, 
  Users, 
  Award, 
  Brain, 
  Layers, 
  ArrowRight,
  MousePointer,
  Zap,
  Info,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

interface UserManualProps {
  onBack: () => void;
}

export function UserManual({ onBack }: UserManualProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    trackInteraction('user_manual', 'download_pdf');
    setIsDownloadingPdf(true);
    let restoreStyles: (() => void) | null = null;
    const toastId = toast.loading('Preparing PDF User Manual...', { id: 'pdf-manual-toast' });

    try {
      const element = document.getElementById('user-manual-printable-area');
      if (!element) {
        toast.error('User manual content not found', { id: toastId });
        return;
      }

      // Temporarily convert modern CSS colors (oklch/oklab) in document style tags & getComputedStyle
      restoreStyles = prepareDocumentForPdfExport();

      const h2p = await loadHtml2Pdf();
      const fileName = 'FORTUNES_EDUTECH_Official_User_Manual.pdf';
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobile) {
        toast.dismiss(toastId);
        setIsDownloadingPdf(false);
        window.print();
        return;
      }

      const opt = {
        margin:       [8, 6, 8, 6], // top, left, bottom, right in mm
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { 
          scale: isMobile ? 0.85 : 1.2, 
          useCORS: true, 
          allowTaint: true,
          logging: false,
          letterRendering: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 800,
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDoc(clonedDoc);
            // Aggressive cleanup of heavy visuals for mobile export stability
            clonedDoc.querySelectorAll('.animate-in, .transition-all, .shadow-xl, .shadow-2xl, .shadow-lg, .shadow-md, .shadow-sm, .shadow').forEach(el => {
              (el as HTMLElement).style.boxShadow = 'none';
              (el as HTMLElement).style.animation = 'none';
              (el as HTMLElement).style.transition = 'none';
              (el as HTMLElement).style.backdropFilter = 'none';
            });
          }
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      // Generate PDF as blob and use file-saver saveAs for universal mobile download
      const worker = h2p().set(opt).from(element);
      const pdfBlob = await worker.output('blob');

      if (pdfBlob && pdfBlob.size > 0) {
        saveAs(pdfBlob, fileName);
        toast.success('Downloaded User Manual (PDF) directly to phone storage!', { id: toastId });
      } else {
        await worker.save();
        toast.success('Downloaded User Manual (PDF) directly to phone storage!', { id: toastId });
      }
    } catch (error) {
      console.warn('PDF export handled with print fallback:', error);
      toast.success('Opening print-ready User Manual for saving as PDF...', { id: toastId });
      setTimeout(() => {
        window.print();
      }, 300);
    } finally {
      if (restoreStyles) {
        restoreStyles();
      }
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadWord = () => {
    const toastId = toast.loading('Preparing Word User Manual...', { id: 'word-manual-toast' });
    try {
      const element = document.getElementById('user-manual-printable-area');
      if (!element) {
        toast.error('User manual content not found', { id: toastId });
        return;
      }

      const fileName = 'FORTUNES_EDUTECH_Official_User_Manual.doc';
      const fullDocumentHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Fortunes Edutech User Manual</title>
          <!--[if gte mso 9]>
          <xml>
           <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
           </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 8.5in 11.0in;
              margin: 0.5in;
            }
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.4; }
            h1 { font-size: 18pt; color: #032532; border-bottom: 2px solid #032532; padding-bottom: 4px; }
            h2 { font-size: 14pt; color: #0f172a; margin-top: 16px; }
            h3 { font-size: 12pt; color: #047857; margin-top: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background-color: #0f172a; color: #ffffff; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + fullDocumentHtml], { type: 'application/msword;charset=utf-8' });
      saveAs(blob, fileName);
      toast.success('Downloaded User Manual (Word .doc) directly!', { id: toastId });
    } catch (err) {
      console.error('Word export error:', err);
      toast.error('Failed to export Word document.', { id: toastId });
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 font-sans">
      {/* Print-specific Stylesheet for PDF Manual Download */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 9pt !important;
            line-height: 1.35 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .pdf-section {
            break-inside: auto !important;
            page-break-inside: auto !important;
            margin-bottom: 14px !important;
            padding: 12px !important;
          }
          .pdf-section h2, .pdf-section h3, .pdf-section h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
          .pdf-header {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 8px !important;
            margin-bottom: 14px !important;
          }
        }
      `}</style>

      {/* Top Header & Action Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                Official Operational Guide
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">Official User Manual</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              FORTUNES EDUTECH ZAMBIA — Step-by-Step User Manual
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>DOWNLOAD PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadWord}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            title="Download editable Word document"
          >
            <FileText size={16} />
            <span>WORD (.DOC)</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
            title="Print or open browser print preview"
          >
            <Printer size={16} />
            <span>Browser Print</span>
          </button>
        </div>
      </div>

      {/* WRAPPER FOR PDF PRINTABLE AREA */}
      <div id="user-manual-printable-area" className="space-y-8">

        {/* MANUAL COVER HEADER */}
        <div className="pdf-header bg-gradient-to-br from-[#032532] via-[#0A3D50] to-[#01141B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 space-y-5">
          {/* TOP APP NAME BRANDING */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-emerald-400 uppercase leading-none">
                  FORTUNES EDUTECH ZAMBIA
                </h1>
                <p className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider mt-1">
                  Official Teacher Operational System & Document Generator
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-black text-[10px] uppercase rounded-full shrink-0">
              Version 2.4 (Aug 2026)
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight flex items-center gap-2">
              <BookOpen size={22} className="text-emerald-400 inline shrink-0" />
              <span>Complete Operational Manual & Pedagogical Guide</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-medium max-w-4xl leading-relaxed">
              Top-to-bottom step-by-step instructions for preparing Schemes of Work, Weekly Forecasts, 6-Step Lesson Plans, Detailed Lesson Notes, Individual Work Plans (IWP), Assessment Test Papers, Catch-Up/TaRL Remedial Cards, and Classroom Assessment Trackers under Ministry of Education guidelines.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs font-semibold text-emerald-300">
            <div>• Magic Fill AI Enabled</div>
            <div>• ECZ & CBC Aligned</div>
            <div>• 1-Click System Syncing</div>
            <div>• Clean A4 PDF Export</div>
          </div>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Table of Contents</h2>
              <p className="text-xs text-slate-500 font-medium">Quick navigation across all operational modules and document generators.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold text-slate-800">
            <a href="#section-general" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>1. General Information Registration & Profile Parameters</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-schemes" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>2. Schemes of Work Generator (13-Week Termly Planning)</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-forecast" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>3. Weekly Forecast Generator (Termly-to-Weekly Sync)</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-sync" className="p-3 rounded-2xl bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-between transition-colors">
              <span className="font-extrabold">4. 1-Click System Synchronization & Document Linking Engine</span>
              <ChevronRight size={14} className="text-emerald-600" />
            </a>
            <a href="#section-plans" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>5. Lesson Plan Generator (6-Step Pedagogy & Options)</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-notes" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>6. Detailed Lesson Notes Generator</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-iwp" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>7. Individual Work Plan (IWP) Administrator (6 ECZ Rolls)</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-tests" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>8. Test Papers & Assessment Generator (with Marking Keys)</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-tarl" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>9. Catch-Up & TaRL Remedial Learning Generator</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-videoscript" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>10. Video Lesson Scripts & Storyboard Planning</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-tracker" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>10. Assessment Record Tracker & Learner Progress Chart</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-syllabi" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>11. Syllabus & Knowledge Base Manager</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-subscription" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>12. Subscription, Grade Allocation & Receipt Downloading</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="#section-dashboard" className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-between transition-colors">
              <span>13. Sliding Menu Drawer & Dashboard Administration</span>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
          </div>
        </div>

        {/* SECTION 1: GENERAL INFORMATION REGISTRATION & PROFILE PARAMETERS */}
        <div id="section-general" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">01</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">1. General Information Registration & Profile Parameters</h2>
              <p className="text-xs text-slate-500 font-semibold">Top header parameters required for preparing official documents.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              Before generating any document (Schemes of Work, Weekly Forecasts, or Lesson Plans), teachers must configure the top <strong>General Information Header</strong> located at the top of the generator form.
            </p>

            {/* STEP-BY-STEP TOP-TO-BOTTOM PARAMETERS BREAKDOWN */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase text-emerald-400 tracking-wider border-b border-slate-800 pb-2">
                TOP-TO-BOTTOM FIELD SETUP PROCEDURE:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold">1. General Information Registration:</span>
                  <p className="text-slate-300 leading-snug">
                    Enter Teacher Name, TS Number (e.g. TS/10293), School Name, District, and Official Role (Senior Teacher, Head Teacher, Subject Specialist). Click <strong>Save Profile</strong>. This automatically populates on every generated document header.
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold">2. Academic Curriculum Selection:</span>
                  <p className="text-slate-300 leading-snug">
                    Select <strong>NEW CBC</strong> (Competency-Based Curriculum) for current revised standards or <strong>OLD OBC</strong> (Outcome-Based Curriculum) based on your school level requirements.
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold">3. Term, Start Date & Year:</span>
                  <p className="text-slate-300 leading-snug">
                    Choose Academic Term (Term 1, Term 2, or Term 3), select the official Term Start Date using the calendar picker, and select Year (e.g., 2026).
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-xl space-y-1">
                  <span className="text-emerald-400 font-bold">4. Grade & Subject Selection:</span>
                  <p className="text-slate-300 leading-snug">
                    Select Grade (ECE to Grade 9) and Subject. For Grade 1 & 2 English, choose <strong>English Preparation Mode</strong> (Combined vs Separate Literacy/Language).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <Sparkles className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 text-xs text-emerald-950">
                <strong className="block font-black uppercase text-emerald-900">1-Click System Persistence & Inter-Document Linking:</strong>
                <p className="leading-relaxed">
                  Saving generated Schemes or Forecasts to the system history links your documents automatically. When you open the Lesson Plan or Forecast generator for the same Grade, Subject, and Term, clicking <strong>SYNC FROM WEEKLY FORECAST</strong> or <strong>SYNC FROM SCHEMES OF WORK</strong> automatically loads topics, subtopics, and competencies without re-typing!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEMES OF WORK GENERATOR */}
        <div id="section-schemes" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm">02</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">2. Schemes of Work Generator (13-Week Termly Planning)</h2>
              <p className="text-xs text-slate-500 font-semibold">Preparing a full 13-week termly layout aligned with national standards.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Schemes of Work Generator</strong> creates a 13-week termly plan broken down into official ECZ columns: <em>Week, Topic, Subtopic, Specific Competencies, Suggested Learning Activities, Expected Standards, References, and Teaching Aids</em>.
            </p>

            {/* TOP TO BOTTOM STEP-BY-STEP INSTRUCTIONS */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Step-by-Step Procedure to Prepare Schemes of Work:
              </h3>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-800 font-medium pl-2">
                <li className="pl-1">
                  <strong>Configure General Header Parameters:</strong> Set Grade, Subject, Term, Year, and Term Start Date at the top of the form.
                </li>
                <li className="pl-1">
                  <strong>Choose Generation Mode:</strong> Select <em>Single Subject Mode</em> or <em>Multi-Subject Batch Mode</em> (if generating schemes for multiple subjects at once).
                </li>
                <li className="pl-1">
                  <strong>Sync Syllabus Topics (Magic Fill / Sync Syllabus):</strong> Click the <strong>Sync Syllabus</strong> button. The AI automatically retrieves approved ECZ syllabus subtopics, competencies, and recommended learning activities for the selected Term across all 13 weeks.
                </li>
                <li className="pl-1">
                  <strong>Review & Customize Weekly Breakdown:</strong> Inspect each week (Week 1 through Week 13). You can manually edit or refine specific competencies, teaching aids, or reference materials for any individual week.
                </li>
                <li className="pl-1">
                  <strong>Add Custom Instructions / Additional Context:</strong> Use the <em>Important Note of Instructions</em> field to pass specific pedagogical instructions to the AI (e.g. "Focus on local agricultural examples and group practicals").
                </li>
                <li className="pl-1">
                  <strong>Click GENERATE SCHEME OF WORK:</strong> The AI formats and generates the complete 13-week scheme table. Click <strong>Save to System History</strong> or export as PDF/Word.
                </li>
              </ol>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Official ECZ Column Layout Included in Generated Scheme:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 font-semibold">
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Week Number & Dates</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Main Topic & Subtopic</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Specific Competencies</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Suggested Activities</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Expected Standard</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• References & Syllabus</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Teaching/Learning Aids</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">• Remarks Slot</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: WEEKLY FORECAST GENERATOR */}
        <div id="section-forecast" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl font-black text-sm">03</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">3. Weekly Forecast Generator</h2>
              <p className="text-xs text-slate-500 font-semibold">Converting termly schemes into weekly teaching periods detailing planned work.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Weekly Forecast Generator</strong> converts termly schemes into weekly instructional layouts, breaking down work into explicit teaching periods for every single week.
            </p>

            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-600" />
                Step-by-Step Procedure to Prepare Weekly Forecast:
              </h3>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-800 font-medium pl-2">
                <li className="pl-1">
                  <strong>Set Grade, Subject, Term & Start Date:</strong> Ensure top header parameters match your teaching schedule.
                </li>
                <li className="pl-1">
                  <strong>Click SYNC FROM SCHEMES OF WORK:</strong> Click the green <strong>Sync from Schemes</strong> button. The app searches your saved Schemes of Work for the matching Grade, Subject, and Term, and instantly populates the weekly topic sequence and specific competencies for Week 1 to Week 13.
                </li>
                <li className="pl-1">
                  <strong>Specify Week Number & Period Allocation:</strong> Choose the target week (e.g. Week 4) and set the number of allocated periods (e.g. 5 periods per week).
                </li>
                <li className="pl-1">
                  <strong>Review Planned Activities & Learning Aids:</strong> Inspect auto-generated learning aids, reference materials, and pedagogical approaches.
                </li>
                <li className="pl-1">
                  <strong>Click GENERATE WEEKLY FORECAST:</strong> The system produces the formatted Weekly Forecast document ready for supervisory signing and 1-click sync into daily lesson plans!
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* SECTION 4: 1-CLICK SYSTEM SYNCHRONIZATION (SCHEMES, FORECASTS & LESSON PLANS) */}
        <div id="section-sync" className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-emerald-500/30 p-6 sm:p-8 shadow-xl space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
            <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm">04</div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">4. 1-Click System Synchronization (Schemes, Forecasts & Lesson Plans)</h2>
              <p className="text-xs text-emerald-300 font-semibold">How saving Schemes of Work and Weekly Forecasts unlocks 1-click auto-filling for Lesson Plans.</p>
            </div>
          </div>

          <div className="space-y-5 text-slate-200 text-sm leading-relaxed">
            <p>
              Fortunes Edutech operates an automated <strong>Curriculum Sync Pipeline</strong> for core instructional documents. When you save a generated <strong>Scheme of Work</strong> or <strong>Weekly Forecast</strong> into system records, 13-week curriculum data—including Topics, Subtopics, Specific Competencies, and References—is indexed by Grade, Subject, Term, and Year to power 1-click auto-filling for daily <strong>Lesson Plans</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-xs">
                  <Sparkles size={16} />
                  <span>Step 1: Saving Schemes of Work</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  After generating a 13-Week Scheme of Work, click <strong>Save to System History</strong> or <strong>Save Record</strong>. This stores the 13-week curriculum layout for instant retrieval in Weekly Forecasts.
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-xs">
                  <Sparkles size={16} />
                  <span>Step 2: Saving Weekly Forecasts</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  In the Weekly Forecast generator, click <strong>Sync from Schemes of Work</strong>, then click <strong>Generate & Save Record</strong>. This maps weekly period allocations directly from your saved scheme into saved forecast records.
                </p>
              </div>
            </div>

            {/* HOW SYNCHRONIZATION WORKS FOR LESSON PLANS */}
            <div className="p-5 bg-slate-900/90 rounded-2xl border border-emerald-400/30 space-y-3">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block border-b border-emerald-500/20 pb-2">
                AUTOMATED SYNCHRONIZATION FLOW (SCHEMES → FORECAST → LESSON PLANS):
              </span>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] shrink-0">LESSON PLAN AUTO-FILL</span>
                  <span>Select Grade, Subject, Term, and Week Number in the Lesson Plan Generator. Click <strong className="text-emerald-300">SYNC FROM WEEKLY FORECAST</strong>. The generator instantly auto-populates the exact topic, subtopic, specific competencies, and textbook references for that week from your saved forecast!</span>
                </div>
              </div>
            </div>

            {/* EXPLICIT NOTICE ON EXCLUDED DOCUMENTS */}
            <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl space-y-1.5 text-xs text-amber-200">
              <strong className="block font-black uppercase text-amber-300">Important Note on Document Scope:</strong>
              <p className="leading-relaxed text-[11px] text-slate-200">
                <strong>Only Schemes of Work, Weekly Forecasts, and Lesson Plans</strong> are involved in document synchronization. Lesson Notes, Individual Work Plans (IWP), Test Papers, Catch-Up/TaRL Cards, and Assessment Trackers operate as independent, standalone document tools and are <strong>not</strong> synchronized from schemes or forecasts.
              </p>
            </div>

            {/* KEY BENEFITS */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-2xl space-y-2 text-xs text-emerald-200">
              <strong className="block font-black uppercase text-emerald-300">Core Benefits of Scheme/Forecast Synchronization:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-200">
                <div>• <strong>10x Faster Preparation:</strong> Generate daily lesson plans in seconds without manual copy-pasting.</div>
                <div>• <strong>Zero Typing Errors:</strong> Eliminate repetitive typing of complex outcomes and competencies.</div>
                <div>• <strong>100% Supervisory Consistency:</strong> Ensure perfect alignment between termly schemes, weekly forecasts, and daily lesson plans.</div>
                <div>• <strong>Automatic Week Progression:</strong> Switching week numbers automatically pulls the corresponding week's work.</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: LESSON PLAN GENERATOR (6-STEP PEDAGOGY) */}
        <div id="section-plans" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm">05</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">5. Lesson Plan Generator (6-Step ECZ & CBC Pedagogy)</h2>
              <p className="text-xs text-slate-500 font-semibold">Creating comprehensive single/double period lesson plans with customization options.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Lesson Plan Generator</strong> produces official 6-step pedagogical lesson plans compliant with Ministry of Education standards.
            </p>

            {/* COMPLETE TOP TO BOTTOM WORKFLOW INSTRUCTION */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase text-indigo-400 tracking-wider border-b border-slate-800 pb-2">
                COMPLETE TOP-TO-BOTTOM LESSON PLAN PREPARATION WORKFLOW:
              </div>

              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-200 font-medium">
                <li>
                  <strong className="text-white">General Information & Curriculum:</strong> Verify Teacher Name and School profile at top. Choose <strong>NEW CBC</strong> or <strong>OLD OBC</strong> curriculum.
                </li>
                <li>
                  <strong className="text-white">Academic Parameters:</strong> Select Term (1, 2, 3), Term Start Date, Year, Grade, and Subject.
                </li>
                <li>
                  <strong className="text-white">Lesson & Week Number:</strong> Input Lesson Number (e.g., Lesson 1) and Week Number (e.g., Week 6).
                </li>
                <li>
                  <strong className="text-white">1-Click Sync from Forecast:</strong> Click <strong className="text-emerald-400">SYNC FROM WEEKLY FORECAST</strong>. The system automatically fetches the specific week's topic, subtopic, specific competencies, and reference books from your saved forecast!
                </li>
                <li>
                  <strong className="text-white">Review Content Details:</strong> Toggle <em>Show Content Details</em> to inspect or modify Topic, Subtopic, and Competencies. Toggle <em>Show Reference Materials & Syllabus</em> to review book references.
                </li>
                <li>
                  <strong className="text-white">Custom Instructions to AI:</strong> Use the <em>Important Note of Instructions</em> box to add specific guidance (e.g. "Let lesson plan be syllabus based, module quoted, with interactive group problem solving").
                </li>
                <li>
                  <strong className="text-white">Configure Lesson Plan Options:</strong>
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-indigo-500 text-[11px] text-slate-300">
                    <p>
                      • <strong>INCLUDE TEACHING NOTES:</strong> Select <strong>NO - Lesson Plan Only</strong> (generates standard 2-page plan) OR <strong>YES - Append Teaching Notes</strong> (automatically appends comprehensive lesson notes, worked examples, and pupil exercises on Page 3+ using page-breaks).
                    </p>
                    <p>
                      • <strong>INCLUDE HOMEWORK:</strong> Select <strong>NO - Omit Homework</strong> OR <strong>YES - Include Homework Section</strong>.
                    </p>
                  </div>
                </li>
                <li>
                  <strong className="text-white">Click GENERATE DOCUMENT:</strong> The AI generates the formatted document in seconds!
                </li>
              </ol>
            </div>

            {/* ANATOMY OF A GENERATED LESSON PLAN */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 text-xs text-indigo-950">
              <span className="font-extrabold uppercase text-indigo-900 block">Structure of Generated 6-Step Lesson Plan:</span>
              <ul className="space-y-1.5 list-disc list-inside">
                <li><strong>Administrative Header:</strong> School, Teacher, Date, Time, Subject, Grade, Roll (Boys/Girls), Topic, Subtopic.</li>
                <li><strong>Rationale Statement:</strong> Concise pedagogical purpose of the lesson.</li>
                <li><strong>Prerequisites Check:</strong> What prior knowledge learners must possess.</li>
                <li><strong>Teaching/Learning Aids & References:</strong> Textbooks, syllabus references, and physical materials required.</li>
                <li><strong>6 Pedagogical Stages Table:</strong>
                  <span className="block text-[11px] text-indigo-800 pl-4">1. Introduction • 2. Lesson Development (Step 1-4) • 3. Synthesis & Practice • 4. Conclusion • 5. Learner Activities • 6. Teacher Activities</span>
                </li>
                <li><strong>Evaluations & Homework:</strong> Learner's Evaluation, Teacher's Evaluation, and Homework Assignment.</li>
                <li><strong>Appended Teaching Notes (Page 3):</strong> Complete subject notes appended whenever "Include Teaching Notes" option is set to YES.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 6: LESSON NOTES GENERATOR */}
        <div id="section-notes" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl font-black text-sm">06</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">6. Detailed Lesson Notes Generator</h2>
              <p className="text-xs text-slate-500 font-semibold">In-depth topic notes, diagrams, worked examples, and pupil practice exercises.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              When teachers need standalone teaching materials or pupil study guides, the <strong>Detailed Lesson Notes Generator</strong> creates comprehensive content ready for chalkboard writing or distribution.
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800 font-medium pl-2">
              <li>Select Grade, Subject, Topic, and Subtopic.</li>
              <li>Select Notes Depth: <em>Standard Classroom Notes, Comprehensive Topic Notes, or Advanced Exam Revision Notes</em>.</li>
              <li>Click <strong>GENERATE LESSON NOTES</strong>. The system generates structured key definitions, step-by-step worked solutions, diagrams, and pupil practice questions.</li>
            </ol>
          </div>
        </div>

        {/* SECTION 7: INDIVIDUAL WORK PLAN (IWP) */}
        <div id="section-iwp" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm">07</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">7. Individual Work Plan (IWP) Administrator</h2>
              <p className="text-xs text-slate-500 font-semibold">Teacher administrative duty planning categorized across official ECZ Rolls 1 through 6.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Individual Work Plan (IWP) Administrator</strong> helps teachers organize, schedule, and present official weekly or monthly work plans for supervisory review.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-semibold text-slate-800">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 1: Academic Programmes</span>
                Lesson delivery, schemes, marking, remediation.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 2: Co-Curricular Duties</span>
                Sports, clubs, JET, assemblies, cultural events.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 3: Administrative Duties</span>
                Register maintenance, stock control, reports.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 4: Learner Guidance</span>
                Counseling, career guidance, psycho-social support.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 5: School-Community</span>
                PTA meetings, community outreach, open days.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-rose-600 font-bold block">Roll 6: Professional Development</span>
                CPD workshops, peer lesson observations.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8: TEST PAPERS & ASSESSMENTS */}
        <div id="section-tests" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl font-black text-sm">08</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">8. Test Papers & Assessment Generator</h2>
              <p className="text-xs text-slate-500 font-semibold">Generating curriculum-aligned assessment papers with step-by-step marking keys.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Test Papers & Assessment Generator</strong> creates ready-to-print assessment papers formatted according to Examination Council of Zambia (ECZ) standards.
            </p>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800 font-medium pl-2">
              <li>Select Grade, Subject, Term, and Assessment Type (Mid-Term Test, End of Term Exam, Topic Quiz, Mock Exam).</li>
              <li>Select Question Types (Multiple Choice Section A, Short Answer Section B, Structured Essay Section C).</li>
              <li>Toggle <strong>Include Marking Key</strong>: When enabled, the AI generates a step-by-step Answer Key & Marking Scheme starting on a fresh page immediately after the test paper.</li>
              <li>Click <strong>GENERATE TEST PAPER</strong>.</li>
            </ol>
          </div>
        </div>

        {/* SECTION 9: CATCH-UP & TARL REMEDIAL LEARNING */}
        <div id="section-tarl" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl font-black text-sm">09</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">9. Catch-Up & TaRL Remedial Learning Generator</h2>
              <p className="text-xs text-slate-500 font-semibold">Teaching at the Right Level competency grouping and remedial session guides.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              Designed specifically for national Catch-Up and TaRL (Teaching at the Right Level) programs, this tool generates targeted remedial instruction plans.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-1">
                <strong className="font-extrabold text-orange-950 block">Literacy Catch-Up Levels:</strong>
                <p className="text-orange-900">Beginner Level • Letter Level • Word Level • Paragraph Level • Story Level.</p>
              </div>
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                <strong className="font-extrabold text-amber-950 block">Numeracy Catch-Up Levels:</strong>
                <p className="text-amber-900">Beginner Count • Number Identification • 1-Digit Addition • 2-Digit Subtraction • Word Problems.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 10: VIDEO LESSON SCRIPTS & STORYBOARD PLANNING */}
        <div id="section-videoscript" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-purple-600 text-white rounded-2xl font-black text-sm">10</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">10. Video Lesson Scripts & Storyboard Planning</h2>
              <p className="text-xs text-slate-500 font-semibold">Educational video script generation with scene-by-scene storyboards & active presenter prompts.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Video Lesson Scripts</strong> tool transforms syllabus topics into ready-to-record educational video scripts and detailed scene-by-scene storyboards aligned with Examination Council of Zambia (ECZ) standards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                <strong className="font-extrabold text-purple-950 block">Interactive Visual Storyboards:</strong>
                <p className="text-purple-900">Includes explicit visual cues, chalkboard illustrations, graphics notes, and scene durations.</p>
              </div>
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                <strong className="font-extrabold text-indigo-950 block">Pause & Practice Prompts:</strong>
                <p className="text-indigo-900">Features built-in teacher dialogue prompts instructing learners to pause the video and solve on-screen tasks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 11: ASSESSMENT RECORD TRACKER & LEARNER PROGRESS CHART */}
        <div id="section-tracker" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl font-black text-sm">10</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">10. Assessment Record Tracker & Learner Progress Chart</h2>
              <p className="text-xs text-slate-500 font-semibold">Classroom grading suite, pass rate analytics, and multi-term progress charts.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The <strong>Assessment Record Tracker</strong> is a classroom grading suite designed for 20 Boys & 20 Girls per class. It provides automated grade conversions, pass rate calculations, and visual progress tracking.
            </p>

            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-black uppercase text-blue-400 tracking-wider block border-b border-slate-800 pb-2">
                KEY GRADING & ANALYTICAL RULES:
              </span>

              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Pass Threshold:</strong> Raw test scores are converted to percentage marks (%). Scores ≥ 40% are classified as <strong>PASS</strong>; scores below 40% as <strong>FAIL</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Pass Rate Formula:</strong> Subject Pass Rate = <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">(Learners scoring ≥ 40% ÷ Total Learners who sat) × 100%</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Bulk Paste Import:</strong> Teachers can copy scores from Excel or Word spreadsheets and click <strong>Bulk Paste</strong> to import all pupil marks at once!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>2-Sentence AI Pedagogical Advice:</strong> Evaluates overall class pass rates and automatically provides concise recommendations for remediation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 11: SYLLABUS & KNOWLEDGE BASE MANAGER */}
        <div id="section-syllabi" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-700 text-white rounded-2xl font-black text-sm">11</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">11. Syllabus & Knowledge Base Manager</h2>
              <p className="text-xs text-slate-500 font-semibold">Upload custom syllabus documents (PDF/DOCX/Scanned images) for AI document extraction.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              Teachers can upload official Ministry of Education syllabus files (PDF, DOCX, or scanned images) into the Knowledge Base. The AI extracts official learning outcomes, subtopics, and specific competencies directly into the system, making them instantly available in your generator forms via <strong>Sync Syllabus</strong>!
            </p>
          </div>
        </div>

        {/* SECTION 12: SUBSCRIPTION, GRADE ALLOCATION & RECEIPT DOWNLOADING */}
        <div id="section-subscription" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl font-black text-sm">12</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">12. Subscription, Grade Allocation & Receipt Downloading</h2>
              <p className="text-xs text-slate-500 font-semibold">Manage active teaching grade allocations, account status, and instant payment receipt downloads.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              The platform provides full access to all teaching grades from Early Childhood Education (ECE) levels up to Form 6 (A Level) automatically. There is no longer any restriction or per-grade allocation required.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 uppercase text-[11px] block text-indigo-700">A. All Grades Unlocked:</span>
                <p className="text-slate-600 leading-snug">
                  Your active subscription cycle provides unrestricted access to the complete grade list (ECE levels through Form 6 (A Level)) for schemes of work, weekly forecasts, lesson plans, tests, and homework generator portals.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 uppercase text-[11px] block text-indigo-700">B. Download Payment Receipts:</span>
                <p className="text-slate-600 leading-snug">
                  Click <strong>Download Receipt</strong> in the Subscription Modal or Settings menu to generate an official PDF receipt featuring payment transaction reference, amount paid (ZMW), date, and active grade breakdown.
                </p>
              </div>
            </div>

            {/* Subscription Packages Table */}
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <span className="font-extrabold text-indigo-900 uppercase text-[11px] block">C. Official Subscription Circles & Pricing Structure:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-[9px] font-black uppercase text-amber-700">Weekly Circle</div>
                  <div className="text-sm font-black text-slate-900">K20</div>
                  <div className="text-[8px] font-bold text-slate-500">40 Docs • 7 Days</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-[9px] font-black uppercase text-cyan-700">14 Days Circle</div>
                  <div className="text-sm font-black text-slate-900">K40</div>
                  <div className="text-[8px] font-bold text-slate-500">80 Docs • 14 Days</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                  <div className="text-[9px] font-black uppercase text-purple-700">Monthly Circle</div>
                  <div className="text-sm font-black text-slate-900">K90</div>
                  <div className="text-[8px] font-bold text-slate-500">180 Docs • 30 Days</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-200 bg-indigo-50/30 text-center space-y-1 relative">
                  <div className="text-[9px] font-black uppercase text-indigo-700">Termly Circle</div>
                  <div className="text-sm font-black text-slate-900">K250</div>
                  <div className="text-[8px] font-bold text-indigo-600">500 Docs • 90 Days</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 text-center space-y-1 relative">
                  <span className="absolute -top-2 right-1/2 translate-x-1/2 bg-amber-500 text-slate-950 text-[6px] font-black uppercase px-1.5 py-0.2 rounded-full">Best Value</span>
                  <div className="text-[9px] font-black uppercase text-emerald-700">Unlimited</div>
                  <div className="text-sm font-black text-slate-900">K1,500</div>
                  <div className="text-[8px] font-bold text-emerald-600">Unlimited • Permanent</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-2">
                * Both <strong>Termly Circle (K250)</strong> and <strong>Unlimited Access (K1,500)</strong> include full access to the Assignment &amp; Research Writing Hub in addition to standard teaching tools.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 13: SLIDING MENU DRAWER & DASHBOARD ADMINISTRATION */}
        <div id="section-dashboard" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-purple-600 text-white rounded-2xl font-black text-sm">13</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">13. Sliding Menu Drawer & Dashboard Administration</h2>
              <p className="text-xs text-slate-500 font-semibold">Smooth vertical menu drawer, full unwrap visibility, and universal PDF key export.</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <p>
              Access all core modules effortlessly using the <strong>Top Right Menu Button (3 Horizontal Lines)</strong> on your dashboard header.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Slide-Over Vertical Sheet:</strong> Opens smoothly as a full-height vertical panel on the right without hiding or clipping any menu options.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Full Unwrap View:</strong> Knowledge Base, System Settings, User Manual, Subscription, and Profile management are cleanly laid out with direct navigation triggers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span><strong>Download Key / Direct PDF Download:</strong> All generated documents feature a prominent <strong>Download PDF Key</strong> allowing teachers to instantly save clean A4 files directly to mobile device storage.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* SECTION 14: OFFICIAL ZAMBIAN EDUCATION PORTALS & ESSENTIAL RESOURCE LINKS */}
        <div id="section-official-links" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 pdf-section">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl font-black text-sm">14</div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">14. Official Zambian Education Portals & Resource Links</h2>
              <p className="text-xs text-slate-500 font-semibold">Verified government and curriculum portals for payslips, professional licensing, and examinations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="https://epdmis.grz.gov.zm/request-payslip/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 transition-all flex flex-col gap-1 text-left select-none group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#00A86B] uppercase text-xs">1. E-Payslip Request Portal</span>
                <span className="text-slate-400 group-hover:text-indigo-600 font-bold text-xs">epdmis.grz.gov.zm ↗</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                The official Ministry of Finance E-Payslip platform. Teachers can securely log in, query, and request official monthly PDF payslips directly to their email.
              </p>
            </a>

            <a 
              href="https://www.edu.gov.zm/?page_id=1142" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 transition-all flex flex-col gap-1 text-left select-none group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#00A86B] uppercase text-xs">2. Ministry of Education (MoE)</span>
                <span className="text-slate-400 group-hover:text-indigo-600 font-bold text-xs">edu.gov.zm ↗</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                The central government portal for the Ministry of Education. Access public policy circulars, deployment announcements, and official notices.
              </p>
            </a>

            <a 
              href="https://library.cdcrepository.info/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 transition-all flex flex-col gap-1 text-left select-none group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#00A86B] uppercase text-xs">3. Download CBC Materials (CDC)</span>
                <span className="text-slate-400 group-hover:text-indigo-600 font-bold text-xs">cdcrepository.info ↗</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                The Curriculum Development Centre (CDC) repository. Download official National Curriculum syllabi, reference frames, and pedagogical guides.
              </p>
            </a>

            <a 
              href="https://www.tcz.org.zm/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 transition-all flex flex-col gap-1 text-left select-none group"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#00A86B] uppercase text-xs">4. Teaching Council of Zambia</span>
                <span className="text-slate-400 group-hover:text-indigo-600 font-bold text-xs">tcz.org.zm ↗</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                TCZ licensing and registration portal. Check professional compliance statuses, register, and handle teacher registration credentials online.
              </p>
            </a>

            <a 
              href="https://www.exams-council.org.zm/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-indigo-500 bg-indigo-50/10 hover:bg-slate-50/50 transition-all flex flex-col gap-1 text-left select-none group md:col-span-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-700 uppercase text-xs">5. Examinations Council of Zambia (ECZ)</span>
                <span className="text-indigo-500 font-bold text-xs">exams-council.org.zm ↗</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                The national examination body. Download public examination timetables, past papers, check official grade 7, 9 & 12 results, and access e-statements.
              </p>
            </a>
          </div>
        </div>

      </div>

      {/* BOTTOM DOWNLOAD BANNER (EXCLUDED FROM PRINTABLE PDF ENGINE) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-indigo-500/30 text-center space-y-4 print:hidden" data-html2canvas-ignore="true">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">READY TO PRINT OR EXPORT USER MANUAL?</h3>
        <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl mx-auto">
          Click below to generate and save a clean A4 PDF file of this user manual directly to your phone or laptop.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>DOWNLOAD USER MANUAL (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={handleTriggerPrint}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl transition-all cursor-pointer border border-white/20"
          >
            <Printer size={18} />
            <span>Browser Print Dialog</span>
          </button>
        </div>
      </div>
    </div>
  );
}
