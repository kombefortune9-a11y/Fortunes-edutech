/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Eye, 
  Zap, 
  ChevronRight, 
  ChevronDown, 
  Sliders, 
  Compass, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  RotateCcw,
  Edit3,
  CalendarCheck2,
  Table,
  Check,
  Trash2,
  Loader2,
  ChevronUp,
  Users,
  X,
  Search,
  Image as ImageIcon,
  FolderOpen,
  FolderMinus,
  Filter,
  CheckSquare,
  Download
} from 'lucide-react';
import { 
  EducationalDiagram, 
  SEEDED_EDUCATIONAL_DIAGRAMS 
} from '../lib/diagramLibrary';
import { toast } from 'react-hot-toast';
import { 
  SegmentedScheme, 
  SegmentedWeek, 
  getSegmentedSchemes, 
  saveSegmentedScheme,
  deleteSegmentedPipeline,
  deleteSegmentedSchemeById
} from '../services/segmentedSchemesService';
import { 
  GradeTimetable, 
  Weekday, 
  ALL_WEEKDAYS, 
  TERM_START_DATES,
  getGradeTeachingTimetable, 
  saveGradeTeachingTimetable, 
  resetTeachingTimetable,
  calculateForecastDaysForWeek,
  getMinimumActivitiesForDays,
  getSchemesMondayToFridayRange,
  isSecondaryGradeLevel,
  getSecondaryAllocatedSubjects,
  saveSecondaryAllocatedSubjects,
  getPeriodDurationForGrade,
  getSyncedTermStartDate,
  setSyncedTermStartDate
} from '../services/teachingTimetableService';
import { GRADES, OBC_GRADES, getSubjectsForGrade, DOC_TEMPLATES } from '../constants';
import { SYLLABI } from '../data/syllabi';
import { generateEducationalDoc, GenerationParams } from '../services/geminiService';
import { safeLocalStorage } from '../lib/storage';

interface SmartPlanningHubProps {
  onNavigateToPreview: (doc: { content: string; params: GenerationParams }, mode?: 'weekly_forecast' | 'lesson_plan') => void;
  onNavigateToGenerator?: (type: string, initialParams?: any) => void;
  userEmail?: string;
  userName?: string;
  initialMode?: 'timetable' | 'weekly_forecast' | 'lesson_plan';
}

const MANDATORY_FORECAST_INSTRUCTION = 
  "Generate the weekly forecast based on the segmented weekly forecast found and selected, do not borrow information from other segmented independent week or from the syllabus other information apart from what is already here. Let the weekly forecast formats follow the same formats already in the system.all generated documents must and should be syllabus compliant. The same syllabus the syllabus drop-down method is using is the same syllabus which must be present and used even here.  No generic information is needed (only the original Zambian syllabus per subject and per grade.)";

const MANDATORY_LESSON_INSTRUCTION = 
  "Generate a complete, official Zambian lesson plan based strictly on the segmented scheme and weekly forecast data. Adhere to official MOE format (CBC: Competencies & Expected Standards / OBC: Outcomes, Knowledge, Skills, Values). Do not invent outside topics.";

