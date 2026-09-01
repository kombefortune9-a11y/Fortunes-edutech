import { getDownloadAccessStatus } from "../lib/downloadCheck";
import { safeLocalStorage } from "../lib/storage";
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './FirebaseProvider';
import { isDeveloperEmail } from '../constants';
import { 
  BookOpen, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  Maximize2,
  FileText,
  User,
  School,
  Hash,
  MapPin,
  Clock,
  GraduationCap,
  Info,
  BookMarked,
  Search,
  Image,
  X,
  Sliders,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LITERACY_GUIDE, NUMERACY_GUIDE, REMEDIAL_GUIDE, REMEDIAL_ILLUSTRATIONS, RemedialIllustration } from '../data/zambiaGuidesData';
import AIPlanningVoiceGuide from './AIPlanningVoiceGuide';

const BEGINNER_FRAME = [
  { activity: 'Informal Talk / Chat', competency: 'Tell own real-life story (oral speaking confidence)', duration: '10 - 15 mins', frequency: 'Alternating days with Story Telling and Picture Reading', resources: 'Teacher / learners' },
  { activity: 'Story Telling', competency: 'Tell imaginative story (active listening and plot prediction)', duration: '10 - 15 mins', frequency: 'Alternating days with Informal Talk/Chat and Picture Reading', resources: 'Teacher / learners' },
  { activity: 'Picture Reading', competency: 'Say words and sentences based on a picture (visual associations)', duration: '10 - 15 mins', frequency: 'Alternating days with Informal Talk/Chat and Story Telling', resources: 'Conversation posters, calendars, picture cards' },
  { activity: 'Syllable Chart Reading', competency: 'Sound the vowels and consonants (phonics decoding)', duration: '10 - 15 mins', frequency: 'Daily (essential core)', resources: 'Big Syllabic Chart & Individual Syllabic Cards' },
  { activity: 'Basket Game', competency: 'Read the syllables (active matching and speed)', duration: '10 - 15 mins', frequency: 'Alternating days with Flipping the Flashcard or other active games', resources: 'Syllable, Consonant & Vowel Cards' },
  { activity: 'Flipping the Flashcard', competency: 'Read the syllables. Make words (blending sounds)', duration: '10 - 15 mins', frequency: 'Alternating days with the Basket Game or other active games', resources: 'Syllable, Consonant & Vowel Cards' },
  { activity: 'Mind Map', competency: 'Recall sounds and syllables (collaborative brainstorming)', duration: '15 - 30 mins', frequency: 'Alternating / weekly checks', resources: 'Syllabic Chart, Chalkboard' },
  { activity: 'Rhyming Words', competency: 'Make words starting with specific letter sounds to identify the vowel', duration: '15 - 30 mins', frequency: 'Alternating days with Word/Sentence Building and games', resources: 'Teacher / learners' }
];

const WSP_FRAME = [
  { activity: 'Informal Talk / Chat', competency: 'Tell your own real-life story (expressive vocabulary and fluency)', duration: '10 - 15 mins', frequency: 'Alternating with storytelling and picture reading', resources: 'Teacher / learners' },
  { activity: 'Story Telling', competency: 'Tell imaginative story (comprehension and plot sequencing)', duration: '10 - 15 mins', frequency: 'Alternating with Informal Talk/Chat and picture reading', resources: 'Teacher / learners' },
  { activity: 'Picture Reading', competency: 'Say words and sentences based on a picture (sentence structure)', duration: '10 - 15 mins', frequency: 'Alternating with informal talk/chat and storytelling', resources: 'Conversation posters, magazine, textbooks' },
  { activity: 'Simple Paragraph Reading', competency: 'Reading, listening, fluency; speed, accuracy, punctuation & pronunciation', duration: '15 - 20 mins', frequency: 'Daily (essential base)', resources: 'Story booklets, story cards, learners\' books, past papers' },
  { activity: 'Correct the Incorrect', competency: 'Sentence construction, spellings, punctuation & grammar', duration: '15 - 20 mins', frequency: 'Alternate with Story Making - Go Ahead or Mind Map', resources: 'Flip chart, sentence card, chalkboard' },
  { activity: 'Story Making - Go Ahead', competency: 'Sentence construction, critical thinking, listening, speaking & fluency', duration: '15 - 20 mins', frequency: 'Alternate with Correct the Incorrect or Mind Map', resources: 'Conversation poster, magazine, textbooks' },
  { activity: 'Dictation', competency: 'Listening & spelling retention', duration: '15 - 20 mins', frequency: 'Alternate / weekly frequency', resources: 'Textbooks, chart, chalkboard' },
  { activity: 'Copy Writing', competency: 'Writing, punctuation, handwriting & capitalization', duration: '15 - 20 mins', frequency: 'Alternate / weekly frequency', resources: 'Textbooks, chart, chalkboard' },
  { activity: 'Mind Map', competency: 'Sentence construction & critical thinking skills', duration: '15 - 20 mins', frequency: 'Alternate with copywriting/dictation', resources: 'Chalkboard & chart' }
];

const STORY_FRAME = [
  { activity: 'Informal talk / Chat', competency: 'Tell own real-life story (fluent narration & dialogue skills)', duration: '10 mins', frequency: 'Alternating with storytelling and picture reading', resources: 'Teacher / learners' },
  { activity: 'Story Telling', competency: 'Tell imaginative story (reconstruct narrative, identify moral)', duration: '10 mins', frequency: 'Alternating with informal talk/chat and picture reading', resources: 'Teacher / learners' },
  { activity: 'Picture Reading', competency: 'Say words and sentences based on a picture (context comprehension)', duration: '10 mins', frequency: 'Alternating with informal talk/chat and storytelling', resources: 'Conversation posters, calendars, picture cards' },
  { activity: 'Mind Map', competency: 'Writing and reading skills, logical flow, critical thinking (write theme essay)', duration: '15 - 45 mins', frequency: 'Once per week (essential composition)', resources: 'Chalkboard, flip charts and exercise books' },
  { activity: 'Copying', competency: 'Writing mechanics, spelling and neat handwriting integration', duration: '10 - 15 mins', frequency: 'Once per week (paragraph copywriting)', resources: 'Books and pens' },
  { activity: 'Dictation', competency: 'Active listening, grammar validation, reading and writing check', duration: '10 - 15 mins', frequency: 'Once per week (paragraph dictation)', resources: 'Books and pens' },
  { activity: 'Lesson-based activity', competency: 'Learners able to express themselves confidently. Advanced comprehension, logical retell', duration: '45 - 50 mins', frequency: '3 - 4 times per week', resources: 'Ministry-aligned Story Cards / stories' }
];

interface CatchUpGeneratorProps {
  onGenerate: (content: string, params: any) => void;
  onBack: () => void;
}

type Mode = 'literacy' | 'numeracy';

