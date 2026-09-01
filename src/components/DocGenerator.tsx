import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  ChevronLeft,
  GraduationCap,
  Wand2,
  Loader2,
  User,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  ExternalLink,
  BookMarked,
  Video,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Search,
  Plus,
  Layers,
  Lock,
  ClipboardList,
  Trash2,
  Sparkles,
  FileCode,
  FileCheck,
  Sliders,
  RotateCcw,
  Eye,
  EyeOff,
  History as HistoryIcon,
  Languages,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Copy,
  MessageSquare
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, where, limit, addDoc, serverTimestamp, getDocs, writeBatch, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, recordActivity } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { DOC_TEMPLATES, DocType, GRADES, OBC_GRADES, OBC_LEVELS, OBC_SUBJECTS, getSubjectsForGrade, TEACHER_ROLES, DEFAULT_AI_INSTRUCTIONS, JOB_PURPOSE_DEFAULTS, isDeveloperEmail } from '../constants';
import { SYLLABI, COMMON_LEARNING_ACTIVITIES } from '../data/syllabi';
import { generateEducationalDoc, getSyllabusActivities, getTermlySchemeSequence, sliceSyllabusByTopicRange, GenerationParams, extractSyllabusFromModule, generateDraftContent } from '../services/geminiService';
import { parseRawCompetency, extractBriefCompetencies, extractEmbeddedExpectedStandards, extractEmbeddedLearningActivities, formatGeneralCompetenciesShortForm, getOfficialSyllabusCitation } from '../utils/competencyUtils';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';

const isEnglishSubtopicInTerm = (title: string, termStr: string, subject?: string): boolean => {
  const match = title.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return termStr === "1";
  
  const grade = Number(match[1]);
  const major = Number(match[2]);
  const minor = Number(match[3]);
  
  const isLiteracy = subject?.toLowerCase().includes("literacy");
  
  if (grade === 1) {
    if (isLiteracy) {
      if (major === 9) {
        const term1Sounds = ["/s/", "/a/", "/i/", "/p/", "/n/", "/ck/", "/e/", "/h/"];
        const term2Sounds = ["/m/", "/d/", "/g/", "/o/", "/u/", "/l/", "/f/", "/b/", "/ai/", "/j/", "/oa/", "/ie/", "/ee/", "/or/", "/z/", "/w/", "/v/"];
        const term3Sounds = ["/th/", "/qu/", "/ou/", "/oi/", "/ue/", "/er/", "/ar/"];
        
        if (termStr === "1") return term1Sounds.some(s => title.includes(s));
        if (termStr === "2") return term2Sounds.some(s => title.includes(s));
        if (termStr === "3") return term3Sounds.some(s => title.includes(s));
      }
      return false;
    } else {
      if (major === 1) {
        if (termStr === "1") {
          return minor >= 1 && minor <= 7; // 1.1.1 Greetings to 1.1.7 Food and Meals -> Term 1
        }
        if (termStr === "2") {
          return minor >= 7 && minor <= 13; // 1.1.7 Food and Meals to 1.1.13 Community Practices -> Term 2
        }
        if (termStr === "3") {
          return minor >= 13 && minor <= 15; // 1.1.13 Community Practices to 1.1.15 Plurals -> Term 3
        }
      }
      
      if (termStr === "3") {
        if (major === 2 && minor === 1) return true; // 1.2.1 Manners (Etiquette)
        if (major === 3 && minor === 1) return true; // 1.3.1 Simple Stories (Stories)
        if (major === 4 && minor === 1) return true; // 1.4.1 Simple Songs (Songs)
        if (major === 5 && minor === 1) return true; // 1.5.1 Role Playing (Drama)
        if (major === 6 && (minor === 1 || minor === 2)) return true; // 1.6.1 Simple Poems, 1.6.2 Tongue Twisters (Poetry)
      }
      
      return false;
    }
  }
  
  if (grade === 2) {
    if (isLiteracy) {
      if (major === 9) {
        const term1Sounds = ["/s/", "/e/", "/j/", "/t/", "/ai/", "/oi/", "/ee/", "/n/", "/ie/", "/k/", "/r/", "/o/", "/m/", "/ue/", "/w/", "/or/", "/d/", "/g/"];
        if (termStr === "1") return term1Sounds.some(s => title.includes(s));
        const term2Sounds = ["/l/", "/er/", "/b/", "/z/", "/v/", "/p/", "Blend:", "/ch/", "/ng/", "/ear/", "/oor/", "/air/"];
        if (termStr === "2") return term2Sounds.some(s => title.includes(s));
      }
      if (termStr === "2") {
        if (major === 10) return minor === 1; // 2.10.1 Sight words
        if (major === 17) return minor === 1; // 2.17.1 Nouns
      }
      return false;
    }
    if (termStr === "1") {
      if (major === 1) {
        return minor === 1 || minor === 2 || minor === 6 || minor === 10;
      }
      if (major === 2) return minor === 1; // 2.2.1 Simple stories
      if (major === 3) return minor === 1; // 2.3.1 Simple plays
      if (major === 6) return minor === 1; // 2.6.1 Simple songs
      if (major === 7) return minor === 1; // 2.7.1 Describing people
      if (major === 9) {
        const term1Sounds = ["/s/", "/e/", "/j/", "/t/", "/ai/", "/oi/", "/ee/", "/n/", "/ie/", "/k/", "/r/", "/o/", "/m/", "/ue/", "/w/", "/or/", "/d/", "/g/"];
        return term1Sounds.some(s => title.includes(s));
      }
      if (major === 10) return minor === 1 && title.includes("Punctuation"); // 2.10.1 Punctuation marks (Term 1)
      if (major === 11) return minor === 1; // 2.11.1 Intensive reading
      if (major === 12) return minor === 1; // 2.12.1 Copying
      if (major === 13) return minor === 1; // 2.13.1 Words, phrases and sentences
      if (major === 14) return minor === 1 || minor === 2; // 2.14.1 Alphabetical order, 2.14.2 Logical order
      if (major === 15) return minor === 1 || minor === 2; // 2.15.1 Word spelling, 2.15.2 Dictation
      if (major === 16) return minor === 1 || minor === 2; // 2.16.1 Synonyms, 2.16.2 Antonyms
      if (major === 17) return minor === 2; // 2.17.2 Verbs (Term 1)
      return false;
    }
    if (termStr === "2") {
      if (major === 1) {
        return minor === 4 || minor === 7 || minor === 8;
      }
      if (major === 9) {
        const term2Sounds = ["/l/", "/er/", "/b/", "/z/", "/v/", "/p/", "Blend:", "/ch/", "/ng/", "/ear/", "/oor/", "/air/"];
        return term2Sounds.some(s => title.includes(s));
      }
      if (major === 10) return minor === 1 && title.includes("Sight Words"); // 2.10.1 Sight words
      if (major === 17) return minor === 1; // 2.17.1 Nouns
      if (major === 2) return minor === 1; // 2.2.1 Simple stories
      if (major === 3) return minor === 1; // 2.3.1 Simple plays
      if (major === 4) return minor === 1; // 2.4.1 Simple Poems
      if (major === 5) return minor === 1; // 2.5.1 Simple riddles
      if (major === 6) return minor === 1; // 2.6.1 Simple Songs
      if (major === 8) return minor === 1; // 2.8.1 Language Games
      return false;
    }
    if (termStr === "3") {
      if (isLiteracy) {
        return major >= 11 && major <= 18;
      } else {
        if (major === 1) {
          return minor === 3 || minor === 5 || minor === 7 || minor === 9;
        }
        return major >= 2 && major <= 8;
      }
    }
    return false;
  }
  
  return termStr === "1";
};

interface Module {
  id: string;
  name: string;
  content: string;
  subject: string;
  grade?: string;
  category?: string;
}

interface BatchLesson {
  id: string;
  topic: string;
  subtopic: string;
  specificCompetences: string;
  learningActivities: string[];
  expectedStandard?: string;
  teachingAids?: string;
  references?: string;
}

interface BatchForecast {
  id: string;
  week: number;
  grade: string;
  subject: string;
  days: {
    day: string;
    topic: string;
    subtopic: string;
    competency: string;
    activities: string[];
    expectedStandard?: string;
    teachingAids?: string;
    references?: string;
  }[];
  isActive: boolean;
  isExpanded: boolean;
}

interface DocGeneratorProps {
  initialType?: DocType;
  onGenerate: (content: string, params: GenerationParams) => void;
  onBack: () => void;
  onNavigate?: (section: string) => void;
}

