import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  Camera, 
  Sparkles, 
  HelpCircle, 
  Filter, 
  Edit3, 
  Check, 
  RotateCcw,
  Users,
  FileSpreadsheet,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface SubjectColumn {
  id: string;
  name: string;
  outOf?: number;
}

export interface ParsedLearnerMark {
  subjectId: string;
  subjectName: string;
  maxScore: number;
  value: string;
  isMissing: boolean;
  isInvalid: boolean;
  isAbsent: boolean;
  error?: string;
}

export interface ParsedLearnerRow {
  id: string;
  originalLineNumber: number;
  originalText: string;
  name: string;
  rawGenderToken: string;
  detectedGender: 'M' | 'F';
  isGenderInvalid: boolean;
  isGenderDefaulted: boolean;
  genderError?: string;
  marks: ParsedLearnerMark[];
  hasErrors: boolean;
  hasWarnings: boolean;
  errorMessages: string[];
}

interface BulkPasteValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsedRows: ParsedLearnerRow[]) => void;
  subjects: SubjectColumn[];
  bulkTargetGender: 'M' | 'F';
  setBulkTargetGender: (g: 'M' | 'F') => void;
  bulkText: string;
  setBulkText: (text: string) => void;
  onOpenScanner: () => void;
  grade: string;
  term: string;
}

