import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  Search, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Sparkles, 
  Printer, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  Lightbulb, 
  SlidersHorizontal,
  FolderOpen,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { SYLLABI, Topic, Subtopic } from '../data/syllabi';
import { GRADES, OBC_GRADES, SECONDARY_GRADES, CATEGORY_SUBJECTS, getSubjectsForGrade } from '../constants';
import { cn } from '../lib/utils';
import { CurriculumAuditViewer } from './CurriculumAuditViewer';
import { SyllabusIntegrityAuditPanel } from './SyllabusIntegrityAuditPanel';

interface ParsedCompetency {
  code?: string;
  statement: string;
  expectedStandard?: string;
  knowledge?: string;
  skills?: string;
  values?: string;
}

// Helper to parse complex competency strings containing pipes or metadata
function parseCompetencyItem(raw: string, subtopicStandard?: string | string[]): ParsedCompetency {
  if (!raw || typeof raw !== 'string') {
    return { statement: '' };
  }

  const parts = raw.split('|').map(p => p.trim());
  let statement = parts[0] || '';
  let expectedStandard: string | undefined = undefined;
  let knowledge: string | undefined = undefined;
  let skills: string | undefined = undefined;
  let values: string | undefined = undefined;

  // Extract explicit pipe segments
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (/^expected\s*standard\s*:/i.test(part)) {
      expectedStandard = part.replace(/^expected\s*standard\s*:\s*/i, '');
    } else if (/^(\[?knowledge\]?)\s*:/i.test(part)) {
      knowledge = part.replace(/^\[?knowledge\]?\s*:\s*/i, '');
    } else if (/^(\[?skills?\]?)\s*:/i.test(part)) {
      skills = part.replace(/^\[?skills?\]?\s*:\s*/i, '');
    } else if (/^(\[?values?\]?)\s*:/i.test(part)) {
      values = part.replace(/^\[?values?\]?\s*:\s*/i, '');
    }
  }

  // Extract code prefix (e.g., 1.1.1.1 or 3.1.2 or Specific Competency: 1.4.1.1)
  let code: string | undefined = undefined;
  const codeMatch = statement.match(/^(?:specific\s*(?:competency|outcome|competence)\s*:?\s*)?((?:\d+\.)+\d+)\s*(.*)/i);
  if (codeMatch) {
    code = codeMatch[1];
    statement = codeMatch[2]?.replace(/^[-:\s]+/, '') || statement;
  } else {
    statement = statement.replace(/^(?:specific\s*(?:competency|outcome|competence)\s*:?\s*)/i, '');
  }

  if (!expectedStandard && subtopicStandard) {
    expectedStandard = Array.isArray(subtopicStandard) ? subtopicStandard.join('; ') : subtopicStandard;
  }

  return {
    code,
    statement: statement.trim(),
    expectedStandard,
    knowledge,
    skills,
    values
  };
}