// CustomSelect component for consistent styling
const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...",
  dark = false
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: string[]; 
  placeholder?: string;
  dark?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <div 
        className={cn(
          "w-full rounded-xl px-4 py-3 text-sm flex justify-between items-center cursor-pointer transition-all shadow-sm",
          dark 
            ? "bg-slate-800 border border-slate-700 text-white hover:border-slate-600" 
            : "bg-white border border-slate-200 text-slate-900 hover:border-slate-300",
          isOpen ? (dark ? "ring-2 ring-emerald-500 border-emerald-500" : "ring-2 ring-blue-100 border-blue-200") : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? (dark ? "text-white font-bold" : "text-slate-900 font-medium") : "text-slate-400"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-2 text-slate-400">
          {value && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="hover:text-slate-200 outline-none p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div className={cn(
            "absolute z-[70] w-full mt-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200",
            dark ? "bg-slate-800 border border-slate-700 text-white" : "bg-white border border-slate-100 text-slate-900"
          )}>
            <div className={cn("p-3 border-b flex items-center gap-2 text-slate-400", dark ? "border-slate-700" : "border-slate-50")}>
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                className={cn("w-full bg-transparent text-sm outline-none placeholder:text-slate-400", dark ? "text-white" : "text-slate-700")} 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1.5">
              {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all text-left font-medium",
                    value === opt 
                      ? (dark ? "bg-slate-700 text-emerald-400 font-bold" : "bg-slate-50 text-slate-900") 
                      : (dark ? "text-slate-200 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
                  )}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="w-4 flex justify-center">
                    {value === opt && <Check size={16} className={dark ? "text-emerald-400" : "text-slate-900"} />}
                  </div>
                  {opt}
                </button>
              )) : (
                <div className="px-4 py-6 text-sm text-slate-400 text-center">No results found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const ZAMBIAN_REFERENCE_BOOKS: Record<string, string[]> = {
  "mathematics": [
    "Ministry of Education Mathematics National Syllabus",
    "ZEPH Junior Secondary Mathematics Pupil's Book",
    "Progress in Mathematics Grade 8/9 (ZEPH)",
    "Oxford University Press Mathematics for Zambia",
    "Pearson Longman Mathematics Grade 1-7",
    "Bundy Primary Mathematics Coursebook",
  ],
  "science": [
    "Ministry of Education Integrated Science National Syllabus",
    "Integrated Science Junior Secondary Pupil's Book (ZEPH)",
    "Macmillan Integrated Science Grade 4-7",
    "Progress in Science Grade 8/9",
    "Bundy Zambia Primary Integrated Science Teachers Guide",
    "Zambian Science & Technology Pupil's Book",
  ],
  "english": [
    "Ministry of Education English National Syllabus",
    "ZEPH Junior Secondary English Course Pupil's Book",
    "Progress in English Grade 10-12 Booklet",
    "Macmillan English Grade 1-7 Coursebook",
    "Oxford University Press English for Zambia Text",
  ],
  "social studies": [
    "Ministry of Education Social Studies National Syllabus",
    "Social Studies Pupil's Book (ZEPH)",
    "Macmillan Social Studies Grade 5-7",
    "Oxford Secondary Social Studies for Zambia",
  ],
  "creative and technology studies": [
    "Ministry of Education CTS Grade 1-4 Syllabus",
    "Creative & Technology Studies Pupil's Book Grade 1-4 (ZEPH)",
    "Zambian Creative Arts and Technology Guides",
  ],
  "technology studies": [
    "Ministry of Education Technology Studies Syllabus",
    "Technology Studies Pupil's Book Grade 5-7 (ZEPH)",
    "Junior Secondary Computer Studies for Zambia",
  ],
  "zambian language": [
    "Zambian Languages Official Curriculum Syllabus",
    "Standardized Orthography of Zambian Languages",
    "ZEPH Zambian Languages Pupil's Coursebook",
  ],
};

const getReferencesForSubject = (subject: string, grade?: string, curriculumType: string = 'CBC'): string[] => {
  const officialSyllabusRef = getOfficialSyllabusCitation(grade || 'Grade 1', subject || 'Subject', curriculumType);
  const sLow = (subject || '').toLowerCase();
  for (const [key, refs] of Object.entries(ZAMBIAN_REFERENCE_BOOKS)) {
    if (sLow.includes(key)) {
      return [officialSyllabusRef, ...refs, "Ministry of Education National Syllabus Reference", "Other School/Zone Approved Materials"];
    }
  }
  return [
    officialSyllabusRef,
    "Ministry of Education Official Syllabus",
    "Zambian Educational Publishing House (ZEPH) Syllabus Textbooks",
    "Grade Curriculum Resource Reference Guides",
    "Oxford Secondary/Primary Textbooks for Zambia",
    "Longman Pupil's Coursebook",
    "Approved School/Zone Supplementary Materials"
  ];
};

export function getZambianHolidays(year: number): Record<string, string> {
  const holidays: { month: number; day: number; name: string }[] = [
    { month: 3, day: 8, name: "International Women's Day" },
    { month: 3, day: 12, name: "Youth Day" },
    { month: 4, day: 3, name: "Good Friday" },
    { month: 4, day: 6, name: "Easter Monday" },
    { month: 5, day: 1, name: "Labour Day" },
    { month: 5, day: 25, name: "Africa Freedom Day" },
    { month: 7, day: 6, name: "Heroes Day" },
    { month: 7, day: 7, name: "Unity Day" },
    { month: 8, day: 3, name: "Farmers Day" },
    { month: 10, day: 18, name: "National Prayers Day" },
    { month: 10, day: 24, name: "Independence Day" },
  ];

  const holidayMap: Record<string, string> = {};

  holidays.forEach(h => {
    let date = new Date(year, h.month - 1, h.day);
    // If falling on Sunday (0), shift to Monday (1)
    if (date.getDay() === 0) {
      date = new Date(year, h.month - 1, h.day + 1);
    }
    const dayPf = String(date.getDate()).padStart(2, '0');
    const mthPf = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${dayPf}-${mthPf}-${year}`;
    holidayMap[key] = h.name;
  });

  return holidayMap;
}

export function calculateTermDates(startMondayStr: string, numWeeks: number = 13) {
  const parts = (startMondayStr || '07-09-2026').split('-');
  if (parts.length !== 3) return [];
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const startDate = new Date(year, month, day);
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + offset);
  }

  const weeksList = [];
  const holidayMap = getZambianHolidays(startDate.getFullYear());

  const formatUtil = (d: Date): string => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  };

  for (let w = 0; w < numWeeks; w++) {
    const monday = new Date(startDate.getTime());
    monday.setDate(monday.getDate() + w * 7);

    const friday = new Date(monday.getTime());
    friday.setDate(friday.getDate() + 4);

    const monStr = formatUtil(monday);
    const friStr = formatUtil(friday);

    const weekHolidays: string[] = [];
    const absoluteDays: { name: string; dateStr: string; holiday?: string }[] = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let d = 0; d < 5; d++) {
      const currentDay = new Date(monday.getTime());
      currentDay.setDate(currentDay.getDate() + d);
      const currentDayStr = formatUtil(currentDay);
      const holidayName = holidayMap[currentDayStr];
      if (holidayName) {
        weekHolidays.push(`${currentDayStr} - ${holidayName}`);
      }
      absoluteDays.push({
        name: dayNames[d],
        dateStr: currentDayStr,
        holiday: holidayName
      });
    }

    weeksList.push({
      weekNum: w + 1,
      dateRange: `${monStr} to ${friStr}`,
      holidays: weekHolidays,
      days: absoluteDays
    });
  }

  return weeksList;
}

function IconForType({ type }: { type: DocType }) {
  switch (type) {
    case 'lesson_plan': return <BookOpen size={13} />;
    case 'assessments': return <ClipboardList size={13} />;
    case 'syllabi': return <Layers size={13} />;
    case 'schemes_of_work': return <Calendar size={13} />;
    case 'weekly_forecast': return <Calendar size={13} />;
    case 'records_of_work': return <HistoryIcon size={13} />;
    case 'individual_work_plan': return <FileText size={13} />;
    case 'lesson_notes': return <BookMarked size={13} />;
    case 'video_script': return <Video size={13} />;
    default: return <FileText size={13} />;
  }
}

const parseMarkdownTableToWeeks = (markdown: string) => {
  try {
    const lines = markdown.split('\n');
    const tableLines = lines.filter(l => {
      const trimmed = l.trim();
      return (trimmed.match(/\|/g) || []).length >= 2;
    });
    if (tableLines.length < 3) return null;

    // Skip header and alignment row
    const dataRows = tableLines.filter(l => !l.includes('---')).slice(1);
    
    const parsedRows: Array<{
      week: number;
      weekLabel: string;
      topic: string;
      subtopic: string;
      competency: string;
      expectedStandard: string;
      activity: string;
      method: string;
      teachingAid: string;
      reference: string;
    }> = [];

    let currentWeekNum = 0;
    let currentWeekLabel = '';
    let lastTopic = '';

    for (const row of dataRows) {
      let cells = row.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      if (cells.length < 3) continue;

      const weekCell = cells[0] || '';
      const weekMatch = weekCell.match(/Week\s*(\d+)/i) || weekCell.match(/(\d+)/);
      
      if (weekMatch) {
        currentWeekNum = parseInt(weekMatch[1]);
        currentWeekLabel = weekCell;
      } else if (currentWeekNum === 0 && parsedRows.length === 0) {
        currentWeekNum = 1;
      }
      
      const topicCell = cells[1] || '';
      if (topicCell) {
        lastTopic = topicCell;
      }

      parsedRows.push({
        week: currentWeekNum,
        weekLabel: currentWeekLabel,
        topic: topicCell || lastTopic,
        subtopic: cells[2] || '',
        competency: cells[3] || '',
        expectedStandard: cells[4] || '',
        activity: cells[5] || '',
        method: cells[6] || '',
        teachingAid: cells[7] || '',
        reference: cells[8] || ''
      });
    }

    // Group rows by week number
    const groupedWeeksMap = new Map<number, any>();

    for (const r of parsedRows) {
      const wNum = r.week;
      if (!groupedWeeksMap.has(wNum)) {
        const topicParts = r.topic ? r.topic.split('/').map(t => t.trim()) : [];
        groupedWeeksMap.set(wNum, {
          week: wNum,
          topic: topicParts[0] || r.topic || '',
          topic2: topicParts[1] || '',
          topic3: topicParts[2] || '',
          subtopics: r.subtopic ? [r.subtopic] : [],
          competencies: r.competency ? [r.competency] : [],
          expectedStandards: r.expectedStandard ? [r.expectedStandard] : [],
          activities: r.activity ? [r.activity] : [],
          methods: r.method ? [r.method] : [],
          teachingAids: r.teachingAid || '',
          references: r.reference || ''
        });
      } else {
        const existing = groupedWeeksMap.get(wNum);
        if (r.topic && !existing.topic) {
          const topicParts = r.topic.split('/').map(t => t.trim());
          existing.topic = topicParts[0] || r.topic;
          existing.topic2 = topicParts[1] || '';
          existing.topic3 = topicParts[2] || '';
        }
        if (r.subtopic && !existing.subtopics.includes(r.subtopic)) existing.subtopics.push(r.subtopic);
        if (r.competency && !existing.competencies.includes(r.competency)) existing.competencies.push(r.competency);
        if (r.expectedStandard && !existing.expectedStandards.includes(r.expectedStandard)) existing.expectedStandards.push(r.expectedStandard);
        if (r.activity && !existing.activities.includes(r.activity)) existing.activities.push(r.activity);
        if (r.method && !existing.methods.includes(r.method)) existing.methods.push(r.method);
        if (r.teachingAid && !existing.teachingAids.includes(r.teachingAid)) {
          existing.teachingAids = existing.teachingAids ? `${existing.teachingAids}; ${r.teachingAid}` : r.teachingAid;
        }
        if (r.reference && !existing.references.includes(r.reference)) {
          existing.references = existing.references ? `${existing.references}; ${r.reference}` : r.reference;
        }
      }
    }

    const sortedWeeks = Array.from(groupedWeeksMap.values()).sort((a, b) => a.week - b.week);
    return sortedWeeks;
  } catch (err) {
    console.error("Parse failed", err);
    return null;
  }
};

const parseMarkdownTableToForecastDays = (markdown: string) => {
  try {
    const lines = markdown.split('\n');
    const tableLines = lines.filter(l => {
      const trimmed = l.trim();
      return (trimmed.match(/\|/g) || []).length >= 2;
    });
    if (tableLines.length < 3) return null;

    // Skip header and alignment row
    const dataRows = tableLines.filter(l => !l.includes('---')).slice(1);
    
    return dataRows.map(row => {
      let cells = row.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      
      // Expected: DAY | TOPIC | SUBTOPIC | SPECIFIC COMPETENCY | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | AIDS | REFERENCE
      const dayNumMatch = cells[0]?.match(/Day\s*(\d+)/i) || cells[0]?.match(/(\d+)/);
      const dayNum = dayNumMatch ? parseInt(dayNumMatch[1]) : 1;
      
      return {
        day: dayNum,
        topic: cells[1] || '',
        subtopic: cells[2] || '',
        competency: cells[3] || '',
        expectedStandard: cells[4] || '',
        learningActivities: [cells[5] || ''],
        teachingMethods: [cells[6] || ''],
        teachingAids: cells[7] || '',
        references: cells[8] || ''
      };
    });
  } catch (err) {
    console.error("Parse Forecast failed", err);
    return null;
  }
};

export interface AvailableSyncDoc {
  id: string;
  subject: string;
  grade: string;
  type: string;
  typeLabel: string;
  timestamp?: any;
  content: string;
  isActive?: boolean;
}

export const transformSecondaryLanguageSyllabus = (topics: any[] | null): any[] | null => {
  if (!topics || !Array.isArray(topics)) return topics;
  
  const transformed: any[] = [];
  topics.forEach((comp: any) => {
    const compTitle = comp.title;
    const compCompetency = comp.generalCompetency || "";
    
    if (comp.subtopics && Array.isArray(comp.subtopics)) {
      comp.subtopics.forEach((sub: any) => {
        transformed.push({
          title: sub.title,
          generalCompetency: compCompetency,
          component: compTitle,
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
          ]
        });
      });
    } else {
      transformed.push(comp);
    }
  });
  
  return transformed;
};

export function DocGenerator({ initialType, onGenerate, onBack, onNavigate }: DocGeneratorProps) {
  const { user, registeredGrades, isWhitelisted, userType, downloadRecords, refreshDownloads, subscriptionDetails, globalConfig } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [progressText, setProgressText] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  const enforceGradeLock = globalConfig.enforceGradeLock;

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const [activeInfo, setActiveInfo] = useState<'general' | 'weeks' | 'forecast'>('general');
  const [magicFill, setMagicFill] = useState(false);
  const [smartPlan, setSmartPlan] = useState(false);
  const [manualTable, setManualTable] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [curriculumType, setCurriculumType] = useState<'CBC' | 'OBC'>('CBC');
  const [isPrivateModulesCollapsed, setIsPrivateModulesCollapsed] = useState(false);
  const [isSyllabusBrowserCollapsed, setIsSyllabusBrowserCollapsed] = useState(false);
  const [isTextbookSectionCollapsed, setIsTextbookSectionCollapsed] = useState(false);

  const [formData, setFormData] = useState<GenerationParams>({
    type: initialType || 'lesson_plan',
    subject: '',
    zambianLanguage: 'Icibemba',
    grade: 'Grade 1 (CBC)',
    topic: '',
    subtopic: '',
    knowledge: '',
    selectedSubtopics: [],
    selectedCompetences: [],
    generalCompetences: '',
    specificCompetences: '',
    lessonGoal: '',
    lessonLength: 'Detailed',
    learningEnvironments: ['Natural'],
    duration: '',
    teacherName: '',
    term: '3',
    year: new Date().getFullYear().toString(),
    tsNumber: '',
    zone: '',
    school: '',
    district: '',
    date: '',
    lessonFrom: '',
    lessonTo: '',
    enrolmentBoys: '',
    enrolmentGirls: '',
    attendanceBoys: '',
    attendanceGirls: '',
    objectives: '',
    studentLevel: 'Mixed Ability',
    additionalContext: '',
    includeTeachingNotes: false,
    includeHomework: false,
    englishCombined: true,
    references: '',
    weeks: Array.from({ length: 13 }, (_, i) => {
      const weekNum = i + 1;
      let topic = '';
      if (weekNum === 4) topic = 'Learning & Monthly Assessment';
      else if (weekNum === 8) topic = 'Learning & Monthly Assessment';
      else if (weekNum === 12) topic = 'Revisions';
      else if (weekNum === 13) topic = 'End of Term Test';

      return { 
        week: weekNum, 
        topic, 
        topic2: '',
        topic3: '',
        subtopics: ['', '', '', '', ''], 
        competencies: ['', '', '', '', ''], 
        activities: ['', '', '', '', ''],
        expectedStandards: ['', '', '', '', ''],
        teachingAids: '',
        references: ''
      };
    }),
    forecastWeek: 1,
    lessonNumber: '',
    lessonWeekNumber: '',
    forecastDays: Array.from({ length: 5 }, (_, i) => ({
      day: (i + 1).toString(),
      topic: '',
      subtopic: '',
      competency: '',
      activities: ['', '', '', ''],
      expectedStandard: '',
      teachingAids: '',
      references: ''
    })),
    testType: 'Test',
    difficultyLevel: 'Medium',
    testName: '',
    testDate: '',
    selectedTopics: [],
    questionCounts: {
      multipleChoice: 10,
      trueFalse: 5,
      shortAnswer: 3,
      longAnswer: 1,
      fillInBlank: 0,
      matching: 0,
      ordering: 0,
    },
    testDuration: '60',
    additionalInstructions: '',
    includeMarkingKey: true,
    includeVisuals: true,
    jobTitle: '',
    jobPurpose: '',
    workPlanPeriod: 'JANUARY TO DECEMBER',
    workPlanPeriodStart: 'JANUARY',
    workPlanPeriodEnd: 'DECEMBER',
    includeAnnualWorkPlan: true,
    termStartDate: '07-09-2026',
  });

  // Autosave and Recovery States
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | null>(null);
  const [lastGeneratedContent, setLastGeneratedContent] = useState<string | null>(null);
  const [detectedDraft, setDetectedDraft] = useState<{
    formData: GenerationParams;
    generatedDoc: { content: string; params: GenerationParams } | null;
    updatedAt: any;
  } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Helper to determine if actual work has been performed by the user
  const hasSubstantiveWork = (fData?: GenerationParams, genDoc?: { content: string; params?: any } | null): boolean => {
    if (!fData) return false;
    // 1. If a document has already been generated
    if (genDoc && genDoc.content && genDoc.content.trim().length > 20) {
      return true;
    }
    // 2. If user has entered a topic, subtopic, or selected subtopics
    if (fData.topic && fData.topic.trim().length > 0) return true;
    if (fData.subtopic && fData.subtopic.trim().length > 0) return true;
    if (fData.selectedSubtopics && fData.selectedSubtopics.length > 0) return true;
    // 3. If user entered objectives, goals, or competences
    if (fData.objectives && fData.objectives.trim().length > 0) return true;
    if (fData.lessonGoal && fData.lessonGoal.trim().length > 0) return true;
    if (fData.specificCompetences && fData.specificCompetences.trim().length > 0) return true;
    if (fData.additionalContext && fData.additionalContext.trim().length > 0) return true;
    // 4. For schemes of work / weekly forecast / multi-week items:
    if (fData.weeks && Array.isArray(fData.weeks)) {
      const hasCustomWeek = fData.weeks.some((w: any, index: number) => {
        const isDefaultAssessmentWeek = (index === 3 && w.topic === 'Learning & Monthly Assessment') ||
                                       (index === 7 && w.topic === 'Learning & Monthly Assessment') ||
                                       (index === 11 && w.topic === 'Revisions') ||
                                       (index === 12 && w.topic === 'End of Term Test');
        const hasTopic = w.topic && w.topic.trim().length > 0 && !isDefaultAssessmentWeek;
        const hasSubtopics = Array.isArray(w.subtopics) && w.subtopics.some((s: string) => s && s.trim().length > 0);
        const hasActivities = Array.isArray(w.activities) && w.activities.some((a: string) => a && a.trim().length > 0);
        return hasTopic || hasSubtopics || hasActivities;
      });
      if (hasCustomWeek) return true;
    }
    return false;
  };

  // Check for saved drafts on mount/user load
  useEffect(() => {
    if (!user) return;

    const checkDraft = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'autosave', formData.type);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.formData) {
            // Only show banner if the user actually performed substantive work
            if (hasSubstantiveWork(data.formData, data.generatedDoc)) {
              setDetectedDraft({
                formData: data.formData,
                generatedDoc: data.generatedDoc || null,
                updatedAt: data.updatedAt,
              });
              setShowDraftBanner(true);
            } else {
              // Silently remove empty autosave record to keep database clean
              deleteDoc(docRef).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check for autosave draft:", err);
      }
    };

    checkDraft();
  }, [user, formData.type]);

  // Periodic/Debounced Autosave Effect
  useEffect(() => {
    if (!user) return;

    // Skip autosaving if user has not performed anything substantive
    if (!hasSubstantiveWork(formData, lastGeneratedContent ? { content: lastGeneratedContent, params: formData } : null)) {
      setAutosaveStatus(null);
      return;
    }

    setAutosaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'autosave', formData.type);
        await setDoc(docRef, {
          userId: user.uid,
          formData: formData,
          generatedDoc: lastGeneratedContent ? {
            content: lastGeneratedContent,
            params: formData
          } : null,
          updatedAt: serverTimestamp()
        }, { merge: true });
        setAutosaveStatus('saved');
      } catch (err: any) {
        console.warn("Autosave failed:", err);
        setAutosaveStatus('error');
      }
    }, 4000); // Debounce save by 4 seconds of typing idle

    return () => clearTimeout(timer);
  }, [formData, lastGeneratedContent, user]);

  const handleRestoreDraft = () => {
    if (!detectedDraft) return;

    setFormData(detectedDraft.formData);

    if (detectedDraft.generatedDoc) {
      setLastGeneratedContent(detectedDraft.generatedDoc.content);
      setHasGenerated(true);
      onGenerate(detectedDraft.generatedDoc.content, detectedDraft.formData);
    } else {
      setLastGeneratedContent(null);
      setHasGenerated(false);
    }

    setShowDraftBanner(false);
    toast.success("Draft successfully restored! All inputs and content are recovered.");
  };

  const handleDismissDraft = () => {
    setShowDraftBanner(false);
    setDetectedDraft(null);
    toast.success("Draft dismissed. You can start fresh.");
  };

  const isDocTypeRestrictedForUser = ['schemes_of_work', 'weekly_forecast', 'lesson_plan', 'lesson_notes', 'individual_work_plan', 'assessments', 'video_script'].includes(formData.type);
  const isUserEmailDeveloper = isDeveloperEmail(user?.email);
  const hasTrialGrade = registeredGrades && registeredGrades.some(g => {
    const low = String(g).toLowerCase().trim();
    return low === 'trial access' || low === 'trial_access' || low.includes('trial');
  });
  const isGradeLockActiveForUser = !!(
    enforceGradeLock && 
    !isUserEmailDeveloper && 
    userType !== 'guest' && 
    registeredGrades && 
    registeredGrades.length > 0 && 
    !registeredGrades.some(g => String(g).toLowerCase().trim() === 'all') && 
    !hasTrialGrade
  );

  // Tier A (Guest/Experiment/Expired User) - New rules implementation
  const isUserGuestTier = (!isWhitelisted && userType === 'guest' && !isUserEmailDeveloper);
  const allowedTypesTierA = ['schemes_of_work', 'weekly_forecast', 'lesson_plan'];
  const isDocTypeLockedForGuest = false; // The rest can be viewed

  // Usage checking
  const usageCounts = {
    total: downloadRecords.length,
    schemes_of_work: downloadRecords.filter(r => r.type === 'schemes_of_work').length,
    weekly_forecast: downloadRecords.filter(r => r.type === 'weekly_forecast').length,
    lesson_plan: downloadRecords.filter(r => r.type === 'lesson_plan').length,
    lesson_notes: downloadRecords.filter(r => r.type === 'lesson_notes').length,
    individual_work_plan: downloadRecords.filter(r => r.type === 'individual_work_plan').length,
    catch_up: downloadRecords.filter(r => r.type === 'catch_up').length,
    assessments: downloadRecords.filter(r => r.type === 'assessments').length,
  };

  const isLimitReached = isUserGuestTier && (
    (!allowedTypesTierA.includes(formData.type)) ||
    (formData.type === 'schemes_of_work' && usageCounts.schemes_of_work >= 1) ||
    (formData.type === 'weekly_forecast' && usageCounts.weekly_forecast >= 1) ||
    (formData.type === 'lesson_plan' && usageCounts.lesson_plan >= 2)
  );

  const isAllTrialDepleted = isUserGuestTier && (
    usageCounts.schemes_of_work >= 1 &&
    usageCounts.weekly_forecast >= 1 &&
    usageCounts.lesson_plan >= 2
  );

  // Enforce grade-specific and top-up download limit locks
  let isActiveCircleLimitReached = false;
  let gradeSpecificLimitMsg = "";
  
  if (!isUserGuestTier && !isUserEmailDeveloper && subscriptionDetails && !subscriptionDetails.unlimitedDownloads) {
    const selectedGrade = formData.grade;
    const gradesCount = registeredGrades ? registeredGrades.length : 1;
    const baseLimit = subscriptionDetails.baseLimit || 40;
    const gradeCounts = subscriptionDetails.gradeCounts || {};
    
    if (gradesCount <= 2) {
      // Separate trackers per grade
      const usedForSelectedGrade = gradeCounts[selectedGrade] || 0;
      if (usedForSelectedGrade >= baseLimit) {
        isActiveCircleLimitReached = true;
        gradeSpecificLimitMsg = `Grade Limit Reached: You have reached your download limit of ${baseLimit} downloads for ${selectedGrade} in this billing circle. Please contact Fortunes Edutech to upgrade or top up.`;
      }
    } else {
      // Combined tracker for all grades (top-up mode)
      const totalUsed = subscriptionDetails.circleDownloadsCount || 0;
      const combinedLimit = 2 * baseLimit;
      if (totalUsed >= combinedLimit) {
        isActiveCircleLimitReached = true;
        gradeSpecificLimitMsg = `Billing Cycle Limit Reached: You have reached your combined top-up package download limit of ${combinedLimit} downloads for this cycle. Please upgrade or renew your package.`;
      }
    }
  }

  // Enforce grade lock programmatically
  useEffect(() => {
    if (isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades && registeredGrades.length > 0) {
      const normalizedRegistered = registeredGrades.map(g => String(g).trim().toLowerCase());
      const currentGradeNormalized = String(formData.grade).trim().toLowerCase();
      
      const isOBC = currentGradeNormalized.includes('(obc)');
      const curriculumMatch = curriculumType === 'OBC' ? isOBC : !isOBC;

      if ((!normalizedRegistered.includes(currentGradeNormalized) || !curriculumMatch) && !normalizedRegistered.includes('all')) {
        // Fallback to first available grade that matches the current curriculum
        const availableInCurriculum = registeredGrades.filter(rg => {
          const rgLow = rg.toLowerCase();
          if (curriculumType === 'OBC') {
            return rgLow.includes('(obc)');
          }
          return !rgLow.includes('(obc)');
        });

        if (availableInCurriculum.length > 0) {
          setFormData(prev => ({
            ...prev,
            grade: availableInCurriculum[0]
          }));
        } else if (registeredGrades.length > 0) {
          setFormData(prev => ({
            ...prev,
            grade: registeredGrades[0]
          }));
        }
      }
    }
  }, [formData.type, isGradeLockActiveForUser, registeredGrades, formData.grade, curriculumType]);

  // Reset Trial Access fallback to standard grade so guest/trial users can experiment immediately
  useEffect(() => {
    const currentGrade = String(formData.grade || '').toLowerCase().trim();
    if (!currentGrade || currentGrade === 'trial access' || currentGrade === 'trial_access' || currentGrade.includes('trial')) {
      setFormData(prev => ({
        ...prev,
        grade: curriculumType === 'OBC' ? 'Grade 3 (OBC)' : 'Grade 1'
      }));
    }
  }, [formData.grade, curriculumType]);

  // Auto-sync curriculum type when grade changes
  useEffect(() => {
    if (formData.grade?.toLowerCase().includes('obc')) {
      if (curriculumType !== 'OBC') setCurriculumType('OBC');
    } else if (formData.grade && !formData.grade.toLowerCase().includes('obc')) {
      // Don't auto-switch back to CBC if it's already OBC, allow user manual control or keep it stable
      // Actually, if it's a standard CBC grade, we might want to switch back
      const standardCBCGrades = ['grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6', 'grade 7', 'ece', 'form'];
      if (standardCBCGrades.some(g => formData.grade.toLowerCase().includes(g)) && !formData.grade.toLowerCase().includes('obc')) {
        if (curriculumType !== 'CBC') setCurriculumType('CBC');
      }
    }
  }, [formData.grade]);

  // Set default term for Individual Work Plan
  useEffect(() => {
    if (formData.type === 'individual_work_plan' && formData.term !== 'TERM 1 - TERM 3') {
      setFormData(prev => ({ ...prev, term: 'TERM 1 - TERM 3' }));
    } else if (formData.type !== 'individual_work_plan' && formData.term === 'TERM 1 - TERM 3') {
      setFormData(prev => ({ ...prev, term: '1' }));
    }
  }, [formData.type]);

  // Do not auto-populate additionalContext by default so box stays empty until activated or synced
  useEffect(() => {
    // Left intentionally empty to preserve empty default state
  }, [formData.type, formData.term, formData.stoppingTopic]);

  // Dynamically update Weekly Forecast Day dates when start Monday or week number changes
  useEffect(() => {
    if (formData.type === 'weekly_forecast' && formData.termStartDate) {
      const weeksInfo = calculateTermDates(formData.termStartDate, 13);
      const weekIdx = (formData.forecastWeek || 1) - 1;
      const weekData = weeksInfo[weekIdx];
      if (weekData && weekData.days) {
        setFormData(prev => {
          const currentDays = prev.forecastDays || [];
          const updatedDays = currentDays.map((day, idx) => {
            const calculatedDay = weekData.days[idx];
            return {
              ...day,
              date: calculatedDay ? calculatedDay.dateStr : (day.date || '')
            };
          });
          
          const hasChanges = currentDays.some((day, idx) => {
            const calc = weekData.days[idx];
            return !day.date || day.date !== (calc ? calc.dateStr : '');
          });

          if (hasChanges) {
            return {
              ...prev,
              forecastDays: updatedDays
            };
          }
          return prev;
        });
      }
    }
  }, [formData.termStartDate, formData.forecastWeek, formData.type]);


  // Persistence of school info & enrolment tallying
  useEffect(() => {
    const savedProfile = safeLocalStorage.getItem('user_general_profile');
    const savedInfo = safeLocalStorage.getItem('teacher_info');
    
    const mergedData = {};
    
    // Load from user_general_profile first (more recent/comprehensive)
    if (savedProfile) {
      try {
        Object.assign(mergedData, JSON.parse(savedProfile));
      } catch (e) { console.error("Error parsing user_general_profile", e); }
    }
    
    // Fallback to teacher_info for missing fields
    if (savedInfo) {
      try {
        const parsedInfo = JSON.parse(savedInfo);
        Object.keys(parsedInfo).forEach(key => {
          if (!(mergedData as any)[key]) {
            (mergedData as any)[key] = parsedInfo[key];
          }
        });
      } catch (e) { console.error("Error parsing teacher_info", e); }
    }

    if (Object.keys(mergedData).length > 0) {
      const data = mergedData as any;
      setFormData(prev => {
        const updated = {
          ...prev,
          school: data.school || prev.school,
          district: data.district || prev.district,
          zone: data.zone || prev.zone,
          teacherName: data.teacherName || prev.teacherName,
          tsNumber: data.tsNumber || prev.tsNumber,
          jobTitle: data.jobTitle || prev.jobTitle,
          grade: data.grade || prev.grade,
          enrolmentBoys: data.enrolmentBoys !== undefined && data.enrolmentBoys !== '' ? String(data.enrolmentBoys) : prev.enrolmentBoys,
          enrolmentGirls: data.enrolmentGirls !== undefined && data.enrolmentGirls !== '' ? String(data.enrolmentGirls) : prev.enrolmentGirls,
          attendanceBoys: data.attendanceBoys !== undefined && data.attendanceBoys !== '' ? String(data.attendanceBoys) : prev.attendanceBoys,
          attendanceGirls: data.attendanceGirls !== undefined && data.attendanceGirls !== '' ? String(data.attendanceGirls) : prev.attendanceGirls,
        };

        // Job Purpose logic: if saved, use it. If not, but title exists, default it.
        if (data.jobPurpose) {
          updated.jobPurpose = data.jobPurpose;
        } else if (data.jobTitle) {
          const roleBase = data.jobTitle.split(' (')[0].trim();
          updated.jobPurpose = JOB_PURPOSE_DEFAULTS[roleBase] || JOB_PURPOSE_DEFAULTS['Class teacher'];
        }

        return updated;
      });
    }
  }, []);

  // Update enrolment & attendance figures when grade changes in DocGenerator to ensure tallying across all documents
  useEffect(() => {
    if (!formData.grade) return;
    try {
      const sharedLearnersStr = safeLocalStorage.getItem(`eduplan_shared_learners_${formData.grade}`);
      if (sharedLearnersStr) {
        const shared = JSON.parse(sharedLearnersStr);
        setFormData(prev => ({
          ...prev,
          enrolmentBoys: String(shared.totalBoys ?? prev.enrolmentBoys),
          enrolmentGirls: String(shared.totalGirls ?? prev.enrolmentGirls),
          attendanceBoys: String(shared.totalBoys ?? prev.attendanceBoys),
          attendanceGirls: String(shared.totalGirls ?? prev.attendanceGirls),
        }));
      }
    } catch (e) {
      console.warn("Could not load shared learners for grade", formData.grade, e);
    }
  }, [formData.grade]);

  useEffect(() => {
    const infoToSave = {
      school: formData.school,
      district: formData.district,
      zone: formData.zone,
      teacherName: formData.teacherName,
      tsNumber: formData.tsNumber,
    };
    safeLocalStorage.setItem('teacher_info', JSON.stringify(infoToSave));
  }, [formData.school, formData.district, formData.zone, formData.teacherName, formData.tsNumber]);

  const renderUserGradeTrackers = () => {
    if (isUserGuestTier || !subscriptionDetails || subscriptionDetails.unlimitedDownloads) {
      return null;
    }
    
    const gradesCount = registeredGrades ? registeredGrades.length : 1;
    const baseLimit = subscriptionDetails.baseLimit || 40;
    const gradeCounts = subscriptionDetails.gradeCounts || {};
    
    if (gradesCount <= 2) {
      // Show individual trackers for allocated grades
      return (
        <div className="mt-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Grade-Locked Download Trackers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registeredGrades.map((grade) => {
              const used = gradeCounts[grade] || 0;
              const remaining = Math.max(0, baseLimit - used);
              const pct = Math.min(100, (used / baseLimit) * 100);
              const isSelected = formData.grade === grade;
              const isDepleted = used >= baseLimit;
              
              return (
                <div 
                  key={grade} 
                  className={cn(
                    "p-3 rounded-xl border bg-white transition-all space-y-1.5",
                    isSelected ? "border-emerald-200 ring-2 ring-emerald-50 bg-emerald-50/10" : "border-slate-100",
                    isDepleted && "border-red-100 bg-red-50/5"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">{grade}</span>
                    <span className={cn("text-[10px] font-black", isDepleted ? "text-red-500" : "text-[#00A86B]")}>
                      {used}/{baseLimit} ({remaining} Left)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-300 rounded-full", isDepleted ? "bg-red-500" : "bg-[#00A86B]")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Combined tracker for top up grades
      const totalUsed = subscriptionDetails.circleDownloadsCount || 0;
      const combinedLimit = 2 * baseLimit;
      const remaining = Math.max(0, combinedLimit - totalUsed);
      const pct = Math.min(100, (totalUsed / combinedLimit) * 100);
      const isDepleted = totalUsed >= combinedLimit;
      
      return (
        <div className="mt-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <span>Combined Top-Up Tracker ({registeredGrades.join(', ')})</span>
            <span className={cn(isDepleted ? "text-red-500" : "text-[#00A86B]")}>
              {totalUsed}/{combinedLimit} ({remaining} Left)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-300 rounded-full", isDepleted ? "bg-red-500" : "bg-[#00A86B]")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }
  };

  const [batchMode, setBatchMode] = useState(false);
  const [batchForecastMode, setBatchForecastMode] = useState(false);

  const isZambianLanguageSubject = !!(formData.subject && (
    formData.subject.toLowerCase() === 'zambian language' ||
    formData.subject.toLowerCase() === 'zambian languages' ||
    formData.subject.toLowerCase() === 'zambian local language'
  ));

  const termWeeksInfo = useMemo(() => {
    if (formData.termStartDate) {
      return calculateTermDates(formData.termStartDate, 13);
    }
    return [];
  }, [formData.termStartDate]);

  const getEnglishTopics = () => {
    const g = formData.grade.toLowerCase();
    const isEng = formData.subject.toLowerCase().includes('english');
    
    let data = null;
    if (g.includes('grade 1') && !g.includes('grade 10') && !g.includes('grade 11') && !g.includes('grade 12')) data = SYLLABI['Grade 1 (CBC)'];
    else if (g.includes('grade 2')) data = SYLLABI['Grade 2 (CBC)'];

    if (!data || !isEng) return { oral: [], literacy: [], isEnglish: false };

    const selectedTermNum = formData.term ? formData.term.toString().replace(/[^0-9]/g, "") : "";

    const filterTopicsByTerm = (topicsList: any[]) => {
      if (!Array.isArray(topicsList)) return [];
      if (!selectedTermNum) return topicsList;
      return topicsList.filter(t => {
        if (!t.term) return true;
        const tNum = t.term.toString().replace(/[^0-9]/g, "");
        return tNum === selectedTermNum;
      });
    };

    return {
      oral: filterTopicsByTerm(data['Oral English'] || []),
      literacy: filterTopicsByTerm(data['literacy in English'] || []),
      isEnglish: true
    };
  };

  const getAvailableSubjects = (grade: string) => {
    let baseSubjects: string[] = [];
    if (curriculumType === 'OBC' || grade.toLowerCase().includes('(obc)')) {
      baseSubjects = [...getSubjectsForGrade(grade)];
    } else {
      baseSubjects = [...getSubjectsForGrade(grade)];
      const g = grade.toLowerCase();
      
      // Ensure Social Studies is always there for Grade 4-7 CBC
      if (g.match(/grade\s*[4-7]/)) {
        if (!baseSubjects.includes("Social Studies")) {
          baseSubjects.push("Social Studies");
        }
      }

      if (g.match(/grade\s*[4-7]/)) {
        if (!baseSubjects.includes("Technology studies") && !baseSubjects.includes("Technology Studies")) {
          baseSubjects.push("Technology studies");
        }
      }
    }

    // Determine the "Level Bucket" for strict filtering in CBC mode
    const getLevelBucket = (gStr: string) => {
      const g = gStr.toLowerCase();
      if (g.includes('ece')) return 'ECE';
      const match = g.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (g.includes('form')) return 'SECONDARY';
        if (num <= 3) return 'PRIMARY_LOWER';
        if (num >= 4) return 'PRIMARY_UPPER';
      }
      if (g.includes('form') || g.includes('secondary')) return 'SECONDARY';
      return 'UNKNOWN';
    };

    const currentBucket = getLevelBucket(grade);

    // Only include module subjects if they actually match the current grade and curriculum
    const moduleSubjects = modules
      .filter((m) => {
        if (!m.subject) return false;
        
        const mGrade = (m.grade || '').toLowerCase();
        const mName = (m.name || '').toLowerCase();
        const isOBC = mGrade.includes('obc') || mName.includes('obc');

        // Curriculum separation
        if (curriculumType === 'OBC') {
          if (!isOBC) return false;
        } else {
          if (isOBC) return false;
        }

        // Grade matching
        if (m.grade === grade || mGrade === 'universal') return true;
        
    // Level matching (CBC only - strict separation)
    if (curriculumType === 'CBC' && currentBucket !== 'UNKNOWN') {
       const moduleBucket = getLevelBucket(mGrade + ' ' + mName);
       // Strict separation: Secondary subjects (Form 1-4) should never show up in Primary grades and vice versa
       if (currentBucket === 'SECONDARY' && moduleBucket !== 'SECONDARY' && mGrade !== 'universal') return false;
       if (currentBucket !== 'SECONDARY' && moduleBucket === 'SECONDARY' && mGrade !== 'universal') return false;
       
       // Same for other buckets if not universal
       if (moduleBucket !== currentBucket && mGrade !== 'universal') return false;
    }

        // Grade Range Matching
        const extractDigits = (s: string) => {
          const matches = s.match(/\d+/g);
          if (!matches) return [];
          if (s.includes('-')) {
            const parts = s.split('-');
            const sMatch = parts[0].match(/\d+/);
            const eMatch = parts[1] ? parts[1].match(/\d+/) : null;
            const start = parseInt(sMatch ? sMatch[0] : '0');
            const end = parseInt(eMatch ? eMatch[0] : '0');
            if (start > 0 && end >= start) {
              return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
            }
          }
          return matches;
        };
        const mDigits = extractDigits(mGrade + ' ' + mName);
        const gDigits = (grade.match(/\d+/g) || []);
        if (mDigits.length > 0 && gDigits.length > 0 && gDigits.some(d => mDigits.includes(d))) return true;

        return false;
      })
      .map((m) => m.subject);

    // Normalize and remove duplicates
    const normalize = (s: string) => {
      if (!s) return '';
      let val = s.trim();
      const lower = val.toLowerCase();

      // CBC specific subject filtering
      if (curriculumType === 'CBC') {
        if (lower === 'universal') return null; // Hide universal from all CBC grades
        if (lower.includes('3-5') || (lower.includes('year') && (lower.includes('3') || lower.includes('5')))) return null; 
        if (lower.includes('syllabus')) return null; 
        
        // Hide specific requested subjects for ECE to Grade 3
        if (currentBucket === 'ECE' || currentBucket === 'PRIMARY_LOWER') {
          if (lower === 'grade 1') return null;
          if (lower === 'literacy') return null;
          if (lower === 'social, emotional and spiritual development') return null;
          
          // Grade 3 OBC exclusions
          if (grade.toLowerCase().includes('grade 3') && (lower === 'expressive arts' || lower === 'home economics')) {
            return null;
          }
        }
      }

      // Standardize common variations to avoid duplicates
      if (lower === 'english' || lower === 'english') return 'English';
      if (lower === 'zambian language' || lower === 'zambian languages' || lower === 'zambian local language') return 'Zambian language';
      if (lower === 'creative and technology studies' || lower === 'cts') return 'Creative and technology studies';
      if (lower === 'technology studies') return 'Technology studies';
      if (lower === 'mathematics and science') return 'Mathematics and science';
      if (lower === 'pre-mathematics' || lower === 'pre-mathematics and science' || lower === 'pre-mathematics & science') return 'Pre-Mathematics & Science';
      if (lower === 'mathematics 1') return 'Mathematics 1';
      if (lower === 'mathematics 2') return 'Mathematics 2';
      if (lower === 'mathematics') return currentBucket === 'SECONDARY' ? 'Mathematics 1' : 'Mathematics';
      if (lower === 'integrated science' || lower === 'science') {
        return curriculumType === 'OBC' ? 'Integrated Science' : 'Science';
      }
      if (lower === 'social studies') return 'Social Studies';
      if (lower === 'commerce') return 'Commerce';
      if (lower === 'principles of accounts' || lower === 'principles of account' || lower === 'accounts') return 'Principles of Accounts';
      if (lower === 'expressive arts') return 'Expressive arts';
      if (lower === 'home economics' || lower === 'home economics & hospitality' || lower === 'home economics and hospitality') {
        return curriculumType === 'OBC' ? 'Home Economics' : 'Home Economics & Hospitality';
      }

      return val;
    };

    const combined = [...baseSubjects, ...moduleSubjects].map(normalize);
    let uniqueCombined = Array.from(new Set(combined)).filter(Boolean) as string[];

    const isGr10To12 = grade.toLowerCase().includes('grade 10') || 
                       grade.toLowerCase().includes('grade 11') || 
                       grade.toLowerCase().includes('grade 12');
    
    if (isGr10To12) {
      const allowed = getSubjectsForGrade(grade).map(s => {
        const lower = s.toLowerCase();
        if (lower === 'english' || lower === 'english') return 'english';
        if (lower === 'zambian language' || lower === 'zambian languages' || lower === 'zambian local language') return 'zambian language';
        return lower;
      });
      uniqueCombined = uniqueCombined.filter(sub => {
        const subLow = sub.toLowerCase();
        if (allowed.includes(subLow)) return true;
        if (subLow === 'zambian languages' && allowed.includes('zambian language')) return true;
        if (subLow === 'zambian language' && allowed.includes('zambian languages')) return true;
        if (subLow === 'english' && allowed.includes('english')) return true;
        if (subLow === 'english' && allowed.includes('english')) return true;
        return false;
      });
    }

    const preferredOrder = [
      "mathematics 1",
      "mathematics 2",
      "mathematics and science",
      "mathematics",
      "integrated science",
      "creative and technology studies",
      "creative and technology studies (obc)",
      "technology studies",
      "zambian language",
      "english",
      "literacy in english",
      "oral english"
    ];

    return uniqueCombined.sort((a, b) => {
      const cleanA = a.toLowerCase().trim();
      const cleanB = b.toLowerCase().trim();
      
      const indexA = preferredOrder.indexOf(cleanA);
      const indexB = preferredOrder.indexOf(cleanB);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return a.localeCompare(b);
    });
  };

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeAdmin: (() => void) | null = null;
    let userDocs: Module[] = [];
    let adminDocs: Module[] = [];

    const mergeAndSet = () => {
      const seen = new Set<string>();
      const combined: Module[] = [];
      
      for (const d of userDocs) {
        if (d.id && !seen.has(d.id)) {
          seen.add(d.id);
          combined.push(d);
        }
      }
      for (const d of adminDocs) {
        if (d.id && !seen.has(d.id)) {
          seen.add(d.id);
          combined.push(d);
        }
      }
      setModules(combined);
    };

    const timeout = setTimeout(() => {
      console.warn("Modules loading timeout in Generator");
      setLoading(false);
    }, 15000);

    const setupAdminListener = (adminUid: string) => {
      const qAdmin = query(collection(db, 'users', adminUid, 'modules'), orderBy('createdAt', 'desc'));
      unsubscribeAdmin = onSnapshot(qAdmin, (snapshot) => {
        const docs: Module[] = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() } as Module));
        adminDocs = docs;
        mergeAndSet();
        setLoading(false);
        clearTimeout(timeout);
      }, (err) => {
        console.error("Failed to load admin modules:", err);
      });
    };

    const fetchAdminUidAndLoad = async () => {
      try {
        let adminUid = safeLocalStorage.getItem('cached_admin_uid') || '';
        
        // If current user is the developer, we already have their UID
        if (user?.email?.toLowerCase().trim() === 'kombefortune9@gmail.com') {
          adminUid = user.uid;
          safeLocalStorage.setItem('cached_admin_uid', adminUid);
        }

        if (!adminUid) {
          const usersQ = query(collection(db, 'users'), where('email', '==', 'kombefortune9@gmail.com'));
          const querySnapshot = await getDocs(usersQ);
          if (!querySnapshot.empty) {
            const adminDoc = querySnapshot.docs[0];
            adminUid = adminDoc.id;
            safeLocalStorage.setItem('cached_admin_uid', adminUid);
          }
        }
        
        if (adminUid && user.uid !== adminUid) {
          setupAdminListener(adminUid);
        }
      } catch (e: any) {
        console.warn("Gracefully handled error finding developer account:", e);
        const errStr = e?.message || String(e);
        if (errStr.toLowerCase().includes('quota') || errStr.toLowerCase().includes('exhausted')) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
          }
        }
      }
    };

    fetchAdminUidAndLoad();

    if (user.uid === 'guest_teacher') {
      try {
        const stored = safeLocalStorage.getItem('eduplan_modules');
        userDocs = stored ? JSON.parse(stored) : [];
        mergeAndSet();
      } catch (e) {
        console.error("Local modules list load failed", e);
      }
      setLoading(false);
    } else {
      const qUser = query(collection(db, 'users', user.uid, 'modules'), orderBy('createdAt', 'desc'));
      unsubscribeUser = onSnapshot(qUser, (snapshot) => {
        const docs: Module[] = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() } as Module));
        userDocs = docs;
        mergeAndSet();
        setLoading(false);
        clearTimeout(timeout);
      }, (err: any) => {
        if (err?.message?.toLowerCase().includes('quota')) {
          // Suppress error message as requested by user
        } else {
          console.error("DocGenerator modules err:", err);
        }
        setLoading(false);
        clearTimeout(timeout);
      });
    }

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAdmin) unsubscribeAdmin();
      clearTimeout(timeout);
    };
  }, [user?.uid]);

  const getDefaultWeeks = (grade: string, numWeeks: number = 13, eceBreakWeek: number = 7) => {
    const isECE = grade.toLowerCase().includes('ece');
    return Array.from({ length: numWeeks }, (_, i) => {
      const weekNum = i + 1;
      let topic = '';
      
      if (isECE) {
        if (weekNum === eceBreakWeek) topic = 'Mid Term Break (Learners resting at home)';
        else if (weekNum === 12) topic = 'Revisions';
        else if (weekNum === 13) topic = 'Consolidation of assessments (Formative throughout, mostly observation)';
      } else {
        if (weekNum === 4) topic = 'Learning & Monthly Assessment';
        if (weekNum === 8) topic = 'Learning & Monthly Assessment';
        if (weekNum === 12) topic = 'Revisions';
        if (weekNum === 13) topic = 'End of Term Test';
      }
      
      return { 
        week: weekNum, 
        topic, 
        subtopics: ['', '', '', '', ''], 
        competencies: ['', '', '', '', ''],
        activities: ['', '', '', '', '']
      };
    });
  };

  const [batchForecasts, setBatchForecasts] = useState<BatchForecast[]>(
    Array.from({ length: 5 }, (_, i) => ({
      id: (i + 1).toString(),
      week: i + 1,
      grade: 'Grade 1',
      subject: '',
      isActive: i === 0, // Only the first one is active by default
      isExpanded: i === 0,
      days: Array.from({ length: 5 }, (_, d) => ({
        day: (d + 1).toString(),
        topic: '',
        subtopic: '',
        competency: '',
        activities: ['', '', '', ''],
        expectedStandard: ''
      }))
    }))
  );

  const [batchLessons, setBatchLessons] = useState<BatchLesson[]>([
    { id: '1', topic: '', subtopic: '', specificCompetences: '', learningActivities: [], expectedStandard: '' }
  ]);

  // Keep track of AI-fetched syllabus activities
  const [fetchedActivities, setFetchedActivities] = useState<Record<string, string[]>>({});
  const [isFetchingActivities, setIsFetchingActivities] = useState<Record<string, boolean>>({});
  const [extractedSyllabuses, setExtractedSyllabuses] = useState<Record<string, any[]>>({});
  const [isExtractingSyllabus, setIsExtractingSyllabus] = useState<Record<string, boolean>>({});
  const [isFilling, setIsFilling] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // General profile registration & UI toggles
  const [isGeneralProfileExpanded, setIsGeneralProfileExpanded] = useState<boolean>(false);
  const [isWeeklyTableVisible, setIsWeeklyTableVisible] = useState<boolean>(false);
  const [isLessonContentDetailsVisible, setIsLessonContentDetailsVisible] = useState<boolean>(false);
  const [isReferenceBlockVisible, setIsReferenceBlockVisible] = useState<boolean>(false);
  const [syncInstructionsText, setSyncInstructionsText] = useState<string | null>(null);
  const [syncUnavailableModal, setSyncUnavailableModal] = useState<{
    isOpen: boolean;
    requestedType: string;
    requestedSubject: string;
    requestedGrade: string;
    availableDocs: AvailableSyncDoc[];
  } | null>(null);

  const [overlapModal, setOverlapModal] = useState<{
    isOpen: boolean;
    action: 'sync' | 'generate';
    oralDoc: AvailableSyncDoc;
    literacyDoc: AvailableSyncDoc;
    grade: string;
    activeSources: AvailableSyncDoc[];
  } | null>(null);

  const checkOverlapSources = (activeSources: AvailableSyncDoc[]) => {
    if (formData.type !== 'weekly_forecast') return null;
    if (!formData.subject?.toLowerCase().includes('english')) return null;
    const isGr12 = formData.grade?.includes('Grade 1') || formData.grade?.includes('Grade 2');
    if (!isGr12) return null;

    const currentGradeNormalized = (formData.grade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const schemeDocs = activeSources.filter(d => {
      const docGradeNormalized = (d.grade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return d.type === 'schemes_of_work' && docGradeNormalized === currentGradeNormalized;
    });

    const oralDoc = schemeDocs.find(d => d.subject.toLowerCase().includes('oral'));
    const literacyDoc = schemeDocs.find(d => d.subject.toLowerCase().includes('literacy'));

    if (oralDoc && literacyDoc) {
      return { oralDoc, literacyDoc };
    }
    return null;
  };

  const handleApplyOverlapChoice = (choice: 'merge' | 'oral' | 'literacy', modalData: any) => {
    const { oralDoc, literacyDoc } = modalData;
    const forecastWeekNum = formData.forecastWeek || 1;

    if (choice === 'merge') {
      const oralWeeks = parseMarkdownTableToWeeks(oralDoc.content);
      const literacyWeeks = parseMarkdownTableToWeeks(literacyDoc.content);

      const oralWeekData = oralWeeks && oralWeeks[forecastWeekNum - 1];
      const literacyWeekData = literacyWeeks && literacyWeeks[forecastWeekNum - 1];

      if (oralWeekData || literacyWeekData) {
        const oralTop = oralWeekData?.topic || 'N/A';
        const oralSubs = oralWeekData?.subtopics ? oralWeekData.subtopics.join(', ') : 'N/A';
        const oralComps = oralWeekData?.competencies ? oralWeekData.competencies.join(', ') : 'N/A';
        
        const litTop = literacyWeekData?.topic || 'N/A';
        const litSubs = literacyWeekData?.subtopics ? literacyWeekData.subtopics.join(', ') : 'N/A';
        const litComps = literacyWeekData?.competencies ? literacyWeekData.competencies.join(', ') : 'N/A';

        const combinedSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Combined Schemes of Work):
• ORAL ENGLISH SCHEME (Days 1-3):
  - Topic: ${oralTop}
  - Subtopics: ${oralSubs}
  - Competencies: ${oralComps}
  - Aids: ${oralWeekData?.teachingAids || 'N/A'}
  - References: ${oralWeekData?.references || 'N/A'}

• LITERACY IN ENGLISH SCHEME (Days 4-5):
  - Topic: ${litTop}
  - Subtopics: ${litSubs}
  - Competencies: ${litComps}
  - Aids: ${literacyWeekData?.teachingAids || 'N/A'}
  - References: ${literacyWeekData?.references || 'N/A'}

Instructions: 
Combine both Oral English (Days 1-3) and Literacy in English (Days 4-5) schemes into a unified weekly document as they interchange during the week. All content must strictly follow the CDC syllabus and teaching modules.`;

        setFormData(prev => ({
          ...prev,
          englishCombined: true,
          englishComponent: 'combined',
          additionalContext: combinedSyncInstructionStr,
          forecastDays: prev.forecastDays.map((day, dIdx) => {
            const isOralDay = dIdx < 2;
            const targetWeekData = isOralDay ? (oralWeekData || literacyWeekData) : (literacyWeekData || oralWeekData);
            if (!targetWeekData) return day;

            const numSubs = targetWeekData.subtopics?.length || 1;
            const subIndex = Math.min(Math.floor((dIdx / (prev.forecastDays.length || 5)) * numSubs), numSubs - 1);
            const sub = targetWeekData.subtopics?.[subIndex] || targetWeekData.subtopics?.[0] || day.subtopic;
            const top = targetWeekData.topic || day.topic;
            const comp = targetWeekData.competencies?.[subIndex] || targetWeekData.competencies?.[0] || day.competency;
            const expStd = targetWeekData.expectedStandards?.[subIndex] || targetWeekData.expectedStandards?.[0] || '';

            // Extract actual activities parsed from the Scheme of Work table row
            const rawActs = targetWeekData.activities || [];
            const parsedActs: string[] = [];
            rawActs.forEach(actStr => {
              if (!actStr) return;
              actStr.split('\n').forEach(line => {
                const cleaned = line.replace(/^[\s*\-•\d\.)]+/, '').trim();
                if (cleaned) parsedActs.push(cleaned);
              });
            });

            const activeActs = parsedActs.length > 0 ? parsedActs : getActivitiesForSubtopic(top, sub, comp);
            const dayAct = activeActs[dIdx % activeActs.length] || activeActs[0] || '';

            return {
              ...day,
              learningArea: isOralDay ? 'Oral English' : 'Literacy in English',
              topic: top,
              subtopic: sub,
              competency: comp,
              expectedStandard: expStd,
              activities: dayAct ? [dayAct] : day.activities,
              teachingAids: targetWeekData.teachingAids || day.teachingAids,
              references: targetWeekData.references || day.references
            };
          })
        }));
        setLastSyncTime(Date.now());
        setSyncInstructionsText(combinedSyncInstructionStr);
        toast.success(`Successfully combined and synced Oral English & Literacy schemes for Week ${forecastWeekNum}!`);
      } else {
        toast.error(`Scheme data not found for Week ${forecastWeekNum}`);
      }
    } else {
      const priorityDoc = choice === 'oral' ? oralDoc : literacyDoc;
      const extractedWeeks = parseMarkdownTableToWeeks(priorityDoc.content);
      const weekData = extractedWeeks && extractedWeeks[forecastWeekNum - 1];

      if (weekData) {
        const topVal = weekData.topic || 'N/A';
        const subVal = weekData.subtopics ? weekData.subtopics.join(', ') : 'N/A';
        const compVal = weekData.competencies ? weekData.competencies.join(', ') : 'N/A';
        const actVal = (weekData as any).suggestedActivities ? (weekData as any).suggestedActivities.join(', ') : (weekData.activities ? weekData.activities.join(', ') : 'N/A');
        const methodVal = 'Communicative approach, problem-solving, group work';
        const aidVal = weekData.teachingAids || 'N/A';
        const refVal = weekData.references || 'N/A';

        const schemeSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Scheme of Work):
• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}

Instructions: 
Weekly forecast strictly based on standard modules for ${choice === 'oral' ? 'Oral English' : 'Literacy in English'}.`;

        setFormData(prev => ({
          ...prev,
          englishCombined: false,
          englishComponent: choice,
          additionalContext: schemeSyncInstructionStr,
          forecastDays: prev.forecastDays.map((day, dIdx) => {
            const numSubs = weekData.subtopics?.length || 1;
            const subIndex = Math.min(Math.floor((dIdx / (prev.forecastDays.length || 5)) * numSubs), numSubs - 1);
            const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || day.subtopic;
            const top = weekData.topic || day.topic;
            const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
            const expStd = weekData.expectedStandards?.[subIndex] || weekData.expectedStandards?.[0] || '';

            // Extract actual activities parsed from the Scheme of Work table row
            const rawActs = weekData.activities || [];
            const parsedActs: string[] = [];
            rawActs.forEach(actStr => {
              if (!actStr) return;
              actStr.split('\n').forEach(line => {
                const cleaned = line.replace(/^[\s*\-•\d\.)]+/, '').trim();
                if (cleaned) parsedActs.push(cleaned);
              });
            });

            const activeActs = parsedActs.length > 0 ? parsedActs : getActivitiesForSubtopic(top, sub, comp);
            const dayAct = activeActs[dIdx % activeActs.length] || activeActs[0] || '';

            return {
              ...day,
              learningArea: choice === 'oral' ? 'Oral English' : 'Literacy in English',
              topic: top,
              subtopic: sub,
              competency: comp,
              expectedStandard: expStd,
              activities: dayAct ? [dayAct] : day.activities,
              teachingAids: weekData.teachingAids || day.teachingAids,
              references: weekData.references || day.references
            };
          })
        }));
        setLastSyncTime(Date.now());
        setSyncInstructionsText(schemeSyncInstructionStr);
        toast.success(`Successfully synced separate ${choice === 'oral' ? 'Oral English' : 'Literacy in English'} scheme for Week ${forecastWeekNum}!`);
      } else {
        toast.error(`Scheme data not found for Week ${forecastWeekNum}`);
      }
    }
  };

  const isSubjectAndGradeMatch = (
    docGrade: string,
    docSubject: string,
    targetGrade: string,
    targetSubject: string
  ) => {
    const normGradeDoc = (docGrade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normGradeTgt = (targetGrade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const gMatch = normGradeDoc === normGradeTgt || 
                   normGradeDoc.includes(normGradeTgt) || 
                   normGradeTgt.includes(normGradeDoc);

    if (!gMatch) return false;

    // Normalization helper to handle punctuation, "&" vs "and", and extra spaces
    const normalizeSub = (s: string) => {
      return (s || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const s1 = normalizeSub(docSubject);
    const s2 = normalizeSub(targetSubject);

    if (s1 === s2) return true;

    const isGrade12 = targetGrade.includes('Grade 1') || targetGrade.includes('Grade 2') || docGrade.includes('Grade 1') || docGrade.includes('Grade 2');

    if (isGrade12 && (s1.includes('english') || s2.includes('english'))) {
      const isDocOralOnly = s1.includes('oral') && !s1.includes('literacy');
      const isDocLiteracyOnly = s1.includes('literacy') && !s1.includes('oral');
      const isDocCombinedEng = (s1.includes('english') || s1.includes('combined')) && !isDocOralOnly && !isDocLiteracyOnly;

      // If separate forecast format is chosen in the form
      if (formData.englishCombined === false) {
        if (formData.englishComponent === 'oral') {
          return isDocOralOnly;
        }
        if (formData.englishComponent === 'literacy') {
          return isDocLiteracyOnly;
        }
      }

      const isTargetOralOnly = s2.includes('oral') && !s2.includes('literacy');
      const isTargetLiteracyOnly = s2.includes('literacy') && !s2.includes('oral');
      const isTargetCombinedEng = (s2.includes('english') || s2.includes('combined')) && !isTargetOralOnly && !isTargetLiteracyOnly;

      if (isTargetOralOnly) return isDocOralOnly;
      if (isTargetLiteracyOnly) return isDocLiteracyOnly;
      if (isTargetCombinedEng) return isDocCombinedEng || isDocOralOnly || isDocLiteracyOnly;
    }

    return s1.includes(s2) || s2.includes(s1);
  };

  const fetchActiveSyncSources = async (): Promise<AvailableSyncDoc[]> => {
    if (!user) return [];
    const docsMap = new Map<string, AvailableSyncDoc>();

    const normalizeKey = (type: string, grade: string, subject: string) => {
      const normGrade = (grade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normSub = (subject || '').toLowerCase().trim().replace(/\s+/g, ' ');
      return `${type}_${normGrade}_${normSub}`;
    };

    // 1. Fetch from sync_sources
    try {
      const syncRef = collection(db, "users", user.uid, "sync_sources");
      const q = query(syncRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => {
        const data = d.data();
        const docType = data.type || data.metadata?.type || 'unknown';
        if (data.isActive !== false && (docType === 'schemes_of_work' || docType === 'weekly_forecast')) {
          const item: AvailableSyncDoc = {
            id: d.id,
            subject: data.subject || data.metadata?.subject || 'Unspecified Subject',
            grade: data.grade || data.metadata?.grade || 'Unspecified Grade',
            type: docType,
            typeLabel: docType === 'schemes_of_work' ? 'Scheme of Work' : 'Weekly Forecast',
            timestamp: data.timestamp,
            content: data.content || data.fullText || '',
            isActive: true
          };
          const key = normalizeKey(item.type, item.grade, item.subject);
          if (!docsMap.has(key)) docsMap.set(key, item);
        }
      });
    } catch (err) {
      console.warn("Notice: Fetching sync_sources skipped or errored:", err);
    }

    // 2. Fetch from downloads subcollection as fallback
    try {
      const dlRef = collection(db, "users", user.uid, "downloads");
      const qDl = query(dlRef, orderBy("timestamp", "desc"), limit(50));
      const snapshotDl = await getDocs(qDl);
      snapshotDl.docs.forEach(d => {
        const data = d.data();
        const docType = data.type || data.metadata?.type || 'unknown';
        if (docType === 'schemes_of_work' || docType === 'weekly_forecast') {
          const item: AvailableSyncDoc = {
            id: d.id,
            subject: data.subject || data.metadata?.subject || 'Unspecified Subject',
            grade: data.grade || data.metadata?.grade || 'Unspecified Grade',
            type: docType,
            typeLabel: docType === 'schemes_of_work' ? 'Scheme of Work' : 'Weekly Forecast',
            timestamp: data.timestamp,
            content: data.content || data.fullText || '',
            isActive: true
          };
          const key = normalizeKey(item.type, item.grade, item.subject);
          if (!docsMap.has(key) && item.content) {
            docsMap.set(key, item);
          }
        }
      });
    } catch (err) {
      console.warn("Notice: Fetching downloads fallback skipped or errored:", err);
    }

    // 3. Local storage active sync sources & downloads fallback (instant offline/real-time cache)
    try {
      const activeSyncStr = safeLocalStorage.getItem('eduplan_active_sync_sources');
      if (activeSyncStr) {
        const activeList: any[] = JSON.parse(activeSyncStr);
        if (Array.isArray(activeList)) {
          activeList.forEach((data, idx) => {
            const docType = data.type || data.metadata?.type || 'unknown';
            if (docType === 'schemes_of_work' || docType === 'weekly_forecast') {
              const item: AvailableSyncDoc = {
                id: data.id || `active_sync_${idx}`,
                subject: data.subject || data.metadata?.subject || 'Unspecified Subject',
                grade: data.grade || data.metadata?.grade || 'Unspecified Grade',
                type: docType,
                typeLabel: docType === 'schemes_of_work' ? 'Scheme of Work' : 'Weekly Forecast',
                timestamp: data.timestamp || { seconds: Math.floor(Date.now() / 1000) },
                content: data.content || data.fullText || '',
                isActive: true
              };
              const key = normalizeKey(item.type, item.grade, item.subject);
              if (!docsMap.has(key) && item.content) {
                docsMap.set(key, item);
              }
            }
          });
        }
      }

      const storedStr = safeLocalStorage.getItem('eduplan_downloads');
      if (storedStr) {
        const localList: any[] = JSON.parse(storedStr);
        if (Array.isArray(localList)) {
          localList.forEach((data, idx) => {
            const docType = data.type || data.metadata?.type || 'unknown';
            if (docType === 'schemes_of_work' || docType === 'weekly_forecast') {
              const item: AvailableSyncDoc = {
                id: data.id || `local_${idx}`,
                subject: data.subject || data.metadata?.subject || 'Unspecified Subject',
                grade: data.grade || data.metadata?.grade || 'Unspecified Grade',
                type: docType,
                typeLabel: docType === 'schemes_of_work' ? 'Scheme of Work' : 'Weekly Forecast',
                timestamp: data.timestamp || { seconds: Math.floor(Date.now() / 1000) },
                content: data.content || data.fullText || '',
                isActive: true
              };
              const key = normalizeKey(item.type, item.grade, item.subject);
              if (!docsMap.has(key) && item.content) {
                docsMap.set(key, item);
              }
            }
          });
        }
      }
    } catch (e) {}

    return Array.from(docsMap.values());
  };

  const handleSelectAvailableSyncDoc = (docItem: AvailableSyncDoc) => {
    if (docItem.type === 'weekly_forecast') {
      const forecastDays = parseMarkdownTableToForecastDays(docItem.content);
      if (forecastDays && forecastDays.length > 0) {
        const dayNum = parseInt(formData.lessonNumber) || 1;
        const dayData = forecastDays.find(d => d.day === dayNum) || forecastDays[0];
        if (dayData) {
          const weekNum = formData.lessonWeekNumber || 1;
          const targetDay = dayData.day || parseInt(formData.lessonNumber) || 1;
          const topVal = dayData.topic || formData.topic || 'N/A';
          const subVal = dayData.subtopic || formData.subtopic || 'N/A';
          const compVal = dayData.competency || formData.specificCompetences || 'N/A';
          const actVal = Array.isArray(dayData.learningActivities) ? dayData.learningActivities.join(', ') : (dayData.learningActivities || 'N/A');
          const methodVal = dayData.teachingMethods || 'Learner-centered group discussion, guided problem solving';
          const aidVal = dayData.teachingAids || formData.teachingAids || 'N/A';
          const refVal = dayData.references || formData.references || 'N/A';

          const syncInstructionStr = `SYNCED PREPARATION DATA (Week ${weekNum}, Day ${targetDay}):
• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}