export function SmartPlanningHub({
  onNavigateToPreview,
  onNavigateToGenerator,
  userEmail,
  userName,
  initialMode = 'timetable'
}: SmartPlanningHubProps) {
  // Load persisted smart planning state so back navigation restores all fields identically
  const savedSmartState = useMemo(() => {
    try {
      const raw = safeLocalStorage.getItem('fortunes_smart_planning_state');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }, []);

  // Mode: Teaching Timetable, Segmented Weekly Forecast, or Segmented Lesson Plans
  const [planningMode, setPlanningMode] = useState<'timetable' | 'weekly_forecast' | 'lesson_plan'>(() => {
    return initialMode || (savedSmartState?.planningMode) || 'timetable';
  });

  // Sync with initialMode when prop changes
  useEffect(() => {
    if (initialMode) {
      setPlanningMode(initialMode);
    }
  }, [initialMode]);

  // 1. Data Store
  const [segmentedSchemes, setSegmentedSchemes] = useState<SegmentedScheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 2. Selectors
  const [curriculum, setCurriculum] = useState<'CBC' | 'OBC'>(() => savedSmartState?.curriculum || 'CBC');
  const [selectedGrade, setSelectedGrade] = useState<string>(() => savedSmartState?.selectedGrade || 'ECE level 1');
  const [selectedSubject, setSelectedSubject] = useState<string>(() => savedSmartState?.selectedSubject || 'Pre-Mathematics & Science');
  const [selectedWeek, setSelectedWeek] = useState<number>(() => savedSmartState?.selectedWeek || 1);

  // Timetable State - Always folded by default per system rule
  const [activeTimetable, setActiveTimetable] = useState<GradeTimetable | null>(null);
  const [isTimetableFolded, setIsTimetableFolded] = useState<boolean>(true);
  const [isEditingTimetable, setIsEditingTimetable] = useState<boolean>(false);
  const [timetableTerm, setTimetableTerm] = useState<string>('Term 3');
  const [termStartDate, setTermStartDate] = useState<string>(() => getSyncedTermStartDate('Term 3'));

  // Pre-Edit Review of Segmented Schemes Modal State
  const [isPreEditReviewOpen, setIsPreEditReviewOpen] = useState<boolean>(false);
  const [preEditSelectedSubject, setPreEditSelectedSubject] = useState<string>('');
  const [preEditWeeks, setPreEditWeeks] = useState<SegmentedWeek[]>([]);
  const [isSavingPreEdit, setIsSavingPreEdit] = useState<boolean>(false);

  // Available Segmented Schemes Modal & Inspection State
  const [isAvailableSchemesModalOpen, setIsAvailableSchemesModalOpen] = useState<boolean>(false);
  const [inspectedScheme, setInspectedScheme] = useState<SegmentedScheme | null>(null);

  // Live Interactive Scheme Extraction Progress Modal State
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] = useState<number>(0);
  const [extractionStep, setExtractionStep] = useState<string>('');
  const [extractedWeeksList, setExtractedWeeksList] = useState<any[]>([]);

  // Edit Week & Learning Activities State
  const [isEditWeekModalOpen, setIsEditWeekModalOpen] = useState<boolean>(false);
  const [editWeekForm, setEditWeekForm] = useState<SegmentedWeek>({
    weekNumber: 1,
    dateRange: '',
    topic: '',
    subtopics: '',
    specificCompetencies: '',
    expectedStandards: '',
    specificOutcomes: '',
    knowledge: '',
    skills: '',
    values: '',
    learningActivities: '',
    methodologies: '',
    tlAids: '',
    references: ''
  });

  const handleOpenEditModal = () => {
    const target = matchedWeek || effectiveLessonWeek;
    if (target) {
      setEditWeekForm({
        weekNumber: selectedWeek,
        dateRange: target.dateRange || `Week ${selectedWeek}`,
        topic: target.topic || '',
        subtopics: target.subtopics || '',
        specificCompetencies: target.specificCompetencies || target.specificOutcomes || '',
        expectedStandards: target.expectedStandards || '',
        specificOutcomes: target.specificOutcomes || '',
        knowledge: target.knowledge || '',
        skills: target.skills || '',
        values: target.values || '',
        learningActivities: target.learningActivities || '',
        methodologies: target.methodologies || '',
        tlAids: target.tlAids || '',
        references: target.references || ''
      });
    }
    setIsEditWeekModalOpen(true);
  };

  const handleSaveEditedWeek = async () => {
    if (!matchedScheme) {
      const defaultScheme: SegmentedScheme = {
        id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        documentOwner: teacherName,
        curriculum,
        grade: selectedGrade,
        subject: selectedSubject,
        term,
        year,
        createdAt: Date.now(),
        expiresAt: Date.now() + 90*24*60*60*1000,
        retentionMonths: 3,
        isPermanentThreeMonths: true,
        weeks: Array.from({ length: 13 }, (_, i) => ({
          weekNumber: i + 1,
          dateRange: `Week ${i + 1}`,
          topic: i + 1 === selectedWeek ? editWeekForm.topic : `Unit ${i + 1}`,
          subtopics: i + 1 === selectedWeek ? editWeekForm.subtopics : `Core Concept ${i + 1}`,
          specificCompetencies: i + 1 === selectedWeek ? editWeekForm.specificCompetencies : 'Mastery of curriculum core competencies',
          expectedStandards: i + 1 === selectedWeek ? editWeekForm.expectedStandards : 'Demonstrate mastery according to MOE standards',
          learningActivities: i + 1 === selectedWeek ? editWeekForm.learningActivities : 'Class discussions, guided practice, collaborative exercises',
          methodologies: i + 1 === selectedWeek ? editWeekForm.methodologies : 'Inquiry-based learning, interactive demonstration',
          tlAids: i + 1 === selectedWeek ? editWeekForm.tlAids : 'Chalkboard, learner textbook, wall chart',
          references: i + 1 === selectedWeek ? editWeekForm.references : `${selectedGrade} ${curriculum} Syllabus, MOE Zambia`
        }))
      };
      await saveSegmentedScheme(defaultScheme);
      const updated = await getSegmentedSchemes();
      setSegmentedSchemes(updated);
      setIsEditWeekModalOpen(false);
      toast.success("Week information and learning activities saved successfully!");
      return;
    }

    const updatedWeeks = matchedScheme.weeks.map(w => w.weekNumber === selectedWeek ? { ...editWeekForm } : w);
    const updatedScheme = { ...matchedScheme, weeks: updatedWeeks };
    await saveSegmentedScheme(updatedScheme);
    const updated = await getSegmentedSchemes();
    setSegmentedSchemes(updated);
    setIsEditWeekModalOpen(false);
    toast.success(`Week ${selectedWeek} updated successfully!`);
  };

  // Grades Set for Timetable per user
  const [userTimetableGrades, setUserTimetableGrades] = useState<string[]>(() => {
    try {
      const saved = safeLocalStorage.getItem('user_timetable_grades');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['ECE level 1', 'Grade 1 (CBC)', 'Grade 4 (CBC)', 'Form 1 (CBC)', 'Grade 7 (OBC)', 'Grade 12 (OBC)'];
  });
  const [isEditingGradesSet, setIsEditingGradesSet] = useState<boolean>(false);

  // Profile Expansion state for foldable General Information Registration Block
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(false);

  // Secondary allocated subjects (Form 1 to Form 6 / Grades 8 to 12)
  const isSecondary = useMemo(() => isSecondaryGradeLevel(selectedGrade), [selectedGrade]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<string[]>(() => {
    return isSecondaryGradeLevel(selectedGrade) ? (getSecondaryAllocatedSubjects(selectedGrade) || []) : [];
  });

  // Reload secondary allocated subjects when selected grade changes
  useEffect(() => {
    if (isSecondaryGradeLevel(selectedGrade)) {
      const saved = getSecondaryAllocatedSubjects(selectedGrade);
      setAllocatedSubjects(saved || []);
    } else {
      setAllocatedSubjects([]);
    }
  }, [selectedGrade]);

  // General Information Registration Block (Synced persistently like Schemes, Forecast, and Lesson Plans)
  const [teacherName, setTeacherName] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('teacher_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teacherName) return parsed.teacherName;
      }
    } catch (e) {}
    return userName || 'Class Teacher';
  });
  const [tsNumber, setTsNumber] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('teacher_info');
      if (saved) return JSON.parse(saved).tsNumber || '';
    } catch (e) {}
    return '';
  });
  const [schoolName, setSchoolName] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('teacher_info');
      if (saved) return JSON.parse(saved).school || 'Basic School';
    } catch (e) {}
    return 'Basic School';
  });
  const [district, setDistrict] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('teacher_info');
      if (saved) return JSON.parse(saved).district || 'Milenge';
    } catch (e) {}
    return 'Milenge';
  });
  const [zone, setZone] = useState<string>(() => {
    try {
      const saved = safeLocalStorage.getItem('teacher_info');
      if (saved) return JSON.parse(saved).zone || '';
    } catch (e) {}
    return '';
  });
  const [term, setTerm] = useState<string>('Term 3');
  const [year, setYear] = useState<string>('2026');

  // Deletion state
  const [isDeletingPipeline, setIsDeletingPipeline] = useState<boolean>(false);

  // Automatically persist general registration block on change
  useEffect(() => {
    try {
      const existing = safeLocalStorage.getItem('teacher_info');
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = {
        ...parsed,
        teacherName,
        tsNumber,
        school: schoolName,
        district,
        zone
      };
      safeLocalStorage.setItem('teacher_info', JSON.stringify(updated));
    } catch (e) {}
  }, [teacherName, tsNumber, schoolName, district, zone]);

  // Lesson Plan Specific State: Auto-adjust period duration based on official Zambia curriculum framework
  // - ECE to Grade 3 CBC: 30 minutes (08:00 - 08:30)
  // - Upper Primary & Secondary: 40 minutes (08:00 - 08:40)
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(() => savedSmartState?.selectedLessonIndex || 0);

  // Helper to calculate exact duration in minutes between from and to time strings
  const calculateClockDurationMins = (from: string, to: string): number => {
    if (!from || !to) return 40;
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    if (isNaN(fh) || isNaN(fm) || isNaN(th) || isNaN(tm)) return 40;
    let diff = (th * 60 + tm) - (fh * 60 + fm);
    if (diff < 0) diff += 24 * 60;
    return Math.max(1, diff);
  };

  const initialDefaultTime = getPeriodDurationForGrade(selectedGrade).defaultTime;
  const initialTimeParts = initialDefaultTime.split('-').map(s => s.trim());

  const [clockFromTime, setClockFromTime] = useState<string>(() => savedSmartState?.clockFromTime || initialTimeParts[0] || '08:00');
  const [clockToTime, setClockToTime] = useState<string>(() => savedSmartState?.clockToTime || initialTimeParts[1] || '08:40');
  const [lessonTime, setLessonTime] = useState<string>(() => savedSmartState?.lessonTime || initialDefaultTime);
  const [lessonDuration, setLessonDuration] = useState<string>(() => {
    if (savedSmartState?.lessonDuration) return savedSmartState.lessonDuration;
    const diff = calculateClockDurationMins(clockFromTime, clockToTime);
    return `${diff} min`;
  });

  const [boysCount, setBoysCount] = useState<string>(() => savedSmartState?.boysCount || '20');
  const [girlsCount, setGirlsCount] = useState<string>(() => savedSmartState?.girlsCount || '22');
  const [scale, setScale] = useState<'lighter' | 'medium'>(() => savedSmartState?.scale || 'lighter');

  // Lesson Plan Options: Homework Choice & Real Teaching Diagram Inclusion
  const [includeHomework, setIncludeHomework] = useState<boolean>(() => savedSmartState?.includeHomework || false);
  const [includeLessonDiagram, setIncludeLessonDiagram] = useState<boolean>(() => savedSmartState?.includeLessonDiagram !== false);
  const [selectedLessonDiagram, setSelectedLessonDiagram] = useState<{
    title: string;
    topic: string;
    subtopic: string;
    svgContent?: string;
  } | undefined>(undefined);
  const [isDiagramLibraryOpen, setIsDiagramLibraryOpen] = useState<boolean>(false);
  const [diagramSearch, setDiagramSearch] = useState<string>('');

  // Clock change handler that automatically calculates and fills duration in minutes
  const handleClockTimeChange = (newFrom: string, newTo: string) => {
    setClockFromTime(newFrom);
    setClockToTime(newTo);
    const mins = calculateClockDurationMins(newFrom, newTo);
    setLessonDuration(`${mins} min`);
    setLessonTime(`${newFrom} - ${newTo}`);
  };

  // React to grade changes to set period duration
  useEffect(() => {
    const { duration, defaultTime } = getPeriodDurationForGrade(selectedGrade);
    const parts = defaultTime.split('-').map(s => s.trim());
    if (parts.length === 2) {
      setClockFromTime(parts[0]);
      setClockToTime(parts[1]);
      const diff = calculateClockDurationMins(parts[0], parts[1]);
      setLessonDuration(`${diff} min`);
    } else {
      setLessonDuration(duration);
    }
    setLessonTime(defaultTime);
  }, [selectedGrade]);

  // Persist all smart planning inputs so back from preview restores all details intact
  useEffect(() => {
    try {
      const stateToPersist = {
        curriculum,
        selectedGrade,
        selectedSubject,
        selectedWeek,
        selectedLessonIndex,
        clockFromTime,
        clockToTime,
        lessonTime,
        lessonDuration,
        boysCount,
        girlsCount,
        includeHomework,
        includeLessonDiagram,
        scale,
        planningMode
      };
      safeLocalStorage.setItem('fortunes_smart_planning_state', JSON.stringify(stateToPersist));
    } catch (e) {}
  }, [curriculum, selectedGrade, selectedSubject, selectedWeek, selectedLessonIndex, clockFromTime, clockToTime, lessonTime, lessonDuration, boysCount, girlsCount, includeHomework, includeLessonDiagram, scale, planningMode]);

  // Synchronize term start date helper
  const handleUpdateTermStartDate = (newDate: string) => {
    setTermStartDate(newDate);
    setSyncedTermStartDate(newDate);
  };

  // Settings & Toggles
  const [instructions, setInstructions] = useState<string>(MANDATORY_FORECAST_INSTRUCTION);
  const [showSyllabusBrowser, setShowSyllabusBrowser] = useState<boolean>(false);
  const [activeSegmentPreviewModal, setActiveSegmentPreviewModal] = useState<boolean>(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Load active 3-month segmented schemes
  const loadSchemes = async () => {
    setIsLoading(true);
    try {
      const schemes = await getSegmentedSchemes();
      setSegmentedSchemes(schemes);
    } catch (e) {
      console.warn('Error loading segmented schemes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load timetable for currently selected grade
  const loadTimetableForGrade = async (grade: string, termName: string) => {
    try {
      const tb = await getGradeTeachingTimetable(grade, termName);
      setActiveTimetable(tb);
      if (tb.termStartDate) {
        setTermStartDate(tb.termStartDate);
      }
    } catch (e) {
      console.warn('Error loading grade timetable:', e);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  useEffect(() => {
    loadTimetableForGrade(selectedGrade, timetableTerm);
  }, [selectedGrade, timetableTerm]);

  // Sync instruction box per mode
  useEffect(() => {
    if (planningMode === 'weekly_forecast') {
      setInstructions(MANDATORY_FORECAST_INSTRUCTION);
    } else if (planningMode === 'lesson_plan') {
      setInstructions(MANDATORY_LESSON_INSTRUCTION);
    }
  }, [planningMode]);

  // Pure CBC grades
  const availableGrades = useMemo(() => {
    return GRADES.filter(g => !g.toLowerCase().includes('(obc)'));
  }, []);

  // Ensure selectedGrade is valid
  useEffect(() => {
    if (selectedGrade.toLowerCase().includes('(obc)') || !availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0] || 'ECE level 1');
    }
  }, [availableGrades, selectedGrade]);

  // Available subjects for the selected grade (CBC Lower Primary has "Mathematics and Science" combined; ECE has Pre-Mathematics & Science; OBC keeps separate)
  const availableSubjects = useMemo(() => {
    const base = getSubjectsForGrade(selectedGrade);
    const gLower = selectedGrade.toLowerCase();
    const isLowerPrimaryCBC = curriculum === 'CBC' && (
      (gLower.includes('grade 1') && !gLower.includes('grade 10') && !gLower.includes('grade 11') && !gLower.includes('grade 12')) ||
      gLower.includes('grade 2') ||
      gLower.includes('grade 3')
    );

    if (isLowerPrimaryCBC) {
      const filtered = base.filter(s => s !== 'Mathematics' && s !== 'Integrated Science' && s !== 'Science');
      if (!filtered.includes('Mathematics and Science')) {
        filtered.unshift('Mathematics and Science');
      }
      return filtered;
    }
    return base;
  }, [selectedGrade, curriculum]);

  // Ensure selectedSubject is valid for current grade
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Scheduled days for selected subject from active timetable
  const subjectScheduledDays: Weekday[] = useMemo(() => {
    if (!activeTimetable || !activeTimetable.subjectSchedules) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }
    const sched = activeTimetable.subjectSchedules[selectedSubject];
    if (sched && Array.isArray(sched.days) && sched.days.length > 0) {
      return sched.days;
    }
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }, [activeTimetable, selectedSubject]);

  // Filtered forecast days for selected week based strictly on scheduled days
  const weekForecastDays = useMemo(() => {
    return calculateForecastDaysForWeek(selectedWeek, subjectScheduledDays, termStartDate);
  }, [selectedWeek, subjectScheduledDays, termStartDate]);

  // Matches official syllabus units and topics directly from uploaded syllabi without generic fallback
  const syllabusData = useMemo(() => {
    const matchedGradeKey = Object.keys(SYLLABI).find(k => k.toLowerCase() === selectedGrade.toLowerCase()) || selectedGrade;
    const gradeData = SYLLABI[matchedGradeKey] || {};
    const matchedSubjectKey = Object.keys(gradeData).find(s => s.toLowerCase() === selectedSubject.toLowerCase()) || selectedSubject;
    const topics: any[] = gradeData[matchedSubjectKey] || [];
    return topics;
  }, [selectedGrade, selectedSubject]);

  // Find exact matching Segmented Scheme in the 3-Month Persistent Storage
  const matchedScheme = useMemo(() => {
    return segmentedSchemes.find(s => 
      s.curriculum === curriculum &&
      s.grade.toLowerCase() === selectedGrade.toLowerCase() &&
      s.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
  }, [segmentedSchemes, curriculum, selectedGrade, selectedSubject]);

  // 2. The term starting date should match the date showing in the scheme's planning interface
  useEffect(() => {
    if (matchedScheme?.termStartDate) {
      setTermStartDate(matchedScheme.termStartDate);
      if (matchedScheme.term) {
        setTerm(matchedScheme.term);
        setTimetableTerm(matchedScheme.term);
      }
      if (matchedScheme.year) {
        setYear(String(matchedScheme.year));
      }
    }
  }, [matchedScheme]);

  // Find exact week inside the matched scheme
  const matchedWeek: SegmentedWeek | null = useMemo(() => {
    if (!matchedScheme || !matchedScheme.weeks) return null;
    return matchedScheme.weeks.find(w => w.weekNumber === selectedWeek) || null;
  }, [matchedScheme, selectedWeek]);

  // Handle toggling allocated secondary subject
  const handleToggleAllocatedSubject = (sub: string) => {
    let next: string[];
    if (allocatedSubjects.includes(sub)) {
      next = allocatedSubjects.filter(s => s !== sub);
    } else {
      next = [...allocatedSubjects, sub];
    }
    setAllocatedSubjects(next);
    saveSecondaryAllocatedSubjects(selectedGrade, next);
    if (next.length > 0) {
      toast.success(`Subject allocation updated: ${next.length} subject(s) allocated.`);
    } else {
      toast.success(`All subjects displayed for ${selectedGrade}`);
    }
  };

  // Timetable displayed subjects: If secondary and teacher has selected allocated subjects, display only those!
  const timetableSubjects = useMemo(() => {
    if (isSecondary && allocatedSubjects.length > 0) {
      return availableSubjects.filter(s => allocatedSubjects.includes(s));
    }
    return availableSubjects;
  }, [isSecondary, allocatedSubjects, availableSubjects]);

  // Selected Lesson details for Lesson Plan mode
  const currentLessonSlot = weekForecastDays[selectedLessonIndex] || weekForecastDays[0];

  // Citation string
  const syllabusCitation = useMemo(() => {
    if (matchedWeek?.references) {
      return matchedWeek.references;
    }
    return `${selectedGrade} Official ${curriculum} Syllabus, Ministry of Education Zambia`;
  }, [matchedWeek, selectedGrade, curriculum]);

  // Authoritative segmented lesson week: falls back to real Zambian syllabus data if not yet segmented
  const effectiveLessonWeek: SegmentedWeek = useMemo(() => {
    if (matchedWeek) return matchedWeek;
    
    // Derive directly from uploaded Zambian syllabus data
    const matchedGradeKey = Object.keys(SYLLABI).find(k => k.toLowerCase() === selectedGrade.toLowerCase()) || selectedGrade;
    const gradeData = SYLLABI[matchedGradeKey] || {};
    const matchedSubjectKey = Object.keys(gradeData).find(s => s.toLowerCase() === selectedSubject.toLowerCase()) || selectedSubject;
    const topics: any[] = gradeData[matchedSubjectKey] || Object.values(gradeData)[0] || [];

    const weekIdx = Math.max(0, selectedWeek - 1);
    const topicIdx = weekIdx % Math.max(1, topics.length);
    const activeTopic = topics[topicIdx] || { title: `Curriculum Unit ${selectedWeek}`, subtopics: [] };
    const topicTitle = activeTopic.title || activeTopic.name || `Topic for Week ${selectedWeek}`;

    let subList: any[] = [];
    if (Array.isArray(activeTopic.subtopics)) subList = activeTopic.subtopics;
    
    const subIdx = selectedLessonIndex % Math.max(1, subList.length);
    const activeSub = subList[subIdx] || subList[0];
    const subTitle = typeof activeSub === 'string' ? activeSub : (activeSub?.title || activeSub?.name || topicTitle);

    const comps = typeof activeSub === 'object' && Array.isArray(activeSub?.competencies) && activeSub.competencies.length > 0
      ? activeSub.competencies.join('; ')
      : (activeTopic.generalCompetency || `Demonstrate understanding and application of ${subTitle}`);

    let stds = 'Demonstrate mastery according to syllabus performance standards.';
    if (typeof activeSub === 'object') {
      if (Array.isArray(activeSub.expectedStandard)) stds = activeSub.expectedStandard.join('; ');
      else if (typeof activeSub.expectedStandard === 'string') stds = activeSub.expectedStandard;
      else if (Array.isArray(activeSub.expectedStandards)) stds = activeSub.expectedStandards.join('; ');
    }

    let acts = 'Class investigations, paired discussions, guided learner exercises.';
    if (typeof activeSub === 'object') {
      if (Array.isArray(activeSub.learningActivities)) acts = activeSub.learningActivities.join('; ');
      else if (typeof activeSub.learningActivities === 'object' && activeSub.learningActivities) {
        acts = (Object.values(activeSub.learningActivities).flat() as string[]).join('; ');
      }
    }

    const know = typeof activeSub === 'object' ? activeSub.knowledge : `Core principles and concepts of ${subTitle}`;
    const skills = typeof activeSub === 'object' ? activeSub.skills : 'Problem-solving, critical analysis, communication';
    const values = typeof activeSub === 'object' ? activeSub.values : 'Accuracy, perseverance, curiosity, teamwork';

    return {
      weekNumber: selectedWeek,
      dateRange: `Week ${selectedWeek} Schedule`,
      topic: topicTitle,
      subtopics: subTitle,
      specificCompetencies: comps,
      specificOutcomes: comps,
      expectedStandards: stds,
      knowledge: know,
      skills: skills,
      values: values,
      learningActivities: acts,
      methodologies: 'Inquiry-based learning, interactive demonstration, communicative problem solving.',
      tlAids: 'Approved Learner Book, chalkboard, illustrative charts, realia.',
      references: syllabusCitation
    };
  }, [matchedWeek, selectedGrade, selectedSubject, selectedWeek, selectedLessonIndex, syllabusCitation]);

  // Set period allocation (0, 1, or 2) for a subject on a specific day
  const handleSetDayPeriod = (sub: string, day: Weekday, periods: number) => {
    if (!activeTimetable) return;
    const currentSched = activeTimetable.subjectSchedules?.[sub] || { subject: sub, days: [] };
    let currentDays = [...(currentSched.days || [])];
    const currentPeriods = { ...(currentSched.dayPeriods || {}) };

    if (periods <= 0) {
      currentDays = currentDays.filter(d => d !== day);
      delete currentPeriods[day];
    } else {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
      currentPeriods[day] = periods;
    }

    const updated: GradeTimetable = {
      ...activeTimetable,
      subjectSchedules: {
        ...activeTimetable.subjectSchedules,
        [sub]: {
          ...currentSched,
          days: currentDays,
          dayPeriods: currentPeriods
        }
      }
    };
    setActiveTimetable(updated);
  };

  // Toggle a day for a subject in the timetable
  const handleToggleDayForSubject = (sub: string, day: Weekday) => {
    if (!activeTimetable) return;
    const currentSched = activeTimetable.subjectSchedules?.[sub] || { subject: sub, days: [] };
    const currentDays = currentSched.days || [];
    const isCurrentlyScheduled = currentDays.includes(day);
    handleSetDayPeriod(sub, day, isCurrentlyScheduled ? 0 : 1);
  };

  // Save timetable changes
  const handleSaveTimetable = async () => {
    if (!activeTimetable) return;
    try {
      const toSave: GradeTimetable = {
        ...activeTimetable,
        term: timetableTerm,
        termStartDate,
        curriculum,
        isSavedByUser: true
      };
      await saveGradeTeachingTimetable(toSave);
      setActiveTimetable(toSave);
      setIsEditingTimetable(false);
      toast.success(`Teaching Timetable for ${selectedGrade} saved securely for 3 months!`);
    } catch (e: any) {
      toast.error('Failed to save timetable');
    }
  };

  // Reset timetable
  const handleResetTimetable = async () => {
    if (window.confirm(`Reset Teaching Timetable for ${selectedGrade} back to default schedules?`)) {
      try {
        await resetTeachingTimetable(selectedGrade);
        await loadTimetableForGrade(selectedGrade, timetableTerm);
        setIsEditingTimetable(false);
        toast.success(`Teaching Timetable for ${selectedGrade} reverted to default.`);
      } catch (e) {
        toast.error('Failed to reset timetable');
      }
    }
  };

  /**
   * CRITICAL LEARNING ACTIVITIES PERIODS ALLOCATION LOGIC (SEALED):
   * - 2 periods can carry MAX 2 learning activities joined as bulletins to make 1 lesson
   * - 1 period = 1 learning activity = 1 lesson
   * - System detects how many lessons have 2 periods vs 1 period and allocates accordingly.
   * - If week has more activities than timetable days, joins related activities into 2-period days in bulletins.
   */
  const distributeLearningActivities = (rawActivities: string | undefined, lessonCount: number, subName?: string): string[][] => {
    const count = Math.max(1, lessonCount || 5);
    if (!rawActivities || !rawActivities.trim()) {
      return Array.from({ length: count }, () => ['Interactive class exploration and guided exercise']);
    }

    let items = rawActivities
      .split(/(?:;\s*|\n+|\d+\.\s+)/)
      .map(a => a.trim().replace(/^[-*•]\s*/, ''))
      .filter(a => a.length > 2);

    if (items.length <= 1) {
      items = rawActivities
        .split(/,\s*(?=[A-Z]|Learners|Pupils|Teacher|Group|Individual|Demonstrating|Discussing|Solving)/)
        .map(a => a.trim())
        .filter(a => a.length > 2);
    }

    if (items.length === 0) {
      items = [rawActivities.trim()];
    }

    const targetSub = subName || selectedSubject;
    const sched = activeTimetable?.subjectSchedules?.[targetSub];
    const dayPeriodsList = weekForecastDays.map(d => sched?.dayPeriods?.[d.day as Weekday] || 1);

    const buckets: string[][] = [];
    let itemIdx = 0;

    for (let i = 0; i < count; i++) {
      const periodForDay = dayPeriodsList[i] || 1;
      const maxActs = periodForDay >= 2 ? 2 : 1;
      const bucket: string[] = [];

      for (let k = 0; k < maxActs && itemIdx < items.length; k++) {
        bucket.push(items[itemIdx]);
        itemIdx++;
      }

      if (bucket.length === 0) {
        bucket.push(items[i % items.length] || 'Guided learner practice and evaluation');
      }

      buckets.push(bucket);
    }

    // Fold any remaining activities into 2-period days up to max 2
    while (itemIdx < items.length) {
      let placed = false;
      for (let i = 0; i < count; i++) {
        const periodForDay = dayPeriodsList[i] || 1;
        if (periodForDay >= 2 && buckets[i].length < 2) {
          buckets[i].push(items[itemIdx]);
          itemIdx++;
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }

    return buckets;
  };

  // Delete schemes for selected subject pipeline (leaving timetable intact)
  const handleDeleteSchemes = async () => {
    if (!window.confirm(`Are you sure you want to delete all segments of Schemes of Work for ${selectedGrade} - ${selectedSubject}? This will clean this preparation pipeline for a fresh start. Your Teaching Timetable will remain intact.`)) {
      return;
    }
    setIsDeletingPipeline(true);
    try {
      await deleteSegmentedPipeline(curriculum, selectedGrade, selectedSubject);
      toast.success(`Schemes of work for ${selectedGrade} - ${selectedSubject} deleted. Pipeline reset to fresh start. Timetable remains intact.`);
      await loadSchemes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete schemes pipeline.');
    } finally {
      setIsDeletingPipeline(false);
    }
  };

  // 1. Generate Segmented Weekly Forecast
  const handleGenerateWeeklyForecast = async () => {
    const targetWeek = matchedWeek || effectiveLessonWeek;
    if (!targetWeek) {
      toast.error(`No curriculum data available for ${selectedGrade} - ${selectedSubject}.`);
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Preparing segmented week forecast aligned with Teaching Timetable...');

    try {
      const minActivities = getMinimumActivitiesForDays(weekForecastDays.length);
      const scheduledDaysNames = weekForecastDays.map(d => `${d.day} (${d.formattedDate})`).join(', ');

      const distributedActivities = distributeLearningActivities(targetWeek.learningActivities, weekForecastDays.length);

      const customSegmentContent = `
SEGMENTED WEEK ${selectedWeek} TIMETABLE FORECAST INFORMATION:
Document Owner: ${teacherName} (${schoolName})
TS Number: ${tsNumber || 'N/A'}
District: ${district} | Zone: ${zone}
Week Number: Week ${selectedWeek}
Scheduled Teaching Days (${weekForecastDays.length} days/week): ${scheduledDaysNames}
Subject: ${selectedSubject}
Grade: ${selectedGrade} (${curriculum})
Topic of that week: ${targetWeek.topic}
Subtopics: ${targetWeek.subtopics}
${curriculum === 'CBC' 
  ? `Specific Competencies: ${targetWeek.specificCompetencies || ''}\nExpected Standards: ${targetWeek.expectedStandards || ''}` 
  : `Specific Outcomes: ${targetWeek.specificOutcomes || ''}\nKnowledge: ${targetWeek.knowledge || ''}\nSkills: ${targetWeek.skills || ''}\nValues: ${targetWeek.values || ''}`}
Learning Activities: ${targetWeek.learningActivities} (Distributed into lessons without leaving any activity out: ${distributedActivities.map((acts, i) => `Day ${i + 1}: [${acts.join('; ')}]`).join(', ')})
Methodologies: ${targetWeek.methodologies}
T/L Aids: ${targetWeek.tlAids}
References: ${targetWeek.references}
Scale Mode: ${scale}

CRITICAL TIMETABLE FILTERING MANDATE:
Generate exactly ${weekForecastDays.length} rows for the scheduled days: ${scheduledDaysNames}.
Do not include any unscheduled days (they must jump directly to the next scheduled day with its correct date).
All ${targetWeek.learningActivities ? 'learning activities' : 'activities'} from the scheme must be fully exhausted across these lessons.
`;

      const daysArray = weekForecastDays.map((d, idx) => ({
        day: d.day,
        date: d.formattedDate,
        topic: targetWeek.topic,
        subtopic: targetWeek.subtopics,
        competency: targetWeek.specificCompetencies || targetWeek.specificOutcomes,
        expectedStandard: targetWeek.expectedStandards || targetWeek.knowledge,
        activities: distributedActivities[idx] || [targetWeek.learningActivities],
        teachingAids: targetWeek.tlAids,
        references: targetWeek.references
      }));

      const dateRangeText = weekForecastDays.length > 0 
        ? `${weekForecastDays[0].formattedDate} to ${weekForecastDays[weekForecastDays.length - 1].formattedDate}`
        : `${termStartDate}`;

      const generationParams: GenerationParams = {
        type: 'weekly_forecast',
        curriculumType: curriculum,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: matchedWeek.topic,
        subtopic: matchedWeek.subtopics,
        forecastWeek: selectedWeek,
        forecastDays: daysArray,
        date: dateRangeText,
        contentScale: scale,
        teacherName,
        schoolName,
        tsNumber,
        district,
        zone,
        term,
        year,
        additionalInstructions: `${instructions}\n\n${customSegmentContent}`,
        additionalContext: customSegmentContent,
      };

      setGenerationStep(`Invoking Gemini API to generate timetable-aligned Week ${selectedWeek} forecast...`);
      const selectedTemplate = DOC_TEMPLATES.find(t => t.id === 'weekly_forecast') || DOC_TEMPLATES[0];
      const docHtml = await generateEducationalDoc(generationParams, selectedTemplate);

      if (docHtml) {
        toast.success(`Week ${selectedWeek} Forecast generated successfully!`);
        onNavigateToPreview({
          content: docHtml,
          params: generationParams
        }, 'weekly_forecast');
      } else {
        throw new Error('No content returned from AI generation.');
      }
    } catch (err: any) {
      console.error('Segmented Weekly generation error:', err);
      toast.error(err.message || 'Failed to generate weekly forecast from segmented week.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // 2. Generate Segmented Lesson Plan
  const handleGenerateLessonPlan = async () => {
    const targetWeek = matchedWeek || effectiveLessonWeek;
    if (!targetWeek) {
      toast.error(`No curriculum data available for ${selectedGrade} - ${selectedSubject}.`);
      return;
    }

    if (!currentLessonSlot) {
      toast.error(`Please select a valid scheduled teaching day from the timetable.`);
      return;
    }

    setIsGenerating(true);
    setGenerationStep(`Extracting ${currentLessonSlot.day} (${currentLessonSlot.formattedDate}) lesson details...`);

    try {
      const distributedActivities = distributeLearningActivities(targetWeek.learningActivities, weekForecastDays.length);
      const lessonIdx = Math.max(0, currentLessonSlot.lessonIndex - 1);
      const dayActivities = distributedActivities[lessonIdx] || [targetWeek.learningActivities];

      const customSegmentContent = `
SEGMENTED LESSON PLAN SPECIFICATION:
Curriculum: ${curriculum}
Grade: ${selectedGrade}
Subject: ${selectedSubject}
Week: Week ${selectedWeek}
Day: ${currentLessonSlot.day} (Date: ${currentLessonSlot.formattedDate})
Lesson Number: Lesson ${currentLessonSlot.lessonIndex} of ${weekForecastDays.length}
Time: ${lessonTime} (${lessonDuration})
Teacher: ${teacherName}
TS Number: ${tsNumber || 'N/A'}
School: ${schoolName} (District: ${district}, Zone: ${zone})
Term: ${term}, Year: ${year}
Enrolment: ${boysCount} Boys, ${girlsCount} Girls (Total: ${parseInt(boysCount || '0') + parseInt(girlsCount || '0')})
TOPIC (from Segmented Week ${selectedWeek}): ${targetWeek.topic}
SUBTOPIC: ${targetWeek.subtopics}
${curriculum === 'CBC' 
  ? `SPECIFIC COMPETENCIES: ${targetWeek.specificCompetencies || ''}\nEXPECTED STANDARDS: ${targetWeek.expectedStandards || ''}`
  : `SPECIFIC OUTCOMES: ${targetWeek.specificOutcomes || ''}\nKNOWLEDGE: ${targetWeek.knowledge || ''}\nSKILLS: ${targetWeek.skills || ''}\nVALUES: ${targetWeek.values || ''}`}
LEARNING ACTIVITIES ALLOTTED FOR THIS LESSON: ${dayActivities.join('; ')}
(Segmented from Week ${selectedWeek}'s learning activities without leaving anything out)
METHODOLOGIES: ${targetWeek.methodologies}
T/L AIDS: ${targetWeek.tlAids}
REFERENCES: ${targetWeek.references}
`;

      const generationParams: GenerationParams = {
        type: 'lesson_plan',
        curriculumType: curriculum,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: targetWeek.topic,
        subtopic: targetWeek.subtopics,
        lessonWeekNumber: String(selectedWeek),
        lessonNumber: String(currentLessonSlot.lessonIndex),
        dayOfWeek: currentLessonSlot.day,
        date: currentLessonSlot.formattedDate,
        time: lessonTime,
        duration: lessonDuration,
        teacherName,
        schoolName,
        tsNumber,
        district,
        zone,
        term,
        year,
        enrolmentBoys: boysCount,
        enrolmentGirls: girlsCount,
        attendanceBoys: boysCount,
        attendanceGirls: girlsCount,
        specificCompetences: matchedWeek.specificCompetencies || matchedWeek.specificOutcomes,
        expectedStandard: matchedWeek.expectedStandards,
        knowledge: matchedWeek.knowledge,
        skills: matchedWeek.skills,
        values: matchedWeek.values,
        learningActivities: dayActivities,
        teachingMethods: matchedWeek.methodologies ? matchedWeek.methodologies.split(/[,;]/).map(m => m.trim()) : undefined,
        teachingAids: matchedWeek.tlAids,
        references: matchedWeek.references,
        contentScale: scale,
        includeHomework,
        includeLessonDiagram,
        selectedLessonDiagram,
        additionalInstructions: `${instructions}\n\n${customSegmentContent}\n\n${includeHomework ? 'INCLUDE HOMEWORK: Include a dedicated aligned Homework tasks section between the lesson table and evaluation on page 2.' : 'HOMEWORK: Omit homework section.'}\n${includeLessonDiagram ? 'REAL TEACHING DIAGRAM: Include a clear compact curriculum teaching diagram in Stage 2 / Teaching Aids.' : 'DIAGRAM: Text only lesson plan.'}`,
      };

      setGenerationStep(`Invoking Gemini API to generate formal segmented ${currentLessonSlot.day} lesson plan...`);
      const selectedTemplate = DOC_TEMPLATES.find(t => t.id === 'lesson_plan') || DOC_TEMPLATES[0];
      const docHtml = await generateEducationalDoc(generationParams, selectedTemplate);

      if (docHtml) {
        toast.success(`Lesson Plan for ${currentLessonSlot.day} (Week ${selectedWeek}) generated successfully!`);
        onNavigateToPreview({
          content: docHtml,
          params: generationParams
        }, 'lesson_plan');
      } else {
        throw new Error('No content returned from AI generation.');
      }
    } catch (err: any) {
      console.error('Segmented Lesson Plan generation error:', err);
      toast.error(err.message || 'Failed to generate lesson plan from segmented week.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header Banner & 3-Month Permanence Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Smart Planning &bull; 3-Month Permanent Resilient Storage</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
              <span>Segmented Planning Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Configure your <strong>Teaching Timetable</strong> once per term. It aligns your <strong>Schemes of Work</strong> (5, 4, 3, or 2 activities) and filters the <strong>Weekly Forecast</strong> and <strong>Lesson Plans</strong> by exact scheduled days for <strong>90 days</strong>.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5 shrink-0 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Timetable Status</span>
              <span className="text-sm font-black text-emerald-300">Active (90 Days Protected)</span>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Segmented Schemes</span>
              <button
                type="button"
                onClick={() => setIsAvailableSchemesModalOpen(true)}
                className="text-sm font-black text-white hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors group mt-0.5"
                title="Click to check what schemes are available"
              >
                <span>{segmentedSchemes.length} Available</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30 font-bold flex items-center gap-1">
                  <Eye size={11} />
                  <span>Check Available</span>
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToGenerator?.('schemes_of_work', { grade: selectedGrade, subject: selectedSubject, curriculum, term: timetableTerm })}
              className="mt-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 border border-blue-400/40"
              title="Generate Schemes of Work"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>Generate Schemes</span>
            </button>
          </div>
        </div>

        {/* Upload Foreign / App-Generated Schemes of Work Card */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
              <FileText size={14} />
              Upload Schemes of Work (App-Generated or Foreign Schemes)
            </span>
            <p className="text-[11px] text-slate-300 font-medium">
              Upload any schemes of work file (PDF, TXT, Word, or Image). The system will strictly translate, parse, and segment it from Week 1 to 13 into app format with 3-month permanent storage.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <input
              type="file"
              id="smart-schemes-upload"
              accept=".pdf,.doc,.docx,.txt,image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsLoading(true);
                toast.success(`Reading and translating "${file.name}" to 13-week smart planning format...`);
                try {
                  let text = '';
                  if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
                    const buf = await file.arrayBuffer();
                    text = new TextDecoder().decode(buf).replace(/[^\x20-\x7E\n]/g, ' ');
                  } else {
                    text = await file.text();
                  }

                  if (!text || text.length < 20) {
                    text = `Uploaded Schemes of Work: ${file.name} for ${selectedGrade} - ${selectedSubject}. Week 1 to 13 topics and learning activities.`;
                  }

                  const { parseAndSegmentSchemesContent, saveSegmentedScheme } = await import('../services/segmentedSchemesService');
                  const parsed = await parseAndSegmentSchemesContent(text, {
                    curriculum,
                    grade: selectedGrade,
                    subject: selectedSubject,
                    term: timetableTerm,
                    year: new Date().getFullYear()
                  });

                  await saveSegmentedScheme(parsed);
                  await loadSchemes();
                  toast.success(`✨ Schemes successfully translated, segmented to 13 weeks, and saved for ${selectedGrade} - ${selectedSubject}!`);
                } catch (err: any) {
                  console.error('Schemes upload translation error:', err);
                  toast.error(err.message || 'Failed to translate and segment uploaded schemes.');
                } finally {
                  setIsLoading(false);
                  if (e.target) e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => onNavigateToGenerator?.('schemes_of_work', { grade: selectedGrade, subject: selectedSubject, curriculum, term: timetableTerm })}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles size={14} />
              <span>Generate Schemes</span>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('smart-schemes-upload')?.click()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileText size={14} />
              <span>Upload &amp; Translate Schemes</span>
            </button>
          </div>
        </div>

        {/* Top 3 Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
          <button
            onClick={() => setPlanningMode('timetable')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              planningMode === 'timetable'
                ? 'bg-[#00A86B] text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
          >
            <Table size={15} />
            <span>1. Teaching Timetable</span>
          </button>
          <button
            onClick={() => setPlanningMode('weekly_forecast')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              planningMode === 'weekly_forecast'
                ? 'bg-[#00A86B] text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
          >
            <Calendar size={15} />
            <span>2. Segmented Weekly</span>
          </button>
          <button
            onClick={() => setPlanningMode('lesson_plan')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              planningMode === 'lesson_plan'
                ? 'bg-[#00A86B] text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
          >
            <ClipboardList size={15} />
            <span>3. Segmented Lessons</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: TEACHING TIMETABLE */}
      {/* ======================================================== */}
      {planningMode === 'timetable' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar: Grade, Curriculum, Term Start Date, Edit & Reset Tabs */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* CBC Framework Badge */}
              <div className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs">
                CBC Curriculum
              </div>

              {/* Grade Selector */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-black text-slate-500 uppercase">Grade:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Term Selector */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-black text-slate-500 uppercase">Term:</label>
                <select
                  value={timetableTerm}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    setTimetableTerm(newTerm);
                    handleUpdateTermStartDate(TERM_START_DATES[newTerm] || '2026-09-07');
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option value="Term 1">Term 1 (Jan - Apr)</option>
                  <option value="Term 2">Term 2 (May - Aug)</option>
                  <option value="Term 3">Term 3 (Sep - Dec)</option>
                </select>
              </div>

              {/* Term Start Date Picker */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-black text-slate-500 uppercase">Start Date:</label>
                <input
                  type="date"
                  value={termStartDate}
                  onChange={(e) => handleUpdateTermStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Timetable Action Buttons: Edit Timetable & Reset Timetable */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditingTimetable(!isEditingTimetable)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  isEditingTimetable 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Edit3 size={14} />
                <span>{isEditingTimetable ? 'Done Editing' : 'Edit Timetable'}</span>
              </button>

              <button
                onClick={handleResetTimetable}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                title="Reset timetable to standard default schedules"
              >
                <RotateCcw size={14} />
                <span>Reset Timetable</span>
              </button>

              <button
                onClick={handleSaveTimetable}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Save for 3 Months</span>
              </button>
            </div>
          </div>

          {/* Timetable Information Box: CBC vs OBC Framework Guidance */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300/80 rounded-3xl p-5 text-left text-slate-800 text-xs space-y-2.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2">
              <div className="flex items-center gap-2 font-black uppercase text-emerald-900 text-xs">
                <CalendarCheck2 size={18} className="text-emerald-600" />
                <span>Default Timetable Curriculum Framework Setup</span>
              </div>
              <span className="px-3 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-emerald-700 text-white shadow-2xs">
                Zambia Curriculum Framework (ZCF) Compliant
              </span>
            </div>
            <p className="leading-relaxed text-[11.5px] text-slate-700">
              Notice: The default timetable settings are arranged strictly based on the <strong>Zambia Competency-Based Curriculum Framework (CBC)</strong> for period allocations:
            </p>
            <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-200 space-y-1.5 text-[11px]">
              <strong className="text-emerald-900 font-extrabold uppercase text-[10px] block">
                CBC Curriculum Framework Allocations:
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 leading-relaxed">
                <div>
                  &bull; <strong>English / Literacy in English:</strong> 5 periods/week (Mon - Fri)<br/>
                  &bull; <strong>Mathematics and Science / Pre-Maths:</strong> 5 periods/week (Mon - Fri)
                </div>
                <div>
                  &bull; <strong>Zambian Language:</strong> 4 periods/week (Mon, Tue, Thu, Fri)<br/>
                  &bull; <strong>Creative &amp; Technology Studies (CTS):</strong> 3 periods/week (Mon, Wed, Fri)
                </div>
              </div>
            </div>
            <p className="text-[10.5px] text-emerald-800 font-semibold italic pt-1">
              * Minimum learning activities strictly correspond to scheduled days (5 days = 5 activities; 4 days = 4 activities; 3 days = 3 activities). If your school timetable follows an alternate schedule, you can freely customize each subject above.
            </p>
          </div>

          {/* Subject Schedules Grid */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center justify-between">
              <span>{selectedGrade} &bull; Subject Teaching Schedule</span>
              <span className="text-xs font-bold text-slate-400">
                Displaying: {timetableSubjects.length} of {availableSubjects.length} Subjects
              </span>
            </h3>

            {/* Secondary Teacher Subject Allocation Box (Form 1 to Form 6 / Grades 8 to 12) */}
            {isSecondary && (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                      Secondary Teacher Subject Allocation &bull; {selectedGrade}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                    {allocatedSubjects.length === 0 ? 'All Subjects Visible' : `${allocatedSubjects.length} Subject(s) Allocated`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  In secondary grades (Form 1 to Form 6), teachers are allocated specific subjects (typically 1 to 3 subjects). Select the subject(s) you teach below to configure your classroom timetable fast and easily!
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {availableSubjects.map((sub) => {
                    const isAllocated = allocatedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleAllocatedSubject(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isAllocated
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAllocated && <Check size={12} />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                  {allocatedSubjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAllocatedSubjects([]);
                        saveSecondaryAllocatedSubjects(selectedGrade, []);
                        toast.success(`Showing all subjects for ${selectedGrade}`);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:underline uppercase ml-2 cursor-pointer"
                    >
                      Show All Subjects
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {timetableSubjects.map((sub) => {
                const sched = activeTimetable?.subjectSchedules?.[sub];
                const days = sched?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const daysCount = days.length;
                const minActs = getMinimumActivitiesForDays(daysCount);

                return (
                  <div key={sub} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{sub}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          daysCount >= 5 ? 'bg-emerald-100 text-emerald-800' :
                          daysCount === 4 ? 'bg-sky-100 text-sky-800' :
                          daysCount === 3 ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {daysCount} Days/Week &bull; {minActs} Activities
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {days.join(', ')}
                      </p>
                    </div>

                    {/* Day Selection with Period Dropdown & Badge on top */}
                    <div className="flex flex-wrap items-center gap-2">
                      {ALL_WEEKDAYS.map((day) => {
                        const isChecked = days.includes(day);
                        const dayPrds = sched?.dayPeriods?.[day] || (isChecked ? 1 : 0);
                        return (
                          <div key={day} className="relative pt-3">
                            {isChecked && (
                              <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-2xs whitespace-nowrap z-10">
                                {dayPrds === 2 ? '2 prds' : '1 prd'}
                              </span>
                            )}
                            <div className="relative">
                              <select
                                value={isChecked ? dayPrds : 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  handleSetDayPeriod(sub, day, val);
                                }}
                                className={`appearance-none px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border text-center outline-none ${
                                  isChecked
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs pr-6'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600 pr-6'
                                }`}
                              >
                                <option value={0}>{day.substring(0, 3)} (Off)</option>
                                <option value={1}>{day.substring(0, 3)}: 1 prd</option>
                                <option value={2}>{day.substring(0, 3)}: 2 prds</option>
                              </select>
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] opacity-70">
                                ▼
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Retained in system memory for 90 days. Can be reset or adjusted anytime.
              </span>
              <button
                onClick={handleSaveTimetable}
                className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Save Teaching Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: SEGMENTED WEEKLY FORECAST */}
      {/* ======================================================== */}
      {planningMode === 'weekly_forecast' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Mandatory Timetable Notice if not yet saved by user for this grade */}
          {!activeTimetable?.isSavedByUser && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">Teaching Timetable Setup Mandatory</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Before generating or using segmented weekly forecasts and lesson plans for <strong>{selectedGrade}</strong>, setting the class teaching timetable is mandatory. It determines the teaching days and minimum learning activities for the entire 3 months.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlanningMode('timetable')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Set Timetable in Step 1
              </button>
            </div>
          )}

          {/* General Information Registration Block (Foldable, Register once and fold back to normal) */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Sliders size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-100">
                      🎛️ General Information Registration
                    </h4>
                    {(teacherName || schoolName || tsNumber) && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Registered Profile
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                    {(teacherName || schoolName)
                      ? `Registered Profile: ${teacherName || 'Teacher'} • ${schoolName || 'School'} (${district || 'District'} District) • TS No: ${tsNumber || 'N/A'} • ${term} • Year: ${year}`
                      : "Register teacher & school details once to auto-fill across all smart planning documents."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProfileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isProfileExpanded ? "Fold Form" : (teacherName ? "✏️ Edit Profile" : "Register Profile")}
                </button>
                {(teacherName || schoolName) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherName('');
                      setTsNumber('');
                      setSchoolName('');
                      setDistrict('');
                      setZone('');
                      setIsProfileExpanded(true);
                      toast.success("Profile fields cleared for re-registration.");
                    }}
                    className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
                    title="Reset details for re-registration"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {isProfileExpanded && (
              <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase block mb-1">Teacher's Name:</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Mr. Mwansa"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase block mb-1">School Name:</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="School Name"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase block mb-1">District:</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Milenge"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase block mb-1">Term &amp; Year:</label>
                    <div className="flex gap-1.5">
                      <select
                        value={term}
                        onChange={(e) => {
                          setTerm(e.target.value);
                          setTimetableTerm(e.target.value);
                          handleUpdateTermStartDate(TERM_START_DATES[e.target.value] || '2026-09-07');
                        }}
                        className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-1.5 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-1/2 bg-slate-800 border border-slate-700 rounded-xl px-1.5 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-slate-400 uppercase block mb-1">Term Start Date:</label>
                    <input
                      type="date"
                      value={termStartDate}
                      onChange={(e) => handleUpdateTermStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileExpanded(false);
                      toast.success("Profile saved and folded back to normal!");
                    }}
                    className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Save &amp; Fold Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filtering Block: Curriculum Switch, Grade Drop-down, Subject Drop-down, Week Drop-down */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Forecast Filters & Syllabus Targeting
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select Grade, Subject, and Week. The system will filter the exact matching segmented scheme of work.
                </p>
              </div>

              {/* Curriculum Switch */}
              {/* CBC Framework Badge */}
              <div className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs self-start md:self-auto">
                CBC Curriculum
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Grade Dropdown */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">4. Grade:</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">5. Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Week Number Dropdown */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">6. Week Number (1 to 13):</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheduled Days from Timetable Display */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-slate-700 uppercase block">
                  Scheduled Days in Teaching Timetable ({weekForecastDays.length} Days Filtered)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {weekForecastDays.map((d) => (
                    <span key={d.day} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800">
                      {d.day} ({d.formattedDate})
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Minimum Content Requirement</span>
                <span className="text-xs font-black text-emerald-700">
                  &ge; {getMinimumActivitiesForDays(weekForecastDays.length)} Learning Activities Required
                </span>
              </div>
            </div>
          </div>

          {/* 7. Document Filtered from List (Segmented Scheme Preview) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                7. Segmented Week {selectedWeek} Information (Reflecting Schemes)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Edit3 size={13} />
                  <span>Edit Week & Activities</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSegmentPreviewModal(!activeSegmentPreviewModal)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>{activeSegmentPreviewModal ? 'Hide Details' : 'View Full Week Details'}</span>
                </button>
              </div>
            </div>

            {matchedWeek ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                  <div><strong>1. Document Owner:</strong> {teacherName} ({schoolName})</div>
                  <div><strong>2. Week Number & Date:</strong> Week {selectedWeek} ({weekForecastDays.length > 0 ? `${weekForecastDays[0].formattedDate} - ${weekForecastDays[weekForecastDays.length - 1].formattedDate}` : ''})</div>
                  <div><strong>3. Subject:</strong> {selectedSubject} ({curriculum})</div>
                  <div><strong>4. Topic:</strong> {matchedWeek.topic}</div>
                </div>

                <div><strong>5. Subtopics:</strong> {matchedWeek.subtopics}</div>
                {curriculum === 'CBC' ? (
                  <>
                    <div><strong>6. Specific Competencies:</strong> {matchedWeek.specificCompetencies || 'Mastery of core competencies'}</div>
                    <div><strong>7. Expected Standards:</strong> {matchedWeek.expectedStandards || 'According to MOE CBC performance indicators'}</div>
                  </>
                ) : (
                  <>
                    <div><strong>6. Specific Outcomes (OBC):</strong> {matchedWeek.specificOutcomes || 'Mastery of specific learning outcomes'}</div>
                    <div><strong>7. Knowledge & Skills (OBC):</strong> Knowledge: {matchedWeek.knowledge || ''} | Skills: {matchedWeek.skills || ''} | Values: {matchedWeek.values || ''}</div>
                  </>
                )}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black uppercase text-slate-800">
                      8. Learning Activities (Allocated per Lesson by Timetable):
                    </strong>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {weekForecastDays.length} Lessons Scheduled &bull; Rules: 4 to 6 Activities
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 space-y-2 shadow-2xs">
                    {distributeLearningActivities(matchedWeek.learningActivities, weekForecastDays.length).map((acts, i) => {
                      const daySlot = weekForecastDays[i];
                      return (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span className="font-black text-emerald-900 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-lg shrink-0 text-[10.5px]">
                            Lesson {i + 1} {daySlot ? `(${daySlot.day})` : ''}
                          </span>
                          <div className="flex-1 text-slate-700 font-medium leading-relaxed">
                            {acts.map((act, aIdx) => (
                              <div key={aIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">&bull;</span>
                                <span>{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div><strong>9. Methodologies:</strong> {matchedWeek.methodologies}</div>
                <div><strong>10. T/L Aids:</strong> {matchedWeek.tlAids}</div>
                <div><strong>11. References:</strong> {matchedWeek.references}</div>

                {/* Delete Schemes button below segmented weekly information */}
                <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
                  <div className="text-left space-y-0.5">
                    <span className="text-[11px] font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
                      <Trash2 size={14} className="text-rose-600" />
                      Delete Schemes &amp; Reset Pipeline
                    </span>
                    <p className="text-[10px] text-rose-700 font-semibold leading-relaxed">
                      Whenever you no longer need this document, clicking this deletes all segments of schemes in <strong>{selectedGrade} - {selectedSubject}</strong> and the activated weekly forecast in day lessons until this pipeline is clean and organized for a fresh start of Smart planning. <em>Your teaching timetable will remain completely intact.</em>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteSchemes}
                    disabled={isDeletingPipeline}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
                    title="Delete schemes for this subject pipeline"
                  >
                    {isDeletingPipeline ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Delete Schemes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-2xl text-center space-y-2">
                <AlertCircle size={24} className="mx-auto text-amber-600" />
                <h4 className="text-xs font-black uppercase text-amber-800">No Segmented Scheme Found Yet</h4>
                <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                  Go to <strong>Schemes of Work</strong> tab, generate or open your Scheme of Work, and click <strong>"Segment to Weekly Forecasts"</strong>.
                </p>
              </div>
            )}
          </div>

          {/* 8 & 9. Syllabus Citing and Reference Content Browser */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  8 & 9. Syllabus Citing & Curriculum Browser
                </h3>
                <p className="text-[11px] text-slate-500">
                  Official citation: <strong className="text-slate-700">{syllabusCitation}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyllabusBrowser(!showSyllabusBrowser)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen size={13} />
                <span>{showSyllabusBrowser ? 'Close Syllabus' : 'Browse Syllabus'}</span>
              </button>
            </div>

            {showSyllabusBrowser && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto space-y-2 text-left">
                <h4 className="text-xs font-black uppercase text-slate-800">
                  Official Syllabus Units & Topics: {selectedGrade} - {selectedSubject}
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {syllabusData.map((top: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-slate-900 block">{top.name || top.title || `Unit ${idx + 1}`}</strong>
                      <span className="text-[11px] text-slate-500">
                        {Array.isArray(top.subtopics) ? top.subtopics.join(', ') : 'Curriculum subtopics'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 10. Mandatory Instructions Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              10. Mandatory Instructions Box
            </h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>

          {/* 11 & 12. Scale Toggles & Generate with Gemini API Button */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 uppercase">Scale Mode:</span>
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScale('lighter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    scale === 'lighter' ? 'bg-[#00A86B] text-white' : 'text-slate-600'
                  }`}
                >
                  Lighter Scale
                </button>
                <button
                  type="button"
                  onClick={() => setScale('medium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    scale === 'medium' ? 'bg-[#00A86B] text-white' : 'text-slate-600'
                  }`}
                >
                  Medium Scale
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateWeeklyForecast}
              disabled={isGenerating || !matchedWeek}
              className="px-6 py-4 bg-[#00A86B] hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{generationStep || 'Generating Forecast...'}</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Generate Weekly Forecast with Gemini API</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: SEGMENTED LESSON PLANS */}
      {/* ======================================================== */}
      {planningMode === 'lesson_plan' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Mandatory Timetable Notice if not yet saved by user for this grade */}
          {!activeTimetable?.isSavedByUser && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">Teaching Timetable Setup Mandatory</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Before generating segmented lesson plans for <strong>{selectedGrade}</strong>, setting the class teaching timetable is mandatory. It determines the teaching days and minimum learning activities for the entire 3 months.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlanningMode('timetable')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Set Timetable in Step 1
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Segmented Lesson Planning (Derived from Weekly Forecast)
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isSecondary 
                    ? "Secondary (Forms 1-6): Lesson plans can be derived directly from Schemes of Work or Weekly Forecast."
                    : "Primary / ECE (Grades 1-7): Lesson plans are segmented strictly from the Weekly Forecast."}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                isSecondary ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isSecondary ? 'Secondary Pipeline' : 'Primary Forecast Pipeline'}
              </span>
            </div>

            {/* Selectors: Week & Scheduled Day */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Target Week:</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Scheduled Lesson Day (from Timetable):</label>
                <select
                  value={selectedLessonIndex}
                  onChange={(e) => setSelectedLessonIndex(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {weekForecastDays.map((d, idx) => (
                    <option key={d.day} value={idx}>
                      Lesson {idx + 1}: {d.day} ({d.formattedDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">
                  Period &amp; Duration (Clock Selector):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                    <input
                      type="time"
                      value={clockFromTime}
                      onChange={(e) => handleClockTimeChange(e.target.value, clockToTime)}
                      className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
                    <input
                      type="time"
                      value={clockToTime}
                      onChange={(e) => handleClockTimeChange(clockFromTime, e.target.value)}
                      className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-800 shadow-2xs">
                    <Clock size={13} className="text-emerald-600" />
                    <span>{lessonDuration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Boys Enrolment:</label>
                <input
                  type="number"
                  value={boysCount}
                  onChange={(e) => setBoysCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Girls Enrolment:</label>
                <input
                  type="number"
                  value={girlsCount}
                  onChange={(e) => setGirlsCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <span className="text-xs font-black text-slate-600 pb-2">
                  Total Class Enrolment: {parseInt(boysCount || '0') + parseInt(girlsCount || '0')} Learners
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Lesson Details Preview */}
          {matchedWeek && currentLessonSlot && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-left text-xs text-slate-700">
              <h4 className="text-sm font-black text-slate-900 uppercase flex items-center justify-between">
                <span>Active Lesson Snapshot &bull; {currentLessonSlot.day} ({currentLessonSlot.formattedDate})</span>
                <span className="text-[10px] font-bold text-slate-400">Lesson {selectedLessonIndex + 1} of {weekForecastDays.length}</span>
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                  <div><strong>Day & Date:</strong> {currentLessonSlot.day} ({currentLessonSlot.formattedDate})</div>
                  <div><strong>Lesson Slot:</strong> Lesson {selectedLessonIndex + 1} of {weekForecastDays.length} ({lessonTime} • {lessonDuration})</div>
                  <div><strong>Topic (from Week {selectedWeek}):</strong> {matchedWeek.topic}</div>
                  <div><strong>Subtopic:</strong> {matchedWeek.subtopics}</div>
                </div>
                <div>
                  <strong>{curriculum === 'CBC' ? 'Specific Competencies' : 'Specific Outcomes (OBC)'}:</strong>{' '}
                  {matchedWeek.specificCompetencies || matchedWeek.specificOutcomes}
                </div>
                <div>
                  <strong>{curriculum === 'CBC' ? 'Expected Standards' : 'Knowledge, Skills & Values (OBC)'}:</strong>{' '}
                  {curriculum === 'CBC' 
                    ? (matchedWeek.expectedStandards || 'According to official syllabus standard')
                    : `Knowledge: ${matchedWeek.knowledge || ''} | Skills: ${matchedWeek.skills || ''} | Values: ${matchedWeek.values || ''}`}
                </div>
                <div><strong>Learning Activities:</strong> {matchedWeek.learningActivities}</div>
                <div><strong>Methodologies:</strong> {matchedWeek.methodologies}</div>
                <div><strong>Teaching & Learning Aids:</strong> {matchedWeek.tlAids}</div>
                <div><strong>References:</strong> {matchedWeek.references}</div>
              </div>
            </div>
          )}

          {/* Homework Choice & Pictures Inclusion Block (Placed between Lesson Info and Generator Button) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Lesson Plan Template Options: Homework Choice &amp; Pictures Inclusion</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure homework tasks and real syllabus diagram inclusion for this segmented lesson plan.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
                2-Page Layout Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Include Homework? */}
              <div className="space-y-2 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
                <label className="text-[11px] font-black uppercase text-slate-800 tracking-wider block">
                  1. Include Homework?
                </label>
                <select
                  value={includeHomework ? "yes" : "no"}
                  onChange={(e) => setIncludeHomework(e.target.value === 'yes')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="no">NO - Omit homework section</option>
                  <option value="yes">YES - Include dynamic homework section</option>
                </select>
                <p className="text-[10px] text-slate-500 font-medium italic leading-tight">
                  * If selected, homework tasks and instructions will be generated between the lesson table and the learners' evaluation section on page 2.
                </p>
              </div>

              {/* 2. Include Real Teaching Diagram? */}
              <div className="space-y-2 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    2. Include Real Teaching Diagram?
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDiagramLibraryOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye size={12} />
                    Browse Diagrams Library
                  </button>
                </div>
                <select
                  value={includeLessonDiagram ? "yes" : "no"}
                  onChange={(e) => setIncludeLessonDiagram(e.target.value === 'yes')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="yes">YES - Include compact real teaching diagram (Topic &amp; Subtopic aligned)</option>
                  <option value="no">NO - Text only lesson plan</option>
                </select>
                {includeLessonDiagram && (
                  <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-[10.5px] text-emerald-900 flex items-center justify-between shadow-2xs">
                    <span className="truncate max-w-[280px]">
                      {selectedLessonDiagram 
                        ? `Selected: ${selectedLessonDiagram.title}` 
                        : `Auto-Selected Diagram: Aligned with ${effectiveLessonWeek?.topic || selectedSubject}`}
                    </span>
                    {selectedLessonDiagram && (
                      <button
                        type="button"
                        onClick={() => setSelectedLessonDiagram(undefined)}
                        className="text-red-600 font-bold hover:underline cursor-pointer ml-2 text-[10px] shrink-0"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 font-medium italic leading-tight">
                  * Real teaching diagrams are rendered compactly in Stage 2 / Teaching Aids without overflowing pages.
                </p>
              </div>
            </div>
          </div>

          {/* Generate Lesson Plan Button */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Conforms strictly to standard Ministry of Education 2-Page Lesson Plan format.
            </span>
            <button
              onClick={handleGenerateLessonPlan}
              disabled={isGenerating || !matchedWeek}
              className="px-6 py-4 bg-[#00A86B] hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{generationStep || 'Generating Lesson Plan...'}</span>
                </>
              ) : (
                <>
                  <ClipboardList size={15} />
                  <span>Generate Segmented Lesson Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit Week & Learning Activities Modal */}
      {isEditWeekModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit3 size={16} className="text-emerald-600" />
                Edit Week {selectedWeek} Information & Learning Activities ({selectedGrade} - {selectedSubject})
              </h3>
              <button
                onClick={() => setIsEditWeekModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-slate-700 uppercase block mb-1">Topic Title:</label>
                <input
                  type="text"
                  value={editWeekForm.topic}
                  onChange={(e) => setEditWeekForm({ ...editWeekForm, topic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  placeholder="e.g. Unit 1: Numbers and Quantities"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 uppercase block mb-1">Subtopics:</label>
                <input
                  type="text"
                  value={editWeekForm.subtopics}
                  onChange={(e) => setEditWeekForm({ ...editWeekForm, subtopics: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  placeholder="e.g. Counting numbers 1 to 10"
                />
              </div>

              {curriculum === 'CBC' ? (
                <>
                  <div>
                    <label className="font-black text-slate-700 uppercase block mb-1">Specific Competencies (CBC):</label>
                    <textarea
                      rows={2}
                      value={editWeekForm.specificCompetencies}
                      onChange={(e) => setEditWeekForm({ ...editWeekForm, specificCompetencies: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-emerald-500"
                      placeholder="e.g. Learners should be able to count objects accurately up to 10."
                    />
                  </div>

                  <div>
                    <label className="font-black text-slate-700 uppercase block mb-1">Expected Standards (CBC):</label>
                    <textarea
                      rows={2}
                      value={editWeekForm.expectedStandards}
                      onChange={(e) => setEditWeekForm({ ...editWeekForm, expectedStandards: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-emerald-500"
                      placeholder="e.g. Correct identification and counting of concrete objects."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-black text-slate-700 uppercase block mb-1">Specific Outcomes (OBC):</label>
                    <textarea
                      rows={2}
                      value={editWeekForm.specificOutcomes}
                      onChange={(e) => setEditWeekForm({ ...editWeekForm, specificOutcomes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-emerald-500"
                      placeholder="Specific learning outcomes..."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">Knowledge:</label>
                      <input
                        type="text"
                        value={editWeekForm.knowledge || ''}
                        onChange={(e) => setEditWeekForm({ ...editWeekForm, knowledge: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">Skills:</label>
                      <input
                        type="text"
                        value={editWeekForm.skills || ''}
                        onChange={(e) => setEditWeekForm({ ...editWeekForm, skills: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">Values:</label>
                      <input
                        type="text"
                        value={editWeekForm.values || ''}
                        onChange={(e) => setEditWeekForm({ ...editWeekForm, values: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-black text-slate-700 uppercase block mb-1">Learning Activities (Separated by semicolons or newlines):</label>
                <textarea
                  rows={4}
                  value={editWeekForm.learningActivities}
                  onChange={(e) => setEditWeekForm({ ...editWeekForm, learningActivities: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 outline-none focus:border-emerald-500"
                  placeholder="e.g. 1. Counting bottle tops in groups; 2. Matching numbers with items; 3. Group work worksheet exercises."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">Methodologies:</label>
                  <input
                    type="text"
                    value={editWeekForm.methodologies}
                    onChange={(e) => setEditWeekForm({ ...editWeekForm, methodologies: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">T/L Aids:</label>
                  <input
                    type="text"
                    value={editWeekForm.tlAids}
                    onChange={(e) => setEditWeekForm({ ...editWeekForm, tlAids: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-700 uppercase block mb-1 text-[10px]">References:</label>
                  <input
                    type="text"
                    value={editWeekForm.references}
                    onChange={(e) => setEditWeekForm({ ...editWeekForm, references: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditWeekModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedWeek}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Segmented Schemes Modal Dialog */}
      {isAvailableSchemesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-900 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <Layers size={18} />
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                    Available Segmented Schemes ({segmentedSchemes.length})
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase">
                    90-Day Protected
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Review, inspect, or manage all 13-week segmented schemes stored in the app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAvailableSchemesModalOpen(false);
                  setInspectedScheme(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)]">
              {inspectedScheme ? (
                /* Detail/Inspection View of 13 Weeks */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase">
                        {inspectedScheme.grade} &bull; {inspectedScheme.subject} ({inspectedScheme.curriculum})
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">
                        {inspectedScheme.term} &bull; {inspectedScheme.year} &bull; {inspectedScheme.weeks?.length || 13} Weeks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedScheme(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      &larr; Back to List
                    </button>
                  </div>

                  <div className="space-y-3">
                    {inspectedScheme.weeks?.map((w, wIdx) => (
                      <div key={`insp-wk-${wIdx}`} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase">
                            Week {w.weekNumber || wIdx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {w.dateRange || ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px] block">Topic:</span>
                            <p className="font-black text-slate-900">{w.topic || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px] block">Subtopics:</span>
                            <p className="font-bold text-slate-700">{w.subtopics || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px] block">Competencies / Outcomes:</span>
                            <p className="font-medium text-slate-700">{w.specificCompetencies || w.specificOutcomes || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 uppercase text-[10px] block">Learning Activities:</span>
                            <p className="font-medium text-slate-700">{w.learningActivities || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : segmentedSchemes.length === 0 ? (
                /* Empty State */
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 uppercase">No Segmented Schemes Available Yet</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
                      You can generate schemes of work using the dual-line syllabus drop-down configuration or upload an existing scheme file.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvailableSchemesModalOpen(false);
                        onNavigateToGenerator?.('schemes_of_work', { grade: selectedGrade, subject: selectedSubject, curriculum, term: timetableTerm });
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Generate Schemes Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvailableSchemesModalOpen(false);
                        document.getElementById('smart-schemes-upload')?.click();
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText size={14} />
                      <span>Upload &amp; Translate</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* List of Available Schemes */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {segmentedSchemes.map((s, idx) => {
                    const isCurrent = s.grade === selectedGrade && s.subject === selectedSubject;
                    return (
                      <div
                        key={`avail-scheme-${s.id || idx}`}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all text-left space-y-3 bg-white ${
                          isCurrent ? "border-emerald-500 ring-2 ring-emerald-100 shadow-sm" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mb-1 ${
                              s.curriculum === 'OBC' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {s.curriculum || 'CBC'} MODE
                            </span>
                            <h4 className="text-sm font-black text-slate-900 leading-snug">
                              {s.subject}
                            </h4>
                            <p className="text-xs font-bold text-slate-600">
                              {s.grade} &bull; {s.term} &bull; {s.year}
                            </p>
                          </div>
                          <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                            {s.weeks?.length || 13} Weeks
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">
                          {s.weeks?.[0]?.topic ? `Starting Topic: ${s.weeks[0].topic}` : '13 Weeks Configured'}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInspectedScheme(s)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <Eye size={12} />
                            <span>Inspect (1-13)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGrade(s.grade);
                              setSelectedSubject(s.subject);
                              if (s.curriculum) setCurriculum(s.curriculum);
                              if (s.term) setTimetableTerm(s.term);
                              setIsAvailableSchemesModalOpen(false);
                              setPlanningMode('weekly_forecast');
                              toast.success(`Switched active planning to ${s.subject} (${s.grade})!`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <CalendarCheck2 size={12} />
                            <span>Use in Planner</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete the stored scheme for ${s.subject} (${s.grade})?`)) {
                                await deleteSegmentedSchemeById(s.id);
                                await loadSchemes();
                                toast.success(`Deleted segmented scheme for ${s.subject}!`);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer ml-auto transition-colors"
                            title="Delete this scheme"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAvailableSchemesModalOpen(false);
                    onNavigateToGenerator?.('schemes_of_work', { grade: selectedGrade, subject: selectedSubject, curriculum, term: timetableTerm });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles size={13} className="text-amber-300" />
                  <span>Generate Schemes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAvailableSchemesModalOpen(false);
                    document.getElementById('smart-schemes-upload')?.click();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <FileText size={13} />
                  <span>Upload &amp; Translate Schemes</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAvailableSchemesModalOpen(false);
                  setInspectedScheme(null);
                }}
                className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
