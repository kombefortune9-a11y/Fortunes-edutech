import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, recordDownload } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Trash2, 
  History as HistoryIcon, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft,
  Search,
  BookOpen,
  Download,
  AlertCircle,
  Edit2,
  X,
  Eraser,
  FileCode
} from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from '../lib/pdfUtils';
import { downloadWordBlob } from '../lib/wordExportHelper';
// Word export doesn't require extra libraries for simple .doc files
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { loadHtml2Pdf } from '../lib/pdfLoader';
import { shareOrSavePdfBlob } from '../lib/pdfShareHelper';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';
import InformationCenter from './InformationCenter';


interface DownloadRecord {
  id: string;
  title: string;
  type: string;
  subject: string;
  grade: string;
  topic?: string;
  subtopic?: string;
  content: string;
  timestamp: Timestamp;
  format: string;
  metadata?: {
    teacherName?: string;
    school?: string;
    district?: string;
    zone?: string;
    term?: string;
    year?: string;
  };
}

function safeToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (e) {
      console.warn("Error calling toDate() on timestamp:", e);
    }
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

interface RecordOfWorkProps {
  onBack: () => void;
  onPreviewDoc?: (content: string, params: any) => void;
}

export function RecordOfWork({ onBack, onPreviewDoc }: RecordOfWorkProps) {
  const { user, isWhitelisted, subscriptionDetails, downloadRecords } = useAuth();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const checkDownloadAccess = (docType?: string): boolean => {
    const status = getDownloadAccessStatus(user, subscriptionDetails);
    if (!status.allowed) {
      toast.error(status.message, {
        id: 'row-depleted-toast',
        duration: 8000
      });
      return false;
    }
    return true;
  };
  
  // New States for Filtering
  const [activeTab, setActiveTab] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingWordId, setGeneratingWordId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [wordSuccessId, setWordSuccessId] = useState<string | null>(null);
  const tabs = [
    { id: 'All', label: 'All Documents' },
    { id: 'schemes_of_work', label: 'Schemes of Work' },
    { id: 'weekly_forecast', label: 'Weekly Forecast' },
    { id: 'lesson_plan', label: 'Lesson Plans' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'syllabi', label: 'Syllabi' }
  ];

  // New States for Editing
  const [editingRecord, setEditingRecord] = useState<DownloadRecord | null>(null);

  const handleOpenEdit = (record: DownloadRecord) => {
    setEditingRecord(record);
  };


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load from local storage cache immediately so user never sees empty state while waiting or offline
    let localRecords: DownloadRecord[] = [];
    try {
      const cacheKey = `eduplan_downloads_cache_${user.uid}`;
      const stored1 = safeLocalStorage.getItem(cacheKey);
      const stored2 = safeLocalStorage.getItem('eduplan_downloads');
      const parsed1 = stored1 ? JSON.parse(stored1) : [];
      const parsed2 = stored2 ? JSON.parse(stored2) : [];

      const map = new Map();
      [...parsed1, ...parsed2].forEach((item: any) => {
        if (item && (item.id || item.title)) {
          const key = item.id || (item.title + '_' + item.type);
          if (!map.has(key)) map.set(key, item);
        }
      });
      localRecords = Array.from(map.values());
      if (localRecords.length > 0) {
        setDownloads(localRecords);
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load local download records", e);
    }

    if (user.uid === 'guest_teacher') {
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    const q = query(
      collection(db, 'users', user.uid, 'downloads'), 
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const serverRecords: DownloadRecord[] = [];
      snapshot.forEach((doc) => {
        serverRecords.push({ id: doc.id, ...doc.data() } as DownloadRecord);
      });

      // Merge server records with local records so offline downloads remain preserved
      const combinedMap = new Map();
      serverRecords.forEach(rec => combinedMap.set(rec.id || (rec.title + '_' + rec.type), rec));
      localRecords.forEach(rec => {
        const k = rec.id || (rec.title + '_' + rec.type);
        if (!combinedMap.has(k)) combinedMap.set(k, rec);
      });

      const finalRecords = Array.from(combinedMap.values());
      setDownloads(finalRecords);
      setLoading(false);
      setError(null);
      clearTimeout(timeout);

      // Persist merged records to cache for offline/instant availability
      try {
        const cacheKey = `eduplan_downloads_cache_${user.uid}`;
        safeLocalStorage.setItem(cacheKey, JSON.stringify(finalRecords));
        safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(finalRecords));
      } catch (e) {}
    }, (err: any) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/downloads`);
      setLoading(false);
      clearTimeout(timeout);
      if (localRecords.length > 0) {
        setDownloads(localRecords);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user?.uid]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000);
      return;
    }

    if (user.uid === 'guest_teacher') {
      try {
        setDeletingId(id);
        setConfirmDeleteId(null);
        const storedStr = safeLocalStorage.getItem('eduplan_downloads');
        let current: any[] = storedStr ? JSON.parse(storedStr) : [];
        current = current.filter(d => d.id !== id);
        safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(current));
        setDownloads(current);
      } catch (err) {
        console.error("Local download delete fail", err);
      } finally {
        setDeletingId(null);
      }
      return;
    }

    try {
      setDeletingId(id);
      setConfirmDeleteId(null);
      await deleteDoc(doc(db, 'users', user.uid, 'downloads', id));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanupOldRecords = async () => {
    if (!user || downloads.length === 0) return;
    
    if (!confirmCleanup) {
      setConfirmCleanup(true);
      setTimeout(() => setConfirmCleanup(false), 5000);
      return;
    }

    if (user.uid === 'guest_teacher') {
      try {
        setIsCleaningUp(true);
        setConfirmCleanup(false);
        const cutoffDate = new Date('2026-05-10T00:00:00Z');
        const storedStr = safeLocalStorage.getItem('eduplan_downloads');
        let current: any[] = storedStr ? JSON.parse(storedStr) : [];
        const kept = current.filter(d => {
          const tDate = safeToDate(d.timestamp);
          return tDate ? tDate >= cutoffDate : true;
        });
        safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(kept));
        setDownloads(kept);
        alert("Cleanup complete. Old records removed.");
      } catch (err) {
        console.error("Local cleanup error", err);
      } finally {
        setIsCleaningUp(false);
      }
      return;
    }

    try {
      setIsCleaningUp(true);
      setConfirmCleanup(false);
      
      // Cutoff: May 10th, 2026 at 00:00:00
      const cutoffDate = new Date('2026-05-10T00:00:00Z');
      
      const recordsToDelete = downloads.filter(d => {
        const dDate = safeToDate(d.timestamp);
        return dDate ? dDate < cutoffDate : false;
      });

      if (recordsToDelete.length === 0) {
        alert("No records found before May 10th, 2026.");
        return;
      }

      // Use Firestore Batches for much faster deletion (limit 500 per batch)
      const totalToDelete = recordsToDelete.length;
      let deletedCount = 0;
      
      // Process in chunks of 500
      for (let i = 0; i < totalToDelete; i += 500) {
        const batch = writeBatch(db);
        const chunk = recordsToDelete.slice(i, i + 500);
        
        chunk.forEach((record) => {
          const docRef = doc(db, 'users', user.uid, 'downloads', record.id);
          batch.delete(docRef);
        });
        
        await batch.commit();
        deletedCount += chunk.length;
      }
      
      alert(`Successfully deleted ${deletedCount} records created before May 10th, 2026.`);
    } catch (error) {
      console.error("Cleanup failed:", error);
      alert("Failed to complete cleanup. Some records may still exist.");
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDownloadWord = async (record: DownloadRecord) => {
    if (!checkDownloadAccess(record.type)) return;
    const element = document.getElementById(`preview-${record.id}`);
    if (!element) return;
    
    setGeneratingWordId(record.id);
    setWordSuccessId(null);
    
    try {
      const subject = (record.subject || "SUBJECT").trim().toUpperCase().replace(/\s+/g, "_");
      let shortType = "DOC";
      const t = (record.type || "").toLowerCase();
      if (t === "schemes_of_work") shortType = "SCHEMES";
      else if (t === "weekly_forecast") shortType = "WEEKLY";
      else if (t === "lesson_plan") shortType = "Lesson_P";
      else if (t === "catch_up") shortType = "Lesson_P";
      else if (t === "individual_work_plan") shortType = "IND_WORK_PLAN";
      else if (t === "lesson_notes") shortType = "NOTES";
      else if (t === "assessments") shortType = "ASSESSMENTS";
      else if (t === "syllabi") shortType = "SYLLABUS";

      const fileName = `FORTUNES_EDUTECH_${subject}_${shortType}.doc`;
      const isLandscape = t === "schemes_of_work" || t === "weekly_forecast";

      const { success } = downloadWordBlob(element.outerHTML, fileName, {
        metadata: {
          type: record.type,
          grade: record.grade,
          subject: record.subject,
          topic: record.topic,
          subtopic: record.subtopic,
        },
        isLandscape,
        title: record.title || fileName,
      });

      if (success) {
        setWordSuccessId(record.id);
        toast.success(`Saved ${fileName} to Downloads folder!`);
        
        // Tracking
        recordDownload({
          type: record.type,
          grade: record.grade,
          subject: record.subject,
          topic: record.topic,
          subtopic: record.subtopic,
          format: 'doc'
        });

        setTimeout(() => setWordSuccessId(null), 3000);
      } else {
        toast.error("Could not download Word document.");
      }
    } catch (error) {
      console.error("Word conversion error:", error);
      toast.error("Failed to generate Word document.");
    } finally {
      setGeneratingWordId(null);
    }
  };

  const handleDownloadPDF = async (record: DownloadRecord) => {
    if (!checkDownloadAccess(record.type)) return;
    if (!record.content) {
      alert("This document content was not saved in history and cannot be redownloaded.");
      return;
    }

    try {
      setGeneratingId(record.id);
      setDownloadSuccessId(null);

      const subject = (record.subject || "SUBJECT").trim().toUpperCase().replace(/\s+/g, "_");
      let shortType = "DOC";
      const t = (record.type || "").toLowerCase();
      if (t === "schemes_of_work") shortType = "SCHEMES";
      else if (t === "weekly_forecast") shortType = "WEEKLY";
      else if (t === "lesson_plan") shortType = "Lesson_P";
      else if (t === "catch_up") shortType = "Lesson_P";
      else if (t === "individual_work_plan") shortType = "IND_WORK_PLAN";
      else if (t === "lesson_notes") shortType = "NOTES";
      else if (t === "assessments") shortType = "ASSESSMENTS";
      else if (t === "syllabi") shortType = "SYLLABUS";

      const fileName = `FORTUNES_EDUTECH_${subject}_${shortType}.pdf`;

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      const isLandscapeRecord = record.type === 'schemes_of_work' || record.type === 'weekly_forecast';
      const isWeeklyForecastRecord = record.type === 'weekly_forecast';

      const opt = {
        margin: (isWeeklyForecastRecord ? [2, 3, 2, 3] : (isLandscapeRecord ? [4, 4, 4, 4] : [10, 4, 10, 4])) as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: { 
          scale: isMobile ? 0.85 : 1.2, 
          useCORS: true,
          logging: false,
          letterRendering: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: isLandscapeRecord ? 1092 : 763,
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDoc(clonedDoc);
            // Cleanup heavy visuals for mobile export
            clonedDoc.querySelectorAll('.animate-in, .transition-all, .shadow-xl').forEach(el => {
              (el as HTMLElement).style.boxShadow = 'none';
              (el as HTMLElement).style.animation = 'none';
              (el as HTMLElement).style.transition = 'none';
            });
          }
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: isLandscapeRecord ? 'landscape' : 'portrait',
          compress: true 
        },
        pagebreak: isWeeklyForecastRecord ? { mode: 'avoid-all' } : { mode: ['css', 'legacy'], avoid: ['tr', '.page-break-avoid'] }
      };

      // Use a pre-rendered hidden div instead for markdown accuracy
      const hiddenPreview = document.getElementById(`preview-${record.id}`);
      if (hiddenPreview) {
        let restoreStyles: (() => void) | null = null;
        try {
          restoreStyles = prepareDocumentForPdfExport();
          // Generate PDF using standard pattern
          const h2p = await loadHtml2Pdf();
          await new Promise(resolve => setTimeout(resolve, 500));
          const worker = h2p().from(hiddenPreview).set(opt);
          const pdfBlob = await worker.output('blob');
          if (pdfBlob && pdfBlob.size > 0) {
            await shareOrSavePdfBlob(pdfBlob, fileName, record.title);
          } else {
            await worker.save();
          }

          setDownloadSuccessId(record.id);
          
          // Tracking
          recordDownload({
            type: record.type,
            grade: record.grade,
            subject: record.subject,
            topic: record.topic,
            subtopic: record.subtopic,
            format: 'pdf'
          });

          setTimeout(() => setDownloadSuccessId(null), 3000);
        } catch (err: any) {
          console.error("PDF generation error in RecordOfWork:", err);
          alert("Failed to download PDF. Please try again.");
        } finally {
          if (restoreStyles) restoreStyles();
        }
      } else {
        throw new Error("Preview element not found");
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredDownloads = downloads.filter(d => {
    const searchLow = searchTerm.toLowerCase();
    
    // Check main fields
    const matchMain = (
      d.title.toLowerCase().includes(searchLow) ||
      d.subject.toLowerCase().includes(searchLow) ||
      d.type.toLowerCase().includes(searchLow)
    );

    // Check metadata fields
    const matchMetadata = d.metadata ? (
      (d.metadata.teacherName?.toLowerCase().includes(searchLow)) ||
      (d.metadata.school?.toLowerCase().includes(searchLow)) ||
      (d.metadata.district?.toLowerCase().includes(searchLow)) ||
      (d.metadata.zone?.toLowerCase().includes(searchLow))
    ) : false;

    // Backward compatibility: search within content for teacher/school names
    const matchContent = d.content.toLowerCase().includes(searchLow);

    return (activeTab === 'All' || d.type === activeTab) && (matchMain || matchMetadata || matchContent);
  });

  const groupedByDate: { [dateStr: string]: DownloadRecord[] } = {};
  filteredDownloads.forEach(d => {
    const dateObj = safeToDate(d.timestamp);
    if (!dateObj) return;
    const dateStr = dateObj.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
    groupedByDate[dateStr].push(d);
  });

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 md:px-6 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-slate-900 shadow-sm shrink-0"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-4">
             {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl border-2 border-emerald-100 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <HistoryIcon size={20} />
                </div>
              )}
              <div>
                <h2 className="text-4xl font-black tracking-tightest text-slate-900 uppercase leading-none">
                  RECENT DOCUMENTS
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                   Teaching: {user?.displayName || 'Teacher'}
                </p>
              </div>
          </div>
        </div>
        
        {downloads.length > 0 && (
          <button
            onClick={handleCleanupOldRecords}
            disabled={isCleaningUp}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-sm border-2",
              confirmCleanup 
                ? "bg-rose-600 text-white border-rose-600 shadow-rose-100" 
                : "bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-600"
            )}
          >
            {isCleaningUp ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : <Eraser size={16} />}
            {isCleaningUp ? 'DELETING...' : confirmCleanup ? 'CONFIRM CLEANUP (PRE-MAY 10)?' : 'CLEANUP OLD RECORDS'}
          </button>
        )}
      </div>

      {/* Information Center Fixed on top of General Information Block */}
      <InformationCenter 
        toolType="records_of_work" 
        toolTitle="Record of Work & Recent Documents"
        className="mb-8"
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 pt-4">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by topic, subject or document type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border-2 border-slate-900 rounded-[2rem] px-14 py-6 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Syncing Records...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-rose-500 bg-rose-50 rounded-[2rem] border-2 border-rose-100 border-dashed">
            <AlertCircle size={32} />
            <p className="text-sm font-black uppercase tracking-widest">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white text-rose-600 rounded-xl font-bold text-xs uppercase border border-rose-200"
            >
              Retry Sync
            </button>
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="bg-slate-50 rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <FileText className="text-slate-200" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">No Records Found</h3>
            <p className="text-slate-400 font-medium mt-2">
              {searchTerm ? "Try adjusting your search filters." : "Your download history will appear here once you generate and save documents."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(groupedByDate).map(([dateStr, records], groupIndex) => (
              <div key={dateStr} className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">
                  {dateStr}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                      className="group bg-white border-2 border-slate-900 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                      <div 
                        onClick={() => {
                          if (onPreviewDoc && record.content) {
                            onPreviewDoc(record.content, {
                              docId: record.id,
                              type: record.type,
                              subject: record.subject,
                              grade: record.grade,
                              topic: record.topic || record.title || '',
                              subtopic: record.subtopic || '',
                              school: record.metadata?.school || '',
                              teacherName: record.metadata?.teacherName || '',
                              district: record.metadata?.district || '',
                              zone: record.metadata?.zone || '',
                              term: record.metadata?.term || '',
                              year: record.metadata?.year || '',
                            });
                          }
                        }}
                        className="flex items-center gap-5 cursor-pointer hover:opacity-80 transition-all flex-1 min-w-0"
                        title="Click to view visual preview & full rich-text editor"
                      >
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <BookOpen size={28} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full">
                              {record.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                              {record.grade}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 truncate leading-tight uppercase group-hover:text-blue-600 transition-colors">
                            {record.title}
                          </h4>
                          <p className="text-sm font-bold text-slate-500 mt-0.5 italic">
                            {record.subject}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                        <div className="text-right">
                          <div className="flex items-center sm:justify-end gap-2 text-slate-400">
                            <Calendar size={12} />
                            <p className="text-xs font-black uppercase tracking-tight">
                              {(() => {
                                const d = safeToDate(record.timestamp);
                                return d ? d.toLocaleString([], { timeStyle: 'short' }) : 'Pending...';
                              })()}
                            </p>
                          </div>
                          <div className="flex items-center sm:justify-end gap-1 mt-1 text-emerald-500">
                            <CheckCircle2 size={12} />
                            <span className="text-xs font-black uppercase">Saved as {record.format || 'Doc'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onPreviewDoc && record.content) {
                                onPreviewDoc(record.content, {
                                  docId: record.id,
                                  type: record.type,
                                  subject: record.subject,
                                  grade: record.grade,
                                  topic: record.topic || record.title || '',
                                  subtopic: record.subtopic || '',
                                  school: record.metadata?.school || '',
                                  teacherName: record.metadata?.teacherName || '',
                                  district: record.metadata?.district || '',
                                  zone: record.metadata?.zone || '',
                                  term: record.metadata?.term || '',
                                  year: record.metadata?.year || '',
                                });
                              } else {
                                handleOpenEdit(record);
                              }
                            }}
                            className="p-4 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all active:scale-95"
                            title="Open Visual Preview & Full Editor"
                          >
                            <Edit2 size={20} />
                          </button>

                          <button
                            onClick={() => handleDownloadPDF(record)}
                            disabled={!record.content || generatingId === record.id}
                            className={cn(
                              "p-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg",
                              downloadSuccessId === record.id 
                                ? "bg-emerald-500 text-white shadow-emerald-100" 
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100",
                              generatingId === record.id && "cursor-wait"
                            )}
                            title="Redownload PDF"
                          >
                            {generatingId === record.id ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : downloadSuccessId === record.id ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <Download size={20} />
                            )}
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                              {generatingId === record.id ? 'Loading...' : downloadSuccessId === record.id ? 'READY!' : 'PDF'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDownloadWord(record)}
                            disabled={!record.content || generatingWordId === record.id}
                            className={cn(
                              "p-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg",
                              wordSuccessId === record.id 
                                ? "bg-emerald-500 text-white shadow-emerald-100" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100",
                              generatingWordId === record.id && "cursor-wait"
                            )}
                            title="Download Word (Editable)"
                          >
                            {generatingWordId === record.id ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : wordSuccessId === record.id ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <FileCode size={20} />
                            )}
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                              {generatingWordId === record.id ? 'Loading...' : wordSuccessId === record.id ? 'READY!' : 'WORD'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className={cn(
                              "p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2",
                              confirmDeleteId === record.id
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-100 px-6"
                                : "text-slate-300 hover:text-rose-600 hover:bg-rose-50",
                              deletingId === record.id && "text-rose-600 bg-rose-50"
                            )}
                            title={confirmDeleteId === record.id ? "Click again to confirm" : "Delete record"}
                          >
                            {deletingId === record.id ? (
                              <div className="w-5 h-5 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                            ) : confirmDeleteId === record.id ? (
                              <>
                                <AlertCircle size={20} />
                                <span className="text-sm font-black uppercase tracking-widest">CONFIRM?</span>
                              </>
                            ) : (
                              <Trash2 size={20} />
                            )}
                          </button>
                  </div>
                </div>

                <HiddenPDFPreview record={record} />
              </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] bg-slate-50 inline-block px-4 py-2 rounded-full">
          End of Activity Log
        </p>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRecord && user && (
          <EditModal 
            record={editingRecord} 
            userUid={user.uid}
            onClose={() => setEditingRecord(null)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .markdown-content-archive {
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
          color: #000;
          text-align: left;
        }
        .markdown-content-archive h1 {
          font-weight: 900 !important;
          text-transform: uppercase;
          text-align: center;
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content-archive h2, .markdown-content-archive h3 {
          font-weight: 900 !important;
          text-transform: uppercase;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          text-align: left;
        }
        .markdown-content-archive h2 { font-size: 1.6rem; }
        .markdown-content-archive h3 { font-size: 1.4rem; }
        .markdown-content-archive p {
          font-size: 13pt;
          margin-bottom: 0.5rem;
          text-align: left;
        }
        .markdown-content-archive table {
          width: 100% !important;
          border-collapse: collapse;
          border: 1.5px solid #000;
          margin-bottom: 1rem;
          table-layout: fixed;
        }
        .markdown-content-archive th, .markdown-content-archive td {
          border: 1px solid #000;
          padding: 6px !important;
          font-size: 13pt !important;
          text-align: left;
        }
        .markdown-content-archive th {
          background-color: #f1f5f9 !important;
          font-weight: 900 !important;
        }
      `}</style>
    </div>
  );
}

