import { safeLocalStorage } from "../lib/storage";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookMarked, 
  Plus, 
  Trash2, 
  FileText, 
  ChevronLeft,
  Search,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GRADES, OBC_GRADES, getSubjectsForGrade } from '../constants';
import { CurriculumStandardsViewer } from './CurriculumStandardsViewer';
import * as pdfjs from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  try {
    // Using unpkg as it strictly follows the npm package structure
    const PDFJS_VERSION = '5.7.284';
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.error("PDF worker init error:", e);
  }
}

interface Module {
  id: string;
  name: string;
  description: string;
  content: string;
  subject: string;
  grade: string;
  category?: string;
  createdAt: any;
}

interface ModuleManagerProps {
  onBack: () => void;
  initialTab?: 'standards' | 'modules';
}

export function ModuleManager({ onBack, initialTab = 'standards' }: ModuleManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'standards' | 'modules'>(initialTab);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newCategory, setNewCategory] = useState('General Education');
  const [uploading, setUploading] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'extracting' | 'scanning' | 'saving'>('idle');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{current: number, total: number} | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (user.uid === 'guest_teacher') {
      try {
        const stored = safeLocalStorage.getItem('eduplan_modules');
        const docs = stored ? JSON.parse(stored) : [];
        setModules(docs);
      } catch (e) {
        console.error("Failed to load local guest modules", e);
      }
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        setError("Connection timeout. Please check your internet or refresh the page.");
        setLoading(false);
      }
    }, 20000);

    const q = query(
      collection(db, 'users', user.uid, 'modules'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const docs: Module[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Module);
      });
      setModules(docs);
      setLoading(false);
      setError(null);
      clearTimeout(timeout);
    }, (err: any) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/modules`);
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [user?.uid]);

  const extractTextFromPDF = async (file: File) => {
    // Read the file data IMMEDIATELY before any state updates that might trigger re-renders
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (err) {
      console.error("Critical error reading file data:", err);
      alert("Error reading file access: The document may have been moved or is no longer accessible. Please try selecting it again.");
      return;
    }

    setUploading(true);
    setProcessingState('extracting');
    
    // TRY SERVER-SIDE EXTRACTION FIRST (Handles OCR and large files better on mobile)
    if (file.size < 20 * 1024 * 1024) { // 20MB limit for server
      try {
        console.log("Attempting server-side extraction/OCR...");
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            setNewContent(prev => prev + (prev ? '\n\n' : '') + data.text);
            if (!newName) setNewName(file.name.replace('.pdf', ''));
            setUploading(false);
            setProcessingState('idle');
            console.log("Server-side extraction successful.");
            return;
          }
        } else {
          console.warn("Server-side extraction returned non-ok status:", response.status);
        }
      } catch (err) {
        console.warn("Server-side extraction failed or timed out, falling back to client-side:", err);
      }
    }

    // FALLBACK TO CLIENT-SIDE (Existing logic)
    setProcessingState('scanning');
    setScanProgress({ current: 0, total: 0 });
    console.log("Starting client-side PDF scan for:", file.name);
    
    if (file.size > 50 * 1024 * 1024) {
      setUploading(false);
      alert("This PDF is too large (over 50MB). Please select a smaller file to prevent your browser from running out of memory.");
      return;
    }
    
    let pdf: any = null;
    try {
      // Ensure worker is set (redundancy check)
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        const PDFJS_VERSION = '5.7.284';
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
      }

      console.log("Loading document with worker:", pdfjs.GlobalWorkerOptions.workerSrc);
      
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        disableFontFace: true, 
        verbosity: 0
      });
      
      pdf = await loadingTask.promise;
      const textChunks: string[] = [];
      const totalPages = Math.min(pdf.numPages, 3000);
      
      if (pdf.numPages > 3000) {
        alert("To preserve device memory, only the first 3000 pages will be scanned.");
      }

      setScanProgress({ current: 0, total: totalPages });

      for (let i = 1; i <= totalPages; i++) {
        let page = null;
        try {
          page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          
          if (pageText) {
            textChunks.push(`--- Page ${i} ---\n${pageText}`);
          }
          
          setScanProgress({ current: i, total: totalPages });
          
          // Yield to main thread to prevent mobile browser crash
          // Increased delay for mobile stability
          await new Promise(resolve => setTimeout(resolve, 80));
        } catch (pageError) {
          console.warn(`Error scanning page ${i}:`, pageError);
        } finally {
          if (page) {
            try { page.cleanup(); } catch (e) {}
          }
        }
      }

      const fullText = textChunks.join('\n\n');
      
      // Cleanup PDF object
      try {
        if (pdf) {
          await pdf.destroy();
        }
      } catch (e) {
        console.warn("Error destroying PDF:", e);
      }
      
      if (fullText.length === 0) {
        throw new Error("No text found in PDF. This might be a scanned image (non-searchable) PDF.");
      }

      // Check for Firestore 1MB limit (approx 1M characters, but use 500k to be safe for utf-8)
      if (fullText.length > 500000) {
        alert("Warning: This document is very large. Only the first 500,000 characters will be saved due to storage limits.");
        setNewContent(prev => prev + (prev ? '\n\n' : '') + fullText.substring(0, 500000));
      } else {
        setNewContent(prev => prev + (prev ? '\n\n' : '') + fullText);
      }

      if (!newName) setNewName(file.name.replace('.pdf', ''));
      console.log("PDF scan completed successfully. Extracted", fullText.length, "characters.");
    } catch (error) {
      console.error("Error parsing PDF:", error);
      let errorMsg = "Could not extract text from this PDF.";
      
      if (error instanceof Error) {
        if (error.message.includes("worker")) {
          errorMsg = "PDF system failure: Could not load the required components from the CDN. Please check your internet connection or try disabling any Ad-blockers that might be blocking the PDF worker script.";
        } else if (error.message.includes("dynamic")) {
          errorMsg = "Browser compatibility error: Failed to load the PDF extraction module. Please try using a modern browser like Chrome or Edge.";
        } else {
          errorMsg = `Error parsing PDF: ${error.message}`;
        }
      }
      
      alert(errorMsg);
    } finally {
      if (pdf) {
        try { pdf.destroy(); } catch(e) {}
      }
      setUploading(false);
      setProcessingState('idle');
      setScanProgress(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName || !newContent) return;

    setUploading(true);
    setProcessingState('saving');

    if (user.uid === 'guest_teacher') {
      try {
        const storedStr = safeLocalStorage.getItem('eduplan_modules');
        let current: any[] = storedStr ? JSON.parse(storedStr) : [];
        
        if (editingModuleId) {
          current = current.map(m => m.id === editingModuleId ? {
            ...m,
            name: newName,
            description: newDesc,
            content: newContent,
            subject: newSubject,
            grade: newGrade,
            category: newCategory
          } : m);
        } else {
          const newDoc = {
            id: 'local_' + Date.now(),
            userId: user.uid,
            name: newName,
            description: newDesc,
            content: newContent,
            subject: newSubject,
            grade: newGrade,
            category: newCategory,
            createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } // Standard Firestore structure
          };
          current.unshift(newDoc);
        }
        safeLocalStorage.setItem('eduplan_modules', JSON.stringify(current));
        setModules(current);
        closeUpload();
      } catch (err) {
        console.error("Local save failed", err);
      } finally {
        setUploading(false);
      }
      return;
    }

    try {
      if (editingModuleId) {
        await updateDoc(doc(db, 'users', user.uid, 'modules', editingModuleId), {
          name: newName,
          description: newDesc,
          content: newContent,
          subject: newSubject,
          grade: newGrade,
          category: newCategory
        });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'modules'), {
          userId: user.uid,
          name: newName,
          description: newDesc,
          content: newContent,
          subject: newSubject,
          grade: newGrade,
          category: newCategory,
          createdAt: serverTimestamp()
        });
      }

      closeUpload();
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Failed to save module: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploading(false);
      setProcessingState('idle');
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModuleId(module.id);
    setNewName(module.name);
    setNewDesc(module.description || '');
    setNewContent(module.content);
    setNewSubject(module.subject || '');
    setNewGrade(module.grade || '');
    setNewCategory(module.category || 'General Education');
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setEditingModuleId(null);
    setNewName('');
    setNewDesc('');
    setNewContent('');
    setNewSubject('');
    setNewGrade('');
    setNewCategory('General Education');
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    if (user.uid === 'guest_teacher') {
      try {
        const storedStr = safeLocalStorage.getItem('eduplan_modules');
        let current: any[] = storedStr ? JSON.parse(storedStr) : [];
        current = current.filter(m => m.id !== id);
        safeLocalStorage.setItem('eduplan_modules', JSON.stringify(current));
        setModules(current);
        setModuleToDelete(null);
      } catch (err) {
        console.error("Local delete failed", err);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'modules', id));
      setModuleToDelete(null);
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  const filteredModules = modules.filter(m => {
    const group = getGradeGroup(m);
    if (!group) return false; 

    const searchLower = searchTerm.toLowerCase();
    const groupLower = group.toLowerCase();
    
    // If searchTerm matches a group name exactly, only show that group
    const possibleLevels = ['ece', 'sen (special needs)', 'lower primary', 'upper primary', 'junior secondary', 'senior secondary', 'form 1-4', 'uncategorized'];
    const isLevelMatch = possibleLevels.includes(searchLower);
    
    if (isLevelMatch) {
      return groupLower === searchLower;
    }

    return (
      m.name.toLowerCase().includes(searchLower) ||
      (m.subject || '').toLowerCase().includes(searchLower) ||
      (m.description || '').toLowerCase().includes(searchLower) ||
      (m.category || '').toLowerCase().includes(searchLower) ||
      (m.grade || '').toLowerCase().includes(searchLower)
    );
  });

  function getGradeGroup(module: Module) {
    const g = (module.grade || '').trim().toLowerCase();
    const c = (module.category || '').trim().toUpperCase();

    if (c === 'SPECIAL EDUCATION NEEDS' || c === 'SEN') return 'SEN (SPECIAL NEEDS)';
    if (g.includes('(obc)') || g.includes('obc syllabi')) return 'OBC';

    if (!g) return 'UNCATEGORIZED';
    if (g.includes('ece') || g.includes('early') || g.includes('nursery') || g.includes('pre') || g.includes('reception')) return 'ECE';
    if (/(form\s*[1-4]|f\s*[1-4]|form\s*1-4)/i.test(g) || g.includes('form 1-4')) return 'FORM 1-4';
    if (/(grade\s*[1-3]|g\s*[1-3]|lower|\b[1-3]\b)/.test(g)) return 'LOWER PRIMARY';
    if (/(grade\s*[4-7]|g\s*[4-7]|upper|\b[4-7]\b)/.test(g)) return 'UPPER PRIMARY';
    if (/(grade\s*[8-9]|g\s*[8-9]|junior|\b[8-9]\b)/.test(g)) return 'JUNIOR SECONDARY';
    if (/(grade\s*(10|11|12)|g\s*(10|11|12)|senior|\b(10|11|12)\b)/.test(g)) return 'SENIOR SECONDARY';
    return 'UNCATEGORIZED';
  }

  const groupedModules = filteredModules.reduce((acc, module) => {
    const group = getGradeGroup(module);
    if (!acc[group]) acc[group] = [];
    acc[group].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const groupOrder = [
    'OBC',
    'SEN (SPECIAL NEEDS)',
    'ECE',
    'LOWER PRIMARY',
    'UPPER PRIMARY',
    'JUNIOR SECONDARY',
    'SENIOR SECONDARY',
    'FORM 1-4',
    'UNCATEGORIZED'
  ].filter(group => groupedModules[group] && groupedModules[group].length > 0);


  return (
    <div className="absolute inset-0 overflow-y-auto animate-in fade-in duration-700 bg-slate-50/50">
      <div className="max-w-5xl mx-auto py-12 px-4 min-h-screen pb-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-3 bg-white border-2 border-slate-900 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-slate-900 shadow-sm"
              title="Return to Dashboard"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-4xl font-black tracking-tightest text-slate-900 uppercase leading-none">
                KNOWLEDGE BASE
              </h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                <BookMarked size={14} />
                Zambian Syllabus Standards & Teaching Modules
              </p>
            </div>
          </div>
          
          {activeTab === 'modules' && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Plus size={20} />
              Add New Module
            </button>
          )}
        </div>

        {/* Tab 1: Subject Curriculum Standards */}
        {activeTab === 'standards' && (
          <CurriculumStandardsViewer />
        )}

        {/* Tab 2: Custom Modules */}
        {activeTab === 'modules' && (
          <>
            {/* Private Cloud Storage Info Banner */}
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">Private Cloud Storage</h4>
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Up to 50 personal modules and uploaded documents are backed up securely in your account for continuous referencing.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
                {modules.length} / 50 Uploaded
              </span>
            </div>

            {/* Search Bar & Level Filters */}
            <div className="flex flex-col gap-6 mb-12">
              <div className="relative group max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by name, subject or grade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-slate-900 rounded-[2rem] px-14 py-6 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {['ALL', 'OBC', 'SEN (SPECIAL NEEDS)', 'ECE', 'LOWER PRIMARY', 'UPPER PRIMARY', 'JUNIOR SECONDARY', 'SENIOR SECONDARY', 'FORM 1-4', 'UNCATEGORIZED']
                  .filter(level => {
                    if (['ALL', 'OBC', 'SEN (SPECIAL NEEDS)', 'ECE', 'LOWER PRIMARY', 'UPPER PRIMARY', 'FORM 1-4'].includes(level)) return true;
                    const count = modules.filter(m => getGradeGroup(m) === level).length;
                    return count > 0;
                  })
                  .map((level) => {
                  const count = level === 'ALL' 
                    ? modules.length 
                    : modules.filter(m => getGradeGroup(m) === level).length;
                  
                  return (
                    <button
                      key={level}
                      onClick={() => {
                        if (level === 'ALL') setSearchTerm('');
                        else setSearchTerm(level);
                      }}
                      className={cn(
                        "px-5 py-2 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                        (searchTerm.toUpperCase() === level || (level === 'ALL' && searchTerm === ''))
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                      )}
                    >
                      {level}
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px]",
                        (searchTerm.toUpperCase() === level || (level === 'ALL' && searchTerm === ''))
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-16 min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Knowledge Base...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 text-rose-500">
                  <AlertCircle size={48} />
                  <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="bg-slate-50 rounded-[4rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-md border border-slate-100">
                    <BookMarked className="text-slate-200" size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Your library is empty</h3>
                  <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto">
                    Upload your teaching modules, textbook excerpts, or guide notes to help the AI generate more accurate content.
                  </p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-8 px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all rounded-2xl"
                  >
                    Start Uploading
                  </button>
                </div>
              ) : (
                groupOrder.map(groupName => {
                  const modulesInGroup = groupedModules[groupName];
                  if (!modulesInGroup || modulesInGroup.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap bg-slate-50/50 px-4 py-1 rounded-full border border-slate-100">
                          {groupName}
                        </h3>
                        <div className="h-px flex-1 bg-slate-200"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modulesInGroup.map((module, index) => (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-white border-2 border-slate-900 rounded-[2.5rem] p-8 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-4 flex gap-2 transition-opacity z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(module);
                                }}
                                className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                title="Edit Module"
                              >
                                <Edit2 size={16} />
                              </button>
                              {moduleToDelete === module.id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(module.id);
                                  }}
                                  className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-xs shadow-sm"
                                >
                                  Confirm
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModuleToDelete(module.id);
                                    setTimeout(() => setModuleToDelete(null), 3000);
                                  }}
                                  className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                  title="Delete Module"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(module.content);
                                  alert("Content copied to clipboard!");
                                }}
                                className="p-3 bg-emerald-50 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Copy Content"
                              >
                                <FileText size={16} />
                              </button>
                            </div>

                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                              <FileText size={28} />
                            </div>

                            <div className="space-y-1 mb-6">
                              <div className="flex flex-wrap items-center gap-2">
                                {module.category === 'Special Education Needs' && (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    SEN
                                  </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">
                                  {module.subject || 'General'}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {module.grade}
                                </span>
                              </div>
                              <h4 className="text-xl font-black text-slate-900 leading-tight uppercase line-clamp-2 pt-2">
                                {module.name}
                              </h4>
                            </div>

                            <p className="text-sm font-medium text-slate-500 italic mb-8 grow line-clamp-4">
                              {module.description || 'No description provided.'}
                            </p>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                Context Ready
                              </div>
                              <p className="text-[10px] font-black text-slate-300">
                                {module.content?.length || 0} characters
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!uploading) closeUpload(); }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl z-[110] max-h-[90vh] flex flex-col"
            >
              <form onSubmit={handleUpload} className="p-10 space-y-8 overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{editingModuleId ? 'Edit Module' : 'Upload Module'}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">Add reference content to improve AI accuracy.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={closeUpload}
                    className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Module Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Grade 4 English Teacher Guide"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Grade Level</label>
                    <select
                      value={newGrade}
                      onChange={(e) => {
                        setNewGrade(e.target.value);
                        setNewSubject('');
                      }}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all"
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="Universal">Universal (All Grades)</option>
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option disabled>──────────</option>
                      {OBC_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Subject</label>
                    <input
                      type="text"
                      list="subject-options"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Select or type subject"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all"
                      required
                    />
                    <datalist id="subject-options">
                      <option value="Universal">Universal (All Subjects)</option>
                      {getSubjectsForGrade(newGrade).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Categorization (Important for SEN)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewCategory('General Education')}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 transition-all",
                          newCategory === 'General Education' 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-50 text-slate-500 border-slate-50 hover:border-slate-200"
                        )}
                      >
                        General Education
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCategory('Special Education Needs')}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 transition-all",
                          newCategory === 'Special Education Needs' 
                            ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100" 
                            : "bg-slate-50 text-slate-500 border-slate-50 hover:border-rose-200 hover:text-rose-600"
                        )}
                      >
                        SEN (Special Needs)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Brief Description</label>
                    <input 
                      type="text" 
                      placeholder="Short summary of this content..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3 col-span-2">
                    <div className="flex justify-between items-center ml-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content / Text Content</label>
                      <div className="flex gap-2">
                        <label className="cursor-pointer hover:text-blue-600 transition-colors">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) extractTextFromPDF(file);
                            }}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg flex items-center gap-2">
                            <Upload size={12} /> Scan PDF Book
                          </span>
                        </label>
                        <label className="cursor-pointer hover:text-blue-600 transition-colors">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".txt,.md"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert("Text file is too large. Please keep it under 5MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (res) => {
                                  if (res.target?.result) {
                                    setNewContent(res.target.result as string);
                                  }
                                };
                                reader.onerror = () => {
                                  alert("Failed to read the file. Please try again.");
                                };
                                reader.readAsText(file);
                                if (!newName) setNewName(file.name.replace(/\.[^/.]+$/, ""));
                              }
                            }}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-lg">Import .txt</span>
                        </label>
                      </div>
                    </div>
                    
                    {processingState === 'extracting' ? (
                      <div className="w-full bg-slate-50 rounded-[2rem] p-8 flex flex-col items-center justify-center border-2 border-blue-100 border-dashed animate-pulse">
                        <div className="w-12 h-12 mb-4 text-blue-600">
                          <Upload size={48} className="animate-bounce" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-blue-600">AI is reading your document...</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">This handles complex text and tables. Please wait.</p>
                      </div>
                    ) : scanProgress ? (
                      <div className="w-full bg-slate-50 rounded-[2rem] p-8 flex flex-col items-center justify-center border-2 border-blue-100 border-dashed animate-pulse">
                        <div className="w-12 h-12 mb-4 text-blue-600">
                          <BookMarked size={48} className="animate-bounce" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-blue-600">Scanning Page {scanProgress.current} of {scanProgress.total || 1}</p>
                        <div className="w-full max-w-xs bg-blue-100 h-2 rounded-full mt-4 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-300" 
                            style={{ width: `${(scanProgress.current / Math.max(scanProgress.total, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <textarea 
                        required
                        placeholder="Paste your teaching module content or use the 'Scan PDF' button to extract text from a book. This will be used as a 'Source of Truth' for generation."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-[2rem] px-8 py-6 font-medium text-slate-900 outline-none transition-all min-h-[200px] resize-none"
                      />
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading || !!scanProgress}
                  className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {processingState === 'scanning' ? 'Scanning PDF...' : 
                       processingState === 'extracting' ? 'AI Reading Document...' :
                       'Saving to Library...'}
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Save to Knowledge Base
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