export function CatchUpGenerator({ onGenerate, onBack }: CatchUpGeneratorProps) {
  const { user, registeredGrades, isWhitelisted, userType, downloadRecords, subscriptionDetails } = useAuth();
  const [mode, setMode] = useState<Mode>('literacy');
  const [loading, setLoading] = useState(false);
  const [generatorTab, setGeneratorTab] = useState<'plan' | 'manual' | 'frames'>('plan');
  const [manualSubject, setManualSubject] = useState<'literacy' | 'numeracy' | 'remedial'>('literacy');
  const [remedialSubTab, setRemedialSubTab] = useState<'chapters' | 'illustrations'>('chapters');
  const [illSearch, setIllSearch] = useState('');
  const [illCategory, setIllCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (registeredGrades && registeredGrades.length > 0) {
      const activeGrades = registeredGrades.filter(g => g !== 'all');
      if (activeGrades.length > 0) return activeGrades[0];
    }
    return 'Grade 4';
  });
  const [error, setError] = useState<string | null>(null);

  const isUserEmailDeveloper = isDeveloperEmail(user?.email);
  const isUserGuestTier = (!isWhitelisted && userType === 'guest' && !isUserEmailDeveloper);

  const usageCounts = useMemo(() => {
    return {
      catch_up: downloadRecords ? downloadRecords.filter(r => r.type === 'catch_up').length : 0,
    };
  }, [downloadRecords]);

  const isLimitReached = isUserGuestTier && usageCounts.catch_up >= 3;

  // Enforce grade-specific and top-up download limit locks
  const { isActiveCircleLimitReached, gradeSpecificLimitMsg } = useMemo(() => {
    let activeCircleLimitReached = false;
    let limitMsg = "";
    
    if (!isUserGuestTier && !isUserEmailDeveloper && subscriptionDetails && !subscriptionDetails.unlimitedDownloads) {
      const gradesCount = registeredGrades ? registeredGrades.filter(g => g !== 'all').length : 1;
      const baseLimit = subscriptionDetails.baseLimit || 40;
      const gradeCounts = subscriptionDetails.gradeCounts || {};
      
      if (gradesCount <= 2) {
        // Separate trackers per grade
        const usedForSelectedGrade = gradeCounts[selectedGrade] || 0;
        if (usedForSelectedGrade >= baseLimit) {
          activeCircleLimitReached = true;
          limitMsg = `Grade Limit Reached: You have reached your download limit of ${baseLimit} downloads for ${selectedGrade} in this billing circle. Please contact Fortunes Edutech to upgrade or top up.`;
        }
      } else {
        // Combined tracker for all grades (top-up mode)
        const totalUsed = subscriptionDetails.circleDownloadsCount || 0;
        const combinedLimit = 2 * baseLimit;
        if (totalUsed >= combinedLimit) {
          activeCircleLimitReached = true;
          limitMsg = `Billing Cycle Limit Reached: You have reached your combined top-up package download limit of ${combinedLimit} downloads for this cycle. Please upgrade or renew your package.`;
        }
      }
    }
    return { isActiveCircleLimitReached: activeCircleLimitReached, gradeSpecificLimitMsg: limitMsg };
  }, [isUserGuestTier, isUserEmailDeveloper, subscriptionDetails, registeredGrades, selectedGrade]);
  const [selectedIll, setSelectedIll] = useState<RemedialIllustration | null>(null);
  const [selectedGuidePage, setSelectedGuidePage] = useState<string | null>('0-0');

  const renderUserGradeTrackers = () => {
    if (isUserGuestTier || !subscriptionDetails || subscriptionDetails.unlimitedDownloads) {
      return null;
    }
    
    const gradesCount = registeredGrades ? registeredGrades.filter(g => g !== 'all').length : 1;
    const baseLimit = subscriptionDetails.baseLimit || 40;
    const gradeCounts = subscriptionDetails.gradeCounts || {};
    
    if (gradesCount <= 2) {
      return (
        <div className="mt-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3 col-span-1 md:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Grade-Locked Download Trackers:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registeredGrades.filter(g => g !== 'all').map((grade) => {
              const used = gradeCounts[grade] || 0;
              const remaining = Math.max(0, baseLimit - used);
              const pct = Math.min(100, (used / baseLimit) * 100);
              const isSelected = selectedGrade === grade;
              const isDepleted = used >= baseLimit;
              
              return (
                <div 
                  key={grade} 
                  className={`p-3 rounded-xl border bg-white transition-all space-y-1.5 ${
                    isSelected ? "border-emerald-200 ring-2 ring-emerald-50 bg-emerald-50/10" : "border-slate-100"
                  } ${isDepleted ? "border-red-100 bg-red-50/5" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">{grade}</span>
                    <span className={`text-[10px] font-black ${isDepleted ? "text-red-500" : "text-[#00A86B]"}`}>
                      {used}/{baseLimit} ({remaining} Left)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${isDepleted ? "bg-red-500" : "bg-[#00A86B]"}`}
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
      const totalUsed = subscriptionDetails.circleDownloadsCount || 0;
      const combinedLimit = 2 * baseLimit;
      const remaining = Math.max(0, combinedLimit - totalUsed);
      const pct = Math.min(100, (totalUsed / combinedLimit) * 100);
      const isDepleted = totalUsed >= combinedLimit;
      
      return (
        <div className="mt-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2 col-span-1 md:col-span-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <span>Combined Top-Up Tracker ({registeredGrades.filter(g => g !== 'all').join(', ')})</span>
            <span className={isDepleted ? "text-red-500" : "text-[#00A86B]"}>
              {totalUsed}/{combinedLimit} ({remaining} Left)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${isDepleted ? "bg-red-500" : "bg-[#00A86B]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    }
  };

  // Collapsible general profile state
  const [isGeneralProfileExpanded, setIsGeneralProfileExpanded] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile') || safeLocalStorage.getItem('user_general_profile');
      return !stored;
    } catch (e) {
      return true;
    }
  });

  // Common Metadata Fields with persistent local storage / global fallback
  const [school, setSchool] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.school) return parsed.school;
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        if (parsed.school) return parsed.school;
      }
    } catch (e) {
      console.error("Failed to parse school", e);
    }
    return '';
  });

  const [teacherName, setTeacherName] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.teacherName) return parsed.teacherName;
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        if (parsed.teacherName) return parsed.teacherName;
      }
    } catch (e) {
      console.error("Failed to parse teacherName", e);
    }
    return '';
  });

  const [tsNumber, setTsNumber] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tsNumber) return parsed.tsNumber;
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        if (parsed.tsNumber) return parsed.tsNumber;
      }
    } catch (e) {
      console.error("Failed to parse tsNumber", e);
    }
    return '';
  });

  const [district, setDistrict] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.district) return parsed.district;
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        if (parsed.district) return parsed.district;
      }
    } catch (e) {
      console.error("Failed to parse district", e);
    }
    return '';
  });

  const [zone, setZone] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.zone) return parsed.zone;
      }
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      if (globalProfile) {
        const parsed = JSON.parse(globalProfile);
        if (parsed.zone) return parsed.zone;
      }
    } catch (e) {
      console.error("Failed to parse zone", e);
    }
    return '';
  });

  const [enrolmentBoys, setEnrolmentBoys] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile') || safeLocalStorage.getItem('user_general_profile') || safeLocalStorage.getItem('teacher_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.enrolmentBoys !== undefined && parsed.enrolmentBoys !== '') return parsed.enrolmentBoys;
        if (parsed.totalBoysExpected !== undefined) return parsed.totalBoysExpected;
      }
    } catch (e) {}
    return '';
  });

  const [enrolmentGirls, setEnrolmentGirls] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile') || safeLocalStorage.getItem('user_general_profile') || safeLocalStorage.getItem('teacher_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.enrolmentGirls !== undefined && parsed.enrolmentGirls !== '') return parsed.enrolmentGirls;
        if (parsed.totalGirlsExpected !== undefined) return parsed.totalGirlsExpected;
      }
    } catch (e) {}
    return '';
  });

  const [attendanceBoys, setAttendanceBoys] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile') || safeLocalStorage.getItem('user_general_profile') || safeLocalStorage.getItem('teacher_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.attendanceBoys !== undefined && parsed.attendanceBoys !== '') return parsed.attendanceBoys;
      }
    } catch (e) {}
    return '';
  });

  const [attendanceGirls, setAttendanceGirls] = useState(() => {
    try {
      const stored = safeLocalStorage.getItem('catch_up_profile') || safeLocalStorage.getItem('user_general_profile') || safeLocalStorage.getItem('teacher_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.attendanceGirls !== undefined && parsed.attendanceGirls !== '') return parsed.attendanceGirls;
      }
    } catch (e) {}
    return '';
  });

  const [date, setDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [duration, setDuration] = useState('1 Hour');
  const [time, setTime] = useState('11:00 am - 12:00 pm');

  const handleSaveGeneralProfile = () => {
    const profile = {
      school,
      teacherName,
      tsNumber,
      district,
      zone,
      enrolmentBoys,
      enrolmentGirls,
      attendanceBoys,
      attendanceGirls
    };
    try {
      safeLocalStorage.setItem('catch_up_profile', JSON.stringify(profile));
      
      // Also sync standard fields with global profile
      const globalProfile = safeLocalStorage.getItem('user_general_profile');
      let merged = {};
      if (globalProfile) {
        try {
          merged = JSON.parse(globalProfile);
        } catch (e) {}
      }
      const updatedGlobal = {
        ...merged,
        school,
        teacherName,
        tsNumber,
        district,
        zone
      };
      safeLocalStorage.setItem('user_general_profile', JSON.stringify(updatedGlobal));
      safeLocalStorage.setItem('teacher_info', JSON.stringify(updatedGlobal));
      
      setIsGeneralProfileExpanded(false);
      toast.success("Catch-Up Profile registered and saved successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile");
    }
  };

  const handleResetGeneralProfile = () => {
    try {
      safeLocalStorage.removeItem('catch_up_profile');
    } catch (e) {}
    setSchool('');
    setTeacherName('');
    setTsNumber('');
    setDistrict('');
    setZone('');
    setEnrolmentBoys('');
    setEnrolmentGirls('');
    setAttendanceBoys('');
    setAttendanceGirls('');
    setIsGeneralProfileExpanded(true);
    toast("Catch-Up profile reset! You can now register details for a different teacher.", { icon: 'ℹ️' });
  };

  // Interactive selectors
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  
  // Weekly Alternator
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Constants for dropdowns
  const LIT_INTROS = ['Informal Talk / Chat', 'Story Telling', 'Picture Reading'];
  const LIT_STORY_PROC1 = [
    'Procedure 1: Lesson 1 - (Step 1-3)',
    'Procedure 1: Lesson 2 - (Step 4-6)'
  ];
  const LIT_STORY_PROC2 = [
    'Informal Talk / Chat',
    'Story Telling',
    'Picture Reading'
  ];

  const LIT_BL_LEVEL_ACTIVITIES = [
    'Syllabic Chart Reading',
    'Syllable Diary',
    'Strings of Syllables',
    'Flipping the Flashcards',
    'Basket Game'
  ];

  const LIT_BL_MAIN_WRITING = [
    'Mind map (Forming syllables/words)',
    'Word sentence building',
    'Game of ending and beginning syllable',
    'Rhyming words to introduce vowels'
  ];

  const LIT_WSP_MAIN_WRITING = [
    'Mind map',
    'Correct the incorrect',
    'Story making go ahead'
  ];

  const LIT_STORY_MAIN_WRITING = [
    'Mind map'
  ];

  const LIT_CONCLUSIONS = [
    'Copy writing',
    'Dictation',
    'Omit (No Conclusion)'
  ];

  const NUM_CONCLUSIONS = [
    'Chorusing & Recitation: Chanting Times table',
    'Interactive Game: Buzz Game (counting with multiples)',
    'Interactive Game: Rapid-Fire Tossing (quick additions)',
    'Omit (No Conclusion)'
  ];

  // Numeracy constants
  const NUM_LEVEL1_RECOG = [
    'Number chart reading',
    'Number diary',
    'Activity with sticks',
    'Clap and snap',
    'No. jump/twist',
    'Number circles'
  ];

  const NUM_LEVEL23_RECOG = [
    'Expansion chart reading',
    'Expansion cards',
    'Bundles and sticks',
    'Clap and snap',
    'No. circles',
    'Activities with play money'
  ];

  const NUM_LEVEL4_RECOG = [
    'Bundles and sticks',
    'Expansion cards',
    'Expansion chart reading',
    'Activities with play money'
  ];

  const NUM_MENTAL_MATHS_ADD = ['Oral addition', 'Mind map', 'Tossing the ball'];
  const NUM_MENTAL_MATHS_SUB = ['Oral subtraction', 'Mind map', 'Tossing the ball'];
  const NUM_MENTAL_MATHS_MUL_DIV = ['Tossing the ball', 'Mind map'];

  const NUM_CONCEPTS = [
    'Concept of addition and subtraction - Fine with 9',
    'Concept of Multiplication - Multiplication as repeated addition, Ladder method, Concept of zero, Times table',
    'Concept of division - With sticks e.g. 12, 15, 18, With play money'
  ];

  const NUM_BASIC_OPERATIONS = [
    'Addition with bundles and sticks',
    'Addition with play money',
    'Subtraction with bundles and sticks',
    'Subtraction with play money',
    'Multiplication - with box method',
    'Multiplication - using a frame',
    'Division - using play money',
    'Division - using multiplication table'
  ];

  // Specific Selection Dropdown States
  const [litIntroSelected, setLitIntroSelected] = useState<string>('Informal Talk / Chat');
  const [litStoryProc1Selected, setLitStoryProc1Selected] = useState<string>('Procedure 1: Lesson 1 - (Step 1-3)');
  const [litStoryProc2Selected, setLitStoryProc2Selected] = useState<string>('Informal Talk / Chat');
  const [litBlLevelAct, setLitBlLevelAct] = useState<string>('Syllabic Chart Reading');
  const [litWritingChoice, setLitWritingChoice] = useState<string>('Forming syllables from the letter sound');
  const [litConclusionChoice, setLitConclusionChoice] = useState<string>('Copy Writing');
  const [litBlCombinationWarning, setLitBlCombinationWarning] = useState<string>('');

  // Numeracy Interactive Selections
  const [numLevel1Recog, setNumLevel1Recog] = useState<string>('Number chart reading');
  const [numLevel23Recog, setNumLevel23Recog] = useState<string>('Expansion chart reading');
  const [numLevel4Recog, setNumLevel4Recog] = useState<string>('Expansion chart reading');
  const [numOperationArea, setNumOperationArea] = useState<'Addition' | 'Subtraction' | 'Multiplication' | 'Division' | 'Mixed Revision'>('Addition');
  const [numMentalMaths, setNumMentalMaths] = useState<string>('Oral addition');
  const [numConceptSelected, setNumConceptSelected] = useState<string>('Concept of addition and subtraction - Fine with 9');
  const [numBasicOpSelected, setNumBasicOpSelected] = useState<string>('Addition with bundles and sticks');
  const [numRecitationTableNum, setNumRecitationTableNum] = useState<string>('4');
  const [numConclusionChoice, setNumConclusionChoice] = useState<string>('Chorusing & Recitation: Chanting Times table');
  const [numLevel1CombinationWarning, setNumLevel1CombinationWarning] = useState<string>('');
  
  // Literacy specific state
  const [literacyLevel, setLiteracyLevel] = useState<'bl' | 'wsp' | 'story'>('wsp');
  const [litListeningTopic, setLitListeningTopic] = useState('Picture Study Check-in');
  const [litListeningActivity, setLitListeningActivity] = useState('Picture study: Learners say names of items in the provided village scenery poster');
  const [litReadingTopic, setLitReadingTopic] = useState('Simple Paragraph Reading');
  const [litReadingActivity, setLitReadingActivity] = useState('Demonstrate reading fluency on the big poster chart as learners follow on their personal cards');
  const [litWritingTopic, setLitWritingTopic] = useState('Mind Map Vocabulary & Sentence Building');
  const [litWritingActivity, setLitWritingActivity] = useState('Start with the topical word "Amakwebo" (Businesses), elicit learner words, and compose short sentences');
  const [litStep3Details, setLitStep3Details] = useState<string[]>([]);
  const [litStep4Details, setLitStep4Details] = useState<string[]>([]);
  const [litGrammarPractice, setLitGrammarPractice] = useState('Dictation: Copy and write a dictated paragraph of 3 simple sentences');

  // Numeracy specific state
  const [numeracyLevel, setNumeracyLevel] = useState<'level1' | 'level23' | 'level4'>('level23');
  const [numTopic, setNumTopic] = useState('Multiplication');
  const [numRecogTopic, setNumRecogTopic] = useState('Expansion Chart Reading & Card Games');
  const [numRecogActivity, setNumRecogActivity] = useState('Learners read the expansion chart in pairs and snap cards for place-value recognition');
  const [numOperationTopic, setNumOperationTopic] = useState('Multiplication Word Problems via repeated addition');
  const [numOperationActivity, setNumOperationActivity] = useState('Solving local word problems with sticks and play money. E.g., 22 women sell 4 bananas each.');
  const [numApplicationActivity, setNumApplicationActivity] = useState('Azimai amalonda 22 anali kugulitsa nthoci, muzimai aliyense anali ndi nthoci 4. Kodi nthoci zonse pamodzi zinali zingati? (Nthoci 88)');
  const [numRecitation, setNumRecitation] = useState('Reciting the multiplication table of 4 in whole-class chorus');

  // Unified dynamic timetable mapper
  const getSubjectForDay = (dayName: string, wkNum: number): Mode => {
    const isOdd = wkNum % 2 !== 0;
    const isLitDay = ['Monday', 'Wednesday', 'Friday'].includes(dayName);
    return isOdd 
      ? (isLitDay ? 'literacy' : 'numeracy')
      : (isLitDay ? 'numeracy' : 'literacy');
  };

  // Sync default main writing choices when level changes
  useEffect(() => {
    if (literacyLevel === 'bl') {
      setLitWritingChoice('Mind map (Forming syllables/words)');
    } else if (literacyLevel === 'wsp') {
      setLitWritingChoice('Mind map');
    } else {
      setLitWritingChoice('Mind map');
    }
  }, [literacyLevel]);

  // Sync active reading mode (subject) based on the standard day & week selection rules
  useEffect(() => {
    const expected = getSubjectForDay(selectedDay, selectedWeek);
    if (mode !== expected) {
      setMode(expected);
      toast.success(`Week ${selectedWeek} Alternating Timetable: Set target subject to ${expected === 'literacy' ? 'Literacy' : 'Numeracy'} for ${selectedDay}.`);
    }
  }, [selectedWeek, selectedDay]);

  // Handle explicit mode change from tabs, adjusting days correctly to maintain the timetable
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    const isOdd = selectedWeek % 2 !== 0;
    let allowedDays: string[] = [];
    
    if (newMode === 'literacy') {
      allowedDays = isOdd ? ['Monday', 'Wednesday', 'Friday'] : ['Tuesday', 'Thursday'];
    } else {
      allowedDays = isOdd ? ['Tuesday', 'Thursday'] : ['Monday', 'Wednesday', 'Friday'];
    }

    if (!allowedDays.includes(selectedDay)) {
      setSelectedDay(allowedDays[0]);
      toast.success(`Selected day adjusted to ${allowedDays[0]} to align with the chosen subject.`);
    }
  };

  // Sync Mental Maths defaults when day/level/week changes
  useEffect(() => {
    const dayNormal = selectedDay.toLowerCase();
    if (dayNormal === 'monday' || dayNormal === 'wednesday') {
      setNumOperationArea('Addition');
      setNumMentalMaths('Oral addition');
      setNumConceptSelected('Concept of addition and subtraction - Fine with 9');
      setNumBasicOpSelected('Addition with bundles and sticks');
    } else if (dayNormal === 'tuesday' || dayNormal === 'friday') {
      setNumOperationArea('Subtraction');
      setNumMentalMaths('Oral Subtraction');
      setNumConceptSelected('Concept of addition and subtraction - Fine with 9');
      setNumBasicOpSelected('Subtraction with bundles and sticks');
    } else if (dayNormal === 'thursday') {
      setNumOperationArea('Multiplication');
      setNumMentalMaths('Tossing the ball');
      setNumConceptSelected('Concept of Multiplication - Multiplication as repeated addition, Ladder method, Concept of zero, Times table');
      setNumBasicOpSelected('Multiplication - with box method');
    }
  }, [selectedDay, selectedWeek]);

  // Auto select default page when reference guide subject changes
  useEffect(() => {
    setSelectedGuidePage('0-0');
  }, [manualSubject]);

  // Unified synchronisation of generated texts based on dropdowns
  useEffect(() => {
    if (mode === 'literacy') {
      // 1. Step 1 Sync (Listening & Speaking / Procedure 1)
      if (literacyLevel === 'bl' || literacyLevel === 'wsp') {
        setLitListeningTopic(`Introduction: Listening & Speaking (${litIntroSelected})`);
        
        if (litIntroSelected === 'Informal Talk / Chat') {
          setLitListeningActivity(`Teacher conducts informal chat. Initiate friendly conversational prompts about their morning routines and school walks to build oral speaking confidence.`);
        } else if (litIntroSelected === 'Story Telling') {
          setLitListeningActivity(`Teacher tells an animated local folk tale using expressive character voices, inviting learners to model story highlights and predict outcomes.`);
        } else {
          setLitListeningActivity(`Teacher conducts Picture Reading displaying a village poster. Learners observe scenery, point to and identify items in the poster.`);
        }
      } else {
        // Story Level Procedure 1
        setLitListeningTopic(litStoryProc1Selected);
        if (litStoryProc1Selected.includes('Lesson 1')) {
          setLitListeningActivity(`${litStoryProc1Selected}`);
        } else {
          setLitListeningActivity(`${litStoryProc1Selected}`);
        }
      }

      // 2. Step 2 Focus (Reading / Procedure 2)
      if (literacyLevel === 'bl') {
        setLitReadingTopic('Step 2: Reading (Teachers Modeling)');
        setLitReadingActivity('Reading: Teacher will model reading to BL learners because they cannot read. Demonstrate basic letter-sound relationships and finger tracking on the chart.');
      } else if (literacyLevel === 'wsp') {
        setLitReadingTopic('Step 2: Reading (Simple Paragraph)');
        setLitReadingActivity('Reading: Simple paragraph reading. Teacher displays a clean paragraph from the story card. Models reading fluency then guides learners to read collectively.');
      } else {
        // Story Level Procedure 2
        setLitReadingTopic(`Step 2: Reading (Procedure 2: ${litStoryProc2Selected})`);
        if (litStoryProc2Selected === 'Informal Talk / Chat') {
          setLitReadingActivity(`Procedure 2 (Informal Talk / Chat): Friendly conversational check-in regarding the characters.`);
        } else if (litStoryProc2Selected === 'Story Telling') {
          setLitReadingActivity(`Procedure 2 (Story Telling): Teacher tells the story points briefly, highlighting the moral.`);
        } else {
          setLitReadingActivity(`Procedure 2 (Picture Reading): Guide comprehensive reading of story illustrations.`);
        }
      }

      // 3. Step 3 & 4 Focus (Level and Writing Activities)
      if (literacyLevel === 'bl') {
        setLitBlCombinationWarning('');
        setLitWritingTopic(`Step 3: Level Based Activity (${litBlLevelAct})`);
        setLitWritingActivity(`Level Based Practice: Use ${litBlLevelAct} to reinforce letter sounds and syllable blending.`);
        setLitStep3Details([
          `1. Teacher introduces the ${litBlLevelAct} activity to the class.`,
          `2. Models the manipulation of letter sounds and syllables on the board.`,
          `3. Guides learners through point-and-read drills.`,
          `4. Monitors learners as they practice the activity in groups.`
        ]);
        
        // Step 4 for BL is Main Writing
        setLitGrammarPractice(`Step 4: Main Writing Activity (${litWritingChoice})`);
        if (litWritingChoice === 'Mind map (Forming syllables/words)') {
          setLitStep4Details([
            '1. Teacher leads the formation of syllables from a letter sound.',
            '2. Models forming simple words from the initial syllable.',
            '3. Leads the formation of words from the initial letter sound.',
            '4. Assigns learners to write the syllables and words in their notebooks.'
          ]);
        } else if (litWritingChoice === 'Word sentence building') {
          setLitStep4Details([
            '1. Teacher provides key syllables or letter sounds on the board.',
            '2. Models building words by combining the provided sounds.',
            '3. Guides learners to construct simple short sentences using the words.',
            '4. Learners write the constructed sentences neatly in notebooks.'
          ]);
        } else if (litWritingChoice === 'Game of ending and beginning syllable') {
          setLitStep4Details([
            '1. Teacher starts with a word and identifies the ending syllable.',
            '2. Challenges learners to find a new word starting with that syllable.',
            '3. Continues the chain building a list of related words on the board.',
            '4. Learners copy the word chain and attempt to form one sentence.'
          ]);
        } else { // Rhyming words to introduce vowels
          setLitStep4Details([
            '1. Teacher introduces a target vowel sound.',
            '2. Lists words that rhyme to emphasize the vowel sound pattern.',
            '3. Guides learners to identify the common vowels in the words.',
            '4. Learners write the rhyming word lists in notebooks.'
          ]);
        }
      } else if (literacyLevel === 'wsp') {
        setLitWritingTopic(`Step 3: Main Writing Activity (${litWritingChoice})`);
        if (litWritingChoice === 'Mind map') {
          setLitWritingActivity(`Mind Map Process: Start with a topical word from the paragraph. Guide learners to elicit associated words.`);
          setLitStep3Details([
            '1. Teacher writes a topical word from the reading paragraph on the board.',
            '2. Elicits related words from learners to build a mind map.',
            '3. Models constructing sentences using words from the map.',
            '4. Assigns learners to write their own sentences in notebooks.'
          ]);
        } else if (litWritingChoice === 'Correct the incorrect') {
          setLitWritingActivity(`Correct the Incorrect: Teacher writes sentences with errors for learners to identify and fix.`);
          setLitStep3Details([
            '1. Teacher writes 3-5 sentences with spelling and punctuation errors on the board.',
            '2. Guides learners to identify the errors collectively.',
            '3. Models rewriting the sentences correctly on the chalkboard.',
            '4. Learners copy and correct sentences in their exercise books.'
          ]);
        } else { // Story making go ahead
          setLitWritingActivity(`Story making "Go ahead": Start a story and prompt learners to continue it.`);
          setLitStep3Details([
            '1. Teacher starts a short story based on the reading theme.',
            '2. Prompts a learner to provide the next logical sentence.',
            '3. Continues the "Go ahead" chain until a full paragraph is formed.',
            '4. Learners write the final collaborative story in notebooks.'
          ]);
        }
        setLitGrammarPractice(`Step 4: Conclusion (${litConclusionChoice})`);
        setLitStep4Details([
          `1. Teacher leads the final ${litConclusionChoice} closure.`,
          `2. Conducts a quick review of today's lesson objectives.`,
          `3. Provides feedback on writing neatness and spelling.`,
          `4. Assigns independent work to check for lesson mastery.`
        ]);
      } else {
        setLitWritingTopic(`Step 3: Main Writing Activity (Mind Map)`);
        setLitWritingActivity(`Mind Map Process: Start with a topical word from the story. Guide learners to elicit associated words and construct a short narrative.`);
        setLitStep3Details([
          '1. Teacher writes a topical word from the story on the board.',
          '2. Elicits related words from learners to build a mind map.',
          '3. Models constructing sentences or a short story using words from the map.',
          '4. Assigns learners to write the collaborative story in their notebooks.'
        ]);
        
        setLitGrammarPractice(`Step 4: Conclusion (${litConclusionChoice})`);
        setLitStep4Details([
          `1. Teacher leads the final ${litConclusionChoice} closure.`,
          `2. Conducts a quick review of today's story message and objectives.`,
          `3. Provides feedback on writing neatness and story flow.`,
          `4. Assigns independent work to check for lesson mastery.`
        ]);
      }

      // 4. Update the Conclusion in the footer if it's bl
      if (literacyLevel === 'bl') {
          // Placeholder for Step 5
      }

    } else {
      // NUMERACY MODE
      const currentOp = numOperationArea;
      setNumTopic(`Mathematics Operations Area: ${currentOp}`);

      // 1. Number Recognition
      if (numeracyLevel === 'level1') {
        setNumRecogTopic('Number Recognition: Level 1 (Beginner)');
        setNumRecogActivity(`Level 1 Number Recognition Activity: '${numLevel1Recog}'. Guide learners to read numbers sequentially in pairs.`);
        setNumLevel1CombinationWarning('');
      } else if (numeracyLevel === 'level23') {
        setNumLevel1CombinationWarning('');
        setNumRecogTopic('Number Recognition: Levels 2 & 3');
        setNumRecogActivity(`Level 2 & 3 Number Recognition: '${numLevel23Recog}'. Guide learners to decompose numbers into tens and ones using expansion guides (e.g., 26 is 20 + 6).`);
      } else {
        setNumLevel1CombinationWarning('');
        setNumRecogTopic('Number Recognition: Level 4');
        setNumRecogActivity(`Level 4 Number Recognition: '${numLevel4Recog}'. Fast-paced place-value games using high cards up to 1000.`);
      }

      // 2. Mental Maths & Concept Focus
      setNumOperationTopic(`Mental Maths & Concept Introduction: ${numMentalMaths}`);
      setNumOperationActivity(`Continuous mental mathematics exercise category: '${numMentalMaths}'. Followed immediately by: '${numConceptSelected}'. Teach core concept with concrete sticks and visual boards.`);

      // 3. Basic Operations (Word Problems)
      let wordProgressionStr = '';
      if (currentOp === 'Addition' || currentOp === 'Mixed Revision') {
        wordProgressionStr = (numeracyLevel === 'level1')
          ? 'Start with 1 digit + 1 digit and then increase to 2 digits by 1 digit with carry overs.'
          : 'Start with 2 digit + 1 digit and then increase to 2 digits by 2 digits with carry overs.';
      } else if (currentOp === 'Subtraction') {
        wordProgressionStr = (numeracyLevel === 'level1')
          ? 'Start with 1 digit - 1 digit and then increase to 2 digits by 1 digit with take aways.'
          : 'Start with 2 digit - 2 digit and then increase digits with take aways.';
      } else if (currentOp === 'Multiplication') {
        wordProgressionStr = (numeracyLevel === 'level1')
          ? 'Start with 1 digit by 1 digit.'
          : 'Start with 2 digit by 1 digit.';
      } else { // Division
        wordProgressionStr = (numeracyLevel === 'level1')
          ? 'Start with 1 digit by 1 digit (sticks 12, 15, 18) and then progress to 2 digits.'
          : 'Start with 2 digit by 1 digit and progress to 2 digits.';
      }

      setNumApplicationActivity(`Operation Word Problems (${numBasicOpSelected}). Learners solve 2 or 3 structured word problems. (1-2 for the teacher demonstration, 1 for active group work). Progression rule: ${wordProgressionStr}`);

      // 4. Recitation
      setNumRecitation(`Chorus recitation of the times table / multiplication table of ${numRecitationTableNum}. Always end the lesson with this.`);
    }
  }, [
    mode,
    selectedWeek,
    selectedDay,
    literacyLevel,
    numeracyLevel,
    litIntroSelected,
    litStoryProc1Selected,
    litStoryProc2Selected,
    litBlLevelAct,
    litWritingChoice,
    litConclusionChoice,
    numLevel1Recog,
    numLevel23Recog,
    numLevel4Recog,
    numMentalMaths,
    numConceptSelected,
    numBasicOpSelected,
    numRecitationTableNum
  ]);

  const handleGenerateClick = async () => {
    setError(null);
    if (isUserGuestTier || isLimitReached) {
      const status = getDownloadAccessStatus(user, subscriptionDetails);
      const msg = status.message || "You have depleted your allocated downloads. Please renew or upgrade your subscription circle to continue downloading.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (isActiveCircleLimitReached) {
      setError(gradeSpecificLimitMsg || `Billing Cycle Limit Reached: You have reached your package download limit for this cycle. Please upgrade or renew your package.`);
      toast.error("Subscription Limit Reached");
      return;
    }

    setLoading(true);
    try {
      const getLitStep1Title = () => {
        if (literacyLevel === 'story') {
          return litStoryProc1Selected;
        }
        return `Introduction: ${litIntroSelected}`;
      };
      
      const litStep1Title = getLitStep1Title();
      
      const litStep2Title = literacyLevel === 'story'
        ? `Procedure 2: ${litStoryProc2Selected}`
        : 'Reading: Simple Paragraph Reading';
        
      const litStep3Title = literacyLevel === 'bl'
        ? `Level Based Activity: ${litBlLevelAct}`
        : literacyLevel === 'wsp'
        ? `Main Writing Focus: ${litWritingChoice}`
        : `Main Writing Activity: Mind Map`;
      
      const litStep4Title = literacyLevel === 'bl'
        ? `Main Writing Activity: ${litWritingChoice}`
        : `Conclusion: ${litConclusionChoice}`;

      const litStep5Title = `Conclusion: ${litConclusionChoice}`;

      const numStep1Title = `Number Recognition: ${numeracyLevel === 'level1' ? numLevel1Recog : numeracyLevel === 'level23' ? numLevel23Recog : numLevel4Recog}`;
      const numStep2Title = `Mental Maths & Concept Introduction: ${numMentalMaths} (${numConceptSelected})`;
      const numStep3Title = `Operation Word Problems: ${numBasicOpSelected}`;
      const numStep4Title = `Chorusing & Recitation: Chanting Times table of ${numRecitationTableNum}`;

      const tableBlueprint = mode === 'literacy' ? `
<table class="lesson-plan-table">
  <tr>
    <th style="width: 18%;">STAGES</th>
    <th style="width: 41%;">TEACHER'S ACTIVITIES</th>
    <th style="width: 41%;">LEARNERS' ACTIVITIES</th>
  </tr>
  
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${literacyLevel === 'story' ? litStoryProc1Selected : litStep1Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 1: ${literacyLevel === 'story' ? litStoryProc1Selected : 'Listening & Speaking (Intro)'}<br/>(10 mins)</td>
    <td>
      [PH_LIT_STEP1_TEACHER]
    </td>
    <td>
      [PH_LIT_STEP1_LEARNER]
    </td>
  </tr>

  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${litStep2Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 2: ${literacyLevel === 'story' ? 'Reading' : literacyLevel === 'bl' ? 'Reading (Teachers Modeling)' : 'Reading (Simple Paragraph)'}<br/>(25 mins)</td>
    <td>
      [PH_LIT_STEP2_TEACHER]
    </td>
    <td>
      [PH_LIT_STEP2_LEARNER]
    </td>
  </tr>

  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${litStep3Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 3: ${literacyLevel === 'bl' ? 'Level Activity' : 'Writing Activity'}<br/>(15 mins)</td>
    <td>
      [PH_LIT_STEP3_TEACHER]
    </td>
    <td>
      [PH_LIT_STEP3_LEARNER]
    </td>
  </tr>

  ${literacyLevel === 'bl' || litConclusionChoice !== 'Omit (No Conclusion)' ? `
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${litStep4Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 4: ${literacyLevel === 'bl' ? 'Main Writing' : 'Conclusion'}<br/>(15 mins)</td>
    <td>
      [PH_LIT_STEP4_TEACHER]
    </td>
    <td>
      [PH_LIT_STEP4_LEARNER]
    </td>
  </tr>
  ` : ''}

  ${literacyLevel === 'bl' && litConclusionChoice !== 'Omit (No Conclusion)' ? `
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${litStep5Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 5: Conclusion (Optional) (5 mins)</td>
    <td>
      [PH_LIT_STEP5_TEACHER]
    </td>
    <td>
      [PH_LIT_STEP5_LEARNER]
    </td>
  </tr>
  ` : ''}

</table>
` : `
<table class="lesson-plan-table">
  <tr>
    <th style="width: 18%;">STAGES</th>
    <th style="width: 41%;">TEACHER'S ACTIVITIES</th>
    <th style="width: 41%;">LEARNERS' ACTIVITIES</th>
  </tr>
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${numStep1Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 1: Introduction (Number Recognition)<br/>(10 mins)</td>
    <td>
      [PH_NUM_STEP1_TEACHER]
    </td>
    <td>
      [PH_NUM_STEP1_LEARNER]
    </td>
  </tr>
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${numStep2Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 2: Development (Concept Introduction)<br/>(25 mins)</td>
    <td>
      [PH_NUM_STEP2_TEACHER]
    </td>
    <td>
      [PH_NUM_STEP2_LEARNER]
    </td>
  </tr>
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${numStep3Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 3: Applied Operation (Word Problems)<br/>(15 mins)</td>
    <td>
      [PH_NUM_STEP3_TEACHER]
    </td>
    <td>
      [PH_NUM_STEP3_LEARNER]
    </td>
  </tr>
  ${numConclusionChoice !== 'Omit (No Conclusion)' ? `
  <tr>
    <td colspan="3" style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt; padding: 10px; border-bottom: 2px solid #000; color: #000;">
      <strong>ACTIVITY FOCUS: ${numStep4Title}</strong>
    </td>
  </tr>
  <tr>
    <td>Step 4: Conclusion (Closure Game/Recital)<br/>(10 mins)</td>
    <td>
      [PH_NUM_STEP4_TEACHER]
    </td>
    <td>
      [PH_NUM_STEP4_LEARNER]
    </td>
  </tr>
  ` : ''}
</table>
`;

      const guideContext = mode === 'literacy' ? LITERACY_GUIDE : NUMERACY_GUIDE;
      const guideLessonsText = guideContext.map(s => {
        return `### SECTION: ${s.sectionTitle}\n` + s.pages.map(p => {
          return `**Page**: ${p.pageNumber}\n**Title**: ${p.title}\n**Content**:\n${p.content}\n${p.highlights ? `**Key Highlights**: ${p.highlights.join('; ')}` : ''}`;
        }).join('\n\n');
      }).join('\n\n');

      let storyProcedureInstructions = "";
      if (mode === 'literacy' && literacyLevel === 'story') {
        const isLesson1 = litStoryProc1Selected.includes('Lesson 1');
        storyProcedureInstructions = `
### SELECTED STORY LEVEL PROCEDURE INSTRUCTIONS (MUST IMPLEMENT):
For the Story Level lesson plan, you must follow these specific brevity and content rules matching the Ministry of Education Teacher's Guide:

- **Step 1 (Procedure 1: ${litStoryProc1Selected})**:
  * You MUST start the stage title/indicator with: **${litStoryProc1Selected}**.
  * Keep instructions highly customized based on the selection:
    ${isLesson1 ? `
    * Since Lesson 1 is selected, you must cover STEPS 1, 2, and 3 of the story activities:
      - **STEP 1: Discussion on title**: The teacher writes the title on the chalkboard, discussing it and eliciting learners' imaginations of what's inside.
      - **STEP 2: Reading by the teacher**: Guide learners to listen first. Read the story cards aloud clearly, with proper diction, intonation, and pauses, while learners follow along pointing fingers at the words.
      - **STEP 3: Reading by the learners**: Learners take turns reading 2-3 sentences each. The teacher writes keywords on the board.
    ` : `
    * Since Lesson 2 is selected, you must cover STEPS 4, 5, and 6 of the story activities:
      - **STEP 4: Group activities - competition**: Divide the class into groups and ask each group to prepare quiz questions based on Facts from the story, Meaning of difficult words, Opposite meanings, or Same meanings.
      - **STEP 5: Further discussion on the text**: Ask critical questions (e.g., "What is the story about?", "Why was it written?", "What is your own experience?").
      - **STEP 6: Writing**: Learners write a short paragraph summarizing the story in their own words or answer comprehension questions.
    `}
  * Do NOT write overly long descriptions, but fully write the steps.
  * **MANDATORY FOR LEARNERS**: In the learners activity column for this step, explicitly state that learners should **wait for instructions from the teacher** regarding the specific ${litStoryProc1Selected.split(' - ')[0]} steps before they participate.

- **Step 2 (Procedure 2: ${litStoryProc2Selected})**:
  * Keep instructions simple and focused on ${litStoryProc2Selected}.
  * Provide 3 clearly numbered steps for the class and learners.

- **Step 3 (Main Writing Activity: Mind Map)**:
  * Generate steps for the Mind Map activity where the teacher starts with a topical word from the story on the board (provide a specific example word like "Village", "Market", or "Water"), guides learners to make sentences around the topical word, and picks one sentence to write a short story collectively.
  * You MUST provide a sample mind map sentence and a short 2-sentence story example in the teacher's activities.
`;
      }

      const prompt = `You are an expert curriculum developer specializing in the Ministry of Education system of Zambia and the "Teaching at the Right Level (TaRL/Catch-Up) Action Plan" remedial teaching program.
Generate a comprehensive, fully written, professional and standard Zambian Lesson Plan for the learning area of **${mode === 'literacy' ? 'Literacy' : 'Numeracy'}**.
The content you write MUST be realistic, highly detailed, and complete. Sentences must be clearly stated like what other notes are arranged in the teaching notes.
Do NOT use placeholders like "Write your own paragraph here" or list templates. Write out standard, complete sentences, pedagogical instructions, and real educational content.

### OFFICIAL ZAMBIA MINISTRY OF EDUCATION REFERENCE GUIDE DATA:
Below is the official guide content. You MUST extract the exact "Process" (teaching steps) for each selected activity from this context. Do NOT generalize; use the delivery instructions provided in the guide.
${guideLessonsText}

${storyProcedureInstructions}

- **Step 3 (Applied Operation: ${numBasicOpSelected})**:
  * You MUST generate exactly THREE realistic word problems tailored to the lesson level:
    1. One for <b>(Whole class)</b> modeling.
    2. One for <b>(Group work)</b> practice.
    3. One for <b>(Individual work)</b> assessment.
  * Problems must use realistic Zambian context (e.g., buying fruits at the market, sharing pencils).

### CORE INSTRUCTION ON PROCESS DELIVERY:
For both Literacy and Numeracy, the teacher's activities MUST reflect the specific "Process" steps detailed in the guide for the selected activity. You MUST provide concrete examples for every activity:
- **Literacy**: Provide specific examples of letters, syllables, or words for blended reading/writing. 
- **Numeracy**: Provide a sample calculation or pattern example for number recognition and mental maths.
- **Numeracy Step 3 (Applied Operation: ${numBasicOpSelected})**: You MUST generate exactly THREE specific, realistic word problems (1 for Whole Class, 1 for Group Work, 1 for Individual Work).
- **Process Accuracy**: If the guide identifies a 5-step delivery method, you MUST faithfully represent those steps while integrating these concrete examples.

### MANDATORY CANCELLATION OF "CATCH-UP" LABELS:
To prevent redundant naming, do NOT include the words "Catch-Up" as part of the Grade/Level or Subject labels inside the generated document. 
Use only pure subjects ("Literacy" or "Numeracy") and pure levels (e.g., "BL", "WSP", "STORY" for Literacy, and "LEVEL 1", "LEVEL 2 & 3", "LEVEL 4" for Numeracy).

### MANDATORY OUTPUT TEMPLATE (YOU MUST CONFORM EXACTLY TO THIS HTML STRUCTURE):
Your response MUST be wrapped in the following HTML format. Fill every [PH_...] placeholder with genuine, rich, detailed educational content directly quoted, cited or matched from the guide above:

<div style="text-align: center; font-family: 'Inter', sans-serif; margin-bottom: 20px;">
  <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">${district.toUpperCase()} DISTRICT</div>
  <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${school.toUpperCase()}</div>
  <h1 style="font-size: 18pt; font-weight: 800; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">CATCH-UP LESSON PLAN</h1>
  <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${teacherName.toUpperCase()}</div>
  <div style="font-size: 12pt; font-weight: bold;">TS NO: ${tsNumber}</div>
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-family: 'Inter', sans-serif;">
  <tr>
    <td style="padding: 4px 0; font-size: 11pt; width: 65%;"><strong>SCHOOL:</strong> ${school}</td>
    <td style="padding: 4px 0; font-size: 11pt; width: 35%; text-align: right;"><strong>SUBJECT:</strong> ${mode === 'literacy' ? 'Literacy' : 'Numeracy'}</td>
  </tr>
  <tr>
    <td style="padding: 4px 0; font-size: 11pt;"><strong>GRADE / LEVEL:</strong> ${mode === 'literacy' ? literacyLevel.toUpperCase() : (numeracyLevel === 'level1' ? 'LEVEL 1' : numeracyLevel === 'level23' ? 'LEVEL 2 & 3' : 'LEVEL 4')}</td>
    <td style="padding: 4px 0; font-size: 11pt; text-align: right;"><strong>WEEK:</strong> Week ${selectedWeek}</td>
  </tr>
  <tr>
    <td style="padding: 4px 0; font-size: 11pt;"><strong>DATE / DAY:</strong> ${date} (${selectedDay})</td>
    <td style="padding: 4px 0; font-size: 11pt; text-align: right;"><strong>DURATION:</strong> ${duration}</td>
  </tr>
  <tr>
    <td style="padding: 4px 0; font-size: 11pt;"><strong>TIME:</strong> ${time}</td>
    <td style="padding: 4px 0; font-size: 11pt; text-align: right;"><strong>ZONE:</strong> ${zone}</td>
  </tr>
  <tr>
    <td style="padding: 4px 0; font-size: 11pt;" colspan="2"><strong>ENROLMENT:</strong> B: ${enrolmentBoys} G: ${enrolmentGirls} &nbsp;&nbsp;&nbsp;&nbsp; <strong>TOTAL:</strong> ${Number(enrolmentBoys) + Number(enrolmentGirls)}</td>
  </tr>
</table>

<div style="border-top: 1px solid #eee; margin-top: 10px; margin-bottom: 10px;"></div>

<style>
  .lesson-plan-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 10px; 
    margin-bottom: 25px; 
    table-layout: fixed;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  }
  .lesson-plan-table th, .lesson-plan-table td { 
    border: 1px solid #000; 
    padding: 12px 10px; 
    text-align: left; 
    vertical-align: top; 
    font-size: 10.5pt; 
    line-height: 1.4;
    overflow-wrap: break-word;
    word-break: break-word;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  }
  .lesson-plan-table th { 
    background-color: #f8fafc; 
    font-weight: 800; 
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.05em;
  }
  .lesson-plan-table strong {
    display: block;
    margin-bottom: 6px;
    color: #000;
    font-size: 11pt;
    letter-spacing: -0.01em;
  }
</style>

<div class="lesson-plan-content" style="margin-top: 10px; font-family: 'Inter', sans-serif;">
  <strong>T/L AIDS:</strong> [PH_TL_AIDS]<br/>
  <strong>REFERENCES:</strong> "Primary Teach at the Right Level (TaRL/Catch-Up) Teacher Guide"<br/>
  <strong>SPECIFIC OUTCOMES:</strong> [PH_OUTCOMES]<br/>
  <strong>RATIONALE:</strong> This lesson focus on building ${mode === 'literacy' ? literacyLevel.toUpperCase() : 'NUMERACY'} skills. The lesson will improve competency through ${mode === 'literacy' ? 'phonetic awareness and reading' : 'mathematical operation'} practice essential in daily life. Whole class, group work and individual work will be used in this lesson.<br/>
</div>

<h3 style="text-align: left; font-size: 12pt; font-weight: bold; margin-bottom: 5px; margin-top: 15px;">LESSON DEVELOPMENT</h3>
${tableBlueprint}

<div class="lesson-plan-footer" style="width: 100%; margin-top: 15px; page-break-inside: avoid; break-inside: avoid;">
  <p style="margin-bottom: 2px;"><b>LEARNER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  
  <p style="margin-top: 10px; margin-bottom: 2px;"><b>TEACHER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
</div>

### CRITICAL RULES:
1. DO NOT add any markdown formatting like code blocks outside this HTML content.
2. Only replace placeholders matching the pattern [PH_...]. If a cell or area ALREADY has specific text, DO NOT replace it, delete it, or add to it.
3. Every single generation inside a placeholder MUST consist of brief, action-oriented, and concisely numbered bullet points.
4. Keep all descriptions strictly aligned with the Zambian MoE remedial guidelines.
5. Organization labels:
   - For Teacher's Activities placeholders, you MUST follow this organization:
     <b>(Whole class)</b><br/>- 1. [step]<br/>
     <b>(Group work)</b><br/>- 3. [step]<br/>
     <b>(Individual work)</b><br/>- 4. [step]<br/>
   - For Literacy Main Writing/Activity steps, include (Whole class), (Group work), and (Individual work).
   - For Stage 1 (Introduction), include ONLY (Whole class).
   - For Conclusion, include ONLY (Individual work).
   - For all other steps, include (Whole class) and (Individual work).
   ${mode === 'literacy' ? '- For Stage 1 (Introduction) Learners\' Activities, you MUST start with: "- 1. Learners to wait for instructions from the teacher on lesson 1: step 1-3 or lesson 2: step 3-4".' : ''}
6. MANDATORY REFORMAT OF CELL CONTENT:
   - DO NOT write any HTML tags like </td>, <td>, </tr>, <tr> inside the content of the cells. You are strictly forbidden from closing or opening table tags mid-content.
   - Use clean point form starting with hyphens (-) followed by a space and the step number.
   - Keep each bullet point to a maximum of 5-8 words. Total content per cell must be compact.
`;

      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "DEFAULT",
          contents: prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error || 'Failed to generate. Please try again.';
        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }

      const resData = await response.json();
      let textContent = resData.text || '';
      
      if (textContent.includes("```")) {
        textContent = textContent.replace(/^```[a-z]*\n/i, "").replace(/\n```$/m, "");
      }

      // Sanitize standard HTML tag typos often made by AI models
      textContent = textContent
        .replace(/<\/td\/>/gi, '</td>')
        .replace(/<\/tr\/>/gi, '</tr>')
        .replace(/<td\/>/gi, '<td>')
        .replace(/<tr\/>/gi, '<tr>')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<\/td>\s*<\/td>/gi, '</td>')
        .replace(/<td>\s*<td>/gi, '<td>');

      const params = {
        type: 'catch_up',
        subject: mode === 'literacy' ? 'Literacy' : 'Numeracy',
        grade: selectedGrade,
        topic: mode === 'literacy' ? litReadingTopic : numTopic,
        studentLevel: mode === 'literacy' ? literacyLevel.toUpperCase() : (numeracyLevel === 'level1' ? 'LEVEL 1' : numeracyLevel === 'level23' ? 'LEVEL 2 & 3' : 'LEVEL 4'),
        school,
        teacherName,
        tsNumber,
        date,
        term: 'Remedial',
        year: new Date().getFullYear().toString(),
        duration,
        district,
        zone
      };

      onGenerate(textContent, params);
      toast.success('Successfully generated Catch-up Lesson Plan!');
    } catch (err: any) {
      toast.error(err.message || 'Error executing AI generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-500" id="catch-up-root">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-6">
        <div className="flex items-center gap-5">
          <button 
            type="button"
            onClick={onBack}
            className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95 shrink-0"
            id="back-btn"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-4">
             {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl border-2 border-emerald-100 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <GraduationCap size={20} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    Remedial Suite
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mt-1 uppercase">
                  Catch-up Planner
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Teaching: {user?.displayName || 'Teacher'}</p>
              </div>
          </div>
        </div>
      </div>

      {/* AI Voice Playback & Planning Guide */}
      <AIPlanningVoiceGuide 
        toolType="catch_up" 
        toolTitle="Catch-Up & Remedial Planner"
        className="animate-in fade-in duration-300"
      />

      {/* Collapsible General Information Registration Block */}
      {(() => {
        const isRegistered = !!(school || teacherName || tsNumber);

        return (
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4 mb-2 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Sliders size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-100">
                      🎛️ General Information Registration
                    </h4>
                    {isRegistered && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Registered Profile
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                    {isRegistered 
                      ? `Registered for: ${teacherName || 'Teacher'} (${school || 'School'})` 
                      : "Register teacher details once to save & auto-fill across Catch-Up lessons."}
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

            {/* Collapsed view summary of details */}
            {!isGeneralProfileExpanded && isRegistered && (
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1.5">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">School:</span> {school}
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Teacher:</span> {teacherName}
                </div>
                {tsNumber && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">TS:</span> {tsNumber}
                  </div>
                )}
                {district && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">District:</span> {district} / {zone}
                  </div>
                )}
                {(enrolmentBoys || enrolmentGirls) && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Enrolment:</span> {enrolmentBoys}B / {enrolmentGirls}G
                  </div>
                )}
                {(attendanceBoys || attendanceGirls) && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Attendance:</span> {attendanceBoys}B / {attendanceGirls}G
                  </div>
                )}
                {(date || time) && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Timing:</span> {date} {time ? `(${time})` : ''}
                  </div>
                )}
              </div>
            )}

            {isGeneralProfileExpanded && (
              <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* School */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <School size={13} className="text-emerald-400" /> School Name
                    </label>
                    <input 
                      type="text" 
                      value={school} 
                      onChange={e => setSchool(e.target.value)}
                      placeholder="e.g. Kapumba Primary School"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                  {/* Teacher Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User size={13} className="text-emerald-400" /> Teacher Name
                    </label>
                    <input 
                      type="text" 
                      value={teacherName} 
                      onChange={e => setTeacherName(e.target.value)}
                      placeholder="e.g. Fortune Kombe"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TS Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      TS Number / Staff ID
                    </label>
                    <input 
                      type="text" 
                      value={tsNumber} 
                      onChange={e => setTsNumber(e.target.value)}
                      placeholder="e.g. TS/982341"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                  {/* District */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      District
                    </label>
                    <input 
                      type="text" 
                      value={district} 
                      onChange={e => setDistrict(e.target.value)}
                      placeholder="e.g. Mkushi"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                  {/* Zone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Zone
                    </label>
                    <input 
                      type="text" 
                      value={zone} 
                      onChange={e => setZone(e.target.value)}
                      placeholder="e.g. Central Zone"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                </div>

                {/* Enrolment & Attendance Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Enroled Boys
                    </label>
                    <input 
                      type="number" 
                      value={enrolmentBoys} 
                      onChange={e => setEnrolmentBoys(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Enroled Girls
                    </label>
                    <input 
                      type="number" 
                      value={enrolmentGirls} 
                      onChange={e => setEnrolmentGirls(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Present Boys
                    </label>
                    <input 
                      type="number" 
                      value={attendanceBoys} 
                      onChange={e => setAttendanceBoys(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Present Girls
                    </label>
                    <input 
                      type="number" 
                      value={attendanceGirls} 
                      onChange={e => setAttendanceGirls(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white text-center font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Lesson Date
                    </label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Lesson Duration / Time
                    </label>
                    <input 
                      type="text" 
                      value={time} 
                      onChange={e => setTime(e.target.value)}
                      placeholder="e.g. 08:00 - 08:40 AM (40 mins)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveGeneralProfile}
                    className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-900/10 cursor-pointer"
                  >
                    <Save size={14} />
                    Save & Register Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {generatorTab === 'plan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form panel - left 2 columns */}
          <div className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/40">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className={mode === 'literacy' ? 'text-emerald-500' : 'text-blue-500'} />
                Lesson Plan Parameters
              </h3>
            </div>

            {/* Remedial Planning Selection Area */}
            <div className="space-y-6">
              
              {/* Week Selector Section with ZMoE Exchange Priority Badge */}
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                      Select Remedial Week
                    </h4>
                    <p className="text-[11px] text-slate-500">Zambian Catch-up timing (Level-based cohort pathways)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedWeek % 2 !== 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                        📖 ODD WEEK: LITERACY (M, W, Th) / NUMERACY (T, F)
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                        🔢 EVEN WEEK: NUMERACY (M, W, Th) / LITERACY (T, F)
                      </span>
                    )}
                  </div>
                </div>

                {/* Week Numbers Selector */}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((wk) => {
                    const isActive = selectedWeek === wk;
                    return (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => setSelectedWeek(wk)}
                        className={`w-9 h-9 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all ${
                          isActive 
                            ? 'bg-[#042F3E] text-white ring-2 ring-emerald-400' 
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm'
                        }`}
                      >
                        W{wk}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 leading-normal bg-white p-3 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span>
                    {selectedWeek % 2 !== 0 ? (
                      <span>💡 <b>Odd Week:</b> Literacy is taught on Monday, Wednesday, and Friday. Numeracy is on Tuesday and Thursday.</span>
                    ) : (
                      <span>💡 <b>Even Week:</b> Numeracy is taught on Monday, Wednesday, and Friday (carrying the Odd Week Literacy schedule). Literacy is on Tuesday and Thursday.</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Subject Mode Pathway Toggles (Moved here above Select Day & Subject Schedule per user request) */}
              <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                      Select Subject Pathway
                    </h4>
                    <p className="text-[11px] text-slate-500">Choose between Literacy or Numeracy catch-up mode</p>
                  </div>

                  <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-2 border border-slate-300/70 self-start sm:self-auto shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleModeChange('literacy')}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                        mode === 'literacy' 
                          ? 'bg-[#00A86B] text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-300' 
                          : 'text-slate-600 hover:bg-slate-300/60'
                      }`}
                    >
                      <BookOpen size={14} />
                      <span>Literacy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('numeracy')}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                        mode === 'numeracy' 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-300' 
                          : 'text-slate-600 hover:bg-slate-300/60'
                      }`}
                    >
                      <Maximize2 size={14} />
                      <span>Numeracy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Catch-Up Planner Navigation Tabs (Placed below Select Subject Pathway per user request) */}
              <div className="bg-slate-100/90 p-4 rounded-[2rem] border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                      Catch-Up Resource View
                    </h4>
                    <p className="text-[11px] text-slate-500">Select view: Lesson Planner, Guiding Frames, or Reference Guides</p>
                  </div>

                  <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/90 shrink-0 select-none gap-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setGeneratorTab('plan')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        (generatorTab as string) === 'plan' 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📝 Lesson Planner
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratorTab('frames')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        (generatorTab as string) === 'frames' 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📋 Guiding Frames
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratorTab('manual')}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        (generatorTab as string) === 'manual' 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📖 Reference Guides
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Day selection enforcing the user's alternating schedule */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    Select Day & Subject Schedule
                  </label>
                  <div className="grid grid-cols-5 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 text-center gap-2.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                      const isSelected = selectedDay === day;
                      const daySubject = getSubjectForDay(day, selectedWeek);
                      const dayLabel = day.substring(0, 3);
                      
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 min-h-[50px] border-2 ${
                            isSelected 
                              ? (daySubject === 'literacy' 
                                  ? 'bg-[#00A86B] text-white shadow-md border-emerald-700 ring-2 ring-emerald-300' 
                                  : 'bg-blue-600 text-white shadow-md border-blue-800 ring-2 ring-blue-300')
                              : 'bg-white hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm'
                          }`}
                          title={`${day}: ${daySubject.toUpperCase()}`}
                        >
                          <span className="font-extrabold">{dayLabel}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : (daySubject === 'literacy' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-blue-100 text-blue-800')
                          }`}>
                            {daySubject === 'literacy' ? 'LIT' : 'NUM'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level select */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Target Learner Level
                  </label>
                  {mode === 'literacy' ? (
                    <div className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-center gap-1.5 min-h-[58px] items-center">
                      <button
                        type="button"
                        onClick={() => setLiteracyLevel('bl')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          literacyLevel === 'bl' ? 'bg-[#00A86B] text-white shadow-sm border-emerald-700' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Letter (BL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiteracyLevel('wsp')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          literacyLevel === 'wsp' ? 'bg-[#00A86B] text-white shadow-sm border-emerald-700' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Word/Par (WSP)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiteracyLevel('story')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          literacyLevel === 'story' ? 'bg-[#00A86B] text-white shadow-sm border-emerald-700' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Story Level
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-center gap-1.5 min-h-[58px] items-center">
                      <button
                        type="button"
                        onClick={() => setNumeracyLevel('level1')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          numeracyLevel === 'level1' ? 'bg-blue-600 text-white shadow-sm border-blue-800' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Level 1 (Beg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumeracyLevel('level23')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          numeracyLevel === 'level23' ? 'bg-blue-600 text-white shadow-sm border-blue-800' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Level 2/3
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumeracyLevel('level4')}
                        className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${
                          numeracyLevel === 'level4' ? 'bg-blue-600 text-white shadow-sm border-blue-800' : 'text-slate-500 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Level 4 (Adv)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* INTERACTIVE GUIDEBOOK CONTROLS */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 space-y-4">
                <span className="font-black text-slate-800 uppercase tracking-widest text-[10px] bg-white px-3 py-1.5 rounded-lg border border-slate-200 block w-max">
                  🎓 Interactive Activity Selectors
                </span>

                {mode === 'literacy' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {literacyLevel === 'story' ? (
                      <>
                        {/* Story Level Selectors */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Step 1: Procedure 1</label>
                          <select
                            value={litStoryProc1Selected}
                            onChange={(e) => setLitStoryProc1Selected(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                          >
                            {LIT_STORY_PROC1.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                           <div className="space-y-1">
                             <span className="text-xs font-bold text-slate-700 block">Step 2: Procedure 2</span>
                             <select
                               value={litStoryProc2Selected}
                               onChange={(e) => setLitStoryProc2Selected(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                             >
                               {LIT_STORY_PROC2.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                           </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Step 3: Main Activity</label>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                            Mind Map: Start with the topical word, make sentences round the topical word and pick one sentence to write a short story.
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* BL and WSP Selectors */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Step 1: Listening & Speaking</label>
                          <select
                            value={litIntroSelected}
                            onChange={(e) => setLitIntroSelected(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                          >
                            {LIT_INTROS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Step 2: Reading</label>
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                            Simple Paragraph Reading
                          </div>
                        </div>

                        {literacyLevel === 'bl' && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Step 3: Level Based Activities</label>
                            <select
                              value={litBlLevelAct}
                              onChange={(e) => setLitBlLevelAct(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                            >
                              {LIT_BL_LEVEL_ACTIVITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            {literacyLevel === 'bl' ? 'Step 4' : 'Step 3'}: Main Writing Activities
                          </label>
                          <select
                            value={litWritingChoice}
                            onChange={(e) => setLitWritingChoice(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                          >
                            {(literacyLevel === 'bl' ? LIT_BL_MAIN_WRITING : LIT_WSP_MAIN_WRITING).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Common Conclusion Step for ALL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {literacyLevel === 'bl' ? 'Step 5' : literacyLevel === 'wsp' ? 'Step 4' : 'Step 4'}: Conclusion (Optional)
                      </label>
                      <select
                        value={litConclusionChoice}
                        onChange={(e) => setLitConclusionChoice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                      >
                        {LIT_CONCLUSIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  // NUMERACY GUIDEBOOK CHOICES
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Step 1: Number recognition dropdown based on level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        1. Number Recognition Focus
                      </label>
                      {numeracyLevel === 'level1' ? (
                        <select
                          value={numLevel1Recog}
                          onChange={(e) => setNumLevel1Recog(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          {NUM_LEVEL1_RECOG.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : numeracyLevel === 'level23' ? (
                        <select
                          value={numLevel23Recog}
                          onChange={(e) => setNumLevel23Recog(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          {NUM_LEVEL23_RECOG.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <select
                          value={numLevel4Recog}
                          onChange={(e) => setNumLevel4Recog(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          {NUM_LEVEL4_RECOG.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Step 2: Mental Maths & Operation Area */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          2. Target Operation Area
                        </label>
                        <select
                          value={numOperationArea}
                          onChange={(e) => setNumOperationArea(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          <option value="Addition">Addition</option>
                          <option value="Subtraction">Subtraction</option>
                          <option value="Multiplication">Multiplication</option>
                          <option value="Division">Division</option>
                          <option value="Mixed Revision">Mixed Revision</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Mental Maths Route
                        </label>
                        <select
                          value={numMentalMaths}
                          onChange={(e) => setNumMentalMaths(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          {(numOperationArea === 'Multiplication' || numOperationArea === 'Division')
                            ? NUM_MENTAL_MATHS_MUL_DIV.map(opt => <option key={opt} value={opt}>{opt}</option>)
                            : numOperationArea === 'Subtraction'
                            ? NUM_MENTAL_MATHS_SUB.map(opt => <option key={opt} value={opt}>{opt}</option>)
                            : NUM_MENTAL_MATHS_ADD.map(opt => <option key={opt} value={opt}>{opt}</option>)
                          }
                        </select>
                      </div>
                    </div>

                    {/* Step 2b: Concept Target Focus */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block truncate">
                        Core Operations Concept Target
                      </label>
                      <select
                        value={numConceptSelected}
                        onChange={(e) => setNumConceptSelected(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                      >
                        {NUM_CONCEPTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {/* Step 3: Word Problems & Practical Activity */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        3. Applied Operation (Progression Word Problems)
                      </label>
                      <select
                        value={numBasicOpSelected}
                        onChange={(e) => setNumBasicOpSelected(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                      >
                        {NUM_BASIC_OPERATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {/* Step 4: Optional Interactive Conclusion */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Step 4: Optional Interactive Conclusion
                      </label>
                      <select
                        value={numConclusionChoice}
                        onChange={(e) => setNumConclusionChoice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                      >
                        {NUM_CONCLUSIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {/* Step 4b: End Chanting multiplier - conditionally shown */}
                    {numConclusionChoice === 'Chorusing & Recitation: Chanting Times table' && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-xs font-bold text-slate-700">
                          Rhythmic Multiplication table to recite
                        </label>
                        <select
                          value={numRecitationTableNum}
                          onChange={(e) => setNumRecitationTableNum(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
                        >
                          {['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(n => (
                            <option key={n} value={n}>Times Table of {n}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Combination Warnings per Guidebook limits */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                    <Info size={16} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}
                {litBlCombinationWarning && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-2xl text-[11px] font-bold">
                    {litBlCombinationWarning}
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateClick}
                className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md ${
                  loading 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : (mode === 'literacy' ? 'bg-[#00A86B] text-white hover:bg-[#008f5a]' : 'bg-blue-600 text-white hover:bg-blue-700')
                }`}
                id="generate-catchup-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Synthesizing Remedial Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate documents</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Timetable widget - right 1 column */}
          <div className="space-y-6">
            
            {/* Quick Weekly Info */}
            <div className="bg-[#042F3E] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00A86B] rounded-xl flex items-center justify-center text-white">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-[#00A86B]">Zambia Remedial Program</h4>
                  <h3 className="text-lg font-bold">Catch-Up Guidelines</h3>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#94A3B8]">
                The Primary Catch-up program operates on structured level placements. Ensure pupils are regularly assessed and placed into appropriate levels:
              </p>

              <div className="space-y-3 pl-1 text-xs">
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Beginners (Letter Level):</strong>
                    <span className="text-[#94A3B8] block">Focuses on phonics, syllable blending, and raw matching charts.</span>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Word / Simple Paragraph Level:</strong>
                    <span className="text-[#94A3B8] block">Transitioning to sentence structure and context association.</span>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Story Level:</strong>
                    <span className="text-[#94A3B8] block">Advanced fluency, comprehensive retelling, and creative drafts.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Timetable visualizer for current week alignment */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/30 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">Alternating Timetable</h4>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                  Week {selectedWeek}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Subject days swap weekly on an alternating basis to secure equal time allocation. Current scheduled sequence:
              </p>

              <div className="space-y-2 text-xs">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                  const isActive = selectedDay === day;
                  const daySub = getSubjectForDay(day, selectedWeek);
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                        isActive 
                          ? (daySub === 'literacy' 
                              ? 'bg-emerald-50/70 border-emerald-300 font-bold scale-[1.02]' 
                              : 'bg-blue-50/70 border-blue-300 font-bold scale-[1.02]')
                          : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <span className="slate-800 capitalize flex items-center gap-1.5">
                        {isActive && (
                          <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${
                            daySub === 'literacy' ? 'bg-[#00A86B]' : 'bg-blue-600'
                          }`} />
                        )}
                        {day}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                        daySub === 'literacy' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {daySub === 'literacy' ? 'Literacy Focus' : 'Numeracy Focus'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex gap-2">
                <span className="text-[10px] text-amber-800 leading-normal">
                  💡 <b>Auto-Sync:</b> Changing the week or day automatic shifts the plan to matching Literacy or Numeracy parameters according to Zambian guidelines.
                </span>
              </div>
            </div>

          </div>

        </div>
      ) : generatorTab === 'frames' ? (
        /* GUIDING FRAMES TAB IN THE APP */
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <BookMarked className="text-emerald-500" size={24} />
                Ministry of Education Catch-Up Guiding Frames
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Structured lesson planning matrices grouped by pupil placement cohort pathways.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 select-none gap-2 shadow-sm">
              <button
                type="button"
                onClick={() => setGeneratorTab('plan')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'plan' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📝 Lesson Planner
              </button>
              <button
                type="button"
                onClick={() => setGeneratorTab('frames')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'frames' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📋 Guiding Frames
              </button>
              <button
                type="button"
                onClick={() => setGeneratorTab('manual')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'manual' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📖 Reference Guides
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {/* Beginner and Letter-Sound Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-md font-extrabold text-rose-950 uppercase tracking-wide">
                  1. Beginner and Letter-Sound Level Cohort (BL)
                </h4>
              </div>
              <p className="text-xs text-rose-800 font-medium">
                Focus remains actively on oral language acquisition, phonemic letter-sound decoding, and blending letters into simple phonetic syllables.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-rose-50/60 border-b border-rose-100 text-[10px] uppercase font-black tracking-wider text-rose-900">
                      <th className="p-4 w-[20%]">Activity</th>
                      <th className="p-4 w-[30%]">Competency / Outcome Focus</th>
                      <th className="p-4 w-[15%]">Duration</th>
                      <th className="p-4 w-[20%]">Frequency</th>
                      <th className="p-4 w-[15%]">Resources</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {BEGINNER_FRAME.map(row => (
                      <tr key={row.activity} className="hover:bg-rose-50/20 transition-all font-medium">
                        <td className="p-4 font-bold text-rose-950">{row.activity}</td>
                        <td className="p-4 leading-relaxed text-slate-600">{row.competency}</td>
                        <td className="p-4 font-mono text-slate-500">{row.duration}</td>
                        <td className="p-4 leading-normal text-slate-600">{row.frequency}</td>
                        <td className="p-4 text-slate-500">{row.resources}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Word and Simple Paragraph Level */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h4 className="text-md font-extrabold text-amber-950 uppercase tracking-wide">
                  2. Word and Simple Paragraph Level Cohort (WSP)
                </h4>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                Focus expands from isolated word construction to reading simple multi-line paragraphs, spelling corrections, and basic visual punctuation mapping.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-amber-50/60 border-b border-amber-100 text-[10px] uppercase font-black tracking-wider text-amber-900">
                      <th className="p-4 w-[20%]">Activity</th>
                      <th className="p-4 w-[30%]">Competency / Outcome Focus</th>
                      <th className="p-4 w-[15%]">Duration</th>
                      <th className="p-4 w-[20%]">Frequency</th>
                      <th className="p-4 w-[15%]">Resources</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {WSP_FRAME.map(row => (
                      <tr key={row.activity} className="hover:bg-amber-50/20 transition-all font-medium">
                        <td className="p-4 font-bold text-amber-950">{row.activity}</td>
                        <td className="p-4 leading-relaxed text-slate-600">{row.competency}</td>
                        <td className="p-4 font-mono text-slate-500">{row.duration}</td>
                        <td className="p-4 leading-normal text-slate-600">{row.frequency}</td>
                        <td className="p-4 text-slate-500">{row.resources}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Story Level Learners */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h4 className="text-md font-extrabold text-blue-950 uppercase tracking-wide">
                  3. Story Level Learners Cohort (STORY)
                </h4>
              </div>
              <p className="text-xs text-blue-800 font-medium">
                Focus transitions to active comprehension, logical and analytical critical thinking, narrative essays writing, copywriting mechanics, and dictation.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-50/60 border-b border-blue-100 text-[10px] uppercase font-black tracking-wider text-blue-900">
                      <th className="p-4 w-[20%]">Activity</th>
                      <th className="p-4 w-[30%]">Competency / Outcome Focus</th>
                      <th className="p-4 w-[15%]">Duration</th>
                      <th className="p-4 w-[20%]">Frequency</th>
                      <th className="p-4 w-[15%]">Resources</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {STORY_FRAME.map(row => (
                      <tr key={row.activity} className="hover:bg-blue-50/20 transition-all font-medium">
                        <td className="p-4 font-bold text-blue-950">{row.activity}</td>
                        <td className="p-4 leading-relaxed text-slate-600">{row.competency}</td>
                        <td className="p-4 font-mono text-slate-500">{row.duration}</td>
                        <td className="p-4 leading-normal text-slate-600">{row.frequency}</td>
                        <td className="p-4 text-slate-500">{row.resources}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* SEPARATED REFERENCE GUIDES TAB IN THE APP */
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <BookMarked className="text-emerald-500" size={24} />
                Zambia MoE official Catch-up & Remedial Guides
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Official curriculum-aligned reference manuals and diagnostic booklets
              </p>
            </div>
            
            {/* Main Catch-Up Planner Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 select-none gap-2 shadow-sm">
              <button
                type="button"
                onClick={() => setGeneratorTab('plan')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'plan' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📝 Lesson Planner
              </button>
              <button
                type="button"
                onClick={() => setGeneratorTab('frames')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'frames' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📋 Guiding Frames
              </button>
              <button
                type="button"
                onClick={() => setGeneratorTab('manual')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  (generatorTab as string) === 'manual' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                📖 Reference Guides
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-4">
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Select Reference Guide Manual
              </h4>
            </div>

            {/* Guide Selector (Literacy vs Numeracy vs Grade 5 Remedial) */}
            <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-1 border border-slate-200 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setManualSubject('literacy')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-2 ${
                  manualSubject === 'literacy' 
                    ? 'bg-emerald-600 text-white shadow-md border-emerald-700' 
                    : 'text-slate-600 hover:bg-slate-200 border-slate-300'
                }`}
              >
                📖 Literacy (Pages 1-37)
              </button>
              <button
                type="button"
                onClick={() => setManualSubject('numeracy')}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-2 ${
                  manualSubject === 'numeracy' 
                    ? 'bg-blue-600 text-white shadow-md border-blue-800' 
                    : 'text-slate-600 hover:bg-slate-200 border-slate-300'
                }`}
              >
                🔢 Numeracy (Pages 1-42)
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualSubject('remedial');
                  setRemedialSubTab('chapters');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-2 ${
                  manualSubject === 'remedial' 
                    ? 'bg-[#042F3E] text-white shadow-md border-[#021c25]' 
                    : 'text-slate-600 hover:bg-slate-200 border-slate-300'
                }`}
              >
                📘 Grade 5 Remedial (Pages 1-49)
              </button>
            </div>
          </div>

          {/* Remedial Cross-Grade Reference Notice */}
          {manualSubject === 'remedial' && (
            <div className="bg-[#042F3E]/5 border border-[#042F3E]/20 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <span className="text-2xl mt-0.5 shrink-0">💡</span>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#042F3E]">
                  Zambia MoE Grade 5 Remedial Reference Booklet & Illustration Bank
                </h4>
                <p className="text-xs text-[#042F3E]/80 font-bold leading-relaxed">
                  While authored for Grade 5 learning difficulties, these diagnostic chapters and illustrations are designed for <strong className="text-[#042F3E]">cross-grade usage</strong>. The visual drawing templates and phonic aids in this book are highly recommended for <strong className="text-[#042F3E]">Early Childhood Education (ECE) levels, Lower Primary (Grades 1-4)</strong>, and all remedial intervention blocks.
                </p>
              </div>
            </div>
          )}

          {/* Subtab selection for Remedial Guide (Content vs Interactive Illustrations) */}
          {manualSubject === 'remedial' && (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 gap-4">
              <span className="text-xs font-bold text-slate-500 pl-2">
                Explore Booklet Chapters or browse cross-grade drawing templates:
              </span>
              <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setRemedialSubTab('chapters')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    remedialSubTab === 'chapters' 
                      ? 'bg-[#042F3E] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  📖 Read Chapters
                </button>
                <button
                  type="button"
                  onClick={() => setRemedialSubTab('illustrations')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    remedialSubTab === 'illustrations' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  🎨 Illustration Bank (ECE / All Grades)
                </button>
              </div>
            </div>
          )}

          {manualSubject === 'remedial' && remedialSubTab === 'illustrations' ? (
            /* INTERACTIVE ILLUSTRATIONS GRID (FOR ECE & ALL GRADES) */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search illustrations (e.g. Ant, Table, Abacus)..."
                    value={illSearch}
                    onChange={(e) => setIllSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-[#042F3E] rounded-2xl font-bold text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Category:</span>
                  {['All', 'Phonics & Vocabulary', 'Prepositions', 'Mathematics', 'Life Skills'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIllCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                        illCategory === cat
                          ? 'bg-[#042F3E] text-white border-[#042F3E]'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Illustrations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {REMEDIAL_ILLUSTRATIONS.filter(ill => {
                  const matchSearch = ill.title.toLowerCase().includes(illSearch.toLowerCase()) || 
                                      ill.description.toLowerCase().includes(illSearch.toLowerCase()) ||
                                      ill.howToTeach.toLowerCase().includes(illSearch.toLowerCase());
                  const matchCat = illCategory === 'All' || ill.category === illCategory;
                  return matchSearch && matchCat;
                }).map((ill) => (
                  <div 
                    key={ill.id}
                    className="bg-slate-50 border border-slate-150 rounded-3xl p-5 hover:border-slate-300 hover:shadow-lg transition-all flex flex-col h-full"
                  >
                    {/* Header with tags */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="bg-slate-200/70 text-slate-700 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {ill.category}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-100">
                        {ill.gradeSuitability}
                      </span>
                    </div>

                    {/* Central visual box */}
                    <div className="bg-white rounded-2xl h-28 border border-slate-100 flex items-center justify-center mb-4 relative overflow-hidden shadow-inner group">
                      <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{ill.emoji}</span>
                      <span className="absolute bottom-2 right-3 text-[8px] font-mono font-bold text-slate-300 uppercase">Interactive Asset</span>
                    </div>

                    {/* Meta info */}
                    <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug mb-1">
                      {ill.title}
                    </h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed font-bold line-clamp-2 mb-4">
                      {ill.description}
                    </p>

                    {/* Action button */}
                    <button
                      type="button"
                      onClick={() => setSelectedIll(ill)}
                      className="mt-auto w-full py-3 bg-[#042F3E] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      🎨 View Blackboard Sketch
                    </button>
                  </div>
                ))}
              </div>

              {/* No results catcher */}
              {REMEDIAL_ILLUSTRATIONS.filter(ill => {
                const matchSearch = ill.title.toLowerCase().includes(illSearch.toLowerCase()) || 
                                    ill.description.toLowerCase().includes(illSearch.toLowerCase());
                const matchCat = illCategory === 'All' || ill.category === illCategory;
                return matchSearch && matchCat;
              }).length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <Image className="mx-auto text-slate-300 mb-2 animate-bounce" size={32} />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching illustrations found</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Try another search query or adjust your filters.</p>
                </div>
              )}

              {/* Blackboard Draw Modal */}
              {selectedIll && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2.5rem]">
                      <div>
                        <div className="flex gap-2 mb-1.5">
                          <span className="bg-[#042F3E] text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                            {selectedIll.category}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                            {selectedIll.gradeSuitability}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="text-2xl">{selectedIll.emoji}</span>
                          {selectedIll.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedIll(null)}
                        className="p-3 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors shadow-sm"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Blackboard Drawing */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                          Blackboard Drawing Sketch (Draw this on the Board):
                        </span>
                        
                        <div className="bg-[#0c1e24] border-4 border-[#032630] font-mono text-[#e2f1f5] rounded-3xl p-6 shadow-xl relative min-h-[220px] flex flex-col justify-center overflow-x-auto select-none">
                          {/* Chalk lines details */}
                          <div className="absolute top-2.5 right-3 text-[8px] font-mono text-emerald-400/40 uppercase tracking-widest font-bold">Chalk Board</div>
                          <pre className="text-xs leading-normal whitespace-pre text-emerald-300 font-bold font-mono">
                            {selectedIll.visualLayout}
                          </pre>
                        </div>
                        
                        <p className="text-[10px] leading-relaxed font-bold text-slate-400 italic">
                          💡 Tip: Use colored chalk to highlight structural arrows, segments, and text guides to prevent eye strain for younger learners.
                        </p>
                      </div>

                      {/* Right: How to Teach */}
                      <div className="space-y-5">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                            Illustration Description:
                          </span>
                          <p className="text-xs text-slate-600 font-bold leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {selectedIll.description}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                            How to Teach & Classroom Prompts:
                          </span>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/40">
                            {selectedIll.howToTeach}
                          </p>
                        </div>

                        {/* Grade Adaptation Info Panel */}
                        <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl space-y-2">
                          <h5 className="text-[10px] font-black uppercase text-emerald-800 tracking-widest flex items-center gap-1.5">
                            <Sparkles size={13} className="text-emerald-600 animate-pulse" /> Cross-Grade Adaptation & ECE Tips:
                          </h5>
                          <ul className="list-disc list-inside text-xs text-emerald-800 space-y-1 pl-1 font-semibold leading-relaxed">
                            <li><strong>ECE Levels:</strong> Focus purely on naming the object (e.g. {selectedIll.emoji}), sounding out its initial letter phonics, counting segments, or describing colors orally.</li>
                            <li><strong>Grades 1 - 2:</strong> Guide copying of simple sketches. Use as spelling cards or vertical matching drills.</li>
                            <li><strong>Grades 3 - 5 (Remedial):</strong> Have learners write full complete sentence narratives explaining the illustrated relations (e.g. writing prepositions).</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[2.5rem]">
                      <button
                        type="button"
                        onClick={() => setSelectedIll(null)}
                        className="px-6 py-3 bg-slate-900 hover:bg-[#042F3E] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-md"
                      >
                        Got it, Thanks
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STANDARD HANDBOOK CHAPTERS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left sidebar directory layout */}
              <div className="md:col-span-1 border-r border-slate-100 pr-4 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">
                  INDEX & BOOK CHAPTERS
                </h4>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {(manualSubject === 'literacy' ? LITERACY_GUIDE : (manualSubject === 'numeracy' ? NUMERACY_GUIDE : REMEDIAL_GUIDE)).map((sec, sIdx) => (
                    <div key={sec.sectionTitle} className="space-y-1">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-tight">
                        {sec.sectionTitle}
                      </div>
                      <div className="pl-1.5 space-y-1 pt-1">
                        {sec.pages.map((p, pIdx) => {
                          const isPageSelected = selectedGuidePage === `${sIdx}-${pIdx}`;
                          return (
                            <button
                              key={p.title}
                              onClick={() => setSelectedGuidePage(`${sIdx}-${pIdx}`)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all transition-colors flex items-center justify-between ${
                                isPageSelected 
                                  ? 'bg-[#042F3E] text-white shadow-sm' 
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate pr-1">{p.title}</span>
                              <span className={`shrink-0 text-[9px] font-mono px-2 py-0.5 rounded-full ${
                                isPageSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {p.pageNumber}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content page reader screen */}
              <div className="md:col-span-2 space-y-6 bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-150 min-h-[420px]">
                {selectedGuidePage ? (() => {
                  const [sIdxString, pIdxString] = selectedGuidePage.split('-');
                  const sIdx = parseInt(sIdxString);
                  const pIdx = parseInt(pIdxString);
                  const currentGuide = manualSubject === 'literacy' ? LITERACY_GUIDE : (manualSubject === 'numeracy' ? NUMERACY_GUIDE : REMEDIAL_GUIDE);
                  const activeSec = currentGuide[sIdx];
                  const activePage = activeSec?.pages[pIdx];

                  if (!activePage) return <p className="text-center text-slate-400 text-xs">Manual page details failed to resolve.</p>;

                  return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <span className="bg-slate-900 text-white text-[9px] font-mono px-3 py-1 rounded-full font-black uppercase tracking-wider">
                          {manualSubject.toUpperCase()} COHORT • {activePage.pageNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Republic of Zambia MoE
                        </span>
                      </div>

                      <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {activePage.title}
                      </h4>

                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {activePage.content}
                      </p>

                      {activePage.highlights && activePage.highlights.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl space-y-2 mt-6">
                          <h5 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Teacher Action Points & Rules:
                          </h5>
                          <ul className="list-disc list-inside text-xs text-emerald-800 space-y-1.5 leading-relaxed font-semibold pl-1">
                            {activePage.highlights.map(h => <li key={h}>{h}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                    <BookOpen size={48} className="text-slate-300 animate-pulse" />
                    <div className="text-center">
                      <p className="text-sm font-black uppercase tracking-widest">Select a handbook chapter</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs mx-auto">
                        Explore the complete structured curriculum outlines of both guides cleanly separated pages.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