Instructions
(Lesson plan:) let the Lesson plan be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.
Modules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;

          setFormData(prev => ({
            ...prev,
            subject: docItem.subject,
            grade: docItem.grade,
            topic: dayData.topic || prev.topic,
            subtopic: dayData.subtopic || prev.subtopic,
            specificCompetences: dayData.competency || prev.specificCompetences,
            learningActivities: dayData.learningActivities || prev.learningActivities,
            teachingMethods: dayData.teachingMethods || prev.teachingMethods,
            teachingAids: dayData.teachingAids || prev.teachingAids,
            references: dayData.references || prev.references,
            additionalContext: syncInstructionStr
          }));
          setLastSyncTime(Date.now());
          setSyncInstructionsText(syncInstructionStr);
          toast.success(`Switched subject to ${docItem.subject} (${docItem.grade}) and synced Day ${targetDay} data!`);
        }
      } else {
        toast.error("Could not parse data from selected Weekly Forecast.");
      }
    } else if (docItem.type === 'schemes_of_work') {
      const extractedWeeks = parseMarkdownTableToWeeks(docItem.content);
      if (extractedWeeks && extractedWeeks.length > 0) {
        const forecastWeekNum = formData.forecastWeek || 1;
        const weekData = extractedWeeks[forecastWeekNum - 1] || extractedWeeks[0];
        const topVal = weekData.topic || 'N/A';
        const subVal = weekData.subtopics ? weekData.subtopics.join(', ') : 'N/A';
        const compVal = weekData.competencies ? weekData.competencies.join(', ') : 'N/A';
        const actVal = (weekData as any).suggestedActivities ? (weekData as any).suggestedActivities.join(', ') : (weekData.activities ? weekData.activities.join(', ') : 'N/A');
        const methodVal = 'Communicative approach, problem-solving, group work';
        const aidVal = weekData.teachingAids || 'N/A';
        const refVal = weekData.references || 'N/A';

        const schemeSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Scheme of Work):
• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}