export function CurriculumStandardsViewer() {
  // Mode State (Standards Explorer vs Management Audit Log vs Integrity Audit)
  const [activeMode, setActiveMode] = useState<'STANDARDS' | 'INTEGRITY_AUDIT' | 'AUDIT'>('INTEGRITY_AUDIT');

  // Filter States
  const [curriculumFramework, setCurriculumFramework] = useState<'ALL' | 'CBC' | 'OBC' | 'ECE' | 'SECONDARY' | 'ADVANCED'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 1 (CBC)');
  const [selectedSubject, setSelectedSubject] = useState<string>('English');
  const [englishComponent, setEnglishComponent] = useState<'all' | 'oral' | 'literacy'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available grade options based on framework filter
  const gradeOptions = useMemo(() => {
    const all = [
      { id: 'ECE level 1', label: 'ECE Level 1 (Age 3-4)', framework: 'ECE', level: 'Early Childhood' },
      { id: 'ECE level 2', label: 'ECE Level 2 (Age 4-5)', framework: 'ECE', level: 'Early Childhood' },
      { id: 'Grade 1 (CBC)', label: 'Grade 1 (CBC)', framework: 'CBC', level: 'Lower Primary' },
      { id: 'Grade 2 (CBC)', label: 'Grade 2 (CBC)', framework: 'CBC', level: 'Lower Primary' },
      { id: 'Grade 3 (CBC)', label: 'Grade 3 (CBC)', framework: 'CBC', level: 'Lower Primary' },
      { id: 'Grade 4 (CBC)', label: 'Grade 4 (CBC)', framework: 'CBC', level: 'Upper Primary' },
      { id: 'Grade 5 (CBC)', label: 'Grade 5 (CBC)', framework: 'CBC', level: 'Upper Primary' },
      { id: 'Grade 6 (CBC)', label: 'Grade 6 (CBC)', framework: 'CBC', level: 'Upper Primary' },
      { id: 'Grade 7 (CBC)', label: 'Grade 7 (CBC)', framework: 'CBC', level: 'Upper Primary' },
      { id: 'Grade 3 (OBC)', label: 'Grade 3 (OBC)', framework: 'OBC', level: 'Lower Primary' },
      { id: 'Grade 5 (OBC)', label: 'Grade 5 (OBC)', framework: 'OBC', level: 'Upper Primary' },
      { id: 'Grade 6 (OBC)', label: 'Grade 6 (OBC)', framework: 'OBC', level: 'Upper Primary' },
      { id: 'Grade 7 (OBC)', label: 'Grade 7 (OBC)', framework: 'OBC', level: 'Upper Primary' },
      { id: 'Grade 10 (OBC)', label: 'Grade 10 (OBC)', framework: 'OBC', level: 'Secondary' },
      { id: 'Grade 11 (OBC)', label: 'Grade 11 (OBC)', framework: 'OBC', level: 'Secondary' },
      { id: 'Grade 12 (OBC)', label: 'Grade 12 (OBC)', framework: 'OBC', level: 'Secondary' },
      { id: 'Form 1 O Level', label: 'Form 1 O Level (Secondary)', framework: 'SECONDARY', level: 'Secondary' },
      { id: 'Form 2 O Level', label: 'Form 2 O Level (Secondary)', framework: 'SECONDARY', level: 'Secondary' },
      { id: 'Form 3 O Level', label: 'Form 3 O Level (Secondary)', framework: 'SECONDARY', level: 'Secondary' },
      { id: 'Form 4 O Level', label: 'Form 4 O Level (Secondary)', framework: 'SECONDARY', level: 'Secondary' },
      { id: 'Form 5 A Level', label: 'Form 5 A Level (Advanced)', framework: 'ADVANCED', level: 'Advanced' },
      { id: 'Form 6 A Level', label: 'Form 6 A Level (Advanced)', framework: 'ADVANCED', level: 'Advanced' }
    ];

    if (curriculumFramework === 'ALL') return all;
    if (curriculumFramework === 'CBC') return all.filter(g => g.framework === 'CBC' || g.framework === 'SECONDARY');
    if (curriculumFramework === 'OBC') return all.filter(g => g.framework === 'OBC');
    if (curriculumFramework === 'ECE') return all.filter(g => g.framework === 'ECE');
    if (curriculumFramework === 'SECONDARY') return all.filter(g => g.framework === 'SECONDARY');
    if (curriculumFramework === 'ADVANCED') return all.filter(g => g.framework === 'ADVANCED');
    return all;
  }, [curriculumFramework]);

  // Adjust selected grade if current selection is not in the filtered options
  React.useEffect(() => {
    if (!gradeOptions.some(g => g.id === selectedGrade)) {
      if (gradeOptions.length > 0) {
        setSelectedGrade(gradeOptions[0].id);
      }
    }
  }, [gradeOptions, selectedGrade]);

  // Available subjects for the currently selected grade
  const availableSubjects = useMemo(() => {
    // Check direct keys in SYLLABI
    const directGradeData = SYLLABI[selectedGrade];
    if (directGradeData) {
      const keys = Object.keys(directGradeData);
      // If Grade 1 or 2 English, simplify to "English" with components
      const filteredKeys = keys.filter(k => {
        if ((selectedGrade.includes('Grade 1') || selectedGrade.includes('Grade 2')) && (k === 'Oral English' || k === 'literacy in English')) {
          return false;
        }
        return true;
      });
      if (selectedGrade.includes('Grade 1') || selectedGrade.includes('Grade 2')) {
        if (!filteredKeys.some(k => k.toLowerCase().includes('english'))) {
          filteredKeys.unshift('English');
        }
      }
      return filteredKeys;
    }

    // Fallback to constants getSubjectsForGrade
    return getSubjectsForGrade(selectedGrade);
  }, [selectedGrade]);

  // Auto-select first available subject if current subject is not in list
  React.useEffect(() => {
    if (availableSubjects.length > 0) {
      const exists = availableSubjects.some(s => s.toLowerCase() === selectedSubject.toLowerCase());
      if (!exists) {
        setSelectedSubject(availableSubjects[0]);
      }
    }
  }, [availableSubjects, selectedSubject]);

  // Extract topics for selected grade & subject
  const rawSyllabusTopics = useMemo<Topic[]>(() => {
    const gLow = selectedGrade.toLowerCase();
    const sLow = selectedSubject.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    // Find direct match or fallback in SYLLABI
    let topics: Topic[] = [];

    // Strategy 1: Match directly in SYLLABI[selectedGrade]
    const gradeData = SYLLABI[selectedGrade];
    if (gradeData) {
      const keys = Object.keys(gradeData);
      let subjectKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').trim() === sLow);
      if (!subjectKey) {
        subjectKey = keys.find(k => {
          const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          return sLow.includes(kLow) || kLow.includes(sLow);
        });
      }

      if (subjectKey) {
        const isEng = selectedSubject.toLowerCase().includes('english');
        if (isEng && ((gLow.includes('grade 1') && !gLow.includes('grade 10') && !gLow.includes('grade 11') && !gLow.includes('grade 12')) || gLow.includes('grade 2'))) {
          const oral = gradeData['Oral English'] || [];
          const literacy = gradeData['literacy in English'] || [];
          if (englishComponent === 'oral') {
            topics = oral;
          } else if (englishComponent === 'literacy') {
            topics = literacy;
          } else {
            topics = [...oral, ...literacy];
          }
        } else {
          topics = gradeData[subjectKey] || [];
        }
      }
    }

    // Strategy 2: If secondary form and not found in Form X, check Form 1-4 Subject (CBC)
    if ((!topics || topics.length === 0) && gLow.includes('form')) {
      const fallbackGradeKey = Object.keys(SYLLABI).find(k => {
        const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kLow.includes('form') && kLow.includes(sLow);
      });
      if (fallbackGradeKey) {
        const keys = Object.keys(SYLLABI[fallbackGradeKey]);
        const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').trim() === sLow) || keys[0];
        if (matchedKey) {
          topics = SYLLABI[fallbackGradeKey][matchedKey] || [];
        }
      }
    }

    // Strategy 3: Check generic Grade 1-7 Primary or Upper Primary keys
    if (!topics || topics.length === 0) {
      const matchKey = Object.keys(SYLLABI).find(k => {
        const kLow = k.toLowerCase();
        return kLow.includes(gLow.replace(/[^a-z0-9]/g, '')) && SYLLABI[k];
      });
      if (matchKey && SYLLABI[matchKey]) {
        const sKeys = Object.keys(SYLLABI[matchKey]);
        const sMatch = sKeys.find(sk => sk.toLowerCase().replace(/[^a-z0-9]/g, '').includes(sLow));
        if (sMatch) {
          topics = SYLLABI[matchKey][sMatch] || [];
        }
      }
    }

    return topics || [];
  }, [selectedGrade, selectedSubject, englishComponent]);

  const isSecondaryLanguageSpecial = useMemo(() => {
    return (selectedGrade.includes('Grade 10') || selectedGrade.includes('Grade 11') || selectedGrade.includes('Grade 12')) &&
      (selectedSubject.toLowerCase().includes('english') || selectedSubject.toLowerCase().includes('zambian'));
  }, [selectedGrade, selectedSubject]);

  // Transform secondary language syllabus on the fly so Components are separated from Topics
  const currentSyllabusTopics = useMemo<Topic[]>(() => {
    if (!rawSyllabusTopics || !Array.isArray(rawSyllabusTopics)) return [];
    if (!isSecondaryLanguageSpecial) return rawSyllabusTopics;

    const transformed: Topic[] = [];
    rawSyllabusTopics.forEach((comp: any) => {
      const compTitle = comp.title;
      const compCompetency = comp.generalCompetency || "";
      
      if (comp.subtopics && Array.isArray(comp.subtopics)) {
        comp.subtopics.forEach((sub: any) => {
          transformed.push({
            title: sub.title,
            generalCompetency: compCompetency,
            subtopics: [
              {
                title: sub.title,
                competencies: sub.competencies || [],
                learningActivities: sub.learningActivities || [],
                expectedStandard: sub.expectedStandard || "",
                knowledge: sub.knowledge || "",
                skills: sub.skills || "",
                values: sub.values || ""
              }
            ],
            // Store the original component name
            component: compTitle
          } as any);
        });
      } else {
        transformed.push(comp);
      }
    });

    return transformed;
  }, [rawSyllabusTopics, isSecondaryLanguageSpecial]);

  // Search filter across topics, subtopics, and competencies
  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) return currentSyllabusTopics;

    const term = searchTerm.toLowerCase().trim();
    return currentSyllabusTopics.filter(topic => {
      const topicMatch = topic.title.toLowerCase().includes(term) ||
        (topic.generalCompetency && topic.generalCompetency.toLowerCase().includes(term));
      
      const subtopicMatch = topic.subtopics?.some(sub => {
        const titleMatch = sub.title.toLowerCase().includes(term);
        const compMatch = sub.competencies?.some(c => c.toLowerCase().includes(term));
        const expMatch = sub.expectedStandard ? 
          (Array.isArray(sub.expectedStandard) ? sub.expectedStandard.join(' ').toLowerCase().includes(term) : sub.expectedStandard.toLowerCase().includes(term)) : false;
        const actMatch = sub.learningActivities ? 
          (Array.isArray(sub.learningActivities) ? sub.learningActivities.join(' ').toLowerCase().includes(term) : false) : false;
        const ksvMatch = (sub.knowledge || '').toLowerCase().includes(term) ||
          (sub.skills || '').toLowerCase().includes(term) ||
          (sub.values || '').toLowerCase().includes(term);
        
        return titleMatch || compMatch || expMatch || actMatch || ksvMatch;
      });

      return topicMatch || subtopicMatch;
    });
  }, [currentSyllabusTopics, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    let subtopicsCount = 0;
    let competenciesCount = 0;
    let expectedStandardsCount = 0;

    currentSyllabusTopics.forEach(topic => {
      if (topic.subtopics) {
        subtopicsCount += topic.subtopics.length;
        topic.subtopics.forEach(sub => {
          if (sub.competencies) {
            competenciesCount += sub.competencies.length;
          }
          if (sub.expectedStandard) {
            expectedStandardsCount += Array.isArray(sub.expectedStandard) ? sub.expectedStandard.length : 1;
          }
        });
      }
    });

    return {
      topicsCount: currentSyllabusTopics.length,
      subtopicsCount,
      competenciesCount,
      expectedStandardsCount
    };
  }, [currentSyllabusTopics]);

  // Expand / Collapse all toggles
  const handleToggleAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    currentSyllabusTopics.forEach((_, idx) => {
      nextState[`topic-${idx}`] = expand;
    });
    setExpandedTopics(nextState);
  };

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Copy helper
  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy entire topic
  const handleCopyTopic = (topic: Topic, idx: number) => {
    const lines: string[] = [];
    lines.push(`TOPIC ${topic.title}`);
    if (topic.generalCompetency) {
      lines.push(`GENERAL COMPETENCY: ${topic.generalCompetency}`);
    }
    lines.push('');
    topic.subtopics?.forEach((sub, sIdx) => {
      lines.push(`  Subtopic ${sIdx + 1}: ${sub.title}`);
      if (sub.competencies && sub.competencies.length > 0) {
        lines.push(`  Specific Competencies:`);
        sub.competencies.forEach(c => {
          const parsed = parseCompetencyItem(c);
          lines.push(`    - ${parsed.code ? `[${parsed.code}] ` : ''}${parsed.statement}`);
          if (parsed.expectedStandard) lines.push(`      Expected Standard: ${parsed.expectedStandard}`);
        });
      }
      lines.push('');
    });

    handleCopyText(lines.join('\n'), `topic-full-${idx}`, 'Entire Topic');
  };

  const isOBC = selectedGrade.toLowerCase().includes('(obc)');
  const isEnglishSpecial = ((selectedGrade.toLowerCase().includes('grade 1') && !selectedGrade.toLowerCase().includes('grade 10') && !selectedGrade.toLowerCase().includes('grade 11') && !selectedGrade.toLowerCase().includes('grade 12')) || selectedGrade.toLowerCase().includes('grade 2')) && selectedSubject.toLowerCase().includes('english');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('INTEGRITY_AUDIT')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
              activeMode === 'INTEGRITY_AUDIT'
                ? "bg-[#00A86B] text-white shadow-md shadow-emerald-200"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <ShieldCheck size={15} />
            Syllabus Integrity Audit (Side-by-Side)
          </button>
          <button
            onClick={() => setActiveMode('STANDARDS')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
              activeMode === 'STANDARDS'
                ? "bg-slate-950 text-white shadow-md shadow-slate-900/30 border border-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <BookOpen size={15} />
            Standards Explorer
          </button>
          <button
            onClick={() => setActiveMode('AUDIT')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
              activeMode === 'AUDIT'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-500"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Layers size={15} />
            Curriculum Audit Log
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400 px-3">
          {activeMode === 'INTEGRITY_AUDIT' ? 'Side-by-Side Document vs CDC Verification' : activeMode === 'STANDARDS' ? 'Browsing Syllabus Standards' : 'Systematic Integrity Verification'}
        </span>
      </div>

      {activeMode === 'INTEGRITY_AUDIT' ? (
        <SyllabusIntegrityAuditPanel />
      ) : activeMode === 'AUDIT' ? (
        <CurriculumAuditViewer />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} className="text-emerald-400" />
                Ministry of Education (CDC)
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border",
                isOBC ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              )}>
                {isOBC ? 'Outcomes-Based Curriculum (OBC)' : 'Competence-Based Curriculum (CBC)'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Subject Curriculum Standards
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl font-normal leading-relaxed">
              Explore officially codified Zambian national syllabus competencies, specific learning outcomes, expected standards, and instructional activities for your grade and subject.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <p className="text-2xl font-black text-white">{stats.topicsCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Topics</p>
            </div>
            <div className="text-center px-2 border-x border-white/10">
              <p className="text-2xl font-black text-emerald-400">{stats.subtopicsCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Subtopics</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-black text-blue-400">{stats.competenciesCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Competencies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Selection Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
        {/* Framework Selector Tabs */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-700" />
            Curriculum Level & Framework
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Frameworks' },
              { id: 'CBC', label: 'Primary CBC (Grade 1-7)' },
              { id: 'OBC', label: 'Outcomes-Based (OBC)' },
              { id: 'ECE', label: 'Early Childhood (ECE)' },
              { id: 'SECONDARY', label: 'Secondary (Form 1-4)' },
              { id: 'ADVANCED', label: 'Advanced (Form 5-6)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCurriculumFramework(f.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  curriculumFramework === f.id
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade and Subject Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          {/* Grade Dropdown */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <GraduationCap size={15} className="text-blue-600" />
              Target Grade / Level
            </label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer pr-10"
              >
                {gradeOptions.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <BookOpen size={15} className="text-emerald-600" />
              Syllabus Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer pr-10"
              >
                {availableSubjects.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Special English Component Switcher (if Grade 1/2 English) */}
          {isEnglishSpecial ? (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText size={15} className="text-amber-600" />
                English Component
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'oral', label: 'Oral' },
                  { id: 'literacy', label: 'Literacy' }
                ].map(comp => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setEnglishComponent(comp.id as any)}
                    className={cn(
                      "py-2 text-xs font-bold rounded-lg transition-all text-center",
                      englishComponent === comp.id
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden lg:block">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Curriculum Reference
              </label>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">CDC Standard Zambian Matrix</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search topic, outcome code (e.g. 1.2.1), or concept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ChevronDown size={14} />
              Expand All
            </button>
            <button
              type="button"
              onClick={() => handleToggleAll(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ChevronUp size={14} />
              Collapse All
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print Curriculum Standards"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Curriculum Topics & Competencies List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
              <FolderOpen size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No Curriculum Standards Found</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                {searchTerm
                  ? `No topics or competencies matched "${searchTerm}". Try resetting your search term.`
                  : `Curriculum matrix for ${selectedSubject} in ${selectedGrade} is currently being updated in the national syllabus repository.`}
              </p>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
              >
                Reset Search Filter
              </button>
            )}
          </div>
        ) : (() => {
          let lastComponent = "";
          return filteredTopics.map((topic, topicIdx) => {
            const topicKey = `topic-${topicIdx}`;
            const isExpanded = expandedTopics[topicKey] ?? true; // Default expanded for great readability
            const currentComponent = (topic as any).component || "";
            const showComponentHeader = isSecondaryLanguageSpecial && currentComponent && currentComponent !== lastComponent;
            if (showComponentHeader) {
              lastComponent = currentComponent;
            }

            return (
              <React.Fragment key={topicKey}>
                {showComponentHeader && (
                  <div className="pt-6 pb-2 first:pt-2">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl shadow-xs">
                      <div className="w-2.5 h-5 bg-[#00A86B] rounded-full" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {currentComponent}
                      </h3>
                    </div>
                  </div>
                )}
                <div
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Topic Header Card */}
                  <div 
                    onClick={() => handleToggleTopic(topicKey)}
                    className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-white flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
                  >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      {topicIdx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {topic.title}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                          {topic.subtopics?.length || 0} Subtopics
                        </span>
                      </div>
                      {topic.generalCompetency && (
                        <p className="text-xs text-slate-500 font-medium leading-normal">
                          <span className="font-bold text-slate-700">General Outcome/Competency:</span> {topic.generalCompetency}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyTopic(topic, topicIdx);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Copy Entire Topic Content"
                    >
                      {copiedId === `topic-full-${topicIdx}` ? (
                        <Check size={18} className="text-emerald-600" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                    <div className="p-2 text-slate-400 hover:text-slate-900">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Subtopics and Specific Competencies Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="divide-y divide-slate-100 bg-slate-50/30"
                    >
                      {topic.subtopics?.map((subtopic, subIdx) => (
                        <div key={`sub-${subIdx}`} className="p-5 sm:p-6 space-y-4">
                          {/* Subtopic Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-200/80 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                                {subIdx + 1}
                              </span>
                              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                                {subtopic.title}
                              </h3>
                            </div>
                          </div>

                          {/* Specific Competencies */}
                          {subtopic.competencies && subtopic.competencies.length > 0 ? (
                            <div className="space-y-3 pl-2 sm:pl-8">
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Layers size={13} className="text-slate-500" />
                                {isOBC ? 'Specific Learning Outcomes' : 'Specific Competencies'}
                              </h4>

                              <div className="grid grid-cols-1 gap-2.5">
                                {subtopic.competencies.map((compRaw, compIdx) => {
                                  const parsed = parseCompetencyItem(compRaw, subtopic.expectedStandard);
                                  const compId = `comp-${topicIdx}-${subIdx}-${compIdx}`;

                                  return (
                                    <div
                                      key={compId}
                                      className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all space-y-2.5 shadow-xs group"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2.5">
                                          {parsed.code && (
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200 shrink-0 mt-0.5">
                                              {parsed.code}
                                            </span>
                                          )}
                                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                                            {parsed.statement}
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(
                                            parsed.code ? `${parsed.code} ${parsed.statement}` : parsed.statement,
                                            compId,
                                            'Competency'
                                          )}
                                          className="text-slate-300 group-hover:text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                                          title="Copy Specific Competency"
                                        >
                                          {copiedId === compId ? (
                                            <Check size={16} className="text-emerald-600" />
                                          ) : (
                                            <Copy size={16} />
                                          )}
                                        </button>
                                      </div>

                                      {/* Expected Standard Highlight */}
                                      {parsed.expectedStandard && (
                                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2.5 text-xs text-emerald-950 flex items-start gap-2">
                                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-emerald-800">Expected Standard:</span>{' '}
                                            <span className="font-medium text-emerald-900">{parsed.expectedStandard}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Knowledge, Skills, Values (KSV Matrix) */}
                                      {(parsed.knowledge || parsed.skills || parsed.values) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                          {parsed.knowledge && (
                                            <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
                                              <span className="font-bold block text-blue-700">Knowledge</span>
                                              {parsed.knowledge}
                                            </div>
                                          )}
                                          {parsed.skills && (
                                            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px] text-amber-900">
                                              <span className="font-bold block text-amber-700">Skills</span>
                                              {parsed.skills}
                                            </div>
                                          )}
                                          {parsed.values && (
                                            <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900">
                                              <span className="font-bold block text-purple-700">Values</span>
                                              {parsed.values}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {/* Learning Activities */}
                          {subtopic.learningActivities && (
                            <div className="pl-2 sm:pl-8 pt-1">
                              <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200/60 space-y-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  <Lightbulb size={13} className="text-amber-500" />
                                  Suggested Syllabus Learning Activities
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {(Array.isArray(subtopic.learningActivities) 
                                    ? subtopic.learningActivities 
                                    : Object.values(subtopic.learningActivities).flat()
                                  ).map((act, actIdx) => (
                                    <span
                                      key={actIdx}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white text-slate-700 border border-slate-200/80 shadow-2xs"
                                    >
                                      {act}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </React.Fragment>
            );
          });
        })()}
      </div>
        </>
      )}
    </div>
  );
}