export function BulkPasteValidationModal({
  isOpen,
  onClose,
  onApply,
  subjects,
  bulkTargetGender,
  setBulkTargetGender,
  bulkText,
  setBulkText,
  onOpenScanner,
  grade,
  term
}: BulkPasteValidationModalProps) {
  const [activeView, setActiveView] = useState<'split' | 'table' | 'text'>('split');
  const [filterMode, setFilterMode] = useState<'all' | 'issues' | 'boys' | 'girls'>('all');
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: 'name' | 'gender' | string } | null>(null);
  const [editedRowsOverride, setEditedRowsOverride] = useState<Record<string, { name?: string; gender?: 'M' | 'F'; marks?: Record<string, string> }>>({});

  // Reset local row overrides whenever bulk text changes drastically from outside
  useEffect(() => {
    setEditedRowsOverride({});
  }, [isOpen]);

  // Real-time Parser and Validation Engine
  const parsedData = useMemo(() => {
    if (!bulkText.trim()) {
      return {
        rows: [] as ParsedLearnerRow[],
        totalRows: 0,
        boysCount: 0,
        girlsCount: 0,
        totalErrors: 0,
        invalidGenderCount: 0,
        missingMarksCount: 0,
        invalidMarksCount: 0,
        hasAnyErrors: false
      };
    }

    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedRows: ParsedLearnerRow[] = [];

    let totalErrors = 0;
    let invalidGenderCount = 0;
    let missingMarksCount = 0;
    let invalidMarksCount = 0;
    let boysCount = 0;
    let girlsCount = 0;

    lines.forEach((line, lineIdx) => {
      // 1. Strip leading serial numbers (e.g. "1.", "1)", "01", "#1")
      let cleanLine = line.replace(/^(?:S\/N|SN|No|#)?\s*\d+[\.\)\-\:\s\t]+\s*/i, '').trim();
      if (!cleanLine) {
        cleanLine = line.replace(/^[0-9]+\s+/, '').trim();
      }
      if (!cleanLine) return;

      // 2. Tokenize by delimiter
      const rawParts = cleanLine.split(/[,;\t|]+/).map(p => p.trim()).filter(Boolean);

      // Discard standalone leading index if present
      if (rawParts.length > 1 && /^\d+$/.test(rawParts[0]) && /[a-zA-Z]/.test(rawParts[1])) {
        rawParts.shift();
      }

      let detectedGender: 'M' | 'F' | null = null;
      let rawGenderToken = '';
      let isGenderInvalid = false;
      let isGenderDefaulted = false;
      let genderError: string | undefined;

      let learnerName = '';
      const rawMarkTokens: string[] = [];

      const invalidGenderPatterns = /^(X|UNKNOWN|OTHER|N\/A|\?|NONE|FM|MM|T|O|NA|NOT\s*SPECIFIED|UNDEFINED|NULL)$/i;
      const validFemalePatterns = /^(F|Female|Girl|Girls|G|\(F\)|\(Female\)|\(Girl\)|\[F\])$/i;
      const validMalePatterns = /^(M|Male|Boy|Boys|B|\(M\)|\(Male\)|\(Boy\)|\[M\])$/i;

      if (rawParts.length > 1) {
        // Multi-part (CSV / Tab-delimited)
        const nameParts: string[] = [];
        rawParts.forEach((p) => {
          const isFemale = validFemalePatterns.test(p);
          const isMale = validMalePatterns.test(p);
          const isInvalidGender = invalidGenderPatterns.test(p);
          const isMarkToken = /^[0-9]+(\.[0-9]+)?$/i.test(p) || /^(A|ABS|absent|-)$/i.test(p);

          if (isFemale) {
            detectedGender = 'F';
            rawGenderToken = p;
          } else if (isMale) {
            detectedGender = 'M';
            rawGenderToken = p;
          } else if (isInvalidGender) {
            rawGenderToken = p;
            isGenderInvalid = true;
            genderError = `Invalid gender "${p}". Expected M (Boy) or F (Girl).`;
          } else if (isMarkToken) {
            rawMarkTokens.push(p);
          } else {
            // Check if part explicitly says gender e.g. "Gender: M"
            const genderLabelMatch = p.match(/^gender\s*[:=]\s*(.+)$/i);
            if (genderLabelMatch) {
              const gVal = genderLabelMatch[1].trim();
              if (validFemalePatterns.test(gVal)) {
                detectedGender = 'F';
                rawGenderToken = gVal;
              } else if (validMalePatterns.test(gVal)) {
                detectedGender = 'M';
                rawGenderToken = gVal;
              } else {
                rawGenderToken = gVal;
                isGenderInvalid = true;
                genderError = `Invalid gender "${gVal}". Expected M or F.`;
              }
            } else {
              nameParts.push(p);
            }
          }
        });
        learnerName = nameParts.join(' ').trim();
      } else {
        // Single space-delimited string
        const words = cleanLine.split(/\s+/);
        const nameWords: string[] = [];
        words.forEach((w) => {
          const isFemale = validFemalePatterns.test(w);
          const isMale = validMalePatterns.test(w);
          const isInvalidGender = invalidGenderPatterns.test(w);
          const isMarkToken = /^[0-9]+(\.[0-9]+)?$/i.test(w) || /^(A|ABS|absent|-)$/i.test(w);

          if (isFemale) {
            detectedGender = 'F';
            rawGenderToken = w;
          } else if (isMale) {
            detectedGender = 'M';
            rawGenderToken = w;
          } else if (isInvalidGender) {
            rawGenderToken = w;
            isGenderInvalid = true;
            genderError = `Invalid gender "${w}". Expected M or F.`;
          } else if (isMarkToken) {
            rawMarkTokens.push(w);
          } else {
            nameWords.push(w);
          }
        });
        learnerName = nameWords.join(' ').trim();
      }

      if (!learnerName) {
        learnerName = `Learner ${lineIdx + 1}`;
      }

      // Gender Fallback handling
      if (!detectedGender && !isGenderInvalid) {
        detectedGender = bulkTargetGender;
        isGenderDefaulted = true;
        rawGenderToken = `${bulkTargetGender} (Default)`;
      } else if (isGenderInvalid) {
        detectedGender = bulkTargetGender; // fallback for routing
      }

      const rowId = `row-${lineIdx}-${learnerName.replace(/\s+/g, '_')}`;

      // Check any local in-modal overrides
      const override = editedRowsOverride[rowId];
      if (override) {
        if (override.name) learnerName = override.name;
        if (override.gender) {
          detectedGender = override.gender;
          isGenderInvalid = false;
          genderError = undefined;
          rawGenderToken = override.gender;
        }
      }

      if (detectedGender === 'M') boysCount++;
      if (detectedGender === 'F') girlsCount++;

      // 3. Marks Validation for each active subject
      const rowErrors: string[] = [];
      if (isGenderInvalid) {
        totalErrors++;
        invalidGenderCount++;
        rowErrors.push(genderError || 'Invalid gender format');
      }

      const parsedMarks: ParsedLearnerMark[] = subjects.map((sub, sIdx) => {
        const maxScore = sub.outOf || 25;
        let token = rawMarkTokens[sIdx];

        // Check if overridden locally
        if (override?.marks && override.marks[sub.id] !== undefined) {
          token = override.marks[sub.id];
        }

        let isMissing = false;
        let isInvalid = false;
        let isAbsent = false;
        let markError: string | undefined;
        let val = '';

        if (token === undefined || token === null || token.trim() === '') {
          isMissing = true;
          totalErrors++;
          missingMarksCount++;
          markError = `Missing mark for ${sub.name}`;
          rowErrors.push(markError);
        } else {
          val = token.trim();
          const upperVal = val.toUpperCase();
          if (upperVal === 'A' || upperVal === 'ABS' || upperVal === 'ABSENT' || val === '-') {
            isAbsent = true;
            val = 'ABS';
          } else {
            const num = parseFloat(val);
            if (isNaN(num)) {
              isInvalid = true;
              totalErrors++;
              invalidMarksCount++;
              markError = `Invalid non-numeric score "${val}" in ${sub.name}`;
              rowErrors.push(markError);
            } else if (num < 0) {
              isInvalid = true;
              totalErrors++;
              invalidMarksCount++;
              markError = `Score cannot be negative (${num}) in ${sub.name}`;
              rowErrors.push(markError);
            } else if (num > maxScore) {
              isInvalid = true;
              totalErrors++;
              invalidMarksCount++;
              markError = `Score (${num}) exceeds maximum of ${maxScore} in ${sub.name}`;
              rowErrors.push(markError);
            }
          }
        }

        return {
          subjectId: sub.id,
          subjectName: sub.name,
          maxScore,
          value: val,
          isMissing,
          isInvalid,
          isAbsent,
          error: markError
        };
      });

      const hasRowErrors = isGenderInvalid || parsedMarks.some(m => m.isMissing || m.isInvalid);

      parsedRows.push({
        id: rowId,
        originalLineNumber: lineIdx + 1,
        originalText: line,
        name: learnerName,
        rawGenderToken,
        detectedGender: detectedGender || bulkTargetGender,
        isGenderInvalid,
        isGenderDefaulted,
        genderError,
        marks: parsedMarks,
        hasErrors: hasRowErrors,
        hasWarnings: isGenderDefaulted,
        errorMessages: rowErrors
      });
    });

    return {
      rows: parsedRows,
      totalRows: parsedRows.length,
      boysCount,
      girlsCount,
      totalErrors,
      invalidGenderCount,
      missingMarksCount,
      invalidMarksCount,
      hasAnyErrors: totalErrors > 0
    };
  }, [bulkText, subjects, bulkTargetGender, editedRowsOverride]);

  // Filtered rows for the live overlay table
  const displayedRows = useMemo(() => {
    if (filterMode === 'issues') {
      return parsedData.rows.filter(r => r.hasErrors);
    }
    if (filterMode === 'boys') {
      return parsedData.rows.filter(r => r.detectedGender === 'M');
    }
    if (filterMode === 'girls') {
      return parsedData.rows.filter(r => r.detectedGender === 'F');
    }
    return parsedData.rows;
  }, [parsedData.rows, filterMode]);

  // Quick fix: Fill all missing marks with ABS or 0
  const handleQuickFixMissingMarks = (fixValue: 'ABS' | '0') => {
    const updatedOverrides = { ...editedRowsOverride };

    parsedData.rows.forEach(row => {
      row.marks.forEach(m => {
        if (m.isMissing) {
          if (!updatedOverrides[row.id]) {
            updatedOverrides[row.id] = { marks: {} };
          }
          if (!updatedOverrides[row.id].marks) {
            updatedOverrides[row.id].marks = {};
          }
          updatedOverrides[row.id].marks![m.subjectId] = fixValue;
        }
      });
    });

    setEditedRowsOverride(updatedOverrides);
    toast.success(`Filled missing marks with "${fixValue}"!`);
  };

  // Quick fix: Correct all invalid genders to fallback
  const handleQuickFixInvalidGenders = (targetG: 'M' | 'F') => {
    const updatedOverrides = { ...editedRowsOverride };

    parsedData.rows.forEach(row => {
      if (row.isGenderInvalid) {
        if (!updatedOverrides[row.id]) {
          updatedOverrides[row.id] = {};
        }
        updatedOverrides[row.id].gender = targetG;
      }
    });

    setEditedRowsOverride(updatedOverrides);
    toast.success(`Corrected invalid genders to "${targetG === 'M' ? 'Boy (M)' : 'Girl (F)'}"!`);
  };

  // Cell change handler
  const handleUpdateMarkCell = (rowId: string, subjectId: string, value: string) => {
    setEditedRowsOverride(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        marks: {
          ...(prev[rowId]?.marks || {}),
          [subjectId]: value
        }
      }
    }));
  };

  const handleUpdateGenderCell = (rowId: string, newGender: 'M' | 'F') => {
    setEditedRowsOverride(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        gender: newGender
      }
    }));
  };

  const handleApply = () => {
    if (parsedData.rows.length === 0) {
      toast.error('Please paste or type at least one learner record.');
      return;
    }

    if (parsedData.hasAnyErrors) {
      const confirmProceed = window.confirm(
        `Warning: There are ${parsedData.totalErrors} item(s) with missing marks or invalid entries highlighted in red.\n\nDo you want to apply these records to the assessment table anyway? (You can complete missing marks in the table before saving)`
      );
      if (!confirmProceed) {
        setFilterMode('issues');
        return;
      }
    }

    onApply(parsedData.rows);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-400/30">
              <FileSpreadsheet size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight uppercase text-white">
                  Bulk Paste & Real-Time Data Validation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  Live OCR & Format Guard
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Auto-detects names, gender (M/F) & marks with real-time error highlighting in red
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-bold cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* View Mode and Cohort Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Fallback Cohort Sheet Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              Default Fallback Gender:
            </span>
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setBulkTargetGender('M')}
                className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all ${
                  bulkTargetGender === 'M'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Boys (M)
              </button>
              <button
                type="button"
                onClick={() => setBulkTargetGender('F')}
                className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all ${
                  bulkTargetGender === 'F'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Girls (F)
              </button>
            </div>
          </div>

          {/* Layout View Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('split')}
              className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all ${
                activeView === 'split'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all ${
                activeView === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Validation Table Only
            </button>
            <button
              type="button"
              onClick={() => setActiveView('text')}
              className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all ${
                activeView === 'text'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Text Editor Only
            </button>
          </div>
        </div>

        {/* REAL-TIME VALIDATION STATUS BANNER */}
        <div className="px-4 pt-3">
          {parsedData.totalRows > 0 ? (
            parsedData.hasAnyErrors ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-wrap items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-rose-100 text-rose-600 rounded-xl mt-0.5 shrink-0">
                    <AlertTriangle size={18} className="text-rose-600 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight text-rose-900 flex items-center gap-2">
                      <span>Real-Time Validation Alert: {parsedData.totalErrors} Issue(s) Detected</span>
                      <span className="px-2 py-0.2 rounded-md bg-rose-200 text-rose-900 text-[10px] font-black">
                        Highlighted in Red
                      </span>
                    </h4>
                    <p className="text-xs text-rose-800 font-medium">
                      {parsedData.invalidGenderCount > 0 && `${parsedData.invalidGenderCount} invalid gender code(s). `}
                      {parsedData.missingMarksCount > 0 && `${parsedData.missingMarksCount} missing mark(s). `}
                      {parsedData.invalidMarksCount > 0 && `${parsedData.invalidMarksCount} out-of-range mark(s). `}
                      Please review the highlighted cells or use quick-fixes below before saving.
                    </p>
                  </div>
                </div>

                {/* Quick Fix Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {parsedData.missingMarksCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickFixMissingMarks('ABS')}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] uppercase shadow-xs transition-all cursor-pointer"
                        title="Fill all missing marks as Absent (ABS)"
                      >
                        Fill Missing as ABS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFixMissingMarks('0')}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[11px] uppercase shadow-xs transition-all cursor-pointer"
                        title="Fill all missing marks with 0"
                      >
                        Fill Missing with 0
                      </button>
                    </>
                  )}
                  {parsedData.invalidGenderCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickFixInvalidGenders(bulkTargetGender)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase shadow-xs transition-all cursor-pointer"
                    >
                      Fix Gender to {bulkTargetGender}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight text-emerald-900">
                      Real-Time Validation Passed!
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      All {parsedData.totalRows} pupil records ({parsedData.boysCount} Boys, {parsedData.girlsCount} Girls) have valid names, gender codes, and score allocations.
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase">
                  Ready to Apply
                </div>
              </motion.div>
            )
          ) : null}
        </div>

        {/* Main Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* LAYOUT: SPLIT OR TEXT OR TABLE */}
          <div className={`grid gap-4 ${activeView === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
            
            {/* TEXTAREA INPUT (Col 1-5 in split mode) */}
            {(activeView === 'split' || activeView === 'text') && (
              <div className={`space-y-2 ${activeView === 'split' ? 'lg:col-span-4' : 'w-full'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                    <Edit3 size={14} className="text-blue-600" />
                    <span>Raw Input Text</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkText(
                        `1. John Phiri, M, 18, 15, 20, 14, 16, 22, 19, 17\n2. Grace Banda, F, 22, 24, 19, 21, 20, 25, 23, 22\n3. Mwape Chanda, Female, 16, 18, 14, 19, 17, 20, 18, 16\n4. Peter Kabwe, X, 15, 12, 18, 14\n5. Mutale Mary, Girl, 20, ABS, 19, 21, 22, 24, 20, 23`
                      );
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Load Sample with Warnings
                  </button>
                </div>

                <textarea
                  rows={activeView === 'split' ? 14 : 10}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={`Paste from Excel / Word / WhatsApp:\nJohn Phiri, M, 18, 15, 20, 14, 16, 22, 19, 17\nGrace Banda, F, 22, 24, 19, 21, 20, 25, 23, 22\nMutale Jane, Girl, 20, 18, 19, 21, 22, 24, 20, 23`}
                  className="w-full border border-slate-300 focus:border-blue-500 rounded-2xl p-3 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
                />

                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <Info size={12} />
                    <span>Formatting Tips:</span>
                  </div>
                  <p>• Comma, Tab, or Space separated values supported.</p>
                  <p>• Gender format: <code className="text-blue-700 font-bold">M / F</code>, <code className="text-blue-700 font-bold">Boy / Girl</code>, <code className="text-blue-700 font-bold">Male / Female</code>.</p>
                  <p>• Marks: Numerical (e.g. 18) or <code className="text-amber-700 font-bold">ABS</code> for absent.</p>
                </div>
              </div>
            )}

            {/* REAL-TIME VALIDATION OVERLAY TABLE (Col 6-12 in split mode) */}
            {(activeView === 'split' || activeView === 'table') && (
              <div className={`space-y-2 ${activeView === 'split' ? 'lg:col-span-8' : 'w-full'}`}>
                {/* Table Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      Live Parsed Validation Table:
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      ({displayedRows.length} of {parsedData.totalRows} pupils)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-black">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      All ({parsedData.totalRows})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('issues')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        filterMode === 'issues'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : parsedData.totalErrors > 0
                          ? 'text-rose-600 font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      <span>Issues Only</span>
                      {parsedData.totalErrors > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                          {parsedData.totalErrors}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('boys')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'boys' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Boys ({parsedData.boysCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('girls')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        filterMode === 'girls' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Girls ({parsedData.girlsCount})
                    </button>
                  </div>
                </div>

                {/* Validation Table Wrapper */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[11px] uppercase tracking-wider font-black">
                        <tr>
                          <th className="p-2 border-r border-slate-700 text-center w-10">#</th>
                          <th className="p-2 border-r border-slate-700 min-w-[140px]">Learner Name</th>
                          <th className="p-2 border-r border-slate-700 text-center min-w-[90px]">Gender</th>
                          {subjects.map(sub => (
                            <th key={sub.id} className="p-2 border-r border-slate-700 text-center min-w-[70px]">
                              <div className="truncate max-w-[80px]" title={sub.name}>{sub.name}</div>
                              <div className="text-[9px] text-slate-400 font-normal">/{sub.outOf || 25}</div>
                            </th>
                          ))}
                          <th className="p-2 text-center min-w-[120px]">Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={subjects.length + 4} className="p-8 text-center text-slate-400 font-medium">
                              {parsedData.totalRows === 0
                                ? 'No learner text entered yet. Paste or scan your document to preview real-time validation.'
                                : 'No records match the current filter.'}
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((row, rIdx) => {
                            return (
                              <tr
                                key={row.id}
                                className={`transition-colors ${
                                  row.hasErrors
                                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                    : rIdx % 2 === 0
                                    ? 'bg-white hover:bg-slate-50'
                                    : 'bg-slate-50/50 hover:bg-slate-100/50'
                                }`}
                              >
                                {/* Row Number */}
                                <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200 text-[11px]">
                                  {row.originalLineNumber}
                                </td>

                                {/* Learner Name */}
                                <td className="p-2 border-r border-slate-200 font-black text-slate-900 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span>{row.name}</span>
                                  </div>
                                </td>

                                {/* Gender (with red highlight if invalid) */}
                                <td className="p-2 border-r border-slate-200 text-center">
                                  {row.isGenderInvalid ? (
                                    <div
                                      className="p-1 rounded-lg bg-rose-100 border border-rose-500 text-rose-900 font-black text-[11px] shadow-xs flex items-center justify-center gap-1 animate-pulse"
                                      title={row.genderError}
                                    >
                                      <AlertTriangle size={12} className="text-rose-600 shrink-0" />
                                      <span>{row.rawGenderToken || 'INVALID'}</span>
                                      <div className="flex items-center gap-0.5 ml-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateGenderCell(row.id, 'M')}
                                          className="px-1 py-0.2 bg-blue-600 text-white rounded text-[9px] hover:bg-blue-700"
                                          title="Set to Boy (M)"
                                        >
                                          M
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateGenderCell(row.id, 'F')}
                                          className="px-1 py-0.2 bg-pink-600 text-white rounded text-[9px] hover:bg-pink-700"
                                          title="Set to Girl (F)"
                                        >
                                          F
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateGenderCell(
                                          row.id,
                                          row.detectedGender === 'M' ? 'F' : 'M'
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase transition-all shadow-2xs cursor-pointer ${
                                        row.detectedGender === 'M'
                                          ? 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                                          : 'bg-pink-100 text-pink-800 border border-pink-300 hover:bg-pink-200'
                                      }`}
                                      title="Click to toggle Gender (M/F)"
                                    >
                                      {row.detectedGender === 'M' ? '👦 Boy (M)' : '👧 Girl (F)'}
                                    </button>
                                  )}
                                </td>

                                {/* Subject Marks (with RED highlight if missing or invalid) */}
                                {row.marks.map((m) => {
                                  if (m.isMissing) {
                                    return (
                                      <td
                                        key={m.subjectId}
                                        className="p-1.5 border-r border-slate-200 text-center bg-rose-100/60"
                                      >
                                        <div
                                          className="px-1.5 py-1 rounded-lg bg-rose-100 border-2 border-dashed border-rose-500 text-rose-800 font-bold text-[10px] shadow-xs flex flex-col items-center justify-center"
                                          title={m.error}
                                        >
                                          <span className="font-black text-rose-900">Missing</span>
                                          <input
                                            type="text"
                                            placeholder="Enter"
                                            className="w-12 text-center text-[10px] bg-white border border-rose-300 rounded mt-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-black text-slate-900"
                                            onChange={e => handleUpdateMarkCell(row.id, m.subjectId, e.target.value)}
                                          />
                                        </div>
                                      </td>
                                    );
                                  }

                                  if (m.isInvalid) {
                                    return (
                                      <td
                                        key={m.subjectId}
                                        className="p-1.5 border-r border-slate-200 text-center bg-rose-100/60"
                                      >
                                        <div
                                          className="px-1.5 py-1 rounded-lg bg-rose-100 border border-rose-500 text-rose-900 font-black text-[11px] shadow-xs flex flex-col items-center justify-center"
                                          title={m.error}
                                        >
                                          <span className="line-through text-rose-600">{m.value}</span>
                                          <span className="text-[9px] text-rose-800 font-bold">Invalid</span>
                                          <input
                                            type="text"
                                            value={m.value}
                                            className="w-12 text-center text-[10px] bg-white border border-rose-400 rounded mt-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-black text-slate-900"
                                            onChange={e => handleUpdateMarkCell(row.id, m.subjectId, e.target.value)}
                                          />
                                        </div>
                                      </td>
                                    );
                                  }

                                  return (
                                    <td
                                      key={m.subjectId}
                                      className="p-1.5 border-r border-slate-200 text-center"
                                    >
                                      <input
                                        type="text"
                                        value={m.value}
                                        className={`w-12 text-center text-xs py-1 rounded-lg border font-bold transition-all focus:outline-none focus:ring-1 ${
                                          m.isAbsent
                                            ? 'bg-amber-100 border-amber-300 text-amber-900 font-black'
                                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500'
                                        }`}
                                        onChange={e => handleUpdateMarkCell(row.id, m.subjectId, e.target.value)}
                                      />
                                    </td>
                                  );
                                })}

                                {/* Validation Status Badge */}
                                <td className="p-2 text-center">
                                  {row.hasErrors ? (
                                    <div
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black"
                                      title={row.errorMessages.join('\n')}
                                    >
                                      <AlertTriangle size={11} className="text-rose-600 shrink-0" />
                                      <span>{row.errorMessages.length} issue(s)</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black">
                                      <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                      <span>Valid</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Camera Scanner button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenScanner();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              title="Scan physical marks document / scoresheet with Camera"
            >
              <Camera size={16} className="text-white animate-pulse" />
              <span>Scan Document</span>
            </button>
            <span className="text-[11px] text-slate-500 font-semibold hidden md:inline-block">
              {parsedData.totalRows} learners detected ({parsedData.boysCount} Boys, {parsedData.girlsCount} Girls)
            </span>
          </div>

          {/* Right: Cancel & Apply */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs uppercase hover:bg-slate-200/80 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={parsedData.totalRows === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-black text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer ${
                parsedData.totalRows === 0
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : parsedData.hasAnyErrors
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              }`}
            >
              <Check size={16} />
              <span>Fill Names & Marks ({parsedData.totalRows})</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
