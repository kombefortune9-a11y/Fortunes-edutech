import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  CheckCircle2, 
  Zap, 
  BookOpen, 
  Layers, 
  Settings2,
  Share2,
  X,
  Download,
  Loader2,
  Users,
  User,
  Music,
  Radio,
  FileAudio
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { DocType } from '../constants';

export interface AIPlanningVoiceGuideProps {
  toolType: string | DocType;
  toolTitle?: string;
  customText?: string;
  className?: string;
  variant?: 'compact' | 'expanded' | 'banner' | 'card';
}

interface ToolGuideInfo {
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  accentBg: string;
  borderColor: string;
  textColor: string;
  audioScript: string;
  summarySteps: { title: string; desc: string }[];
  proTips: string[];
  zambianStandard: string;
}

export const PLANNING_TOOL_GUIDES: Record<string, ToolGuideInfo> = {
  schemes_of_work: {
    title: "Schemes of Work",
    subtitle: "Termly Curriculum Progression Planning",
    badge: "CBC / OBC Termly Plan",
    color: "from-cyan-600 to-blue-600",
    accentBg: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-800",
    audioScript: 
      "Welcome to the Schemes of Work Planning Tool. This tool helps you create comprehensive, CBC and OBC-aligned termly schemes of work structured week by week for Early Childhood Education through Form 6 (A Level). " +
      "To begin, select your curriculum framework, grade level, subject, and academic term. The AI automatically connects to official Zambian CDC syllabus units, specific competencies, learning activities, teaching methods, and teaching aids. " +
      "You can customize the start week, week count, and assessment milestones, including Week 4 and Week 8 monthly assessments, Week 12 revisions, and Week 13 end-of-term examinations. " +
      "Once generated, you can review the structured table, edit any cell directly on the interactive grid, and export clean Word or PDF documents ready for your Head of Department endorsement.",
    summarySteps: [
      { title: "1. Select Curriculum & Grade", desc: "Choose CBC 2024 or OBC and specify ECE, Primary (Grades 1-7), Junior (Grades 8-9), or Senior Secondary (Form 1-4)." },
      { title: "2. Set Term & Subject", desc: "Select Subject, Term (1, 2, or 3), and start/end week parameters." },
      { title: "3. Auto-Link Syllabus", desc: "The AI automatically loads verbatim Topic names, Subtopics, and official CDC module citations." },
      { title: "4. Generate Termly Matrix", desc: "Click Generate to construct the 9-column official Schemes table with all teaching methods and aids." },
      { title: "5. Edit & Export", desc: "Fine-tune directly inside the table and download in Word, PDF, or high-res Print format." }
    ],
    proTips: [
      "Week 4 & Week 8 automatically incorporate monthly assessment checkpoints.",
      "Reference column strictly cites official CDC syllabus page numbers.",
      "Click any table cell after generation to make instant edits before printing."
    ],
    zambianStandard: "Complies strictly with CDC 2024 Competence-Based Curriculum Framework & Ministry of Education Termly Inspection Standards."
  },

  weekly_forecast: {
    title: "Weekly Forecast",
    subtitle: "Single-Page Week-Ahead Classroom Coordination",
    badge: "1-Page Weekly Standard",
    color: "from-indigo-600 to-purple-600",
    accentBg: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-800",
    audioScript: 
      "Welcome to the Weekly Forecast Planning Tool. This interface builds your week-ahead classroom coordination document, formatted to fit neatly on a single page in accordance with Ministry of General Education standards. " +
      "Enter your district, school name, TS number, subject, and designated teaching week. The generator organizes daily lessons from Day 1 through Day 5 with specific lesson topics, competencies, learning activities, and references. " +
      "You can customize lesson distribution, review the preview, and download your printable forecast with official teacher and administrative sign-off blocks.",
    summarySteps: [
      { title: "1. Enter School Metadata", desc: "Provide your Teacher Name, TS Number, Zone, School, and Grade level." },
      { title: "2. Set Term & Week", desc: "Specify the exact academic Term and Week number for synchronized lesson tracking." },
      { title: "3. Select Focus Topics", desc: "Choose your subject and let the AI pull official daily sequential subtopics." },
      { title: "4. Generate Daily Flow", desc: "Builds a concise Day 1 to Day 5 table featuring learning activities and methods." },
      { title: "5. Single-Page Print", desc: "Guaranteed to format perfectly on one A4 sheet with administrative signature boxes." }
    ],
    proTips: [
      "Designed with telegraphic, dense pedagogical language to strictly fit one A4 page.",
      "Day 1 to Day 5 sequential progression matches your termly Schemes of Work.",
      "Includes dedicated column for Weekly Record of work tracking."
    ],
    zambianStandard: "Adheres to Ministry of General Education standards for single-page weekly instructional forecasts."
  },

  lesson_plan: {
    title: "Lesson Plans",
    subtitle: "5-Stage Competence-Based Lesson Development",
    badge: "5-Stage CBC Plan",
    color: "from-blue-600 to-indigo-600",
    accentBg: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    audioScript: 
      "Welcome to the Lesson Plan Planning Tool. This module generates thorough, competency-based lesson plans featuring the official five-stage lesson development framework: Introduction, Lesson Development, Practice and Application, Exercise, and Conclusion. " +
      "Select your grade, subject, and topic. The tool will formulate clear lesson goals, rationales, prior knowledge, skills, values, teaching aids, and learning environment settings. " +
      "It also includes learner and teacher evaluation sections and automatically generates homework tasks on scheduled days. You can adjust duration, bloom's taxonomy levels, and generate instantly.",
    summarySteps: [
      { title: "1. Topic & Competencies", desc: "Pick your grade and topic to load specific learning outcomes and expected standards." },
      { title: "2. Set Environment & Aids", desc: "AI maps natural, artificial, and technological classroom resources." },
      { title: "3. 5-Stage Development Table", desc: "Creates timed steps: Introduction, Development, Practice, Exercise, and Conclusion." },
      { title: "4. Teacher-Learner Tally", desc: "Every teacher activity is matched with a corresponding learner response." },
      { title: "5. Homework & Evaluation", desc: "Includes Wednesday/Friday homework logic and structured evaluation spaces." }
    ],
    proTips: [
      "Prior knowledge, skills, and values are categorized neatly in the header profile.",
      "Homework component automatically activates on Wednesday and Friday schedules.",
      "Teacher and learner activities tally row-by-row for seamless classroom flow."
    ],
    zambianStandard: "Fully compliant with the National Lesson Planning Guide and 2024 CBC Competence Framework."
  },

  catch_up: {
    title: "Catch-Up & Remedial Tool",
    subtitle: "Literacy & Numeracy Targeted Interventions",
    badge: "National Catch-Up Program",
    color: "from-amber-600 to-orange-600",
    accentBg: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    audioScript: 
      "Welcome to the Catch-Up Planning Tool. This interface is designed to support the national Catch-Up program in Literacy and Numeracy, as well as general remedial interventions. " +
      "Choose between Literacy, Numeracy, or Ministry Remedial Guides. For literacy, you can target Beginner, Word-Sentence-Paragraph, or Story levels using syllabic charts, sound blending, and reading games. " +
      "For numeracy, focus on number operations, place values, and word problems. Generate structured remedial lesson plans with differentiated exercises and diagnostic assessments to help struggling learners catch up to grade level standards.",
    summarySteps: [
      { title: "1. Select Learning Domain", desc: "Choose Literacy, Numeracy, or Specialized Remedial Chapters." },
      { title: "2. Set Learner Level", desc: "Pick Beginner (Syllables/Sounds), WSP (Words/Sentences), or Story (Comprehension)." },
      { title: "3. Interactive Pedagogical Games", desc: "Select Basket Game, Flipping Flashcards, Mind Maps, or Rhyming Word activities." },
      { title: "4. Differentiated Catch-Up Plan", desc: "Generates tailored multi-tiered activities for accelerated mastery." },
      { title: "5. Track Pupil Progress", desc: "Includes diagnostic check matrices and printable remedial work cards." }
    ],
    proTips: [
      "Use Beginner mode for learners struggling with letter-sound phonics decoding.",
      "WSP (Word-Sentence-Paragraph) bridges vocabulary into fluent paragraph reading.",
      "Access authentic Ministry Remedial Guide illustrations for visual classroom aids."
    ],
    zambianStandard: "Directly aligned with Ministry of Education Catch-Up Project Framework and TaRL (Teaching at the Right Level)."
  },

  assessment_tracker: {
    title: "Continuous Assessment Tracker & Markbook",
    subtitle: "Standards-Based Class Marksheet & Pupil Performance Chart",
    badge: "Zambian Continuous Assessment",
    color: "from-blue-600 to-indigo-700",
    accentBg: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    audioScript: 
      "Welcome to the Continuous Assessment Tracker and Learner Progress Chart. This tool enables teachers to record, calculate, analyze, and track learner performance across all continuous assessments, monthly tests, end-of-term examinations, and CBC competency ratings. " +
      "To use this tracker, first select your active class grade, subject, and term. You can register learners individually or auto-generate a full class roster. Enter raw assessment scores for Weekly Classwork, Homework, Mid-Term Tests, and Final Exams. " +
      "The system automatically calculates total weighted percentages, assigns Zambian Ministry grading bands from Distinction to Unsatisfactory, computes class averages, and highlights learners requiring Catch-Up remedial interventions. " +
      "You can export individual learner report cards, full class marksheet tables in Excel or PDF format, and visual progress charts for parent-teacher consultations and administrative quality checks.",
    summarySteps: [
      { title: "1. Select Grade & Subject", desc: "Choose target grade (ECE to Secondary) and subject markbook." },
      { title: "2. Register Class Roster", desc: "Add pupil names or auto-populate your registered class list with TS/Learner IDs." },
      { title: "3. Input Assessment Marks", desc: "Enter scores for weekly tasks, monthly tests, mid-term checks, and end-of-term exams." },
      { title: "4. Auto-Calculate Grades", desc: "System computes weighted percentages, Zambian CDC grade bands (1-9), and class pass rates." },
      { title: "5. Export Reports & Marksheet", desc: "Download print-ready class marksheets, learner progress charts, and remedial flag summaries." }
    ],
    proTips: [
      "Learners scoring below 40% (Grades 8-9) or below Level 2 (CBC) are automatically flagged for Catch-Up Remedial support.",
      "Use the Grade selector dropdown to switch instantly between different subject marksheets.",
      "Marksheets automatically save to local offline storage and sync with your teacher account profile."
    ],
    zambianStandard: "Complies strictly with Ministry of Education National Assessment Guidelines & CBC Continuous Assessment Framework."
  },

  records_of_work: {
    title: "Record of Work",
    subtitle: "Weekly & Termly Taught Content Verification Log",
    badge: "Official Teacher Logbook",
    color: "from-blue-600 to-indigo-700",
    accentBg: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    audioScript: 
      "Welcome to the Record of Work module. This tool allows teachers to log, verify, and document actual work taught in class against your termly Schemes of Work. " +
      "Select your subject and teaching week. Log specific work covered, work not covered with reasons, remedial actions taken, and teacher signatures. " +
      "This generates your official Record of Work logbook, ready for inspection by Senior Teachers, Department Heads, and Standards Officers.",
    summarySteps: [
      { title: "1. Select Teaching Week", desc: "Choose the specific week and subject for logging taught outcomes." },
      { title: "2. Log Taught Content", desc: "Specify work actually delivered, practical activities conducted, and exercise completion." },
      { title: "3. Record Variance & Reasons", desc: "Note any lessons skipped due to public holidays, school events, or slow learner pace." },
      { title: "4. Remedial Actions", desc: "Outline compensatory catch-up lessons or remedial strategies planned." },
      { title: "5. Export & Inspect", desc: "Print or export your official Record of Work document with administrative signature fields." }
    ],
    proTips: [
      "Keep weekly entries updated to ensure smooth head teacher monitoring and end-of-term verification.",
      "Reasons for work not covered must be clear and backed by compensatory catch-up dates."
    ],
    zambianStandard: "Aligned with Ministry of General Education Monitoring Standards & School Inspection Guidelines."
  },

  research: {
    title: "Assignment & Research Writing Hub",
    subtitle: "Academic Research, Term Papers & Essay Generator",
    badge: "Academic & Research Suite",
    color: "from-violet-600 to-purple-700",
    accentBg: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    audioScript: 
      "Welcome to the Assignment and Research Writing Hub. This tool assists teachers and academic researchers in creating structured term papers, lesson essays, research proposals, assignment marking guides, and academic summaries. " +
      "Enter your research topic, target academic level, word count, and citation style. The AI generates well-formatted content complete with introductions, literature reviews, methodology outlines, findings, conclusions, and references.",
    summarySteps: [
      { title: "1. Enter Research Topic", desc: "Specify your research question, essay prompt, or assignment topic." },
      { title: "2. Set Academic Level", desc: "Select Primary, Secondary, Diploma, Degree, or Postgraduate academic standards." },
      { title: "3. Configure Citation & Layout", desc: "Choose APA, Harvard, or standard academic citation formatting." },
      { title: "4. Generate Paper & Rubric", desc: "Builds complete academic structured text with references and marking rubrics." },
      { title: "5. Download & Edit", desc: "Export in clean Word or PDF format for immediate classroom distribution or submission." }
    ],
    proTips: [
      "Specify sub-questions in the prompt to get highly targeted subheadings and literature citations.",
      "Generate accompanying marking rubrics to streamline assignment evaluation."
    ],
    zambianStandard: "Meets Higher Education & Secondary School Academic Writing & Research Guidelines."
  },

  individual_work_plan: {
    title: "Individual Work Plan (IWP)",
    subtitle: "Teacher Workload & Annual Performance Plan",
    badge: "APAS & IWP Standard",
    color: "from-rose-600 to-pink-700",
    accentBg: "bg-rose-50",
    borderColor: "border-rose-200",
    textColor: "text-rose-800",
    audioScript: 
      "Welcome to the Individual Work Plan Tool. This module generates official Individual Work Plans (IWP) in accordance with Public Service Management and Ministry of Education APAS standards. " +
      "Select your teacher designation, main Key Result Areas (KRAs), principal targets, and quarterly timeframes. The generator constructs your complete IWP table specifying operational targets, performance indicators, and resource requirements.",
    summarySteps: [
      { title: "1. Select Teacher Role", desc: "Choose Class Teacher, Senior Teacher, Department Head, Deputy Head, or Head Teacher." },
      { title: "2. Define Key Result Areas", desc: "Select pre-aligned KRAs including Planning, Teaching Delivery, Assessment, and CPD." },
      { title: "3. Set Target Indicators", desc: "Specify measurable outputs such as 100% scheme coverage and weekly markbook updates." },
      { title: "4. Generate Annual IWP", desc: "Creates structured quarterly workload matrices with supervisor evaluation columns." },
      { title: "5. Download Official Form", desc: "Export print-ready IWP forms formatted for administrative signing." }
    ],
    proTips: [
      "KRAs automatically adjust based on your selected administrative role (e.g. Senior Teacher vs Class Teacher).",
      "Ensure target dates match academic term boundaries for smooth annual APAS appraisals."
    ],
    zambianStandard: "Complies with Public Service Commission APAS & Ministry of Education Performance Management Systems."
  },

  lesson_notes: {
    title: "Lesson Notes Generator",
    subtitle: "Detailed Subject Content & Pupil Study Handouts",
    badge: "Comprehensive Subject Notes",
    color: "from-blue-600 to-indigo-700",
    accentBg: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    audioScript: 
      "Welcome to the Lesson Notes Generator. This tool produces detailed, syllabus-aligned subject content and classroom notes for pupils across ECE, Primary, Junior, and Senior Secondary levels. " +
      "Enter your grade, subject, topic, and subtopic. The AI generates thorough content including key definitions, step-by-step explanations, worked examples, diagrams, summary points, and quick revision questions.",
    summarySteps: [
      { title: "1. Select Subject & Grade", desc: "Specify your target subject and grade level from official CDC syllabus options." },
      { title: "2. Enter Topic & Subtopic", desc: "Provide the specific lesson topic to extract detailed content notes." },
      { title: "3. Auto-Generate Content", desc: "Builds structured text with definitions, worked examples, and key facts." },
      { title: "4. Review Exercises", desc: "Includes pupil check questions and summary points for chalkboard copying." },
      { title: "5. Print Handouts", desc: "Export cleanly formatted PDF or Word documents for learner distribution." }
    ],
    proTips: [
      "Notes include clear subheadings tailored for chalkboard writing or printed pupil handouts.",
      "Includes worked step-by-step examples for STEM subjects like Mathematics and Science."
    ],
    zambianStandard: "Strictly aligned with CDC Syllabus Content Outcomes & National Textbook Standards."
  },

  video_script: {
    title: "Video Tutorial Script & Visual Guide",
    subtitle: "Multimedia Educational Script & Presentation Guide",
    badge: "Digital Media & E-Learning",
    color: "from-fuchsia-600 to-pink-600",
    accentBg: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
    textColor: "text-fuchsia-800",
    audioScript: 
      "Welcome to the Video Tutorial Script & Visual Guide. This tool helps educators create engaging multimedia lesson scripts, narration voice-overs, and visual board cues for e-learning videos and presentations. " +
      "Enter your topic and target duration. The tool produces timestamped narration lines, visual scene instructions, board prompts, and interactive learner checkpoints.",
    summarySteps: [
      { title: "1. Enter Video Topic", desc: "Specify your lesson topic and intended target audience." },
      { title: "2. Set Duration & Format", desc: "Choose 3-minute quick concept, 5-minute standard tutorial, or 10-minute masterclass." },
      { title: "3. Generate Scene Breakdown", desc: "Creates timestamped columns for Voice Narration, On-Screen Visuals, and Cues." },
      { title: "4. Review Visual Cues", desc: "Includes graphics instructions, chalkboard sketches, and key formula highlights." },
      { title: "5. Export Script", desc: "Download script ready for recording or digital classroom broadcasting." }
    ],
    proTips: [
      "Timestamps help structure clear 1-minute intro, 3-minute core demo, and 1-minute recap videos.",
      "Use accompanying AI Voice Narration to preview script timing before recording."
    ],
    zambianStandard: "Aligned with MoE E-Learning Guidelines & Digital Pedagogical Standards."
  },

  app_intro: {
    title: "FORTUNES EDUTECH App Intro & Platform Guide",
    subtitle: "Official CBC & OBC Teaching Suite Orientation",
    badge: "Official App Intro",
    color: "from-blue-600 to-indigo-700",
    accentBg: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    audioScript: 
      "Welcome to FORTUNES EDUTECH - Plan Competently! Fortunes Edutech is your all-in-one professional teaching resource suite and curriculum planning assistant for Early Childhood Education through Form 6 (A Level). " +
      "Generate syllabus-aligned Schemes of Work, Weekly Forecasts, Competency-Based Lesson Plans, Continuous Assessment Marksheets, Lesson Notes, Catch-Up Remedial Plans, and Records of Work in seconds. " +
      "Designed for Zambian educators, works offline, and complies strictly with Ministry of Education CDC and OBC curriculum standards.",
    summarySteps: [
      { title: "1. Select Grade & Subject", desc: "Choose from ECE Level 1 to Form 6 (A Level) across CBC and OBC curriculum standards." },
      { title: "2. Generate AI Documents", desc: "Instantly create Schemes of Work, Lesson Plans, Weekly Forecasts, and Notes." },
      { title: "3. Continuous Assessment", desc: "Log pupil scores in the Assessment Tracker to calculate CBC grades and pass rates." },
      { title: "4. Download & Save", desc: "Save PDF, Word, Excel, and AI Voice Audio recordings directly to your phone storage." }
    ],
    proTips: [
      "Click 'Save to Phone' to download this audio intro directly as a .wav file for offline listening or sharing.",
      "Share the audio intro with colleagues and new teachers joining your school.",
      "Works 100% offline once loaded on your smartphone or browser."
    ],
    zambianStandard: "Certified for Ministry of General Education Schools, ECE Centers, and Training Colleges."
  }
};

