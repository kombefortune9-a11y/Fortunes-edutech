import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import React, { useState, useEffect, useMemo } from 'react';
import { loadHtml2Pdf } from '../lib/pdfLoader';
import { shareOrSavePdfBlob } from '../lib/pdfShareHelper';
import { prepareDocumentForPdfExport, sanitizeClonedDoc } from '../lib/pdfUtils';
import { cn } from '../lib/utils';
import { 
  ClipboardList, 
  UserPlus, 
  Trash2, 
  Save, 
  Printer, 
  Download, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  Plus, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  FileSpreadsheet,
  Share2,
  GraduationCap,
  UserCheck,
  FileText,
  Phone,
  User,
  RefreshCw,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { saveAs } from 'file-saver';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';
import InformationCenter from './InformationCenter';
import { DocumentCameraScanner, ScanResult } from './DocumentCameraScanner';
import { BulkPasteValidationModal, ParsedLearnerRow } from './BulkPasteValidationModal';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface LearnerEntry {
  id: string;
  sn: number;
  name: string;
  gender: 'M' | 'F';
  // Key is subject name or id, value is raw mark string (e.g. "15", or "ABS")
  marks: Record<string, string>;
  isAbsent?: Record<string, boolean>;
}

export const getEczCbcGrade = (pct: number | null) => {
  if (pct === null) return { grade: '-', desc: '-' };
  if (pct >= 70) return { grade: '1', desc: 'Outstanding' };
  if (pct >= 60) return { grade: '2', desc: 'Advanced' };
  if (pct >= 50) return { grade: '3', desc: 'Basic' };
  if (pct >= 40) return { grade: '4', desc: 'Satisfactory' };
  return { grade: '5', desc: 'Unsatisfactory' };
};

export interface SubjectConfig {
  id: string;
  name: string;
  outOf: number; // Raw total mark, e.g., 25
  isOptional?: boolean;
  enabled?: boolean;
}

export interface ClassAssessmentRecord {
  id: string;
  school: string;
  district: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  grade: string;
  year: string;
  teacherName?: string;
  teacherPhone?: string;
  totalBoysExpected?: number;
  totalGirlsExpected?: number;
  totalExpectedAttendance?: number;
  subjects: SubjectConfig[];
  boys: LearnerEntry[];
  girls: LearnerEntry[];
  updatedAt?: any;
}

export type PdfExportType = 'boys' | 'girls' | 'summary' | 'progress_chart' | 'school_summary' | 'report_cards' | 'all' | 'active';

const DEFAULT_SUBJECTS_BY_GRADE: Record<string, string[]> = {
  ece: [
    'Zambian language',
    'English',
    'Pre-mathematics & Science',
    'Creative & Technology Studies (CTS)'
  ],
  lower_primary: [
    'Zambian language',
    'English',
    'Mathematics & Science',
    'Creative & Technology Studies (CTS)'
  ],
  upper_primary: [
    'Zambian language',
    'English',
    'Mathematics',
    'Science',
    'Social Studies (S.S)',
    'Technology Studies (T.S)',
    'Home Economics and Hospitality (H.E&H)',
    'Expressive Arts (Exp. Arts)'
  ]
};

export function getGradeCategory(gradeStr: string): 'ece' | 'lower_primary' | 'upper_primary' {
  const g = gradeStr.toLowerCase();
  if (g.includes('ece') || g.includes('baby') || g.includes('middle') || g.includes('reception') || g.includes('nursery')) {
    return 'ece';
  }
  if (((g.includes('grade 1') && !g.includes('grade 10') && !g.includes('grade 11') && !g.includes('grade 12')) || g.includes('grade 2') || g.includes('grade 3') || g.includes('g1') || g.includes('g2') || g.includes('g3'))) {
    return 'lower_primary';
  }
  return 'upper_primary';
}

export function getDefaultSubjectsForGrade(gradeStr: string): SubjectConfig[] {
  const cat = getGradeCategory(gradeStr);
  const subjectNames = DEFAULT_SUBJECTS_BY_GRADE[cat];
  return subjectNames.map((name, idx) => {
    const nameLower = name.toLowerCase();
    const isOptional = cat === 'upper_primary' && (
      nameLower.includes('technology studies') ||
      nameLower.includes('home economics') ||
      nameLower.includes('expressive arts')
    );
    return {
      id: `sub_${idx}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
      name,
      outOf: 25, // default out of 25 raw marks
      isOptional,
      enabled: true
    };
  });
}

export interface GradeDefinition {
  id: string;
  name: string;
  section: 'Lower Primary' | 'Upper Primary';
}

export const SCHOOL_GRADES: GradeDefinition[] = [
  { id: 'ece_1', name: 'ECE Level 1', section: 'Lower Primary' },
  { id: 'ece_2', name: 'ECE Level 2', section: 'Lower Primary' },
  { id: 'g1', name: 'Grade 1', section: 'Lower Primary' },
  { id: 'g2', name: 'Grade 2', section: 'Lower Primary' },
  { id: 'g3', name: 'Grade 3', section: 'Lower Primary' },
  { id: 'g4', name: 'Grade 4', section: 'Upper Primary' },
  { id: 'g5', name: 'Grade 5', section: 'Upper Primary' },
  { id: 'g6', name: 'Grade 6', section: 'Upper Primary' },
  { id: 'g7', name: 'Grade 7', section: 'Upper Primary' }
];

export interface PrimarySubjectDef {
  id: string;
  name: string;
  shortName: string;
}

export const SCHOOL_SUMMARY_SUBJECTS: PrimarySubjectDef[] = [
  { id: 'zambian_language', name: 'Zambian Language (Icibemba)', shortName: 'Zambian Lang' },
  { id: 'english_language', name: 'English', shortName: 'English' },
  { id: 'maths_science', name: 'Mathematics & Science', shortName: 'Maths & Science' },
  { id: 'cts', name: 'Creative & Technology Studies (CTS)', shortName: 'CTS' },
  { id: 'maths', name: 'Mathematics', shortName: 'Maths' },
  { id: 'science', name: 'Science', shortName: 'Science' },
  { id: 'social_studies', name: 'Social Studies (S.S)', shortName: 'S.S' },
  { id: 'tech_studies', name: 'Technology Studies (T.S)', shortName: 'T.S' },
  { id: 'home_econ', name: 'Home Economics and Hospitality (H.E&H)', shortName: 'H.E&H' },
  { id: 'expressive_arts', name: 'Expressive Arts (Exp. Arts)', shortName: 'Exp. Arts' }
];

export function isSubjectApplicableToGrade(gradeId: string, subjectId: string): boolean {
  const g = gradeId.toLowerCase();
  const isLowerSection = g === 'ece_1' || g === 'ece_2' || g === 'g1' || g === 'g2' || g === 'g3';
  const isUpperSection = g === 'g4' || g === 'g5' || g === 'g6' || g === 'g7';

  if (isLowerSection) {
    // Lower Section: Zambian language, English, Mathematics & Science, CTS
    const allowed = ['zambian_language', 'english_language', 'maths_science', 'cts'];
    return allowed.includes(subjectId);
  }

  if (isUpperSection) {
    // Upper Primary: Zambian language (implied), English, Mathematics, Science, Social Studies (S.S), Technology Studies (T.S), Home Economics and Hospitality (H.E&H), Expressive Arts (Exp. Arts)
    const allowed = [
      'zambian_language', 
      'english_language', 
      'maths', 
      'science', 
      'social_studies', 
      'tech_studies', 
      'home_econ', 
      'expressive_arts'
    ];
    return allowed.includes(subjectId);
  }

  return true;
}

export const DEFAULT_SCHOOL_SUMMARY_SCORES: Record<string, Record<string, string>> = {
  g1: {
    zambian_language: '68',
    english_language: '67',
    maths: '64',
    science: '62',
    cts: '80'
  }
};

export function calculateSchoolSummaryMetrics(scores: Record<string, Record<string, string>>) {
  const gradeMeans: Record<string, number | null> = {};
  
  SCHOOL_GRADES.forEach(g => {
    const row = scores[g.id] || {};
    let sum = 0;
    let count = 0;
    SCHOOL_SUMMARY_SUBJECTS.forEach(s => {
      if (!isSubjectApplicableToGrade(g.id, s.id)) return;
      const v = row[s.id];
      if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
        sum += Number(v);
        count++;
      }
    });
    gradeMeans[g.id] = count > 0 ? sum / count : null;
  });

  const lowerGrades = SCHOOL_GRADES.filter(g => g.section === 'Lower Primary');
  let lowerSum = 0;
  let lowerCount = 0;
  lowerGrades.forEach(g => {
    const mean = gradeMeans[g.id];
    if (mean !== null) {
      lowerSum += mean;
      lowerCount++;
    }
  });
  const lowerPrimaryMean = lowerCount > 0 ? lowerSum / lowerCount : null;

  const upperGrades = SCHOOL_GRADES.filter(g => g.section === 'Upper Primary');
  let upperSum = 0;
  let upperCount = 0;
  upperGrades.forEach(g => {
    const mean = gradeMeans[g.id];
    if (mean !== null) {
      upperSum += mean;
      upperCount++;
    }
  });
  const upperPrimaryMean = upperCount > 0 ? upperSum / upperCount : null;

  const subjectMeans: Record<string, number | null> = {};
  SCHOOL_SUMMARY_SUBJECTS.forEach(s => {
    let sSum = 0;
    let sCount = 0;
    SCHOOL_GRADES.forEach(g => {
      if (!isSubjectApplicableToGrade(g.id, s.id)) return;
      const v = scores[g.id]?.[s.id];
      if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
        sSum += Number(v);
        sCount++;
      }
    });
    subjectMeans[s.id] = sCount > 0 ? sSum / sCount : null;
  });

  let totalSum = 0;
  let totalCount = 0;
  SCHOOL_GRADES.forEach(g => {
    SCHOOL_SUMMARY_SUBJECTS.forEach(s => {
      if (!isSubjectApplicableToGrade(g.id, s.id)) return;
      const v = scores[g.id]?.[s.id];
      if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
        totalSum += Number(v);
        totalCount++;
      }
    });
  });
  const overallSchoolMean = totalCount > 0 ? totalSum / totalCount : null;

  return {
    gradeMeans,
    lowerPrimaryMean,
    upperPrimaryMean,
    subjectMeans,
    overallSchoolMean
  };
}

export function normalizeLearnerList(list: LearnerEntry[] = [], gender: 'M' | 'F'): LearnerEntry[] {
  const targetLength = Math.max(30, list.length);
  const result: LearnerEntry[] = [];
  for (let i = 0; i < targetLength; i++) {
    const existing = list[i];
    result.push({
      id: existing?.id || `${gender === 'M' ? 'boy' : 'girl'}_${i + 1}`,
      sn: i + 1,
      name: existing?.name || '',
      gender: gender,
      marks: existing?.marks || {},
      isAbsent: existing?.isAbsent || {}
    });
  }
  return result;
}

export function mergeEnglishSubjects(
  subjects: SubjectConfig[],
  boys: LearnerEntry[],
  girls: LearnerEntry[]
): { subjects: SubjectConfig[]; boys: LearnerEntry[]; girls: LearnerEntry[] } {
  const englishKeys = ['literacy', 'oral english', 'english', 'english'];
  const englishSubs = subjects.filter(s => englishKeys.some(key => s.name.toLowerCase().includes(key)));

  if (englishSubs.length === 0) {
    return { subjects, boys, girls };
  }

  // If there's only 1 English subject, ensure it is named exactly 'English'
  if (englishSubs.length === 1) {
    const sub = englishSubs[0];
    if (sub.name !== 'English') {
      const updatedSubjects = subjects.map(s =>
        s.id === sub.id ? { ...s, name: 'English' } : s
      );
      return { subjects: updatedSubjects, boys, girls };
    }
    return { subjects, boys, girls };
  }

  // If there are 2 or more English subjects, merge them into 'English'
  const mergedId = englishSubs[0].id;
  const mergedSubject: SubjectConfig = {
    id: mergedId,
    name: 'English',
    outOf: 25,
    enabled: true
  };

  const newSubjects = [...subjects];
  const firstIndex = subjects.findIndex(s => s.id === mergedId);
  newSubjects[firstIndex] = mergedSubject;
  const filteredSubjects = newSubjects.filter(
    s => s.id === mergedId || !englishSubs.some(es => es.id === s.id)
  );

  const mergeLearnerMarks = (list: LearnerEntry[]): LearnerEntry[] => {
    return list.map(learner => {
      const newMarks = { ...learner.marks };
      const newAbsent = learner.isAbsent ? { ...learner.isAbsent } : {};

      let sum = 0;
      let count = 0;
      let isAnyAbsent = false;

      englishSubs.forEach(es => {
        const val = learner.marks[es.id];
        const wasAbsent = learner.isAbsent?.[es.id];

        if (wasAbsent) {
          isAnyAbsent = true;
        }

        if (val !== undefined && val !== null && val.trim() !== '') {
          if (val === 'ABS') {
            isAnyAbsent = true;
          } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              const outOf = es.outOf || 25;
              const pct = num / outOf;
              sum += pct;
              count++;
            }
          }
        }

        if (es.id !== mergedId) {
          delete newMarks[es.id];
          if (newAbsent[es.id] !== undefined) {
            delete newAbsent[es.id];
          }
        }
      });

      if (count > 0) {
        const avgPct = sum / count;
        const finalRaw = Math.round(avgPct * 25);
        newMarks[mergedId] = finalRaw.toString();
        newAbsent[mergedId] = false;
      } else if (isAnyAbsent) {
        newMarks[mergedId] = 'ABS';
        newAbsent[mergedId] = true;
      }

      return {
        ...learner,
        marks: newMarks,
        isAbsent: newAbsent
      };
    });
  };

  return {
    subjects: filteredSubjects,
    boys: mergeLearnerMarks(boys),
    girls: mergeLearnerMarks(girls)
  };
}

export function migrateAllSavedRecords(
  records: Record<string, ClassAssessmentRecord>
): { migrated: Record<string, ClassAssessmentRecord>; hasChanges: boolean } {
  const migrated: Record<string, ClassAssessmentRecord> = {};
  let hasChanges = false;

  for (const key of Object.keys(records)) {
    const rec = records[key];
    const loadedSubjects = rec.subjects || [];
    const loadedBoys = rec.boys || [];
    const loadedGirls = rec.girls || [];

    if (loadedSubjects.length > 0) {
      const merged = mergeEnglishSubjects(loadedSubjects, loadedBoys, loadedGirls);
      const subjectsChanged = JSON.stringify(merged.subjects) !== JSON.stringify(loadedSubjects);
      if (subjectsChanged) {
        hasChanges = true;
        migrated[key] = {
          ...rec,
          subjects: merged.subjects,
          boys: merged.boys,
          girls: merged.girls,
          updatedAt: new Date().toISOString()
        };
      } else {
        migrated[key] = rec;
      }
    } else {
      migrated[key] = rec;
    }
  }

  return { migrated, hasChanges };
}

interface AssessmentTrackerProps {
  onBack: () => void;
  onNavigate?: (section: string) => void;
}

export function AssessmentTracker({ onBack, onNavigate }: AssessmentTrackerProps) {
  const { user, isWhitelisted, subscriptionDetails, downloadRecords, schoolCircle, schoolTeacher } = useAuth();

  const checkDownloadAccess = (): boolean => {
    const status = getDownloadAccessStatus(user, subscriptionDetails);
    if (!status.allowed) {
      toast.error(status.message, {
        id: 'at-depleted-toast',
        duration: 8000
      });
      return false;
    }
    return true;
  };

  // Header State
  const [school, setSchool] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.school || 'CHINIKA SECONDARY SCHOOL';
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        return parsed.school || 'CHINIKA SECONDARY SCHOOL';
      }
    } catch (e) {
      console.error("Failed to parse profile", e);
    }
    return 'CHINIKA SECONDARY SCHOOL';
  });

  const [district, setDistrict] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.district || 'LUSAKA DISTRICT';
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        return parsed.district || 'LUSAKA DISTRICT';
      }
    } catch (e) {
      console.error("Failed to parse profile", e);
    }
    return 'LUSAKA DISTRICT';
  });

  const [term, setTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.term || 'Term 1';
      }
    } catch (e) {}
    return 'Term 1';
  });

  const [grade, setGrade] = useState('Grade 1');

  const [year, setYear] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.year || '2026';
      }
    } catch (e) {}
    return '2026';
  });

  const [teacherName, setTeacherName] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.teacherName || 'MR. KOMBE FORTUNE';
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        return parsed.teacherName || 'MR. KOMBE FORTUNE';
      }
    } catch (e) {
      console.error("Failed to parse profile", e);
    }
    return 'MR. KOMBE FORTUNE';
  });

  const [teacherPhone, setTeacherPhone] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.teacherPhone || '+260 971 234 567';
      }
    } catch (e) {}
    return '+260 971 234 567';
  });

  const cleanGradeDisplay = grade.replace(/^grade\s*/i, '').trim() || grade;
  const cleanTermDisplay = term.replace(/^term\s*/i, '').trim() || term;

  const [isGeneralProfileExpanded, setIsGeneralProfileExpanded] = useState<boolean>(false);

  // Total Expected Attendance State (Entered at the top)
  const [totalBoysExpected, setTotalBoysExpected] = useState<number>(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.totalBoysExpected !== undefined ? parsed.totalBoysExpected : 30;
      }
    } catch (e) {}
    return 30;
  });

  const [totalGirlsExpected, setTotalGirlsExpected] = useState<number>(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.totalGirlsExpected !== undefined ? parsed.totalGirlsExpected : 30;
      }
    } catch (e) {}
    return 30;
  });

  const [totalExpectedAttendance, setTotalExpectedAttendance] = useState<number>(() => {
    try {
      const stored = safeLocalStorage.getItem('assessment_tracker_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.totalExpectedAttendance !== undefined ? parsed.totalExpectedAttendance : 60;
      }
    } catch (e) {}
    return 60;
  });

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'boys' | 'girls' | 'summary' | 'progress_chart' | 'school_summary' | 'report_cards'>('boys');

  // Report Cards selected learner ID
  const [selectedReportLearnerId, setSelectedReportLearnerId] = useState<string>('all');

  // Active Subjects List
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => getDefaultSubjectsForGrade('Grade 1'));

  // Learner Lists (30 slots for Boys, 30 slots for Girls)
  const [boys, setBoys] = useState<LearnerEntry[]>(() => normalizeLearnerList([], 'M'));
  const [girls, setGirls] = useState<LearnerEntry[]>(() => normalizeLearnerList([], 'F'));

  // Filtered active learners (strictly only populated rows with names/marks)
  const activeBoys = useMemo(() => {
    return boys.filter(b => b.name.trim() !== '' || Object.keys(b.marks).some(k => b.marks[k] && b.marks[k].trim() !== ''));
  }, [boys]);

  const activeGirls = useMemo(() => {
    return girls.filter(g => g.name.trim() !== '' || Object.keys(g.marks).some(k => g.marks[k] && g.marks[k].trim() !== ''));
  }, [girls]);

  // Filtered active subjects (excluding disabled or unfilled optional subjects)
  const activeSubjects = useMemo(() => {
    return subjects.filter(sub => sub.enabled !== false);
  }, [subjects]);

  const activeExportSubjects = useMemo(() => {
    return activeSubjects.filter(sub => {
      if (!sub.isOptional) return true;
      // Optional subjects only appear in export/documents if filled or explicitly enabled
      const hasAnyEntry = [...activeBoys, ...activeGirls].some(l => {
        const m = l.marks[sub.id];
        return m !== undefined && m !== null && String(m).trim() !== '';
      });
      return hasAnyEntry;
    });
  }, [activeSubjects, activeBoys, activeGirls]);

  // Bulk Paste Name Dialog & Camera Scanner State
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [photoExtractionReport, setPhotoExtractionReport] = useState<{
    success: boolean;
    total: number;
    boys: number;
    girls: number;
    message: string;
    warnings?: string[];
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCopyRosterModal, setShowCopyRosterModal] = useState(false);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
  const [bulkText, setBulkText] = useState('');
  const [bulkTargetGender, setBulkTargetGender] = useState<'M' | 'F'>('M');
  const [highlightValidationErrors, setHighlightValidationErrors] = useState(true);

  // Real-time table data validation stats for currently active cohort
  const cohortValidationStats = useMemo(() => {
    const activeList = activeTab === 'boys' ? boys : girls;
    let missingMarksCount = 0;
    let incompleteLearnersCount = 0;
    const issues: Array<{ learnerName: string; missingSubjects: string[] }> = [];

    activeList.forEach((learner) => {
      const hasName = learner.name.trim() !== '';
      if (hasName) {
        const missingForLearner: string[] = [];
        subjects.forEach(sub => {
          const rawVal = learner.marks[sub.id];
          const isExplicitAbs = learner.isAbsent?.[sub.id] || String(rawVal || '').trim().toUpperCase() === 'ABS';
          const hasMark = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' && !isNaN(parseFloat(String(rawVal)));
          if (!hasMark && !isExplicitAbs) {
            missingMarksCount++;
            missingForLearner.push(sub.name);
          }
        });
        if (missingForLearner.length > 0) {
          incompleteLearnersCount++;
          issues.push({ learnerName: learner.name, missingSubjects: missingForLearner });
        }
      }
    });

    return {
      missingMarksCount,
      incompleteLearnersCount,
      issues,
      hasIssues: missingMarksCount > 0
    };
  }, [activeTab, boys, girls, subjects]);

  // Multi-term Progress Storage state
  const [savedRecords, setSavedRecords] = useState<Record<string, ClassAssessmentRecord>>({});
  const [isSaving, setIsSaving] = useState(false);

  // School Performance Summary matrix state (ECE Level 1 to Grade 7)
  const [schoolSummaryScores, setSchoolSummaryScores] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const stored = safeLocalStorage.getItem('school_performance_summary_scores');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Purge legacy hardcoded defaults for un-entered grades or old column IDs (english/oral_english)
        if (parsed.ece_1?.zambian_language === '70' || parsed.g2?.zambian_language === '65' || parsed.g4?.zambian_language === '62' || (parsed.g1 && parsed.g1.english !== undefined) || (parsed.g1 && parsed.g1.english_language === undefined)) {
          const cleaned = DEFAULT_SCHOOL_SUMMARY_SCORES;
          safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(cleaned));
          return cleaned;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse school summary scores", e);
    }
    return DEFAULT_SCHOOL_SUMMARY_SCORES;
  });

  const handleSchoolSummaryScoreChange = (gradeId: string, subjectId: string, val: string) => {
    const updated = {
      ...schoolSummaryScores,
      [gradeId]: {
        ...(schoolSummaryScores[gradeId] || {}),
        [subjectId]: val
      }
    };
    setSchoolSummaryScores(updated);
    try {
      safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to store school summary scores", e);
    }
  };

  const handleResetSchoolSummaryScores = () => {
    setSchoolSummaryScores(DEFAULT_SCHOOL_SUMMARY_SCORES);
    try {
      safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(DEFAULT_SCHOOL_SUMMARY_SCORES));
      toast.success("School performance summary matrix reset to default.");
    } catch (e) {
      console.error("Failed to reset scores", e);
    }
  };

  // Rebuild the entire school performance summary scores matrix systematically based on all saved records
  const rebuildAllSchoolSummaryScores = (records: Record<string, ClassAssessmentRecord>) => {
    let newScores = { ...DEFAULT_SCHOOL_SUMMARY_SCORES };

    // Blend in existing manual inputs to preserve them if not overwritten by actual data
    try {
      const stored = safeLocalStorage.getItem('school_performance_summary_scores');
      if (stored) {
        newScores = { ...newScores, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to parse existing school summary scores", e);
    }

    // Map each grade in SCHOOL_GRADES and calculate averages from corresponding saved records
    SCHOOL_GRADES.forEach(gDef => {
      const matchingRecordKeys = Object.keys(records).filter(key => {
        const rec = records[key];
        return rec.grade.toLowerCase().includes(gDef.name.toLowerCase()) || 
               gDef.name.toLowerCase().includes(rec.grade.toLowerCase());
      });

      if (matchingRecordKeys.length > 0) {
        // Sort matching keys to find the latest updated record for this grade
        const sortedKeys = matchingRecordKeys.sort((a, b) => {
          const timeA = new Date(records[a].updatedAt || 0).getTime();
          const timeB = new Date(records[b].updatedAt || 0).getTime();
          return timeB - timeA;
        });

        const latestRecord = records[sortedKeys[0]];
        const allLearners = [...(latestRecord.boys || []), ...(latestRecord.girls || [])].filter(l => l.name.trim());

        if (allLearners.length > 0) {
          const updatedRow = { ...(newScores[gDef.id] || {}) };

          SCHOOL_SUMMARY_SUBJECTS.forEach(sumSub => {
            if (!isSubjectApplicableToGrade(gDef.id, sumSub.id)) return;

            const matchedTrackerSub = latestRecord.subjects?.find(sub => 
              sub.name.toLowerCase().includes(sumSub.shortName.toLowerCase()) ||
              sumSub.name.toLowerCase().includes(sub.name.toLowerCase()) ||
              sub.name.toLowerCase().includes(sumSub.name.toLowerCase())
            );

            if (matchedTrackerSub) {
              let passingPctSum = 0;
              let satCount = 0;
              allLearners.forEach(learner => {
                const raw = learner.marks[matchedTrackerSub.id];
                if (raw !== undefined && raw !== null && String(raw).trim() !== '' && !isNaN(Number(raw))) {
                  const pct = (Number(raw) / (matchedTrackerSub.outOf || 25)) * 100;
                  satCount++;
                  if (pct >= 40) {
                    passingPctSum += pct;
                  }
                }
              });
              if (satCount > 0) {
                updatedRow[sumSub.id] = String(Math.round(passingPctSum / satCount));
              }
            }
          });

          newScores[gDef.id] = updatedRow;
        }
      }
    });

    setSchoolSummaryScores(newScores);
    try {
      safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(newScores));
    } catch (e) {
      console.error("Failed to store auto-updated school summary scores", e);
    }
  };

  // Real-time automatic sync of the active grade's averages to the school summary scores
  useEffect(() => {
    const matchedGradeDef = SCHOOL_GRADES.find(g => 
      grade.toLowerCase().includes(g.name.toLowerCase()) || 
      g.name.toLowerCase().includes(grade.toLowerCase())
    );
    if (!matchedGradeDef) return;
    const targetGradeId = matchedGradeDef.id;

    const allActiveLearners = [...boys, ...girls].filter(l => l.name.trim());
    if (allActiveLearners.length === 0) return;

    // Check if we actually have any marks entered
    let hasMarks = false;
    for (const l of allActiveLearners) {
      if (Object.values(l.marks).some(v => v !== undefined && v !== null && String(v).trim() !== '')) {
        hasMarks = true;
        break;
      }
    }
    if (!hasMarks) return;

    setSchoolSummaryScores(prev => {
      const updatedRow = { ...(prev[targetGradeId] || {}) };
      let changed = false;

      SCHOOL_SUMMARY_SUBJECTS.forEach(sumSub => {
        if (!isSubjectApplicableToGrade(targetGradeId, sumSub.id)) return;

        const matchedTrackerSub = subjects.find(sub => 
          sub.name.toLowerCase().includes(sumSub.shortName.toLowerCase()) ||
          sumSub.name.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(sumSub.name.toLowerCase())
        );

        if (matchedTrackerSub) {
          let passingPctSum = 0;
          let satCount = 0;
          allActiveLearners.forEach(learner => {
            const raw = learner.marks[matchedTrackerSub.id];
            if (raw !== undefined && raw !== null && String(raw).trim() !== '' && !isNaN(Number(raw))) {
              const pct = (Number(raw) / (matchedTrackerSub.outOf || 25)) * 100;
              satCount++;
              if (pct >= 40) {
                passingPctSum += pct;
              }
            }
          });

          const newValue = satCount > 0 ? String(Math.round(passingPctSum / satCount)) : '';
          if (updatedRow[sumSub.id] !== newValue) {
            if (newValue === '') {
              delete updatedRow[sumSub.id];
            } else {
              updatedRow[sumSub.id] = newValue;
            }
            changed = true;
          }
        }
      });

      if (changed) {
        const nextScores = {
          ...prev,
          [targetGradeId]: updatedRow
        };
        try {
          safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(nextScores));
        } catch (e) {
          console.error("Failed to save auto-synced summary scores", e);
        }
        return nextScores;
      }

      return prev;
    });
  }, [boys, girls, subjects, grade]);

  // Sync current active class tracker scores into corresponding grade row in School Summary
  const handleSyncCurrentGradeToSummary = () => {
    const matchedGradeDef = SCHOOL_GRADES.find(g => grade.toLowerCase().includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(grade.toLowerCase()));
    const targetGradeId = matchedGradeDef ? matchedGradeDef.id : 'g1';

    const allActiveLearners = [...activeBoys, ...activeGirls];
    if (allActiveLearners.length === 0) {
      toast.error(`No learner marks entered yet for ${grade} to sync.`);
      return;
    }

    const updatedRow = { ...(schoolSummaryScores[targetGradeId] || {}) };

    SCHOOL_SUMMARY_SUBJECTS.forEach(sumSub => {
      if (!isSubjectApplicableToGrade(targetGradeId, sumSub.id)) return;
      // Find matching subject in active tracker
      const matchedTrackerSub = activeSubjects.find(sub => 
        sub.name.toLowerCase().includes(sumSub.shortName.toLowerCase()) ||
        sumSub.name.toLowerCase().includes(sub.name.toLowerCase()) ||
        sub.name.toLowerCase().includes(sumSub.name.toLowerCase())
      );

      if (matchedTrackerSub) {
        let sumPct = 0;
        let count = 0;
        allActiveLearners.forEach(learner => {
          const raw = learner.marks[matchedTrackerSub.id];
          if (raw !== undefined && raw !== null && String(raw).trim() !== '' && !isNaN(Number(raw))) {
            const pct = (Number(raw) / (matchedTrackerSub.outOf || 25)) * 100;
            sumPct += pct;
            count++;
          }
        });
        if (count > 0) {
          updatedRow[sumSub.id] = String(Math.round(sumPct / count));
        }
      }
    });

    const updatedScores = {
      ...schoolSummaryScores,
      [targetGradeId]: updatedRow
    };
    setSchoolSummaryScores(updatedScores);
    try {
      safeLocalStorage.setItem('school_performance_summary_scores', JSON.stringify(updatedScores));
      toast.success(`Class averages for ${grade} synced into ${matchedGradeDef?.name || 'Grade 1'} row!`);
    } catch (e) {
      console.error(e);
    }
  };

  // AI Advice
  const [customAdvice, setCustomAdvice] = useState<string | null>(null);

  // Load Saved Tracker from local storage or cloud
  const recordKey = `tracker_${grade.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${year}`;

  // Helper to read latest saved records from localStorage synchronously
  const getLatestSavedRecords = (): Record<string, ClassAssessmentRecord> => {
    try {
      const localData = safeLocalStorage.getItem(`assessment_tracker_all_data`);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (e) {
      console.warn("Could not parse assessment_tracker_all_data", e);
    }
    return savedRecords;
  };

  // When grade changes, update default subjects and load/reset grade data
  const handleGradeChange = (newGrade: string) => {
    if (newGrade === grade) return;

    // 1. Save current active grade data first using current state so no user entries are lost
    if (grade && recordKey) {
      const currentRec: ClassAssessmentRecord = {
        id: recordKey,
        school,
        district,
        term,
        grade,
        year,
        teacherName,
        teacherPhone,
        totalBoysExpected,
        totalGirlsExpected,
        totalExpectedAttendance,
        subjects,
        boys,
        girls,
        updatedAt: new Date().toISOString()
      };

      const latest = getLatestSavedRecords();
      const updatedMap = {
        ...latest,
        [recordKey]: currentRec
      };
      setSavedRecords(updatedMap);
      try {
        safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(updatedMap));
      } catch (e) {
        console.warn("Could not save to localStorage during grade change", e);
      }
    }

    // 2. Set new grade
    setGrade(newGrade);

    // 3. Look up target grade record in updated map or local storage
    const targetKey = `tracker_${newGrade.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${year}`;
    const latest = getLatestSavedRecords();
    const targetRec = latest[targetKey];

    // 4. If target grade record already exists, load its data immediately
    if (targetRec) {
      if (targetRec.school) setSchool(targetRec.school);
      if (targetRec.district) setDistrict(targetRec.district);
      if (targetRec.teacherName) setTeacherName(targetRec.teacherName);
      if (targetRec.teacherPhone) setTeacherPhone(targetRec.teacherPhone);

      const loadedSubjects = targetRec.subjects || [];
      const loadedBoys = targetRec.boys || [];
      const loadedGirls = targetRec.girls || [];

      if (loadedSubjects.length > 0) {
        const merged = mergeEnglishSubjects(loadedSubjects, loadedBoys, loadedGirls);
        setSubjects(merged.subjects);
        setBoys(normalizeLearnerList(merged.boys, 'M'));
        setGirls(normalizeLearnerList(merged.girls, 'F'));
      } else {
        setSubjects(getDefaultSubjectsForGrade(newGrade));
        setBoys(normalizeLearnerList(loadedBoys, 'M'));
        setGirls(normalizeLearnerList(loadedGirls, 'F'));
      }

      if (targetRec.totalBoysExpected !== undefined) setTotalBoysExpected(targetRec.totalBoysExpected);
      if (targetRec.totalGirlsExpected !== undefined) setTotalGirlsExpected(targetRec.totalGirlsExpected);
      if (targetRec.totalExpectedAttendance !== undefined) setTotalExpectedAttendance(targetRec.totalExpectedAttendance);
    } else {
      // Clean fresh template for newly selected grade
      const newDefaults = getDefaultSubjectsForGrade(newGrade);
      setSubjects(newDefaults);
      setBoys(normalizeLearnerList([], 'M'));
      setGirls(normalizeLearnerList([], 'F'));
      setTotalBoysExpected(30);
      setTotalGirlsExpected(30);
      setTotalExpectedAttendance(60);
    }

    toast.success(`Switched active view to ${newGrade}`);
  };

  // When term changes, save active record and load target term
  const handleTermChange = (newTerm: 'Term 1' | 'Term 2' | 'Term 3') => {
    if (newTerm === term) return;

    if (grade && recordKey) {
      const currentRec: ClassAssessmentRecord = {
        id: recordKey,
        school,
        district,
        term,
        grade,
        year,
        teacherName,
        teacherPhone,
        totalBoysExpected,
        totalGirlsExpected,
        totalExpectedAttendance,
        subjects,
        boys,
        girls,
        updatedAt: new Date().toISOString()
      };

      const latest = getLatestSavedRecords();
      const updatedMap = {
        ...latest,
        [recordKey]: currentRec
      };
      setSavedRecords(updatedMap);
      try {
        safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(updatedMap));
      } catch (e) {
        console.warn("Could not save to localStorage during term change", e);
      }
    }

    setTerm(newTerm);

    const targetKey = `tracker_${grade.replace(/\s+/g, '_')}_${newTerm.replace(/\s+/g, '_')}_${year}`;
    const latest = getLatestSavedRecords();
    const targetRec = latest[targetKey];

    if (targetRec) {
      const loadedSubjects = targetRec.subjects || [];
      const loadedBoys = targetRec.boys || [];
      const loadedGirls = targetRec.girls || [];

      if (loadedSubjects.length > 0) {
        const merged = mergeEnglishSubjects(loadedSubjects, loadedBoys, loadedGirls);
        setSubjects(merged.subjects);
        setBoys(normalizeLearnerList(merged.boys, 'M'));
        setGirls(normalizeLearnerList(merged.girls, 'F'));
      } else {
        setSubjects(getDefaultSubjectsForGrade(grade));
        setBoys(normalizeLearnerList(loadedBoys, 'M'));
        setGirls(normalizeLearnerList(loadedGirls, 'F'));
      }

      if (targetRec.totalBoysExpected !== undefined) setTotalBoysExpected(targetRec.totalBoysExpected);
      if (targetRec.totalGirlsExpected !== undefined) setTotalGirlsExpected(targetRec.totalGirlsExpected);
      if (targetRec.totalExpectedAttendance !== undefined) setTotalExpectedAttendance(targetRec.totalExpectedAttendance);
    } else {
      // Carry over active learner names from current term, but clear marks for the new term
      setBoys(prev => prev.map(b => ({ ...b, marks: {}, isAbsent: {} })));
      setGirls(prev => prev.map(g => ({ ...g, marks: {}, isAbsent: {} })));
    }

    toast.success(`Switched to ${newTerm}`);
  };

  // When year changes, save active record and load target year
  const handleYearChange = (newYear: string) => {
    if (newYear === year) return;

    if (grade && recordKey) {
      const currentRec: ClassAssessmentRecord = {
        id: recordKey,
        school,
        district,
        term,
        grade,
        year,
        teacherName,
        teacherPhone,
        totalBoysExpected,
        totalGirlsExpected,
        totalExpectedAttendance,
        subjects,
        boys,
        girls,
        updatedAt: new Date().toISOString()
      };

      const latest = getLatestSavedRecords();
      const updatedMap = {
        ...latest,
        [recordKey]: currentRec
      };
      setSavedRecords(updatedMap);
      try {
        safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(updatedMap));
      } catch (e) {
        console.warn("Could not save to localStorage during year change", e);
      }
    }

    setYear(newYear);

    const targetKey = `tracker_${grade.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${newYear}`;
    const latest = getLatestSavedRecords();
    const targetRec = latest[targetKey];

    if (targetRec) {
      const loadedSubjects = targetRec.subjects || [];
      const loadedBoys = targetRec.boys || [];
      const loadedGirls = targetRec.girls || [];

      if (loadedSubjects.length > 0) {
        const merged = mergeEnglishSubjects(loadedSubjects, loadedBoys, loadedGirls);
        setSubjects(merged.subjects);
        setBoys(normalizeLearnerList(merged.boys, 'M'));
        setGirls(normalizeLearnerList(merged.girls, 'F'));
      } else {
        setSubjects(getDefaultSubjectsForGrade(grade));
        setBoys(normalizeLearnerList(loadedBoys, 'M'));
        setGirls(normalizeLearnerList(loadedGirls, 'F'));
      }
    } else {
      setSubjects(getDefaultSubjectsForGrade(grade));
      setBoys(normalizeLearnerList([], 'M'));
      setGirls(normalizeLearnerList([], 'F'));
      setTotalBoysExpected(30);
      setTotalGirlsExpected(30);
      setTotalExpectedAttendance(60);
    }
  };

  // Auto load local data on mount or key change
  useEffect(() => {
    try {
      const localData = safeLocalStorage.getItem(`assessment_tracker_all_data`);
      if (localData) {
        let parsed = JSON.parse(localData);
        const migration = migrateAllSavedRecords(parsed);
        if (migration.hasChanges) {
          parsed = migration.migrated;
          safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(parsed));
          // Async push to Firestore if user logged in
          if (user?.uid) {
            Object.keys(parsed).forEach(key => {
              const docRef = doc(db, 'users', user.uid, 'assessment_records', key);
              setDoc(docRef, {
                ...parsed[key],
                updatedAt: serverTimestamp()
              }, { merge: true }).catch(err => {
                console.error("Failed to sync migrated record to Firestore for key", key, err);
              });
            });
          }
        }

        setSavedRecords(parsed);
        // Automatically rebuild all school summary scores using saved records to ensure it's up to date
        rebuildAllSchoolSummaryScores(parsed);

        if (parsed[recordKey]) {
          const rec = parsed[recordKey];
          setSchool(rec.school || 'CHINIKA SECONDARY SCHOOL');
          setDistrict(rec.district || 'LUSAKA DISTRICT');
          if (rec.teacherName) setTeacherName(rec.teacherName);
          if (rec.teacherPhone) setTeacherPhone(rec.teacherPhone);

          const loadedSubjects = rec.subjects || [];
          const loadedBoys = rec.boys || [];
          const loadedGirls = rec.girls || [];

          if (loadedSubjects.length > 0) {
            const merged = mergeEnglishSubjects(loadedSubjects, loadedBoys, loadedGirls);
            setSubjects(merged.subjects);
            setBoys(normalizeLearnerList(merged.boys, 'M'));
            setGirls(normalizeLearnerList(merged.girls, 'F'));
          } else {
            setSubjects(getDefaultSubjectsForGrade(grade));
            setBoys(normalizeLearnerList(loadedBoys, 'M'));
            setGirls(normalizeLearnerList(loadedGirls, 'F'));
          }

          if (rec.totalBoysExpected !== undefined) setTotalBoysExpected(rec.totalBoysExpected);
          if (rec.totalGirlsExpected !== undefined) setTotalGirlsExpected(rec.totalGirlsExpected);
          if (rec.totalExpectedAttendance !== undefined) {
            setTotalExpectedAttendance(rec.totalExpectedAttendance);
          } else if (rec.totalBoysExpected !== undefined && rec.totalGirlsExpected !== undefined) {
            setTotalExpectedAttendance(rec.totalBoysExpected + rec.totalGirlsExpected);
          }
        } else {
          // KEY IS NOT FOUND: Reset active view to defaults for current grade
          setSubjects(getDefaultSubjectsForGrade(grade));
          setBoys(normalizeLearnerList([], 'M'));
          setGirls(normalizeLearnerList([], 'F'));
        }
      } else {
        // No local storage: Load defaults for current grade
        setSubjects(getDefaultSubjectsForGrade(grade));
        setBoys(normalizeLearnerList([], 'M'));
        setGirls(normalizeLearnerList([], 'F'));
      }
    } catch (e) {
      console.warn("Could not parse local assessment data", e);
    }
  }, [recordKey, user?.uid]);

  // Sync to localStorage
  const saveCurrentRecord = async (quiet = false) => {
    setIsSaving(true);
    try {
      const currentRec: ClassAssessmentRecord = {
        id: recordKey,
        school,
        district,
        term,
        grade,
        year,
        teacherName,
        teacherPhone,
        totalBoysExpected,
        totalGirlsExpected,
        totalExpectedAttendance,
        subjects,
        boys,
        girls,
        updatedAt: new Date().toISOString()
      };

      const updatedMap = {
        ...savedRecords,
        [recordKey]: currentRec
      };

      setSavedRecords(updatedMap);
      // Automatically rebuild and update the school summary scores on every save
      rebuildAllSchoolSummaryScores(updatedMap);
      safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(updatedMap));

      // Sync active enrolment & attendance & teacher profile to global storage across all doc tools
      try {
        const activeBoysList = boys.filter(b => b.name.trim() !== '' || Object.keys(b.marks).some(k => b.marks[k] && b.marks[k].trim() !== ''));
        const activeGirlsList = girls.filter(g => g.name.trim() !== '' || Object.keys(g.marks).some(k => g.marks[k] && g.marks[k].trim() !== ''));
        const activeBoysCount = activeBoysList.length;
        const activeGirlsCount = activeGirlsList.length;
        const totalActive = activeBoysCount + activeGirlsCount;

        const profileUpdate = {
          school,
          district,
          teacherName,
          teacherPhone,
          grade,
          term,
          year,
          totalBoysExpected,
          totalGirlsExpected,
          totalExpectedAttendance,
          enrolmentBoys: activeBoysCount || totalBoysExpected,
          enrolmentGirls: activeGirlsCount || totalGirlsExpected,
          totalEnrolment: totalActive || totalExpectedAttendance,
          attendanceBoys: activeBoysCount,
          attendanceGirls: activeGirlsCount,
          totalAttendance: totalActive
        };

        const existingGlobal = safeLocalStorage.getItem('user_general_profile');
        const globalObj = existingGlobal ? JSON.parse(existingGlobal) : {};
        const mergedProfile = { ...globalObj, ...profileUpdate };

        safeLocalStorage.setItem('user_general_profile', JSON.stringify(mergedProfile));
        safeLocalStorage.setItem('teacher_info', JSON.stringify(mergedProfile));
        safeLocalStorage.setItem('catch_up_profile', JSON.stringify(mergedProfile));

        // Save grade-specific learner lists for cross-document tallying
        safeLocalStorage.setItem(`eduplan_shared_learners_${grade}`, JSON.stringify({
          grade,
          term,
          year,
          boys: activeBoysList,
          girls: activeGirlsList,
          totalBoys: activeBoysCount,
          totalGirls: activeGirlsCount,
          totalLearners: totalActive
        }));
      } catch (e) {
        console.warn("Could not sync profile across document generators", e);
      }

      // If user is authenticated, sync to Firestore asynchronously
      if (user?.uid) {
        const docRef = doc(db, 'users', user.uid, 'assessment_records', recordKey);
        // Strip any undefined fields to ensure Firestore compatibility
        const cleanRec = JSON.parse(JSON.stringify(currentRec));
        await setDoc(docRef, {
          ...cleanRec,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // If part of Whole School Termly Circle, sync to school shared collection for all teachers
      if (schoolCircle?.id) {
        const schoolDocRef = doc(db, 'schools', schoolCircle.id, 'assessment_records', recordKey);
        const cleanRec = JSON.parse(JSON.stringify(currentRec));
        await setDoc(schoolDocRef, {
          ...cleanRec,
          savedByTeacher: schoolTeacher?.name || user?.displayName || 'Teacher',
          savedByEmail: user?.email || '',
          schoolId: schoolCircle.id,
          schoolName: schoolCircle.schoolName,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => {
          console.warn("Could not sync to school shared assessment records:", err);
        });
      }

      if (!quiet) {
        toast.success(`Assessment record saved for ${grade} (${term}, ${year})!`);
      }
    } catch (error) {
      console.error("Save error:", error);
      if (!quiet) toast.error("Saved locally. Cloud sync pending.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneralProfile = () => {
    const profile = {
      school,
      district,
      term,
      year,
      teacherName,
      teacherPhone,
      totalBoysExpected,
      totalGirlsExpected,
      totalExpectedAttendance
    };
    try {
      safeLocalStorage.setItem('assessment_tracker_profile', JSON.stringify(profile));
      // Also update user_general_profile and teacher_info for seamless integration with DocGenerator!
      const existingGlobal = safeLocalStorage.getItem('user_general_profile');
      const globalProfile = existingGlobal ? JSON.parse(existingGlobal) : {};
      const mergedProfile = {
        ...globalProfile,
        school,
        district,
        teacherName,
        teacherPhone,
        grade,
        term,
        year,
        totalBoysExpected,
        totalGirlsExpected,
        totalExpectedAttendance,
        enrolmentBoys: totalBoysExpected,
        enrolmentGirls: totalGirlsExpected,
        totalEnrolment: totalExpectedAttendance
      };
      safeLocalStorage.setItem('user_general_profile', JSON.stringify(mergedProfile));
      safeLocalStorage.setItem('teacher_info', JSON.stringify(mergedProfile));
      safeLocalStorage.setItem('catch_up_profile', JSON.stringify(mergedProfile));
    } catch (e) {
      console.warn("Could not save profile to storage", e);
    }
    setIsGeneralProfileExpanded(false);
    toast.success("General registration details registered! This profile is saved and will persist across documents.");
  };

  const handleResetGeneralProfile = () => {
    try {
      safeLocalStorage.removeItem('assessment_tracker_profile');
    } catch (e) {
      console.warn("Could not remove profile from storage", e);
    }
    setSchool('');
    setDistrict('');
    setTeacherName('');
    setTeacherPhone('');
    setTerm('Term 1');
    setYear('2026');
    setTotalBoysExpected(30);
    setTotalGirlsExpected(30);
    setTotalExpectedAttendance(60);
    setIsGeneralProfileExpanded(true);
    toast("General registration details reset! You can now enter fresh details.", { icon: 'ℹ️' });
  };

  // Clear current form cleanly from state, savedRecords map, and localStorage
  const handleClearCurrentForm = () => {
    const cleanBoys = normalizeLearnerList([], 'M');
    const cleanGirls = normalizeLearnerList([], 'F');
    const defaultSubjs = getDefaultSubjectsForGrade(grade);

    setBoys(cleanBoys);
    setGirls(cleanGirls);
    setSubjects(defaultSubjs);
    setCustomAdvice(null);
    setShowClearConfirm(false);

    // Remove current record from savedRecords and localStorage so old data doesn't persist
    const latest = getLatestSavedRecords();
    const updatedMap = { ...latest };
    delete updatedMap[recordKey];

    setSavedRecords(updatedMap);
    rebuildAllSchoolSummaryScores(updatedMap);

    try {
      safeLocalStorage.setItem(`assessment_tracker_all_data`, JSON.stringify(updatedMap));
      safeLocalStorage.removeItem(`eduplan_shared_learners_${grade}`);
    } catch (e) {
      console.warn("Could not remove record from localStorage", e);
    }

    if (user?.uid) {
      const docRef = doc(db, 'users', user.uid, 'assessment_records', recordKey);
      deleteDoc(docRef).catch(err => console.error("Firestore delete error", err));
    }

    toast.success(`Cleared entries for ${grade}! Fresh template ready.`);
  };

  // Copy Learner Roster From Another Grade Record
  const handleCopyRosterFromRecord = (sourceKey: string) => {
    if (!sourceKey || !savedRecords[sourceKey]) {
      toast.error("Please select a valid saved grade record.");
      return;
    }
    const sourceRec = savedRecords[sourceKey];
    const sourceBoys = sourceRec.boys || [];
    const sourceGirls = sourceRec.girls || [];

    // Copy names and gender while resetting marks to blank for active grade
    const newBoys = normalizeLearnerList(
      sourceBoys.map(b => ({ ...b, marks: {}, isAbsent: {} })),
      'M'
    );
    const newGirls = normalizeLearnerList(
      sourceGirls.map(g => ({ ...g, marks: {}, isAbsent: {} })),
      'F'
    );

    setBoys(newBoys);
    setGirls(newGirls);
    setShowCopyRosterModal(false);

    const bCount = sourceBoys.filter(b => b.name && b.name.trim()).length;
    const gCount = sourceGirls.filter(g => g.name && g.name.trim()).length;
    toast.success(`Copied learner roster from ${sourceRec.grade} (${bCount} Boys, ${gCount} Girls) into active ${grade} tracker!`);
  };

  // Bulk Paste Learners, Gender & Results Logic
  const handleApplyBulkNames = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const updatedBoys = [...boys];
    const updatedGirls = [...girls];

    let boysIndex = 0;
    let girlsIndex = 0;
    let boysCount = 0;
    let girlsCount = 0;

    lines.forEach((line) => {
      // Skip header rows (e.g. "S/N", "Learner Name", "Gender", "Marks", "Maths")
      if (/^(s\/n|sn|no|#|serial|learner|student|name|gender|sex|math|english|science|cts|ss|zambian|creative|expressive|ict|p.e|homed)/i.test(line) && !/\d/.test(line.replace(/^(s\/n|sn|no|#|\d+)/i, ''))) {
        return;
      }

      // 1. Strip leading sequence/serial numbers (e.g. "1.", "1)", "1-", "#1", "S/N 1", "01", "1\t", "1 ")
      let cleanLine = line.replace(/^(?:S\/N|SN|No|#)?\s*\d+[\.\)\-\:\s\t]+\s*/i, '').trim();
      
      // If regex didn't strip anything, but line starts with digits followed by whitespace and letters
      if (cleanLine === line.trim()) {
        cleanLine = line.replace(/^[0-9]+\s+/, '').trim();
      }

      if (!cleanLine) return;

      // 2. Extract parts separated by commas, tabs, semicolons, or pipes
      const rawParts = cleanLine.split(/[,;\t|]+/).map(p => p.trim()).filter(Boolean);

      // If rawParts[0] is still a standalone serial number digit (e.g. "1" from Excel columns) and there's a name part next, discard rawParts[0]
      if (rawParts.length > 1 && /^\d+$/.test(rawParts[0]) && /[a-zA-Z]/.test(rawParts[1])) {
        rawParts.shift();
      }

      let detectedGender: 'M' | 'F' | null = null;
      let learnerName = '';
      const rawMarkTokens: string[] = [];

      // Check tokens to extract Name, Gender, and Results
      if (rawParts.length > 1) {
        // Multi-part (CSV / Tab-delimited / Delimited)
        const nameParts: string[] = [];
        rawParts.forEach((p) => {
          const isGenderToken = /^(M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)$/i.test(p) ||
            /^\((M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)\)$/i.test(p) ||
            /^\[(M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)\]$/i.test(p);

          const isMarkToken = /^[0-9]+(\.[0-9]+)?$/i.test(p) || /^(A|ABS|absent|-)$/i.test(p);

          if (isGenderToken) {
            if (/^(F|Female|Girl|Girls|G|\(F\)|\(Female\)|\(Girl\)|\[F\])$/i.test(p)) {
              detectedGender = 'F';
            } else if (/^(M|Male|Boy|Boys|B|\(M\)|\(Male\)|\(Boy\)|\[M\])$/i.test(p)) {
              detectedGender = 'M';
            }
          } else if (isMarkToken) {
            rawMarkTokens.push(p);
          } else {
            nameParts.push(p);
          }
        });
        learnerName = nameParts.join(' ').trim();
      } else {
        // Single space-separated string (e.g. "John Phiri M 12 15 10")
        const words = cleanLine.split(/\s+/);
        const nameWords: string[] = [];
        words.forEach((w) => {
          const isGenderToken = /^(M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)$/i.test(w) ||
            /^\((M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)\)$/i.test(w) ||
            /^\[(M|F|Male|Female|Boy|Girl|Boys|Girls|B|G)\]$/i.test(w);

          const isMarkToken = /^[0-9]+(\.[0-9]+)?$/i.test(w) || /^(A|ABS|absent|-)$/i.test(w);

          if (isGenderToken) {
            if (/^(F|Female|Girl|Girls|G|\(F\)|\(Female\)|\(Girl\)|\[F\])$/i.test(w)) {
              detectedGender = 'F';
            } else if (/^(M|Male|Boy|Boys|B|\(M\)|\(Male\)|\(Boy\)|\[M\])$/i.test(w)) {
              detectedGender = 'M';
            }
          } else if (isMarkToken) {
            rawMarkTokens.push(w);
          } else {
            nameWords.push(w);
          }
        });
        learnerName = nameWords.join(' ').trim();
      }

      if (!learnerName) {
        return;
      }

      // 3. Route to Male (M) or Female (F)
      const targetGender = detectedGender || bulkTargetGender;

      if (targetGender === 'M' && boysIndex < 30) {
        const item = { ...updatedBoys[boysIndex], name: learnerName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        subjects.forEach((sub, sIdx) => {
          if (rawMarkTokens[sIdx] !== undefined) {
            const markVal = rawMarkTokens[sIdx];
            const isAbs = markVal.toUpperCase() === 'A' || markVal.toUpperCase() === 'ABS';
            newMarks[sub.id] = isAbs ? '' : markVal;
            newAbsent[sub.id] = isAbs;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedBoys[boysIndex] = item;
        boysIndex++;
        boysCount++;
      } else if (targetGender === 'F' && girlsIndex < 30) {
        const item = { ...updatedGirls[girlsIndex], name: learnerName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        subjects.forEach((sub, sIdx) => {
          if (rawMarkTokens[sIdx] !== undefined) {
            const markVal = rawMarkTokens[sIdx];
            const isAbs = markVal.toUpperCase() === 'A' || markVal.toUpperCase() === 'ABS';
            newMarks[sub.id] = isAbs ? '' : markVal;
            newAbsent[sub.id] = isAbs;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedGirls[girlsIndex] = item;
        girlsIndex++;
        girlsCount++;
      }
    });

    setBoys(updatedBoys);
    setGirls(updatedGirls);

    toast.success(`Populated learners & results! (${boysCount} Boys, ${girlsCount} Girls)`);
    setBulkText('');
    setShowBulkPaste(false);
  };

  // Handler for validated rows coming from the Real-Time BulkPasteValidationModal
  const handleApplyParsedLearners = (parsedRows: ParsedLearnerRow[]) => {
    const updatedBoys = [...boys];
    const updatedGirls = [...girls];

    let boysIndex = 0;
    let girlsIndex = 0;
    let boysCount = 0;
    let girlsCount = 0;

    parsedRows.forEach((row) => {
      const cleanName = row.name.trim();
      if (!cleanName) return;

      const targetGender = row.detectedGender;
      if (targetGender === 'M' && boysIndex < updatedBoys.length) {
        const item = { ...updatedBoys[boysIndex], name: cleanName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        row.marks.forEach((m) => {
          if (m.value !== '') {
            newMarks[m.subjectId] = m.isAbsent ? '' : m.value;
            newAbsent[m.subjectId] = m.isAbsent;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedBoys[boysIndex] = item;
        boysIndex++;
        boysCount++;
      } else if (targetGender === 'F' && girlsIndex < updatedGirls.length) {
        const item = { ...updatedGirls[girlsIndex], name: cleanName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        row.marks.forEach((m) => {
          if (m.value !== '') {
            newMarks[m.subjectId] = m.isAbsent ? '' : m.value;
            newAbsent[m.subjectId] = m.isAbsent;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedGirls[girlsIndex] = item;
        girlsIndex++;
        girlsCount++;
      }
    });

    setBoys(updatedBoys);
    setGirls(updatedGirls);
    setShowBulkPaste(false);
    setBulkText('');

    toast.success(`Successfully populated ${boysCount + girlsCount} learners (${boysCount} Boys, ${girlsCount} Girls) into assessment tables!`);
  };

  // Document Camera Scanner OCR completion handler
  const handleDocumentScanComplete = (result: ScanResult, rawTextFormatted: string) => {
    if (!result.success || !result.learners || result.learners.length === 0) {
      toast.error('No readable learners detected from scanned document.');
      return;
    }

    const updatedBoys = [...boys];
    const updatedGirls = [...girls];

    let boysIndex = 0;
    let girlsIndex = 0;
    let boysCount = 0;
    let girlsCount = 0;

    result.learners.forEach((learner) => {
      // Clean leading numbers in case any slipped through
      const cleanName = learner.name.replace(/^(?:S\/N|SN|No|#)?\s*\d+[\.\)\-\:\s\t]+\s*/i, '').trim() || learner.name.trim();
      if (!cleanName) return;

      const targetGender = learner.gender === 'F' ? 'F' : (learner.gender === 'M' ? 'M' : bulkTargetGender);
      const rawMarkTokens = Array.isArray(learner.marks) ? learner.marks : [];

      if (targetGender === 'M' && boysIndex < updatedBoys.length) {
        const item = { ...updatedBoys[boysIndex], name: cleanName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        subjects.forEach((sub, sIdx) => {
          if (rawMarkTokens[sIdx] !== undefined) {
            const markVal = String(rawMarkTokens[sIdx]).trim();
            const isAbs = markVal.toUpperCase() === 'A' || markVal.toUpperCase() === 'ABS';
            newMarks[sub.id] = isAbs ? '' : markVal;
            newAbsent[sub.id] = isAbs;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedBoys[boysIndex] = item;
        boysIndex++;
        boysCount++;
      } else if (targetGender === 'F' && girlsIndex < updatedGirls.length) {
        const item = { ...updatedGirls[girlsIndex], name: cleanName };
        const newMarks = { ...item.marks };
        const newAbsent = { ...item.isAbsent };

        subjects.forEach((sub, sIdx) => {
          if (rawMarkTokens[sIdx] !== undefined) {
            const markVal = String(rawMarkTokens[sIdx]).trim();
            const isAbs = markVal.toUpperCase() === 'A' || markVal.toUpperCase() === 'ABS';
            newMarks[sub.id] = isAbs ? '' : markVal;
            newAbsent[sub.id] = isAbs;
          }
        });

        item.marks = newMarks;
        item.isAbsent = newAbsent;
        updatedGirls[girlsIndex] = item;
        girlsIndex++;
        girlsCount++;
      }
    });

    setBoys(updatedBoys);
    setGirls(updatedGirls);
    setBulkText(rawTextFormatted);
    setShowBulkPaste(false);
    setShowCameraScanner(false);

    const reportMsg = `${result.totalLearners} pupil(s). Check the marks carefully, then Save.`;
    setPhotoExtractionReport({
      success: true,
      total: result.totalLearners,
      boys: boysCount,
      girls: girlsCount,
      message: reportMsg,
      warnings: result.warnings
    });

    toast.success(`Extracted from photo: ${result.totalLearners} pupils (${boysCount} Boys, ${girlsCount} Girls) populated directly into table!`, {
      duration: 6000,
      icon: '📸'
    });
  };

  // Handle Mark Change
  const handleMarkChange = (gender: 'M' | 'F', index: number, subjectId: string, val: string) => {
    const isAbs = val.trim().toUpperCase() === 'A' || val.trim().toUpperCase() === 'ABS';
    const target = gender === 'M' ? [...boys] : [...girls];
    const item = { ...target[index] };
    
    item.marks = { ...item.marks, [subjectId]: val };
    item.isAbsent = { ...item.isAbsent, [subjectId]: isAbs };

    target[index] = item;
    if (gender === 'M') setBoys(target);
    else setGirls(target);
  };

  // Handle "Out of" change for a subject
  const handleSubjectOutOfChange = (subjectId: string, newOutOf: number) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, outOf: Math.max(1, newOutOf) } : s));
  };

  // Calculations Engine
  const calculateLearnerStats = (learner: LearnerEntry) => {
    let totalRaw = 0;
    let totalMax = 0;
    let totalPercentageSum = 0;
    let subjectCount = 0;

    subjects.forEach(sub => {
      const rawVal = learner.marks[sub.id];
      const isAbs = learner.isAbsent?.[sub.id];

      if (rawVal !== undefined && rawVal !== '' && !isAbs) {
        const num = parseFloat(rawVal);
        if (!isNaN(num)) {
          const pct = (num / (sub.outOf || 25)) * 100;
          totalRaw += num;
          totalMax += sub.outOf || 25;
          totalPercentageSum += pct;
          subjectCount++;
        }
      }
    });

    const avgPct = subjectCount > 0 ? totalPercentageSum / subjectCount : 0;
    return {
      totalRaw,
      totalMax,
      totalPercentageSum,
      avgPct,
      subjectCount
    };
  };

  // Rank Class Positions
  const boyStats = useMemo(() => {
    return boys.map(b => ({
      learner: b,
      stats: calculateLearnerStats(b)
    }));
  }, [boys, subjects]);

  const girlStats = useMemo(() => {
    return girls.map(g => ({
      learner: g,
      stats: calculateLearnerStats(g)
    }));
  }, [girls, subjects]);

  // Rankings
  const getRankMap = (statsList: { learner: LearnerEntry; stats: ReturnType<typeof calculateLearnerStats> }[]) => {
    const activeList = statsList.filter(s => (s.learner.name.trim() !== '' || s.stats.subjectCount > 0) && s.stats.subjectCount > 0);
    const sorted = [...activeList].sort((a, b) => b.stats.avgPct - a.stats.avgPct);

    const rankMap: Record<string, number> = {};
    sorted.forEach((item, idx) => {
      rankMap[item.learner.id] = idx + 1;
    });
    return rankMap;
  };

  const boyRanks = useMemo(() => getRankMap(boyStats), [boyStats]);
  const girlRanks = useMemo(() => getRankMap(girlStats), [girlStats]);

  // Calculate Subject Level Rolls for a given cohort (Boys or Girls)
  const calculateSubjectRolls = (cohort: LearnerEntry[]) => {
    return subjects.map(sub => {
      let totalRaw = 0;
      let satCount = 0;
      let passCount = 0; // >= 40%
      let absentCount = 0;
      let passingPercentagesSum = 0;

      cohort.forEach(l => {
        const hasName = l.name.trim() !== '';
        const hasAnyMark = subjects.some(s => l.marks[s.id] !== undefined && l.marks[s.id] !== null && String(l.marks[s.id]).trim() !== '');
        if (!hasName && !hasAnyMark) return; // skip completely empty slots

        const rawVal = l.marks[sub.id];
        const rawStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim().toUpperCase() : '';
        const isExplicitAbs = l.isAbsent?.[sub.id] || rawStr === 'A' || rawStr === 'ABS';
        const hasValidMark = !isExplicitAbs && rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' && !isNaN(parseFloat(String(rawVal)));

        if (hasValidMark) {
          const num = parseFloat(String(rawVal));
          satCount++;
          totalRaw += num;
          const pct = (num / (sub.outOf || 25)) * 100;
          if (pct >= 40) {
            passCount++;
          }
          passingPercentagesSum += pct;
        } else {
          // Learner has no marks in this subject -> Learner was absent for this subject
          absentCount++;
        }
      });

      const avgRaw = satCount > 0 ? totalRaw / satCount : 0;
      const avgPct = satCount > 0 ? (avgRaw / (sub.outOf || 25)) * 100 : 0;
      const subjectMean = satCount > 0 ? passingPercentagesSum / satCount : 0;
      const passRatePct = satCount > 0 ? (passCount / satCount) * 100 : 0;

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        avgRaw,
        avgPct,
        subjectMean,
        passingPercentagesSum,
        satCount,
        passCount,
        absentCount,
        passRatePct
      };
    });
  };

  const boySubjectRolls = useMemo(() => calculateSubjectRolls(boys), [boys, subjects]);
  const girlSubjectRolls = useMemo(() => calculateSubjectRolls(girls), [girls, subjects]);

  // Overall Summary Metrics (Boys vs Girls, Attendance, Pass Rates)
  const summaryMetrics = useMemo(() => {
    const isLearnerActive = (l: LearnerEntry) => {
      if (l.name.trim() !== '') return true;
      return subjects.some(sub => {
        const rawVal = l.marks[sub.id];
        return rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
      });
    };

    // Active Learners Count (Enrolled in Sheet or with Marks)
    const activeBoys = boys.filter(isLearnerActive);
    const activeGirls = girls.filter(isLearnerActive);

    // Check if a learner is present in at least 1 subject (has marks recorded)
    const isLearnerPresentInAnySubject = (l: LearnerEntry) => {
      return subjects.some(sub => {
        const rawVal = l.marks[sub.id];
        const rawStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim().toUpperCase() : '';
        const isExplicitAbs = l.isAbsent?.[sub.id] || rawStr === 'A' || rawStr === 'ABS';
        return !isExplicitAbs && rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' && !isNaN(parseFloat(String(rawVal)));
      });
    };

    // Overall Average Pass Rate
    const boysAvgPassRate = boySubjectRolls.length > 0 
      ? boySubjectRolls.reduce((a, b) => a + b.passRatePct, 0) / boySubjectRolls.length 
      : 0;

    const girlsAvgPassRate = girlSubjectRolls.length > 0 
      ? girlSubjectRolls.reduce((a, b) => a + b.passRatePct, 0) / girlSubjectRolls.length 
      : 0;

    // Factual Learner Attendance Counts (from top inputs & sheet entries)
    const expectedBoys = totalBoysExpected || 30;
    const expectedGirls = totalGirlsExpected || 30;
    const expectedClassTotal = totalExpectedAttendance || (expectedBoys + expectedGirls);

    // Attendees: Count of registered learners in sheet who have marks recorded (present in learning/assessments)
    const boysAttendees = activeBoys.filter(isLearnerPresentInAnySubject).length;
    const girlsAttendees = activeGirls.filter(isLearnerPresentInAnySubject).length;
    const classTotalAttendees = boysAttendees + girlsAttendees;

    // Absentees: Factual difference between Total Expected Class Attendance entered at the top and actual attendees
    const boysAbsentees = Math.max(0, expectedBoys - boysAttendees);
    const girlsAbsentees = Math.max(0, expectedGirls - girlsAttendees);
    const classTotalAbsentees = Math.max(0, expectedClassTotal - classTotalAttendees);

    // Factual Attendance & Absenteeism percentages based on Total Expected Class Attendance entered at the top
    const boysAttendancePct = expectedBoys > 0 ? Math.min(100, (boysAttendees / expectedBoys) * 100) : 0;
    const girlsAttendancePct = expectedGirls > 0 ? Math.min(100, (girlsAttendees / expectedGirls) * 100) : 0;
    const classAttendancePct = expectedClassTotal > 0 ? Math.min(100, (classTotalAttendees / expectedClassTotal) * 100) : 0;

    const boysAbsenteeismPct = expectedBoys > 0 ? Math.min(100, (boysAbsentees / expectedBoys) * 100) : 0;
    const girlsAbsenteeismPct = expectedGirls > 0 ? Math.min(100, (girlsAbsentees / expectedGirls) * 100) : 0;
    const classAbsenteeismPct = expectedClassTotal > 0 ? Math.min(100, (classTotalAbsentees / expectedClassTotal) * 100) : 0;

    // Subject assessment seat stats
    const totalBoysSat = boySubjectRolls.reduce((a, b) => a + b.satCount, 0);
    const totalGirlsSat = girlSubjectRolls.reduce((a, b) => a + b.satCount, 0);
    const totalSat = totalBoysSat + totalGirlsSat;

    const totalBoysAbsent = boySubjectRolls.reduce((a, b) => a + b.absentCount, 0);
    const totalGirlsAbsent = girlSubjectRolls.reduce((a, b) => a + b.absentCount, 0);
    const totalAbsent = totalBoysAbsent + totalGirlsAbsent;

    // Identify weak and strong subjects
    const combinedSubjectPassRates = subjects.map((sub, idx) => {
      const bRoll = boySubjectRolls[idx];
      const gRoll = girlSubjectRolls[idx];
      const sat = (bRoll?.satCount || 0) + (gRoll?.satCount || 0);
      const pass = (bRoll?.passCount || 0) + (gRoll?.passCount || 0);
      const pct = sat > 0 ? (pass / sat) * 100 : 0;
      return { name: sub.name, pct, sat };
    });

    const sortedByPass = [...combinedSubjectPassRates].sort((a, b) => b.pct - a.pct);
    const topSubject = sortedByPass[0]?.name || 'Languages';
    const weakSubject = sortedByPass[sortedByPass.length - 1]?.name || 'Mathematics';

    return {
      activeBoysCount: activeBoys.length,
      activeGirlsCount: activeGirls.length,
      boysAvgPassRate,
      girlsAvgPassRate,
      combinedAvgPassRate: (boysAvgPassRate + girlsAvgPassRate) / (boysAvgPassRate > 0 && girlsAvgPassRate > 0 ? 2 : 1),
      expectedBoys,
      expectedGirls,
      expectedClassTotal,
      boysAttendees,
      girlsAttendees,
      classTotalAttendees,
      boysAbsentees,
      girlsAbsentees,
      classTotalAbsentees,
      boysAttendancePct,
      girlsAttendancePct,
      classAttendancePct,
      boysAbsenteeismPct,
      girlsAbsenteeismPct,
      classAbsenteeismPct,
      totalSat,
      totalAbsent,
      topSubject,
      weakSubject,
      combinedSubjectPassRates
    };
  }, [boys, girls, subjects, boySubjectRolls, girlSubjectRolls, totalBoysExpected, totalGirlsExpected, totalExpectedAttendance]);

  // Generate 2-sentence Professional AI Advice
  const generateTwoSentenceAdvice = () => {
    const { 
      weakSubject, 
      topSubject, 
      combinedAvgPassRate, 
      expectedClassTotal, 
      classTotalAttendees, 
      classTotalAbsentees, 
      classAbsenteeismPct 
    } = summaryMetrics;
    const passFormatted = Math.round(combinedAvgPassRate);
    
    let sentence1 = `Class overall performance stands at ${passFormatted}% pass rate, excelling in ${topSubject} while requiring urgent instructional remediation in ${weakSubject}.`;
    let sentence2 = `Out of ${expectedClassTotal} total expected class attendance, ${classTotalAttendees} learners attended regularly (${Math.round(100 - classAbsenteeismPct)}% attendance rate) while ${classTotalAbsentees} absentees (${Math.round(classAbsenteeismPct)}%) require targeted learner follow-up.`;

    return `${sentence1} ${sentence2}`;
  };

  const adviceText = customAdvice || generateTwoSentenceAdvice();

  // Download PDF Handler
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfExportTarget, setPdfExportTarget] = useState<PdfExportType>('active');
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showWordMenu, setShowWordMenu] = useState(false);

  const triggerInstantPrint = async (targetType: PdfExportType = 'active') => {
    document.body.classList.add('pdf-export-mode');
    setPdfExportTarget(targetType);
    setIsDownloadingPdf(true);
    setShowPdfMenu(false);
    setShowWordMenu(false);

    await new Promise(resolve => setTimeout(resolve, 250));

    try {
      window.print();
    } catch (e) {
      console.warn("Print error:", e);
    }

    setTimeout(() => {
      document.body.classList.remove('pdf-export-mode');
      setIsDownloadingPdf(false);
    }, 2500);
  };

  const handleDownloadPDF = async (targetType: PdfExportType = 'active') => {
    if (!checkDownloadAccess()) return;
    toast.success("To download a selectable PDF, please choose 'Save as PDF' in the print dialog.", { duration: 5000 });
    setTimeout(() => {
      triggerInstantPrint(targetType);
    }, 1500);
  };

  const handleDownloadWord = async (targetType: PdfExportType = 'active') => {
    if (!checkDownloadAccess()) return;
    setShowWordMenu(false);
    setShowPdfMenu(false);
    const toastId = toast.loading("Generating Microsoft Word (.doc) document...");

    try {
      const eff = targetType === 'active' ? activeTab : targetType;
      const cleanSchoolName = school.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'School';
      const cleanGrade = grade.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Grade';
      const cleanTerm = term.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Term';

      let docSuffix = 'Assessment_Record';
      if (eff === 'boys') docSuffix = 'Boys_Assessment_Sheet';
      else if (eff === 'girls') docSuffix = 'Girls_Assessment_Sheet';
      else if (eff === 'summary') docSuffix = 'Class_Performance_Summary';
      else if (eff === 'progress_chart') docSuffix = 'Learner_Progress_Chart';
      else if (eff === 'school_summary') docSuffix = 'School_Performance_Summary';
      else if (eff === 'report_cards') docSuffix = 'Learner_Report_Cards';
      else if (eff === 'all') docSuffix = 'Complete_Assessment_Suite';

      const fileName = `${cleanSchoolName}_${cleanGrade}_${cleanTerm}_${docSuffix}.doc`;

      const renderWordHeader = (title: string, subtitle?: string) => `
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #032532; padding-bottom: 8px;">
          <div style="font-size: 9pt; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL ACADEMIC PERFORMANCE RECORD</div>
          <h1 style="font-size: 16pt; color: #032532; margin: 4px 0; font-weight: bold; text-transform: uppercase;">${school || 'CHINIKA SECONDARY SCHOOL'}</h1>
          <div style="font-size: 10pt; color: #047857; font-weight: bold; text-transform: uppercase;">DISTRICT: ${district || 'LUSAKA DISTRICT'} | GRADE: ${cleanGradeDisplay} | TERM: ${cleanTermDisplay} | YEAR: ${year}</div>
          ${title ? `<div style="font-size: 12pt; color: #0f172a; font-weight: bold; margin-top: 4px; text-transform: uppercase;">${title}</div>` : ''}
          ${subtitle ? `<div style="font-size: 9pt; color: #475569; font-style: italic;">${subtitle}</div>` : ''}
          ${(teacherName || teacherPhone) ? `<div style="font-size: 9pt; color: #032532; font-weight: bold; margin-top: 4px;">CLASS TEACHER: ${teacherName || 'NOT SPECIFIED'} | PHONE: ${teacherPhone || 'N/A'}</div>` : ''}
        </div>
      `;

      const renderCohortWordTable = (cohortType: 'M' | 'F', list: LearnerEntry[], titleStr: string) => {
        const isBoys = cohortType === 'M';
        const rolls = isBoys ? boySubjectRolls : girlSubjectRolls;

        return `
          ${renderWordHeader(titleStr, `Total Enrolled: ${list.length} Learners`)}
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold;">
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px; width: 25px;">Sn</th>
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px; text-align: left; min-width: 130px;">Learner's Name</th>
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px; width: 25px;">Sex</th>
                ${subjects.map(sub => `
                  <th colspan="2" style="border: 1px solid #334155; padding: 5px;">
                    <div>${sub.name}</div>
                    <div style="font-size: 7pt; font-weight: normal; color: #cbd5e1;">OUT OF ${sub.outOf || 25}</div>
                  </th>
                `).join('')}
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px;">Total Raw</th>
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px;">Avg %</th>
                <th rowspan="2" style="border: 1px solid #334155; padding: 5px;">Class Position</th>
              </tr>
              <tr style="background-color: #1e293b; color: #ffffff; text-align: center; font-weight: bold; font-size: 7.5pt;">
                ${subjects.map(() => `
                  <th style="border: 1px solid #334155; padding: 3px;">Raw</th>
                  <th style="border: 1px solid #334155; padding: 3px; color: #34d399;">%</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${list.map((learner, idx) => {
                const stats = calculateLearnerStats(learner);
                const rank = isBoys ? (boyRanks[learner.id] || '-') : (girlRanks[learner.id] || '-');
                return `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
                    <td style="border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; font-weight: bold;">${learner.name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px;">${learner.gender}</td>
                    ${subjects.map(sub => {
                      const rawVal = learner.marks[sub.id] !== undefined && learner.marks[sub.id] !== null ? String(learner.marks[sub.id]) : '';
                      const rawStr = rawVal.trim().toUpperCase();
                      const isAbs = learner.isAbsent?.[sub.id] || rawStr === 'A' || rawStr === 'ABS';
                      const hasValidMark = !isAbs && rawVal !== '' && !isNaN(parseFloat(rawVal));

                      let rawCell = '-';
                      let pctCell = '-';
                      if (isAbs) {
                        rawCell = 'ABS';
                        pctCell = 'ABS';
                      } else if (hasValidMark) {
                        const num = parseFloat(rawVal);
                        const pct = Math.round((num / (sub.outOf || 25)) * 100);
                        rawCell = String(num);
                        pctCell = `${pct}%`;
                      }

                      return `
                        <td style="border: 1px solid #cbd5e1; padding: 4px;">${rawCell}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #047857; background-color: #f0fdf4;">${pctCell}</td>
                      `;
                    }).join('')}
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; background-color: #f1f5f9;">${stats.totalRaw}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; background-color: #f1f5f9;">${stats.subjectCount > 0 ? Math.round(stats.avgPct) + '%' : '-'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold;">${rank}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; text-align: right;">Roll 1: Total Marks in (%) (40% to 100%)</td>
                ${subjects.map((sub, sIdx) => {
                  const roll = rolls[sIdx];
                  return `<td colspan="2" style="border: 1px solid #94a3b8; padding: 5px;">${roll?.passingPercentagesSum ? Math.round(roll.passingPercentagesSum) : '0'}%</td>`;
                }).join('')}
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; background-color: #cbd5e1;">Total Passing % Sum</td>
              </tr>
              <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; text-align: right;">Roll 2: Subject Mean in Percentage (%)</td>
                ${subjects.map((sub, sIdx) => {
                  const roll = rolls[sIdx];
                  return `<td colspan="2" style="border: 1px solid #94a3b8; padding: 5px; color: #1e40af;">${Math.round(roll?.subjectMean || 0)}%</td>`;
                }).join('')}
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; background-color: #cbd5e1;">Subject Mean %</td>
              </tr>
              <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; text-align: right;">Roll 3: Subject Pass Rate (%)</td>
                ${subjects.map((sub, sIdx) => {
                  const roll = rolls[sIdx];
                  return `<td colspan="2" style="border: 1px solid #94a3b8; padding: 5px; color: #065f46;">${Math.round(roll?.passRatePct || 0)}%</td>`;
                }).join('')}
                <td colspan="3" style="border: 1px solid #94a3b8; padding: 5px; background-color: #cbd5e1;">Pass Rate %</td>
              </tr>
            </tfoot>
          </table>
        `;
      };

      const renderSummaryWordSheet = () => {
        return `
          ${renderWordHeader("CLASS PERFORMANCE SUMMARY & ATTENDANCE ANALYSIS", "PAGE 1 OF 2 — Factual Class Attendance & Absentees Analysis")}
          
          <div style="font-size: 13pt; font-weight: bold; margin-bottom: 10px; color: #0f172a; text-transform: uppercase;">
            1. Factual Class Attendance & Absentees Analysis
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold;">
                <th style="border: 1px solid #334155; padding: 8px; text-align: left;">Learner Cohort</th>
                <th style="border: 1px solid #334155; padding: 8px;">Expected Attendance</th>
                <th style="border: 1px solid #334155; padding: 8px;">Attendees (Present)</th>
                <th style="border: 1px solid #334155; padding: 8px;">Absentees (Absent)</th>
                <th style="border: 1px solid #334155; padding: 8px;">Attendance Rate %</th>
                <th style="border: 1px solid #334155; padding: 8px;">Absenteeism Rate %</th>
              </tr>
            </thead>
            <tbody style="font-weight: bold; text-align: center;">
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #1e40af;">Boys Cohort</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.expectedBoys}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; color: #047857;">${summaryMetrics.boysAttendees}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; color: #9d174d;">${summaryMetrics.boysAbsentees}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.boysAttendancePct.toFixed(1)}%</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.boysAbsenteeismPct.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #9d174d;">Girls Cohort</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.expectedGirls}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; color: #047857;">${summaryMetrics.girlsAttendees}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; color: #9d174d;">${summaryMetrics.girlsAbsentees}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.girlsAttendancePct.toFixed(1)}%</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${summaryMetrics.girlsAbsenteeismPct.toFixed(1)}%</td>
              </tr>
              <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td style="border: 1px solid #94a3b8; padding: 8px; text-align: left;">Combined Class Total</td>
                <td style="border: 1px solid #94a3b8; padding: 8px;">${summaryMetrics.expectedClassTotal}</td>
                <td style="border: 1px solid #94a3b8; padding: 8px; color: #047857;">${summaryMetrics.classTotalAttendees}</td>
                <td style="border: 1px solid #94a3b8; padding: 8px; color: #9d174d;">${summaryMetrics.classTotalAbsentees}</td>
                <td style="border: 1px solid #94a3b8; padding: 8px; color: #047857;">${summaryMetrics.classAttendancePct.toFixed(1)}%</td>
                <td style="border: 1px solid #94a3b8; padding: 8px; color: #9d174d;">${summaryMetrics.classAbsenteeismPct.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>

          <br style="page-break-after: always;" />

          ${renderWordHeader("CLASS PERFORMANCE SUMMARY SHEET", "PAGE 2 OF 2 — Subject-by-Subject Pass Rates & Attendance Breakdown")}
          
          <div style="font-size: 13pt; font-weight: bold; margin-bottom: 10px; color: #0f172a; text-transform: uppercase;">
            2. Subject-by-Subject Pass Rates & Attendance Breakdown
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold;">
                <th style="border: 1px solid #334155; padding: 8px; width: 40px;">Sn</th>
                <th style="border: 1px solid #334155; padding: 8px; text-align: left;">Assessed Subject</th>
                <th style="border: 1px solid #334155; padding: 8px;">Total Sat</th>
                <th style="border: 1px solid #334155; padding: 8px;">Boys Mean %</th>
                <th style="border: 1px solid #334155; padding: 8px;">Girls Mean %</th>
                <th style="border: 1px solid #334155; padding: 8px;">Combined Mean %</th>
                <th style="border: 1px solid #334155; padding: 8px;">Pass Rate %</th>
              </tr>
            </thead>
            <tbody>
              ${activeExportSubjects.map((sub, sIdx) => {
                const idx = subjects.findIndex(s => s.id === sub.id);
                const bRoll = boySubjectRolls[idx];
                const gRoll = girlSubjectRolls[idx];
                const sat = (bRoll?.satCount || 0) + (gRoll?.satCount || 0);
                const pass = (bRoll?.passCount || 0) + (gRoll?.passCount || 0);
                const combPassRate = sat > 0 ? (pass / sat) * 100 : 0;
                
                // Calculate combined mean
                const totalPassingPct = (bRoll?.passingPercentagesSum || 0) + (gRoll?.passingPercentagesSum || 0);
                const combinedMean = sat > 0 ? totalPassingPct / sat : 0;

                return `
                  <tr style="background-color: ${sIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${sIdx + 1}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: bold;">${sub.name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${sat}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; color: #1e40af;">${Math.round(bRoll?.subjectMean || 0)}%</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; color: #9d174d;">${Math.round(gRoll?.subjectMean || 0)}%</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #4338ca;">${Math.round(combinedMean)}%</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #047857; background-color: #ecfdf4;">${Math.round(combPassRate)}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px;">
            <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 12.5pt; font-weight: bold; text-transform: uppercase;">
              3. Professional Pedagogical Advice (Way Forward)
            </h3>
            <p style="font-size: 12pt; margin: 0; line-height: 1.5; font-style: italic;">"${adviceText}"</p>
          </div>
        `;
      };

      const renderProgressWordChart = () => {
        const t1Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_1_${year}`;
        const t2Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_2_${year}`;
        const t3Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_3_${year}`;

        const recT1 = savedRecords[t1Key];
        const recT2 = savedRecords[t2Key];
        const recT3 = savedRecords[t3Key];

        const getTermMark = (rec: ClassAssessmentRecord | undefined, learner: LearnerEntry, subId: string) => {
          if (!rec) {
            if (term === 'Term 1' && recT1 === undefined) return learner.marks[subId] ?? null;
            return null;
          }
          const pool = learner.gender === 'M' ? rec.boys : rec.girls;
          const found = pool.find(l => l.name.toLowerCase().trim() === learner.name.toLowerCase().trim());
          return found?.marks[subId] ?? null;
        };

        const activeBoysList = boys.filter(b => b.name.trim() !== '');
        const activeGirlsList = girls.filter(g => g.name.trim() !== '');
        const allActiveLearners = [...activeBoysList, ...activeGirlsList];

        return `
          ${renderWordHeader("LEARNER CUMULATIVE PROGRESS CHART (TERM 1 TO TERM 3)", "Single-Subject Multi-Term Assessment Tracking")}
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold;">
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">Sn</th>
                <th style="border: 1px solid #334155; padding: 5px; text-align: left;" rowspan="2">Learner's Name</th>
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">Sex</th>
                ${subjects.map(s => `
                  <th style="border: 1px solid #334155; padding: 5px; background-color: #1e293b;" colspan="4">${s.name}</th>
                `).join('')}
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">OVERALL TOTAL</th>
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">AVG %</th>
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">PASS %</th>
                <th style="border: 1px solid #334155; padding: 5px;" rowspan="2">POSITION</th>
              </tr>
              <tr style="background-color: #1e293b; color: #ffffff; text-align: center; font-size: 7.5pt;">
                ${subjects.map(() => `
                  <th style="border: 1px solid #334155; padding: 3px; color: #93c5fd;">T1</th>
                  <th style="border: 1px solid #334155; padding: 3px; color: #6ee7b7;">T2</th>
                  <th style="border: 1px solid #334155; padding: 3px; color: #c084fc;">T3</th>
                  <th style="border: 1px solid #334155; padding: 3px; color: #fde047;">AVG %</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${allActiveLearners.map((learner, idx) => {
                let overallLearnerSum = 0;
                let totalPossibleMarks = 0;
                let passedSubjectsCount = 0;
                let testedSubjectsCount = 0;

                const rank = learner.gender === 'M' ? (boyRanks[learner.id] || '-') : (girlRanks[learner.id] || '-');

                return `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
                    <td style="border: 1px solid #cbd5e1; padding: 4px;">${idx + 1}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; font-weight: bold;">${learner.name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px;">${learner.gender}</td>
                    ${subjects.map(sub => {
                      const m1 = getTermMark(recT1, learner, sub.id);
                      const m2 = getTermMark(recT2, learner, sub.id);
                      const m3 = getTermMark(recT3, learner, sub.id);

                      const n1 = m1 !== null && m1 !== '' && !isNaN(Number(m1)) ? Number(m1) : null;
                      const n2 = m2 !== null && m2 !== '' && !isNaN(Number(m2)) ? Number(m2) : null;
                      const n3 = m3 !== null && m3 !== '' && !isNaN(Number(m3)) ? Number(m3) : null;

                      const maxPerTerm = sub.outOf || 25;
                      const p1 = n1 !== null ? Math.round((n1 / maxPerTerm) * 100) : null;
                      const p2 = n2 !== null ? Math.round((n2 / maxPerTerm) * 100) : null;
                      const p3 = n3 !== null ? Math.round((n3 / maxPerTerm) * 100) : null;

                      const subTotal = (n1 ?? 0) + (n2 ?? 0) + (n3 ?? 0);
                      let subMax = 0;
                      if (n1 !== null) subMax += maxPerTerm;
                      if (n2 !== null) subMax += maxPerTerm;
                      if (n3 !== null) subMax += maxPerTerm;

                      overallLearnerSum += subTotal;
                      totalPossibleMarks += subMax;

                      if (subMax > 0) {
                        testedSubjectsCount++;
                        if ((subTotal / subMax) >= 0.40) passedSubjectsCount++;
                      }

                      const subAvgPct = subMax > 0 ? Math.round((subTotal / subMax) * 100) : null;

                      return `
                        <td style="border: 1px solid #cbd5e1; padding: 4px; background-color: #eff6ff;">${p1 !== null ? `${p1}%` : '-'}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px; background-color: #ecfdf5;">${p2 !== null ? `${p2}%` : '-'}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px; background-color: #faf5ff;">${p3 !== null ? `${p3}%` : '-'}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; background-color: #fffbeb;">${subAvgPct !== null ? `${subAvgPct}%` : '-'}</td>
                      `;
                    }).join('')}
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; background-color: #f1f5f9;">${overallLearnerSum}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold;">${totalPossibleMarks > 0 ? Math.round((overallLearnerSum / totalPossibleMarks) * 100) + '%' : '-'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold; color: #065f46;">${testedSubjectsCount > 0 ? Math.round((passedSubjectsCount / testedSubjectsCount) * 100) + '%' : '-'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 4px; font-weight: bold;">${rank}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      };

      const renderReportCardsWord = () => {
        const activeBoysList = boys.filter(b => b.name.trim() !== '');
        const activeGirlsList = girls.filter(g => g.name.trim() !== '');
        const allActiveLearners = [...activeBoysList, ...activeGirlsList];

        return `
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="font-size: 18pt; color: #0f172a; margin: 0; text-transform: uppercase; font-weight: 800;">LEARNER OFFICIAL TERMINAL REPORT CARDS</h2>
            <div style="font-size: 11pt; color: #475569; font-weight: bold; margin-top: 4px;">Total Statements Generated: ${allActiveLearners.length}</div>
          </div>
          ${allActiveLearners.map((learner) => {
            const stats = calculateLearnerStats(learner);
            const rank = learner.gender === 'M' ? (boyRanks[learner.id] || '-') : (girlRanks[learner.id] || '-');

            return `
              <div style="border: 1.5px solid #0f172a; padding: 12px 14px; margin-bottom: 20px; page-break-after: always; background-color: #ffffff; border-radius: 6px;">
                <!-- Official Header on each report card -->
                <div style="text-align: center; border-bottom: 1.5px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px;">
                  <div style="font-size: 8.5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">OFFICIAL TERMINAL REPORT CARD</div>
                  <h1 style="font-size: 13pt; color: #032532; margin: 2px 0; font-weight: 900; text-transform: uppercase; letter-spacing: -0.3px;">${school || 'CHINIKA SECONDARY SCHOOL'}</h1>
                  <div style="font-size: 9pt; color: #047857; font-weight: 800; text-transform: uppercase; margin-top: 2px;">
                    DISTRICT: ${district || 'LUSAKA DISTRICT'} | GRADE: ${cleanGradeDisplay} | TERM: ${cleanTermDisplay} | YEAR: ${year}
                  </div>
                  ${(teacherName || teacherPhone) ? `<div style="font-size: 8.5pt; color: #032532; font-weight: 800; margin-top: 3px;">CLASS TEACHER: ${teacherName || 'NOT SPECIFIED'} | PHONE: ${teacherPhone || 'N/A'}</div>` : ''}
                </div>

                <!-- Learner Name & Details Banner -->
                <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 10px; margin-bottom: 8px; border-radius: 4px;">
                  <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Learner's Name:</div>
                  <h2 style="font-size: 12pt; color: #0f172a; margin: 2px 0 4px 0; font-weight: 900;">${learner.name}</h2>
                  <div style="font-size: 8.5pt; font-weight: 800; color: #1e293b; border-top: 1px dashed #cbd5e1; padding-top: 3px; margin-top: 3px;">
                    SEX: ${learner.gender === 'M' ? 'BOY' : 'GIRL'} &nbsp;|&nbsp; CLASS POSITION: ${rank} &nbsp;|&nbsp; AVERAGE SCORE: ${Math.round(stats.avgPct)}% &nbsp;|&nbsp; STATUS: <span style="color: ${stats.avgPct >= 40 ? '#047857' : '#b91c1c'}">${stats.avgPct >= 40 ? 'PROMOTED / SATISFACTORY' : 'NEEDS IMPROVEMENT'}</span>
                  </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-size: 8.5pt; margin-bottom: 8px;">
                  <thead>
                    <tr style="background-color: #0f172a; color: #ffffff; font-weight: 900; text-align: center; font-size: 8.5pt;">
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; text-align: left;">Subject</th>
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; width: 70px;">Score</th>
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; width: 70px;">Out Of</th>
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; width: 80px;">% Mark</th>
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; width: 70px;">Grade</th>
                      <th style="border: 1px solid #0f172a; padding: 4px 6px; width: 130px;">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subjects.map(sub => {
                      const raw = learner.marks[sub.id];
                      const val = raw !== undefined && raw !== null && raw !== '' ? Number(raw) : null;
                      const pct = val !== null ? Math.round((val / (sub.outOf || 25)) * 100) : 0;
                      const { grade: gVal, desc: gDesc } = getEczCbcGrade(val !== null ? pct : null);

                      return `
                        <tr style="text-align: center; border-bottom: 1px solid #e2e8f0;">
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; text-align: left; font-weight: 800; font-size: 8.5pt; color: #0f172a;">${sub.name}</td>
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 900; font-size: 8.5pt; color: #0f172a;">${val !== null ? val : '-'}</td>
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; color: #475569; font-weight: bold;">${sub.outOf || 25}</td>
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 900; font-size: 8.5pt; color: #0f172a;">${val !== null ? pct + '%' : '-'}</td>
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 900; font-size: 9pt; color: #1e3a8a;">${gVal}</td>
                          <td style="border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 900; text-transform: uppercase; font-size: 8pt; color: #032532;">${gDesc}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>

                <!-- ECZ CBC Grading System Legend -->
                <div style="margin-top: 8px; padding: 6px 8px; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; font-size: 7.5pt; color: #064e3b; line-height: 1.25;">
                  <div style="text-align: center; font-weight: 900; margin-bottom: 3px; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.3px;">
                    EXAMINATIONS COUNCIL OF ZAMBIA &mdash; COMPETENCE BASED CURRICULUM (CBC) GRADING SYSTEM
                  </div>
                  <table style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 4px; font-size: 7.5pt; background-color: #ffffff;">
                    <thead style="background-color: #166534; color: #ffffff; font-weight: 900;">
                      <tr>
                        <th style="border: 1px solid #15803d; padding: 2px 4px;">SCORE</th>
                        <th style="border: 1px solid #15803d; padding: 2px 4px;">GRADE</th>
                        <th style="border: 1px solid #15803d; padding: 2px 4px;">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style="border: 1px solid #bbf7d0; padding: 2px 4px;">70 - 100</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900;">1</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900; color: #064e3b; text-transform: uppercase;">Outstanding</td></tr>
                      <tr><td style="border: 1px solid #bbf7d0; padding: 2px 4px;">60 - 69</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900;">2</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900; color: #14532d; text-transform: uppercase;">Advanced</td></tr>
                      <tr><td style="border: 1px solid #bbf7d0; padding: 2px 4px;">50 - 59</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900;">3</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900; color: #1e3a8a; text-transform: uppercase;">Basic</td></tr>
                      <tr><td style="border: 1px solid #bbf7d0; padding: 2px 4px;">40 - 49</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900;">4</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900; color: #78350f; text-transform: uppercase;">Satisfactory</td></tr>
                      <tr><td style="border: 1px solid #bbf7d0; padding: 2px 4px;">00 - 39</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900;">5</td><td style="border: 1px solid #bbf7d0; padding: 2px 4px; font-weight: 900; color: #881337; text-transform: uppercase;">Unsatisfactory</td></tr>
                    </tbody>
                  </table>
                  <div style="font-size: 7.5pt; line-height: 1.2; border-top: 1px solid #bbf7d0; padding-top: 3px; color: #064e3b; font-weight: bold;">
                    This result statement represents the ${getGradeCategory(grade) === 'upper_primary' ? 'upper primary' : 'lower primary'} education and each learner is given proof of their class term performance. Parents are hereby encouraged to support their child/children where seemed not performing well.
                  </div>
                </div>

                <!-- Class Teacher's Remarks and Headteacher's Remarks -->
                <div style="margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8.5pt; line-height: 1.25;">
                  <div style="margin-bottom: 6px;">
                    <div style="font-weight: 900; color: #0f172a; text-transform: uppercase; font-size: 8.5pt;">Class Teacher's Remarks:</div>
                    <div style="border-bottom: 1px dotted #64748b; margin-top: 10px; height: 1px; width: 100%;"></div>
                    <table style="width: 100%; margin-top: 6px; font-weight: 800; color: #334155; font-size: 8pt; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: left; width: 60%;"><span style="white-space: nowrap;">Signature:</span> <span style="display: inline-block; width: 75%; border-bottom: 1px dotted #64748b;">&nbsp;</span></td>
                        <td style="text-align: right; width: 40%;"><span style="white-space: nowrap;">Date:</span> <span style="display: inline-block; width: 70%; border-bottom: 1px dotted #64748b;">&nbsp;</span></td>
                      </tr>
                    </table>
                  </div>

                  <div style="margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
                    <div style="font-weight: 900; color: #0f172a; text-transform: uppercase; font-size: 8.5pt;">Headteacher's Remarks:</div>
                    <div style="border-bottom: 1px dotted #64748b; margin-top: 10px; height: 1px; width: 100%;"></div>
                    <table style="width: 100%; margin-top: 6px; font-weight: 800; color: #334155; font-size: 8pt; border-collapse: collapse;">
                      <tr>
                        <td style="text-align: left; width: 60%;"><span style="white-space: nowrap;">Signature:</span> <span style="display: inline-block; width: 75%; border-bottom: 1px dotted #64748b;">&nbsp;</span></td>
                        <td style="text-align: right; width: 40%;"><span style="white-space: nowrap;">Date:</span> <span style="display: inline-block; width: 70%; border-bottom: 1px dotted #64748b;">&nbsp;</span></td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        `;
      };

      const renderSchoolSummaryWordSheet = () => {
        const metrics = calculateSchoolSummaryMetrics(schoolSummaryScores);
        const lowerGrades = SCHOOL_GRADES.filter(g => g.section === 'Lower Primary');
        const upperGrades = SCHOOL_GRADES.filter(g => g.section === 'Upper Primary');

        return `
          ${renderWordHeader("SCHOOL PERFORMANCE SUMMARY SHEET (ECE LEVEL 1 TO GRADE 7)", "Categorized Institutional Subject Performance Analysis")}

          <div style="background-color: #0f172a; color: #ffffff; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
            <table style="width: 100%; text-align: center; color: #ffffff; font-size: 9pt;">
              <tr>
                <td style="padding: 6px; border: 1px solid #334155;">
                  <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">OVERALL SCHOOL MEAN</div>
                  <div style="font-size: 14pt; font-weight: bold; color: #34d399;">${metrics.overallSchoolMean !== null ? Math.round(metrics.overallSchoolMean) + '%' : ''}</div>
                </td>
                <td style="padding: 6px; border: 1px solid #334155;">
                  <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">LOWER PRIMARY MEAN (ECE-G3)</div>
                  <div style="font-size: 14pt; font-weight: bold; color: #60a5fa;">${metrics.lowerPrimaryMean !== null ? Math.round(metrics.lowerPrimaryMean) + '%' : ''}</div>
                </td>
                <td style="padding: 6px; border: 1px solid #334155;">
                  <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">UPPER PRIMARY MEAN (G4-G7)</div>
                  <div style="font-size: 14pt; font-weight: bold; color: #f59e0b;">${metrics.upperPrimaryMean !== null ? Math.round(metrics.upperPrimaryMean) + '%' : ''}</div>
                </td>
              </tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold;">
                <th style="border: 1px solid #334155; padding: 6px; text-align: left;">Grade Level</th>
                <th style="border: 1px solid #334155; padding: 6px;">Section</th>
                ${SCHOOL_SUMMARY_SUBJECTS.map(s => `
                  <th style="border: 1px solid #334155; padding: 6px;">${s.shortName}</th>
                `).join('')}
                <th style="border: 1px solid #334155; padding: 6px; background-color: #1e293b;">GRADE MEAN</th>
              </tr>
            </thead>
            <tbody>
              <!-- Lower Primary Header -->
              <tr style="background-color: #0284c7; color: #ffffff; font-weight: bold;">
                <td colspan="${SCHOOL_SUMMARY_SUBJECTS.length + 3}" style="padding: 5px 8px; font-size: 8pt; text-transform: uppercase;">
                  LOWER PRIMARY SCHOOL SECTION (ECE LEVEL 1 TO GRADE 3)
                </td>
              </tr>
              ${lowerGrades.map((g, idx) => {
                const rowScores = schoolSummaryScores[g.id] || {};
                const rowMean = metrics.gradeMeans[g.id];
                return `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: left; font-weight: bold;">${g.name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 5px; color: #64748b;">${g.section}</td>
                    ${SCHOOL_SUMMARY_SUBJECTS.map(s => {
                      if (!isSubjectApplicableToGrade(g.id, s.id)) {
                        return `<td style="border: 1px solid #cbd5e1; padding: 5px; background-color: #f1f5f9; color: #94a3b8; font-size: 7.5pt; font-weight: bold;">N/A</td>`;
                      }
                      const val = rowScores[s.id];
                      return `<td style="border: 1px solid #cbd5e1; padding: 5px;">${val !== undefined && val !== null && val.trim() !== '' ? val + '%' : ''}</td>`;
                    }).join('')}
                    <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; background-color: #e0f2fe; color: #0369a1;">${rowMean !== null ? Math.round(rowMean) + '%' : ''}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="background-color: #e0f2fe; font-weight: bold; text-align: center;">
                <td colspan="2" style="border: 1px solid #93c5fd; padding: 6px; text-align: right; color: #0369a1;">LOWER PRIMARY MEAN (ECE-G3):</td>
                ${SCHOOL_SUMMARY_SUBJECTS.map(s => {
                  if (!isSubjectApplicableToGrade('g1', s.id)) {
                    return `<td style="border: 1px solid #93c5fd; padding: 6px; color: #94a3b8; background-color: #f1f5f9; font-size: 7.5pt;">N/A</td>`;
                  }
                  let sum = 0; let count = 0;
                  lowerGrades.forEach(g => {
                    const v = schoolSummaryScores[g.id]?.[s.id];
                    if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                      sum += Number(v); count++;
                    }
                  });
                  return `<td style="border: 1px solid #93c5fd; padding: 6px; color: #0369a1;">${count > 0 ? Math.round(sum / count) + '%' : ''}</td>`;
                }).join('')}
                <td style="border: 1px solid #93c5fd; padding: 6px; background-color: #0284c7; color: #ffffff;">${metrics.lowerPrimaryMean !== null ? Math.round(metrics.lowerPrimaryMean) + '%' : ''}</td>
              </tr>

              <!-- Upper Primary Header -->
              <tr style="background-color: #1e40af; color: #ffffff; font-weight: bold;">
                <td colspan="${SCHOOL_SUMMARY_SUBJECTS.length + 3}" style="padding: 5px 8px; font-size: 8pt; text-transform: uppercase;">
                  UPPER PRIMARY SCHOOL SECTION (GRADE 4 TO GRADE 7)
                </td>
              </tr>
              ${upperGrades.map((g, idx) => {
                const rowScores = schoolSummaryScores[g.id] || {};
                const rowMean = metrics.gradeMeans[g.id];
                return `
                  <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; text-align: center;">
                    <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: left; font-weight: bold;">${g.name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 5px; color: #64748b;">${g.section}</td>
                    ${SCHOOL_SUMMARY_SUBJECTS.map(s => {
                      if (!isSubjectApplicableToGrade(g.id, s.id)) {
                        return `<td style="border: 1px solid #cbd5e1; padding: 5px; background-color: #f1f5f9; color: #94a3b8; font-size: 7.5pt; font-weight: bold;">N/A</td>`;
                      }
                      const val = rowScores[s.id];
                      return `<td style="border: 1px solid #cbd5e1; padding: 5px;">${val !== undefined && val !== null && val.trim() !== '' ? val + '%' : ''}</td>`;
                    }).join('')}
                    <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; background-color: #dbeafe; color: #1e40af;">${rowMean !== null ? Math.round(rowMean) + '%' : ''}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="background-color: #dbeafe; font-weight: bold; text-align: center;">
                <td colspan="2" style="border: 1px solid #93c5fd; padding: 6px; text-align: right; color: #1e40af;">UPPER PRIMARY MEAN (G4-G7):</td>
                ${SCHOOL_SUMMARY_SUBJECTS.map(s => {
                  if (!isSubjectApplicableToGrade('g4', s.id)) {
                    return `<td style="border: 1px solid #93c5fd; padding: 6px; color: #94a3b8; background-color: #f1f5f9; font-size: 7.5pt;">N/A</td>`;
                  }
                  let sum = 0; let count = 0;
                  upperGrades.forEach(g => {
                    const v = schoolSummaryScores[g.id]?.[s.id];
                    if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                      sum += Number(v); count++;
                    }
                  });
                  return `<td style="border: 1px solid #93c5fd; padding: 6px; color: #1e40af;">${count > 0 ? Math.round(sum / count) + '%' : ''}</td>`;
                }).join('')}
                <td style="border: 1px solid #93c5fd; padding: 6px; background-color: #1e40af; color: #ffffff;">${metrics.upperPrimaryMean !== null ? Math.round(metrics.upperPrimaryMean) + '%' : ''}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; font-size: 9pt;">
                <td colspan="2" style="border: 1px solid #334155; padding: 8px; text-align: right;">OVERALL SCHOOL MEAN (%):</td>
                ${SCHOOL_SUMMARY_SUBJECTS.map(s => {
                  const sm = metrics.subjectMeans[s.id];
                  return `<td style="border: 1px solid #334155; padding: 8px; color: #34d399;">${sm !== null ? Math.round(sm) + '%' : ''}</td>`;
                }).join('')}
                <td style="border: 1px solid #334155; padding: 8px; background-color: #059669; color: #ffffff; font-size: 10pt;">${metrics.overallSchoolMean !== null ? Math.round(metrics.overallSchoolMean) + '%' : ''}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 25px; font-size: 9pt;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 100%; vertical-align: top;">
                  <div style="font-weight: bold; color: #0f172a;">HEADTEACHER'S REMARKS:</div>
                  <div style="border-bottom: 1px dotted #64748b; margin-top: 15px; height: 1px; width: 100%;"></div>
                  <div style="margin-top: 15px; font-weight: bold; width: 100%;"><span style="white-space: nowrap;">Signature:</span> <span style="display: inline-block; width: 250px; border-bottom: 1px dotted #64748b;">&nbsp;</span></div>
                </td>
              </tr>
            </table>
          </div>
        `;
      };

      const activeBoysList = boys.filter(b => b.name.trim() !== '');
      const activeGirlsList = girls.filter(g => g.name.trim() !== '');

      let bodyHtml = '';
      if (eff === 'boys') {
        bodyHtml = renderCohortWordTable('M', activeBoysList, 'BOYS ASSESSMENT RECORD SHEET');
      } else if (eff === 'girls') {
        bodyHtml = renderCohortWordTable('F', activeGirlsList, 'GIRLS ASSESSMENT RECORD SHEET');
      } else if (eff === 'summary') {
        bodyHtml = renderSummaryWordSheet();
      } else if (eff === 'progress_chart') {
        bodyHtml = renderProgressWordChart();
      } else if (eff === 'school_summary') {
        bodyHtml = renderSchoolSummaryWordSheet();
      } else if (eff === 'report_cards') {
        bodyHtml = renderReportCardsWord();
      } else if (eff === 'all') {
        bodyHtml = `
          ${renderCohortWordTable('M', activeBoysList, 'BOYS ASSESSMENT RECORD SHEET')}
          <br style="page-break-after: always;" />
          ${renderCohortWordTable('F', activeGirlsList, 'GIRLS ASSESSMENT RECORD SHEET')}
          <br style="page-break-after: always;" />
          ${renderSummaryWordSheet()}
          <br style="page-break-after: always;" />
          ${renderProgressWordChart()}
          <br style="page-break-after: always;" />
          ${renderSchoolSummaryWordSheet()}
          <br style="page-break-after: always;" />
          ${renderReportCardsWord()}
        `;
      } else {
        bodyHtml = renderCohortWordTable('M', activeBoysList, 'BOYS ASSESSMENT RECORD SHEET');
      }

      const fullDocumentHtml = `
        <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${school} Assessment Record</title>
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
              size: 841.9pt 595.3pt;
              mso-page-orientation: landscape;
              margin: 0.5in;
            }
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; color: #0f172a; }
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + fullDocumentHtml], { type: 'application/msword;charset=utf-8' });
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const file = new File([blob], fileName, { type: 'application/msword' });

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: fileName,
            text: `Assessment Tracker Document for ${grade} (${term} ${year}).`,
            files: [file]
          });
          toast.success("Export successful! Choose 'Save to Files' or send to WhatsApp/Drive to keep in your phone storage.", { id: toastId });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
          console.warn("Mobile share failed for Word document, falling back to download:", shareErr);
        }
      }

      try {
        saveAs(blob, fileName);
      } catch (sErr) {
        console.warn("saveAs error:", sErr);
      }

      try {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.setAttribute('download', fileName);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      } catch (aErr) {
        console.warn("Anchor fallback error for Word export:", aErr);
      }
      toast.success("Word Document (.doc) downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Word export error:", err);
      toast.error("Word document export error. Please try again.", { id: toastId });
    }
  };

  // Share PDF Handler via Web Share API
  const handleSharePDF = async (targetType: PdfExportType = 'active') => {
    if (!checkDownloadAccess()) return;
    const toastId = toast.loading("Preparing PDF document for sharing...");
    try {
      setIsDownloadingPdf(true);
      setPdfExportTarget(targetType);
      await new Promise(resolve => setTimeout(resolve, 800));

      const element = document.getElementById("standalone-pdf-export-element");
      if (!element) {
        toast.error("Could not find document content to share.", { id: toastId });
        setIsDownloadingPdf(false);
        return;
      }

      const cleanSchoolName = school.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'School';
      const cleanGrade = grade.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Grade';
      const cleanTerm = term.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Term';
      const fileName = `${cleanSchoolName}_${cleanGrade}_${cleanTerm}_${targetType}_Assessment_Tracker.pdf`;

      const opt = {
        margin: [4, 4, 4, 4],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.85 },
        html2canvas: { 
          scale: 1.0, 
          useCORS: true, 
          logging: false,
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDoc(clonedDoc);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      let restoreStyles: (() => void) | null = null;
      let pdfBlob: Blob | null = null;
      try {
        restoreStyles = prepareDocumentForPdfExport(false);
        const h2p = await loadHtml2Pdf();
        const worker = h2p().set(opt).from(element);
        pdfBlob = await worker.output('blob');
      } finally {
        if (restoreStyles) {
          restoreStyles();
        }
      }

      setIsDownloadingPdf(false);

      if (pdfBlob && pdfBlob.size > 0) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${school} - ${grade} Assessment Tracker`,
            text: `Assessment Tracker Summary Sheet for ${grade} (${term} ${year}).`,
            files: [file]
          });
          toast.success("Export successful! Choose 'Save to Files' or send to WhatsApp/Drive to keep in your phone storage.", { id: toastId });
        } else {
          saveAs(pdfBlob, fileName);
          toast.success("PDF saved to device! You can now share it.", { id: toastId });
        }
      } else {
        toast.error("Failed to generate PDF for sharing.", { id: toastId });
      }
    } catch (err: any) {
      setIsDownloadingPdf(false);
      if (err.name !== 'AbortError') {
        console.warn("Share failed, saving file instead:", err);
        toast.error("Native sharing unavailable. File saved to device.", { id: toastId });
      }
    }
  };

  // Download CSV / Excel Handler
  const handleDownloadCSV = async () => {
    try {
      const rows: string[][] = [];

      rows.push([`${school} - ${district}`]);
      rows.push([`GRADE: ${cleanGradeDisplay}`, `TERM: ${cleanTermDisplay}`, `YEAR: ${year}`]);
      rows.push([
        `EXPECTED CLASS ATTENDANCE: ${summaryMetrics.expectedClassTotal} (Boys: ${summaryMetrics.expectedBoys}, Girls: ${summaryMetrics.expectedGirls})`,
        `ATTENDEES (PRESENT): ${summaryMetrics.classTotalAttendees} (${Math.round(summaryMetrics.classAttendancePct)}%)`,
        `ABSENTEES (ABSENT): ${summaryMetrics.classTotalAbsentees} (${Math.round(summaryMetrics.classAbsenteeismPct)}%)`
      ]);
      rows.push([]);

      const subjectHeaders = subjects.map(s => `"${s.name} (out of ${s.outOf})"`);
      rows.push(['S/N', 'Learner Name', 'Sex', ...subjectHeaders, 'Total Raw', 'Total Max', 'Average %']);

      // BOYS
      rows.push(['--- BOYS COHORT ---']);
      boys.forEach(b => {
        if (!b.name.trim()) return;
        const stats = calculateLearnerStats(b);
        const marks = subjects.map(s => b.isAbsent?.[s.id] ? 'ABS' : (b.marks[s.id] ?? ''));
        rows.push([
          String(b.sn),
          `"${b.name.replace(/"/g, '""')}"`,
          'M',
          ...marks,
          String(stats.totalRaw),
          String(stats.totalMax),
          `${stats.avgPct.toFixed(1)}%`
        ]);
      });

      rows.push([]);
      // GIRLS
      rows.push(['--- GIRLS COHORT ---']);
      girls.forEach(g => {
        if (!g.name.trim()) return;
        const stats = calculateLearnerStats(g);
        const marks = subjects.map(s => g.isAbsent?.[s.id] ? 'ABS' : (g.marks[s.id] ?? ''));
        rows.push([
          String(g.sn),
          `"${g.name.replace(/"/g, '""')}"`,
          'F',
          ...marks,
          String(stats.totalRaw),
          String(stats.totalMax),
          `${stats.avgPct.toFixed(1)}%`
        ]);
      });

      const csvString = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
      const cleanSchool = school.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'School';
      const fileName = `${cleanSchool}_${grade.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_Assessment_Record.csv`;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const file = new File([blob], fileName, { type: 'text/csv' });

      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: fileName,
            text: `Assessment Tracker CSV Export for ${grade} (${term} ${year}).`,
            files: [file]
          });
          toast.success("Export successful! Choose 'Save to Files' or send to WhatsApp/Drive to keep in your phone storage.");
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
          console.warn("Mobile share failed for CSV, falling back to download:", shareErr);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Excel/CSV Marks Sheet downloaded successfully!");
    } catch (e) {
      console.error("CSV Download Error:", e);
      toast.error("Failed to generate Excel/CSV file.");
    }
  };

  // Safe Print Handler
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      toast.error("Print blocked by browser. Please use the Download PDF key instead!");
    }
  };

  return (
    <div id="assessment-printable-container" className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 py-3 sm:py-6 space-y-4 sm:space-y-8 bg-slate-50 min-h-screen">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
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
                Assessment Suite
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500">{grade} ({term}, {year})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Assessment Record Tracker & Learner Progress Chart
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
        </div>
      </div>

      {/* Information Center Fixed on top of General Information Block */}
      <InformationCenter 
        toolType="assessments" 
        toolTitle="Continuous Assessment Tracker & Markbook"
        className="print:hidden"
      />

      {/* WHOLE SCHOOL SHARED ASSESSMENT RECORD BANNER */}
      {schoolCircle && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30 shrink-0">
              <span className="text-xl">🏫</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Whole School Shared Assessment Records
                </span>
                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {schoolCircle.teachers.length} Connected Teachers
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider mt-1">
                {schoolCircle.schoolName} ({schoolTeacher?.name || 'Educator'})
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                All teachers of {schoolCircle.schoolName} share visibility of: <strong>Boys &amp; Girls Marksheets, Class Performance Analysis, School Performance Summary &amp; Grade Report Cards</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. SELECT GRADE Selector (Always Outside the General Info Block) */}
      <div className="bg-gradient-to-r from-[#032532] to-[#0A3D50] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <ClipboardList size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Active Tracker Grade</h3>
            <p className="text-[11px] text-slate-300 font-medium">Select grade to load active syllabus & class marksheet</p>
          </div>
        </div>
        <div className="w-full md:w-64">
          <select 
            value={grade} 
            onChange={e => handleGradeChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase cursor-pointer transition-all"
          >
            <option value="ECE Level 1">ECE Level 1</option>
            <option value="ECE Level 2">ECE Level 2</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
          </select>
        </div>
      </div>

      {/* 2. Redesigned High-Performance Registration & Metrics Block */}
      <div className="bg-[#032532] text-white rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Sliders size={20} />
              </div>
              <h4 className="font-black text-xl uppercase tracking-tighter text-white">
                Registration
              </h4>
            </div>

            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              {!!(school || teacherName || teacherPhone || district) 
                ? `Registered for: ${teacherName || 'Teacher'} (${school || 'School'})` 
                : "Complete your profile to unlock automated document syncing."}
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsGeneralProfileExpanded(!isGeneralProfileExpanded)}
                className="px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border border-white/10 flex items-center gap-2 cursor-pointer shadow-xl active:scale-95"
              >
                <ChevronDown size={14} className={cn("transition-transform duration-300", isGeneralProfileExpanded && "rotate-180")} />
                {isGeneralProfileExpanded ? "Hide Registration" : "✏️ Edit Profile"}
              </button>

              <button
                type="button"
                onClick={handleResetGeneralProfile}
                className="px-6 py-3 bg-[#451A20] hover:bg-rose-900 text-white border border-rose-500/30 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xl active:scale-95"
              >
                <RefreshCw size={14} />
                Reset & Re-register
              </button>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Registration Details & Metrics Summary */}
          {!isGeneralProfileExpanded && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-xs">
                    <span className="text-emerald-400 font-bold w-36 shrink-0">School & District:</span>
                    <span className="font-extrabold text-white uppercase tracking-wide truncate">
                      {school || 'N/A'} ({district || 'N/A'})
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-emerald-400 font-bold w-36 shrink-0">Teacher & Phone:</span>
                    <span className="font-extrabold text-white uppercase tracking-wide truncate">
                      {teacherName || 'N/A'} ({teacherPhone || 'N/A'})
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-emerald-400 font-bold w-36 shrink-0">Academic Cycle:</span>
                    <span className="font-extrabold text-white tracking-wide truncate">
                      {term} • {year} • Target Class: {totalExpectedAttendance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="bg-[#1e1b0a] border-2 border-amber-500/40 px-4 py-2 rounded-2xl text-amber-400 text-[11px] font-black uppercase tracking-widest shadow-lg">
                  Target: {totalExpectedAttendance} Learners
                </div>
                <div className="bg-[#0a1e1b] border-2 border-blue-500/40 px-4 py-2 rounded-2xl text-blue-400 text-[11px] font-black uppercase tracking-widest shadow-lg">
                  Attendees: {summaryMetrics.classTotalAttendees} ({Math.round(summaryMetrics.classAttendancePct)}%)
                </div>
                <div className="bg-[#1e0a0a] border-2 border-rose-500/40 px-4 py-2 rounded-2xl text-rose-400 text-[11px] font-black uppercase tracking-widest shadow-lg">
                  Absentees: {summaryMetrics.classTotalAbsentees} ({Math.round(summaryMetrics.classAbsenteeismPct)}%)
                </div>
              </div>
            </div>
          )}
        </div>

        {isGeneralProfileExpanded && (
          <div className="pt-6 mt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">School Name Header</label>
              <input 
                type="text" 
                value={school} 
                onChange={e => setSchool(e.target.value)}
                placeholder="Enter School Name"
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
              />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">District</label>
              <input 
                type="text" 
                value={district} 
                onChange={e => setDistrict(e.target.value)}
                placeholder="Enter District"
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
              />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Teacher Name</label>
              <input 
                type="text" 
                value={teacherName} 
                onChange={e => setTeacherName(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
              />
            </div>
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Teacher Phone</label>
              <input 
                type="text" 
                value={teacherPhone} 
                onChange={e => setTeacherPhone(e.target.value)}
                placeholder="09..."
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>
            
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Term</label>
              <select 
                value={term} 
                onChange={e => handleTermChange(e.target.value as any)}
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-2 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase cursor-pointer"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div className="lg:col-span-1 space-y-1">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Year</label>
              <input 
                type="text" 
                value={year} 
                onChange={e => handleYearChange(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-2 py-2.5 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>

            {/* CLASS TOTAL ATTENDANCE ENTRY (TOP INPUT) */}
            <div className="space-y-1 lg:col-span-1 bg-slate-900 p-2 rounded-2xl border border-white/10 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Users size={12} />
                  <span>Total Attendance</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <div title="Boys Total Expected Attendance">
                  <span className="text-[8px] uppercase text-blue-300 font-bold block">Boys</span>
                  <input 
                    type="number"
                    min="0"
                    max="50"
                    value={totalBoysExpected}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalBoysExpected(val);
                      setTotalExpectedAttendance(val + totalGirlsExpected);
                    }}
                    className="w-full bg-slate-950 border border-white/20 rounded-lg px-1 py-1 text-white text-center font-black text-xs focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div title="Girls Total Expected Attendance">
                  <span className="text-[8px] uppercase text-pink-300 font-bold block">Girls</span>
                  <input 
                    type="number"
                    min="0"
                    max="50"
                    value={totalGirlsExpected}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalGirlsExpected(val);
                      setTotalExpectedAttendance(totalBoysExpected + val);
                    }}
                    className="w-full bg-slate-950 border border-white/20 rounded-lg px-1 py-1 text-white text-center font-black text-xs focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div title="Total Class Expected Attendance">
                  <span className="text-[8px] uppercase text-amber-300 font-black block">Class</span>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={totalExpectedAttendance}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalExpectedAttendance(val);
                    }}
                    className="w-full bg-amber-400 text-slate-950 border border-amber-300 rounded-lg px-1 py-1 text-center font-black text-xs focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>
            </div>

            {/* General Profile Registration Controls Row */}
            <div className="col-span-1 md:col-span-2 lg:col-span-7 pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsGeneralProfileExpanded(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGeneralProfile}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={14} />
                Save & Persist Profile
              </button>
            </div>
          </div>
        )}

        {/* Live Attendance Overview Strip (Always visible when not editing) */}
      </div>

      {/* Main Tab Switcher - Fixed 3-Column Grid (2 Rows of 3) on Mobile, 6-Column on Desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2.5 w-full border-b border-slate-200 pb-3 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('boys')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'boys' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={14} className="shrink-0" />
          <span className="truncate max-w-full">Boys Sheet</span>
          <span className="px-1 py-0.5 rounded-full bg-black/10 dark:bg-white/20 text-[8px] sm:text-[9px] shrink-0 font-bold">
            {boys.filter(b => b.name.trim()).length}/30
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('girls')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'girls' 
              ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={14} className="shrink-0" />
          <span className="truncate max-w-full">Girls Sheet</span>
          <span className="px-1 py-0.5 rounded-full bg-black/10 dark:bg-white/20 text-[8px] sm:text-[9px] shrink-0 font-bold">
            {girls.filter(g => g.name.trim()).length}/30
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'summary' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp size={14} className="shrink-0" />
          <span className="truncate max-w-full">Class Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress_chart')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'progress_chart' 
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet size={14} className="shrink-0" />
          <span className="truncate max-w-full">Progress Chart</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('school_summary')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'school_summary' 
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap size={14} className="shrink-0" />
          <span className="truncate max-w-full">School Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report_cards')}
          className={`px-1.5 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[9px] min-[380px]:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center leading-tight ${
            activeTab === 'report_cards' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText size={14} className="shrink-0" />
          <span className="truncate max-w-full">Report Cards</span>
        </button>
      </div>

      {/* RENDER BOYS OR GIRLS ASSESSMENT SHEET */}
      {(activeTab === 'boys' || activeTab === 'girls') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-wider",
                  activeTab === 'boys' ? "bg-blue-600 shadow-md shadow-blue-500/20" : "bg-rose-600 shadow-md shadow-rose-500/20"
                )}>
                  {activeTab === 'boys' ? "Male Learners" : "Female Learners"}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Assessment Entry Table
              </h3>
            </div>

            {/* Combined Command Center (Stacked Actions per User Request) */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 print:hidden w-full sm:w-auto">
              {/* Row 1: Primary Downloads & Exports (3-Column Grid on Mobile to prevent wrapping) */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                  title="Export to Excel / CSV"
                >
                  <FileSpreadsheet size={13} className="shrink-0" />
                  <span className="truncate">Excel / CSV</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF(activeTab === 'boys' ? 'boys' : 'girls')}
                  disabled={isDownloadingPdf}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <Download size={13} className="shrink-0" />
                  <span className="truncate">Download PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadWord(activeTab === 'boys' ? 'boys' : 'girls')}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">Word (.DOC)</span>
                </button>
              </div>

              {/* Row 2: Management Actions (Below Downloads per User Request) */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => saveCurrentRecord(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Save size={12} />
                  <span>Save Record</span>
                </button>

                <button
                  onClick={() => handleSharePDF('active')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Share2 size={12} />
                  <span>Share Tracker</span>
                </button>
              </div>
            </div>
          </div>

          {/* PHOTO EXTRACTION SUCCESS/FAILURE REPORT CARD (Matching screenshot notification) */}
          <AnimatePresence>
            {photoExtractionReport && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-sm flex items-start justify-between gap-3 text-slate-900 print:hidden"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0">
                    <CheckCircle2 size={18} className="text-amber-700" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                      <span>Extracted from photo</span>
                    </h4>
                    <p className="text-xs text-slate-700 font-medium leading-snug">
                      {photoExtractionReport.message || `${photoExtractionReport.total} pupil(s). Check the marks carefully, then Save.`}
                    </p>
                    {photoExtractionReport.warnings && photoExtractionReport.warnings.length > 0 && (
                      <div className="pt-1 text-[11px] text-amber-900 font-semibold space-y-0.5">
                        {photoExtractionReport.warnings.map((w, idx) => (
                          <div key={idx}>• {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPhotoExtractionReport(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-all cursor-pointer"
                  title="Dismiss report"
                >
                  <XCircle size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Table Actions Bar (Directly Above Table Header) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCameraScanner(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                title="Scan document for learners, gender and marks using Camera OCR"
              >
                <Camera size={16} className="animate-pulse" />
                <span>📸 Scan with Camera</span>
              </button>

              <button
                onClick={() => setShowBulkPaste(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
              >
                <UserPlus size={16} />
                <span>Names/Marks Bulk Fill</span>
              </button>

              <button
                onClick={() => setShowCopyRosterModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <ClipboardList size={16} />
                <span>📋 Copy Roster from Grade</span>
              </button>
            </div>

            {/* Real-time Validation Status Badge & Toggle */}
            <div className="flex items-center gap-2">
              {cohortValidationStats.hasIssues ? (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs shadow-xs"
                  title={`${cohortValidationStats.missingMarksCount} missing mark(s) across ${cohortValidationStats.incompleteLearnersCount} active learner(s)`}
                >
                  <AlertTriangle size={15} className="text-rose-600 shrink-0 animate-bounce" />
                  <span>
                    <strong className="font-black text-rose-950">{cohortValidationStats.incompleteLearnersCount} learner(s)</strong> have missing marks (in red)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-xs">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>All marks complete ✓</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setHighlightValidationErrors(prev => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                  highlightValidationErrors 
                    ? 'bg-rose-100/70 border-rose-300 text-rose-800' 
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Toggle red highlighting for missing marks"
              >
                {highlightValidationErrors ? 'Red Alerts ON' : 'Red Alerts OFF'}
              </button>
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                {/* Out Of Raw Total Header Row */}
                <tr className="bg-slate-900 text-white font-black uppercase">
                  <th className="p-3 border-r border-slate-800 text-center w-12">Sn</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Learner's Name</th>
                  <th className="p-3 border-r border-slate-800 text-center w-12">Sex</th>
                  {subjects.map(sub => (
                    <th key={sub.id} className="p-3 border-r border-slate-800 text-center min-w-[130px]">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider">{sub.name}</span>
                        <div className="flex items-center gap-1 text-[9px] bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                          <span>OUT OF RAW:</span>
                          <select 
                            value={sub.outOf || 25}
                            onChange={e => handleSubjectOutOfChange(sub.id, parseInt(e.target.value) || 25)}
                            className="bg-slate-900 border border-slate-600 text-center font-bold text-emerald-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                            title="Set total raw mark for this subject (10 to 50)"
                          >
                            {Array.from({ length: 41 }, (_, i) => i + 10).map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="p-3 border-r border-slate-800 text-center min-w-[100px] bg-slate-850">Total Raw Marks</th>
                  <th className="p-3 border-r border-slate-800 text-center min-w-[100px] bg-slate-850">Average %</th>
                  <th className="p-3 text-center min-w-[90px] bg-slate-850">Position</th>
                </tr>

                {/* Column Designation Sub-header */}
                <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200 text-center">#</th>
                  <th className="p-2 border-r border-slate-200">Full Name</th>
                  <th className="p-2 border-r border-slate-200 text-center">M/F</th>
                  {subjects.map(sub => (
                    <th key={sub.id} className="p-2 border-r border-slate-200 text-center">
                      <div className="grid grid-cols-2 gap-1 text-[9px]">
                        <span>RAW</span>
                        <span className="text-emerald-700 font-black">CALC %</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 border-r border-slate-200 text-center">SUM</th>
                  <th className="p-2 border-r border-slate-200 text-center">% AVG</th>
                  <th className="p-2 text-center">POSITION</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {(activeTab === 'boys' ? boys : girls).map((learner, idx) => {
                  const stats = activeTab === 'boys' ? boyStats[idx]?.stats : girlStats[idx]?.stats;
                  const rank = activeTab === 'boys' ? boyRanks[learner.id] : girlRanks[learner.id];

                  return (
                    <tr key={learner.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      {/* Serial Number */}
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-500 bg-slate-100/50">
                        {learner.sn || idx + 1}
                      </td>

                      {/* Learner Name Input */}
                      <td className="p-2 border-r border-slate-200">
                        <input 
                          type="text" 
                          value={learner.name}
                          onChange={e => {
                            const val = e.target.value;
                            if (activeTab === 'boys') {
                              const updated = [...boys];
                              updated[idx].name = val;
                              setBoys(updated);
                            } else {
                              const updated = [...girls];
                              updated[idx].name = val;
                              setGirls(updated);
                            }
                          }}
                          placeholder={`Learner ${learner.sn} Name...`}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                        />
                      </td>

                      {/* Sex */}
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-600">
                        {learner.gender}
                      </td>

                      {/* Subject Marks Columns */}
                      {subjects.map(sub => {
                        const rawVal = learner.marks[sub.id] !== undefined && learner.marks[sub.id] !== null ? String(learner.marks[sub.id]) : '';
                        const hasName = learner.name.trim() !== '';
                        const rawStr = rawVal.trim().toUpperCase();
                        const isExplicitAbs = learner.isAbsent?.[sub.id] || rawStr === 'A' || rawStr === 'ABS';
                        const hasValidMark = !isExplicitAbs && rawVal !== '' && !isNaN(parseFloat(rawVal));
                        const isMissingMark = hasName && !hasValidMark && !isExplicitAbs;
                        const showRedAlert = isMissingMark && highlightValidationErrors;
                        
                        let pctStr = '-';
                        let isPass = false;
                        let isAbsentInSubject = false;

                        if (hasValidMark) {
                          const num = parseFloat(rawVal);
                          const pct = (num / (sub.outOf || 25)) * 100;
                          pctStr = `${Math.round(pct)}%`;
                          isPass = pct >= 40;
                        } else if (hasName) {
                          // Named learner with no mark recorded in this subject -> Absent in this subject
                          pctStr = '-';
                          isAbsentInSubject = true;
                        }

                        const maxVal = Math.max(30, sub.outOf || 30);
                        const selectOptions = Array.from({ length: maxVal + 1 }, (_, i) => i.toString());
                        if (rawVal !== '' && !selectOptions.includes(rawVal)) {
                          selectOptions.push(rawVal);
                        }

                        return (
                          <td key={sub.id} className={`p-2 border-r text-center transition-colors ${showRedAlert ? 'border-rose-300 bg-rose-50/70' : 'border-slate-200'}`}>
                            <div className="grid grid-cols-2 gap-1 items-center">
                              {/* Raw Mark Dropdown Select */}
                              <select 
                                value={rawVal}
                                onChange={e => handleMarkChange(activeTab === 'boys' ? 'M' : 'F', idx, sub.id, e.target.value)}
                                className={`w-full text-center px-1 py-1 rounded border font-bold text-xs focus:outline-none focus:ring-2 cursor-pointer ${
                                  showRedAlert 
                                    ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-400/50 shadow-xs' 
                                    : 'border-slate-300 bg-white text-slate-900 focus:ring-blue-500'
                                }`}
                                title={showRedAlert ? `Missing mark for ${sub.name} (Pupil: ${learner.name})` : "Select raw mark"}
                              >
                                <option value="">-</option>
                                {selectOptions.map((opt, optIdx) => (
                                  <option key={`${opt}-${optIdx}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              {/* Calculated Percentage Badge / Attendance Status / Missing Alert */}
                              {showRedAlert ? (
                                <span 
                                  className="text-[9.5px] font-black rounded px-1.5 py-1 text-center bg-rose-600 text-white shadow-xs animate-pulse tracking-tight"
                                  title={`Missing mark for ${sub.name}`}
                                >
                                  MISSING
                                </span>
                              ) : (
                                <span className={`text-[10px] font-black rounded px-1.5 py-1 text-center ${
                                  pctStr !== '-' 
                                    ? isPass 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'text-slate-400 bg-slate-100'
                                }`}>
                                  {pctStr}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Raw Marks */}
                      <td className="p-2.5 border-r border-slate-200 text-center font-black text-slate-900 bg-slate-50">
                        {stats?.totalRaw || 0} / {stats?.totalMax || 0}
                      </td>

                      {/* Average % */}
                      <td className="p-2.5 border-r border-slate-200 text-center font-black bg-slate-50">
                        <span className={`px-2 py-1 rounded-md text-xs ${
                          (stats?.avgPct || 0) >= 40 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {Math.round(stats?.avgPct || 0)}%
                        </span>
                      </td>

                      {/* Class Position */}
                      <td className="p-2.5 text-center font-black text-slate-800 bg-slate-50">
                        {rank ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-xs shadow-2xs font-black">
                            {rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* BOTTOM SUBJECT SUMMARY ROLLS (PER SPECIFICATION) */}
              <tfoot>
                {/* Roll 1: Total Marks in (%) of learners from 40% to 100% */}
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <td colSpan={3} className="p-3 border-r border-slate-300 font-black text-right uppercase text-[10px] text-slate-700">
                    Roll 1: Total Marks in (%) (40% to 100%)
                  </td>
                  {subjects.map((sub, idx) => {
                    const roll = activeTab === 'boys' ? boySubjectRolls[idx] : girlSubjectRolls[idx];
                    return (
                      <td key={sub.id} className="p-2.5 border-r border-slate-300 text-center font-extrabold text-xs">
                        {roll?.passingPercentagesSum ? Math.round(roll.passingPercentagesSum) : '0'}%
                      </td>
                    );
                  })}
                  <td colSpan={3} className="p-2.5 bg-slate-200 text-center text-[10px] font-black text-slate-600 uppercase">
                    Total Passing % Sum
                  </td>
                </tr>

                {/* Roll 2: Subject Mean in Percentage (%) */}
                <tr className="bg-slate-200 font-bold text-slate-900 border-t border-slate-300">
                  <td colSpan={3} className="p-3 border-r border-slate-300 font-black text-right uppercase text-[10px] text-slate-800">
                    Roll 2: Subject Mean in Percentage (%)
                  </td>
                  {subjects.map((sub, idx) => {
                    const roll = activeTab === 'boys' ? boySubjectRolls[idx] : girlSubjectRolls[idx];
                    return (
                      <td key={sub.id} className="p-2.5 border-r border-slate-300 text-center font-black text-xs text-blue-900">
                        {roll?.subjectMean ? `${Math.round(roll.subjectMean)}%` : '0%'}
                      </td>
                    );
                  })}
                  <td colSpan={3} className="p-2.5 bg-slate-300 text-center text-[10px] font-black text-slate-800 uppercase">
                    Subject Mean %
                  </td>
                </tr>

                {/* Roll 3: Subject Pass Rate Percentage */}
                <tr className="bg-emerald-900 text-white font-black border-t-2 border-emerald-950">
                  <td colSpan={3} className="p-3 border-r border-emerald-800 text-right uppercase text-[10px] text-emerald-300">
                    Roll 3: Subject Pass Rate (%)
                  </td>
                  {subjects.map((sub, idx) => {
                    const roll = activeTab === 'boys' ? boySubjectRolls[idx] : girlSubjectRolls[idx];
                    return (
                      <td key={sub.id} className="p-2.5 border-r border-emerald-800 text-center font-black text-sm text-emerald-200">
                        {roll?.passRatePct !== undefined ? `${Math.round(roll.passRatePct)}%` : '0%'}
                        <div className="text-[8px] font-semibold text-emerald-400">
                          ({roll?.passCount || 0}/{roll?.satCount || 0} passed)
                        </div>
                      </td>
                    );
                  })}
                  <td colSpan={3} className="p-2.5 bg-emerald-950 text-center text-[10px] font-black text-emerald-400 uppercase">
                    Subject Pass Rate
                  </td>
                </tr>

                {/* Roll 4: Subject Attendance / Absenteeism Breakdown */}
                <tr className="bg-slate-800 text-white font-bold border-t border-slate-700 text-xs">
                  <td colSpan={3} className="p-3 border-r border-slate-700 text-right uppercase text-[11px] text-amber-300 font-black">
                    Roll 4: Subject Attendance & Absentees
                  </td>
                  {subjects.map((sub, idx) => {
                    const roll = activeTab === 'boys' ? boySubjectRolls[idx] : girlSubjectRolls[idx];
                    return (
                      <td key={sub.id} className="p-2.5 border-r border-slate-700 text-center">
                        <div className="flex items-center justify-center gap-2 text-[10px]">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black">
                            Sat: {roll?.satCount || 0}
                          </span>
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-black">
                            Abs: {roll?.absentCount || 0}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td colSpan={3} className="p-2.5 bg-slate-900 text-center text-[10px] font-black text-amber-400 uppercase">
                    Subject Attendance Status
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          </div>
      )}

      {/* RENDER CLASS PERFORMANCE SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Tab Section Header & Action Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
            <div className="space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Executive Analysis
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Class Performance Summary
              </h3>
            </div>

            {/* Combined Command Center (Stacked Actions per User Request) */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
              {/* Row 1: Primary Downloads & Exports (3-Column Grid on Mobile) */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                  title="Export to Excel / CSV"
                >
                  <FileSpreadsheet size={13} className="shrink-0" />
                  <span className="truncate">Excel / CSV</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF('summary')}
                  disabled={isDownloadingPdf}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <Download size={13} className="shrink-0" />
                  <span className="truncate">Download PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadWord('summary')}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">Word (.DOC)</span>
                </button>
              </div>

              {/* Row 2: Management Actions (Below Downloads per User Request) */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => saveCurrentRecord(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Save size={12} />
                  <span>Save Record</span>
                </button>

                <button
                  onClick={() => setShowBulkPaste(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <UserPlus size={12} />
                  <span>Names/Marks Bulk Fill</span>
                </button>

                <button
                  onClick={() => handleSharePDF('active')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Share2 size={12} />
                  <span>Share Tracker</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-blue-600">
                <span className="text-xs font-black uppercase tracking-wider">Boys Pass Rate</span>
                <Users size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">{Math.round(summaryMetrics.boysAvgPassRate)}%</p>
              <p className="text-xs text-slate-500 font-semibold">{summaryMetrics.activeBoysCount} Active Boys registered</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-pink-600">
                <span className="text-xs font-black uppercase tracking-wider">Girls Pass Rate</span>
                <Users size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">{Math.round(summaryMetrics.girlsAvgPassRate)}%</p>
              <p className="text-xs text-slate-500 font-semibold">{summaryMetrics.activeGirlsCount} Active Girls registered</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-black uppercase tracking-wider">Class Attendees (Present)</span>
                <CheckCircle2 size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">{summaryMetrics.classTotalAttendees} <span className="text-sm font-extrabold text-emerald-600">({Math.round(summaryMetrics.classAttendancePct)}%)</span></p>
              <p className="text-xs text-slate-500 font-semibold">Out of {summaryMetrics.expectedClassTotal} Total Expected Attendance</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-xs font-black uppercase tracking-wider">Class Absentees (Absent)</span>
                <AlertCircle size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">{summaryMetrics.classTotalAbsentees} <span className="text-sm font-extrabold text-rose-600">({Math.round(summaryMetrics.classAbsenteeismPct)}%)</span></p>
              <p className="text-xs text-slate-500 font-semibold">Unattended learner seats across cohort</p>
            </div>
          </div>

          {/* Factual Class Attendance & Absenteeism Analytical Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 font-black">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Factual Class Attendance & Absentees Analysis
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Analysed directly against the Total Expected Class Attendance entered at the top ({summaryMetrics.expectedClassTotal} learners).
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black border border-slate-200">
                Cohort Target: {summaryMetrics.expectedBoys} Boys / {summaryMetrics.expectedGirls} Girls
              </span>
            </div>

            {/* Attendance & Absenteeism Factual Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-black uppercase">
                  <tr>
                    <th className="p-3 min-w-[140px]">Learner Cohort</th>
                    <th className="p-3 text-center">Expected Attendance</th>
                    <th className="p-3 text-center">Attendees (Present)</th>
                    <th className="p-3 text-center">Absentees (Absent)</th>
                    <th className="p-3 text-center">Attendance Rate %</th>
                    <th className="p-3 text-center">Absenteeism Rate %</th>
                    <th className="p-3 text-center">Analytical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  <tr className="hover:bg-blue-50/50">
                    <td className="p-3 font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                      Boys Cohort
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{summaryMetrics.expectedBoys}</td>
                    <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">{summaryMetrics.boysAttendees}</td>
                    <td className="p-3 text-center font-extrabold text-rose-700 bg-rose-50/40">{summaryMetrics.boysAbsentees}</td>
                    <td className="p-3 text-center font-black text-blue-900">{summaryMetrics.boysAttendancePct.toFixed(1)}%</td>
                    <td className="p-3 text-center font-black text-amber-800">{summaryMetrics.boysAbsenteeismPct.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        summaryMetrics.boysAttendancePct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {summaryMetrics.boysAttendancePct >= 90 ? 'Optimal Attendance' : 'Follow-up Needed'}
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-pink-50/50">
                    <td className="p-3 font-bold text-pink-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-600 inline-block"></span>
                      Girls Cohort
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{summaryMetrics.expectedGirls}</td>
                    <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">{summaryMetrics.girlsAttendees}</td>
                    <td className="p-3 text-center font-extrabold text-rose-700 bg-rose-50/40">{summaryMetrics.girlsAbsentees}</td>
                    <td className="p-3 text-center font-black text-pink-900">{summaryMetrics.girlsAttendancePct.toFixed(1)}%</td>
                    <td className="p-3 text-center font-black text-amber-800">{summaryMetrics.girlsAbsenteeismPct.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        summaryMetrics.girlsAttendancePct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {summaryMetrics.girlsAttendancePct >= 90 ? 'Optimal Attendance' : 'Follow-up Needed'}
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3 uppercase text-slate-900">Combined Class Total</td>
                    <td className="p-3 text-center text-slate-900">{summaryMetrics.expectedClassTotal} Learners</td>
                    <td className="p-3 text-center text-emerald-800 bg-emerald-100">{summaryMetrics.classTotalAttendees} Present</td>
                    <td className="p-3 text-center text-rose-800 bg-rose-100">{summaryMetrics.classTotalAbsentees} Absent</td>
                    <td className="p-3 text-center text-emerald-900">{summaryMetrics.classAttendancePct.toFixed(1)}%</td>
                    <td className="p-3 text-center text-rose-900">{summaryMetrics.classAbsenteeismPct.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        summaryMetrics.classAttendancePct >= 90 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {summaryMetrics.classAttendancePct >= 90 ? 'Punctual Class' : 'Attendance Action Required'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual Attendance Progress Comparison Bars */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Visual Attendance vs Absenteeism Breakdown
              </h4>

              {/* Boys Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Boys Attendance ({summaryMetrics.boysAttendees} / {summaryMetrics.expectedBoys})</span>
                  <span className="text-blue-700 font-extrabold">{summaryMetrics.boysAttendancePct.toFixed(0)}% Present</span>
                </div>
                <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${summaryMetrics.boysAttendancePct}%` }}></div>
                </div>
              </div>

              {/* Girls Visual Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Girls Attendance ({summaryMetrics.girlsAttendees} / {summaryMetrics.expectedGirls})</span>
                  <span className="text-pink-700 font-extrabold">{summaryMetrics.girlsAttendancePct.toFixed(0)}% Present</span>
                </div>
                <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-pink-600 transition-all duration-500" style={{ width: `${summaryMetrics.girlsAttendancePct}%` }}></div>
                </div>
              </div>

              {/* Class Total Visual Bar */}
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <div className="flex justify-between text-[11px] font-black text-slate-900">
                  <span>Overall Class Total Attendance ({summaryMetrics.classTotalAttendees} / {summaryMetrics.expectedClassTotal})</span>
                  <span className="text-emerald-700 font-black">{summaryMetrics.classAttendancePct.toFixed(0)}% Present</span>
                </div>
                <div className="w-full h-3.5 bg-rose-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${summaryMetrics.classAttendancePct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Sentence Professional Performance Advice Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles size={20} />
                <h3 className="text-sm font-black uppercase tracking-widest">Professional Pedagogical Advice (Way Forward)</h3>
              </div>
              <button 
                onClick={() => setCustomAdvice(generateTwoSentenceAdvice())}
                className="text-xs font-bold text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Refresh Analysis
              </button>
            </div>
            <p className="text-base sm:text-lg font-extrabold text-slate-100 leading-relaxed italic">
              "{adviceText}"
            </p>
            <p className="text-[10px] font-medium text-slate-400">
              * Auto-calculated based on class pass thresholds (≥ 40%), attendance records, and subject strength ratios.
            </p>
          </div>

          {/* Subject Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Subject-by-Subject Pass Rates & Attendance Breakdown
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-black uppercase">
                  <tr>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3 text-center">Boys Mean (%)</th>
                    <th className="p-3 text-center">Girls Mean (%)</th>
                    <th className="p-3 text-center">Combined Mean (%)</th>
                    <th className="p-3 text-center">Pass Rate (%)</th>
                    <th className="p-3 text-center">Sat Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjects.map((sub, idx) => {
                    const bRoll = boySubjectRolls[idx];
                    const gRoll = girlSubjectRolls[idx];
                    const sat = (bRoll?.satCount || 0) + (gRoll?.satCount || 0);
                    const combinedPass = summaryMetrics.combinedSubjectPassRates[idx]?.pct || 0;
                    
                    // Calculate combined mean
                    const totalPassingPct = (bRoll?.passingPercentagesSum || 0) + (gRoll?.passingPercentagesSum || 0);
                    const combinedMean = sat > 0 ? totalPassingPct / sat : 0;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 font-semibold text-slate-800">
                        <td className="p-3 font-bold text-slate-900">{sub.name}</td>
                        <td className="p-3 text-center font-extrabold text-blue-700">
                          {bRoll?.subjectMean ? `${Math.round(bRoll.subjectMean)}%` : '0%'}
                        </td>
                        <td className="p-3 text-center font-extrabold text-pink-700">
                          {gRoll?.subjectMean ? `${Math.round(gRoll.subjectMean)}%` : '0%'}
                        </td>
                        <td className="p-3 text-center font-black text-indigo-700">
                          {Math.round(combinedMean)}%
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                            combinedPass >= 40 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {Math.round(combinedPass)}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{sat} Learners</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons Moved to Bottom */}
        </div>
      )}

      {/* RENDER LEARNER PROGRESS CHART (TERM 1, TERM 2, TERM 3 SINGLE-SUBJECT FORM) */}
      {activeTab === 'progress_chart' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100/60">
            <div className="flex-1 space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Multi-Term Progress Engine
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Learner Cumulative Progress Chart
              </h3>
            </div>

            {/* Combined Command Center (Stacked Actions per User Request) */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 print:hidden w-full sm:w-auto">
              {/* Row 1: Primary Downloads & Exports (3-Column Grid on Mobile) */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                  title="Export to Excel / CSV"
                >
                  <FileSpreadsheet size={13} className="shrink-0" />
                  <span className="truncate">Excel / CSV</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF('progress_chart')}
                  disabled={isDownloadingPdf}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <Download size={13} className="shrink-0" />
                  <span className="truncate">Download PDF</span>
                </button>

                <button
                  onClick={() => handleDownloadWord('progress_chart')}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[8.5px] min-[360px]:text-[9.5px] sm:text-[10px] uppercase cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95 text-center leading-tight shrink-0"
                >
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">Word (.DOC)</span>
                </button>
              </div>

              {/* Row 2: Management Actions (Below Downloads per User Request) */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => saveCurrentRecord(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Save size={12} />
                  <span>Save Record</span>
                </button>

                <button
                  onClick={() => handleSharePDF('active')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Share2 size={12} />
                  <span>Share Tracker</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Table Actions Bar (Directly Above Progress Table Header) */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-1 print:hidden">
            <button
              onClick={() => setShowBulkPaste(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <UserPlus size={16} />
              <span>Names/Marks Bulk Fill</span>
            </button>
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
              📋 Click to paste learner names or term marks directly into this progress table
            </span>
          </div>

          {/* Consolidated Progress Chart Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-center">
                  <th className="p-3 border-r border-slate-800 w-12" rowSpan={2}>Sn</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px] text-left" rowSpan={2}>Learner's Name</th>
                  <th className="p-3 border-r border-slate-800 w-12" rowSpan={2}>Sex</th>
                  {activeExportSubjects.map(s => (
                    <th key={`hdr_${s.id}`} className="p-2 border-r border-slate-800 bg-slate-800" colSpan={4}>
                      <span className="text-emerald-400 font-extrabold uppercase text-[11px]">{s.name}</span>
                    </th>
                  ))}
                  <th className="p-3 border-r border-slate-800 bg-indigo-950" rowSpan={2}>OVERALL TOTAL</th>
                  <th className="p-3 border-r border-slate-800 bg-indigo-900" rowSpan={2}>FINAL AVG %</th>
                  <th className="p-3 border-r border-slate-800 bg-indigo-850" rowSpan={2}>PASS RATE %</th>
                  <th className="p-3 bg-slate-850" rowSpan={2}>POSITION</th>
                </tr>

                <tr className="bg-slate-800 text-slate-200 font-bold text-[9px] uppercase border-b border-slate-700 text-center">
                  {activeExportSubjects.map(s => (
                    <React.Fragment key={`sub_terms_${s.id}`}>
                      <th className="p-1.5 border-r border-slate-700 bg-blue-950/80 text-blue-300">T1</th>
                      <th className="p-1.5 border-r border-slate-700 bg-emerald-950/80 text-emerald-300">T2</th>
                      <th className="p-1.5 border-r border-slate-700 bg-purple-950/80 text-purple-300">T3</th>
                      <th className="p-1.5 border-r border-slate-700 bg-amber-950/80 text-amber-300">AVG %</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-semibold">
                {[...activeBoys, ...activeGirls].map((learner, idx) => {
                  const t1Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_1_${year}`;
                  const t2Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_2_${year}`;
                  const t3Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_3_${year}`;

                  const recT1 = savedRecords[t1Key];
                  const recT2 = savedRecords[t2Key];
                  const recT3 = savedRecords[t3Key];

                  const getTermMark = (rec: ClassAssessmentRecord | undefined, subId: string) => {
                    if (!rec) {
                      if (term === 'Term 1' && recT1 === undefined) return learner.marks[subId] ?? null;
                      return null;
                    }
                    const pool = learner.gender === 'M' ? rec.boys : rec.girls;
                    const found = pool.find(l => l.name.toLowerCase().trim() === learner.name.toLowerCase().trim());
                    return found?.marks[subId] ?? null;
                  };

                  let overallLearnerSum = 0;
                  let totalPossibleMarks = 0;
                  let passedSubjectsCount = 0;
                  let testedSubjectsCount = 0;

                  return (
                    <tr key={learner.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200 font-black text-slate-900">{learner.name}</td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-600">{learner.gender}</td>

                      {activeExportSubjects.map(sub => {
                        const m1 = getTermMark(recT1, sub.id);
                        const m2 = getTermMark(recT2, sub.id);
                        const m3 = getTermMark(recT3, sub.id);

                        const n1 = m1 !== null && m1 !== '' && !isNaN(Number(m1)) ? Number(m1) : null;
                        const n2 = m2 !== null && m2 !== '' && !isNaN(Number(m2)) ? Number(m2) : null;
                        const n3 = m3 !== null && m3 !== '' && !isNaN(Number(m3)) ? Number(m3) : null;

                        const maxPerTerm = sub.outOf || 25;
                        const p1 = n1 !== null ? Math.round((n1 / maxPerTerm) * 100) : null;
                        const p2 = n2 !== null ? Math.round((n2 / maxPerTerm) * 100) : null;
                        const p3 = n3 !== null ? Math.round((n3 / maxPerTerm) * 100) : null;

                        const subTotal = (n1 ?? 0) + (n2 ?? 0) + (n3 ?? 0);
                        let subMax = 0;
                        if (n1 !== null) subMax += maxPerTerm;
                        if (n2 !== null) subMax += maxPerTerm;
                        if (n3 !== null) subMax += maxPerTerm;

                        overallLearnerSum += subTotal;
                        totalPossibleMarks += subMax;

                        if (subMax > 0) {
                          testedSubjectsCount++;
                          if ((subTotal / subMax) >= 0.40) {
                            passedSubjectsCount++;
                          }
                        }

                        const subAvgPct = subMax > 0 ? Math.round((subTotal / subMax) * 100) : null;

                        return (
                          <React.Fragment key={`val_${learner.id}_${sub.id}`}>
                            <td className="p-2 border-r border-slate-200 text-center text-blue-900 bg-blue-50/20">{p1 !== null ? `${p1}%` : '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-center text-emerald-900 bg-emerald-50/20">{p2 !== null ? `${p2}%` : '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-center text-purple-900 bg-purple-50/20">{p3 !== null ? `${p3}%` : '-'}</td>
                            <td className="p-2 border-r border-slate-200 text-center font-black text-amber-950 bg-amber-50/40">{subAvgPct !== null ? `${subAvgPct}%` : '-'}</td>
                          </React.Fragment>
                        );
                      })}

                      <td className="p-2.5 border-r border-slate-200 text-center font-black text-slate-900 bg-slate-100">{overallLearnerSum}</td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-black bg-slate-100">
                        {totalPossibleMarks > 0 ? `${Math.round((overallLearnerSum / totalPossibleMarks) * 100)}%` : '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-black bg-slate-100 text-emerald-800">
                        {testedSubjectsCount > 0 ? `${Math.round((passedSubjectsCount / testedSubjectsCount) * 100)}%` : '-'}
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-900">
                        {learner.gender === 'M' ? (boyRanks[learner.id] || '-') : (girlRanks[learner.id] || '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons Moved to Bottom */}
        </div>
      )}

      {/* RENDER SCHOOL PERFORMANCE SUMMARY TAB (ECE TO GRADE 7) */}
      {activeTab === 'school_summary' && (() => {
        const metrics = calculateSchoolSummaryMetrics(schoolSummaryScores);
        const lowerGrades = SCHOOL_GRADES.filter(g => g.section === 'Lower Primary');
        const upperGrades = SCHOOL_GRADES.filter(g => g.section === 'Upper Primary');

        return (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100/60">
              <div className="flex-1 space-y-1">
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                  Institutional Summary Engine
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  School Performance Summary Sheet
                </h3>
              </div>

              {/* Combined Command Center (Stacked Actions per User Request) */}
              <div className="flex flex-col items-end gap-2 print:hidden">
                {/* Row 1: Primary Downloads */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF('school_summary')}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[10px] uppercase cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => handleDownloadWord('school_summary')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    <FileText size={14} />
                    <span>Word (.DOC)</span>
                  </button>
                </div>

                {/* Row 2: Management Actions (Below Downloads per User Request) */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={handleSyncCurrentGradeToSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm cursor-pointer active:scale-95"
                    title={`Auto-fill averages from ${grade}`}
                  >
                    <Sparkles size={12} />
                    <span>Sync {grade}</span>
                  </button>

                  <button
                    onClick={() => saveCurrentRecord(false)}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save size={12} />
                    <span>Save Record</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                  Overall School Performance
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  {metrics.overallSchoolMean !== null ? `${Math.round(metrics.overallSchoolMean)}%` : ''}
                </p>
                <p className="text-[11px] text-emerald-200 mt-1 font-medium">Whole School Average Score</p>
              </div>

              <div className="bg-gradient-to-br from-sky-900 to-slate-900 text-white p-4 rounded-2xl border border-sky-500/30 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 block">
                  Lower Primary (ECE–G3) Mean
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  {metrics.lowerPrimaryMean !== null ? `${Math.round(metrics.lowerPrimaryMean)}%` : ''}
                </p>
                <p className="text-[11px] text-sky-200 mt-1 font-medium">5 Grade Levels Combined</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-500/30 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  Upper Primary (G4–G7) Mean
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  {metrics.upperPrimaryMean !== null ? `${Math.round(metrics.upperPrimaryMean)}%` : ''}
                </p>
                <p className="text-[11px] text-blue-200 mt-1 font-medium">4 Grade Levels Combined</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900 to-slate-900 text-white p-4 rounded-2xl border border-purple-500/30 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block">
                  Assessed Grades
                </span>
                <p className="text-3xl font-black text-white mt-1">
                  9 Grades
                </p>
                <p className="text-[11px] text-purple-200 mt-1 font-medium">ECE L1 to Grade 7 Spectrum</p>
              </div>
            </div>

            {/* Editable School Performance Summary Matrix Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <GraduationCap size={16} className="text-purple-600" />
                  School Performance Grade-by-Subject Averages (%)
                </h4>
                <span className="text-xs text-slate-500 font-bold">
                  * Type or edit percentage scores directly in cells below
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase text-center">
                      <th className="p-3 border-r border-slate-800 text-left min-w-[130px]">Grade Level</th>
                      <th className="p-3 border-r border-slate-800 min-w-[110px]">Section</th>
                      {SCHOOL_SUMMARY_SUBJECTS.map(s => (
                        <th key={s.id} className="p-3 border-r border-slate-800 text-center font-extrabold" title={s.name}>
                          {s.shortName}
                        </th>
                      ))}
                      <th className="p-3 bg-purple-950 text-emerald-300 font-black min-w-[110px]">
                        GRADE MEAN
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {/* LOWER PRIMARY SECTION HEADER */}
                    <tr className="bg-sky-800 text-white font-black text-[11px] uppercase tracking-wider">
                      <td colSpan={SCHOOL_SUMMARY_SUBJECTS.length + 3} className="p-2.5 px-4">
                        LOWER PRIMARY SCHOOL SECTION (ECE Level 1, ECE Level 2, Grade 1, Grade 2, Grade 3)
                      </td>
                    </tr>

                    {lowerGrades.map((g, idx) => {
                      const rowScores = schoolSummaryScores[g.id] || {};
                      const rowMean = metrics.gradeMeans[g.id];

                      return (
                        <tr key={g.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="p-3 border-r border-slate-200 font-black text-slate-900">
                            {g.name}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-500 text-[11px]">
                            {g.section}
                          </td>
                          {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                            if (!isSubjectApplicableToGrade(g.id, s.id)) {
                              return (
                                <td key={s.id} className="p-2 border-r border-slate-200 text-center bg-slate-100/70 select-none" title="Not applicable for this section">
                                  <span className="text-[11px] font-bold text-slate-400">N/A</span>
                                </td>
                              );
                            }
                            const scoreVal = rowScores[s.id] ?? '';
                            return (
                              <td key={s.id} className="p-2 border-r border-slate-200 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal}
                                  onChange={e => handleSchoolSummaryScoreChange(g.id, s.id, e.target.value)}
                                  placeholder=""
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                                />
                              </td>
                            );
                          })}
                          <td className="p-3 text-center font-black text-sky-900 bg-sky-50 text-sm">
                            {rowMean !== null ? `${Math.round(rowMean)}%` : ''}
                          </td>
                        </tr>
                      );
                    })}

                    {/* LOWER PRIMARY SUBTOTAL MEAN ROW */}
                    <tr className="bg-sky-100 font-black text-center text-sky-950 border-t-2 border-sky-300">
                      <td colSpan={2} className="p-3 border-r border-sky-300 text-right uppercase text-[11px]">
                        Lower Primary Subtotal Mean (ECE–G3):
                      </td>
                      {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                        if (!isSubjectApplicableToGrade('g1', s.id)) {
                          return (
                            <td key={s.id} className="p-3 border-r border-sky-300 font-bold text-slate-400 bg-slate-200/40 text-[11px]">
                              N/A
                            </td>
                          );
                        }
                        let sum = 0; let count = 0;
                        lowerGrades.forEach(g => {
                          const v = schoolSummaryScores[g.id]?.[s.id];
                          if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                            sum += Number(v); count++;
                          }
                        });
                        return (
                          <td key={s.id} className="p-3 border-r border-sky-300 font-black text-sky-900">
                            {count > 0 ? `${Math.round(sum / count)}%` : ''}
                          </td>
                        );
                      })}
                      <td className="p-3 bg-sky-800 text-white font-black text-sm">
                        {metrics.lowerPrimaryMean !== null ? `${Math.round(metrics.lowerPrimaryMean)}%` : ''}
                      </td>
                    </tr>

                    {/* UPPER PRIMARY SECTION HEADER */}
                    <tr className="bg-blue-900 text-white font-black text-[11px] uppercase tracking-wider">
                      <td colSpan={SCHOOL_SUMMARY_SUBJECTS.length + 3} className="p-2.5 px-4">
                        UPPER PRIMARY SCHOOL SECTION (Grade 4, Grade 5, Grade 6, Grade 7)
                      </td>
                    </tr>

                    {upperGrades.map((g, idx) => {
                      const rowScores = schoolSummaryScores[g.id] || {};
                      const rowMean = metrics.gradeMeans[g.id];

                      return (
                        <tr key={g.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="p-3 border-r border-slate-200 font-black text-slate-900">
                            {g.name}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-center font-bold text-slate-500 text-[11px]">
                            {g.section}
                          </td>
                          {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                            if (!isSubjectApplicableToGrade(g.id, s.id)) {
                              return (
                                <td key={s.id} className="p-2 border-r border-slate-200 text-center bg-slate-100/70 select-none" title="Not applicable for this section">
                                  <span className="text-[11px] font-bold text-slate-400">N/A</span>
                                </td>
                              );
                            }
                            const scoreVal = rowScores[s.id] ?? '';
                            return (
                              <td key={s.id} className="p-2 border-r border-slate-200 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal}
                                  onChange={e => handleSchoolSummaryScoreChange(g.id, s.id, e.target.value)}
                                  placeholder=""
                                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                                />
                              </td>
                            );
                          })}
                          <td className="p-3 text-center font-black text-blue-900 bg-blue-50 text-sm">
                            {rowMean !== null ? `${Math.round(rowMean)}%` : ''}
                          </td>
                        </tr>
                      );
                    })}

                    {/* UPPER PRIMARY SUBTOTAL MEAN ROW */}
                    <tr className="bg-blue-100 font-black text-center text-blue-950 border-t-2 border-blue-300">
                      <td colSpan={2} className="p-3 border-r border-blue-300 text-right uppercase text-[11px]">
                        Upper Primary Subtotal Mean (G4–G7):
                      </td>
                      {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                        if (!isSubjectApplicableToGrade('g4', s.id)) {
                          return (
                            <td key={s.id} className="p-3 border-r border-blue-300 font-bold text-slate-400 bg-slate-200/40 text-[11px]">
                              N/A
                            </td>
                          );
                        }
                        let sum = 0; let count = 0;
                        upperGrades.forEach(g => {
                          const v = schoolSummaryScores[g.id]?.[s.id];
                          if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                            sum += Number(v); count++;
                          }
                        });
                        return (
                          <td key={s.id} className="p-3 border-r border-blue-300 font-black text-blue-900">
                            {count > 0 ? `${Math.round(sum / count)}%` : ''}
                          </td>
                        );
                      })}
                      <td className="p-3 bg-blue-900 text-white font-black text-sm">
                        {metrics.upperPrimaryMean !== null ? `${Math.round(metrics.upperPrimaryMean)}%` : ''}
                      </td>
                    </tr>
                  </tbody>

                  <tfoot>
                    {/* OVERALL WHOLE SCHOOL PERFORMANCE MEAN ROW */}
                    <tr className="bg-slate-900 text-white font-black text-center text-sm uppercase">
                      <td colSpan={2} className="p-3.5 border-r border-slate-800 text-right text-emerald-400 tracking-wider">
                        OVERALL SCHOOL MEAN (%):
                      </td>
                      {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                        const sm = metrics.subjectMeans[s.id];
                        return (
                          <td key={s.id} className="p-3.5 border-r border-slate-800 text-emerald-300 font-black">
                            {sm !== null ? `${Math.round(sm)}%` : ''}
                          </td>
                        );
                      })}
                      <td className="p-3.5 bg-emerald-600 text-white text-base font-black">
                        {metrics.overallSchoolMean !== null ? `${Math.round(metrics.overallSchoolMean)}%` : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Buttons removed from bottom and moved to headers per user request */}
          </div>
        );
      })()}

      {/* RENDER LEARNER INDIVIDUAL REPORT CARDS TAB */}
      {activeTab === 'report_cards' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100/60">
            <div className="flex-1 space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                Official Terminal Statements
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Learner Individual Report Cards
              </h3>
            </div>

            {/* Combined Command Center (Stacked Actions per User Request) */}
            <div className="flex flex-col items-end gap-2 print:hidden">
              {/* Row 1: Primary Downloads */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF('report_cards')}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-[10px] uppercase cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Download size={14} />
                  <span>Download All (PDF)</span>
                </button>

                <button
                  onClick={() => handleDownloadWord('report_cards')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase cursor-pointer shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  <FileText size={14} />
                  <span>Word (.DOC)</span>
                </button>
              </div>

              {/* Row 2: Management Actions (Below Downloads per User Request) */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => saveCurrentRecord(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Save size={12} />
                  <span>Save Record</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {[...activeBoys, ...activeGirls].map((learner, idx) => {
              const stats = calculateLearnerStats(learner);
              const rank = learner.gender === 'M' ? boyRanks[learner.id] : girlRanks[learner.id];

              return (
                <div key={learner.id} className="border border-slate-900 rounded-lg p-3.5 sm:p-4 bg-white space-y-2.5 shadow-sm print:break-after-page print:page-break-after-always">
                  {/* Card School Header */}
                  <div className="border-b border-slate-900 pb-2 text-slate-900 flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider">OFFICIAL TERMINAL REPORT CARD</span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase leading-tight">{school || 'CHINIKA SECONDARY SCHOOL'}</h4>
                      <p className="text-[10px] font-bold text-slate-600 uppercase">DISTRICT: {district || 'LUSAKA DISTRICT'} | GRADE: {cleanGradeDisplay} | TERM: {cleanTermDisplay} | YEAR: {year}</p>
                      {(teacherName || teacherPhone) && (
                        <p className="text-[9px] font-bold text-emerald-800 uppercase pt-0.5">
                          CLASS TEACHER: {teacherName || 'NOT SPECIFIED'} | PHONE: {teacherPhone || 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      Page {idx + 1} of {activeBoys.length + activeGirls.length}
                    </div>
                  </div>

                  {/* Learner Info Banner */}
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Learner's Name:</span>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{learner.name}</h4>
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-700 space-y-0.5">
                      <div>SEX: <span className="font-black text-slate-900">{learner.gender === 'M' ? 'BOY' : 'GIRL'}</span> | CLASS POSITION: <span className="font-black text-slate-900">{rank || '-'}</span></div>
                      <div>AVG: <span className="font-black text-indigo-900">{Math.round(stats.avgPct)}%</span> | STATUS: <span className="font-black text-emerald-800">{stats.avgPct >= 40 ? 'PROMOTED / SATISFACTORY' : 'NEEDS IMPROVEMENT'}</span></div>
                    </div>
                  </div>

                  {/* Results Table */}
                  <table className="w-full text-left text-xs border-collapse border border-slate-300 bg-white">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-1 border border-slate-700">Subject</th>
                        <th className="p-1 border border-slate-700 text-center">Score</th>
                        <th className="p-1 border border-slate-700 text-center">Out Of</th>
                        <th className="p-1 border border-slate-700 text-center">% Mark</th>
                        <th className="p-1 border border-slate-700 text-center">Grade</th>
                        <th className="p-1 border border-slate-700 text-center">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-[10px]">
                      {activeExportSubjects.map(sub => {
                        const raw = learner.marks[sub.id];
                        const val = raw !== undefined && raw !== null && raw !== '' ? Number(raw) : null;
                        const pct = val !== null ? Math.round((val / (sub.outOf || 25)) * 100) : 0;
                        const { grade: gVal, desc: gDesc } = getEczCbcGrade(val !== null ? pct : null);

                        return (
                          <tr key={sub.id}>
                            <td className="p-1 border border-slate-200 font-bold text-slate-900">{sub.name}</td>
                            <td className="p-1 border border-slate-200 text-center font-bold text-slate-900">{val !== null ? val : '-'}</td>
                            <td className="p-1 border border-slate-200 text-center text-slate-500 font-bold">{sub.outOf || 25}</td>
                            <td className="p-1 border border-slate-200 text-center font-black text-slate-900">{val !== null ? `${pct}%` : '-'}</td>
                            <td className="p-1 border border-slate-200 text-center font-black text-indigo-900 text-xs">{gVal}</td>
                            <td className="p-1 border border-slate-200 text-center font-bold text-[9px] uppercase text-slate-800">{gDesc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* ECZ CBC Grading System Legend Box */}
                  <div className="p-2 bg-emerald-50/60 border border-emerald-300 rounded-lg space-y-1 text-[9.5px]">
                    <div className="text-center font-black text-emerald-950 uppercase tracking-wide text-[9px]">
                      EXAMINATIONS COUNCIL OF ZAMBIA — COMPETENCE BASED CURRICULUM (CBC) GRADING SYSTEM
                    </div>
                    <table className="w-full text-center text-[9px] border-collapse border border-emerald-300 bg-white">
                      <thead className="bg-emerald-800 text-white font-bold uppercase text-[9px]">
                        <tr>
                          <th className="p-0.5 border border-emerald-600">Score Range</th>
                          <th className="p-0.5 border border-emerald-600">Grade</th>
                          <th className="p-0.5 border border-emerald-600">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-200 font-bold text-slate-800 text-[9px]">
                        <tr><td className="p-0.5 border border-emerald-200">70 - 100</td><td className="p-0.5 border border-emerald-200 font-black">1</td><td className="p-0.5 border border-emerald-200 font-black text-emerald-900">Outstanding</td></tr>
                        <tr><td className="p-0.5 border border-emerald-200">60 - 69</td><td className="p-0.5 border border-emerald-200 font-black">2</td><td className="p-0.5 border border-emerald-200 font-black text-emerald-800">Advanced</td></tr>
                        <tr><td className="p-0.5 border border-emerald-200">50 - 59</td><td className="p-0.5 border border-emerald-200 font-black">3</td><td className="p-0.5 border border-emerald-200 font-black text-blue-900">Basic</td></tr>
                        <tr><td className="p-0.5 border border-emerald-200">40 - 49</td><td className="p-0.5 border border-emerald-200 font-black">4</td><td className="p-0.5 border border-emerald-200 font-black text-amber-900">Satisfactory</td></tr>
                        <tr><td className="p-0.5 border border-emerald-200">00 - 39</td><td className="p-0.5 border border-emerald-200 font-black">5</td><td className="p-0.5 border border-emerald-200 font-black text-rose-800">Unsatisfactory</td></tr>
                      </tbody>
                    </table>
                    <div className="text-[8.5px] text-slate-700 leading-tight border-t border-emerald-200 pt-1 font-semibold">
                      <p className="font-bold text-emerald-950">
                        This result statement represents the {getGradeCategory(grade) === 'upper_primary' ? 'upper primary' : 'lower primary'} education and each learner is given proof of their class term performance. Parents are hereby encouraged to support their child/children where seemed not performing well.
                      </p>
                    </div>
                  </div>

                  {/* Class Teacher's Remarks & Headteacher's Remarks */}
                  <div className="pt-2 border-t border-slate-300 space-y-2 text-[10px]">
                    <div className="space-y-1 w-full">
                      <div className="font-black text-slate-900 uppercase text-[9.5px]">Class Teacher's Remarks:</div>
                      <div className="pt-0.5 pb-0.5 w-full">
                        <div className="border-b border-dotted border-slate-400 w-full h-1"></div>
                      </div>
                      <div className="flex justify-between items-center gap-4 pt-0.5 text-[9.5px] font-bold text-slate-800 w-full">
                        <div className="flex items-end gap-1.5 grow">
                          <span className="shrink-0">Signature:</span>
                          <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                        </div>
                        <div className="flex items-end gap-1.5 w-1/3">
                          <span className="shrink-0">Date:</span>
                          <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-dashed border-slate-200 w-full">
                      <div className="font-black text-slate-900 uppercase text-[9.5px]">Headteacher's Remarks:</div>
                      <div className="pt-0.5 pb-0.5 w-full">
                        <div className="border-b border-dotted border-slate-400 w-full h-1"></div>
                      </div>
                      <div className="flex justify-between items-center gap-4 pt-0.5 text-[9.5px] font-bold text-slate-800 w-full">
                        <div className="flex items-end gap-1.5 grow">
                          <span className="shrink-0">Signature:</span>
                          <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                        </div>
                        <div className="flex items-end gap-1.5 w-1/3">
                          <span className="shrink-0">Date:</span>
                          <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* On-screen Footer for page numbering */}
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold pt-1 border-t border-dashed border-slate-200 mt-1">
                    <span>Terminal Report Card System</span>
                    <span>Page {idx + 1} of {activeBoys.length + activeGirls.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons removed from bottom and moved to headers per user request */}
        </div>
      )}

      {/* BULK PASTE REAL-TIME VALIDATION MODAL */}
      <BulkPasteValidationModal
        isOpen={showBulkPaste}
        onClose={() => setShowBulkPaste(false)}
        onApply={handleApplyParsedLearners}
        subjects={activeSubjects}
        bulkTargetGender={bulkTargetGender}
        setBulkTargetGender={setBulkTargetGender}
        bulkText={bulkText}
        setBulkText={setBulkText}
        onOpenScanner={() => setShowCameraScanner(true)}
        grade={grade}
        term={term}
      />

      {/* DOCUMENT CAMERA SCANNER OCR MODAL */}
      <DocumentCameraScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanComplete={handleDocumentScanComplete}
        subjects={activeSubjects}
        grade={grade}
        term={term}
        defaultFallbackGender={bulkTargetGender}
      />

      {/* CLEAR CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Clear Form Entries?</h3>
                  <p className="text-xs text-slate-500 font-medium">Reset all learner names and test scores for {grade} ({term})?</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                Are you sure you want to clear all learner names and scores for this record? Built-in serial numbers (S/N 1–30) will remain intact.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCurrentForm}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase shadow-md transition-all cursor-pointer"
                >
                  Clear Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COPY ROSTER MODAL */}
      <AnimatePresence>
        {showCopyRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Copy Class Roster</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    Import learner names from an existing saved grade into active <strong className="text-slate-800">{grade}</strong>. Marks will remain clean for this grade.
                  </p>
                </div>
                <button onClick={() => setShowCopyRosterModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
              </div>

              {Object.keys(savedRecords).length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold text-center">
                  No saved grade records found yet. Enter names in a grade and click "Save Record" first to build reusable rosters.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700">Select Source Grade Record:</label>
                  <select
                    value={selectedSourceKey}
                    onChange={e => setSelectedSourceKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="">-- Choose Grade Roster --</option>
                    {Object.keys(savedRecords).map(key => {
                      const r = savedRecords[key];
                      const bCount = (r.boys || []).filter(b => b.name && b.name.trim()).length;
                      const gCount = (r.girls || []).filter(g => g.name && g.name.trim()).length;
                      return (
                        <option key={key} value={key}>
                          {r.grade} ({r.term}, {r.year}) — {bCount} Boys, {gCount} Girls
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowCopyRosterModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCopyRosterFromRecord(selectedSourceKey)}
                  disabled={!selectedSourceKey || !savedRecords[selectedSourceKey]}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black text-xs uppercase shadow-md cursor-pointer transition-all"
                >
                  Copy Learner Names
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* EXPORT OVERLAY & CLEAN PDF CONTAINER */}
      {isDownloadingPdf && (
        <div id="pdf-export-overlay" className="fixed inset-0 z-[9999] bg-slate-950/90 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start">
          <div className="w-[1080px] max-w-full bg-slate-900 border border-slate-700 text-white rounded-2xl p-4 mb-6 shadow-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <h4 className="font-black text-sm uppercase text-slate-100">Compiling Clean A4 Landscape PDF Document...</h4>
                <p className="text-xs text-slate-400 font-medium">Capturing learner entries, raw subject marks, roll averages, attendance, and rankings.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                  setTimeout(() => {
                    document.body.classList.remove('pdf-export-mode');
                    setIsDownloadingPdf(false);
                  }, 2500);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
                title="Use browser print dialog to Save as PDF instantly"
              >
                🖨️ Instant Print / Save as PDF
              </button>
              <button 
                onClick={() => {
                  document.body.classList.remove('pdf-export-mode');
                  setIsDownloadingPdf(false);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div 
            id="standalone-pdf-export-element" 
            className={cn(
              "bg-white text-slate-900 p-8 font-sans border border-slate-300 rounded-sm shadow-2xl space-y-6",
              (pdfExportTarget === 'report_cards' || (pdfExportTarget === 'active' && activeTab === 'report_cards')) ? "w-[794px] min-h-[1123px]" : "w-[1080px] min-h-[700px]"
            )}
          >
        {(() => {
          const target = pdfExportTarget === 'active' ? activeTab : pdfExportTarget;

          const renderHeader = (title: string, pageNumberStr?: string) => {
            const cleanGradeNum = cleanGradeDisplay;
            const cleanTermNum = cleanTermDisplay;
            return (
              <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start text-slate-900">
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">OFFICIAL ACADEMIC PERFORMANCE RECORD</div>
                  <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">{school || 'CHINIKA SECONDARY SCHOOL'}</h1>
                  <p className="text-xs font-bold uppercase text-slate-700">DISTRICT: {district || 'LUSAKA DISTRICT'} | {title} {pageNumberStr ? `— ${pageNumberStr}` : ''}</p>
                  {title !== 'SCHOOL PERFORMANCE SUMMARY SHEET' && (teacherName || teacherPhone) && (
                    <p className="text-[10px] font-black uppercase text-emerald-800 pt-0.5">
                      CLASS TEACHER: {teacherName || 'NOT SPECIFIED'} | PHONE: {teacherPhone || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs font-bold space-y-0.5 border-l border-slate-300 pl-4">
                  <div>GRADE: <span className="font-black text-slate-900">{cleanGradeNum}</span>  TERM: <span className="font-black text-slate-900">{cleanTermNum}</span> | YEAR: <span className="font-black text-slate-900">{year}</span></div>
                  <div>EXPECTED ATTENDANCE: <span className="font-black">{summaryMetrics.expectedClassTotal}</span> (BOYS: {summaryMetrics.expectedBoys}, GIRLS: {summaryMetrics.expectedGirls})</div>
                  <div>ATTENDEES (PRESENT): <span className="font-black text-emerald-800">{summaryMetrics.classTotalAttendees} ({Math.round(summaryMetrics.classAttendancePct)}%)</span> | ABSENTEES: <span className="font-black text-rose-800">{summaryMetrics.classTotalAbsentees} ({Math.round(summaryMetrics.classAbsenteeismPct)}%)</span></div>
                </div>
              </div>
            );
          };

          const renderCohortTable = (cohortType: 'M' | 'F', listSlice: LearnerEntry[], pageIndex: number, totalPages: number, includeRolls: boolean, startIndex: number = 0) => {
            const isBoys = cohortType === 'M';
            const rolls = isBoys ? boySubjectRolls : girlSubjectRolls;

            return (
              <div className="space-y-3 text-sm">
                {renderHeader(`${isBoys ? 'BOYS' : 'GIRLS'} ASSESSMENT RECORD SHEET`, `PAGE ${pageIndex} OF ${totalPages}`)}
                
                <table className="w-full text-left text-sm border-collapse border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase text-center">
                      <th className="p-2 border border-slate-700 text-center w-10" rowSpan={2}>Sn</th>
                      <th className="p-2 border border-slate-700 min-w-[180px] text-left" rowSpan={2}>Learner's Name</th>
                      <th className="p-2 border border-slate-700 text-center w-10" rowSpan={2}>Sex</th>
                      {activeExportSubjects.map(sub => (
                        <th key={sub.id} colSpan={2} className="p-2 border border-slate-700 text-center">
                          <div className="text-[11px] text-emerald-300 uppercase font-black">{sub.name}</div>
                          <div className="text-[9px] text-slate-300 font-bold">OUT OF {sub.outOf || 25}</div>
                        </th>
                      ))}
                      <th className="p-2 border border-slate-700 text-center" rowSpan={2}>Total Raw</th>
                      <th className="p-2 border border-slate-700 text-center" rowSpan={2}>Total %</th>
                      <th className="p-2 border border-slate-700 text-center" rowSpan={2}>Average %</th>
                      <th className="p-2 border border-slate-700 text-center" rowSpan={2}>Position</th>
                    </tr>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-black text-center">
                      {activeExportSubjects.map(sub => (
                        <React.Fragment key={sub.id}>
                          <th className="p-1 border border-slate-700">Raw</th>
                          <th className="p-1 border border-slate-700 text-emerald-300">%</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-semibold text-sm">
                    {listSlice.map((learner, idx) => {
                      const stats = calculateLearnerStats(learner);
                      const rank = isBoys ? boyRanks[learner.id] : girlRanks[learner.id];

                      return (
                        <tr key={learner.id} className="border-b border-slate-300">
                          <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-700">{learner.sn || (startIndex + idx + 1)}</td>
                          <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{learner.name}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">{learner.gender}</td>
                          {activeExportSubjects.map(sub => {
                            const rawVal = learner.marks[sub.id] !== undefined && learner.marks[sub.id] !== null ? String(learner.marks[sub.id]) : '';
                            const rawStr = rawVal.trim().toUpperCase();
                            const isExplicitAbs = learner.isAbsent?.[sub.id] || rawStr === 'A' || rawStr === 'ABS';
                            const hasValidMark = !isExplicitAbs && rawVal !== '' && !isNaN(parseFloat(rawVal));

                            let rawDisp = '-';
                            let pctDisp = '-';
                            if (isExplicitAbs) {
                              rawDisp = 'ABS';
                              pctDisp = 'ABS';
                            } else if (hasValidMark) {
                              const num = parseFloat(rawVal);
                              const pct = Math.round((num / (sub.outOf || 25)) * 100);
                              rawDisp = String(num);
                              pctDisp = `${pct}%`;
                            }

                            return (
                              <React.Fragment key={sub.id}>
                                <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-700">{rawDisp}</td>
                                <td className="p-2 border-r border-slate-300 text-center font-black text-emerald-800 bg-emerald-50/40">{pctDisp}</td>
                              </React.Fragment>
                            );
                          })}
                          <td className="p-2 border-r border-slate-300 text-center font-black">{stats.totalRaw}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-black">{stats.subjectCount > 0 ? `${Math.round(stats.totalPercentageSum)}%` : '-'}</td>
                          <td className="p-2 border-r border-slate-300 text-center font-black">{stats.subjectCount > 0 ? `${Math.round(stats.avgPct)}%` : '-'}</td>
                          <td className="p-2 text-center font-black">{rank ? rank : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Roll Footers */}
                  {includeRolls && (
                    <tfoot className="border-t-2 border-slate-900 bg-slate-100 text-slate-900 font-bold text-sm">
                      <tr>
                        <td colSpan={3} className="p-2 border border-slate-400 text-right font-black uppercase">Roll 1: Total Raw Marks Scored</td>
                        {activeExportSubjects.map((sub, idx) => {
                          const originalIdx = subjects.findIndex(s => s.id === sub.id);
                          const roll = rolls[originalIdx];
                          return (
                            <td key={sub.id} colSpan={2} className="p-2 border border-slate-400 text-center font-black">{roll ? Math.round(roll.avgRaw * roll.satCount) : 0}</td>
                          );
                        })}
                        <td colSpan={4} className="p-2 border border-slate-400 text-center text-xs uppercase font-black bg-slate-200">Sum Total</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-2 border border-slate-400 text-right font-black uppercase">Roll 2: Average Percentage %</td>
                        {activeExportSubjects.map((sub, idx) => {
                          const originalIdx = subjects.findIndex(s => s.id === sub.id);
                          const roll = rolls[originalIdx];
                          return (
                            <td key={sub.id} colSpan={2} className="p-2 border border-slate-400 text-center font-black text-blue-900">{Math.round(roll?.avgPct || 0)}%</td>
                          );
                        })}
                        <td colSpan={4} className="p-2 border border-slate-400 text-center text-xs uppercase font-black bg-slate-200">Subject Mean</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-2 border border-slate-400 text-right font-black uppercase">Roll 3: Pass Rate Threshold % (≥ 40%)</td>
                        {activeExportSubjects.map((sub, idx) => {
                          const originalIdx = subjects.findIndex(s => s.id === sub.id);
                          const roll = rolls[originalIdx];
                          return (
                            <td key={sub.id} colSpan={2} className="p-2 border border-slate-400 text-center font-black text-emerald-800">{Math.round(roll?.passRatePct || 0)}%</td>
                          );
                        })}
                        <td colSpan={4} className="p-2 border border-slate-400 text-center text-xs uppercase font-black bg-slate-200">Cohort Pass Rate</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="p-2 border border-slate-400 text-right font-black uppercase">Roll 4: Subject Attendance & Absentees</td>
                        {activeExportSubjects.map((sub, idx) => {
                          const originalIdx = subjects.findIndex(s => s.id === sub.id);
                          const roll = rolls[originalIdx];
                          return (
                            <td key={sub.id} colSpan={2} className="p-2 border border-slate-400 text-center font-black text-xs">
                              Sat: {roll?.satCount || 0} | Abs: {roll?.absentCount || 0}
                            </td>
                          );
                        })}
                        <td colSpan={4} className="p-2 border border-slate-400 text-center text-xs uppercase font-black bg-slate-200">Attendance Totals</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            );
          };

          const renderBoysSheet = () => {
            const list = activeBoys;
            if (list.length === 0) return renderCohortTable('M', [], 1, 1, true, 0);

            const pageSize = 18;
            const chunks: LearnerEntry[][] = [];
            for (let i = 0; i < list.length; i += pageSize) {
              chunks.push(list.slice(i, i + pageSize));
            }
            const totalPages = chunks.length;

            return (
              <div className="space-y-6">
                {chunks.map((chunk, idx) => {
                  const pageIndex = idx + 1;
                  const isLastPage = idx === chunks.length - 1;
                  const startIndex = idx * pageSize;
                  return (
                    <React.Fragment key={`boys_chunk_${idx}`}>
                      {idx > 0 && (
                        <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                      )}
                      {renderCohortTable('M', chunk, pageIndex, totalPages, isLastPage, startIndex)}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          };

          const renderGirlsSheet = () => {
            const list = activeGirls;
            if (list.length === 0) return renderCohortTable('F', [], 1, 1, true, 0);

            const pageSize = 18;
            const chunks: LearnerEntry[][] = [];
            for (let i = 0; i < list.length; i += pageSize) {
              chunks.push(list.slice(i, i + pageSize));
            }
            const totalPages = chunks.length;

            return (
              <div className="space-y-6">
                {chunks.map((chunk, idx) => {
                  const pageIndex = idx + 1;
                  const isLastPage = idx === chunks.length - 1;
                  const startIndex = idx * pageSize;
                  return (
                    <React.Fragment key={`girls_chunk_${idx}`}>
                      {idx > 0 && (
                        <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                      )}
                      {renderCohortTable('F', chunk, pageIndex, totalPages, isLastPage, startIndex)}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          };

          const renderSummarySheet = () => (
            <div className="space-y-6 text-sm">
              <div className="space-y-4">
                {renderHeader('CLASS PERFORMANCE SUMMARY & ATTENDANCE ANALYSIS', 'PAGE 1 OF 2')}
                
                <div className="border-2 border-slate-900 rounded-xl p-5 bg-white space-y-4">
                  <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-300 pb-2">
                    1. Factual Class Attendance & Absentees Analysis
                  </h3>
                  <table className="w-full text-left text-sm border-collapse border border-slate-400">
                    <thead className="bg-slate-900 text-white font-black uppercase">
                      <tr>
                        <th className="p-2.5 border border-slate-700">Learner Cohort</th>
                        <th className="p-2.5 border border-slate-700 text-center">Expected Attendance</th>
                        <th className="p-2.5 border border-slate-700 text-center">Attendees (Present)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Absentees (Absent)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Attendance Rate %</th>
                        <th className="p-2.5 border border-slate-700 text-center">Absenteeism Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold">
                      <tr>
                        <td className="p-2.5 border border-slate-300 text-blue-900">Boys Cohort</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.expectedBoys}</td>
                        <td className="p-2.5 border border-slate-300 text-center text-emerald-800">{summaryMetrics.boysAttendees}</td>
                        <td className="p-2.5 border border-slate-300 text-center text-rose-800">{summaryMetrics.boysAbsentees}</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.boysAttendancePct.toFixed(1)}%</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.boysAbsenteeismPct.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 border border-slate-300 text-pink-900">Girls Cohort</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.expectedGirls}</td>
                        <td className="p-2.5 border border-slate-300 text-center text-emerald-800">{summaryMetrics.girlsAttendees}</td>
                        <td className="p-2.5 border border-slate-300 text-center text-rose-800">{summaryMetrics.girlsAbsentees}</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.girlsAttendancePct.toFixed(1)}%</td>
                        <td className="p-2.5 border border-slate-300 text-center">{summaryMetrics.girlsAbsenteeismPct.toFixed(1)}%</td>
                      </tr>
                      <tr className="bg-slate-100 font-black">
                        <td className="p-2.5 border border-slate-400">Combined Class Total</td>
                        <td className="p-2.5 border border-slate-400 text-center">{summaryMetrics.expectedClassTotal}</td>
                        <td className="p-2.5 border border-slate-400 text-center text-emerald-900">{summaryMetrics.classTotalAttendees}</td>
                        <td className="p-2.5 border border-slate-400 text-center text-rose-900">{summaryMetrics.classTotalAbsentees}</td>
                        <td className="p-2.5 border border-slate-400 text-center text-emerald-900">{summaryMetrics.classAttendancePct.toFixed(1)}%</td>
                        <td className="p-2.5 border border-slate-400 text-center text-rose-900">{summaryMetrics.classAbsenteeismPct.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />

              <div className="space-y-4">
                {renderHeader('CLASS PERFORMANCE SUMMARY & ATTENDANCE ANALYSIS', 'PAGE 2 OF 2')}
                
                <div className="border-2 border-slate-900 rounded-xl p-5 bg-white space-y-4">
                  <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-300 pb-2">
                    2. Subject-by-Subject Pass Rates & Attendance Breakdown
                  </h3>
                  <table className="w-full text-left text-sm border-collapse border border-slate-400">
                    <thead className="bg-slate-900 text-white font-black uppercase">
                      <tr>
                        <th className="p-2.5 border border-slate-700">Subject Name</th>
                        <th className="p-2.5 border border-slate-700 text-center">Boys Mean (%)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Girls Mean (%)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Combined Mean (%)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Pass Rate (%)</th>
                        <th className="p-2.5 border border-slate-700 text-center">Sat Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-bold">
                      {activeExportSubjects.map(sub => {
                        const idx = subjects.findIndex(s => s.id === sub.id);
                        const bRoll = boySubjectRolls[idx];
                        const gRoll = girlSubjectRolls[idx];
                        const sat = (bRoll?.satCount || 0) + (gRoll?.satCount || 0);
                        const combinedPass = summaryMetrics.combinedSubjectPassRates[idx]?.pct || 0;
                        
                        // Calculate combined mean
                        const totalPassingPct = (bRoll?.passingPercentagesSum || 0) + (gRoll?.passingPercentagesSum || 0);
                        const combinedMean = sat > 0 ? totalPassingPct / sat : 0;

                        return (
                          <tr key={sub.id}>
                            <td className="p-2.5 border border-slate-300 font-bold">{sub.name}</td>
                            <td className="p-2.5 border border-slate-300 text-center text-blue-900">{bRoll?.subjectMean ? `${Math.round(bRoll.subjectMean)}%` : '0%'}</td>
                            <td className="p-2.5 border border-slate-300 text-center text-pink-900">{gRoll?.subjectMean ? `${Math.round(gRoll.subjectMean)}%` : '0%'}</td>
                            <td className="p-2.5 border border-slate-300 text-center font-black text-indigo-900">{Math.round(combinedMean)}%</td>
                            <td className="p-2.5 border border-slate-300 text-center font-black text-emerald-800">{Math.round(combinedPass)}%</td>
                            <td className="p-2.5 border border-slate-300 text-center">{sat}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50 space-y-2">
                  <h3 className="font-black text-sm uppercase text-slate-900">3. Professional Pedagogical Advice (Way Forward)</h3>
                  <p className="text-sm font-semibold text-slate-900 italic leading-relaxed">"{adviceText}"</p>
                </div>
              </div>
            </div>
          );

          const renderProgressChartSheet = () => {
            const allActiveLearners = [...activeBoys, ...activeGirls];
            if (allActiveLearners.length === 0) {
              return (
                <div className="space-y-4">
                  {renderHeader('LEARNER CUMULATIVE PROGRESS CHART (TERMS 1 - 3)', 'PAGE 1 OF 1')}
                  <p className="text-sm font-medium text-slate-500 italic text-center p-8">No active learners recorded.</p>
                </div>
              );
            }

            const pageSize = 18;
            const chunks: LearnerEntry[][] = [];
            for (let i = 0; i < allActiveLearners.length; i += pageSize) {
              chunks.push(allActiveLearners.slice(i, i + pageSize));
            }
            const totalPages = chunks.length;

            return (
              <div className="space-y-6">
                {chunks.map((chunk, cIdx) => {
                  const pageIndex = cIdx + 1;
                  const startIndex = cIdx * pageSize;

                  return (
                    <React.Fragment key={`progress_chunk_${cIdx}`}>
                      {cIdx > 0 && (
                        <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                      )}
                      <div className="space-y-4">
                        {renderHeader('LEARNER CUMULATIVE PROGRESS CHART (TERMS 1 - 3)', `PAGE ${pageIndex} OF ${totalPages}`)}
                        
                        <table className="w-full text-left text-sm border-collapse border-2 border-slate-900">
                          <thead>
                            <tr className="bg-slate-900 text-white font-black uppercase text-center">
                              <th className="p-2 border border-slate-700 w-10" rowSpan={2}>Sn</th>
                              <th className="p-2 border border-slate-700 min-w-[160px] text-left" rowSpan={2}>Learner's Name</th>
                              <th className="p-2 border border-slate-700 w-10" rowSpan={2}>Sex</th>
                              {activeExportSubjects.map(s => (
                                <th key={`exp_sub_${s.id}`} className="p-1.5 border border-slate-700 bg-slate-800" colSpan={4}>
                                  <span className="text-emerald-300 font-bold uppercase text-xs">{s.name}</span>
                                </th>
                              ))}
                              <th className="p-2 border border-slate-700 bg-slate-800 text-xs" rowSpan={2}>OVERALL TOTAL</th>
                              <th className="p-2 border border-slate-700 bg-slate-800 text-xs" rowSpan={2}>FINAL AVG %</th>
                              <th className="p-2 border border-slate-700 bg-slate-800 text-xs" rowSpan={2}>PASS RATE %</th>
                              <th className="p-2 bg-slate-800 text-xs" rowSpan={2}>POSITION</th>
                            </tr>
                            <tr className="bg-slate-800 text-slate-200 font-bold text-[10px] uppercase border-b border-slate-700 text-center">
                              {activeExportSubjects.map(s => (
                                <React.Fragment key={`sub_hdr_terms_${s.id}`}>
                                  <th className="p-1 border border-slate-700 text-blue-300">T1</th>
                                  <th className="p-1 border border-slate-700 text-emerald-300">T2</th>
                                  <th className="p-1 border border-slate-700 text-purple-300">T3</th>
                                  <th className="p-1 border border-slate-700 text-amber-300">AVG %</th>
                                </React.Fragment>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 font-medium">
                            {chunk.map((learner, idx) => {
                              const globalIdx = startIndex + idx + 1;
                              const t1Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_1_${year}`;
                              const t2Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_2_${year}`;
                              const t3Key = `tracker_${grade.replace(/\s+/g, '_')}_Term_3_${year}`;

                              const recT1 = savedRecords[t1Key];
                              const recT2 = savedRecords[t2Key];
                              const recT3 = savedRecords[t3Key];

                              const getTermMark = (rec: ClassAssessmentRecord | undefined, subId: string) => {
                                if (!rec) {
                                  if (term === 'Term 1' && recT1 === undefined) return learner.marks[subId] ?? null;
                                  return null;
                                }
                                const pool = learner.gender === 'M' ? rec.boys : rec.girls;
                                const found = pool.find(l => l.name.toLowerCase().trim() === learner.name.toLowerCase().trim());
                                return found?.marks[subId] ?? null;
                              };

                              let overallLearnerSum = 0;
                              let totalPossibleMarks = 0;
                              let passedSubjectsCount = 0;
                              let testedSubjectsCount = 0;

                              return (
                                <tr key={learner.id}>
                                  <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-600">{globalIdx}</td>
                                  <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{learner.name}</td>
                                  <td className="p-2 border-r border-slate-300 text-center font-bold">{learner.gender}</td>
                                  {activeExportSubjects.map(sub => {
                                    const m1 = getTermMark(recT1, sub.id);
                                    const m2 = getTermMark(recT2, sub.id);
                                    const m3 = getTermMark(recT3, sub.id);

                                    const n1 = m1 !== null && m1 !== '' && !isNaN(Number(m1)) ? Number(m1) : null;
                                    const n2 = m2 !== null && m2 !== '' && !isNaN(Number(m2)) ? Number(m2) : null;
                                    const n3 = m3 !== null && m3 !== '' && !isNaN(Number(m3)) ? Number(m3) : null;

                                    const maxPerTerm = sub.outOf || 25;
                                    const p1 = n1 !== null ? Math.round((n1 / maxPerTerm) * 100) : null;
                                    const p2 = n2 !== null ? Math.round((n2 / maxPerTerm) * 100) : null;
                                    const p3 = n3 !== null ? Math.round((n3 / maxPerTerm) * 100) : null;

                                    const subTotal = (n1 ?? 0) + (n2 ?? 0) + (n3 ?? 0);
                                    let subMax = 0;
                                    if (n1 !== null) subMax += maxPerTerm;
                                    if (n2 !== null) subMax += maxPerTerm;
                                    if (n3 !== null) subMax += maxPerTerm;

                                    overallLearnerSum += subTotal;
                                    totalPossibleMarks += subMax;

                                    if (subMax > 0) {
                                      testedSubjectsCount++;
                                      if ((subTotal / subMax) >= 0.40) {
                                        passedSubjectsCount++;
                                      }
                                    }

                                    const subAvgPct = subMax > 0 ? Math.round((subTotal / subMax) * 100) : null;

                                    return (
                                      <React.Fragment key={`exp_val_${learner.id}_${sub.id}`}>
                                        <td className="p-1 border border-slate-300 text-center">{p1 !== null ? `${p1}%` : ''}</td>
                                        <td className="p-1 border border-slate-300 text-center">{p2 !== null ? `${p2}%` : ''}</td>
                                        <td className="p-1 border border-slate-300 text-center">{p3 !== null ? `${p3}%` : ''}</td>
                                        <td className="p-1 border border-slate-300 text-center font-black bg-slate-100">{subAvgPct !== null ? `${subAvgPct}%` : ''}</td>
                                      </React.Fragment>
                                    );
                                  })}
                                  <td className="p-2 border border-slate-300 text-center font-black bg-slate-100">{overallLearnerSum > 0 ? overallLearnerSum : ''}</td>
                                  <td className="p-2 border border-slate-300 text-center font-black bg-slate-100">{totalPossibleMarks > 0 ? `${Math.round((overallLearnerSum / totalPossibleMarks) * 100)}%` : ''}</td>
                                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800 bg-slate-100">{testedSubjectsCount > 0 ? `${Math.round((passedSubjectsCount / testedSubjectsCount) * 100)}%` : ''}</td>
                                  <td className="p-2 text-center font-black">
                                    {learner.gender === 'M' ? (boyRanks[learner.id] || '') : (girlRanks[learner.id] || '')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          };

          const renderReportCardsSheet = () => {
            const activeBoysList = boys.filter(b => b.name.trim() !== '');
            const activeGirlsList = girls.filter(g => g.name.trim() !== '');
            const allActiveLearners = [...activeBoysList, ...activeGirlsList];

            return (
              <div className="space-y-0">
                {allActiveLearners.map((learner, idx) => {
                  const stats = calculateLearnerStats(learner);
                  const rank = learner.gender === 'M' ? boyRanks[learner.id] : girlRanks[learner.id];

                  return (
                    <React.Fragment key={`pdf_card_wrap_${learner.id}`}>
                      {idx > 0 && (
                        <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '0' }} />
                      )}
                      <div className="border border-slate-900 rounded-lg p-3.5 bg-white space-y-2.5 shadow-sm" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        {/* Official Header on each report card */}
                        <div className="border-b border-slate-900 pb-2 text-slate-900 flex justify-between items-start">
                          <div>
                            <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider">OFFICIAL TERMINAL REPORT CARD</div>
                            <h2 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight leading-tight">{school || 'CHINIKA SECONDARY SCHOOL'}</h2>
                            <p className="text-[10px] font-bold uppercase text-slate-700">
                              DISTRICT: {district || 'LUSAKA DISTRICT'} | GRADE: {cleanGradeDisplay} | TERM: {cleanTermDisplay} | YEAR: {year}
                            </p>
                            {(teacherName || teacherPhone) && (
                              <p className="text-[9px] font-black uppercase text-emerald-800 pt-0.5">
                                CLASS TEACHER: {teacherName || 'NOT SPECIFIED'} | PHONE: {teacherPhone || 'N/A'}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Page {idx + 1} of {allActiveLearners.length}
                          </div>
                        </div>

                        {/* Learner Info Banner */}
                        <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Learner's Name:</span>
                            <h3 className="text-sm font-black text-slate-900 leading-tight">{learner.name}</h3>
                          </div>
                          <div className="text-right space-y-0.5 font-bold text-slate-700 text-[10px]">
                            <div>SEX: <span className="font-black text-slate-900">{learner.gender === 'M' ? 'BOY' : 'GIRL'}</span> | CLASS POSITION: <span className="font-black text-slate-900">{rank || '-'}</span></div>
                            <div>AVERAGE SCORE: <span className="font-black text-indigo-900">{Math.round(stats.avgPct)}%</span> | STATUS: <span className="font-black text-emerald-800">{stats.avgPct >= 40 ? 'PROMOTED / SATISFACTORY' : 'NEEDS IMPROVEMENT'}</span></div>
                          </div>
                        </div>

                        {/* Subject Marks Table */}
                        <table className="w-full text-left text-xs border-collapse border border-slate-400 bg-white">
                          <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                            <tr>
                              <th className="p-1 border border-slate-700">Subject Name</th>
                              <th className="p-1 border border-slate-700 text-center">Score</th>
                              <th className="p-1 border border-slate-700 text-center">Out Of</th>
                              <th className="p-1 border border-slate-700 text-center">% Mark</th>
                              <th className="p-1 border border-slate-700 text-center">Grade</th>
                              <th className="p-1 border border-slate-700 text-center">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 font-semibold text-[10px]">
                            {activeExportSubjects.map(sub => {
                              const raw = learner.marks[sub.id];
                              const val = raw !== undefined && raw !== null && raw !== '' ? Number(raw) : null;
                              const pct = val !== null ? Math.round((val / (sub.outOf || 25)) * 100) : 0;
                              const { grade: gVal, desc: gDesc } = getEczCbcGrade(val !== null ? pct : null);

                              return (
                                <tr key={sub.id}>
                                  <td className="p-1 border border-slate-300 font-bold">{sub.name}</td>
                                  <td className="p-1 border border-slate-300 text-center font-bold">{val !== null ? val : '-'}</td>
                                  <td className="p-1 border border-slate-300 text-center text-slate-500">{sub.outOf || 25}</td>
                                  <td className="p-1 border border-slate-300 text-center font-black">{val !== null ? `${pct}%` : '-'}</td>
                                  <td className="p-1 border border-slate-300 text-center font-black text-xs">{gVal}</td>
                                  <td className="p-1 border border-slate-300 text-center font-bold text-[9px] uppercase">{gDesc}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* ECZ CBC Grading System Legend Box */}
                        <div className="p-2 bg-emerald-50/60 border border-emerald-300 rounded-lg space-y-1 text-[9.5px]">
                          <div className="text-center font-black text-emerald-950 uppercase tracking-wide text-[9px]">
                            EXAMINATIONS COUNCIL OF ZAMBIA — COMPETENCE BASED CURRICULUM (CBC) GRADING SYSTEM
                          </div>
                          <table className="w-full text-center text-[9px] border-collapse border border-emerald-300 bg-white">
                            <thead className="bg-emerald-800 text-white font-bold uppercase text-[9px]">
                              <tr>
                                <th className="p-0.5 border border-emerald-600">Score Range</th>
                                <th className="p-0.5 border border-emerald-600">Grade</th>
                                <th className="p-0.5 border border-emerald-600">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-200 font-bold text-slate-800 text-[9px]">
                              <tr><td className="p-0.5 border border-emerald-200">70 - 100</td><td className="p-0.5 border border-emerald-200 font-black">1</td><td className="p-0.5 border border-emerald-200 font-black text-emerald-900">Outstanding</td></tr>
                              <tr><td className="p-0.5 border border-emerald-200">60 - 69</td><td className="p-0.5 border border-emerald-200 font-black">2</td><td className="p-0.5 border border-emerald-200 font-black text-emerald-800">Advanced</td></tr>
                              <tr><td className="p-0.5 border border-emerald-200">50 - 59</td><td className="p-0.5 border border-emerald-200 font-black">3</td><td className="p-0.5 border border-emerald-200 font-black text-blue-900">Basic</td></tr>
                              <tr><td className="p-0.5 border border-emerald-200">40 - 49</td><td className="p-0.5 border border-emerald-200 font-black">4</td><td className="p-0.5 border border-emerald-200 font-black text-amber-900">Satisfactory</td></tr>
                              <tr><td className="p-0.5 border border-emerald-200">00 - 39</td><td className="p-0.5 border border-emerald-200 font-black">5</td><td className="p-0.5 border border-emerald-200 font-black text-rose-800">Unsatisfactory</td></tr>
                            </tbody>
                          </table>
                          <div className="text-[8.5px] text-slate-700 leading-tight border-t border-emerald-200 pt-1 font-semibold">
                            <p className="font-bold text-emerald-950">
                              This result statement represents the {getGradeCategory(grade) === 'upper_primary' ? 'upper primary' : 'lower primary'} education and each learner is given proof of their class term performance. Parents are hereby encouraged to support their child/children where seemed not performing well.
                            </p>
                          </div>
                        </div>

                        {/* Class Teacher's Remarks & Headteacher's Remarks */}
                        <div className="pt-2 border-t border-slate-300 space-y-2 text-[10px]">
                          <div className="space-y-1 w-full">
                            <div className="font-black text-slate-900 uppercase text-[9.5px]">Class Teacher's Remarks:</div>
                            <div className="pt-0.5 pb-0.5 w-full">
                              <div className="border-b border-dotted border-slate-400 w-full h-1"></div>
                            </div>
                            <div className="flex justify-between items-center gap-4 pt-0.5 text-[9.5px] font-bold text-slate-800 w-full">
                              <div className="flex items-end gap-1.5 grow">
                                <span className="shrink-0">Signature:</span>
                                <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                              </div>
                              <div className="flex items-end gap-1.5 w-1/3">
                                <span className="shrink-0">Date:</span>
                                <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 pt-1.5 border-t border-dashed border-slate-200 w-full">
                            <div className="font-black text-slate-900 uppercase text-[9.5px]">Headteacher's Remarks:</div>
                            <div className="pt-0.5 pb-0.5 w-full">
                              <div className="border-b border-dotted border-slate-400 w-full h-1"></div>
                            </div>
                            <div className="flex justify-between items-center gap-4 pt-0.5 text-[9.5px] font-bold text-slate-800 w-full">
                              <div className="flex items-end gap-1.5 grow">
                                <span className="shrink-0">Signature:</span>
                                <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                              </div>
                              <div className="flex items-end gap-1.5 w-1/3">
                                <span className="shrink-0">Date:</span>
                                <div className="grow border-b border-dotted border-slate-400 h-1"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Dynamic Footer for page numbering */}
                        <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold pt-1 border-t border-dashed border-slate-200 mt-1">
                          <span>Terminal Report Card System</span>
                          <span>Page {idx + 1} of {allActiveLearners.length}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          };

          const renderSchoolSummarySheet = () => {
            const metrics = calculateSchoolSummaryMetrics(schoolSummaryScores);
            const lowerGrades = SCHOOL_GRADES.filter(g => g.section === 'Lower Primary');
            const upperGrades = SCHOOL_GRADES.filter(g => g.section === 'Upper Primary');

            return (
              <div className="bg-white p-6 space-y-6 text-slate-900 border border-slate-300 rounded-lg">
                {renderHeader("SCHOOL PERFORMANCE SUMMARY SHEET", "Categorized Institutional Subject Performance Analysis")}

                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall School Mean</span>
                    <span className="text-2xl font-black text-emerald-400">{metrics.overallSchoolMean !== null ? `${Math.round(metrics.overallSchoolMean)}%` : ''}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lower Primary Mean (ECE–G3)</span>
                    <span className="text-2xl font-black text-sky-400">{metrics.lowerPrimaryMean !== null ? `${Math.round(metrics.lowerPrimaryMean)}%` : ''}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Upper Primary Mean (G4–G7)</span>
                    <span className="text-2xl font-black text-blue-400">{metrics.upperPrimaryMean !== null ? `${Math.round(metrics.upperPrimaryMean)}%` : ''}</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase text-center">
                        <th className="p-2 border border-slate-700 text-left">Grade Level</th>
                        <th className="p-2 border border-slate-700">Section</th>
                        {SCHOOL_SUMMARY_SUBJECTS.map(s => (
                          <th key={s.id} className="p-2 border border-slate-700">{s.shortName}</th>
                        ))}
                        <th className="p-2 border border-slate-700 bg-purple-950 text-emerald-300">GRADE MEAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-semibold text-center">
                      <tr className="bg-sky-800 text-white font-black text-[11px] uppercase">
                        <td colSpan={SCHOOL_SUMMARY_SUBJECTS.length + 3} className="p-2 text-left">
                          LOWER PRIMARY SCHOOL SECTION (ECE LEVEL 1 TO GRADE 3)
                        </td>
                      </tr>
                      {lowerGrades.map((g, idx) => {
                        const rowScores = schoolSummaryScores[g.id] || {};
                        const rowMean = metrics.gradeMeans[g.id];
                        return (
                          <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border border-slate-300 text-left font-black">{g.name}</td>
                            <td className="p-2 border border-slate-300 text-slate-500">{g.section}</td>
                            {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                              if (!isSubjectApplicableToGrade(g.id, s.id)) {
                                return (
                                  <td key={s.id} className="p-2 border border-slate-300 bg-slate-100 text-slate-400 font-bold text-[10px] text-center select-none">
                                    N/A
                                  </td>
                                );
                              }
                              return (
                                <td key={s.id} className="p-2 border border-slate-300 min-w-[50px]">
                                  {rowScores[s.id] !== undefined && rowScores[s.id] !== null && rowScores[s.id].trim() !== '' ? `${rowScores[s.id]}%` : ''}
                                </td>
                              );
                            })}
                            <td className="p-2 border border-slate-300 font-black text-sky-900 bg-sky-50">
                              {rowMean !== null ? `${Math.round(rowMean)}%` : ''}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-sky-100 font-black text-sky-950">
                        <td colSpan={2} className="p-2 border border-sky-300 text-right uppercase">Lower Primary Subtotal Mean:</td>
                        {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                          if (!isSubjectApplicableToGrade('g1', s.id)) {
                            return (
                              <td key={s.id} className="p-2 border border-sky-300 bg-slate-100 text-slate-400 font-bold text-[10px] text-center">
                                N/A
                              </td>
                            );
                          }
                          let sum = 0; let count = 0;
                          lowerGrades.forEach(g => {
                            const v = schoolSummaryScores[g.id]?.[s.id];
                            if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                              sum += Number(v); count++;
                            }
                          });
                          return <td key={s.id} className="p-2 border border-sky-300">{count > 0 ? `${Math.round(sum / count)}%` : ''}</td>;
                        })}
                        <td className="p-2 bg-sky-800 text-white font-black">{metrics.lowerPrimaryMean !== null ? `${Math.round(metrics.lowerPrimaryMean)}%` : ''}</td>
                      </tr>

                      <tr className="bg-blue-900 text-white font-black text-[11px] uppercase">
                        <td colSpan={SCHOOL_SUMMARY_SUBJECTS.length + 3} className="p-2 text-left">
                          UPPER PRIMARY SCHOOL SECTION (GRADE 4 TO GRADE 7)
                        </td>
                      </tr>
                      {upperGrades.map((g, idx) => {
                        const rowScores = schoolSummaryScores[g.id] || {};
                        const rowMean = metrics.gradeMeans[g.id];
                        return (
                          <tr key={g.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border border-slate-300 text-left font-black">{g.name}</td>
                            <td className="p-2 border border-slate-300 text-slate-500">{g.section}</td>
                            {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                              if (!isSubjectApplicableToGrade(g.id, s.id)) {
                                return (
                                  <td key={s.id} className="p-2 border border-slate-300 bg-slate-100 text-slate-400 font-bold text-[10px] text-center select-none">
                                    N/A
                                  </td>
                                );
                              }
                              return (
                                <td key={s.id} className="p-2 border border-slate-300 min-w-[50px]">
                                  {rowScores[s.id] !== undefined && rowScores[s.id] !== null && rowScores[s.id].trim() !== '' ? `${rowScores[s.id]}%` : ''}
                                </td>
                              );
                            })}
                            <td className="p-2 border border-slate-300 font-black text-blue-900 bg-blue-50">
                              {rowMean !== null ? `${Math.round(rowMean)}%` : ''}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-100 font-black text-blue-950">
                        <td colSpan={2} className="p-2 border border-blue-300 text-right uppercase">Upper Primary Subtotal Mean:</td>
                        {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                          if (!isSubjectApplicableToGrade('g4', s.id)) {
                            return (
                              <td key={s.id} className="p-2 border border-blue-300 bg-slate-100 text-slate-400 font-bold text-[10px] text-center">
                                N/A
                              </td>
                            );
                          }
                          let sum = 0; let count = 0;
                          upperGrades.forEach(g => {
                            const v = schoolSummaryScores[g.id]?.[s.id];
                            if (v !== undefined && v !== null && v.trim() !== '' && !isNaN(Number(v))) {
                              sum += Number(v); count++;
                            }
                          });
                          return <td key={s.id} className="p-2 border border-blue-300">{count > 0 ? `${Math.round(sum / count)}%` : ''}</td>;
                        })}
                        <td className="p-2 bg-blue-900 text-white font-black">{metrics.upperPrimaryMean !== null ? `${Math.round(metrics.upperPrimaryMean)}%` : ''}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-black uppercase text-center">
                        <td colSpan={2} className="p-2.5 border border-slate-700 text-right text-emerald-400">OVERALL SCHOOL MEAN (%):</td>
                        {SCHOOL_SUMMARY_SUBJECTS.map(s => {
                          const sm = metrics.subjectMeans[s.id];
                          return <td key={s.id} className="p-2.5 border border-slate-700 text-emerald-300">{sm !== null ? `${Math.round(sm)}%` : ''}</td>;
                        })}
                        <td className="p-2.5 bg-emerald-600 text-white font-black">{metrics.overallSchoolMean !== null ? `${Math.round(metrics.overallSchoolMean)}%` : ''}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="pt-4 max-w-lg text-xs font-bold text-slate-800 w-full">
                  <div className="space-y-1 w-full">
                    <div className="font-black uppercase">Headteacher's Remarks:</div>
                    <div className="border-b border-dotted border-slate-300 w-full h-4"></div>
                    <div className="flex justify-between items-center gap-4 pt-2 w-full">
                      <div className="flex items-end gap-1.5 grow">
                        <span className="shrink-0">Signature:</span>
                        <div className="grow border-b border-dotted border-slate-300 h-1"></div>
                      </div>
                      <div className="flex items-end gap-1.5 w-1/3">
                        <span className="shrink-0">Date:</span>
                        <div className="grow border-b border-dotted border-slate-300 h-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          if (target === 'boys') return renderBoysSheet();
          if (target === 'girls') return renderGirlsSheet();
          if (target === 'summary') return renderSummarySheet();
          if (target === 'progress_chart') return renderProgressChartSheet();
          if (target === 'school_summary') return renderSchoolSummarySheet();
          if (target === 'report_cards') return renderReportCardsSheet();
          if (target === 'all') {
            return (
              <div>
                {renderBoysSheet()}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                {renderGirlsSheet()}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                {renderSummarySheet()}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                {renderProgressChartSheet()}
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', margin: '20px 0' }} />
                {renderReportCardsSheet()}
              </div>
            );
          }
          return renderBoysSheet();
        })()}
      </div>
    </div>
  )}
    </div>
  );
}