function HiddenPDFPreview({ record }: { record: DownloadRecord }) {
  const isLandscape = record.type === 'schemes_of_work' || record.type === 'weekly_forecast';
  const isWeeklyForecast = record.type === 'weekly_forecast';
  return (
    <div 
      id={`preview-${record.id}`} 
      className={cn(
        "absolute opacity-0 pointer-events-none -z-50 bg-white overflow-hidden",
        isWeeklyForecast ? "p-3" : "p-12",
        `doc-type-${record.type}`
      )}
      style={{ width: isLandscape ? '297mm' : '210mm', color: '#000', backgroundColor: '#fff', top: 0, left: 0 }} 
    >
      <div className="markdown-content-archive text-left">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{record.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function EditModal({ record, userUid, onClose }: { record: DownloadRecord, userUid: string, onClose: () => void }) {
  const content = record.content || '';
  
  // Extract current metadata via regex from markdown payload
  const schoolMatch = content.match(/##\s+([^\n]+)\n###\s*(SCHEMES OF WORK|WEEKLY FORECAST)/) || content.match(/^#\s+([^#\n]+)\n#\s*LESSON PLAN/m);
  const teacherMatch = content.match(/\*\*TEACHER\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>NAME OF TEACHER:<\/strong>\s*([^<]+)/);
  const tsMatch = content.match(/\*\*TS NUMBER\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>TS NO:<\/strong>\s*([^<]+)/);
  const termMatch = content.match(/\*\*TERM\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>TERM:<\/strong>\s*([^<]+)/);
  const yearMatch = content.match(/\*\*YEAR\*\*:\s*([^\n|*]+)/);
  const gradeMatch = content.match(/\*\*GRADE\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>CLASS:<\/strong>\s*([^<]+)/);
  const subjectMatch = content.match(/\*\*SUBJECT\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>SUBJECT:<\/strong>\s*([^<]+)/);
  const districtMatch = content.match(/\*\*DISTRICT\*\*:\s*([^|]+)\s+\|/) || content.match(/<strong>DISTRICT:<\/strong>\s*([^<]+)/);

  const [editForm, setEditForm] = useState({
    schoolName: schoolMatch ? schoolMatch[1].trim() : '',
    teacherName: teacherMatch ? teacherMatch[1].trim() : '',
    tsNumber: tsMatch ? tsMatch[1].trim() : '',
    term: termMatch ? termMatch[1].trim() : '',
    year: yearMatch ? yearMatch[1].trim() : '',
    grade: gradeMatch ? gradeMatch[1].trim() : '',
    subject: subjectMatch ? subjectMatch[1].trim() : '',
    district: districtMatch ? districtMatch[1].trim() : '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      let newContent = record.content;
      
      const safelyReplace = (regex: RegExp, replaceStr: string) => {
        newContent = newContent.replace(regex, replaceStr);
      };

      safelyReplace(/^#\s+[^#\n]+\n(#\s*LESSON PLAN)/gm, `# ${editForm.schoolName}\n$1`);
      safelyReplace(/##\s+[^\n]+\n(###\s*(?:SCHEMES OF WORK|WEEKLY FORECAST))/g, `## ${editForm.schoolName}\n$1`);

      safelyReplace(/\*\*TEACHER\*\*:\s*[^|]+\s*\|/g, `**TEACHER**: ${editForm.teacherName} |`);
      safelyReplace(/<strong>NAME OF TEACHER:<\/strong>\s*([^<]+)/g, `<strong>NAME OF TEACHER:</strong> ${editForm.teacherName}`);

      safelyReplace(/\*\*TS NUMBER\*\*:\s*[^|]+\s*\|/g, `**TS NUMBER**: ${editForm.tsNumber} |`);
      safelyReplace(/<strong>TS NO:<\/strong>\s*([^<]+)/g, `<strong>TS NO:</strong> ${editForm.tsNumber}`);

      safelyReplace(/\*\*TERM\*\*:\s*[^|]+\s*\|/g, `**TERM**: ${editForm.term} |`);
      safelyReplace(/<strong>TERM:<\/strong>\s*([^<]+)/g, `<strong>TERM:</strong> ${editForm.term}`);

      safelyReplace(/\*\*YEAR\*\*:\s*[^\n|*]+/g, `**YEAR**: ${editForm.year}`);
      
      safelyReplace(/\*\*GRADE\*\*:\s*[^|]+\s*\|/g, `**GRADE**: ${editForm.grade} |`);
      safelyReplace(/<strong>CLASS:<\/strong>\s*([^<]+)/g, `<strong>CLASS:</strong> ${editForm.grade}`);

      safelyReplace(/\*\*SUBJECT\*\*:\s*[^|]+\s*\|/g, `**SUBJECT**: ${editForm.subject} |`);
      safelyReplace(/<strong>SUBJECT:<\/strong>\s*([^<]+)/g, `<strong>SUBJECT:</strong> ${editForm.subject}`);

      safelyReplace(/\*\*DISTRICT\*\*:\s*[^|]+\s*\|/g, `**DISTRICT**: ${editForm.district} |`);
      safelyReplace(/<strong>DISTRICT:<\/strong>\s*([^<]+)/g, `<strong>DISTRICT:</strong> ${editForm.district}`);
      
      const docRef = doc(db, 'users', userUid, 'downloads', record.id);
      await updateDoc(docRef, { content: newContent });
      onClose();
    } catch (err) {
      console.error("Failed to update memory metadata:", err);
      alert("Failed to update header info.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full border-2 border-slate-900 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Details</h3>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{record.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">School Name</label>
            <input type="text" value={editForm.schoolName} onChange={e => setEditForm({...editForm, schoolName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Teacher Name</label>
            <input type="text" value={editForm.teacherName} onChange={e => setEditForm({...editForm, teacherName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Grade / Class</label>
              <input type="text" value={editForm.grade} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Subject</label>
              <input type="text" value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">TS Number</label>
              <input type="text" value={editForm.tsNumber} onChange={e => setEditForm({...editForm, tsNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Term</label>
              <input type="text" value={editForm.term} onChange={e => setEditForm({...editForm, term: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Year</label>
            <input type="text" value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">District</label>
            <input type="text" value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-black uppercase text-sm hover:bg-slate-50 transition-all active:scale-95"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