Instructions: 
(Weekly forecast:) let the weekly forecast be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.
Modules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;

        setFormData(prev => ({
          ...prev,
          subject: docItem.subject,
          grade: docItem.grade,
          weeks: extractedWeeks,
          additionalContext: schemeSyncInstructionStr,
          forecastDays: prev.forecastDays.map((day, dIdx) => {
            const numSubs = weekData.subtopics?.length || 1;
            const subIndex = Math.min(Math.floor((dIdx / (prev.forecastDays.length || 5)) * numSubs), numSubs - 1);
            const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || day.subtopic;
            const top = weekData.topic || day.topic;
            const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
            const acts = getActivitiesForSubtopic(top, sub, comp);
            const dayAct = acts[dIdx % acts.length] || acts[0] || '';
            return {
              ...day,
              topic: top,
              subtopic: sub,
              competency: comp,
              activities: dayAct ? [dayAct] : day.activities,
              teachingAids: weekData.teachingAids || day.teachingAids,
              references: weekData.references || day.references
            };
          })
        }));
        setLastSyncTime(Date.now());
        setSyncInstructionsText(schemeSyncInstructionStr);
        toast.success(`Switched subject to ${docItem.subject} (${docItem.grade}) and synced Scheme of Work data!`);
      } else {
        toast.error("Could not parse data from selected Scheme of Work.");
      }
    }

    setSyncUnavailableModal(null);
  };

  const handleResetGeneralProfile = () => {
    try {
      safeLocalStorage.removeItem('user_general_profile');
      safeLocalStorage.removeItem('teacher_info');
    } catch (e) {
      console.warn("Could not remove profile from storage", e);
    }
    setFormData(prev => ({
      ...prev,
      teacherName: '',
      tsNumber: '',
      school: '',
      district: '',
      zone: ''
    }));
    setIsGeneralProfileExpanded(true);
    toast("General teacher details reset! You can now enter details for a 2nd or 3rd party beneficiary. (Your synced schemes and weekly forecasts remain untouched)", { icon: 'ℹ️' });
  };

  const handleSaveGeneralProfile = () => {
    const profile = {
      teacherName: formData.teacherName,
      tsNumber: formData.tsNumber,
      school: formData.school,
      district: formData.district,
      zone: formData.zone,
      jobTitle: formData.jobTitle,
      jobPurpose: formData.jobPurpose,
      grade: formData.grade,
    };
    try {
      safeLocalStorage.setItem('user_general_profile', JSON.stringify(profile));
      safeLocalStorage.setItem('teacher_info', JSON.stringify(profile));
    } catch (e) {
      console.warn("Could not save profile to storage", e);
    }
    setIsGeneralProfileExpanded(false);
    toast.success("General teacher profile registered! This information will auto-fill across all generated documents.");
  };

  // Automated background AI drafting upon grade, subject, topic, and subtopic selection
  useEffect(() => {
    if (isUserGuestTier) {
      if (!['schemes_of_work', 'weekly_forecast', 'lesson_plan'].includes(formData.type)) {
        return;
      }
      if (isAllTrialDepleted) {
        return;
      }
    }

    if (
      formData.grade && 
      formData.subject && 
      formData.topic && 
      formData.subtopic && 
      !isDrafting &&
      ['lesson_plan', 'lesson_notes'].includes(formData.type)
    ) {
      const timer = setTimeout(async () => {
        try {
          const draft = await generateDraftContent({
            ...formData,
            curriculumType: curriculumType,
            officialSyllabusData: currentSyllabus
          });
          if (draft) {
            setFormData(prev => ({
              ...prev,
              generalCompetences: prev.generalCompetences || formatGeneralCompetenciesShortForm(draft.generalCompetences || ''),
              lessonGoal: prev.lessonGoal || draft.lessonGoal || '',
              specificCompetences: prev.specificCompetences || draft.specificCompetences || '',
              knowledge: prev.knowledge || draft.knowledge || ''
            }));
          }
        } catch (e) {
          console.warn("Auto background draft completed silently:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.grade, formData.subject, formData.topic, formData.subtopic, formData.type]);

  const fetchSyllabusActivities = async (topic: string, subtopic: string, competency: string, grade?: string, subject?: string) => {
    const targetGrade = grade || formData.grade;
    const targetSubject = subject || formData.subject;
    const key = `${targetGrade}-${targetSubject}-${topic}-${subtopic}-${competency}`;
    if (fetchedActivities[key] || isFetchingActivities[key]) return;

    setIsFetchingActivities(prev => ({ ...prev, [key]: true }));
    try {
      const activities = await getSyllabusActivities(targetGrade, targetSubject, topic, subtopic, competency);
      setFetchedActivities(prev => ({ ...prev, [key]: activities }));
    } catch (err) {
      console.error("AI Syllabus Fetch Error:", err);
    } finally {
      setIsFetchingActivities(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateDraft = async () => {
    const accessStatus = getDownloadAccessStatus(user, subscriptionDetails);
    if (!accessStatus.allowed) {
      toast.error(accessStatus.message);
      return;
    }
    if (isUserGuestTier) {
      if (!['schemes_of_work', 'weekly_forecast', 'lesson_plan'].includes(formData.type) || isLimitReached || isAllTrialDepleted) {
        toast.error("you have depleted your free trial access documents. Pay to continue downloading");
        return;
      }
    }

    if (!formData.topic || !formData.subtopic) {
      toast.error("Please select a topic and sub-topic first");
      return;
    }
    setIsDrafting(true);
    try {
      const draft = await generateDraftContent({
        ...formData,
        curriculumType: curriculumType,
        officialSyllabusData: currentSyllabus
      });
      setFormData(prev => ({
        ...prev,
        generalCompetences: formatGeneralCompetenciesShortForm(draft.generalCompetences || ''),
        lessonGoal: draft.lessonGoal,
        specificCompetences: draft.specificCompetences,
        knowledge: draft.knowledge || prev.knowledge || '',
        additionalContext: prev.additionalContext || ''
      }));
      toast.success("AI draft generated! You can now edit the fields.");
    } catch (err) {
      toast.error("Failed to generate AI draft. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSyncFromWeeklyForecast = async () => {
    if (!user) {
      toast.error("Please log in to sync from your forecast history.");
      return;
    }

    if (!formData.lessonWeekNumber) {
      toast.error("Please enter a week number first.");
      return;
    }

    toast.loading("Searching for your saved Weekly Forecast...", { id: 'sync-forecast' });
    try {
      const activeSources = await fetchActiveSyncSources();
      
      const matchingDoc = activeSources.find(d => 
        d.type === 'weekly_forecast' &&
        isSubjectAndGradeMatch(d.grade, d.subject, formData.grade || '', formData.subject || '')
      );

      if (!matchingDoc) {
        toast.dismiss('sync-forecast');
        toast.error(`Document unavailable: No saved Weekly Forecast found for ${formData.subject || 'selected subject'} (${formData.grade || 'selected grade'}).`, { id: 'sync-status', duration: 5000 });
        setSyncUnavailableModal({
          isOpen: true,
          requestedType: 'Weekly Forecast',
          requestedSubject: formData.subject || 'Not specified',
          requestedGrade: formData.grade || 'Not specified',
          availableDocs: activeSources
        });
        return;
      }

      const forecastDays = parseMarkdownTableToForecastDays(matchingDoc.content);
      
      if (!forecastDays || forecastDays.length === 0) {
        toast.dismiss('sync-forecast');
        toast.error("Document unavailable: Could not parse data from your saved Weekly Forecast.", { id: 'sync-status', duration: 5000 });
        setSyncUnavailableModal({
          isOpen: true,
          requestedType: 'Weekly Forecast',
          requestedSubject: formData.subject || 'Not specified',
          requestedGrade: formData.grade || 'Not specified',
          availableDocs: activeSources
        });
        return;
      }

      // Try to match the day by lessonNumber if it's 1-5, otherwise default to first day
      const dayNum = parseInt(formData.lessonNumber) || 1;
      const dayData = forecastDays.find(d => d.day === dayNum) || forecastDays[0];

      if (dayData) {
        const weekNum = formData.lessonWeekNumber || 1;
        const targetDay = dayData.day || parseInt(formData.lessonNumber) || 1;
        const topVal = dayData.topic || formData.topic || 'N/A';
        const subVal = dayData.subtopic || formData.subtopic || 'N/A';
        const compVal = dayData.competency || formData.specificCompetences || 'N/A';
        const actVal = Array.isArray(dayData.learningActivities) ? dayData.learningActivities.join(', ') : (dayData.learningActivities || 'N/A');
        const methodVal = dayData.teachingMethods || 'Learner-centered group discussion, guided problem solving';
        const aidVal = dayData.teachingAids || formData.teachingAids || 'N/A';
        const refVal = dayData.references || formData.references || 'N/A';

        const syncInstructionStr = `SYNCED PREPARATION DATA (Week ${weekNum}, Day ${targetDay}):
• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}

Instructions
(Lesson plan:) let the Lesson plan be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.
Modules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;

        setFormData(prev => ({
          ...prev,
          topic: dayData.topic || prev.topic,
          subtopic: dayData.subtopic || prev.subtopic,
          specificCompetences: dayData.competency || prev.specificCompetences,
          learningActivities: dayData.learningActivities || prev.learningActivities,
          teachingMethods: dayData.teachingMethods || prev.teachingMethods,
          teachingAids: dayData.teachingAids || prev.teachingAids,
          references: dayData.references || prev.references,
          additionalContext: syncInstructionStr
        }));
        setLastSyncTime(Date.now());
        setSyncInstructionsText(syncInstructionStr);
        toast.success(`Successfully synced data for Day ${targetDay} from Weekly Forecast!`, { id: 'sync-forecast' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sync_sources`);
      toast.dismiss('sync-forecast');
    }
  };

  const resetGenerator = () => {
    try {
      // Clear all generation caches from localStorage
      Object.keys(localStorage)
        .filter(k => k.startsWith('gen_cache_'))
        .forEach(k => safeLocalStorage.removeItem(k));
    } catch (e) {
      console.warn("Error clearing generation cache:", e);
    }

    // Clear Firestore autosave document for this type
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'autosave', formData.type);
      deleteDoc(docRef).catch(err => console.warn("Failed to delete autosave on reset:", err));
    }

    setFormData(prev => ({
      ...prev,
      topic: '',
      subtopic: '',
      specificCompetences: '',
      learningActivities: [],
      lessonGoal: '',
      lessonFrom: '',
      lessonTo: '',
      objectives: '',
      additionalContext: '',
      references: '',
    }));
    setSyncInstructionsText(null);
    setBatchLessons([{ id: '1', topic: '', subtopic: '', specificCompetences: '', learningActivities: [], expectedStandard: '' }]);
    setHasGenerated(false);
    setLastGeneratedContent(null);
    setAutosaveStatus(null);
    setDetectedDraft(null);
    setShowDraftBanner(false);
    setError(null);
    setSelectedModuleIds([]);
    toast.success("Generator reset. Start fresh!");
  };
  const isLesson = formData.type === 'lesson_plan';
  const isAssessment = formData.type === 'assessments';
  const isForecast = formData.type === 'weekly_forecast';
  const isScheme = formData.type === 'schemes_of_work';
  const isIWP = formData.type === 'individual_work_plan';
  const isAdmin = isIWP && ((formData.jobTitle || "").toLowerCase().includes("head teacher") || (formData.jobTitle || "").toLowerCase().includes("deputy head"));
  const isLessonNotes = formData.type === 'lesson_notes';
  const isVideoScript = formData.type === 'video_script';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      const steps = isIWP ? [
        "Analyzing professional role...",
        "Validating job description...",
        "Identifying section-level KRAs...",
        "Mapping principal accountabilities...",
        "Researching professional targets...",
        "Structuring work plan matrix...",
        "Arranging information accordingly...",
        "Finalizing professional document..."
      ] : [
        "Analyzing requirements...",
        "Querying Knowledge Base...",
        "Structuring document...",
        "Applying CBC/OBC standards...",
        "Generating content...",
        "Refining tables and formatting...",
        "Finalizing document..."
      ];
      let stepIndex = 0;
      setProgressText(steps[stepIndex]);
      
      const intervalMs = isIWP ? 2500 : 1500;
      
      interval = setInterval(() => {
        stepIndex++;
        if (stepIndex >= steps.length) {
            stepIndex = steps.length - 1; 
        }
        setProgressText(steps[stepIndex]);
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isIWP]);

  const getTermLabel = (base: string, isShowingAll?: boolean) => {
    const isGr12Eng = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && 
                      formData.subject.toLowerCase().includes('english');
    if (isGr12Eng && formData.term && !isShowingAll) {
      const term = formData.term || '';
      if (term.toUpperCase().startsWith('TERM')) {
        return `${term.toUpperCase()} ${base}`;
      }
      return `TERM ${term} ${base}`;
    }
    return base;
  };

  const currentRoleBase = formData.jobTitle?.split(' (')[0].trim();
  const defaultPurpose = currentRoleBase ? (JOB_PURPOSE_DEFAULTS[currentRoleBase] || JOB_PURPOSE_DEFAULTS['Class teacher']) : '';

  const handleWeeksLengthChange = (num: number) => {
    setFormData(prev => {
      const isECE = prev.grade.toLowerCase().includes('ece');
      const isEnglishGr12Combined = (prev.grade.includes('Grade 1') || prev.grade.includes('Grade 2')) && 
                                    prev.subject.toLowerCase().includes('english') && 
                                    prev.englishCombined;
      
      const currentWeeks = prev.weeks || [];
      let newWeeks = [...currentWeeks];
      
      if (num > currentWeeks.length) {
        const weeksToAdd = num - currentWeeks.length;
        const addedWeeks = Array.from({ length: weeksToAdd }, (_, i) => {
          const weekNum = currentWeeks.length + i + 1;
          let topic = '';
          
          if (isECE) {
            if (weekNum === 7) topic = 'Mid Term Break (Learners resting at home)';
            else if (weekNum === 12) topic = 'Revisions';
            else if (weekNum === 13) topic = 'Consolidation of assessments (Formative throughout, mostly observation)';
          } else {
            if (weekNum === 4) topic = 'Learning & Monthly Assessment';
            if (weekNum === 8) topic = 'Learning & Monthly Assessment';
            if (weekNum === 12) topic = 'Revisions';
            if (weekNum === 13) topic = 'End of Term Test';
          }

          return {
            week: weekNum,
            topic,
            topic2: '',
            topic3: '',
            subtopics: isEnglishGr12Combined ? ['', '', '', '', ''] : ['', '', ''],
            competencies: ['', '', '', '', ''],
            activities: ['', '', '', '', ''],
            expectedStandards: ['', '', '', '', '']
          };
        });
        newWeeks = [...newWeeks, ...addedWeeks];
      } else if (num < currentWeeks.length) {
        newWeeks = newWeeks.slice(0, num);
      }
      
      return { ...prev, weeks: newWeeks };
    });
  };

  const showContentDetails = (isLesson || isAssessment || isLessonNotes || isVideoScript) && !isIWP;
  const showSyllabusReference = !isIWP;

  const selectedTemplate = DOC_TEMPLATES.find(t => t.id === formData.type);
  
  const parseAndSplitTitle = (titleStr: string): { title: string; number: string }[] => {
    const trimmed = (titleStr || '').trim();
    if (!trimmed) return [{ title: '', number: '' }];

    const numMatch = trimmed.match(/^(\d+\.\d+(?:\.\d+)?)/);
    return [{
      title: trimmed,
      number: numMatch ? numMatch[1] : ''
    }];
  };

  const unpackSyllabusData = (topics: any[]): any[] => {
    if (!Array.isArray(topics)) return topics;
    
    // Return the original topics array. 
    // The previous aggressive splitting and filtering was causing subtopics to be missing or out of order.
    // By returning the original structure, we ensure the app matches the syllabus data exactly.
    return topics.map(topic => {
      if (!topic) return topic;
      
      // Ensure subtopics is an array if present
      const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
      
      return {
        ...topic,
        subtopics: subtopics.map((sub: any) => ({
          ...sub,
          // Ensure competencies and activities are handled if they were object-based
          competencies: Array.isArray(sub.competencies) ? sub.competencies : (sub.competencies ? [sub.competencies] : []),
          learningActivities: sub.learningActivities || []
        }))
      };
    });
  };

  const getSyllabusData = (grade: string, subject: string, termOverride?: string) => {
    const targetGrade = grade;
    if (!targetGrade || !subject) return null;
    
    // Normalize grade to match SYLLABI keys (e.g. "Grade 1" -> "Grade 1 (Primary)")
    const gLow = targetGrade.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sLow = subject.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

    // Normalize common variations to ensure they match data keys
    const normalizedSubjectSearch = (s: string) => {
      const low = s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      if (low === 'englishlanguage' || low === 'english') return 'english';
      if (low === 'socialstudies' || low === 'socialstudy') return 'socialstudies';
      if (low === 'integratedscience' || low === 'science') return 'integratedscience';
      if (low === 'mathematics' || low === 'math' || low === 'maths') return 'mathematics';
      return low;
    };
    const targetSubjectLow = normalizedSubjectSearch(subject);
    
    // Quick Debug Log
    console.log(`[getSyllabusData] Grade: ${grade}, Subject: ${subject}, Curriculum: ${curriculumType}`);
    let selectedModule = modules.find(m => 
      selectedModuleIds.includes(m.id) && 
      extractedSyllabuses[m.id] && 
      extractedSyllabuses[m.id].length > 0
    );

    if (selectedModule && extractedSyllabuses[selectedModule.id] && extractedSyllabuses[selectedModule.id].length > 0) {
      return { 
        data: unpackSyllabusData(extractedSyllabuses[selectedModule.id]), 
        isShowingAll: true, 
        name: `Module: ${selectedModule.name}` 
      };
    }
    
    const gDigits = targetGrade.match(/\d+/g) || [];
    
    // Helper to filter syllabus topics & subtopics by term
    // Per user instructions: ONLY Oral English and Literacy in English for Grade 1 and Grade 2 are grouped/filtered by term.
    // All other subjects and grades show all topics in one unified drop-down.
    const filterSyllabusByTerm = (rawData: any[], gVal: string, sVal: string, termVal?: string): { data: any[], isShowingAll: boolean } => {
        if (!Array.isArray(rawData)) return { data: rawData, isShowingAll: true };
        const unpackedRawData = unpackSyllabusData(rawData);
        
        const gValClean = (gVal || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const sValClean = (sVal || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const isGr12English = 
          ((gValClean.includes('grade1') && !gValClean.includes('grade10') && !gValClean.includes('grade11') && !gValClean.includes('grade12')) || 
           (gValClean.includes('grade2') && !gValClean.includes('grade12')) || 
           gValClean === 'gr1' || gValClean === 'gr2') && 
          (sValClean.includes("english") || sValClean.includes("literacy") || sValClean.includes("oral"));
        
        // For all other subjects, return all topics without term grouping or filtering
        if (!isGr12English) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        const currentTerm = termVal || formData.term;
        if (!currentTerm) return { data: unpackedRawData, isShowingAll: true };

        const termStr = currentTerm.toString().trim();
        const termNum = termStr.replace(/[^0-9]/g, "");
        if (!termNum) return { data: unpackedRawData, isShowingAll: true };

        const filteredResult = unpackedRawData.map((topic) => {
          if (topic.title === "KEY COMPETENCES TO BE DEVELOPED" || topic.title === "KEY COMPETENCES") {
            return topic;
          }

          let topicTermNum = topic.term ? topic.term.toString().replace(/[^0-9]/g, "") : null;
          if (!topicTermNum) {
            const titleLow = (topic.title || "").toLowerCase();
            if (titleLow.includes("term 1")) topicTermNum = "1";
            else if (titleLow.includes("term 2")) topicTermNum = "2";
            else if (titleLow.includes("term 3")) topicTermNum = "3";
          }

          if (topicTermNum) {
            if (topicTermNum !== termNum) return null;
          }

          if (topic.subtopics && Array.isArray(topic.subtopics)) {
            const filteredSubtopics = topic.subtopics.filter((sub: any) => {
              let subTermNum = sub.term ? sub.term.toString().replace(/[^0-9]/g, "") : null;
              if (!subTermNum) {
                const subTitleLow = (sub.title || "").toLowerCase();
                if (subTitleLow.includes("term 1")) subTermNum = "1";
                else if (subTitleLow.includes("term 2")) subTermNum = "2";
                else if (subTitleLow.includes("term 3")) subTermNum = "3";
              }
              if (subTermNum) return subTermNum === termNum;
              if (topicTermNum) return topicTermNum === termNum;

              return isEnglishSubtopicInTerm(sub.title, termStr, sVal);
            });

            if (filteredSubtopics.length === 0 && topic.subtopics.length > 0) return null;

            return {
              ...topic,
              subtopics: filteredSubtopics
            };
          }

          return topic;
        }).filter(Boolean) as any[];

        // Automatic fallback if filtering results in nothing
        if (filteredResult.length === 0) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        return { data: filteredResult, isShowingAll: false };
      };

    // 2. Search built-in official SYLLABI database FIRST before background modules
    const potentialGradeKeys = Object.keys(SYLLABI).filter(k => {
      const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const kDigits = k.match(/\d+/g) || [];
      
      // If we are looking for a specific Form (Form 1, 2, 3, 4, 5, 6), do not match composite "Form 1-4" or "Form 5-6" range keys
      if (gLow.includes('form')) {
        if (kLow.includes('14') || kLow.includes('1-4') || k.includes('1-4') || kLow.includes('56') || kLow.includes('5-6') || k.includes('5-6')) {
          return false;
        }
      }
      
      // Form 1-4 / Secondary matching: ALWAYS match Form keys for Form selections regardless of curriculumType setting
      if (gLow.includes('form')) {
        const isFormKey = kLow.includes('form');
        if (isFormKey && (kLow.includes(gLow) || gLow.includes(kLow))) return true;
        if (isFormKey && kDigits.length > 0 && gDigits.length > 0 && gDigits.some(d => kDigits.includes(d))) return true;
      }

      if (curriculumType === 'OBC') {
         const match = (kLow.includes('obe') || kLow.includes('obc')) && (kLow.includes(gLow) || gLow.includes(kLow));
         if (match) return true;
         if ((kLow.includes('obe') || kLow.includes('obc')) && kDigits.length > 0 && gDigits.length > 0 && gDigits.some(d => kDigits.includes(d))) return true;
         return false;
      } else {
         if (kLow.includes('obe') || kLow.includes('obc')) return false;
         if (kLow.includes(gLow) || gLow.includes(kLow)) return true;
         if (kDigits.length > 0 && gDigits.length > 0 && gDigits.some(d => kDigits.includes(d))) {
           const isFormKey = kLow.includes('form');
           const isGradeKey = kLow.includes('grade');
           const isFormSelection = gLow.includes('form');
           const isGradeSelection = gLow.includes('grade');
           if (isFormKey && isFormSelection) return true;
           if (isGradeKey && isGradeSelection) return true;
         }
         return false;
      }
    });

    // Strategy 1: Look for exact subject match in ANY of the matching grades
    const sortedPotentialKeys = [...potentialGradeKeys].sort((a, b) => {
       const aLow = a.toLowerCase().replace(/[^a-z0-9]/g, '');
       const bLow = b.toLowerCase().replace(/[^a-z0-9]/g, '');
       if (aLow === gLow && bLow !== gLow) return -1;
       if (bLow === gLow && aLow !== gLow) return 1;
       
       if (curriculumType === 'CBC') {
         if (aLow.includes('cbc') && !bLow.includes('cbc')) return -1;
         if (!aLow.includes('cbc') && bLow.includes('cbc')) return 1;
       }
       return 0;
    });

    for (const key of sortedPotentialKeys) {
      const gradeData = SYLLABI[key];
      const keys = Object.keys(gradeData);
      
      // Try exact subject match with normalization
      let subjectKey = keys.find(k => normalizedSubjectSearch(k) === targetSubjectLow);

      // Try broad matching if no exact match
      if (!subjectKey) {
        subjectKey = keys.find(k => {
          const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          if (sLow.includes(kLow) || kLow.includes(sLow)) return true;
          const sWords = sLow.split(' ');
          const kWords = kLow.split(' ');
          if (sWords.some(w => w.length > 3 && kWords.includes(w))) return true;
          if (sLow.includes('zambian') && kLow.includes('zambian')) return true;
          return false;
        });
      }

      if (subjectKey) {
        let finalData = gradeData[subjectKey];
        const isEng = subject.toLowerCase().includes('english');
        const isCombined = formData.englishCombined;
        const gLowVal = grade.toLowerCase();
        
        if (isEng && ((gLowVal.includes('grade 1') && !gLowVal.includes('grade 10') && !gLowVal.includes('grade 11') && !gLowVal.includes('grade 12')) || gLowVal.includes('grade 2'))) {
          const oral = gradeData['Oral English'] || [];
          const literacy = gradeData['literacy in English'] || [];
          if (isCombined) {
            finalData = [...oral, ...literacy];
          } else {
            const comp = formData.englishComponent || 'oral';
            if (comp === 'literacy') {
              finalData = literacy;
            } else {
              finalData = oral;
            }
          }
        }
        
        const { data, isShowingAll } = filterSyllabusByTerm(finalData, grade, subject, termOverride);
        if (data && data.length > 0) {
          return { data, isShowingAll, name: `${key} - ${subjectKey}` };
        }
      }
    }

    // Strategy 2: If still no key, try looking for the subject directly in range keys (e.g. "Form 1-4 Biology")
    if (gLow.includes('form')) {
      const fallbackGradeKey = Object.keys(SYLLABI).find(k => {
        const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return kLow.includes('form') && kLow.includes(sLow) && (curriculumType === 'CBC' ? !kLow.includes('obc') : kLow.includes('obc'));
      });
      if (fallbackGradeKey) {
        const keys = Object.keys(SYLLABI[fallbackGradeKey]);
        const subjectKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').trim() === sLow) || keys[0];
        if (subjectKey) {
          const { data, isShowingAll } = filterSyllabusByTerm(SYLLABI[fallbackGradeKey][subjectKey], grade, subject, termOverride);
          if (data && data.length > 0) {
            return { data, isShowingAll, name: `${fallbackGradeKey} - ${subjectKey}` };
          }
        }
      }
    }

    // 3. Fallback to unselected background modules ONLY if no built-in syllabus exists
    const backgroundModule = modules.find(m => {
        if (!m.subject) return false;
        const mSubLow = m.subject.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const mGradeLow = m.grade?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        if (mGradeLow === gLow && mSubLow === sLow) return true;
        if (gLow.includes('form') && mGradeLow.includes('form') && mSubLow === sLow) {
           const mDigits = mGradeLow.match(/\d+/g) || [];
           const gDigits = gLow.match(/\d+/g) || [];
           if (mDigits.length > 0 && gDigits.length > 0) {
             return mDigits[0] === gDigits[0];
           }
           return true; 
        }
        return false;
    });

    if (backgroundModule && extractedSyllabuses[backgroundModule.id] && extractedSyllabuses[backgroundModule.id].length > 0) {
      return { 
        data: unpackSyllabusData(extractedSyllabuses[backgroundModule.id]), 
        isShowingAll: true, 
        name: `Module: ${backgroundModule.name}` 
      };
    }
    
    return null;
  };

  const syllabusResult = getSyllabusData(formData.grade, formData.subject, formData.term);
  const topicsData = syllabusResult?.data || null;
  
  const currentSyllabus = useMemo(() => {
    const isSpecial = 
      (formData.grade.includes('Grade 10') || formData.grade.includes('Grade 11') || formData.grade.includes('Grade 12')) &&
      (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('zambian'));
    if (isSpecial) {
      return transformSecondaryLanguageSyllabus(topicsData);
    }
    return topicsData;
  }, [topicsData, formData.grade, formData.subject]);
  const currentSyllabusName = syllabusResult?.name || null;

  // Auto-fetch syllabus activities when subtopic or competency changes 
  useEffect(() => {
    if (!formData.topic || !formData.subtopic) return;
    
    const fetchActivities = async () => {
      const key = `${formData.grade}-${formData.subject}-${formData.topic}-${formData.subtopic}-${formData.specificCompetences || ''}`;
      if (fetchedActivities[key] || isFetchingActivities[key]) return;

      // Only fetch if base syllabus has fewer than 8 activities
      const baseActivities = getActivitiesForSubtopic(formData.topic, formData.subtopic, formData.specificCompetences, currentSyllabus);
      if (baseActivities.length >= 8) return;

      setIsFetchingActivities(prev => ({ ...prev, [key]: true }));
      try {
        const aiActivities = await getSyllabusActivities(
          formData.grade, 
          formData.subject, 
          formData.topic, 
          formData.subtopic, 
          formData.specificCompetences || ''
        );
        if (aiActivities && aiActivities.length > 0) {
          const merged = Array.from(new Set([...baseActivities, ...aiActivities]));
          setFetchedActivities(prev => ({ ...prev, [key]: merged }));
          
          // Do NOT auto-select learning activities anymore to let the user select manually
        }
      } catch (err) {
        console.error("AI Syllabus Fetch Error:", err);
      } finally {
        setIsFetchingActivities(prev => ({ ...prev, [key]: false }));
      }
    };

    fetchActivities();
  }, [formData.topic, formData.subtopic, formData.specificCompetences, formData.grade, formData.subject, currentSyllabus]);

  // Auto-fetch for Batch Lessons
  useEffect(() => {
    if (!batchMode || batchLessons.length === 0) return;
    
    batchLessons.forEach(async (lesson) => {
      if (!lesson.topic || !lesson.subtopic) return;
      
      const key = `${formData.grade}-${formData.subject}-${lesson.topic}-${lesson.subtopic}-${lesson.specificCompetences || ''}`;
      if (fetchedActivities[key] || isFetchingActivities[key]) return;

      const baseActivities = getActivitiesForSubtopic(lesson.topic, lesson.subtopic, lesson.specificCompetences, currentSyllabus);
      if (baseActivities.length >= 8) return;

      setIsFetchingActivities(prev => ({ ...prev, [key]: true }));
      try {
        const activities = await getSyllabusActivities(
          formData.grade, 
          formData.subject, 
          lesson.topic, 
          lesson.subtopic, 
          lesson.specificCompetences || ''
        );
        if (activities && activities.length > 0) {
          const merged = Array.from(new Set([...baseActivities, ...activities]));
          setFetchedActivities(prev => ({ ...prev, [key]: merged }));
          
          // Do NOT auto-select learning activities for batch lesson to let user select manually
        }
      } catch (err) {
        console.error("AI Batch Syllabus Fetch Error:", err);
      } finally {
        setIsFetchingActivities(prev => ({ ...prev, [key]: false }));
      }
    });
  }, [batchMode, batchLessons, formData.grade, formData.subject, currentSyllabus]);

  const activeModuleForState = modules.find(m => {
      if (!m.subject) return false;
      if (m.grade === formData.grade && m.subject === formData.subject) return true;
      if (formData.grade && formData.grade.toLowerCase().includes('form') && m.grade?.toLowerCase().includes('form') && m.subject === formData.subject) return true;
      return false;
  });

  const hasOfficialSyllabus = !!(syllabusResult?.data && syllabusResult.data.length > 0 && !syllabusResult.name?.startsWith('Module:'));

  const currentModuleIsExtracting = activeModuleForState && !hasOfficialSyllabus
    ? !!isExtractingSyllabus[activeModuleForState.id]
    : false;

  useEffect(() => {
    // If we have an official built-in syllabus, do not trigger background extraction that would block the UI
    if (hasOfficialSyllabus) return;

    const activeModule = modules.find(m => {
        if (!m.subject) return false;
        if (m.grade === formData.grade && m.subject === formData.subject) return true;
        if (formData.grade && formData.grade.toLowerCase().includes('form') && m.grade?.toLowerCase().includes('form') && m.subject === formData.subject) return true;
        return false;
    });

    if (activeModule && !extractedSyllabuses[activeModule.id] && !isExtractingSyllabus[activeModule.id]) {
       setIsExtractingSyllabus(prev => ({ ...prev, [activeModule.id]: true }));
       extractSyllabusFromModule(activeModule.content).then(data => {
         setExtractedSyllabuses(prev => ({ ...prev, [activeModule.id]: data || [] }));
       }).catch(err => {
         console.error(err);
         setExtractedSyllabuses(prev => ({ ...prev, [activeModule.id]: [] }));
       })
       .finally(() => {
         setIsExtractingSyllabus(prev => ({ ...prev, [activeModule.id]: false }));
       });
    }
  }, [formData.grade, formData.subject, modules, hasOfficialSyllabus, extractedSyllabuses, isExtractingSyllabus]);


  const handleWeekChange = (index: number, field: 'topic' | 'topic2' | 'topic3' | 'subtopics' | 'competencies' | 'activities' | 'teachingAids' | 'references', subIndex: number | null, value: string) => {
    setFormData(prev => {
      const newWeeks = [...prev.weeks!];
      const updatedWeek = { ...newWeeks[index] };
      
      if (field === 'teachingAids') {
        updatedWeek.teachingAids = value;
      } else if (field === 'references') {
        updatedWeek.references = value;
      } else if (field === 'subtopics' && subIndex !== null) {
        const isEnglishGr2Term3 = prev.grade.includes('Grade 2') && 
                                 prev.term === '3' && 
                                 prev.subject.toLowerCase().includes('english') && 
                                 prev.englishCombined;
        const newSubtopics = [...updatedWeek.subtopics];
        while (newSubtopics.length < (isEnglishGr2Term3 ? 5 : 3)) {
          newSubtopics.push('');
        }
        newSubtopics[subIndex] = value;
        if (isEnglishGr2Term3 && subIndex === 3 && value) {
          const cleanSound = stripPageNumbers(value);
          if (!newSubtopics[4] || newSubtopics[4].startsWith('Revision')) {
            newSubtopics[4] = `Revision on ${cleanSound}`;
          }
        }
        updatedWeek.subtopics = newSubtopics;

        // Auto-select matching specific competency for this subtopic
        if (value) {
          const currentTopic = isEnglishGr2Term3
            ? (subIndex < 2 ? updatedWeek.topic : updatedWeek.topic2)
            : (subIndex === 0 ? updatedWeek.topic : (subIndex === 1 ? updatedWeek.topic2 : updatedWeek.topic3));
          const subComps = getCompetenciesForSubtopic(currentTopic, value);
          if (subComps.length > 0) {
            const newCompetencies = [...updatedWeek.competencies];
            const compIndex = isEnglishGr2Term3 ? subIndex : subIndex * 2;
            if (compIndex < newCompetencies.length) {
              newCompetencies[compIndex] = subComps[0];
            }
            updatedWeek.competencies = newCompetencies;
          }
        }
      } else if (field === 'competencies' && subIndex !== null) {
        const newCompetencies = [...updatedWeek.competencies];
        newCompetencies[subIndex] = value;
        updatedWeek.competencies = newCompetencies;
      } else if (field === 'activities' && subIndex !== null) {
        const newActivities = [...(updatedWeek as any).activities || ['', '', '', '', '']];
        newActivities[subIndex] = value;
        (updatedWeek as any).activities = newActivities;
      } else if (field === 'topic') {
        updatedWeek.topic = value;
        newWeeks[index] = updatedWeek;
        return {
          ...prev,
          topic: index === 0 ? value : prev.topic,
          weeks: newWeeks
        };
      } else if (field === 'topic2') {
        updatedWeek.topic2 = value;
      } else if (field === 'topic3') {
        updatedWeek.topic3 = value;
      }
      
      newWeeks[index] = updatedWeek;
      return { ...prev, weeks: newWeeks };
    });
  };

  const handleForecastChange = (index: number, field: 'topic' | 'subtopic' | 'competency' | 'activities' | 'expectedStandard' | 'date' | 'learningArea', value: string | string[], subIndex?: number) => {
    setFormData(prev => {
      const newDays = [...prev.forecastDays!];
      if (field === 'activities' && subIndex !== undefined) {
        const currentActivities = [...(newDays[index] as any).activities || ['', '', '', '']];
        currentActivities[subIndex] = value as string;
        newDays[index] = { ...newDays[index], activities: currentActivities } as any;
      } else {
        newDays[index] = { ...newDays[index], [field]: value };
        
        if (field === 'topic') {
          newDays[index].subtopic = '';
          newDays[index].competency = '';
          newDays[index].activities = [];
        } else if (field === 'subtopic') {
          const comps = getCompetenciesForSubtopic(newDays[index].topic, value as string);
          const autoComp = comps[0] || '';
          newDays[index].competency = autoComp;
          const acts = getActivitiesForSubtopic(newDays[index].topic, value as string, autoComp);
          const dayAct = acts[index % acts.length] || acts[0] || '';
          newDays[index].activities = dayAct ? [dayAct] : [];
        } else if (field === 'competency') {
          const acts = getActivitiesForSubtopic(newDays[index].topic, newDays[index].subtopic, value as string);
          const dayAct = acts[index % acts.length] || acts[0] || '';
          newDays[index].activities = dayAct ? [dayAct] : [];
        } else if (field === 'learningArea') {
          newDays[index].topic = '';
          newDays[index].subtopic = '';
          newDays[index].competency = '';
          newDays[index].activities = [];
        }
      }
      return { ...prev, forecastDays: newDays };
    });
  };

  const addBatchLesson = () => {
    if (batchLessons.length >= 5) return;
    setBatchLessons([...batchLessons, { 
      id: Date.now().toString(), 
      topic: '', 
      subtopic: '', 
      specificCompetences: '', 
      learningActivities: [],
      expectedStandard: ''
    }]);
  };

  const removeBatchLesson = (id: string) => {
    if (batchLessons.length <= 1) return;
    setBatchLessons(batchLessons.filter(l => l.id !== id));
  };

  const updateBatchLesson = (id: string, field: keyof BatchLesson, value: any) => {
    setBatchLessons(batchLessons.map(l => {
      if (l.id === id) {
        const updatedLesson = { ...l, [field]: value };
        
        if (field === 'topic') {
          updatedLesson.subtopic = '';
          updatedLesson.specificCompetences = '';
          updatedLesson.learningActivities = [];
        } else if (field === 'subtopic') {
          const comps = getCompetenciesForSubtopic(l.topic, value);
          const autoComp = comps[0] || '';
          updatedLesson.specificCompetences = autoComp;
          updatedLesson.learningActivities = getActivitiesForSubtopic(l.topic, value, autoComp);
        } else if (field === 'specificCompetences') {
          updatedLesson.learningActivities = getActivitiesForSubtopic(l.topic, l.subtopic, value);
        }
        
        return updatedLesson;
      }
      return l;
    }));
  };

  const handleResetSyncHistory = async (typeToReset: 'weekly_forecast' | 'schemes_of_work' | 'all' = 'all') => {
    if (!user) {
      toast.error("Please log in to reset sync history");
      return;
    }
    
    const label = typeToReset === 'weekly_forecast' 
      ? 'Weekly Forecast sync records' 
      : typeToReset === 'schemes_of_work' 
        ? 'Scheme of Work sync records' 
        : 'all synchronization records';

    const confirmReset = window.confirm(`Are you sure you want to reset your saved ${label}? This will deactivate previously saved ${label} for sync while keeping your other documents intact.`);
    if (!confirmReset) return;

    try {
      const syncRef = collection(db, "users", user.uid, "sync_sources");
      let q;
      if (typeToReset === 'all') {
        q = query(syncRef, where("isActive", "==", true));
      } else {
        q = query(syncRef, where("isActive", "==", true), where("type", "==", typeToReset));
      }
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.success(`No active saved ${label} found in sync history.`);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { isActive: false });
      });
      await batch.commit();
      
      toast.success(`Saved ${label} reset successfully.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sync_sources`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'grade' || name === 'subject') {
        setLastSyncTime(null);
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            topic: '',
            subtopic: '',
            selectedSubtopics: [],
            selectedCompetences: [],
            specificCompetences: '',
            learningActivities: []
        }));
    } else if (name === 'topic') {
        const selectedTopicObj = (currentSyllabus || []).find(t => t.title === value);
        const genComp = formatGeneralCompetenciesShortForm(selectedTopicObj?.generalCompetency || '');
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            subtopic: '',
            selectedSubtopics: [],
            selectedCompetences: [],
            specificCompetences: '',
            learningActivities: [],
            generalCompetences: (prev.generalCompetences === '' || !prev.generalCompetences) ? genComp : prev.generalCompetences
        }));
    } else if (name === 'subtopic') {
        const subtopicObj = getSubtopicObject(formData.topic, value);
        const comps = subtopicObj?.competencies || getCompetenciesForSubtopic(formData.topic, value);
        const autoComp = comps[0] || '';
        const activities = subtopicObj?.learningActivities || getActivitiesForSubtopic(formData.topic, value, autoComp);
        
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            specificCompetences: autoComp,
            learningActivities: activities,
            // Auto-populate OBC fields if available and current field is empty
            knowledge: (prev.knowledge === '' || !prev.knowledge) ? (subtopicObj?.knowledge || '') : prev.knowledge,
            skills: (prev.skills === '' || !prev.skills) ? (subtopicObj?.skills || '') : prev.skills,
            values: (prev.values === '' || !prev.values) ? (subtopicObj?.values || '') : prev.values,
            expectedStandard: (prev.expectedStandard === '' || !prev.expectedStandard) ? (subtopicObj?.expectedStandard || '') : prev.expectedStandard
        }));
    } else if (name === 'specificCompetences') {
        const activities = getActivitiesForSubtopic(formData.topic, formData.subtopic, value);
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            learningActivities: activities
        }));
    } else if (name === 'term') {
        let termDate = formData.termStartDate;
        if (value === '3') {
            termDate = '07-09-2026';
        } else if (value === '2') {
            termDate = '07-09-2026';
        } else if (value === '1') {
            termDate = '12-01-2026';
        }
        setFormData(prev => ({ ...prev, [name]: value, termStartDate: termDate }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const stripPageNumbers = (title: string) => {
    if (!title) return '';
    return title.replace(/\s*\(page\s+[^)]+\)/gi, '').trim();
  };

  const zambianTopicDictionary: Record<string, Record<string, string>> = {
    "events": {
      "Icibemba": "Ifisoolo / Imilandu",
      "Cinyanja": "Zoitika / Zochitika",
      "Chitonga": "Zitika / Makani",
      "Silozi": "Ze ezahela",
      "Kiikaonde": "Bimweka / Byaana",
      "Lunda": "Yuma Yamwekana",
      "Luvale": "Vyuma Vyaholoka"
    },
    "role play": {
      "Icibemba": "Ukusungula / Ukulangisha",
      "Cinyanja": "Sewero / Zochita",
      "Chitonga": "Kusobana / Kuyeeya",
      "Silozi": "Litengano",
      "Kiikaonde": "Kwesekeja / Kudana",
      "Lunda": "Kwesekeja",
      "Luvale": "Kwesekeja"
    },
    "riddles": {
      "Icibemba": "Inshimi / Inshilo",
      "Cinyanja": "Mwabi / Miyambo",
      "Chitonga": "Tulabi / Nalunyense",
      "Silozi": "Lalilali / Likano",
      "Kiikaonde": "Kyoko / Bito",
      "Lunda": "Nshimi",
      "Luvale": "Jisimo"
    },
    "tongue twisters": {
      "Icibemba": "Ukufikilisha ululimi",
      "Cinyanja": "Mawu a pa lilime",
      "Chitonga": "Kusunga lulimi",
      "Silozi": "Lupula lulimi",
      "Kiikaonde": "Kupinda ludimi",
      "Lunda": "Kukanza idimi",
      "Luvale": "Kukanza lilimi"
    },
    "oral reading": {
      "Icibemba": "Ukubelenga mu kanwa",
      "Cinyanja": "Kuwerenga mokweza",
      "Chitonga": "Kubala akano",
      "Silozi": "Ku bala ka mulomo",
      "Kiikaonde": "Kutanga kwiilu",
      "Lunda": "Kutaanga mukanwa",
      "Luvale": "Kutaanga mukanwa"
    },
    "word sequencing": {
      "Icibemba": "Ukutantika amashwi",
      "Cinyanja": "Kukonza mawu",
      "Chitonga": "Kubikka mabala mundandanda",
      "Silozi": "Ku tataisa manzwi",
      "Kiikaonde": "Kulamika maambo",
      "Lunda": "Kwatangisha mazu",
      "Luvale": "Kwatangisa mazu"
    },
    "synonyms and antonyms": {
      "Icibemba": "Amashwi yamo na yamupusano",
      "Cinyanja": "Mawu ofanana ndi osiyana",
      "Chitonga": "Mabala akozyanya aalindana",
      "Silozi": "Manzwi swana ni fapana",
      "Kiikaonde": "Maambo esana na apusanako",
      "Lunda": "Mazu adifwana na apusana",
      "Luvale": "Mazu amwe na apusana"
    },
    "listening and speaking": {
      "Icibemba": "Ukukutika no Ukulanda",
      "Cinyanja": "Kumva ndi Kuyankhula",
      "Chitonga": "Kuswiilila a Kwaamba",
      "Silozi": "Kutwa ni Kubulela",
      "Kiikaonde": "Kuteelela na Kwamba",
      "Lunda": "Kutiya na Kwaha",
      "Luvale": "Kwevwilila na Kwendeka"
    },
    "reading": {
      "Icibemba": "Ukubelenga",
      "Cinyanja": "Kuwerenga",
      "Chitonga": "Kubala",
      "Silozi": "Kubala",
      "Kiikaonde": "Kutanga",
      "Lunda": "Kutaanga",
      "Luvale": "Kutaanga"
    },
    "writing": {
      "Icibemba": "Ukulemba",
      "Cinyanja": "Kulemba",
      "Chitonga": "Kulemba",
      "Silozi": "Kuñola",
      "Kiikaonde": "Kunemba",
      "Lunda": "Kusoneka",
      "Luvale": "Kusoneka"
    },
    "structure": {
      "Icibemba": "Imipangilwe ya lulimi",
      "Cinyanja": "Malamulo a chinenero",
      "Chitonga": "Mubumbilwe wa lulimi",
      "Silozi": "Likama za puo",
      "Kiikaonde": "Lutaanso lwa maambo",
      "Lunda": "Nsapu yamazu",
      "Luvale": "Nsapu yamazu"
    },
    "grammar": {
      "Icibemba": "Imipangilwe ya mashwi",
      "Cinyanja": "Malamulo a chinenero",
      "Chitonga": "Mubumbilwe wa mabala",
      "Silozi": "Likama za puo",
      "Kiikaonde": "Lutaanso lwa maambo",
      "Lunda": "Nsapu yamazu",
      "Luvale": "Nsapu yamazu"
    },
    "vocabulary": {
      "Icibemba": "Amashwi yasuma / Icisumino",
      "Cinyanja": "Mawu athu",
      "Chitonga": "Mabala amunkutwe",
      "Silozi": "Lumanzwi",
      "Kiikaonde": "Mawambo",
      "Lunda": "Mazu",
      "Luvale": "Mazu"
    },
    "comprehension": {
      "Icibemba": "Ukuumfwikisha",
      "Cinyanja": "Kuzwitsitsa",
      "Chitonga": "Kumaanya / Kumvwa",
      "Silozi": "Ku utwisisa",
      "Kiikaonde": "Kukwatashisha",
      "Lunda": "Kashaki",
      "Luvale": "Kwevwa"
    },
    "greetings and courtesy": {
      "Icibemba": "Ukuposhanya na mucinshi",
      "Cinyanja": "Kupereka moni ndi ulemu",
      "Chitonga": "Kuonzya a bufumu",
      "Silozi": "Lutumeliso ni likute",
      "Kiikaonde": "Kwanuka na munemba",
      "Lunda": "Ukumudika",
      "Luvale": "Kuhuula"
    },
    "culture and customs": {
      "Icibemba": "Intambi na Imishitile",
      "Cinyanja": "Mwambo ndi Chikhalidwe",
      "Chitonga": "Zilengwa a Lutuko",
      "Silozi": "Siala ni Lizo",
      "Kiikaonde": "Kishila na Biyililu",
      "Lunda": "Chasemwa",
      "Luvale": "Chisemwa"
    },
    "proverbs and idioms": {
      "Icibemba": "Inshimi na Amapinda",
      "Cinyanja": "Miyambo ndi Miyetho",
      "Chitonga": "Tusumpyo a Tusenzya",
      "Silozi": "Lishitanguti",
      "Kiikaonde": "Jishima",
      "Lunda": "Jishima",
      "Luvale": "Jishima"
    },
    "translation": {
      "Icibemba": "Ukupilibula",
      "Cinyanja": "Kutanthauzira",
      "Chitonga": "Kusandulula",
      "Silozi": "Toloko / Ku toloka",
      "Kiikaonde": "Kwatula / Kwalula",
      "Lunda": "Kwalula",
      "Luvale": "Kwalula"
    },
    "literature": {
      "Icibemba": "Ilindi lya mabuku",
      "Cinyanja": "Mabuku a chuma",
      "Chitonga": "Mabuku mu lulimi",
      "Silozi": "Limbuka za puo",
      "Kiikaonde": "Mabuku a maambo",
      "Lunda": "Mabuku",
      "Luvale": "Mabuku"
    },
    "poetry": {
      "Icibemba": "Imishikakulo",
      "Cinyanja": "Nthano ndi Ndakatulo",
      "Chitonga": "Mwayi / Tusumpyo",
      "Silozi": "Liloko",
      "Kiikaonde": "Lwimbo / Mashiko",
      "Lunda": "Mwasu",
      "Luvale": "Mwasu"
    },
    "punctuation": {
      "Icibemba": "Ifishibilo fya ukubelenga",
      "Cinyanja": "Zizindikiro za kulemba",
      "Chitonga": "Zitondezyo mu kulemba",
      "Silozi": "Lisimbolwa za kuñola",
      "Kiikaonde": "Biyukilo my kunemba",
      "Lunda": "Yijikijilo",
      "Luvale": "Vijikijilo"
    }
  };

  const getZambianTopicTranslation = (topicTitle: string, zambianLang: string = 'Icibemba'): string => {
    if (!topicTitle) return '';
    const cleanTitle = topicTitle.replace(/^[0-9.]+\s*/, '').toLowerCase().trim();
    const langKey = zambianLang || 'Icibemba';

    for (const [key, map] of Object.entries(zambianTopicDictionary)) {
      if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
        if (map[langKey]) return map[langKey];
      }
    }

    if (cleanTitle.includes('read')) return zambianTopicDictionary['reading'][langKey] || 'Ukubelenga';
    if (cleanTitle.includes('write') || cleanTitle.includes('writing')) return zambianTopicDictionary['writing'][langKey] || 'Ukulemba';
    if (cleanTitle.includes('speak') || cleanTitle.includes('listen') || cleanTitle.includes('oral')) return zambianTopicDictionary['listening and speaking'][langKey] || 'Ukukutika no Ukulanda';
    if (cleanTitle.includes('word') || cleanTitle.includes('vocab')) return zambianTopicDictionary['vocabulary'][langKey] || 'Amashwi';
    if (cleanTitle.includes('event')) return zambianTopicDictionary['events'][langKey] || 'Ifisoolo';
    if (cleanTitle.includes('riddle')) return zambianTopicDictionary['riddles'][langKey] || 'Inshimi';
    if (cleanTitle.includes('play')) return zambianTopicDictionary['role play'][langKey] || 'Ukusungula';
    if (cleanTitle.includes('grammar') || cleanTitle.includes('struct')) return zambianTopicDictionary['structure'][langKey] || 'Imipangilwe';

    return '';
  };

  const formatTopicOptionDisplay = (tTitle: string, isZambian: boolean, lang: string) => {
    const stripped = stripPageNumbers(tTitle);
    if (!isZambian) return stripped;
    const trans = getZambianTopicTranslation(tTitle, lang);
    return trans ? `${stripped} — [${trans}]` : stripped;
  };

  const renderEnglishOptions = (topics: any[], baseLabel: string) => {
    if (!topics || topics.length === 0) return null;
    const options = topics.map((t, tIdx) => (
      <option key={`${baseLabel}-${t.title}-${tIdx}`} value={`${t.title}|${t.term || 'General'}`}>
        {stripPageNumbers(t.title)}
      </option>
    ));
    return [
      <option key={`header-${baseLabel}`} disabled className="font-extrabold text-slate-400 bg-slate-100 text-[10px] uppercase tracking-widest">
        --- {baseLabel} ---
      </option>,
      ...options
    ];
  };

  const renderTopicOptionsList = (syllabus: any[], customFormatFn?: (title: string) => string) => {
    if (!syllabus || !Array.isArray(syllabus)) return null;

    const isSpecial = 
      (formData.grade.includes('Grade 10') || formData.grade.includes('Grade 11') || formData.grade.includes('Grade 12')) &&
      (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('zambian'));

    if (isSpecial) {
      // Group the transformed topics by their component property
      const groups: Record<string, any[]> = {};
      syllabus.forEach(t => {
        const comp = t.component || "Other";
        if (!groups[comp]) {
          groups[comp] = [];
        }
        groups[comp].push(t);
      });

      return Object.entries(groups).map(([compName, topics]) => (
        <optgroup key={compName} label={compName} className="font-extrabold text-slate-900 bg-white">
          {topics.map((t, tIdx) => {
            const formatted = customFormatFn ? customFormatFn(t.title) : formatTopicOptionDisplay(t.title, isZambianLanguageSubject, formData.zambianLanguage || 'Icibemba');
            return (
              <option key={`${t.title}-${tIdx}`} value={t.title} className="font-normal text-slate-700">
                {formatted}
              </option>
            );
          })}
        </optgroup>
      ));
    }

    // Default simple map
    return syllabus.map((t, tIdx) => {
      const formatted = customFormatFn ? customFormatFn(t.title) : formatTopicOptionDisplay(t.title, isZambianLanguageSubject, formData.zambianLanguage || 'Icibemba');
      return (
        <option key={`${t.title}-${tIdx}`} value={t.title}>
          {formatted}
        </option>
      );
    });
  };

  const cleanKey = (s: string) => {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/\(page\s*\d+\)/gi, '')
      .replace(/continued/gi, '')
      .replace(/^[\d\.\s]+/, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const getSubtopicsForTopic = (topicTitle: string, syllabus?: any[]): any[] => {
    const data = syllabus || currentSyllabus;
    if (!topicTitle) return [];
    
    let searchTitle = topicTitle;
    let searchTerm = "";
    if (topicTitle.includes('|')) {
      const parts = topicTitle.split('|');
      searchTitle = parts[0];
      searchTerm = parts[1];
    }

    const targetClean = cleanKey(searchTitle);
    if (!targetClean) return [];

    let topic = data ? data.find((t: any) => 
      cleanKey(t.title) === targetClean && 
      (searchTerm ? t.term === searchTerm : true)
    ) : null;

    if (!topic && data) {
      topic = data.find((t: any) => {
        const k = cleanKey(t.title);
        return k && (k.includes(targetClean) || targetClean.includes(k));
      });
    }

    if (!topic && (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english')) {
      const eng = getEnglishTopics();
      const candidates = [...(eng.oral || []), ...(eng.literacy || [])];
      topic = candidates.find((t: any) => {
        const k = cleanKey(t.title);
        return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
      });
    }

    if (topic && (!topic.subtopics || topic.subtopics.length === 0)) {
      const cleanTitle = topic.title.replace(/^\d+(\.\d+)*\s*/, '').trim();
      const numPrefix = topic.title.match(/^\d+(\.\d+)*/)?.[0] || '1.1';
      return [
        {
          title: `${numPrefix}.1 Fundamental Principles & Key Concepts of ${cleanTitle}`,
          competencies: [`Specific Competency: ${numPrefix}.1.1 Understand key principles and theoretical concepts of ${cleanTitle}`],
          learningActivities: [`Analyzing core principles, definitions, and applications of ${cleanTitle}`]
        },
        {
          title: `${numPrefix}.2 Practical Applications & Problem Solving in ${cleanTitle}`,
          competencies: [`Specific Competency: ${numPrefix}.2.1 Apply concepts of ${cleanTitle} to real-world scenarios and problem sets`],
          learningActivities: [`Conducting practical exercises, case studies, and problem-solving activities for ${cleanTitle}`]
        }
      ];
    }

    return topic?.subtopics || [];
  };

  const generateCompetenciesFromLabel = (_label: string): string[] => {
    // Generic competency generator is completely disabled to enforce 100% authentic syllabus data
    return [];
  };

  const getAllCompetenciesForTopic = (topicTitle: string, syllabus?: any[]): string[] => {
    if (!topicTitle) return [];

    let rawTopic = topicTitle;
    if (rawTopic.includes('|')) {
      rawTopic = rawTopic.split('|')[0];
    }
    const cleanTopic = cleanKey(rawTopic);
    if (!cleanTopic) return [];

    const candidateSyllabi: any[][] = [];
    if (syllabus && Array.isArray(syllabus)) candidateSyllabi.push(syllabus);
    if (currentSyllabus && Array.isArray(currentSyllabus)) candidateSyllabi.push(currentSyllabus);

    const isEngGr12 = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) &&
      formData.subject.toLowerCase().includes('english');
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      if (SYLLABI['Grade 1 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 1 (CBC)']['English']);
      if (SYLLABI['Grade 2 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 2 (CBC)']['English']);
    }

    const collectedComps: string[] = [];
    for (const sylData of candidateSyllabi) {
      if (!Array.isArray(sylData)) continue;
      for (const t of sylData) {
        const tClean = cleanKey(t.title || '');
        if (tClean === cleanTopic || tClean.includes(cleanTopic) || cleanTopic.includes(tClean)) {
          if (Array.isArray(t.subtopics)) {
            for (const st of t.subtopics) {
              if (Array.isArray(st.competencies) && st.competencies.length > 0) {
                collectedComps.push(...st.competencies);
              }
            }
          }
        }
      }
    }

    const uniqueComps = Array.from(new Set(collectedComps)).filter(Boolean);
    if (uniqueComps.length > 0) return uniqueComps;

    // Fallback if topic subtopics don't specify explicit competencies
    return generateCompetenciesFromLabel(rawTopic);
  };

  const getSubtopicObject = (topicTitle: string, subtopicTitle: string, syllabus?: any[]): any | null => {
    const data = syllabus || currentSyllabus;
    if (!topicTitle || !subtopicTitle) return null;
    
    let searchTitle = topicTitle;
    if (topicTitle.includes('|')) {
      searchTitle = topicTitle.split('|')[0];
    }
    const targetClean = cleanKey(searchTitle);
    const subClean = cleanKey(subtopicTitle);
    
    if (!data || !Array.isArray(data)) return null;
    
    const topic = data.find((t: any) => {
      const k = cleanKey(t.title);
      return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
    });
    
    if (topic && Array.isArray(topic.subtopics)) {
      return topic.subtopics.find((st: any) => {
        const k = cleanKey(st.title);
        return k && (k === subClean || k.includes(subClean) || subClean.includes(k));
      }) || null;
    }
    
    return null;
  };

  const getCompetenciesForSubtopic = (topicTitle: string, subtopicTitle: string, syllabus?: any[]): string[] => {
    let rawTopic = topicTitle || '';
    if (rawTopic.includes('|')) {
      rawTopic = rawTopic.split('|')[0];
    }
    const cleanTopic = cleanKey(rawTopic);
    const subTrimmed = (subtopicTitle || '').trim();
    const cleanSubtopic = cleanKey(subTrimmed);

    const candidateSyllabi: any[][] = [];
    if (syllabus && Array.isArray(syllabus)) candidateSyllabi.push(syllabus);
    if (currentSyllabus && Array.isArray(currentSyllabus)) candidateSyllabi.push(currentSyllabus);

    const isEngGr12 = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) &&
      formData.subject.toLowerCase().includes('english');
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      if (SYLLABI['Grade 1 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 1 (CBC)']['English']);
      if (SYLLABI['Grade 2 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 2 (CBC)']['English']);
    }

    let foundComps: string[] = [];

    if (cleanSubtopic) {
      // Step 1: Match subtopic directly in candidate syllabi under topic
      for (const sylData of candidateSyllabi) {
        if (!Array.isArray(sylData)) continue;
        for (const t of sylData) {
          const tClean = cleanKey(t.title || '');
          if (!cleanTopic || tClean === cleanTopic || tClean.includes(cleanTopic) || cleanTopic.includes(tClean)) {
            if (Array.isArray(t.subtopics)) {
              for (const st of t.subtopics) {
                const stClean = cleanKey(st.title || '');
                if (stClean === cleanSubtopic || stClean.includes(cleanSubtopic) || cleanSubtopic.includes(stClean)) {
                  if (Array.isArray(st.competencies) && st.competencies.length > 0) {
                    foundComps = st.competencies;
                    break;
                  }
                }
              }
            }
          }
          if (foundComps.length > 0) break;
        }
        if (foundComps.length > 0) break;
      }

      // Step 2: Global search across subtopics without topic constraint
      if (foundComps.length === 0) {
        for (const sylData of candidateSyllabi) {
          if (!Array.isArray(sylData)) continue;
          for (const t of sylData) {
            if (Array.isArray(t.subtopics)) {
              for (const st of t.subtopics) {
                const stClean = cleanKey(st.title || '');
                if (stClean === cleanSubtopic || stClean.includes(cleanSubtopic) || cleanSubtopic.includes(stClean)) {
                  if (Array.isArray(st.competencies) && st.competencies.length > 0) {
                    foundComps = st.competencies;
                    break;
                  }
                }
              }
            }
            if (foundComps.length > 0) break;
          }
          if (foundComps.length > 0) break;
        }
      }

      // Step 3: Match by numerical sequence prefix
      if (foundComps.length === 0) {
        const codeMatch = subTrimmed.match(/^(\d+(?:\.\d+)+)/);
        const allTopicComps = rawTopic ? getAllCompetenciesForTopic(rawTopic, syllabus) : [];
        if (codeMatch && allTopicComps.length > 0) {
          const subCode = codeMatch[1];
          const codeMatched = allTopicComps.filter(c => {
            const cTrim = c.trim();
            return cTrim.startsWith(subCode + ".") || 
                   cTrim.startsWith(subCode + " ") || 
                   cTrim.includes(`Specific Competency: ${subCode}`) || 
                   cTrim.includes(`Specific Outcome: ${subCode}`) ||
                   cTrim.startsWith(subCode);
          });
          if (codeMatched.length > 0) {
            foundComps = codeMatched;
          }
        }
      }

      // Step 4: Filter topic competencies by key terms
      if (foundComps.length === 0) {
        const allTopicComps = rawTopic ? getAllCompetenciesForTopic(rawTopic, syllabus) : [];
        if (allTopicComps.length > 0) {
          const keywords = cleanSubtopic.replace(/\d+/g, '').trim().split(/\s+/).filter(w => w.length > 3);
          if (keywords.length > 0) {
            const keywordMatched = allTopicComps.filter(c => {
              const cLower = c.toLowerCase();
              return keywords.some(kw => cLower.includes(kw));
            });
            if (keywordMatched.length > 0) {
              foundComps = keywordMatched;
            }
          }
        }
      }

      if (foundComps.length === 0) {
        foundComps = generateCompetenciesFromLabel(subtopicTitle);
      }
    } else if (rawTopic) {
      const topicComps = getAllCompetenciesForTopic(rawTopic, syllabus);
      if (topicComps.length > 0) {
        foundComps = topicComps;
      }
    }

    if (foundComps.length === 0) {
      const label = subtopicTitle || rawTopic;
      foundComps = generateCompetenciesFromLabel(label);
    }

    // MANDATORY SANITIZATION: Clean every competency string to ONLY include the brief competency statement!
    const cleaned = foundComps.map(c => parseRawCompetency(c).briefCompetency).filter(Boolean);
    return Array.from(new Set(cleaned));
  };

  const getExpectedStandardsForSubtopic = (topicTitle: string, subtopicTitle: string, syllabus?: any[]): string[] => {
    const subtopics = getSubtopicsForTopic(topicTitle, syllabus);
    if (!subtopics || !subtopicTitle) return [];
    const targetClean = cleanKey(subtopicTitle);
    
    const subtopic = subtopics.find((st: any) => {
      const k = cleanKey(st.title);
      return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
    });

    const standards: string[] = [];
    if (subtopic?.expectedStandard) {
      if (Array.isArray(subtopic.expectedStandard)) {
        standards.push(...subtopic.expectedStandard);
      } else if (typeof subtopic.expectedStandard === 'string') {
        standards.push(subtopic.expectedStandard);
      }
    }

    if (subtopic?.competencies && Array.isArray(subtopic.competencies)) {
      const embedded = extractEmbeddedExpectedStandards(subtopic.competencies);
      if (embedded.length > 0) {
        standards.push(...embedded);
      }
    }

    return Array.from(new Set(standards.map(s => s.trim()))).filter(Boolean);
  };

  const formatActivities = (activities: string[]): string[] => {
    if (!Array.isArray(activities) || activities.length === 0) return [];
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const result: string[] = [];
    const seen = new Set<string>();

    activities.forEach((act, idx) => {
      const trimmed = act.trim();
      if (!trimmed) return;
      if (seen.has(trimmed.toLowerCase())) return;
      seen.add(trimmed.toLowerCase());

      const hasPrefix = /^(learning\s*activity\s*|activity\s*)?(\d+\s*[\.\s]*[a-z]?|[a-z][\.\)]|\d+[\.\)])\s*/i.test(trimmed);
      if (hasPrefix) {
        result.push(trimmed);
      } else {
        const letter = letters[idx % letters.length] || 'a';
        result.push(`Activity 1${letter}: ${trimmed}`);
      }
    });

    return result;
  };

  const generateActivitiesFromLabel = (_label: string): string[] => {
    // Generic activity generator is completely disabled to enforce 100% authentic syllabus data
    return [];
  };

  const getActivitiesForSubtopic = (topicTitle: string, subtopicTitle: string, competencyTitle?: string, syllabus?: any[], grade?: string, subject?: string): string[] => {
    let rawTopic = topicTitle || '';
    if (rawTopic.includes('|')) {
      rawTopic = rawTopic.split('|')[0];
    }
    const cleanTopic = cleanKey(rawTopic);
    const cleanSubtopic = cleanKey(subtopicTitle || '');

    const targetGrade = grade || formData.grade || '';
    const targetSubject = subject || formData.subject || '';

    const candidateSyllabi: any[][] = [];
    if (syllabus && Array.isArray(syllabus)) candidateSyllabi.push(syllabus);
    if (currentSyllabus && Array.isArray(currentSyllabus)) candidateSyllabi.push(currentSyllabus);

    const isEngGr12 = (targetGrade.includes('Grade 1') || targetGrade.includes('Grade 2')) &&
      targetSubject.toLowerCase().includes('english');
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      if (SYLLABI['Grade 1 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 1 (CBC)']['English']);
      if (SYLLABI['Grade 2 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 2 (CBC)']['English']);
    }

    if (SYLLABI[targetGrade]?.[targetSubject]) {
      candidateSyllabi.push(SYLLABI[targetGrade][targetSubject]);
    }

    const selectedComps = competencyTitle
      ? competencyTitle.split('\n').map(c => c.trim()).filter(Boolean)
      : [];

    const getMatchingActivitiesForSubtopic = (st: any): string[] => {
      let explicitActs: string[] = [];
      if (st.learningActivities) {
        if (!Array.isArray(st.learningActivities) && typeof st.learningActivities === 'object') {
          if (selectedComps.length > 0) {
            const matchedActs: string[] = [];
            selectedComps.forEach(comp => {
              const compClean = cleanKey(comp);
              const matchedKey = Object.keys(st.learningActivities).find(k => {
                const keyClean = cleanKey(k);
                return keyClean && (keyClean === compClean || keyClean.includes(compClean) || compClean.includes(keyClean));
              });
              if (matchedKey && Array.isArray(st.learningActivities[matchedKey])) {
                matchedActs.push(...st.learningActivities[matchedKey]);
              } else {
                const compWords = compClean.split(/\s+/).filter(w => w.length > 3);
                const fallbackKey = Object.keys(st.learningActivities).find(k => {
                  const keyClean = cleanKey(k);
                  return compWords.length > 0 && compWords.every(w => keyClean.includes(w));
                });
                if (fallbackKey && Array.isArray(st.learningActivities[fallbackKey])) {
                  matchedActs.push(...st.learningActivities[fallbackKey]);
                } else {
                  const firstKey = Object.keys(st.learningActivities)[0];
                  if (firstKey && Array.isArray(st.learningActivities[firstKey])) {
                    matchedActs.push(...st.learningActivities[firstKey]);
                  }
                }
              }
            });
            explicitActs = matchedActs;
          } else {
            explicitActs = Object.values(st.learningActivities).flat() as string[];
          }
        } else if (Array.isArray(st.learningActivities) && st.learningActivities.length > 0) {
          if (st.learningActivities.every((act: any) => typeof act === 'string')) {
            explicitActs = st.learningActivities;
          } else if (selectedComps.length > 0 && Array.isArray(st.competencies)) {
            const matchedActs: string[] = [];
            selectedComps.forEach(comp => {
              const compClean = cleanKey(comp);
              const idx = st.competencies.findIndex((c: string) => {
                const cClean = cleanKey(c);
                return cClean && (cClean === compClean || cClean.includes(compClean) || compClean.includes(cClean));
              });

              if (idx !== -1) {
                if (idx < st.learningActivities.length) {
                  const actVal = st.learningActivities[idx];
                  if (Array.isArray(actVal)) matchedActs.push(...actVal);
                  else if (typeof actVal === 'string') matchedActs.push(actVal);
                } else {
                  const fallbackIdx = idx % st.learningActivities.length;
                  const actVal = st.learningActivities[fallbackIdx];
                  if (Array.isArray(actVal)) matchedActs.push(...actVal);
                  else if (typeof actVal === 'string') matchedActs.push(actVal);
                }
              } else {
                const compWords = compClean.split(/\s+/).filter(w => w.length > 3);
                const bestMatch = st.learningActivities.find((act: any) => {
                  if (typeof act === 'string') {
                    const actClean = cleanKey(act);
                    return compWords.length > 0 && compWords.every(w => actClean.includes(w));
                  }
                  return false;
                });
                if (bestMatch) {
                  matchedActs.push(bestMatch);
                } else {
                  const actVal = st.learningActivities[0];
                  if (actVal) {
                    if (Array.isArray(actVal)) matchedActs.push(...actVal);
                    else matchedActs.push(actVal);
                  }
                }
              }
            });
            explicitActs = matchedActs;
          } else {
            explicitActs = st.learningActivities.flat();
          }
        }
      }

      // Check embedded learning activities inside st.competencies if explicit list is empty
      if (explicitActs.length === 0 && Array.isArray(st.competencies)) {
        const embedded = extractEmbeddedLearningActivities(st.competencies);
        if (embedded.length > 0) {
          explicitActs = embedded;
        }
      }

      return formatActivities(explicitActs);
    };

    // Step 1: Match topic + subtopic in candidate syllabi
    for (const sylData of candidateSyllabi) {
      if (!Array.isArray(sylData)) continue;
      for (const t of sylData) {
        const tClean = cleanKey(t.title || '');
        if (!cleanTopic || tClean === cleanTopic || tClean.includes(cleanTopic) || cleanTopic.includes(tClean)) {
          if (Array.isArray(t.subtopics)) {
            for (const st of t.subtopics) {
              const stClean = cleanKey(st.title || '');
              if (stClean === cleanSubtopic || stClean.includes(cleanSubtopic) || cleanSubtopic.includes(stClean)) {
                const acts = getMatchingActivitiesForSubtopic(st);
                if (acts.length > 0) return acts;
              }
            }
          }
        }
      }
    }

    // Step 2: Global search across subtopics without topic constraint
    if (cleanSubtopic) {
      for (const sylData of candidateSyllabi) {
        if (!Array.isArray(sylData)) continue;
        for (const t of sylData) {
          if (Array.isArray(t.subtopics)) {
            for (const st of t.subtopics) {
              const stClean = cleanKey(st.title || '');
              if (stClean === cleanSubtopic || stClean.includes(cleanSubtopic) || cleanSubtopic.includes(stClean)) {
                const acts = getMatchingActivitiesForSubtopic(st);
                if (acts.length > 0) return acts;
              }
            }
          }
        }
      }
    }

    // Step 3: Smart generated activities for subtopic/topic
    return generateActivitiesFromLabel(subtopicTitle || rawTopic);
  };

  const handleForecastDaysChange = (num: number) => {
    setFormData(prev => {
      const currentDays = prev.forecastDays || [];
      let newDays = [...currentDays];
      
      if (num > currentDays.length) {
        // Add days
        const daysToAdd = num - currentDays.length;
        const addedDays = Array.from({ length: daysToAdd }, (_, i) => ({
          day: (currentDays.length + i + 1).toString(),
          topic: '',
          subtopic: '',
          competency: '',
          activities: ['', '', '', ''],
          expectedStandard: ''
        }));
        newDays = [...newDays, ...addedDays];
      } else if (num < currentDays.length) {
        // Remove days
        newDays = newDays.slice(0, num);
      }
      
      return { ...prev, forecastDays: newDays };
    });
  };

  const handleMagicFill = async () => {
    if (!formData.grade || !formData.subject) {
      toast.error("Please select a Grade and Subject first");
      return;
    }

    setIsFilling(true);
    try {
      const targetGrade = formData.grade;
      const isEnglishGr2Term3 = targetGrade.includes('Grade 2') && 
                             formData.term === '3' &&
                             formData.subject.toLowerCase().includes('english') && 
                             formData.englishCombined;

      const isEnglishGr12Combined = (targetGrade.includes('Grade 1') || targetGrade.includes('Grade 2')) && 
                             formData.subject.toLowerCase().includes('english') && 
                             formData.englishCombined;

      const isECE = targetGrade.toLowerCase().includes('ece');
      const eceBreakWeek = formData.eceMidTermBreakWeek || 7;
      const specialWeeks = isECE ? [eceBreakWeek, 12, 13] : [4, 8, 12, 13];
      const numWeeks = formData.weeks?.length || 13;
      const teachingWeeksCount = numWeeks - specialWeeks.filter(w => w <= numWeeks).length;
      
      let oralSequence: any[] = [];
      let literacySequence: any[] = [];
      let mainSequence: any[] = [];

      if (isEnglishGr12Combined) {
        setProgressText("Preparing combined curriculum data...");
        const oralTopicsRaw = getEnglishTopics().oral;
        const literacyTopicsRaw = getEnglishTopics().literacy;

        // Exhaustive subtopic extraction
        const oralSubtopicsFlattened: any[] = [];
        oralTopicsRaw.forEach((t: any) => {
          const tTitle = stripPageNumbers(t.topic);
          if (Array.isArray(t.subtopics)) {
            t.subtopics.forEach((st: any) => {
              const sTitle = stripPageNumbers(st);
              const comps = getCompetenciesForSubtopic(tTitle, sTitle, oralTopicsRaw);
              const firstComp = comps[0] || '';
              const acts = getActivitiesForSubtopic(tTitle, sTitle, firstComp, oralTopicsRaw);
              oralSubtopicsFlattened.push({
                topic: tTitle,
                subtopic: sTitle,
                competency: firstComp,
                activity: acts.join('; ')
              });
            });
          }
        });

        const literacySubtopicsFlattened: any[] = [];
        literacyTopicsRaw.forEach((t: any) => {
          const tTitle = stripPageNumbers(t.topic);
          if (Array.isArray(t.subtopics)) {
            t.subtopics.forEach((st: any) => {
              const sTitle = stripPageNumbers(st);
              const comps = getCompetenciesForSubtopic(tTitle, sTitle, literacyTopicsRaw);
              const firstComp = comps[0] || '';
              const acts = getActivitiesForSubtopic(tTitle, sTitle, firstComp, literacyTopicsRaw);
              literacySubtopicsFlattened.push({
                topic: tTitle,
                subtopic: sTitle,
                competency: firstComp,
                activity: acts.join('; ')
              });
            });
          }
        });

        const teachingWeeks = formData.weeks?.filter(w => !specialWeeks.includes(w.week)) || [];
        const numTeachingWeeks = teachingWeeks.length || 1;

        const distributeSequential = (items: any[], nWeeks: number) => {
          const chunks: any[][] = Array.from({ length: nWeeks }, () => []);
          const perWeek = Math.floor(items.length / nWeeks);
          let extra = items.length % nWeeks;
          let ptr = 0;
          for (let i = 0; i < nWeeks; i++) {
            const count = perWeek + (extra > 0 ? 1 : 0);
            chunks[i] = items.slice(ptr, ptr + count);
            ptr += count;
            if (extra > 0) extra--;
          }
          return chunks;
        };

        const oralChunks = distributeSequential(oralSubtopicsFlattened, numTeachingWeeks);
        const literacyChunks = distributeSequential(literacySubtopicsFlattened, numTeachingWeeks);

        let teachingIdx = 0;
        const newWeeks = formData.weeks?.map(w => {
          if (specialWeeks.includes(w.week)) {
            if (w.week === 12) return { ...w, topic: 'REVISIONS', subtopics: ['Termly Revision'], competencies: ['Consolidate termly learning'], activities: ['Reviewing all topics taught in the term'] };
            if (w.week === 13) return { ...w, topic: 'END OF TERM TEST', subtopics: ['Terminal Assessment'], competencies: ['Demonstrate termly achievement'], activities: ['Writing end of term examination'] };
            if (w.week === 4 || w.week === 8) return { ...w, topic: 'MONTHLY ASSESSMENT', subtopics: ['Continuous Assessment'], competencies: ['Evaluate monthly progress'], activities: ['Answering assessment questions'] };
            return w;
          }

          const myOral = oralChunks[teachingIdx];
          const myLit = literacyChunks[teachingIdx];
          teachingIdx++;

          const weekSubtopics: string[] = [];
          const weekCompetencies: string[] = [];
          const weekActivities: string[] = [];
          
          const weekTopic1 = myOral?.[0]?.topic || '';
          const weekTopic2 = myLit?.[0]?.topic || '';

          const oralCount = isEnglishGr2Term3 ? 2 : 3;
          const litCount = 5 - oralCount;

          // Distribute oral items into the slots
          for (let i = 0; i < oralCount; i++) {
            if (myOral && myOral[i]) {
              weekSubtopics.push(myOral[i].subtopic);
              weekCompetencies.push(myOral[i].competency);
              weekActivities.push(myOral[i].activity);
            } else {
              weekSubtopics.push('');
              weekCompetencies.push('');
              weekActivities.push('');
            }
          }

          // If there are leftover oral items, append them to the last oral slot
          if (myOral && myOral.length > oralCount) {
            for (let i = oralCount; i < myOral.length; i++) {
              weekSubtopics[oralCount - 1] += `; ${myOral[i].subtopic}`;
              weekCompetencies[oralCount - 1] += `; ${myOral[i].competency}`;
              weekActivities[oralCount - 1] += `; ${myOral[i].activity}`;
            }
          }

          // Distribute literacy items into the slots
          for (let i = 0; i < litCount; i++) {
            if (myLit && myLit[i]) {
              weekSubtopics.push(myLit[i].subtopic);
              weekCompetencies.push(myLit[i].competency);
              weekActivities.push(myLit[i].activity);
            } else {
              weekSubtopics.push('');
              weekCompetencies.push('');
              weekActivities.push('');
            }
          }

          // If there are leftover literacy items, append them to the last literacy slot
          if (myLit && myLit.length > litCount) {
            for (let i = litCount; i < myLit.length; i++) {
              weekSubtopics[4] += `; ${myLit[i].subtopic}`;
              weekCompetencies[4] += `; ${myLit[i].competency}`;
              weekActivities[4] += `; ${myLit[i].activity}`;
            }
          }

          return {
            ...w,
            topic: weekTopic1 || weekTopic2,
            topic2: weekTopic2 || weekTopic1,
            subtopics: weekSubtopics,
            competencies: weekCompetencies,
            activities: weekActivities
          };
        });
        setFormData(prev => ({ ...prev, weeks: newWeeks }));
        setIsFilling(false);
        toast.success("Scheme auto-filled successfully!");
        return;
      } else {
        const effectiveStartTopic = formData.topic || (formData.weeks && formData.weeks[0]?.topic) || '';
        setProgressText("Fetching syllabus sequence...");
        mainSequence = await getTermlySchemeSequence(
          formData.grade,
          formData.subject,
          formData.term || '1',
          formData.year || '2024',
          teachingWeeksCount,
          currentSyllabus,
          formData.stoppingTopic,
          effectiveStartTopic
        );
      }

      setFormData(prev => {
        let teachingIndex = 0;
        const newWeeks = prev.weeks?.map(w => {
          if (specialWeeks.includes(w.week)) {
            return w; // Keep special weeks as they are
          }

          const syllabusItem = mainSequence[teachingIndex++];
          if (syllabusItem) {
            const mainTopic = stripPageNumbers(syllabusItem.topic);
            const subs = (Array.isArray(syllabusItem.subtopics) && syllabusItem.subtopics.length > 0 
              ? syllabusItem.subtopics 
              : [syllabusItem.subtopics?.[0] || '']).map((s: string) => stripPageNumbers(s));
            
            const comps = subs.map(s => {
              const c = getCompetenciesForSubtopic(mainTopic, s, currentSyllabus);
              return c[0] || '';
            });

            const acts = subs.map((s, si) => {
              const a = getActivitiesForSubtopic(mainTopic, s, comps[si], currentSyllabus);
              return a.join('; ');
            });

            return {
              ...w,
              topic: mainTopic,
              subtopics: subs,
              competencies: comps,
              activities: acts
            };
          }
          return w;
        });

        return { ...prev, weeks: newWeeks };
      });

      toast.success("Scheme auto-filled successfully!");
    } catch (error) {
      console.error("Magic Fill error:", error);
      toast.error("Failed to auto-fill. Please try again.");
    } finally {
      setIsFilling(false);
      setProgressText("Initializing...");
    }
  };

  const renderGeneralRegistrationSection = () => {
    const isRegistered = !!(formData.teacherName || formData.school || formData.tsNumber);

    return (
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 mb-6 border border-slate-800">
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
                {isRegistered && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Registered Profile
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                {isRegistered 
                  ? `Registered Profile: ${formData.teacherName || 'Teacher'} • TS: ${formData.tsNumber || 'N/A'} • ${formData.school || 'School'} (${formData.district || 'District'} District, ${formData.zone || 'Zone'} Zone)${isIWP ? `${formData.jobTitle ? ` • ${formData.jobTitle}` : ''} • Period: ${formData.workPlanPeriodStart || 'JANUARY'} TO ${formData.workPlanPeriodEnd || 'DECEMBER'} • Year: ${formData.year || '2026'}${!isAdmin && formData.grade ? ` • Grade: ${formData.grade}` : ''}` : ''}` 
                  : "Register teacher & school details once to auto-fill across all documents."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsGeneralProfileExpanded(!isGeneralProfileExpanded)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {isGeneralProfileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isGeneralProfileExpanded ? "Hide Registration" : isRegistered ? "✏️ Edit Profile" : "Register Profile"}
            </button>
            {isRegistered && (
              <button
                type="button"
                onClick={handleResetGeneralProfile}
                className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
                title="Reset details for 2nd/3rd party beneficiary"
              >
                <RotateCcw size={14} />
                Reset & Re-register
              </button>
            )}
          </div>
        </div>

        {isGeneralProfileExpanded && (
          <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher's Name</label>
                <input
                  type="text"
                  name="teacherName"
                  value={formData.teacherName || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Fortune Kombe"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TS Number</label>
                <input
                  type="text"
                  name="tsNumber"
                  value={formData.tsNumber || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. TS/123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Name</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Adastra Primary School"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">District Name</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Choma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone Name</label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Central Zone"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Additional IWP Specific General Parameters inside General Registration Header */}
              {isIWP && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PERIOD FROM</label>
                    <select
                      value={formData.workPlanPeriodStart || 'JANUARY'}
                      onChange={(e) => setFormData(prev => ({ ...prev, workPlanPeriodStart: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PERIOD TO</label>
                    <select
                      value={formData.workPlanPeriodEnd || 'DECEMBER'}
                      onChange={(e) => setFormData(prev => ({ ...prev, workPlanPeriodEnd: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">YEAR</label>
                    <select 
                      name="year" 
                      value={formData.year} 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
              {isIWP && renderUserGradeTrackers()}
              <button
                type="button"
                onClick={handleSaveGeneralProfile}
                className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer ml-auto"
              >
                <CheckCircle2 size={14} /> Save & Register Profile
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGeneralInfoForm = (compact = false) => {
    if (isIWP) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">JOB PURPOSE</label>
            <textarea 
              name="jobPurpose" 
              value={formData.jobPurpose} 
              onChange={handleInputChange} 
              placeholder="Enter job purpose..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm" 
              rows={2} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">INCLUDE ANNUAL WORK PLAN?</label>
            <select 
              value={formData.includeAnnualWorkPlan ? "yes" : "no"}
              onChange={(e) => setFormData(prev => ({ ...prev, includeAnnualWorkPlan: e.target.value === 'yes' }))}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all focus:bg-white shadow-sm"
            >
              <option value="yes">YES - Include Annual Schedule</option>
              <option value="no">NO - Work Plan Summary Only</option>
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("space-y-6", compact && "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm")}>
        {compact && (
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Info size={18} />
            </div>
            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Document Settings</h4>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TERM</label>
            <select name="term" value={formData.term} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm">
              {formData.type === 'individual_work_plan' ? (
                <option value="TERM 1 - TERM 3">Term 1 - Term 3</option>
              ) : (
                <>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TERM START DATE</label>
            <input 
              type="text" 
              name="termStartDate" 
              value={formData.termStartDate || '07-09-2026'} 
              onChange={handleInputChange} 
              placeholder="e.g. 07-09-2026"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">YEAR</label>
            <select 
              name="year" 
              value={formData.year} 
              onChange={handleInputChange} 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {!isAdmin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">GRADE</label>
              <select 
                name="grade" 
                value={formData.grade} 
                disabled={isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades.length === 1}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    grade: newGrade, 
                    subject: '', 
                    topic: '', 
                    subtopic: '',
                    weeks: getDefaultWeeks(newGrade, prev.weeks?.length || 13, prev.eceMidTermBreakWeek || 7)
                  }));
                }} 
                className={cn(
                  "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm",
                  (isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades.length === 1) && "opacity-75 bg-slate-100 border-dashed border-[#00A86B]/30 cursor-not-allowed"
                )}
              >
                <option value="">Select grade...</option>
                {(() => {
                  if (isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades && registeredGrades.length > 0) {
                    const cbcAllocated = registeredGrades.filter(g => g !== 'all' && !g.toLowerCase().includes('(obc)'));
                    const obcAllocated = registeredGrades.filter(g => g !== 'all' && g.toLowerCase().includes('(obc)'));

                    if (curriculumType === 'OBC') {
                      return (
                        <>
                          {obcAllocated.length > 0 ? (
                            <optgroup label="ALLOCATED OBC LEVELS">
                              {obcAllocated.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </optgroup>
                          ) : (
                            <option disabled value="">No OBC grades allocated to you</option>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <>
                          {cbcAllocated.length > 0 ? (
                            <optgroup label="ALLOCATED CBC GRADES">
                              {cbcAllocated.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </optgroup>
                          ) : (
                            <option disabled value="">No CBC grades allocated to you</option>
                          )}
                        </>
                      );
                    }
                  }
                  
                  const cbcGrades = GRADES.filter(g => !g.toLowerCase().includes('(obc)') && !g.toLowerCase().includes('grade 7'));
                  const obcGrades = OBC_LEVELS;

                  return (
                    <>
                      {curriculumType === 'CBC' ? (
                        <optgroup label="CBC">
                          {cbcGrades.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </optgroup>
                      ) : (
                        <optgroup label="OBC">
                          {obcGrades.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
              {renderUserGradeTrackers()}
            </div>
          )}

          {/* English Preparation Mode buttons removed as requested. Combined/Separate logic now handled via Subject dropdown. */}
            
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SUBJECT</label>
            <select 
              name="subject" 
              value={formData.subject} 
              onChange={(e) => {
                const newSubject = e.target.value;
                handleInputChange(e);
                setFormData(prev => {
                  const isGrade12 = prev.grade?.includes('Grade 1') || prev.grade?.includes('Grade 2');
                  const sLowVal = newSubject.toLowerCase();
                  const isLiteracy = sLowVal.includes('literacy');
                  const isOral = sLowVal.includes('oral');
                  const isCombinedEnglish = (sLowVal.includes('english') || sLowVal.includes('combined')) && !isLiteracy && !isOral;

                  return { 
                    ...prev, 
                    subject: newSubject,
                    topic: '', 
                    subtopic: '',
                    englishCombined: isGrade12 && isCombinedEnglish,
                    englishComponent: isLiteracy ? 'literacy' : (isOral ? 'oral' : (isCombinedEnglish ? 'combined' : prev.englishComponent))
                  };
                });
                if (typeof setBatchForecasts === 'function') {
                  setBatchForecasts(prev => prev.map(f => ({ ...f, subject: newSubject })));
                }
              }} 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm"
            >
              <option value="">Select subject...</option>
              {getAvailableSubjects(formData.grade || 'Grade 1').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {(formData.grade?.includes('Grade 1') || formData.grade?.includes('Grade 2')) && formData.subject?.toLowerCase().includes('english') && (
          <div className="col-span-2 space-y-3 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300">
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-700">English Language Forecast Layout Selection</label>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Grade 1 & 2 English lessons can be prepared as a single combined subject or separate components. Choose how you want to compile and synchronize your weekly forecast:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors flex-1 shadow-sm">
                <input
                  type="radio"
                  name="englishCombinedOption"
                  checked={formData.englishCombined === true}
                  onChange={() => {
                    setFormData(prev => ({
                      ...prev,
                      englishCombined: true,
                      englishComponent: 'combined'
                    }));
                    toast.success("Set weekly forecast format to Combined English (Oral + Literacy)!");
                  }}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-800">Combine Weekly Forecast</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">Merges Oral English (Days 1-3) & Literacy in English (Days 4-5)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors flex-1 shadow-sm">
                <input
                  type="radio"
                  name="englishCombinedOption"
                  checked={formData.englishCombined === false}
                  onChange={() => {
                    setFormData(prev => ({
                      ...prev,
                      englishCombined: false,
                      englishComponent: prev.englishComponent === 'combined' ? 'oral' : prev.englishComponent
                    }));
                    toast.success("Set weekly forecast format to Separate Components!");
                  }}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-800">Separate Component Forecast</span>
                  <span className="text-[10px] text-slate-400 font-normal mt-0.5">Generate or sync for either Oral English or Literacy in English separately</span>
                </div>
              </label>
            </div>

            {!formData.englishCombined && (
              <div className="mt-3 bg-white p-3 border border-slate-100 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active English Component to Display & Sync</label>
                <div className="flex gap-4">
                  {[
                    { key: 'oral', label: 'Oral English (Days 1-3)' },
                    { key: 'literacy', label: 'Literacy in English (Days 4-5)' }
                  ].map((comp) => (
                    <label key={comp.key} className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="englishComponentSelect"
                        checked={formData.englishComponent === comp.key}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            englishComponent: comp.key
                          }));
                          toast.success(`Selected active component: ${comp.label}`);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      {comp.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}     
            {formData.grade && formData.grade.toLowerCase().includes('ece') && (
              <div className="col-span-2 space-y-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-700">ECE Mid-Term Break Week Choice</label>
                <div className="flex gap-6">
                  {[6, 7].map((wk) => (
                    <label key={wk} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="eceMidTermBreak"
                        checked={(formData.eceMidTermBreakWeek || 7) === wk}
                        onChange={() => {
                          setFormData(prev => {
                            const updatedWeeks = prev.weeks?.map(w => {
                              // If it was the old break week, make it empty/normal
                              const oldBreak = prev.eceMidTermBreakWeek || 7;
                              if (w.week === oldBreak) {
                                return { ...w, topic: '' };
                              }
                              // If it is the new break week, make it Mid Term Break
                              if (w.week === wk) {
                                return { ...w, topic: 'Mid Term Break (Learners resting at home)' };
                              }
                              return w;
                            });
                            return {
                              ...prev,
                              eceMidTermBreakWeek: wk,
                              weeks: updatedWeeks
                            };
                          });
                          toast.success(`Mid-Term Break set to Week ${wk}! Week ${wk === 6 ? 7 : 6} is now available for normal lessons.`);
                        }}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      Week {wk} (Flexible)
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {formData.type === 'lesson_plan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LESSON NUMBER</label>
                    <input
                      type="text"
                      name="lessonNumber"
                      value={formData.lessonNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 1"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WEEK NUMBER</label>
                    <input
                      type="text"
                      name="lessonWeekNumber"
                      value={formData.lessonWeekNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 6"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleSyncFromWeeklyForecast}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm active:scale-95 group"
                >
                  <HistoryIcon size={16} className="group-hover:rotate-[-30deg] transition-transform" />
                  Sync From Weekly Forecast
                </button>
                <div className="flex flex-col gap-2 text-center mt-2">
                  <p className="text-[10px] text-emerald-800 bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 font-medium px-4 leading-relaxed shadow-sm">
                    For a user to generate and sync any documents from schemes or weekly forecast, one should have synced or saved the already generated documents to the system.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetSyncHistory('weekly_forecast')}
                      className="text-[10px] text-red-600 hover:text-red-800 font-black uppercase tracking-wider transition-colors py-1.5 px-3 hover:bg-red-50 rounded-lg border border-red-100 flex items-center gap-1"
                      title="Reset only saved Weekly Forecasts"
                    >
                      <Trash2 size={10} />
                      Reset Forecasts Only
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetSyncHistory('schemes_of_work')}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-black uppercase tracking-wider transition-colors py-1.5 px-3 hover:bg-amber-50 rounded-lg border border-amber-200/80 flex items-center gap-1"
                      title="Reset only saved Schemes of Work"
                    >
                      <Trash2 size={10} />
                      Reset Schemes Only
                    </button>
                    {lastSyncTime && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
                        <FileCheck size={12} />
                        Sync Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
      </div>
    );
  };

  const handleGenerate = async (overlapChoiceMade: boolean | React.MouseEvent = false) => {
    if (isUserGuestTier) {
      if (!['schemes_of_work', 'weekly_forecast', 'lesson_plan'].includes(formData.type)) {
        setError("This document type is viewable on Trial Access, but downloading requires a paid subscription. Please upgrade to download.");
        toast.error("Download Locked on Trial Access");
        return;
      }
      if (isAllTrialDepleted || isLimitReached) {
        setError("You have reached your free download limit for trial access (Schemes: 1, Weekly: 2, Lesson Plans: 3). Please upgrade to continue downloading.");
        toast.error("Trial Download Limit Reached");
        return;
      }
    }

    if (isLimitReached) {
      setError("You have reached your free download limit for trial access. Please upgrade to continue downloading.");
      toast.error("Trial Download Limit Reached");
      return;
    }

    if (isActiveCircleLimitReached) {
      setError(gradeSpecificLimitMsg || `Billing Cycle Limit Reached: You have reached your package download limit of ${subscriptionDetails?.circleDownloadsLimit || 30} downloads for this cycle. Please upgrade or renew your package.`);
      toast.error("Subscription Limit Reached");
      return;
    }

    if (!isIWP && !formData.subject) {
      setError("Subject is required.");
      return;
    }

    if (isIWP && !formData.jobTitle) {
      setError("Job Title is required.");
      return;
    }

    const isChoiceMade = overlapChoiceMade === true;

    if (!isChoiceMade && formData.type === 'weekly_forecast' && formData.subject?.toLowerCase().includes('english') && (formData.grade?.includes('Grade 1') || formData.grade?.includes('Grade 2'))) {
      toast.loading("Verifying your sync history...", { id: 'overlap-verify' });
      try {
        const activeSources = await fetchActiveSyncSources();
        toast.dismiss('overlap-verify');
        const overlap = checkOverlapSources(activeSources);
        if (overlap) {
          setOverlapModal({
            isOpen: true,
            action: 'generate',
            oralDoc: overlap.oralDoc,
            literacyDoc: overlap.literacyDoc,
            grade: formData.grade || '',
            activeSources: activeSources
          });
          return;
        }
      } catch (err) {
        console.error("Error verifying sync sources", err);
        toast.dismiss('overlap-verify');
      }
    }

    // Relaxed restrictions: AI can infer topics if grade and subject are provided
 
    setIsGenerating(true);
    setLoading(true);
    setError(null);

    const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
    const combinedReferenceContent = selectedModules.length > 0 
      ? selectedModules.map(m => `--- MODULE: ${m.name}${m.category ? ` (${m.category})` : ''} ---\n${m.content}`).join('\n\n')
      : undefined;

    try {
      let finalDoc = "";

      {
        let datesContext = '';
        if (formData.type === 'schemes_of_work' && formData.termStartDate) {
          const weeksInfo = calculateTermDates(formData.termStartDate, 13);
          datesContext = `
IMPORTANT ZAMBIAN CALENDAR & HOLIDAYS INSTRUCTIONS:
- You MUST indicate the specific dates of preparation in real-time for each week in the "WEEK" column of the Schemes of Work table. 
- You MUST format this date range as: "**Week X**<br/><span style='font-size: 7.5pt;'>(${formData.termStartDate ? '{dateRange}' : ''})</span>" where you replacement the computed date range for that week, e.g. "07-09-2026 to 15-05-2026".
- If a Zambian public holiday falls during that week, you MUST explicitly state the holiday date and name separate from the week text inside the "WEEK" column. Use format: "<br/><span style='font-size: 7.5pt; color: #b91c1c; font-weight: bold;'>({holidayDate} - {holidayName})</span>".
- Here are the pre-computed dates and holidays for the 13-week term starting on ${formData.termStartDate}:
${weeksInfo.map(w => `  * Week ${w.weekNum}: Date range "${w.dateRange}"${w.holidays && w.holidays.length > 0 ? `, Holidays: ${w.holidays.join(' and ')}` : ''}`).join('\n')}
- STRICT COLUMN RULE: These date ranges and public holiday tags MUST be written inside the "WEEK" column cells, standing separate from the main week names/numbers using <br/> tags.
`;
        } else if (formData.type === 'weekly_forecast' && formData.termStartDate) {
          const weeksInfo = calculateTermDates(formData.termStartDate, 13);
          const weekIdx = (formData.forecastWeek || 1) - 1;
          const weekData = weeksInfo[weekIdx];
          const daysWithCustomDates = formData.forecastDays || [];
          
          datesContext = `
IMPORTANT ZAMBIAN CALENDAR & HOLIDAYS INSTRUCTIONS:
- You MUST indicate the specific date for each day in the "DAY" column of the Weekly Forecast table.
- You MUST format each day as: "**Day X**<br/><span style='font-size: 7.5pt;'>({dateStr})</span>" where Day X is from Day 1 to Day 5, and {dateStr} is the date for that day.
- If a day is a public holiday, you MUST explicitly state the holiday name inside the "DAY" column cell separate from the day name using <br/>. Format: "<br/><span style='font-size: 7.5pt; color: #b91c1c; font-weight: bold;'>({holidayName})</span>".
- Here are the specific dates configured for this 5-day cycle:
${daysWithCustomDates.map((day, idx) => `  * Day ${day.day}: Date "${day.date || (weekData && weekData.days[idx] ? weekData.days[idx].dateStr : '')}"${(weekData && weekData.days[idx] && weekData.days[idx].holiday) ? `, Holiday: "${weekData.days[idx].holiday}"` : ''}`).join('\n')}
- STRICT COLUMN RULE: These dates and public holiday tags MUST be written inside the "DAY" column cells of the Weekly Forecast table, standing separate from the Day number/name using a <br/> tag.
`;
        }

        const sanitizedQuestionCounts = isAssessment ? {
          multipleChoice: formData.questionCounts?.multipleChoice ?? 5,
          trueFalse: formData.questionCounts?.trueFalse ?? 5,
          shortAnswer: formData.questionCounts?.shortAnswer ?? 3,
          longAnswer: formData.questionCounts?.longAnswer ?? 1,
          fillInBlank: formData.questionCounts?.fillInBlank ?? 0,
          matching: formData.questionCounts?.matching ?? 0,
          ordering: formData.questionCounts?.ordering ?? 0,
        } : formData.questionCounts;

        const totalQ = isAssessment && sanitizedQuestionCounts ? Object.values(sanitizedQuestionCounts).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : 1;
        const effectiveQuestionCounts = isAssessment && totalQ === 0 ? {
          multipleChoice: 5,
          trueFalse: 0,
          shortAnswer: 3,
          longAnswer: 2,
          fillInBlank: 0,
          matching: 0,
          ordering: 0,
        } : sanitizedQuestionCounts;

        const effectiveStartTopic = formData.topic || (formData.weeks && formData.weeks[0]?.topic) || '';
        const effectiveStoppingTopic = formData.stoppingTopic || '';

        const effectiveSyllabus = (formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast')
          ? sliceSyllabusByTopicRange(currentSyllabus, effectiveStartTopic, effectiveStoppingTopic)
          : currentSyllabus;

        finalDoc = await generateEducationalDoc({
          ...formData,
          topic: effectiveStartTopic || formData.topic,
          stoppingTopic: effectiveStoppingTopic || formData.stoppingTopic,
          questionCounts: effectiveQuestionCounts,
          curriculumType,
          type: formData.type as DocType,
          officialSyllabusData: effectiveSyllabus,
          referenceModuleContent: combinedReferenceContent,
          additionalContext: `
            ${formData.additionalContext || ''}
            ${(formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast') ? 'IMPORTANT: You MUST directly draw all "LEARNING ACTIVITIES" from the provided Syllabus data or associated module documents. Do NOT invent activities that are not aligned with the official curriculum provided in the context.' : ''}
            ${formData.type === 'weekly_forecast' ? 'STRICT SINGLE-PAGE REQUIREMENT: The entire Weekly Forecast document (including headers, metadata, and all 5 days of the table) MUST fit on EXACTLY ONE (1) A4 LANDSCAPE PAGE. Keep descriptions, learning activities, and competencies telegraphic, precise, and concise (1-2 short bullet points max per cell) so the table never overflows onto page 2.' : ''}
            ${datesContext}
            ${(formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast') ? `
            IMPORTANT BOUNDARIES & COVERAGE FOR SCHEMES & FORECASTS (ZERO TOLERANCE FOR OUTSIDE TOPICS):
            - EXHAUSTIVE SUBTOPIC COVERAGE: You MUST exhaustively cover EVERY SINGLE subtopic of the starting topic first before moving to the next. You MUST strictly follow the numeric sequence in the syllabus. If there are many subtopics, combine them into the available weeks if necessary, but NEVER skip or miss any subtopic from the starting range.
            - EXCLUSIVE TOPIC SCOPE: You MUST ONLY include the topics strictly starting from initial topic "${effectiveStartTopic || 'Start'}" through to stopping topic "${effectiveStoppingTopic || 'End'}". Under NO circumstances generate, mention, or include any earlier topics or later topics outside this sequence!
            - INITIAL STARTING TOPIC: ${effectiveStartTopic ? `You MUST start Week 1 / Day 1 directly with initial topic "${effectiveStartTopic}"${formData.subtopic ? `, subtopic "${formData.subtopic}"` : ''}${formData.specificCompetences ? `, specific competency "${formData.specificCompetences}"` : ''}.` : 'Start from topic 1 of the term.'}
            - CONCISE CONTENT: To ensure the Schemes of Work fits within 5-6 pages, keep learning activities and competencies extremely concise (1-2 short bullet points).
            - PROPORTIONAL & EXHAUSTIVE COVERAGE OF STOPPING/ENDING TOPIC: ${effectiveStoppingTopic ? `You MUST give "${effectiveStoppingTopic}" equal, full, and exhaustive multi-week coverage in the scheme table! DO NOT squeeze "${effectiveStoppingTopic}" into only the last week.` : 'Generate up to the end of term syllabus.'}
            ` : ''}
            ${magicFill ? `IMPORTANT: Perform a "Magic Fill" - The user has provided an initial topic/subtopic selection or blank fields. You MUST autogenerate curriculum-aligned data for ALL weeks of the term strictly within the allowed topic boundary ("${effectiveStartTopic || 'Start'}" to "${effectiveStoppingTopic || 'End'}"). THEME ADHERENCE: Strictly adhere to the topics belonging to the selected subject and grade for this term and range. DO NOT include topics from other terms, grades, or units outside this range. EXHAUSTIVE SUBTOPIC COVERAGE: You MUST exhaustively cover every single subtopic of the starting topic first before moving to the next. You MUST strictly follow the sequence of content in the syllabus. You MUST prefix all Topics and Subtopics with their official curriculum numbers. Do not mix up the order of the curriculum. You MUST also include explicit and detailed explanations of what will happen in assessment weeks, revisions, and the end of term test (do not leave them blank or just write "Assessment", provide activities and expectations).` : ''}
            ${smartPlan ? `IMPORTANT: Perform a "Smart Plan" - The user has provided an initial topic/subtopic selection or blank fields. You MUST autogenerate a logical ${formData.forecastDays?.length || 5}-day cycle of competencies for Week ${formData.forecastWeek}. You MUST strictly follow the numeric sequence of competencies (e.g., teaching 1.2.1.1 on day 1, 1.2.1.2 on day 2). Do not mix up the order. Use the exact code numbering from the official syllabus.` : ''}
            ${formData.type === 'lesson_notes' && formData.selectedSubtopics && formData.selectedSubtopics.length > 0 ? `
              IMPORTANT MULTI-SUBTOPIC REQUEST: The user has requested Lesson Notes covering up to 3 sub-topics in a single combined document.
              SELECTED SUB-TOPICS: ${formData.selectedSubtopics.join(' AND ')}.
              You MUST compile comprehensive, cohesive, and deeply academic lesson notes that exhaustively cover ALL these specified sub-topics and all of their associated competencies/outcomes.
              Expand Sections 1 (Introduction), 2 (Core Content/Exposition), 3 (Worked Examples), and 4 (Integrated Assessment) to be extremely long, deep, and thoroughly explanatory so every selected sub-topic is fully fleshed out with no omissions!
            `.trim() : ''}
          `.trim()
        }, selectedTemplate);
      }
      if (user && isUserGuestTier) {
        try {
          const rawDoc = {
            userId: user.uid,
            title: formData.topic || `Document: ${formData.type || ""}`,
            type: formData.type || "",
            subject: formData.subject || "",
            grade: formData.grade || "",
            content: finalDoc || "",
            format: "generation",
            timestamp: serverTimestamp(),
            metadata: {
              term: formData.term || "",
              teacherName: user.displayName || "",
            },
          };

          if (user.uid === 'guest_teacher' || user.uid.startsWith('guest_')) {
            const storedStr = safeLocalStorage.getItem('eduplan_downloads');
            const current: any[] = storedStr ? JSON.parse(storedStr) : [];
            const newDoc = {
              id: 'local_' + Date.now(),
              ...rawDoc,
              timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
            };
            current.unshift(newDoc);
            safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(current));
          } else {
            await addDoc(collection(db, "users", user.uid, "downloads"), rawDoc);
          }
          if (refreshDownloads) {
            await refreshDownloads();
          }
        } catch (err) {
          console.error("Failed to automatically record trial generation quota:", err);
        }
      }

      onGenerate(finalDoc, formData);
      setLastGeneratedContent(finalDoc);
      setHasGenerated(true);
      
      // Record system activity
      recordActivity({
        type: 'generation',
        doc_type: formData.type,
        grade: formData.grade,
        subject: formData.subject,
        topic: formData.topic,
        subtopic: formData.subtopic,
        format: 'ai_generation'
      });
      
      toast.success("Document generated successfully!");
    } catch (err) {
      console.error("Generator Error:", err);
      setError(err instanceof Error ? err.message : "AI generation failed. Please check your connection.");
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(m => {
    if (!m.subject && !m.name) return false;
    
    const modGrade = (m.grade || '').toLowerCase();
    const modName = (m.name || '').toLowerCase();
    const modSubj = (m.subject || '').toLowerCase();
    const formGrade = (formData.grade || '').toLowerCase();
    const formSubj = (formData.subject || '').toLowerCase();

    // Strict Curriculum Filtering Requirement
    const isExplicitOBC = modGrade.includes('obc') || modName.includes('obc') || modSubj.includes('obc');
    const isExplicitCBC = modGrade.includes('cbc') || modName.includes('cbc') || modSubj.includes('cbc');
    
    // Prevent cross-curriculum leakage if explicitly marked, otherwise allow matching grade/subject
    if (curriculumType === 'CBC' && isExplicitOBC) return false;
    if (curriculumType === 'OBC' && isExplicitCBC) return false;

    // Universal materials always show
    const isUniversal = m.grade === 'Universal' || m.subject === 'Universal';
    if (isUniversal) {
      return true;
    }

    // Grade Range Matching Logic
    const extractDigits = (s: string) => {
      const matches = s.match(/\d+/g);
      if (!matches) return [];
      
      // Handle ranges like 1-7
      if (s.includes('-')) {
        const parts = s.split('-');
        const start = parseInt(parts[0].match(/\d+/)?.at(0) || '0');
        const end = parseInt(parts[1].match(/\d+/)?.at(0) || '0');
        if (start > 0 && end >= start) {
          return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        }
      }
      return matches;
    };

    const modDigits = extractDigits(modGrade + ' ' + modName);
    const formDigits = extractDigits(formGrade);

    const hasGradeOverlap = formGrade === modGrade || 
                          modGrade.includes(formGrade) || 
                          formGrade.includes(modGrade) ||
                          (modDigits.length > 0 && formDigits.length > 0 && formDigits.some(d => modDigits.includes(d)));

    // If no subject selected, just filter by grade
    if (!formSubj) return hasGradeOverlap;

    // Subject matching logic (must also have grade overlap unless it's universal)
    if (!hasGradeOverlap && !isUniversal) return false;

    // Subject matching logic
    const zambianLangs = ['zambian', 'icibemba', 'bemba', 'cinyanja', 'nyanja', 'chitonga', 'tonga', 'silozi', 'lozi', 'lunda', 'luvale', 'kiikaonde', 'kaonde', 'zambian languages'];
    const isZambianMatch = zambianLangs.some(l => modSubj.includes(l)) && zambianLangs.some(l => formSubj.includes(l));
    if (isZambianMatch) return true;

    if (modSubj === formSubj || modSubj.includes(formSubj) || formSubj.includes(modSubj)) return true;

    const aliases: Record<string, string[]> = {
      'mathematics': ['math', 'arithmetic', 'numeracy'],
      'integrated science': ['science', 'natural science', 'environmental science', 'health'],
      'creative and technology studies': ['cts', 'creative arts', 'technology', 'design and technology', 'ict'],
      'social studies': ['geography', 'history', 'civics', 'environmental', 'expressive arts'],
      'literacy': ['english', 'zambian', 'reading', 'writing'],
      'religious education': ['re', 'religous', 'spiritual', 'moral']
    };

    for (const [key, list] of Object.entries(aliases)) {
      const isKeyMatch = formSubj.includes(key) || key.includes(formSubj);
      if (isKeyMatch && list.some(alias => modSubj.includes(alias) || alias.includes(modSubj))) return true;
      if (list.some(alias => formSubj.includes(alias) || alias.includes(formSubj))) {
        if (modSubj.includes(key) || key.includes(modSubj)) return true;
        if (list.some(alias => modSubj.includes(alias) || alias.includes(modSubj))) return true;
      }
    }

    // Secondary name match if subject is vague
    if (modName.includes(formSubj) || formSubj.includes(modName)) return true;

    return false;
  });

  const renderKnowledgeBase = () => {
    if (isIWP) return null;
    return (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
        <div className="grow">
          <h4 className="text-xl font-bold tracking-tight text-[#0F172A] leading-none uppercase">Reference Materials</h4>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1">Modules, Syllabi & Textbooks</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
            <BookMarked size={20} />
          </div>
          <div className="grow space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-blue-900 leading-tight">Reference Content</p>
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", curriculumType === 'OBC' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                {curriculumType} MODE
              </span>
            </div>
            <p className="text-[10px] text-blue-600 font-medium">Select materials to prioritize during generation.</p>
          </div>
        </div>

        {/* 1. Official Syllabus Status */}
        {syllabusResult ? (
           <div className="p-4 bg-white border border-emerald-100 rounded-2xl flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
               <CheckCircle2 size={16} />
             </div>
             <div className="grow">
               <p className="text-xs font-black text-emerald-900 uppercase">Syllabus Active</p>
               <p className="text-[10px] text-emerald-600 font-bold">{getOfficialSyllabusCitation(formData.grade, formData.subject, curriculumType)}</p>
             </div>
             {formData.type !== 'syllabi' && (
               <button
                 type="button"
                 onClick={() => {
                   const refName = getOfficialSyllabusCitation(formData.grade, formData.subject, curriculumType);
                   const currentRefs = formData.references ? formData.references.split('; ').filter(Boolean) : [];
                   let newRefs;
                   if (currentRefs.includes(refName)) {
                     newRefs = currentRefs.filter(r => r !== refName);
                   } else {
                     newRefs = [...currentRefs, refName];
                   }
                   setFormData(prev => ({ ...prev, references: newRefs.join('; ') }));
                 }}
                 className={cn(
                   "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                   (formData.references || '').includes(getOfficialSyllabusCitation(formData.grade, formData.subject, curriculumType)) 
                     ? "bg-emerald-600 text-white" 
                     : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                 )}
               >
                 {(formData.references || '').includes(getOfficialSyllabusCitation(formData.grade, formData.subject, curriculumType)) ? 'Citing' : 'Cite in Doc'}
               </button>
             )}
           </div>
        ) : (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 opacity-60">
             <Info size={16} className="text-slate-400" />
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No syllabus found for this selection</p>
          </div>
        )}

        {/* 2. User Modules Selection */}
        <div className="space-y-3">
          <div 
            className="flex items-center justify-between px-1 cursor-pointer hover:bg-slate-50 py-1 rounded-lg transition-colors"
            onClick={() => setIsPrivateModulesCollapsed(!isPrivateModulesCollapsed)}
          >
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Your Private Modules</p>
              <ChevronDown 
                size={14} 
                className={cn("text-slate-400 transition-transform duration-300", isPrivateModulesCollapsed ? "" : "rotate-180")} 
              />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
              {filteredModules.length} found
            </span>
          </div>

          <AnimatePresence>
            {!isPrivateModulesCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {filteredModules.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar py-1">
                    {filteredModules.map(module => {
                      const isSelectedInModules = selectedModuleIds.includes(module.id);
                      const refName = `Module: ${module.name}`;
                      const isSelectedInRefs = (formData.references || '').includes(refName);
                      const isActive = isSelectedInModules || isSelectedInRefs;
                      const isUniversal = module.grade === 'Universal' || module.subject === 'Universal';
                      
                      return (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => {
                            const currentRefs = formData.references ? formData.references.split('; ').filter(Boolean) : [];
                            let newRefs = [...currentRefs];
                            
                            setSelectedModuleIds(prev => {
                              if (isSelectedInModules) {
                                // Deselecting
                                if (isSelectedInRefs) {
                                  newRefs = currentRefs.filter(r => r !== refName);
                                }
                                return prev.filter(id => id !== module.id);
                              } else {
                                // Selecting
                                if (!currentRefs.includes(refName) && formData.type !== 'syllabi') {
                                  newRefs = [...currentRefs, refName];
                                }
                                if (prev.length >= 3) {
                                  toast.error("Maximum 3 modules allowed.");
                                  return prev;
                                }
                                return [...prev, module.id];
                              }
                            });
                            
                            if (formData.type !== 'syllabi') {
                              setFormData(prev => ({ ...prev, references: newRefs.join('; ') }));
                            }
                          }}
                          className={cn(
                            "group w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                            isActive 
                              ? "border-blue-500 bg-blue-50 shadow-sm" 
                              : "border-white bg-white/50 hover:border-slate-200"
                          )}
                        >
                          <div className="grow pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn("text-xs font-bold leading-tight", isActive ? "text-blue-900" : "text-slate-800")}>
                                {module.name}
                              </h4>
                              {isUniversal && (
                                <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1 py-0.5 rounded-md uppercase">Universal</span>
                              )}
                            </div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-blue-600" : "text-slate-400")}>
                              {module.subject} {module.grade && `• ${module.grade}`}
                            </p>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            isActive 
                              ? "bg-blue-600 border-blue-600 text-white scale-110" 
                              : "border-slate-200 text-transparent bg-white group-hover:border-slate-300"
                          )}>
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-white/30 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <p className="text-xs font-bold text-slate-500 mb-1">No matching modules found</p>
                    <button
                      type="button"
                      onClick={() => onNavigate ? onNavigate('knowledge_base') : window.location.hash = 'modules'}
                      className="mt-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:scale-105 transition-transform"
                    >
                      Go to Knowledge Base
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Standard Textbook References - MERGED HERE */}
        {formData.type !== 'syllabi' && formData.subject && (
          <div className="space-y-3 pt-6 border-t border-blue-100">
            <div 
              className="flex items-center justify-between cursor-pointer group hover:bg-blue-50 py-1 rounded-lg transition-colors px-1"
              onClick={() => setIsTextbookSectionCollapsed(!isTextbookSectionCollapsed)}
            >
              <label className="text-[10px] font-black uppercase text-blue-800 tracking-wider cursor-pointer">Standard Textbook References</label>
              {isTextbookSectionCollapsed ? <ChevronDown size={14} className="text-blue-400" /> : <ChevronUp size={14} className="text-blue-400" />}
            </div>

            <AnimatePresence>
              {!isTextbookSectionCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {getReferencesForSubject(formData.subject, formData.grade, curriculumType).map((refText, index) => {
                      const isSelected = (formData.references || '').includes(refText);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const currentRefs = formData.references ? formData.references.split('; ').filter(Boolean) : [];
                            let newRefs;
                            if (isSelected) {
                              newRefs = currentRefs.filter(r => r !== refText);
                            } else {
                              newRefs = [...currentRefs, refText];
                            }
                            setFormData(prev => ({ ...prev, references: newRefs.join('; ') }));
                          }}
                          className={cn(
                            "text-left p-3 rounded-xl border text-[10px] font-bold transition-all shadow-sm",
                            isSelected ? "bg-white border-blue-500 text-blue-800 ring-2 ring-blue-50" : "bg-white/50 border-white text-slate-600 hover:border-blue-200"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                              isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-200"
                            )}>
                              {isSelected && <Check size={10} />}
                            </div>
                            <span className="leading-tight">{refText}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Custom/Additional References</label>
                    <input
                      type="text"
                      name="references"
                      value={formData.references || ''}
                      onChange={handleInputChange}
                      placeholder="Type or refine references used (separate with semicolon)..."
                      className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold shadow-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 4. Syllabus Browser */}
        {currentSyllabus && (
          <div className="space-y-3 pt-6 border-t border-blue-100">
             <div 
               className="flex items-center justify-between cursor-pointer group hover:bg-emerald-50 py-1 rounded-lg transition-colors px-1"
               onClick={() => setIsSyllabusBrowserCollapsed(!isSyllabusBrowserCollapsed)}
             >
                <div className="flex items-center gap-2">
                   <Layers size={14} className="text-emerald-500" />
                   <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">FORTUNES EDUTECH Syllabus Browser</p>
                   <ChevronDown 
                     size={14} 
                     className={cn("text-slate-400 transition-transform duration-300", isSyllabusBrowserCollapsed ? "" : "rotate-180")} 
                   />
                </div>
             </div>
             
             <AnimatePresence>
               {!isSyllabusBrowserCollapsed && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   transition={{ duration: 0.3 }}
                   className="overflow-hidden"
                 >
                   <div className="mt-2 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar bg-white/50 rounded-2xl p-2 border border-emerald-100">
                     {currentSyllabus.map((t, idx) => (
                       <div key={idx} className="space-y-1">
                         <div className="p-3 bg-white rounded-xl border border-emerald-100 text-[11px] font-bold text-emerald-900 shadow-sm">
                           {stripPageNumbers(t.title)}
                         </div>
                       </div>
                     ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    );
  };

  if (isDocTypeLockedForGuest) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-12 pb-32 relative">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:translate-x-[-4px] transition-transform">
            <ChevronLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">
                Access Locked
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Teaching: {user?.displayName || 'Teacher'}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
           <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
              <Lock size={32} />
           </div>
           <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight">Access Locked</h3>
           <p className="text-sm text-amber-700 font-bold mt-2 leading-relaxed max-w-[320px] mx-auto">
             {formData.type.replace(/_/g, ' ')} is a premium feature reserved for whitelisted teachers. Trial users can only access Schemes of Work, Weekly Forecasts, and Lesson Plans (up to 2 of each).
           </p>
           <button 
             onClick={() => window.open('https://wa.me/260961622222', '_blank')}
             className="mt-6 px-8 py-3 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-900/10"
           >
             Request Upgrade / Contact Edutech
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-12 pb-32 relative">
      {hasGenerated && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-[#00A86B] text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">Document Ready!</h3>
              <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">Generated and sent to Preview section</p>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => { setHasGenerated(false); onNavigate?.('preview'); }}
                className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50"
              >
                Go to Preview
              </button>
              <button 
                onClick={resetGenerator}
                className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800"
              >
                Start New
              </button>
            </div>
            <button 
              onClick={() => setHasGenerated(false)}
              className="text-[10px] font-bold text-white/60 uppercase tracking-widest hover:text-white"
            >
              Back to Editor
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:translate-x-[-4px] transition-transform">
            <ChevronLeft size={20} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl border-2 border-emerald-100 shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                <IconForType type={formData.type as DocType} />
              </div>
            )}
            <div>
              <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">
                {selectedTemplate?.title || "Generator"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Teaching: {user?.displayName || 'Teacher'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start">
          {autosaveStatus && (
            <div className={cn(
              "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300",
              autosaveStatus === 'saving' && "bg-blue-50 text-blue-600 border border-blue-100",
              autosaveStatus === 'saved' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
              autosaveStatus === 'error' && "bg-rose-50 text-rose-600 border border-rose-100"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                autosaveStatus === 'saving' && "bg-blue-500 animate-pulse",
                autosaveStatus === 'saved' && "bg-emerald-500",
                autosaveStatus === 'error' && "bg-rose-500 animate-bounce"
              )} />
              {autosaveStatus === 'saving' && "Saving Draft..."}
              {autosaveStatus === 'saved' && "Draft Cloud Saved"}
              {autosaveStatus === 'error' && "Draft Save Error"}
            </div>
          )}
          <button
            onClick={resetGenerator}
            className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            Reset Generator
          </button>
        </div>
      </div>

      {/* AI Audio Playback & Operations Guide */}
      <AIPlanningVoiceGuide 
        toolType={formData.type} 
        toolTitle={selectedTemplate?.title} 
        customText={lastGeneratedContent ? lastGeneratedContent.replace(/<[^>]+>/g, '') : undefined}
        className="animate-in fade-in duration-300"
      />

      {showDraftBanner && detectedDraft && (
        <div className="bg-amber-50 border-2 border-amber-500/20 rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-amber-800">
              <HistoryIcon size={18} className="animate-pulse" />
              <h4 className="font-black text-sm uppercase tracking-wider">Unsaved Draft Recovered</h4>
            </div>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              We found a draft of this <strong>{formData.type.replaceAll('_', ' ')}</strong> from{' '}
              {detectedDraft.updatedAt?.seconds 
                ? new Date(detectedDraft.updatedAt.seconds * 1000).toLocaleString() 
                : 'your last session'}
              . Would you like to resume?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleRestoreDraft}
              className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-emerald-200 active:scale-95 cursor-pointer"
            >
              Resume Draft
            </button>
            <button
              onClick={handleDismissDraft}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {isUserGuestTier ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Sparkles size={22} className="text-[#00A86B] animate-pulse" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-xs">Free Trial Access Mode Active</h4>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Stipulated Document Limits Active</p>
              </div>
            </div>
            <div className="self-start md:self-auto text-amber-600 font-bold text-[10px] uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Trial Quota Tracking
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-semibold mb-4">
            Welcome to Fortunes Edutech! As a trial user, you have access to core generators. Your remaining download quota for each document type is tracked below as stipulated in the platform terms:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className={cn("p-3 rounded-2xl border text-center", usageCounts.schemes_of_work >= 1 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-emerald-100 text-emerald-800")}>
              <div className="text-[9px] font-black uppercase mb-1">Schemes of Work</div>
              <div className="text-xl font-black">{usageCounts.schemes_of_work}/1</div>
              <div className="text-[9px] font-bold mt-0.5 text-slate-500">{Math.max(0, 1 - usageCounts.schemes_of_work)} remaining</div>
            </div>
            <div className={cn("p-3 rounded-2xl border text-center", usageCounts.weekly_forecast >= 1 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-emerald-100 text-emerald-800")}>
              <div className="text-[9px] font-black uppercase mb-1">Weekly Forecast</div>
              <div className="text-xl font-black">{usageCounts.weekly_forecast}/1</div>
              <div className="text-[9px] font-bold mt-0.5 text-slate-500">{Math.max(0, 1 - usageCounts.weekly_forecast)} remaining</div>
            </div>
            <div className={cn("p-3 rounded-2xl border text-center", usageCounts.lesson_plan >= 2 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-emerald-100 text-emerald-800")}>
              <div className="text-[9px] font-black uppercase mb-1">Lesson Planning</div>
              <div className="text-xl font-black">{usageCounts.lesson_plan}/2</div>
              <div className="text-[9px] font-bold mt-0.5 text-slate-500">{Math.max(0, 2 - usageCounts.lesson_plan)} remaining</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Share / Invite Panel */}
            <div className="bg-white border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite Fellow Teachers</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Share this link to invite other teachers to experience the free trial access mode and grow our community!</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    toast.success("Trial invite link copied! Share it with others.");
                  }}
                  className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy size={12} />
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent("Hello! Check out this amazing free tool for teachers: Fortunes Edutech. You can log in with your email to access the free trial mode and generate lesson plans, schemes of work, and more! Try it here:");
                    window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(window.location.origin)}`, '_blank');
                  }}
                  className="px-3 py-2 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={12} />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Subscribe / Premium Info Panel */}
            <div className="bg-white border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join a Circle Package</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Ready to unlock unlimited downloads and active synchronization? You can join any of our billing circles at any time.</p>
              </div>
              <button
                onClick={() => {
                  window.open("https://wa.me/260961622222?text=Hello%21%20I%20am%20using%20the%20Fortunes%20Edutech%20App%20and%20would%20like%20to%20know%20more%20about%20your%20premium%20subscription%20packages%20and%20billing%20cycles.", "_blank");
                }}
                className="w-full px-3 py-2 bg-[#00A86B] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={12} />
                WhatsApp Developer
              </button>
            </div>
          </div>
        </div>
      ) : (
        subscriptionDetails && subscriptionDetails.subscriptionType && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-emerald-700">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <span className="text-xl">♿</span>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-tight text-xs">Active Subscription: {subscriptionDetails.subscriptionType}</h4>
                  <p className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5">
                    {subscriptionDetails.unlimitedDownloads 
                      ? "Unlimited Downloads Allowed" 
                      : `Downloaded: ${subscriptionDetails.circleDownloadsCount || 0} / ${subscriptionDetails.circleDownloadsLimit} docs (${Math.max(0, subscriptionDetails.circleDownloadsLimit - (subscriptionDetails.circleDownloadsCount || 0))} remaining)`}
                  </p>
                </div>
              </div>
              <div className="text-emerald-600 font-bold text-[10px] uppercase bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200">
                {subscriptionDetails.daysRemaining} days left
              </div>
            </div>

            {!subscriptionDetails.unlimitedDownloads && (
              <div className="space-y-4 mt-2">
                {(() => {
                  const gradesCount = registeredGrades ? registeredGrades.length : 1;
                  const baseLimit = subscriptionDetails.circleDownloadsLimit || subscriptionDetails.baseLimit || 180;
                  const gradeCounts = subscriptionDetails.gradeCounts || {};
                  
                  if (gradesCount <= 2 && registeredGrades && registeredGrades.length > 0) {
                    return (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">
                          Grade Download Trackers:
                        </p>
                        {registeredGrades.map((grade) => {
                          const used = (grade.toLowerCase() === 'all' || registeredGrades.includes('all')) 
                            ? (subscriptionDetails.circleDownloadsCount || 0) 
                            : (gradeCounts[grade] || 0);
                          const remaining = Math.max(0, baseLimit - used);
                          const pct = Math.min(100, (used / baseLimit) * 100);
                          const isDepleted = used >= baseLimit;
                          
                          return (
                            <div key={grade} className="space-y-1">
                              <div className="flex justify-between text-[9px] font-black text-emerald-700 uppercase tracking-wider">
                                <span>{grade === 'all' ? 'All Registered Grades' : grade}</span>
                                <span className={isDepleted ? "text-red-500 font-bold" : ""}>
                                  Used: {used} / {baseLimit} ({remaining} Left)
                                </span>
                              </div>
                              <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={cn("h-full transition-all duration-500", isDepleted ? "bg-red-500" : "bg-[#00A86B]")} 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else {
                    const totalLimit = subscriptionDetails.circleDownloadsLimit || (2 * baseLimit);
                    const pct = Math.min(100, (subscriptionDetails.circleDownloadsCount / totalLimit) * 100);
                    const isDepleted = subscriptionDetails.circleDownloadsCount >= totalLimit;
                    return (
                      <div className="space-y-2">
                        <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", isDepleted ? "bg-red-500" : "bg-[#00A86B]")} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                          <span>Downloaded: {subscriptionDetails.circleDownloadsCount || 0} docs | {Math.max(0, totalLimit - (subscriptionDetails.circleDownloadsCount || 0))} Remaining</span>
                          <span>Limit: {totalLimit} downloads</span>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )
      )}

      {isDocTypeLockedForGuest && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
           <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
              <Lock size={32} />
           </div>
           <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight">Access Locked</h3>
           <p className="text-sm text-amber-700 font-bold mt-2 leading-relaxed max-w-[320px] mx-auto">
             {formData.type.replace(/_/g, ' ')} are reserved for whitelisted teachers. Please contact Fortunes Edutech for full unlimited access.
           </p>
           <button 
            onClick={() => window.open('https://wa.me/260961622222', '_blank')}
            className="mt-6 px-8 py-3 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-md shadow-amber-900/10"
           >
             Request Access
           </button>
        </div>
      )}

      {formData.type !== 'syllabi' && !['schemes_of_work', 'weekly_forecast', 'lesson_plan', 'catch_up', 'lesson_notes', 'assessments', 'individual_work_plan'].includes(formData.type) && (
          <p className="text-xl text-blue-500 font-medium">
            Generate professional, CBC-aligned {selectedTemplate?.title.toLowerCase()} in seconds.
          </p>
        )}

      {formData.type === 'syllabi' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl space-y-8">
            <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                  <ExternalLink size={24} />
                </div>
                <div>
                  <h4 className="font-black text-base uppercase tracking-wider text-blue-900 leading-tight">Official Resource Portal</h4>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">FORTUNES EDUTECH</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                Access and download official teaching modules, syllabus documents, and CBC curriculum materials directly from the official portal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <a 
                  href="https://library.cdcrepository.info/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-indigo-100 active:scale-98 text-center"
                >
                  Download CBC Materials
                  <ExternalLink size={14} className="shrink-0" />
                </a>
                <a 
                  href="https://www.edu.gov.zm/?page_id=1142" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-blue-100 active:scale-98 text-center"
                >
                  Ministry Portal
                  <ExternalLink size={14} className="shrink-0" />
                </a>
                <a 
                  href="https://epdmis.grz.gov.zm/request-payslip/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-emerald-100 active:scale-98 text-center"
                >
                  Request Payslip 🔗
                  <ExternalLink size={14} className="shrink-0" />
                </a>
              </div>
            </div>
            
            <button 
              onClick={onBack} 
              className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 text-xs font-black uppercase tracking-[0.2em] transition-all rounded-3xl border border-slate-200 shadow-xs"
            >
               Return to Dashboard
            </button>
          </div>
        </div>
      ) : isAssessment ? (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="p-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl">
                 <GraduationCap size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Grade & Subject</h3>
                 <p className="text-sm text-slate-500 font-medium">Select the grade level and subject</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Grade(s) <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={formData.grade}
                  onChange={(val) => setFormData(prev => ({ ...prev, grade: val, subject: '', topic: '', subtopic: '' }))}
                  options={isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades && registeredGrades.length > 0 ? (
                    registeredGrades.filter(g => {
                      if (g === 'all') return false;
                      const isOBC = g.toLowerCase().includes('(obc)');
                      if (curriculumType === 'OBC') {
                        return isOBC && !['grade 1', 'grade 2', 'grade 4'].some(ex => g.toLowerCase().includes(ex));
                      }
                      return !isOBC;
                    })
                  ) : (
                    curriculumType === 'OBC' 
                      ? OBC_LEVELS 
                      : GRADES.filter(g => {
                          const gLow = g.toLowerCase();
                          return !gLow.includes('(obc)') && !['grade 3', 'grade 5', 'grade 6', 'grade 7'].some(ex => gLow === ex || gLow.startsWith(ex));
                        })
                  )}
                  placeholder="Select a grade..."
                />
                {renderUserGradeTrackers()}
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></label>
                 <CustomSelect
                   value={formData.subject}
                   onChange={(val) => setFormData(prev => ({ ...prev, subject: val, topic: '', subtopic: '' }))}
                   options={getAvailableSubjects(formData.grade)}
                   placeholder={formData.grade ? "Select a subject..." : "Select grade first"}
                  />
                </div>
                {isZambianLanguageSubject && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 bg-emerald-50/55 p-5 rounded-2xl border border-emerald-100/50">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-800">Zambian Language (Local Dialect/Medium) <span className="text-red-500">*</span></label>
                      <p className="text-[11px] text-emerald-600 font-medium mb-2 leading-relaxed">
                        Select your local language. Teaching activities, counting, colours, greetings, and vocabulary will adapt to this.
                      </p>
                    </div>
                    <CustomSelect
                      value={formData.zambianLanguage || 'Icibemba'}
                      onChange={(val) => setFormData(prev => ({ ...prev, zambianLanguage: val }))}
                      options={[
                        'Icibemba',
                        'Chitonga',
                        'Cinyanja',
                        'Silozi',
                        'Kiikaonde',
                        'Lunda',
                        'Luvale'
                      ]}
                      placeholder="Select local language..."
                    />
                  </div>
                )}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Test Type <span className="text-red-500">*</span></label>
                 <CustomSelect
                   value={formData.testType || 'Test'}
                   onChange={(val) => setFormData(prev => ({ ...prev, testType: val || 'Test' }))}
                   options={['Test', 'Quiz', 'Exam', 'Assignment', 'Practice']}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Difficulty Level <span className="text-red-500">*</span></label>
                 <CustomSelect
                   value={formData.difficultyLevel || 'Medium'}
                   onChange={(val) => setFormData(prev => ({ ...prev, difficultyLevel: val || 'Medium' }))}
                   options={['Easy', 'Medium', 'Hard', 'Mixed']}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Test Name (Optional)</label>
                 <input type="text" name="testName" value={formData.testName || ''} onChange={handleInputChange} placeholder="e.g., Mid-Term Examination, Monthly Test..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                 <div className="flex flex-wrap gap-2 mt-3">
                   {['Mid-Term Examination', 'End of Term Examination', 'Monthly Test', 'Weekly Quiz', 'Class Assessment', 'Unit Test', 'Practice Test', 'Mock Examination'].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, testName: n }))}
                        className="px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        {n}
                      </button>
                   ))}
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">School Name</label>
                   <input type="text" name="school" value={formData.school || ''} onChange={handleInputChange} placeholder="Enter school name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Term</label>
                   <select name="term" value={formData.term || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all">
                     <option value="">Select term...</option>
                     <option value="1">Term 1</option>
                     <option value="2">Term 2</option>
                     <option value="3">Term 3</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Test Date (Optional)</label>
                   <input type="date" name="testDate" value={formData.testDate || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer" />
                 </div>
               </div>
             </div>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm mb-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl mt-1">
                      <BookOpen size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Topics & Subtopics</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Select one or more topics to include</p>
                   </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => {
                     setFormData(prev => {
                       const isAllSelected = prev.selectedTopics?.length === (currentSyllabus?.length || 0);
                       return {
                         ...prev,
                         selectedTopics: isAllSelected ? [] : (currentSyllabus || []).map(t => ({ topic: t.title, subtopics: t.subtopics?.map(st => st.title) || [] }))
                       };
                     });
                   }}
                   className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                 >
                   {formData.selectedTopics?.length === (currentSyllabus?.length || 0) && currentSyllabus?.length ? 'Deselect All' : 'Select All Topics'}
                 </button>
               </div>
              
              <div className="space-y-4">
                {currentModuleIsExtracting ? (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500 font-medium">
                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                    <p>AI is reading and extracting topics, sub-topics, from your uploaded syllabus module...</p>
                  </div>
                ) : currentSyllabus?.map((t, idx) => {
                  const isSelected = formData.selectedTopics?.some(st => st.topic === t.title);
                  const selectedTopicNode = formData.selectedTopics?.find(st => st.topic === t.title);
                  
                  return (
                    <div key={idx} className={cn("border rounded-2xl overflow-hidden transition-all", isSelected ? "border-emerald-100 bg-emerald-50/10 shadow-sm" : "border-slate-200 bg-white")}>
                      <div 
                        className={cn("p-4 flex items-center gap-4 cursor-pointer select-none transition-all", isSelected ? "hover:bg-emerald-50/50" : "hover:bg-slate-50")}
                        onClick={() => {
                          setFormData(prev => {
                            const selected = prev.selectedTopics || [];
                            if (selected.some(st => st.topic === t.title)) {
                              return { ...prev, selectedTopics: selected.filter(st => st.topic !== t.title) };
                            } else {
                              return { ...prev, selectedTopics: [...selected, { topic: t.title, subtopics: [] }] };
                            }
                          });
                        }}
                      >
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center border transition-all", isSelected ? "bg-[#00A86B] border-[#00A86B] text-white" : "border-slate-300 bg-white")}>
                          {isSelected && <Check size={14} />}
                        </div>
                        <span className="font-medium text-slate-800 tracking-tight text-sm uppercase">{t.title}</span>
                      </div>
                      
                      {isSelected && t.subtopics && t.subtopics.length > 0 && (
                        <div className="p-4 pt-1 ml-6 relative">
                          <div className="absolute left-6 top-0 bottom-6 w-[2px] bg-emerald-200/50 rounded-full" />
                          <p className="text-[13px] text-slate-500 mb-4 ml-8">Optional: Select specific subtopics</p>
                          <div className="space-y-4 ml-8">
                            {t.subtopics.map((st, sidx) => {
                              const isSubSelected = selectedTopicNode?.subtopics.includes(st.title);
                              return (
                                <div 
                                  key={sidx} 
                                  className="flex items-start gap-4 cursor-pointer group"
                                  onClick={() => {
                                    setFormData(prev => {
                                      const selected = prev.selectedTopics || [];
                                      return {
                                        ...prev,
                                        selectedTopics: selected.map(stNode => {
                                          if (stNode.topic === t.title) {
                                            if (stNode.subtopics.includes(st.title)) {
                                               return { ...stNode, subtopics: stNode.subtopics.filter(s => s !== st.title) };
                                            } else {
                                               return { ...stNode, subtopics: [...stNode.subtopics, st.title] };
                                            }
                                          }
                                          return stNode;
                                        })
                                      };
                                    });
                                  }}
                                >
                                  <div className={cn("mt-0 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0", isSubSelected ? "bg-[#00A86B] border-[#00A86B] text-white" : "border-slate-300 bg-white group-hover:border-emerald-300")}>
                                    {isSubSelected && <Check size={12} />}
                                  </div>
                                  <span className={cn("text-sm transition-all leading-tight", isSubSelected ? "text-slate-800 font-medium" : "text-slate-600")}>{st.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTopicInput.trim()) {
                          e.preventDefault();
                          setFormData(prev => ({
                            ...prev,
                            selectedTopics: [...(prev.selectedTopics || []), { topic: customTopicInput.trim(), subtopics: [] }]
                          }));
                          setCustomTopicInput('');
                        }
                      }}
                      placeholder="Add a custom topic not in the list..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customTopicInput.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            selectedTopics: [...(prev.selectedTopics || []), { topic: customTopicInput.trim(), subtopics: [] }]
                          }));
                          setCustomTopicInput('');
                        }
                      }}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.selectedTopics?.filter(st => !currentSyllabus?.some(t => t.title === st.topic)).map((customTopic, idx) => (
                    <div key={`custom-${idx}`} className="mt-3 border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00A86B] text-white">
                          <Check size={14} />
                        </div>
                        <span className="font-medium text-slate-800 tracking-tight text-sm uppercase">{customTopic.topic}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, selectedTopics: prev.selectedTopics?.filter(st => st.topic !== customTopic.topic) }));
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {formData.selectedTopics && formData.selectedTopics.length > 0 && (
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="font-semibold text-emerald-800">
                      Selected: {formData.selectedTopics.length} topic(s), {formData.selectedTopics.reduce((acc, curr) => acc + curr.subtopics.length, 0)} subtopic(s)
                    </span>
                  </div>
                </div>
              )}
            </div>

          {(isAssessment || (formData.selectedTopics && formData.selectedTopics.length > 0)) && (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm mb-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
              {isAssessment && (!formData.selectedTopics || formData.selectedTopics.length === 0) && (
                <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl flex items-start gap-3 text-xs font-semibold text-emerald-900 leading-relaxed">
                  <div className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 uppercase tracking-wider block mb-0.5">General Curriculum Test Mode</span>
                    No specific topics selected above. The AI will construct a test spanning key topics across the <strong>{formData.subject || 'selected subject'}</strong> syllabus for <strong>{formData.grade || 'this grade'}</strong>. (You can also select specific topics above to focus the test).
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl md:mt-1">
                   <CheckCircle2 size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-800">Question Types</h3>
                   <p className="text-sm text-slate-500 font-medium md:mt-1">Configure the number of questions for each type</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'multipleChoice', label: 'Multiple Choice', desc: '4 options, 1 mark each' },
                  { key: 'trueFalse', label: 'True/False', desc: '1 mark each' },
                  { key: 'shortAnswer', label: 'Short Answer', desc: '2-3 marks each' },
                  { key: 'longAnswer', label: 'Long Answer/Essay', desc: '5-10 marks each' },
                  { key: 'fillInBlank', label: 'Fill in the Blank', desc: '1-2 marks each' },
                  { key: 'matching', label: 'Matching', desc: '2-3 marks each' },
                  { key: 'ordering', label: 'Ordering/Sequencing', desc: '2-3 marks each' },
                ].map(qt => (
                  <div key={qt.key} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{qt.label}</span>
                      <span className="text-xs text-slate-500 font-medium">{qt.desc}</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 border border-slate-200">
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-sm"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          questionCounts: { ...prev.questionCounts, [qt.key]: Math.max(0, (prev.questionCounts as any)[qt.key] - 1) } 
                        }))}
                      >-</button>
                      <span className="w-6 text-center font-bold text-slate-800">{(formData.questionCounts as any)[qt.key]}</span>
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-sm"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          questionCounts: { ...prev.questionCounts, [qt.key]: (prev.questionCounts as any)[qt.key] + 1 } 
                        }))}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center px-2">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {(Object.values(formData.questionCounts!) as number[]).reduce((a, b) => a + (b || 0), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Estimated Marks</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {
                      (Number(formData.questionCounts?.multipleChoice || 0) * 1) + 
                      (Number(formData.questionCounts?.trueFalse || 0) * 1) + 
                      (Number(formData.questionCounts?.shortAnswer || 0) * 2) + 
                      (Number(formData.questionCounts?.longAnswer || 0) * 5) + 
                      (Number(formData.questionCounts?.fillInBlank || 0) * 1) + 
                      (Number(formData.questionCounts?.matching || 0) * 2) + 
                      (Number(formData.questionCounts?.ordering || 0) * 2)
                    }
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock size={16} className="text-slate-500" />
                    Test Duration (minutes)
                  </label>
                  <input 
                    type="number" 
                    value={formData.testDuration || 60} 
                    onChange={(e) => setFormData(prev => ({ ...prev, testDuration: e.target.value }))}
                    className="w-full max-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Additional Instructions (optional)</label>
                  <textarea 
                    value={formData.additionalInstructions || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                    placeholder="Any specific requirements or focus areas for the test..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[100px] resize-none"
                  />
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, includeMarkingKey: !prev.includeMarkingKey }))}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", formData.includeMarkingKey ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Include Marking Key</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Generate answer key with the test PDF</p>
                    </div>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full flex items-center px-1 transition-all", formData.includeMarkingKey ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start")}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, includeVisuals: !prev.includeVisuals }))}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", formData.includeVisuals !== false ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Include Pictures / Visuals</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Add professional, curriculum-aligned picture/emoji illustrations to questions</p>
                    </div>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full flex items-center px-1 transition-all", formData.includeVisuals !== false ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start")}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isIWP && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 mb-6">
              <div className="flex items-center gap-3 text-emerald-700 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User size={20} />
                </div>
                <h4 className="font-bold uppercase tracking-tight">Professional Profile</h4>
              </div>
              <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                The Individual Work Plan focuses on professional accountabilities, performance management, and career development. It is a separate professional document from classroom preparation tools.
              </p>
            </div>
          )}

          <div className="pt-6 pb-2 w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                {isIWP ? "Professional Context / Specific Roles" : "Important Note of Instructions / Additional Context"}
              </label>
              {!isIWP && (
                <button
                  type="button"
                  onClick={() => {
                    const isScheme = formData.type === 'schemes_of_work';
                    const isWF = formData.type === 'weekly_forecast';
                    const stopTopicStr = formData.stoppingTopic ? `(topic:${formData.stoppingTopic})` : '(indicate: e.g. topic:1.6 patterns)';
                    const schemeText = `Generate schemes based on the topics in the drop-down as arranged from topic 1 to the end OR start from the first topic, subtopic and first specific competencies entered going forward until the last topic number ${stopTopicStr} entered by user`;
                    const wfText = `Instructions: \n(Weekly forecast:) let the weekly forecast be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.\nModules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;
                    const lpText = `Instructions\n(Lesson plan:) let the Lesson plan be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.\nModules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;
                    
                    const activeText = isScheme ? schemeText : isWF ? wfText : lpText;
                    setFormData(prev => ({ ...prev, additionalContext: activeText }));
                    toast.success("Activated instructions for normal preparations!");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles size={13} />
                  <span>activate instructions for normal preparations</span>
                </button>
              )}
            </div>
            <textarea 
              name="additionalContext" 
              value={formData.additionalContext || ''} 
              onChange={handleInputChange} 
              placeholder={isIWP ? "e.g. Focus on extracurricular coordination, special education needs, or administrative tasks..." : "Box is empty by default. Click button above or sync from schemes/forecast to activate instructions..."} 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white transition-all shadow-sm" 
              rows={3} 
            />
          </div>

          <div className="space-y-4 pt-4">
            {error && (
              <p className="text-red-500 text-sm font-bold text-center mb-4">{error}</p>
            )}
            
            <button
               onClick={handleGenerate}
               disabled={loading}
               className="w-full py-4 bg-[#7EE1A0] hover:bg-[#68d790] disabled:opacity-50 text-white rounded-[1.5rem] shadow-sm font-bold text-lg flex flex-col items-center justify-center transition-all"
             >
                 {isGenerating ? (
                   <div className="flex flex-col items-center justify-center">
                     <div className="flex items-center gap-2">
                       <Loader2 className="animate-spin" size={24} />
                       <span className="font-bold">Generating...</span>
                     </div>
                     <span className="text-xs mt-1 text-emerald-800">{progressText}</span>
                   </div>
                 ) : loading ? (
                   <Loader2 className="animate-spin" size={24} />
                 ) : (
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-xl">✨</span>
                     <span>Generate Test</span>
                   </div>
                 )}
             </button>
             
             <button 
               onClick={onBack} 
               disabled={loading} 
               className="w-full py-4 bg-transparent text-slate-800 text-lg font-bold text-center hover:bg-slate-50 transition-all rounded-[1.5rem]"
             >
                Cancel
             </button>
          </div>
        </div>
      ) : (
        <>


          {isIWP && (
            <div className="hidden">
              <h3 className="text-3xl font-bold text-emerald-900">Individualized Work Plan</h3>
              <p className="text-emerald-600 font-medium">Create a tailored teaching strategy for your students</p>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-xl space-y-6">
            {renderGeneralRegistrationSection()}

            {isIWP && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SELECT JOB TITLE & PAY SCALE</label>
                    <CustomSelect
                      value={formData.jobTitle || ''}
                      onChange={(val) => {
                        const roleBase = val.split(' (')[0].trim();
                        setFormData(prev => ({ 
                          ...prev, 
                          jobTitle: val, 
                          jobPurpose: JOB_PURPOSE_DEFAULTS[roleBase] || JOB_PURPOSE_DEFAULTS['Class teacher']
                        }));
                      }}
                      options={TEACHER_ROLES}
                      placeholder="Select job title..."
                      dark={false}
                    />
                  </div>

                  {!isAdmin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TEACHING GRADE</label>
                      <select 
                        name="grade" 
                        value={formData.grade} 
                        onChange={handleInputChange} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all focus:bg-white shadow-sm"
                      >
                        <option value="">Select grade...</option>
                        {isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades && registeredGrades.length > 0 && !registeredGrades.includes('all') ? (
                          <>
                            {(() => {
                              const cbcAllocated = registeredGrades.filter(g => g !== 'all' && !g.toLowerCase().includes('(obc)') && !g.toLowerCase().includes('grade 7'));
                              const obcAllocated = registeredGrades.filter(g => g !== 'all' && g.toLowerCase().includes('(obc)'));
                              const isOBCMode = formData.type === 'schemes_of_work' ? (formData.curriculumType === 'OBC') : false;

                              if (isOBCMode) {
                                return obcAllocated.map(g => <option key={g} value={g}>{g}</option>);
                              } else {
                                return cbcAllocated.map(g => <option key={g} value={g}>{g}</option>);
                              }
                            })()}
                          </>
                        ) : (
                          <>
                            <optgroup label="PRIMARY (GRADE 1-7)">
                              {GRADES.filter(g => !g.includes('Grade 8') && !g.includes('Grade 9') && !g.toLowerCase().includes('(obc)')).map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </optgroup>
                            <optgroup label="JUNIOR SECONDARY (GRADE 8-9)">
                              {GRADES.filter(g => (g.includes('Grade 8') || g.includes('Grade 9')) && !g.toLowerCase().includes('(obc)')).map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </optgroup>
                            <optgroup label="OBC (LEVELS 1-4)">
                              {OBC_GRADES.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
        {formData.type === 'syllabi' && (
          <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <ExternalLink size={20} />
              </div>
              <h4 className="font-black text-sm uppercase tracking-widest text-blue-900">Official Resource Portal</h4>
            </div>
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              Access official teaching modules and syllabi directly from the Ministry of Education portal for download.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <a 
                href="https://library.cdcrepository.info/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 text-center"
              >
                Download CBC Materials
                <ExternalLink size={14} className="shrink-0" />
              </a>
              <a 
                href="https://www.edu.gov.zm/?page_id=1142" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200 text-center"
              >
                Ministry Portal
                <ExternalLink size={14} className="shrink-0" />
              </a>
              <a 
                href="https://epdmis.grz.gov.zm/request-payslip/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 text-center"
              >
                Request Payslip 🔗
                <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {!isIWP && (
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Select Academic Curriculum</p>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 max-w-sm mx-auto shadow-inner">
              <button
                onClick={() => {
                  setCurriculumType('CBC');
                  setFormData(prev => ({ 
                    ...prev, 
                    grade: '', 
                    subject: '',
                    topic: '',
                    subtopic: '',
                    specificCompetences: '',
                    learningActivities: []
                  }));
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all border-2 font-black uppercase tracking-widest text-[10px]",
                  curriculumType === 'CBC' 
                    ? "bg-[#00A86B] text-white border-[#00A86B] shadow-md ring-2 ring-emerald-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                )}
              >
                <BookOpen size={14} />
                <span>New CBC</span>
              </button>
              <button
                onClick={() => {
                  setCurriculumType('OBC');
                  setFormData(prev => ({ 
                    ...prev, 
                    grade: '', 
                    subject: '',
                    topic: '',
                    subtopic: '',
                    specificCompetences: '',
                    learningActivities: []
                  }));
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all border-2 font-black uppercase tracking-widest text-[10px]",
                  curriculumType === 'OBC' 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100" 
                    : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                )}
              >
                <Layers size={14} />
                <span>Old OBC</span>
              </button>
            </div>
          </div>
        )}



        {/* Tab Selection */}
        {(isScheme || isForecast) && (
          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
            <button
              onClick={() => setActiveInfo('general')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2",
                activeInfo === 'general' ? "bg-white text-blue-600 shadow-sm border-blue-600" : "text-slate-400 hover:text-slate-600 border-slate-200"
              )}
            >
              <User size={18} />
              General Info
            </button>
            {isScheme && (
              <div className="flex flex-col gap-2 flex-1">
                <button
                  onClick={() => setActiveInfo('weeks')}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2",
                    activeInfo === 'weeks' ? "bg-white text-blue-600 shadow-sm border-blue-600" : "text-slate-400 hover:text-slate-600 border-slate-200"
                  )}
                >
                  <Calendar size={18} />
                  Weeks Table
                </button>
              </div>
            )}
            {isForecast && (
              <div className="flex flex-col gap-2 flex-1">
                <button
                  onClick={() => setActiveInfo('forecast')}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2",
                    activeInfo === 'forecast' ? "bg-white text-blue-600 shadow-sm border-blue-600" : "text-slate-400 hover:text-slate-600 border-slate-200"
                  )}
                >
                  <Calendar size={18} />
                  Forecast Table
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-8">
          {/* General Information View */}
          {activeInfo === 'general' && !isScheme && !isForecast && (
            <div className="space-y-6">
                {renderGeneralInfoForm()}
            </div>
          )}

          {(activeInfo === 'weeks' || isScheme) && isScheme && (
            <div className="space-y-4">
              {renderGeneralInfoForm(true)}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-blue-900">Need help filling the table?</p>
                  <p className="text-[11px] text-blue-600 font-medium italic">
                    Magic fill will auto-populate real topics, subtopics and specific competencies. Only enter the first topic, subtopic and specific competency in the table and switch on the magic fill to do the rest.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setManualTable(!manualTable)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                      manualTable ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {manualTable ? "Using Manual Type" : "Use Dropdowns"}
                  </button>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400">Weeks:</span>
                    <select 
                      value={formData.weeks?.length || 13}
                      onChange={(e) => handleWeeksLengthChange(parseInt(e.target.value))}
                      className="bg-transparent font-black text-xs text-blue-600 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setMagicFill(!magicFill)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex-1 sm:flex-initial justify-center shadow-sm",
                      magicFill 
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-200 ring-offset-1" 
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    <CheckCircle2 size={14} className={cn("transition-transform", magicFill ? "scale-110" : "scale-100 opacity-50")} />
                    {magicFill ? "Magic Fill: ON" : "Magic Fill: OFF"}
                  </button>
                </div>
              </div>
              <div className="w-full overflow-x-auto border border-black rounded-lg">
                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black">
                        <th className="p-2 border-r border-black text-left font-black w-14 text-[11px]">WEEK</th>
                        <th className="p-2 border-r border-black text-left font-black w-32 text-[11px]">DATE</th>
                        <th className="p-2 border-r border-black text-left font-black w-40 text-[11px]">TOPIC</th>
                        <th className="p-2 border-r border-black text-left font-black w-48 text-[11px]">SUB-TOPICS</th>
                        <th className="p-2 border-r border-black text-left font-black w-60 text-[11px] uppercase">{curriculumType === 'OBC' ? 'Specific Outcomes' : 'Specific Competencies'}</th>
                        <th className="p-2 border-r border-black text-left font-black w-32 text-[11px]">T/L AIDS</th>
                        <th className="p-2 text-left font-black w-32 text-[11px]">REFERENCE</th>
                      </tr>
                    </thead>
                  <tbody>
                    {formData.weeks?.map((week, idx) => {
                      const isECE = formData.grade.toLowerCase().includes('ece');
                      const eceBreakWeek = formData.eceMidTermBreakWeek || 7;
                      const specialWeeks = isECE ? [eceBreakWeek, 12, 13] : [4, 8, 12, 13];
                      const isSpecial = specialWeeks.includes(week.week);

                      return (
                        <tr key={idx} className={cn(
                          "border-b border-black last:border-0",
                          isSpecial && "bg-amber-50/50"
                        )}>
                          <td className="p-2 border-r border-black font-bold text-center align-top pt-2 bg-slate-50/30 text-xs">
                            {week.week}
                          </td>
                          <td className="p-2 border-r border-black align-top font-black text-center pt-2 text-xs bg-slate-50/30">
                            {formData.termStartDate && termWeeksInfo[week.week - 1] ? (
                              <div className="flex flex-col gap-1">
                                <div className="text-blue-600">
                                  {termWeeksInfo[week.week - 1].dateRange}
                                </div>
                                {termWeeksInfo[week.week - 1].holidays.map((h: string) => {
                                  const name = h.split(' - ')[1];
                                  return (
                                    <div key={h} className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-1 rounded border border-red-100 flex items-center justify-center gap-1">
                                      <div className="w-1 h-1 rounded-full bg-red-500" />
                                      {name}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-2 border-r border-black align-top">
                            {isSpecial ? (
                              <div className="p-2 text-[11px] font-black text-amber-700 bg-amber-100/50 rounded-lg text-center uppercase border border-amber-200">
                                {week.topic}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 relative">
                                {(() => {
                                  const isEnglishGr2Term3 = formData.grade.includes('Grade 2') && formData.term === '3' && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  const isEnglishCombined = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  
                                  return [
                                    { field: 'topic' as const, val: week.topic, label: isEnglishGr2Term3 ? 'Oral English Topic' : (isEnglishCombined ? 'Oral/Combined Topic 1' : 'Slot 1: Select Topic') },
                                    { field: 'topic2' as const, val: week.topic2, label: isEnglishGr2Term3 ? 'Literacy in English Topic' : (isEnglishCombined ? 'Literacy/Combined Topic 2' : 'Slot 2: Select Topic') },
                                    { field: 'topic3' as const, val: week.topic3, label: 'Slot 3: Select Topic' }
                                  ].map((tObj, tIdx) => {
                                    let slotSyllabus = currentSyllabus;

                                    if (isEnglishCombined) {
                                      if (tIdx >= 2) return null;
                                    }

                                    return (
                                      <div key={tIdx} className="space-y-1">
                                        {currentModuleIsExtracting ? (
                                          <div className="w-full min-h-[40px] flex items-center justify-center p-2 text-xs font-medium text-slate-400 bg-slate-50/50 rounded border border-slate-100">
                                            <Loader2 className="animate-spin text-emerald-500 mr-2" size={14} />
                                          </div>
                                        ) : slotSyllabus && !manualTable ? (
                                          <select
                                            value={tObj.val || ''}
                                            onChange={(e) => handleWeekChange(idx, tObj.field, null, e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-[10px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-100"
                                          >
                                            <option value="">{tObj.label}</option>
                                            {isEnglishCombined ? (
                                              tIdx === 0 ? renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH") : renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")
                                            ) : (
                                              renderTopicOptionsList(slotSyllabus, stripPageNumbers)
                                            )}
                                          </select>
                                        ) : (
                                        <textarea
                                          placeholder={isEnglishCombined ? (tIdx === 0 ? 'Topic A (Oral/Literacy)...' : 'Topic B (Oral/Literacy)...') : `Topic Slot ${tIdx + 1}...`}
                                          value={tObj.val || ''}
                                          onChange={(e) => handleWeekChange(idx, tObj.field, null, e.target.value)}
                                          className="w-full min-h-[40px] bg-white/50 border border-slate-100 rounded p-1 outline-none resize-none font-bold text-slate-800 text-[10px]"
                                        />
                                      )}
                                    </div>
                                  );
                                });
                                })()}
                              </div>
                            )}
                          </td>
                          <td className="p-2 border-r border-black align-top">
                            {!isSpecial && (
                              <div className="flex flex-col gap-2">
                                {(() => {
                                  const isEnglishGr2Term3 = formData.grade.includes('Grade 2') && formData.term === '3' && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  const isEnglishCombined = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  const subtopicCount = isEnglishCombined ? 5 : Math.max(3, week.subtopics?.length || 3);
                                  const displaySubtopics = Array.from({ length: subtopicCount }, (_, i) => week.subtopics[i] || '');

                                  return displaySubtopics.map((st, sIdx) => {
                                    let currentTopic = '';
                                    let subtopicSyllabus = currentSyllabus;
                                    if (isEnglishGr2Term3) {
                                      currentTopic = sIdx < 2 ? week.topic : week.topic2;
                                      subtopicSyllabus = sIdx < 2 ? getEnglishTopics().oral : getEnglishTopics().literacy;
                                    } else if (isEnglishCombined) {
                                      currentTopic = sIdx < 3 ? week.topic : week.topic2;
                                      subtopicSyllabus = sIdx < 3 ? getEnglishTopics().oral : getEnglishTopics().literacy;
                                    } else {
                                      currentTopic = sIdx === 0 ? week.topic : (sIdx === 1 ? week.topic2 : week.topic3);
                                    }

                                    const availableSubtopics = getSubtopicsForTopic(currentTopic, subtopicSyllabus);

                                    return (
                                      <div key={sIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                                        <div className="w-full relative">
                                        {currentModuleIsExtracting ? (
                                          <div className="w-full min-h-[35px] flex items-center justify-center p-2 text-xs font-medium text-slate-400 bg-slate-50/50 rounded border border-slate-100">
                                            <Loader2 className="animate-spin text-emerald-500 mr-2" size={14} /> Extracting...
                                          </div>
                                        ) : subtopicSyllabus && !manualTable ? (
                                          <select
                                            value={st}
                                            onChange={(e) => handleWeekChange(idx, 'subtopics', sIdx, e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-medium text-slate-700 outline-none"
                                          >
                                            <option value="">
                                              {isEnglishGr2Term3
                                                ? (sIdx < 2
                                                    ? `Day ${sIdx + 1} (Oral)`
                                                    : `Day ${sIdx + 1} (Literacy)`)
                                                : (isEnglishCombined
                                                    ? (sIdx < 3 ? `Oral Subtopic ${sIdx + 1}` : `Lit Subtopic ${sIdx - 2}`)
                                                    : 'Select Sub-topic')}
                                            </option>
                                            {isEnglishCombined && sIdx === 4 && displaySubtopics[3] && (
                                              <option value={`Revision on ${stripPageNumbers(displaySubtopics[3])}`}>
                                                Revision on {stripPageNumbers(displaySubtopics[3])}
                                              </option>
                                            )}
                                            {isEnglishCombined && sIdx === 4 && (
                                              <option value="Revision based on letter sound taught">
                                                Revision based on letter sound taught
                                              </option>
                                            )}
                                            {availableSubtopics.map((ost, ostIdx) => (
                                              <option key={`${ost.title}-${ostIdx}`} value={ost.title}>{stripPageNumbers(ost.title)}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <textarea
                                            value={st}
                                            onChange={(e) => handleWeekChange(idx, 'subtopics', sIdx, e.target.value)}
                                            placeholder={
                                              isEnglishGr2Term3
                                                ? (sIdx < 2
                                                    ? `Day ${sIdx + 1} (Oral)`
                                                    : `Day ${sIdx + 1} (Literacy)`)
                                                : (isEnglishCombined
                                                    ? (sIdx < 3 ? `Oral Subtopic ${sIdx + 1}` : `Lit Subtopic ${sIdx - 2}`)
                                                    : `Sub-topic ${sIdx + 1}`)
                                            }
                                            className="w-full bg-transparent border-0 outline-none text-xs font-medium resize-none min-h-[35px]"
                                          />
                                        )}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            )}
                            {isSpecial && <div className="text-[10px] text-slate-400 italic text-center py-2">Not applicable for special weeks</div>}
                          </td>
                          <td className="p-2 border-r border-black align-top">
                            {!isSpecial && (
                              <div className="flex flex-col gap-2">
                                {week.competencies.map((c, cIdx) => {
                                  const isEnglishGr2Term3 = formData.grade.includes('Grade 2') && formData.term === '3' && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  const isEnglishCombined = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishCombined;
                                  
                                  let slotIndex = 0;
                                  let compSyllabus = currentSyllabus;
                                  if (isEnglishGr2Term3) {
                                    slotIndex = cIdx < 2 ? 0 : 1;
                                    compSyllabus = cIdx < 2 ? getEnglishTopics().oral : getEnglishTopics().literacy;
                                  } else if (isEnglishCombined) {
                                    slotIndex = cIdx < 3 ? 0 : 1;
                                    compSyllabus = cIdx < 3 ? getEnglishTopics().oral : getEnglishTopics().literacy;
                                  } else {
                                    if (cIdx < 2) slotIndex = 0;
                                    else if (cIdx < 4) slotIndex = 1;
                                    else slotIndex = 2;
                                  }

                                  const currentTopic = slotIndex === 0 ? week.topic : (slotIndex === 1 ? week.topic2 : week.topic3);
                                  const currentSubtopic = isEnglishCombined
                                    ? (week.subtopics[cIdx] || '')
                                    : (week.subtopics[slotIndex] || week.subtopics[cIdx] || '');
                                  const availableCompetencies = currentSubtopic
                                    ? getCompetenciesForSubtopic(currentTopic, currentSubtopic, compSyllabus)
                                    : [];
                                  
                                  return (
                                    <div key={cIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                                      <div className="w-full relative">
                                      {currentModuleIsExtracting ? (
                                        <div className="w-full min-h-[30px] flex items-center justify-center p-2 text-xs font-medium text-slate-400 bg-slate-50/50 rounded border border-slate-100">
                                          <Loader2 className="animate-spin text-emerald-500 mr-2" size={14} /> Extracting...
                                        </div>
                                      ) : compSyllabus && !manualTable ? (
                                        <select
                                          value={c}
                                          onChange={(e) => handleWeekChange(idx, 'competencies', cIdx, e.target.value)}
                                          className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-medium text-slate-700 outline-none"
                                        >
                                          <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                                          {availableCompetencies.map(oc => (
                                            <option key={oc} value={oc}>{oc}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <textarea
                                          value={c}
                                          onChange={(e) => handleWeekChange(idx, 'competencies', cIdx, e.target.value)}
                                          placeholder={isEnglishGr2Term3 
                                            ? (cIdx < 2 ? `Day ${cIdx + 1} Oral Competency` : `Day ${cIdx + 1} Lit Competency`) 
                                            : (isEnglishCombined
                                                ? (cIdx < 3 ? `Oral Competency ${cIdx + 1}` : `Lit Competency ${cIdx - 2}`)
                                                : (curriculumType === 'OBC' ? `Outcome ${cIdx+1}...` : `Competency ${cIdx+1}...`))}
                                          className="w-full bg-transparent border-0 outline-none text-xs font-medium resize-none min-h-[30px]"
                                        />
                                      )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isSpecial && <div className="text-[10px] text-slate-400 italic text-center py-2">Not applicable for special weeks</div>}
                          </td>
                            <td className="p-2 border-r border-black align-top h-full">
                              <textarea
                                value={week.teachingAids || ''}
                                onChange={(e) => handleWeekChange(idx, 'teachingAids', null, e.target.value)}
                                placeholder="T/L Aids..."
                                className="w-full h-full bg-transparent border-0 outline-none text-[10px] font-medium resize-none min-h-[100px]"
                              />
                            </td>
                            <td className="p-2 align-top h-full">
                              <textarea
                                value={week.references || ''}
                                onChange={(e) => handleWeekChange(idx, 'references', null, e.target.value)}
                                placeholder="Reference..."
                                className="w-full h-full bg-transparent border-0 outline-none text-[10px] font-medium resize-none min-h-[100px]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                </table>
              </div>

              {/* Stopping Topic Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 max-w-xl">
                    <p className="text-sm font-black text-slate-800">Select Term Stopping Topic</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Select or enter the stopping topic for {formData.grade || 'selected grade'} - {formData.subject || 'selected subject'} (Term {formData.term || '1'}). The system will generate schemes up to this topic number.
                    </p>
                  </div>
                  <div className="w-full sm:w-80">
                    <select
                      value={formData.stoppingTopic || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stoppingTopic: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select topic where the schemes of work is ending</option>
                      {renderTopicOptionsList(currentSyllabus, (title) => title)}
                    </select>
                  </div>
                </div>
              </div>

              {!isIWP && renderKnowledgeBase()}
            </div>
          )}

          {(activeInfo === 'forecast' || isForecast) && isForecast && (
            <div className="space-y-6">
              {renderGeneralInfoForm(true)}
              
              {false && <div className="flex flex-col gap-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                       <Layers size={18} className="text-indigo-600" />
                       <p className="text-sm font-bold text-indigo-900">Multi-Week Batch Generation</p>
                    </div>
                    <p className="text-[10px] text-indigo-600 font-medium italic">Unfold below to plan up to 5 weeks of forecasts at once.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setBatchForecastMode(!batchForecastMode)}
                    className={cn(
                      "w-12 h-6 rounded-full flex items-center px-1 transition-all h-7",
                      batchForecastMode ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-indigo-100/50">
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-indigo-900">Batch Size</p>
                    <p className="text-[10px] text-indigo-600 font-medium italic">How many weeks to plan?</p>
                  </div>
                  <select
                    value={batchForecasts.length}
                    onChange={(e) => {
                      const num = parseInt(e.target.value);
                      setBatchForecasts(prev => {
                        if (num > prev.length) {
                          const lastWeek = prev[prev.length - 1]?.week || 0;
                          return [...prev, ...Array.from({ length: num - prev.length }, (_, i) => ({
                            id: crypto.randomUUID(),
                            week: lastWeek + i + 1,
                            grade: formData.grade,
                            subject: formData.subject,
                            isActive: true,
                            isExpanded: false,
                            days: Array.from({ length: 5 }, (_, di) => ({
                              day: (di + 1).toString(),
                              topic: '',
                              subtopic: '',
                              competency: '',
                              activities: ['', '', '', ''],
                              teachingAids: '',
                              references: ''
                            }))
                          }))];
                        } else {
                          return prev.slice(0, num);
                        }
                      });
                    }}
                    className="bg-white border border-indigo-200 rounded-xl px-4 py-2 font-black text-xs text-indigo-600 outline-none shadow-sm"
                  >
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Weeks</option>)}
                  </select>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-indigo-100/50">
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-indigo-900">Use Smart Plan Logic?</p>
                    <p className="text-[10px] text-indigo-600 font-medium italic">The AI will auto-generate complete daily plans for empty fields.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSmartPlan(!smartPlan)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      smartPlan 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                        : "bg-white text-indigo-400 border border-indigo-200"
                    )}
                  >
                    <Wand2 size={14} />
                    {smartPlan ? "Smart Plan Active" : "Smart Plan Off"}
                  </button>
                </div>
              </div>}

                  {batchForecastMode ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                          {batchForecasts.map((forecast, bIdx) => {
                        const rawTableSyllabus = getSyllabusData(forecast.grade, forecast.subject)?.data || null;
                        const isTableSpecial = 
                          (forecast.grade.includes('Grade 10') || forecast.grade.includes('Grade 11') || forecast.grade.includes('Grade 12')) &&
                          (forecast.subject.toLowerCase().includes('english') || forecast.subject.toLowerCase().includes('zambian'));
                        const currentTableSyllabus = isTableSpecial ? transformSecondaryLanguageSyllabus(rawTableSyllabus) : rawTableSyllabus;
                        
                        return (
                          <div key={forecast.id} className={cn(
                            "bg-white border rounded-[2rem] overflow-hidden transition-all duration-300",
                            forecast.isActive ? "border-slate-200 shadow-md" : "border-slate-100 opacity-60"
                          )}>
                            <div 
                              className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => {
                                setBatchForecasts(prev => prev.map(f => 
                                  f.id === forecast.id ? { ...f, isExpanded: !f.isExpanded || !f.isActive, isActive: true } : f
                                ));
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all",
                                  forecast.isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                  {bIdx + 1}
                                </div>
                                <div>
                                   <h5 className="font-black text-xs uppercase tracking-widest text-slate-500">Weekly Forecast {bIdx + 1}</h5>
                                   {forecast.isActive && (
                                     <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                       Week {forecast.week} {forecast.subject && `• ${forecast.grade} ${forecast.subject}`}
                                     </p>
                                   )}
                                </div>
                              </div>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBatchForecasts(prev => prev.map(f => 
                                  f.id === forecast.id ? { ...f, isActive: !f.isActive } : f
                                ));
                              }}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                                forecast.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                              )}
                            >
                              {forecast.isActive ? "Active" : "Inactive"}
                            </button>
                            <ChevronDown size={20} className={cn("text-slate-400 transition-transform", forecast.isExpanded && forecast.isActive && "rotate-180")} />
                          </div>
                        </div>

                        {forecast.isActive && forecast.isExpanded && (
                          <div className="p-6 pt-0 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GRADE</label>
                                  <select 
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-blue-600 outline-none"
                                    value={forecast.grade}
                                    onChange={(e) => {
                                      const newGrade = e.target.value;
                                      setBatchForecasts(prev => prev.map(f => 
                                        f.id === forecast.id ? { ...f, grade: newGrade } : f
                                      ));
                                    }}
                                  >
                                    <option value="">Select...</option>
                                    {isDocTypeRestrictedForUser && isGradeLockActiveForUser && registeredGrades && registeredGrades.length > 0 ? (
                                      <>
                                        {(() => {
                                          const match = registeredGrades.filter(g => {
                                            if (g === 'all') return false;
                                            const isOBC = g.toLowerCase().includes('(obc)');
                                            if (curriculumType === 'OBC') {
                                              return isOBC;
                                            }
                                            return !isOBC;
                                          });
                                          return match.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                          ));
                                        })()}
                                      </>
                                    ) : (
                                      <>
                                        <optgroup label="CBC">
                                          {GRADES.filter(g => !g.toLowerCase().includes('(obc)') && !g.toLowerCase().includes('grade 7')).map(g => (
                                            <option key={g} value={g}>{g}</option>
                                          ))}
                                        </optgroup>
                                        <optgroup label="OBC">
                                          {OBC_LEVELS.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                          ))}
                                        </optgroup>
                                      </>
                                    )}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SUBJECT</label>
                                  <select 
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-blue-600 outline-none"
                                    value={forecast.subject}
                                    onChange={(e) => {
                                      const newSubject = e.target.value;
                                      setBatchForecasts(prev => prev.map(f => 
                                        f.id === forecast.id ? { ...f, subject: newSubject } : f
                                      ));
                                    }}
                                  >
                                    <option value="">Select...</option>
                                    {getAvailableSubjects(forecast.grade).map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WEEK</label>
                                  <select 
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-indigo-600 outline-none"
                                    value={forecast.week}
                                    onChange={(e) => {
                                      const newWeek = parseInt(e.target.value);
                                      setBatchForecasts(prev => prev.map(f => 
                                        f.id === forecast.id ? { ...f, week: newWeek } : f
                                      ));
                                    }}
                                  >
                                    {Array.from({ length: 13 }, (_, i) => (
                                      <option key={i+1} value={i+1}>Week {i+1}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DAYS</label>
                                  <select 
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-slate-600 outline-none"
                                    value={forecast.days.length}
                                    onChange={(e) => {
                                      const num = parseInt(e.target.value);
                                      setBatchForecasts(prev => prev.map(f => {
                                        if (f.id !== forecast.id) return f;
                                        let newDays = [...f.days];
                                        if (num > f.days.length) {
                                          newDays = [...newDays, ...Array.from({ length: num - f.days.length }, (_, i) => ({
                                            day: (f.days.length + i + 1).toString(),
                                            topic: '',
                                            subtopic: '',
                                            competency: '',
                                            activities: ['', '', '', '']
                                          }))];
                                        } else {
                                          newDays = newDays.slice(0, num);
                                        }
                                        return { ...f, days: newDays };
                                      }));
                                    }}
                                  >
                                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Days</option>)}
                                  </select>
                                </div>
                             </div>

                             <div className="w-full overflow-x-auto border border-black rounded-lg shadow-sm">
                                <table className="w-full border-collapse border border-black text-[10px]">
                                  <thead>
                                    <tr className="bg-slate-100 border-b border-black text-[9px]">
                                      <th className="p-2 border-r border-black text-left font-black w-28 uppercase">Day & Date</th>
                                      <th className="p-2 border-r border-black text-left font-black w-32 uppercase">Topic</th>
                                      <th className="p-2 border-r border-black text-left font-black w-32 uppercase">Subtopic</th>
                                      <th className="p-2 border-r border-black text-left font-black w-40 uppercase">{curriculumType === 'OBC' ? 'Specific Outcome' : 'Specific Competency'}</th>
                                      <th className="p-2 border-r border-black text-left font-black w-32 uppercase text-indigo-700">T/L Aids</th>
                                      <th className="p-2 text-left font-black uppercase text-blue-700">References</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {forecast.days.map((day, idx) => (
                                      <tr key={idx} className="border-b border-black last:border-0 h-32">
                                        <td className="p-2 border-r border-black font-bold text-center align-top pt-2 bg-slate-50/30">
                                          Day {day.day}
                                          {((forecast.grade.includes('Grade 1') || forecast.grade.includes('Grade 2')) && forecast.subject.toLowerCase().includes('english') && formData.englishCombined) && (
                                            <div className="text-[8px] uppercase text-blue-600 mt-1">
                                              {(() => {
                                                const isGr2T3 = forecast.grade.includes('Grade 2') && formData.term === '3';
                                                const threshold = isGr2T3 ? 2 : 3;
                                                return idx < threshold ? 'Oral' : 'Lit';
                                              })()}
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-2 border-r border-black align-top h-full">
                                          {currentTableSyllabus ? (
                                            <select
                                              value={day.topic}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], topic: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-bold text-slate-800 outline-none"
                                            >
                                              <option value="">Select Topic</option>
                                              {currentTableSyllabus.map((t, tIdx) => (
                                                <option key={`${t.title}-${tIdx}`} value={t.title}>{stripPageNumbers(t.title)}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <textarea
                                              placeholder="Day topic..."
                                              value={day.topic}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], topic: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              className="w-full h-full bg-transparent border-0 outline-none resize-none font-bold text-slate-800"
                                            />
                                          )}
                                        </td>
                                        <td className="p-2 border-r border-black align-top h-full">
                                          {currentTableSyllabus ? (
                                            <select
                                              value={day.subtopic}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], subtopic: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none mb-2"
                                            >
                                              <option value="">Select Sub-topic</option>
                                              {getSubtopicsForTopic(day.topic, currentTableSyllabus).map((st, stIdx) => (
                                                <option key={`${st.title}-${stIdx}`} value={st.title}>{stripPageNumbers(st.title)}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <textarea
                                              value={day.subtopic}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], subtopic: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              placeholder="Enter sub-topic"
                                              className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                            />
                                          )}
                                        </td>
                                        <td className="p-2 border-r border-black align-top h-full">
                                          {currentTableSyllabus ? (
                                            <select
                                              value={day.competency}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], competency: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                            >
                                              <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                                              {getCompetenciesForSubtopic(day.topic, day.subtopic, currentTableSyllabus).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <textarea
                                              value={day.competency}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBatchForecasts(prev => prev.map(f => {
                                                  if (f.id !== forecast.id) return f;
                                                  const newDays = [...f.days];
                                                  newDays[idx] = { ...newDays[idx], competency: val };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              placeholder={curriculumType === 'OBC' ? 'Specify outcome...' : 'Specify competency...'}
                                              className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                            />
                                          )}
                                        </td>
                                        {curriculumType !== 'OBC' && (<td className="p-2 border-r border-black align-top h-full">
                                           <div className="flex flex-col gap-2">
                                             {day.activities.map((act, aIdx) => (
                                               <div key={aIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                                                 {currentTableSyllabus ? (
                                                   <select
                                                     value={act}
                                                     onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBatchForecasts(prev => prev.map(f => {
                                                          if (f.id !== forecast.id) return f;
                                                          const newDays = [...f.days];
                                                          const newActs = [...newDays[idx].activities];
                                                          newActs[aIdx] = val;
                                                          newDays[idx] = { ...newDays[idx], activities: newActs };
                                                          return { ...f, days: newDays };
                                                        }));
                                                     }}
                                                     className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                                   >
                                                    <option value="">{isFetchingActivities[`${forecast.grade}-${forecast.subject}-${day.topic}-${day.subtopic}-${day.competency}`] ? "Searching Syllabus..." : "Select Activity"}</option>
                                                     {getActivitiesForSubtopic(day.topic, day.subtopic, day.competency, currentTableSyllabus, forecast.grade, forecast.subject).map((oact) => (
                                                       <option key={oact} value={oact}>{oact}</option>
                                                     ))}
                                                   </select>
                                                 ) : (
                                                   <textarea
                                                     value={act}
                                                     onChange={(e) => {
                                                        const val = e.target.value;
                                                        setBatchForecasts(prev => prev.map(f => {
                                                          if (f.id !== forecast.id) return f;
                                                          const newDays = [...f.days];
                                                          const newActs = [...newDays[idx].activities];
                                                          newActs[aIdx] = val;
                                                          newDays[idx] = { ...newDays[idx], activities: newActs };
                                                          return { ...f, days: newDays };
                                                        }));
                                                     }}
                                                     placeholder={`Activity ${aIdx+1}...`}
                                                     className="w-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none min-h-[30px]"
                                                   />
                                                 )}
                                               </div>
                                             ))}
                                           </div>
                                        </td>)}
                                        <td className="p-2 align-top text-[8px] text-slate-400 italic">
                                           Smart plan will fill this based on {forecast.grade} {forecast.subject} syllabus.
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-blue-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PLANNING WEEK</span>
                        <select 
                          value={formData.forecastWeek}
                          onChange={(e) => setFormData(prev => ({ ...prev, forecastWeek: parseInt(e.target.value) }))}
                          className="bg-transparent border-0 font-black text-sm text-blue-600 outline-none mt-0.5"
                        >
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i+1} value={i+1}>Week {i+1}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-4">
                      <Clock size={18} className="text-indigo-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DAYS</span>
                        <select 
                          value={formData.forecastDays?.length || 5}
                          onChange={(e) => handleForecastDaysChange(parseInt(e.target.value))}
                          className="bg-transparent border-0 font-black text-sm text-indigo-600 outline-none mt-0.5"
                        >
                          {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n} Days</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch justify-center border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-4 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) {
                            toast.error("Please log in to sync from saved schemes.");
                            return;
                          }

                          toast.loading("Checking your sync history...", { id: 'sync-check' });
                          try {
                            const activeSources = await fetchActiveSyncSources();
                            toast.dismiss('sync-check');
                            const overlap = checkOverlapSources(activeSources);
                            if (overlap) {
                              setOverlapModal({
                                isOpen: true,
                                action: 'sync',
                                oralDoc: overlap.oralDoc,
                                literacyDoc: overlap.literacyDoc,
                                grade: formData.grade || '',
                                activeSources: activeSources
                              });
                              return;
                            }
                          } catch (err) {
                            console.error("Error verifying sync sources", err);
                            toast.dismiss('sync-check');
                          }

                          let currentWeeks = formData.weeks;

                          // If current weeks are empty or non-existent, try to fetch from Firestore sync_sources
                          if (!currentWeeks || currentWeeks.length === 0 || !currentWeeks[0].topic) {
                            toast.loading("Checking for saved schemes in your sync history...", { id: 'sync-check' });
                            try {
                              const activeSources = await fetchActiveSyncSources();
                              
                              const isCombinedEng = (formData.grade?.includes('Grade 1') || formData.grade?.includes('Grade 2')) && 
                                                    formData.englishCombined && 
                                                    formData.subject.toLowerCase().includes('english');

                              if (isCombinedEng) {
                                const matchingSchemeDocs = activeSources.filter(d => 
                                  d.type === 'schemes_of_work' &&
                                  isSubjectAndGradeMatch(d.grade, d.subject, formData.grade || '', formData.subject || '')
                                );

                                const oralDoc = matchingSchemeDocs.find(d => d.subject.toLowerCase().includes('oral'));
                                const literacyDoc = matchingSchemeDocs.find(d => d.subject.toLowerCase().includes('literacy'));
                                const combinedDoc = matchingSchemeDocs.find(d => !d.subject.toLowerCase().includes('oral') && !d.subject.toLowerCase().includes('literacy'));

                                const oralWeeks = oralDoc ? parseMarkdownTableToWeeks(oralDoc.content) : null;
                                const literacyWeeks = literacyDoc ? parseMarkdownTableToWeeks(literacyDoc.content) : null;
                                const combinedWeeks = combinedDoc ? parseMarkdownTableToWeeks(combinedDoc.content) : null;

                                const forecastWeekNum = formData.forecastWeek || 1;
                                const oralWeekData = (oralWeeks && oralWeeks[forecastWeekNum - 1]) || (combinedWeeks && combinedWeeks[forecastWeekNum - 1]);
                                const literacyWeekData = (literacyWeeks && literacyWeeks[forecastWeekNum - 1]) || (combinedWeeks && combinedWeeks[forecastWeekNum - 1]);

                                if (oralWeekData || literacyWeekData) {
                                  const oralTop = oralWeekData?.topic || 'N/A';
                                  const oralSubs = oralWeekData?.subtopics ? oralWeekData.subtopics.join(', ') : 'N/A';
                                  const oralComps = oralWeekData?.competencies ? oralWeekData.competencies.join(', ') : 'N/A';
                                  
                                  const litTop = literacyWeekData?.topic || 'N/A';
                                  const litSubs = literacyWeekData?.subtopics ? literacyWeekData.subtopics.join(', ') : 'N/A';
                                  const litComps = literacyWeekData?.competencies ? literacyWeekData.competencies.join(', ') : 'N/A';

                                  const combinedSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Combined Schemes of Work):
• ORAL ENGLISH SCHEME (Days 1-3):
  - Topic: ${oralTop}
  - Subtopics: ${oralSubs}
  - Competencies: ${oralComps}
  - Aids: ${oralWeekData?.teachingAids || 'N/A'}
  - References: ${oralWeekData?.references || 'N/A'}

• LITERACY IN ENGLISH SCHEME (Days 4-5):
  - Topic: ${litTop}
  - Subtopics: ${litSubs}
  - Competencies: ${litComps}
  - Aids: ${literacyWeekData?.teachingAids || 'N/A'}
  - References: ${literacyWeekData?.references || 'N/A'}

Instructions: 
Combine both Oral English (Days 1-3) and Literacy in English (Days 4-5) schemes into a unified weekly document as they interchange during the week. All content must strictly follow the CDC syllabus and teaching modules.`;

                                  setFormData(prev => ({
                                    ...prev,
                                    additionalContext: combinedSyncInstructionStr,
                                    forecastDays: prev.forecastDays.map((day, dIdx) => {
                                      const isOralDay = dIdx < 2;
                                      const targetWeekData = isOralDay ? (oralWeekData || literacyWeekData) : (literacyWeekData || oralWeekData);
                                      if (!targetWeekData) return day;

                                      const numSubs = targetWeekData.subtopics?.length || 1;
                                      const oralCount = 2;
                                      const litCount = prev.forecastDays.length - oralCount;
                                      const dayInTypeIdx = isOralDay ? dIdx : dIdx - oralCount;
                                      const typeCount = isOralDay ? oralCount : litCount;

                                      const subIndex = Math.min(Math.floor((dayInTypeIdx / typeCount) * numSubs), numSubs - 1);
                                      const sub = targetWeekData.subtopics?.[subIndex] || targetWeekData.subtopics?.[0] || day.subtopic;
                                      const top = targetWeekData.topic || day.topic;
                                      const comp = targetWeekData.competencies?.[subIndex] || targetWeekData.competencies?.[0] || day.competency;
                                      const acts = getActivitiesForSubtopic(top, sub, comp);
                                      const dayAct = acts[dayInTypeIdx % acts.length] || acts[0] || '';

                                      return {
                                        ...day,
                                        learningArea: isOralDay ? 'Oral English' : 'Literacy in English',
                                        topic: top,
                                        subtopic: sub,
                                        competency: comp,
                                        activities: dayAct ? [dayAct] : day.activities,
                                        teachingAids: targetWeekData.teachingAids || day.teachingAids,
                                        references: targetWeekData.references || day.references
                                      };
                                    })
                                  }));
                                  setLastSyncTime(Date.now());
                                  setSyncInstructionsText(combinedSyncInstructionStr);
                                  toast.success(`Successfully combined and synced Oral English & Literacy schemes for Week ${forecastWeekNum}!`, { id: 'sync-check' });
                                  return;
                                }
                              }

                              const matchingDoc = activeSources.find(d => 
                                d.type === 'schemes_of_work' &&
                                isSubjectAndGradeMatch(d.grade, d.subject, formData.grade || '', formData.subject || '')
                              );
                              
                              if (matchingDoc) {
                                const extractedWeeks = parseMarkdownTableToWeeks(matchingDoc.content);
                                if (extractedWeeks && extractedWeeks.length > 0) {
                                  currentWeeks = extractedWeeks;
                                  setFormData(prev => ({ ...prev, weeks: extractedWeeks }));
                                  toast.success("Found your saved scheme! Syncing data...", { id: 'sync-check' });
                                } else {
                                  toast.dismiss('sync-check');
                                  toast.error("Document unavailable: Could not parse saved Scheme of Work table data.", { id: 'sync-status', duration: 5000 });
                                  setSyncUnavailableModal({
                                    isOpen: true,
                                    requestedType: 'Scheme of Work',
                                    requestedSubject: formData.subject || 'Not specified',
                                    requestedGrade: formData.grade || 'Not specified',
                                    availableDocs: activeSources
                                  });
                                  return;
                                }
                              } else {
                                toast.dismiss('sync-check');
                                toast.error(`Document unavailable: No saved Scheme of Work found for ${formData.subject || 'selected subject'} (${formData.grade || 'selected grade'}).`, { id: 'sync-status', duration: 5000 });
                                setSyncUnavailableModal({
                                  isOpen: true,
                                  requestedType: 'Scheme of Work',
                                  requestedSubject: formData.subject || 'Not specified',
                                  requestedGrade: formData.grade || 'Not specified',
                                  availableDocs: activeSources
                                });
                                return;
                              }
                            } catch (err) {
                              handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sync_sources`);
                              toast.dismiss('sync-check');
                              return;
                            }
                          }

                          const weekData = currentWeeks[formData.forecastWeek - 1];
                          if (!weekData) {
                            toast.error(`Scheme of Work data not found for Week ${formData.forecastWeek}`);
                            return;
                          }
                          
                          const forecastWeekNum = formData.forecastWeek || 1;
                          const topVal = weekData.topic || 'N/A';
                          const subVal = weekData.subtopics ? weekData.subtopics.join(', ') : 'N/A';
                          const compVal = weekData.competencies ? weekData.competencies.join(', ') : 'N/A';
                          const actVal = (weekData as any).suggestedActivities ? (weekData as any).suggestedActivities.join(', ') : (weekData.activities ? weekData.activities.join(', ') : 'N/A');
                          const methodVal = 'Communicative approach, problem-solving, group work';
                          const aidVal = weekData.teachingAids || 'N/A';
                          const refVal = weekData.references || 'N/A';

                          const schemeSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Scheme of Work):
• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}

Instructions: 
(Weekly forecast:) let the weekly forecast be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.
Modules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;

                          setFormData(prev => ({
                            ...prev,
                            additionalContext: schemeSyncInstructionStr,
                            forecastDays: prev.forecastDays.map((day, dIdx) => {
                              const numSubs = weekData.subtopics?.length || 1;
                              const subIndex = Math.min(Math.floor((dIdx / (prev.forecastDays.length || 5)) * numSubs), numSubs - 1);
                              const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || day.subtopic;
                              const top = weekData.topic || day.topic;
                              const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
                              const expStd = weekData.expectedStandards?.[subIndex] || weekData.expectedStandards?.[0] || '';

                              // Extract actual activities parsed from the Scheme of Work table row
                              const rawActs = weekData.activities || [];
                              const parsedActs: string[] = [];
                              rawActs.forEach(actStr => {
                                if (!actStr) return;
                                actStr.split('\n').forEach(line => {
                                  const cleaned = line.replace(/^[\s*\-•\d\.)]+/, '').trim();
                                  if (cleaned) parsedActs.push(cleaned);
                                });
                              });

                              const activeActs = parsedActs.length > 0 ? parsedActs : getActivitiesForSubtopic(top, sub, comp);
                              const dayAct = activeActs[dIdx % activeActs.length] || activeActs[0] || '';

                              return {
                                ...day,
                                topic: top,
                                subtopic: sub,
                                competency: comp,
                                expectedStandard: expStd,
                                activities: dayAct ? [dayAct] : day.activities,
                                teachingAids: weekData.teachingAids || day.teachingAids,
                                references: weekData.references || day.references
                              };
                            })
                          }));
                          setLastSyncTime(Date.now());
                          setSyncInstructionsText(schemeSyncInstructionStr);
                          toast.success(`Successfully imported data from the schemes for Week ${formData.forecastWeek}`);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        <HistoryIcon size={14} />
                        Sync From Schemes
                      </button>
                      <div className="space-y-2 mt-2">
                        <p className="text-[10px] text-indigo-900 bg-indigo-50/80 border border-indigo-100 rounded-xl p-2.5 font-medium text-center leading-relaxed shadow-sm">
                          For a user to generate and sync any documents from schemes or weekly forecast, one should have synced or saved the already generated documents to the system.
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleResetSyncHistory('weekly_forecast');
                              }}
                              className="w-full flex items-center justify-center gap-1 py-2 text-red-600 hover:text-red-800 font-black text-[9px] uppercase tracking-wider transition-all bg-white border border-red-100 hover:bg-red-50 rounded-xl"
                              title="Reset only saved Weekly Forecasts"
                            >
                              <Trash2 size={11} />
                              Reset Forecasts
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleResetSyncHistory('schemes_of_work');
                              }}
                              className="w-full flex items-center justify-center gap-1 py-2 text-amber-700 hover:text-amber-900 font-black text-[9px] uppercase tracking-wider transition-all bg-white border border-amber-200/80 hover:bg-amber-50 rounded-xl"
                              title="Reset only saved Schemes of Work"
                            >
                              <Trash2 size={11} />
                              Reset Schemes
                            </button>
                          </div>
                          {lastSyncTime && (
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                              <FileCheck size={12} />
                              Synchronization Active
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Dynamic Sync Instructions Box */}
              {syncInstructionsText && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3 my-4 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0 mt-0.5">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h5 className="font-black text-xs uppercase tracking-widest text-emerald-900">Sync Details & Status</h5>
                      <p className="text-xs font-semibold text-emerald-700 mt-1">{syncInstructionsText}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSyncInstructionsText(null)}
                    className="text-emerald-400 hover:text-emerald-700 p-1 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 my-4">
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>✨</span> Need help filling the table?
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium italic">
                    Magic fill will auto-populate real topics, subtopics and specific competencies or specific outcomes for all week/term
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSmartPlan(!smartPlan)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all w-full sm:w-auto justify-center shadow-md active:scale-95",
                    smartPlan 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                  )}
                >
                  <Sparkles size={16} className="text-amber-300 fill-amber-300" />
                  {smartPlan ? "✨ Magic Fill Active" : "✨ Magic Fill Off"}
                </button>
              </div>

              {/* Hide/Reveal Weekly Table Toggle */}
              <div className="flex justify-between items-center my-4">
                <button
                  type="button"
                  onClick={() => setIsWeeklyTableVisible(!isWeeklyTableVisible)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
                >
                  {isWeeklyTableVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isWeeklyTableVisible ? "Hide Weekly Forecast Table" : "Show Weekly Forecast Table"}
                </button>
              </div>

              {isWeeklyTableVisible && (
                <div className="w-full overflow-x-auto border border-black rounded-lg shadow-sm">
                    <table className="w-full border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black text-[9px]">
                          <th className="p-2 border-r border-black text-left font-black w-14 uppercase">Day</th>
                          <th className="p-2 border-r border-black text-left font-black w-32 uppercase">Topic</th>
                          <th className="p-2 border-r border-black text-left font-black w-32 uppercase">Subtopic</th>
                          <th className="p-2 border-r border-black text-left font-black w-40 uppercase">{curriculumType === 'OBC' ? 'Specific Outcome' : 'Specific Competency'}</th>
                          {curriculumType !== 'OBC' && !isScheme && !isForecast && <th className="p-2 border-r border-black text-left font-black w-48 uppercase text-[#00A86B]">Learning Activities</th>}
                          <th className="p-2 text-left font-black uppercase text-slate-400">Other columns added by AI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.forecastDays?.map((day, idx) => (
                          <tr key={idx} className="border-b border-black last:border-0 h-32">
                            <td className="p-2 border-r border-black font-bold text-center align-top pt-3 bg-slate-50/30 w-28">
                              <div className="font-extrabold text-slate-700">Day {day.day}</div>
                              {((formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishCombined) && (
                                <div className="mt-1.5">
                                  {formData.englishCombined ? (
                                    <select
                                      value={(day as any).learningArea || (() => {
                                        const isGr2T3 = formData.grade.includes('Grade 2') && formData.term === '3';
                                        const threshold = isGr2T3 ? 2 : 3;
                                        return idx < threshold ? 'Oral English' : 'Literacy in English';
                                      })()}
                                      onChange={(e) => handleForecastChange(idx, 'learningArea', e.target.value)}
                                      className="w-full text-[8px] font-black uppercase tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-200 rounded p-1 shadow-sm outline-none"
                                    >
                                      <option value="Oral English">Oral English (30m)</option>
                                      <option value="Literacy in English">Literacy (60m)</option>
                                    </select>
                                  ) : (formData.subject.toLowerCase().includes('literacy') || formData.englishComponent === 'literacy') ? (
                                    <div className="px-1 py-0.5 text-[8px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-center">
                                      Literacy (60m)
                                    </div>
                                  ) : (
                                    <div className="px-1 py-0.5 text-[8px] font-black uppercase tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-center">
                                      Oral English (30m)
                                    </div>
                                  )}
                                </div>
                              )}
                              <input
                                type="text"
                                value={day.date || ''}
                                onChange={(e) => handleForecastChange(idx, 'date', e.target.value)}
                                placeholder="DD-MM-YYYY"
                                className="w-full mt-2 text-center bg-white border border-slate-200 rounded p-1 text-[9px] font-black text-indigo-600 shadow-sm"
                              />
                              {day.date && (() => {
                                const parts = day.date.split('-');
                                if (parts.length === 3) {
                                  const year = parseInt(parts[2]);
                                  const hMap = getZambianHolidays(year);
                                  const hName = hMap[day.date];
                                  if (hName) {
                                    return (
                                      <div className="mt-1 text-[8px] font-black uppercase text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100 leading-tight">
                                        {hName}
                                      </div>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </td>
                            <td className="p-2 border-r border-black align-top h-full">
                              {currentSyllabus ? (
                                <select
                                  value={day.topic}
                                  onChange={(e) => handleForecastChange(idx, 'topic', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-bold text-slate-800 outline-none"
                                >
                                  <option value="">Select Topic</option>
                                  {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') ? (
                                    formData.englishCombined ? (
                                      <>
                                        {renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")}
                                        {renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")}
                                      </>
                                    ) : (formData.subject.toLowerCase().includes('literacy') || formData.englishComponent === 'literacy') ? (
                                      renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")
                                    ) : (
                                      renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")
                                    )
                                  ) : (
                                    renderTopicOptionsList(currentSyllabus, stripPageNumbers)
                                  )}
                                </select>
                              ) : (
                                <textarea
                                  placeholder="Day topic..."
                                  value={day.topic}
                                  onChange={(e) => handleForecastChange(idx, 'topic', e.target.value)}
                                  className="w-full h-full bg-transparent border-0 outline-none resize-none font-bold text-slate-800"
                                />
                              )}
                            </td>
                            <td className="p-2 border-r border-black align-top h-full">
                              {currentSyllabus ? (
                                <select
                                  value={day.subtopic}
                                  onChange={(e) => handleForecastChange(idx, 'subtopic', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none mb-2"
                                >
                                  <option value="">Select Sub-topic</option>
                                  {getSubtopicsForTopic(day.topic).map((st, stIdx) => (
                                    <option key={`${st.title}-${stIdx}`} value={st.title}>{stripPageNumbers(st.title)}</option>
                                  ))}
                                </select>
                              ) : (
                                <textarea
                                  value={day.subtopic}
                                  onChange={(e) => handleForecastChange(idx, 'subtopic', e.target.value)}
                                  placeholder="Enter sub-topic"
                                  className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                />
                              )}
                            </td>
                            <td className="p-2 border-r border-black align-top h-full">
                              {currentSyllabus ? (
                                <select
                                  value={day.competency}
                                  onChange={(e) => handleForecastChange(idx, 'competency', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                >
                                  <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                                  {getCompetenciesForSubtopic(day.topic, day.subtopic).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              ) : (
                                <textarea
                                  value={day.competency}
                                  onChange={(e) => handleForecastChange(idx, 'competency', e.target.value)}
                                  placeholder={curriculumType === 'OBC' ? 'Specify outcome...' : 'Specify competency...'}
                                  className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                />
                              )}
                            </td>
                            {curriculumType !== 'OBC' && !isScheme && !isForecast && (<td className="p-2 border-r border-black align-top h-full">
                               <div className="flex flex-col gap-2">
                                 {((day as any).activities || ['', '', '', '']).map((act: string, aIdx: number) => (
                                   <div key={aIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                                     {currentSyllabus ? (
                                       <select
                                         value={act}
                                         onChange={(e) => handleForecastChange(idx, 'activities', e.target.value, aIdx)}
                                         className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                       >
                                        <option value="">{isFetchingActivities[`${formData.grade}-${formData.subject}-${day.topic}-${day.subtopic}-${day.competency}`] ? "Searching Syllabus..." : "Select Activity"}</option>
                                         {getActivitiesForSubtopic(day.topic, day.subtopic, day.competency).map((oact: string) => (
                                           <option key={oact} value={oact}>{oact}</option>
                                         ))}
                                       </select>
                                     ) : (
                                       <textarea
                                         value={act}
                                         onChange={(e) => handleForecastChange(idx, 'activities', e.target.value, aIdx)}
                                         placeholder={`Activity ${aIdx+1}...`}
                                         className="w-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none min-h-[30px]"
                                       />
                                     )}
                                   </div>
                                 ))}
                               </div>
                            </td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </>
              )}
              
              <div className="flex justify-between items-center my-4">
                <button
                  type="button"
                  onClick={() => setIsReferenceBlockVisible(!isReferenceBlockVisible)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
                >
                  {isReferenceBlockVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isReferenceBlockVisible ? "Hide Reference Materials & Syllabus" : "Show Reference Materials & Syllabus"}
                </button>
              </div>

              {!isIWP && isReferenceBlockVisible && renderKnowledgeBase()}
            </div>
          )}
        </div>

        {showContentDetails && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center my-2">
              <button
                type="button"
                onClick={() => setIsLessonContentDetailsVisible(!isLessonContentDetailsVisible)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
              >
                {isLessonContentDetailsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                {isLessonContentDetailsVisible ? "Hide Content Details (Topic, Subtopic, Competencies)" : "Show Content Details (Topic, Subtopic, Competencies)"}
              </button>
            </div>

            {isLessonContentDetailsVisible && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
                  <h4 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">
                    {batchMode ? "Batch Lesson Details" : "Select Content Details"}
                  </h4>
                </div>

            {batchMode ? (
              <div className="space-y-6">
                {batchLessons.map((lesson, bIdx) => (
                  <div key={lesson.id} className="relative bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                          {bIdx + 1}
                        </div>
                        <h5 className="font-black text-xs uppercase tracking-widest text-slate-500">Lesson {bIdx + 1}</h5>
                      </div>
                      {batchLessons.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeBatchLesson(lesson.id)}
                          className="text-red-500 hover:text-red-700 p-2 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TOPIC</label>
                        {currentSyllabus ? (
                          <select
                            value={lesson.topic}
                            onChange={(e) => updateBatchLesson(lesson.id, 'topic', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm"
                          >
                            <option value="">Select Topic</option>
                            {renderTopicOptionsList(currentSyllabus, (title) => title)}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={lesson.topic} 
                            onChange={(e) => updateBatchLesson(lesson.id, 'topic', e.target.value)} 
                            placeholder="Type topic..." 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm" 
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SUB-TOPIC</label>
                        {currentSyllabus ? (
                          <select
                            value={lesson.subtopic}
                            onChange={(e) => updateBatchLesson(lesson.id, 'subtopic', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm"
                          >
                            <option value="">Select Sub-topic</option>
                            {getSubtopicsForTopic(lesson.topic).map((st, stIdx) => (
                              <option key={`${st.title}-${stIdx}`} value={st.title}>{st.title}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={lesson.subtopic} 
                            onChange={(e) => updateBatchLesson(lesson.id, 'subtopic', e.target.value)} 
                            placeholder="Enter sub-topic..." 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm" 
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{curriculumType === 'OBC' ? 'SPECIFIC OUTCOMES' : 'SPECIFIC COMPETENCES'}</label>
                        {currentSyllabus ? (
                          <select
                            value={lesson.specificCompetences}
                            onChange={(e) => updateBatchLesson(lesson.id, 'specificCompetences', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm"
                          >
                            <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                            {getCompetenciesForSubtopic(lesson.topic, lesson.subtopic).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <textarea 
                            value={lesson.specificCompetences} 
                            onChange={(e) => updateBatchLesson(lesson.id, 'specificCompetences', e.target.value)} 
                            placeholder={curriculumType === 'OBC' ? 'List outcomes...' : 'List competencies...'} 
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none text-sm shadow-sm" 
                            rows={2} 
                          />
                        )}
                      </div>

                      {curriculumType !== 'OBC' && formData.type !== 'schemes_of_work' && formData.type !== 'weekly_forecast' && (<div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LEARNING ACTIVITIES</label>
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1">
                          {getActivitiesForSubtopic(lesson.topic, lesson.subtopic, lesson.specificCompetences).map((act, idx) => {
                            const isSelected = lesson.learningActivities.includes(act);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const current = lesson.learningActivities;
                                  let newActs;
                                  if (isSelected) {
                                    newActs = current.filter(a => a !== act);
                                  } else {
                                    newActs = [...current, act];
                                  }
                                  updateBatchLesson(lesson.id, 'learningActivities', newActs);
                                }}
                                className={cn(
                                  "text-left p-2 rounded-lg border text-[10px] font-bold transition-all",
                                  isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                )}
                              >
                                {act}
                              </button>
                            );
                          })}
                        </div>
                      </div>)}
                    </div>
                  </div>
                ))}

                {batchLessons.length < 5 && (
                  <button 
                    type="button"
                    onClick={addBatchLesson}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                  >
                    <Plus size={20} />
                    Add Another Lesson Plan
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {isZambianLanguageSubject && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages size={16} className="text-emerald-700" />
                        <label className="text-xs font-black uppercase tracking-wider text-emerald-900">
                          Regional Zambian Language Dialect
                        </label>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                        Active: {formData.zambianLanguage || 'Icibemba'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Icibemba', 'Cinyanja', 'Chitonga', 'Silozi', 'Kiikaonde', 'Lunda', 'Luvale'].map((lang) => {
                        const isSelected = (formData.zambianLanguage || 'Icibemba') === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, zambianLanguage: lang }))}
                            className={cn(
                              "px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer",
                              isSelected 
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-sm font-black" 
                                : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/60 hover:text-emerald-900"
                            )}
                          >
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                      Topic and subtopic translations below update in real time for <b>{formData.zambianLanguage || 'Icibemba'}</b>. Generated documents will feature authentic local vocabulary, examples, and native language explanations.
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {getTermLabel('TOPICS', syllabusResult?.isShowingAll)}
                  </label>
                  {currentModuleIsExtracting ? (
                    <div className="w-full flex items-center justify-center p-4 text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                      <Loader2 className="animate-spin text-emerald-500 mr-2" size={16} /> AI Extracting topics...
                    </div>
                  ) : currentSyllabus ? (
                    <div className="relative">
                      <select
                        name="topic"
                        value={formData.topic}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all appearance-none pr-10"
                      >
                        <option value="">Select Topic</option>
                        {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') ? (
                          formData.englishCombined ? (
                            <>
                              {renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")}
                              {renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")}
                            </>
                          ) : (formData.subject.toLowerCase().includes('literacy') || formData.englishComponent === 'literacy') ? (
                            renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")
                          ) : (
                            renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")
                          )
                        ) : (
                          renderTopicOptionsList(currentSyllabus)
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      placeholder="Select or type topic..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  )}

                  {formData.topic && currentSyllabus?.find(t => t.title === formData.topic)?.generalCompetency && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">
                        {curriculumType === 'OBC' ? 'General Outcome' : 'General Competency'}
                      </p>
                      <p className="text-xs font-bold text-blue-700 italic">
                        {currentSyllabus.find(t => t.title === formData.topic)?.generalCompetency}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {formData.type === 'lesson_notes' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                          {getTermLabel('SUBTOPICS (SELECT UP TO 3)', syllabusResult?.isShowingAll)}
                        </label>
                        {formData.selectedSubtopics && formData.selectedSubtopics.length > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            {formData.selectedSubtopics.length}/3 Selected
                          </span>
                        )}
                      </div>
                      {currentModuleIsExtracting ? (
                        <div className="w-full flex items-center justify-center p-4 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                          <Loader2 className="animate-spin text-emerald-500 mr-2" size={16} /> AI Extracting sub-topics...
                        </div>
                      ) : currentSyllabus ? (
                        <div className="grid grid-cols-1 gap-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {getSubtopicsForTopic(formData.topic).map((st, stIdx) => {
                            const isSelected = (formData.selectedSubtopics || []).includes(st.title);
                            return (
                              <div
                                key={`${st.title}-${stIdx}`}
                                onClick={() => {
                                  let nextSubtopics = [...(formData.selectedSubtopics || [])];
                                  if (isSelected) {
                                    nextSubtopics = nextSubtopics.filter(s => s !== st.title);
                                  } else {
                                    if (nextSubtopics.length >= 3) {
                                      toast.error("You can select up to 3 sub-topics.");
                                      return;
                                    }
                                    nextSubtopics.push(st.title);
                                  }
                                  
                                  // Automatically aggregate competencies/outcomes initially, but let user select
                                  const nextCompetencies = nextSubtopics.flatMap(sName => 
                                    getCompetenciesForSubtopic(formData.topic, sName)
                                  );
                                  
                                  // Also gather learning activities for ALL initially (will be refined by competence selection)
                                  const nextActivities = nextSubtopics.flatMap(sName => {
                                    const subtopicComps = getCompetenciesForSubtopic(formData.topic, sName);
                                    if (subtopicComps.length === 0) {
                                      return getActivitiesForSubtopic(formData.topic, sName, "");
                                    }
                                    return subtopicComps.flatMap(comp => getActivitiesForSubtopic(formData.topic, sName, comp));
                                  });

                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubtopics: nextSubtopics,
                                    subtopic: nextSubtopics.join(", "),
                                    specificCompetences: nextCompetencies.join("\n"),
                                    learningActivities: Array.from(new Set(nextActivities))
                                  }));
                                }}
                                className={`flex items-start gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold shadow-sm'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-sm leading-tight font-bold text-slate-800">{stripPageNumbers(st.title)}</span>
                                  {isZambianLanguageSubject && (
                                    <span className="text-[11px] text-emerald-700 font-bold italic mt-0.5">
                                      {getZambianTopicTranslation(st.title, formData.zambianLanguage || 'Icibemba') ? `(${getZambianTopicTranslation(st.title, formData.zambianLanguage || 'Icibemba')} - ${formData.zambianLanguage || 'Icibemba'})` : `(${formData.zambianLanguage || 'Icibemba'})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {getSubtopicsForTopic(formData.topic).length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-2">No sub-topics found for this topic. Please type custom sub-topics below.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400 font-bold mb-1">Enter up to 3 sub-topics:</p>
                          {Array.from({ length: 3 }).map((_, index) => {
                            const listVals = formData.selectedSubtopics || [];
                            const currentVal = listVals[index] || '';
                            return (
                              <div key={index} className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
                                <input
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const nextVals = [...listVals];
                                    nextVals[index] = e.target.value;
                                    const cleanedVals = nextVals.filter(v => v.trim() !== '');
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedSubtopics: cleanedVals,
                                      subtopic: cleanedVals.join(", ")
                                    }));
                                  }}
                                  placeholder={`Type sub-topic #${index + 1}...`}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {getTermLabel('SUBTOPICS', syllabusResult?.isShowingAll)}
                      </label>
                      {currentModuleIsExtracting ? (
                        <div className="w-full flex items-center justify-center p-4 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                          <Loader2 className="animate-spin text-emerald-500 mr-2" size={16} /> AI Extracting sub-topics...
                        </div>
                      ) : currentSyllabus ? (
                        <div className="relative">
                          <select
                            name="subtopic"
                            value={formData.subtopic}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all appearance-none pr-10"
                          >
                            <option value="">Select Sub-topic</option>
                            {getSubtopicsForTopic(formData.topic).map((st, stIdx) => (
                              <option key={`${st.title}-${stIdx}`} value={st.title}>
                                {formatTopicOptionDisplay(st.title, isZambianLanguageSubject, formData.zambianLanguage || 'Icibemba')}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                      ) : (
                        <input
                          type="text"
                          name="subtopic"
                          value={formData.subtopic}
                          onChange={handleInputChange}
                          placeholder="Select or type sub-topic..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {curriculumType === 'OBC' ? 'GENERAL OUTCOMES' : 'GENERAL COMPETENCES'}
                    </label>
                    <div className="flex items-center gap-2">
                      {isDrafting && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-pulse">
                          <Loader2 size={10} className="animate-spin" /> Auto-Drafting...
                        </span>
                      )}
                      <span 
                        onClick={handleGenerateDraft}
                        title="Developer Indicator: AI Draft operates automatically in the background upon topic selection"
                        className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 cursor-pointer transition-colors"
                      >
                        [DEV] AI DRAFT ACTIVE
                      </span>
                    </div>
                  </div>
                    <textarea
                      name="generalCompetences"
                      value={formData.generalCompetences}
                      onChange={handleInputChange}
                      placeholder={curriculumType === 'OBC' ? "Enter short form general outcomes (e.g., Develop critical thinking skills, communication skills, self-awareness)..." : "Enter short form general competences (e.g., Develop critical thinking skills, communication skills, self-awareness)..."}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                      rows={2}
                    />
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Tip: Keep general competences in short form (e.g., Critical thinking skills, communication skills, self-awareness).</p>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    LESSON GOAL
                  </label>
                  <textarea
                    name="lessonGoal"
                    value={formData.lessonGoal}
                    onChange={handleInputChange}
                    placeholder="What is the main goal of this lesson?"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {curriculumType === 'OBC' ? 'SPECIFIC OUTCOMES' : 'SPECIFIC COMPETENCES'}
                  </label>
                  {formData.type === 'lesson_notes' ? (
                    <div className="space-y-4">
                      {currentSyllabus ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {(formData.selectedSubtopics && formData.selectedSubtopics.length > 0) ? (
                            formData.selectedSubtopics.map(stName => {
                              const comps = getCompetenciesForSubtopic(formData.topic, stName);
                              return (
                                <div key={stName} className="space-y-2">
                                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">{stName}</p>
                                  <div className="flex flex-col gap-1.5">
                                    {comps.map(c => {
                                      const currentSelected = (formData.specificCompetences || '').split('\n').filter(Boolean).map(x => cleanKey(x));
                                      const isSelected = currentSelected.includes(cleanKey(c));
                                      return (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => {
                                            const current = (formData.specificCompetences || '').split('\n').filter(x => x.trim());
                                            let next;
                                            if (isSelected) {
                                              next = current.filter(x => cleanKey(x) !== cleanKey(c));
                                            } else {
                                              next = [...current, c];
                                            }
                                            
                                            // Recalculate learning activities for the NEW set of competencies
                                            const nextActivities = (formData.selectedSubtopics || []).flatMap(sni => {
                                              const subComps = getCompetenciesForSubtopic(formData.topic, sni);
                                              // Filter for only selected competencies belonging to this subtopic
                                              const cleanNext = next.map(n => cleanKey(n));
                                              const selectedSubComps = subComps.filter(sc => cleanNext.includes(cleanKey(sc)));
                                              
                                              if (selectedSubComps.length === 0 && subComps.length === 0) {
                                                return getActivitiesForSubtopic(formData.topic, sni, "");
                                              }
                                              
                                              return selectedSubComps.flatMap(sc => getActivitiesForSubtopic(formData.topic, sni, sc));
                                            });

                                            setFormData(prev => ({
                                              ...prev,
                                              specificCompetences: next.join('\n'),
                                              learningActivities: Array.from(new Set(nextActivities))
                                            }));
                                          }}
                                          className={cn(
                                            "text-left p-2.5 rounded-xl border text-[11px] font-bold transition-all shadow-sm flex items-start gap-2",
                                            isSelected ? "bg-white border-emerald-500 text-emerald-950 ring-2 ring-emerald-50" : "bg-white border-slate-100 text-slate-500 hover:border-emerald-200"
                                          )}
                                        >
                                          <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                                            isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                                          )}>
                                            {isSelected && <Check size={10} />}
                                          </div>
                                          <span className="leading-tight">{c}</span>
                                        </button>
                                      );
                                    })}
                                    {comps.length === 0 && (
                                      <p className="text-[10px] text-slate-400 italic pl-2">No competencies found in syllabus for this sub-topic.</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center py-4 text-xs font-bold text-slate-400 italic">Select sub-topics above to see available competencies</p>
                          )}
                        </div>
                      ) : (
                        <textarea
                          name="specificCompetences"
                          value={formData.specificCompetences}
                          onChange={handleInputChange}
                          placeholder={curriculumType === 'OBC' ? 'Type or view auto-selected specific outcomes...' : 'Type or view auto-selected specific competencies...'}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all min-h-[120px] leading-relaxed resize-y"
                          rows={4}
                        />
                      )}
                      <p className="text-[11px] text-slate-400 font-medium leading-normal">
                        {currentSyllabus 
                          ? `Strictly select competencies from the syllabus to map activities precisely.` 
                          : `Type relevant specific outcomes/competencies for high-quality lesson notes.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentSyllabus && (
                        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Select / Toggle Syllabus Competencies:</p>
                          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {getCompetenciesForSubtopic(formData.topic, formData.subtopic).map(c => {
                              const currentSelected = (formData.specificCompetences || '').split('\n').filter(Boolean).map(x => cleanKey(x));
                              const isSelected = currentSelected.includes(cleanKey(c));
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    const current = (formData.specificCompetences || '').split('\n').filter(x => x.trim());
                                    let next;
                                    if (isSelected) {
                                      next = current.filter(x => cleanKey(x) !== cleanKey(c));
                                    } else {
                                      next = [...current, c];
                                    }
                                    const newText = next.join('\n');
                                    const activities = getActivitiesForSubtopic(formData.topic, formData.subtopic, newText);
                                    setFormData(prev => ({
                                      ...prev,
                                      specificCompetences: newText,
                                      learningActivities: activities
                                    }));
                                  }}
                                  className={cn(
                                    "text-left p-2 rounded-xl border text-[11px] font-bold transition-all shadow-sm flex items-start gap-2",
                                    isSelected ? "bg-white border-emerald-500 text-emerald-950 ring-2 ring-emerald-50" : "bg-white border-slate-100 text-slate-500 hover:border-emerald-200"
                                  )}
                                >
                                  <div className={cn(
                                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5",
                                    isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                                  )}>
                                    {isSelected && <Check size={8} />}
                                  </div>
                                  <span className="leading-tight">{c}</span>
                                </button>
                              );
                            })}
                            {getCompetenciesForSubtopic(formData.topic, formData.subtopic).length === 0 && (
                              <p className="text-[10px] text-slate-400 italic">Select a topic and sub-topic above to view available competencies.</p>
                            )}
                          </div>
                        </div>
                      )}
                      <textarea
                        name="specificCompetences"
                        value={formData.specificCompetences}
                        onChange={handleInputChange}
                        placeholder={curriculumType === 'OBC' ? 'Type or edit specific outcomes...' : 'Type or edit specific competencies...'}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all min-h-[90px] leading-relaxed resize-y"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                {curriculumType === 'OBC' && (
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      KNOWLEDGE
                    </label>
                    <textarea
                      name="knowledge"
                      value={formData.knowledge}
                      onChange={handleInputChange}
                      placeholder="Knowledge from syllabus (Verbatim)..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 font-bold text-slate-700 outline-none text-sm hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                      rows={2}
                    />
                  </div>
                )}

                {curriculumType !== 'OBC' && formData.type !== 'schemes_of_work' && formData.type !== 'weekly_forecast' && <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">LEARNING ACTIVITIES</label>
                    {isFetchingActivities[`${formData.grade}-${formData.subject}-${formData.topic}-${formData.subtopic}-${formData.specificCompetences || ''}`] && (
                       <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold animate-pulse">
                        <Loader2 size={10} className="animate-spin" />
                        POPULATING...
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar p-1 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                    {(() => {
                      const availableActivities = formData.type === 'lesson_notes' && formData.selectedSubtopics && formData.selectedSubtopics.length > 0
                        ? Array.from(new Set(formData.selectedSubtopics.flatMap(stName => {
                            const subtopicComps = getCompetenciesForSubtopic(formData.topic, stName);
                            // Filter for only selected competencies belonging to this subtopic
                            const selectedInDoc = (formData.specificCompetences || '').split('\n').filter(x => x.trim()).map(n => cleanKey(n));
                            const matchedComps = subtopicComps.filter(sc => selectedInDoc.includes(cleanKey(sc)));
                            
                            if (matchedComps.length === 0) {
                              if (subtopicComps.length === 0) {
                                return getActivitiesForSubtopic(formData.topic, stName, "");
                              }
                              return []; // Show nothing if competencies exist but none selected
                            }
                            return matchedComps.flatMap(comp => getActivitiesForSubtopic(formData.topic, stName, comp));
                          })))
                        : getActivitiesForSubtopic(formData.topic, formData.subtopic, formData.specificCompetences);

                      return availableActivities.length > 0 ? (
                        availableActivities.map((act, idx) => {
                          const isSelected = (formData.learningActivities || []).includes(act);
                          return (
                            <button
                              key={`${act}-${idx}`}
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const current = prev.learningActivities || [];
                                  if (isSelected) {
                                    return { ...prev, learningActivities: current.filter(a => a !== act) };
                                  }
                                  return { ...prev, learningActivities: [...current, act] };
                                });
                              }}
                              className={cn(
                                "text-left p-3 rounded-xl border text-[10px] font-bold transition-all shadow-sm",
                                isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-50" : "bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                                  isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200"
                                )}>
                                  {isSelected && <Check size={10} />}
                                </div>
                                <span className="leading-tight">{act}</span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-8 text-center text-slate-400 font-medium italic text-xs">
                          {formData.type === 'lesson_notes' ? "Select sub-topics to view learning activities" : "Select a sub-topic to view learning activities"}
                        </div>
                      );
                    })()}
                  </div>
                  {formData.learningActivities && formData.learningActivities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.learningActivities.map((act, idx) => (
                        <div key={idx} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                          {act}
                          <X size={12} className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, learningActivities: prev.learningActivities?.filter(a => a !== act) }))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {isLesson && !isIWP && (
          <div className="flex justify-between items-center my-4">
            <button
              type="button"
              onClick={() => setIsReferenceBlockVisible(!isReferenceBlockVisible)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
            >
              {isReferenceBlockVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              {isReferenceBlockVisible ? "Hide Reference Materials & Syllabus" : "Show Reference Materials & Syllabus"}
            </button>
          </div>
        )}

        {isLesson && !isIWP && isReferenceBlockVisible && renderKnowledgeBase()}

        <div className="pt-6 pb-2 w-full space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {isIWP ? "Professional Context / Specific Roles" : "Important Note of Instructions / Additional Context"}
            </label>
            {!isIWP && (
              <button
                type="button"
                onClick={() => {
                  const isScheme = formData.type === 'schemes_of_work';
                  const isWF = formData.type === 'weekly_forecast';
                  const stopTopicStr = formData.stoppingTopic ? `(topic:${formData.stoppingTopic})` : '(indicate: e.g. topic:1.6 patterns)';
                  const schemeText = `Generate schemes based on the topics in the drop-down as arranged from topic 1 to the end OR start from the first topic, subtopic and first specific competencies entered going forward until the last topic number ${stopTopicStr} entered by user`;
                  const wfText = `Instructions: \n(Weekly forecast:) let the weekly forecast be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.\nModules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;
                  const lpText = `Instructions\n(Lesson plan:) let the Lesson plan be syllabus based and modules quoted based. All information should be nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standards.\nModules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;
                  
                  const activeText = isScheme ? schemeText : isWF ? wfText : lpText;
                  setFormData(prev => ({ ...prev, additionalContext: activeText }));
                  toast.success("Activated instructions for normal preparations!");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles size={13} />
                <span>activate instructions for normal preparations</span>
              </button>
            )}
          </div>
          <textarea 
            name="additionalContext" 
            value={formData.additionalContext || ''} 
            onChange={handleInputChange} 
            placeholder={isIWP ? "e.g. Focus on extracurricular coordination, special education needs, or administrative tasks..." : "Box is empty by default. Click button above or sync from schemes/forecast to activate instructions..."} 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white transition-all shadow-sm" 
            rows={4} 
          />
        </div>

        {/* Teaching Notes Option */}
        {isLesson && (
          <div className="pt-4 pb-2 w-full">
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-900 uppercase">Lesson Plan Options</h4>
                  <p className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">Customize your academic document details</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Include Teaching Notes?</label>
                <select 
                  value={formData.includeTeachingNotes ? "yes" : "no"}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeTeachingNotes: e.target.value === 'yes' }))}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-bold"
                >
                  <option value="no">NO - Lesson Plan Only</option>
                  <option value="yes">YES - Add well-arranged Teaching Notes on a separate page</option>
                </select>
                <div className="px-1">
                  <p className="text-[9px] text-emerald-600/70 font-medium leading-tight italic">
                    * If selected, notes will be appended after the lesson plan using a page break.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-emerald-100/50 pt-4">
                <label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Include Homework?</label>
                <select 
                  value={formData.includeHomework ? "yes" : "no"}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeHomework: e.target.value === 'yes' }))}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-bold"
                >
                  <option value="no">NO - Omit homework section</option>
                  <option value="yes">YES - Include dynamic homework section</option>
                </select>
                <div className="px-1">
                  <p className="text-[9px] text-emerald-600/70 font-medium leading-tight italic">
                    * If selected, homework tasks and instructions will be generated between the lesson table and the learners' evaluation section on page 2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-slate-100 flex flex-col items-center w-full">
          {error && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6 animate-pulse">
               <Info size={18} className="text-amber-500 shrink-0" />
               <p className="text-[10px] font-black uppercase tracking-tight text-amber-700 leading-tight">
                 {error}
               </p>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full max-w-sm px-8 py-4 bg-[#00A86B] hover:bg-[#008f5d] disabled:opacity-50 text-white rounded-[2rem] shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all flex-col"
          >
            {isGenerating ? (
              <>
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-lg font-black uppercase tracking-widest">Generating...</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-100 tracking-widest uppercase mt-1 animate-pulse">
                  {progressText}
                </span>
              </>
            ) : loading ? (
                 <Loader2 className="animate-spin" size={24} />
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Wand2 size={24} />
                <span className="text-lg font-black uppercase tracking-widest">Generate Document</span>
              </div>
            )}
          </button>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Powered by Gemini AI • {curriculumType === 'OBC' ? 'OBC Zambian Standard' : 'CBC Zambian Standard'}
          </p>
        </div>
      </div>
    </div>
  </>
  )}

  {/* Document Unavailable Modal Listing Available Schemes & Weekly Forecasts */}
  {syncUnavailableModal && syncUnavailableModal.isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Document Unavailable</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                The requested <span className="font-bold text-slate-800">{syncUnavailableModal.requestedType}</span> for <span className="font-bold text-slate-800">{syncUnavailableModal.requestedSubject}</span> ({syncUnavailableModal.requestedGrade}) was not found in your sync history.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSyncUnavailableModal(null)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-xs text-amber-900 font-medium leading-relaxed">
            <p className="font-bold text-amber-950 mb-1">Available Documents in Your Sync History:</p>
            <p className="text-amber-800">
              Below are the active saved Schemes of Work and Weekly Forecasts in your synchronization history that you can retrieve information from. Click <strong>"Select & Sync"</strong> on any available document to switch subject/grade and auto-fill your form.
            </p>
          </div>

          {syncUnavailableModal.availableDocs.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <FileSpreadsheet className="mx-auto text-slate-300" size={36} />
              <p className="text-sm font-bold text-slate-700">No Saved Sync Documents Found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You currently have no active saved Schemes of Work or Weekly Forecasts in your sync history. Generate a Scheme of Work or Weekly Forecast first and click <strong>"Save for Sync"</strong> in the document preview to enable instant synchronization.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {syncUnavailableModal.availableDocs.map((docItem) => (
                <div 
                  key={docItem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        docItem.type === 'schemes_of_work' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {docItem.typeLabel}
                      </span>
                      {docItem.timestamp && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(docItem.timestamp.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-slate-800">
                      {docItem.subject} <span className="text-slate-500 font-medium">({docItem.grade})</span>
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectAvailableSyncDoc(docItem)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm active:scale-95 shrink-0"
                  >
                    <RefreshCw size={14} />
                    Select & Sync
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setSyncUnavailableModal(null)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Overlapping Sync Sources Validation Modal */}
  {overlapModal && overlapModal.isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 overflow-hidden flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Overlapping Data Sources</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                We detected overlapping English schemes for <span className="font-bold text-slate-700">{overlapModal.grade}</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setOverlapModal(null)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            In Grade 1 and 2, English Language is divided into two modules: <strong>Oral English</strong> and <strong>Literacy in English</strong>. We found active data sources for both. Please select how you want to compile your Weekly Forecast:
          </p>

          <div className="grid gap-3">
            {/* Merge Option */}
            <button
              type="button"
              onClick={() => {
                handleApplyOverlapChoice('merge', overlapModal);
                setOverlapModal(null);
                if (overlapModal.action === 'generate') {
                  handleGenerate(true);
                }
              }}
              className="flex items-start gap-4 p-4 text-left border-2 border-indigo-600 bg-indigo-50/40 rounded-2xl transition-all hover:bg-indigo-50/80 active:scale-[0.98] group"
            >
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-800">Merge & Combine both datasets</h4>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Combines Oral English (Days 1–3) and Literacy in English (Days 4–5) into a single unified forecast.
                </p>
              </div>
            </button>

            {/* Oral English priority */}
            <button
              type="button"
              onClick={() => {
                handleApplyOverlapChoice('oral', overlapModal);
                setOverlapModal(null);
                if (overlapModal.action === 'generate') {
                  handleGenerate(true);
                }
              }}
              className="flex items-start gap-4 p-4 text-left border border-slate-200 bg-white rounded-2xl transition-all hover:bg-slate-50 active:scale-[0.98] hover:border-slate-300"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 border border-blue-100">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Priority Subject: Oral English Only</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Synchronize and prepare your forecast strictly and exclusively using Oral English lessons.
                </p>
              </div>
            </button>

            {/* Literacy English priority */}
            <button
              type="button"
              onClick={() => {
                handleApplyOverlapChoice('literacy', overlapModal);
                setOverlapModal(null);
                if (overlapModal.action === 'generate') {
                  handleGenerate(true);
                }
              }}
              className="flex items-start gap-4 p-4 text-left border border-slate-200 bg-white rounded-2xl transition-all hover:bg-slate-50 active:scale-[0.98] hover:border-slate-300"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-100">
                <FileText size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Priority Subject: Literacy in English Only</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Synchronize and prepare your forecast strictly and exclusively using Literacy in English lessons.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => setOverlapModal(null)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}