export default function AIPlanningVoiceGuide({
  toolType,
  toolTitle,
  customText,
  className,
  variant = 'compact'
}: AIPlanningVoiceGuideProps) {
  const guideInfo = useMemo(() => {
    const rawKey = (toolType || 'schemes_of_work').toString().toLowerCase();
    let key = rawKey;
    if (rawKey.includes('intro') || rawKey.includes('fortunes') || rawKey.includes('app_intro')) {
      key = 'app_intro';
    } else if (rawKey.includes('assessment') || rawKey.includes('markbook')) {
      key = 'assessment_tracker';
    } else if (rawKey.includes('record')) {
      key = 'records_of_work';
    } else if (rawKey.includes('research') || rawKey.includes('assignment')) {
      key = 'research';
    } else if (rawKey.includes('individual') || rawKey.includes('iwp') || rawKey.includes('work_plan')) {
      key = 'individual_work_plan';
    } else if (rawKey.includes('notes')) {
      key = 'lesson_notes';
    } else if (rawKey.includes('video')) {
      key = 'video_script';
    } else if (rawKey.includes('catch')) {
      key = 'catch_up';
    } else if (rawKey.includes('forecast')) {
      key = 'weekly_forecast';
    } else if (rawKey.includes('plan')) {
      key = 'lesson_plan';
    } else if (rawKey.includes('scheme')) {
      key = 'schemes_of_work';
    }
    return PLANNING_TOOL_GUIDES[key] || PLANNING_TOOL_GUIDES[rawKey] || PLANNING_TOOL_GUIDES.schemes_of_work;
  }, [toolType]);

  // Voice Modes: 'female' (Mrs. Grace), 'male' (Mr. Fortune), 'mixed' (Woman + Man duet)
  const [voiceMode, setVoiceMode] = useState<'female' | 'male' | 'mixed'>('female');
  // Narration Duration: 'extended' (Longer script), 'standard' (Overview)
  const [narrationType, setNarrationType] = useState<'extended' | 'standard'>('extended');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Gemini Generated Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scriptToUse = customText || guideInfo.audioScript;

  const sentences = useMemo(() => {
    return scriptToUse
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [scriptToUse]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [toolType]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIndex(0);
  };

  // Generate & Play Gemini Dual-Voice Audio via server API
  const handleGenerateAndPlayGeminiAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptToUse,
          voiceMode,
          narrationType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.isQuotaExceeded) {
          toast("Gemini AI Voice quota reached. Playing via local voice engine...", { icon: "🎙️" });
          playBrowserSpeech();
          return;
        }
        throw new Error(data.error || 'Failed to generate audio');
      }

      setAudioUrl(data.audioUrl);
      toast.success(
        voiceMode === 'mixed'
          ? "Mixed Dual Voice Narration (Woman & Man) generated! Playing audio..."
          : "AI Voice Narration generated! Playing audio..."
      );

      // Play generated audio via HTML5 Audio element
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = speechRate;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            setIsPaused(false);
          }).catch(err => {
            console.warn("Audio autoplay blocked or failed:", err);
          });
        }
      }, 100);

    } catch (err: any) {
      console.warn("Gemini TTS server fallback to browser speech synthesis:", err.message);
      toast("Playing via local voice engine...", { icon: "🎙️" });
      playBrowserSpeech();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Browser SpeechSynthesis fallback
  const playBrowserSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(scriptToUse);
    utteranceRef.current = utterance;

    utterance.rate = speechRate;
    utterance.pitch = voiceMode === 'female' ? 1.15 : voiceMode === 'male' ? 0.74 : 1.05;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      (v.lang.startsWith('en') && (
        voiceMode === 'female' 
          ? (v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female'))
          : voiceMode === 'male'
          ? (v.name.includes('Daniel') || v.name.includes('David') || v.name.includes('Male'))
          : (v.name.includes('Google') || v.name.includes('Natural'))
      ))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSentenceIndex(0);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onboundary = (e) => {
      if (e.name === 'sentence' || e.charIndex !== undefined) {
        let cumulative = 0;
        for (let i = 0; i < sentences.length; i++) {
          cumulative += sentences[i].length + 1;
          if (e.charIndex < cumulative) {
            setActiveSentenceIndex(i);
            break;
          }
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
        setIsPlaying(true);
      } else {
        audioRef.current.playbackRate = speechRate;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setIsPaused(false);
        }).catch(() => {
          handleGenerateAndPlayGeminiAudio();
        });
      }
    } else {
      handleGenerateAndPlayGeminiAudio();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    if (isPlaying || isPaused) {
      stopAudio();
      setTimeout(() => {
        playAudio();
      }, 50);
    }
  };

  // Download AI Audio File (.wav) directly to smartphone / desktop storage
  const handleDownloadAudio = () => {
    if (!audioUrl) {
      // If audioUrl hasn't been generated yet, generate it first then trigger download
      setIsGeneratingAudio(true);
      toast("Preparing high-quality downloadable audio file for phone storage...", { icon: "📲" });
      fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptToUse,
          voiceMode,
          narrationType,
        }),
      })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          if (r.status === 429 || data.isQuotaExceeded) {
            toast("Gemini HD Audio download quota reached (10 free calls/day). Playing voice live via local engine instead!", { icon: "🎙️", duration: 5000 });
            playBrowserSpeech();
            return;
          }
          throw new Error(data.error || "Could not prepare audio file");
        }
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          triggerFileDownload(data.audioUrl);
        } else {
          throw new Error("Could not prepare audio file");
        }
      })
      .catch(err => {
        console.error("Download preparation error:", err);
        toast.error("Audio download error: " + (err.message || "Failed to process audio"));
      })
      .finally(() => {
        setIsGeneratingAudio(false);
      });
      return;
    }

    triggerFileDownload(audioUrl);
  };

  const triggerFileDownload = (urlToDownload: string) => {
    try {
      const link = document.createElement('a');
      link.href = urlToDownload;
      const cleanTitle = (toolTitle || guideInfo.title).replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `FortunesEdutech_${cleanTitle}_${voiceMode}_voice.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("AI Voice Playback downloaded successfully to your phone storage!");
    } catch (err: any) {
      console.error("Audio download error:", err);
      toast.error("Failed to download audio file: " + err.message);
    }
  };

  const handleShareAudio = async () => {
    if (!audioUrl) {
      handleDownloadAudio();
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const fetchRes = await fetch(audioUrl);
        const blob = await fetchRes.blob();
        const file = new File([blob], `FortunesEdutech_Voice_Narration.wav`, { type: 'audio/wav' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Fortunes Edutech AI Voice Narration (${voiceMode} voice)`,
            text: `Listen to this extended AI Voice Narration for ${toolTitle || guideInfo.title}!`,
            files: [file],
          });
          toast.success("Shared audio successfully!");
          return;
        }
      } catch (e) {
        console.warn("Share failed, falling back to download:", e);
      }
    }
    handleDownloadAudio();
  };

  return (
    <div className={cn("w-full transition-all duration-300 font-sans", className)}>
      {/* Hidden HTML5 Audio Element for Gemini Generated TTS Audio */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setIsPaused(false);
            setActiveSentenceIndex(0);
          }}
          onError={(e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
          }}
        />
      )}

      {/* Primary Bar / Playback Controller */}
      <div className={cn(
        "bg-white border rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm transition-all relative overflow-hidden",
        guideInfo.borderColor,
        isPlaying ? "ring-2 ring-blue-500/30 shadow-md" : ""
      )}>
        {/* Subtle Background Accent Gradient */}
        <div className={cn(
          "absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-r",
          guideInfo.color
        )} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Tool Title & AI Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300",
              guideInfo.accentBg,
              guideInfo.textColor,
              isPlaying ? "scale-105" : ""
            )}>
              <Volume2 size={20} className={cn(isPlaying ? "animate-pulse" : "")} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Sparkles size={10} className="text-amber-400 animate-pulse" />
                  AI Voice Studio
                </span>
                <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider flex items-center gap-1",
                  guideInfo.accentBg,
                  guideInfo.borderColor,
                  guideInfo.textColor
                )}>
                  {voiceMode === 'female' ? (
                    <>
                      <User size={10} className="text-purple-600" />
                      Female Voice (Mrs. Grace)
                    </>
                  ) : voiceMode === 'male' ? (
                    <>
                      <User size={10} className="text-blue-600" />
                      Male Voice (Mr. Fortune)
                    </>
                  ) : (
                    <>
                      <Users size={10} className="text-blue-600" />
                      Mixed Voice (Woman & Man)
                    </>
                  )}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate mt-0.5">
                Voice Narration: {toolTitle || guideInfo.title}
              </h4>
            </div>
          </div>

          {/* Center / Right: Voice Selectors, Playback & Download Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-end lg:self-auto shrink-0">
            
            {/* Woman / Man / Mixed Voice Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setVoiceMode('female')}
                className={cn(
                  "px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  voiceMode === 'female' 
                    ? "bg-purple-600 text-white font-black shadow-xs" 
                    : "hover:text-slate-900 opacity-80"
                )}
                title="Female Voice Solo (Default)"
              >
                👩 <span className="hidden sm:inline">Woman</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceMode('male')}
                className={cn(
                  "px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  voiceMode === 'male' 
                    ? "bg-blue-600 text-white font-black shadow-xs" 
                    : "hover:text-slate-900 opacity-80"
                )}
                title="Male Voice Solo"
              >
                👨 <span className="hidden sm:inline">Man</span>
              </button>
              <button
                type="button"
                onClick={() => setVoiceMode('mixed')}
                className={cn(
                  "px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  voiceMode === 'mixed' 
                    ? "bg-blue-600 text-white font-black shadow-xs" 
                    : "hover:text-slate-900 opacity-80"
                )}
                title="Narrate with alternating Woman & Man voices"
              >
                <Users size={11} />
                <span className="hidden sm:inline">Woman & Man</span>
                <span className="sm:hidden">Mixed</span>
              </button>
            </div>

            {/* Narration Length Selector (Extended vs Standard) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setNarrationType('extended')}
                className={cn(
                  "px-2 py-1 rounded-lg transition-all cursor-pointer",
                  narrationType === 'extended' 
                    ? "bg-white text-slate-900 font-black shadow-xs" 
                    : "opacity-70 hover:opacity-100"
                )}
                title="Extended detailed script narration"
              >
                📜 Extended
              </button>
              <button
                type="button"
                onClick={() => setNarrationType('standard')}
                className={cn(
                  "px-2 py-1 rounded-lg transition-all cursor-pointer",
                  narrationType === 'standard' 
                    ? "bg-white text-slate-900 font-black shadow-xs" 
                    : "opacity-70 hover:opacity-100"
                )}
                title="Standard quick summary"
              >
                ⚡ Standard
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[9px] sm:text-[10px] font-black text-slate-700">
              {[1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={cn(
                    "px-1.5 sm:px-2 py-1 rounded-lg transition-all cursor-pointer",
                    speechRate === rate 
                      ? "bg-white text-slate-900 shadow-xs font-black" 
                      : "hover:text-slate-900 opacity-70"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isGeneratingAudio}
              className={cn(
                "px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer text-white",
                isPlaying 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" 
                  : "bg-blue-600 hover:bg-blue-750 shadow-blue-200"
              )}
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause size={13} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-current" />
                  <span>{isPaused ? 'Resume' : 'Listen Dual Playback'}</span>
                </>
              )}
            </button>

            {/* Direct Download Audio Button to Phone Storage */}
            <button
              type="button"
              onClick={handleDownloadAudio}
              disabled={isGeneratingAudio}
              className="px-3 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Download AI Voice Playback directly to phone storage (.wav file)"
            >
              {isGeneratingAudio ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <Download size={13} className="text-amber-400" />
              )}
              <span className="hidden sm:inline">Save to Phone</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Share Audio Button */}
            {audioUrl && (
              <button
                type="button"
                onClick={handleShareAudio}
                className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Share or send audio file"
              >
                <Share2 size={13} />
              </button>
            )}

            {/* Stop Button */}
            {(isPlaying || isPaused) && (
              <button
                type="button"
                onClick={stopAudio}
                className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Stop audio playback"
              >
                <Square size={13} />
              </button>
            )}

            {/* View Operation Guide & Audio Studio Modal Button */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-slate-200"
              title="Open full operational guide & voice options"
            >
              <BookOpen size={13} />
              <span className="hidden xl:inline">Studio Guide</span>
            </button>

            {/* Toggle Inline Dropdown */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title={isExpanded ? "Collapse preview" : "Expand preview"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Live Narration Read-Along Bar when Playing */}
        {isPlaying && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5 bg-blue-50/70 border border-blue-100/80 rounded-xl p-2.5 text-xs text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0 mt-1" />
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Radio size={11} className="text-blue-600 animate-pulse" />
                    AI Dual-Voice Playback ({voiceMode === 'mixed' ? 'Woman & Man Duet' : voiceMode === 'female' ? 'Female Voice' : 'Male Voice'}):
                  </span>
                  <button
                    onClick={handleDownloadAudio}
                    className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={10} /> Download Audio
                  </button>
                </div>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  "{sentences[activeSentenceIndex] || scriptToUse.slice(0, 180)}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inline Quick Steps & Download Note (Expandable) */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-300">
            {/* Download Note Banner */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <FileAudio size={18} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Download to Smartphone:</strong> Click <strong>Save to Phone</strong> to download high-definition <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.wav</code> audio files directly into your phone storage.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadAudio}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
              >
                Download Now
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {guideInfo.summarySteps.map((step, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-700 shrink-0 shadow-2xs">
                    {idx + 1}
                  </span>
                  <div>
                    <strong className="text-slate-900 font-bold block">{step.title}</strong>
                    <span className="text-slate-600 text-[11px] leading-tight block mt-0.5">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 px-1">
              <span>{guideInfo.zambianStandard}</span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-blue-600 font-black uppercase hover:underline"
              >
                Open Full Voice Studio & Guide →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Operational Manual & Voice Studio Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={cn("p-6 text-white bg-gradient-to-r flex items-center justify-between", guideInfo.color)}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs">
                  <Radio size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                      {guideInfo.badge}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} /> Dual Voice Studio
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight mt-1">{guideInfo.title} Operational Guide</h3>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all cursor-pointer text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
              {/* Voice Player & Studio Control Box in Modal */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Volume2 size={22} className={isPlaying ? "animate-pulse" : ""} />
                    </div>
                    <div>
                      <h5 className="font-black text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                        AI Dual Voice Narration Engine
                      </h5>
                      <p className="text-xs text-slate-400">
                        Mixed Woman & Man voices with direct phone storage audio download
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={isGeneratingAudio}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer",
                        isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {isGeneratingAudio ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isPlaying ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} className="fill-current" />
                      )}
                      {isGeneratingAudio ? 'Generating...' : isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play Narration'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAudio}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title="Download audio file to phone storage"
                    >
                      <Download size={14} />
                      <span>Download Audio</span>
                    </button>
                  </div>
                </div>

                {/* Voice Selection Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Voice Type:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setVoiceMode('female')}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center cursor-pointer",
                          voiceMode === 'female' ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        )}
                      >
                        👩 Woman
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceMode('male')}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center cursor-pointer",
                          voiceMode === 'male' ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        )}
                      >
                        👨 Man
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceMode('mixed')}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center cursor-pointer",
                          voiceMode === 'mixed' ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        )}
                      >
                        👫 Mixed
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Narration Length:
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setNarrationType('extended')}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center cursor-pointer",
                          narrationType === 'extended' ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        )}
                      >
                        📜 Extended Full Script
                      </button>
                      <button
                        type="button"
                        onClick={() => setNarrationType('standard')}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-[10px] font-black transition-all text-center cursor-pointer",
                          narrationType === 'standard' ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        )}
                      >
                        ⚡ Standard Summary
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by Step Operations */}
              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600" />
                  Step-by-Step Operational Instructions
                </h4>
                <div className="space-y-2.5">
                  {guideInfo.summarySteps.map((step, idx) => (
                    <div key={idx} className="bg-slate-50/80 border border-slate-200/70 p-3.5 rounded-2xl flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        {idx + 1}
                      </div>
                      <div>
                        <strong className="text-slate-900 font-bold block text-xs">{step.title}</strong>
                        <p className="text-slate-600 text-xs leading-relaxed mt-0.5 font-medium">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips & Best Practices */}
              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  Key Teacher Best Practices
                </h4>
                <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 space-y-2">
                  {guideInfo.proTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-amber-900">
                      <span className="text-amber-600 font-black">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* National Standard & Citation */}
              <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 text-[11px] text-blue-900 font-medium">
                <strong className="block font-black uppercase text-[10px] tracking-wider text-blue-600 mb-1">
                  National Curriculum Framework Alignment:
                </strong>
                {guideInfo.zambianStandard}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadAudio}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download size={14} />
                <span>Save Audio to Phone</span>
              </button>

              <button
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
