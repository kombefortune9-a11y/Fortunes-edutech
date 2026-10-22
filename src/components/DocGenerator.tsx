import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import { getSavedAccountDiagrams, saveDiagramToAccount, searchDiagrams, getDiagramsGroupedByTopic, EducationalDiagram, SEEDED_EDUCATIONAL_DIAGRAMS } from "../lib/diagramLibrary";
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  ChevronLeft,
  ChevronRight,
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
  MessageSquare,
  CheckSquare,
  Square,
  ListFilter,
  Edit3
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, where, limit, addDoc, serverTimestamp, getDocs, writeBatch, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, recordActivity } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { DOC_TEMPLATES, DocType, GRADES, OBC_GRADES, OBC_LEVELS, OBC_SUBJECTS, getSubjectsForGrade, TEACHER_ROLES, DEFAULT_AI_INSTRUCTIONS, JOB_PURPOSE_DEFAULTS, isDeveloperEmail } from '../constants';
import { SYLLABI, COMMON_LEARNING_ACTIVITIES } from '../data/syllabi';
import { englishGrade1Oral, englishGrade1Literacy, englishGrade2Oral, englishGrade2Literacy } from '../data/obeEnglishZambianData';
import { englishGrade1Syllabus, englishGrade2Syllabus } from '../data/zambianPrimaryEnglishSyllabus';
import { generateEducationalDoc, getSyllabusActivities, getTermlySchemeSequence, sliceSyllabusByTopicRange, filterSyllabusForSchemes, matchTopicInSyllabus, GenerationParams, extractSyllabusFromModule, generateDraftContent } from '../services/geminiService';
import { parseRawCompetency, extractBriefCompetencies, extractEmbeddedExpectedStandards, extractEmbeddedLearningActivities, extractEmbeddedKnowledge, formatGeneralCompetenciesShortForm, getOfficialSyllabusCitation, deriveExpectedStandardFromCompetency, deriveLearningActivitiesFromCompetency, formatCompetencyOrOutcomeForCurriculum } from '../utils/competencyUtils';
import { parsePastedSchemesTextToWeeks, parseDateRangeToDays, deriveTermStartDate, isPastedOutsideSchemes, isPastedWeeklyForecast, parsePastedWeeklyForecast, enrichForecastDaysWithSyllabus, extractWeekFromPastedText, extractLessonFromPastedForecastText, splitTopicAndSubtopics, splitSubtopicsIntoArray, normalizeHtmlToMarkdownTable, cleanCellContent, matchStrictWeekFromSchemes, isMetadataOrHeaderRow, cleanExtractedTopic, cleanExtractedSubtopics, cleanExtractedCompetencies, extractFullMetadataFromText, getSubtopicIndicesForDays, getVariedTeachingMethods, getConciseTeachingAids } from '../utils/outsideSchemeParser';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';
import InformationCenter from './InformationCenter';
import { extractTextFromPdfClient, extractTextFromDocxClient, compressImageForOcr } from '../utils/fileTextExtractor';
import { isTimetableConnectedToDropdown, setTimetableConnectedToDropdown, getGradeTeachingTimetable, getMinimumActivitiesForDays } from '../services/teachingTimetableService';

const cleanKey = (s: string) => {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\(page\s*\d+\)/gi, '')
    .replace(/continued/gi, '')
    .replace(/^[\d\.\s]+/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const safeString = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.filter(Boolean).map(x => typeof x === 'string' ? x.trim() : String(x)).join('\n');
  return String(val);
};

const autoDeriveComponent = (topic: string, subject: string): string => {
  if (!topic) return '';
  const sLow = subject ? subject.toLowerCase() : '';
  const tClean = topic.trim().replace(/^[\s\.\d]+/, '').trim().toLowerCase();
  
  // Literacy consists strictly of Reading and Writing (Oral / Listening & Speaking belongs to Oral English)
  if (sLow.includes('literacy')) {
    if (tClean.includes('write') || tClean.includes('writing') || tClean.includes('composition') || tClean.includes('spelling') || tClean.includes('handwriting') || tClean.includes('cursive') || tClean.includes('punctuation') || tClean.includes('alphabet') || tClean.includes('sentence')) return 'Writing';
    const matchLit = topic.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
    if (matchLit) {
      const mainNumLit = parseInt(matchLit[2], 10);
      if (mainNumLit >= 12) return 'Writing';
      return 'Reading';
    }
    return 'Reading';
  }

  if (sLow.includes('oral')) {
    return 'Listening & Speaking';
  }

  // Check prefix numbers first if present (e.g., "1.1...", "2.1...", "3.1...")
  const match = topic.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const grNum = parseInt(match[1], 10);
    const mainNum = parseInt(match[2], 10);
    if (sLow.includes('english')) {
      if (grNum === 1) {
        // Grade 1: 1.1 - 1.8 Listening & Speaking, 1.9 - 1.11 Reading, 1.12 - 1.17 Writing
        if (mainNum <= 8) return 'Listening & Speaking';
        if (mainNum <= 11) return 'Reading';
        return 'Writing';
      }
      if (grNum === 2) {
        // Grade 2: 2.1 - 2.8 Listening & Speaking, 2.9 - 2.11 Reading, 2.12 - 2.18 Writing
        if (mainNum <= 8) return 'Listening & Speaking';
        if (mainNum <= 11) return 'Reading';
        return 'Writing';
      }
      if (grNum === 3) {
        // If sub-indexed as 3.1.x (Listening & Speaking), 3.2.x (Reading), 3.3.x (Writing)
        if (match[3] !== undefined) {
          if (mainNum === 1) return 'Listening & Speaking';
          if (mainNum === 2) return 'Reading';
          if (mainNum === 3) return 'Writing';
        }
        // Grade 3 sequential syllabus: 3.1 - 3.8 Listening & Speaking, 3.9 - 3.15 Reading, 3.16 - 3.24 Writing
        if (mainNum <= 8) return 'Listening & Speaking';
        if (mainNum <= 15) return 'Reading';
        return 'Writing';
      }
      // Upper primary or secondary: 4.1 L&S, 4.2 Reading, 4.3 Writing, 4.4 Structure
      if (mainNum === 1) return 'Listening & Speaking';
      if (mainNum === 2) return 'Reading';
      if (mainNum === 3) return 'Writing';
      if (mainNum === 4) return 'Structure';
    } else if (sLow.includes('zambian')) {
      if (grNum === 1) {
        if (mainNum <= 5) return 'Listening & Speaking';
        if (mainNum <= 10) return 'Reading';
        return 'Writing';
      }
      if (mainNum === 1) return 'Listening & Speaking';
      if (mainNum === 2) return 'Reading';
      if (mainNum === 3) return 'Writing';
      if (mainNum === 4) return 'Language';
      if (mainNum === 5) return 'Writing';
      if (mainNum === 6) return 'Language';
    }
  }

  // Fallback to keyword matching
  if (sLow.includes('english')) {
    if (tClean.includes('dialogue') || tClean.includes('debate') || tClean.includes('speech') || tClean.includes('speak') || tClean.includes('listen') || tClean.includes('talk') || tClean.includes('oral') || tClean.includes('drama') || tClean.includes('poetry') || tClean.includes('proverb') || tClean.includes('conversation') || tClean.includes('story') || tClean.includes('stories') || tClean.includes('song') || tClean.includes('riddle') || tClean.includes('description') || tClean.includes('game') || tClean.includes('etiquette') || tClean.includes('manner')) return 'Listening & Speaking';
    if (tClean.includes('reading') || tClean.includes('comprehension') || tClean.includes('dictionary') || tClean.includes('reference') || tClean.includes('library') || tClean.includes('sound') || tClean.includes('phonics') || tClean.includes('phonemic') || tClean.includes('sight word') || tClean.includes('fluency') || tClean.includes('aloud')) return 'Reading';
    if (tClean.includes('write') || tClean.includes('writing') || tClean.includes('composition') || tClean.includes('spelling') || tClean.includes('narrative') || tClean.includes('expository') || tClean.includes('summary') || tClean.includes('handwriting') || tClean.includes('cursive') || tClean.includes('punctuation') || tClean.includes('alphabet') || tClean.includes('sentence')) return 'Writing';
    if (tClean.includes('tense') || tClean.includes('noun') || tClean.includes('pronoun') || tClean.includes('verb') || tClean.includes('adjective') || tClean.includes('preposition') || tClean.includes('conjunction') || tClean.includes('agreement') || tClean.includes('direct') || tClean.includes('adverb') || tClean.includes('tag')) return 'Structure';
  } else if (sLow.includes('zambian')) {
    if (tClean.includes('story') || tClean.includes('stories') || tClean.includes('dialogue') || tClean.includes('debate') || tClean.includes('speak') || tClean.includes('listen') || tClean.includes('oral') || tClean.includes('drama') || tClean.includes('song') || tClean.includes('emotion') || tClean.includes('respect') || tClean.includes('poetry') || tClean.includes('aural') || tClean.includes('miming') || tClean.includes('reporting') || tClean.includes('customs') || tClean.includes('proverb') || tClean.includes('praise')) return 'Listening & Speaking';
    if (tClean.includes('read') || tClean.includes('reading') || tClean.includes('fluency') || tClean.includes('book') || tClean.includes('reference') || tClean.includes('comprehension') || tClean.includes('extensive')) return 'Reading';
    if (tClean.includes('write') || tClean.includes('writing') || tClean.includes('composition') || tClean.includes('spelling') || tClean.includes('cursive') || tClean.includes('handwriting') || tClean.includes('sequence') || tClean.includes('letter') || tClean.includes('report') || tClean.includes('summary') || tClean.includes('dictation') || tClean.includes('translation') || tClean.includes('form') || tClean.includes('plan') || tClean.includes('paragraph') || tClean.includes('diary') || tClean.includes('notice')) return 'Writing';
    if (tClean.includes('tense') || tClean.includes('noun') || tClean.includes('pronoun') || tClean.includes('verb') || tClean.includes('adjective') || tClean.includes('preposition') || tClean.includes('conjunction') || tClean.includes('punctuation') || tClean.includes('agreement') || tClean.includes('direct') || tClean.includes('locative') || tClean.includes('concord') || tClean.includes('vowel') || tClean.includes('adverb') || tClean.includes('simile') || tClean.includes('metaphor') || tClean.includes('proverb') || tClean.includes('idiom') || tClean.includes('ideophone') || tClean.includes('affix') || tClean.includes('borrowed') || tClean.includes('grammar') || tClean.includes('orthography') || tClean.includes('word') || tClean.includes('sentence')) return 'Language';
  }
  return '';
};

const isZambianSubtopicInTerm = (title: string, termStr: string, gradeNum: number): boolean => {
  const titleLow = (title || "").toLowerCase();

  // 1. Explicit term / temu mentions in titles
  if (titleLow.includes("term 1") || titleLow.includes("temu 1")) return termStr === "1";
  if (titleLow.includes("term 2") || titleLow.includes("temu 2")) return termStr === "2";
  if (titleLow.includes("term 3") || titleLow.includes("temu 3")) return termStr === "3";

  const match = title.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return termStr === "1";

  const gr = match[1] ? Number(match[1]) : gradeNum;
  const major = match[2] ? Number(match[2]) : 1;
  const minor = match[3] ? Number(match[3]) : 0;

  if (gr === 1) {
    if (termStr === "1") {
      // Term 1 (Temu 1): Stories (1.1), Conversations (1.2.1-1.2.3, 1.2.6), Print Concepts (1.6), Phonological Awareness & Phonics single consonants/vowels (1.7, 1.8), Words/Boundaries (1.10), Proper/Common Nouns (1.11.1), Listening Comprehension (1.12.1, 1.12.2, 1.12.5), Pre-Writing (1.14), Handwriting print (1.15.1), Drawing & Punctuation (1.16.1, 1.16.2)
      if (major === 1 || major === 6 || major === 7 || major === 10 || major === 14) return true;
      if (major === 2) return minor === 0 || minor === 1 || minor === 2 || minor === 3 || minor === 6 || minor <= 3;
      if (major === 8) {
        const clusterCheck = ["kw", "fw", "mb", "mf", "lw", "nc", "nt", "nd", "ns", "tw", "nj", "nw", "fy", "pw", "ny", "mbw", "my", "by", "sw", "mp", "nkw", "nsh", "ly", "mby", "mfw", "ndw", "ntw", "mfy", "py", "nsw", "mpw", "ndy", "ngw"];
        return !clusterCheck.some(cl => titleLow.includes(cl));
      }
      if (major === 11) return minor === 0 || minor === 1;
      if (major === 12) return minor === 0 || minor === 1 || minor === 2 || minor === 5;
      if (major === 15) return minor === 0 || minor === 1 || minor === 2 || minor === 3;
      if (major === 16) return minor === 0 || minor === 1 || minor === 2;
      return false;
    } else if (termStr === "2") {
      // Term 2 (Temu 2): Conversations & Debates/Rules (1.2.2, 1.2.4, 1.2.5), Descriptions people/places (1.3.1, 1.3.2), Phonics initial clusters (1.8), Reading Fluency (1.9.1), Plural Nouns (1.11.2), Listening Comprehension (1.12.3, 1.12.4), Reading Comprehension (1.13.1-1.13.3), Handwriting clusters (1.15), Simple stories 2-3 sentences (1.16.3, 1.16.4)
      if (major === 2) return minor === 0 || minor === 2 || minor === 4 || minor === 5;
      if (major === 3) return minor === 0 || minor === 1 || minor === 2;
      if (major === 8) {
        const term2Clusters = ["kw", "fw", "mb", "mf", "lw", "nc", "nt", "nd", "ns", "tw", "ng'", "nj", "nw", "fy", "pw", "ny", "mbw", "my", "by", "sw", "mp"];
        return term2Clusters.some(cl => titleLow.includes(cl));
      }
      if (major === 9) return true;
      if (major === 11) return minor === 0 || minor === 2;
      if (major === 12) return minor === 0 || minor === 3 || minor === 4;
      if (major === 13) return true;
      if (major === 15) return true;
      if (major === 16) return minor === 0 || minor === 3 || minor === 4;
      return false;
    } else if (termStr === "3") {
      // Term 3 (Temu 3): Descriptions places/objects (1.3.2, 1.3.3), Drama (1.4), Riddles & Tongue twisters (1.5), Phonics advanced clusters (1.8), Reading fluency stories (1.9), Reading comprehension (1.13), Composition narrative (1.16.4)
      if (major === 4 || major === 5) return true;
      if (major === 3) return minor === 0 || minor === 2 || minor === 3;
      if (major === 8) {
        const term3Clusters = ["nkw", "nsh", "ly", "mby", "mfw", "ndw", "ntw", "mfy", "py", "nsw", "mpw", "ndy", "ngw"];
        return term3Clusters.some(cl => titleLow.includes(cl));
      }
      if (major === 9 || major === 13 || major === 15 || major === 16) return true;
      return false;
    }
  } else if (gr === 2) {
    if (termStr === "1") {
      // Grade 2 Term 1: Stories (2.1), Conversations Info (2.2.1), Reading Fluency 3+ clusters (2.6.1), Synonyms (2.7.1), Singular/Plural Nouns (2.8.1), Listening Comp Inferences (2.9.1, 2.9.2), Summary (2.10.1), Manuscript handwriting (2.12.1), Drawing & Punctuation (2.13.1, 2.13.2)
      if (major === 1 || major === 6 || major === 10 || major === 12) return true;
      if (major === 2) return minor === 0 || minor === 1;
      if (major === 7) return minor === 0 || minor === 1;
      if (major === 8) return minor === 0 || minor === 1;
      if (major === 9) return minor === 0 || minor === 1 || minor === 2;
      if (major === 13) return minor === 0 || minor === 1 || minor === 2;
      return false;
    } else if (termStr === "2") {
      // Grade 2 Term 2: Conversations Discussion/Debate (2.2.2, 2.2.3), Descriptions People/Places (2.3.1, 2.3.2), Reading Fluency (2.6), Antonyms (2.7.2), Proper/Common Nouns (2.8.2, 2.8.3), Listening Comp (2.9.3, 2.9.4), Reading Comp (2.11), Handwriting (2.12), Composition (2.13.3, 2.13.4)
      if (major === 2) return minor === 0 || minor === 2 || minor === 3;
      if (major === 3) return minor === 0 || minor === 1 || minor === 2;
      if (major === 6 || major === 11 || major === 12 || major === 13) return true;
      if (major === 7) return minor === 0 || minor === 2;
      if (major === 8) return minor === 0 || minor === 2 || minor === 3;
      if (major === 9) return minor === 0 || minor === 3 || minor === 4;
      return false;
    } else if (termStr === "3") {
      // Grade 2 Term 3: Descriptions Objects (2.3.3), Drama (2.4), Riddles & Tongue Twisters (2.5), Reading own writing (2.6), Nouns (2.8), Reading Comp life link (2.11.4), Handwriting (2.12), Non-fiction (2.13.5)
      if (major === 4 || major === 5 || major === 6 || major === 8 || major === 11 || major === 12) return true;
      if (major === 3) return minor === 0 || minor === 3;
      if (major === 13) return minor === 0 || minor === 5;
      return false;
    }
  } else if (gr === 3) {
    if (termStr === "1") {
      // Grade 3 Term 1: Stories (3.1), Conversations Respectful (3.2.1), Reading Fluency >7 sentences & story analysis (3.6.1), Alphabetical order (3.7.1), Synonyms (3.8.1), Listening Comp (3.10.1, 3.10.2), Manuscript & Cursive intro (3.12.1, 3.12.2), Word sequencing (3.13.1), Punctuation (3.14.1)
      if (major === 1 || major === 6 || major === 7 || major === 12 || major === 13) return true;
      if (major === 2) return minor === 0 || minor === 1;
      if (major === 8) return minor === 0 || minor === 1;
      if (major === 10) return minor === 0 || minor === 1 || minor === 2;
      if (major === 14) return minor === 0 || minor === 1;
      return false;
    } else if (termStr === "2") {
      // Grade 3 Term 2: Conversations Processes & Debates (3.2.2-3.2.4), Descriptions Animals & Events (3.3.1, 3.3.2), Re-reading fluency (3.6), Antonyms (3.8.2), Abstract Nouns (3.9.1), Listening Comp (3.10.3, 3.10.4), Reading Comp (3.11.1), Cursive (3.12.2), Paragraph building & Simple letter (3.14.2, 3.14.3)
      if (major === 2) return minor === 0 || minor === 2 || minor === 3 || minor === 4;
      if (major === 3 || major === 6 || major === 9 || major === 12) return true;
      if (major === 8) return minor === 0 || minor === 2;
      if (major === 10) return minor === 0 || minor === 3 || minor === 4;
      if (major === 11) return minor === 0 || minor === 1;
      if (major === 14) return minor === 0 || minor === 2 || minor === 3;
      return false;
    } else if (termStr === "3") {
      // Grade 3 Term 3: Drama (3.4.1), Riddles & Tongue twisters (3.5.1, 3.5.2), Reading Fluency expression (3.6.1), Abstract Nouns in composition (3.9.1), Reading Comp main idea/inferences/predictions (3.11.2-3.11.6), Cursive proficiency (3.12.2), Fiction story & Non-fiction exposition (3.14.4, 3.14.5)
      if (major === 4 || major === 5 || major === 6 || major === 9 || major === 12) return true;
      if (major === 11) return minor === 0 || minor === 2 || minor === 3 || minor === 4 || minor === 5 || minor === 6 || minor >= 2;
      if (major === 14) return minor === 0 || minor === 4 || minor === 5;
      return false;
    }
  }

  return true;
};

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
  
  if (grade >= 3) {
    return true;
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
              {filteredOptions.length > 0 ? filteredOptions.map((opt, optIdx) => (
                <button
                  key={`${opt}-${optIdx}`}
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

export const isCurriculumOBC = (curriculumType?: string, grade?: string, weekData?: any): boolean => {
  if (curriculumType === 'OBC') return true;
  if (curriculumType === 'CBC') return false;
  if (grade && /\bobc\b/i.test(grade)) return true;
  if (grade && /\bcbc\b/i.test(grade)) return false;
  return false;
};

const parseMarkdownTableToWeeks = (markdown: string, grade?: string, subject?: string) => {
  try {
    if (!markdown) return null;
    // Prefer enhanced, syllabus-aware universal parser with row-shifting repair and date extraction
    const universal = parsePastedSchemesTextToWeeks(markdown, grade, subject);
    if (universal && universal.length > 0 && universal.some(w => (w.topic && w.topic.trim() !== '') || (w.subtopics && w.subtopics.length > 0))) {
      return universal;
    }
    const normalized = normalizeHtmlToMarkdownTable(markdown);
    const lines = normalized.split('\n');
    const tableLines = lines.filter(l => {
      const trimmed = l.trim();
      return (trimmed.match(/\|/g) || []).length >= 2;
    });
    
    if (tableLines.length >= 2) {
      // Detect header row
      const headerRow = tableLines.find(l => /week|day|topic|competenc|outcome/i.test(l)) || tableLines[0];
      let headerCells = headerRow.split('|').map(c => c.trim().toLowerCase());
      if (headerCells[0] === '') headerCells.shift();
      if (headerCells[headerCells.length - 1] === '') headerCells.pop();

      const weekIdx = headerCells.findIndex(c => c.includes('week') || c.includes('day'));
      const mergedTopicSubIdx = headerCells.findIndex(c => 
        (c.includes('topic') && c.includes('sub')) || 
        c.includes('topic/sub') || 
        c.includes('topic / sub')
      );
      const topicIdx = mergedTopicSubIdx >= 0 
        ? mergedTopicSubIdx 
        : headerCells.findIndex(c => c.includes('topic') && !c.includes('sub'));
      const subtopicIdx = mergedTopicSubIdx >= 0 
        ? -1 
        : headerCells.findIndex(c => c.includes('subtopic') || c.includes('sub-topic') || c.includes('sub topic') || (c.includes('sub') && !c.includes('subject')));
      
      const compIdx = headerCells.findIndex(c => c.includes('outcome') || c.includes('competenc'));
      const knowledgeIdx = headerCells.findIndex(c => c.includes('knowledge') || c.includes('content'));
      const skillsIdx = headerCells.findIndex(c => c.includes('skill'));
      const valuesIdx = headerCells.findIndex(c => c.includes('value') || c.includes('attitude'));
      const stdIdx = headerCells.findIndex(c => c.includes('standard') || (!c.includes('outcome') && c.includes('expect')));
      const actIdx = headerCells.findIndex(c => c.includes('activit') || c.includes('task'));
      const methodIdx = headerCells.findIndex(c => c.includes('method') || c.includes('strategy') || c.includes('pedagog') || c.includes('approach'));
      const aidIdx = headerCells.findIndex(c => c.includes('aid') || c.includes('t/l') || c.includes('resource') || c.includes('material'));
      const refIdx = headerCells.findIndex(c => c.includes('ref') || c.includes('source') || c.includes('book'));

      // Skip header, alignment, and document metadata rows
      const dataRows = tableLines.filter(l => {
        if (l.includes('---') || l === headerRow) return false;
        let cells = l.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        return !isMetadataOrHeaderRow(cells);
      });
      
      const parsedRows: Array<{
        week: number;
        weekLabel: string;
        topic: string;
        subtopics: string[];
        competency: string;
        knowledge: string;
        skills: string;
        values: string;
        expectedStandard: string;
        activity: string;
        method: string;
        teachingAid: string;
        reference: string;
      }> = [];

      let currentWeekNum = 0;
      let currentWeekLabel = '';
      let lastTopic = '';

      for (let dataRowIdx = 0; dataRowIdx < dataRows.length; dataRowIdx++) {
        const row = dataRows[dataRowIdx];
        let cells = row.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        if (cells.length < 2) continue;

        const weekCell = cells[weekIdx >= 0 ? weekIdx : 0] || '';
        const cleanWeekCell = weekCell
          .replace(/&nbsp;/gi, ' ')
          .replace(/&#160;/g, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/g, "'")
          .replace(/&[a-z0-9]+;/gi, ' ')
          .replace(/[*_`#]/g, '')
          .replace(/<[^>]*>/g, ' ')
          .trim();
          
        let rowWeekNum = 0;
        const explicitWeekMatch = cleanWeekCell.match(/\b(?:Week|Wk|W)\s*(\d{1,2})\b/i);
        const leadingNumMatch = cleanWeekCell.match(/^(\d{1,2})(?:\s*[\(\-\/:<]|\s*$)/i);
        const isDateRange = /\d{1,2}[\/\.-]\d{1,2}/.test(cleanWeekCell) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(cleanWeekCell);

        if (explicitWeekMatch) {
          rowWeekNum = parseInt(explicitWeekMatch[1], 10);
        } else if (leadingNumMatch && !isDateRange) {
          const parsed = parseInt(leadingNumMatch[1], 10);
          if (parsed >= 1 && parsed <= 20) {
            rowWeekNum = parsed;
          }
        }

        if (rowWeekNum === 0 || isNaN(rowWeekNum)) {
          const isContinuationCell = cleanWeekCell === '' ||
            isDateRange ||
            /^[-–—"'\s\.\,\(\)]+$/.test(cleanWeekCell) ||
            /^(?:ditto|same|as\s+above|cont\.?|continued)$/i.test(cleanWeekCell);

          if (isContinuationCell && currentWeekNum > 0) {
            rowWeekNum = currentWeekNum;
          } else {
            rowWeekNum = currentWeekNum > 0 ? currentWeekNum + 1 : dataRowIdx + 1;
          }
        }

        if (rowWeekNum !== currentWeekNum) {
          currentWeekNum = rowWeekNum;
          currentWeekLabel = weekCell || `Week ${currentWeekNum}`;
          lastTopic = ''; // Reset so topics don't bleed across weeks
        }
        
        let topicCell = '';
        let subtopicList: string[] = [];

        if (mergedTopicSubIdx >= 0) {
          const rawMergedCell = cells[mergedTopicSubIdx] || '';
          const parsedMerged = splitTopicAndSubtopics(rawMergedCell);
          topicCell = parsedMerged.topic;
          subtopicList = parsedMerged.subtopics;
        } else {
          topicCell = cells[topicIdx >= 0 ? topicIdx : 1] || '';
          const subCell = cells[subtopicIdx >= 0 ? subtopicIdx : 2] || '';
          if (subCell) subtopicList = splitSubtopicsIntoArray(subCell);
          if (subtopicList.length === 0 && topicCell) {
            const parsedTopic = splitTopicAndSubtopics(topicCell);
            if (parsedTopic.subtopics.length > 0) {
              topicCell = parsedTopic.topic;
              subtopicList = parsedTopic.subtopics;
            }
          }
        }

        topicCell = cleanExtractedTopic(topicCell);
        subtopicList = cleanExtractedSubtopics(subtopicList);

        if (topicCell) {
          lastTopic = topicCell;
        }

        const rawCompCell = compIdx >= 0 ? cleanCellContent(cells[compIdx] || '') : '';
        const compCell = cleanExtractedCompetencies([rawCompCell])[0] || '';
        const knowCell = knowledgeIdx >= 0 ? cleanCellContent(cells[knowledgeIdx] || '') : '';
        const skillCell = skillsIdx >= 0 ? cleanCellContent(cells[skillsIdx] || '') : '';
        const valCell = valuesIdx >= 0 ? cleanCellContent(cells[valuesIdx] || '') : '';
        const stdCell = stdIdx >= 0 ? cleanCellContent(cells[stdIdx] || '') : knowCell;
        const actCell = actIdx >= 0 ? cleanCellContent(cells[actIdx] || '') : '';
        const methCell = methodIdx >= 0 ? cleanCellContent(cells[methodIdx] || '') : '';
        const aidCell = aidIdx >= 0 ? cleanCellContent(cells[aidIdx] || '') : '';
        const refCell = refIdx >= 0 ? cleanCellContent(cells[refIdx] || '') : '';

        parsedRows.push({
          week: currentWeekNum,
          weekLabel: currentWeekLabel,
          topic: topicCell || lastTopic,
          subtopics: subtopicList,
          competency: compCell,
          knowledge: knowCell,
          skills: skillCell,
          values: valCell,
          expectedStandard: stdCell,
          activity: actCell,
          method: methCell,
          teachingAid: aidCell,
          reference: refCell
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
            subtopics: r.subtopics || [],
            competencies: r.competency ? [r.competency] : [],
            knowledge: r.knowledge ? [r.knowledge] : [],
            skills: r.skills ? [r.skills] : [],
            values: r.values ? [r.values] : [],
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
          for (const st of (r.subtopics || [])) {
            if (!existing.subtopics.includes(st)) existing.subtopics.push(st);
          }
          if (r.competency && !existing.competencies.includes(r.competency)) existing.competencies.push(r.competency);
          if (r.knowledge && !existing.knowledge?.includes(r.knowledge)) {
            if (!existing.knowledge) existing.knowledge = [];
            existing.knowledge.push(r.knowledge);
          }
          if (r.skills && !existing.skills?.includes(r.skills)) {
            if (!existing.skills) existing.skills = [];
            existing.skills.push(r.skills);
          }
          if (r.values && !existing.values?.includes(r.values)) {
            if (!existing.values) existing.values = [];
            existing.values.push(r.values);
          }
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
      if (sortedWeeks.length > 0) return sortedWeeks;
    }

    // Universal fallback parser
    const fallbackWeeks = parsePastedSchemesTextToWeeks(markdown);
    if (fallbackWeeks && fallbackWeeks.length > 0) return fallbackWeeks;
    return null;
  } catch (err) {
    console.error("Parse Scheme failed, attempting fallback...", err);
    try {
      const fallbackWeeks = parsePastedSchemesTextToWeeks(markdown);
      if (fallbackWeeks && fallbackWeeks.length > 0) return fallbackWeeks;
    } catch (e) {}
    return null;
  }
};

const parseMarkdownTableToForecastDays = (markdown: string) => {
  try {
    if (!markdown) return null;
    const normalized = normalizeHtmlToMarkdownTable(markdown);
    const lines = normalized.split('\n');
    const tableLines = lines.filter(l => {
      const trimmed = l.trim();
      return (trimmed.match(/\|/g) || []).length >= 2;
    });

    if (tableLines.length >= 2) {
      const headerRow = tableLines.find(l => /day|topic|competenc|outcome/i.test(l)) || tableLines[0];
      let headerCells = headerRow.split('|').map(c => c.trim().toLowerCase());
      if (headerCells[0] === '') headerCells.shift();
      if (headerCells[headerCells.length - 1] === '') headerCells.pop();

      let dayIdx = headerCells.findIndex(c => c.includes('day'));
      let mergedTopicSubIdx = headerCells.findIndex(c => 
        (c.includes('topic') && c.includes('sub')) || 
        c.includes('topic/sub') || 
        c.includes('topic / sub')
      );
      let topicIdx = mergedTopicSubIdx >= 0 
        ? mergedTopicSubIdx 
        : headerCells.findIndex(c => c.includes('topic') && !c.includes('sub'));
      let subtopicIdx = mergedTopicSubIdx >= 0 
        ? -1 
        : headerCells.findIndex(c => c.includes('subtopic') || c.includes('sub-topic') || c.includes('sub topic') || (c.includes('sub') && !c.includes('subject')));
      
      let compIdx = headerCells.findIndex(c => c.includes('outcome') || c.includes('competenc'));
      let knowledgeIdx = headerCells.findIndex(c => c.includes('knowledge') || c.includes('content'));
      let skillsIdx = headerCells.findIndex(c => c.includes('skill'));
      let valuesIdx = headerCells.findIndex(c => c.includes('value') || c.includes('attitude'));
      let stdIdx = headerCells.findIndex(c => c.includes('standard') || (!c.includes('outcome') && c.includes('expect')));
      let actIdx = headerCells.findIndex(c => c.includes('activit') || c.includes('task'));
      let methodIdx = headerCells.findIndex(c => c.includes('method') || c.includes('strategy') || c.includes('pedagog') || c.includes('approach'));
      let aidIdx = headerCells.findIndex(c => c.includes('aid') || c.includes('t/l') || c.includes('resource') || c.includes('material'));
      let refIdx = headerCells.findIndex(c => c.includes('ref') || c.includes('source') || c.includes('book'));

      const isHeaderless = headerCells.some(c => /day\s*\d+/i.test(c)) || 
                            headerCells.some(c => /wk\s*\d+/i.test(c)) || 
                            (!headerCells.some(c => c.includes('topic')) && !headerCells.some(c => c.includes('competenc')) && !headerCells.some(c => c.includes('outcome')));

      if (isHeaderless) {
        dayIdx = 0;
        topicIdx = 1;
        subtopicIdx = -1;
        compIdx = 2;
        stdIdx = -1;
        actIdx = 3;
        methodIdx = 4;
        aidIdx = -1;
        refIdx = -1;
        mergedTopicSubIdx = -1;
      }

      // Skip header, alignment, and document metadata rows
      const dataRows = tableLines.filter(l => {
        if (l.includes('---') || l === headerRow) return false;
        let cells = l.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        return !isMetadataOrHeaderRow(cells);
      });
      
      const days = dataRows.map((row, idx) => {
        let cells = row.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        
        const dayNumMatch = cells[dayIdx >= 0 ? dayIdx : 0]?.match(/Day\s*(\d+)/i) || cells[dayIdx >= 0 ? dayIdx : 0]?.match(/(\d+)/);
        const dayNum = dayNumMatch ? parseInt(dayNumMatch[1]) : (idx + 1);

        let top = '';
        let sub = '';

        if (mergedTopicSubIdx >= 0) {
          const rawCell = cells[mergedTopicSubIdx] || '';
          const parsedMerged = splitTopicAndSubtopics(rawCell);
          top = parsedMerged.topic;
          sub = parsedMerged.subtopics[idx] || parsedMerged.subtopics[0] || '';
        } else {
          top = cells[topicIdx >= 0 ? topicIdx : 1] || '';
          sub = cells[subtopicIdx >= 0 ? subtopicIdx : 2] || '';
        }

        const rawComp = compIdx >= 0 ? (cells[compIdx] || '') : '';
        const knowCell = knowledgeIdx >= 0 ? (cells[knowledgeIdx] || '') : '';
        const skillCell = skillsIdx >= 0 ? (cells[skillsIdx] || '') : '';
        const valCell = valuesIdx >= 0 ? (cells[valuesIdx] || '') : '';
        const stdCell = stdIdx >= 0 ? (cells[stdIdx] || '') : knowCell;
        const actCell = actIdx >= 0 ? (cells[actIdx] || '') : '';
        const methCell = methodIdx >= 0 ? (cells[methodIdx] || '') : '';
        const aidCell = aidIdx >= 0 ? (cells[aidIdx] || '') : '';
        const refCell = refIdx >= 0 ? (cells[refIdx] || '') : '';

        const cleanTop = cleanExtractedTopic(top);
        const cleanSubs = cleanExtractedSubtopics(sub ? [sub] : []);
        const cleanSub = cleanSubs[0] || '';
        const cleanComps = cleanExtractedCompetencies(rawComp ? [rawComp] : []);
        const cleanComp = cleanComps[0] || '';
        
        return {
          day: dayNum,
          topic: cleanTop,
          subtopic: cleanSub,
          competency: cleanComp,
          knowledge: knowCell,
          skills: skillCell,
          values: valCell,
          expectedStandard: stdCell,
          learningActivities: actCell ? [actCell] : [],
          teachingMethods: methCell ? [methCell] : [],
          teachingAids: aidCell,
          references: refCell
        };
      });

      if (days.length > 0) return days;
    }

    // Fallback: extract lesson for days 1 to 5
    const fallbackDays = [];
    for (let d = 1; d <= 5; d++) {
      const lesson = extractLessonFromPastedForecastText(markdown, d, 1);
      if (lesson && (lesson.topic || lesson.subtopic || lesson.competency)) {
        fallbackDays.push({
          day: d,
          topic: lesson.topic,
          subtopic: lesson.subtopic,
          competency: lesson.competency,
          expectedStandard: lesson.expectedStandard || '',
          learningActivities: lesson.learningActivities || [],
          teachingMethods: lesson.teachingMethods ? [lesson.teachingMethods] : [],
          teachingAids: lesson.teachingAids || '',
          references: lesson.references || ''
        });
      }
    }
    if (fallbackDays.length > 0) return fallbackDays;
    return null;
  } catch (err) {
    console.error("Parse Forecast failed, attempting fallback...", err);
    try {
      const fallbackDays = [];
      for (let d = 1; d <= 5; d++) {
        const lesson = extractLessonFromPastedForecastText(markdown, d, 1);
        if (lesson && (lesson.topic || lesson.subtopic || lesson.competency)) {
          fallbackDays.push({
            day: d,
            topic: lesson.topic,
            subtopic: lesson.subtopic,
            competency: lesson.competency,
            expectedStandard: lesson.expectedStandard || '',
            learningActivities: lesson.learningActivities || [],
            teachingMethods: lesson.teachingMethods ? [lesson.teachingMethods] : [],
            teachingAids: lesson.teachingAids || '',
            references: lesson.references || ''
          });
        }
      }
      if (fallbackDays.length > 0) return fallbackDays;
    } catch (e) {}
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
        // Parse subtopics dynamically from competencies array for all levels of English and Zambian Languages
        const parsedSubtopics = (sub.competencies && Array.isArray(sub.competencies))
          ? sub.competencies.map((compStr: string, cIdx: number) => {
              let code = "";
              let text = compStr;
              
              if (text.includes('|')) {
                const parts = text.split('|');
                const outcomePart = parts[0].replace(/Specific Outcome:\s*/i, '').replace(/Specific Competency:\s*/i, '').trim();
                const codeMatch = outcomePart.match(/^\d+(\.\d+)*/);
                if (codeMatch) {
                  code = codeMatch[0];
                  text = outcomePart.replace(/^\d+(\.\d+)*\s*/, '').trim();
                } else {
                  text = outcomePart;
                }
              } else {
                const codeMatch = text.match(/^\d+(\.\d+)*/);
                if (codeMatch) {
                  code = codeMatch[0];
                  text = text.replace(/^\d+(\.\d+)*\s*/, '').trim();
                }
              }
              
              // Clean and conjugate/derive a gorgeous subtopic title from the action verb
              let subtopicTitle = text;
              if (text.toLowerCase().startsWith('share ')) {
                subtopicTitle = "Sharing " + text.substring(6);
              } else if (text.toLowerCase().startsWith('use ')) {
                subtopicTitle = "Using " + text.substring(4);
              } else if (text.toLowerCase().startsWith('analyse ')) {
                subtopicTitle = "Analyzing " + text.substring(8);
              } else if (text.toLowerCase().startsWith('tell ')) {
                subtopicTitle = "Telling " + text.substring(5);
              } else if (text.toLowerCase().startsWith('recite ')) {
                subtopicTitle = "Reciting " + text.substring(7);
              } else if (text.toLowerCase().startsWith('comprehend ')) {
                subtopicTitle = "Comprehending " + text.substring(11);
              } else if (text.toLowerCase().startsWith('read ')) {
                subtopicTitle = "Reading " + text.substring(5);
              } else if (text.toLowerCase().startsWith('write ')) {
                subtopicTitle = "Writing " + text.substring(6);
              } else if (text.toLowerCase().startsWith('spell ')) {
                subtopicTitle = "Spelling " + text.substring(6);
              } else if (text.toLowerCase().startsWith('take ')) {
                subtopicTitle = "Taking " + text.substring(5);
              } else if (text.toLowerCase().startsWith('change ')) {
                subtopicTitle = "Changing " + text.substring(7);
              } else if (text.toLowerCase().startsWith('apply ')) {
                subtopicTitle = "Applying " + text.substring(6);
              } else if (text.toLowerCase().startsWith('present ')) {
                subtopicTitle = "Presenting " + text.substring(8);
              } else if (text.toLowerCase().startsWith('develop ')) {
                subtopicTitle = "Developing " + text.substring(8);
              } else if (text.toLowerCase().startsWith('identify ')) {
                subtopicTitle = "Identifying " + text.substring(9);
              } else if (text.toLowerCase().startsWith('solve ')) {
                subtopicTitle = "Solving " + text.substring(6);
              } else if (text.toLowerCase().startsWith('interpret ')) {
                subtopicTitle = "Interpreting " + text.substring(10);
              } else if (text.toLowerCase().startsWith('explain ')) {
                subtopicTitle = "Explaining " + text.substring(8);
              } else if (text.toLowerCase().startsWith('discuss ')) {
                subtopicTitle = "Discussing " + text.substring(8);
              } else if (text.toLowerCase().startsWith('conjugate ')) {
                subtopicTitle = "Conjugating " + text.substring(10);
              } else if (text.toLowerCase().startsWith('adapt ')) {
                subtopicTitle = "Adapting " + text.substring(6);
              }
              
              subtopicTitle = subtopicTitle.split(' ').map(w => w ? w[0].toUpperCase() + w.substring(1) : '').join(' ');
              const fullSubtopicTitle = code ? `${code} ${subtopicTitle}` : subtopicTitle;
              
              return {
                title: fullSubtopicTitle,
                competencies: [compStr],
                learningActivities: sub.learningActivities || [],
                expectedStandard: sub.expectedStandard || "",
                knowledge: sub.knowledge || "",
                skills: sub.skills || "",
                values: sub.values || ""
              };
            })
          : [];
          
        if (parsedSubtopics.length === 0) {
          parsedSubtopics.push({
            title: sub.title,
            competencies: [],
            learningActivities: sub.learningActivities || [],
            expectedStandard: sub.expectedStandard || "",
            knowledge: sub.knowledge || "",
            skills: sub.skills || "",
            values: sub.values || ""
          });
        }
        
        let derivedComponent = sub.component || '';
        if (!derivedComponent) {
          const upperComp = compTitle.toUpperCase();
          if (upperComp.includes('LISTENING')) derivedComponent = 'Listening & Speaking';
          else if (upperComp.includes('READING')) derivedComponent = 'Reading';
          else if (upperComp.includes('WRITING')) derivedComponent = 'Writing';
          else if (upperComp.includes('VOCABULARY')) derivedComponent = 'Vocabulary';
          else if (upperComp.includes('COMPREHENSION')) derivedComponent = 'Comprehension';
          else if (upperComp.includes('LANGUAGE')) derivedComponent = 'Language';
          else if (upperComp.includes('STRUCTURE')) derivedComponent = 'Structure';
          else derivedComponent = autoDeriveComponent(sub.title, 'zambian') || autoDeriveComponent(sub.title, 'english') || compTitle;
        }
        
        transformed.push({
          title: sub.title,
          generalCompetency: compCompetency,
          component: derivedComponent,
          competencies: sub.competencies || [],
          knowledge: sub.knowledge || "",
          skills: sub.skills || "",
          values: sub.values || "",
          expectedStandard: sub.expectedStandard || "",
          learningActivities: sub.learningActivities || [],
          subtopics: parsedSubtopics
        });
      });
    } else {
      transformed.push(comp);
    }
  });
  
  return transformed;
};

export function createDefaultWeeks(grade: string, numWeeks: number = 13, eceBreakWeek: number = 7) {
  const isECE = grade?.toLowerCase().includes('ece') || false;
  const clampedWeeks = Math.min(13, Math.max(1, numWeeks));
  const result: any[] = [];
  
  for (let i = 1; i <= clampedWeeks; i++) {
    let topic = '';
    if (isECE) {
      if (i === eceBreakWeek) {
        result.push({
          week: i,
          topic: 'Mid Term Break (Learners resting at home)',
          subtopics: ['Review activities'],
          competencies: ['Formative review'],
          activities: ['Mid-Term break activities'],
          expectedStandards: ['Assessment of individual progression during informal activities'],
          isAssessment: false
        });
        continue;
      }
      if (i === 12) topic = 'Revisions';
      if (i === 13) topic = 'Consolidation of assessments (Formative throughout, mostly observation)';
      
      result.push({
        week: i,
        topic,
        subtopics: ['', '', '', '', ''],
        competencies: ['', '', '', '', ''],
        activities: ['', '', '', '', ''],
        expectedStandards: ['', '', '', '', ''],
        isAssessment: false
      });
    } else {
      if (i === 12) topic = 'Revisions';
      if (i === 13) topic = 'End of Term Test';
      
      result.push({
        week: i,
        topic,
        subtopics: ['', '', '', '', ''],
        competencies: ['', '', '', '', ''],
        activities: ['', '', '', '', ''],
        expectedStandards: ['', '', '', '', ''],
        isAssessment: false
      });
    }
  }
  return result;
}

// Helper to get human-readable document type title
export function getDocTypeTitle(type?: string): string {
  switch (type) {
    case 'schemes_of_work':
      return 'Schemes of Work';
    case 'weekly_forecast':
      return 'Weekly Forecast';
    case 'lesson_plan':
      return 'Lesson Plan';
    case 'lesson_notes':
      return 'Lesson Notes';
    case 'individual_work_plan':
      return 'Individual Work Plan';
    case 'catch_up':
      return 'Catch-Up / Remedial Plan';
    case 'assessments':
      return 'Assessment & Test';
    case 'video_script':
      return 'Video Script';
    case 'syllabi':
      return 'Syllabus Explorer';
    default:
      return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Academic Document';
  }
}

export interface DocPreparationMethod {
  number: number;
  name: string;
  badge: string;
  description: string;
  actionHint?: string;
  color: 'blue' | 'indigo' | 'emerald' | 'purple' | 'amber';
}

export interface DocGuidanceInfo {
  badge: string;
  header: string;
  description: string;
  subnote: string;
  methods: DocPreparationMethod[];
  scanButtonTitle: string;
  scanButtonSubtitle: string;
  uploadButtonTitle: string;
  uploadButtonSubtitle: string;
}

// Helper to get guidance card headline, exact description, methods list, and scan/upload card titles per generator type
export function getDocGuidanceInfo(type?: string, docTitle?: string): DocGuidanceInfo {
  const title = docTitle || getDocTypeTitle(type);
  const commonOptionNotice = "Choose any method that best fits your current workflow. All preparation methods remain fully active and ready to use.";
  
  if (type === 'schemes_of_work') {
    return {
      badge: 'STANDARD SYLLABUS PREPARATION',
      header: '🧠 SCHEMES OF WORK • SYLLABUS DRIVEN',
      description: 'Prepare your 13-week Schemes of Work directly using the standard syllabus table with marked topics and official Ministry curriculum standards.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Standard Syllabus & 13-Week Table (Dropdowns & Marked Topics)',
          badge: 'SYLLABUS DROPDOWNS & TABLE',
          description: 'Strictly the lesson plan should be prepared in a professional manner where it has to refer to the syllabus and other modules for ready to deliver content. Select Grade, Subject, Term, Starting Topic, and Mark Topics to include in your schemes table using dropdowns or Magic Fill.',
          actionHint: 'Use the curriculum dropdowns and schemes table below.',
          color: 'blue'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Scheme File',
      uploadButtonSubtitle: 'Upload syllabus or old schemes to recycle ♻️ fresh'
    };
  }
  
  if (type === 'weekly_forecast') {
    return {
      badge: 'AVAILABLE PREPARATION METHODS',
      header: '🧠 WEEKLY FORECAST PREPARATION',
      description: 'Prepare your Weekly Forecast using standard syllabus day-by-day table setup, uploading schemes of work, or pasting external schemes.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Standard Syllabus & Manual Forecast Setup',
          badge: 'STANDARD SYLLABUS FORECAST SETUP',
          description: 'Strictly the lesson plan should be prepared in a professional manner where it has to refer to the syllabus and other modules for ready to deliver content. Select Grade, Subject, Term, Planning Week, and number of days (1-5) to populate and edit daily lesson items in the table.',
          actionHint: 'Select planning week and edit days in the table below.',
          color: 'blue'
        },
        {
          number: 2,
          name: 'Upload Schemes of Work to Generate Weekly Forecast (Activating Instruction)',
          badge: 'UPLOAD SCHEMES OF WORK',
          description: 'Upload schemes of work to generate weekly forecast. The week number content entered, will be extracted from the schemes.',
          actionHint: 'Click "Upload Schemes of Work" below.',
          color: 'emerald'
        },
        {
          number: 3,
          name: 'Paste Outside Schemes / Forecast (Activating Instruction)',
          badge: 'PASTE OUTSIDE SCHEMES',
          description: 'Paste outside schemes or forecast text directly into instructions box; the system extracts that exact week faithfully.',
          actionHint: 'Click "Paste Outside Schemes" on the instruction box.',
          color: 'purple'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Schemes of Work',
      uploadButtonSubtitle: 'Upload schemes of work to generate weekly forecast'
    };
  }
  
  if (type === 'lesson_plan') {
    return {
      badge: 'AVAILABLE PREPARATION METHODS',
      header: '🧠 LESSON PLAN PREPARATION',
      description: 'Prepare your Lesson Plan using standard syllabus topic & competency selection, uploading weekly forecast, or pasting lessons.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Standard Syllabus & Competency Selection',
          badge: 'SYLLABUS SELECTION',
          description: 'Strictly the lesson plan should be prepared in a professional manner where it has to refer to the syllabus and other modules for ready to deliver content. Select Grade, Subject, Term, Week, Day, Topic, single competency, and 1-2 learning activities from official dropdowns.',
          actionHint: 'Use the standard lesson form dropdowns below.',
          color: 'blue'
        },
        {
          number: 2,
          name: 'Upload Weekly Forecast File (Activating Instruction)',
          badge: 'UPLOAD WEEKLY FORECAST',
          description: 'Upload weekly forecast to generate lesson of week. Content will be extracted from the forecast.',
          actionHint: 'Click "Upload Weekly Forecast" below.',
          color: 'emerald'
        },
        {
          number: 3,
          name: 'Paste Lesson from Weekly Forecast (Activating Instruction)',
          badge: 'PASTE LESSON FROM FORECAST',
          description: 'Paste weekly forecast text into instructions to extract the designated lesson and day.',
          actionHint: 'Click "Paste Lesson from Weekly Forecast" on the instruction box.',
          color: 'indigo'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Weekly Forecast',
      uploadButtonSubtitle: 'Upload weekly forecast to generate lesson of week'
    };
  }
  
  if (type === 'individual_work_plan') {
    return {
      badge: 'AVAILABLE PREPARATION METHODS',
      header: '🧠 INDIVIDUAL WORK PLAN PREPARATION',
      description: 'Prepare your Individual Work Plan using standard role and institutional targets setup, uploading previous work plans, or applying professional directives.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Standard Role & Institutional Targets Setup',
          badge: 'JOB ROLE & KRA SETUP',
          description: 'Select Job Title & Pay Scale, Section, Term (Term 1 - Term 3), Grade Level, Objectives, and Key Result Areas.',
          actionHint: 'Fill in the professional details and KRAs in the form below.',
          color: 'emerald'
        },
        {
          number: 2,
          name: 'Upload Work Plan File to Recycle ♻️',
          badge: 'UPLOAD TO RECYCLE ♻️',
          description: 'Upload previous work plans to recycle ♻️ fresh into current Ministry standards and formatted tables.',
          actionHint: 'Click "Upload Work Plan File" below.',
          color: 'blue'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Work Plan File',
      uploadButtonSubtitle: 'Upload old file to recycle ♻️ fresh'
    };
  }
  
  if (type === 'lesson_notes') {
    return {
      badge: 'AVAILABLE PREPARATION METHODS',
      header: '🧠 LESSON NOTES PREPARATION',
      description: 'Prepare comprehensive Lesson Notes using standard curriculum topic selection, uploading previous notes, or providing custom directives.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Standard Syllabus & Topic Selection',
          badge: 'DROPDOWN TOPIC SETUP',
          description: 'Select Grade, Subject, Term, Topic, and Subtopic from official curriculum dropdowns.',
          actionHint: 'Use the standard form selectors below.',
          color: 'blue'
        },
        {
          number: 2,
          name: 'Upload Notes File to Recycle ♻️',
          badge: 'UPLOAD TO RECYCLE ♻️',
          description: 'Upload previous lesson notes or textbook pages to recycle ♻️ into structured classroom notes.',
          actionHint: 'Click "Upload Notes File" below.',
          color: 'emerald'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Notes File',
      uploadButtonSubtitle: 'Upload old notes or textbook pages to recycle ♻️'
    };
  }
  
  if (type === 'assessments') {
    return {
      badge: 'AVAILABLE PREPARATION METHODS',
      header: '🧠 ASSESSMENTS / TEST PREPARATION',
      description: 'Prepare standardized assessments and tests with real curriculum educational teaching diagrams, questions builder, and examination directives.',
      subnote: commonOptionNotice,
      methods: [
        {
          number: 1,
          name: 'Interactive Question Types & Marks Builder',
          badge: 'QUESTION TYPES & MARKS BUILDER',
          description: 'Configure Question Types, Counts, Marks, Duration, Grade, and Subject directly.',
          actionHint: 'Use the interactive question counter controls below.',
          color: 'blue'
        },
        {
          number: 2,
          name: 'Custom Focus & Examination Directives',
          badge: 'CUSTOM TEST DIRECTIVES',
          description: 'Provide specific test instructions, Bloom\'s taxonomy distribution, or syllabus focus areas.',
          actionHint: 'Type custom guidelines in the additional instructions box.',
          color: 'indigo'
        }
      ],
      scanButtonTitle: '',
      scanButtonSubtitle: '',
      uploadButtonTitle: 'Upload Test File',
      uploadButtonSubtitle: 'Upload past questions to recycle ♻️ fresh'
    };
  }
  
  // Default / Other generators (Records of Work, Video Script, Mock Exam, etc.)
  return {
    badge: 'AVAILABLE PREPARATION METHODS',
    header: `🧠 ${title.toUpperCase()} PREPARATION`,
    description: `Prepare ${title.toLowerCase()} documents using standard curriculum setup, uploading previous files, or providing custom instructions.`,
    subnote: commonOptionNotice,
    methods: [
      {
        number: 1,
        name: `Standard ${title} Setup`,
        badge: 'STANDARD SETUP',
        description: `Choose Grade, Subject, Topic, and standard document parameters directly from the form.`,
        actionHint: 'Fill in the standard form fields below.',
        color: 'blue'
      },
      {
        number: 2,
        name: 'Upload File to Recycle ♻️',
        badge: 'UPLOAD TO RECYCLE ♻️',
        description: `Upload old ${title.toLowerCase()} files to recycle ♻️ into fresh curriculum-aligned content.`,
        actionHint: `Click "Upload ${title} File" below.`,
        color: 'emerald'
      },
      {
        number: 3,
        name: 'Custom Context & Directives',
        badge: 'CUSTOM DIRECTIVES & NOTES',
        description: 'Activate tailored instructions or type specific requirements into the instructions box.',
        actionHint: 'Type or activate instructions in the context box below.',
        color: 'indigo'
      }
    ],
    scanButtonTitle: '',
    scanButtonSubtitle: '',
    uploadButtonTitle: `Upload ${title} File`,
    uploadButtonSubtitle: `Upload old ${title.toLowerCase()} to recycle ♻️ fresh`
  };
}

export function getDocPlaceholder(type?: string): string {
  if (type === 'schemes_of_work') {
    return "Upload syllabus or schemes to recycle ♻️, click button above to activate arranged pattern, or type instructions...";
  }
  if (type === 'weekly_forecast') {
    return "Paste outside schemes for this week (or Weeks 1-13), upload schemes/forecast to recycle ♻️, click button above, or type instructions...";
  }
  if (type === 'lesson_plan') {
    return "Upload weekly forecast to generate lesson of week...";
  }
  const title = getDocTypeTitle(type);
  return `Upload old ${title.toLowerCase()} to recycle ♻️ fresh, click button above to activate instructions, or type custom instructions...`;
}

// Generate tailored instructions for instruction box based on user instructions
export function getTailoredDocInstructions(params: {
  type?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  stoppingTopic?: string;
  forecastWeek?: string | number;
  dayOfWeek?: string;
  weekNumber?: string | number;
  lessonNumber?: string | number;
  lessonWeekNumber?: string | number;
  numberOfDays?: number;
  selectedTopics?: any[];
  syllabusRange?: any[];
}): string {
  const { type, grade, subject, topic, stoppingTopic, forecastWeek, dayOfWeek, weekNumber, lessonNumber, lessonWeekNumber, numberOfDays, selectedTopics, syllabusRange } = params;
  const docTitle = getDocTypeTitle(type);
  const gradeStr = grade || 'selected grade';
  const subjectStr = subject || 'this subject';

  const normalInstructionsHeader = `**Strictly the lesson plan should be prepared in a professional manner where it has to refer to the syllabus and other modules for ready to deliver content.**`;

  if (type === 'schemes_of_work') {
    const stopTopicStr = stoppingTopic ? `(topic:${stoppingTopic})` : '(indicate: e.g. topic:1.6 patterns)';
    const firstTopicStr = topic ? `first topic "${topic}"` : 'first topics selected in first roll';
    let text = `${normalInstructionsHeader}

Instructions (Schemes of Work):
- Prepare Schemes of Work for grade (${gradeStr}) and subject (${subjectStr}) referring strictly to the official syllabus and curriculum modules.
- Curriculum framework stipulations about periods must be followed strictly and must allocate Subtopics and learning activities accordingly based on periods assigned to this subject (${subjectStr}) for this grade (${gradeStr}) until all learning activities showing on each topic in the syllabus are used and exhausted.
- Teaching & Assessment Structure: Active teaching from Weeks 1 to 11 (with Continuous Monthly Assessment Test 1 in Week 4 and Test 2 in Week 8), Revisions in Week 12 ONLY, and End of Term Summative Test in Week 13.`;

    const hasConcludedTopicSelection = Boolean(
      (topic && topic.trim() !== '') || 
      (stoppingTopic && stoppingTopic.trim() !== '') || 
      (selectedTopics && selectedTopics.length > 0)
    );

    if (hasConcludedTopicSelection && syllabusRange && Array.isArray(syllabusRange) && syllabusRange.length > 0) {
      const topicLines = syllabusRange.map((t: any, idx: number) => {
        const title = (typeof t === 'string' ? t : (t.topicName || t.title || t.topic || `Topic ${idx + 1}`)).trim();
        const rawSubs = Array.isArray(t?.subtopics) ? t.subtopics : [];

        if (rawSubs.length === 0) {
          return `• TOPIC: ${title}`;
        }

        const subDetails = rawSubs.map((s: any) => {
          const sTitle = (typeof s === 'string' ? s : (s.title || s.name || s.subtopicTitle || s.subtopic || '')).trim();
          if (!sTitle) return '';

          let compStr = '';
          const comps = typeof s === 'object' ? (s?.competencies || s?.specificCompetencies || s?.outcomes || s?.competency) : null;
          if (Array.isArray(comps) && comps.length > 0) {
            compStr = comps.map((c: any) => typeof c === 'string' ? c : (c.title || c.name || '')).filter(Boolean).join('; ');
          } else if (typeof comps === 'string' && comps.trim()) {
            compStr = comps.trim();
          }

          let actStr = '';
          const acts = typeof s === 'object' ? (s?.learningActivities || s?.activities || s?.activity) : null;
          if (Array.isArray(acts) && acts.length > 0) {
            actStr = acts.map((a: any) => typeof a === 'string' ? a : (a.title || a.name || '')).filter(Boolean).join('; ');
          } else if (typeof acts === 'string' && acts.trim()) {
            actStr = acts.trim();
          }

          let subBlock = `  - Subtopic: ${sTitle}`;
          if (compStr) subBlock += `\n    * Specific Competencies: ${compStr}`;
          if (actStr) subBlock += `\n    * Learning Activities: ${actStr}`;
          return subBlock;
        }).filter(Boolean).join('\n');

        return `• TOPIC: ${title}${subDetails ? `\n${subDetails}` : ''}`;
      }).join('\n\n');

      text += `\n\n[ARRANGED SYLLABUS PATTERN & IN ORDER DIRECT FROM SYLLABUS]:\n${topicLines}`;
    }
    return text;
  }

  if (type === 'weekly_forecast') {
    return `${normalInstructionsHeader}

**SCHEMES OF WORK & WEEKLY FORECAST GENERATION INSTRUCTIONS**
1. CURRICULUM FRAMEWORK:
- Stipulations about periods must be followed strictly and allocate Subtopics and learning activities based on periods assigned to this subject (${subjectStr}) for this grade (${gradeStr}).
- Refer strictly to the official syllabus and modules for ready-to-deliver content.
2. TEACHING & ASSESSMENT STRUCTURE:
- Weeks 1 to 11: Active teaching and learning.
- Week 4 & Week 8: Continuous Monthly Assessment Tests.
- Week 12: Revisions. Week 13: End of Term Test.`;
  }

  if (type === 'lesson_plan') {
    const lessonNum = params.lessonNumber || params.dayOfWeek || '1';
    const weekNum = params.lessonWeekNumber || params.weekNumber || params.forecastWeek || '1';
    return `${normalInstructionsHeader}

Instructions (Lesson Plan - Week ${weekNum}, Lesson ${lessonNum}):
- Prepare professional lesson plans referring strictly to the Zambian syllabus and teaching modules for ready-to-deliver content.
- Utilize gradual release methodology and ensure clear stage-by-stage pacing from introduction to conclusion.`;
  }

  return `${normalInstructionsHeader}

Instructions (${docTitle}):
- Prepare professional documents referring strictly to the official syllabus and modules for ${gradeStr} ${subjectStr}.`;
}

// Generate instructions for preparing documents from an outside source of schemes of work
export function getOutsideSourceSchemesInstructions(
  type?: string,
  opts?: {
    grade?: string;
    subject?: string;
    forecastWeek?: string | number;
    lessonNumber?: string | number;
    numberOfDays?: number;
  }
): string {
  const gradeStr = opts?.grade || 'selected grade';
  const subjectStr = opts?.subject || 'selected subject';
  if (type === 'weekly_forecast') {
    const weekStr = opts?.forecastWeek ? `Week ${opts.forecastWeek}` : 'selected week';
    const numDays = opts?.numberOfDays || 5;
    return `INSTRUCTIONS (OUTSIDE SOURCE SCHEMES OF WORK - WEEKLY FORECAST):
• Alternative Preparation Method: Preparing Weekly Forecast from an outside source scheme of work.
• TRUTHFULNESS & ORDER MANDATE: All information for ${weekStr} (${numDays} Days) must be truthful and MUST be gotten the exact way information is pasted from that outside source.
• DO NOT substitute with different topics or borrow from other weeks.
• Allocate lessons faithfully across Day 1 to Day ${numDays} following what was prepared by the outsider source.

Eyes on the references and T/L aids in the final templates whether schemes, weekly forecast or lesson plans 
Note: The above arrangement, is what is needed to be found in the box of instructions when uploading the schemes of work to generate the weekly forecast from day 1 to 5 maximum.
Follow the above order as strictly the order of instructions and the output must exactly follow the same information without leaving anything.
Teaching Methods should not be suited all days from 1 to day 5. The lesson itself, must attract teaching methods. But again you should remember that the gradual process release method is always there as a way to deliver the CBC curriculum lesson. Its important methods vary throughout the week.
TL ads: these must not overload the column cell because of becoming so many no!! What is needed are just a few teaching aids to be shown in the weekly day lesson depending on the nurture of the lesson to be delivered. Also this one should not be suited throughout unless otherwise.
References should be written short throughout the weekly forecast and the schemes also in lesson plans like the following examples below 👇 eg;

1.ECE LEVELS
    -ECE levels 1-2  mathematics and science syllabus page:......( Indicate if coming from the upload  and pasting methods)
2.Primary grades:
   -Grade 1- 3 creative & technology studies syllabus page:.....(Same)
3.UPPER PRIMARY 
   - Grade 4-6 English language syllabus page:......(Same here)
4. FORM 1-4
   - Form 1- 4 Mthematics syllabus 1 page:....
5. FORM 5-6
  - Form 5-6 chemistry syllabus page:........(Same)

Obc- do the same: 
1. primary: Grade 1 to 4 science syllabus page:......(same)
2. upper: Grade 5 to 7 social studies syllabus page:...... (Same)
3. Secondary: it's grade 11 to 12 mathematics 2 syllabus page:.....

[PASTE YOUR OUTSIDE SOURCE SCHEMES OF WORK FOR ${weekStr.toUpperCase()} (OR FULL WEEKS 1 TO 13) BELOW]:
`;
  }
  if (type === 'lesson_plan') {
    const lessonNum = opts?.lessonNumber || 1;
    const weekNum = opts?.forecastWeek || 1;
    return `Upload weekly forecast to generate lesson ${lessonNum} of week ${weekNum}. The lesson and week number content entered,will be extracted from the weekly forecast of you phone storage`;
  }
  return `INSTRUCTIONS (OUTSIDE SOURCE SCHEMES OF WORK - WEEKS 1 TO 13):
• Alternative Preparation Method: Preparing Schemes of Work from an outside source of schemes of work (e.g. Week 1 or Week 2 up to Week 13) prepared by a different source.
• TRUTHFULNESS & ORDER MANDATE: If information is pasted in this box of instructions, that information must be truthful and MUST follow the EXACT SAME ORDER it has been prepared by the outsider source!
• DO NOT alter, reorder, or replace any pasted information with other syllabus topics. Treat the outside source as the authoritative plan.

[PASTE YOUR OUTSIDE SOURCE SCHEMES OF WORK (WEEKS 1 TO 13) BELOW]:
`;
}

export function DocGenerator({ initialType, onGenerate, onBack, onNavigate }: DocGeneratorProps) {
  const { user, registeredGrades, isWhitelisted, userType, downloadRecords, refreshDownloads, subscriptionDetails, globalConfig } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [progressText, setProgressText] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeExtractToastIdRef = useRef<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);


  const enforceGradeLock = globalConfig.enforceGradeLock;

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const [activeInfo, setActiveInfo] = useState<'general' | 'weeks' | 'forecast'>('general');
  const [magicFill, setMagicFill] = useState(false);
  const [smartPlan, setSmartPlan] = useState(false);
  const [isConnectTimetable, setIsConnectTimetable] = useState<boolean>(() => isTimetableConnectedToDropdown());
  const [isDetachTimetableLogic, setIsDetachTimetableLogic] = useState<boolean>(false);
  const [activeTimetableSchedule, setActiveTimetableSchedule] = useState<{ days: string[]; minActivities: number } | null>(null);

  const handleToggleConnectTimetable = (enabled: boolean) => {
    setIsConnectTimetable(enabled);
    setTimetableConnectedToDropdown(enabled);
    if (enabled) {
      toast.success("Syllabus Drop-Down connected to Smart Planning Teaching Timetable!");
    } else {
      toast("Disconnected from Timetable. Manual selection restored.", { icon: "ℹ️" });
    }
  };
  const [manualTable, setManualTable] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [curriculumType, setCurriculumType] = useState<'CBC' | 'OBC'>('CBC');
  const [isPrivateModulesCollapsed, setIsPrivateModulesCollapsed] = useState(false);
  const [isSyllabusBrowserCollapsed, setIsSyllabusBrowserCollapsed] = useState(false);
  const [isTextbookSectionCollapsed, setIsTextbookSectionCollapsed] = useState(false);
  const [isDiagramLibraryOpen, setIsDiagramLibraryOpen] = useState(false);
  const [diagramSearch, setDiagramSearch] = useState('');
  const [selectedDiagramCategory, setSelectedDiagramCategory] = useState<string>('all');
  const [diagramFilterGrade, setDiagramFilterGrade] = useState<string>('all');
  const [diagramFilterSubject, setDiagramFilterSubject] = useState<string>('all');
  const [diagramFilterTopic, setDiagramFilterTopic] = useState<string>('all');
  const [diagramFilterSubtopic, setDiagramFilterSubtopic] = useState<string>('all');

  // Normal Planning - Schemes of Work Segmentation & Analyser States
  const [isSchemesAnalyzing, setIsSchemesAnalyzing] = useState<boolean>(false);
  const [schemesAnalysisStatus, setSchemesAnalysisStatus] = useState<'idle' | 'loading' | 'completed'>('idle');
  const [isSchemesAnalyzed, setIsSchemesAnalyzed] = useState<boolean>(false);
  const [schemesSelectedWeek, setSchemesSelectedWeek] = useState<number>(1);

  const [formData, setFormData] = useState<GenerationParams>({
    type: initialType || 'lesson_plan',
    subject: '',
    zambianLanguage: 'Icibemba',
    grade: '',
    topic: '',
    subtopic: '',
    englishPreparationMode: 'normal',
    groupTopicsByTerm: true,
    knowledge: '',
    selectedSubtopics: [],
    selectedCompetences: [],
    generalCompetences: '',
    specificCompetences: '',
    lessonGoal: '',
    lessonLength: 'Detailed',
    contentScale: 'medium',
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
    englishCombined: false,
    references: '',
    weeks: createDefaultWeeks('Grade 1 (CBC)', 13),
    forecastWeek: 1,
    lessonNumber: '',
    lessonWeekNumber: '',
    forecastDays: Array.from({ length: 5 }, (_, i) => ({
      day: (i + 1).toString(),
      topic: '',
      subtopic: '',
      competency: '',
      activities: ['', ''],
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
    sectionDiagrams: {
      mcq: true,
      shortAnswer: true,
      essay: true,
      matching: true,
      categories: ['Animals', 'Fruits & Vegetables', 'Household & Transport', 'Science & Lab', 'Math & Geometry']
    },
    jobTitle: '',
    jobPurpose: '',
    workPlanPeriod: 'JANUARY TO DECEMBER',
    workPlanPeriodStart: 'JANUARY',
    workPlanPeriodEnd: 'DECEMBER',
    includeAnnualWorkPlan: true,
    termStartDate: '07-09-2026',
  });

  useEffect(() => {
    if (!isConnectTimetable || !formData.grade || !formData.subject) {
      setActiveTimetableSchedule(null);
      return;
    }
    let isCancelled = false;
    getGradeTeachingTimetable(formData.grade, formData.term || 'Term 3').then(tb => {
      if (isCancelled || !tb) return;
      const sched = tb.subjectSchedules?.[formData.subject];
      if (sched && sched.days) {
        const days = sched.days;
        const minActs = getMinimumActivitiesForDays(days.length);
        setActiveTimetableSchedule({ days, minActivities: minActs });
      } else {
        setActiveTimetableSchedule(null);
      }
    }).catch(() => {});
    return () => { isCancelled = true; };
  }, [isConnectTimetable, formData.grade, formData.subject, formData.term]);

  useEffect(() => {
    if (isDiagramLibraryOpen) {
      setDiagramFilterGrade(formData.grade || 'all');
      setDiagramFilterSubject(formData.subject || 'all');
      setDiagramFilterTopic(formData.topic || 'all');
      setDiagramFilterSubtopic(formData.subtopic || 'all');
    }
  }, [isDiagramLibraryOpen, formData.grade, formData.subject, formData.topic, formData.subtopic]);

  useEffect(() => {
    if (initialType && initialType !== formData.type) {
      setFormData(prev => ({ ...prev, type: initialType }));
    }
  }, [initialType]);

  // Autosave and Recovery States
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | null>(null);
  const [lastGeneratedContent, setLastGeneratedContent] = useState<string | null>(null);
  const [detectedDraft, setDetectedDraft] = useState<{
    formData: GenerationParams;
    generatedDoc: { content: string; params: GenerationParams } | null;
    updatedAt: any;
  } | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [termMismatchNotice, setTermMismatchNotice] = useState<{
    detectedTerm: string;
    selectedTerm: string;
    sourceName?: string;
  } | null>(null);

  const detectTermInText = (text: string): { detectedTerm: string | null; textMatch: string | null } => {
    if (!text) return { detectedTerm: null, textMatch: null };
    const lower = text.toLowerCase();
    
    const t3Match = lower.match(/\b(term\s*3|term\s*three|3rd\s*term|term\s*iii)\b/);
    const t2Match = lower.match(/\b(term\s*2|term\s*two|2nd\s*term|term\s*ii)\b/);
    const t1Match = lower.match(/\b(term\s*1|term\s*one|1st\s*term|term\s*i)\b/);

    if (t3Match && !t1Match && !t2Match) return { detectedTerm: '3', textMatch: t3Match[0] };
    if (t2Match && !t1Match && !t3Match) return { detectedTerm: '2', textMatch: t2Match[0] };
    if (t1Match && !t2Match && !t3Match) return { detectedTerm: '1', textMatch: t1Match[0] };

    const firstMatch = lower.match(/\b(term\s*[123]|term\s*(one|two|three)|[123](st|nd|rd)\s*term|term\s*(i|ii|iii))\b/);
    if (firstMatch) {
      const m = firstMatch[0];
      if (m.includes('3') || m.includes('three') || m.includes('3rd') || m.includes('iii')) return { detectedTerm: '3', textMatch: m };
      if (m.includes('2') || m.includes('two') || m.includes('2nd') || m.includes('ii')) return { detectedTerm: '2', textMatch: m };
      if (m.includes('1') || m.includes('one') || m.includes('1st') || m.includes('i')) return { detectedTerm: '1', textMatch: m };
    }

    return { detectedTerm: null, textMatch: null };
  };



  // Helper to determine if actual work has been performed by the user
  const hasSubstantiveWork = (fData?: GenerationParams, genDoc?: { content: string; params?: any } | null): boolean => {
    if (!fData) return false;
    // 1. If a document has already been generated
    if (genDoc && genDoc.content && genDoc.content.trim().length > 20) {
      return true;
    }
    // 2. If user has entered a real topic, subtopic, or selected subtopics
    const cleanTop = cleanExtractedTopic(fData.topic || '');
    const cleanSub = cleanExtractedSubtopics([fData.subtopic || ''])[0] || '';
    if (cleanTop.length > 0) return true;
    if (cleanSub.length > 0) return true;
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
      setHasGenerated(false);
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

  // Tier A (Guest/Experiment/Expired User)
  const isUserGuestTier = (!isWhitelisted && userType === 'guest' && !isUserEmailDeveloper);
  const isDocTypeLockedForGuest = false; // All document types can be generated & viewed on screen!

  const usageCounts = {
    schemes_of_work: 0,
    weekly_forecast: 0,
    lesson_plan: 0,
  };

  // Enforce grade-specific and overall billing circle download/generation limits
  let isActiveCircleLimitReached = false;
  let gradeSpecificLimitMsg = "";
  
  if (!isUserGuestTier && !isUserEmailDeveloper && subscriptionDetails && !subscriptionDetails.unlimitedDownloads) {
    const totalUsed = subscriptionDetails.circleDownloadsCount || 0;
    const totalLimit = subscriptionDetails.circleDownloadsLimit || 180;
    
    if (totalUsed >= totalLimit) {
      isActiveCircleLimitReached = true;
      gradeSpecificLimitMsg = `Billing Cycle Limit Reached: You have reached your package download/generation limit of ${totalLimit} documents for this billing circle. Please contact Fortunes Edutech to renew or upgrade your package.`;
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
        grade: 'Grade 1'
      }));
    }
  }, [formData.grade]);

  // Ensure curriculum type is always strictly CBC
  useEffect(() => {
    if (curriculumType !== 'CBC') {
      setCurriculumType('CBC');
    }
  }, [curriculumType]);

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

  // Dynamic Live Date Helper for Weekly Forecasts and Document Generator
  const liveDateInfo = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const dayNum = String(now.getDate()).padStart(2, '0');
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const monthName = now.toLocaleDateString('en-GB', { month: 'short' });
    const yearNum = now.getFullYear();

    const dayOfWeek = now.getDay();
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + offset);
    const mDay = String(monday.getDate()).padStart(2, '0');
    const mMth = String(monday.getMonth() + 1).padStart(2, '0');
    const mYear = monday.getFullYear();

    return {
      todayStr: `${dayNum}-${monthNum}-${yearNum}`,
      todayReadable: `${dayName}, ${dayNum} ${monthName} ${yearNum}`,
      currentWeekMonday: `${mDay}-${mMth}-${mYear}`,
      yearStr: yearNum.toString()
    };
  }, []);

  const handleSetTermStartToCurrentWeek = () => {
    setFormData(prev => ({
      ...prev,
      termStartDate: liveDateInfo.currentWeekMonday,
      year: liveDateInfo.yearStr
    }));
    toast.success(`Set Term Start Date to current week Monday (${liveDateInfo.currentWeekMonday})!`);
  };

  const handleSetTermStartToToday = () => {
    setFormData(prev => ({
      ...prev,
      termStartDate: liveDateInfo.todayStr,
      year: liveDateInfo.yearStr
    }));
    toast.success(`Set Term Start Date to today's date (${liveDateInfo.todayStr})!`);
  };

  const handleSyncForecastDatesToCurrentWeek = () => {
    const mondayStr = formData.termStartDate || liveDateInfo.currentWeekMonday;
    const weeksInfo = calculateTermDates(mondayStr, 13);
    const weekIdx = Math.max(0, (Number(formData.forecastWeek) || 1) - 1);
    const weekData = weeksInfo[weekIdx] || weeksInfo[0];

    if (weekData && weekData.days) {
      setFormData(prev => ({
        ...prev,
        forecastDays: (prev.forecastDays || []).map((day, idx) => ({
          ...day,
          date: weekData.days[idx] ? weekData.days[idx].dateStr : day.date
        }))
      }));
      toast.success(`Dynamic dates printed and applied for Week ${formData.forecastWeek || 1}!`);
    }
  };


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
    const g = (formData.grade || '').toLowerCase();
    const s = (formData.subject || '').toLowerCase();
    const isEng = s.includes('english') || s.includes('literacy') || s.includes('oral');
    
    let data: any = null;
    if (g.includes('grade 1') && !g.includes('grade 10') && !g.includes('grade 11') && !g.includes('grade 12')) {
      data = SYLLABI['Grade 1 (CBC)'] || SYLLABI['Grade 1 (OBC)'] || SYLLABI['Grade 1 (Primary)'];
    } else if (g.includes('grade 2') && !g.includes('grade 12')) {
      data = SYLLABI['Grade 2 (CBC)'] || SYLLABI['Grade 2 (OBC)'] || SYLLABI['Grade 2 (Primary)'];
    }

    if (!data && !isEng) return { oral: [], literacy: [], isEnglish: false };

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

    const isGr2 = g.includes('grade 2');
    const rawOral = (data && (data['Oral English'] || data['oral English'])) || (isGr2 ? englishGrade2Oral : englishGrade1Oral);
    const rawLit = (data && (data['Literacy in English'] || data['literacy in English'])) || (isGr2 ? englishGrade2Literacy : englishGrade1Literacy);

    return {
      oral: filterTopicsByTerm(rawOral || []),
      literacy: filterTopicsByTerm(rawLit || []),
      isEnglish: true
    };
  };

  const getAvailableSubjects = (grade: string) => {
    let baseSubjects: string[] = [...getSubjectsForGrade(grade)];

    // Determine the "Level Bucket" for strict filtering
    const getLevelBucket = (gStr: string) => {
      const g = gStr.toLowerCase();
      if (g.includes('ece')) return 'ECE';
      const match = g.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (g.includes('form')) return 'SECONDARY';
        if (num <= 3) return 'PRIMARY_LOWER';
        if (num >= 4 && num <= 7) return 'PRIMARY_UPPER';
        if (num >= 8 && num <= 9) return 'JUNIOR_SECONDARY';
        if (num >= 10) return 'SECONDARY';
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
        if (curriculumType === 'OBC' || grade.toLowerCase().includes('(obc)')) {
          if (!isOBC && mGrade !== 'universal') return false;
        } else {
          if (isOBC) return false;
        }

        // Grade matching
        if (m.grade === grade || mGrade === 'universal') return true;
        
        // Level matching (strict separation)
        if (currentBucket !== 'UNKNOWN') {
          const moduleBucket = getLevelBucket(mGrade + ' ' + mName);
          if (moduleBucket !== 'UNKNOWN' && moduleBucket !== currentBucket && mGrade !== 'universal') return false;
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

    // Normalize and remove duplicates and invalid entries
    const normalize = (s: string): string | null => {
      if (!s) return null;
      let val = s.trim();
      const lower = val.toLowerCase();

      // Reject non-subject terms and grade names leaking into subjects
      if (
        lower.startsWith('grade ') ||
        lower.startsWith('ece ') ||
        lower.startsWith('form ') ||
        lower === 'universal' ||
        lower.includes('3-5') ||
        lower.includes('year') ||
        lower.includes('syllabus') ||
        lower === 'grade 1' ||
        lower === 'grade 2' ||
        lower === 'grade 3' ||
        lower === 'grade 4' ||
        lower === 'grade 5' ||
        lower === 'grade 6' ||
        lower === 'grade 7' ||
        lower === 'social, emotional and spiritual development'
      ) {
        return null;
      }

      // Standardize common subject variations
      let cleanSubject: string | null = val;

      if (
        lower === 'english' ||
        lower === 'english language' ||
        lower === 'english language ' ||
        lower === 'english component'
      ) {
        cleanSubject = 'English';
      } else if (
        lower === 'zambian language' ||
        lower === 'zambian languages' ||
        lower === 'zambian local language' ||
        lower === 'icitonga' ||
        lower === 'chitonga' ||
        lower === 'icibemba' ||
        lower === 'cinyanja' ||
        lower === 'silozi' ||
        lower === 'luvale' ||
        lower === 'lunda' ||
        lower === 'kiikaonde'
      ) {
        cleanSubject = 'Zambian Language';
      } else if (
        lower === 'creative and technology studies' ||
        lower === 'creative and technology studies (obc)' ||
        lower === 'creative and technology study' ||
        lower === 'cts'
      ) {
        cleanSubject = 'Creative and Technology Studies';
      } else if (
        lower === 'technology studies' ||
        lower === 'technology study' ||
        lower === 'technology'
      ) {
        cleanSubject = 'Technology Studies';
      } else if (lower === 'expressive arts' || lower === 'expressive art') {
        cleanSubject = 'Expressive Arts';
      } else if (
        lower === 'mathematics and science' ||
        lower === 'mathematics & science'
      ) {
        cleanSubject = 'Mathematics and Science';
      } else if (
        lower === 'pre-mathematics' ||
        lower === 'pre-mathematics and science' ||
        lower === 'pre-mathematics & science'
      ) {
        cleanSubject = 'Pre-Mathematics & Science';
      } else if (lower === 'mathematics 1') {
        cleanSubject = 'Mathematics 1';
      } else if (lower === 'mathematics 2') {
        cleanSubject = 'Mathematics 2';
      } else if (lower === 'mathematics' || lower === 'maths') {
        cleanSubject = currentBucket === 'SECONDARY' ? 'Mathematics 1' : 'Mathematics';
      } else if (lower === 'integrated science' || lower === 'science') {
        cleanSubject = (curriculumType === 'OBC' || grade.toLowerCase().includes('(obc)')) ? 'Integrated Science' : 'Science';
      } else if (lower === 'social studies' || lower === 'social study') {
        cleanSubject = 'Social Studies';
      } else if (lower === 'commerce') {
        cleanSubject = 'Commerce';
      } else if (
        lower === 'principles of accounts' ||
        lower === 'principles of account' ||
        lower === 'accounts'
      ) {
        cleanSubject = 'Principles of Accounts';
      } else if (
        lower === 'home economics' ||
        lower === 'home economics & hospitality' ||
        lower === 'home economics and hospitality'
      ) {
        cleanSubject = (curriculumType === 'OBC' || grade.toLowerCase().includes('(obc)')) ? 'Home Economics' : 'Home Economics & Hospitality';
      } else if (lower === 'literacy' || lower === 'literacy in english') {
        cleanSubject = 'Literacy in English';
      } else if (lower === 'oral english') {
        cleanSubject = 'Oral English';
      }

      if (!cleanSubject) return null;
      const cleanLower = cleanSubject.toLowerCase();

      // STRICT LEVEL / BUCKET RESTRICTIONS:
      // Upper Primary (Grades 4-7):
      if (currentBucket === 'PRIMARY_UPPER') {
        if (
          cleanLower === 'creative and technology studies' ||
          cleanLower === 'mathematics and science' ||
          cleanLower === 'pre-mathematics & science' ||
          cleanLower === 'literacy in english' ||
          cleanLower === 'oral english' ||
          cleanLower === 'literacy'
        ) {
          return null;
        }
      }

      // Lower Primary (Grades 1-3):
      if (currentBucket === 'PRIMARY_LOWER') {
        const isOBC = curriculumType === 'OBC' || grade.toLowerCase().includes('(obc)');
        if (!isOBC && (
          cleanLower === 'mathematics' ||
          cleanLower === 'integrated science' ||
          cleanLower === 'science'
        )) {
          cleanSubject = 'Mathematics and Science';
        }
        if (
          cleanLower === 'technology studies' ||
          cleanLower === 'expressive arts' ||
          cleanLower === 'home economics' ||
          cleanLower === 'home economics & hospitality' ||
          cleanLower === 'pre-mathematics & science'
        ) {
          return null;
        }
        if (cleanLower === 'social studies' && !grade.toLowerCase().includes('grade 3 (obc)')) {
          return null;
        }
      }

      // ECE:
      if (currentBucket === 'ECE') {
        if (
          cleanLower !== 'pre-mathematics & science' &&
          cleanLower !== 'creative and technology studies' &&
          cleanLower !== 'zambian language' &&
          cleanLower !== 'english'
        ) {
          return null;
        }
      }

      return cleanSubject;
    };

    const combined = [...baseSubjects, ...moduleSubjects]
      .map(normalize)
      .filter((s): s is string => Boolean(s));

    let uniqueCombined = Array.from(new Set(combined));

    // English Preparation Mode filtering for Grades 1 & 2
    if (grade.toLowerCase().includes('grade 1') || grade.toLowerCase().includes('grade 2')) {
      if (formData.englishPreparationMode === 'normal') {
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'Oral English' && s !== 'Literacy in English');
        if (combined.some(s => s === 'Oral English' || s === 'Literacy in English') && !uniqueCombined.includes('English')) {
          uniqueCombined.push('English');
        }
      } else {
        // 'separate': Oral English and Literacy in English as separate preparations
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'English' && s !== 'English (Combined: Oral + Literacy)');
        if (!uniqueCombined.includes('Oral English')) uniqueCombined.push('Oral English');
        if (!uniqueCombined.includes('Literacy in English')) uniqueCombined.push('Literacy in English');
      }
    }

    const preferredOrder = [
      "Mathematics",
      "Mathematics 1",
      "Mathematics 2",
      "Mathematics and Science",
      "Pre-Mathematics & Science",
      "Science",
      "Integrated Science",
      "Social Studies",
      "Technology Studies",
      "Expressive Arts",
      "Home Economics & Hospitality",
      "Home Economics",
      "Creative and Technology Studies",
      "English",
      "Literacy in English",
      "Oral English",
      "Zambian Language"
    ];

    return uniqueCombined.sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      
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
    return createDefaultWeeks(grade, numWeeks, eceBreakWeek);
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
  const [isWeeklyTableVisible, setIsWeeklyTableVisible] = useState<boolean>(true);
  const [isLessonContentDetailsVisible, setIsLessonContentDetailsVisible] = useState<boolean>(true);
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

  // AI Draft Pop-up modal state for Schemes of Work Expected Standards & Learning Activities
  const [openStandardsModalWeekIdx, setOpenStandardsModalWeekIdx] = useState<number | null>(null);
  const [standardsModalTab, setStandardsModalTab] = useState<'standards' | 'activities'>('standards');

  // Schemes of Work Custom Topic Marking Modal & Selection states
  const [isMarkTopicsModalOpen, setIsMarkTopicsModalOpen] = useState(false);
  const [markTopicsSearchTerm, setMarkTopicsSearchTerm] = useState('');

  // Helper to determine if a topic is marked for Schemes of Work
  const isTopicMarkedForScheme = (topicTitle: string): boolean => {
    if (!topicTitle) return false;
    const clean = topicTitle.trim().toLowerCase();
    if (formData.selectedTopics && formData.selectedTopics.length > 0) {
      return formData.selectedTopics.some(st => {
        const stClean = (st.topic || '').trim().toLowerCase();
        return stClean === clean || matchTopicInSyllabus(st, topicTitle) || matchTopicInSyllabus(topicTitle, st.topic);
      });
    }
    // Fallback: If no explicit selection array is initialized, default to topics from starting topic to stopping topic
    const sliced = sliceSyllabusByTopicRange(currentSyllabus, formData.topic, formData.stoppingTopic) || [];
    return Array.isArray(sliced) ? sliced.some(t => {
      const tClean = (typeof t === 'string' ? t : (t?.title || t?.topic || '')).trim().toLowerCase();
      return tClean === clean || matchTopicInSyllabus(t, topicTitle);
    }) : false;
  };

  // Helper to determine if a subtopic is marked for Schemes of Work
  const isSubtopicMarkedForScheme = (topicTitle: string, subtopicTitle: string): boolean => {
    if (!topicTitle || !subtopicTitle) return false;
    const cleanSub = subtopicTitle.trim().toLowerCase();
    if (formData.selectedTopics && formData.selectedTopics.length > 0) {
      const node = formData.selectedTopics.find(st => {
        const stClean = (st.topic || '').trim().toLowerCase();
        return stClean === topicTitle.trim().toLowerCase() || matchTopicInSyllabus(st, topicTitle);
      });
      if (!node) return false;
      if (!node.subtopics || node.subtopics.length === 0) return true; // all subtopics included
      return node.subtopics.some(s => s.trim().toLowerCase() === cleanSub || cleanSub.includes(s.trim().toLowerCase()));
    }
    return isTopicMarkedForScheme(topicTitle);
  };

  // Toggle mark on a topic
  const handleToggleMarkTopic = (topicTitle: string) => {
    if (!topicTitle || !currentSyllabus) return;
    const currentlyMarked = isTopicMarkedForScheme(topicTitle);
    const availableTopics = currentSyllabus;

    setFormData(prev => {
      let currentList = prev.selectedTopics && prev.selectedTopics.length > 0
        ? [...prev.selectedTopics]
        : sliceSyllabusByTopicRange(currentSyllabus, prev.topic, prev.stoppingTopic).map((t: any) => ({
            topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
            subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
          }));

      if (currentlyMarked) {
        currentList = currentList.filter(st => {
          const stClean = (st.topic || '').trim().toLowerCase();
          return stClean !== topicTitle.trim().toLowerCase() && !matchTopicInSyllabus(st, topicTitle);
        });
      } else {
        const found = availableTopics.find(t => {
          const tClean = (typeof t === 'string' ? t : (t.title || t.topic || '')).trim().toLowerCase();
          return tClean === topicTitle.trim().toLowerCase() || matchTopicInSyllabus(t, topicTitle);
        });
        const subs = found && Array.isArray(found.subtopics)
          ? found.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || ''))
          : [];
        currentList.push({ topic: topicTitle, subtopics: subs });
      }

      // Keep topics ordered according to syllabus sequence
      const orderedList = availableTopics
        .filter(t => {
          const tTitle = typeof t === 'string' ? t : (t.title || t.topic || '');
          return currentList.some(cl => cl.topic === tTitle || matchTopicInSyllabus(cl, tTitle));
        })
        .map(t => {
          const tTitle = typeof t === 'string' ? t : (t.title || t.topic || '');
          const existing = currentList.find(cl => cl.topic === tTitle || matchTopicInSyllabus(cl, tTitle));
          return existing || { topic: tTitle, subtopics: [] };
        });

      const lastTopic = orderedList.length > 0 ? orderedList[orderedList.length - 1].topic : '';

      return {
        ...prev,
        selectedTopics: orderedList,
        stoppingTopic: lastTopic || prev.stoppingTopic
      };
    });
  };

  // Toggle mark on a subtopic
  const handleToggleMarkSubtopic = (topicTitle: string, subtopicTitle: string) => {
    if (!topicTitle || !subtopicTitle || !currentSyllabus) return;
    setFormData(prev => {
      let currentList = prev.selectedTopics && prev.selectedTopics.length > 0
        ? [...prev.selectedTopics]
        : sliceSyllabusByTopicRange(currentSyllabus, prev.topic, prev.stoppingTopic).map((t: any) => ({
            topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
            subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
          }));

      const topicIdx = currentList.findIndex(st => {
        const stClean = (st.topic || '').trim().toLowerCase();
        return stClean === topicTitle.trim().toLowerCase() || matchTopicInSyllabus(st, topicTitle);
      });

      if (topicIdx === -1) {
        // Topic wasn't marked, now add it with this subtopic
        currentList.push({ topic: topicTitle, subtopics: [subtopicTitle] });
      } else {
        const topicNode = currentList[topicIdx];
        const subExists = (topicNode.subtopics || []).some(s => s.trim().toLowerCase() === subtopicTitle.trim().toLowerCase());
        let newSubs = topicNode.subtopics || [];
        if (subExists) {
          newSubs = newSubs.filter(s => s.trim().toLowerCase() !== subtopicTitle.trim().toLowerCase());
        } else {
          newSubs = [...newSubs, subtopicTitle];
        }
        if (newSubs.length === 0) {
          // If no subtopics left, unmark topic
          currentList = currentList.filter((_, idx) => idx !== topicIdx);
        } else {
          currentList[topicIdx] = { ...topicNode, subtopics: newSubs };
        }
      }

      return {
        ...prev,
        selectedTopics: currentList
      };
    });
  };

  // Mark all topics in syllabus from start topic onwards
  const handleMarkAllSyllabusTopics = () => {
    if (!currentSyllabus || currentSyllabus.length === 0) return;
    const startIdx = formData.topic
      ? Math.max(0, currentSyllabus.findIndex(t => matchTopicInSyllabus(t, formData.topic)))
      : 0;
    const relevantTopics = currentSyllabus.slice(startIdx !== -1 ? startIdx : 0);
    const allMarked = relevantTopics.map((t: any) => ({
      topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
      subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
    }));
    const lastTopic = allMarked.length > 0 ? allMarked[allMarked.length - 1].topic : '';
    setFormData(prev => ({
      ...prev,
      selectedTopics: allMarked,
      stoppingTopic: lastTopic
    }));
    toast.success(`Marked all ${allMarked.length} topics for schemes of work!`);
  };

  // Deselect all marked topics
  const handleDeselectAllSyllabusTopics = () => {
    setFormData(prev => ({
      ...prev,
      selectedTopics: [],
      stoppingTopic: ''
    }));
    toast.success("All topics unmarked.");
  };

  // Mark up to a specific stopping topic
  const handleMarkRangeUpToTopic = (targetStoppingTopic: string) => {
    if (!currentSyllabus || !targetStoppingTopic) return;
    const sliced = sliceSyllabusByTopicRange(currentSyllabus, formData.topic, targetStoppingTopic);
    const marked = sliced.map((t: any) => ({
      topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
      subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
    }));
    setFormData(prev => ({
      ...prev,
      selectedTopics: marked,
      stoppingTopic: targetStoppingTopic
    }));
    toast.success(`Marked ${marked.length} topics ending at "${targetStoppingTopic}".`);
  };

  // Normal Planning - Schemes of Work Analysis & Segmentation across 13 weeks
  const handleAnalyseSchemesData = () => {
    setIsSchemesAnalyzing(true);
    setSchemesAnalysisStatus('loading');

    // 1. Gather all topics in the circle from start topic to stopping topic (or selectedTopics)
    let markedList = formData.selectedTopics && formData.selectedTopics.length > 0
      ? formData.selectedTopics
      : (sliceSyllabusByTopicRange(currentSyllabus, formData.topic, formData.stoppingTopic) || []).map((t: any) => ({
          topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
          subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
        }));

    if (!markedList || markedList.length === 0) {
      if (formData.topic) {
        markedList = [{ topic: formData.topic, subtopics: formData.subtopic ? [formData.subtopic] : [] }];
      } else if (currentSyllabus && currentSyllabus.length > 0) {
        markedList = currentSyllabus.slice(0, 4).map((t: any) => ({
          topic: typeof t === 'string' ? t : (t.title || t.topic || ''),
          subtopics: Array.isArray(t.subtopics) ? t.subtopics.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || '')) : []
        }));
      }
    }

    // Unpack all (topic, subtopic) units in order
    const unitPairs: { topic: string; subtopics: string[]; syllabusObj?: any }[] = [];
    markedList.forEach(item => {
      const sTopic = (currentSyllabus || []).find((t: any) => matchTopicInSyllabus(t, item.topic));
      const subs = item.subtopics && item.subtopics.length > 0 
        ? item.subtopics 
        : (sTopic && Array.isArray(sTopic.subtopics) ? sTopic.subtopics.map((s: any) => typeof s === 'string' ? s : (s.title || s.name || '')).filter(Boolean) : [item.topic]);
      
      unitPairs.push({
        topic: item.topic,
        subtopics: subs,
        syllabusObj: sTopic
      });
    });

    const isECE = formData.grade.toLowerCase().includes('ece');
    const midTermWeek = formData.eceMidTermBreakWeek || 7;

    // Build 13 segmented weeks
    const segmented: any[] = [];
    let pairIdx = 0;

    for (let w = 1; w <= 13; w++) {
      // Check if user already filled week 1 for verification
      if (w === 1 && formData.weeks && formData.weeks[0] && (formData.weeks[0].topic || (formData.weeks[0].activities && formData.weeks[0].activities.length > 0))) {
        const w1 = formData.weeks[0];
        segmented.push({
          week: 1,
          topic: w1.topic || formData.topic || unitPairs[0]?.topic || 'Topic 1',
          subtopics: Array.isArray(w1.subtopics) && w1.subtopics.some(Boolean) ? w1.subtopics : (unitPairs[0]?.subtopics || [formData.subtopic || 'Subtopic 1']),
          competencies: Array.isArray(w1.competencies) && w1.competencies.some(Boolean) ? w1.competencies : (formData.specificCompetences ? [formData.specificCompetences] : ['1.1.1.1 Demonstrate competency in learning unit']),
          expectedStandards: Array.isArray(w1.expectedStandards) && w1.expectedStandards.some(Boolean) ? w1.expectedStandards : ['Demonstrate expected standards in accordance with official CBC syllabus.'],
          activities: Array.isArray(w1.activities) && w1.activities.some(Boolean) ? w1.activities : ['1. Whole class guided exploration and discussion', '2. Group investigations and practical exercises'],
          teachingMethods: w1.teachingMethods || 'Gradual Process Release (I do, We do, You do), Inquiry-based, Guided Discovery',
          teachingAids: w1.teachingAids || 'Approved Learner Book, wall charts, realia, teacher guide',
          references: w1.references || getOfficialSyllabusCitation(formData.grade || 'Grade 1', formData.subject || 'Subject', 'CBC'),
          isAssessment: false
        });
        if (unitPairs.length > 0 && matchTopicInSyllabus(unitPairs[0], w1.topic || formData.topic)) {
          pairIdx = 1;
        }
        continue;
      }

      // Mid-Term Assessment / Break
      if (w === midTermWeek) {
        segmented.push({
          week: w,
          topic: isECE ? 'MID-TERM BREAK & PROGRESS REVIEW' : 'MID-TERM REVISION & ASSESSMENT',
          subtopics: ['Mid-Term Diagnostic Assessments and Formative Revision on Weeks 1-6 units'],
          competencies: ['Demonstrate mastery of core skills and competencies covered in Weeks 1 to 6.'],
          expectedStandards: ['Learners should be able to solve assessment tasks and demonstrate understanding of covered concepts.'],
          activities: ['1. Reviewing key topics and revision questions', '2. Completing mid-term assessment tasks individually and in groups', '3. Remedial exercises and feedback discussion'],
          teachingMethods: 'Assessment for Learning, Peer Review, Guided Problem Solving, Differentiated Instruction',
          teachingAids: 'Assessment test sheets, revision flashcards, diagnostic rubrics, pupil workbooks',
          references: 'Ministry of Education Assessment Guidelines & Official Syllabus',
          isAssessment: true
        });
        continue;
      }

      // Week 12 Revision
      if (w === 12) {
        segmented.push({
          week: 12,
          topic: 'CONSOLIDATED TERM REVISION',
          subtopics: ['Comprehensive revision of all key topics taught during the term'],
          competencies: ['Recall and synthesize key concepts, principles, and practical competencies.'],
          expectedStandards: ['Learners demonstrate competence in answering syllabus examination questions.'],
          activities: ['1. Group topic summaries and presentations', '2. Answering practice exam questions on chalkboard and exercise books', '3. Teacher-led concept clarification and revision drills'],
          teachingMethods: 'Interactive Question and Answer, Guided Review, Peer Assessment',
          teachingAids: 'Past examination papers, revision summaries, chalkboard diagrams, textbooks',
          references: 'Official CBC Syllabus & Ministry Examination Guidelines',
          isAssessment: true
        });
        continue;
      }

      // Week 13 End of Term
      if (w === 13) {
        segmented.push({
          week: 13,
          topic: 'END OF TERM TEST & EVALUATION',
          subtopics: ['Summative Term Examinations, Record Keeping & Evaluation'],
          competencies: ['Apply cumulative term learning outcomes in summative test items.'],
          expectedStandards: ['Learners demonstrate overall term achievement per national curriculum standards.'],
          activities: ['1. Administration of End of Term summative assessment', '2. Marking, score compilation, and pupil performance feedback', '3. Remedial guidance and closing term closure activities'],
          teachingMethods: 'Individual Assessment Execution, Teacher Evaluation',
          teachingAids: 'Standardized assessment papers, marking schemes, report books',
          references: 'Ministry of Education CBC Term Assessment Policy',
          isAssessment: true
        });
        continue;
      }

      // Regular Teaching Weeks: Assign topic and subtopics from marked circle
      const currentUnit = unitPairs[pairIdx % (unitPairs.length || 1)] || {
        topic: `Topic ${w}`,
        subtopics: [`Subtopic ${w}.1`],
        syllabusObj: null
      };

      const sObj = currentUnit.syllabusObj;
      const sSubs = currentUnit.subtopics;
      
      // Auto-extract competencies from syllabus for this topic & subtopics
      let comps: string[] = [];
      let standards: string[] = [];
      let acts: string[] = [];
      
      if (sObj && Array.isArray(sObj.subtopics)) {
        sObj.subtopics.forEach((st: any) => {
          const stTitle = typeof st === 'string' ? st : (st.title || st.name || '');
          if (sSubs.some(sub => sub.toLowerCase().includes(stTitle.toLowerCase()) || stTitle.toLowerCase().includes(sub.toLowerCase()))) {
            if (st.competencies && Array.isArray(st.competencies)) {
              comps.push(...st.competencies.map((c: any) => typeof c === 'string' ? c : (c.text || c.title || '')));
            }
            if (st.expectedStandards && Array.isArray(st.expectedStandards)) {
              standards.push(...st.expectedStandards.map((s: any) => typeof s === 'string' ? s : (s.text || s.title || '')));
            }
            if (st.activities && Array.isArray(st.activities)) {
              acts.push(...st.activities.map((a: any) => typeof a === 'string' ? a : (a.text || a.title || '')));
            }
          }
        });
      }

      const cleanedSubs = sSubs.map((s: string) => String(s || '').trim().replace(/^[:;\-\s]+/, '')).filter(Boolean);

      if (comps.length === 0) {
        comps = [
          `1.1.1.1 Demonstrate core competency and practical understanding in ${cleanedSubs[0] || currentUnit.topic}`,
          `1.1.1.2 Apply essential concepts and skills related to ${cleanedSubs[1] || cleanedSubs[0] || currentUnit.topic}`
        ];
      }
      if (standards.length === 0) {
        standards = [`Learners must demonstrate expected competency standards in ${cleanedSubs[0] || currentUnit.topic} as outlined in the official syllabus.`];
      }
      if (acts.length === 0) {
        acts = [
          `1. Guided exploration and learner observation of ${cleanedSubs[0] || currentUnit.topic}`,
          `2. Practical group exercises and interactive class discussions`,
          `3. Individual learner application and workbook recording`
        ];
      } else {
        acts = acts.map((a, i) => /^\d+[\.\)]/.test(a) ? a : `${i + 1}. ${a}`);
      }

      segmented.push({
        week: w,
        topic: currentUnit.topic,
        subtopics: sSubs,
        competencies: comps,
        expectedStandards: standards,
        activities: acts,
        teachingMethods: 'Gradual Process Release (I do, We do, You do), Inquiry-based, Guided Discovery, Group Discussion',
        teachingAids: 'Approved Learner Book, wall charts, chalkboard, realia, concrete learning aids',
        references: getOfficialSyllabusCitation(formData.grade || 'Grade 1', formData.subject || 'Subject', 'CBC'),
        isAssessment: false
      });

      // Move to next unit for next week if more units exist
      if (pairIdx + 1 < unitPairs.length) {
        pairIdx++;
      }
    }

    // Blue loading analyser simulation -> finishes with Green
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        weeks: segmented
      }));
      setSchemesAnalysisStatus('completed');
      setIsSchemesAnalyzing(false);
      setIsSchemesAnalyzed(true);
      setSchemesSelectedWeek(1);
      toast.success("✓ Schemes of Work analysed & segmented across all 13 weeks!");
    }, 1200);
  };

  const checkOverlapSources = (_activeSources: AvailableSyncDoc[]) => {
    // Verification disabled per user request: what is extracted should be generated directly without manipulating or asking to merge
    return null;
  };

  const handleApplyOverlapChoice = (choice: 'merge' | 'oral' | 'literacy', modalData: any) => {
    const { oralDoc, literacyDoc } = modalData;
    const forecastWeekNum = formData.forecastWeek || 1;

    if (choice === 'merge') {
      const oralWeeks = parseMarkdownTableToWeeks(oralDoc.content);
      const literacyWeeks = parseMarkdownTableToWeeks(literacyDoc.content);

      const oralWeekData = matchStrictWeekFromSchemes(oralWeeks, Number(forecastWeekNum));
      const literacyWeekData = matchStrictWeekFromSchemes(literacyWeeks, Number(forecastWeekNum));

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
      const weekData = matchStrictWeekFromSchemes(extractedWeeks, Number(forecastWeekNum));

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
          topic: topVal !== 'N/A' ? topVal : prev.topic,
          subtopic: (weekData.subtopics && weekData.subtopics[0]) || prev.subtopic,
          specificCompetences: (weekData.competencies && weekData.competencies[0]) || prev.specificCompetences,
          englishCombined: false,
          englishComponent: choice,
          additionalContext: schemeSyncInstructionStr,
          forecastDays: prev.forecastDays.map((day, dIdx) => {
            const numSubs = weekData.subtopics?.length || 1;
            const subIndices = getSubtopicIndicesForDays(numSubs, prev.forecastDays?.length || 5);
            const subIndex = subIndices[dIdx] || 0;
            const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || '';
            const top = weekData.topic || '';
            const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || '';
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
              activities: dayAct ? [dayAct] : [],
              teachingAids: weekData.teachingAids || '',
              references: weekData.references || ''
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
    
    // Extract base grade number (e.g. Grade 3 (OBC), Grade 3 (CBC), Grade 3 -> '3')
    const extractNum = (str: string) => {
      const match = (str || '').match(/grade\s*(\d+)/i) || (str || '').match(/(\d+)/);
      return match ? match[1] : '';
    };

    const numDoc = extractNum(docGrade);
    const numTgt = extractNum(targetGrade);

    const gMatch = (numDoc && numTgt && numDoc === numTgt) ||
                   normGradeDoc === normGradeTgt || 
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

    // 1. FAST PATH: Check local storage active sync sources & downloads cache instantly
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
    } catch (e) {
      console.warn("Notice: Local storage sync cache check error:", e);
    }

    // 2. PARALLEL FIRESTORE FETCH (Asynchronous / Non-blocking to make sync instant)
    if (docsMap.size > 0) {
      // Background fetch to update cache silently without blocking the user
      (async () => {
        try {
          const syncRef = collection(db, "users", user.uid, "sync_sources");
          const dlRef = collection(db, "users", user.uid, "downloads");
          const qSync = query(syncRef, orderBy("timestamp", "desc"), limit(25));
          const qDl = query(dlRef, orderBy("timestamp", "desc"), limit(25));

          const [syncRes, dlRes] = await Promise.allSettled([
            getDocs(qSync),
            getDocs(qDl)
          ]);

          let cacheUpdated = false;
          if (syncRes.status === 'fulfilled') {
            syncRes.value.docs.forEach(d => {
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
                if (!docsMap.has(key) && item.content) {
                  docsMap.set(key, item);
                  cacheUpdated = true;
                }
              }
            });
          }

          if (dlRes.status === 'fulfilled') {
            dlRes.value.docs.forEach(d => {
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
                  cacheUpdated = true;
                }
              }
            });
          }
        } catch (err) {
          // ignore background errors
        }
      })();
    } else {
      // No local data, must block wait for Firestore fetch with a short 500ms timeout
      try {
        const fetchPromise = (async () => {
          const syncRef = collection(db, "users", user.uid, "sync_sources");
          const dlRef = collection(db, "users", user.uid, "downloads");
          const qSync = query(syncRef, orderBy("timestamp", "desc"), limit(25));
          const qDl = query(dlRef, orderBy("timestamp", "desc"), limit(25));

          const [syncRes, dlRes] = await Promise.allSettled([
            getDocs(qSync),
            getDocs(qDl)
          ]);

          if (syncRes.status === 'fulfilled') {
            syncRes.value.docs.forEach(d => {
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
                if (!docsMap.has(key) && item.content) docsMap.set(key, item);
              }
            });
          }

          if (dlRes.status === 'fulfilled') {
            dlRes.value.docs.forEach(d => {
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
                if (!docsMap.has(key) && item.content) docsMap.set(key, item);
              }
            });
          }
        })();

        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err) {
        console.warn("Notice: Firestore sync fetch timed out or skipped:", err);
      }
    }

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
            specificCompetences: safeString(dayData.competency || prev.specificCompetences),
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
      const extractedWeeks = parseMarkdownTableToWeeks(docItem.content, docItem.grade, docItem.subject);
      if (extractedWeeks && extractedWeeks.length > 0) {
        const forecastWeekNum = Number(formData.forecastWeek) || 1;
        const weekData = matchStrictWeekFromSchemes(extractedWeeks, forecastWeekNum);
        if (!weekData) {
          toast.error(`Scheme data not found specifically for Week ${forecastWeekNum}`);
          return;
        }
        const topVal = weekData.topic || 'N/A';
        const subVal = weekData.subtopics ? weekData.subtopics.join(', ') : 'N/A';
        const compVal = weekData.competencies ? weekData.competencies.join(', ') : 'N/A';
        const aidVal = weekData.teachingAids || 'N/A';
        const refVal = weekData.references || 'N/A';
        const dateRangeVal = weekData.dateRange || weekData.dates || '';
        const dayDates = dateRangeVal ? parseDateRangeToDays(dateRangeVal) : [];

        const isOBC = isCurriculumOBC(formData.curriculumType, docItem.grade, weekData);
        let schemeSyncInstructionStr = '';

        const dateLine = dateRangeVal ? `• Dates: ${dateRangeVal}\n` : '';
        const compLine = weekData.component ? `• Component: ${weekData.component}\n` : '';

        if (isOBC) {
          const knowVal = weekData.knowledge && weekData.knowledge.length > 0
            ? weekData.knowledge.join(' • ')
            : (weekData.expectedStandards && weekData.expectedStandards.length > 0 ? weekData.expectedStandards.join(' • ') : 'N/A');
          const skillsVal = weekData.skills && weekData.skills.length > 0
            ? weekData.skills.join(' • ')
            : 'Identification, demonstration, problem solving';
          const valuesVal = weekData.values && weekData.values.length > 0
            ? weekData.values.join(' • ')
            : 'Appreciation, accuracy, cooperation';
          const methodVal = weekData.methods && weekData.methods.length > 0
            ? weekData.methods.join(' • ')
            : '• Teacher exposition • Class discussion • Group work • Pair work • Individual work';

          schemeSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Scheme of Work):
${dateLine}• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
${compLine}• Specific Outcomes: ${compVal}
• Knowledge: ${knowVal}
• Skills: ${skillsVal}
• Values: ${valuesVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}`;
        } else {
          const stdVal = weekData.expectedStandards && weekData.expectedStandards.length > 0
            ? weekData.expectedStandards.join(' • ')
            : 'N/A';
          const actVal = (weekData as any).suggestedActivities
            ? (weekData as any).suggestedActivities.join(' • ')
            : (weekData.activities ? weekData.activities.join(' • ') : 'N/A');
          const methodVal = weekData.methods && weekData.methods.length > 0
            ? weekData.methods.join(' • ')
            : '• Guided practice • Individual work • Gradual release (I do, we do, you do) • Group work • Pair work • Teacher exposition • Class discussion • Discovery';

          schemeSyncInstructionStr = `SYNCED PREPARATION DATA (Week ${forecastWeekNum} Scheme of Work):
${dateLine}• Term Topic: ${topVal}
• Term Subtopic(s): ${subVal}
${compLine}• Expected Standards: ${compVal}
• Learning Activities: ${actVal}
• Teaching Methods: ${methodVal}
• Teaching & Learning Aids: ${aidVal}
• References: ${refVal}`;
        }

        setFormData(prev => {
          let newTermStartDate = prev.termStartDate;
          if (dayDates[0] && (!prev.termStartDate || prev.termStartDate === '')) {
            newTermStartDate = deriveTermStartDate(dayDates[0], forecastWeekNum) || prev.termStartDate;
          }

          return {
            ...prev,
            subject: docItem.subject,
            grade: docItem.grade,
            termStartDate: newTermStartDate || prev.termStartDate,
            topic: topVal !== 'N/A' ? topVal : prev.topic,
            subtopic: (weekData.subtopics && weekData.subtopics[0]) || prev.subtopic,
            specificCompetences: safeString((weekData.competencies && weekData.competencies[0]) || prev.specificCompetences),
            references: refVal !== 'N/A' ? refVal : prev.references,
            teachingAids: aidVal !== 'N/A' ? aidVal : prev.teachingAids,
            weeks: extractedWeeks,
            additionalContext: schemeSyncInstructionStr,
            forecastDays: (() => {
              const rawSubs = Array.isArray(weekData.subtopics) 
                ? weekData.subtopics.filter((s: string) => s && s.trim() !== '')
                : (weekData.subtopics ? [String(weekData.subtopics)] : []);
              const numSubs = rawSubs.length || 1;
              const numDays = prev.forecastDays?.length || 5;
              const subIndices = getSubtopicIndicesForDays(numSubs, numDays);
              const aidsList = (aidVal !== 'N/A' ? aidVal : (weekData.teachingAids || '')).split(';').map((a: string) => a.trim()).filter(Boolean);

              const mapped = prev.forecastDays.map((day, dIdx) => {
                const subIndex = subIndices[dIdx] || 0;
                const sub = rawSubs[subIndex] || rawSubs[0] || day.subtopic;
                const top = weekData.topic || day.topic;
                const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
                const expStd = weekData.expectedStandards?.[subIndex] || weekData.expectedStandards?.[0] || '';
                const know = weekData.knowledge?.[subIndex] || weekData.knowledge?.[0] || expStd || '';
                const skill = weekData.skills?.[subIndex] || weekData.skills?.[0] || '';
                const val = weekData.values?.[subIndex] || weekData.values?.[0] || '';
                const dayDate = dayDates[dIdx] || day.date || '';

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
                const dayMethods = (weekData.methods && weekData.methods[subIndex]) || (weekData.methods && weekData.methods[0]) || (weekData.methods && weekData.methods.length > 0 ? weekData.methods.join(' • ') : '') || (day as any).teachingMethods || '• Demonstration • Practical activity • Question and answer • Class discussion';
                const dayAid = aidsList[subIndex] || aidsList[0] || (aidVal !== 'N/A' ? aidVal : '') || weekData.teachingAids || day.teachingAids || '';

                return {
                  ...day,
                  date: dayDate,
                  topic: top,
                  subtopic: sub,
                  competency: comp,
                  component: weekData.component || (day as any).component || '',
                  knowledge: know,
                  skills: skill,
                  values: val,
                  expectedStandard: expStd,
                  activities: dayAct ? [dayAct] : day.activities,
                  teachingMethods: dayMethods,
                  teachingAids: dayAid,
                  references: (refVal !== 'N/A' ? refVal : '') || weekData.references || day.references || ''
                };
              });

              return enrichForecastDaysWithSyllabus(mapped, docItem.grade, docItem.subject, isOBC ? 'OBC' : 'CBC') as any;
            })()
          };
        });
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
    // Background drafting is enabled for all users to showcase immediate value.

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
    const weekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
    const dayNum = Number(formData.lessonNumber) || 1;

    // First: Check if the user pasted a Weekly Forecast / Scheme of Work in instructions box!
    if (isPastedOutsideSchemes(formData.additionalContext)) {
      const lessonData = extractLessonFromPastedForecastText(formData.additionalContext, dayNum, weekNum, formData.grade, formData.subject, formData.curriculumType);
      if (lessonData) {
        const rawTop = lessonData.topic || '';
        const rawSub = lessonData.subtopic || '';
        const rawComp = lessonData.competency || '';

        const topVal = cleanExtractedTopic(rawTop) || cleanExtractedTopic(formData.topic) || 'N/A';
        const subVal = cleanExtractedSubtopics([rawSub])[0] || cleanExtractedSubtopics([formData.subtopic])[0] || 'N/A';
        const compVal = cleanExtractedCompetencies([rawComp])[0] || cleanExtractedCompetencies([formData.specificCompetences])[0] || 'N/A';
        const aidVal = lessonData.teachingAids || formData.teachingAids || 'N/A';
        const refVal = lessonData.references || formData.references || 'N/A';

        const isOBC = isCurriculumOBC(formData.curriculumType, formData.grade, lessonData);
        let syncInstructionStr = '';

        if (isOBC) {
          const knowVal = lessonData.knowledge || lessonData.expectedStandard || 'N/A';
          const skillsVal = (lessonData as any).skills || 'Identification, demonstration, problem solving';
          const valuesVal = (lessonData as any).values || 'Appreciation, accuracy, cooperation';
          const methodVal = lessonData.teachingMethods || '• Teacher exposition • Class discussion • Group work • Pair work • Individual work';

          syncInstructionStr = `In Scheme of Work (Week ${weekNum}):
Topic: ${topVal}
Subtopic: ${subVal}
Specific outcomes: ${compVal}
Knowledge: ${knowVal}
Skills: ${skillsVal}
Values: ${valuesVal}
T/L Aids: ${aidVal}
Methods: ${methodVal}`;
        } else {
          const stdVal = lessonData.expectedStandard || 'N/A';
          const actVal = lessonData.learningActivities?.join(', ') || 'N/A';
          const methodVal = lessonData.teachingMethods || '• Guided practice • Individual work • Gradual release (I do, we do, you do) • Group work • Pair work • Teacher exposition • Class discussion • Discovery';

          syncInstructionStr = `In Scheme of Work (Week ${weekNum}):
Topic: ${topVal}
Subtopic: ${subVal}
Specific Competencies: ${compVal}
Expected Standards: ${stdVal}
Learning Activities: ${actVal}
T/L Aids: ${aidVal}
Methods: ${methodVal}`;
        }

        setFormData(prev => ({
          ...prev,
          topic: topVal !== 'N/A' ? topVal : prev.topic,
          subtopic: subVal !== 'N/A' ? subVal : prev.subtopic,
          specificCompetences: safeString(compVal !== 'N/A' ? compVal : prev.specificCompetences),
          knowledge: safeString(lessonData.knowledge || prev.knowledge || ''),
          activities: lessonData.learningActivities?.length > 0 ? lessonData.learningActivities : prev.activities,
          teachingAids: safeString(lessonData.teachingAids || prev.teachingAids),
          references: safeString(lessonData.references || prev.references)
        }));
        setIsLessonContentDetailsVisible(true);
        setLastSyncTime(Date.now());
        setSyncInstructionsText(syncInstructionStr);
        toast.success(`Synced Week ${weekNum} Day ${dayNum} from pasted Weekly Forecast / Scheme!`);
        return;
      }
    }

    if (!user) {
      toast.error("Please log in to sync from your forecast history, or paste the Weekly Forecast in instructions.");
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
        
        const rawTop = dayData.topic || '';
        const rawSub = dayData.subtopic || '';
        const rawComp = dayData.competency || '';

        const topVal = cleanExtractedTopic(rawTop) || cleanExtractedTopic(formData.topic) || 'N/A';
        const subVal = cleanExtractedSubtopics([rawSub])[0] || cleanExtractedSubtopics([formData.subtopic])[0] || 'N/A';
        const compVal = cleanExtractedCompetencies([rawComp])[0] || cleanExtractedCompetencies([formData.specificCompetences])[0] || 'N/A';
        const aidVal = dayData.teachingAids || formData.teachingAids || 'N/A';
        const refVal = dayData.references || formData.references || 'N/A';

        const isOBC = isCurriculumOBC(formData.curriculumType, formData.grade, dayData);
        let syncInstructionStr = '';

        if (isOBC) {
          const knowVal = dayData.knowledge || dayData.expectedStandard || 'N/A';
          const skillsVal = dayData.skills || 'Identification, demonstration, problem solving';
          const valuesVal = dayData.values || 'Appreciation, accuracy, cooperation';
          const methodVal = Array.isArray(dayData.teachingMethods) && dayData.teachingMethods.length > 0
            ? dayData.teachingMethods.join(' • ')
            : (dayData.teachingMethods || '• Teacher exposition • Class discussion • Group work • Pair work • Individual work');

          syncInstructionStr = `In Scheme of Work (Week ${weekNum}):
Topic: ${topVal}
Subtopic: ${subVal}
Specific outcomes: ${compVal}
Knowledge: ${knowVal}
Skills: ${skillsVal}
Values: ${valuesVal}
T/L Aids: ${aidVal}
Methods: ${methodVal}`;
        } else {
          const stdVal = dayData.expectedStandard || 'N/A';
          const actVal = Array.isArray(dayData.learningActivities) ? dayData.learningActivities.join(', ') : (dayData.learningActivities || 'N/A');
          const methodVal = Array.isArray(dayData.teachingMethods) && dayData.teachingMethods.length > 0
            ? dayData.teachingMethods.join(' • ')
            : (dayData.teachingMethods || '• Guided practice • Individual work • Gradual release (I do, we do, you do) • Group work • Pair work • Teacher exposition • Class discussion • Discovery');

          syncInstructionStr = `In Scheme of Work (Week ${weekNum}):
Topic: ${topVal}
Subtopic: ${subVal}
Specific Competencies: ${compVal}
Expected Standards: ${stdVal}
Learning Activities: ${actVal}
T/L Aids: ${aidVal}
Methods: ${methodVal}`;
        }

        setFormData(prev => ({
          ...prev,
          topic: topVal !== 'N/A' ? topVal : prev.topic,
          subtopic: subVal !== 'N/A' ? subVal : prev.subtopic,
          specificCompetences: safeString(compVal !== 'N/A' ? compVal : prev.specificCompetences),
          knowledge: safeString(dayData.knowledge || prev.knowledge),
          learningActivities: dayData.learningActivities || prev.learningActivities,
          teachingMethods: Array.isArray(dayData.teachingMethods) ? dayData.teachingMethods : (dayData.teachingMethods ? [String(dayData.teachingMethods)] : prev.teachingMethods),
          teachingAids: safeString(dayData.teachingAids || prev.teachingAids),
          references: safeString(dayData.references || prev.references),
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

  const handleWeeksLengthChange = (rawNum: number) => {
    const num = Math.min(Math.max(1, rawNum), 13);
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
    // Groups and filters Grade 1-2 English (Oral & Literacy) and Grade 1-3 Zambian Languages by Term 1, 2, 3 based on official CDC Teaching Modules & Syllabus
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
        
        const isZambianLang = sValClean.includes("zambian") || 
          sValClean.includes("bemba") || sValClean.includes("icibemba") || 
          sValClean.includes("nyanja") || sValClean.includes("cinyanja") || 
          sValClean.includes("tonga") || sValClean.includes("chitonga") || 
          sValClean.includes("lozi") || sValClean.includes("silozi") || 
          sValClean.includes("kaonde") || sValClean.includes("kiikaonde") || 
          sValClean.includes("lunda") || sValClean.includes("luvale");

        // Zambian language topics should not be grouped or filtered by term.
        // All topics must always be found in one dropdown.
        if (isZambianLang) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        const isGr123Zambian = isZambianLang && (
          ((gValClean.includes('grade1') && !gValClean.includes('grade10') && !gValClean.includes('grade11') && !gValClean.includes('grade12')) || gValClean === 'gr1' || gValClean === '1') ||
          ((gValClean.includes('grade2') && !gValClean.includes('grade12')) || gValClean === 'gr2' || gValClean === '2') ||
          (gValClean.includes('grade3') || gValClean === 'gr3' || gValClean === '3')
        );

        // Respect the groupTopicsByTerm user toggle
        if (formData.groupTopicsByTerm === false) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        // When Normal English is selected, return all topics from first to last in syllabus order
        const isNormalEnglishMode = (sValClean === 'english' || sValClean.includes('english')) && 
          !sValClean.includes('oral') && !sValClean.includes('literacy') &&
          formData.englishPreparationMode === 'normal';
        if (isNormalEnglishMode) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        // For all other subjects, return all topics without term grouping or filtering
        if (!isGr12English && !isGr123Zambian) {
          return { data: unpackedRawData, isShowingAll: true };
        }

        const currentTerm = termVal || formData.term;
        if (!currentTerm) return { data: unpackedRawData, isShowingAll: true };

        const termStr = currentTerm.toString().trim();
        const termNum = termStr.replace(/[^0-9]/g, "");
        if (!termNum) return { data: unpackedRawData, isShowingAll: true };

        const gradeNum = gValClean.includes('grade1') || gValClean === 'gr1' || gValClean === '1' ? 1 :
                         gValClean.includes('grade2') || gValClean === 'gr2' || gValClean === '2' ? 2 :
                         gValClean.includes('grade3') || gValClean === 'gr3' || gValClean === '3' ? 3 : 1;

        const filteredResult = unpackedRawData.map((topic) => {
          if (topic.title === "KEY COMPETENCES TO BE DEVELOPED" || topic.title === "KEY COMPETENCES") {
            return topic;
          }

          let topicTermNum = topic.term ? topic.term.toString().replace(/[^0-9]/g, "") : null;
          if (!topicTermNum) {
            const titleLow = (topic.title || "").toLowerCase();
            if (titleLow.includes("term 1") || titleLow.includes("temu 1")) topicTermNum = "1";
            else if (titleLow.includes("term 2") || titleLow.includes("temu 2")) topicTermNum = "2";
            else if (titleLow.includes("term 3") || titleLow.includes("temu 3")) topicTermNum = "3";
          }

          if (topicTermNum) {
            if (topicTermNum !== termNum) return null;
          }

          if (topic.subtopics && Array.isArray(topic.subtopics)) {
            const filteredSubtopics = topic.subtopics.filter((sub: any) => {
              let subTermNum = sub.term ? sub.term.toString().replace(/[^0-9]/g, "") : null;
              if (!subTermNum) {
                const subTitleLow = (sub.title || "").toLowerCase();
                if (subTitleLow.includes("term 1") || subTitleLow.includes("temu 1")) subTermNum = "1";
                else if (subTitleLow.includes("term 2") || subTitleLow.includes("temu 2")) subTermNum = "2";
                else if (subTitleLow.includes("term 3") || subTitleLow.includes("temu 3")) subTermNum = "3";
              }
              if (subTermNum) return subTermNum === termNum;
              if (topicTermNum) return topicTermNum === termNum;

              if (isGr123Zambian) {
                return isZambianSubtopicInTerm(sub.title, termStr, gradeNum);
              }

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
       
       if (curriculumType === 'CBC') {
         if (aLow.includes('cbc') && !bLow.includes('cbc')) return -1;
         if (!aLow.includes('cbc') && bLow.includes('cbc')) return 1;
       } else if (curriculumType === 'OBC') {
         if ((aLow.includes('obc') || aLow.includes('obe')) && !(bLow.includes('obc') || bLow.includes('obe'))) return -1;
         if (!(aLow.includes('obc') || aLow.includes('obe')) && (bLow.includes('obc') || bLow.includes('obe'))) return 1;
       }

       if (aLow === gLow && bLow !== gLow) return -1;
       if (bLow === gLow && aLow !== gLow) return 1;
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
        const sLowVal = subject.toLowerCase();
        const isLitSubject = sLowVal.includes('literacy');
        const isOralSubject = sLowVal.includes('oral');
        const isGenericEnglish = sLowVal.includes('english') && !isLitSubject && !isOralSubject;
        const isEng = isGenericEnglish || isLitSubject || isOralSubject;
        const isCombined = formData.englishCombined;
        const gLowVal = grade.toLowerCase();
        
        if (isEng && ((gLowVal.includes('grade 1') && !gLowVal.includes('grade 10') && !gLowVal.includes('grade 11') && !gLowVal.includes('grade 12')) || (gLowVal.includes('grade 2') && !gLowVal.includes('grade 12')))) {
          const isGr2 = gLowVal.includes('grade 2');
          const isNormalEnglish = formData.englishPreparationMode === 'normal' || (isGenericEnglish && formData.englishPreparationMode !== 'separate' && formData.englishPreparationMode !== 'combined');

          if (isNormalEnglish) {
            finalData = gradeData['English'] || (isGr2 ? englishGrade2Syllabus : englishGrade1Syllabus);
          } else {
            const oral = gradeData['Oral English'] || gradeData['oral English'] || (isGr2 ? englishGrade2Oral : englishGrade1Oral) || [];
            const literacy = gradeData['Literacy in English'] || gradeData['literacy in English'] || (isGr2 ? englishGrade2Literacy : englishGrade1Literacy) || [];
            if (isLitSubject) {
              finalData = literacy;
            } else if (isOralSubject) {
              finalData = oral;
            } else if (isCombined || formData.englishPreparationMode === 'combined') {
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
    const gLow = (formData.grade || '').toLowerCase();
    const isSecondaryGrade = gLow.includes('form') || gLow.includes('secondary') || gLow.includes('grade 8') || gLow.includes('grade 9') || gLow.includes('grade 10') || gLow.includes('grade 11') || gLow.includes('grade 12') || gLow.includes('adv');
    const isSpecial = isSecondaryGrade && !!(formData.subject && (
      formData.subject.toLowerCase().includes('english') || 
      formData.subject.toLowerCase().includes('zambian')
    ));
    if (isSpecial) {
      return transformSecondaryLanguageSyllabus(topicsData);
    }
    return topicsData;
  }, [topicsData, formData.grade, formData.subject]);
  const currentSyllabusName = syllabusResult?.name || null;

  const handleFileExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const selectedFiles = Array.from(rawFiles);

    // Dismiss any previous lingering extraction toasts immediately
    if (activeExtractToastIdRef.current) {
      toast.dismiss(activeExtractToastIdRef.current);
      activeExtractToastIdRef.current = null;
    }

    setIsExtracting(true);
    const toastId = toast.loading(`Processing ${selectedFiles.length} selected document(s)...`);
    activeExtractToastIdRef.current = toastId;

    let hasSuccess = false;

    try {
      let combinedExtractedText = "";
      const extractedFileNames: string[] = [];
      const failedFileNames: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mimeType = file.type || '';
        const isDocx = mimeType.includes('wordprocessingml') || /\.(docx|doc)$/i.test(file.name);
        const isPdf = mimeType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
        const isTxt = mimeType === 'text/plain' || /\.(txt|csv|md)$/i.test(file.name);

        toast.loading(`Extracting document ${i + 1} of ${selectedFiles.length}: ${file.name}...`, { id: toastId });

        let extractedText = '';

        // 1. FAST PATH: Plain text files read instantly in browser memory
        if (isTxt) {
          try {
            extractedText = await file.text();
          } catch (txtErr) {
            console.warn("Client text read error:", txtErr);
          }
        }

        // 2. FAST PATH: Word DOCX files extract locally in milliseconds without network calls
        if (!extractedText && isDocx) {
          try {
            toast.loading(`Reading Word document locally: ${file.name}...`, { id: toastId });
            const docxText = await extractTextFromDocxClient(file);
            if (docxText && docxText.length > 10) {
              extractedText = docxText;
              console.log(`Instant client-side DOCX extraction successful for ${file.name} (${extractedText.length} chars).`);
            }
          } catch (docxErr) {
            console.warn(`Local DOCX extraction error for ${file.name}:`, docxErr);
          }
        }

        // 3. FAST PATH: Digital PDFs extract locally in milliseconds without uploading megabytes
        if (!extractedText && isPdf) {
          try {
            toast.loading(`Reading PDF locally: ${file.name}...`, { id: toastId });
            const localPdfText = await extractTextFromPdfClient(file, (curr, total) => {
              toast.loading(`Reading PDF page ${curr} of ${total}: ${file.name}...`, { id: toastId });
            });
            if (localPdfText && localPdfText.trim().length > 20) {
              extractedText = localPdfText.trim();
              console.log(`Instant client-side PDF extraction successful for ${file.name} (${extractedText.length} chars).`);
            }
          } catch (pdfErr) {
            console.warn(`Local PDF extraction fallback to OCR for ${file.name}:`, pdfErr);
          }
        }

        // 4. FALLBACK FOR SCANNED IMAGES / CAMERA / HARD-COPY SCANS: Optimize & use AI OCR
        if (!extractedText) {
          let base64String = '';
          try {
            if (isImage) {
              toast.loading(`Compressing image for instant 4G upload: ${file.name}...`, { id: toastId });
              base64String = await compressImageForOcr(file, 1200, 0.75);
            } else {
              toast.loading(`Preparing file for AI OCR: ${file.name}...`, { id: toastId });
              base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const result = (event.target?.result as string) || '';
                  resolve(result.split(',')[1] || result);
                };
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
              });
            }

            toast.loading(`Extracting text with AI OCR: ${file.name}...`, { id: toastId });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for mobile scans

            const response = await fetch('/api/gemini/extract-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({ 
                fileBase64: base64String, 
                mimeType: mimeType || undefined,
                fileName: file.name,
                documentType: formData.type,
                weekNumber: formData.forecastWeek || formData.weekNumber || formData.lessonWeekNumber || '',
                lessonWeekNumber: formData.lessonWeekNumber || formData.weekNumber || '',
                lessonNumber: formData.lessonNumber || '',
                grade: formData.grade || '',
                subject: formData.subject || '',
                zambianLanguage: formData.zambianLanguage || '',
                term: formData.term || '',
                englishComponent: formData.englishComponent || '',
                firstTopic: formData.topic || '',
                stoppingTopic: formData.stoppingTopic || '',
                dayOfWeek: formData.dayOfWeek || (formData.lessonNumber ? `Day ${formData.lessonNumber}` : ''),
                numberOfDays: formData.forecastDays?.length || 5
              })
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data.text) extractedText = data.text;
            } else {
              const errData = await response.json().catch(() => ({}));
              console.warn(`Server extraction non-ok for ${file.name}: status ${response.status}`, errData);
            }
          } catch (serverErr: any) {
            console.warn(`Server extraction error for ${file.name}:`, serverErr);
          }
        }

        if (extractedText && extractedText.trim().length > 20) {
          extractedFileNames.push(file.name);
          combinedExtractedText += `\n\n[SCANNED & EXTRACTED CONTENT (${file.name})]:\n${extractedText}`;
        } else {
          failedFileNames.push(file.name);
        }
      }

      if (combinedExtractedText) {
        hasSuccess = true;
        const hasSelectedTopicsBeforeScan = Boolean(
          (formData.topic && formData.topic.trim() !== '') || 
          (formData.stoppingTopic && formData.stoppingTopic.trim() !== '') || 
          (formData.selectedTopics && formData.selectedTopics.length > 0)
        );
        const syllabusRange = (formData.type === 'schemes_of_work' && hasSelectedTopicsBeforeScan) 
          ? (filterSyllabusForSchemes(currentSyllabus, formData.topic, formData.stoppingTopic, formData.selectedTopics) || [])
          : [];

        const baseNormalInstructions = getTailoredDocInstructions({
          type: formData.type,
          grade: formData.grade,
          subject: formData.subject,
          topic: formData.topic,
          stoppingTopic: formData.stoppingTopic,
          forecastWeek: formData.forecastWeek,
          dayOfWeek: formData.dayOfWeek,
          weekNumber: formData.weekNumber,
          numberOfDays: formData.forecastDays?.length || 5,
          syllabusRange
        });

        setFormData(prev => {
          const currentContext = (prev.additionalContext || '').trim();
          const hasNormalInstructions = currentContext.includes("Upload the syllabus or any old schemes") ||
            currentContext.includes("upload the syllabus or any old schemes") ||
            currentContext.includes("Upload the schemes of work or old weekly forecast") ||
            currentContext.includes("upload the schemes of work or old weekly forecast") ||
            currentContext.includes("Scan or upload the weekly forecast or recycle") ||
            currentContext.includes("scan or upload the weekly forecast or recycle") ||
            currentContext.includes("upload the weekly forecast or recycle") ||
            currentContext.includes("Upload the weekly forecast or recycle") ||
            currentContext.includes("it's about recycling the old to make the  fresh documents") ||
            currentContext.includes("Instructions (Schemes of Work):") ||
            currentContext.includes("Instructions: (Weekly forecast:)") ||
            currentContext.includes("Instructions (Lesson plan:)");

          const baseWithInstructions = hasNormalInstructions
            ? currentContext
            : currentContext.length > 0
              ? `${baseNormalInstructions}\n\n${currentContext}`
              : baseNormalInstructions;

          const updatedContext = `${baseWithInstructions}${combinedExtractedText}`;

          return {
            ...prev,
            additionalContext: updatedContext
          };
        });

        const { detectedTerm } = detectTermInText(combinedExtractedText);
        const formTermClean = (formData.term || '').toString().replace(/[^0-9]/g, '');
        if (detectedTerm && formTermClean && detectedTerm !== formTermClean) {
          setTermMismatchNotice({
            detectedTerm,
            selectedTerm: formTermClean,
            sourceName: extractedFileNames.join(', ')
          });
          toast.error(`⚠️ TERM MISMATCH NOTICE: The scanned module is for Term ${detectedTerm}, but Term ${formTermClean} is selected in the form drop-down!`, { duration: 8000 });
        } else {
          setTermMismatchNotice(null);
        }

        toast.success(`Scanned ${extractedFileNames.length} document(s) (${extractedFileNames.join(', ')})! Text reflected in instructions.`, { id: toastId, duration: 4000 });
      } else {
        const fileNamesMsg = failedFileNames.join(', ') || 'selected file';
        toast.error(`Could not extract text from ${fileNamesMsg}. Please ensure file is readable and not password-protected.`, { id: toastId, duration: 6000 });
      }
    } catch (err: any) {
      console.error("Multi-document extraction error:", err);
      toast.error(err.message || "Failed to extract text from file(s).", { id: toastId, duration: 6000 });
    } finally {
      setIsExtracting(false);
      if (!hasSuccess) {
        setTimeout(() => {
          toast.dismiss(toastId);
        }, 6000);
      }
      activeExtractToastIdRef.current = null;
      if (e.target) e.target.value = '';
    }
  };

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


  const handleWeekChange = (index: number, field: 'component' | 'topic' | 'topic2' | 'topic3' | 'subtopics' | 'competencies' | 'expectedStandards' | 'activities' | 'teachingAids' | 'references', subIndex: number | null, value: string) => {
    setFormData(prev => {
      const newWeeks = [...prev.weeks!];
      const updatedWeek = { ...newWeeks[index] };
      
      if (field === 'teachingAids') {
        updatedWeek.teachingAids = value;
      } else if (field === 'references') {
        updatedWeek.references = value;
      } else if (field === 'component') {
        updatedWeek.component = value;
        if (value && updatedWeek.topic && currentSyllabus) {
          const cClean = cleanKey(value);
          const topObj = currentSyllabus.find((t: any) => t.title === updatedWeek.topic);
          const topComp = cleanKey(topObj?.component || autoDeriveComponent(updatedWeek.topic, prev.subject) || '');
          if (topComp && topComp !== cClean && !topComp.includes(cClean) && !cClean.includes(topComp)) {
            updatedWeek.topic = '';
            updatedWeek.subtopics = ['', '', ''];
            updatedWeek.competencies = [];
            updatedWeek.expectedStandards = [];
            updatedWeek.activities = [];
          }
        }
      } else if (field === 'expectedStandards') {
        updatedWeek.expectedStandards = [value];
      } else if (field === 'subtopics' && subIndex !== null) {
        const isEnglishGr2Term3 = prev.grade.includes('Grade 2') && 
                                 prev.term === '3' && 
                                 prev.subject.toLowerCase().includes('english') && 
                                 prev.englishCombined &&
                                 prev.englishPreparationMode !== 'normal';
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
            ? (subIndex < 2 ? updatedWeek.topic : (updatedWeek.topic2 || updatedWeek.topic))
            : (subIndex === 0 ? updatedWeek.topic : (updatedWeek.topic2 || updatedWeek.topic3 || updatedWeek.topic || prev.topic || formData.topic));
          const subComps = getCompetenciesForSubtopic(currentTopic, value);
          if (subComps.length > 0) {
            const newCompetencies = [...updatedWeek.competencies];
            const compIndex = isEnglishGr2Term3 ? subIndex : subIndex * 2;
            if (compIndex < newCompetencies.length) {
              newCompetencies[compIndex] = subComps[0];
            }
            updatedWeek.competencies = newCompetencies;
          }

          // Auto-derive expected standards for this week from syllabus
          const filledSubs = newSubtopics.filter(Boolean);
          const derivedStds: string[] = [];
          filledSubs.forEach(st => {
            const stds = getExpectedStandardsForSubtopic(currentTopic, st, currentSyllabus);
            stds.forEach(s => {
              if (!derivedStds.includes(s)) derivedStds.push(s);
            });
          });
          if (derivedStds.length > 0) {
            const formatted = derivedStds.length > 1
              ? derivedStds.map((s, i) => `${i + 1}. ${s}`).join('')
              : derivedStds[0];
            updatedWeek.expectedStandards = [formatted];
          }

          // Auto-derive learning activities for this week from syllabus
          const derivedActs: string[] = [];
          filledSubs.forEach(st => {
            const acts = getActivitiesForSubtopic(currentTopic, st, undefined, currentSyllabus, prev.grade, prev.subject);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          });
          if (derivedActs.length === 0 && subComps.length > 0) {
            const acts = deriveLearningActivitiesFromCompetency(subComps[0], value, currentTopic);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          }
          if (derivedActs.length > 0) {
            const formattedActs = derivedActs.length > 1
              ? derivedActs.map((a, i) => `${i + 1}. ${a}`).join('')
              : derivedActs[0];
            updatedWeek.activities = [formattedActs];
          }
        }
      } else if (field === 'competencies' && subIndex !== null) {
        const newCompetencies = [...updatedWeek.competencies];
        newCompetencies[subIndex] = value;
        updatedWeek.competencies = newCompetencies;

        // Auto-derive expected standards if box is currently empty or placeholder
        const currentStd = updatedWeek.expectedStandards?.[0]?.trim() || '';
        if (!currentStd || currentStd.startsWith('1. State expected')) {
          const filledComps = newCompetencies.filter(Boolean);
          const derivedStds: string[] = [];
          filledComps.forEach(c => {
            const std = deriveExpectedStandardFromCompetency(c);
            if (std && !derivedStds.includes(std)) derivedStds.push(std);
          });
          if (derivedStds.length > 0) {
            const formatted = derivedStds.length > 1
              ? derivedStds.map((s, i) => `${i + 1}. ${s}`).join('')
              : derivedStds[0];
            updatedWeek.expectedStandards = [formatted];
          }
        }

        // Auto-derive learning activities if box is currently empty or placeholder
        const currentAct = (Array.isArray(updatedWeek.activities) ? updatedWeek.activities[0] : (updatedWeek.activities as any)) || '';
        if (!currentAct.trim() || currentAct.startsWith('1. State learning')) {
          const filledComps = newCompetencies.filter(Boolean);
          const derivedActs: string[] = [];
          filledComps.forEach((c, cIdx) => {
            const sub = updatedWeek.subtopics?.[cIdx] || '';
            const acts = deriveLearningActivitiesFromCompetency(c, sub, updatedWeek.topic);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          });
          if (derivedActs.length > 0) {
            const formattedActs = derivedActs.length > 1
              ? derivedActs.map((a, i) => `${i + 1}. ${a}`).join('')
              : derivedActs[0];
            updatedWeek.activities = [formattedActs];
          }
        }
      } else if (field === 'activities') {
        if (subIndex === null) {
          updatedWeek.activities = [value];
        } else {
          const newActivities = [...(updatedWeek as any).activities || ['', '', '', '', '']];
          newActivities[subIndex] = value;
          updatedWeek.activities = newActivities;
        }
      } else if (field === 'topic') {
        updatedWeek.topic = value;
        if (value) {
          const topObj = currentSyllabus?.find((t: any) => t.title === value);
          const derived = topObj?.component || autoDeriveComponent(value, prev.subject);
          if (derived) {
            const normDerived = cleanKey(derived);
            const normCurrent = cleanKey(updatedWeek.component || '');
            if (!updatedWeek.component || normCurrent !== normDerived) {
              if (normDerived === 'listeningandspeaking') updatedWeek.component = 'Listening & Speaking';
              else if (normDerived === 'reading') updatedWeek.component = 'Reading';
              else if (normDerived === 'writing') updatedWeek.component = 'Writing';
              else updatedWeek.component = derived;
            }
          }
        }

        // If subtopics already exist, refresh expected standards and learning activities for new topic
        if (updatedWeek.subtopics && updatedWeek.subtopics.some(Boolean)) {
          const filledSubs = updatedWeek.subtopics.filter(Boolean);
          const derivedStds: string[] = [];
          const derivedActs: string[] = [];
          filledSubs.forEach(st => {
            const stds = getExpectedStandardsForSubtopic(value, st, currentSyllabus);
            stds.forEach(s => {
              if (!derivedStds.includes(s)) derivedStds.push(s);
            });
            const acts = getActivitiesForSubtopic(value, st, undefined, currentSyllabus, prev.grade, prev.subject);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          });
          if (derivedStds.length > 0) {
            const formatted = derivedStds.length > 1
              ? derivedStds.map((s, i) => `${i + 1}. ${s}`).join('')
              : derivedStds[0];
            updatedWeek.expectedStandards = [formatted];
          }
          if (derivedActs.length > 0) {
            const formattedActs = derivedActs.length > 1
              ? derivedActs.map((a, i) => `${i + 1}. ${a}`).join('')
              : derivedActs[0];
            updatedWeek.activities = [formattedActs];
          }
        }

        newWeeks[index] = updatedWeek;
        return {
          ...prev,
          topic: index === 0 ? value : prev.topic,
          weeks: newWeeks
        };
      } else if (field === 'topic2') {
        updatedWeek.topic2 = value;
        if (updatedWeek.subtopics && updatedWeek.subtopics.some(Boolean)) {
          const filledSubs = updatedWeek.subtopics.filter(Boolean);
          const derivedStds: string[] = [];
          const derivedActs: string[] = [];
          filledSubs.forEach(st => {
            const stds = getExpectedStandardsForSubtopic(value, st, currentSyllabus);
            stds.forEach(s => {
              if (!derivedStds.includes(s)) derivedStds.push(s);
            });
            const acts = getActivitiesForSubtopic(value, st, undefined, currentSyllabus, prev.grade, prev.subject);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          });
          if (derivedStds.length > 0) {
            const formatted = derivedStds.length > 1
              ? derivedStds.map((s, i) => `${i + 1}. ${s}`).join('')
              : derivedStds[0];
            updatedWeek.expectedStandards = [formatted];
          }
          if (derivedActs.length > 0) {
            const formattedActs = derivedActs.length > 1
              ? derivedActs.map((a, i) => `${i + 1}. ${a}`).join('')
              : derivedActs[0];
            updatedWeek.activities = [formattedActs];
          }
        }
      } else if (field === 'topic3') {
        updatedWeek.topic3 = value;
        if (updatedWeek.subtopics && updatedWeek.subtopics.some(Boolean)) {
          const filledSubs = updatedWeek.subtopics.filter(Boolean);
          const derivedStds: string[] = [];
          const derivedActs: string[] = [];
          filledSubs.forEach(st => {
            const stds = getExpectedStandardsForSubtopic(value, st, currentSyllabus);
            stds.forEach(s => {
              if (!derivedStds.includes(s)) derivedStds.push(s);
            });
            const acts = getActivitiesForSubtopic(value, st, undefined, currentSyllabus, prev.grade, prev.subject);
            acts.forEach(a => {
              if (!derivedActs.includes(a)) derivedActs.push(a);
            });
          });
          if (derivedStds.length > 0) {
            const formatted = derivedStds.length > 1
              ? derivedStds.map((s, i) => `${i + 1}. ${s}`).join('')
              : derivedStds[0];
            updatedWeek.expectedStandards = [formatted];
          }
          if (derivedActs.length > 0) {
            const formattedActs = derivedActs.length > 1
              ? derivedActs.map((a, i) => `${i + 1}. ${a}`).join('')
              : derivedActs[0];
            updatedWeek.activities = [formattedActs];
          }
        }
      }
      
      newWeeks[index] = updatedWeek;
      return { ...prev, weeks: newWeeks };
    });
  };

  const getOBCFieldsForSubtopic = (topicTitle: string, subtopicTitle: string, syllabus?: any[]) => {
    const data = syllabus || currentSyllabus;
    if (!data || !Array.isArray(data)) return { knowledge: '', skills: '', values: '' };
    
    const topic = data.find(t => cleanKey(t.title) === cleanKey(topicTitle));
    if (!topic) return { knowledge: '', skills: '', values: '' };

    const subtopic = topic.subtopics?.find((st: any) => cleanKey(st.title) === cleanKey(subtopicTitle));
    if (!subtopic) return { knowledge: '', skills: '', values: '' };

    // Try direct fields first
    const res = {
        knowledge: subtopic.knowledge || subtopic.knowledgeContent || '',
        skills: subtopic.skills || subtopic.skillsContent || '',
        values: subtopic.values || subtopic.valuesContent || ''
    };

    // If still empty, try to derive from content field if it exists
    if (!res.knowledge && subtopic.content) {
      // Assuming content might have the information structured or as a string
      res.knowledge = typeof subtopic.content === 'string' ? subtopic.content : (subtopic.content.knowledge || '');
      res.skills = typeof subtopic.content === 'string' ? '' : (subtopic.content.skills || '');
      res.values = typeof subtopic.content === 'string' ? '' : (subtopic.content.values || '');
    }

    // Fallback logic for Knowledge
    if (!res.knowledge && Array.isArray(subtopic.competencies)) {
        for (const comp of subtopic.competencies) {
            const parsed = parseRawCompetency(comp);
            if (parsed.knowledge) {
                res.knowledge = parsed.knowledge;
                break;
            }
            const embKnow = extractEmbeddedKnowledge(comp);
            if (embKnow.length > 0) {
                res.knowledge = embKnow.join(', ');
                break;
            }
        }
    }
    if (!res.knowledge && Array.isArray(subtopic.learningActivities)) {
        res.knowledge = subtopic.learningActivities.join(', ');
    }

    return res;
  };

  const toggleRevision = (idx: number) => {
    setFormData(prev => {
      const newDays = [...prev.forecastDays!];
      newDays[idx] = { ...newDays[idx], isRevision: !(newDays[idx] as any).isRevision } as any;
      return { ...prev, forecastDays: newDays };
    });
  };

  const handleForecastChange = (index: number, field: 'topic' | 'subtopic' | 'competency' | 'activities' | 'expectedStandard' | 'date' | 'learningArea' | 'knowledge' | 'skills' | 'values' | 'teachingMethods' | 'references', value: string | string[], subIndex?: number) => {
    setFormData(prev => {
      const newDays = [...prev.forecastDays!];
      if (field === 'activities' && subIndex !== undefined) {
        const currentActivities = [...(newDays[index] as any).activities || ['', '']];
        currentActivities[subIndex] = value as string;
        newDays[index] = { ...newDays[index], activities: currentActivities } as any;
      } else {
        newDays[index] = { ...newDays[index], [field]: value } as any;
        
        if (field === 'topic') {
          newDays[index].subtopic = '';
          newDays[index].competency = '';
          (newDays[index] as any).knowledge = '';
          (newDays[index] as any).skills = '';
          (newDays[index] as any).values = '';
          newDays[index].expectedStandard = '';
          (newDays[index] as any).teachingMethods = '';
          newDays[index].activities = ['', ''];
        } else if (field === 'subtopic') {
          const comps = getCompetenciesForSubtopic(newDays[index].topic, value as string);
          const autoComp = comps[0] || '';
          newDays[index].competency = autoComp;
          
          const fields = getOBCFieldsForSubtopic(newDays[index].topic, value as string, currentSyllabus);
          (newDays[index] as any).knowledge = fields.knowledge;
          (newDays[index] as any).skills = fields.skills;
          (newDays[index] as any).values = fields.values;
          
          // Auto-populate Expected Standard from official syllabus
          const targetTopic = currentSyllabus?.find(t => t.title === newDays[index].topic);
          const targetSubtopic = targetTopic?.subtopics?.find((st: any) => st.title === (value as string));
          if (targetSubtopic) {
            const std = targetSubtopic.expectedStandard || (Array.isArray(targetSubtopic.expectedStandards) ? targetSubtopic.expectedStandards[0] : '') || '';
            if (std) newDays[index].expectedStandard = std;
          }

          // Auto-populate dynamic methodologies and clean syllabus reference
          (newDays[index] as any).teachingMethods = getVariedTeachingMethods(index, value as string);
          if (!newDays[index].references) {
            newDays[index].references = `${prev.curriculumType === 'OBC' ? 'OBC' : 'CBC'} ${prev.grade || ''} ${prev.subject || ''} Syllabus, Page: ..........`;
          }

          const acts = getActivitiesForSubtopic(newDays[index].topic, value as string, autoComp, currentSyllabus, formData.grade, formData.subject);
          const act1 = acts[0] || '';
          const act2 = acts[1] || '';
          newDays[index].activities = [act1, act2];
        } else if (field === 'competency') {
          newDays[index].activities = ['', ''];
        } else if (field === 'learningArea') {
          newDays[index].topic = '';
          newDays[index].subtopic = '';
          newDays[index].competency = '';
          (newDays[index] as any).knowledge = '';
          (newDays[index] as any).skills = '';
          (newDays[index] as any).values = '';
          newDays[index].expectedStandard = '';
          (newDays[index] as any).teachingMethods = '';
          newDays[index].activities = ['', ''];
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
        
        let updatedStoppingTopic = formData.stoppingTopic;
        if (currentSyllabus && Array.isArray(currentSyllabus) && value && formData.stoppingTopic) {
          const startIdx = currentSyllabus.findIndex(t => matchTopicInSyllabus(t, value));
          const stopIdx = currentSyllabus.findIndex(t => matchTopicInSyllabus(t, formData.stoppingTopic));
          if (startIdx !== -1 && stopIdx !== -1 && stopIdx < startIdx) {
            const lastTopicObj = currentSyllabus[currentSyllabus.length - 1];
            updatedStoppingTopic = lastTopicObj ? (lastTopicObj.title || lastTopicObj.topic || '') : '';
          }
        }

        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            stoppingTopic: updatedStoppingTopic,
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
    } else if (name === 'additionalContext') {
        const targetWeek = Number(formData.type === 'lesson_plan' ? (formData.lessonWeekNumber || formData.forecastWeek) : formData.forecastWeek) || 1;
        const targetDay = Number(formData.type === 'lesson_plan' ? formData.lessonNumber : 1) || 1;
        const metadata = extractFullMetadataFromText(value, targetDay, targetWeek);
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (metadata.grade && !prev.grade) updated.grade = metadata.grade;
            if (metadata.subject && !prev.subject) updated.subject = metadata.subject;
            if (metadata.topic && !prev.topic) updated.topic = metadata.topic;
            if (metadata.subtopic && !prev.subtopic) updated.subtopic = metadata.subtopic;
            return updated;
        });
        if (metadata.topic || metadata.subtopic) {
            toast.success("✨ Auto-captured syllabus details from pasted instructions!");
        }
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

    const gLow = (formData.grade || '').toLowerCase();
    const isSecondaryGrade = gLow.includes('form') || gLow.includes('secondary') || gLow.includes('grade 8') || gLow.includes('grade 9') || gLow.includes('grade 10') || gLow.includes('grade 11') || gLow.includes('grade 12') || gLow.includes('adv');
    const isSpecial = isSecondaryGrade && !!(formData.subject && (
      formData.subject.toLowerCase().includes('english') || 
      formData.subject.toLowerCase().includes('zambian')
    ));

    const hasComponents = syllabus.some(t => !!t.component);

    if (isSpecial || hasComponents) {
      // Group the transformed topics by their component property
      const groups: Record<string, any[]> = {};
      syllabus.forEach(t => {
        const comp = t.component || "General";
        if (!groups[comp]) {
          groups[comp] = [];
        }
        groups[comp].push(t);
      });

      return Object.entries(groups).map(([compName, topics]) => (
        <optgroup key={compName} label={`🔴 COMPONENT: ${compName.toUpperCase()}`} className="font-extrabold text-red-600 bg-red-50/40">
          {topics.map((t, tIdx) => {
            const formatted = customFormatFn ? customFormatFn(t.title) : formatTopicOptionDisplay(t.title, isZambianLanguageSubject, formData.zambianLanguage || 'Icibemba');
            return (
              <option key={`${t.title}-${tIdx}`} value={t.title} className="font-bold text-blue-600">
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
        <option key={`${t.title}-${tIdx}`} value={t.title} className="font-bold text-blue-600">
          {formatted}
        </option>
      );
    });
  };

  const cleanKey = (s: string) => {
    if (!s) return '';
    return s
      .toLowerCase()
      .replace(/&/g, 'and')
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
    } else if (formData.term) {
      searchTerm = formData.term;
    }

    const targetClean = cleanKey(searchTitle);
    if (!targetClean) return [];

    let topic = data ? data.find((t: any) => 
      cleanKey(t.title) === targetClean && 
      (searchTerm ? (cleanKey(t.term || '') === cleanKey(searchTerm) || (t.term && searchTerm && t.term.toString().replace(/[^0-9]/g, '') === searchTerm.toString().replace(/[^0-9]/g, ''))) : true)
    ) : null;

    if (!topic && data) {
      topic = data.find((t: any) => {
        const k = cleanKey(t.title);
        return k && (k.includes(targetClean) || targetClean.includes(k));
      });
    }

    if (!topic && (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral'))) {
      const eng = getEnglishTopics();
      const candidates = [...(eng.oral || []), ...(eng.literacy || [])];
      topic = candidates.find((t: any) => {
        const k = cleanKey(t.title);
        const termMatches = searchTerm ? (cleanKey(t.term || '') === cleanKey(searchTerm) || (t.term && t.term.toString().replace(/[^0-9]/g, '') === searchTerm.toString().replace(/[^0-9]/g, ''))) : true;
        return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k)) && termMatches;
      }) || candidates.find((t: any) => {
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
          if (Array.isArray(t.competencies) && t.competencies.length > 0) {
            collectedComps.push(...t.competencies);
          }
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

  const isOBCLanguageScheme = Boolean(
    (curriculumType === 'OBC' || formData.curriculumType === 'OBC' || formData.grade?.toLowerCase().includes('obc') || formData.grade?.toLowerCase().includes('obe')) &&
    formData.type === 'schemes_of_work' &&
    formData.subject && (
      formData.subject.toLowerCase().includes('english') || 
      formData.subject.toLowerCase().includes('zambian')
    )
  );

  const getComponentsForSubjectAndGrade = () => {
    const sLow = (formData.subject || '').toLowerCase();
    const gLow = (formData.grade || '').toLowerCase();
    const isEnglish = sLow.includes('english');
    const isZambian = sLow.includes('zambian');

    // Literacy is strictly about Reading and Writing (Listening & Speaking is for Oral English)
    if (sLow.includes('literacy') || formData.englishComponent === 'literacy') {
      return ["Reading", "Writing"];
    }

    // Oral English is strictly about Listening & Speaking
    if (sLow.includes('oral') || formData.englishComponent === 'oral') {
      return ["Listening & Speaking"];
    }

    // Check for Grade 1, 2, or 3 (Lower Primary)
    const isGrade123 = 
      (gLow.includes('grade 1') && !gLow.includes('grade 10') && !gLow.includes('grade 11') && !gLow.includes('grade 12')) ||
      (gLow.includes('grade 2') && !gLow.includes('grade 12')) ||
      (gLow.includes('grade 3') && !gLow.includes('grade 13')) ||
      gLow === 'gr1' || gLow === 'gr2' || gLow === 'gr3' ||
      gLow.includes('grade 1 (cbc)') || gLow.includes('grade 2 (cbc)') || gLow.includes('grade 3 (cbc)') ||
      gLow.includes('grade 1 (obc)') || gLow.includes('grade 2 (obc)') || gLow.includes('grade 3 (obc)') ||
      gLow.includes('grade 1 (primary)') || gLow.includes('grade 2 (primary)') || gLow.includes('grade 3 (primary)');

    if (isEnglish) {
      if (isGrade123) {
        // In Grades 1, 2, and 3 combined English, the components are Listening & Speaking, Reading, Writing
        return ["Listening & Speaking", "Reading", "Writing"];
      }
      const isSecondary = gLow.includes('grade 8') || gLow.includes('grade 9') || gLow.includes('grade 10') || gLow.includes('grade 11') || gLow.includes('grade 12') || gLow.includes('form');
      if (isSecondary) {
        return ["Listening & Speaking", "Reading", "Writing", "Structure"];
      }
      return ["Listening & Speaking", "Reading", "Writing", "Language Structure and Usage"];
    }

    if (isZambian) {
      if (isGrade123) {
        return ["Listening & Speaking", "Reading", "Writing"];
      }
      return ["Listening & Speaking", "Reading", "Writing", "Language"];
    }

    return ["Listening & Speaking", "Reading", "Writing"];
  };

  const getOBCComponentsForSubject = () => {
    return getComponentsForSubjectAndGrade();
  };

  const getOBCOutcomesForTopic = (topicTitle: string, syllabus?: any[]): string[] => {
    if (!topicTitle) return [];
    const comps = getAllCompetenciesForTopic(topicTitle, syllabus || currentSyllabus);
    const outcomes: string[] = [];
    comps.forEach(c => {
      const parsed = parseRawCompetency(c);
      const brief = parsed.briefCompetency || c;
      const clean = brief.replace(/^Specific\s+Outcome:\s*/i, '').trim();
      if (clean && !outcomes.includes(clean)) {
        outcomes.push(clean);
      }
    });
    return outcomes;
  };

  const getOBCKnowledgeForTopic = (topicTitle: string, syllabus?: any[]): string[] => {
    if (!topicTitle) return [];
    const data = syllabus || currentSyllabus;
    if (!data || !Array.isArray(data)) return [];
    
    let searchTitle = topicTitle;
    if (topicTitle.includes('|')) searchTitle = topicTitle.split('|')[0];
    const targetClean = cleanKey(searchTitle);
    
    const matchedTopics = data.filter((t: any) => {
      const k = cleanKey(t.title || '');
      return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
    });

    const knowledgeList: string[] = [];
    matchedTopics.forEach((t: any) => {
      if (t.knowledge && typeof t.knowledge === 'string' && !knowledgeList.includes(t.knowledge)) {
        knowledgeList.push(t.knowledge);
      }
      if (Array.isArray(t.subtopics)) {
        t.subtopics.forEach((st: any) => {
          if (st.knowledge && typeof st.knowledge === 'string' && !knowledgeList.includes(st.knowledge)) {
            knowledgeList.push(st.knowledge);
          }
          if (Array.isArray(st.competencies)) {
            st.competencies.forEach((c: string) => {
              const parsed = parseRawCompetency(c);
              if (parsed.knowledge && !knowledgeList.includes(parsed.knowledge)) {
                knowledgeList.push(parsed.knowledge);
              }
              const embKnow = extractEmbeddedKnowledge(c);
              embKnow.forEach(k => {
                if (k && !knowledgeList.includes(k)) knowledgeList.push(k);
              });
              if (parsed.learningActivities) {
                parsed.learningActivities.forEach(a => {
                  if (a && !knowledgeList.includes(a)) knowledgeList.push(a);
                });
              }
            });
          }
          if (Array.isArray(st.learningActivities)) {
            st.learningActivities.forEach((act: string) => {
              if (act && !knowledgeList.includes(act)) {
                knowledgeList.push(act);
              }
            });
          }
        });
      }
    });

    if (knowledgeList.length === 0) {
      const allComps = getAllCompetenciesForTopic(topicTitle, data);
      allComps.forEach(c => {
        const parsed = parseRawCompetency(c);
        if (parsed.knowledge && !knowledgeList.includes(parsed.knowledge)) {
          knowledgeList.push(parsed.knowledge);
        }
        const embKnow = extractEmbeddedKnowledge(c);
        embKnow.forEach(k => {
          if (k && !knowledgeList.includes(k)) knowledgeList.push(k);
        });
        if (parsed.learningActivities) {
          parsed.learningActivities.forEach(a => {
            if (a && !knowledgeList.includes(a)) knowledgeList.push(a);
          });
        }
      });
    }

    return knowledgeList;
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
    
    const candidateSyllabi: any[][] = [];
    if (data && Array.isArray(data)) candidateSyllabi.push(data);
    
    const isEngGr12 = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) &&
      (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral'));
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      candidateSyllabi.push(englishGrade1Literacy, englishGrade1Oral, englishGrade2Literacy, englishGrade2Oral);
    }
    
    for (const syl of candidateSyllabi) {
      if (!Array.isArray(syl)) continue;
      const topic = syl.find((t: any) => {
        const k = cleanKey(t.title);
        return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
      });
      if (topic && Array.isArray(topic.subtopics)) {
        const found = topic.subtopics.find((st: any) => {
          const k = cleanKey(st.title);
          return k && (k === subClean || k.includes(subClean) || subClean.includes(k));
        });
        if (found) return found;
      }
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
      (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral'));
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      if (SYLLABI['Grade 1 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 1 (CBC)']['English']);
      if (SYLLABI['Grade 2 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 2 (CBC)']['English']);
      candidateSyllabi.push(englishGrade1Literacy, englishGrade1Oral, englishGrade2Literacy, englishGrade2Oral);
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

    // MANDATORY SANITIZATION: Clean every competency string to ONLY include the brief competency statement
    // and strictly enforce CBC vs OBC terminology: CBC has Specific Competencies, OBC has Specific Outcomes!
    const cleaned = foundComps.map(c => {
      const brief = parseRawCompetency(c).briefCompetency;
      return formatCompetencyOrOutcomeForCurriculum(brief, curriculumType);
    }).filter(Boolean);
    return Array.from(new Set(cleaned));
  };

  const getExpectedStandardsForSubtopic = (topicTitle: string, subtopicTitle: string, syllabus?: any[]): string[] => {
    if (!subtopicTitle && !topicTitle) return [];
    const targetClean = cleanKey(subtopicTitle || '');
    const topicClean = cleanKey(topicTitle || '');

    const effectiveSyllabus = (syllabus && syllabus.length > 0) ? syllabus : currentSyllabus;
    let matchedSubtopic: any = null;

    // 1. Try finding in specific topic if topicTitle is provided
    if (topicTitle && effectiveSyllabus) {
      const subtopics = getSubtopicsForTopic(topicTitle, effectiveSyllabus);
      if (subtopics && subtopics.length > 0) {
        matchedSubtopic = subtopics.find((st: any) => {
          const k = cleanKey(st.title);
          return k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k));
        });
      }
    }

    // 2. If not found, search ALL topics and subtopics in effectiveSyllabus
    if (!matchedSubtopic && effectiveSyllabus && Array.isArray(effectiveSyllabus)) {
      for (const t of effectiveSyllabus) {
        const subs = Array.isArray(t.subtopics) ? t.subtopics : [];
        for (const st of subs) {
          const k = cleanKey(st.title || '');
          if (targetClean && k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k))) {
            matchedSubtopic = st;
            break;
          }
        }
        if (matchedSubtopic) break;
      }
    }

    // 3. If still not found, search in candidate English/Literacy/Oral syllabi
    const isEngGr12 = (formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) &&
      (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral'));
    if (!matchedSubtopic && isEngGr12) {
      const engTopics = getEnglishTopics();
      const candidateList = [...(engTopics.oral || []), ...(engTopics.literacy || []), ...englishGrade1Literacy, ...englishGrade1Oral, ...englishGrade2Literacy, ...englishGrade2Oral];
      for (const t of candidateList) {
        const subs = Array.isArray(t.subtopics) ? t.subtopics : [];
        for (const st of subs) {
          const k = cleanKey(st.title || '');
          if (targetClean && k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k))) {
            matchedSubtopic = st;
            break;
          }
        }
        if (matchedSubtopic) break;
      }
    }

    // 4. If still not found, search in SYLLABI directly (CBC/OBC)
    if (!matchedSubtopic) {
      const g = formData.grade || 'Grade 4';
      const s = formData.subject || 'Science';
      const fallbackList = SYLLABI[`${g} (CBC)`]?.[s] || SYLLABI[g]?.[s] || SYLLABI["Grade 4 (CBC)"]?.["Integrated science"] || [];
      if (Array.isArray(fallbackList)) {
        for (const t of fallbackList) {
          const subs = Array.isArray(t.subtopics) ? t.subtopics : [];
          for (const st of subs) {
            const k = cleanKey(st.title || '');
            if (targetClean && k && (k === targetClean || k.includes(targetClean) || targetClean.includes(k))) {
              matchedSubtopic = st;
              break;
            }
          }
          if (matchedSubtopic) break;
        }
      }
    }

    const standards: string[] = [];

    // Extract explicit expected standards
    if (matchedSubtopic?.expectedStandard) {
      if (Array.isArray(matchedSubtopic.expectedStandard)) {
        standards.push(...matchedSubtopic.expectedStandard);
      } else if (typeof matchedSubtopic.expectedStandard === 'string') {
        standards.push(matchedSubtopic.expectedStandard);
      }
    }
    if (matchedSubtopic?.expectedStandards) {
      if (Array.isArray(matchedSubtopic.expectedStandards)) {
        standards.push(...matchedSubtopic.expectedStandards);
      } else if (typeof matchedSubtopic.expectedStandards === 'string') {
        standards.push(matchedSubtopic.expectedStandards);
      }
    }

    // Check embedded expected standards in competencies
    if (matchedSubtopic?.competencies && Array.isArray(matchedSubtopic.competencies)) {
      const embedded = extractEmbeddedExpectedStandards(matchedSubtopic.competencies);
      if (embedded.length > 0) {
        standards.push(...embedded);
      } else if (standards.length === 0) {
        // Derive from competencies
        matchedSubtopic.competencies.forEach((c: any) => {
          const derived = deriveExpectedStandardFromCompetency(typeof c === 'string' ? c : String(c));
          if (derived) standards.push(derived);
        });
      }
    }

    // If still no standards but we have subtopicTitle or competency
    if (standards.length === 0 && subtopicTitle) {
      const derived = deriveExpectedStandardFromCompetency(subtopicTitle);
      if (derived) standards.push(derived);
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

  // Helper to auto-fill a single week's expected standards from syllabus
  const handleAutoFillWeekStandards = (weekIdx: number) => {
    if (!formData.weeks || !formData.weeks[weekIdx]) return;
    const w = formData.weeks[weekIdx];
    const weekTopic = w.topic || (weekIdx === 0 ? formData.topic : '') || '';
    const weekSubs = (w.subtopics || []).map(s => stripPageNumbers(s)).filter(Boolean);
    const weekComps = (w.competencies || []).filter(Boolean);

    const stdsList: string[] = [];
    if (weekSubs.length > 0) {
      weekSubs.forEach(st => {
        const sList = getExpectedStandardsForSubtopic(weekTopic, st, currentSyllabus);
        sList.forEach(s => {
          if (!stdsList.includes(s)) stdsList.push(s);
        });
      });
    }
    if (stdsList.length === 0 && weekComps.length > 0) {
      weekComps.forEach(c => {
        const s = deriveExpectedStandardFromCompetency(c);
        if (s && !stdsList.includes(s)) stdsList.push(s);
      });
    }
    if (stdsList.length === 0 && weekTopic) {
      const sList = getExpectedStandardsForSubtopic(weekTopic, '', currentSyllabus);
      sList.forEach(s => {
        if (!stdsList.includes(s)) stdsList.push(s);
      });
    }

    if (stdsList.length > 0) {
      const formatted = stdsList.length > 1
        ? stdsList.map((s, i) => `${i + 1}. ${s}`).join('')
        : stdsList[0];
      handleWeekChange(weekIdx, 'expectedStandards', null, formatted);
      toast.success(`Week ${w.week} expected standards drafted!`);
    } else {
      toast.error(`Please select a topic or subtopic for Week ${w.week} first.`);
    }
  };

  // Helper to auto-fill a single week's learning activities from syllabus
  const handleAutoFillWeekActivities = (weekIdx: number) => {
    if (!formData.weeks || !formData.weeks[weekIdx]) return;
    const w = formData.weeks[weekIdx];
    const weekTopic = w.topic || (weekIdx === 0 ? formData.topic : '') || '';

    if (isOBCLanguageScheme) {
      if (!weekTopic) {
        toast.error(`Please select a topic for Week ${w.week} first.`);
        return;
      }
      const knowList = getOBCKnowledgeForTopic(weekTopic);
      if (knowList.length > 0) {
        const formatted = knowList.length > 1
          ? knowList.map((a, i) => `${i + 1}. ${a}`).join('')
          : knowList[0];
        handleWeekChange(weekIdx, 'activities', null, formatted);
        toast.success(`Week ${w.week} knowledge drafted!`);
        return;
      } else {
        toast.error(`No syllabus knowledge statements found for "${weekTopic}".`);
        return;
      }
    }

    const weekSubs = (w.subtopics || []).map(s => stripPageNumbers(s)).filter(Boolean);
    const weekComps = (w.competencies || []).filter(Boolean);

    const actsList: string[] = [];
    if (weekSubs.length > 0) {
      weekSubs.forEach((st, sIdx) => {
        const comp = weekComps[sIdx] || '';
        const aList = getActivitiesForSubtopic(weekTopic, st, comp, currentSyllabus, formData.grade, formData.subject);
        aList.forEach(a => {
          if (!actsList.includes(a)) actsList.push(a);
        });
      });
    }
    if (actsList.length === 0 && weekComps.length > 0) {
      weekComps.forEach((c, cIdx) => {
        const sub = weekSubs[cIdx] || '';
        const aList = deriveLearningActivitiesFromCompetency(c, sub, weekTopic);
        aList.forEach(a => {
          if (!actsList.includes(a)) actsList.push(a);
        });
      });
    }
    if (actsList.length === 0 && weekTopic) {
      const aList = getActivitiesForSubtopic(weekTopic, '', undefined, currentSyllabus, formData.grade, formData.subject);
      aList.forEach(a => {
        if (!actsList.includes(a)) actsList.push(a);
      });
    }

    if (actsList.length > 0) {
      const formatted = actsList.length > 1
        ? actsList.map((a, i) => `${i + 1}. ${a}`).join('')
        : actsList[0];
      handleWeekChange(weekIdx, 'activities', null, formatted);
      toast.success(`Week ${w.week} learning activities drafted!`);
    } else {
      toast.error(`Please select a topic or subtopic for Week ${w.week} first.`);
    }
  };

  // Helper to auto-fill both expected standards and learning activities for a week
  const handleAutoFillWeekBoth = (weekIdx: number) => {
    if (isOBCLanguageScheme) {
      handleAutoFillWeekActivities(weekIdx);
      return;
    }
    handleAutoFillWeekStandards(weekIdx);
    handleAutoFillWeekActivities(weekIdx);
  };

  // Reactive auto-fill of Expected Standards & Learning Activities in boxes whenever weeks have topics/subtopics/competencies but no standards/activities yet
  useEffect(() => {
    if (formData.type !== 'schemes_of_work' || !formData.weeks || formData.weeks.length === 0) return;
    const isECE = formData.grade?.toLowerCase().includes('ece');
    const eceBreakWeek = formData.eceMidTermBreakWeek || 7;
    const specialWeeks = isECE ? [eceBreakWeek, 12, 13] : [12, 13];

    let hasChanges = false;
    const updatedWeeks = formData.weeks.map((w, idx) => {
      // For teaching weeks after week 1 (idx > 0), do not automatically look up/populate Expected Standards and Learning Activities.
      // They are left blank/muted unless populated via Magic Fill.
      if (idx > 0 && !specialWeeks.includes(w.week)) {
        return w;
      }

      // For special assessment/revision weeks, provide standard CBC text if empty
      if (specialWeeks.includes(w.week)) {
        const currentStd = (Array.isArray(w.expectedStandards) ? w.expectedStandards[0] : (w.expectedStandards as any)) || '';
        const currentAct = (Array.isArray(w.activities) ? w.activities[0] : (w.activities as any)) || '';
        let newStd = currentStd;
        let newAct = currentAct;
        let changed = false;

        if (!currentStd.trim()) {
          if (w.week === 12) {
            newStd = "1. Consolidation and mastery of all term concepts demonstrated2. Challenging competencies reviewed and reinforced";
          } else if (w.week === 13) {
            newStd = "1. Comprehensive term assessment completed accurately according to national curriculum standards";
          } else if (isECE && w.week === eceBreakWeek) {
            newStd = "1. Cognitive and developmental progress reviewed across all learning areas";
          }
          changed = true;
        }

        if (!currentAct.trim()) {
          if (w.week === 12) {
            newAct = "1. Reviewing challenging subtopics in collaborative groups2. Practicing past examination questions and problem-solving3. Individual remedial guidance";
          } else if (w.week === 13) {
            newAct = "1. Administering summative end-of-term examination2. Marking scripts and compiling learner progress reports";
          } else if (isECE && w.week === eceBreakWeek) {
            newAct = "1. Conducting play-based review sessions and individual child observations";
          }
          changed = true;
        }

        if (changed) {
          hasChanges = true;
          return {
            ...w,
            expectedStandards: newStd ? [newStd] : w.expectedStandards,
            activities: newAct ? [newAct] : w.activities
          };
        }
        return w;
      }

      const currentStd = (Array.isArray(w.expectedStandards) ? w.expectedStandards[0] : (w.expectedStandards as any)) || '';
      const currentAct = (Array.isArray(w.activities) ? w.activities[0] : (w.activities as any)) || '';
      const needsStd = !currentStd.trim() || currentStd.startsWith('1. State expected');
      const needsAct = !currentAct.trim() || currentAct.startsWith('1. State learning') || (Array.isArray(w.activities) && w.activities.every(a => !a));

      const isAssessmentWeek = w.week === 4 || w.week === 8;
      const testLabel = "Monthly Assessment:";
      const hasAssessmentInStd = currentStd.toLowerCase().includes("assessment") || currentStd.toLowerCase().includes("assessed");
      const hasAssessmentInAct = currentAct.includes(testLabel);

      if (!needsStd && !needsAct && (!isAssessmentWeek || (hasAssessmentInStd && hasAssessmentInAct))) return w;

      const weekTopic = w.topic || (idx === 0 ? formData.topic : '') || '';
      const weekSubs = (w.subtopics || []).map(s => stripPageNumbers(s)).filter(Boolean);
      const weekComps = (w.competencies || []).filter(Boolean);

      if (weekSubs.length === 0 && weekComps.length === 0 && !weekTopic) return w;

      if (isOBCLanguageScheme) {
        if (!needsAct) {
          if (w.expectedStandards && w.expectedStandards.length > 0) {
            hasChanges = true;
            return { ...w, expectedStandards: [] };
          }
          return w;
        }
        const knowList = getOBCKnowledgeForTopic(weekTopic);
        if (knowList.length > 0) {
          hasChanges = true;
          const formattedKnow = knowList.length > 1
            ? knowList.map((a, i) => `${i + 1}. ${a}`).join('')
            : knowList[0];
          return {
            ...w,
            expectedStandards: [],
            activities: formattedKnow ? [formattedKnow] : w.activities
          };
        }
        return w;
      }

      let stdsList: string[] = [];
      if (needsStd || (isAssessmentWeek && !hasAssessmentInStd)) {
        if (currentStd.trim() && !currentStd.startsWith('1. State expected')) {
          stdsList = currentStd.split('\n').map((line: string) => line.replace(/^\d+[\.\)]\s*/, ''));
        } else {
          if (weekSubs.length > 0) {
            weekSubs.forEach(st => {
              const sList = getExpectedStandardsForSubtopic(weekTopic, st, currentSyllabus);
              sList.forEach(s => {
                if (!stdsList.includes(s)) stdsList.push(s);
              });
            });
          }
          if (stdsList.length === 0 && weekComps.length > 0) {
            weekComps.forEach(c => {
              const s = deriveExpectedStandardFromCompetency(c);
              if (s && !stdsList.includes(s)) stdsList.push(s);
            });
          }
          if (stdsList.length === 0 && weekTopic) {
            const sList = getExpectedStandardsForSubtopic(weekTopic, '', currentSyllabus);
            sList.forEach(s => {
              if (!stdsList.includes(s)) stdsList.push(s);
            });
          }
        }

        if (isAssessmentWeek) {
          const testStd = "Learners' knowledge and competencies assessed against CBC performance indicators";
          if (!stdsList.some(s => s.toLowerCase().includes("assessed") || s.toLowerCase().includes("assessment"))) {
            stdsList.push(testStd);
          }
        }
      }

      let actsList: string[] = [];
      if (needsAct || (isAssessmentWeek && !hasAssessmentInAct)) {
        if (currentAct.trim() && !currentAct.startsWith('1. State learning')) {
          actsList = currentAct.split('\n').map((line: string) => line.replace(/^\d+[\.\)]\s*/, ''));
        } else {
          if (weekSubs.length > 0) {
            weekSubs.forEach((st, sIdx) => {
              const comp = weekComps[sIdx] || '';
              const aList = getActivitiesForSubtopic(weekTopic, st, comp, currentSyllabus, formData.grade, formData.subject);
              aList.forEach(a => {
                if (!actsList.includes(a)) actsList.push(a);
              });
            });
          }
          if (actsList.length === 0 && weekComps.length > 0) {
            weekComps.forEach((c, cIdx) => {
              const sub = weekSubs[cIdx] || '';
              const aList = deriveLearningActivitiesFromCompetency(c, sub, weekTopic);
              aList.forEach(a => {
                if (!actsList.includes(a)) actsList.push(a);
              });
            });
          }
          if (actsList.length === 0 && weekTopic) {
            const aList = getActivitiesForSubtopic(weekTopic, '', undefined, currentSyllabus, formData.grade, formData.subject);
            aList.forEach(a => {
              if (!actsList.includes(a)) actsList.push(a);
            });
          }
        }

        if (isAssessmentWeek) {
          const testAct = w.week === 4 
            ? "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 1-4" 
            : "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 5-8";
          if (!actsList.some(a => a.toLowerCase().includes("monthly assessment") || a.toLowerCase().includes("written test"))) {
            actsList.push(testAct);
          }
        }
      }

      if (stdsList.length > 0 || actsList.length > 0) {
        hasChanges = true;
        const formattedStd = stdsList.length > 1
          ? stdsList.map((s, i) => `${i + 1}. ${s}`).join('')
          : stdsList[0];
        const formattedAct = actsList.length > 1
          ? actsList.map((a, i) => `${i + 1}. ${a}`).join('')
          : actsList[0];

        return {
          ...w,
          expectedStandards: formattedStd ? [formattedStd] : w.expectedStandards,
          activities: formattedAct ? [formattedAct] : w.activities
        };
      }
      return w;
    });

    if (hasChanges) {
      setFormData(prev => ({ ...prev, weeks: updatedWeeks }));
    }
  }, [formData.type, formData.weeks, currentSyllabus, formData.topic, formData.grade, formData.subject]);

  const generateActivitiesFromLabel = (_label: string): string[] => {
    // Generic activity generator is completely disabled to enforce 100% authentic syllabus data
    return [];
  };

  const partitionActivitiesByCompetencies = (
    activities: string[],
    competencies: string[],
    targetComp: string
  ): string[] => {
    if (!activities || activities.length === 0) return [];
    if (!competencies || competencies.length <= 1) return activities;

    // 1. Identify which competency index in competencies targetComp corresponds to
    const briefTarget = parseRawCompetency(targetComp).briefCompetency || targetComp;
    const cleanTarget = briefTarget
      .toLowerCase()
      .replace(/^(specific\s*(competency|competencies|outcome|outcomes):\s*)/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    const codeTargetMatch = targetComp.match(/\b(\d+(?:\.\d+)+)\b/);
    const codeTarget = codeTargetMatch ? codeTargetMatch[1] : '';

    let targetIdx = competencies.findIndex(c => {
      const cStr = typeof c === 'string' ? c : String(c);
      const cCodeMatch = cStr.match(/\b(\d+(?:\.\d+)+)\b/);
      if (codeTarget && cCodeMatch && codeTarget === cCodeMatch[1]) {
        return true;
      }
      const cBrief = parseRawCompetency(cStr).briefCompetency || cStr;
      const cClean = cBrief
        .toLowerCase()
        .replace(/^(specific\s*(competency|competencies|outcome|outcomes):\s*)/i, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      return cClean && (cClean === cleanTarget || cClean.includes(cleanTarget) || cleanTarget.includes(cClean));
    });

    if (targetIdx === -1) {
      const targetWords = briefTarget.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
      targetIdx = competencies.findIndex(c => {
        const cClean = (typeof c === 'string' ? c : String(c)).toLowerCase();
        return targetWords.length > 0 && targetWords.some(w => cClean.includes(w));
      });
    }

    if (targetIdx === -1) {
      return [];
    }

    // Check if target competency has embedded activities
    const targetCompStr = competencies[targetIdx];
    if (targetCompStr) {
      const parsedTarget = parseRawCompetency(targetCompStr);
      if (parsedTarget.learningActivities && parsedTarget.learningActivities.length > 0) {
        return parsedTarget.learningActivities;
      }
    }

    const STOPWORDS = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were',
      'use', 'using', 'used', 'ways', 'variety', 'show', 'showing', 'different',
      'appropriately', 'correctly', 'accordingly', 'life', 'daily', 'context',
      'contexts', 'demonstrate', 'demonstrating', 'apply', 'applying', 'explore',
      'exploring', 'exhibit', 'exhibiting', 'investigate', 'investigating',
      'analyse', 'analysing', 'analyze', 'analyzing', 'prevent', 'preventing',
      'identify', 'identifying', 'things', 'such'
    ]);

    const totalComps = competencies.length;
    const totalActs = activities.length;

    const compWordSets: string[][] = competencies.map(c => {
      const brief = parseRawCompetency(typeof c === 'string' ? c : String(c)).briefCompetency || String(c);
      const baseWords = brief
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOPWORDS.has(w));
      return baseWords;
    });

    // Unique keywords per competency (words not shared across multiple competencies)
    const uniqueCompWordSets: string[][] = compWordSets.map((words, idx) => {
      const otherWords = new Set<string>();
      compWordSets.forEach((ow, oIdx) => {
        if (oIdx !== idx) {
          ow.forEach(w => otherWords.add(w));
        }
      });
      return words.filter(w => !otherWords.has(w));
    });

    // Calculate proportional slice for monotonic syllabus progression
    const startIdx = Math.floor((targetIdx / totalComps) * totalActs);
    const endIdx = targetIdx === totalComps - 1 ? totalActs : Math.floor(((targetIdx + 1) / totalComps) * totalActs);
    const sliceActs = activities.slice(startIdx, Math.max(startIdx + 1, endIdx));

    // Find activities matching unique keywords for this competency
    const myUniqueWords = uniqueCompWordSets[targetIdx] || [];
    const matchedActs = activities.filter(act => {
      const aLower = act.toLowerCase();
      return myUniqueWords.some(w => aLower.includes(w));
    });

    // Gather other competencies' unique keywords to strictly forbid leaking
    const otherUniqueWords = new Set<string>();
    uniqueCompWordSets.forEach((uw, idx) => {
      if (idx !== targetIdx) {
        uw.forEach(w => otherUniqueWords.add(w));
      }
    });

    const combined = Array.from(new Set([...matchedActs, ...sliceActs]));
    // Exclude activities that strictly belong to another competency
    const strictlyFiltered = combined.filter(act => {
      const aLower = act.toLowerCase();
      const matchesOther = Array.from(otherUniqueWords).some(ow => aLower.includes(ow));
      const matchesMine = myUniqueWords.some(mw => aLower.includes(mw));
      if (matchesOther && !matchesMine) return false;
      return true;
    });

    if (strictlyFiltered.length > 0 && strictlyFiltered.length < totalActs) {
      return strictlyFiltered;
    }

    return sliceActs.length > 0 ? sliceActs : [activities[Math.min(targetIdx, totalActs - 1)]];
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
      (targetSubject.toLowerCase().includes('english') || targetSubject.toLowerCase().includes('literacy') || targetSubject.toLowerCase().includes('oral'));
    if (isEngGr12) {
      const engTopics = getEnglishTopics();
      if (Array.isArray(engTopics.oral) && engTopics.oral.length > 0) candidateSyllabi.push(engTopics.oral);
      if (Array.isArray(engTopics.literacy) && engTopics.literacy.length > 0) candidateSyllabi.push(engTopics.literacy);
      if (SYLLABI['Grade 1 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 1 (CBC)']['English']);
      if (SYLLABI['Grade 2 (CBC)']?.['English']) candidateSyllabi.push(SYLLABI['Grade 2 (CBC)']['English']);
      candidateSyllabi.push(englishGrade1Literacy, englishGrade1Oral, englishGrade2Literacy, englishGrade2Oral);
    }

    if (SYLLABI[targetGrade]?.[targetSubject]) {
      candidateSyllabi.push(SYLLABI[targetGrade][targetSubject]);
    }

    const selectedComps = competencyTitle
      ? competencyTitle.split('\n').map(c => {
          let trimmed = c.trim();
          trimmed = trimmed.replace(/^(specific\s*(competency|competencies|outcome|outcomes):\s*)/i, '');
          return trimmed;
        }).filter(Boolean)
      : [];

    const getMatchingActivitiesForSubtopic = (st: any): string[] => {
      let explicitActs: string[] = [];

      // Priority 1: Check if any selected competency itself has embedded learning activities
      if (selectedComps.length > 0) {
        for (const comp of selectedComps) {
          const parsed = parseRawCompetency(comp);
          if (parsed.learningActivities && parsed.learningActivities.length > 0) {
            explicitActs.push(...parsed.learningActivities);
          }
        }
        if (explicitActs.length > 0) {
          return formatActivities(explicitActs);
        }
      }

      // Priority 1.5: Check if matched competency in st.competencies has embedded learning activities
      if (selectedComps.length > 0 && Array.isArray(st.competencies)) {
        selectedComps.forEach(comp => {
          const briefComp = parseRawCompetency(comp).briefCompetency || comp;
          const compClean = cleanKey(briefComp.replace(/^\d+(\.\d+)*\s*/, ''));
          const compCode = (comp.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];

          const matchedComp = st.competencies.find((c: any) => {
            const cStr = typeof c === 'string' ? c : String(c);
            const cCode = (cStr.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
            if (compCode && cCode && compCode === cCode) return true;
            const cBrief = parseRawCompetency(cStr).briefCompetency || cStr;
            const cClean = cleanKey(cBrief.replace(/^\d+(\.\d+)*\s*/, ''));
            return cClean && (cClean === compClean || cClean.includes(compClean) || compClean.includes(cClean));
          });
          if (matchedComp) {
            const embedded = extractEmbeddedLearningActivities(matchedComp);
            if (embedded.length > 0) {
              explicitActs.push(...embedded);
            }
          }
        });
        if (explicitActs.length > 0) {
          return formatActivities(explicitActs);
        }
      }

      // Priority 2: Check object-based learning activities on the subtopic
      if (st.learningActivities && !Array.isArray(st.learningActivities) && typeof st.learningActivities === 'object') {
        if (selectedComps.length > 0) {
          const matchedActs: string[] = [];
          selectedComps.forEach(comp => {
            const briefComp = parseRawCompetency(comp).briefCompetency || comp;
            const compClean = cleanKey(briefComp.replace(/^\d+(\.\d+)*\s*/, ''));
            const compCode = (comp.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
            const matchedKey = Object.keys(st.learningActivities).find(k => {
              const kCode = (k.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
              if (compCode && kCode && compCode === kCode) return true;
              const kBrief = parseRawCompetency(k).briefCompetency || k;
              const keyClean = cleanKey(kBrief.replace(/^\d+(\.\d+)*\s*/, ''));
              return keyClean && (keyClean === compClean || keyClean.includes(compClean) || compClean.includes(keyClean));
            });
            if (matchedKey && Array.isArray(st.learningActivities[matchedKey])) {
              matchedActs.push(...st.learningActivities[matchedKey]);
            }
          });
          explicitActs = matchedActs;
        } else {
          explicitActs = Object.values(st.learningActivities).flat() as string[];
        }
      } else if (Array.isArray(st.learningActivities) && st.learningActivities.length > 0) {
        if (selectedComps.length === 0) {
          explicitActs = st.learningActivities.every((act: any) => typeof act === 'string')
            ? st.learningActivities
            : st.learningActivities.flat();
        } else {
          const matchedActs: string[] = [];
          selectedComps.forEach(comp => {
            const briefComp = parseRawCompetency(comp).briefCompetency || comp;
            const compClean = cleanKey(briefComp.replace(/^\d+(\.\d+)*\s*/, ''));
            const compCode = (comp.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];

            if (Array.isArray(st.competencies) && st.learningActivities.some((act: any) => Array.isArray(act))) {
              const idx = st.competencies.findIndex((c: any) => {
                const cStr = String(c);
                const cCode = (cStr.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
                if (compCode && cCode && compCode === cCode) return true;
                return cleanKey(cStr).includes(compClean) || compClean.includes(cleanKey(cStr));
              });
              if (idx !== -1 && Array.isArray(st.learningActivities[idx])) {
                matchedActs.push(...st.learningActivities[idx]);
              }
            } else if (Array.isArray(st.competencies) && st.competencies.length > 1 && st.learningActivities.every((act: any) => typeof act === 'string')) {
              const partitioned = partitionActivitiesByCompetencies(st.learningActivities, st.competencies, comp);
              matchedActs.push(...partitioned);
            } else if (Array.isArray(st.competencies) && st.competencies.length === 1 && st.learningActivities.every((act: any) => typeof act === 'string')) {
              matchedActs.push(...st.learningActivities);
            }
          });
          explicitActs = matchedActs;
        }
      }

      // Priority 3: Check embedded learning activities inside st.competencies if explicit list is empty
      if (explicitActs.length === 0 && Array.isArray(st.competencies)) {
        if (selectedComps.length > 0) {
          selectedComps.forEach(comp => {
            const briefComp = parseRawCompetency(comp).briefCompetency || comp;
            const compClean = cleanKey(briefComp.replace(/^\d+(\.\d+)*\s*/, ''));
            const compCode = (comp.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];

            const matchedComp = st.competencies.find((c: any) => {
              const cStr = typeof c === 'string' ? c : String(c);
              const cCode = (cStr.match(/\b(\d+(?:\.\d+)+)\b/) || [])[1];
              if (compCode && cCode && compCode === cCode) return true;
              const cBrief = parseRawCompetency(cStr).briefCompetency || cStr;
              const cClean = cleanKey(cBrief.replace(/^\d+(\.\d+)*\s*/, ''));
              return cClean && (cClean === compClean || cClean.includes(compClean) || compClean.includes(cClean));
            });
            if (matchedComp) {
              const embedded = extractEmbeddedLearningActivities(matchedComp);
              if (embedded.length > 0) {
                explicitActs.push(...embedded);
              }
            }
          });
        } else {
          const embedded = extractEmbeddedLearningActivities(st.competencies);
          if (embedded.length > 0) {
            explicitActs = embedded;
          }
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
          activities: ['', ''],
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

  // Helper to split content into up to 5 days
  const splitContentIntoDays = (content: string, numDays: number = 5): string[] => {
    if (!content) return Array(numDays).fill('');
    const parts = content.split(/[•*•\n.;]+/).filter(part => part.trim().length > 5);
    if (parts.length === 0) return Array(numDays).fill(content);
    
    // Distribute parts across days
    const result: string[] = [];
    for (let i = 0; i < numDays; i++) {
      result.push(parts[i % parts.length] || parts[0]);
    }
    return result;
  };

  // Helper to fetch all official Zambian CDC learning activities for a given day in Weekly Forecast
  // strictly isolated by that day's Subtopic and Specific Competency
  const getWeeklyForecastLearningActivitiesForDay = (day: any, dayIdx: number) => {
    const dayTopic = day.topic || formData.topic || '';
    const daySub = day.subtopic || formData.subtopic || '';
    const dayComp = (day.competency || '').trim();

    // STRICT ISOLATION:
    // If no specific competency is selected for this day, DO NOT show learning activities.
    // Dropdown will prompt the user to select the specific competency first.
    if (!dayComp) {
      return {
        currentDayActs: [],
        weekOtherActs: []
      };
    }

    const currentDayActs: string[] = [];
    if (dayTopic && daySub) {
      const direct = getActivitiesForSubtopic(dayTopic, daySub, dayComp, currentSyllabus, formData.grade, formData.subject);
      direct.forEach(a => { if (a && !currentDayActs.includes(a)) currentDayActs.push(a); });
    }

    if (currentDayActs.length === 0) {
      const embedded = extractEmbeddedLearningActivities(dayComp);
      embedded.forEach(a => { if (a && !currentDayActs.includes(a)) currentDayActs.push(a); });
    }

    if (currentDayActs.length === 0) {
      const compActs = deriveLearningActivitiesFromCompetency(dayComp, daySub, dayTopic);
      compActs.forEach(a => { if (a && !currentDayActs.includes(a)) currentDayActs.push(a); });
    }

    return {
      currentDayActs,
      weekOtherActs: [] // Strictly isolated per subtopic/competency - no mixing activities from other subtopics
    };
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
                             formData.englishCombined &&
                             formData.englishPreparationMode !== 'normal';

      const isEnglishGr12Combined = (targetGrade.includes('Grade 1') || targetGrade.includes('Grade 2')) && 
                             formData.subject.toLowerCase().includes('english') && 
                             formData.englishCombined &&
                             formData.englishPreparationMode !== 'normal';

      const isECE = targetGrade.toLowerCase().includes('ece');
      const eceBreakWeek = formData.eceMidTermBreakWeek || 7;
      const specialWeeks = isECE ? [eceBreakWeek, 12, 13] : [12, 13];
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

        const teachingWeeks = formData.weeks?.filter(w => !specialWeeks.includes(w.week) && !w.isAssessment) || [];
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
            return w;
          }

          if (w.isAssessment) {
            return {
              ...w,
              topic: 'MONTHLY ASSESSMENT',
              subtopics: ['Continuous Assessment'],
              competencies: ['Evaluate monthly progress'],
              activities: [
                w.week === 4 
                  ? "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 1-4" 
                  : "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 5-8"
              ],
              expectedStandards: ["Learners' knowledge and competencies assessed against CBC performance indicators"],
              component: autoDeriveComponent('MONTHLY ASSESSMENT', formData.subject)
            };
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
              weekActivities.push(''); // No auto-fill for activities
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
              weekActivities[oralCount - 1] += `; `;
            }
          }

          // Distribute literacy items into the slots
          for (let i = 0; i < litCount; i++) {
            if (myLit && myLit[i]) {
              weekSubtopics.push(myLit[i].subtopic);
              weekCompetencies.push(myLit[i].competency);
              weekActivities.push('');
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
              weekActivities[4] += `; `;
            }
          }

          const engStds: string[] = [];
          weekSubtopics.filter(Boolean).forEach(st => {
            const stds = getExpectedStandardsForSubtopic(weekTopic1 || weekTopic2, st, currentSyllabus);
            stds.forEach(s => {
              if (!engStds.includes(s)) engStds.push(s);
            });
          });
          const formattedEngStds = engStds.length > 1
            ? engStds.map((s, i) => `${i + 1}. ${s}`).join('')
            : (engStds[0] || '');

          return {
            ...w,
            topic: weekTopic1 || weekTopic2,
            topic2: weekTopic2 || weekTopic1,
            component: autoDeriveComponent(weekTopic1 || weekTopic2, formData.subject),
            subtopics: weekSubtopics,
            competencies: weekCompetencies,
            expectedStandards: formattedEngStds ? [formattedEngStds] : [],
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
          effectiveStartTopic,
          formData.selectedTopics
        );
      }

      setFormData(prev => {
        let teachingIndex = 0;
        const newWeeks = prev.weeks?.map(w => {
          if (specialWeeks.includes(w.week)) {
            let specTopic = w.topic || '';
            let specSubs = w.subtopics || [];
            if (w.week === 12) {
              specTopic = "Revisions";
              specSubs = ["Revision of Term Topics & Remedial Exercises"];
            } else if (w.week === 13) {
              specTopic = "End of Term Test";
              specSubs = ["End of Term Examinations"];
            } else if (isECE && w.week === eceBreakWeek) {
              specTopic = "Mid-Term Break";
              specSubs = ["Mid-Term Break Activities & Review"];
            }
            return {
              ...w,
              topic: specTopic,
              subtopics: specSubs
            };
          }

          if (w.isAssessment) {
            if (isOBCLanguageScheme) {
              return {
                ...w,
                topic: 'MONTHLY ASSESSMENT',
                component: autoDeriveComponent('MONTHLY ASSESSMENT', prev.subject) || 'Language',
                subtopics: [],
                competencies: ['Evaluate monthly progress and concept mastery in ' + (autoDeriveComponent('MONTHLY ASSESSMENT', prev.subject) || 'Language')],
                activities: [
                  w.week === 4 
                    ? "1. Monthly continuous assessment written test on topics covered in Weeks 1-42. Evaluating learner scripts and diagnosing learning gaps" 
                    : "1. Monthly continuous assessment written test on topics covered in Weeks 5-82. Evaluating learner scripts and diagnosing learning gaps"
                ],
                expectedStandards: []
              };
            }
            return {
              ...w,
              topic: 'MONTHLY ASSESSMENT',
              subtopics: ['Continuous Assessment'],
              competencies: ['Evaluate monthly progress'],
              activities: [
                w.week === 4 
                  ? "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 1-4" 
                  : "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 5-8"
              ],
              expectedStandards: ["Learners' knowledge and competencies assessed against CBC performance indicators"],
              component: autoDeriveComponent('MONTHLY ASSESSMENT', prev.subject)
            };
          }

          const syllabusItem = mainSequence[teachingIndex++];
          if (syllabusItem) {
            const mainTopic = stripPageNumbers(syllabusItem.topic);
            if (isOBCLanguageScheme) {
              const outcomes = getOBCOutcomesForTopic(mainTopic);
              const know = getOBCKnowledgeForTopic(mainTopic);
              let formattedKnow = know.length > 1
                ? know.map((k, i) => `${i + 1}. ${k}`).join('')
                : (know[0] || '');

              if (w.week === 4 || w.week === 8) {
                const testAct = w.week === 4
                  ? "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 1-4"
                  : "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 5-8";
                formattedKnow = formattedKnow ? `${formattedKnow}${testAct}` : testAct;
              }

              return {
                ...w,
                topic: mainTopic,
                component: autoDeriveComponent(mainTopic, prev.subject) || 'Listening & Speaking',
                subtopics: [],
                competencies: outcomes.length > 0 ? outcomes : [],
                expectedStandards: [],
                activities: formattedKnow ? [formattedKnow] : []
              };
            }
            const subs = (Array.isArray(syllabusItem.subtopics) && syllabusItem.subtopics.length > 0 
              ? syllabusItem.subtopics 
              : [syllabusItem.subtopics?.[0] || '']).map((s: string) => stripPageNumbers(s));
            
            const comps = subs.map(s => {
              const c = getCompetenciesForSubtopic(mainTopic, s, currentSyllabus);
              return c[0] || '';
            });

            const stdsList: string[] = [];
            subs.forEach(s => {
              const stList = getExpectedStandardsForSubtopic(mainTopic, s, currentSyllabus);
              stList.forEach(item => {
                if (!stdsList.includes(item)) stdsList.push(item);
              });
            });

            const actsList: string[] = [];
            subs.forEach((s, si) => {
              const a = getActivitiesForSubtopic(mainTopic, s, comps[si], currentSyllabus);
              a.forEach(act => {
                if (act && !actsList.includes(act)) actsList.push(act);
              });
            });

            let formattedStandards = stdsList.length > 1
              ? stdsList.map((st, i) => `${i + 1}. ${st}`).join('')
              : (stdsList[0] || '');

            let formattedActs = actsList.length > 1
              ? actsList.map((a, i) => /^\d+[\.\)]/.test(a) ? a : `${i + 1}. ${a}`).join('')
              : (actsList[0] || '');

            if (w.week === 4 || w.week === 8) {
              const testStd = prev.curriculumType === 'OBC'
                ? "Learners' skills and knowledge assessed against OBC performance standards"
                : "Learners' knowledge and competencies assessed against CBC performance indicators";
              
              const testAct = w.week === 4
                ? "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 1-4"
                : "Monthly Assessment: Continuous assessment written test on topics covered in Weeks 5-8";

              formattedStandards = formattedStandards ? `${formattedStandards}${testStd}` : testStd;
              formattedActs = formattedActs ? `${formattedActs}${testAct}` : testAct;
            }

            return {
              ...w,
              topic: mainTopic,
              component: autoDeriveComponent(mainTopic, prev.subject),
              subtopics: subs,
              competencies: comps,
              expectedStandards: formattedStandards ? [formattedStandards] : [],
              activities: formattedActs ? [formattedActs] : []
            };
          }
          return {
            ...w,
            topic: "Revisions",
            subtopics: ["Revision of Term Topics & Remedial Exercises"],
            competencies: ["Consolidate core competencies and address learning gaps from term topics"],
            expectedStandards: [
              "1. Mastery of term competencies demonstrated through revision exercises2. Key concepts consolidated across covered topics"
            ],
            activities: [
              "1. Reviewing key topics and subtopics in collaborative study groups2. Solving practice exercises and revision questions3. Receiving targeted teacher feedback and remediation"
            ]
          };
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

  // Draft full expected standards throughout the Schemes of Work table across selected range
  const handleDraftAllExpectedStandards = () => {
    if (!formData.grade || !formData.subject) {
      toast.error("Please select a Grade and Subject first");
      return;
    }

    try {
      const targetGrade = formData.grade;
      const isECE = targetGrade.toLowerCase().includes('ece');
      const eceBreakWeek = formData.eceMidTermBreakWeek || 7;
      const specialWeeks = isECE ? [eceBreakWeek, 12, 13] : [12, 13];

      const effectiveStartTopic = formData.topic || (formData.weeks && formData.weeks[0]?.topic) || '';
      const effectiveStoppingTopic = formData.stoppingTopic || '';

      // Slice syllabus topics within the selected range or marked topics
      const slicedTopics = filterSyllabusForSchemes(currentSyllabus, effectiveStartTopic, effectiveStoppingTopic, formData.selectedTopics);

      if (!slicedTopics || slicedTopics.length === 0) {
        toast.error("No matching syllabus topics found for this range.");
        return;
      }

      if (isOBCLanguageScheme) {
        let topicPtr = 0;
        const newWeeks = (formData.weeks || []).map((w) => {
          if (specialWeeks.includes(w.week)) {
            const currentAct = (Array.isArray(w.activities) ? w.activities[0] : (w.activities as any)) || '';
            let a = currentAct;
            if (!a.trim()) {
              if (w.week === 4 || w.week === 8) {
                a = "1. Administering continuous assessment tasks2. Evaluating learner scripts and practical work3. Conducting feedback and remedial exercises";
              } else if (w.week === 12) {
                a = "1. Reviewing challenging topics in collaborative groups2. Practicing past examination questions and problem-solving3. Individual remedial guidance";
              } else if (w.week === 13) {
                a = "1. Administering summative end-of-term examination2. Marking scripts and compiling learner progress reports";
              }
            }
            return {
              ...w,
              expectedStandards: [],
              activities: a ? [a] : w.activities
            };
          }

          if (w.isAssessment) {
            return {
              ...w,
              topic: 'MONTHLY ASSESSMENT',
              component: autoDeriveComponent('MONTHLY ASSESSMENT', formData.subject) || 'Language',
              subtopics: [],
              competencies: ['Evaluate monthly progress and concept mastery in ' + (autoDeriveComponent('MONTHLY ASSESSMENT', formData.subject) || 'Language')],
              expectedStandards: [],
              activities: [
                w.week === 4
                  ? "1. Administering written continuous assessment on topics covered in Weeks 1-42. Marking scripts and assessing learner comprehension"
                  : "1. Administering written continuous assessment on topics covered in Weeks 5-82. Marking scripts and assessing learner comprehension"
              ]
            };
          }

          if (w.week !== 1 && !specialWeeks.includes(w.week) && !w.isAssessment) {
            // CRITICAL MINISTRY RULE: Do not automatically fill weeks 2-13
            if (!w.topic && slicedTopics[topicPtr]) {
               topicPtr++;
            }
            return w;
          }

          const targetTopic = w.topic || (slicedTopics[topicPtr]?.title || slicedTopics[topicPtr]?.topic) || '';
          if (!w.topic && slicedTopics[topicPtr]) {
            topicPtr++;
          }

          const cleanTopic = stripPageNumbers(targetTopic);
          const comp = w.component || autoDeriveComponent(cleanTopic, formData.subject) || (formData.subject.toLowerCase().includes('zambian') ? 'Listening & Speaking' : 'Listening & Speaking');
          const outcomes = getOBCOutcomesForTopic(cleanTopic);
          const know = getOBCKnowledgeForTopic(cleanTopic);

          const formattedOutcomes = outcomes.length > 0 ? outcomes : (w.competencies || []);
          const formattedKnow = know.length > 1
            ? know.map((k, ki) => `${ki + 1}. ${k}`).join('')
            : (know[0] || (Array.isArray(w.activities) ? w.activities[0] : w.activities) || '');

          return {
            ...w,
            topic: cleanTopic || w.topic || 'Language Study',
            component: comp,
            subtopics: [],
            competencies: formattedOutcomes,
            expectedStandards: [],
            activities: formattedKnow ? [formattedKnow] : []
          };
        });

        setFormData(prev => ({ ...prev, weeks: newWeeks }));
        toast.success("All weeks' knowledge & specific outcomes synced from syllabus!");
        return;
      }

      // Flatten subtopics with their parent topic, syllabus expected standards, and learning activities
      const subtopicList: { topic: string; subtopic: string; expectedStandards: string[]; activities: string[] }[] = [];
      slicedTopics.forEach((t: any) => {
        const topicTitle = stripPageNumbers(t.title || t.topic || '');
        const rawSubs = Array.isArray(t.subtopics) ? t.subtopics : [];
        rawSubs.forEach((st: any) => {
          const subTitle = stripPageNumbers(typeof st === 'string' ? st : (st.title || ''));
          const stds = getExpectedStandardsForSubtopic(topicTitle, subTitle, currentSyllabus);
          const acts = getActivitiesForSubtopic(topicTitle, subTitle, undefined, currentSyllabus, formData.grade, formData.subject);
          subtopicList.push({
            topic: topicTitle,
            subtopic: subTitle,
            expectedStandards: stds,
            activities: acts
          });
        });
      });

      const teachingWeeks = (formData.weeks || []).filter(w => !specialWeeks.includes(w.week));
      const nTeaching = Math.max(1, teachingWeeks.length);

      const perWeek = 2;
      let remainder = 0;
      let ptr = 0;

      const newWeeks = (formData.weeks || []).map((w) => {
        if (specialWeeks.includes(w.week)) {
          const currentStd = (Array.isArray(w.expectedStandards) ? w.expectedStandards[0] : (w.expectedStandards as any)) || '';
          const currentAct = (Array.isArray(w.activities) ? w.activities[0] : (w.activities as any)) || '';
          let s = currentStd;
          let a = currentAct;

          if (!s.trim()) {
            if (w.week === 4 || w.week === 8) {
              s = "1. Learners' knowledge and competencies assessed against CBC performance indicators2. Learning gaps identified for targeted remediation";
            } else if (w.week === 12) {
              s = "1. Consolidation and mastery of all term concepts demonstrated2. Challenging competencies reviewed and reinforced";
            } else if (w.week === 13) {
              s = "1. Comprehensive term assessment completed accurately according to national curriculum standards";
            }
          }
          if (!a.trim()) {
            if (w.week === 4 || w.week === 8) {
              a = "1. Administering continuous assessment tasks2. Evaluating learner scripts and practical work3. Conducting feedback and remedial exercises";
            } else if (w.week === 12) {
              a = "1. Reviewing challenging subtopics in collaborative groups2. Practicing past examination questions and problem-solving3. Individual remedial guidance";
            } else if (w.week === 13) {
              a = "1. Administering summative end-of-term examination2. Marking scripts and compiling learner progress reports";
            }
          }

          return {
            ...w,
            expectedStandards: s ? [s] : w.expectedStandards,
            activities: a ? [a] : w.activities
          };
        }

        if (w.week !== 1 && !specialWeeks.includes(w.week) && !w.isAssessment) {
          // CRITICAL MINISTRY RULE: Do not automatically fill weeks 2-13
          const takeCount = Math.min(subtopicList.length - ptr, perWeek + (remainder > 0 ? 1 : 0));
          if (remainder > 0) remainder--;
          ptr += Math.max(1, takeCount);
          return w;
        }

        const existingSubs = (w.subtopics || []).map(s => stripPageNumbers(s)).filter(Boolean);
        let standardsForWeek: string[] = [];
        let activitiesForWeek: string[] = [];

        if (existingSubs.length > 0) {
          existingSubs.forEach((st, sIdx) => {
            const comp = w.competencies?.[sIdx] || '';
            const stds = getExpectedStandardsForSubtopic(w.topic, st, currentSyllabus);
            stds.forEach(s => {
              if (!standardsForWeek.includes(s)) standardsForWeek.push(s);
            });
            const acts = getActivitiesForSubtopic(w.topic, st, comp, currentSyllabus, formData.grade, formData.subject);
            acts.forEach(act => {
              if (!activitiesForWeek.includes(act)) activitiesForWeek.push(act);
            });
          });
        }

        const updatedW = { ...w };

        // If no standards or activities found from existing inputs or table row is not yet filled, use the sliced syllabus range sequence
        if (standardsForWeek.length === 0) {
          if (subtopicList.length > 0 && ptr < subtopicList.length) {
            const takeCount = Math.min(subtopicList.length - ptr, perWeek + (remainder > 0 ? 1 : 0));
            if (remainder > 0) remainder--;
            const chunk = subtopicList.slice(ptr, ptr + Math.max(1, takeCount));
            ptr += Math.max(1, takeCount);

            chunk.forEach(item => {
              item.expectedStandards.forEach(s => {
                if (!standardsForWeek.includes(s)) standardsForWeek.push(s);
              });
              item.activities.forEach(act => {
                if (!activitiesForWeek.includes(act)) activitiesForWeek.push(act);
              });
            });

            // Also fill topic & subtopics if empty in this row
            if (!updatedW.topic && chunk[0]) {
              updatedW.topic = chunk[0].topic;
            }
            if ((!updatedW.subtopics || updatedW.subtopics.length === 0 || !updatedW.subtopics[0]) && chunk.length > 0) {
              updatedW.subtopics = chunk.map(c => c.subtopic);
              updatedW.competencies = chunk.map(c => {
                const comps = getCompetenciesForSubtopic(c.topic, c.subtopic, currentSyllabus);
                return comps[0] || '';
              });
            }
          } else {
            // Syllabus range topics exhausted -> Revisional week
            if (!updatedW.topic || updatedW.topic.trim() === '' || updatedW.topic.toLowerCase().includes('select topic')) {
              updatedW.topic = "Revisions";
              updatedW.subtopics = ["Revision of Term Topics & Remedial Exercises"];
              updatedW.competencies = ["Consolidate core competencies and address learning gaps from term topics"];
            }
            standardsForWeek.push("1. Mastery of term competencies demonstrated through revision exercises2. Key concepts consolidated across covered topics");
            activitiesForWeek.push("1. Reviewing key topics and subtopics in collaborative study groups2. Solving practice exercises and revision questions3. Receiving targeted teacher feedback and remediation");
          }
        }

        // Format standards and activities
        const formattedStd = standardsForWeek.length > 1
          ? standardsForWeek.map((s, i) => `${i + 1}. ${s}`).join('')
          : (standardsForWeek[0] || '');

        const formattedAct = activitiesForWeek.length > 1
          ? activitiesForWeek.map((a, i) => `${i + 1}. ${a}`).join('')
          : (activitiesForWeek[0] || '');

        updatedW.expectedStandards = formattedStd ? [formattedStd] : updatedW.expectedStandards;
        updatedW.activities = formattedAct ? [formattedAct] : updatedW.activities;
        return updatedW;
      });

      setFormData(prev => ({ ...prev, weeks: newWeeks }));
      toast.success("All expected standards & learning activities synced from syllabus across the range!");
    } catch (err) {
      console.error("Error drafting expected standards and activities:", err);
      toast.error("Failed to draft expected standards & learning activities.");
    }
  };

  const renderGeneralRegistrationSection = () => {
    const isRegistered = !!(formData.teacherName || formData.school || formData.tsNumber);

    return (
      <div className="space-y-3 mb-6">
        {/* Fixed Small Information Center Tab Bar on top of General Information block */}
        <InformationCenter 
          toolType={formData.type}
          toolTitle={selectedTemplate?.title}
          customText={lastGeneratedContent ? lastGeneratedContent.replace(/<[^>]+>/g, '') : undefined}
          subscriptionDetails={subscriptionDetails}
          isUserGuestTier={isUserGuestTier}
          usageCounts={usageCounts}
          registeredGrades={registeredGrades}
        />

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
                {isRegistered && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Registered Profile
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                {isRegistered 
                  ? `Registered Profile: ${formData.teacherName || 'Teacher'} • ${formData.school || 'School'} (${formData.district || 'District'} District) • Year: ${formData.year || '2026'}${formData.term ? ` • Term: ${formData.term}` : ''}${formData.forecastWeek ? ` • Week: ${formData.forecastWeek}` : ''}${isIWP ? `${formData.jobTitle ? ` • ${formData.jobTitle}` : ''} • Period: ${formData.workPlanPeriodStart || 'JANUARY'} TO ${formData.workPlanPeriodEnd || 'DECEMBER'}` : ''}${!isAdmin && formData.grade ? ` • Grade: ${formData.grade}` : ''}` 
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

              {/* Term & Year Parameters for standard planning in General Profile block */}
              {!isIWP && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TERM</label>
                    <select
                      name="term"
                      value={formData.term || '1'}
                      onChange={handleInputChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
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
    </div>
  );
};

  const renderPreparationMethodsGuide = () => {
    const guidance = getDocGuidanceInfo(formData.type, getDocTypeTitle(formData.type));
    const methods = guidance.methods || [];

    return (
      <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-3xl p-5 mb-6 text-left shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                {guidance.badge}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">
                {guidance.header}
              </h4>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shrink-0 self-start sm:self-auto">
            {methods.length} Methods Available
          </span>
        </div>

        <p className="text-xs font-medium text-slate-700 leading-relaxed">
          {guidance.description}
        </p>

        {/* Numbered Methods Cards Grid */}
        <div className={cn(
          "grid grid-cols-1 gap-2.5",
          methods.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : methods.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        )}>
          {methods.map((method) => {
            const colorStyles = {
              blue: {
                badge: 'bg-blue-600 text-white',
                border: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50',
                title: 'text-blue-950',
                desc: 'text-blue-800/80',
                hint: 'text-blue-700 bg-blue-100/60'
              },
              emerald: {
                badge: 'bg-emerald-600 text-white',
                border: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
                title: 'text-emerald-950',
                desc: 'text-emerald-800/80',
                hint: 'text-emerald-700 bg-emerald-100/60'
              },
              indigo: {
                badge: 'bg-indigo-600 text-white',
                border: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50',
                title: 'text-indigo-950',
                desc: 'text-indigo-800/80',
                hint: 'text-indigo-700 bg-indigo-100/60'
              },
              purple: {
                badge: 'bg-purple-600 text-white',
                border: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50',
                title: 'text-purple-950',
                desc: 'text-purple-800/80',
                hint: 'text-purple-700 bg-purple-100/60'
              },
              amber: {
                badge: 'bg-amber-600 text-white',
                border: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
                title: 'text-amber-950',
                desc: 'text-amber-800/80',
                hint: 'text-amber-700 bg-amber-100/60'
              }
            }[method.color || 'blue'];

            return (
              <div 
                key={method.number} 
                className={cn(
                  "p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-2xs",
                  colorStyles.border
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs", colorStyles.badge)}>
                      {method.number}
                    </span>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", colorStyles.title)}>
                      METHOD {method.number}
                    </span>
                  </div>
                  <h5 className={cn("text-xs font-bold leading-snug", colorStyles.title)}>
                    {method.name}
                  </h5>
                  <p className={cn("text-[11px] font-medium leading-relaxed", colorStyles.desc)}>
                    {method.description}
                  </p>
                </div>
                {method.actionHint && (
                  <span className={cn("text-[9.5px] font-semibold px-2 py-1 rounded-lg mt-1 block leading-tight", colorStyles.hint)}>
                    👉 {method.actionHint}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10.5px] text-slate-500 font-medium italic border-t border-slate-200/60 pt-2 flex items-center gap-1.5">
          <span>ℹ️</span>
          <span>{guidance.subnote}</span>
        </p>
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
        {/* Teaching Timetable Redirect Tab & Optional Connection Toggle (Rendered on top of schemes only) */}
        {formData.type === 'schemes_of_work' && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A86B] text-white flex items-center justify-center font-black shrink-0 shadow-sm text-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Teaching Timetable (Class Timetable)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                    3-Month System Retention
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Set once in 3 months in Smart Planning to align weekly activities (5, 4, 3, or 2 days) and filter Weekly Forecasts & Lesson Plans.
                </p>
                {isConnectTimetable && activeTimetableSchedule && (
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    ✓ Timetable Active for {formData.subject || 'Subject'}: {activeTimetableSchedule.days.join(', ')} ({activeTimetableSchedule.days.length} days/week &bull; &ge; {activeTimetableSchedule.minActivities} activities)
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-auto">
              {/* Optional Connect to Timetable Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-500">Connect to Timetable:</span>
                <button
                  type="button"
                  onClick={() => handleToggleConnectTimetable(!isConnectTimetable)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    isConnectTimetable ? 'bg-[#00A86B]' : 'bg-slate-300'
                  }`}
                  title="Toggle connecting schemes to your 3-month teaching timetable"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isConnectTimetable ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Detach timetable logic toggle (default OFF) */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="text-[10px] font-black uppercase text-slate-500">Detach timetable logic:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isDetachTimetableLogic;
                    setIsDetachTimetableLogic(nextVal);
                    if (nextVal) {
                      toast("Timetable logic detached for schemes planning.", { icon: "ℹ️" });
                    } else {
                      toast.success("Timetable logic attached and active for schemes planning!");
                    }
                  }}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    isDetachTimetableLogic ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  title="Toggle detaching timetable logic for schemes of work (Default OFF)"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isDetachTimetableLogic ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('smart_planning')}
                className="px-3.5 py-2 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <span>Set in Smart Planning</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {termMismatchNotice && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-tight text-amber-900 flex items-center gap-2">
                  <span>⚠️ Teaching Module Term Mismatch Refusal</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9.5px] font-bold">Action Suggested</span>
                </h4>
                <p className="text-xs font-medium text-amber-800 leading-relaxed">
                  The scanned or selected teaching module ({termMismatchNotice.sourceName || 'uploaded file'}) is specifically designed for <strong>Term {termMismatchNotice.detectedTerm}</strong>, but you currently have <strong>Term {termMismatchNotice.selectedTerm}</strong> selected in the drop-down. Modules are designed to be taught termly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, term: termMismatchNotice.detectedTerm }));
                  setTermMismatchNotice(null);
                  toast.success(`Term drop-down updated to Term ${termMismatchNotice.detectedTerm} to match module!`);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Switch Drop-Down to Term {termMismatchNotice.detectedTerm}
              </button>
              <button
                type="button"
                onClick={() => setTermMismatchNotice(null)}
                className="px-3 py-2 bg-white hover:bg-amber-100/60 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all active:scale-95"
              >
                Dismiss & Keep Term {termMismatchNotice.selectedTerm}
              </button>
            </div>
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

          {(formData.grade?.includes('Grade 1') || formData.grade?.includes('Grade 2')) && (
            <div className="col-span-1 sm:col-span-2 space-y-4 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-300">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Grade 1 & 2 Configuration</label>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-2">English Preparation Mode</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className={`flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2.5 bg-white border ${formData.englishPreparationMode === 'normal' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200'} rounded-xl hover:border-blue-300 transition-colors flex-1`}>
                      <input
                        type="radio"
                        name="englishPreparationMode"
                        checked={formData.englishPreparationMode === 'normal'}
                        onChange={() => setFormData(prev => ({ ...prev, englishPreparationMode: 'normal', englishCombined: false, englishComponent: undefined, subject: '' }))}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Normal English</span>
                    </label>
                    <label className={`flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2.5 bg-white border ${formData.englishPreparationMode === 'separate' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200'} rounded-xl hover:border-blue-300 transition-colors flex-1`}>
                      <input
                        type="radio"
                        name="englishPreparationMode"
                        checked={formData.englishPreparationMode === 'separate'}
                        onChange={() => setFormData(prev => ({ ...prev, englishPreparationMode: 'separate', englishCombined: false, englishComponent: 'oral', subject: '' }))}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Oral &amp; Literacy in English (Separate Preparations)</span>
                    </label>
                  </div>
                </div>

                {(formData.type === 'schemes_of_work') && (
                  <div>
                    <p className="text-xs text-slate-600 font-semibold mb-2">Topic Grouping Strategy (English & Zambian Languages)</p>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer p-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={formData.groupTopicsByTerm !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, groupTopicsByTerm: e.target.checked }))}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4 rounded"
                      />
                      <div className="flex flex-col">
                        <span>Group Topics by Term</span>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">Uncheck to treat all topics across terms equally.</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
            
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
                    englishCombined: isGrade12 && isCombinedEnglish && prev.englishPreparationMode !== 'normal',
                    englishComponent: isLiteracy ? 'literacy' : (isOral ? 'oral' : (isCombinedEnglish && prev.englishPreparationMode !== 'normal' ? 'combined' : prev.englishComponent))
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
        {formData.grade && formData.grade.toLowerCase().includes("ece") && (
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
                    <select
                      name="lessonNumber"
                      value={formData.lessonNumber || "1"}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm cursor-pointer"
                    >
                      <option value="">Select Lesson...</option>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num.toString()}>
                          Lesson {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WEEK NUMBER</label>
                    <select
                      name="lessonWeekNumber"
                      value={formData.lessonWeekNumber || "1"}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white shadow-sm cursor-pointer"
                    >
                      <option value="">Select Week...</option>
                      {Array.from({ length: 13 }, (_, i) => i + 1).map((wk) => (
                        <option key={wk} value={wk.toString()}>
                          Week {wk}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Outside Source Forecast Content Banner for Lesson Plan */}
                {isPastedOutsideSchemes(formData.additionalContext) && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={18} className="text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-indigo-950 uppercase tracking-wide">Pasted Weekly Forecast Detected</p>
                        <p className="text-[11px] font-medium text-indigo-700">Click to extract Week {formData.lessonWeekNumber || 1}, Lesson {formData.lessonNumber || 1}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const weekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
                        const dayNum = Number(formData.lessonNumber) || 1;
                        const lessonData = extractLessonFromPastedForecastText(formData.additionalContext, dayNum, weekNum, formData.grade, formData.subject, formData.curriculumType);
                        if (lessonData) {
                          setFormData(prev => ({
                            ...prev,
                            topic: lessonData.topic || prev.topic,
                            subtopic: lessonData.subtopic || prev.subtopic,
                            specificCompetences: safeString(lessonData.competency || prev.specificCompetences),
                            knowledge: safeString(lessonData.knowledge || prev.knowledge || ''),
                            activities: lessonData.learningActivities?.length > 0 ? lessonData.learningActivities : prev.activities,
                            teachingAids: lessonData.teachingAids || prev.teachingAids,
                            references: lessonData.references || prev.references
                          }));
                          setIsLessonContentDetailsVisible(true);
                          toast.success(`Populated Lesson Plan (Week ${weekNum}, Day ${dayNum}) from pasted content!`);
                        } else {
                          toast.error(`Could not locate Week ${weekNum} Day ${dayNum} in pasted text.`);
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Populate Lesson (W{formData.lessonWeekNumber || 1}, D{formData.lessonNumber || 1})
                    </button>
                  </div>
                )}

                {/* Synced / Extracted Lesson Preview Card */}
                {(formData.topic || formData.subtopic) && (
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Active Lesson Details (Week {formData.lessonWeekNumber || 1}, Lesson {formData.lessonNumber || 1})
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        Loaded
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 space-y-1">
                      <p><span className="text-emerald-700 font-extrabold">Topic:</span> {formData.topic || 'N/A'}</p>
                      {formData.subtopic && <p><span className="text-emerald-700 font-extrabold">Subtopic:</span> {formData.subtopic}</p>}
                      {formData.specificCompetences && <p className="line-clamp-2 text-[11px] text-slate-600 font-medium"><span className="text-emerald-700 font-extrabold">Competencies:</span> {formData.specificCompetences}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>
    );
  };

  const handleGenerate = async (overlapChoiceMade: boolean | React.MouseEvent = false) => {
    const isSubscriptionExpiredForUser = !isUserEmailDeveloper && !!subscriptionDetails?.isSubscriptionExpired;
    if (isSubscriptionExpiredForUser) {
      setError("Your subscription circle period has expired. Please renew your subscription circle to continue generating documents.");
      toast.error("Subscription Period Expired");
      return;
    }

    // Unactivated guest users can generate and preview any document type on screen without limits, but cannot download files.
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

    // Directly proceed to generation without unnecessary verification step for Oral/Literacy English
    setIsGenerating(true);
    setLoading(true);
    setError(null);

    const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
    const combinedReferenceContent = selectedModules.length > 0 
      ? selectedModules.map(m => `--- MODULE: ${m.name}${m.category ? ` (${m.category})` : ''} ---${m.content}`).join('')
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
- You MUST format this date range as: "**Week X**<br/><small>(${formData.termStartDate ? '{dateRange}' : ''})</small>" where you replacement the computed date range for that week, e.g. "07-09-2026 to 15-05-2026".
- If a Zambian public holiday falls during that week, you MUST explicitly state the holiday date and name separate from the week text inside the "WEEK" column. Use format: "<br/><small><b>({holidayDate} - {holidayName})</b></small>".
- Here are the pre-computed dates and holidays for the 13-week term starting on ${formData.termStartDate}:
${weeksInfo.map(w => `  * Week ${w.weekNum}: Date range "${w.dateRange}"${w.holidays && w.holidays.length > 0 ? `, Holidays: ${w.holidays.join(' and ')}` : ''}`).join('')}
- STRICT COLUMN RULE: These date ranges and public holiday tags MUST be written inside the "WEEK" column cells, standing separate from the main week names/numbers using <br/> tags.
`;
        } else if (formData.type === 'weekly_forecast') {
          const weeksInfo = formData.termStartDate ? calculateTermDates(formData.termStartDate, 13) : [];
          const weekIdx = (formData.forecastWeek || 1) - 1;
          const weekData = weeksInfo[weekIdx];
          const daysWithCustomDates = formData.forecastDays || [];
          const hasAnyDates = daysWithCustomDates.some(d => d.date && d.date.trim() !== '') || !!formData.termStartDate;
          
          if (hasAnyDates) {
            datesContext = `
IMPORTANT ZAMBIAN CALENDAR & HOLIDAYS INSTRUCTIONS:
- You MUST indicate the specific date for each day in the "DAY" column of the Weekly Forecast table.
- You MUST format each day as: "**Day X**<br/><small>({dateStr})</small>" where Day X is from Day 1 to Day 5, and {dateStr} is the date for that day (e.g., 21-09-2026).
- If a day is a public holiday, you MUST explicitly state the holiday name inside the "DAY" column cell separate from the day name using <br/>. Format: "<br/><small><b>({holidayName})</b></small>".
- Here are the specific dates configured for this 5-day cycle:
${daysWithCustomDates.map((day, idx) => {
  const dVal = day.date || (weekData && weekData.days[idx] ? weekData.days[idx].dateStr : '');
  const hol = (weekData && weekData.days[idx] && weekData.days[idx].holiday) ? weekData.days[idx].holiday : '';
  return `  * Day ${day.day || idx + 1}: Date "${dVal}"${hol ? `, Holiday: "${hol}"` : ''}`;
}).join('\n')}
- STRICT COLUMN RULE: These dates and public holiday tags MUST be written inside the "DAY" column cells of the Weekly Forecast table, standing separate from the Day number/name using a <br/> tag.
`;
          }
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

        const isWeeklyForecast = formData.type === 'weekly_forecast';
        const isLessonPlan = formData.type === 'lesson_plan';
        const targetForecastWeek = Number(formData.forecastWeek) || 1;
        const lessonWeekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
        const lessonDayNum = Number(formData.lessonNumber) || 1;

        const extractedLessonFromContext = (isLessonPlan && formData.additionalContext && isPastedOutsideSchemes(formData.additionalContext))
          ? extractLessonFromPastedForecastText(formData.additionalContext, lessonDayNum, lessonWeekNum, formData.grade, formData.subject, formData.curriculumType)
          : null;

        // Parse pasted schemes from instruction box (additionalContext) for weekly forecast
        const parsedSchemesFromContext = formData.additionalContext ? parsePastedSchemesTextToWeeks(formData.additionalContext, formData.grade, formData.subject) : [];
        const pastedWeekData = (isWeeklyForecast && parsedSchemesFromContext.length > 0)
          ? matchStrictWeekFromSchemes(parsedSchemesFromContext, targetForecastWeek)
          : null;

        const targetWeekObj = isWeeklyForecast && formData.weeks ? formData.weeks.find((w: any) => Number(w.week) === targetForecastWeek) : null;
        const weekTargetTopic = isWeeklyForecast 
          ? (pastedWeekData?.topic || (formData.forecastDays && formData.forecastDays[0]?.topic && formData.forecastDays[0]?.topic !== 'EXPLORING MATERIALS' ? formData.forecastDays[0]?.topic : null) || targetWeekObj?.topic || formData.topic || '')
          : '';

        const sourceWeekData: any = pastedWeekData || targetWeekObj;

        const effectiveForecastDays = (isWeeklyForecast && sourceWeekData)
          ? [1, 2, 3, 4, 5].map((dNum, dIdx) => {
              const existing = ((formData.forecastDays && formData.forecastDays[dIdx]) || {}) as any;
              const rawSubs = Array.isArray(sourceWeekData.subtopics)
                ? sourceWeekData.subtopics.filter((s: string) => s && s.trim() !== '')
                : (sourceWeekData.subtopics ? [String(sourceWeekData.subtopics)] : []);
              const numSubs = rawSubs.length || 1;
              const subIndices = getSubtopicIndicesForDays(numSubs, formData.forecastDays?.length || 5);
              const subIndex = subIndices[dIdx] || 0;
              const sub = rawSubs[subIndex] || rawSubs[0] || existing.subtopic || '';
              const comp = sourceWeekData.competencies?.[subIndex] || sourceWeekData.competencies?.[0] || existing.competency || '';
              const dayAct = sourceWeekData.activities?.[dIdx % (sourceWeekData.activities?.length || 1)] || sourceWeekData.activities?.[0] || '';
              const aidsList = (sourceWeekData.teachingAids || '').split(';').map((a: string) => a.trim()).filter(Boolean);
              const dayAid = aidsList[subIndex] || aidsList[0] || sourceWeekData.teachingAids || existing.teachingAids || '';
              const dayMethods = (sourceWeekData.methods && sourceWeekData.methods[subIndex]) || (sourceWeekData.methods && sourceWeekData.methods[0]) || (sourceWeekData.methods && sourceWeekData.methods.length > 0 ? sourceWeekData.methods.join(' • ') : '') || existing.teachingMethods || '• Demonstration • Practical activity • Question and answer • Class discussion';

              return {
                ...existing,
                day: dNum.toString(),
                topic: sourceWeekData.topic || existing.topic || weekTargetTopic,
                subtopic: sub,
                competency: comp,
                knowledge: sourceWeekData.knowledge?.[subIndex] || existing.knowledge || '',
                skills: sourceWeekData.skills?.[subIndex] || existing.skills || '',
                values: sourceWeekData.values?.[subIndex] || existing.values || '',
                expectedStandard: sourceWeekData.expectedStandards?.[subIndex] || existing.expectedStandard || '',
                teachingMethods: dayMethods,
                activities: dayAct ? [dayAct] : (existing.activities || []),
                teachingAids: dayAid,
                references: sourceWeekData.references || existing.references || ''
              };
            })
          : formData.forecastDays;

        let finalForecastDays = isWeeklyForecast && effectiveForecastDays
          ? enrichForecastDaysWithSyllabus(effectiveForecastDays, formData.grade, formData.subject, curriculumType)
          : effectiveForecastDays;

        // If timetable is connected, filter forecast days strictly by scheduled days
        if (isWeeklyForecast && isConnectTimetable && activeTimetableSchedule && Array.isArray(finalForecastDays)) {
          finalForecastDays = finalForecastDays.filter(fd => {
            const dayName = (fd.day || '').trim();
            return activeTimetableSchedule.days.some(schedDay => dayName.toLowerCase().includes(schedDay.toLowerCase()));
          });
        }

        const effectiveStartTopic = isWeeklyForecast
          ? weekTargetTopic
          : (formData.topic || (formData.weeks && formData.weeks[0]?.topic) || '');
        const effectiveStoppingTopic = isWeeklyForecast
          ? weekTargetTopic
          : (formData.stoppingTopic || '');

        const effectiveSyllabus = (formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast')
          ? filterSyllabusForSchemes(currentSyllabus, effectiveStartTopic, effectiveStoppingTopic, formData.selectedTopics)
          : currentSyllabus;

        const hasExplicitMarkedTopics = (formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast') && formData.selectedTopics && formData.selectedTopics.length > 0;
        const hasPastedOutsideSchemes = isPastedOutsideSchemes(formData.additionalContext);

        const effectiveWeeksForDoc = (formData.type === 'schemes_of_work')
          ? (() => {
              if (hasPastedOutsideSchemes && formData.additionalContext) {
                const parsed = parsePastedSchemesTextToWeeks(formData.additionalContext, formData.grade, formData.subject);
                if (parsed && parsed.length >= 3) {
                  return parsed.map((pw, idx) => ({
                    week: pw.week || (idx + 1),
                    topic: pw.topic || '',
                    subtopics: pw.subtopics || [],
                    competencies: pw.competencies || [],
                    activities: pw.activities || [],
                    expectedStandards: pw.expectedStandards || [],
                    methods: pw.methods || [],
                    teachingAids: pw.teachingAids || '',
                    references: pw.references || ''
                  }));
                }
              }
              return (formData.weeks && formData.weeks.length >= 13 ? formData.weeks : (() => {
                const full13 = createDefaultWeeks(formData.grade || 'Grade 1 (CBC)', 13);
                if (formData.weeks && formData.weeks.length > 0 && formData.weeks[0]) {
                  full13[0] = { ...full13[0], ...formData.weeks[0] };
                }
                return full13;
              })());
            })()
          : formData.weeks;

        finalDoc = await generateEducationalDoc({
          ...formData,
          weeks: effectiveWeeksForDoc,
          forecastDays: finalForecastDays,
          topic: (isLessonPlan && extractedLessonFromContext?.topic) ? extractedLessonFromContext.topic : (effectiveStartTopic || formData.topic),
          subtopic: (isLessonPlan && extractedLessonFromContext?.subtopic) ? extractedLessonFromContext.subtopic : formData.subtopic,
          specificCompetences: (isLessonPlan && extractedLessonFromContext?.competency) ? safeString(extractedLessonFromContext.competency) : formData.specificCompetences,
          knowledge: (isLessonPlan && extractedLessonFromContext?.knowledge) ? safeString(extractedLessonFromContext.knowledge) : formData.knowledge,
          learningActivities: (isLessonPlan && extractedLessonFromContext?.learningActivities && extractedLessonFromContext.learningActivities.length > 0) ? extractedLessonFromContext.learningActivities : formData.activities,
          teachingAids: (isLessonPlan && extractedLessonFromContext?.teachingAids) ? extractedLessonFromContext.teachingAids : formData.teachingAids,
          teachingMethods: (isLessonPlan && extractedLessonFromContext?.teachingMethods) 
            ? (Array.isArray(extractedLessonFromContext.teachingMethods) 
                ? extractedLessonFromContext.teachingMethods 
                : String(extractedLessonFromContext.teachingMethods).split(/[,;]/).map(s => s.trim()).filter(Boolean)) 
            : formData.teachingMethods,
          stoppingTopic: effectiveStoppingTopic || formData.stoppingTopic,
          references: (isLessonPlan && extractedLessonFromContext?.references) ? extractedLessonFromContext.references : (formData.references || (finalForecastDays && finalForecastDays[0]?.references) || ''),
          questionCounts: effectiveQuestionCounts,
          curriculumType,
          type: formData.type as DocType,
          officialSyllabusData: effectiveSyllabus,
          referenceModuleContent: combinedReferenceContent,
          additionalContext: `
            ${formData.additionalContext || ''}
            ${extractedLessonFromContext ? `
            ### AUTHORITATIVE PASTED LESSON PLAN CONTENT FOR WEEK ${lessonWeekNum}, DAY ${lessonDayNum} (FROM INSTRUCTION BOX):
            The user has pasted a Weekly Forecast or Scheme of Work in the instruction box. You MUST generate the Lesson Plan specifically for Week ${lessonWeekNum}, Day ${lessonDayNum} using this extracted lesson content:
            - TOPIC: "${extractedLessonFromContext.topic || formData.topic || 'Syllabus Topic'}"
            - SUBTOPIC: "${extractedLessonFromContext.subtopic || formData.subtopic || 'Syllabus Subtopic'}"
            - SPECIFIC OUTCOME / COMPETENCY: "${extractedLessonFromContext.competency || formData.specificCompetences || 'Syllabus Outcome'}"
            - EXPECTED STANDARD / KNOWLEDGE: "${extractedLessonFromContext.expectedStandard || extractedLessonFromContext.knowledge || 'Syllabus Standard'}"
            - LEARNING ACTIVITIES: "${extractedLessonFromContext.learningActivities?.join('; ') || 'Class discussion, group work, individual practice'}"
            - TEACHING METHODS: "${extractedLessonFromContext.teachingMethods || 'Exposition, Demonstration, Group Work'}"
            - T/L AIDS: "${extractedLessonFromContext.teachingAids || 'Chalkboard, Chart, Textbooks'}"
            - REFERENCES: "${extractedLessonFromContext.references || 'Zambian Syllabus'}"

            CRITICAL MANDATE: Base the entire Lesson Plan on this Day ${lessonDayNum} content!
            ` : ''}
            ${sourceWeekData ? `
            ### AUTHORITATIVE SCHEME OF WORK CONTENT FOR WEEK ${targetForecastWeek}:
            The Scheme of Work for Week ${targetForecastWeek} contains:
            - TOPIC: "${sourceWeekData.topic}"
            - SUBTOPICS: "${sourceWeekData.subtopics?.join(', ') || 'N/A'}"
            - SPECIFIC COMPETENCIES / OUTCOMES: "${sourceWeekData.competencies?.join(', ') || 'N/A'}"
            - KNOWLEDGE: "${sourceWeekData.knowledge?.join('; ') || 'N/A'}"
            - SKILLS: "${sourceWeekData.skills?.join('; ') || 'N/A'}"
            - VALUES: "${sourceWeekData.values?.join('; ') || 'N/A'}"
            - EXPECTED STANDARDS: "${sourceWeekData.expectedStandards?.join('; ') || 'N/A'}"
            - TEACHING METHODS: "${sourceWeekData.methods?.join(', ') || 'N/A'}"
            - T/L AIDS: "${sourceWeekData.teachingAids || 'N/A'}"
            - REFERENCES: "${sourceWeekData.references || 'N/A'}"

            ### CRITICAL MANDATE: EXHAUSTIVE MULTI-SUBTOPIC COVERAGE (ALL SUBTOPICS MUST BE INCLUDED):
            ALL SUBTOPICS present in Week ${targetForecastWeek} (${sourceWeekData.subtopics?.join(', ')}) MUST be included in the Weekly Forecast across Day 1 to Day 5 without leaving any subtopic out!
            ${sourceWeekData.subtopics && sourceWeekData.subtopics.length > 1 ? `
            - The week contains ${sourceWeekData.subtopics.length} distinct subtopics:
            ${sourceWeekData.subtopics.map((st: string, sIdx: number) => `  * Subtopic ${sIdx + 1}: "${st}"`).join('\n')}
            - You MUST allocate each subtopic to its assigned days:
            ${finalForecastDays.map((d: any) => `  * Day ${d.day}: Subtopic "${d.subtopic}", Outcome: "${d.competency}", Knowledge: "${d.knowledge}", Aids: "${d.teachingAids}"`).join('\n')}
            DO NOT collapse or repeat only the first subtopic across all 5 days!
            Every single subtopic above MUST be taught in its designated day(s)!
            ` : `ALL 5 days focus on "${sourceWeekData.subtopics?.[0] || sourceWeekData.topic}".`}
            ` : ''}
            ${formData.type === 'weekly_forecast' && finalForecastDays && finalForecastDays.length > 0 ? `
            ### MANDATORY SYNCED DAILY DETAILS & REFERENCES (WEEK ${targetForecastWeek}):
            - EXACT REFERENCES WITH PAGE NUMBERS: In the REFERENCE column for each day, you MUST preserve and output the exact reference text and page numbers: "${formData.references || finalForecastDays[0]?.references || 'Official Zambian Syllabus'}". Do NOT omit page numbers or replace them with generic text!
            - DAY DATES & DETAILS CONFIGURED:
${finalForecastDays.map(d => {
  const dAny = d as any;
  return `              * Day ${d.day} (${d.date || 'Configured Date'}): ${dAny.component ? `Component: "${dAny.component}", ` : ''}Topic: "${d.topic || effectiveStartTopic}", Subtopic: "${d.subtopic || ''}", Specific Outcome/Competency: "${d.competency || ''}"${d.expectedStandard ? `, Expected Standard: "${d.expectedStandard}"` : ''}${d.activities?.length ? `, Learning Activities: "${d.activities.join('; ')}"` : ''}${dAny.knowledge ? `, Knowledge: "${dAny.knowledge}"` : ''}${dAny.skills ? `, Skills: "${dAny.skills}"` : ''}${dAny.values ? `, Values: "${dAny.values}"` : ''}${dAny.teachingMethods ? `, Teaching Methods: "${dAny.teachingMethods}"` : ''}, Teaching Aids: "${d.teachingAids || formData.teachingAids || ''}", Reference: "${d.references || formData.references || ''}"`;
}).join('\n')}
            ` : ''}
            ${isPastedWeeklyForecast(formData.additionalContext) ? `
            ### CRITICAL MANDATE: INTELLECTUAL ALLOCATION OF PASTED WEEKLY FORECAST & SYLLABUS FIDELITY:
            The user has provided an authentic Weekly Forecast document or table.
            - CELL & COLUMN ALLOCATION (STRICT FIDELITY): Every piece of information must be allocated to its designated column and row without shifting columns, modifying headings, or scrambling cells.
            - Day 1 data MUST go to Day 1 row, Day 2 to Day 2, Day 3 to Day 3, Day 4 to Day 4, and Day 5 to Day 5.
            - In each row: Day in DAY, (Component in COMP if present), TOPIC and Subtopics in TOPIC/Subtopics, Specific Outcome/Competency in SPECIFIC COMPETENCIES (or SPECIFIC OUTCOMES), Expected Standards in EXPECTED STANDARDS, Learning Activities in LEARNING ACTIVITIES (or if OBC: Knowledge in KNOWLEDGE, Skills in SKILLS, Values in VALUES), Teaching Methods in TEACHING METHODS, T/L Aids in T/L AIDS, References in REFERENCE, and Record of Work kept blank/clean for handwritten remarks.
            - SYLLABUS SOURCING FOR MISSING DATA (MANDATORY): If any data (such as EXPECTED STANDARDS, LEARNING ACTIVITIES, COMPETENCIES, METHODS, AIDS, or REFERENCES) is missing from the provided input, you MUST use the official Zambian Syllabus in this prompt to fill the missing data based on the content provided. E.g., EXPECTED STANDARDS must be sourced exactly based on the content provided!
            - ZERO COLUMN INJECTION: DO NOT inject unrequested columns like COMP unless the pasted text contains COMP or combined mode is active.
            ` : (hasPastedOutsideSchemes ? `
            ### CRITICAL MANDATE: TRUTHFUL OUTSIDE SOURCE SCHEMES OF WORK (AUTHORITATIVE EXTERNAL PLAN):
            The user has pasted schemes of work information from an outside source in the instructions box.
            - ABSOLUTE TRUTHFULNESS: The information in this document MUST be truthful and MUST be gotten the exact way information is pasted from that outside source!
            - EXACT ORDER PRESERVATION: If generating Schemes of Work, you MUST follow the EXACT SAME ORDER, weeks (Week 1, Week 2 up to Week 13), topics, subtopics, competencies, and learning activities as prepared by the outsider source!
            - FOR WEEKLY FORECAST (WEEK ${targetForecastWeek} ONLY): You MUST extract the content for Week ${targetForecastWeek} the exact way it is pasted from the outside source. ZERO cross-week mixing: ALL days of this weekly forecast MUST be derived exclusively from Week ${targetForecastWeek}. If Expected Standards are missing in the scheme, source them directly from the official syllabus for that topic!
            - ZERO OVERRIDES: DO NOT substitute with other syllabus topics or alter the outsider source sequence.
            ` : '')}
            ${(formData.type === 'schemes_of_work' || formData.type === 'weekly_forecast') ? (curriculumType === 'OBC' ? 'IMPORTANT (OBC): You MUST accurately draw Specific Outcomes, Knowledge, Skills, Values, Teaching Methods, T/L Aids, and References from the official OBC syllabus. For OBC Weekly Forecast, use SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE, and RECORD OF WORK columns (do NOT use Learning Activities or Expected Standards).' : 'IMPORTANT: You MUST directly draw all "EXPECTED STANDARDS" and "LEARNING ACTIVITIES" verbatim from the provided Syllabus data or associated module documents based on the content provided. Do NOT invent activities or expected standards that are not in the official curriculum provided in the context.') : ''}
            ${formData.type === 'weekly_forecast' ? `
            STRICT SINGLE-PAGE REQUIREMENT: The entire Weekly Forecast document (including headers, metadata, and all days of the table) MUST fit on EXACTLY ONE (1) A4 LANDSCAPE PAGE. Keep descriptions telegraphic and concise so the table never overflows onto page 2.
            
            ### CRITICAL MANDATE: STRICT SINGLE-WEEK ISOLATION (WEEK ${targetForecastWeek} ONLY):
            - STRICT SINGLE-WEEK ISOLATION: You are generating the Weekly Forecast EXCLUSIVELY and SOLELY for Week ${targetForecastWeek}.
            - EXCLUSIVE TOPIC: The ONLY topic permitted in this Weekly Forecast is "${weekTargetTopic || effectiveStartTopic}".
            - ZERO CROSS-WEEK MIXING: You are STRICTLY FORBIDDEN from including topics, subtopics, competencies, or knowledge from any other week.
            - ALL ${formData.forecastDays?.length || 5} DAYS (Day 1 to Day ${formData.forecastDays?.length || 5}) MUST focus on topic "${weekTargetTopic || effectiveStartTopic}" and include ALL its designated subtopics!
            - ZERO SUBTOPIC OMISSIONS: If Week ${targetForecastWeek} contains multiple subtopics, EVERY SINGLE SUBTOPIC present in this week MUST be included and distributed across the days of the Weekly Forecast table without leaving anything out!
            - If there are fewer subtopics than days in the week, expand or consolidate the subtopics across the days (e.g. practical practice, revision, problem solving, assessment on "${weekTargetTopic || effectiveStartTopic}"). NEVER pull topics from other weeks or future syllabus units!
            ` : ''}
            ${datesContext}
            ${(!hasPastedOutsideSchemes && formData.type === 'schemes_of_work') ? `
            IMPORTANT BOUNDARIES & COVERAGE FOR SCHEMES (ZERO TOLERANCE FOR OUTSIDE TOPICS):
            ${hasExplicitMarkedTopics ? `
            - STRICT MARKED TOPICS COMPLIANCE: The user has marked ${formData.selectedTopics!.length} specific topics for this term's schemes of work: ${formData.selectedTopics!.map(t => t.topic).join('; ')}.
            - ZERO OMISSIONS RULE: You MUST ensure that EVERY SINGLE MARKED TOPIC is included and taught in the scheme table. NO marked topic shall be left out or omitted from the scheme under any circumstances!
            - EXCLUSIVE SCOPE: Only include the marked topics. Do not introduce any topics that were not marked.
            ` : `
            - EXHAUSTIVE SUBTOPIC COVERAGE: You MUST exhaustively cover EVERY SINGLE subtopic of the starting topic first before moving to the next. You MUST strictly follow the numeric sequence in the syllabus. If there are many subtopics, combine them into the available weeks if necessary, but NEVER skip or miss any subtopic from the starting range.
            - EXCLUSIVE TOPIC SCOPE: You MUST ONLY include the topics strictly starting from initial topic "${effectiveStartTopic || 'Start'}" through to stopping topic "${effectiveStoppingTopic || 'End'}". Under NO circumstances generate, mention, or include any earlier topics or later topics outside this sequence!
            `}
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

        if (formData.type === 'weekly_forecast' && (!finalDoc || !finalDoc.includes('|') || finalDoc.split('\n').filter(l => l.trim().startsWith('|')).length < 4)) {
          const days = formData.forecastDays && formData.forecastDays.length > 0 ? formData.forecastDays : [];
          const school = (formData.school || '..........').toUpperCase();
          const district = (formData.district || 'MILENGE DISTRICT').toUpperCase();
          const teacher = formData.teacherName || '..........';
          const grade = formData.grade || '..........';
          const subject = formData.subject || '..........';
          const term = formData.term || '3';
          const week = formData.forecastWeek || '2';
          const year = formData.year || new Date().getFullYear().toString();

          const isOBC = curriculumType === 'OBC';
          const sLow = (subject || '').toLowerCase();
          const isLanguage = sLow.includes('english') || sLow.includes('zambian') || sLow.includes('literacy') || sLow.includes('oral');

          const gLowHeader = (grade || '').toLowerCase();
          const isSecondaryGrade = gLowHeader.includes('form') || gLowHeader.includes('grade 8') || gLowHeader.includes('grade 9') || gLowHeader.includes('grade 10') || gLowHeader.includes('grade 11') || gLowHeader.includes('grade 12') || gLowHeader.includes('junior sec') || gLowHeader.includes('senior sec');
          const headerTitleLabel = isSecondaryGrade ? 'RECORD OF WORK' : 'WEEKLY FORECAST';

          let fallbackMd = `<center>\n  <strong style="font-size: 14pt; text-transform: uppercase;">${district}</strong><br/>\n  <strong style="font-size: 14pt; text-transform: uppercase;">${school}</strong><br/>\n  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">${headerTitleLabel}</strong>\n</center>\n<br/>\n<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; font-family: 'Calibri', 'Arial', sans-serif; border-top: 2px solid black; border-bottom: 2px solid black;">\n  <tr style="border-bottom: 1px solid black;">\n    <td style="padding: 4px 6px; font-size: 10pt;"><strong>NAME OF TEACHER:</strong> ${teacher}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: center;"><strong>GRADE:</strong> ${grade}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: right;"><strong>SUBJECT:</strong> ${subject}</td>\n  </tr>\n  <tr>\n    <td style="padding: 4px 6px; font-size: 10pt;"><strong>YEAR/TERM:</strong> ${year} / TERM ${term}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: center;"><strong>WEEK:</strong> ${week}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: right;"><strong>SCHOOL:</strong> ${school}</td>\n  </tr>\n</table>\n<br/>\n\n`;

          if (isOBC) {
            fallbackMd += `| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |\n`;
            fallbackMd += `|---|---|---|---|---|---|---|---|---|---|\n`;
          } else {
            fallbackMd += `| DAY | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |\n`;
            fallbackMd += `|---|---|---|---|---|---|---|---|---|---|\n`;
          }

          const defaultProgression = [
            {
              std: `• Shapes/concepts identified and recognized using concrete objects.`,
              act: `• Recognising and identifying concepts using concrete and semi-concrete objects (circle, square, rectangle, numbers, models).`,
              meth: `• Practical activities<br/>• Group work`,
              aids: `• Concrete objects of various shapes<br/>• Shape cut-outs`
            },
            {
              std: `• Shapes/concepts sorted correctly according to given properties/criteria.`,
              act: `• Sorting and classifying concepts according to different properties and criteria.`,
              meth: `• Group work<br/>• Problem solving`,
              aids: `• Various shape objects<br/>• Shape cut-outs`
            },
            {
              std: `• Shapes/concepts manipulated and formed using diverse materials.`,
              act: `• Creating and manipulating concepts using various materials.`,
              meth: `• Practical activities<br/>• Peer learning`,
              aids: `• Playdough, clay, sticks, leaves`
            },
            {
              std: `• Regular and irregular shapes/structures successfully constructed.`,
              act: `• Making regular and irregular shapes/structures using different materials.`,
              meth: `• Practical activities<br/>• Group work`,
              aids: `• Playdough, clay, sticks, leaves, shape cut-outs`
            },
            {
              std: `• Shapes/concepts made using different materials appraised and understood according to criteria.`,
              act: `• Reviewing, displaying, and peer-assessing created shapes/models made from various materials.`,
              meth: `• Peer learning<br/>• Problem solving`,
              aids: `• Concrete objects of various shapes, playdough, clay, stick models`
            }
          ];

          const fallbackSourceDays = (effectiveForecastDays && effectiveForecastDays.length > 0) ? effectiveForecastDays : days;
          const activeDays = fallbackSourceDays.length > 0 ? fallbackSourceDays : [1, 2, 3, 4, 5].map(dNum => ({
            day: dNum,
            dayLabel: `Day ${dNum}`,
            topic: pastedWeekData?.topic || formData.topic || (formData.subject ? `${formData.subject} Topic` : 'Oral English'),
            subtopic: pastedWeekData?.subtopics?.[0] || formData.subtopic || (formData.subject ? `${formData.subject} Subtopic` : 'Listening & Speaking'),
            competency: pastedWeekData?.competencies?.[0] || formData.specificCompetences || 'Demonstrate understanding of specific outcomes',
          }));

          const ensureNumberPrefix = (textStr: string, defaultCode: string) => {
            if (!textStr) return `${defaultCode} Topic`;
            const clean = textStr.trim();
            if (/^\d+(?:\.\d+)*/.test(clean)) return clean;
            return `${defaultCode} ${clean}`;
          };

          activeDays.forEach((d: any, idx: number) => {
            const dayName = d.dayLabel || `Day ${d.day || idx + 1}`;
            const dateStr = d.date ? ` (${d.date})` : '';
            const dayCol = `${dayName}${dateStr}`;

            const prog = defaultProgression[idx % 5];

            const mainTop = d.topic || pastedWeekData?.topic || formData.topic || (formData.subject ? `${formData.subject} Topic` : 'Oral English');
            const subTop = d.subtopic || pastedWeekData?.subtopics?.[0] || formData.subtopic || (formData.subject ? `${formData.subject} Subtopic` : 'Listening & Speaking');

            const topicNumMatch = mainTop.match(/^\d+(?:\.\d+)*/);
            const topCode = topicNumMatch ? topicNumMatch[0] : '1.0';

            const subNumMatch = subTop.match(/^\d+(?:\.\d+)*/);
            const subCode = subNumMatch ? subNumMatch[0] : (topCode.endsWith('.0') ? topCode.replace(/\.0$/, '.1') : `${topCode}.1`);

            const mainTopNumbered = ensureNumberPrefix(mainTop, topCode);
            const subTopNumbered = ensureNumberPrefix(subTop, subCode);
            const topVal = subTop ? `**${mainTopNumbered}**<br/><small>${subTopNumbered}</small>` : mainTopNumbered;

            const compRaw = d.competency || pastedWeekData?.competencies?.[0] || formData.specificCompetences || 'Demonstrate understanding of concepts';
            const cleanCompText = compRaw.replace(/^•\s*/, '').trim();

            const compNumMatch = cleanCompText.match(/^\d+(?:\.\d+)*/);
            const dayCompCode = compNumMatch ? compNumMatch[0] : `${subCode}.${idx + 1}`;
            const numberedComp = ensureNumberPrefix(cleanCompText, dayCompCode);
            const specificVal = `• ${numberedComp}`;

            const stdVal = d.expectedStandard ? (d.expectedStandard.startsWith('•') ? d.expectedStandard : `• ${d.expectedStandard}`) : prog.std;

            const cleanActs = (d && Array.isArray(d.activities))
              ? d.activities.filter((a: any) => typeof a === 'string' && a.trim() !== '')
              : [];
            const actsList = cleanActs.length > 0
              ? cleanActs.map((a: string) => a.startsWith('•') ? a : `• ${a}`).join('<br/>')
              : prog.act;

            const knowVal = d.knowledge ? (d.knowledge.startsWith('•') ? d.knowledge : `• ${d.knowledge}`) : '• Core concepts and factual definitions';
            const skillVal = d.skills ? (d.skills.startsWith('•') ? d.skills : `• ${d.skills}`) : '• Practical skills and application';
            const valVal = d.values ? (d.values.startsWith('•') ? d.values : `• ${d.values}`) : '• Attentiveness, curiosity, and logical thinking';
            const methodVal = d.teachingMethods ? (d.teachingMethods.includes('<br/>') || d.teachingMethods.startsWith('•') ? d.teachingMethods : `• ${d.teachingMethods}`) : prog.meth;
            const aidVal = d.teachingAids ? (d.teachingAids.includes('<br/>') || d.teachingAids.startsWith('•') ? d.teachingAids : `• ${d.teachingAids}`) : prog.aids;
            const refVal = d.references || formData.references || `CBC ${grade} ${subject} Syllabus, Page: 103`;

            if (isOBC) {
              fallbackMd += `| ${dayCol} | ${topVal} | ${specificVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methodVal} | ${aidVal} | ${refVal} | |\n`;
            } else {
              fallbackMd += `| ${dayCol} | ${topVal} | ${specificVal} | ${stdVal} | ${actsList} | ${methodVal} | ${aidVal} | ${refVal} | |\n`;
            }
          });

          finalDoc = fallbackMd;
        }

        if (formData.type === 'schemes_of_work' && (!finalDoc || !finalDoc.includes('|') || finalDoc.split('\n').filter(l => l.trim().startsWith('|')).length < 4)) {
          const school = (formData.school || '..........').toUpperCase();
          const district = (formData.district || 'MILENGE DISTRICT').toUpperCase();
          const teacher = formData.teacherName || '..........';
          const grade = formData.grade || '..........';
          const subject = formData.subject || '..........';
          const term = formData.term || '1';
          const year = formData.year || new Date().getFullYear().toString();
          const isOBC = curriculumType === 'OBC';
          const sLow = (subject || '').toLowerCase();
          const isLanguage = sLow.includes('english') || sLow.includes('zambian') || sLow.includes('literacy') || sLow.includes('oral');

          let schemeHeaderMd = `<center>\n  <strong style="font-size: 14pt; text-transform: uppercase;">${district}</strong><br/>\n  <strong style="font-size: 14pt; text-transform: uppercase;">${school}</strong><br/>\n  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">SCHEME OF WORK</strong>\n</center>\n<br/>\n<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; font-family: 'Calibri', 'Arial', sans-serif; border-top: 2px solid black; border-bottom: 2px solid black;">\n  <tr style="border-bottom: 1px solid black;">\n    <td style="padding: 4px 6px; font-size: 10pt;"><strong>NAME OF TEACHER:</strong> ${teacher}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: center;"><strong>GRADE:</strong> ${grade}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: right;"><strong>SUBJECT:</strong> ${subject}</td>\n  </tr>\n  <tr>\n    <td style="padding: 4px 6px; font-size: 10pt;"><strong>YEAR/TERM:</strong> ${year} / TERM ${term}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: center;"><strong>TS NO:</strong> ${formData.tsNumber || '..........'}</td>\n    <td style="padding: 4px 6px; font-size: 10pt; text-align: right;"><strong>SCHOOL:</strong> ${school}</td>\n  </tr>\n</table>\n<br/>\n\n`;

          let tableHeader = '';
          if (isOBC) {
            tableHeader = isLanguage
              ? '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |\n|---|---|---|---|---|---|---|---|---|---|\n'
              : '| WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |\n|---|---|---|---|---|---|---|---|---|\n';
          } else {
            tableHeader = isLanguage
              ? '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |\n|---|---|---|---|---|---|---|---|---|\n'
              : '| WEEK | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |\n|---|---|---|---|---|---|---|---|\n';
          }

          const syllabusTopics = (currentSyllabus && currentSyllabus.length > 0) ? currentSyllabus : [];
          const rowsList: string[] = [];

          for (let w = 1; w <= 13; w++) {
            const weekLabel = `Week ${w}`;
            const refVal = `${isOBC ? 'OBC' : 'CBC'} ${grade} ${subject} Syllabus, Page: ..........`;

            if (w === 12) {
              const topVal = `**REVISION AND CONSOLIDATION**<br/><small>Term Concepts Review</small>`;
              const compVal = `• Review and consolidate all competencies taught across the term`;
              const stdVal = `• Learners demonstrate consolidated mastery of term competencies`;
              const actsVal = `• Revision exercises, peer study groups, working through sample questions`;
              const methVal = `• Group Work, Guided Problem Solving, Peer Review`;
              const aidsVal = `• Past question sheets, chalkboard, learner exercise books`;
              const knowVal = `• Consolidated principles, formulas, definitions, and rules`;
              const skillVal = `• Problem-solving, analytical review, and critical thinking`;
              const valVal = `• Diligence, perseverance, and confidence`;

              if (isOBC) {
                rowsList.push(isLanguage 
                  ? `| ${weekLabel} | Revision | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              } else {
                rowsList.push(isLanguage
                  ? `| ${weekLabel} | Revision | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              }
            } else if (w === 13) {
              const topVal = `**SUMMATIVE EVALUATION**<br/><small>End of Term Examination</small>`;
              const compVal = `• Assess learners' understanding and application of all term outcomes`;
              const stdVal = `• Learners successfully evaluated according to national curriculum standards`;
              const actsVal = `• Sitting for written end-of-term examination papers, practical assessments`;
              const methVal = `• Summative Assessment, Individual Seatwork`;
              const aidsVal = `• Examination papers, answer sheets, grading rubrics`;
              const knowVal = `• Comprehensive knowledge of all term curriculum content`;
              const skillVal = `• Examination readiness, evaluation, and independent performance`;
              const valVal = `• Integrity, honesty, and focus`;

              if (isOBC) {
                rowsList.push(isLanguage
                  ? `| ${weekLabel} | Assessment | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              } else {
                rowsList.push(isLanguage
                  ? `| ${weekLabel} | Assessment | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              }
            } else {
              const topicIndex = (w - 1) % Math.max(1, syllabusTopics.length);
              const syllabusTopic = syllabusTopics[topicIndex];
              const tTitle = syllabusTopic ? syllabusTopic.title : (formData.topic || `TOPIC ${w}`);
              const subList = (syllabusTopic && Array.isArray(syllabusTopic.subtopics) && syllabusTopic.subtopics.length > 0)
                ? syllabusTopic.subtopics
                : [];
              const subObj = subList[(w - 1) % Math.max(1, subList.length)];
              const subTitle = subObj ? (subObj.title || subObj) : (formData.subtopic || `Subtopic ${w}.1`);

              const rawComps = (subObj && Array.isArray(subObj.competencies) && subObj.competencies.length > 0)
                ? subObj.competencies
                : (formData.specificCompetences ? [formData.specificCompetences] : [`Demonstrate understanding of ${subTitle}`]);
              const rawActs = (subObj && Array.isArray(subObj.learningActivities) && subObj.learningActivities.length > 0)
                ? subObj.learningActivities
                : [`Guided practice and class investigation of ${subTitle}`, `Hands-on learner activities and written exercise`];
              const rawStd = (subObj && subObj.expectedStandard) || (subObj && Array.isArray(subObj.expectedStandards) && subObj.expectedStandards[0]) || `Learners apply ${subTitle} competencies accurately according to syllabus standards`;

              const topVal = `**${tTitle}**<br/><small>• ${subTitle}</small>`;
              const compVal = `• ${rawComps[0]}`;
              const stdVal = `• ${rawStd}`;
              const actsVal = rawActs.slice(0, 2).map((a: string) => a.startsWith('•') ? a : `• ${a}`).join('<br/>');
              const methVal = getVariedTeachingMethods(w - 1, String(subTitle));
              const aidsVal = getConciseTeachingAids(w - 1, String(subTitle));
              const compName = (w % 2 === 1) ? 'Listening & Speaking' : 'Reading & Writing';

              const knowVal = `• Key facts, definitions and concepts of ${subTitle}`;
              const skillVal = `• Identification, classification, and application of ${subTitle}`;
              const valVal = `• Curiosity, attentiveness, and teamwork`;

              if (isOBC) {
                rowsList.push(isLanguage
                  ? `| ${weekLabel} | ${compName} | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${knowVal} | ${skillVal} | ${valVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              } else {
                rowsList.push(isLanguage
                  ? `| ${weekLabel} | ${compName} | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`
                  : `| ${weekLabel} | ${topVal} | ${compVal} | ${stdVal} | ${actsVal} | ${methVal} | ${aidsVal} | ${refVal} |`);
              }
            }
          }

          finalDoc = schemeHeaderMd + tableHeader + rowsList.join('\n') + '\n';
        }

        if (finalDoc && (isAssessment || formData.type === 'lesson_plan') && (finalDoc.includes('<svg') || formData.includeVisuals !== false || formData.includeLessonDiagram !== false)) {
          try {
            const svgMatch = finalDoc.match(/<svg[\s\S]*?<\/svg>/i);
            if (svgMatch) {
              saveDiagramToAccount({
                title: `${formData.topic || formData.subject || 'Curriculum'} - ${formData.subtopic || 'Concept Diagram'}`,
                category: (formData.subject?.toLowerCase().includes('science') ? 'science' : formData.subject?.toLowerCase().includes('math') ? 'math' : 'general') as any,
                section: isAssessment ? 'Section A (MCQ)' : 'Lesson Plan',
                syllabusSubject: formData.subject || 'General Syllabus',
                grade: formData.grade || 'Grade 1-12',
                topic: formData.topic || formData.subject || 'Syllabus Topic',
                subtopic: formData.subtopic || 'General Concepts',
                svgContent: svgMatch[0],
                tags: [formData.subject || 'subject', formData.grade || 'grade', formData.topic || 'topic'],
                userEmail: user?.email || undefined
              }, user?.email || undefined);
            }
          } catch (diagErr) {
            console.warn("Failed auto-syncing generated diagram to account:", diagErr);
          }
        }
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
            timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
            metadata: {
              term: formData.term || "",
              teacherName: user.displayName || "",
            },
          };

          // Store strictly locally in localStorage for guests/trial to prevent Firebase writes
          const storedStr = safeLocalStorage.getItem('eduplan_downloads');
          const current: any[] = storedStr ? JSON.parse(storedStr) : [];
          const newDoc = {
            id: 'local_' + Date.now(),
            ...rawDoc
          };
          current.unshift(newDoc);
          safeLocalStorage.setItem('eduplan_downloads', JSON.stringify(current));

          if (refreshDownloads) {
            await refreshDownloads();
          }
        } catch (err) {
          console.error("Failed to automatically record trial generation quota:", err);
        }
      }

      onGenerate(finalDoc, formData);
      setLastGeneratedContent(finalDoc);
      setHasGenerated(false);
      
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



        <div className="space-y-3 pt-6 border-t border-blue-100">
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
        </div>

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
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 space-y-6 sm:space-y-8 pb-32 relative">
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
              <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">
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
    <>
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 space-y-6 sm:space-y-8 pb-32 relative">
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

      {/* Unsaved draft banner removed per user request */}

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

      {formData.type === 'syllabi' && (
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
      )}

      {isAssessment && (
        <div className="space-y-6">
          <InformationCenter 
            toolType={formData.type}
            toolTitle={selectedTemplate?.title}
            subscriptionDetails={subscriptionDetails}
            isUserGuestTier={isUserGuestTier}
            usageCounts={usageCounts}
            registeredGrades={registeredGrades}
          />
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
                        return isOBC && !['grade 1', 'grade 2', 'grade 4', 'grade 8', 'grade 9'].some(ex => g.toLowerCase().includes(ex));
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
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {t.component && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-red-500 bg-red-50 text-red-600 text-[11px] font-black tracking-wider uppercase shadow-2xs shrink-0">
                              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                              {t.component}
                            </span>
                          )}
                          <span className="font-bold text-blue-600 tracking-tight text-sm uppercase">{t.title}</span>
                        </div>
                      </div>
                      
                      {isSelected && t.subtopics && t.subtopics.length > 0 && (
                        <div className="p-4 pt-1 ml-6 relative">
                          <div className="absolute left-6 top-0 bottom-6 w-[2px] bg-emerald-200/50 rounded-full" />
                          <p className="text-[13px] text-slate-500 mb-4 ml-8 font-medium">Syllabus Sub-topics, Competencies & Standards:</p>
                          <div className="space-y-4 ml-8">
                            {t.subtopics.map((st, sidx) => {
                              const isSubSelected = selectedTopicNode?.subtopics.includes(st.title);
                              return (
                                <div key={sidx} className="space-y-2">
                                  <div 
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
                                    <span className="text-sm font-bold text-green-600 leading-tight">{st.title}</span>
                                  </div>

                                  {/* Render Specific Competencies, Learning Activities, and Expected Standards */}
                                  <div className="ml-8 space-y-2 text-xs border-l-2 border-slate-200 pl-3">
                                    {Array.isArray(st.competencies) && st.competencies.length > 0 && (
                                      <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-2.5 space-y-1">
                                        <div className="font-black text-blue-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                          Specific Competencies:
                                        </div>
                                        <ul className="list-none space-y-1 text-slate-800 font-medium">
                                          {st.competencies.map((comp: string, cIdx: number) => (
                                            <li key={cIdx} className="flex items-start gap-1.5">
                                              <span className="text-blue-600 font-bold shrink-0">•</span>
                                              <span>{comp}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {Array.isArray(st.learningActivities) && st.learningActivities.length > 0 && (
                                      <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2.5 space-y-1">
                                        <div className="font-black text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                          Suggested Learning Activities:
                                        </div>
                                        <ul className="list-none space-y-1 text-amber-950 font-medium">
                                          {st.learningActivities.map((act: string, aIdx: number) => (
                                            <li key={aIdx} className="flex items-start gap-1.5">
                                              <span className="text-amber-600 font-bold shrink-0">•</span>
                                              <span>{act}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {st.expectedStandard && (
                                      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                                        <div className="font-black text-emerald-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                          Expected Standard:
                                        </div>
                                        <p className="text-emerald-950 font-medium">
                                          {Array.isArray(st.expectedStandard) ? st.expectedStandard.join("; ") : st.expectedStandard}
                                        </p>
                                      </div>
                                    )}
                                  </div>
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
                  { key: 'multipleChoice', label: 'Multiple Choice', desc: '4 options, 1 mark each (Up to 60 questions max)', max: 60, presets: [10, 20, 30, 40, 50, 60] },
                  { key: 'trueFalse', label: 'True/False', desc: '1 mark each', max: 30 },
                  { key: 'shortAnswer', label: 'Short Answer', desc: '2-3 marks each', max: 20 },
                  { key: 'longAnswer', label: 'Long Answer/Essay', desc: '5-10 marks each', max: 10 },
                  { key: 'fillInBlank', label: 'Fill in the Blank', desc: '1-2 marks each', max: 20 },
                  { key: 'matching', label: 'Matching', desc: '2-3 marks each', max: 15 },
                  { key: 'ordering', label: 'Ordering/Sequencing', desc: '2-3 marks each', max: 15 },
                ].map(qt => {
                  const currentCount = Number((formData.questionCounts as any)?.[qt.key] || 0);
                  const maxLimit = qt.max || 50;
                  return (
                    <div key={qt.key} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{qt.label}</span>
                          <span className="text-xs text-slate-500 font-medium">{qt.desc}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-200">
                          <button
                            type="button"
                            title="Decrease by 5"
                            className="w-8 h-8 flex items-center justify-center text-xs text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-xs"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              questionCounts: { ...prev.questionCounts, [qt.key]: Math.max(0, currentCount - 5) } 
                            }))}
                          >-5</button>
                          <button
                            type="button"
                            title="Decrease by 1"
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-xs"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              questionCounts: { ...prev.questionCounts, [qt.key]: Math.max(0, currentCount - 1) } 
                            }))}
                          >-</button>
                          <input
                            type="number"
                            min="0"
                            max={maxLimit}
                            value={currentCount}
                            onChange={(e) => {
                              const val = Math.min(maxLimit, Math.max(0, Number(e.target.value) || 0));
                              setFormData(prev => ({
                                ...prev,
                                questionCounts: { ...prev.questionCounts, [qt.key]: val }
                              }));
                            }}
                            className="w-12 text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-1 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            title="Increase by 1"
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-xs"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              questionCounts: { ...prev.questionCounts, [qt.key]: Math.min(maxLimit, currentCount + 1) } 
                            }))}
                          >+</button>
                          <button
                            type="button"
                            title="Increase by 5"
                            className="w-8 h-8 flex items-center justify-center text-xs text-slate-600 hover:text-slate-900 font-bold bg-white rounded-lg shadow-xs"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              questionCounts: { ...prev.questionCounts, [qt.key]: Math.min(maxLimit, currentCount + 5) } 
                            }))}
                          >+5</button>
                        </div>
                      </div>

                      {/* Quick preset chips for Multiple Choice or large question types */}
                      {qt.presets && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Quick Select MCQs:</span>
                          {qt.presets.map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                questionCounts: { ...prev.questionCounts, [qt.key]: num }
                              }))}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all border",
                                currentCount === num
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {num} Qs
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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

                {/* Real Educational Teaching Diagrams & Aids (Per Section) - Always enabled as default */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-2xs">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Real Educational Teaching Diagrams & Aids (Per Section)</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Choose whether real objective diagrams (Pinterest education style teaching aids) are required for each individual section.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDiagramLibraryOpen(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Eye size={15} />
                      View Account Saved Diagrams
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'mcq', label: 'Section A: Multiple Choice Questions', desc: 'Include real diagrams for identification (e.g., animals, fruits, transport, shapes)' },
                      { key: 'shortAnswer', label: 'Section B: Short Answer & Fill-in', desc: 'Include real diagrams for short answer questions & labeling' },
                      { key: 'essay', label: 'Section C: Essay & Extended Problem Solving', desc: 'Include real diagrams for complex analysis & problem solving' },
                      { key: 'matching', label: 'Section D: Matching & Sequencing', desc: 'Include real diagrams for matching items & sequencing steps' },
                    ].map(sec => {
                      const isEnabled = formData.sectionDiagrams?.[sec.key as keyof typeof formData.sectionDiagrams] !== false;
                      return (
                        <div 
                          key={sec.key}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            sectionDiagrams: {
                              ...(prev.sectionDiagrams || { mcq: true, shortAnswer: true, essay: true, matching: true }),
                              [sec.key]: !isEnabled
                            }
                          }))}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                            isEnabled ? "bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-500/20" : "bg-slate-100/80 border-slate-200 opacity-70"
                          )}
                        >
                          <div className={cn("w-5 h-5 rounded flex items-center justify-center border mt-0.5 shrink-0 transition-all", isEnabled ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300")}>
                            {isEnabled && <Check size={12} />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{sec.label}</span>
                            <span className="text-[11px] text-slate-500 font-medium leading-tight block mt-0.5">{sec.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 font-medium">
                    <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong>⚡ Auto-Save & Sync Active:</strong> Real objective diagrams (from animals, fruits, foods, vegetables, household items, transport, etc.) are automatically searched and synced to your account library based on syllabus, grade, topic, and focus level!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileExtract} />
          <input ref={fileInputRef} type="file" accept=".pdf,image/*,.doc,.docx" multiple className="hidden" onChange={handleFileExtract} />

          <div className="pb-2 w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Important Note of Instructions / Additional Context</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const hasSelectedTopics = Boolean(
                      (formData.topic && formData.topic.trim() !== '') || 
                      (formData.stoppingTopic && formData.stoppingTopic.trim() !== '') || 
                      (formData.selectedTopics && formData.selectedTopics.length > 0)
                    );
                    const syllabusRange = (formData.type === 'schemes_of_work' && hasSelectedTopics) 
                      ? (filterSyllabusForSchemes(currentSyllabus, formData.topic, formData.stoppingTopic, formData.selectedTopics) || [])
                      : [];

                    const activeText = getTailoredDocInstructions({
                      type: formData.type,
                      grade: formData.grade,
                      subject: formData.subject,
                      topic: formData.topic,
                      stoppingTopic: formData.stoppingTopic,
                      forecastWeek: formData.forecastWeek,
                      dayOfWeek: formData.dayOfWeek,
                      weekNumber: formData.weekNumber,
                      lessonNumber: formData.lessonNumber,
                      lessonWeekNumber: formData.lessonWeekNumber,
                      numberOfDays: formData.forecastDays?.length || 5,
                      selectedTopics: formData.selectedTopics,
                      syllabusRange
                    });
                    setFormData(prev => ({ ...prev, additionalContext: activeText }));
                    toast.success(`Activated instructions for ${getDocTypeTitle(formData.type)}!`);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>activate instructions for normal preparations</span>
                </button>
              </div>
            </div>
            <textarea 
              name="additionalContext" 
              value={formData.additionalContext || ''} 
              onChange={handleInputChange} 
              placeholder={isIWP ? "Upload old individual work plan to recycle ♻️, click button above to activate instructions, or type specific roles..." : getDocPlaceholder(formData.type)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm text-xs leading-relaxed" 
              rows={4} 
            />
            {isPastedOutsideSchemes(formData.additionalContext) && (
              <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                    <ClipboardList size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-indigo-900 tracking-tight block">
                      Outside Source Content Detected (Truthful Preparation Active)
                    </span>
                    <p className="text-[10px] text-indigo-700 font-medium">
                      {formData.type === 'schemes_of_work' 
                        ? "Order & content will strictly follow what was prepared by the outsider source."
                        : formData.type === 'weekly_forecast'
                        ? `Week ${formData.forecastWeek || 1} content will be truthfully extracted exactly the way it was pasted.`
                        : `Week ${formData.lessonWeekNumber || 1}, Day ${formData.lessonNumber || 1} content will be truthfully extracted from pasted forecast/scheme.`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetWeekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
                    const targetDayNum = Number(formData.lessonNumber) || 1;
                    // Extract general metadata to populate Grade/Subject/Topic/Subtopic
                    const metadata = extractFullMetadataFromText(formData.additionalContext, targetDayNum, targetWeekNum);
                    
                    if (formData.type === 'schemes_of_work') {
                      const parsedWeeks = parsePastedSchemesTextToWeeks(formData.additionalContext);
                      if (parsedWeeks.length > 0) {
                        setFormData(prev => {
                          const updated = { ...prev, weeks: parsedWeeks };
                          if (metadata.grade) updated.grade = metadata.grade;
                          if (metadata.subject) updated.subject = metadata.subject;
                          if (metadata.topic) updated.topic = metadata.topic;
                          if (metadata.subtopic) updated.subtopic = metadata.subtopic;
                          return updated;
                        });
                        toast.success(`Successfully populated ${parsedWeeks.length} weeks from pasted outside schemes!`);
                      } else {
                        toast.error("Could not parse structured weeks in the pasted text. The AI will still extract it during generation.");
                      }
                    } else if (formData.type === 'weekly_forecast') {
                      if (isPastedWeeklyForecast(formData.additionalContext)) {
                        const parsedDays = parsePastedWeeklyForecast(formData.additionalContext, formData.grade, formData.subject, formData.curriculumType);
                        if (parsedDays.length > 0) {
                          setFormData(prev => {
                            const updated = {
                              ...prev,
                              forecastDays: prev.forecastDays.map((day, dIdx) => {
                                const parsed = parsedDays.find(p => p.day === (dIdx + 1)) || parsedDays[dIdx];
                                if (!parsed) return day;
                                return {
                                  ...day,
                                  date: parsed.date || day.date,
                                  component: parsed.component || (day as any).component || '',
                                  topic: parsed.topic || day.topic,
                                  subtopic: parsed.subtopic || day.subtopic,
                                  competency: parsed.competency || day.competency,
                                  knowledge: parsed.knowledge || (day as any).knowledge || '',
                                  skills: parsed.skills || (day as any).skills || '',
                                  values: parsed.values || (day as any).values || '',
                                  expectedStandard: parsed.expectedStandard || (day as any).expectedStandard || '',
                                  activities: (parsed.activities && parsed.activities.length > 0) ? parsed.activities : day.activities,
                                  teachingMethods: parsed.teachingMethods || (day as any).teachingMethods || '',
                                  teachingAids: parsed.teachingAids || day.teachingAids,
                                  references: parsed.references || day.references
                                };
                              })
                            };
                            if (parsedDays[0]?.topic) updated.topic = parsedDays[0].topic;
                            if (parsedDays[0]?.subtopic) updated.subtopic = parsedDays[0].subtopic;
                            if (parsedDays[0]?.competency) updated.specificCompetences = parsedDays[0].competency;
                            if (metadata.grade) updated.grade = metadata.grade;
                            if (metadata.subject) updated.subject = metadata.subject;
                            return updated;
                          });
                          toast.success(`Populated Day 1 to Day ${Math.min(5, parsedDays.length)} directly from pasted Weekly Forecast (syllabus aligned)!`);
                          return;
                        }
                      }
                      const targetWeekNum = Number(formData.forecastWeek) || 1;
                      const weekData = extractWeekFromPastedText(formData.additionalContext, targetWeekNum);
                      if (weekData) {
                        const numDays = formData.forecastDays?.length || 5;
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            forecastDays: prev.forecastDays.map((day, dIdx) => {
                              const numSubs = weekData.subtopics?.length || 1;
                              const subIndex = Math.min(Math.floor((dIdx / numDays) * numSubs), numSubs - 1);
                              const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || day.subtopic;
                              const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
                              const dayAct = weekData.activities?.[dIdx % (weekData.activities.length || 1)] || weekData.activities?.[0] || '';
                              const know = weekData.knowledge?.[subIndex] || weekData.knowledge?.[0] || '';
                              const skill = weekData.skills?.[subIndex] || weekData.skills?.[0] || '';
                              const val = weekData.values?.[subIndex] || weekData.values?.[0] || '';
                              const expStd = weekData.expectedStandards?.[subIndex] || weekData.expectedStandards?.[0] || '';
                              const methods = weekData.methods && weekData.methods.length > 0 ? weekData.methods.join(' • ') : '';

                              return {
                                ...day,
                                topic: weekData.topic || day.topic,
                                subtopic: sub,
                                competency: comp,
                                knowledge: know,
                                skills: skill,
                                values: val,
                                expectedStandard: expStd,
                                teachingMethods: methods,
                                activities: dayAct ? [dayAct] : day.activities,
                                teachingAids: weekData.teachingAids || day.teachingAids,
                                references: weekData.references || day.references
                              };
                            })
                          };
                          if (metadata.grade) updated.grade = metadata.grade;
                          if (metadata.subject) updated.subject = metadata.subject;
                          if (metadata.topic) updated.topic = metadata.topic;
                          if (metadata.subtopic) updated.subtopic = metadata.subtopic;
                          return updated;
                        });
                        toast.success(`Populated Week ${targetWeekNum} table from pasted outside schemes!`);
                      } else {
                        toast.error(`Could not find Week ${targetWeekNum} in pasted text. The AI will locate it during generation.`);
                      }
                    } else if (formData.type === 'lesson_plan') {
                      const weekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
                      const dayNum = Number(formData.lessonNumber) || 1;
                      const lessonData = extractLessonFromPastedForecastText(formData.additionalContext, dayNum, weekNum, formData.grade, formData.subject, formData.curriculumType);
                      if (lessonData) {
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            topic: lessonData.topic || prev.topic,
                            subtopic: lessonData.subtopic || prev.subtopic,
                            specificCompetences: safeString(lessonData.competency || prev.specificCompetences),
                            knowledge: safeString(lessonData.knowledge || prev.knowledge || ''),
                            activities: lessonData.learningActivities?.length > 0 ? lessonData.learningActivities : prev.activities,
                            teachingAids: lessonData.teachingAids || prev.teachingAids,
                            references: lessonData.references || prev.references
                          };
                          if (metadata.grade) updated.grade = metadata.grade;
                          if (metadata.subject) updated.subject = metadata.subject;
                          if (!lessonData.topic && metadata.topic) updated.topic = metadata.topic;
                          if (!lessonData.subtopic && metadata.subtopic) updated.subtopic = metadata.subtopic;
                          return updated;
                        });
                        toast.success(`Populated Lesson Plan (Week ${weekNum}, Day ${dayNum}) from pasted content!`);
                      } else {
                        toast.error(`Could not parse Week ${weekNum} Day ${dayNum} in pasted text. The AI will locate it during generation.`);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>
                    {formData.type === 'schemes_of_work' 
                      ? "Populate Schemes Table" 
                      : formData.type === 'weekly_forecast'
                      ? `Populate Week ${formData.forecastWeek || 1}`
                      : `Populate Lesson Plan (W${formData.lessonWeekNumber || 1}, D${formData.lessonNumber || 1})`}
                  </span>
                </button>
              </div>
            )}
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
      )}

      {formData.type !== 'syllabi' && !isAssessment && (
        <div className="space-y-6">


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
          {/* Curriculum Standard: Official CBC Framework */}
          {!isIWP && (
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider rounded-xl border border-emerald-200 flex items-center gap-2 shadow-2xs">
                <BookOpen size={14} className="text-emerald-600" />
                <span>Zambian Competence-Based Curriculum (CBC)</span>
              </span>
            </div>
          )}
          </div>
        </div>

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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-tight">
                    CBC Schemes of Work &bull; 13-Week Official Syllabus Planning
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                  <span>Term {formData.term || '1'} &bull; Weeks 1 to 13</span>
                </div>
              </div>

              {/* Authoritative Week-by-Week Dual-Line Drop-Down Planner */}
              {(() => {
                const activeWeekIdx = schemesSelectedWeek - 1;
                const weekData = formData.weeks?.[activeWeekIdx] || {
                  week: schemesSelectedWeek,
                  topic: '',
                  subtopics: [],
                  competencies: [],
                  expectedStandards: [],
                  activities: [],
                  teachingMethods: 'Guided Discovery, Interactive Discussion, Group Work',
                  teachingAids: 'Chalkboard, Pupil Book, Wall Charts',
                  references: `${formData.grade || 'Grade 4'} ${formData.curriculumType || 'CBC'} Syllabus, MOE Zambia`
                };

                // Line 1 (White Drop-downs)
                const line1Topic = weekData.line1?.topic || weekData.topic?.split('/')[0]?.trim() || '';
                const line1Sub = weekData.line1?.subtopic || (Array.isArray(weekData.subtopics) ? weekData.subtopics[0] || '' : '');
                const line1Comps: [string, string] = weekData.line1?.competencies || [
                  Array.isArray(weekData.competencies) ? weekData.competencies[0] || '' : '',
                  Array.isArray(weekData.competencies) ? weekData.competencies[1] || '' : ''
                ];
                const line1Stds: [string, string] = weekData.line1?.expectedStandards || [
                  Array.isArray(weekData.expectedStandards) ? weekData.expectedStandards[0] || '' : '',
                  Array.isArray(weekData.expectedStandards) ? weekData.expectedStandards[1] || '' : ''
                ];
                const line1Acts: [string, string, string, string, string] = weekData.line1?.activities || [
                  Array.isArray(weekData.activities) ? weekData.activities[0] || '' : '',
                  Array.isArray(weekData.activities) ? weekData.activities[1] || '' : '',
                  Array.isArray(weekData.activities) ? weekData.activities[2] || '' : '',
                  Array.isArray(weekData.activities) ? weekData.activities[3] || '' : '',
                  Array.isArray(weekData.activities) ? weekData.activities[4] || '' : ''
                ];

                // Line 2 (Dark Blue Drop-downs)
                const line2Topic = weekData.line2?.topic || (weekData.topic?.includes('/') ? weekData.topic.split('/')[1]?.trim() : '') || '';
                const line2Sub = weekData.line2?.subtopic || (Array.isArray(weekData.subtopics) ? weekData.subtopics[1] || '' : '');
                const line2Comps: [string, string] = weekData.line2?.competencies || [
                  Array.isArray(weekData.competencies) ? weekData.competencies[2] || '' : '',
                  Array.isArray(weekData.competencies) ? weekData.competencies[3] || '' : ''
                ];
                const line2Stds: [string, string] = weekData.line2?.expectedStandards || [
                  Array.isArray(weekData.expectedStandards) ? weekData.expectedStandards[2] || '' : '',
                  Array.isArray(weekData.expectedStandards) ? weekData.expectedStandards[3] || '' : ''
                ];
                const line2Acts: [string, string] = weekData.line2?.activities || [
                  Array.isArray(weekData.activities) ? weekData.activities[5] || '' : '',
                  Array.isArray(weekData.activities) ? weekData.activities[6] || '' : ''
                ];

                // Syllabus options queries:
                const topicOptions = (currentSyllabus || []).map((t: any) => stripPageNumbers(t.title || t.topic || '')).filter(Boolean);

                const line1SubOptions = line1Topic 
                  ? getSubtopicsForTopic(line1Topic, currentSyllabus).map(s => stripPageNumbers(s.title || s.name || (typeof s === 'string' ? s : ''))).filter(Boolean) 
                  : [];
                const line1CompOptions = (line1Topic && line1Sub) 
                  ? getCompetenciesForSubtopic(line1Topic, line1Sub, currentSyllabus) 
                  : [];
                const line1StdOptions = (line1Topic && line1Sub) 
                  ? getExpectedStandardsForSubtopic(line1Topic, line1Sub, currentSyllabus) 
                  : [];
                const line1ActOptions = (line1Topic && line1Sub) 
                  ? getActivitiesForSubtopic(line1Topic, line1Sub, line1Comps[0] || '', currentSyllabus, formData.grade, formData.subject) 
                  : [];

                const line2SubOptions = line2Topic 
                  ? getSubtopicsForTopic(line2Topic, currentSyllabus).map(s => stripPageNumbers(s.title || s.name || (typeof s === 'string' ? s : ''))).filter(Boolean) 
                  : [];
                const line2CompOptions = (line2Topic && line2Sub) 
                  ? getCompetenciesForSubtopic(line2Topic, line2Sub, currentSyllabus) 
                  : [];
                const line2StdOptions = (line2Topic && line2Sub) 
                  ? getExpectedStandardsForSubtopic(line2Topic, line2Sub, currentSyllabus) 
                  : [];
                const line2ActOptions = (line2Topic && line2Sub) 
                  ? getActivitiesForSubtopic(line2Topic, line2Sub, line2Comps[0] || '', currentSyllabus, formData.grade, formData.subject) 
                  : (line1ActOptions.length > 5 ? line1ActOptions.slice(5) : []);

                const ensureList = (opts: string[], val: string) => {
                  if (val && !opts.includes(val)) {
                    return [val, ...opts];
                  }
                  return opts;
                };

                // Direct updater for Line 1 and Line 2
                const handleUpdateWeekLine = (
                  lineNum: 1 | 2,
                  field: 'topic' | 'subtopic' | 'competencies' | 'expectedStandards' | 'activities',
                  slotIdx: number | null,
                  value: string
                ) => {
                  setFormData(prev => {
                    const newWeeks = [...(prev.weeks || [])];
                    while (newWeeks.length < 13) {
                      newWeeks.push({
                        week: newWeeks.length + 1,
                        topic: '',
                        subtopics: [],
                        competencies: [],
                        expectedStandards: [],
                        activities: [],
                        teachingMethods: 'Guided Discovery, Interactive Discussion, Group Work',
                        teachingAids: 'Chalkboard, Pupil Book, Wall Charts',
                        references: `${formData.grade || 'Grade 4'} ${formData.curriculumType || 'CBC'} Syllabus, MOE Zambia`
                      });
                    }

                    const curW: any = newWeeks[activeWeekIdx] || { week: activeWeekIdx + 1 };
                    const curL1 = curW.line1 ? { ...curW.line1 } : {
                      topic: line1Topic,
                      subtopic: line1Sub,
                      competencies: [...line1Comps],
                      expectedStandards: [...line1Stds],
                      activities: [...line1Acts]
                    };
                    const curL2 = curW.line2 ? { ...curW.line2 } : {
                      topic: line2Topic,
                      subtopic: line2Sub,
                      competencies: [...line2Comps],
                      expectedStandards: [...line2Stds],
                      activities: [...line2Acts]
                    };

                    const target = lineNum === 1 ? curL1 : curL2;

                    if (field === 'topic') {
                      target.topic = value;
                      target.subtopic = '';
                      target.competencies = ['', ''];
                      target.expectedStandards = ['', ''];
                      if (lineNum === 1) {
                        target.activities = ['', '', '', '', ''];
                        if (value) {
                          const subs = getSubtopicsForTopic(value, currentSyllabus).map(s => stripPageNumbers(s.title || s.name || (typeof s === 'string' ? s : ''))).filter(Boolean);
                          if (subs.length > 0) {
                            target.subtopic = subs[0];
                            const comps = getCompetenciesForSubtopic(value, subs[0], currentSyllabus);
                            const stds = getExpectedStandardsForSubtopic(value, subs[0], currentSyllabus);
                            const acts = getActivitiesForSubtopic(value, subs[0], comps[0] || '', currentSyllabus, formData.grade, formData.subject);
                            target.competencies = [comps[0] || '', comps[1] || ''];
                            target.expectedStandards = [stds[0] || '', stds[1] || ''];
                            target.activities = [
                              acts[0] || '',
                              acts[1] || '',
                              acts[2] || '',
                              acts[3] || '',
                              acts[4] || ''
                            ];
                          }
                        }
                      } else {
                        target.activities = ['', ''];
                        if (value) {
                          const subs = getSubtopicsForTopic(value, currentSyllabus).map(s => stripPageNumbers(s.title || s.name || (typeof s === 'string' ? s : ''))).filter(Boolean);
                          if (subs.length > 0) {
                            target.subtopic = subs[0];
                            const comps = getCompetenciesForSubtopic(value, subs[0], currentSyllabus);
                            const stds = getExpectedStandardsForSubtopic(value, subs[0], currentSyllabus);
                            const acts = getActivitiesForSubtopic(value, subs[0], comps[0] || '', currentSyllabus, formData.grade, formData.subject);
                            target.competencies = [comps[0] || '', comps[1] || ''];
                            target.expectedStandards = [stds[0] || '', stds[1] || ''];
                            target.activities = [acts[0] || '', acts[1] || ''];
                          }
                        }
                      }
                    } else if (field === 'subtopic') {
                      target.subtopic = value;
                      const parentTopic = target.topic;
                      if (parentTopic && value) {
                        const comps = getCompetenciesForSubtopic(parentTopic, value, currentSyllabus);
                        const stds = getExpectedStandardsForSubtopic(parentTopic, value, currentSyllabus);
                        const acts = getActivitiesForSubtopic(parentTopic, value, comps[0] || '', currentSyllabus, formData.grade, formData.subject);
                        target.competencies = [comps[0] || '', comps[1] || ''];
                        target.expectedStandards = [stds[0] || '', stds[1] || ''];
                        if (lineNum === 1) {
                          target.activities = [
                            acts[0] || '',
                            acts[1] || '',
                            acts[2] || '',
                            acts[3] || '',
                            acts[4] || ''
                          ];
                        } else {
                          target.activities = [acts[0] || '', acts[1] || ''];
                        }
                      }
                    } else if (field === 'competencies' && slotIdx !== null) {
                      const next = [...target.competencies];
                      next[slotIdx] = value;
                      target.competencies = next;
                    } else if (field === 'expectedStandards' && slotIdx !== null) {
                      const next = [...target.expectedStandards];
                      next[slotIdx] = value;
                      target.expectedStandards = next;
                    } else if (field === 'activities' && slotIdx !== null) {
                      const next = [...target.activities];
                      next[slotIdx] = value;
                      target.activities = next;
                    }

                    const combinedTopic = [curL1.topic, curL2.topic].filter(Boolean).join(' / ');
                    const combinedSubs = [curL1.subtopic, curL2.subtopic].filter(Boolean);
                    const combinedComps = [...curL1.competencies.filter(Boolean), ...curL2.competencies.filter(Boolean)];
                    const combinedStds = [...curL1.expectedStandards.filter(Boolean), ...curL2.expectedStandards.filter(Boolean)];
                    const combinedActs = [...curL1.activities.filter(Boolean), ...curL2.activities.filter(Boolean)];

                    newWeeks[activeWeekIdx] = {
                      ...curW,
                      week: schemesSelectedWeek,
                      topic: combinedTopic || curL1.topic || '',
                      subtopics: combinedSubs,
                      competencies: combinedComps,
                      expectedStandards: combinedStds,
                      activities: combinedActs,
                      line1: curL1,
                      line2: curL2
                    };

                    return { ...prev, weeks: newWeeks };
                  });
                };

                const handleSaveCurrentWeekAndProceed = () => {
                  setFormData(prev => {
                    const newWeeks = [...(prev.weeks || [])];
                    while (newWeeks.length < 13) {
                      newWeeks.push({
                        week: newWeeks.length + 1,
                        topic: '',
                        subtopics: [],
                        competencies: [],
                        expectedStandards: [],
                        activities: [],
                        teachingMethods: 'Guided Discovery, Interactive Discussion, Group Work',
                        teachingAids: 'Chalkboard, Pupil Book, Wall Charts',
                        references: `${formData.grade || 'Grade 4'} ${formData.curriculumType || 'CBC'} Syllabus, MOE Zambia`
                      });
                    }

                    const curW: any = newWeeks[activeWeekIdx] || { week: schemesSelectedWeek };
                    const combinedTopic = [line1Topic, line2Topic].filter(Boolean).join(' / ');
                    const combinedSubs = [line1Sub, line2Sub].filter(Boolean);
                    const combinedComps = [...line1Comps.filter(Boolean), ...line2Comps.filter(Boolean)];
                    const combinedStds = [...line1Stds.filter(Boolean), ...line2Stds.filter(Boolean)];
                    const combinedActs = [...line1Acts.filter(Boolean), ...line2Acts.filter(Boolean)];

                    newWeeks[activeWeekIdx] = {
                      ...curW,
                      week: schemesSelectedWeek,
                      topic: combinedTopic || line1Topic || '',
                      subtopics: combinedSubs,
                      competencies: combinedComps,
                      expectedStandards: combinedStds,
                      activities: combinedActs,
                      teachingMethods: weekData.teachingMethods || 'Guided Discovery, Interactive Discussion, Group Work',
                      teachingAids: weekData.teachingAids || 'Chalkboard, Pupil Book, Wall Charts',
                      references: weekData.references || `${formData.grade || 'Grade 4'} ${formData.curriculumType || 'CBC'} Syllabus, MOE Zambia`,
                      isSaved: true,
                      line1: {
                        topic: line1Topic,
                        subtopic: line1Sub,
                        competencies: line1Comps,
                        expectedStandards: line1Stds,
                        activities: line1Acts
                      },
                      line2: {
                        topic: line2Topic,
                        subtopic: line2Sub,
                        competencies: line2Comps,
                        expectedStandards: line2Stds,
                        activities: line2Acts
                      }
                    };

                    return { ...prev, weeks: newWeeks };
                  });

                  toast.success(`Week ${schemesSelectedWeek} saved successfully!`);
                  if (schemesSelectedWeek < 13) {
                    setSchemesSelectedWeek(schemesSelectedWeek + 1);
                  }
                };

                return (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6 text-left">
                    {/* Top Week Selector - Screenshot 2 Style */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                          SELECT WEEK NUMBER TO POPULATE INFO:
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {formData.grade} &bull; {formData.subject}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5 sm:gap-2">
                        {Array.from({ length: 13 }, (_, idx) => {
                          const wNum = idx + 1;
                          const isSelected = schemesSelectedWeek === wNum;
                          const wEntry = formData.weeks?.[idx];
                          const isSaved = Boolean(wEntry?.isSaved || (wEntry?.topic && wEntry?.topic.trim() !== ''));
                          const isAssessment = wNum === (formData.eceMidTermBreakWeek || 7) || wNum === 12 || wNum === 13;

                          return (
                            <button
                              key={`scheme-week-btn-${wNum}`}
                              type="button"
                              onClick={() => setSchemesSelectedWeek(wNum)}
                              className={cn(
                                "py-2 px-1 rounded-xl text-center font-black transition-all cursor-pointer border flex flex-col items-center justify-center min-h-[52px]",
                                isSelected
                                  ? "bg-[#00A86B] text-white border-emerald-600 shadow-md ring-2 ring-emerald-300 scale-102"
                                  : isSaved
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                                  : isAssessment
                                  ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center gap-0.5">
                                <span className="text-[11px] leading-tight font-black">Wk {wNum}</span>
                                {isSaved && <Check size={11} className={isSelected ? "text-white" : "text-emerald-700"} />}
                              </div>
                              <span className="text-[8px] font-bold mt-0.5 opacity-80 uppercase truncate max-w-full">
                                {isAssessment ? (wNum === 13 ? 'EXAM' : 'REVIEW') : `UNIT ${wNum}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Week Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                            WEEK {schemesSelectedWeek} DETAILED INFORMATION (SCHEMES OF WORK TEMPLATE):
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase self-start sm:self-auto">
                          Editable &bull; Automatically Synced
                        </span>
                      </div>

                      {/* ===================== LINE 1: PLAIN WHITE DROP-DOWNS ===================== */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Line 1 (Plain White Drop-downs)
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                            Primary Syllabus Unit
                          </span>
                        </div>

                        {/* Line 1: Topic Drop-down */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                            <span>Topic:</span>
                            <span className="text-[9px] text-slate-400 font-medium">All as will appear</span>
                          </label>
                          <select
                            value={line1Topic}
                            onChange={(e) => handleUpdateWeekLine(1, 'topic', null, e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 shadow-2xs"
                          >
                            <option value=""></option>
                            {ensureList(topicOptions, line1Topic).map((top, ti) => (
                              <option key={`l1-top-${ti}`} value={top}>{top}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line 1: Subtopic Drop-down */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                            <span>Subtopics:</span>
                            <span className="text-[9px] text-slate-400 font-medium">State Subtopics in that week</span>
                          </label>
                          <select
                            value={line1Sub}
                            disabled={!line1Topic}
                            onChange={(e) => handleUpdateWeekLine(1, 'subtopic', null, e.target.value)}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value=""></option>
                            {ensureList(line1SubOptions, line1Sub).map((sub, si) => (
                              <option key={`l1-sub-${si}`} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line 1: Specific Competencies (2 slots) */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                            <span>Specific Competencies:</span>
                            <span className="text-[9px] text-slate-400 font-medium">2 Slots &bull; All as will appear</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[0, 1].map((cIdx) => (
                              <select
                                key={`l1-comp-${cIdx}`}
                                value={line1Comps[cIdx] || ''}
                                disabled={!line1Sub}
                                onChange={(e) => handleUpdateWeekLine(1, 'competencies', cIdx, e.target.value)}
                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value=""></option>
                                {ensureList(line1CompOptions, line1Comps[cIdx] || '').map((c, ci) => (
                                  <option key={`l1-comp-opt-${cIdx}-${ci}`} value={c}>{c}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>

                        {/* Line 1: Expected Standards (2 slots) */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                            <span>Expected Standards:</span>
                            <span className="text-[9px] text-slate-400 font-medium">2 Slots &bull; All as will appear</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[0, 1].map((sIdx) => (
                              <select
                                key={`l1-std-${sIdx}`}
                                value={line1Stds[sIdx] || ''}
                                disabled={!line1Sub}
                                onChange={(e) => handleUpdateWeekLine(1, 'expectedStandards', sIdx, e.target.value)}
                                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value=""></option>
                                {ensureList(line1StdOptions, line1Stds[sIdx] || '').map((s, si) => (
                                  <option key={`l1-std-opt-${sIdx}-${si}`} value={s}>{s}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>

                        {/* Line 1: Learning Activities (5 slots labeled Learning activity 1 to 5) */}
                        <div className="space-y-2">
                          <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                            <span>Learning Activities:</span>
                            <span className="text-[9px] text-slate-400 font-medium">5 Slots (Weekdays)</span>
                          </label>
                          <div className="space-y-2">
                            {[0, 1, 2, 3, 4].map((aIdx) => (
                              <div key={`l1-act-${aIdx}`} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                <span className="text-[11px] font-black text-slate-700 uppercase shrink-0 sm:w-36">
                                  Learning activity {aIdx + 1}:
                                </span>
                                <select
                                  value={line1Acts[aIdx] || ''}
                                  disabled={!line1Sub}
                                  onChange={(e) => handleUpdateWeekLine(1, 'activities', aIdx, e.target.value)}
                                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  <option value=""></option>
                                  {ensureList(line1ActOptions, line1Acts[aIdx] || '').map((act, ai) => (
                                    <option key={`l1-act-opt-${aIdx}-${ai}`} value={act}>{act}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ===================== LINE 2: DARK BLUE DROP-DOWNS ===================== */}
                      <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-blue-900/60 shadow-md space-y-4 text-white">
                        <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                          <span className="text-[11px] font-black uppercase text-blue-200 tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            Line 2 (Dark Blue Drop-downs &bull; Combined Topics &amp; Timetable Overflow)
                          </span>
                          <span className="text-[9.5px] font-bold text-blue-300 uppercase">
                            Combined Planning Line
                          </span>
                        </div>

                        {/* Line 2: Topic Drop-down */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                            <span>Topic:</span>
                            <span className="text-[9px] text-blue-400 font-medium">Optional combined topic</span>
                          </label>
                          <select
                            value={line2Topic}
                            onChange={(e) => handleUpdateWeekLine(2, 'topic', null, e.target.value)}
                            className="w-full bg-[#1e3a8a] text-white border border-blue-900 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-400 shadow-2xs"
                          >
                            <option value="" className="bg-[#1e3a8a] text-white"></option>
                            {ensureList(topicOptions, line2Topic).map((top, ti) => (
                              <option key={`l2-top-${ti}`} value={top} className="bg-[#1e3a8a] text-white">{top}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line 2: Subtopics Drop-down */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                            <span>Subtopics:</span>
                            <span className="text-[9px] text-blue-400 font-medium">State Subtopics in that week</span>
                          </label>
                          <select
                            value={line2Sub}
                            disabled={!line2Topic}
                            onChange={(e) => handleUpdateWeekLine(2, 'subtopic', null, e.target.value)}
                            className="w-full bg-[#1e3a8a] text-white border border-blue-900 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-400 shadow-2xs disabled:bg-slate-800 disabled:text-slate-500"
                          >
                            <option value="" className="bg-[#1e3a8a] text-white"></option>
                            {ensureList(line2SubOptions, line2Sub).map((sub, si) => (
                              <option key={`l2-sub-${si}`} value={sub} className="bg-[#1e3a8a] text-white">{sub}</option>
                            ))}
                          </select>
                        </div>

                        {/* Line 2: Specific Competencies (2 slots) */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                            <span>Specific Competencies:</span>
                            <span className="text-[9px] text-blue-400 font-medium">2 Slots</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[0, 1].map((cIdx) => (
                              <select
                                key={`l2-comp-${cIdx}`}
                                value={line2Comps[cIdx] || ''}
                                disabled={!line2Sub}
                                onChange={(e) => handleUpdateWeekLine(2, 'competencies', cIdx, e.target.value)}
                                className="w-full bg-[#1e3a8a] text-white border border-blue-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-400 shadow-2xs disabled:bg-slate-800 disabled:text-slate-500"
                              >
                                <option value="" className="bg-[#1e3a8a] text-white"></option>
                                {ensureList(line2CompOptions, line2Comps[cIdx] || '').map((c, ci) => (
                                  <option key={`l2-comp-opt-${cIdx}-${ci}`} value={c} className="bg-[#1e3a8a] text-white">{c}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>

                        {/* Line 2: Expected Standards (2 slots) */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                            <span>Expected Standards:</span>
                            <span className="text-[9px] text-blue-400 font-medium">2 Slots</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[0, 1].map((sIdx) => (
                              <select
                                key={`l2-std-${sIdx}`}
                                value={line2Stds[sIdx] || ''}
                                disabled={!line2Sub}
                                onChange={(e) => handleUpdateWeekLine(2, 'expectedStandards', sIdx, e.target.value)}
                                className="w-full bg-[#1e3a8a] text-white border border-blue-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-400 shadow-2xs disabled:bg-slate-800 disabled:text-slate-500"
                              >
                                <option value="" className="bg-[#1e3a8a] text-white"></option>
                                {ensureList(line2StdOptions, line2Stds[sIdx] || '').map((s, si) => (
                                  <option key={`l2-std-opt-${sIdx}-${si}`} value={s} className="bg-[#1e3a8a] text-white">{s}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>

                        {/* Line 2: Learning Activities (Slots 6 and 7) */}
                        <div className="space-y-2">
                          <label className="text-[10.5px] font-black uppercase text-blue-200 tracking-wider flex items-center justify-between">
                            <span>Learning Activities:</span>
                            <span className="text-[9px] text-blue-400 font-medium">2 Additional Slots (Up to 7 Total)</span>
                          </label>
                          <div className="space-y-2">
                            {[0, 1].map((aIdx) => (
                              <div key={`l2-act-${aIdx}`} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                <span className="text-[11px] font-black text-blue-200 uppercase shrink-0 sm:w-36">
                                  Learning activity {aIdx + 6}:
                                </span>
                                <select
                                  value={line2Acts[aIdx] || ''}
                                  disabled={!line2Sub && line1ActOptions.length <= 5}
                                  onChange={(e) => handleUpdateWeekLine(2, 'activities', aIdx, e.target.value)}
                                  className="w-full bg-[#1e3a8a] text-white border border-blue-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-400 shadow-2xs disabled:bg-slate-800 disabled:text-slate-500"
                                >
                                  <option value="" className="bg-[#1e3a8a] text-white"></option>
                                  {ensureList(line2ActOptions, line2Acts[aIdx] || '').map((act, ai) => (
                                    <option key={`l2-act-opt-${aIdx}-${ai}`} value={act} className="bg-[#1e3a8a] text-white">{act}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ===================== COMMON WEEK FIELDS ===================== */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                            Methodologies:
                          </label>
                          <input
                            type="text"
                            value={weekData.teachingMethods || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const newWeeks = [...(prev.weeks || [])];
                                if (newWeeks[activeWeekIdx]) {
                                  newWeeks[activeWeekIdx] = { ...newWeeks[activeWeekIdx], teachingMethods: val };
                                }
                                return { ...prev, weeks: newWeeks };
                              });
                            }}
                            placeholder="Guided Discovery, Interactive Discussion..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                            Teaching/Learning Aids:
                          </label>
                          <input
                            type="text"
                            value={weekData.teachingAids || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const newWeeks = [...(prev.weeks || [])];
                                if (newWeeks[activeWeekIdx]) {
                                  newWeeks[activeWeekIdx] = { ...newWeeks[activeWeekIdx], teachingAids: val };
                                }
                                return { ...prev, weeks: newWeeks };
                              });
                            }}
                            placeholder="Chalkboard, Pupil Book, Charts..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                            References:
                          </label>
                          <input
                            type="text"
                            value={weekData.references || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => {
                                const newWeeks = [...(prev.weeks || [])];
                                if (newWeeks[activeWeekIdx]) {
                                  newWeeks[activeWeekIdx] = { ...newWeeks[activeWeekIdx], references: val };
                                }
                                return { ...prev, weeks: newWeeks };
                              });
                            }}
                            placeholder="Ministry of Education Official CBC Syllabus..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Save Week & Proceed */}
                      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">
                          Week {schemesSelectedWeek} is configured. Click below to save and advance.
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveCurrentWeekAndProceed}
                          className="w-full sm:w-auto px-6 py-3 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>Save Week {schemesSelectedWeek} &amp; Proceed</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                        const isTableSpecial = !!(forecast.subject && (
                          forecast.subject.toLowerCase().includes('english') || 
                          forecast.subject.toLowerCase().includes('zambian')
                        ));
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
                                            activities: ['', '']
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
                                      <th className={cn("p-2 text-left font-black uppercase", curriculumType !== 'OBC' ? "border-r border-black w-40" : "w-48")}>{curriculumType === 'OBC' ? 'Specific Outcome' : 'Specific Competency'}</th>
                                      <th className="p-2 border-r border-black text-left font-black w-48 uppercase">Knowledge</th>
                                      {curriculumType !== 'OBC' && (
                                        <th className="p-2 text-left font-black w-56 uppercase text-[#00A86B]">Learning Activities</th>
                                      )}
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
                                                  newDays[idx] = { ...newDays[idx], competency: val, activities: ["", ""] };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                            >
                                              <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                                              {getCompetenciesForSubtopic(day.topic, day.subtopic, currentTableSyllabus).map((c, cIdx) => (
                                                <option key={`${c}-${cIdx}`} value={c}>{c}</option>
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
                                                  newDays[idx] = { ...newDays[idx], competency: val, activities: ["", ""] };
                                                  return { ...f, days: newDays };
                                                }));
                                              }}
                                              placeholder={curriculumType === 'OBC' ? 'Specify outcome...' : 'Specify competency...'}
                                              className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                            />
                                          )}
                                        </td>
                                        <td className="p-2 border-r border-black align-top h-full">
                                           <textarea
                                              value={(day as any).knowledge || ''}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  setBatchForecasts(prev => prev.map(f => {
                                                    if (f.id !== forecast.id) return f;
                                                    const newDays = [...f.days];
                                                    newDays[idx] = { ...newDays[idx], knowledge: val } as any;
                                                    return { ...f, days: newDays };
                                                  }));
                                              }}
                                              placeholder="Knowledge..."
                                              className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                            />
                                         </td>
                                        {curriculumType !== 'OBC' && (<td className="p-2 align-top h-full">
                                           <div className="flex flex-col gap-2">
                                             {[0, 1].map((aIdx) => {
                                               const act = (day.activities && day.activities[aIdx]) || '';
                                               return (
                                               <div key={aIdx} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                                                 {currentTableSyllabus ? (
                                                  (() => {
                                                    const validActs = day.competency ? getActivitiesForSubtopic(day.topic, day.subtopic, day.competency, currentTableSyllabus, forecast.grade, forecast.subject) : [];
                                                    const selectedActVal = validActs.includes(act) ? act : "";
                                                    return (
                                                      <select
                                                        value={selectedActVal}
                                                        disabled={!day.competency}
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
                                                        className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                                      >
                                                       <option value="">
                                                         {!day.competency 
                                                           ? "Select Specific Competency first" 
                                                           : (isFetchingActivities[`${forecast.grade}-${forecast.subject}-${day.topic}-${day.subtopic}-${day.competency}`] ? "Searching Syllabus..." : "Select Activity")}
                                                       </option>
                                                        {day.competency && validActs.map((oact, oactIdx) => (
                                                          <option key={`${oact}-${oactIdx}`} value={oact}>{oact}</option>
                                                        ))}
                                                      </select>
                                                    );
                                                  })()
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
                                             );
                                           })}
                                           </div>
                                        </td>)}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-blue-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PLANNING WEEK</span>
                        <select 
                          value={formData.forecastWeek}
                          onChange={(e) => {
                            const newWeek = parseInt(e.target.value);
                            setFormData(prev => {
                              const targetWeekObj = prev.weeks ? prev.weeks.find((w: any) => Number(w.week) === newWeek) : null;
                              const parsedFromContext = prev.additionalContext ? parsePastedSchemesTextToWeeks(prev.additionalContext, prev.grade, prev.subject) : [];
                              const pastedWeekData = parsedFromContext.length > 0 ? matchStrictWeekFromSchemes(parsedFromContext, newWeek, prev.grade, prev.subject, prev.curriculumType) : null;
                              const weekData = pastedWeekData || targetWeekObj;

                              if (!weekData) {
                                return { ...prev, forecastWeek: newWeek };
                              }

                              const rawSubs = Array.isArray(weekData.subtopics) 
                                ? weekData.subtopics.filter((s: string) => s && s.trim() !== '')
                                : (weekData.subtopics ? [String(weekData.subtopics)] : []);
                              const numSubs = rawSubs.length || 1;
                              const numDays = prev.forecastDays?.length || 5;
                              const subIndices = getSubtopicIndicesForDays(numSubs, numDays);
                              const aidsList = (weekData.teachingAids || '').split(';').map((a: string) => a.trim()).filter(Boolean);

                              const mappedDays = (prev.forecastDays || []).map((day, dIdx) => {
                                const subIndex = subIndices[dIdx] || 0;
                                const sub = rawSubs[subIndex] || rawSubs[0] || day.subtopic;
                                const top = weekData.topic || day.topic;
                                const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
                                const expStd = (weekData as any).expectedStandards?.[subIndex] || (weekData as any).expectedStandards?.[0] || '';
                                const know = (weekData as any).knowledge?.[subIndex] || (weekData as any).knowledge?.[0] || expStd || '';
                                const skill = (weekData as any).skills?.[subIndex] || (weekData as any).skills?.[0] || '';
                                const val = (weekData as any).values?.[subIndex] || (weekData as any).values?.[0] || '';
                                const dayMethods = ((weekData as any).methods && (weekData as any).methods[subIndex]) || ((weekData as any).methods && (weekData as any).methods[0]) || ((weekData as any).methods && (weekData as any).methods.length > 0 ? (weekData as any).methods.join(' • ') : '') || (day as any).teachingMethods || '• Demonstration • Practical activity • Question and answer • Class discussion';
                                const dayAid = aidsList[subIndex] || aidsList[0] || weekData.teachingAids || day.teachingAids || '';

                                return {
                                  ...day,
                                  topic: top,
                                  subtopic: sub,
                                  competency: comp,
                                  knowledge: know,
                                  skills: skill,
                                  values: val,
                                  expectedStandard: expStd,
                                  activities: (weekData as any).activities?.[subIndex] ? [(weekData as any).activities[subIndex]] : (weekData.activities || day.activities || []),
                                  teachingMethods: dayMethods,
                                  teachingAids: dayAid,
                                  references: weekData.references || day.references || ''
                                };
                              });

                              return {
                                ...prev,
                                forecastWeek: newWeek,
                                topic: weekData.topic || prev.topic,
                                subtopic: rawSubs[0] || prev.subtopic,
                                forecastDays: enrichForecastDaysWithSyllabus(mappedDays as any, prev.grade, prev.subject, prev.curriculumType) as any
                              };
                            });
                          }}
                          className="bg-transparent border-0 font-black text-sm text-blue-600 outline-none mt-0.5"
                        >
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i+1} value={i+1}>Week {i+1}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-3 sm:pt-0 sm:pl-4">
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
                  </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 my-4">
                {/* Hide/Reveal Weekly Table Toggle */}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setIsWeeklyTableVisible(!isWeeklyTableVisible)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-sm"
                  >
                    {isWeeklyTableVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {isWeeklyTableVisible ? "Hide Weekly Forecast Table" : "Show Weekly Forecast Table"}
                  </button>
                </div>
              </div>

              {isWeeklyTableVisible && (
                <div className="w-full space-y-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-950 font-black text-xs shadow-2xs">
                    <span>✨ 100% reliable method: Syllabus-authenticated curriculum planning with direct syllabus drop-downs and accurate column allocation.</span>
                  </div>

                  <div className="w-full overflow-x-auto border border-black rounded-lg shadow-sm">
                    <table className="w-full border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black text-[9px]">
                          <th className="p-2 border-r border-black text-left font-black w-24 uppercase">Day</th>
                          <th className="p-2 border-r border-black text-left font-black w-48 uppercase">Topic / Sub-topic</th>
                          <th className="p-2 border-r border-black text-left font-black w-40 uppercase">
                            {curriculumType === 'OBC' ? 'Specific Outcome' : 'Specific Competency'}
                          </th>
                          {curriculumType === 'OBC' && (
                            <>
                              <th className="p-2 border-r border-black text-left font-black w-36 uppercase">Knowledge</th>
                              <th className="p-2 border-r border-black text-left font-black w-36 uppercase">Skills</th>
                              <th className="p-2 border-r border-black text-left font-black w-36 uppercase">Values</th>
                              <th className="p-2 border-r border-black text-left font-black w-36 uppercase">Teaching Methods</th>
                              <th className="p-2 border-r border-black text-left font-black w-32 uppercase">T/L Aids</th>
                              <th className="p-2 text-left font-black w-36 uppercase">Reference</th>
                            </>
                          )}
                          {curriculumType !== 'OBC' && (
                            <>
                              <th className="p-2 border-r border-black text-left font-black w-44 uppercase text-[#00A86B]">Expected Standards</th>
                              <th className="p-2 border-r border-black text-left font-black w-56 uppercase text-[#00A86B]">Learning Activities</th>
                              <th className="p-2 border-r border-black text-left font-black w-40 uppercase">Teaching Methods</th>
                              <th className="p-2 text-left font-black w-36 uppercase">Reference</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.forecastDays?.map((day, idx) => (
                          <tr key={idx} className="border-b border-black last:border-0 h-32">
                            <td className="p-2 border-r border-black font-bold text-center align-top pt-3 bg-slate-50/30 w-28">
                              <div className="font-extrabold text-slate-700">Day {day.day}</div>
                              {(Number(day.day) === 4 || Number(day.day) === 5) && (
                                <button 
                                  onClick={() => toggleRevision(idx)}
                                  className={cn("mt-2 w-full text-[8px] p-1 rounded font-black", (day as any).isRevision ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}
                                >
                                  {(day as any).isRevision ? "REVISION" : "LESSONS"}
                                </button>
                              )}
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
                                  const hName = hMap[day.date] || hMap[parts.map((p,i) => i < 2 ? p.padStart(2, '0') : p).join('-')];
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
                            <td className="p-2 border-r border-black align-top h-full w-48">
                              {currentSyllabus ? (
                                <div className="space-y-2">
                                  <select
                                    value={day.topic}
                                    onChange={(e) => handleForecastChange(idx, 'topic', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-bold text-slate-800 outline-none"
                                  >
                                    <option value="">Select Topic</option>
                                    {day.topic && !currentSyllabus.some(t => t.title === day.topic) && (
                                      <option value={day.topic}>{stripPageNumbers(day.topic)}</option>
                                    )}
                                    {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishPreparationMode !== 'normal' ? (
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

                                  <div>
                                    <div className="text-[8px] font-black uppercase text-indigo-700 mb-0.5">Subtopic:</div>
                                    <select
                                      value={day.subtopic}
                                      onChange={(e) => handleForecastChange(idx, 'subtopic', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                    >
                                      <option value="">Select Sub-topic</option>
                                      {day.subtopic && !getSubtopicsForTopic(day.topic).some(st => st.title === day.subtopic) && (
                                        <option value={day.subtopic}>{stripPageNumbers(day.subtopic)}</option>
                                      )}
                                      {getSubtopicsForTopic(day.topic).map((st, stIdx) => (
                                        <option key={`${st.title}-${stIdx}`} value={st.title}>{stripPageNumbers(st.title)}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <textarea
                                    placeholder="Day topic..."
                                    value={day.topic}
                                    onChange={(e) => handleForecastChange(idx, 'topic', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-bold text-slate-800 outline-none resize-none min-h-[36px]"
                                  />
                                  <div>
                                    <div className="text-[8px] font-black uppercase text-indigo-700 mb-0.5">Subtopic:</div>
                                    <textarea
                                      value={day.subtopic}
                                      onChange={(e) => handleForecastChange(idx, 'subtopic', e.target.value)}
                                      placeholder="Enter sub-topic"
                                      className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none resize-none min-h-[36px]"
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-2 border-r border-black align-top h-full w-40">
                              {currentSyllabus ? (
                                <select
                                  value={day.competency}
                                  onChange={(e) => handleForecastChange(idx, 'competency', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-700 outline-none"
                                >
                                  <option value="">{curriculumType === 'OBC' ? 'Select Outcome' : 'Select Competency'}</option>
                                  {day.competency && !getCompetenciesForSubtopic(day.topic, day.subtopic).some(c => c === day.competency) && (
                                    <option value={day.competency}>{day.competency}</option>
                                  )}
                                  {getCompetenciesForSubtopic(day.topic, day.subtopic).map((c, cIdx) => (
                                    <option key={`${c}-${cIdx}`} value={c}>{c}</option>
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
                            {curriculumType === 'OBC' && (
                              <>
                                <td className="p-2 border-r border-black align-top h-full w-36">
                                  <textarea
                                    value={(day as any).knowledge || ''}
                                    onChange={(e) => handleForecastChange(idx, 'knowledge', e.target.value)}
                                    placeholder="Knowledge..."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-36">
                                  <textarea
                                    value={(day as any).skills || ''}
                                    onChange={(e) => handleForecastChange(idx, 'skills', e.target.value)}
                                    placeholder="Skills..."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-36">
                                  <textarea
                                    value={(day as any).values || ''}
                                    onChange={(e) => handleForecastChange(idx, 'values', e.target.value)}
                                    placeholder="Values..."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-36">
                                  <textarea
                                    value={(day as any).teachingMethods || ''}
                                    onChange={(e) => handleForecastChange(idx, 'teachingMethods', e.target.value)}
                                    placeholder="Teaching methods..."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-32">
                                  <textarea
                                    value={(day as any).teachingAids || ''}
                                    onChange={(e) => handleForecastChange(idx, 'teachingAids' as any, e.target.value)}
                                    placeholder="T/L Aids..."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                                <td className="p-2 text-left align-top h-full w-36">
                                  <textarea
                                    value={(day as any).references || ''}
                                    onChange={(e) => handleForecastChange(idx, 'references', e.target.value)}
                                    placeholder="Syllabus, Page: .........."
                                    className="w-full h-full bg-transparent border-0 outline-none text-[9px] font-medium resize-none shadow-inner bg-slate-50/50 p-2 rounded"
                                  />
                                </td>
                              </>
                            )}
                            {curriculumType !== 'OBC' && (
                              <>
                                <td className="p-2 border-r border-black align-top h-full w-44">
                                  <textarea
                                    value={day.expectedStandard || ''}
                                    onChange={(e) => handleForecastChange(idx, 'expectedStandard', e.target.value)}
                                    placeholder="Syllabus Expected Standard..."
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-[9px] font-medium outline-none resize-none min-h-[58px] shadow-2xs"
                                  />
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-56">
                                  {(day as any).isRevision ? (
                                    <div className="font-black text-xs text-red-500 uppercase text-center py-5">REVISION</div>
                                  ) : (
                                    (() => {
                                      const { currentDayActs } = getWeeklyForecastLearningActivitiesForDay(day, idx);
                                      const dayActs = (day.activities && day.activities.length > 0) ? day.activities : ['', ''];
                                      
                                      return (
                                        <div className="flex flex-col gap-2">
                                          {[0, 1].map((aIdx) => {
                                            const currentVal = dayActs[aIdx] || '';
                                            return (
                                              <div key={aIdx} className="flex flex-col border-b border-slate-100 last:border-0 pb-1.5">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-800 mb-0.5">
                                                  Slot {aIdx + 1}: Activity {aIdx + 1}
                                                </span>
                                                {currentSyllabus ? (
                                                  <select
                                                    value={currentVal && currentDayActs.includes(currentVal) ? currentVal : ""}
                                                    disabled={!day.competency}
                                                    onChange={(e) => handleForecastChange(idx, 'activities', e.target.value, aIdx)}
                                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium text-slate-800 outline-none hover:border-emerald-400 focus:border-emerald-500 shadow-2xs disabled:bg-slate-50 disabled:text-slate-400"
                                                  >
                                                    <option value="">
                                                      {!day.competency 
                                                        ? "Select Specific Competency first" 
                                                        : (currentDayActs.length === 0 ? "No activities found for this competency" : `Select Activity ${aIdx + 1}`)}
                                                    </option>
                                                    {currentDayActs.length > 0 && (
                                                      <optgroup label={day.competency ? `Activities for ${parseRawCompetency(day.competency).briefCompetency || stripPageNumbers(day.competency)}` : "Activities for Selected Competency"}>
                                                        {currentDayActs.map((act, actIdx) => (
                                                          <option key={`${act}-${actIdx}`} value={act}>{act}</option>
                                                        ))}
                                                      </optgroup>
                                                    )}
                                                  </select>
                                                ) : (
                                                  <textarea
                                                    value={currentVal}
                                                    onChange={(e) => handleForecastChange(idx, 'activities', e.target.value, aIdx)}
                                                    placeholder={`Activity ${aIdx + 1}...`}
                                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium outline-none resize-none min-h-[32px] shadow-2xs"
                                                  />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()
                                  )}
                                </td>
                                <td className="p-2 border-r border-black align-top h-full w-40">
                                  <textarea
                                    value={(day as any).teachingMethods || ''}
                                    onChange={(e) => handleForecastChange(idx, 'teachingMethods', e.target.value)}
                                    placeholder="Lesson Teaching Methods..."
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-[9px] font-medium outline-none resize-none min-h-[58px] shadow-2xs"
                                  />
                                </td>
                                <td className="p-2 align-top h-full w-36">
                                  <textarea
                                    value={(day as any).references || ''}
                                    onChange={(e) => handleForecastChange(idx, 'references', e.target.value)}
                                    placeholder="Syllabus, Page: .........."
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-[9px] font-medium outline-none resize-none min-h-[58px] shadow-2xs"
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!isIWP && renderKnowledgeBase()}
            </>
          )}
        </div>
      )}

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
                            {getCompetenciesForSubtopic(lesson.topic, lesson.subtopic).map((c, cIdx) => (
                              <option key={`${c}-${cIdx}`} value={c}>{c}</option>
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
                        {formData.topic && currentSyllabus && !currentSyllabus.some(t => t.title === formData.topic) && (
                          <option value={formData.topic}>{formData.topic} (Synced / Forecast)</option>
                        )}
                        {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral')) && formData.englishPreparationMode !== 'normal' ? (
                          formData.englishCombined ? (
                            <>
                              {renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")}
                              {renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")}
                            </>
                          ) : (formData.subject.toLowerCase().includes('literacy') || formData.englishComponent === 'literacy') ? (
                            renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")
                          ) : (formData.subject.toLowerCase().includes('oral') || formData.englishComponent === 'oral') ? (
                            renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")
                          ) : (
                            <>
                              {renderEnglishOptions(getEnglishTopics().oral, "ORAL ENGLISH")}
                              {renderEnglishOptions(getEnglishTopics().literacy, "LITERACY IN ENGLISH")}
                            </>
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
                                    specificCompetences: nextCompetencies.join(""),
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
                            {formData.subtopic && !getSubtopicsForTopic(formData.topic).some(st => st.title === formData.subtopic) && (
                              <option value={formData.subtopic}>{formData.subtopic} (Synced / Forecast)</option>
                            )}
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
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {curriculumType === 'OBC' ? 'SPECIFIC OUTCOMES' : 'SPECIFIC COMPETENCES'}
                  </label>
                  {formData.type === 'lesson_notes' ? (
                    <div className="space-y-4">
                      {currentSyllabus ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {(formData.selectedSubtopics && formData.selectedSubtopics.length > 0) ? (
                             formData.selectedSubtopics.map((stName, stIdx) => {
                              const comps = getCompetenciesForSubtopic(formData.topic, stName);
                              return (
                                <div key={`${stName}-${stIdx}`} className="space-y-2">
                                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">{stName}</p>
                                  <div className="flex flex-col gap-1.5">
                                    {comps.map((c, cIdx) => {
                                      const currentSelected = safeString(formData.specificCompetences).split('\n').filter(Boolean).map(x => cleanKey(x));
                                      const isSelected = currentSelected.includes(cleanKey(c));
                                      return (
                                        <button
                                          key={`${stName}-${c}-${cIdx}`}
                                          type="button"
                                          onClick={() => {
                                            const current = safeString(formData.specificCompetences).split('\n').filter(x => x.trim());
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
                                              specificCompetences: next.join(''),
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
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1 flex items-center gap-1.5">
                            <span>{curriculumType === 'OBC' ? 'Select / Toggle Syllabus Outcomes:' : 'Select / Toggle Syllabus Competencies:'}</span>
                            {formData.type === 'lesson_plan' && (
                              <span className="text-emerald-700 font-bold lowercase tracking-normal">(tick 1 only)</span>
                            )}
                          </p>
                          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {getCompetenciesForSubtopic(formData.topic, formData.subtopic).map((c, cIdx) => {
                              const currentSelected = safeString(formData.specificCompetences).split('\n').filter(Boolean).map(x => cleanKey(x));
                              const isSelected = currentSelected.includes(cleanKey(c));
                              return (
                                <button
                                  key={`${c}-${cIdx}`}
                                  type="button"
                                  onClick={() => {
                                    if (formData.type === 'lesson_plan') {
                                      const newText = isSelected ? '' : c;
                                      const activities = getActivitiesForSubtopic(formData.topic, formData.subtopic, newText);
                                      setFormData(prev => ({
                                        ...prev,
                                        specificCompetences: newText,
                                        learningActivities: activities.slice(0, 2)
                                      }));
                                      return;
                                    }
                                    const current = safeString(formData.specificCompetences).split('\n').filter(x => x.trim());
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
                              <p className="text-[10px] text-slate-400 italic">
                                {curriculumType === 'OBC' 
                                  ? 'Select a topic and sub-topic above to view available outcomes.' 
                                  : 'Select a topic and sub-topic above to view available competencies.'}
                              </p>
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

                {curriculumType !== 'OBC' && formData.type !== 'schemes_of_work' && formData.type !== 'weekly_forecast' && (
                  <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <span>LEARNING ACTIVITIES</span>
                      {formData.type === 'lesson_plan' && (
                        <span className="text-emerald-600 font-bold lowercase tracking-normal">(select 1 or 2)</span>
                      )}
                    </label>
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
                            const selectedInDoc = safeString(formData.specificCompetences).split('\n').filter(x => x.trim()).map(n => cleanKey(n));
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

                      return (
                        availableActivities.length > 0 ? (
                          <>
                            {availableActivities.map((act, idx) => {
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
                                      if (formData.type === 'lesson_plan' && current.length >= 2) {
                                        return { ...prev, learningActivities: [current[1], act] };
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
                            })}
                          </>
                        ) : (
                          <div className="col-span-full py-8 text-center text-slate-400 font-medium italic text-xs">
                            {formData.type === 'lesson_notes' ? "Select sub-topics to view learning activities" : "Select a sub-topic to view learning activities"}
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
              )}
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

        {isLesson && !isIWP && renderKnowledgeBase()}

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

              {/* Real Teaching Diagrams in Lesson Plan Option */}
              <div className="space-y-3 pt-2 border-t border-emerald-100/50 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Include Real Teaching Diagram in Lesson Plan?</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiagramFilterGrade(formData.grade || 'all');
                      setDiagramFilterSubject(formData.subject || 'all');
                      setDiagramFilterTopic(formData.topic || 'all');
                      setDiagramFilterSubtopic(formData.subtopic || 'all');
                      setIsDiagramLibraryOpen(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye size={12} />
                    Browse Diagrams Library
                  </button>
                </div>
                <select 
                  value={formData.includeLessonDiagram !== false ? "yes" : "no"}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeLessonDiagram: e.target.value === 'yes' }))}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all font-bold"
                >
                  <option value="yes">YES - Include compact real teaching diagram (Topic & Subtopic aligned)</option>
                  <option value="no">NO - Text only lesson plan</option>
                </select>
                {formData.includeLessonDiagram !== false && (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {formData.selectedLessonDiagram ? `Selected Diagram: ${formData.selectedLessonDiagram.title}` : `Auto-Selected Diagram by Topic & Subtopic`}
                      </span>
                      {formData.selectedLessonDiagram && (
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, selectedLessonDiagram: undefined }))}
                          className="text-red-500 font-bold hover:underline text-[10px] cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                    {formData.selectedLessonDiagram && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        Topic: <strong>{formData.selectedLessonDiagram.topic}</strong> | Subtopic: <strong>{formData.selectedLessonDiagram.subtopic}</strong>
                      </div>
                    )}
                    <p className="text-[9.5px] text-emerald-700 font-medium leading-tight">
                      * Real teaching diagrams in lesson plans are rendered in small, compact, clearly visible sizes inside Stage 2 / Teaching Aids so they remain crisp and readable without overflowing pages.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 sm:pt-8 border-t border-slate-100 flex flex-col items-center w-full px-1 sm:px-0">
          {!['lesson_notes', 'video_script'].includes(formData.type) && (
            <>
              {/* Document Upload Card - Placed on top of the instruction box */}
              {(() => {
                // Schemes of work, weekly forecast, lesson plan, assessments have no upload card in normal preparations
                if (['schemes_of_work', 'weekly_forecast', 'lesson_plan', 'assessments', 'lesson_notes', 'video_script'].includes(formData.type)) {
                  return null;
                }
                const guidance = getDocGuidanceInfo(formData.type, getDocTypeTitle(formData.type));

                return (
                  <div className="w-full sm:max-w-2xl mb-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting}
                      className="w-full flex items-center gap-3 p-3.5 sm:p-4 bg-pink-50/90 border border-pink-300 rounded-2xl hover:bg-pink-100/90 transition-all text-left shadow-xs group cursor-pointer disabled:opacity-50"
                    >
                      <div className="p-2.5 sm:p-3 bg-pink-600 text-white rounded-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                        {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                      </div>
                      <div>
                        <h5 className="text-[11px] sm:text-xs font-black text-pink-950 uppercase tracking-tight">
                          {guidance.uploadButtonTitle}
                        </h5>
                        <p className="text-[9.5px] sm:text-[10px] text-pink-800 font-semibold">
                          {guidance.uploadButtonSubtitle}
                        </p>
                      </div>
                    </button>
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileExtract} />
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*,.doc,.docx" multiple className="hidden" onChange={handleFileExtract} />
                  </div>
                );
              })()}

              {/* Active Timetable Relationship Reminder for Weekly Forecast */}
              {formData.type === 'weekly_forecast' && (
                <div className="w-full sm:max-w-2xl mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-950 font-bold shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  <span>Timetable weekly forecast relationship is now turned ON and active (Aligned with your 3-month Teaching Timetable)</span>
                </div>
              )}

              {/* Important Note of Instructions / Additional Context Box */}
              <div className="w-full sm:max-w-2xl mb-5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {!['schemes_of_work', 'weekly_forecast'].includes(formData.type) && (
                    <label className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>{isIWP ? "Professional Context / Specific Roles" : `Important Note of Instructions / ${getDocTypeTitle(formData.type)} Context`}</span>
                    </label>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto ml-auto">

                    <button
                      type="button"
                      onClick={() => {
                        const hasSelectedTopics = Boolean(
                          (formData.topic && formData.topic.trim() !== '') || 
                          (formData.stoppingTopic && formData.stoppingTopic.trim() !== '') || 
                          (formData.selectedTopics && formData.selectedTopics.length > 0)
                        );
                        const syllabusRange = (formData.type === 'schemes_of_work' && hasSelectedTopics) 
                          ? (filterSyllabusForSchemes(currentSyllabus, formData.topic, formData.stoppingTopic, formData.selectedTopics) || [])
                          : [];
                        const activeText = getTailoredDocInstructions({
                          type: formData.type,
                          grade: formData.grade,
                          subject: formData.subject,
                          topic: formData.topic,
                          stoppingTopic: formData.stoppingTopic,
                          forecastWeek: formData.forecastWeek,
                          dayOfWeek: formData.dayOfWeek,
                          weekNumber: formData.weekNumber,
                          lessonNumber: formData.lessonNumber,
                          lessonWeekNumber: formData.lessonWeekNumber,
                          numberOfDays: formData.forecastDays?.length || 5,
                          selectedTopics: formData.selectedTopics,
                          syllabusRange
                        });
                        setFormData(prev => ({ ...prev, additionalContext: activeText }));
                        toast.success(`Activated instructions for ${getDocTypeTitle(formData.type)}!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>activate instructions for normal preparations</span>
                    </button>
                  </div>
                </div>
                <textarea 
                  name="additionalContext" 
                  value={formData.additionalContext || ''} 
                  onChange={handleInputChange} 
                  placeholder={getDocPlaceholder(formData.type)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs text-xs leading-relaxed" 
                  rows={4} 
                />
                {isPastedOutsideSchemes(formData.additionalContext) && (
                  <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                        <ClipboardList size={14} />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase text-indigo-900 tracking-tight block">
                          Outside Source Content Detected (Truthful Preparation Active)
                        </span>
                        <p className="text-[10px] text-indigo-700 font-medium">
                          {formData.type === 'schemes_of_work' 
                            ? "Order & content will strictly follow what was prepared by the outsider source."
                            : formData.type === 'weekly_forecast'
                            ? `Week ${formData.forecastWeek || 1} content will be truthfully extracted exactly the way it was pasted.`
                            : `Week ${formData.lessonWeekNumber || 1}, Day ${formData.lessonNumber || 1} content will be truthfully extracted from pasted forecast/scheme.`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const targetWeekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
                        const targetDayNum = Number(formData.lessonNumber) || 1;
                        const metadata = extractFullMetadataFromText(formData.additionalContext, targetDayNum, targetWeekNum);

                        if (formData.type === 'schemes_of_work') {
                          const parsedWeeks = parsePastedSchemesTextToWeeks(formData.additionalContext);
                          if (parsedWeeks.length > 0) {
                            setFormData(prev => {
                              const updated = { ...prev, weeks: parsedWeeks };
                              if (metadata.grade) updated.grade = metadata.grade;
                              if (metadata.subject) updated.subject = metadata.subject;
                              if (metadata.topic) updated.topic = metadata.topic;
                              if (metadata.subtopic) updated.subtopic = metadata.subtopic;
                              return updated;
                            });
                            toast.success(`Successfully populated ${parsedWeeks.length} weeks from pasted outside schemes!`);
                          } else {
                            toast.error("Could not parse structured weeks in the pasted text. The AI will still extract it during generation.");
                          }
                        } else if (formData.type === 'weekly_forecast') {
                          if (isPastedWeeklyForecast(formData.additionalContext)) {
                            const parsedDays = parsePastedWeeklyForecast(formData.additionalContext, formData.grade, formData.subject, formData.curriculumType);
                            if (parsedDays && parsedDays.length > 0) {
                              setFormData(prev => {
                                const updated = {
                                  ...prev,
                                  forecastDays: prev.forecastDays.map((day, dIdx) => {
                                    const parsed = parsedDays.find(p => p.day === (dIdx + 1)) || parsedDays[dIdx];
                                    if (!parsed) return day;
                                    return {
                                      ...day,
                                      date: parsed.date || day.date,
                                      component: parsed.component || (day as any).component || '',
                                      topic: parsed.topic || day.topic,
                                      subtopic: parsed.subtopic || day.subtopic,
                                      competency: parsed.competency || day.competency,
                                      knowledge: parsed.knowledge || (day as any).knowledge || '',
                                      skills: parsed.skills || (day as any).skills || '',
                                      values: parsed.values || (day as any).values || '',
                                      expectedStandard: parsed.expectedStandard || (day as any).expectedStandard || '',
                                      activities: (parsed.activities && parsed.activities.length > 0) ? parsed.activities : day.activities,
                                      teachingMethods: parsed.teachingMethods || (day as any).teachingMethods || '',
                                      teachingAids: parsed.teachingAids || day.teachingAids,
                                      references: parsed.references || day.references
                                    };
                                  })
                                };
                                if (parsedDays[0]?.topic) updated.topic = parsedDays[0].topic;
                                if (parsedDays[0]?.subtopic) updated.subtopic = parsedDays[0].subtopic;
                                if (parsedDays[0]?.competency) updated.specificCompetences = parsedDays[0].competency;
                                if (metadata.grade) updated.grade = metadata.grade;
                                if (metadata.subject) updated.subject = metadata.subject;
                                return updated;
                              });
                              toast.success(`Populated Day 1 to Day ${Math.min(5, parsedDays.length)} directly from pasted Weekly Forecast (syllabus aligned)!`);
                              return;
                            }
                          }
                          const targetWeekNum = Number(formData.forecastWeek) || 1;
                          const weekData = extractWeekFromPastedText(formData.additionalContext, targetWeekNum);
                          if (weekData) {
                            const numDays = formData.forecastDays?.length || 5;
                            setFormData(prev => {
                              const updated = {
                                ...prev,
                                forecastDays: prev.forecastDays.map((day, dIdx) => {
                                  const numSubs = weekData.subtopics?.length || 1;
                                  const subIndex = Math.min(Math.floor((dIdx / numDays) * numSubs), numSubs - 1);
                                  
                                  const sub = weekData.subtopics?.[subIndex] || weekData.subtopics?.[0] || day.subtopic;
                                  const comp = weekData.competencies?.[subIndex] || weekData.competencies?.[0] || day.competency;
                                  
                                  const knowDays = splitContentIntoDays(weekData.knowledge?.[subIndex] || weekData.knowledge?.[0] || '');
                                  const skillDays = splitContentIntoDays(weekData.skills?.[subIndex] || weekData.skills?.[0] || '');
                                  const valDays = splitContentIntoDays(weekData.values?.[subIndex] || weekData.values?.[0] || '');
                                  const actDays = splitContentIntoDays(weekData.activities?.[subIndex] || weekData.activities?.[0] || '');
                                  
                                  const know = knowDays[dIdx % knowDays.length];
                                  const skill = skillDays[dIdx % skillDays.length];
                                  const val = valDays[dIdx % valDays.length];
                                  const dayAct = actDays[dIdx % actDays.length];
                                  
                                  const expStd = weekData.expectedStandards?.[subIndex] || weekData.expectedStandards?.[0] || '';
                                  const methodDays = splitContentIntoDays(weekData.methods && weekData.methods.length > 0 ? weekData.methods.join(' • ') : '');
                                  const methods = methodDays[dIdx % methodDays.length];

                                  return {
                                    ...day,
                                    topic: weekData.topic || day.topic,
                                    subtopic: sub,
                                    competency: comp,
                                    knowledge: know,
                                    skills: skill,
                                    values: val,
                                    expectedStandard: expStd,
                                    teachingMethods: methods,
                                    activities: dayAct ? [dayAct] : day.activities,
                                    teachingAids: weekData.teachingAids || day.teachingAids,
                                    references: weekData.references || day.references
                                  };
                                })
                              };
                              if (metadata.grade) updated.grade = metadata.grade;
                              if (metadata.subject) updated.subject = metadata.subject;
                              if (metadata.topic) updated.topic = metadata.topic;
                              if (metadata.subtopic) updated.subtopic = metadata.subtopic;
                              return updated;
                            });
                            toast.success(`Populated Week ${targetWeekNum} table from pasted outside schemes!`);
                          } else {
                            toast.error(`Could not find Week ${targetWeekNum} in pasted text. The AI will locate it during generation.`);
                          }
                        } else if (formData.type === 'lesson_plan') {
                          const weekNum = Number(formData.lessonWeekNumber || formData.forecastWeek) || 1;
                          const dayNum = Number(formData.lessonNumber) || 1;
                          const lessonData = extractLessonFromPastedForecastText(formData.additionalContext, dayNum, weekNum, formData.grade, formData.subject, formData.curriculumType);
                          if (lessonData) {
                            setFormData(prev => {
                              const updated = {
                                ...prev,
                                topic: lessonData.topic || prev.topic,
                                subtopic: lessonData.subtopic || prev.subtopic,
                                specificCompetences: safeString(lessonData.competency || prev.specificCompetences),
                                knowledge: safeString(lessonData.knowledge || prev.knowledge || ''),
                                activities: lessonData.learningActivities?.length > 0 ? lessonData.learningActivities : prev.activities,
                                teachingAids: lessonData.teachingAids || prev.teachingAids,
                                references: lessonData.references || prev.references
                              };
                              if (metadata.grade) updated.grade = metadata.grade;
                              if (metadata.subject) updated.subject = metadata.subject;
                              if (!lessonData.topic && metadata.topic) updated.topic = metadata.topic;
                              if (!lessonData.subtopic && metadata.subtopic) updated.subtopic = metadata.subtopic;
                              return updated;
                            });
                            toast.success(`Populated Lesson Plan (Week ${weekNum}, Day ${dayNum}) from pasted content!`);
                          } else {
                            toast.error(`Could not parse Week ${weekNum} Day ${dayNum} in pasted text. The AI will locate it during generation.`);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>
                        {formData.type === 'schemes_of_work' 
                          ? "Populate Schemes Table" 
                          : formData.type === 'weekly_forecast'
                          ? `Populate Week ${formData.forecastWeek || 1}`
                          : `Populate Lesson Plan (W${formData.lessonWeekNumber || 1}, D${formData.lessonNumber || 1})`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="w-full sm:max-w-2xl bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 mb-5 animate-pulse">
               <Info size={18} className="text-amber-500 shrink-0" />
               <p className="text-[10px] font-black uppercase tracking-tight text-amber-700 leading-tight">
                 {error}
               </p>
            </div>
          )}

          {/* Document Content Scale Switches - Placed directly on top of the Generate Document button as requested and drawn in red */}
          {(isLesson || isForecast || isIWP) && (
            <div className="w-full sm:max-w-md grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              {/* Switch 1: Lighter Scale */}
              <div
                id="switch-scale-lighter-btn"
                role="button"
                tabIndex={0}
                onClick={() => setFormData(prev => ({ ...prev, contentScale: 'lighter' }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, contentScale: 'lighter' }));
                  }
                }}
                className={cn(
                  "flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all text-left cursor-pointer select-none border-2",
                  formData.contentScale === 'lighter'
                    ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                )}
              >
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black tracking-tight">🪶 Lighter Scale</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 truncate mt-0.5">
                    {isLesson ? '1.5 – 2 Pages' : isForecast ? 'Compact 1 Page' : 'Core Targets'}
                  </div>
                </div>
                {/* Visual Toggle Switch */}
                <div className={cn(
                  "w-10 h-6 sm:w-11 sm:h-6 rounded-full p-0.5 flex items-center transition-colors shrink-0",
                  formData.contentScale === 'lighter' ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                )}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                    {formData.contentScale === 'lighter' && <Check size={12} className="text-emerald-600" strokeWidth={3} />}
                  </div>
                </div>
              </div>

              {/* Switch 2: Medium Scale (Standard Default) */}
              <div
                id="switch-scale-medium-btn"
                role="button"
                tabIndex={0}
                onClick={() => setFormData(prev => ({ ...prev, contentScale: 'medium' }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, contentScale: 'medium' }));
                  }
                }}
                className={cn(
                  "flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all text-left cursor-pointer select-none border-2",
                  (formData.contentScale === 'medium' || !formData.contentScale)
                    ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
                )}
              >
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs sm:text-sm font-black tracking-tight">📋 Medium Scale</span>
                    <span className="text-[7.5px] sm:text-[8.5px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      Default
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 truncate mt-0.5">
                    {isLesson ? 'Full 2 Pages' : isForecast ? '1 Page + Examples' : 'Detailed Plan'}
                  </div>
                </div>
                {/* Visual Toggle Switch */}
                <div className={cn(
                  "w-10 h-6 sm:w-11 sm:h-6 rounded-full p-0.5 flex items-center transition-colors shrink-0",
                  (formData.contentScale === 'medium' || !formData.contentScale) ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                )}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center">
                    {(formData.contentScale === 'medium' || !formData.contentScale) && <Check size={12} className="text-emerald-600" strokeWidth={3} />}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:max-w-md px-6 py-3.5 sm:px-8 sm:py-4 bg-[#00A86B] hover:bg-[#008f5d] disabled:opacity-50 text-white rounded-[2rem] shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all flex-col cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={22} />
                  <span className="text-base sm:text-lg font-black uppercase tracking-widest">Generating...</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-100 tracking-widest uppercase mt-1 animate-pulse">
                  {progressText}
                </span>
              </>
            ) : loading ? (
                 <Loader2 className="animate-spin" size={22} />
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Wand2 size={22} />
                <span className="text-base sm:text-lg font-black uppercase tracking-widest">Generate Document</span>
              </div>
            )}
          </button>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            Powered by Gemini AI • {curriculumType === 'OBC' ? 'OBC Zambian Standard' : 'CBC Zambian Standard'}
          </p>
        </div>
      </div>
    </div>
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
                You currently have no active saved Schemes of Work or Weekly Forecasts in your sync history. Generate a Scheme of Work or Weekly Forecast first to enable instant synchronization.
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

  {/* AI Draft Pop-up Modal for Expected Standards & Learning Activities */}
  {openStandardsModalWeekIdx !== null && formData.weeks && formData.weeks[openStandardsModalWeekIdx] && (() => {
    const weekIdx = openStandardsModalWeekIdx;
    const week = formData.weeks[weekIdx];
    const weekTopic = week.topic || (weekIdx === 0 ? formData.topic : '');
    const weekSubs = (week.subtopics || []).map(s => stripPageNumbers(s)).filter(Boolean);
    
    // Find all standards for this week from syllabus
    const allUniqueStds: string[] = [];
    if (weekSubs.length > 0) {
      weekSubs.forEach(st => {
        const stds = getExpectedStandardsForSubtopic(weekTopic, st, currentSyllabus);
        stds.forEach(s => {
          if (!allUniqueStds.includes(s)) allUniqueStds.push(s);
        });
      });
    }
    if (allUniqueStds.length === 0 && week.competencies && week.competencies.length > 0) {
      week.competencies.forEach(c => {
        const s = deriveExpectedStandardFromCompetency(c);
        if (s && !allUniqueStds.includes(s)) allUniqueStds.push(s);
      });
    }
    if (allUniqueStds.length === 0 && weekTopic) {
      const stds = getExpectedStandardsForSubtopic(weekTopic, '', currentSyllabus);
      stds.forEach(s => {
        if (!allUniqueStds.includes(s)) allUniqueStds.push(s);
      });
    }

    // Find all learning activities for this week from syllabus
    const allUniqueActs: string[] = [];
    if (weekSubs.length > 0) {
      weekSubs.forEach((st, sIdx) => {
        const comp = week.competencies?.[sIdx] || '';
        const acts = getActivitiesForSubtopic(weekTopic, st, comp, currentSyllabus, formData.grade, formData.subject);
        acts.forEach(a => {
          if (!allUniqueActs.includes(a)) allUniqueActs.push(a);
        });
      });
    }
    if (allUniqueActs.length === 0 && week.competencies && week.competencies.length > 0) {
      week.competencies.forEach((c, cIdx) => {
        const sub = weekSubs[cIdx] || '';
        const acts = deriveLearningActivitiesFromCompetency(c, sub, weekTopic);
        acts.forEach(a => {
          if (!allUniqueActs.includes(a)) allUniqueActs.push(a);
        });
      });
    }
    if (allUniqueActs.length === 0 && weekTopic) {
      const acts = getActivitiesForSubtopic(weekTopic, '', undefined, currentSyllabus, formData.grade, formData.subject);
      acts.forEach(a => {
        if (!allUniqueActs.includes(a)) allUniqueActs.push(a);
      });
    }

    if (isOBCLanguageScheme && weekTopic) {
      const obcKnow = getOBCKnowledgeForTopic(weekTopic);
      obcKnow.forEach(k => {
        if (!allUniqueActs.includes(k)) allUniqueActs.push(k);
      });
    }

    const handleApplyNumberedStandards = (stdsToApply: string[]) => {
      const formatted = stdsToApply.length > 1
        ? stdsToApply.map((s, i) => `${i + 1}. ${s}`).join('')
        : (stdsToApply[0] || '');
      handleWeekChange(weekIdx, 'expectedStandards', null, formatted);
    };

    const handleToggleIndividualStandard = (std: string) => {
      const currentVal = Array.isArray(week.expectedStandards) ? (week.expectedStandards[0] || '') : (week.expectedStandards || '');
      const lines = currentVal.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      let nextLines: string[];
      if (lines.includes(std)) {
        nextLines = lines.filter(l => l !== std);
      } else {
        nextLines = [...lines, std];
      }
      const formatted = nextLines.length > 1
        ? nextLines.map((s, i) => `${i + 1}. ${s}`).join('')
        : (nextLines[0] || '');
      handleWeekChange(weekIdx, 'expectedStandards', null, formatted);
    };

    const handleApplyNumberedActivities = (actsToApply: string[]) => {
      const formatted = actsToApply.length > 1
        ? actsToApply.map((a, i) => `${i + 1}. ${a}`).join('')
        : (actsToApply[0] || '');
      handleWeekChange(weekIdx, 'activities', null, formatted);
    };

    const handleToggleIndividualActivity = (act: string) => {
      const currentVal = Array.isArray(week.activities) ? (week.activities[0] || '') : (week.activities || '');
      const lines = currentVal.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      let nextLines: string[];
      if (lines.includes(act)) {
        nextLines = lines.filter(l => l !== act);
      } else {
        nextLines = [...lines, act];
      }
      const formatted = nextLines.length > 1
        ? nextLines.map((a, i) => `${i + 1}. ${a}`).join('')
        : (nextLines[0] || '');
      handleWeekChange(weekIdx, 'activities', null, formatted);
    };

    const currentStdVal = Array.isArray(week.expectedStandards) ? (week.expectedStandards[0] || '') : (week.expectedStandards || '');
    const currentActVal = Array.isArray(week.activities) ? (week.activities[0] || '') : (week.activities || '');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 overflow-hidden flex flex-col max-h-[92vh]">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
                <Sparkles size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  AI Draft Pop-up • Week {week.week}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Topic: <span className="font-bold text-slate-700">{weekTopic || 'Not Selected'}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenStandardsModalWeekIdx(null)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Tabs */}
          {!isOBCLanguageScheme ? (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStandardsModalTab('standards')}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
                  standardsModalTab === 'standards'
                    ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <CheckCircle2 size={14} className={standardsModalTab === 'standards' ? "text-emerald-600" : "text-slate-400"} />
                <span>{curriculumType === 'OBC' ? 'Skills' : 'Expected Standards'} ({allUniqueStds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStandardsModalTab('activities')}
                className={cn(
                  "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2",
                  standardsModalTab === 'activities'
                    ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Sparkles size={14} className={standardsModalTab === 'activities' ? "text-blue-600" : "text-slate-400"} />
                <span>{curriculumType === 'OBC' ? 'Knowledge' : 'Learning Activities'} ({allUniqueActs.length})</span>
              </button>
            </div>
          ) : (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <div className="flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-white text-blue-700 shadow-xs border border-blue-200 flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                <span>Knowledge & Learning Activities ({allUniqueActs.length})</span>
              </div>
            </div>
          )}

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Logic explanation box */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-xs text-blue-900 font-medium leading-relaxed flex items-start gap-2.5">
              <BookOpen size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">Syllabus Logic Alignment:</p>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  {isOBCLanguageScheme
                    ? "The selected Component, Topic, and Specific Outcomes automatically derive the authentic Knowledge statements directly from the syllabus. Verify below or click to select/edit."
                    : (standardsModalTab === 'standards'
                        ? `The selected Topic, Subtopic(s), and Outcomes automatically derive the authentic ${curriculumType === 'OBC' ? 'Skills' : 'Expected Standards'} directly from the syllabus. Verify below or click to select/edit.`
                        : `The selected Topic, Subtopic(s), and Outcomes automatically derive the authentic ${curriculumType === 'OBC' ? 'Knowledge' : 'Learning Activities'} directly from the syllabus. Verify below or click to select/edit.`)}
                </p>
              </div>
            </div>

            {!isOBCLanguageScheme && standardsModalTab === 'standards' ? (
              <>
                {/* Available Standards/Skills from Syllabus */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                      Official Syllabus {curriculumType === 'OBC' ? 'Skills' : 'Expected Standards'} ({allUniqueStds.length})
                    </span>
                    {allUniqueStds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleApplyNumberedStandards(allUniqueStds)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Use All (Numbered 1, 2, 3)</span>
                      </button>
                    )}
                  </div>

                  {allUniqueStds.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No explicit expected standards found in syllabus for this topic/subtopic. You can enter expected standards directly in the box below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allUniqueStds.map((std, sIdx) => {
                        const isSelected = currentStdVal.includes(std);
                        return (
                          <div
                            key={sIdx}
                            onClick={() => handleToggleIndividualStandard(std)}
                            className={cn(
                              "p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none",
                              isSelected 
                                ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs" 
                                : "bg-white border-slate-200 hover:border-emerald-300 text-slate-800"
                            )}
                          >
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5",
                              isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {sIdx + 1}
                            </span>
                            <div className="flex-1 leading-relaxed">
                              <span className="font-semibold">{std}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                              isSelected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                            )}>
                              {isSelected ? "Selected" : "Click to Add"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Editable Space Box for Expected Standards */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Expected Standards Space Box (Week {week.week})
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Multi-line numbered format (1, 2, 3...)
                    </span>
                  </div>
                  <textarea
                    value={currentStdVal}
                    onChange={(e) => handleWeekChange(weekIdx, 'expectedStandards', null, e.target.value)}
                    placeholder="1. First expected standard&#10;2. Second expected standard..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-medium resize-y min-h-[95px] focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    Expected standards are saved and synced directly to the Schemes of Work table and AI draft.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Available Learning Activities from Syllabus */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                      {isOBCLanguageScheme ? 'Official Syllabus Knowledge Statements' : (curriculumType === 'OBC' ? 'Official Syllabus Knowledge' : 'Official Syllabus Learning Activities')} ({allUniqueActs.length})
                    </span>
                    {allUniqueActs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleApplyNumberedActivities(allUniqueActs)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Use All (Numbered 1, 2, 3)</span>
                      </button>
                    )}
                  </div>

                  {allUniqueActs.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      {isOBCLanguageScheme
                        ? "No explicit knowledge statements found in syllabus for this topic. You can enter knowledge statements directly in the box below."
                        : "No explicit learning activities found in syllabus for this topic/subtopic. You can enter learning activities directly in the box below."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allUniqueActs.map((act, aIdx) => {
                        const isSelected = currentActVal.includes(act);
                        return (
                          <div
                            key={aIdx}
                            onClick={() => handleToggleIndividualActivity(act)}
                            className={cn(
                              "p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none",
                              isSelected 
                                ? "bg-blue-50 border-blue-300 text-blue-950 shadow-xs" 
                                : "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
                            )}
                          >
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5",
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {aIdx + 1}
                            </span>
                            <div className="flex-1 leading-relaxed">
                              <span className="font-semibold">{act}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                              isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                            )}>
                              {isSelected ? "Selected" : "Click to Add"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Editable Space Box for Learning Activities / Knowledge */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      {isOBCLanguageScheme ? 'Knowledge Space Box' : 'Learning Activities Space Box'} (Week {week.week})
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Multi-line numbered format (1, 2, 3...)
                    </span>
                  </div>
                  <textarea
                    value={currentActVal}
                    onChange={(e) => handleWeekChange(weekIdx, 'activities', null, e.target.value)}
                    placeholder={
                      isOBCLanguageScheme
                        ? "1. State knowledge (e.g. phonological awareness, passage analysis)...&#10;2. State learning activity..."
                        : "1. First learning activity&#10;2. Second learning activity..."
                    }
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-medium resize-y min-h-[95px] focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    {isOBCLanguageScheme
                      ? "Knowledge and learning activities are saved and synced directly to the Schemes of Work table and AI draft."
                      : "Learning activities are saved and synced directly to the Schemes of Work table and AI draft."}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (!isOBCLanguageScheme && standardsModalTab === 'standards') {
                  handleWeekChange(weekIdx, 'expectedStandards', null, '');
                } else {
                  handleWeekChange(weekIdx, 'activities', null, '');
                }
              }}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              Clear {isOBCLanguageScheme ? 'Knowledge' : (standardsModalTab === 'standards' ? 'Standards' : 'Activities')}
            </button>
            <button
              type="button"
              onClick={() => setOpenStandardsModalWeekIdx(null)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-95"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    );
  })()}

  {/* Schemes of Work Mark Topics Modal Dialog */}
  {isMarkTopicsModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                <CheckSquare size={16} />
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Mark Topics to Include in Schemes of Work
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                Term {formData.term || '1'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Top Starting Topic: <strong className="text-slate-700">{formData.topic || 'First topic in syllabus'}</strong>. Check all topics you intend to teach this term. Only marked topics will make up your schemes of work, with none left out.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMarkTopicsModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search topics and subtopics..."
                value={markTopicsSearchTerm}
                onChange={(e) => setMarkTopicsSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {markTopicsSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMarkTopicsSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllSyllabusTopics}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <CheckSquare size={13} className="text-emerald-600" />
                <span>Mark All Topics</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAllSyllabusTopics}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
            <span>
              {(() => {
                const total = Array.isArray(currentSyllabus) ? currentSyllabus.length : 0;
                const marked = Array.isArray(currentSyllabus) ? currentSyllabus.filter(t => {
                  const title = typeof t === 'string' ? t : (t?.title || t?.topic || '');
                  return isTopicMarkedForScheme(title);
                }).length : 0;
                return `${marked} of ${total} Syllabus Topics Marked`;
              })()}
            </span>
            {formData.stoppingTopic && (
              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Ending at: {formData.stoppingTopic}
              </span>
            )}
          </div>
        </div>

        {/* Topics List with Checkboxes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {(!currentSyllabus || currentSyllabus.length === 0) ? (
            <div className="text-center py-12 text-slate-400 font-medium text-xs">
              No syllabus topics available for the selected grade and subject.
            </div>
          ) : (
            currentSyllabus
              .filter(t => {
                const title = typeof t === 'string' ? t : (t.title || t.topic || '');
                if (!markTopicsSearchTerm.trim()) return true;
                const term = markTopicsSearchTerm.toLowerCase();
                const matchesTopic = title.toLowerCase().includes(term);
                const matchesSubtopics = Array.isArray(t.subtopics) && t.subtopics.some((st: any) => {
                  const sTitle = typeof st === 'string' ? st : (st.title || st.name || '');
                  return sTitle.toLowerCase().includes(term);
                });
                return matchesTopic || matchesSubtopics;
              })
              .map((t, idx) => {
                const topicTitle = typeof t === 'string' ? t : (t.title || t.topic || '');
                const isMarked = isTopicMarkedForScheme(topicTitle);
                const subtopics = Array.isArray(t.subtopics) ? t.subtopics : [];
                const component = (t as any).component || autoDeriveComponent(topicTitle, formData.subject);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "border rounded-2xl p-3.5 transition-all bg-white",
                      isMarked
                        ? "border-blue-300 shadow-xs bg-blue-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => handleToggleMarkTopic(topicTitle)}
                        className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-lg flex items-center justify-center border transition-all mt-0.5 shrink-0",
                            isMarked
                              ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          )}
                        >
                          {isMarked ? <CheckSquare size={13} /> : <Square size={13} className="opacity-0" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {component && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-2 border-red-500 bg-red-50 text-red-600 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                                {component}
                              </span>
                            )}
                            <span className="text-xs font-black text-blue-600 tracking-tight">
                              {topicTitle}
                            </span>
                          </div>
                          {subtopics.length > 0 && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              {subtopics.length} subtopic{subtopics.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMarkRangeUpToTopic(topicTitle)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-bold rounded-lg transition-all border border-slate-200 active:scale-95 cursor-pointer"
                          title="Mark all topics up to this topic as the ending topic"
                        >
                          Mark up to here
                        </button>
                      </div>
                    </div>

                    {/* Subtopics checklist if marked */}
                    {isMarked && subtopics.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 pl-8 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Subtopics included in schemes:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subtopics.map((st: any, sIdx: number) => {
                            const subTitle = typeof st === 'string' ? st : (st.title || st.name || '');
                            const comps = typeof st === 'object' && Array.isArray(st.competencies) ? st.competencies.join('; ') : (typeof st === 'object' && st.competency ? st.competency : '');
                            const isSubMarked = isSubtopicMarkedForScheme(topicTitle, subTitle);
                            return (
                              <div
                                key={sIdx}
                                onClick={() => handleToggleMarkSubtopic(topicTitle, subTitle)}
                                className={cn(
                                  "flex flex-col gap-1 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all",
                                  isSubMarked
                                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold shadow-2xs"
                                    : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={isSubMarked ? "text-emerald-600 font-bold" : "text-slate-300"}>
                                    {isSubMarked ? "✓" : "○"}
                                  </span>
                                  <span className="font-bold">{subTitle}</span>
                                </div>
                                {comps && (
                                  <div className="pl-5 text-[10.5px] text-emerald-700 font-medium leading-tight">
                                    <strong className="text-emerald-800">Competency:</strong> {comps}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            <strong className="text-slate-700">{formData.selectedTopics?.length || 0} topic(s)</strong> selected for Schemes of Work.
          </div>
          <button
            type="button"
            onClick={() => setIsMarkTopicsModalOpen(false)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Saved Account Educational Diagrams Library Modal */}
  {isDiagramLibraryOpen && (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
              <Sparkles className="text-emerald-300" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Saved Account Educational Diagrams</h3>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">Real objective teaching aids (Pinterest education style) auto-searched and synced to your account.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDiagramLibraryOpen(false)}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved diagrams by title, topic, subject, or tags..."
                value={diagramSearch}
                onChange={(e) => setDiagramSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', name: 'All Categories' },
                { id: 'animals', name: '🐶 Animals' },
                { id: 'fruits_foods', name: '🍎 Fruits & Food' },
                { id: 'household', name: '🪑 Household' },
                { id: 'transport', name: '🚗 Transport' },
                { id: 'science', name: '🔬 Science' },
                { id: 'math', name: '📐 Math' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedDiagramCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                    selectedDiagramCategory === cat.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Explicit Grade, Subject, Topic & Subtopic Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-150">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Filter by Grade</label>
              <select
                value={diagramFilterGrade}
                onChange={(e) => setDiagramFilterGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Grades</option>
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6', 'ECE'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Filter by Subject</label>
              <select
                value={diagramFilterSubject}
                onChange={(e) => setDiagramFilterSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {['English', 'Literacy', 'Mathematics', 'Integrated Science', 'Social Studies', 'Home Economics', 'Agricultural Science', 'Expressive Arts', 'ICT', 'Zambian Languages', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Civic Education'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Topic Filter</label>
              <input
                type="text"
                placeholder="Topic name..."
                value={diagramFilterTopic === 'all' ? '' : diagramFilterTopic}
                onChange={(e) => setDiagramFilterTopic(e.target.value || 'all')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Subtopic Filter</label>
              <input
                type="text"
                placeholder="Subtopic name..."
                value={diagramFilterSubtopic === 'all' ? '' : diagramFilterSubtopic}
                onChange={(e) => setDiagramFilterSubtopic(e.target.value || 'all')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Indicator Banner with Quick Reset */}
        {(diagramFilterGrade !== 'all' || diagramFilterSubject !== 'all' || (diagramFilterTopic !== 'all' && diagramFilterTopic !== '') || (diagramFilterSubtopic !== 'all' && diagramFilterSubtopic !== '')) && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200/50 flex items-center justify-between gap-4 flex-wrap text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">⚡ Intelligent Filters Active:</span>
              {diagramFilterGrade !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-bold">Grade: {diagramFilterGrade}</span>
              )}
              {diagramFilterSubject !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-bold">Subject: {diagramFilterSubject}</span>
              )}
              {diagramFilterTopic !== 'all' && diagramFilterTopic !== '' && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-bold">Topic: {diagramFilterTopic}</span>
              )}
              {diagramFilterSubtopic !== 'all' && diagramFilterSubtopic !== '' && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10.5px] font-bold">Subtopic: {diagramFilterSubtopic}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setDiagramFilterGrade('all');
                setDiagramFilterSubject('all');
                setDiagramFilterTopic('all');
                setDiagramFilterSubtopic('all');
                setDiagramSearch('');
                setSelectedDiagramCategory('all');
                toast.success("All filters reset successfully!");
              }}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Show All Diagrams
            </button>
          </div>
        )}

        {/* Diagrams Grid Grouped by Topic */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 space-y-6">
          {(() => {
            const grouped = getDiagramsGroupedByTopic({
              query: diagramSearch,
              category: selectedDiagramCategory,
              grade: diagramFilterGrade,
              subject: diagramFilterSubject,
              topic: diagramFilterTopic,
              subtopic: diagramFilterSubtopic
            });
            const topicKeys = Object.keys(grouped);

            if (topicKeys.length === 0) {
              return (
                <div className="text-center py-16 text-slate-400 font-medium text-xs space-y-2">
                  <Sparkles size={32} className="mx-auto text-slate-300" />
                  <p>No educational diagrams found matching your current filters.</p>
                  <p className="text-[11px] text-slate-400">Try clearing some of the filters or search term above to browse all available objective diagrams!</p>
                </div>
              );
            }

            return topicKeys.map((topicName, topicIdx) => (
              <div key={`${topicName}-${topicIdx}`} className="space-y-3">
                {/* Topic Header Banner */}
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                    TOPIC: {topicName}
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-auto">
                    {grouped[topicName].length} Diagram(s)
                  </span>
                </div>

                {/* Grid of Diagrams under this Topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped[topicName].map(diag => {
                    // Check which sections this diagram is currently selected for
                    const isSelectedInLesson = formData.selectedLessonDiagram?.title === diag.title;
                    const isSelectedInMCQ = formData.selectedSectionDiagrams?.mcq?.title === diag.title;
                    const isSelectedInShort = formData.selectedSectionDiagrams?.shortAnswer?.title === diag.title;
                    const isSelectedInEssay = formData.selectedSectionDiagrams?.essay?.title === diag.title;
                    const isSelectedInMatch = formData.selectedSectionDiagrams?.matching?.title === diag.title;

                    return (
                      <div key={diag.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider rounded-md">
                              {diag.syllabusSubject} ({diag.grade})
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              Synced to Account ✓
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm">{diag.title}</h4>
                          
                          {/* Explicit Topic & Subtopic Badges */}
                          <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                            <div className="text-slate-700 font-bold flex items-center gap-1">
                              <span className="text-emerald-600">📌 Topic:</span> {diag.topic}
                            </div>
                            <div className="text-slate-800 font-bold flex items-center gap-1">
                              <span className="text-blue-600">🏷️ Subtopic:</span> {diag.subtopic || 'General Concepts'}
                            </div>
                          </div>
                        </div>

                        {/* SVG Render Container */}
                        <div 
                          className="w-full bg-slate-50/80 rounded-xl p-2 border border-slate-100 overflow-hidden flex items-center justify-center min-h-[140px]"
                          dangerouslySetInnerHTML={{ __html: diag.svgContent }}
                        />

                        {/* Intelligent allocation controls & indicators */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Intelligent Allocation Selector</span>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const updated = { ...prev };
                                  if (isSelectedInMCQ) {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      mcq: undefined as any
                                    };
                                    toast.success(`Removed "${diag.title}" from Section A MCQ`);
                                  } else {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      mcq: diag
                                    };
                                    toast.success(`Allocated "${diag.title}" to Section A MCQ!`);
                                  }
                                  return updated;
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border font-bold text-center transition-all cursor-pointer",
                                isSelectedInMCQ 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {isSelectedInMCQ ? "✓ Section A: MCQ" : "Alloc. Section A (MCQ)"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const updated = { ...prev };
                                  if (isSelectedInShort) {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      shortAnswer: undefined as any
                                    };
                                    toast.success(`Removed "${diag.title}" from Section B Short Answer`);
                                  } else {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      shortAnswer: diag
                                    };
                                    toast.success(`Allocated "${diag.title}" to Section B Short Answer!`);
                                  }
                                  return updated;
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border font-bold text-center transition-all cursor-pointer",
                                isSelectedInShort 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {isSelectedInShort ? "✓ Section B: Short" : "Alloc. Section B (Short)"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const updated = { ...prev };
                                  if (isSelectedInEssay) {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      essay: undefined as any
                                    };
                                    toast.success(`Removed "${diag.title}" from Section C Essay`);
                                  } else {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      essay: diag
                                    };
                                    toast.success(`Allocated "${diag.title}" to Section C Essay!`);
                                  }
                                  return updated;
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border font-bold text-center transition-all cursor-pointer",
                                isSelectedInEssay 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {isSelectedInEssay ? "✓ Section C: Essay" : "Alloc. Section C (Essay)"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const updated = { ...prev };
                                  if (isSelectedInMatch) {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      matching: undefined as any
                                    };
                                    toast.success(`Removed "${diag.title}" from Section D Matching`);
                                  } else {
                                    updated.selectedSectionDiagrams = {
                                      ...(prev.selectedSectionDiagrams || {}),
                                      matching: diag
                                    };
                                    toast.success(`Allocated "${diag.title}" to Section D Matching!`);
                                  }
                                  return updated;
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg border font-bold text-center transition-all cursor-pointer",
                                isSelectedInMatch 
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              )}
                            >
                              {isSelectedInMatch ? "✓ Section D: Match" : "Alloc. Section D (Match)"}
                            </button>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 gap-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {diag.tags.map((t, tIdx) => (
                              <span key={`${t}-${tIdx}`} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9.5px] font-medium">#{t}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                toast.success(`Selected "${diag.title}" for Lesson Plan!`);
                                setFormData(prev => ({
                                  ...prev,
                                  type: 'lesson_plan',
                                  topic: diag.topic,
                                  subtopic: diag.subtopic,
                                  subject: diag.syllabusSubject,
                                  includeLessonDiagram: true,
                                  selectedLessonDiagram: {
                                    title: diag.title,
                                    topic: diag.topic,
                                    subtopic: diag.subtopic,
                                    svgContent: diag.svgContent
                                  }
                                }));
                                setIsDiagramLibraryOpen(false);
                              }}
                              className={cn(
                                "px-2.5 py-1 font-bold rounded-lg transition-colors cursor-pointer text-[10.5px]",
                                isSelectedInLesson
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                              )}
                            >
                              {isSelectedInLesson ? "Selected LP ✓" : "Lesson Plan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toast.success(`Selected "${diag.title}" for Assessment!`);
                                setFormData(prev => ({
                                  ...prev,
                                  type: 'assessments',
                                  topic: diag.topic,
                                  subtopic: diag.subtopic,
                                  subject: diag.syllabusSubject
                                }));
                                setIsDiagramLibraryOpen(false);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10.5px]"
                            >
                              Set Primary
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Account diagrams automatically search and sync across devices based on syllabus, grade, topic, and focus level.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDiagramLibraryOpen(false)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
</div>
    </>
  );
}
