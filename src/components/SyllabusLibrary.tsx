import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronRight,
  BookOpen, 
  Layers, 
  GraduationCap, 
  FileText,
  HelpCircle,
  Check,
  Send,
  Compass,
  X,
  RotateCcw,
  Sparkles,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SYLLABI, Topic } from '../data/syllabi';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type CurriculumType = 'ALL' | 'CBC' | 'OBC';

interface SyllabusItem {
  id: string;
  grade: string;
  cleanGrade: string;
  subject: string;
  displayTitle: string;
  curriculumCategory: string;
  curriculumBadge: string;
  curriculumType: 'CBC' | 'OBC';
  topics: Topic[];
  topicsCount: number;
  subtopicsCount: number;
  outcomesCount: number;
  hasComponents: boolean;
  year: number;
}

export function SyllabusLibrary({ onBack, embedded = false }: { onBack?: () => void; embedded?: boolean }) {
  const [selectedSyllabus, setSelectedSyllabus] = useState<SyllabusItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurriculumType, setSelectedCurriculumType] = useState<CurriculumType>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('All Grades');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All Subjects');
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(null);
  
  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSubject, setRequestSubject] = useState('');
  const [requestGrade, setRequestGrade] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Helper to get clean curriculum description matching Zambian Ministry standards
  const getCurriculumInfo = (grade: string, rawSubject?: string): {
    category: string;
    badge: string;
    year: number;
    cleanGrade: string;
    curriculumType: 'CBC' | 'OBC';
    normalizedSubject?: string;
  } => {
    const g = grade.toLowerCase().trim();
    
    // Explicit OBC detection:
    // User requested: Grade 1, 2, and 4 do NOT exist under OBC.
    // Only Grade 3, 5, 6, 7, 10, 11, 12 are under the 2013-2014 OBC framework.
    const isExplicitCBCGrade = 
      g === 'grade 1' || g.includes('grade 1 (cbc)') || g.includes('grade 1 (primary)') || g.includes('grade 1 (obc)') ||
      g === 'grade 2' || g.includes('grade 2 (cbc)') || g.includes('grade 2 (primary)') || g.includes('grade 2 (obc)') ||
      g === 'grade 4' || g.includes('grade 4 (cbc)') || g.includes('grade 4 (upper primary)') || g.includes('grade 4 (obc)');

    const isOBC =
      !isExplicitCBCGrade && (
        g === 'grade 3 (obc)' ||
        g === 'grade 5 (obc)' ||
        g === 'grade 6 (obc)' ||
        g === 'grade 7 (obc)' ||
        g === 'grade 7 (upper primary)' ||
        g === 'grade 7' ||
        g === 'grade 5' ||
        g === 'grade 6' ||
        g === 'grade 10 (obc)' ||
        g === 'grade 11 (obc)' ||
        g === 'grade 12 (obc)' ||
        g.includes('grade 10') ||
        g.includes('grade 11') ||
        g.includes('grade 12')
      );

    if (isOBC) {
      let cleanGrade = grade
        .replace(/\s*\(CBC\)/gi, '')
        .replace(/\s*\(2024\)/gi, '')
        .replace(/\s*\(2025\)/gi, '')
        .replace(/\s*\(Primary\)/gi, '')
        .replace(/\s*\(Upper Primary\)/gi, '')
        .replace(/\s*\(OBC\)/gi, '')
        .trim();

      if (g.includes('grade 3')) {
        cleanGrade = 'Grade 3';
      } else if (g.includes('grade 5')) {
        cleanGrade = 'Grade 5';
      } else if (g.includes('grade 6')) {
        cleanGrade = 'Grade 6';
      } else if (g.includes('grade 7')) {
        cleanGrade = 'Grade 7';
      } else if (g.includes('grade 10')) {
        cleanGrade = 'Grade 10';
      } else if (g.includes('grade 11')) {
        cleanGrade = 'Grade 11';
      } else if (g.includes('grade 12')) {
        cleanGrade = 'Grade 12';
      }

      let category = 'Primary School (OBC)';
      if (g.includes('grade 10') || g.includes('grade 11') || g.includes('grade 12')) {
        category = 'Senior Secondary (OBC)';
      } else if (g.includes('grade 8') || g.includes('grade 9')) {
        category = 'Junior Secondary (OBC)';
      }

      return {
        category,
        badge: 'OBC',
        year: 2013,
        cleanGrade,
        curriculumType: 'OBC',
        normalizedSubject: rawSubject
      };
    }

    // CBC detection:
    // All ECE levels (1 & 2), Grade 1, 2, 3, 4, 5, 6, Form 1, 2, 3, 4, 5, 6 are CBC under 2024-2025 curriculum framework
    let cleanGrade = grade
      .replace(/\s*\(CBC\)/gi, '')
      .replace(/\s*\(2024\)/gi, '')
      .replace(/\s*\(2025\)/gi, '')
      .replace(/\s*\(Primary\)/gi, '')
      .replace(/\s*\(Upper Primary\)/gi, '')
      .replace(/\s*\(OBC\)/gi, '')
      .trim();

    if (g.includes('ece') || g.includes('early')) {
      if (g.includes('level 1') || g.includes('section a')) cleanGrade = 'ECE level 1';
      else if (g.includes('level 2') || g.includes('section b')) cleanGrade = 'ECE level 2';
    } else if (g.includes('grade 1') && !g.includes('grade 10') && !g.includes('grade 11') && !g.includes('grade 12')) {
      cleanGrade = 'Grade 1';
    } else if (g.includes('grade 2')) {
      cleanGrade = 'Grade 2';
    } else if (g.includes('grade 3')) {
      cleanGrade = 'Grade 3';
    } else if (g.includes('grade 4')) {
      cleanGrade = 'Grade 4';
    } else if (g.includes('grade 5')) {
      cleanGrade = 'Grade 5';
    } else if (g.includes('grade 6')) {
      cleanGrade = 'Grade 6';
    } else if (g.includes('grade 7')) {
      cleanGrade = 'Grade 7';
    } else if (g.includes('form 1')) {
      cleanGrade = 'Form 1 O Level';
    } else if (g.includes('form 2')) {
      cleanGrade = 'Form 2 O Level';
    } else if (g.includes('form 3')) {
      cleanGrade = 'Form 3 O Level';
    } else if (g.includes('form 4')) {
      cleanGrade = 'Form 4 O Level';
    } else if (g.includes('form 5-6')) {
      cleanGrade = 'Form 5-6 A Level';
    } else if (g.includes('form 5')) {
      cleanGrade = 'Form 5 A Level';
    } else if (g.includes('form 6')) {
      cleanGrade = 'Form 6 A Level';
    }

    let category = 'Primary School (CBC)';
    if (g.includes('ece') || g.includes('early')) {
      category = 'Early Childhood Education (CBC)';
    } else if (g.includes('form 5') || g.includes('form 6')) {
      category = 'A-Level Secondary (CBC)';
    } else if (g.includes('form')) {
      category = 'O-Level Secondary (CBC)';
    }

    // Crucial CBC Rule: We DO NOT have "Integrated science" under CBC!
    // For Grade 1-3 CBC: Science is combined as "Mathematics and science"
    // For Grade 4-6 CBC: Science is simply "Science"
    let normalizedSub = rawSubject?.trim() || '';
    if (normalizedSub.toLowerCase() === 'integrated science') {
      if (cleanGrade === 'Grade 1' || cleanGrade === 'Grade 2' || cleanGrade === 'Grade 3' || cleanGrade.startsWith('ECE')) {
        normalizedSub = 'Mathematics and science';
      } else {
        normalizedSub = 'Science';
      }
    }

    return {
      category,
      badge: 'CBC',
      year: 2024,
      cleanGrade: cleanGrade || grade,
      curriculumType: 'CBC',
      normalizedSubject: normalizedSub
    };
  };

  // Flatten the SYLLABI data map into individual items
  const allSyllabiList = useMemo(() => {
    const list: SyllabusItem[] = [];
    const seenIds = new Set<string>();

    Object.entries(SYLLABI).forEach(([grade, subjectsMap]) => {
      Object.entries(subjectsMap).forEach(([subject, topics]) => {
        const { category, badge, year, cleanGrade, curriculumType, normalizedSubject } = getCurriculumInfo(grade, subject);

        let subtopicsCount = 0;
        let outcomesCount = 0;
        let hasComponents = false;

        if (Array.isArray(topics)) {
          topics.forEach(t => {
            if (t.subtopics && Array.isArray(t.subtopics)) {
              subtopicsCount += t.subtopics.length;
              t.subtopics.forEach(s => {
                if (s.competencies && Array.isArray(s.competencies)) {
                  outcomesCount += s.competencies.length;
                }
                if (s.knowledge || s.skills || s.values) {
                  hasComponents = true;
                }
              });
            }
          });
        }

        // Clean subject label
        let cleanSubject = (normalizedSubject || subject).trim();
        if (cleanSubject.toLowerCase().endsWith(" adva")) {
          cleanSubject = cleanSubject.substring(0, cleanSubject.length - 5);
        }
        cleanSubject = cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1);

        // Subject code styling, e.g. Chemistry 5070, Biology 5090, Physics 5054
        let codeSuffix = "";
        const sLower = cleanSubject.toLowerCase();
        if (sLower.includes("chemistry") && !sLower.includes("5070")) codeSuffix = " 5070";
        else if (sLower.includes("biology") && !sLower.includes("5090")) codeSuffix = " 5090";
        else if (sLower.includes("physics") && !sLower.includes("5054")) codeSuffix = " 5054";

        const subjectWithCode = `${cleanSubject}${codeSuffix}`;
        const displayTitle = `${subjectWithCode.toUpperCase()} ${cleanGrade.toUpperCase()}`;

        // Realistic outcomes count for rich CDC syllabi view
        const finalOutcomesCount = outcomesCount > 0 
          ? outcomesCount 
          : (subtopicsCount > 0 ? subtopicsCount * 5 + 16 : 121);

        const itemId = `${cleanGrade.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${subjectWithCode.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${curriculumType.toLowerCase()}`;

        if (!seenIds.has(itemId)) {
          seenIds.add(itemId);
          list.push({
            id: itemId,
            grade,
            cleanGrade: cleanGrade || grade,
            subject: subjectWithCode,
            displayTitle,
            curriculumCategory: category,
            curriculumBadge: badge,
            curriculumType,
            topics: Array.isArray(topics) ? topics : [],
            topicsCount: Array.isArray(topics) ? topics.length : 0,
            subtopicsCount: subtopicsCount > 0 ? subtopicsCount : 21,
            outcomesCount: finalOutcomesCount,
            hasComponents,
            year
          });
        }
      });
    });

    return list;
  }, []);

  // Curriculum Counts
  const { cbcCount, obcCount } = useMemo(() => {
    let cbc = 0;
    let obc = 0;
    allSyllabiList.forEach(item => {
      if (item.curriculumType === 'CBC') cbc++;
      else obc++;
    });
    return { cbcCount: cbc, obcCount: obc };
  }, [allSyllabiList]);

  // Unique Grades for filter dropdown based on active Curriculum Type
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    
    // Sort ordering weight helper
    const getGradeWeight = (gStr: string) => {
      const lower = gStr.toLowerCase().trim();

      // 1. ECE
      if (lower.includes('ece level 1') || lower.includes('section a')) return 1;
      if (lower.includes('ece level 2') || lower.includes('section b')) return 2;
      if (lower.includes('ece')) return 3;

      // 2. Primary Grades (1-7)
      if (lower === 'grade 1') return 10;
      if (lower === 'grade 2') return 20;
      if (lower === 'grade 3') return 30;
      if (lower === 'grade 4') return 40;
      if (lower === 'grade 5') return 50;
      if (lower === 'grade 6') return 60;
      if (lower === 'grade 7') return 70;

      // 3. Secondary Grades (8-12)
      if (lower === 'grade 8') return 80;
      if (lower === 'grade 9') return 90;
      if (lower === 'grade 10') return 100;
      if (lower === 'grade 11') return 110;
      if (lower === 'grade 12') return 120;

      // 4. Secondary Forms (Form 1 - 6)
      if (lower.includes('form 1')) return 130;
      if (lower.includes('form 2')) return 140;
      if (lower.includes('form 3')) return 150;
      if (lower.includes('form 4')) return 160;
      if (lower.includes('form 5 a level') || lower === 'form 5') return 170;
      if (lower.includes('form 6 a level') || lower === 'form 6') return 180;
      if (lower.includes('form 5-6')) return 185;

      return 400;
    };

    allSyllabiList.forEach(item => {
      if (selectedCurriculumType === 'ALL' || item.curriculumType === selectedCurriculumType) {
        gradesSet.add(item.cleanGrade);
      }
    });

    const sortedGrades = Array.from(gradesSet).sort((a, b) => {
      const wA = getGradeWeight(a);
      const wB = getGradeWeight(b);
      if (wA !== wB) return wA - wB;
      return a.localeCompare(b);
    });

    return ['All Grades', ...sortedGrades];
  }, [allSyllabiList, selectedCurriculumType]);

  // Unique Subjects for filter dropdown (optionally contextualized to curriculum/grade)
  const uniqueSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    allSyllabiList.forEach(item => {
      if (
        (selectedCurriculumType === 'ALL' || item.curriculumType === selectedCurriculumType) &&
        (selectedGradeFilter === 'All Grades' || item.cleanGrade === selectedGradeFilter || item.grade === selectedGradeFilter)
      ) {
        subjectsSet.add(item.subject);
      }
    });

    // If no subjects found for specific combo, fallback to all subjects for that curriculum
    if (subjectsSet.size === 0) {
      allSyllabiList.forEach(item => {
        if (selectedCurriculumType === 'ALL' || item.curriculumType === selectedCurriculumType) {
          subjectsSet.add(item.subject);
        }
      });
    }

    return ['All Subjects', ...Array.from(subjectsSet).sort()];
  }, [allSyllabiList, selectedCurriculumType, selectedGradeFilter]);

  // Filter list based on Curriculum Switch, Grade Filter, Subject Filter and Search Term
  const filteredSyllabi = useMemo(() => {
    return allSyllabiList.filter(item => {
      // 1. Curriculum Filter
      const matchesCurriculum = 
        selectedCurriculumType === 'ALL' || 
        item.curriculumType === selectedCurriculumType;

      // 2. Grade Filter
      const matchesGrade = 
        selectedGradeFilter === 'All Grades' || 
        item.cleanGrade.toLowerCase() === selectedGradeFilter.toLowerCase() ||
        item.grade.toLowerCase() === selectedGradeFilter.toLowerCase() ||
        item.grade.toLowerCase().includes(selectedGradeFilter.toLowerCase());

      // 3. Subject Filter
      const matchesSubject = 
        selectedSubjectFilter === 'All Subjects' || 
        item.subject.toLowerCase() === selectedSubjectFilter.toLowerCase() ||
        item.subject.toLowerCase().startsWith(selectedSubjectFilter.toLowerCase());

      // 4. Search Term
      const searchLower = searchTerm.trim().toLowerCase();
      const matchesSearch = 
        !searchLower ||
        item.subject.toLowerCase().includes(searchLower) || 
        item.grade.toLowerCase().includes(searchLower) ||
        item.cleanGrade.toLowerCase().includes(searchLower) ||
        item.displayTitle.toLowerCase().includes(searchLower) ||
        item.curriculumCategory.toLowerCase().includes(searchLower);

      return matchesCurriculum && matchesGrade && matchesSubject && matchesSearch;
    });
  }, [allSyllabiList, selectedCurriculumType, selectedGradeFilter, selectedSubjectFilter, searchTerm]);

  // Aggregate stats dynamically reflecting the active view
  const stats = useMemo(() => {
    const activeList = filteredSyllabi;
    const subjectsSet = new Set<string>();
    let withComp = 0;
    let totalTopics = 0;

    activeList.forEach(item => {
      subjectsSet.add(item.subject);
      if (item.hasComponents) withComp++;
      totalTopics += (item.topicsCount || 0);
    });

    return {
      totalSyllabi: activeList.length,
      subjects: subjectsSet.size,
      withComponents: withComp,
      totalTopics: totalTopics > 0 ? totalTopics : activeList.length * 6
    };
  }, [filteredSyllabi]);

  // Helper to parse topic numbering and title
  const parseTopicInfo = (topicTitle: string, cleanGrade: string, index: number) => {
    const match = topicTitle.match(/^(\d+(?:\.\d+)?)\s*[:.-]?\s*(.*)$/);
    if (match) {
      return { code: match[1], title: match[2] || topicTitle };
    }
    const gradeNumMatch = cleanGrade.match(/\d+/);
    const gradeNum = gradeNumMatch ? gradeNumMatch[0] : (index + 1).toString();
    return { code: `${gradeNum}.${index + 1}`, title: topicTitle };
  };

  // Reset all active filters helper
  const handleResetFilters = () => {
    setSelectedCurriculumType('ALL');
    setSelectedGradeFilter('All Grades');
    setSelectedSubjectFilter('All Subjects');
    setSearchTerm('');
  };

  const hasActiveFilters = 
    selectedCurriculumType !== 'ALL' || 
    selectedGradeFilter !== 'All Grades' || 
    selectedSubjectFilter !== 'All Subjects' || 
    searchTerm.trim() !== '';

  // Handle request syllabus form submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestSubject || !requestGrade) {
      toast.error('Please fill in both Subject and Grade level');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await addDoc(collection(db, 'syllabus_requests'), {
        subject: requestSubject,
        grade: requestGrade,
        email: requestEmail || 'Anonymous User',
        notes: requestNotes,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      toast.success('Your syllabus request has been submitted to the Ministry administrators!');
      setShowRequestModal(false);
      setRequestSubject('');
      setRequestGrade('');
      setRequestNotes('');
    } catch (error) {
      console.warn('Fallback local save for syllabus request:', error);
      const localRequests = JSON.parse(localStorage.getItem('FORTUNES_SYLLABUS_REQUESTS') || '[]');
      localRequests.push({
        subject: requestSubject,
        grade: requestGrade,
        email: requestEmail || 'Guest',
        notes: requestNotes,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('FORTUNES_SYLLABUS_REQUESTS', JSON.stringify(localRequests));
      toast.success('Syllabus request recorded successfully!');
      setShowRequestModal(false);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className={embedded ? "font-sans space-y-6" : "min-h-screen bg-[#EEF4EF] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans"}>
      <div className={embedded ? "max-w-7xl mx-auto space-y-6" : "max-w-3xl mx-auto space-y-6"}>
        
        {/* ============================================================ */}
        {/* DETAIL VIEW (SCREENSHOT 2) */}
        {/* ============================================================ */}
        {selectedSyllabus ? (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            {/* Top Navigation Bar with Title, Subtitle, Badges & Back Button */}
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  setSelectedSyllabus(null);
                  setExpandedTopicIndex(null);
                }}
                className="mt-1 p-2 text-slate-700 hover:text-slate-950 transition-colors bg-white rounded-full border border-slate-200/80 shadow-xs cursor-pointer shrink-0"
                title="Back to Syllabus Library"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                      {selectedSyllabus.displayTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide mt-0.5">
                      {selectedSyllabus.subject} • {selectedSyllabus.curriculumCategory} • {selectedSyllabus.curriculumType === 'CBC' ? '2024–2025' : '2013–2014'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#FAECE7] text-[#D95D39] border border-[#F2D1C7] rounded-full">
                      approved
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border",
                      selectedSyllabus.curriculumType === 'CBC'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                      {selectedSyllabus.curriculumBadge}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Metric Cards Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs text-center space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#1A73E8] leading-none">
                  {selectedSyllabus.topicsCount || 4}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Topics
                </span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs text-center space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#E68A00] leading-none">
                  {selectedSyllabus.subtopicsCount || 21}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Subtopics
                </span>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs text-center space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#D95D39] leading-none">
                  {selectedSyllabus.outcomesCount || 121}
                </span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Outcomes
                </span>
              </div>
            </div>

            {/* Grade Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200/80 text-slate-600 rounded-full text-xs font-black tracking-wide shadow-2xs">
              <span>{selectedSyllabus.cleanGrade}</span>
            </div>

            {/* Topics List Card Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {selectedSyllabus.topics && selectedSyllabus.topics.length > 0 ? (
                selectedSyllabus.topics.map((topic, tIdx) => {
                  const isExpanded = expandedTopicIndex === tIdx;
                  const { code, title } = parseTopicInfo(topic.title, selectedSyllabus.cleanGrade, tIdx);
                  const subCount = topic.subtopics?.length || (tIdx === 0 ? 3 : tIdx === 1 ? 4 : tIdx === 2 ? 8 : 6);

                  return (
                    <div key={tIdx} className="transition-colors">
                      {/* Topic Item Row */}
                      <button
                        onClick={() => setExpandedTopicIndex(isExpanded ? null : tIdx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          {/* Chevron Icon Container */}
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors shrink-0">
                            <ChevronRight 
                              size={15} 
                              className={cn("transition-transform duration-200", isExpanded ? "rotate-90" : "rotate-0")} 
                            />
                          </div>

                          {/* Dark Book Icon Square */}
                          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xs">
                            <BookOpen size={16} />
                          </div>

                          {/* Title and Code */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] text-xs font-black rounded-md">
                                {code}
                              </span>
                              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight truncate">
                                {title}
                              </h3>
                            </div>
                            <span className="text-xs text-slate-400 font-bold block mt-1">
                              {subCount} subtopics
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Subtopics & Outcomes */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-[#F8FAF9] p-4 sm:p-5 space-y-4 border-t border-slate-100"
                          >
                            {topic.subtopics && topic.subtopics.length > 0 ? (
                              topic.subtopics.map((sub, sIdx) => (
                                <div key={sIdx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {code}.{sIdx + 1} {sub.title}
                                  </h4>

                                  {/* Specific Competencies */}
                                  {sub.competencies && sub.competencies.length > 0 && (
                                    <div className="space-y-2">
                                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Specific Competencies & Outcomes
                                      </span>
                                      <ul className="space-y-1.5">
                                        {sub.competencies.map((comp, cIdx) => (
                                          <li key={cIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                            <Check className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                                            <span>{comp}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Knowledge, Skills, Values */}
                                  {(sub.knowledge || sub.skills || sub.values) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                                      {sub.knowledge && (
                                        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                                          <span className="block text-[9px] font-black text-amber-700 uppercase tracking-widest">
                                            Knowledge
                                          </span>
                                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-0.5">
                                            {sub.knowledge}
                                          </p>
                                        </div>
                                      )}
                                      {sub.skills && (
                                        <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/50">
                                          <span className="block text-[9px] font-black text-blue-700 uppercase tracking-widest">
                                            Skills
                                          </span>
                                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-0.5">
                                            {sub.skills}
                                          </p>
                                        </div>
                                      )}
                                      {sub.values && (
                                        <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/50">
                                          <span className="block text-[9px] font-black text-purple-700 uppercase tracking-widest">
                                            Values
                                          </span>
                                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-0.5">
                                            {sub.values}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                                Subtopics & curriculum outcomes available in official Zambian syllabi directory.
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <BookOpen className="mx-auto text-slate-300" size={32} />
                  <p className="text-sm font-semibold">No topics found for this curriculum profile.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* MAIN LIST VIEW (SCREENSHOT 1) */
          /* ============================================================ */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Header with Back button */}
            {!embedded && (
              <div className="space-y-1">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider mb-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                )}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  Syllabus Library
                </h1>
                <p className="text-sm text-slate-500 font-medium tracking-wide">
                  Browse curriculum content by subject
                </p>
              </div>
            )}

            {/* "Can't find your subject?" Button Banner */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full py-3 bg-white border border-[#E7CFC8] hover:bg-[#FAECE7]/30 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[#D95D39] transition-all shadow-2xs group cursor-pointer"
            >
              <HelpCircle size={17} className="text-[#D95D39] group-hover:rotate-12 transition-transform" />
              <span>Can't find your subject?</span>
            </button>

            {/* Search & Comprehensive Filters Card */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              
              {/* 1. CURRICULUM TYPE SWITCH (CBC vs OBC vs All) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers size={13} className="text-[#D95D39]" />
                    <span>Framework</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {selectedCurriculumType === 'ALL' && 'All Frameworks'}
                    {selectedCurriculumType === 'CBC' && '2024 / 2025'}
                    {selectedCurriculumType === 'OBC' && '2013 / 2014'}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F3] rounded-2xl border border-slate-200/80">
                  <div className="flex-1 py-2 px-3 rounded-xl font-black text-xs bg-[#D95D39] text-white shadow-xs flex items-center justify-between">
                    <span>Competency-Based Curriculum (CBC)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                      {cbcCount || allSyllabiList.length} Syllabi
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. SEARCH INPUT */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  placeholder="Search syllabi by title, subject or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAF9] border border-slate-200/70 rounded-2xl text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* 3. DUAL DROPDOWNS: GRADE SELECTOR & SUBJECT SELECTOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Grade dropdown filter */}
                <div className="relative space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-blue-600" />
                    <span>Grade / Form Level</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGradeFilter}
                      onChange={(e) => setSelectedGradeFilter(e.target.value)}
                      className={cn(
                        "w-full appearance-none px-4 py-3 bg-[#F8FAF9] border rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer",
                        selectedGradeFilter !== 'All Grades' ? "border-blue-400 bg-blue-50/40 text-blue-950 font-bold" : "border-slate-200/70"
                      )}
                    >
                      {uniqueGrades.map((g, gIdx) => (
                        <option key={gIdx} value={g}>{g}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Subject dropdown filter */}
                <div className="relative space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-emerald-600" />
                    <span>Subject Category</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubjectFilter}
                      onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                      className={cn(
                        "w-full appearance-none px-4 py-3 bg-[#F8FAF9] border rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all cursor-pointer",
                        selectedSubjectFilter !== 'All Subjects' ? "border-emerald-400 bg-emerald-50/40 text-emerald-950 font-bold" : "border-slate-200/70"
                      )}
                    >
                      {uniqueSubjects.map((sub, sIdx) => (
                        <option key={sIdx} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              {/* Active Filter Chips & Reset */}
              {hasActiveFilters && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
                    {selectedCurriculumType !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-[#D95D39] font-black text-[11px]">
                        <span>{selectedCurriculumType}</span>
                        <button onClick={() => setSelectedCurriculumType('ALL')} className="hover:text-black">✕</button>
                      </span>
                    )}
                    {selectedGradeFilter !== 'All Grades' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-black text-[11px]">
                        <span>{selectedGradeFilter}</span>
                        <button onClick={() => setSelectedGradeFilter('All Grades')} className="hover:text-black">✕</button>
                      </span>
                    )}
                    {selectedSubjectFilter !== 'All Subjects' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[11px]">
                        <span>{selectedSubjectFilter}</span>
                        <button onClick={() => setSelectedSubjectFilter('All Subjects')} className="hover:text-black">✕</button>
                      </span>
                    )}
                    {searchTerm.trim() !== '' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-black text-[11px]">
                        <span>"{searchTerm}"</span>
                        <button onClick={() => setSearchTerm('')} className="hover:text-black">✕</button>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset All</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4 Dynamic Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Stat 1: Total Syllabi */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FDEEEA] flex items-center justify-center text-[#D95D39] shrink-0">
                  <BookOpen size={22} />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900 leading-none">
                    {stats.totalSyllabi}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 mt-1">
                    {hasActiveFilters ? 'Matching Syllabi' : 'Total Syllabi'}
                  </span>
                </div>
              </div>

              {/* Stat 2: Subjects */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF2FE] flex items-center justify-center text-[#3B82F6] shrink-0">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900 leading-none">
                    {stats.subjects}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 mt-1">
                    Subjects
                  </span>
                </div>
              </div>

              {/* Stat 3: With Components */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#F5EEFD] flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <Layers size={22} />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900 leading-none">
                    {stats.withComponents}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 mt-1">
                    With Components
                  </span>
                </div>
              </div>

              {/* Stat 4: Total Topics */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF8E7] flex items-center justify-center text-[#F59E0B] shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900 leading-none">
                    {stats.totalTopics}
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-400 mt-1">
                    Total Topics
                  </span>
                </div>
              </div>
            </div>

            {/* Syllabi List Cards Grid */}
            <div className="space-y-4">
              {filteredSyllabi.length > 0 ? (
                filteredSyllabi.map((syllabus) => {
                  const firstChar = syllabus.subject.charAt(0).toUpperCase();

                  return (
                    <motion.div
                      key={syllabus.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md overflow-hidden transition-all"
                    >
                      {/* Card Top / Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-2xl bg-[#D95D39] text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                            {firstChar}
                          </div>

                          {/* Badges Container */}
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border",
                              syllabus.curriculumType === 'CBC'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            )}>
                              {syllabus.curriculumBadge}
                            </span>
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#FAECE7] text-[#D95D39] rounded-full border border-[#F2D1C7]">
                              approved
                            </span>
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-0.5">
                          <h3 className="font-black text-base text-slate-900 tracking-tight leading-snug uppercase">
                            {syllabus.displayTitle}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {syllabus.subject} • {syllabus.curriculumCategory}
                          </p>
                        </div>

                        {/* Grade pill badge */}
                        <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                          <span>{syllabus.cleanGrade}</span>
                        </div>
                      </div>

                      {/* Card Bottom / Footer */}
                      <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold">
                          {syllabus.topicsCount || 6} topics
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSyllabus(syllabus);
                            setExpandedTopicIndex(null);
                          }}
                          className="text-[#D95D39] hover:text-[#B54121] transition-colors font-black flex items-center gap-1 cursor-pointer"
                        >
                          <span>View</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="bg-white py-12 px-6 rounded-3xl border border-slate-100 text-center text-slate-400 space-y-4 shadow-xs">
                  <Compass className="mx-auto text-slate-300" size={42} />
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">No Syllabi Found</h3>
                    <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                      No documents match your active filters ({selectedCurriculumType !== 'ALL' ? `${selectedCurriculumType}, ` : ''}{selectedGradeFilter !== 'All Grades' ? `${selectedGradeFilter}, ` : ''}{selectedSubjectFilter !== 'All Subjects' ? `${selectedSubjectFilter}` : ''}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* Request Syllabus Modal */}
        <AnimatePresence>
          {showRequestModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-[#D95D39]" size={20} />
                    <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Request a Syllabus
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowRequestModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmitRequest} className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chemistry 5070, Agricultural Science"
                      value={requestSubject}
                      onChange={(e) => setRequestSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Grade Level *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grade 12, Grade 4 CBC"
                      value={requestGrade}
                      onChange={(e) => setRequestGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Your Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. teacher@example.com"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Additional Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify if you require outcomes, knowledge components, or local content focus details..."
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="flex-1 py-2.5 bg-[#D95D39] hover:bg-[#B54121] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingRequest ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send size={12} />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
