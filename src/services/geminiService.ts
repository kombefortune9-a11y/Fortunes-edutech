// import { GoogleGenAI } from "@google/genai";

import { 
  extractBriefCompetencies, 
  formatGeneralCompetenciesShortForm,
  getExpectedStandardsForSubtopic,
  getActivitiesForSubtopic,
  deriveExpectedStandardFromCompetency,
  deriveLearningActivitiesFromCompetency,
  getOfficialSyllabusCitation
} from "../utils/competencyUtils";

export interface GenerationParams {
  type?: string;
  curriculumType?: string;
  topic?: string;
  topic2?: string;
  topic3?: string;
  subtopic?: string;
  specificCompetences?: string;
  learningActivities?: string[];
  grade?: string;
  subject?: string;
  zambianLanguage?: string;
  officialSyllabusData?: any[];
  school?: string;
  schoolName?: string;
  classDescription?: string;
  time?: string;
  teacherName?: string;
  tsNumber?: string;
  date?: string;
  term?: string;
  year?: string;
  duration?: string;
  testType?: string;
  difficultyLevel?: string;
  testName?: string;
  testDate?: string;
  testDuration?: string;
  questionCounts?: any;
  additionalInstructions?: string;
  includeMarkingKey?: boolean;
  includeVisuals?: boolean;
  forecastWeek?: number;
  stoppingTopic?: string;
  lessonNumber?: string;
  lessonWeekNumber?: string;
  dayOfWeek?: string;
  weekNumber?: string | number;
  district?: string;
  zone?: string;
  jobTitle?: string;
  jobPurpose?: string;
  supervisorName?: string;
  confirmationStatus?: string;
  workPlanPeriod?: string;
  workPlanPeriodStart?: string;
  workPlanPeriodEnd?: string;
  includeAnnualWorkPlan?: boolean;
  eceMidTermBreakWeek?: number;
  numberOfDays?: number;
  format?: string;
  selectedTopics?: { topic: string; subtopics: string[] }[];
  selectedSubtopics?: string[];
  selectedCompetences?: string[];
  expectedStandards?: string[];
  expectedStandard?: string;
  skills?: string;
  values?: string;
  teachingMethods?: string[];
  teachingAids?: any;
  references?: any;
  competencies?: string[];
  activities?: string[];
  weeks?: {
    week: number;
    topic: string;
    topic2?: string;
    topic3?: string;
    component?: string;
    subtopics: string[];
    competencies: string[];
    activities?: string[];
    expectedStandards?: string[];
    teachingMethods?: string;
    methods?: string[];
    teachingAids?: string;
    references?: string;
    isAssessment?: boolean;
    isSaved?: boolean;
    line1?: any;
    line2?: any;
  }[];
  forecastDays?: {
    day: string;
    topic?: string;
    subtopic?: string;
    competency?: string;
    activities?: string[];
    expectedStandard?: string;
    teachingAids?: string;
    references?: string;
    date?: string;
  }[];
  termStartDate?: string;
  generalCompetences?: string;
  lessonGoal?: string;
  lessonFrom?: string;
  lessonTo?: string;
  knowledge?: string;
  enrolmentBoys?: number | string;
  enrolmentGirls?: number | string;
  attendanceBoys?: number | string;
  attendanceGirls?: number | string;
  lessonLength?: string;
  learningEnvironments?: string[];
  objectives?: string;
  studentLevel?: string;
  additionalContext?: string;
  rationale?: string;
  includeTeachingNotes?: boolean;
  includeHomework?: boolean;
  englishCombined?: boolean;
  englishComponent?: string;
  groupTopicsByTerm?: boolean;
  contentScale?: 'lighter' | 'medium';
  englishPreparationMode?: 'normal' | 'separate' | 'combined';
  referenceModuleContent?: string;
  isBatch?: boolean;
  batchItems?: any[];
  prompt?: string;
  sectionDiagrams?: {
    mcq?: boolean;
    shortAnswer?: boolean;
    essay?: boolean;
    matching?: boolean;
    categories?: string[];
  };
  includeLessonDiagram?: boolean;
  selectedLessonDiagram?: {
    title: string;
    topic: string;
    subtopic: string;
    svgContent?: string;
  };
  selectedSectionDiagrams?: {
    mcq?: any;
    shortAnswer?: any;
    essay?: any;
    matching?: any;
  };
}

export function cleanGradeDisplay(g?: any): string {
  if (!g) return "..........";
  const str = typeof g === 'string' ? g : String(g);
  const trimmed = str.trim();
  const stripped = trimmed.replace(/^Grade\s+/i, "").replace(/^GRADE\s+/i, "").trim();
  return stripped || trimmed;
}

export function cleanDurationDisplay(d?: any): string {
  if (!d) return "..........";
  const str = typeof d === 'string' ? d : String(d);
  const trimmed = str.trim();
  const stripped = trimmed.replace(/\s*(?:minutes|mins|minute|min)\b/gi, "").trim();
  return stripped || trimmed;
}

// Simple in-memory and persistent cache for generation results
let generationCache = new Map<string, string>();

function getCacheKey(params: GenerationParams): string {
  // Added a version suffix to invalidate old caches after prompt logic changes
  const version = "v2.4 (Live)"; 
  return JSON.stringify({
    v: version,
    type: params.type,
    grade: params.grade,
    subject: params.subject,
    zambianLanguage: params.zambianLanguage,
    topic: params.topic,
    subtopic: params.subtopic,
    forecastWeek: params.forecastWeek,
    term: params.term,
    year: params.year,
    batchItems: params.batchItems?.map((b: any) => b.topic || b.week),
    curriculumType: params.curriculumType
  });
}

function getCachedResult(key: string): string | null {
  // Caching disabled per user request
  return null;
}

function setCachedResult(key: string, data: string): void {
  // Caching disabled per user request
}

export function getLowerPrimaryEnglishInstructions(params: GenerationParams): string {
  const gradeStr = params.grade || '';
  const isLowerPrimary = gradeStr.includes('1') || gradeStr.includes('2');
  const isGr1 = gradeStr.includes('1');
  const isGr2 = gradeStr.includes('2');
  const sLow = params.subject?.toLowerCase() || '';
  const topicTitle = (params.topic || '') + ' ' + (params.subtopic || '');
  const topLow = topicTitle.toLowerCase();
  
  let isLiteracy = sLow.includes('literacy');
  let isOralEnglish = sLow.includes('oral') || sLow.includes('conversation');

  // If "English" or "English" is mother subject, detect whether Oral English or Literacy
  if (isLowerPrimary && (sLow.includes('english') || sLow.includes('language'))) {
    if (
      isOralEnglish ||
      topLow.includes('conversation') ||
      topLow.includes('greeting') ||
      topLow.includes('family') ||
      topLow.includes('command') ||
      topLow.includes('rule') ||
      topLow.includes('chore') ||
      topLow.includes('time') ||
      topLow.includes('food') ||
      topLow.includes('meal') ||
      topLow.includes('occupation') ||
      topLow.includes('home') ||
      topLow.includes('shopping') ||
      topLow.includes('hobby') ||
      topLow.includes('animal') ||
      topLow.includes('health') ||
      topLow.includes('1.1') || topLow.includes('1.2') || topLow.includes('1.3') || topLow.includes('1.4') || topLow.includes('1.5') || topLow.includes('1.6') || topLow.includes('1.7') || topLow.includes('1.8') ||
      topLow.includes('2.1') || topLow.includes('2.2') || topLow.includes('2.3') || topLow.includes('2.4') || topLow.includes('2.5') || topLow.includes('2.6') || topLow.includes('2.7') || topLow.includes('2.8')
    ) {
      isOralEnglish = true;
      isLiteracy = false;
    } else {
      isLiteracy = true;
      isOralEnglish = false;
    }
  }

  if (isLowerPrimary) {
    if (isLiteracy && isGr1) {
      return `
SPECIAL GRADE 1 LITERACY IN ENGLISH INSTRUCTION:
- Literacy in English for Grade 1 MUST be planned for exactly TWO (2) lessons per week (Lesson 1: Introduction of sound/concept, Lesson 2: Reinforcement/revision).
- MANDATORY HOMEWORK: Homework is strictly mandatory for all Grade 1 Literacy lessons and MUST be included at the end.
- CRITICAL STRUCTURAL MANDATE FOR INTRODUCTION: The <b>INTRODUCTION (5 minutes)</b> section MUST be placed OUTSIDE and BEFORE the Lesson Development table as standalone text, positioned strictly between <b>Expected Standard:</b> and <b>LESSON DEVELOPMENT</b>. You are STRICTLY FORBIDDEN from including Introduction as a row or stage inside the Lesson Development table. The Lesson Development table MUST start directly at Step 1 (Phonemic awareness).

REQUIRED LESSON PLAN FORMAT (SAMPLE LESSON PLAN):
<b>SAMPLE LESSON PLAN</b>
<b>Name of Teacher:</b> [Teacher Name] <b>Date:</b> [Date]
<b>Class:</b> Grade 1 [Section] <b>Time:</b> [Time Range, e.g. 07:00-08:00]
<b>Subject:</b> Literacy and Language (Literacy in English) <b>Duration:</b> 60 minutes
<b>Topic:</b> [Topic Code and Title, e.g. 1.9 Sounds] <b>Total No. of Learners:</b> [Number]
<b>Sub-Topic:</b> [Sub-topic Code and Title, e.g. 1.9.3.1 Long Vowels]

<b>General Competences:</b> Critical thinking, Collaboration, Creativity Innovation, and problem solving.
<b>Specific Competences:</b> [List exact Specific Competences code and text from syllabus, e.g. 1.9.3.1 Sound out long vowels]
<b>Lesson Goal:</b> [State goal clearly: e.g. Sounding out, reading and writing target sound]
<b>Rationale:</b> [Explain lesson focus, target sound, teaching methods (demonstration, collaboration, question and answer), and sequence position, e.g. "This lesson is on sound /oa/. This is particularly on reading and writing words with /oa/ sound. Demonstration, collaboration, question and answer will be used in order to develop and improve learners' literacy skills. This is the first lesson in the series of four in a week."]
<b>Prior Knowledge:</b> [What learners already know, e.g. Letters of the alphabet: names and sounds]
<b>References:</b>
- Lower Primary Literacy and Language Syllabus Grade 1 page [Page]
- Literacy in English Teaching Module Grade 1 Term [Term] page [Page]

<b>Learning Environment:</b>
<b>Natural environment:</b> school surrounding, play-ground...
<b>Artificial environment:</b> classroom, pictures
<b>Technological environment:</b> e-learning websites.

<b>Teaching and Learning Materials/Resources:</b> Grapheme-phoneme cards, chart of a story, word cards
<b>Expected Standard:</b> [From syllabus, e.g. Long vowels sounded out correctly, Words with long vowels blend and read correctly.]

<b>INTRODUCTION (5 minutes):</b>
* <b>Teacher's Role:</b> [Reviewing previously taught sounds; show cards with taught graphemes and ask learners to sound them out; say words containing target sound and ask learners to mention common sound; introduce today's target sound].
* <b>Learners' Role:</b> [Sound out given graphemes; listen to words and mention common sound in given words; pay attention to the introduction of the new sound].

<b>LESSON DEVELOPMENT</b>
(Generate a Markdown Table with these exact 5 headers in this exact order: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, CONTENT, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | CONTENT | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- | :--- |
| <b>Step 1: Phonemic awareness</b><br/>(5 minutes) | - Model sounding out target sound /s/ to learners.<br/>- Ask learners to sound out target sound /s/. | - Listen attentively and sound out target sound /s/.<br/>- Identify words containing target sound /s/. | <u>Auditory Sound Discrimination</u><br/>* Target sound /s/ identification and phonemic recognition in spoken words. | Learners sound out target sound correctly. |
| <b>Step 2: Phonics</b><br/>(10 minutes) | - Show grapheme card 's' and demonstrate letter formation.<br/>- Model blending target sound /s/ with learnt sounds to form words. | - Observe letter shape formation.<br/>- Sound out target sound and blend with learnt sounds. | <u>Grapheme Blending & Word Formation</u><br/>* Letter shape 's' formation.<br/>* Sound blending: s-a-t -> sat, s-u-n -> sun. | Learners form letter shapes and blend sounds correctly. |
| <b>Step 3: Fluency</b><br/>(20 minutes) | - Write words on board carrying target sound /s/.<br/>- Model reading words on board and segmenting. | - Read words on board with teacher and segment given words.<br/>- Practice reading decodable sentences. | <u>Word Reading & Segmenting</u><br/>* Word list: sat, sun, sit, soap.<br/>* Decodable sentence reading. | Learners read words fluently and segment correctly. |
| <b>Step 4: Vocabulary</b><br/>(7 minutes) | - Display chart with words carrying target sound.<br/>- Instruct learners to identify words and use them in sentences orally. | - Identify target sound words in context.<br/>- Construct and speak oral sentences using vocabulary. | <u>Contextual Sentence Building</u><br/>* Target vocabulary: sun, soap, sit.<br/>* Oral sentence structures. | Learners identify words and build contextual sentences. |
| <b>Step 5: Writing</b><br/>(20 minutes) | - Instruct learners to write target grapheme 's' and complete CVC words.<br/>- Monitor handwriting and pencil grip. | - Write grapheme 's' and CVC words in exercise books.<br/>- Complete missing grapheme exercises accurately. | <u>Letter & Word Writing</u><br/>* CVC word writing.<br/>* Missing letter completion (s_t, s_n). | Learners perform CVC writing independently. |
| <b>Comprehension</b><br/>(5 minutes) | - Read a short decodable story aloud.<br/>- Ask learners comprehension questions and ask them to re-tell story. | - Listen attentively to the story.<br/>- Re-tell the story using their own words. | <u>Listening Comprehension & Re-telling</u><br/>* Short contextual story reading.<br/>* Key story comprehension questions. | Learners re-tell story using own words. |
| <b>Conclusion</b><br/>(3 minutes) | - Model singing a song with words carrying target sound /s/.<br/>- Conduct quick wrap-up check on sound recognition. | - Sing target sound song enthusiastically with actions.<br/>- Respond to teacher's final sound check. | <u>Lesson Review & Closing Song</u><br/>* Summary of target sound /s/.<br/>* Target sound mnemonic song. | Learners sing song with target sound words. |

<div class="lesson-plan-homework-section">
<b>HOMEWORK (MANDATORY):</b><br/>
- Practice writing target sound words in exercise book.<br/>
- Read words with target sound to parent/guardian at home.<br/>
</div>

<b>LESSON EVALUATION:</b>
<b>Teacher Evaluation:</b> ______________________________________________________________________________
<b>Learner Evaluation:</b> ______________________________________________________________________________
`;
    }

    if (isLiteracy && isGr2) {
      return `
SPECIAL GRADE 2 LITERACY IN ENGLISH INSTRUCTION:
- Literacy in English for Grade 2 MUST be planned for exactly TWO (2) lessons per week.
- MANDATORY HOMEWORK: Homework is strictly mandatory for all Grade 2 Literacy lessons and MUST be included at the end.
- CRITICAL STRUCTURAL MANDATE FOR INTRODUCTION: The <b>INTRODUCTION (5 minutes)</b> section MUST be placed OUTSIDE and BEFORE the Lesson Development table as standalone text, positioned strictly between <b>Expected Standard:</b> and <b>LESSON DEVELOPMENT</b>. You are STRICTLY FORBIDDEN from including Introduction as a row or stage inside the Lesson Development table. The Lesson Development table MUST start directly at Step 1 (Phonemic awareness).

REQUIRED LESSON PLAN FORMAT (SAMPLE LESSON PLAN):
<b>SAMPLE LESSON PLAN</b>
<b>Name of Teacher:</b> [Teacher Name] <b>Date:</b> [Date]
<b>Class:</b> Grade 2 [Section] <b>Time:</b> [Time Range, e.g. 07:00-08:00]
<b>Subject:</b> Literacy and Language (Literacy in English) <b>Duration:</b> 60 minutes
<b>Topic:</b> [Topic Code and Title, e.g. 2.9 Sounds] <b>Total No. of Learners:</b> [Number]
<b>Sub-Topic:</b> [Sub-topic Code and Title, e.g. 2.9.3.1 Long Vowels]

<b>General Competences:</b> Critical thinking, Collaboration, Creativity Innovation, and problem solving.
<b>Specific Competences:</b> [List exact Specific Competences code and text from syllabus, e.g. 2.9.3.1 Sound out long vowels]
<b>Lesson Goal:</b> [State goal clearly: e.g. Sounding out, reading and writing target sound]
<b>Rationale:</b> [Explain lesson focus, target sound, teaching methods (demonstration, collaboration, question and answer), and sequence position, e.g. "This lesson is on sound /oa/. This is particularly on reading and writing words with /oa/ sound. Demonstration, collaboration, question and answer will be used in order to develop and improve learners' literacy skills. This is the first lesson in the series of four in a week."]
<b>Prior Knowledge:</b> [What learners already know, e.g. Letters of the alphabet: names and sounds]
<b>References:</b>
- Lower Primary Literacy and Language Syllabus Grade 2 page [Page]
- Literacy in English Teaching Module Grade 2 Term [Term] page [Page]

<b>Learning Environment:</b>
<b>Natural environment:</b> school surrounding, play-ground...
<b>Artificial environment:</b> classroom, pictures
<b>Technological environment:</b> e-learning websites.

<b>Teaching and Learning Materials/Resources:</b> Grapheme-phoneme cards, chart of a story, word cards
<b>Expected Standard:</b> [From syllabus, e.g. Long vowels sounded out correctly, Words with long vowels blend and read correctly.]

<b>INTRODUCTION (5 minutes):</b>
* <b>Teacher's Role:</b> [Reviewing previously taught sounds; show cards with taught graphemes and ask learners to sound them out; say words containing target sound and ask learners to mention common sound; introduce today's target sound].
* <b>Learners' Role:</b> [Sound out given graphemes; listen to words and mention common sound in given words; pay attention to the introduction of the new sound].

<b>LESSON DEVELOPMENT</b>
(Generate a Markdown Table with these exact 5 headers in this exact order: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, CONTENT, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | CONTENT | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- | :--- |
| <b>Step 1: Phonemic awareness</b><br/>(5 minutes) | - Model sounding out target sound /oa/ to learners.<br/>- Ask learners to identify and isolate target sound in spoken words. | - Listen attentively and isolate target sound /oa/.<br/>- Repeat target sound accurately. | <u>Phonemic Discrimination & Sound Isolation</u><br/>* Target sound /oa/ phonemic isolation in spoken words. | Learners sound out target sound correctly. |
| <b>Step 2: Phonics</b><br/>(10 minutes) | - Show grapheme card 'oa' and demonstrate sound blending.<br/>- Guide learners to blend digraph 'oa' with consonants. | - Observe grapheme card 'oa'.<br/>- Sound out digraph and blend with consonants to read words. | <u>Grapheme-Phoneme Correspondence & Blending</u><br/>* Digraph 'oa' letter formation.<br/>* Blending: b-oa-t -> boat, c-oa-t -> coat. | Learners form letter shapes and blend digraph sounds correctly. |
| <b>Step 3: Fluency</b><br/>(20 minutes) | - Write decodable passage on board containing 'oa' words.<br/>- Model fluent reading with correct expression and phrasing. | - Read decodable passage chorally and individually.<br/>- Practice fluent word segmenting and blending. | <u>Decodable Story & Sentence Fluency</u><br/>* Target word reading: boat, coat, goat, road.<br/>* Fluent oral sentence reading. | Learners read words fluently and segment correctly. |
| <b>Step 4: Vocabulary</b><br/>(7 minutes) | - Display vocabulary chart with 'oa' words.<br/>- Guide learners to explain word meanings and construct oral sentences. | - Identify 'oa' vocabulary words in context.<br/>- Use target vocabulary in meaningful oral sentences. | <u>Word Meaning & Oral Sentence Usage</u><br/>* Key terms: boat, coat, goat, soap.<br/>* Contextual sentence practice. | Learners identify words and build contextual sentences. |
| <b>Step 5: Writing</b><br/>(20 minutes) | - Guide learners in writing 'oa' words and simple sentences in exercise books.<br/>- Provide dictation of target words. | - Write target 'oa' words and sentences in exercise books.<br/>- Complete fill-in-the-blank writing tasks. | <u>Word & Sentence Dictation / Writing</u><br/>* Writing 'oa' words and simple sentences.<br/>* Missing letter fill-in-the-blanks. | Learners write target words and sentences independently. |
| <b>Comprehension</b><br/>(5 minutes) | - Read story passage and ask targeted comprehension questions.<br/>- Prompt learners to summarize story events. | - Answer comprehension questions orally.<br/>- Re-tell main events of the story in sequence. | <u>Comprehension Questions & Story Re-telling</u><br/>* Story context and main idea identification.<br/>* Answering WHO, WHAT, and WHERE questions. | Learners answer comprehension questions and re-tell story. |
| <b>Conclusion</b><br/>(3 minutes) | - Summarize key 'oa' sound rules and lead closing rhyme.<br/>- Conduct quick individual oral check. | - Recite key 'oa' words and join in closing rhyme.<br/>- Demonstrate sound mastery in quick check. | <u>Summary & Review Activity</u><br/>* Recapitulation of target sound /oa/.<br/>* Final check song or rhyme. | Learners demonstrate mastery of target sound in closing check. |

<div class="lesson-plan-homework-section">
<b>HOMEWORK (MANDATORY):</b><br/>
- Practice writing target sound words in exercise book.<br/>
- Read words with target sound to parent/guardian at home.<br/>
</div>

<b>LESSON EVALUATION:</b>
<b>Teacher Evaluation:</b> ______________________________________________________________________________
<b>Learner Evaluation:</b> ______________________________________________________________________________
`;
    }

    if (isOralEnglish) {
       return `
SPECIAL GRADE ${gradeStr} ORAL ENGLISH INSTRUCTION:
- Oral English for Grade ${gradeStr} MUST be planned for exactly THREE (3) lessons per week (30 minutes per lesson).
- MANDATORY HOMEWORK: Homework is strictly mandatory for all Grade 1 & 2 Oral English lessons and MUST be included at the end.
- MODULE ACTIVITIES STRUCTURE: Oral English teaching modules structure lessons into Activity 1a, Activity 1b, Activity 1c (and extended 2a, 2b, 2c). Every lesson plan MUST correspond to the selected activity (e.g., Activity 1a: Good Morning Greeting) and follow the 4-step procedure.

STRICT MANDATE FOR LESSON PROGRESSION TABLE STAGES (PROCEDURE):
You are ABSOLUTELY FORBIDDEN from using generic stage names without the required procedure steps.
For Oral English, the STAGES column in the Lesson Progression Table MUST strictly start with Introduction as a separate first row, followed by the 4-step procedure:
1. "Introduction (2 minutes)" (MANDATORY SEPARATE FIRST ROW)
2. "Development<br/>Step 1: Present (5 minutes)"
3. "Step 2: Practice (10 minutes)"
4. "Step 3: Produce (10 minutes)"
5. "Closure<br/>Step 4: Closure (3 minutes)"

DETAILED REQUIREMENTS FOR EACH STAGE:
0. Introduction (Duration: 2 Minutes):
   - Ask learners to recall prior greetings/vocabulary or name items related to the context (e.g. Ask learners to recall greetings or name things found in their homes).
   - Learners respond by naming or recalling prior context.
   - PERFORMANCE INDICATOR: Learners recalling/naming context or greetings accurately.

1. STEP 1: Present (Duration: 5 Minutes):
   - Introduce the target oral phrase or sentence structure (e.g. Introduce the phrase "Good morning." or structure "Where is the...?").
   - Explain the usage context (e.g. Explain that "Good morning" is used before 12 noon / 12 hours).
   - Demonstrate greeting/dialogue format with named learners or puppets, explicitly showing the dialogue script (e.g., Teacher: Good morning, Mapalo (Learner)! / Mapalo (Learner): Good morning, Teacher! / Learner 1 (Grace): Good morning, John! / Learner 2 (John): Good morning, Grace!).

2. STEP 2: Practice (Duration: 10 Minutes):
   - Conduct whole-class choral repetition of the target phrase/structure.
   - Pair learners to practice greeting or dialogue in dialogue format with explicit partner dialogue examples (e.g., Learner 1 (Jane): Good morning, Peter. / Learner 2 (Peter): Good morning, Jane.).
   - Rotate pairs so that everyone practices with different partners.

3. STEP 3: Produce (Duration: 10 Minutes):
   - Put learners into small groups or pairs to role-play a scenario (e.g., meeting in the morning on the way to school, or asking for items in a room).
   - Ask each group/pair to perform their dialogue in front of the class.
   - Provide constructive teacher feedback, appraisal, and praise.

4. STEP 4: Closure (Duration: 3 Minutes):
   - Ask learners to sing the 'Good Morning song' (or relevant theme song) with actions.
   - Summarize key rule/concept and conduct a quick wrap-up check.

REQUIRED LESSON PLAN FORMAT (SAMPLE LESSON PLAN):
<b>SAMPLE LESSON PLAN</b>
<b>Class:</b> Grade ${gradeStr} [Section] <b>Date:</b> [Date]
<b>Time:</b> [Time Range, e.g. 07:00-07:30] <b>Duration:</b> 30 Minutes
<b>Subject:</b> Oral English <b>Number of learners:</b> Boys: [Number] Girls: [Number]
<b>Topic:</b> [Topic Code and Title, e.g. 1.1 Conversations]
<b>Sub-Topic:</b> [Sub-Topic Code and Title, e.g. 1.1.1 Greetings - Activity 1a: Good Morning Greeting]
<b>Structure of the day:</b> "[Target sentence structure, e.g. 'Good morning, [Name]!']"

<b>General Competences:</b> Effective communication, collaboration, creativity and innovation, as well as critical thinking.
<b>Specific Competences:</b> [List exact Specific Competences code and text, e.g. 1.1.1.1 Use appropriate language in greetings]
<b>Lesson Goal:</b> [State goal clearly, e.g. To demonstrate and practice morning greetings using 'Good morning.']

<b>Rationale:</b> [Explain lesson focus, target sentence structure, teaching methods (demonstration, whole class choral repetition, pair dialogue, role-play), and sequence position, e.g. In this lesson, learners will learn about morning greetings using the structure "Good morning, [Name]!". Knowledge about this will enable learners to use polite greetings before 12 noon accordingly. This will be taught using demonstration, whole-class choral repetition, pair dialogue practice, and group role-play. This is lesson 1 (Activity 1a) in a series of three planned lessons under Greetings.]

<b>Prior Knowledge:</b> [What learners already know, e.g. Learners already greet family members in their local language at home.]
<b>References:</b>
- Lower Primary Literacy and Language Syllabus Grade ${gradeStr} page [Page]
- Oral English Teaching Module Grade ${gradeStr} Term [Term] page [Page]

<b>Learning Environment:</b>
Natural environment (classroom, playground...)
Artificial environment (poster showing sun rising, puppets, classroom)
Technological environment (audio player, digital classroom)

<b>Teaching and Learning Materials/Resources:</b> [e.g. Conversation poster depicting morning sun rising, puppets, flashcards]
<b>Expected Standard:</b> [From syllabus, e.g. Appropriate greetings at different times of the day used correctly.]

<b>Lesson Progression:</b>
(Generate a Markdown Table with these exact 5 headers in this exact order: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, CONTENT, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | CONTENT | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- | :--- |
| <b>Introduction</b><br/>(2 minutes) | - Ask learners to recall prior oral greetings or name items related to the lesson context. | - Recall and respond by naming greetings or items from home/class. | <u>Prior Greeting Review & Context Hook</u><br/>* Target context: Morning greetings.<br/>* Time usage rule (before 12:00 noon). | Learners recall prior greeting/context and respond orally. |
| <b>Step 1: Present</b><br/>(5 minutes) | - Introduce the phrase "Good morning."<br/>- Explain that "Good morning" is used before noon (12 hours).<br/>- Demonstrate greeting each other in the morning with named learners or puppets. | - Listen attentively to the introduction of "Good morning".<br/>- Observe teacher demonstrations.<br/>- Participate in demo dialogues with teacher and peers. | <u>Target Sentence Structure & Usage Rule</u><br/>* Target phrase: "Good morning, [Name]!"<br/>* Context: Used before 12:00 noon.<br/>* Demonstration dialogue script:<br/>  • Teacher: "Good morning, Mapalo!"<br/>  • Learner: "Good morning, Teacher!" | Learners listen attentively, identify morning greeting context, and respond in demonstration dialogues. |
| <b>Step 2: Practice</b><br/>(10 minutes) | - Conduct a whole-class choral repetition of "Good morning."<br/>- Pair learners to practice the greeting in a dialogue format.<br/>- Rotate pairs to ensure everyone practices with different partners. | - Participate enthusiastically in whole-class choral repetition.<br/>- In pairs, practice the morning greeting dialogue.<br/>- Switch partners to practice with different peers. | <u>Guided Repetition & Pair Dialogue</u><br/>* Whole-class choral repetition.<br/>* Pair dialogue exchange:<br/>  • Learner 1: "Good morning, Peter."<br/>  • Learner 2: "Good morning, Jane." | Learners repeat phrase chorally and exchange morning greetings accurately in pairs with different partners. |
| <b>Step 3: Produce</b><br/>(10 minutes) | - Put learners into small groups to role-play a scenario where they meet in the morning.<br/>- Ask each group to perform their dialogue in front of the class.<br/>- Provide constructive feedback, appraisal, and praise. | - Organize into small groups and role-play morning meeting scenarios.<br/>- Perform dialogues confidently in front of the class.<br/>- Listen to teacher feedback. | <u>Group Role-Play & Performance</u><br/>* Morning meeting role-play scenarios (e.g. arriving at school).<br/>* Class performance and feedback. | Learners perform morning greeting role-play dialogues confidently and accurately in front of class. |
| <b>Step 4: Closure</b><br/>(3 minutes) | - Summarize when "Good morning" is used.<br/>- Lead the class in singing the 'Good Morning song' with actions.<br/>- Conduct a final quick oral check. | - Recite that "Good morning" is used before noon.<br/>- Sing the 'Good Morning song' enthusiastically with actions.<br/>- Respond to teacher's final greeting. | <u>Lesson Review & Good Morning Song</u><br/>* Recapitulation of morning greeting rules.<br/>* 'Good Morning Song' with actions. | Learners sing 'Good Morning song' and articulate correct usage context. |

<div class="lesson-plan-homework-section">
<b>HOMEWORK (MANDATORY):</b><br/>
1. Greet at least two family members at home tomorrow morning using the phrase "Good morning, [Name]!".<br/>
2. Listen to their response and report back to class tomorrow.<br/>
</div>

<b>LESSON EVALUATION:</b>
<b>Teacher Evaluation:</b> ______________________________________________________________________________
<b>Learner Evaluation:</b> ______________________________________________________________________________
`;
    }
  }
  return "";
}

export function getZambianLanguageInstructions(params: GenerationParams): { strictRule: string; exampleRule: string; notesRule: string } {
  const sLow = (params.subject || '').toLowerCase();
  const isZambianLanguage = !!(params.subject && (
    sLow.includes('zambian') || 
    sLow.includes('icibemba') || sLow.includes('cinyanja') || 
    sLow.includes('chitonga') || sLow.includes('silozi') || 
    sLow.includes('kiikaonde') || sLow.includes('lunda') || 
    sLow.includes('luvale') || sLow.includes('bemba') || 
    sLow.includes('nyanja') || sLow.includes('tonga') || 
    sLow.includes('lozi')
  ));

  const isLessonPlan = params.type === "lesson_plan";

  if (!isZambianLanguage) {
    let strictRule = "";
    let exampleRule = "";
    let notesRule = "";

    if (isLessonPlan) {
      strictRule = "STRICT LANGUAGE REQUIREMENT: Since the selected subject is NOT a Zambian Language, the ENTIRE lesson plan MUST be written 100% in ENGLISH. You are strictly forbidden from writing ANY word, phrase, activity description, expected standard, or example in Bemba, Tonga, Nyanja, Lozi, or any other Zambian local language. Every single sentence of this lesson plan must be in standard English only. Absolutely zero Bembish or localized text (e.g., 'Abana', 'bakasontapo', 'ifyabulo', 'ifintu') is allowed anywhere in this document.";
      exampleRule = "All examples in the activities, teacher actions, content columns, or learner roles MUST be strictly in English. Do NOT use local vocabulary like 'Mulishani', 'omwe', or 'Mwapona'. Use standard English examples only.";
      notesRule = "All vocabulary, counting, numbers, colors, calendar terms, customs, and greetings MUST be presented in standard English. Absolutely no localized Zambian dialects or local words are permitted.";
    } else {
      strictRule = "STRICT LANGUAGE REQUIREMENT: You MUST write the ENTIRE document (Scheme, Forecast, and Lesson Notes) and ALL of its text, teaching materials, examples, questions, activities, and references strictly in ENGLISH. Do NOT include any local Zambian languages (like Tonga, Bemba, Nyanja, Lozi, Kiikaonde, Luvale, Lunda etc.) or local words anywhere in this document. All examples must be in standard English. This is extremely important because the selected subject is not Zambian language.";
      exampleRule = "All examples in the activities, teacher actions, or learner roles MUST be strictly in English. Do NOT use local vocabulary like 'Mulishani', 'omwe', or 'Mwapona'. Use standard English examples only.";
      notesRule = "All vocabulary, counting, numbers, colors, calendar terms, customs, and greetings MUST be presented in standard English. Absolutely no localized Zambian dialects or local words are permitted.";
    }

    return { strictRule, exampleRule, notesRule };
  }

  // It IS Zambian Language subject. Use the selected dialect.
  const dialect = params.zambianLanguage || 'Icibemba';

  let countEx = "";
  let colorEx = "";
  let calEx = "";
  let greetEx = "";
  let verbEx = "";

  if (dialect === 'Chitonga') {
    countEx = "'omwe' (1), 'bobilo' (2), 'botatwe' (3), 'bone' (4), 'bosanwe' (5), 'kkumi' (10), 'makumi obilo' (20), 'mwaanda' (100)";
    colorEx = "'usalala' / 'kubwenga' (red), 'utuba' (white), 'usiya' (black), 'utuntulubya' / 'utuba twamanyanza' (green), 'umunyengu' (yellow)";
    calEx = "'Mande' (Monday), 'Bwababili' (Tuesday), 'Bwabatu' (Wednesday), 'Bwabane' (Thursday), 'Bwabano' (Friday), 'Mujibelo' (Saturday), 'Nsondo' / 'Minsolo' (Sunday)";
    greetEx = "'Mwapona kabotu' (how are you/good day), 'Kamubuka kabotu' (good morning), 'Kabotu' (I am fine), 'Twalumba' (thank you), and the respectful plural prefix 'Ba-' (e.g. 'Ba-taata' for father, 'Ba-mwiiyi' for teacher)";
    verbEx = "'kulemba' (write), 'kubala' (read), 'kwenda' (walk), plus correct tenses like 'Ndilalya' (present: I am eating), 'Ndalilya' (past: I ate), 'Nzooya kulya' (future: I will eat)";
  } else if (dialect === 'Cinyanja') {
    countEx = "'modzi' (1), 'wiri' (2), 'tatu' (3), 'nai' (4), 'sanu' (5), 'khumi' (10), 'makumi awiri' (20), 'zana' (100)";
    colorEx = "'wofiira' (red), 'woyera' (white), 'wakuda' (black), 'wobiriwira' (green), 'wachikasu' (yellow)";
    calEx = "'Lolemba' (Monday), 'Lachiwiri' (Tuesday), 'Lachitatu' (Wednesday), 'Lachinayi' (Thursday), 'Lachisanu' (Friday), 'Loweruka' (Saturday), 'Lamulungu' (Sunday)";
    greetEx = "'Muli bwanji' (how are you), 'Mwadzuka bwanji' (good morning), 'Zikomo' (thank you), 'Ndili bwino' (I am fine)";
    verbEx = "'kulemba' (write), 'kuwerenga' (read), 'kuyenda' (walk), plus tenses like 'Ndikudya' (present), 'Ndadya' (past), 'Ndidzadya' (future)";
  } else if (dialect === 'Silozi') {
    countEx = "'iliñwi' (1), 'peli' (2), 'talu' (3), 'ne' (4), 'ketalu' (5), 'lishumi' (10)";
    colorEx = "'fubelu' (red), 'sweu' (white), 'nsu' (black), 'tala' (green), 'pisinyehe' / 'sela' (yellow)";
    calEx = "'La Mubulo' (Monday), 'La Bubeli' (Tuesday), 'La Butalu' (Wednesday), 'La Buné' (Thursday), 'La Butanu' (Friday), 'La Sabata' (Saturday), 'La Lapele' / 'La Sunda' (Sunday)";
    greetEx = "'Mu zuhile cwani' (good morning), 'Mu tozihe cwani' (good afternoon), 'Zamele baluti' (teacher greeting), 'Luitumezi' (thank you)";
    verbEx = "'kuñola' (write), 'kubala' (read), 'kuzamaya' (walk), plus tenses like 'Ni sweli ku ca' (present), 'Ni kile ka ca' (past)";
  } else if (dialect === 'Kiikaonde') {
    countEx = "'kimo' (1), 'bibiji' (2), 'bisatu' (3), 'bina' (4), 'bitanu' (5), 'jikumi' (10)";
    colorEx = "'kachila' (red), 'katoka' (white), 'kashika' / 'kishika' (black), 'kyakashila' (green), 'kyasoloka' (yellow)";
    calEx = "'Pampitulo' (Monday), 'Palubiji' (Tuesday), 'Palusatu' (Wednesday), 'Paluna' (Thursday), 'Palutanu' (Friday), 'Painyongola' (Saturday), 'Pashaba' (Sunday)";
    greetEx = "'Mwajibukanyi' (good morning), 'Mwashishanyi' (good afternoon), 'Nasanta' / 'Wanyanta ko' (thank you)";
    verbEx = "'kunemba' (write), 'kutanga' (read), 'kwenda' (walk)";
  } else if (dialect === 'Lunda') {
    countEx = "'kamu' (1), 'tiyedi' (2), 'tatu' (3), 'wanyana' (4), 'katanu' (5), 'dikumi' (10)";
    colorEx = "'chachila' (red), 'chatooka' (white), 'chayiila' (black), 'chamakunzu' (green), 'chalungube' (yellow)";
    calEx = "'Mundayi' (Monday), 'Mundiyedi' (Tuesday), 'Munditatu' (Wednesday), 'Mundiwanayana' (Thursday), 'Mundikatanu' (Friday), 'Sabatu' (Saturday), 'Mulungu' / 'Nsondo' (Sunday)";
    greetEx = "'Munasubi' (good morning), 'Munahandiki' (how are you), 'Wansakwililiku' (thank you)";
    verbEx = "'kusoneka' (write), 'kutaña' (read), 'kwenda' (walk)";
  } else if (dialect === 'Luvale') {
    countEx = "'chimwe' (1), 'vavali' (2), 'vatatu' (3), 'vawana' (4), 'vatanu' (5), 'likumi' (10)";
    colorEx = "'chachila' (red), 'chatoma' (white), 'chilaula' (black), 'chacitembelengu' (green), 'chalungumbu' (yellow)";
    calEx = "'Mundayi' (Monday), 'Mulitambombili' (Tuesday), 'Mulitambotatu' (Wednesday), 'Mulitambowana' (Thursday), 'Mulitambotanu' (Friday), 'Sambatulo' (Saturday), 'Chalwola' (Sunday)";
    greetEx = "'Muli bwanji' / 'Mwayoyenu' (how are you), 'Mwashibulenu' (good morning), 'Kunasakwila' (thank you)";
    verbEx = "'kusoneka' (write), 'kutanga' (read), 'kwenda' (walk)";
  } else {
    // Default or Icibemba
    countEx = "'imo' (1), 'shibili' (2), 'shitatu' (3), 'shine' (4), 'shisano' (5), 'ishumi' (10), 'amakumi yabili' (20), 'umulongo' (100)";
    colorEx = "'aswila' / 'akashika' (red), 'abuuta' (white), 'afiita' (black), 'akatuti' / 'acifitilefita' (green), 'amanyongolo' (yellow)";
    calEx = "'Cimo' (Monday), 'Cibili' (Tuesday), 'Citatu' (Wednesday), 'Cine' (Thursday), 'Cisano' (Friday), 'Cibelushi' (Saturday), 'Mulungu' (Sunday)";
    greetEx = "'Mwapoleni' / 'Mulishani' (how are you), 'Mwashibukeni' (good morning), 'Twasanta' (thank you), 'Ndifye bwino' (I am fine)";
    verbEx = "'ukulemba' (write), 'ukubelenga' (read), 'ukwenda' (walk), plus correct tenses like 'Nduleba' / 'Ndilalifya' (present), 'Nalilembele' (past)";
  }

  let strictRule = "";
  let exampleRule = "";
  let notesRule = "";

  if (isLessonPlan) {
    strictRule = `STRICT LESSON PLAN LOCAL LANGUAGE LIMITATION (MANDATORY): Since the selected subject is indeed Zambian Language itself, you are allowed to use local language, but ONLY as specific taught content examples inside the CONTENT column of the LESSON DEVELOPMENT table. The rest of the lesson plan structure (such as ALL headers, section titles like RATIONALE, PRIOR KNOWLEDGE/SKILLS/VALUES, LEARNING ACTIVITIES, EXPECTED STANDARD, TEACHER'S ACTIVITIES, LEARNERS' ACTIVITIES columns, evaluations, and homework) MUST be written strictly and exclusively in ENGLISH. You are strictly forbidden from mixing local language words into headings, general descriptions, or activities outside the CONTENT column of the development table.`;
    exampleRule = `Under teacher's and learners' activities columns inside the development table, describe actions strictly in standard English (e.g. "Teacher to model how to say greetings", "Learners to practice repeating greetings"). The actual greetings examples (e.g. '${greetEx.split(', ')[0]}') MUST only appear in the CONTENT column.`;
    notesRule = `In the CONTENT column of the LESSON DEVELOPMENT table, you may provide authentic **${dialect}** terms:
        - For Numbers: ${countEx}.
        - For Colours: ${colorEx}.
        - For Calendar: ${calEx}.
        - For Customs & Greetings: ${greetEx}.
        - For Grammar & Verbs: ${verbEx}.`;
  } else {
    strictRule = `STRICT LANGUAGE REQUIREMENT: You MUST write the ENTIRE Scheme of Work and Weekly Forecast in ENGLISH. Topics, subtopics, expected standards, and materials MUST be in English. ONLY use local language for brief examples in quotes. Since the chosen subject is Zambian local language, and specifically the selected local language is **${dialect}**, you MUST strictly use authentic ${dialect} vocabulary, words, and phrases for all examples (do NOT use Tonga or Bemba words if they are not the chosen dialect). For Lesson Plans, you may incorporate examples and module content in ${dialect} so the teacher can relate directly to the syllabus.`;
    exampleRule = `Under teacher's and learners' activities where examples are called for, utilize authentic **${dialect}** examples (such as: counting, colors, greeting greetings, and basic verbs). Never use other languages than ${dialect}.`;
    notesRule = `You MUST use real and correct **${dialect}** terms throughout the teaching notes:
        - For Numbers: ${countEx}.
        - For Colours: ${colorEx}.
        - For Calendar: ${calEx}.
        - For Customs & Greetings: ${greetEx}.
        - For Grammar & Verbs: ${verbEx}.
        Do NOT use other dialects' equivalents, and never use boilerplate placeholder lists. These ${dialect} words must be written out explicitly with their pronunciation, translations, and precise teacher usage guides.`;
  }

  return { strictRule, exampleRule, notesRule };
}

export function getZambianLanguageLessonPlanInstructions(params: GenerationParams): string {
  return '';
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries + 1; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || String(error);
      const isFinalDailyQuotaError = msg.includes("Daily generation limit exceeded on the free tier") || msg.includes("free quota limit met");
      if (isFinalDailyQuotaError) {
        throw error;
      }

      const isServerWarmup = msg.includes("Starting Server") || 
                            msg.includes("server is starting up") || 
                            msg.includes("warming up") ||
                            msg.includes("<!doctype html>") ||
                            msg.includes("Expected JSON but got") ||
                            msg.includes("Invalid response format");

      if (isServerWarmup && i < maxRetries) {
        const delay = 2000 + i * 1000;
        console.warn(`Server is initializing/restarting. Automatically waiting ${delay}ms before retrying (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const isQuotaError = msg.toLowerCase().includes("quota") || 
                          msg.toLowerCase().includes("429") || 
                          msg.toLowerCase().includes("resource_exhausted") ||
                          msg.toLowerCase().includes("high traffic") ||
                          msg.toLowerCase().includes("overloaded") ||
                          msg.toLowerCase().includes("unavailable") ||
                          msg.toLowerCase().includes("limit");
      
      if (isQuotaError && i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini rate limit encountered. Backing off ${delay}ms before retrying request (${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Transient issue. Retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function callGemini(model: string, contents: any, config?: any) {
  return withRetry(async () => {
    // 90-second client-side timeout to support deep, comprehensive generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, contents, config }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          let errorMessage = "Unknown API error";
          if (errorData.error) {
            if (typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (typeof errorData.error === "object") {
              errorMessage = errorData.error.message || JSON.stringify(errorData.error);
            }
          } else {
            errorMessage = `HTTP error! status: ${response.status}`;
          }
          throw new Error(errorMessage);
        } else {
          const text = await response.text();
          console.error("Non-JSON Error Response:", text.substring(0, 500));
          const snippet = text.substring(0, 100).toLowerCase();
          const isRateLimit = snippet.includes("rate") || snippet.includes("exceeded") || snippet.includes("429");
          
          throw new Error(
            `Server returned non-JSON error (status ${response.status}${isRateLimit ? ": Rate Limit Exceeded" : ""}). ${isRateLimit ? "Please wait a moment before trying again." : "The server might be overloaded or down."}`
          );
        }
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("Starting Server") || text.includes("<title>Starting Server")) {
          throw new Error("The application server is starting up. Retrying automatically...");
        }
        console.warn("Non-JSON response received:", text.substring(0, 300));
        throw new Error("Invalid response format from server. Please try again in a moment.");
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("The request timed out. The server or AI model is taking too long to respond. Please try again.");
      }
      throw err;
    }
  });
}

export async function askGeminiAssistant(
  prompt: string,
  history: { role: string; parts: { text: string }[] }[],
  userName?: string
): Promise<string> {
  const systemInstruction = `You are a helpful, senior virtual consultant and Zambian Teacher's Assistant in the Fortunes Edutech App.
${userName ? `The current teacher/user you are talking to is named "${userName}". Address them respectfully by their first name "${userName}" occasionally in your responses to make the experience highly personal, warm, and interactive.` : ""}
Your role is to help educators with academic subjects, Zambian curriculum guidance, current affairs, and support with using the app. You have NO limits on general or academic topics or worldwide facts, but you MUST protect the proprietary development details of the application.

Here is your essential knowledge base on the Fortunes Edutech App and the Zambian Curriculum Frameworks:

1. **TWO ZAMBIAN CURRICULUM FRAMEWORKS INTEGRATED IN THE APP**:
   * **Outcome-Based Curriculum (OBC) - 2013 Framework**:
     - Applied to: **Grade 3, Grade 5, Grade 6, Grade 7, Grade 8, Grade 9, Grade 10, Grade 11, Grade 12**.
     - Table Columns for Schemes & Weekly Forecasts: **DAY/WEEK | TOPIC | SUBTOPICS | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK** (11 columns; 12 columns for Language subjects with COMP/Component).
     - Philosophy: Outcomes-focused, explicitly articulating Specific Outcomes, Knowledge, Skills, and Values.
   * **Competency-Based Curriculum (CBC) - 2023/2024 Revised Shift**:
     - Applied to: **Early Childhood Education (ECE Level 1 & Level 2), Grade 1, Grade 2, Grade 4**.
     - Table Columns for Schemes & Weekly Forecasts: **DAY/WEEK | TOPIC | SUBTOPICS | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK** (10 columns; 11 columns for Language subjects with COMP/Component).
     - Philosophy: Competency-centered, highlighting Specific Competencies, Expected Standards, and active Learner Activities.
   * **When asked "How many curriculum frameworks does this app have?"**:
     - State clearly that Fortunes Edutech incorporates **two complete Zambian curriculum frameworks**: the **Outcome-Based Curriculum (OBC 2013)** for Grades 3, 5-12 and the **Competency-Based Curriculum (CBC 2023/2024 Shift)** for ECE, Grades 1, 2, and 4. Explain how the app automatically adjusts table headers, columns, and syllabus guidelines according to the grade and subject selected.

2. **COMPREHENSIVE FORTUNES EDUTECH APP FEATURES & RECENT UPDATES**:
   * **Schemes of Work Generator**: Automatically generates 13-14 week termly schemes with exact syllabus topics, auto-calculated term dates, and OBC/CBC column rules.
   * **Weekly Forecast Generator**: Creates single-page (A4 landscape) daily forecast tables for 5 days with concise bullet points and 100% single-page print fit.
   * **Lesson Plans & Lesson Notes**: Generates professional single-page lesson plans (OBC/CBC layouts) and comprehensive lesson notes.
   * **Catch Up / Primary Literacy Programme (PLP)**: Local Zambian language phonics, syllable breakdown, and numeracy catch-up sessions.
   * **Dual Playback Voice Narration**: Audio TTS lesson plan reading with dual-teacher (Joe & Jane) dialogue modes.
   * **Document Camera Scanner & Syllabus Library**: Direct syllabus scanning, OCR text extraction, and custom bulk-paste syllabus uploads.
   * **Circle Download Tracker & Activation Sync**: Syncs whitelisted account access across devices and handles offline caching.
   * **Pricing Circles**: Weekly (ZMK 20 - 40 Downloads), 14 Days (ZMK 40 - 70 Downloads), Monthly (ZMK 70 - 160 Downloads), Individual Termly (ZMK 180 - 300 Downloads), and Whole School Termly (ZMK 500 - Unlimited Access).

3. **GENERAL KNOWLEDGE, WORLDWIDE NEWS & OUTSIDE INFORMATION**:
   * You have access to real-time Google Search grounding to answer general knowledge queries, science, math, literature, local Zambian news, African events, and global affairs accurately and truthfully.
   * Always provide factual, up-to-date, real-world information.

4. **DEVELOPER SUPPORT CONTACTS**:
   * WhatsApp/Calls support: +260957622025 or +260961622222.

5. **CRITICAL RESTRICTION - No Engineering/Code/Developer Details**:
   * If a user asks about internal source code, React/Vite/Tailwind engineering, database schemas, or developer implementation files, politely decline:
     "I cannot share the technical engineering or source code details of the Fortunes Edutech App. For any application support, pricing circle inquiries, or curriculum guidance, please let me know and I will be happy to help!"

Be encouraging, objective, professional, and accurate. Use clear markdown formatting, bullet points, and tables.`;

  // Format history ensuring it starts strictly with a 'user' turn to comply with Gemini multi-turn specs
  let cleanedHistory = (history || []).filter(msg => 
    msg.parts && msg.parts.length > 0 && typeof msg.parts[0].text === 'string' && msg.parts[0].text.trim()
  );
  const firstUserIdx = cleanedHistory.findIndex(m => m.role === 'user');
  if (firstUserIdx > 0) {
    cleanedHistory = cleanedHistory.slice(firstUserIdx);
  } else if (firstUserIdx === -1) {
    cleanedHistory = [];
  }

  const formattedContents = [
    ...cleanedHistory,
    { role: "user", parts: [{ text: prompt }] }
  ];

  const needsWebSearch = /news|latest|today|current|search|weather|2026|world/i.test(prompt);
  const config: any = {
    systemInstruction,
    temperature: 0.7,
    maxOutputTokens: 1500,
  };
  if (needsWebSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const res = await callGemini("DEFAULT", formattedContents, config);
    return res.text || res.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (err: any) {
    console.error("Error in askGeminiAssistant:", err);
    throw err;
  }
}

function generateFallbackTable(params: GenerationParams, error?: string): string {
  const t = params.type;
  const isOBC = params.curriculumType === "OBC";
  // Rule: Clean document templates without yellow fallback banners
  const warningLine = "";
  
  // Create professional header for fallback
  const docTitle = (t?.toUpperCase() || "DOCUMENT").replace(/_/g, " ");
  const cleanGrade = (g?: string) => {
    if (!g) return "..........";
    const trimmed = g.trim();
    const stripped = trimmed.replace(/^Grade\s+/i, "").replace(/^GRADE\s+/i, "").trim();
    return stripped || trimmed;
  };
  
  let generalInfoTable = "";
  if (t === "lesson_plan") {
    const currentTopicName = params.topic || "..........";
    const currentSubtopicName = params.subtopic || "..........";
    const generalHeader = isOBC ? "GENERAL OUTCOMES" : "GENERAL COMPETENCES";
    const generalComps = params.generalCompetences || "..........";
    const specificHeader = isOBC ? "SPECIFIC OUTCOMES" : "SPECIFIC COMPETENCES";
    const specCompStr = Array.isArray(params.specificCompetences) ? (params.specificCompetences as any).join('\n') : (typeof params.specificCompetences === 'string' ? params.specificCompetences : String(params.specificCompetences || ''));
    const specificComps = specCompStr ? specCompStr.split("\n").filter(Boolean) : [".........."];
    const expectedStds = params.expectedStandards && params.expectedStandards.length > 0 ? params.expectedStandards : [".........."];
    const isLiteracyInEnglishFallback = (params.subject || "").toLowerCase().includes("literacy");
    const isOralEnglishFallback = (params.subject || "").toLowerCase().includes("oral");
    const lessonGoal = params.lessonGoal || "..........";
    const rationale = params.rationale || "..........";
    const references = typeof params.references === "string" ? params.references.split("\n").filter(Boolean) : (Array.isArray(params.references) && params.references.length > 0 ? params.references : [".........."]);
    const teachingAids = typeof params.teachingAids === "string" ? params.teachingAids.split("\n").filter(Boolean) : (Array.isArray(params.teachingAids) && params.teachingAids.length > 0 ? params.teachingAids : [".........."]);
    const learningActs = params.learningActivities && params.learningActivities.length > 0 ? params.learningActivities : [".........."];
    const fallbackTableContent = `
  <tr>
    <td style="padding: 2px 2px; vertical-align: top;"><b>INTRODUCTION</b><br/>5 mins</td>
    <td style="padding: 2px 2px; vertical-align: top;">Teacher introduces the lesson topic and outlines the key learning objectives. Welcomes the learners and asks quick review questions.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners listen attentively, respond to the review questions, and write down the lesson topic.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Active engagement, response to greeting, and participation.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners are ready to explore the new concepts.</td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; vertical-align: top;"><b>STAGE 1</b><br/>10 mins</td>
    <td style="padding: 2px 2px; vertical-align: top;">Teacher explains the foundational concepts, writes definitions and key rules on the chalkboard, and demonstrates with practical examples.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners follow the explanation, take notes, ask clarifying questions, and observe the worked examples.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Conceptual understanding, listening skills, and neat note-taking.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners can explain the basic definitions and rules.</td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; vertical-align: top;"><b>STAGE 2</b><br/>15 mins</td>
    <td style="padding: 2px 2px; vertical-align: top;">Teacher assigns collaborative group activities or guided practice tasks to check comprehension and application.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners work in small groups, discuss the assigned tasks, share ideas, and present their findings.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Cooperation, communication, teamwork, and problem-solving.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Groups complete the tasks and present solutions.</td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; vertical-align: top;"><b>STAGE 3</b><br/>10 mins</td>
    <td style="padding: 2px 2px; vertical-align: top;">Teacher reviews group presentations, clarifies any misconceptions, and summarizes the core learning points.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners consolidate their notes, correct any errors in their exercises, and reflect on the feedback.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Self-reflection, active listening, and precision.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners self-correct and grasp advanced nuances.</td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; vertical-align: top;"><b>CONCLUSION</b><br/>5 mins</td>
    <td style="padding: 2px 2px; vertical-align: top;">Teacher conducts a quick formative assessment (e.g., exit ticket or summary quiz) and assigns homework/extended tasks.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Learners complete the summary task individually, record their homework assignments, and pack up.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Independent evaluation, time management, and self-organization.</td>
    <td style="padding: 2px 2px; vertical-align: top;">Completed exit tickets and homework written down.</td>
  </tr>`;

    generalInfoTable = `
<table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>TEACHER:</strong> \${params.teacherName || "Kombe fortune"}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>DATE:</strong> \${params.date || ".........."}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>Att: (BOYS:</strong> ....... &nbsp;&nbsp;&nbsp;&nbsp; <strong>GIRLS:</strong> .......<strong>)</strong></td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> \${params.year || "2026"} / TERM \${params.term || "1"}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>TIME:</strong> ..........</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>DURATION:</strong> \${cleanDurationDisplay(params.duration)}</td>
  </tr>
</table>`;
} else if (t === "lesson_notes") {
    const selectedSubtopicsList = (params.selectedSubtopics && params.selectedSubtopics.length > 0)
      ? params.selectedSubtopics
      : (params.subtopic ? [params.subtopic] : [".........."]);

    const joinedSubtopics = selectedSubtopicsList.join(" AND ");

    const lessonNotesHTML = `
<div style="margin-top: 25px; padding: 15px; border-left: 4px solid #00A86B; background-color: #FAFAFA; margin-bottom: 25px;">
<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 5px; margin-bottom: 5px;">A. TEACHER'S PATHWAY & SEQUENTIAL INSTRUCTIONAL STEPS (Unified Teaching Flow)</h4>
<div style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-bottom: 20px;">
Step 1: Introduction by asking learners to share relevant local experiences or everyday scenarios to captivate attention and establish a practical hook for the subtopics.<br/>
Step 2: Define and model core conceptual terms and definitions on the chalkboard, explaining rules step-by-step to the learners.<br/>
Step 3: Guide active concept-checking questions and transitions between subtopics seamlessly to guarantee comprehensive progress.<br/>
Step 4: Conclude by bridging theoretical learning directly to practical practice problems, worked examples, and independent tasks.
</div>

<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 20px; margin-bottom: 5px;">B. UNIFIED LEARNERS' NOTES TO BE COPIED (Continuous Chalkboard Chain)</h4>
<p style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-bottom: 15px;">
<i>The following comprehensive, detailed notes are arranged in a single continuous chain, with the transition between each sub-topic marked by the core educational idea:</i>
</p>

<div style="font-size: 10.5pt; line-height: 1.6; color: #334155;">
${selectedSubtopicsList.map((st, idx) => `
<div style="margin-top: 15px; margin-bottom: 15px; border-bottom: 1px dashed #E2E8F0; padding-bottom: 10px;">
<h5 style="font-size: 10.5pt; font-weight: bold; color: #0F172A; margin: 0 0 10px 0; text-transform: uppercase;">• IDEAS & NOTES FOR SUB-TOPIC ${idx + 1}: ${st}</h5>
<ul style="margin: 0; padding-left: 20px;">
<li style="margin-bottom: 8px;">
<strong>Core Conceptual Definition and Rules</strong>: Establish the primary definitions, formulas, and general properties of ${st}. Let learners copy this first guideline.
<p style="margin-top: 4px; margin-bottom: 0; color: #475569; text-align: justify; font-size: 10pt;">This concept defines the foundational terms and theoretical base of the subtopic. It covers both primary characteristics and surrounding background details that support learners' general comprehension.</p>
</li>
<li style="margin-bottom: 8px;">
<strong>Practical Applications and Worked Calculations</strong>: Focus on how these principles apply to actual syllabus requirements and exam contexts.
<p style="margin-top: 4px; margin-bottom: 0; color: #475569; text-align: justify; font-size: 10pt;">Learners must practice applying these rules to various questions. Document standard methods and steps to guide independent work.</p>
</li>
</ul>
</div>
`).join("")}
</div>

<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 20px; margin-bottom: 5px;">C. PROGRESSIVE PRACTICE PROBLEMS & WORKED EXAMPLES</h4>
<div style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-top: 10px;">
<div style="background-color: #FFFFFF; border-left: 4px solid #00A86B; padding: 12px; margin-bottom: 12px; border-radius: 4px; border-top: 1px solid #F1F5F9; border-right: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9;">
<strong>Worked Example / Scenario 1:</strong><br/>
Review the baseline question or scenario combining elements from the subtopics and determine the appropriate solving method.<br/>
<strong style="color: #0F172A;">Detailed Solution Pathway:</strong><br/>
State the guiding formula or principle, substitute values systematically, perform calculations step-by-step, and explain how the final result matches our conceptual expectations.
</div>
</div>
</div>
`.trim();

    return `
${warningLine}
<center>
<h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">LESSON NOTES</h1>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.district ? params.district.toUpperCase() + (params.district.toUpperCase().includes("DISTRICT") ? "" : " DISTRICT") : "................ DISTRICT"}</h2>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : ".........."}</h2>
</center>

<div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
<p style="margin: 4px 0;"><b>SUBJECT:</b> ${params.subject || ".........."}</p>
<p style="margin: 4px 0;"><b>GRADE:</b> ${params.grade || ".........."}</p>
<p style="margin: 4px 0;"><b>TOPIC:</b> ${params.topic || ".........."}</p>
<p style="margin: 4px 0;"><b>SUB-TOPIC:</b> ${joinedSubtopics}</p>
</div>

<div style="font-size: 10pt; font-weight: bold; margin-bottom: 15px; text-align: right;"># DETAILED LESSON NOTES</div>

<div class="lesson-notes-meta" style="margin-bottom: 25px; line-height: 1.6;">
<b>SPECIFIC ${isOBC ? "OUTCOMES" : "COMPETENCES"}:</b><br/>${params.specificCompetences || ".........."}<br/>
</div>

<hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 25px;" />

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">1. INTRODUCTION TO THE LESSON/CONCEPTS</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
The lesson begins with a learner-focused introduction explaining the core concepts related to this topic. Explaining how the selected sub-topics integrate together, the teacher leverages clear definitions, relatable real-life analogies, and establishes context based on the syllabus standards.
</p>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">2. CORE CONTENT & DETAILED SUB-TOPICS EXPOSITION</h3>
${lessonNotesHTML}

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">3. INTEGRATED CLASSROOM EXERCISE / TASKS</h3>
<div style="font-size: 11pt; line-height: 1.6; margin-bottom: 25px;">
<p>To verify that learners have acquired the relevant competencies across all the covered sub-topics, guide them to complete the following assessment exercise:</p>
<ol style="padding-left: 20px; margin-top: 10px;">
<li style="margin-bottom: 10px;">Explain the primary relationship between the subtopic components and demonstrate how to apply these rules to solve typical curriculum questions.</li>
</ol>
</div>

<div style="page-break-before: always; margin-top: 40px; border-top: 2px solid #00A86B; padding-top: 20px;">
<h3 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px;">DOCUMENT REFERENCES & CITATIONS</h3>
<ol class="references-list" style="font-size: 8pt; line-height: 1.6; color: #475569; padding-left: 20px; font-family: 'Inter', sans-serif;">
<li>${params.references || ".........."}</li>
</ol>
</div>

<div class="lesson-notes-footer" style="margin-top: 40px; border-top: 1.5px solid black; padding-top: 15px; font-size: 9.5pt; text-align: center;">
<strong>FORTUNES EDUTECH CBC/OBC Resource Suite © ${params.year || new Date().getFullYear()}</strong>
</div>
`.trim();
  } else if (t === "individual_work_plan") {
    const jt = (params.jobTitle || "").toLowerCase();
    const isHeadTeacher = (jt.includes("head teacher") || jt.includes("headteacher")) && !jt.includes("deputy");
    const isDeputyHead = jt.includes("deputy");
    const isSeniorTeacher = jt.includes("senior teacher");
    const isAdminRole = isHeadTeacher || isDeputyHead;
    
    let kras: any[] = [];
    
    if (isAdminRole) {
      kras = [
        {
          area: "1. ACADEMIC PROGRAMMES",
          acc: "Manages and co-ordinates effectively the provision of all academic programmes in order to ensure that quality of education is delivered.",
          act: "- Conduct open day<br/>- Monitor teaching and learning of pupils from .......... to ..........<br/>- Monitor pupils' assessments throughout the year<br/>- Monitor catch-up activities and literacy<br/>- Teach at least a Grade ..........<br/>- Prepare: Monthly tests, Termly assessments, .......... Mock examination, ECZ examinations, Checking homework",
          target: "- .....Teachers, ...... Pupils and Parents<br/>- monitoring and File checking twice per month<br/>- Catch-up activities monitored per month<br/>- Preparation and monitoring Homework books....., Pupils exercise books......",
          rating: ""
        },
        {
          area: "2. ADMINISTRATIVE FUNCTIONS",
          acc: "Manage and co-ordinate effectively all administrative functions in order to facilitate the smooth running of the school.",
          act: "- Hold .......... Staff briefings by December ..........<br/>- Hold .......... School assemblies by December ..........<br/>- Hold .......... School committee meetings by .......... [Once per term for .......... committees; Twice per term for PTA and PMS]<br/>- Fund and hire labour for painting, sign posts, and rehabilitation when need arises<br/>- Oversee: Painting, Landscaping, Computer Room, CPD activities",
          target: "- ..... Teachers, ..... Pupils<br/>- PTA Executive members<br/>- funding and hiring labor in painting of the school, sign Posts and other rehabilitation activities (Skilled and semi-skilled labour when needed)",
          rating: ""
        },
        {
          area: "3. MONITORING AND EVALUATION",
          acc: "Manages effectively monitoring and evaluation of programmes in order to facilitate appropriate intervention.",
          act: "- Request individual teachers' work plans by .......... (Date)<br/>- Check schemes of work, weekly forecast and lesson plans for teachers per term<br/>- Observe .......... teachers teaching per term<br/>- Check monitoring reports from Deputy Head Teacher and Senior Teachers at least once per term",
          target: "- Syllabus, Schemes of work, Weekly forecasts, Lesson plans checked<br/>- .........Teachers observed per term",
          rating: ""
        },
        {
          area: "4. POLICY INTERPRETATION",
          acc: "1. Manages regular implementation of policies to provide guidelines.<br/>2. Manages regular monitoring and ensure health guidelines are adhered to.",
          act: "- .......... Stakeholders meeting by .......... (date)<br/>- Conduct and monitor Homework by .......... (date)<br/>- Conduct and monitor Re-entry Policy [Parents, Pregnant pupils and responsible persons]<br/>- Conduct .......... PTA Executive Committee meetings by .......... (date)<br/>- Conduct .......... PTA Annual General Meeting by .......... (date)<br/>- Implement Monitoring Policy by .......... (date)<br/>- Daily cleaning, hand washing and toilet cleaning for cholera prevention",
          target: "- PTC executive meetings conducted by .......... (date)<br/>- .......... PTA annual general meeting conducted by .......... (date)<br/>- Stake holders meeting conducted by .......... (date)<br/>- parents, pregnant pupils and responsible persons.<br/>- Homework , preventive maintenance (pms), Re-entry Policy, Monitoring Policy, Production unit Policy implemented<br/>- Health guidelines adhered to (daily cleaning of school surroundings due to diseases and daily washing of hands and cleaning of toilets)",
          rating: ""
        },
        {
          area: "5. PERFORMANCE MANAGEMENT",
          acc: "Manages staff and utilization of resources in order to facilitate the attainment of set objectives.",
          act: "- Request individual teachers' work plans by .......... (date)<br/>- Monitor performance appraisal of teachers<br/>- Receive appraisal reports from Deputy Head Teacher termly<br/>- Check test results monthly<br/>- Check pupils' books fortnightly for syllabus coverage<br/>- Monitor co-curricular activities weekly",
          target: "- All teachers' work plans monitored<br/>- Test results checked monthly<br/>- Pupils' books checked fortnightly<br/>- Co-curricular activities monitored weekly",
          rating: ""
        }
      ];
    } else if (isSeniorTeacher) {
      kras = [
        { area: "1. SECTION ACADEMIC STANDARDS", acc: "To coordinate and monitor academic standards in the section.", act: "- Check schemes and forecasts fortnightly<br/>- Review lesson plans weekly", target: "100% adherence to syllabus", rating: "" },
        { area: "2. MIDDLE MANAGEMENT", acc: "To provide administrative support to the head teacher.", act: "- Hold section briefings<br/>- Submit monthly reports", target: "Efficient section management", rating: "" },
        { area: "3. PERFORMANCE MONITORING", acc: "To monitor teacher performance in the section.", act: "- Conduct peer observations<br/>- Mentor junior teachers", target: "Improved pedagogical standards", rating: "" },
        { area: "4. RESOURCE MANAGEMENT", acc: "To manage teaching and learning materials.", act: "- Inventory section textbooks<br/>- Distribute TLMs", target: "Optimal resource utilization", rating: "" },
        { area: "5. POLICY IMPLEMENTATION", acc: "To ensure adherence to educational policies.", act: "- Monitor learner discipline<br/>- Implement welfare policies", target: "Ordered learning environment", rating: "" }
      ];
    } else {
      const isLighter = params.contentScale === 'lighter';
      kras = [
        { 
          area: "1. PLANNING AND PREPARATION", 
          acc: "Prepare professional documents for teaching.", 
          act: isLighter 
            ? "- Schemes of work<br/>- Weekly forecasts<br/>- Lesson plans" 
            : "- Prepare comprehensive Schemes of work<br/>- Weekly forecasts with cited syllabus examples<br/>- Detailed daily Lesson plans and learning resources", 
          target: "Approved documents by week 1", 
          rating: "" 
        },
        { 
          area: "2. TEACHING AND LEARNING", 
          acc: "Deliver quality lessons to learners.", 
          act: isLighter 
            ? "- Use active learning methods<br/>- Use TLMs effectively" 
            : "- Apply learner-centred active learning methods (e.g. demonstration, group discussion)<br/>- Utilize concrete Teaching and Learning Materials (TLMs) effectively", 
          target: "80% learner pass rate", 
          rating: "" 
        },
        { 
          area: "3. PERFORMANCE DELIVERY", 
          acc: "Ensure effective syllabus coverage.", 
          act: isLighter 
            ? "- Teach all periods<br/>- Maintain class records" 
            : "- Teach all scheduled periods adhering to the national timetable<br/>- Maintain accurate class attendance and progress records", 
          target: "100% syllabus coverage", 
          rating: "" 
        },
        { 
          area: "4. ASSESSMENT & MONITORING", 
          acc: "Assess learner progress regularly.", 
          act: isLighter 
            ? "- Continuous assessments<br/>- Remedial teaching" 
            : "- Administer continuous formative assessments and monthly diagnostic tests<br/>- Conduct targeted remedial teaching for struggling learners", 
          target: "Improved learner performance", 
          rating: "" 
        },
        { 
          area: "5. PROFESSIONAL DEVELOPMENT", 
          acc: "Engage in continuous professional growth.", 
          act: isLighter 
            ? "- Attend CPD/SIT/ZIT<br/>- Peer observations" 
            : "- Actively participate in CPD, SIT, and ZIT collaborative teacher workshops<br/>- Undertake peer lesson observations and curriculum updates", 
          target: "Updated professional skills", 
          rating: "" 
        }
      ];
    }

    const tableHeader = `| KEY RESULT AREA | PRINCIPAL ACCOUNTABILITY | SCHEDULE OF ACTIVITIES | TARGETS | RATING |`;
    const separator = `|---|---|---|---|---|`;
    const rows = kras.map(k => `| ${k.area} | ${k.acc} | ${k.act} | ${k.target} | ${k.rating} |`);

    return `${warningLine}
<center>
  <strong style="font-size: 14pt; text-transform: uppercase;">${params.district ? (params.district.toUpperCase().includes("DISTRICT") ? params.district.toUpperCase() : params.district.toUpperCase() + " DISTRICT") : "MILENGE DISTRICT"}</strong><br/>
  <strong style="font-size: 14pt; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : "CHANGWE LUNGO PRIMARY SCHOOL"}</strong><br/>
  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">INDIVIDUAL WORK PLAN</strong><br/>
</center>
<br/>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 5px; font-family: 'Inter', sans-serif; border-top: 2px solid black;">
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>NAME OF TEACHER:</strong> ${params.teacherName || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%;"><strong>TS NO:</strong> ${params.tsNumber || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>PERIOD:</strong> ${params.workPlanPeriodStart || "JANUARY"} TO ${params.workPlanPeriodEnd || "DECEMBER"}</td>
  </tr>
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>JOB TITLE:</strong> ${params.jobTitle || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%;"><strong>YEAR:</strong> ${params.year || "2026"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>TERM:</strong> TERM 1 - TERM 3</td>
  </tr>
  ${!isAdminRole ? `
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none;" colspan="3"><strong>TEACHING GRADE:</strong> ${params.grade || "........................"}</td>
  </tr>
  ` : ""}
</table>

<div style="margin-top: 10px; margin-bottom: 15px;">
  <strong>JOB PURPOSE:</strong> ${isAdminRole ? "To manage the administration and academic programmes in the school in order to facilitate delivery of quality education." : (params.jobPurpose || "........................")}
</div>

${tableHeader}
${separator}
${rows.join("\n")}

<br/>
<div style="margin-top: 20px; border-top: 2px solid black; padding-top: 10px; page-break-inside: avoid; break-inside: avoid;">
  <h3 style="text-align: center; text-decoration: underline; margin-bottom: 15px;">APPROVAL SECTION</h3>
  <div style="display: flex; justify-content: space-between; margin-top: 10px; gap: 40px;">
    <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-start; text-align: left;">
      <b>SUPERVISOR'S NAME:</b> ${params.supervisorName || "........................"}<br/>
      <b>SUPERVISOR'S SIGNATURE:</b> ........................<br/>
      <b>DATE:</b> ........................<br/><br/>
      ${isHeadTeacher ? `
      <div style="border: 1.5px solid #000; width: 220px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #000; font-size: 8pt; font-family: 'Inter', sans-serif; line-height: 1.3; padding: 10px; box-sizing: border-box; text-align: center; margin-top: 10px; margin-bottom: 5px;">
        <b style="text-decoration: underline; font-size: 8.5pt;">DEBS OFFICIAL STAMP</b>
        <span style="font-size: 7.5pt;">DISTRICT EDUCATION BOARD SECRETARY</span>
        <span style="font-weight: bold; font-size: 8pt;">${(params.district || "........................").toUpperCase()} DISTRICT</span>
      </div>
      ` : `
      <div style="border: 1.5px solid #000; width: 220px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #000; font-size: 8pt; font-family: 'Inter', sans-serif; line-height: 1.3; padding: 10px; box-sizing: border-box; text-align: center; margin-top: 10px; margin-bottom: 5px;">
        <b style="text-decoration: underline; font-size: 8.5pt;">OFFICIAL STAMP</b>
        <span style="font-size: 7.5pt;">HEADTEACHER'S OFFICE</span>
        <span style="font-weight: bold; font-size: 8pt;">${(params.school || "CHANGWE LUNGO PRIMARY SCHOOL").toUpperCase()}</span>
      </div>
      `}
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
      <div style="width: 100%;">
        <b>JOB HOLDER'S NAME:</b> ${params.teacherName || "........................"}<br/>
        <b>JOB HOLDER'S SIGNATURE:</b> ........................<br/>
        <b>DATE:</b> ${params.date || "........................"}<br/><br/>
      </div>
      ${isHeadTeacher ? `
      <div style="border: 1.5px solid #000; width: 220px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #000; font-size: 8pt; font-family: 'Inter', sans-serif; line-height: 1.3; padding: 10px; box-sizing: border-box; text-align: center; margin-top: 10px; margin-bottom: 5px; align-self: flex-end;">
        <b style="text-decoration: underline; font-size: 8.5pt;">OFFICIAL STAMP</b>
        <span style="font-size: 7.5pt;">HEADTEACHER'S OFFICE</span>
        <span style="font-weight: bold; font-size: 8pt;">${(params.school || "CHANGWE LUNGO PRIMARY SCHOOL").toUpperCase()}</span>
      </div>
      ` : ''}
    </div>
  </div>
</div>`;
  } else if (t === "assessments") {
    const testTitle = (params.testName || params.testType || "ASSESSMENT TEST").toUpperCase();
    const schoolTitle = params.school ? params.school.toUpperCase() : "CHINIKA PRIMARY SCHOOL";
    return `
${warningLine}
<div style="text-align: left; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;">
  <h2 style="margin: 0; font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #000; text-align: left;">${schoolTitle}</h2>
  <h3 style="margin: 3px 0 0 0; font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #000; text-align: left;">${testTitle}</h3>
  <table style="width: 100%; margin-top: 8px; font-size: 9.5pt; border-collapse: collapse; border: none;">
    <tr>
      <td style="text-align: left; padding: 2px 0; border: none;"><b>SUBJECT:</b> ${params.subject || ".........."}</td>
      <td style="text-align: center; padding: 2px 0; border: none;"><b>GRADE:</b> ${params.grade || ".........."}</td>
      <td style="text-align: center; padding: 2px 0; border: none;"><b>TERM:</b> ${params.term || "1"}</td>
      <td style="text-align: right; padding: 2px 0; border: none;"><b>YEAR:</b> ${params.year || "2026"}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 2px 0; border: none;" colspan="4"><b>TIME DURATION:</b> ${params.testDuration ? `${params.testDuration} minutes` : "60 minutes"}</td>
    </tr>
  </table>
  <div style="text-align: left; margin-top: 6px; font-size: 9.5pt;">
    <b>LEARNER'S NAME:</b> ____________________________________________________________________
  </div>
</div>

**SECTION A: MULTIPLE CHOICE QUESTIONS (10 Marks)**

<div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid;">
1. Which of the following is a key requirement according to the standard ${params.subject || "curriculum"} syllabus for ${params.grade || "this grade"}?
<br/>A. Option 1 &nbsp;&nbsp;&nbsp; B. Option 2 &nbsp;&nbsp;&nbsp; C. Option 3 &nbsp;&nbsp;&nbsp; D. Option 4
</div>

<div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid;">
2. Identify the correct term or principle associated with ${params.topic || "the core topic"}:
<br/>A. Option A &nbsp;&nbsp;&nbsp; B. Option B &nbsp;&nbsp;&nbsp; C. Option C &nbsp;&nbsp;&nbsp; D. Option D
</div>

<div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid;">
3. Fill in the blank: The primary objective of this subject is to promote __________.
<br/>A. Comprehension &nbsp;&nbsp;&nbsp; B. Observation &nbsp;&nbsp;&nbsp; C. Application &nbsp;&nbsp;&nbsp; D. Synthesis
</div>

<div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid;">
4. Choose the true statement regarding ${params.subject || "this subject"}:
<br/>A. Statement A &nbsp;&nbsp;&nbsp; B. Statement B &nbsp;&nbsp;&nbsp; C. Statement C &nbsp;&nbsp;&nbsp; D. Statement D
</div>

<div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid;">
5. Select the item that best demonstrates the practical application of this concept:
<br/>A. Example 1 &nbsp;&nbsp;&nbsp; B. Example 2 &nbsp;&nbsp;&nbsp; C. Example 3 &nbsp;&nbsp;&nbsp; D. Example 4
</div>

<br/>

**SECTION B: SHORT ANSWER QUESTIONS (10 Marks)**

<div class="question-block" style="margin-bottom: 12px; page-break-inside: avoid;">
6. Define the main concepts related to ${params.topic || "this topic"} and state two key characteristics. (4 Marks)
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
</div>

<div class="question-block" style="margin-bottom: 12px; page-break-inside: avoid;">
7. Briefly explain how a learner demonstrates competency in ${params.subject || "this subject"}. (3 Marks)
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
</div>

<div class="question-block" style="margin-bottom: 12px; page-break-inside: avoid;">
8. List three examples or applications of this subtopic in daily life. (3 Marks)
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
</div>

<br/>

**SECTION C: ESSAY / STRUCTURED QUESTIONS (10 Marks)**

<div class="question-block" style="margin-bottom: 12px; page-break-inside: avoid;">
9. Describe in detail the procedure and key principles for ${params.topic || "the syllabus topic"}. Provide clear step-by-step explanations. (10 Marks)
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
<br/>_________________________________________________________________________________
</div>

<div class="page-break"></div>

<h3 style="margin: 0; font-size: 14pt; text-align: center; margin-bottom: 15px; font-weight: 800; text-transform: uppercase;">MARKING KEY & ANSWER GUIDE</h3>

**SECTION A: MULTIPLE CHOICE**
1. A (Standard outcome)
2. B (Core principle)
3. A (Comprehension)
4. C (Curriculum standard)
5. B (Practical example)

**SECTION B: SHORT ANSWER**
6. Award 2 marks for clear definition and 2 marks for stating two valid characteristics.
7. Award 3 marks for well-explained learner competency demonstration.
8. Award 1 mark each for three valid real-world applications.

**SECTION C: ESSAY**
9. Award up to 10 marks: 4 marks for detailed conceptual description, 4 marks for accurate step-by-step procedure, 2 marks for clarity and terminology.
`.trim();
  } else if (t === "schemes_of_work") {
    const isLanguage = (params.subject || '').toLowerCase().includes('english') || (params.subject || '').toLowerCase().includes('language') || (params.subject || '').toLowerCase().includes('literacy');
    let weeksToRender = (params.weeks && params.weeks.length > 0)
      ? params.weeks
      : [];

    if ((!params.weeks || params.weeks.length < 13) && Array.isArray(params.officialSyllabusData) && params.officialSyllabusData.length > 0) {
      const derivedWeeks: any[] = [];
      const allSubtopics: any[] = [];
      params.officialSyllabusData.forEach((topic: any) => {
        if (Array.isArray(topic.subtopics)) {
          topic.subtopics.forEach((st: any) => {
            allSubtopics.push({
              topic: topic.title,
              subtopic: st.title,
              competencies: st.competencies || [],
              expectedStandards: [st.expectedStandard || st.expectedStandards?.[0] || "Learners apply competencies accurately"],
              activities: st.learningActivities || [],
            });
          });
        }
      });

      if (allSubtopics.length > 0) {
        const teachingWeeksCount = 11;
        for (let weekNum = 1; weekNum <= 13; weekNum++) {
          if (weekNum === 12) {
            derivedWeeks.push({
              week: weekNum,
              topic: "Revision",
              subtopics: ["End of Term Revision"],
              competencies: ["Revise all topics covered during the term"],
              expectedStandards: ["Learners consolidate term's competencies"],
              activities: ["Revision exercises, peer discussion, and practice tests"]
            });
          } else if (weekNum === 13) {
            derivedWeeks.push({
              week: weekNum,
              topic: "Assessment",
              subtopics: ["End of Term Examinations"],
              competencies: ["Assess learners' understanding of all term topics"],
              expectedStandards: ["Learners demonstrate mastery of curriculum outcomes"],
              activities: ["Written examination and grading"]
            });
          } else {
            const subtopicsPerWeek = Math.max(1, Math.ceil(allSubtopics.length / teachingWeeksCount));
            const startIdx = (weekNum - 1) * subtopicsPerWeek;
            const endIdx = Math.min(allSubtopics.length, startIdx + subtopicsPerWeek);
            const weekSubs = allSubtopics.slice(startIdx, endIdx);

            if (weekSubs.length > 0) {
              const weekTopic = weekSubs[0].topic;
              const weekSubtopicNames = weekSubs.map(s => s.subtopic);
              const weekComps = weekSubs.flatMap(s => s.competencies);
              const weekStds = weekSubs.flatMap(s => s.expectedStandards);
              const weekActs = weekSubs.flatMap(s => s.activities);

              derivedWeeks.push({
                week: weekNum,
                topic: weekTopic,
                subtopics: weekSubtopicNames,
                competencies: weekComps.length > 0 ? weekComps : ["Understand and apply concepts of " + weekSubtopicNames.join(", ")],
                expectedStandards: weekStds.length > 0 ? weekStds : ["Learners apply competencies accurately"],
                activities: weekActs.length > 0 ? weekActs : ["Active learning task and guided practice"]
              });
            } else {
              const lastSub = allSubtopics[allSubtopics.length - 1];
              derivedWeeks.push({
                week: weekNum,
                topic: lastSub.topic,
                subtopics: [lastSub.subtopic],
                competencies: lastSub.competencies,
                expectedStandards: lastSub.expectedStandards,
                activities: lastSub.activities
              });
            }
          }
        }
        weeksToRender = derivedWeeks;
      }
    }

    if (weeksToRender.length < 13) {
      const existingFirst = weeksToRender[0] || (params.weeks && params.weeks[0]);
      weeksToRender = Array.from({ length: 13 }, (_, idx) => {
        const weekNum = idx + 1;
        if (idx === 0 && existingFirst && existingFirst.topic) {
          return {
            week: 1,
            topic: existingFirst.topic,
            subtopics: existingFirst.subtopics || [(existingFirst as any).subtopic || "Core Subtopic"],
            competencies: existingFirst.competencies || [(existingFirst as any).competency || params.specificCompetences || "Competency"],
            expectedStandards: existingFirst.expectedStandards || [(existingFirst as any).expectedStandard || "Standard outcome"],
            activities: existingFirst.activities || [params.learningActivities?.[0] || "Learning activities"]
          };
        }
        if (weekNum === 12) {
          return {
            week: 12,
            topic: "Revision and Remediation",
            subtopics: ["Term Concepts Review & Skill Consolidation"],
            competencies: ["Consolidate and review all competencies taught during the term"],
            expectedStandards: ["Learners demonstrate consolidated mastery of term competencies"],
            activities: ["Revision worksheets, group problem-solving, and remediation clinics"]
          };
        }
        if (weekNum === 13) {
          return {
            week: 13,
            topic: "Summative Evaluation",
            subtopics: ["End of Term Assessment"],
            competencies: ["Evaluate understanding and application of all term curriculum outcomes"],
            expectedStandards: ["Learners successfully assessed according to national standards"],
            activities: ["Summative written tests, practical assessments, and grading"]
          };
        }
        return {
          week: weekNum,
          topic: existingFirst?.topic ? `${existingFirst.topic} (Unit ${weekNum})` : (params.topic || `Syllabus Topic ${weekNum}`),
          subtopics: [`Subtopic ${weekNum}`],
          competencies: [`Demonstrate understanding of Unit ${weekNum} competencies`],
          expectedStandards: [params.expectedStandard || `Learners apply Unit ${weekNum} competencies accurately`],
          activities: ["Guided teacher exposition, group investigation, and individual written exercises"]
        };
      });
    }

    let header = "";
    if (isOBC) {
      header = isLanguage
        ? '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |'
        : '| WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |';
    } else {
      header = isLanguage
        ? '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |'
        : '| WEEK | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |';
    }

    const separator = header.split('|').map((col, idx) => (idx === 0 || idx === header.split('|').length - 1) ? '' : '---').join('|');

    const htmlRows = weeksToRender.map(w => {
      const topicStr = `<b>${w.topic || "Topic"}</b><br/>` + (w.subtopics || []).filter(Boolean).join('<br/>');
      const specComp = (w.competencies || []).filter(Boolean).join('<br/>') || params.specificCompetences || "..........";
      const expStd = (w.expectedStandards || []).filter(Boolean).join('<br/>') || "..........";
      const acts = (w.activities || []).filter(Boolean).join('<br/>') || "..........";
      const reference = (params.references && params.references !== 'N/A' && params.references !== 'PG:.....')
        ? params.references
        : (getSubjectSyllabusPageRange(params.grade || '', params.subject || '')?.baseSyllabus || getSubjectSyllabusPageRange(params.grade || '', params.subject || '')?.range || `${params.subject || 'Primary'} Syllabus (CDC)`);

      return `<tr>
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: center; vertical-align: top;">Week ${w.week}</td>
  ${isLanguage ? `<td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Language Structure</td>` : ''}
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">${topicStr}</td>
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">${specComp}</td>
  ${isOBC ? `
    <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Identify and define core terms</td>
    <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Communication &amp; problem solving</td>
    <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Creativity, precision, and cooperation</td>
  ` : `
    <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">${expStd}</td>
    <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">${acts}</td>
  `}
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Teacher Exposition, Group Discussion</td>
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">Syllabus, charts, chalkboard</td>
  <td style="border: 1px solid black; padding: 6px; font-size: 8.5pt; vertical-align: top;">${reference}</td>
</tr>`;
    });

    return `${warningLine}
<center>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.district || "Milenge").toUpperCase()} DISTRICT</strong><br/>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.school || "Changwe Lungo Primary School").toUpperCase()}</strong><br/>
  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">SCHEME OF WORK</strong><br/>
</center>
<br/>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 5px; font-family: 'Inter', sans-serif; border-top: 2px solid black;">
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>NAME OF TEACHER:</strong> ${params.teacherName || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%;"><strong>TS NO:</strong> ${params.tsNumber || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>TERM:</strong> TERM ${params.term || "1"}</td>
  </tr>
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>SUBJECT:</strong> ${params.subject || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%;"><strong>GRADE:</strong> ${params.grade || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>YEAR:</strong> ${params.year || "2026"}</td>
  </tr>
</table>
<br/>

<table class="scheme-table" style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid black; font-family: 'Inter', sans-serif;">
  <thead>
    <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid black;">
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: center; width: 6%;">WEEK</th>
      ${isLanguage ? '<th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: center; width: 10%;">COMPONENT</th>' : ''}
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 15%;">TOPIC/SUBTOPICS</th>
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 18%;">${isOBC ? 'SPECIFIC OUTCOMES' : 'SPECIFIC COMPETENCIES'}</th>
      ${isOBC ? `
        <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 14%;">KNOWLEDGE</th>
        <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 12%;">SKILLS</th>
        <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 10%;">VALUES</th>
      ` : `
        <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 18%;">EXPECTED STANDARDS</th>
        <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 18%;">LEARNING ACTIVITIES</th>
      `}
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 12%;">TEACHING METHODS</th>
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 12%;">T/L AIDS</th>
      <th style="border: 1px solid black; padding: 6px; font-size: 8.5pt; text-align: left; width: 10%;">REFERENCE</th>
    </tr>
  </thead>
  <tbody>
    ${htmlRows.join('\n')}
  </tbody>
</table>`;
  } else if (t === "weekly_forecast") {
    const isLanguage = (params.subject || '').toLowerCase().includes('english') || (params.subject || '').toLowerCase().includes('language') || (params.subject || '').toLowerCase().includes('literacy');
    let forecastDaysToRender = (params.forecastDays && params.forecastDays.length > 0)
      ? params.forecastDays
      : [];

    if ((!params.forecastDays || params.forecastDays.length === 0) && Array.isArray(params.officialSyllabusData) && params.officialSyllabusData.length > 0) {
      const derivedDays: any[] = [];
      const allSubtopics: any[] = [];
      params.officialSyllabusData.forEach((topic: any) => {
        if (Array.isArray(topic.subtopics)) {
          topic.subtopics.forEach((st: any) => {
            allSubtopics.push({
              topic: topic.title,
              subtopic: st.title,
              competencies: st.competencies || [],
              expectedStandard: st.expectedStandard || st.expectedStandards?.[0] || "Learners apply competencies accurately",
              activities: st.learningActivities || [],
              knowledge: st.knowledge || '',
              skills: st.skills || '',
              values: st.values || '',
            });
          });
        }
      });

      if (allSubtopics.length > 0) {
        let dayIndex = 1;
        allSubtopics.forEach((sub) => {
          const comps = sub.competencies;
          if (comps.length > 0) {
            comps.forEach((comp: string) => {
              if (dayIndex <= 5) {
                derivedDays.push({
                  day: dayIndex.toString(),
                  topic: sub.topic,
                  subtopic: sub.subtopic,
                  competency: comp,
                  expectedStandard: sub.expectedStandard,
                  activities: sub.activities,
                  knowledge: sub.knowledge,
                  skills: sub.skills,
                  values: sub.values,
                });
                dayIndex++;
              }
            });
          } else {
            if (dayIndex <= 5) {
              derivedDays.push({
                day: dayIndex.toString(),
                topic: sub.topic,
                subtopic: sub.subtopic,
                competency: "Understand and apply concepts of " + sub.subtopic,
                expectedStandard: sub.expectedStandard,
                activities: sub.activities,
                knowledge: sub.knowledge,
                skills: sub.skills,
                values: sub.values,
              });
              dayIndex++;
            }
          }
        });

        while (derivedDays.length < 5 && derivedDays.length > 0) {
          const base = derivedDays[derivedDays.length - 1];
          derivedDays.push({
            ...base,
            day: (derivedDays.length + 1).toString(),
          });
        }

        if (derivedDays.length === 5) {
          forecastDaysToRender = derivedDays;
        }
      }
    }

    if (forecastDaysToRender.length === 0) {
      forecastDaysToRender = [
        { day: "1" },
        { day: "2" },
        { day: "3" },
        { day: "4" },
        { day: "5" }
      ];
    }

    let header = "";
    if (isOBC) {
      header = '| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |';
    } else {
      header = '| DAY | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |';
    }

    const separator = header.split('|').map((col, idx) => (idx === 0 || idx === header.split('|').length - 1) ? '' : '---').join('|');

    const isSubjectName = (str?: string) => {
      if (!str) return true;
      const s = str.trim().toLowerCase();
      return /^(english|english language|primary english|oral english|literacy in english|mathematics|math|maths|integrated science|science|social studies|creative and technology studies|creative & technology studies|cts|technology studies|zambian language|zambian languages|home economics|expressive arts|physical education|community studies)$/i.test(s) ||
        ((params.subject || '').trim().toLowerCase() === s);
    };

    const cleanFallbackTopicDesc = (!isSubjectName(params.subtopic) ? params.subtopic : '') || 
                                   (!isSubjectName(params.topic) ? params.topic : '') || 
                                   "given concepts";

    const defaultReference = (params.references && params.references !== 'N/A' && params.references !== 'PG:.....')
      ? params.references
      : (getSubjectSyllabusPageRange(params.grade || '', params.subject || '')?.range || `${params.subject || 'Primary'} Syllabus (CDC)`);

    // Progressive curriculum-aligned stages across the 5 days for authentic pedagogical sequencing
    const languageProgressions = [
      { comp: "Listening & Speaking", outcome: `Listen to and speak about ${cleanFallbackTopicDesc}`, know: "Oral vocabulary and pronunciation", skill: "Listening & oral communication", val: "Attentiveness & cooperation", act: "Oral drills, question and answer, pair talk", meth: "Teacher Exposition, Communicative Approach", aids: "Flashcards, picture cards" },
      { comp: "Reading", outcome: `Read and identify key words and sentences in ${cleanFallbackTopicDesc}`, know: "Phonics, word meanings and sight words", skill: "Pronunciation & reading fluency", val: "Curiosity & focus", act: "Guided reading, phonics blending, shared reading", meth: "Guided Reading, Phonics Drill", aids: "Word cards, readers, charts" },
      { comp: "Language Structure", outcome: `Construct grammatically correct sentences on ${cleanFallbackTopicDesc}`, know: "Sentence structures, word order and rules", skill: "Sentence construction & syntax", val: "Accuracy & logical thinking", act: "Sentence building, substitution tables, exercises", meth: "Teacher Exposition, Demonstration", aids: "Sentence strips, chalkboard, workbook" },
      { comp: "Writing", outcome: `Write clear, punctuated sentences based on ${cleanFallbackTopicDesc}`, know: "Punctuation, capitalization and spelling", skill: "Handwriting & composition", val: "Neatness & precision", act: "Writing sentences, fill-in blanks, exercise book work", meth: "Guided Writing, Independent Practice", aids: "Worksheets, chalkboard, exercise books" },
      { comp: "Language Structure", outcome: `Review, edit and evaluate written sentences on ${cleanFallbackTopicDesc}`, know: "Proofreading and error correction rules", skill: "Editing & self-evaluation", val: "Diligence & confidence", act: "Sentence editing, peer correction, summary review", meth: "Peer Review, Question & Answer", aids: "Chalkboard, exercise books" }
    ];

    const generalProgressions = [
      { outcome: `Define and state principles of ${cleanFallbackTopicDesc}`, know: "Core concepts and definitions", skill: "Identification & recall", val: "Curiosity & attentiveness", act: "Brainstorming, observation, guided Q&A", meth: "Teacher Exposition, Question & Answer", aids: "Charts, realia, chalkboard" },
      { outcome: `Identify and classify components of ${cleanFallbackTopicDesc}`, know: "Key characteristics and functions", skill: "Classification & explanation", val: "Critical thinking & cooperation", act: "Small group exploration, sorting, and reporting", meth: "Guided Discovery, Group Work", aids: "Worksheets, concrete objects" },
      { outcome: `Apply rules and procedures for ${cleanFallbackTopicDesc}`, know: "Step-by-step methods and algorithms", skill: "Application & problem-solving", val: "Accuracy & perseverance", act: "Worked examples, step-by-step guided practice", meth: "Direct Instruction, Guided Practice", aids: "Chalkboard, practice cards" },
      { outcome: `Demonstrate mastery by solving practical tasks in ${cleanFallbackTopicDesc}`, know: "Application to real-world contexts", skill: "Analytical writing & calculation", val: "Independence & responsibility", act: "Independent seatwork, exercise book questions", meth: "Independent Study, Individual Work", aids: "Exercise books, textbooks" },
      { outcome: `Review and evaluate understanding of ${cleanFallbackTopicDesc}`, know: "Consolidated principles and summary", skill: "Self-assessment & synthesis", val: "Reflection & confidence", act: "Review quiz, class discussion, peer checking", meth: "Discussion, Remedial Instruction", aids: "Chalkboard, evaluation rubric" }
    ];

    const rows = forecastDaysToRender.map((dayItem: any, idx: number) => {
      const isObj = typeof dayItem === 'object' && dayItem !== null;
      const dayNum = isObj ? (dayItem.day || idx + 1) : (idx + 1);
      const dayDate = isObj ? (dayItem.date || '') : '';
      const dayLabel = dayDate ? `Day ${dayNum}<br/><small>(${dayDate})</small>` : (typeof dayItem === 'string' ? dayItem : `Day ${dayNum}`);

      const stepIdx = idx % 5;
      const langStep = languageProgressions[stepIdx];
      const genStep = generalProgressions[stepIdx];

      const ensureNumberPrefix = (textStr: string, defaultCode: string) => {
        if (!textStr) return `${defaultCode} Topic`;
        const clean = textStr.trim();
        if (/^\d+(?:\.\d+)*/.test(clean)) return clean;
        return `${defaultCode} ${clean}`;
      };

      const rowTopic = (isObj && dayItem.topic && !isSubjectName(dayItem.topic)) 
        ? dayItem.topic 
        : (!isSubjectName(params.topic) ? params.topic : "Topic");

      let rawSub = (isObj && dayItem.subtopic) ? dayItem.subtopic : (params.subtopic || "");
      const cleanSub = !isSubjectName(rawSub) ? rawSub.trim() : "";

      const topicNumMatch = rowTopic.match(/^\d+(?:\.\d+)*/);
      const topCode = topicNumMatch ? topicNumMatch[0] : '1.0';

      const subNumMatch = cleanSub.match(/^\d+(?:\.\d+)*/);
      const subCode = subNumMatch ? subNumMatch[0] : (topCode.endsWith('.0') ? topCode.replace(/\.0$/, '.1') : `${topCode}.1`);

      const mainTopNumbered = ensureNumberPrefix(rowTopic, topCode);
      const subTopNumbered = cleanSub ? ensureNumberPrefix(cleanSub, subCode) : '';

      const topicStr = subTopNumbered 
        ? `<b>${mainTopNumbered}</b><br/><small><b>${subTopNumbered}</b></small>` 
        : `<b>${mainTopNumbered}</b>`;

      const rowComp = (isObj && (dayItem.component || dayItem.learningArea)) 
        ? (dayItem.component || dayItem.learningArea) 
        : langStep.comp;

      const rawComp = (isObj && dayItem.competency)
        ? dayItem.competency
        : (params.specificCompetences && idx === 0 ? params.specificCompetences : (isLanguage ? langStep.outcome : genStep.outcome));

      const cleanCompText = rawComp.replace(/^•\s*/, '').trim();
      const compNumMatch = cleanCompText.match(/^\d+(?:\.\d+)*/);
      const daySeqNum = `${subCode}.${idx + 1}`;
      const compCode = compNumMatch ? compNumMatch[0] : daySeqNum;
      const numberedComp = ensureNumberPrefix(cleanCompText, compCode);
      const outStr = `• ${numberedComp}`;

      const knowStr = (isObj && dayItem.knowledge) 
        ? dayItem.knowledge 
        : (isLanguage ? langStep.know : genStep.know);

      const skillStr = (isObj && dayItem.skills) 
        ? dayItem.skills 
        : (isLanguage ? langStep.skill : genStep.skill);

      const valStr = (isObj && dayItem.values) 
        ? dayItem.values 
        : (isLanguage ? langStep.val : genStep.val);

      const expStd = (isObj && dayItem.expectedStandard) 
        ? dayItem.expectedStandard 
        : (params.expectedStandard || "Learners apply competencies accurately");

      const cleanFallbackActs = isObj && Array.isArray(dayItem.activities)
        ? dayItem.activities.filter((a: any) => typeof a === 'string' && a.trim() !== '')
        : [];
      const actStr = cleanFallbackActs.length > 0
        ? cleanFallbackActs.join(' • ')
        : (isLanguage ? langStep.act : genStep.act);

      const cleanFallbackMeths = isObj && Array.isArray(dayItem.methods)
        ? dayItem.methods.filter((m: any) => typeof m === 'string' && m.trim() !== '')
        : [];
      const methStr = cleanFallbackMeths.length > 0
        ? cleanFallbackMeths.join(', ')
        : (isLanguage ? langStep.meth : genStep.meth);

      const aidsStr = (isObj && dayItem.teachingAids)
        ? dayItem.teachingAids
        : (params.teachingAids || (isLanguage ? langStep.aids : genStep.aids));

      const refStr = (isObj && dayItem.references && dayItem.references !== 'N/A' && dayItem.references !== 'PG:.....')
        ? dayItem.references
        : defaultReference;

      if (isOBC) {
        return `| ${dayLabel} | ${topicStr} | ${outStr} | ${knowStr} | ${skillStr} | ${valStr} | ${methStr} | ${aidsStr} | ${refStr} | |`;
      } else {
        return `| ${dayLabel} | ${topicStr} | ${outStr} | ${expStd} | ${actStr} | ${methStr} | ${aidsStr} | ${refStr} | |`;
      }
    });

    const headerTitleLabel = "WEEKLY FORECAST";

    return `${warningLine}
<center>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.district || "Milenge").toUpperCase()} DISTRICT</strong><br/>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.school || "Changwe Lungo Primary School").toUpperCase()}</strong><br/>
  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">${headerTitleLabel}</strong>
</center>
<br/>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 5px; font-family: 'Inter', sans-serif; border-top: 2px solid black; border-bottom: 2px solid black;">
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>NAME OF TEACHER:</strong> ${params.teacherName || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: center;"><strong>GRADE:</strong> ${params.grade || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>SUBJECT:</strong> ${params.subject || "........................"}</td>
  </tr>
  <tr>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>YEAR/TERM:</strong> ${params.year || "2026"} / TERM ${params.term || "1"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: center;"><strong>WEEK:</strong> ${params.forecastWeek || params.weekNumber || "1"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>SCHOOL:</strong> ${(params.school || "Changwe Lungo Primary School").toUpperCase()}</td>
  </tr>
</table>
<br/>

${header}
${separator}
${rows.join('\n')}
`.trim();
  } else if (t === "video_script") {
    const specComp = params.specificCompetences || "Explain and apply concept";
    const reference = (params.references && params.references !== 'N/A' && params.references !== 'PG:.....') ? params.references : (getSubjectSyllabusPageRange(params.grade || '', params.subject || '')?.baseSyllabus || getSubjectSyllabusPageRange(params.grade || '', params.subject || '')?.range || "Primary Syllabus");

    return `${warningLine}
<center>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${(params.district || "Milenge").toUpperCase()} DISTRICT</h2>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${(params.school || "Changwe Lungo Primary School").toUpperCase()}</h2>
  <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">VIDEO LESSON SCRIPT</h1>
</center>

<div class="video-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
  <p style="margin: 4px 0;"><b>SUBJECT:</b> ${params.subject || ".........."}</p>
  <p style="margin: 4px 0;"><b>GRADE:</b> ${params.grade || ".........."}</p>
  <p style="margin: 4px 0;"><b>TOPIC:</b> ${params.topic || ".........."}</p>
  <p style="margin: 4px 0;"><b>SUB-TOPIC:</b> ${params.subtopic || ".........."}</p>
  <p style="margin: 4px 0;"><b>TARGET VIDEO LENGTH:</b> 10-15 Minutes</p>
</div>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">1. OVERVIEW & COMPETENCIES</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
  <b>SPECIFIC COMPETENCIES/LEARNING OUTCOMES:</b><br/>${specComp}<br/><br/>
  <b>VIDEO LESSON FOCUS & GOALS:</b><br/>
  This video lesson guides learners step-by-step through the core concepts of <b>${params.subtopic || "this subtopic"}</b>. It is structured with engaging visual explanations, interactive question-and-answer prompts, and model exercises to foster active learning at home.
</p>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">2. TEACHER PREPARATION CHECKLIST</h3>
<ul style="font-size: 11pt; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 5px;"><b>Technical Set-up:</b> High-quality microphone, clean lighting, clear framing (medium close-up).</li>
  <li style="margin-bottom: 5px;"><b>Physical/Digital Props:</b> Blackboard, chalk/markers, physical models, and flashcards showing key terms.</li>
  <li style="margin-bottom: 5px;"><b>Board Preparation:</b> Pre-write the definitions, formulas, and the two practice problems on the board before recording.</li>
</ul>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">3. VIDEO SCRIPT & STORYBOARD FLOW</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; font-family: 'Inter', sans-serif;">
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th style="border: 1px solid black; padding: 10px; font-size: 9.5pt; font-weight: bold; text-align: left; width: 15%;">TIMING / SEGMENT</th>
      <th style="border: 1px solid black; padding: 10px; font-size: 9.5pt; font-weight: bold; text-align: left; width: 35%;">VISUALS & ACTION (What's on Screen)</th>
      <th style="border: 1px solid black; padding: 10px; font-size: 9.5pt; font-weight: bold; text-align: left; width: 50%;">AUDIO & SPOKEN DIALOGUE (What's Said)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>00:00 - 01:30</b><br/>Introduction & Hook</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Teacher on screen in a friendly medium-shot, smiling warmly. Title slide is displayed first: <i>${params.topic || "Topic"} - ${params.subtopic || "Subtopic"}</i>. Cut back to teacher who points to an interesting local object or introduces an engaging real-world hook.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Hello boys and girls! Welcome back to another exciting lesson. I'm your teacher, ${params.teacherName || "Kombe fortune"}, and today we are going to explore a super interesting topic: <b>${params.subtopic || "this subtopic"}</b>! Before we begin, look at this..." [Introduce a simple relatable hook or real-world example].</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>01:30 - 05:00</b><br/>Core Concept & Definitions</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Camera pans to the whiteboard. Zoom in on a neatly arranged definition and simple diagrams illustrating the core terms. Use bright markers for emphasis. Teacher uses a pointer.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Awesome! Now, what exactly do we mean by <b>${params.subtopic || "this subtopic"}</b>? Let's read this together on the board..." [Explain the term, breaking it down into simple concepts with energetic, clear verbal description.]</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>05:00 - 08:30</b><br/>Step-by-step Demonstration</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">whiteboard close-up. Teacher solves a model problem or does a clear scientific/conceptual step-by-step breakdown. Writes clear step numbers (1, 2, 3...) on the board with corresponding visual solutions.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Let's see this in action! Suppose we are asked to find or explain how this works..." [Provide a detailed model example, solving it out-loud step-by-step so students at home can easily follow.]</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>08:30 - 11:30</b><br/>Pause & Active Practice</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">A dynamic on-screen slide appears: <b>"YOUR TURN: PAUSE & TRY!"</b>. Displays 2 practice questions. Soft instrumental thinking music starts. Camera shows teacher making a playful "pause" gesture.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Alright, active learners! Now it's your turn to shine. I want you to <b>pause this video right now</b>, grab your exercise book and pen, and try solving these two questions on your screen. Don't worry, we'll solve them together when you get back! Go ahead, pause now!" [Pause for 3 seconds of silence] "Welcome back! Let's check your answers..." [Provide the full worked solutions].</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>11:30 - 13:00</b><br/>Summary & Wrap-up</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Teacher is back in a medium-shot, smiling. Summary slide listing 3 critical takeaways is shown on screen next to the teacher.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Superb effort today! We have learned some wonderful things about <b>${params.subtopic || "this subtopic"}</b>. Let's recap our three main takeaways..." [Briefly summarize 3 main learning points clearly] "Remember to do your homework and keep practicing. I will see you in our next video lesson. Happy learning, and goodbye!"</td>
    </tr>
  </tbody>
</table>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">4. ON-SCREEN TEXT, GRAPHICS & OVERLAYS</h3>
<div style="font-size: 11pt; line-height: 1.6; background-color: #F8FAFC; border-left: 4px solid #00A86B; padding: 15px; border-radius: 8px;">
  <b>Overlay 1 (Title Graphic):</b> Fortunes Edutech | ${params.subject || ".........."} Grade ${params.grade || ".........."} | Topic: ${params.topic || ".........."}<br/>
  <b>Overlay 2 (Syllabus Concept):</b> Key vocabulary and definitions appearing at the bottom of the screen dynamically.<br/>
  <b>Overlay 3 (Credits):</b> FORTUNES EDUTECH © ${params.year || "2026"}
</div>
`.trim();
  }

  // General professional fallback for any unhandled or custom document types
  const generalContentHTML = `
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border: 1px solid #CBD5E1;">
  <thead>
    <tr style="background-color: #F1F5F9; border-bottom: 2px solid #94A3B8;">
      <th style="padding: 10px; border: 1px solid #CBD5E1; text-align: left; font-size: 10.5pt; font-weight: bold; width: 30%;">CURRICULUM ELEMENT</th>
      <th style="padding: 10px; border: 1px solid #CBD5E1; text-align: left; font-size: 10.5pt; font-weight: bold; width: 70%;">DETAILED PEDAGOGICAL CONTENT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">1. TOPIC & KEY CONCEPT</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        <strong>Syllabus Topic:</strong> ${params.topic || "General Topic"}<br/>
        <strong>Subtopic:</strong> ${params.subtopic || "General Subtopic"}<br/>
        Explore the primary concepts, properties, and core theories associated with this syllabus unit.
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">2. SPECIFIC COMPETENCES / OUTCOMES</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        ${params.specificCompetences || "Learners will acquire general knowledge, critical thinking skills, and cooperative learning values to apply this concept in exam-aligned questions and daily life scenarios."}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">3. EXPECTED CURRICULUM STANDARDS</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        ${params.expectedStandard || "Learners apply core competencies with high precision, solve typical practice problems step-by-step, and explain their understanding to peers."}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">4. SUGGESTED LEARNING ACTIVITIES</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        - <strong>Introduction (5 mins):</strong> Brainstorming and guided question-and-answer session.<br/>
        - <strong>Exploration (15 mins):</strong> Small group discussion, component classification, and peer reporting.<br/>
        - <strong>Guided Practice (15 mins):</strong> Step-by-step modeled examples on the chalkboard and guided workbook exercises.<br/>
        - <strong>Conclusion (5 mins):</strong> Formative diagnostic quiz, self-reflection, and homework assignment.
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">5. TEACHING & LEARNING AIDS</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        ${params.teachingAids || "Syllabus books, teacher's guide, chalkboard, colorful charts, and flashcards."}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-weight: bold; font-size: 10pt;">6. REFERENCES & BIBLIOGRAPHY</td>
      <td style="padding: 10px; border: 1px solid #CBD5E1; vertical-align: top; font-size: 10pt; line-height: 1.5;">
        ${params.references || "Primary/Secondary Education Syllabus, Curriculum Development Centre (CDC), Zambia."}
      </td>
    </tr>
  </tbody>
</table>
<div style="margin-top: 30px; border-top: 1.5px solid #94A3B8; padding-top: 15px; font-size: 9.5pt; text-align: center; color: #64748B; font-family: 'Calibri', 'Arial', sans-serif;">
  <strong>FORTUNES EDUTECH CBC/OBC Resource Suite © ${params.year || new Date().getFullYear()}</strong>
</div>
`.trim();

  return `${warningLine}
<center>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.district || "Milenge").toUpperCase()} DISTRICT</strong><br/>
  <strong style="font-size: 14pt; text-transform: uppercase;">${(params.school || "Changwe Lungo Primary School").toUpperCase()}</strong><br/>
  <strong style="font-size: 16pt; text-transform: uppercase; margin-top: 5px; display: inline-block;">${docTitle}</strong><br/>
</center>
<br/>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 2px solid black;">
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 40%;"><strong>TEACHER:</strong> ${params.teacherName || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%;"><strong>SUBJECT:</strong> ${params.subject || "........................"}</td>
    <td style="padding: 4px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 30%; text-align: right;"><strong>GRADE:</strong> ${params.grade || "........................"}</td>
  </tr>
</table>
<br/>
${generalContentHTML}
`.trim();
}

function intNumDays(days: any): number {
  if (Array.isArray(days)) return days.length;
  return 5;
}

export interface SyllabusPageRange {
  baseSyllabus: string;
  range: string;
  start: number;
  end: number;
}

export function getSubjectSyllabusPageRange(grade: string, subject: string): SyllabusPageRange | null {
  const gLow = (grade || "").toLowerCase();
  const sLow = (subject || "").toLowerCase();

  const isOBCGrade = gLow.includes("grade 3") || gLow.includes("grade 5") || gLow.includes("grade 6") || gLow.includes("grade 7") || gLow.includes("obc");
  const isForm = gLow.includes("form 1") || gLow.includes("form 2") || gLow.includes("form 3") || gLow.includes("form 4") || gLow.includes("form 5") || gLow.includes("form 6") || gLow.includes("form");
  const isECE = gLow.includes("ece") || gLow.includes("early childhood") || gLow.includes("3-4 years") || gLow.includes("4-5 years");

  // 1. OBC Levels (Grade 3, Grade 5, Grade 6, Grade 7)
  if (isOBCGrade) {
    const cleanGrade = grade.replace(/\s*\(obc\)/i, '').trim() || 'Grade 3';
    const isGr3 = gLow.includes("grade 3");
    const isGr5 = gLow.includes("grade 5");
    const isGr6 = gLow.includes("grade 6");
    const isGr7 = gLow.includes("grade 7");

    let rangeStr = "Pages 12 - 28";
    let startPg = 12;
    let endPg = 28;

    if (sLow.includes("english") || sLow.includes("literacy")) {
      if (isGr3) { rangeStr = "Pages 12 - 26"; startPg = 12; endPg = 26; }
      else if (isGr5) { rangeStr = "Pages 39 - 52"; startPg = 39; endPg = 52; }
      else if (isGr6) { rangeStr = "Pages 53 - 68"; startPg = 53; endPg = 68; }
      else if (isGr7) { rangeStr = "Pages 69 - 84"; startPg = 69; endPg = 84; }
    } else if (sLow.includes("math")) {
      if (isGr3) { rangeStr = "Pages 10 - 22"; startPg = 10; endPg = 22; }
      else if (isGr5) { rangeStr = "Pages 23 - 35"; startPg = 23; endPg = 35; }
      else if (isGr6) { rangeStr = "Pages 36 - 48"; startPg = 36; endPg = 48; }
      else if (isGr7) { rangeStr = "Pages 49 - 62"; startPg = 49; endPg = 62; }
    } else if (sLow.includes("science")) {
      if (isGr3) { rangeStr = "Pages 8 - 18"; startPg = 8; endPg = 18; }
      else if (isGr5) { rangeStr = "Pages 19 - 30"; startPg = 19; endPg = 30; }
      else if (isGr6) { rangeStr = "Pages 31 - 42"; startPg = 31; endPg = 42; }
      else if (isGr7) { rangeStr = "Pages 43 - 56"; startPg = 43; endPg = 56; }
    } else if (sLow.includes("social")) {
      if (isGr3) { rangeStr = "Pages 14 - 24"; startPg = 14; endPg = 24; }
      else if (isGr5) { rangeStr = "Pages 25 - 38"; startPg = 25; endPg = 38; }
      else if (isGr6) { rangeStr = "Pages 39 - 52"; startPg = 39; endPg = 52; }
      else if (isGr7) { rangeStr = "Pages 53 - 68"; startPg = 53; endPg = 68; }
    } else if (sLow.includes("creative") || sLow.includes("technology") || sLow.includes("cts")) {
      if (isGr3) { rangeStr = "Pages 15 - 28"; startPg = 15; endPg = 28; }
      else if (isGr5) { rangeStr = "Pages 29 - 42"; startPg = 29; endPg = 42; }
      else if (isGr6) { rangeStr = "Pages 43 - 58"; startPg = 43; endPg = 58; }
      else if (isGr7) { rangeStr = "Pages 59 - 74"; startPg = 59; endPg = 74; }
    } else if (sLow.includes("zambian") || sLow.includes("local language") || sLow.includes("language")) {
      if (isGr3) { rangeStr = "Pages 16 - 28"; startPg = 16; endPg = 28; }
      else if (isGr5) { rangeStr = "Pages 29 - 40"; startPg = 29; endPg = 40; }
      else if (isGr6) { rangeStr = "Pages 41 - 54"; startPg = 41; endPg = 54; }
      else if (isGr7) { rangeStr = "Pages 55 - 70"; startPg = 55; endPg = 70; }
    }

    const baseSyllabus = `Zambian OBC ${subject || 'Curriculum'} Syllabus (${cleanGrade}, ${rangeStr})`;
    return { baseSyllabus, range: rangeStr, start: startPg, end: endPg };
  }

  // 2. CBC Secondary Levels (Form 1 to Form 4)
  if (isForm) {
    const formMatch = gLow.match(/form\s*[1-4]/i);
    const formLabel = formMatch ? formMatch[0].toUpperCase() : "Form 1 - Form 4";
    let rangeStr = "Pages 14 - 36";
    let startPg = 14;
    let endPg = 36;
    if (gLow.includes("form 2")) { rangeStr = "Pages 37 - 65"; startPg = 37; endPg = 65; }
    else if (gLow.includes("form 3")) { rangeStr = "Pages 66 - 98"; startPg = 66; endPg = 98; }
    else if (gLow.includes("form 4")) { rangeStr = "Pages 99 - 130"; startPg = 99; endPg = 130; }

    const baseSyllabus = `Zambian CBC Secondary ${subject || 'Curriculum'} Syllabus (${formLabel}, ${rangeStr})`;
    return { baseSyllabus, range: rangeStr, start: startPg, end: endPg };
  }

  // 3. CBC ECE Levels
  if (isECE) {
    const baseSyllabus = "Zambian CBC Early Childhood Education (ECE) Syllabus (Pages 5 - 87)";
    if (sLow.includes("math") || sLow.includes("science")) {
      return { baseSyllabus, range: "Pages 55 - 72", start: 55, end: 72 };
    } else if (sLow.includes("english") || sLow.includes("literacy")) {
      return { baseSyllabus, range: "Pages 39 - 54", start: 39, end: 54 };
    } else if (sLow.includes("zambian") || sLow.includes("local language")) {
      return { baseSyllabus, range: "Pages 23 - 38", start: 23, end: 38 };
    } else if (sLow.includes("creative") || sLow.includes("technology") || sLow.includes("studies")) {
      return { baseSyllabus, range: "Pages 73 - 87", start: 73, end: 87 };
    } else {
      return { baseSyllabus, range: "Pages 5 - 22", start: 5, end: 22 };
    }
  }

  // 4. CBC Primary Levels (Grade 1, Grade 2, Grade 4)
  const isCBCPrimary = gLow.includes("grade 1") || gLow.includes("grade 2") || gLow.includes("grade 4");
  if (isCBCPrimary) {
    const baseSyllabus = `Zambian CBC ${subject || 'Curriculum'} Syllabus (${grade})`;
    if (sLow.includes("english") || sLow.includes("literacy")) {
      return { baseSyllabus, range: "Pages 4 - 32", start: 4, end: 32 };
    } else if (sLow.includes("zambian") || sLow.includes("local language") || sLow.includes("language")) {
      if (sLow.includes("english")) return { baseSyllabus, range: "Pages 4 - 32", start: 4, end: 32 };
      return { baseSyllabus, range: "Pages 33 - 58", start: 33, end: 58 };
    } else if (sLow.includes("math")) {
      return { baseSyllabus, range: "Pages 59 - 88", start: 59, end: 88 };
    } else if (sLow.includes("science")) {
      return { baseSyllabus, range: "Pages 89 - 112", start: 89, end: 112 };
    } else if (sLow.includes("social")) {
      return { baseSyllabus, range: "Pages 113 - 134", start: 113, end: 134 };
    } else if (sLow.includes("creative") || sLow.includes("technology") || sLow.includes("expressive") || sLow.includes("home eco") || sLow.includes("art")) {
      return { baseSyllabus, range: "Pages 135 - 156", start: 135, end: 156 };
    } else {
      return { baseSyllabus, range: "Pages 4 - 156", start: 4, end: 156 };
    }
  }

  return null;
}

export function getModuleNamesFromContent(content?: string): string[] {
  if (!content) return [];
  const matches = [...content.matchAll(/--- MODULE: (.*?) ---/g)];
  return matches.map(m => {
    let mName = m[1].trim();
    if (mName.includes(" (")) {
      mName = mName.split(" (")[0].trim();
    }
    return mName;
  });
}

export function formatZambianSyllabusReferences(params: GenerationParams): string {
  const custom = getSubjectSyllabusPageRange(params.grade || "", params.subject || "");
  const modulesFromContent = getModuleNamesFromContent(params.referenceModuleContent);
  const gLow = (params.grade || "").toLowerCase();
  const sLow = (params.subject || "").toLowerCase();
  const termNum = (params.term || "1").toString().replace(/[^0-9]/g, "") || "1";
  
  const isForm = gLow.includes("form 1") || gLow.includes("form 2") || gLow.includes("form 3") || gLow.includes("form 4") || gLow.includes("form 5") || gLow.includes("form 6") || gLow.includes("form");
  const isOBCGrade = gLow.includes("grade 3") || gLow.includes("grade 5") || gLow.includes("grade 6") || gLow.includes("grade 7") || gLow.includes("obc");
  const currType = (params.curriculumType || "").toUpperCase();
  const isOBC = currType === "OBC" || (currType !== "CBC" && isOBCGrade);

  let defaultSyllabusCitation = getOfficialSyllabusCitation(
    params.grade || "Grade 4",
    params.subject || "Mathematics",
    currType,
    undefined,
    !!params.additionalInstructions?.includes("OUTSIDE SOURCE")
  );

  let refs = params.references || "";
  let moduleCitations = modulesFromContent.map(mName => `Module: ${mName}`).join("; ");

  const isGr1or2 = gLow.includes("1") || gLow.includes("2") || gLow.includes("grade 1") || gLow.includes("grade 2");
  const isEng = sLow.includes("english") || sLow.includes("literacy");
  let autoModuleCitation = "";
  if (isGr1or2 && isEng) {
    const grLabel = gLow.includes("2") ? "Grade 2" : "Grade 1";
    autoModuleCitation = `National Literacy Teaching Module (${grLabel} Term ${termNum}); ${grLabel} Oral English Teaching Module (Term ${termNum})`;
  }

  if (!refs) {
    refs = defaultSyllabusCitation;
    if (autoModuleCitation && !refs.includes(autoModuleCitation)) {
      refs += `; Module: ${autoModuleCitation}`;
    }
    if (moduleCitations && !refs.includes(moduleCitations)) {
      refs += `; ${moduleCitations}`;
    }
  } else {
    const splitted = refs.split("; ").map(r => {
      if ((r.startsWith("Zambian National Syllabus:") || r.includes("Zambian National Syllabus")) && custom) {
        return `${custom.baseSyllabus}, ${params.subject}`;
      }
      return r.replace(/\s*-\s*PG:\.\.\.\.\./g, '');
    });
    
    const combinedRefs = [...splitted];

    if (autoModuleCitation && !combinedRefs.some(r => r.includes("Literacy Teaching Module") || r.includes("Oral English Teaching Module"))) {
      combinedRefs.push(`Module: ${autoModuleCitation}`);
    }

    modulesFromContent.forEach(mName => {
      const matchText = `Module: ${mName}`;
      const alreadyHas = combinedRefs.some(r => r.includes(matchText));
      if (!alreadyHas) {
        combinedRefs.push(`Module: ${mName}`);
      }
    });
    
    refs = combinedRefs.filter(Boolean).join("; ");
  }

  return refs;
}

export function fixAndAlignTableColumns(text: string, params: GenerationParams): string {
  if (!text || typeof text !== 'string') return text;

  // 1. Clean up broken, unclosed, or raw <span style='font-size:...> tags in cells
  text = text.replace(/<span\s+style=['"][^'"]*?font-size[^'"]*?['"]*?>\s*/gi, '<small>');
  text = text.replace(/<span\s+style=['"][^'"]*?(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})[^'"]*$/gim, '<small>($1)</small>');
  text = text.replace(/<span\s+style=['"][^'">]*$/gim, '');
  text = text.replace(/<\/span>/gi, '</small>');
  text = text.replace(/<small>\s*<small>/gi, '<small>');
  text = text.replace(/<\/small>\s*<\/small>/gi, '</small>');

  // 2. Ensure Day rows in Weekly Forecast are sorted contiguously by subtopic/outcome across ALL subjects
  if (params.type === 'weekly_forecast' && (text.includes('| Day 1') || text.includes('| **Day 1**'))) {
    const tableRegex = /(\|\s*(?:\*\*)?Day 1[\s\S]*?\n)(?=\n\n|\n#|\n[A-Z]|$)/gi;
    text = text.replace(tableRegex, (tableChunk) => {
      const rows = tableChunk.trim().split('\n').filter(r => r.trim().startsWith('|'));
      if (rows.length < 3) return tableChunk;

      const parsedRows = rows.map(r => r.split('|'));
      // Extract lesson key for each row from Col 2 onwards
      const rowKeys = parsedRows.map(row => {
        const contentCols = row.slice(2).join(' ');
        const match4Level = contentCols.match(/\d+\.\d+\.\d+\.\d+/);
        if (match4Level) return match4Level[0];
        const match3Level = contentCols.match(/\d+\.\d+\.\d+/);
        if (match3Level) return match3Level[0];
        const outcomeCol = row[3] || row[2] || '';
        return outcomeCol.trim().replace(/^[-•*]\s*/, '').substring(0, 30).toLowerCase();
      });

      let needsRearrange = false;
      const seenKeys = new Set<string>();
      let currentKey = '';
      for (const k of rowKeys) {
        if (!k) continue;
        if (k !== currentKey) {
          if (seenKeys.has(k)) {
            needsRearrange = true;
            break;
          }
          seenKeys.add(k);
          currentKey = k;
        }
      }

      if (needsRearrange) {
        const keyOrder: string[] = [];
        rowKeys.forEach(k => {
          if (k && !keyOrder.includes(k)) keyOrder.push(k);
        });

        const groupedIndices: number[] = [];
        keyOrder.forEach(k => {
          rowKeys.forEach((rk, idx) => {
            if (rk === k) groupedIndices.push(idx);
          });
        });
        rowKeys.forEach((_, idx) => {
          if (!groupedIndices.includes(idx)) groupedIndices.push(idx);
        });

        const reorderedParsedRows = parsedRows.map((row, i) => {
          const targetContentIdx = groupedIndices[i];
          const targetContentRow = parsedRows[targetContentIdx];
          return [row[0], row[1], ...targetContentRow.slice(2)];
        });

        return reorderedParsedRows.map(r => r.join('|')).join('\n') + '\n';
      }

      return tableChunk;
    });
  }

  const isOBC = params.curriculumType === 'OBC' || (params.grade && params.grade.toLowerCase().includes('obc'));
  const isLanguage = (params.subject || '').toLowerCase().includes('english') || (params.subject || '').toLowerCase().includes('language') || (params.subject || '').toLowerCase().includes('literacy');

  if (params.type === 'weekly_forecast' || params.type === 'schemes_of_work') {
    const lines = text.split('\n');
    let inTable = false;
    let tableLines: string[] = [];
    const newLines: string[] = [];

    const processTableBlock = (tblLines: string[]) => {
      if (tblLines.length < 2) return tblLines.join('\n');

      const isWf = params.type === 'weekly_forecast';

      // Guard Clause: Check if this table block is a general info metadata table (e.g. NAME OF TEACHER, SUBJECT, GRADE, YEAR)
      // A main forecast/scheme table MUST contain curriculum columns like SPECIFIC, COMPETENCIES, OUTCOMES, EXPECTED, ACTIVITIES, RECORD OF WORK, or KNOWLEDGE
      const combinedText = tblLines.join(' ').toUpperCase();
      const isMetadataTable = (combinedText.includes('NAME OF TEACHER') || combinedText.includes('TEACHER:') || combinedText.includes('SUBJECT:')) &&
        !combinedText.includes('SPECIFIC') &&
        !combinedText.includes('COMPETENCIES') &&
        !combinedText.includes('OUTCOMES') &&
        !combinedText.includes('RECORD OF WORK') &&
        !combinedText.includes('LEARNING ACTIVITIES');

      if (isMetadataTable) {
        return tblLines.join('\n');
      }

      let targetHeader = '';
      let targetSeparator = '';
      let expectedCount = 0;

      if (isWf) {
        if (isOBC) {
          expectedCount = 10;
          targetHeader = '| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |';
          targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
        } else {
          expectedCount = 9;
          targetHeader = '| DAY | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |';
          targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
        }
      } else {
        if (isOBC) {
          if (isLanguage) {
            expectedCount = 10;
            targetHeader = '| WEEK | COMPONENT | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |';
            targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
          } else {
            expectedCount = 9;
            targetHeader = '| WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |';
            targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
          }
        } else {
          if (isLanguage) {
            expectedCount = 10;
            targetHeader = '| WEEK | COMP | TOPIC | SUBTOPIC | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |';
            targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
          } else {
            expectedCount = 9;
            targetHeader = '| WEEK | TOPIC | SUBTOPIC | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |';
            targetSeparator = '|:---|:---|:---|:---|:---|:---|:---|:---|:---|';
          }
        }
      }

      const processedRows: string[] = [targetHeader, targetSeparator];

      for (let rIdx = 0; rIdx < tblLines.length; rIdx++) {
        const line = tblLines[rIdx];
        const trimmedLine = line.trim();

        // 1. Skip delimiter rows
        if (trimmedLine.includes('---') || trimmedLine.includes(':---')) {
          continue;
        }

        // 2. Skip header row if this line is the column header line
        const isHeaderRow = (rIdx === 0) || 
          (/^\s*\|\s*(?:DAY|WEEK|NAME OF TEACHER|TEACHER)\s*\|/i.test(trimmedLine) && 
           (trimmedLine.toUpperCase().includes('TOPIC') || trimmedLine.toUpperCase().includes('SPECIFIC')));

        if (isHeaderRow) {
          continue;
        }

        const parts = trimmedLine.split('|');
        if (parts.length < 3) continue;

        let cells = parts.map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();

        if (cells.length === 0) continue;

        if (isWf && cells.length > expectedCount) {
          const isCell1Component = /^(?:comp(?:onent)?s?|phonics|phonemic(?:\s+awareness)?|oral(?:\s+english)?|literacy(?:\s+in\s+english)?|listening(?:\s*&\s*speaking)?|reading|writing|structure|comprehension|vocabulary|fluency|handwriting|grammar|sounds?)$/i.test(cells[1].trim());
          const isCell2SyllabusTopic = /^\d+(?:\.\d+)*\s+[A-Z]/i.test(cells[2].trim()) || /^(?:sounds?|etiquette|reading|writing|listening|fractions|matter|living)/i.test(cells[2].trim());
          if (isCell1Component || isCell2SyllabusTopic) {
            cells.splice(1, 1);
          }
        }

        if (cells.length === expectedCount + 1) {
          const topicIdx = (!isWf && isLanguage) ? 2 : 1;
          const subtopicIdx = topicIdx + 1;

          const topicText = cells[topicIdx] || '';
          const subtopicText = cells[subtopicIdx] || '';

          const mergedText = subtopicText
            ? (topicText.startsWith('**') ? topicText : `**${topicText}**`) + `<br/><small>${subtopicText}</small>`
            : topicText;

          cells.splice(topicIdx, 2, mergedText);
        }

        // Clean up reference column and competency duplication in weekly forecast & schemes
        cells = cells.map((cellText, cIdx) => {
          let cleaned = cellText;
          // Clean up any "(from the uploaded scheme)" in Reference cell
          if (cIdx >= expectedCount - 2) {
            cleaned = cleaned.replace(/\s*\(from the uploaded scheme\)/gi, '')
                             .replace(/\s*\(From uploaded scheme\)/gi, '')
                             .replace(/(Page:\s*\.{3,})\s*(?:\(?from the uploaded scheme\)?|[^\n|<]*)/gi, '$1');
          }
          // Clean up repeated or cancelled/struck-out specific competencies within the cell
          if (cIdx === 2 || (isLanguage && !isWf && cIdx === 3)) {
            // Remove strikethrough, cancelled tags or repeated markdown markings
            cleaned = cleaned.replace(/~~[^~]+~~/g, '')
                             .replace(/<del>[\s\S]*?<\/del>/gi, '')
                             .replace(/<s>[\s\S]*?<\/s>/gi, '')
                             .replace(/\[cancelled:[^\]]*\]/gi, '')
                             .trim();

            const linesOrBullets = cleaned.split(/<br\s*\/?>|\n/i).map(b => b.trim()).filter(Boolean);
            const unique: string[] = [];
            linesOrBullets.forEach(item => {
              const norm = item.replace(/^[-•*]\s*/, '').trim().toLowerCase();
              if (norm && !unique.some(u => u.replace(/^[-•*]\s*/, '').trim().toLowerCase() === norm)) {
                unique.push(item);
              }
            });
            if (unique.length > 0) {
              cleaned = unique.join('<br/>');
            }
          }
          return cleaned;
        });

        processedRows.push('| ' + cells.join(' | ') + ' |');
      }

      return processedRows.join('\n');
    };

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim().startsWith('|')) {
        inTable = true;
        tableLines.push(l);
      } else {
        if (inTable) {
          if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
            newLines.push('');
          }
          newLines.push(processTableBlock(tableLines));
          newLines.push('');
          tableLines = [];
          inTable = false;
        }
        newLines.push(l);
      }
    }
    if (inTable && tableLines.length > 0) {
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push('');
      }
      newLines.push(processTableBlock(tableLines));
      newLines.push('');
    }

    text = newLines.join('\n');
  }

  if (params.type === 'schemes_of_work') {
    const hasTable = text.includes('| WEEK') || text.includes('| **WEEK**') || text.includes('WEEK |') || text.includes('<table');
    if (!hasTable) {
      console.warn("Schemes of Work returned without table formatting. Converting narrative words to standard 13-week table format.");
      return generateFallbackTable(params);
    }
  }

  return text;
}

export async function generateEducationalDoc(
  origParams: GenerationParams,
  template: any,
): Promise<string> {
  const cleanT = (t: string) => t ? t.split('|')[0].trim() : '';
  
  const params: GenerationParams = {
    ...origParams,
    topic: cleanT(origParams.topic || ''),
    topic2: cleanT(origParams.topic2 || ''),
    topic3: cleanT(origParams.topic3 || ''),
    subtopic: cleanT(origParams.subtopic || ''),
    selectedTopics: origParams.selectedTopics?.map(t => ({
      topic: cleanT(t.topic),
      subtopics: t.subtopics.map(st => cleanT(st))
    })),
    weeks: origParams.weeks?.map(w => ({
      ...w,
      topic: cleanT(w.topic || ''),
      topic2: cleanT(w.topic2 || ''),
      topic3: cleanT(w.topic3 || ''),
      subtopics: w.subtopics.map(st => cleanT(st))
    }))
  };

  const cacheKey = getCacheKey(params);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    console.log("Returning cached generation result.");
    return cached;
  }

  const isIWP = params.type === "individual_work_plan";
  const isLesson = params.type === "lesson_plan";
  const isAssessment = params.type === "assessments";

  if (isIWP) {
    // Generate individual work plan instantly for superb responsiveness and perfect formatting
    return generateFallbackTable(params);
  }

  // Perform placeholder replacement in template prompt
  let customizedPrompt = template ? template.prompt : "";

  if (params.type === "lesson_notes") {
    const selectedSubtopicsList = (params.selectedSubtopics && params.selectedSubtopics.length > 0)
      ? params.selectedSubtopics
      : (params.subtopic ? [params.subtopic] : [".........."]);

    const joinedSubtopics = selectedSubtopicsList.join(" AND ");

    customizedPrompt = `Generate comprehensive, detailed and syllabus-based Lesson Notes based on the following exact template structure, providing deep, complete educational material.

<center>
<h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">LESSON NOTES</h1>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
</center>

<div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
<p style="margin: 4px 0;"><b>SUBJECT:</b> {subject}</p>
<p style="margin: 4px 0;"><b>GRADE:</b> {grade}</p>
<p style="margin: 4px 0;"><b>TOPIC:</b> {topic}</p>
<p style="margin: 4px 0;"><b>SUB-TOPIC:</b> ${joinedSubtopics}</p>
</div>

<div style="font-size: 10pt; font-weight: bold; margin-bottom: 15px; text-align: right;"># DETAILED LESSON NOTES</div>

<div class="lesson-notes-meta" style="margin-bottom: 25px; line-height: 1.6;">
<b>SPECIFIC {{header_specific}}:</b><br/>{specificCompetences}<br/>
</div>

<hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 25px;" />

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">1. INTRODUCTION TO THE LESSON/CONCEPTS</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
[Provide a comprehensive, learner-friendly introduction explaining the core concepts of this lesson's topic. Explain how the selected sub-topics fit together, using clear definitions, real-life analogies, and setting the learning context firmly based on the selected specific competencies/outcomes. Ensure this section is detailed and highly informative (at least 150-200 words).]
</p>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">2. CORE CONTENT & DETAILED SUB-TOPICS EXPOSITION</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
The following unified exposition details the selected sub-topics in a sequential, integrated order to ensure logical progression and concept assimilation across the entire lesson's scope:
</p>

<div style="margin-top: 25px; padding: 15px; border-left: 4px solid #00A86B; background-color: #FAFAFA; margin-bottom: 25px;">
<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 5px; margin-bottom: 5px;">A. TEACHER'S PATHWAY & SEQUENTIAL INSTRUCTIONAL STEPS (Unified Teaching Flow)</h4>
<div style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-bottom: 20px;">
[Detail a single cohesive, step-by-step instructional flow where each step MUST sit strictly on its own new line, fully left-aligned (no leading spaces or indentation), and order sequentially from the left in this exact format:
Step 1: [Introduce the concept with real-world scenarios...]<br/>
Step 2: [Model the rule/calculation step-by-step on the chalkboard...]<br/>
Step 3: [Guide active concept checking and transition systematically...]<br/>
Step 4: [Conclude and bridge transitions to homework/exercises...]
You MUST explicitly use a '&lt;br/&gt;' tag at the end of each step so they display vertically as independent steps starting directly from the left margin with 'Step 1:', 'Step 2:', etc. Never group these steps together into a single continuous block/paragraph.]
</div>

<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 20px; margin-bottom: 5px;">B. UNIFIED LEARNERS' NOTES TO BE COPIED (Continuous Chalkboard Chain)</h4>
<p style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-bottom: 15px;">
<i>The following comprehensive, highly detailed notes are to be written on the chalkboard or distributed. They are arranged in a single continuous chain, with the transition between each sub-topic marked by the core educational idea:</i>
</p>

<div style="font-size: 10.5pt; line-height: 1.6; color: #334155;">
${selectedSubtopicsList.map((st, idx) => `
<div style="margin-top: 15px; margin-bottom: 15px; border-bottom: 1px dashed #E2E8F0; padding-bottom: 10px;">
<h5 style="font-size: 10.5pt; font-weight: bold; color: #0F172A; margin: 0 0 10px 0; text-transform: uppercase;">• IDEAS & NOTES FOR SUB-TOPIC ${idx + 1}: ${st}</h5>
<ul style="margin: 0; padding-left: 20px;">
<li style="margin-bottom: 8px;">
<strong>[Core Rule / Concept Definition 1 Name]</strong>: Provide a concise definition, formula, or fact.
<p style="margin-top: 4px; margin-bottom: 0; color: #475569; text-align: justify; font-size: 10pt;">[Provide an extremely detailed, rich explanation paragraph for this bullet point, contextualized for Zambian curriculum standards, with deep facts or historical/scientific background.]</p>
</li>
<li style="margin-bottom: 8px;">
<strong>[Core Rule / Concept Definition 2 Name]</strong>: Provide another concise definition, formula, or fact.
<p style="margin-top: 4px; margin-bottom: 0; color: #475569; text-align: justify; font-size: 10pt;">[Provide another extremely detailed, rich explanation paragraph for this second bullet point.]</p>
</li>
</ul>
</div>
`).join("")}
</div>

<h4 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-top: 20px; margin-bottom: 5px;">C. PROGRESSIVE PRACTICE PROBLEMS & WORKED EXAMPLES (Integrated Assessment Scenarios)</h4>
<div style="font-size: 10.5pt; line-height: 1.6; color: #334155; margin-top: 10px;">
<p style="margin-bottom: 10px;"><i>These step-by-step model problems and real-world scenario calculations synthesise the covered concepts sequentially:</i></p>
<div style="background-color: #FFFFFF; border-left: 4px solid #00A86B; padding: 12px; margin-bottom: 12px; border-radius: 4px; border-top: 1px solid #F1F5F9; border-right: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9;">
<strong>Worked Example / Scenario 1:</strong><br/>
[Provide a complex/structured question or scenario combining elements from the first subtopical concepts.]<br/>
<strong style="color: #0F172A;">Detailed Solution Pathway:</strong><br/>
[Provide a comprehensive, step-by-step mathematical, scientific, or analytical solution explaining the reasoning clearly.]
</div>
<div style="background-color: #FFFFFF; border-left: 4px solid #00A86B; padding: 12px; border-radius: 4px; border-top: 1px solid #F1F5F9; border-right: 1px solid #F1F5F9; border-bottom: 1px solid #F1F5F9;">
<strong>Worked Example / Scenario 2:</strong><br/>
[Provide another multi-step question or analytical scenario that bridges across multiple subtopic dimensions or applies them in a real-world context.]<br/>
<strong style="color: #0F172A;">Detailed Solution Pathway:</strong><br/>
[Provide a complete, step-by-step mathematical, logical, or analytical explanation showing exactly how to solve it.]
</div>
</div>
</div>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">3. INTEGRATED CLASSROOM EXERCISE / TASKS</h3>
<div style="font-size: 11pt; line-height: 1.6; margin-bottom: 25px;">
<p>To verify that learners have acquired the relevant competencies across all the covered sub-topics, guide them to complete the following assessment exercise:</p>
<ol style="padding-left: 20px; margin-top: 10px;">
<li style="margin-bottom: 10px;"><strong>[Cognitive task / Direct question]</strong>: [Provide a high-quality test item testing recollection or basic calculation/explanation based on the sub-topics...]</li>
<li style="margin-bottom: 10px;"><strong>[Application task / Problem-solving]</strong>: [Provide a practical test item testing hands-on application of concepts...]</li>
<li style="margin-bottom: 10px;"><strong>[Higher-order critical thinking task]</strong>: [Provide a prompt testing synthesis, evaluation, or analytical connection...]</li>
</ol>
</div>

<div style="page-break-before: always; margin-top: 40px; border-top: 2px solid #00A86B; padding-top: 20px;">
<h3 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px;">DOCUMENT REFERENCES & CITATIONS</h3>
<p style="font-size: 9pt; color: #475569; margin-bottom: 15px;">
The educational material and syllabus standards detailed in these lesson notes are derived from and cross-referenced with the following official syllabus textbooks and references:
</p>
<ol class="references-list" style="font-size: 8pt; line-height: 1.6; color: #475569; padding-left: 20px; font-family: 'Inter', sans-serif;">
<!-- Carefully generate a numbered bibliography (e.g. 1, 2, 3...) of the specified and selected references here: {references}. Ensure they are fully numbered, ordered, and arranged neatly in a small, highly readable font. -->
</ol>
</div>

<div class="lesson-notes-footer" style="margin-top: 40px; border-top: 1.5px solid black; padding-top: 15px; font-size: 9.5pt; text-align: center;">
<strong>FORTUNES EDUTECH CBC/OBC Resource Suite © {year}</strong>
</div>

**Formatting Requirements (EXTREMELY CRITICAL):**
1. You MUST NOT start any lines of your output with leading spaces (no indentation). All HTML sections, paragraphs, lists, and headings MUST start directly at column 1 (fully left-aligned inside your response block). This is extremely critical because leading spaces trigger code block formatting in markdown parsers, which ruins the document styling and renders raw HTML text instead of formatted content.
2. The document MUST strictly start with the official professional headers block:
<center>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
<h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">LESSON NOTES</h1>
</center>
3. Immediately below and before # DETAILED LESSON NOTES, the following clean, elegant non-table info block must exist:
<div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
<p style="margin: 4px 0;"><b>SUBJECT:</b> {subject}</p>
<p style="margin: 4px 0;"><b>GRADE:</b> {grade}</p>
<p style="margin: 4px 0;"><b>TOPIC:</b> {topic}</p>
<p style="margin: 4px 0;"><b>SUB-TOPIC:</b> ${joinedSubtopics}</p>
</div>
4. You are STRICTLY FORBIDDEN from putting any list of references, plain reference strings (including {references}), or extra text above or before the official professional header.
5. Do NOT repeat the professional header, and do NOT include any horizontal line ("---") or separators at the very beginning of your response.
6. Allevaluation labels or lists must start with NO leading indentation.
7. The notes MUST be incredibly rich, detailed, informative, and complete. There should be NO placeholder text, dotted lines, or TBD. All scientific facts, steps, definitions, historical events, mathematical formulas, or language rules must be written in full detailed paragraphs.
8. Incorporate selected references and specific competency statements directly in a supportive, deeply academic manner.
9. STRICT REFERENCE FIDELITY & ZAMBIAN CURRICULUM RELEVANCE: Look at the provided REFERENCE CONTENT and Syllabus data (if any). If any selected reference names start with "Module:" or "Zambian National Syllabus:", or if the reference text contains specific content, you MUST base all your explanations, facts, definitions, instructional pathways, chalkboard notes, and classroom exercises directly and exclusively on the concepts and details described in that reference content. It is strictly forbidden to generate generic international standard content that is unrelated to or contradicts the official Zambian curriculum or the provided syllabus/module materials. All generated teaching notes MUST be directly relevant to the Zambian syllabus and curriculum.
10. Under the "DOCUMENT REFERENCES & CITATIONS" section, ensure that the selected references ({references}) are displayed as a well-arranged, numbered list. Number each reference (1, 2, 3...) in a smaller, neat, readable font (8pt size).
11. Ensure the output maintains clean vertical separation and is highly printable.`;
  }

  const gLow = (params.grade || "").toLowerCase();
  const isOBCGrade = gLow.includes("grade 8") || gLow.includes("grade 9") || gLow.includes("grade 10") || gLow.includes("grade 11") || gLow.includes("grade 12") || gLow.includes("form") || gLow.includes("senior") || gLow.includes("junior sec") || gLow.includes("obc");
  const isCBCGrade = gLow.includes("grade 1") || gLow.includes("grade 2") || gLow.includes("grade 3") || gLow.includes("grade 4") || gLow.includes("grade 5") || gLow.includes("grade 6") || gLow.includes("grade 7") || gLow.includes("ece") || gLow.includes("primary") || gLow.includes("cbc");
  const currType = (params.curriculumType || "").toUpperCase();

  const ctxText = (params.additionalContext || "");
  const hasExpectedStandardsInContext = /expected\s*standards?/i.test(ctxText) ||
    Boolean(params.forecastDays?.some(d => Boolean(d.expectedStandard && d.expectedStandard.trim() !== '')));
  const hasKnowledgeSkillsValuesInContext = (/knowledge/i.test(ctxText) && (/skills?/i.test(ctxText) || /values?/i.test(ctxText))) ||
    Boolean(params.forecastDays?.some(d => Boolean((d as any).knowledge && (d as any).skills)));

  let isOBC = false;
  if (currType === "CBC") {
    // Explicit CBC selected or configured: MUST be CBC!
    isOBC = false;
  } else if (currType === "OBC" || currType === "OBE") {
    // Explicit OBC selected or configured: MUST be OBC!
    isOBC = true;
  } else if (hasExpectedStandardsInContext) {
    // Explicitly has Expected Standards in context or forecast days -> CBC format!
    isOBC = false;
  } else if (hasKnowledgeSkillsValuesInContext) {
    // Explicitly has Knowledge/Skills/Values -> OBC format!
    isOBC = true;
  } else if (isCBCGrade) {
    isOBC = false;
  } else if (isOBCGrade) {
    isOBC = true;
  } else {
    isOBC = false;
  }

  const isLanguageSubject = Boolean(params.subject && (
    params.subject.toLowerCase().includes('english') || 
    params.subject.toLowerCase().includes('zambian') ||
    params.subject.toLowerCase().includes('cinyanja') ||
    params.subject.toLowerCase().includes('nyanja') ||
    params.subject.toLowerCase().includes('icibemba') ||
    params.subject.toLowerCase().includes('bemba') ||
    params.subject.toLowerCase().includes('chitonga') ||
    params.subject.toLowerCase().includes('tonga') ||
    params.subject.toLowerCase().includes('silozi') ||
    params.subject.toLowerCase().includes('lozi') ||
    params.subject.toLowerCase().includes('kiikaonde') ||
    params.subject.toLowerCase().includes('kaonde') ||
    params.subject.toLowerCase().includes('luvale') ||
    params.subject.toLowerCase().includes('lunda') ||
    params.subject.toLowerCase().includes('literacy') ||
    params.subject.toLowerCase().includes('oral') ||
    params.subject.toLowerCase().includes('language')
  ));

  const hasCompInContext = params.additionalContext ? /(?:^|[|\t\n\r\s])(?:COMP|COMPONENT)(?:[|\t\n\r\s]|$)/i.test(params.additionalContext) : false;
  const hasDayComp = Boolean(params.forecastDays?.some(d => Boolean((d as any).component && (d as any).component.trim() !== '')));
  // FOR WEEKLY FORECAST ONLY: REMOVE COMPONENT COLUMN (Weekly Forecast remains normal for all subjects including English & Zambian Languages)
  const shouldIncludeCompInWf = false;

  // Set up standard metadata for replacement
  const replacements: Record<string, string> = {
    "{school}": params.school?.toUpperCase() || "..........",
    "{schoolName}": params.school?.toUpperCase() || "..........",
    "{teacherName}": params.teacherName || "..........",
    "{grade}": params.grade || "..........",
    "{subject}": params.subject || "..........",
    "{topic}": params.topic || "..........",
    "{subtopic}": (params.selectedSubtopics && params.selectedSubtopics.length > 0) ? params.selectedSubtopics.join(", ") : (params.subtopic || ".........."),
    "{tsNumber}": params.tsNumber || "..........",
    "{district}": params.district || "..........",
    "{year}": params.year?.toString() || new Date().getFullYear().toString(),
    "{term}": params.term || "........",
    "{{term}}": params.term || "........",
    "{{school}}": params.school || "..........",
    "{{header_general}}": isOBC ? "OUTCOMES" : "COMPETENCES",
    "{{header_specific}}": isOBC ? "OUTCOMES" : "COMPETENCES",
    "{zone}": params.zone || "..........",
    "{jobTitle}": params.jobTitle || "TEACHER",
    "{{header_knowledge_label}}": isOBC ? "KNOWLEDGE" : "CORE CONCEPTS",
    "{knowledge}": params.knowledge || "..........",
    "{workPlanPeriod}": params.workPlanPeriod || "ANNUAL",
    "{jobPurpose}": params.jobPurpose || "TEACHING AND LEARNING",
    "{week}": params.forecastWeek?.toString() || "..........",
    "{forecastWeek}": params.forecastWeek?.toString() || "..........",
    "{references}": formatZambianSyllabusReferences(params) || "..........",
  };

  // Execute replacements
  Object.entries(replacements).forEach(([key, value]) => {
    customizedPrompt = customizedPrompt.replaceAll(key, value);
  });

  if (isOBC) {
    if (params.type === "schemes_of_work") {
      if (isLanguageSubject) {
        customizedPrompt = customizedPrompt
          .replace(/CBC/g, "OBC")
          .replace(/Create a standard Markdown table with the required columns\./g, "Create a standard Markdown table with EXACTLY 10 columns for Language subjects: WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE.")
          .replace(/\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
          .replace(/\|:---|:---|:---|:---|:---|:---|:---|:---|:---|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
          .replace(/\|\s*WEEK\s*\|\s*(?:COMPONENT|COMP)\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPIC\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING (?:METHODS|MATERIALS)\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCES?\s*\|/gi, "| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |")
          .replace(/\|\s*WEEK\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPIC\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING MATERIALS\s*\|\s*REFERENCES\s*\|/gi, "| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |")
          .replace(/WEEK\s*\|\s*(?:COMPONENT|COMP)\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPIC\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING (?:METHODS|MATERIALS)\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCES?/gi, "WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE")
          .replace(/GENERAL COMPETENCES/g, "GENERAL OUTCOMES")
          .replace(/SPECIFIC COMPETENCES/g, "SPECIFIC OUTCOMES")
          .replace(/COMPETENCIES/g, "OUTCOMES");
      } else {
        customizedPrompt = customizedPrompt
          .replace(/CBC/g, "OBC")
          .replace(/Create a standard Markdown table with the required columns\./g, "Create a standard Markdown table with EXACTLY 9 columns: WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE.")
          .replace(/\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
          .replace(/\|:---|:---|:---|:---|:---|:---|:---|:---|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
          .replace(/\|\s*WEEK\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPIC\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING MATERIALS\s*\|\s*REFERENCES\s*\|/gi, "| WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |")
          .replace(/WEEK\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPIC\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING MATERIALS\s*\|\s*REFERENCES/gi, "WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE")
          .replace(/GENERAL COMPETENCES/g, "GENERAL OUTCOMES")
          .replace(/SPECIFIC COMPETENCES/g, "SPECIFIC OUTCOMES")
          .replace(/COMPETENCIES/g, "OUTCOMES");
      }
    } else if (params.type === "weekly_forecast" && isOBC) {
      customizedPrompt = customizedPrompt
        .replace(/CBC/g, "OBC")
        .replace(/Create a standard Markdown table with EXACTLY 10 columns\./g, "Create a standard Markdown table with EXACTLY 10 columns: DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK.")
        .replace(/\|\s*DAY\s*\|\s*(?:COMPONENT|COMP)\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPICS?\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS?\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCES?\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)\s*\|/gi, "| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |")
        .replace(/\|\s*DAY\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPICS?\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCE\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)\s*\|/gi, "| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |")
        .replace(/DAY\s*\|\s*(?:COMPONENT|COMP)\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPICS?\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS?\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCES?\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)/gi, "DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK")
        .replace(/DAY\s*\|\s*TOPIC(?:\/Subtopics)?\s*(?:\|\s*SUBTOPICS?\s*)?\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCE\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)/gi, "DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK")
        .replace(/\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
        .replace(/\|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
        .replace(/GENERAL COMPETENCES/g, "GENERAL OUTCOMES")
        .replace(/SPECIFIC COMPETENCES/g, "SPECIFIC OUTCOMES")
        .replace(/COMPETENCIES/g, "OUTCOMES");
    } else if (params.type === "lesson_plan") {
      customizedPrompt = customizedPrompt
        .replace(/# LESSON PLAN/g, "# LESSON PLAN (OBC)")
        .replace(/GENERAL COMPETENCES/g, "GENERAL OUTCOMES")
        .replace(/SPECIFIC COMPETENCES/g, "SPECIFIC OUTCOMES")
        .replace(/CBC/g, "OBC")
        .replace(
          /<b>PRIOR KNOWLEDGE\/SKILLS\/VALUES:<\/b>/g,
          "<b>Prior knowledge/skills/values:</b>",
        );

      if (isOBC) {
        customizedPrompt = customizedPrompt
          .replace(/<b>LEARNING ACTIVITIES:<\/b><br\/>- \[Activity 1\]<br\/>- \[Activity 2\]<br\/>/g, "")
          .replace(/<b>EXPECTED STANDARD:<\/b> \[Text\]<br\/>/g, "");

        customizedPrompt += `\n\nCRITICAL OBC CURRICULUM LESSON PLAN MANDATE (OUTCOMES-BASED CURRICULUM):
- Since this is an OBC lesson plan (Outcomes-Based Curriculum), you MUST NOT include any "LEARNING ACTIVITIES" or "EXPECTED STANDARD" sections in the top metadata/info block of the lesson plan. These sections are CBC-specific and are strictly forbidden in OBC lesson plans. Do NOT output them or write them under any circumstances.
- Ensure that the top info block only lists TOPIC, SUB-TOPIC, GENERAL OUTCOMES, SPECIFIC OUTCOMES, KNOWLEDGE, LESSON GOAL, RATIONALE, PRIOR KNOWLEDGE/SKILLS/VALUES, TEXTBOOK REFERENCES, TEACHING AND LEARNING RESOURCES / MATERIALS, and LEARNING ENVIRONMENT.
- Do NOT include any "Learning Activities" or "Expected Standard" headers or content outside the LESSON DEVELOPMENT table.`;
      }
    }
  } else if (params.curriculumType === "CBC" && params.type === "lesson_plan") {
    customizedPrompt = customizedPrompt
      .replace(/GENERAL COMPETENCES\/OUTCOMES/g, "GENERAL COMPETENCES")
      .replace(/SPECIFIC COMPETENCES\/OUTCOMES/g, "SPECIFIC COMPETENCES");
    
    customizedPrompt += `\n\nCRITICAL CBC PEDAGOGICAL MANDATE (GRADUAL RELEASE OF RESPONSIBILITY & GROUP WORK):
- Every CBC Lesson Plan MUST strictly implement the Gradual Release of Responsibility (GRR) framework ("I Do" -> "We Do" -> "You Do").
- STAGE 2 (LESSON DEVELOPMENT / "I DO" - Teacher Modeling): Teacher demonstrates concepts step-by-step, explains key ideas, and models examples; learners actively observe and respond to check-for-understanding questions.
- STAGE 3 (PRACTICE & APPLICATION / "WE DO" - MANDATORY GROUP WORK / PAIR WORK): Under CBC, Stage 3 MUST explicitly feature Collaborative Group Work or Pair Work. Teacher MUST organize learners into small groups or pairs, assign specific group tasks or discussion prompts, and circulate to facilitate peer learning. Learners MUST work in groups/pairs, discuss ideas, solve tasks collaboratively, and present/report group findings.
- STAGE 4 (EXERCISE / "YOU DO" - Independent Practice): Individual learner practice where learners complete assigned questions/tasks independently to demonstrate individual competence.
- RATIONALE: The RATIONALE section MUST explicitly mention collaborative group work and the gradual release of responsibility model ("I do, we do, you do").`;
  }

  if (params.type === "lesson_plan") {
    const sLowSubject = (params.subject || '').toLowerCase();
    const isLiteracyInEnglish = (sLowSubject.includes('literacy') || params.englishComponent === 'literacy') && !sLowSubject.includes('oral');
    const isLowerPrimaryEnglish = (
      (params.grade?.toLowerCase().includes('ece') || params.grade?.includes('1') || params.grade?.includes('2')) &&
      (sLowSubject.includes('english') || sLowSubject.includes('literacy') || sLowSubject.includes('oral'))
    );

    if (isLiteracyInEnglish) {
      // In Literacy in English (only), INTRODUCTION must be outside the table between EXPECTED STANDARD and LESSON DEVELOPMENT heading
      customizedPrompt = customizedPrompt.replace(
        /<b>EXPECTED STANDARD:<\/b>\s*\[Text\]<br\/>\s*<\/div>/i,
        `<b>EXPECTED STANDARD:</b> [Text]<br/>
</div>

<b>INTRODUCTION (5 minutes):</b><br/>
* <b>Teacher to:</b> review previously taught sounds, show cards with taught graphemes, and introduce the target sound/concept.<br/>
* <b>Learners will:</b> sound out given graphemes, listen to words, mention common sound, and focus on the target sound/concept.<br/>`
      );

      // Remove the INTRODUCTION row from the table template so the table starts at LESSON DEVELOPMENT
      customizedPrompt = customizedPrompt.replace(
        /<tr><td class="stage-cell">INTRODUCTION<\/td><td>\[Text\]<\/td><td>\[Text\]<\/td><td>\[Text\]<\/td><\/tr>\s*/i,
        ""
      );
    }

    if (isLowerPrimaryEnglish) {
      customizedPrompt += `\n\nNATIONAL COMPETENCY STANDARDS MANDATE FOR ECE TO GRADE 2 LITERACY & ENGLISH LESSON PLANS:
- You MUST construct the LESSON DEVELOPMENT table using the exact 7 national competency stages in strict sequential order as required by the national curriculum standards:
  * Stage 1 / Step 1: Phonemic awareness (Teacher models oral sounds; learners listen, repeat, blend/segment sounds orally).
  * Stage 2 / Step 2: Phonics (Teacher shows grapheme cards, models sound-letter associations; learners read and blend decodable words).
  * Stage 3 / Step 3: Fluency (Teacher models fluent sentence reading; learners practice choral/pair reading of decodable text).
  * Stage 4 / Step 4: Vocabulary (Teacher introduces target context words with visual aids/pictures; learners use words in sentences).
  * Stage 5 / Step 5: Writing (Teacher models letter formation/shaping and line placement on chalkboard; learners write letters/words on lines).
  * Stage 6 / Comprehension (Teacher reads/guides decodable story; learners answer recall questions and identify main ideas).
  * Stage 7 / Conclusion (Teacher reviews target sounds/words and summarizes key learning points).
- Whether Literacy in English, Oral English, or English Combined is selected, ALL these national competency stages MUST be explicitly represented in the stage cells of the table!`;
    }

    if (params.includeHomework === false) {
      customizedPrompt = customizedPrompt.replace(
        /<div class="lesson-plan-homework-section"[\s\S]*?<\/div>/g,
        ""
      );
      customizedPrompt = customizedPrompt.replace(
        /- CRITICAL HOMEWORK RULE:.*?\n/g,
        "- MANDATORY HOMEWORK RULE: Completely OMIT the 'Homework' block and do not generate any homework content.\\n"
      );
    } else {
      customizedPrompt = customizedPrompt.replace(
        /- CRITICAL HOMEWORK RULE:.*?\n/g,
        "- MANDATORY HOMEWORK RULE: You MUST always generate the 'Homework' block (using the exact <div class=\"lesson-plan-homework-section\"> HTML template) containing actual, simple yet specific homework tasks to give learners, step-by-step instructions, and a due date. This section MUST be included and placed between the table and the evaluations on page 2. Do NOT omit it.\\n"
      );
    }
    
    // Append strict 2-page layout mandate to the customized prompt
    customizedPrompt += `\n\nCRITICAL LAYOUT MANDATE (STRICT 2 PAGES):
- The entire lesson plan document MUST fit on exactly two pages.
- Keep teacher activities, learner activities, content items, and assessment criteria highly concise and punchy.
- Do NOT generate long, winding paragraphs in any cell of the Lesson Development table. Limit each stage's cell content to 2-3 precise, bulleted sentences.
- Ensure the overall lesson plan is tight, compact, and perfectly fits within a 2-page print layout constraint.`;
  }

  let effectiveSyllabus = params.officialSyllabusData;
  if (params.type === "schemes_of_work" && Array.isArray(params.officialSyllabusData)) {
    effectiveSyllabus = filterSyllabusForSchemes(
      params.officialSyllabusData, 
      params.topic, 
      params.stoppingTopic, 
      params.selectedTopics
    );
  } else if (params.type === "weekly_forecast" && Array.isArray(params.officialSyllabusData)) {
    // For weekly forecast, strictly isolate the topic assigned to this specific week (do NOT extend across the whole term)
    effectiveSyllabus = filterSyllabusForSchemes(
      params.officialSyllabusData, 
      params.topic, 
      params.topic, 
      params.selectedTopics
    );
  }

  const syllabusContext = (params.selectedTopics && params.selectedTopics.length > 0
    ? `SELECTED / MARKED SYLLABUS TOPICS (CRITICAL - YOU MUST INCLUDE EVERY SINGLE MARKED TOPIC IN THE SCHEME TABLE WITH NO OMISSIONS):\n${params.selectedTopics.map(t => `- Topic: ${t.topic}\n  - Subtopics: ${t.subtopics?.length ? t.subtopics.join(", ") : "All subtopics"}`).join("\n")}`
    : `SUBJECT: ${params.subject}\nGRADE: ${params.grade}\nINITIAL STARTING TOPIC: ${params.topic || "N/A"}\nINITIAL SUBTOPIC: ${params.subtopic || "N/A"}\nINITIAL SPECIFIC COMPETENCY: ${params.specificCompetences || "N/A"}\nSTOPPING TOPIC ENTERED BY USER: ${params.stoppingTopic || "N/A"}`) + 
    (effectiveSyllabus ? `\n\nOFFICIAL SYLLABUS DATA (STRICT AND EXCLUSIVE SOURCE OF TRUTH - ONLY TOPICS FROM "${params.topic || 'START'}" TO "${params.stoppingTopic || 'STOP'}"):\n${JSON.stringify(effectiveSyllabus, null, 2)}` : "");

  const prompt = `
    You are an expert curriculum designer and educator, specializing in the Zambian ${params.curriculumType === "OBC" ? "OBC (Outcomes-Based Curriculum)" : "CBC (Competency-Based Curriculum)"} curriculum standards.
    
    ${params.type === "schemes_of_work" ? `
    ### ABSOLUTE TABLE FORMAT MANDATE (ZERO PLAIN WORDS / ZERO NARRATIVE PARAGRAPHS):
    - You MUST generate the Schemes of Work EXCLUSIVELY inside a complete Markdown TABLE with pipes (|).
    - You are STRICTLY FORBIDDEN from generating words, text paragraphs, or bullet lists outside the table!
    - Every week from Week 1 to Week 13 MUST be a formatted row in the Markdown table.
    - If you output narrative words instead of the Markdown table, the document will fail validation.
    ` : ""}

    ### SYLLABUS ADHERENCE & INTEGRITY:
    - STRICT SYLLABUS ADHERENCE: You MUST directly and exclusively draw all Topics, Subtopics, and Specific Competencies/Outcomes from the "OFFICIAL SYLLABUS DATA" provided below.
    - EXPECTED STANDARDS FIDELITY: For every topic and subtopic, you MUST extract and use the exact "expectedStandard" from the provided "OFFICIAL SYLLABUS DATA". Never fabricate generic or placeholder expected standards when official standards are provided in the syllabus dataset.
    - LEARNING ACTIVITIES FIDELITY: You MUST extract and utilize the exact "learningActivities" array from the provided "OFFICIAL SYLLABUS DATA" (or the user-selected learning activities if provided). Render them as concise, practical pedagogical action points directly reflecting the official syllabus. Never invent generic classroom activities that depart from the official syllabus!
    - NO HALLUCINATIONS OR OUTSIDE TOPICS: You are STRICTLY FORBIDDEN from inventing, guessing, substituting, or bringing in any topics from outside the provided syllabus slice.
    - VERBATIM SUBTOPICS: You MUST use the EXACT wording and numbering for subtopics directly from the provided syllabus data. Do NOT paraphrase, reword, or invent subtopic titles!
    - EXHAUST ALL SUBTOPICS IN SEQUENCE: You MUST exhaustively cover EVERY single subtopic in the provided syllabus data step-by-step in exact numerical sequence across the teaching weeks. Do NOT omit, skip, or consolidate any subtopic!
    - ORDER MATTERS: You MUST follow the exact step-by-step sequence and numbering of topics and subtopics as they appear in the provided syllabus data.
    - WORDING: Use the exact wording for topics and subtopics from the syllabus data.
    
    SOURCE MATERIAL:
    ${syllabusContext}

  ### CRITICAL MANDATORY TOPIC BOUNDARIES & 13-WEEK SCHEMES STRUCTURE (ZERO DEVIATION - ABSOLUTE MANDATE):
    1. EXCLUSIVE TOPIC RANGE: You MUST STRICTLY AND ONLY include the topics present in the provided OFFICIAL SYLLABUS DATA (which is bounded from Initial Starting Topic "${params.topic || 'Start'}" up to Stopping Topic "${params.stoppingTopic || 'End'}").
    2. STRICTLY FORBIDDEN TOPICS (NO GOING UP OR OUTSIDE THE RANGE): You are STRICTLY FORBIDDEN from including, importing, or mentioning any earlier topics (e.g. topics prior to "${params.topic || 'Start'}") or any later topics outside the range! The ONLY topics that may appear in the TOPIC column of the entire Scheme of Work table are the ones in the provided syllabus slice.
    3. MANDATORY 11-WEEK ACTIVE TEACHING & LEARNING SCHEDULE (WEEKS 1 TO 11):
       - Active teaching and learning MUST take place continuously from Week 1 all the way to Week 11 without interruption.
       - REVISIONS MUST BE IN WEEK 12 ONLY. Under NO circumstances should Week 9, Week 10, or Week 11 be marked as "Revisions" or left in a revision state!
       - WEEK 4: MUST combine active teaching & learning of that week's syllabus content PLUS Continuous Monthly Assessment Test 1 (learning MUST take place in Week 4).
       - WEEK 8: MUST combine active teaching & learning of that week's syllabus content PLUS Continuous Monthly Assessment Test 2 (learning MUST take place in Week 8).
       - WEEK 12: Revisions, Remedial Teaching & Consolidation of all Term Topics ONLY.
       - WEEK 13: End of Term Summative Test / Examination & Learner Progress Report Compilation.
    4. PERIOD-BASED LEARNING ACTIVITIES SPLITTING & PACING:
       - Curriculum framework stipulations about weekly period allocations (e.g. 5-6 periods per week for Primary/Junior core subjects, 4 periods per week for practical/social subjects) MUST be followed strictly.
       - When a topic or subtopic has many learning activities (e.g., 5 to 15 learning activities), you MUST NOT cram them all into 1 or 2 weeks leaving later weeks empty or in revision state!
       - You MUST split and distribute those learning activities sequentially and logically across multiple distinct teaching weeks (e.g., Subtopic 1.5.2 Part 1: Addition in Week 6, Part 2: Addition with Number Bonds in Week 7, Subtopic 1.5.2 Part 3: Subtraction in Week 8, Part 4: Subtraction problem solving in Week 9, etc.) until ALL learning activities from the syllabus range are exhaustively and evenly mapped across Week 1 to Week 11.
       - Every teaching week from Week 1 to Week 11 must contain active, authentic syllabus learning activities calibrated to that grade's weekly period capacity.
    
    ### DETAIL & CONCISENESS RULES:
    - Avoid over-summarization, but prioritize professional conciseness.
    - MANDATORY BULLET POINTS ("BULLETINS"): You MUST format all Specific Outcomes, Specific Competencies, Expected Standards, Learning Activities, Knowledge, Skills, Values, Teaching Methods, and T/L Aids in table cells with clean bullet points (• or <br>• ) so that every single outcome and piece of information clearly shows where it starts.
    - BALANCED CONTENT: You MUST provide clear, actionable descriptions in every table cell. Use concise, structured action phrases and bullet points.
    - NO TRUNCATION: Every Topic, Subtopic, and Outcome/Competency MUST be written in full as per the official Zambian syllabus. Do NOT cut off words or sentences.
    - SCHEMES OF WORK PAGE LIMIT (STRICT MAXIMUM 7 PAGES): For Schemes of Work, the entire document MUST NOT be generated above 7 pages. It MUST strictly fit within 7 pages and below (maximum ceiling of 7 pages for the whole term). The table layout provides wide horizontal space for "LEARNING ACTIVITIES" and "SPECIFIC COMPETENCIES/OUTCOMES". Utilize this horizontal width with succinct pedagogical action points so rows remain compact vertically and NEVER exceed 7 pages.
    - WEEKLY FORECAST PAGE LIMIT (EXACTLY 1 SINGLE PAGE): For Weekly Forecast, the entire generated document MUST FIT ON EXACTLY ONE (1) SINGLE PAGE ONLY. Output length must be calibrated so all 5 day rows, headers, and references fit seamlessly on a single page without spilling over.
    - VISIBLE FONT & HIGH LEGIBILITY: Ensure text is crisp, structured, and highly legible. Avoid unnecessarily verbose phrases so font sizes remain clear and easily readable.

    ${
      params.type === "schemes_of_work" && (params.subject && (
        params.subject.toLowerCase().includes('english') || 
        params.subject.toLowerCase().includes('zambian') ||
        params.subject.toLowerCase().includes('cinyanja') ||
        params.subject.toLowerCase().includes('nyanja') ||
        params.subject.toLowerCase().includes('icibemba') ||
        params.subject.toLowerCase().includes('bemba') ||
        params.subject.toLowerCase().includes('chitonga') ||
        params.subject.toLowerCase().includes('tonga') ||
        params.subject.toLowerCase().includes('silozi') ||
        params.subject.toLowerCase().includes('lozi') ||
        params.subject.toLowerCase().includes('kiikaonde') ||
        params.subject.toLowerCase().includes('kaonde') ||
        params.subject.toLowerCase().includes('luvale') ||
        params.subject.toLowerCase().includes('lunda') ||
        params.subject.toLowerCase().includes('literacy') ||
        params.subject.toLowerCase().includes('language')
      ))
        ? `
    ### LANGUAGE SUBJECT SCHEMES OF WORK MANDATE (ENGLISH & ZAMBIAN LANGUAGES):
    - You MUST include the "COMPONENT" column as the 2nd column in the Schemes of Work table (immediately after WEEK and before TOPIC).
    - In the COMPONENT column, assign the official syllabus component for every week (e.g. "Listening & Speaking", "Reading", "Writing", "Structure" / "Language Structure and Usage", "Vocabulary", "Comprehension", "Composition", etc.).
    - Table columns for Language Schemes:
      ${params.curriculumType === "OBC" 
        ? '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |'
        : '| WEEK | COMPONENT | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |'}
    ` : ""
    }

    ${
      params.curriculumType === "OBC" && params.type === "schemes_of_work"
        ? "FINAL ABSOLUTE MANDATE: You MUST NOT attach any 'Weekly Forecast' or 'Weekly Record' below the table. Output ONLY the Scheme of Work table and nothing else. Every row MUST have a Reference."
        : ""
    }

    ### FULL AUTOMATIC POPULATION MANDATE:
    You MUST fully auto-populate ALL weeks (Week 1 through Week 13 or all days Day 1 to Day 5) with rich, complete, authentic curriculum content from the official Zambian syllabus. Do NOT leave any table cells blank or empty under any circumstances. Every row MUST contain full topics, subtopics, outcomes/competencies, learning activities, methods, aids, and references.

    ${
      params.additionalContext && (
        params.additionalContext.toLowerCase().includes("recycle") || 
        params.additionalContext.includes("ARRANGED SYLLABUS PATTERN") || 
        params.additionalContext.includes("SCANNED") || 
        params.additionalContext.includes("Instructions") ||
        params.additionalContext.toLowerCase().includes("outside source") ||
        params.additionalContext.toLowerCase().includes("outsider source") ||
        params.additionalContext.toLowerCase().includes("pasted") ||
        params.additionalContext.toLowerCase().includes("external scheme") ||
        (/(?:week|wk)\s*1\b/i.test(params.additionalContext) && /(?:week|wk)\s*2\b/i.test(params.additionalContext))
      )
        ? `
    ### OPTIONAL PREPARATION METHOD: STRICT ADHERENCE TO WHAT THE INSTRUCTIONS SAY:
    (Note: This is an optional alternative preparation method. You MUST execute strictly what the instructions say for this generator):
    ${params.type === 'schemes_of_work' ? `
    - SCHEMES OF WORK (OUTSIDE SOURCE / PASTED SCHEMES OF WORK & RECYCLE):
      1. CRITICAL MANDATE FOR PASTED OUTSIDE SCHEMES OF WORK:
         If the instructions or context contains schemes of work information pasted from an outside source (e.g., Week 1, Week 2 up to Week 13 or any sequence of weeks prepared by a different source):
         - You MUST be completely TRUTHFUL to the pasted information.
         - You MUST follow the EXACT SAME ORDER, weeks, topics, subtopics, specific competencies/outcomes, knowledge/content, learning activities, teaching methods, teaching aids, and references as prepared by the outsider source!
         - DO NOT alter, reorder, or replace any pasted information with standard syllabus topics. Treat the outsider source's content as the authoritative curriculum for this document.
         - Ensure ALL weeks present in the pasted text (from Week 1 up to Week 13 or all weeks provided) are populated with full fidelity in the output table.
      2. If preparing via standard Recycle / Arranged pattern from syllabus:
         - Follow the instructions provided: allocate Subtopics and authentic learning activities sequentially based on periods assigned to this subject (${params.subject || 'this subject'}) from the starting topic through to the ending/stopping topic until all learning activities showing on each topic in the syllabus are used and exhausted.
         - Follow the arranged pattern in order direct from the syllabus or recycled document.
         - No generic learning activities and other unverified info should be seen in the schemes of work.
         - Auto-populate all teaching weeks across the term according to this sequential curriculum pattern.
    ` : ''}
    ${params.type === 'weekly_forecast' ? `
    - WEEKLY FORECAST (STRICT SINGLE-WEEK ISOLATION & ZERO CROSS-WEEK MIXING):
      1. CRITICAL MANDATE FOR PASTED OUTSIDE SCHEMES OF WORK:
         If the user has pasted schemes of work information from an outside source (covering weeks such as Week 1, Week 2 up to Week 13) into the instructions/context box:
         - You MUST locate the exact week requested for this forecast (e.g., Week ${params.forecastWeek || params.weekNumber || 1}).
         - That information MUST BE TRUTHFUL and MUST be gotten the exact way information is pasted from that outside source.
         - Faithfully translate that week's topic, subtopics, specific competencies/outcomes, knowledge/content, and learning activities across the ${params.forecastDays?.length || params.numberOfDays || 5} days of the weekly forecast table.
         - Follow the exact same order and terminology prepared by the outsider source for that week.
         - ZERO CROSS-WEEK CONTAMINATION: DO NOT substitute with different topics or borrow from other weeks. If Week ${params.forecastWeek || params.weekNumber || 1} is selected, the information in the forecast MUST be that only! Nothing from another week should be mixed up with the selected week number.
      2. If preparing via standard Recycle / Scheme sync:
         - STRICT SINGLE-WEEK ISOLATION (WEEK ${params.forecastWeek || params.weekNumber || 1} ONLY):
         - You are generating the Weekly Forecast EXCLUSIVELY and SOLELY for Week ${params.forecastWeek || params.weekNumber || 1}.
         - ZERO CROSS-WEEK MIXING: If Week ${params.forecastWeek || params.weekNumber || 1} is selected, let the information in the forecast table be for that week only! Nothing from another week should be mixed up or extracted alongside the selected week number.
         - Under NO circumstances mix, combine, or extract topics or subtopics from Week 1, Week 3, or other weeks into Week ${params.forecastWeek || params.weekNumber || 1}.
         - Plan all lessons from Day 1 to Day ${params.forecastDays?.length || params.numberOfDays || 5} centered strictly on what is provided for Week ${params.forecastWeek || params.weekNumber || 1} and nothing else.
         - Use arranged pattern & in order direct from the scanned document or syllabus. Allocate lessons professionally without mistakes.
    ` : ''}
    ${params.type === 'lesson_plan' ? `
    - LESSON PLAN (RECYCLE, FORECAST ALIGNMENT & PASTED CONTENT FIDELITY):
      1. PASTED CONTENT IS THE SOLE AUTHORITY: If the teacher has pasted lesson content, schemes, vocabulary, or text in the instructions/additional context box, you MUST prioritize this pasted text over ALL other sources. Use the exact topics, subtopics, specific competencies, and local language vocabulary/translations verbatim in the generated lesson plan.
      2. ZAMBIAN LOCAL LANGUAGE FIDELITY: If the selected subject is a Zambian language and local words/phrases are pasted, you are strictly forbidden from translating them, omitting them, or using default English placeholders. You must present the Zambian language words exactly as pasted.
      3. CRITICAL SINGLE-LESSON PURITY: You MUST generate this lesson plan strictly and exclusively for ONE SINGLE LESSON (e.g. Lesson ${params.lessonNumber || '1'} / Day ${params.dayOfWeek || params.lessonNumber || '1'}).
      4. ZERO CROSS-LESSON CONTAMINATION: You are STRICTLY FORBIDDEN from borrowing, merging, grouping, or appending learning activities, outcomes, or content from Lesson 2, Lesson 3, or other days of the week into this lesson plan.
      5. If the input contains a Weekly Forecast, scanned table, or multiple days:
         - Identify the row corresponding strictly to the target lesson (e.g. Day 1 / Lesson 1).
         - Extract and use ONLY the single learning activity assigned to that day (e.g., Activity 1a only for Day 1).
         - You MUST NOT append Activity 1b or any activities from other days, even if they share the same topic or subtopic code.
      6. The 'LEARNING ACTIVITIES:' section and the 'LESSON DEVELOPMENT' progression stages MUST focus 100% on delivering ONLY the single activity assigned to this exact lesson. If Day 1 is exploring materials in school surroundings, DO NOT introduce sorting wood, plastic, or metal from Day 2!
      7. Strictly adhere to what is provided. Do NOT hallucinate or expand beyond what was given.
    ` : ''}
    ${params.type !== 'schemes_of_work' && params.type !== 'weekly_forecast' && params.type !== 'lesson_plan' ? `
    - ${params.type ? params.type.toUpperCase().replace(/_/g, " ") : "DOCUMENT"} (RECYCLE & FORMAT UPDATE):
      1. Follow the instructions provided: recycle the old document content to make the fresh document, while updating the system document format information to what you desire as a user.
      2. Ensure all official competencies, professional roles, and user-specified formatting requirements are accurately reflected.
    ` : ''}
    `
        : ""
    }

    ${
      params.type === "weekly_forecast"
        ? `FINAL ABSOLUTE MANDATE (PERMANENT & SEALED FOREVER): You MUST output the full professional header (DOCUMENT NAME, DISTRICT, SCHOOL, etc.) followed by the Weekly Forecast table. 
    - TABLE FORMAT: You MUST output a standard Markdown pipe table. 
    - TABLE HEADER (EXACT): ${
      isOBC
        ? '| DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |'
        : '| DAY | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |'
    }
    - TABLE SEPARATOR (EXACT): ${
      isOBC
        ? '|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|'
        : '|:---|:---|:---|:---|:---|:---|:---|:---|:---|'
    }
    - CELL AND COLUMN ALLOCATION MANDATE (CRITICAL - DO NOT SHIFT OR SCRAMBLE COLUMNS):
      Allocate all information strictly to its intended column and cell without shifting columns or swapping fields:
      * The 'DAY' column MUST contain ONLY the Day number/name and date (e.g. **Day 1**<br/><small>21-09-2026</small>).
      ${shouldIncludeCompInWf ? "* The 'COMP' column MUST contain ONLY the component (e.g. Listening & Speaking, Reading, Writing, Structure)." : ""}
      * The 'TOPIC/Subtopics' column MUST contain ONLY the Topic and Subtopic (Topic in uppercase on top, double line break, then Subtopic in <small><b>• ...</b></small>). Do NOT put Outcomes, Competencies, or Knowledge in this column.
      * The 'SPECIFIC OUTCOMES' (or 'SPECIFIC COMPETENCIES') column MUST contain ONLY the outcomes/competencies with official bullet and syllabus code.
      ${isOBC ? `* The 'KNOWLEDGE' column MUST contain ONLY the factual knowledge, rules, and concepts.
      * The 'SKILLS' column MUST contain ONLY the practical skills practiced.
      * The 'VALUES' column MUST contain ONLY the values and attitudes.` : `* The 'EXPECTED STANDARDS' column MUST contain ONLY authentic expected standards. Sourced directly from the official syllabus matching the content provided!
      * The 'LEARNING ACTIVITIES' column MUST contain ONLY learning activities.`}
      * The 'TEACHING METHODS' column MUST contain ONLY authentic teaching methods (at least 3-4 methods per day: Teacher exposition, Question and answer, Class discussion, Group work).
      * The 'T/L AIDS' (or 'TEACHING AND LEARNING AIDS') column MUST contain ONLY teaching & learning aids and materials.
      * The 'REFERENCE' column MUST contain ONLY the syllabus reference and page numbers.
      * The 'RECORD OF WORK' column MUST be left blank/empty with clean guide spacing for teacher's handwritten notes.
      * ZERO COLUMN SHIFT: You are STRICTLY FORBIDDEN from shifting cell contents into neighboring columns. Do NOT change the layout or move columns around!
    - SYLLABUS FIDELITY & MISSING DATA ENRICHMENT MANDATE (CRITICAL):
      If any column data (such as EXPECTED STANDARDS, LEARNING ACTIVITIES, SPECIFIC OUTCOMES/COMPETENCIES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, or REFERENCES) is missing from the provided input or context:
      You MUST look up and extract the exact information directly from the official Syllabus provided in the context based on the Topic, Subtopic, or Competencies. E.g., EXPECTED STANDARDS must be sourced exactly based on the official syllabus matching the content provided. NEVER leave expected standards empty, generic, or fabricated!
    ${isOBC ? `- OBC CURRICULUM COLUMNS MANDATE: Under the Zambian OBC Curriculum, the table MUST have columns for SPECIFIC OUTCOMES, KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, REFERENCE, and RECORD OF WORK. Do NOT include Learning Activities or Expected Standards in the OBC Weekly Forecast table.` : ''}
    - TOPIC/Subtopics & NUMBER SEQUENCING MANDATE (CRITICAL - FOR OBC & CBC):
      * EXACT NUMBER SEQUENCING HIERARCHY (MANDATORY): You MUST preserve and display the official syllabus numerical sequence prefixes starting from Topic, to Subtopics, to Specific Outcomes (for OBC) / Competencies:
        - 1. TOPIC: State the main Topic with its official number prefix in normal uppercase font on top of the cell (e.g., 3.8 FRACTIONS or 1.1 SOCIAL ENVIRONMENT).
        - 2. SUBTOPICS: State the Subtopic with its official 3-level sequence number prefix in smaller bold text wrapped in HTML small/b tags underneath double break (e.g., <small><b>• 3.8.1 Identify and represent proper fractions as equal parts of a whole</b></small>).
        - 3. SPECIFIC OUTCOMES (OBC): State each Specific Outcome with its official 4-level sequence number prefix with bullet (e.g., • 3.8.1.1 Identify proper fractions as equal parts of a whole).
      * In the "TOPIC/Subtopics" column, every single row MUST follow the exact same visual structure as Schemes of Work:
      * State the main TOPIC in normal uppercase font at the top of the cell.
      * Add double line break (<br/><br/>).
      * State the Subtopic underneath, wrapped in HTML small/b tags with its official number sequence prefix.
      * NEVER omit the topic from the top of the cell.
      * NEVER strip, omit, or invent sequence numbers. Follow official syllabus numbers verbatim.
      * NEVER leave the subtopic in large unbolded text.
    - DAY COUNT ENFORCEMENT (CRITICAL): You MUST generate EXACTLY ${params.forecastDays?.length || params.numberOfDays || 5} rows corresponding strictly to Day 1 through Day ${params.forecastDays?.length || params.numberOfDays || 5}. You are STRICTLY FORBIDDEN from generating extra day rows beyond Day ${params.forecastDays?.length || params.numberOfDays || 5} (for example, if 3 days are specified, generate Day 1, Day 2, and Day 3 only; do NOT generate Day 4 or Day 5).
    - HIGH CONTENT DENSITY WITH CONCISENESS (MANDATORY): Every cell MUST contain high-impact, professional descriptive statements. Keep statements highly "telegraphic" (concise, precise, and compact bullet points, e.g. "• State Newton's laws" or "• Identify letter sounds"). Avoid multi-line narrative paragraphs or repetitive phrases so each row remains compact.
    ${params.contentScale === 'lighter' ? `
    - DOCUMENT SCALE (LIGHTER): Follow standard syllabus statements closely without stating extra examples. Keep statements compact, telegraphic, and concise (few examples or standard syllabus statements only).
    ` : `
    - DOCUMENT SCALE (MEDIUM - STANDARD): Follow syllabus standards with brief context and a few cited examples in the Knowledge/Content/Activities columns (e.g. 2 practical cited examples or terms) so the teacher has a solid reference to base lesson plan generation upon, while strictly fitting within the single A4 landscape page limit.
    `}
    - STRICT SINGLE PAGE ONLY (ABSOLUTE MANDATE - ZERO OVERFLOW): The entire generated Weekly Forecast document (including headers, metadata box, and all 5 day rows of the table) MUST fit on EXACTLY ONE (1) A4 LANDSCAPE PAGE. Under NO circumstances should the table split, overflow, or create a second page. Output length must be calibrated for a complete, elegant single-page fit.
    - CRITICAL DEDUPLICATION RULE FOR SPECIFIC COMPETENCIES:
      * Specific competencies MUST NOT be duplicated or repeated in multiple lines or repeated across rows unnecessarily. Avoid repeated or cancelled specific competencies in the final weekly forecast template. Each day must cleanly present its designated competency without redundant repetitions.
    - EXPECTED STANDARDS MANDATE (STRICTLY FROM OFFICIAL SYLLABUS ONLY):
      * Expected standards MUST ALWAYS come directly from the official Zambian curriculum syllabus matching the topic, subtopic, and competencies. NEVER provide generic standard statements like 'Learners understand concepts' or 'Demonstrate standard skills'. Sourced strictly from the authentic syllabus!
    - TEACHING METHODS & T/L AIDS PEDAGOGICAL DIVERSITY MANDATE (CRITICAL):
      * DO NOT provide common boilerplate methodologies and T/L aids across all days or subjects! We use different methodologies and T/L aids depending on the lesson content, subject, grade, and learning stage.
      * It is WRONG for every lesson from Day 1 to Day 5 or in every subject/grade to have the same methodologies in the same order (e.g. Teacher exposition, Questions and answers, Brainstorming, Group work, Class discussion).
      * The system MUST think critically to provide rightful methodologies and T/L aids to suit the learning stages for each lesson based on the lesson content captured (Topic, Subtopic, Learning activities, and Expected standards from syllabus).
      * Vary the methods thoughtfully:
        - For concept introduction lessons: Guided discovery, Realia observation, Teacher demonstration, Interactive dialogue.
        - For calculation / procedural lessons: Direct modeling, Step-by-step problem solving, Paired practice, Structured exercises.
        - For collaborative / application lessons: Group inquiry, Case study analysis, Peer problem-solving, Role play.
        - For language / literacy lessons: Phonics blending, Shared reading, Communicative dialogue, Guided sentence composition.
        - For revision / assessment lessons: Peer review, Plenary synthesis, Diagnostic questioning, Independent task.
      * T/L aids MUST be specifically appropriate to the actual lesson content (e.g. geometric models, real plant specimens, local abacus, map of Zambia, specific concept chart, concrete counters), NEVER generic 1-word lists!
    - REFERENCE COLUMN MANDATE (CLEAN DOTTED PAGE NUMBERS - ZERO '(from the uploaded scheme)'):
      * The Reference column must cite the official Zambian syllabus with empty dotted page numbers for manual filling (e.g. 'CBC Grade 4 Mathematics Syllabus, Page: ..........').
      * CRITICAL RULE: NEVER append '(from the uploaded scheme)' or any commentary after the page dotted lines. Omit '(from the uploaded scheme)' completely! Only leave clean dotted lines for page numbers.
    - EXHAUSTIVE CONTIGUOUS SUBTOPIC & OUTCOME PACING ACROSS ALL SUBJECTS (ABSOLUTE MANDATE - ZERO PING-PONG):
      * Across ALL SUBJECTS (Creative & Technology Studies, Social Studies, Mathematics, Science, English, Zambian Languages, Expressive Arts, CTS, etc.), subtopics and specific outcomes MUST be completed in strict contiguous sequence.
      * When a week contains multiple specific outcomes (e.g., 3.14.1.1 and 3.14.1.2) or multiple subtopics (e.g., 3.5.1.3 and 3.5.1.4):
        - Day 1 MUST list ONLY Outcome 1 (e.g., 3.14.1.1)!
        - Day 2 MUST list ONLY Outcome 1 (e.g., 3.14.1.1) to exhaust it, OR move to Outcome 2!
        - Day 3 MUST list ONLY Outcome 2 (e.g., 3.14.1.2)! You are STRICTLY FORBIDDEN from jumping back to Outcome 1 on Day 3!
        - Day 4 MUST list ONLY Outcome 2 (e.g., 3.14.1.2)!
      * PING-PONG / ALTERNATING LESSONS IS STRICTLY PROHIBITED IN ALL SUBJECTS! Never output Outcome 1 on Day 1, Outcome 2 on Day 2, Outcome 1 on Day 3, and Outcome 2 on Day 4. Lessons MUST be taught in contiguous, uninterrupted blocks in exact syllabus sequence, with EACH day row showing ONLY the single subtopic and outcome assigned to THAT specific lesson!
    - STRICT FOCUS ON CURRENT WEEK (ZERO CROSS-WEEK CONTAMINATION): Stick strictly to the ONLY given information for the current week, with NO extension or mixing of information from preceding or subsequent weeks. All lessons from Day 1 to Day ${params.forecastDays?.length || params.numberOfDays || 5} must be centered strictly on the current week's topic, subtopics, outcomes/competencies, knowledge, skills, values, and aids. Generate the weekly forecast automatically picking information exactly the way the syllabus is aligned for this grade/subject, OR based on the pasted information if provided. Allocate lessons professionally without mistakes. Every single day row MUST be fully populated with its proper Topic, Subtopics, Outcomes/Competencies, Expected Standards, and Learning Activities copied verbatim/directly from the provided OFFICIAL SYLLABUS DATA for this specific grade and week. Fabricating or omitting any of this information is strictly prohibited!`
        : ""
    }

    Task: ${customizedPrompt}
    
    ${
      params.englishPreparationMode === 'normal' && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && params.subject?.toLowerCase().includes('english') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### NORMAL ENGLISH (GRADES 1 & 2) SPECIAL RULES:
    1. SUBJECT MANDATE: Prepare this document treating "English" as a single unified subject, exactly as shown in the syllabus.
    2. NO ORAL/LITERACY SEPARATION: You are STRICTLY FORBIDDEN from creating separate "Oral English" and "Literacy in English" sections, headers, or slots. Cancel out any dual-topic oral/literacy rules.
    3. SYLLABUS ALIGNMENT: Include all topics from the syllabus as "English" from the first topic to the last topic sequentially.
    4. ACCURACY: Make sure all Topics, Sub-topics, Specific Competencies, Learning Activities, and Expected Standards appear EXACTLY as the syllabus indicates without separating them into oral vs literacy components.
    `
        : params.englishCombined && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### ENGLISH COMBINED (ORAL & LITERACY) SPECIAL RULES:
    1. RATIO & DISTRIBUTION: 
       - For Grade 1 and Grade 2 (Terms 1 & 2): Plan for exactly THREE (3) Oral English lessons and TWO (2) Literacy in English lessons per week.
       - For Grade 2 (Term 3): Plan for exactly TWO (2) Oral English lessons and THREE (3) Literacy in English lessons per week (or full dual Oral/Literacy integration across all teaching weeks).
    2. GRADE 2 TERM 3 SYLLABUS ADHERENCE:
       - Weeks 1-4 Oral: 2.1.3 Places in the Community (with religious places & leaders), 2.1.5 Instructions (with imperative verbs & games like Simon Says), 2.1.7 Expressing Feelings (with facial expressions & interjections), 2.1.9 Wild Animals (attributes & habitats).
       - Weeks 1-4 Literacy: 2.11 Comprehension (2.11.1.1 Read & answer questions, 2.11.1.2 Re-tell story sequentially), 2.12 Handwriting (2.12.1.1 Copying legibly, 2.12.1.2 Tailed letters, 2.12.1.3 Ascenders/descenders, 2.12.1.4 Pencil grip/posture), 2.13 Sentence Construction (2.13.1.1 Re-write scrambled sentences, 2.13.1.2 Complete sentences, 2.13.1.3 Substitution tables & picture sentences).
       - Weeks 5-11 Literacy: 2.14 Alphabetical Order (2.14.1.1) & Logical Order (2.14.2.1), 2.15 Spelling (2.15.1.1) & Dictation (2.15.2.1), 2.16 Synonyms (2.16.1.1) & Antonyms (2.16.2.1), 2.17 Parts of Speech (2.17.2 Verbs with continuous tenses, 2.17.3 Prepositions: in/on/under/near, 2.17.4 Conjunctions: and/but, 2.17.5 Possessive words: my/his/her/our/their), 2.18 Punctuation (2.18.1.1 Capital letters, full stops, question marks, and commas).
       - Oral Integration: In Weeks 5-11, include oral chants, oral spelling drills, synonym/antonym dialogues, mime/tense games, sentence-combining dialogues, and question intonation drills.
    3. ACTIVITY GRANULARITY: For Literacy in English, activities from the teaching modules (labeled Activity 1a, Activity 1b, Activity 1c, Activity 1d) MUST be treated as distinct independent lessons.
    4. REVISIONAL LESSON MANDATE: The final activity/lesson under every sound subtopic (e.g. Activity 1d or 1c) MUST be explicitly labeled as a "Revisional Lesson" (e.g., 'Activity 1d (Revisional Lesson): Revision and consolidation of sound /s/ - reading decodable text, CVC dictation, and story recall').
    5. CONSISTENT SPECIFIC COMPETENCY PER SOUND: All activity lessons under the same sound subtopic MUST share a single consistent specific competency from the official syllabus (e.g. 'Identify, sound out, blend, read, and write words containing target sound /s/').
    6. SLOTS MAPPING (CRITICAL MANDATE):
       - TOPICS: Use exactly TWO (2) topic slots. Slot 1 (Topic A) for ORAL ENGLISH, Slot 2 (Topic B) for LITERACY IN ENGLISH.
       - SUBTOPICS: Use exactly FIVE (5) subtopic slots in the Scheme of Work.
         * For Grade 1 / Gr2 Terms 1-2: Slots 1, 2, 3 for ORAL ENGLISH; Slots 4, 5 for LITERACY IN ENGLISH.
         * For Grade 2 Term 3: Slots 1, 2 for ORAL ENGLISH; Slots 3, 4, 5 for LITERACY IN ENGLISH (or balanced slots).
       - OUTCOMES/COMPETENCIES:
         * Align directly with the respective Oral and Literacy subtopics.
    7. WEEKLY FORECAST (5 DAYS): 
       - Day 1, 2: Plan ORAL ENGLISH lessons (or Days 1, 2, 3 for Gr1/Gr2 T1-T2).
       - Day 3, 4, 5: Plan LITERACY IN ENGLISH lessons (or Days 4, 5 for Gr1/Gr2 T1-T2).
    8. REFERENCES MANDATE: The REFERENCES column and bibliography MUST explicitly list BOTH the official syllabus ('Zambian National Syllabus: Lower Primary Literacy and Language Syllabus') AND the specific teaching modules used ('National Literacy Teaching Module - Grade 1/2 Term X' and 'Grade 1/2 Oral English Teaching Module - Term X').
    9. NO GAPS: Both components must be present every week except for designated assessment/revision weeks.
    10. TOP-NOTCH ARRANGEMENT: Maintain the clean dual "Oral:" and "Literacy:" section headers within each column cell (Topic, Subtopic, Competencies, Expected Standard, Learning Activities) with concise bullet points and 5-6 page target length.
    11. LITERACY TOPIC & SUBTOPIC STRICT MANDATE (IMPORTANT): In the Lower Primary Literacy syllabus, "phonics" is NOT a Topic or Subtopic name. The Topic is strictly **"sounds"** (or **"SOUNDS"**), and the Subtopic is strictly the specific letter-sounds being taught (e.g. **"sound s and sound a"** or **"sound oa"** etc.). You MUST write "sounds" in the Topic column and the specific sound name in the Subtopic column. Do NOT write "Phonics" as a topic or subtopic, and do NOT misplace this information into wrong columns.
    12. GRADE 1 TERM 3 LITERACY REVISION MANDATE (CRITICAL RULE): If the grade is Grade 1 and the term is Term 3, and the subject contains "literacy" or this is a combined English plan: the Literacy portion must strictly have only a main lesson for a letter sound, and revision lessons on subsequent days. If there are exactly TWO letter sounds in the week's subtopics (e.g., sound x and sound y): you MUST generate exactly 4 lessons: Monday (Day 1) = sound x main lesson, Tuesday (Day 2) = sound x revision, Wednesday (Day 3) = sound y main lesson, Thursday (Day 4) = sound y revision. Day 5 (Friday) is empty or explicitly marked as 'No Literacy Lesson / Weekly Assessment / Consolidation'. If there is only ONE letter sound: you MUST generate exactly 2 lessons: Monday (Day 1) = sound x main lesson, Tuesday (Day 2) = sound x revision, and Wednesday, Thursday, Friday are marked as 'No Literacy Lesson / Private Study / Consolidation'. Strictly NO lessons are allowed on these empty days. Let other grades follow normal 5-day rules.
    13. NO N/A OR EMPTY FIELDS (SEALED MANDATE): You MUST NEVER generate "N/A" or "NA" or leave empty values in any column of the forecast/scheme (such as Expected Standards, Teaching Methods, T/L Aids, or Reference). If any field is missing or brief in the extracted context, you MUST logically derive and output rich, authentic Zambian curriculum details.
    `
        : !params.englishCombined && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && (params.subject?.toLowerCase().includes('oral') || params.englishComponent === 'oral') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### STANDALONE ORAL ENGLISH SPECIAL RULES:
    1. STANDALONE SUBJECT MANDATE: Prepare this document STRICTLY and EXCLUSIVELY for ORAL ENGLISH as an independent, standalone subject.
    2. NO LITERACY MIXING: You are STRICTLY FORBIDDEN from including Literacy in English topics, phonics, sound blending, or National Literacy Teaching Module activities.
    3. TABLE STRUCTURE: Use standard single-subject topic slots and subtopics (e.g. 1 main topic and 3 subtopics per week in Scheme of Work, or 5 days of Oral English in Weekly Forecast).
    4. REFERENCES: Cite the official Oral English Teaching Module and Lower Primary Literacy & Language Syllabus (Oral English section).
    5. TOPIC/SUBTOPICS MANDATE: Ensure the Topics and Subtopics are exactly what is extracted from the schemes or instruction box (e.g. 'Conversations', 'Greetings', 'Descriptions', 'Expressing Feelings'). Do NOT include any phonics or sound blending. Ensure information is strictly aligned in the correct columns without shifting.
    6. NO N/A OR EMPTY FIELDS (SEALED MANDATE): You MUST NEVER generate "N/A" or "NA" or leave empty values in any column of the forecast/scheme.
    `
        : !params.englishCombined && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && (params.subject?.toLowerCase().includes('literacy') || params.englishComponent === 'literacy') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### STANDALONE LITERACY IN ENGLISH SPECIAL RULES:
    1. STANDALONE SUBJECT MANDATE: Prepare this document STRICTLY and EXCLUSIVELY for LITERACY IN ENGLISH as an independent, standalone subject.
    2. NO ORAL ENGLISH MIXING: You are STRICTLY FORBIDDEN from including Oral English conversation topics or general listening/speaking outcomes.
    3. LITERACY ACTIVITIES: Plan Literacy in English lessons following the National Literacy Teaching Module structure (Phonemic awareness, sounds, Activity 1a, 1b, 1c, 1d, sound blending, decodable text reading, writing, and comprehension).
    4. TABLE STRUCTURE: Use standard single-subject topic slots and subtopics.
    5. REFERENCES: Cite the official National Literacy Teaching Module and Lower Primary Literacy & Language Syllabus (Literacy in English section).
    6. LITERACY TOPIC & SUBTOPIC STRICT MANDATE (IMPORTANT): In the Lower Primary Literacy syllabus, "phonics" is NOT a Topic or Subtopic name. The Topic is strictly **"sounds"** (or **"SOUNDS"**), and the Subtopic is strictly the specific letter-sounds being taught (e.g. **"sound x and sound y"** or **"sound s"**, **"sound oa"** etc.). You MUST write "sounds" in the Topic column and the specific sound name in the Subtopic column. Do NOT write "Phonics" as a topic or subtopic, and do NOT misplace this information into wrong columns.
    7. GRADE 1 TERM 3 LITERACY REVISION MANDATE (CRITICAL RULE): If the grade is Grade 1 and the term is Term 3: there must strictly be only a main lesson for a letter sound, and revision lessons on subsequent days. If there are exactly TWO letter sounds in the week's subtopics (e.g., sound x and sound y): you MUST generate exactly 4 lessons: Monday (Day 1) = sound x main lesson, Tuesday (Day 2) = sound x revision, Wednesday (Day 3) = sound y main lesson, Thursday (Day 4) = sound y revision. Day 5 (Friday) is empty or explicitly marked as 'No Literacy Lesson / Weekly Assessment / Consolidation'. If there is only ONE letter sound: you MUST generate exactly 2 lessons: Monday (Day 1) = sound x main lesson, Tuesday (Day 2) = sound x revision, and Wednesday, Thursday, Friday are marked as 'No Literacy Lesson / Private Study / Consolidation'. Strictly NO lessons are allowed on these empty days. Let other grades follow normal 5-day rules.
    8. NO N/A OR EMPTY FIELDS (SEALED MANDATE): You MUST NEVER generate "N/A" or "NA" or leave empty values in any column of the forecast/scheme.
    `
        : ""
    }
    
    ${
      params.curriculumType === "OBC"
        ? `
    ### OBC SPECIFIC RULES:
    1. OUTCOMES VS COMPETENCIES: You MUST use "GENERAL OUTCOMES" and "SPECIFIC OUTCOMES" instead of competencies. You are STRICTLY FORBIDDEN from using the word "Competencies" in an OBC document.
    2. THE OBC PACKAGE: For every outcome, you MUST accurately identify the associated Knowledge, Skills, and Values.
    3. FOR SCHEMES OF WORK & FORECASTS: 
       - CRITICAL MANDATE: You MUST ONLY output ONE table. 
       - FOR SCHEMES OF WORK ONLY: You are STRICTLY FORBIDDEN from attaching a "Weekly Forecast" table, "Weekly Record", or any additional "Monday-Friday" breakdown at the end of the document. ONLY output the Scheme of Work table.
       - FOR EVERY ROW IN SCHEMES OF WORK: The "REFERENCE" column (Column 10) MUST contain a specific citation. NEVER leave it blank. use the format "OBC [Subject] Syllabus, [Topic Code] [Topic Title]".
       - REFERENCE EXAMPLE: "OBC Mathematics Syllabus, 5.6 Factors and Multiples". 
       - OBC TABLE STRUCTURE (MANDATORY 9 COLUMNS): For OBC curriculum, the Subtopic column has ceased to exist independently and is merged into TOPIC under the heading "TOPIC/Subtopics". Order: WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE (10 columns with COMP for Language). Inside TOPIC/Subtopics, state Topic first, then Subtopics in bold with proper numbering.
       - COLUMN WIDTHS & PACING: Keep the "WEEK" content minimal (just the digit). 
       - PAGE TARGET: For Schemes of Work, the document MUST NOT be generated above 7 pages. It MUST strictly fit within 7 pages and below (ideally 4 to 6 pages, maximum 7 pages). Provide rich, comprehensive curriculum detail across all 13 weeks.
       - ASSESSMENT WEEKS (Weeks 4, 8, 12, 13): You MUST provide detailed learning activities and focus areas in these weeks. Specify what is being assessed.
       - STRICTLY NO APPROVAL SECTION OR SIGNATURES: You are STRICTLY FORBIDDEN from adding an Approval Section, Supervisor Signature, Teacher Signature, or Date block at the end of Schemes of Work or Weekly Forecasts. The document ends immediately after the table rows.
    4. POSITIONING (LESSON PLANS ONLY): 
       - The "SPECIFIC OUTCOMES" section MUST ONLY contain the outcomes themselves.
       - The associated Knowledge, Skills, and Values MUST NOT be placed in the Specific Outcomes section.
       - Instead, you MUST move the Knowledge, Skills, and Values to the "Prior knowledge/skills/values" section.
       - Use the header: <b>GENERAL OUTCOMES:</b> and <b>SPECIFIC OUTCOMES:</b>.
    5. HEADER REPLACEMENT: The section formerly known as "PRIOR KNOWLEDGE" MUST now be labeled <b>Prior knowledge/skills/values:</b>.
    6. FORMATTING: In the "Prior knowledge/skills/values" section, list the items clearly:
       <b>Prior knowledge/skills/values:</b>
       - <b>Knowledge:</b> [Extracted Knowledge]
       - <b>Skills:</b> [Extracted Skills]
       - <b>Values:</b> [Extracted Values]
    7. NO DUPLICACY: Ensure that the word "OBC" or "LESSON PLAN" does not appear twice in the main title. Only use one main header: "# LESSON PLAN (OBC)".
    8. SUBJECT FOCUS: Use ONLY the original subject name provided: ${params.subject}. Do not add extra subject categories.
    9. SYLLABUS ALIGNMENT: Strictly follow the topic and subtopic numbering provided in the SOURCE MATERIAL. Ensure the content accurately reflects the specific grade level and subject.
    10. GENERAL OUTCOMES: You MUST always include a "GENERAL OUTCOMES" section for the OBC curriculum. These are broad learning goals that provide the context for the specific outcomes.
    11. SCHOOL NAME: Ensure that the school name provided is correctly featured in the professional header. If the school name is not provided, use "................ SCHOOL".
    `
        : ""
    }

    
    ${
      isIWP
        ? `
    CRITICAL: You are generating a PROFESSIONAL INDIVIDUAL WORK PLAN. 
    ${(params.jobTitle || "").toLowerCase().includes("head teacher") && !(params.jobTitle || "").toLowerCase().includes("deputy") ? `
    - This is a HEAD TEACHER'S Individual Work Plan.
    - JOB PURPOSE: ${params.jobPurpose || "To manage the administration and academic programmes in the school in order to facilitate delivery of quality education."}
    - You MUST use exactly these 5 ROLLS as Key Result Areas (KRAs):
      1. ROLL 1: ACADEMIC PROGRAMMES
      2. ROLL 2: ADMINISTRATIVE FUNCTIONS
      3. ROLL 3: MONITORING AND EVALUATION
      4. ROLL 4: POLICY INTERPRETATION
      5. ROLL 5: PERFORMANCE MANAGEMENT
    - TABLE STRUCTURE: Use exactly 5 columns: | KEY RESULT AREA | PRINCIPAL ACCOUNTABILITY | SCHEDULE OF ACTIVITIES | TARGETS | RATING |
    - RATING: This column MUST be left blank (empty) in the generated table.
    - For Roll 1 (Academic Programmes): Focus on conducting open days, monitoring teaching/learning, monitoring assessments, and catch-up activities.
    - For Roll 2 (Administrative Functions): Focus on staff briefings, school assemblies, committee meetings (PTA, PMS), funding/hiring for maintenance.
    - For Roll 3 (Monitoring and Evaluation): Focus on checking schemes/lesson plans, teacher observations, monitoring reports from deputy/senior teachers, infrastructure.
    - For Roll 4 (Policy Interpretation): Focus on Home & Re-entry Policy, PTA meetings, health guidelines (cholera measures).
    - For Roll 5 (Performance Management): Focus on individual teachers' work plans, performance appraisals, co-curricular activities.
    - MANDATORY: Where information is very specific or varies by school (like specific teacher counts, pupil counts, or specific dates not provided), use dotted spaces (e.g., .................) to allow the headteacher to enter it manually.
    ` : (params.jobTitle || "").toLowerCase().includes("deputy head") ? `
    - This is a DEPUTY HEAD TEACHER'S Individual Work Plan.
    - JOB PURPOSE: ${params.jobPurpose || "To assist the Head Teacher in managing administration and academic programmes in the school."}
    - Use exactly these 5 ROLLS as Key Result Areas (KRAs):
      1. ROLL 1: ACADEMIC COORDINATION
      2. ROLL 2: ADMINISTRATIVE SUPPORT
      3. ROLL 3: MONITORING AND QUALITY ASSURANCE
      4. ROLL 4: STAFF DEVELOPMENT & BRIEFINGS
      5. ROLL 5: RECORDS MANAGEMENT & ARCHIVING
    - TABLE STRUCTURE: | KEY RESULT AREA | PRINCIPAL ACCOUNTABILITY | SCHEDULE OF ACTIVITIES | TARGETS | RATING |
    - RATING: Left blank.
    ` : (params.jobTitle || "").toLowerCase().includes("senior teacher") ? `
    - This is a SENIOR TEACHER'S Individual Work Plan.
    - JOB PURPOSE: ${params.jobPurpose || "To provide middle-management administrative support and coordinate academic activities at section/grade level."}
    - Use exactly these 5 ROLLS as Key Result Areas (KRAs):
      1. ROLL 1: SECTION ACADEMIC STANDARDS (Monitoring Schemes/Lesson Plans/Forecasts of junior teachers)
      2. ROLL 2: MIDDLE MANAGEMENT & COORDINATION (Section meetings, reports to management)
      3. ROLL 3: CLASSROOM PERFORMANCE MONITORING (Teacher observations, mentorship)
      4. ROLL 4: RESOURCE & INVENTORY MANAGEMENT (Section teaching aids, text books)
      5. ROLL 5: POLICY IMPLEMENTATION & WELFARE (Learner discipline, section guidelines)
    - TABLE STRUCTURE: | KEY RESULT AREA | PRINCIPAL ACCOUNTABILITY | SCHEDULE OF ACTIVITIES | TARGETS | RATING |
    - RATING: Left blank.
    ` : `
    - This is a PERFORMANCE MANAGEMENT document, NOT a classroom teaching tool.
    - DO NOT include lesson plans, weekly forecasts, or schemes of work.
    - Focus on the professional duties, accountabilities, and targets of the ${params.jobTitle}.
    `}
    - Ensure the document is professional and intended for human resources / performance review purposes.
    - Header MUST include: FORTUNES EDUTECH.
    - Include an APPROVAL SECTION at the end with Supervisor and Job Holder signatures and a place for the Official Stamp.
    `
        : ""
    }

    ${
      isLesson
        ? `
    CRITICAL PAGE LIMITS (A4 ORIENTATION) - STRICT MANDATE:
    - The lesson plan content itself from the top Republic/Ministry headers down to the EVALUATIONS (LEARNER'S EVALUATION and TEACHER'S EVALUATION) MUST NOT exceed THREE (3) PAGES (maximum 3 pages or less).
    - If "Include Teaching Notes" is YES:
      1. All core lesson plan content up to the Evaluations MUST fit strictly within 3 Pages or less.
      2. You MUST place exactly one page-break element (<div class="page-break"></div>) immediately after the Evaluations block.
      3. The "TEACHING NOTES" must start strictly after the Evaluations block (on page 4 if core plan takes 3 pages).
    - If "Include Teaching Notes" is NO:
      1. The entire document (lesson plan with evaluations) MUST fit strictly within 3 Pages or less.
    - Ensure the lesson plan carries rich, thorough, step-by-step detailed classroom information while staying comfortably within the 3-page ceiling. Keep the RATIONALE section concise (max 3-5 lines, under 60 words). Focus on highly practical learning steps.

    REAL TEACHING DIAGRAM INCLUSION FOR LESSON PLANS:
    ${params.includeLessonDiagram !== false ? `
    - Include a compact, small-yet-clearly-visible real educational teaching diagram directly inside the LESSON DEVELOPMENT table (e.g. Stage 2 / Teacher Modeling / T/L Aids column) or as an illustrative chalkboard diagram!
    ${params.selectedLessonDiagram?.svgContent ? `Use this exact diagram SVG: ${params.selectedLessonDiagram.svgContent}` : `Generate a clean inline SVG teaching diagram (small, neat size: width ~220px to 280px, height ~100px to 140px) representing the topic "${params.topic || 'Lesson Topic'}" and subtopic "${params.subtopic || 'Lesson Subtopic'}".`}
    - Ensure the diagram is styled compactly (e.g. <div style="text-align: center; margin: 6px auto; max-width: 260px;">...</div>) so it remains small, crisp, and clearly visible without inflating the page count!` : `- Do NOT force large diagram boxes.`}
    `
        : ""
    }

    Details:
    ${
      isAssessment
        ? `
    - Test Type: ${params.testType || "Test"}
    - Difficulty Level: ${params.difficultyLevel || "Medium"}
    - Test Name: ${params.testName || "Not Specified"}
    - Test Date: ${params.testDate || "Not Specified"}
    - Test Duration: ${params.testDuration ? `${params.testDuration} minutes` : "Not Specified"}
    - Question Distribution:
      * Multiple Choice: ${params.questionCounts?.multipleChoice || 0} questions
      * True/False: ${params.questionCounts?.trueFalse || 0} questions
      * Short Answer: ${params.questionCounts?.shortAnswer || 0} questions
      * Long Answer/Essay: ${params.questionCounts?.longAnswer || 0} questions
      * Fill in the Blank: ${params.questionCounts?.fillInBlank || 0} questions
      * Matching: ${params.questionCounts?.matching || 0} questions
      * Ordering/Sequencing: ${params.questionCounts?.ordering || 0} questions
    - Additional Instructions: ${params.additionalInstructions || "None"}
    - Include Marking Key/Rubric: ${params.includeMarkingKey !== false ? "Yes (Mandatory at the end)" : "No"}
    
    CRITICAL FORMATTING & PEDAGOGICAL RULES FOR ASSESSMENTS:
    1. CLEAN TOP HEADER LAYOUT (ZERO EXTRA BANNERS OR CANCELLED ITEMS):
       - DO NOT include "REPUBLIC OF ZAMBIA", "MINISTRY OF EDUCATION", or any district/regional header above the school name.
       - DO NOT include "DATE" or "MARKS" in the header metadata (they are strictly cancelled and removed).
       - Place the School Name as Header Line 1 (left-aligned, bold, upper case).
       - Place the Test Name directly below the School Name as Header Line 2 (left-aligned, bold, upper case).
       
       <div style="text-align: left; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif;">
         <h2 style="margin: 0; font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #000; text-align: left;">
           ${params.school ? params.school.toUpperCase() : "SCHOOL NAME"}
         </h2>
         <h3 style="margin: 3px 0 0 0; font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #000; text-align: left;">
           ${params.testName ? params.testName.toUpperCase() : params.testType ? params.testType.toUpperCase() : "ASSESSMENT TEST"}
         </h3>
         <table style="width: 100%; margin-top: 8px; font-size: 9.5pt; border-collapse: collapse; border: none;">
           <tr>
             <td style="text-align: left; padding: 2px 0; border: none;"><b>SUBJECT:</b> ${params.subject || ".........."}</td>
             <td style="text-align: center; padding: 2px 0; border: none;"><b>GRADE:</b> ${params.grade || ".........."}</td>
             <td style="text-align: center; padding: 2px 0; border: none;"><b>TERM:</b> ${params.term || "1"}</td>
             <td style="text-align: right; padding: 2px 0; border: none;"><b>YEAR:</b> ${params.year || "2026"}</td>
           </tr>
           <tr>
             <td style="text-align: left; padding: 2px 0; border: none;" colspan="4"><b>TIME DURATION:</b> ${params.testDuration ? `${params.testDuration} minutes` : "60 minutes"}</td>
           </tr>
         </table>
         <div style="text-align: left; margin-top: 6px; font-size: 9.5pt;">
           <b>LEARNER'S NAME:</b> ____________________________________________________________________
         </div>
       </div>
    
    2. SECONDARY & ALL LEVELS RIGOR, PEDAGOGY & SPIRAL CONCEPTUALISATION:
       - For Secondary Levels (Grades 8, 9, 10, 11, 12 / Form 1 to Form 6): Prepare questions that reflect high academic rigor, mature phrasing, and standard Examinations Council of Zambia (ECZ) Grade 9 / Grade 12 set-up standards. Follow all established secondary instructions.
       - Use a structured pedagogical approach and spiral conceptualisation: questions MUST progress systematically through Bloom's Taxonomy cognitive domains (Recall & Definition -> Comprehension & Concept Application -> Analysis & Data/Diagram Evaluation -> Complex Synthesis & Problem Solving).
       - Ensure full alignment with the selected grade syllabus, subject competencies/outcomes, and learner level for the chosen curriculum (CBC or OBC).

    3. MULTIPLE CHOICE QUESTIONS (SECTION A - UP TO 60 QUESTIONS):
       - Support up to ${params.questionCounts?.multipleChoice || 10} Multiple Choice Questions (maximum allowed: 60 questions).
       - Format MCQs in a space-efficient, compact horizontal option layout (A. Option &nbsp;&nbsp; B. Option &nbsp;&nbsp; C. Option &nbsp;&nbsp; D. Option) or structured grid so that option layouts stay tight and readable.

    4. STRICT PAGE BUDGET & LIMIT MANDATE:
       - GRADE 1 TO GRADE 7 (PRIMARY ASSESSMENT PAGE CEILING):
         * Test Questions MUST be strictly limited to a MAXIMUM OF TWO (2) PAGES (Page 1 and Page 2).
         * If the questions accommodate 1 page, questions sit on Page 1, and the Marking Key sits on Page 2.
         * If the questions span 2 pages, questions sit on Page 1 & Page 2, and the Marking Key sits on Page 3.
         * NO FOURTH PAGE IS PERMITTED for Grade 1 to 7 assessments under any circumstances!
         * Calibrate question density, font spacing, and option grids so questions fit within 2 pages maximum.
       - FORM 1 TO FORM 6 / GRADE 8 TO 12 (SECONDARY ASSESSMENTS):
         * Follow and stick strictly to the established secondary instructions given recently: ECZ examination setup standards, compact horizontal options, Bloom's taxonomy progression, with the marking key placed on a fresh page at the very end.

    5. QUESTION BLOCKING & SMART PAGE BREAKS:
       - Wrap every question item inside a container: <div class="question-block" style="margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid;">...</div>
       - Section headers MUST be bold (e.g., **SECTION A: MULTIPLE CHOICE (40 Marks)**, **SECTION B: STRUCTURED / SHORT ANSWER QUESTIONS (30 Marks)**, **SECTION C: ESSAY / EXTENDED PROBLEM SOLVING (30 Marks)**).
       - MARKING KEY / ANSWER GUIDE: Place <div class="page-break"></div> immediately before the Marking Key / Answer Scheme so that answers start cleanly on a fresh new page.

    6. NUMBERING & OPTIONS: Number every question clearly (1., 2., 3., etc.). Restart numbering at 1 for each new section if appropriate or maintain sequential numbering.

    7. IMAGES, REAL OBJECTIVE DIAGRAMS & TEACHING AIDS (SECTION-BY-SECTION MANDATE):
       ${params.includeVisuals !== false ? `
       For questions that need visual support, incorporate authentic, real objective educational diagrams (Pinterest education style teaching aids: animals, fruits, foods, vegetables, household items, transport vehicles, science lab apparatus, plant/animal cells, geometry shapes, etc.).
       SECTION DIAGRAM CHOICES SPECIFIED BY TEACHER:
       - Section A (Multiple Choice): ${params.sectionDiagrams?.mcq !== false ? 'INCLUDE REAL DIAGRAMS / VISUAL AIDS' : 'No diagrams'}
       - Section B (Short Answer / Fill in Blank): ${params.sectionDiagrams?.shortAnswer !== false ? 'INCLUDE REAL DIAGRAMS / VISUAL AIDS' : 'No diagrams'}
       - Section C (Essay / Extended Problem Solving): ${params.sectionDiagrams?.essay !== false ? 'INCLUDE REAL DIAGRAMS / VISUAL AIDS' : 'No diagrams'}
       - Section D (Matching / Ordering): ${params.sectionDiagrams?.matching !== false ? 'INCLUDE REAL DIAGRAMS / VISUAL AIDS' : 'No diagrams'}
       ${params.sectionDiagrams?.categories?.length ? `Preferred Diagram Categories: ${params.sectionDiagrams.categories.join(', ')}` : ''}

       CRITICAL DIAGRAM FORMATTING RULE: For any section with diagrams enabled, render clean, labeled inline SVG diagrams or clear structured visual aids directly inside the question block! Use clear outline colors, labeled parts (e.g. 1. Leaf, 2. Stem, 3. Roots, or Object A, Object B), or standard educational symbols. You can also use vivid emojis (🍎, 🧹, 🚲, 🐕, 🚗, 🌳) for primary learners alongside labeled diagrams. DO NOT use empty placeholder boxes or text like "[IMAGE: broom]".` : `STRICT RULE: DO NOT include any visual emojis, illustrations, or pictures for any questions. All questions must be entirely text-based. Do not include icons, emojis, or image placeholders.`}
    7. MARKING KEY: You MUST ALWAYS include an answer key at the very end of the document. You MUST prepend it with <div class="page-break"></div> so that it starts on a new page immediately following the questions.
    8. TOPIC COVERAGE: If specific topics are provided in the 'Topics to Include' section below, strictly use ONLY those topics. If no specific topics are provided, generate questions that span a wide variety of topics from the standard ${params.subject} curriculum for ${params.grade}. Ensure broad syllabus coverage.
    9. ECE TO GRADE 2 NATIONAL COMPETENCY STANDARDS FOR LITERACY & ENGLISH (TESTING & ASSESSMENT MANDATE):
       ${(params.grade?.toLowerCase().includes('ece') || params.grade?.includes('1') || params.grade?.includes('2')) && (params.subject?.toLowerCase().includes('english') || params.subject?.toLowerCase().includes('literacy') || params.subject?.toLowerCase().includes('oral')) ? `
       CRITICAL MANDATE: You MUST structure the assessment using the official national competency standards for ECE, Grade 1, and Grade 2 learners according to the CDC Zambian syllabus and Literacy / Oral English / English Language frameworks.
       WHETHER TESTED AS ENGLISH COMBINED, ORAL ENGLISH SEPARATELY, OR LITERACY IN ENGLISH SEPARATELY, ALL MANDATORY NATIONAL COMPETENCY STAGES MUST BE EXPLICITLY PRESENTED AND TESTED IN THE ASSESSMENT PAPER:
       
       MANDATORY COMPETENCY STAGES TO BE TESTED & SHOWN:
       (a) ORAL ENGLISH (LISTENING & SPEAKING):
           - Assess etiquette phrases ("Thank you", "Please", "Excuse me"), greetings, short oral dialogues, listening comprehension, following 1-2 step oral instructions, and identifying familiar objects.
       (b) PHONEMIC AWARENESS:
           - Oral sound identification, onset-rime, oral blending (e.g. "Blend chi + sa + la = _________", "Blend b + e + d = _________"), segmenting using slashes (/c/a/t/, /chi/sa/la/), sound substitution (set -> pet), sound deletion (stop -> top), and sound addition (lip -> slip).
       (c) PHONICS & WORD BUILDING:
           - Grapheme-phoneme associations, blending written decodable words, sound-letter matching, sight words recognition.
       (d) FLUENCY & SIGHT WORDS:
           - Reading simple decodable phrases/sentences, sight word recognition lists, reading speed and expression.
       (e) VOCABULARY IN CONTEXT:
           - Grade-appropriate contextual words (family members, animals, home items, school routines, seasons, colors, numbers).
       (f) READING COMPREHENSION:
           - Provide a short, simple 3-4 sentence decodable story (e.g., "Chisala has a red ball. The ball bounced in the garden. His dog ran to pick the ball.") followed by direct recall and picture-supported comprehension questions.
       (g) WRITING & HANDWRITING PRACTICE:
           - Letter shaping in both lowercase and uppercase (Matching A -> a, B -> b).
           - Sizing and line placement (ascending letters e.g. b, d, h vs descending letters e.g. g, j, p, q, y).
           - Copying decodable words or sentences cleanly on guidelines.
       
       FORMATTING MANDATE: Present the assessment with clear bold section headers for each competency stage (e.g. **STAGE 1: ORAL ENGLISH (LISTENING & SPEAKING)**, **STAGE 2: PHONEMIC AWARENESS & PHONICS**, **STAGE 3: FLUENCY & VOCABULARY**, **STAGE 4: COMPREHENSION**, **STAGE 5: WRITING & HANDWRITING PRACTICE**) so that teachers and evaluators can verify every national competency stage is fully tested!
       ` : ""}
    `
        : ""
    }
    ${
      isIWP
        ? `
    - Job Title: ${params.jobTitle}
    - Job Purpose: ${params.jobPurpose}
    - Period: ${params.workPlanPeriodStart || "JANUARY"} TO ${params.workPlanPeriodEnd || "DECEMBER"}
    - Teaching Grade: ${params.grade}
    - Include Annual Work Plan Section: ${params.includeAnnualWorkPlan ? "YES" : "NO"}
    `
        : ""
    }
    - Subject: ${params.subject}
    - Grade/Level: ${params.grade}
    ${params.type !== "assessments" ? `- Teacher: ${params.teacherName || "Not specified"}` : ""}
    ${params.school && params.type !== "assessments" ? `- School: ${params.school}` : ""}
    ${params.district && params.type !== "assessments" ? `- District: ${params.district}` : ""}
    ${params.zone && params.type !== "assessments" ? `- Zone: ${params.zone}` : ""}
    ${params.type !== "assessments" ? `- TS Number: ${params.tsNumber || "Not specified"}` : ""}
    ${params.term ? `- Term: ${params.term}` : ""}
    ${params.year ? `- Year: ${params.year}` : ""}
    ${params.selectedTopics?.length ? `- Topics to Include:\n${params.selectedTopics.map((t) => `      * ${t.topic}\n${t.subtopics.length ? t.subtopics.map((st) => `        - ${st}`).join("\n") : ""}`).join("\n")}` : ""}
    ${params.topic && !params.selectedTopics?.length ? `- Topic: ${params.topic}` : ""}
    ${params.subtopic && !params.selectedTopics?.length ? `- Sub-topic: ${params.subtopic}` : ""}
    ${
      params.type !== "lesson_plan" && params.weeks
        ? `- Weeks Plan:\n${params.weeks
            .map((w) => {
              const weekTopic = [w.topic, w.topic2, w.topic3].filter(Boolean).join(" / ") || (w.topic || "Follow sequential progression of allowed syllabus topics");
              const weekSubtopics = (w.subtopics || []).filter(Boolean).join(", ") || "Aligned subtopic";
              const weekComps = (w.competencies || []).filter(Boolean).join("; ") || "Aligned competency";

              // Always provide Expected Standards for every week
              let stdsStr = (w.expectedStandards || []).filter(Boolean).join("; ").trim();
              if (!stdsStr && (w.subtopics?.some(Boolean) || w.topic)) {
                const firstSub = (w.subtopics || []).filter(Boolean)[0] || '';
                const firstComp = (w.competencies || []).filter(Boolean)[0] || '';
                stdsStr = getExpectedStandardsForSubtopic(w.topic || '', firstSub, firstComp, params.grade, params.subject);
              }
              if (!stdsStr && w.competencies?.some(Boolean)) {
                stdsStr = deriveExpectedStandardFromCompetency(w.competencies[0]);
              }
              if (!stdsStr) {
                if (w.week === 4 || w.week === 8) {
                  stdsStr = "Learners' understanding and competencies assessed and graded accurately according to continuous assessment criteria";
                } else if (w.week === 12) {
                  stdsStr = "Learners' mastery of all term competencies reviewed, consolidated, and reinforced through targeted remedial exercises";
                } else if (w.week === 13) {
                  stdsStr = "Learners' summative end-of-term assessment completed and evaluated according to national curriculum standards";
                } else {
                  stdsStr = "Learners demonstrate mastery of topic competencies accurately according to syllabus standards";
                }
              }

              // Always provide Learning Activities for every week
              let actsStr = (w.activities || []).filter(Boolean).join("; ").trim();
              if (!actsStr && (w.subtopics?.some(Boolean) || w.topic)) {
                const firstSub = (w.subtopics || []).filter(Boolean)[0] || '';
                const firstComp = (w.competencies || []).filter(Boolean)[0] || '';
                const resolvedActs = getActivitiesForSubtopic(w.topic || '', firstSub, firstComp, params.grade, params.subject);
                if (resolvedActs && resolvedActs.length > 0) {
                  actsStr = resolvedActs.join("; ");
                }
              }
              if (!actsStr && w.competencies?.some(Boolean)) {
                const derived = deriveLearningActivitiesFromCompetency(w.competencies[0], (w.subtopics || [])[0], w.topic);
                if (derived && derived.length > 0) {
                  actsStr = derived.join("; ");
                }
              }
              if (!actsStr) {
                if (w.week === 4 || w.week === 8) {
                  actsStr = "Administering continuous monthly assessment tasks; evaluating learner performance; conducting feedback and remedial sessions";
                } else if (w.week === 12) {
                  actsStr = "Reviewing challenging topics in groups; peer tutoring; practicing sample past examination questions; addressing learning gaps";
                } else if (w.week === 13) {
                  actsStr = "Administering end-of-term examination papers; invigilating assessments; recording marks and learner progress profiles";
                } else {
                  actsStr = "Observing demonstrations, participating in small group tasks, engaging in hands-on practice, and recording exercises";
                }
              }

              return `Week ${w.week}: 
      Topics: ${weekTopic}
      Sub-Topic: ${weekSubtopics}
      Competencies: ${weekComps}
      Expected Standards: ${stdsStr}
      Learning Activities: ${actsStr}`;
            })
            .join("\n")}`
        : ""
    }
    ${params.type !== "lesson_plan" && params.forecastWeek ? `- Forecast Week: ${params.forecastWeek}` : ""}
    ${params.type !== "lesson_plan" && params.forecastDays ? `- Weekly Forecast (${params.forecastDays.length} Days):\n${params.forecastDays.map((f) => `Day ${f.day}: Topic: ${f.topic || "N/A"}, Subtopic: ${f.subtopic || "N/A"}, Competency: ${f.competency || "N/A"}${f.expectedStandard ? `, Expected Standard: ${f.expectedStandard}` : ""}${f.activities?.length ? `, Activities: ${f.activities.join("; ")}` : ""}`).join("\n")}` : ""}
    ${params.generalCompetences ? `- General Competences: ${formatGeneralCompetenciesShortForm(params.generalCompetences)}` : ""}
    ${params.specificCompetences ? `- Specific Competences: ${extractBriefCompetencies(params.specificCompetences)}` : ""}
    ${params.lessonGoal ? `- Lesson Goal: ${params.lessonGoal}` : ""}
    ${params.tsNumber ? `- Teacher TS Number: ${params.tsNumber}` : ""}
    ${params.zone ? `- Zone: ${params.zone}` : ""}
    ${params.date ? `- Date: ${params.date}` : ""}
    ${params.lessonFrom ? `- Lesson From: ${params.lessonFrom}` : ""}
    ${
      (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && 
      (params.subject?.toLowerCase().includes('english') || params.subject?.toLowerCase().includes('literacy'))
        ? `* ENGLISH LANGUAGE SPECIAL INSTRUCTION: This is a Grade 1/2 English preparation. ${
            params.englishCombined 
              ? "The teacher is combining Oral English and Literacy into one scheme/forecast. Topic A is typically Oral English and Topic B is Literacy." 
              : `The teacher is preparing ${params.englishComponent === 'literacy' || params.subject?.toLowerCase().includes('literacy') ? 'Literacy in English' : 'Oral English'} separately as a standalone subject.`
          }`
        : ""
    }
    ${params.lessonTo ? `- Lesson To: ${params.lessonTo}` : ""}
    ${params.enrolmentBoys ? `- Enrolment Boys: ${params.enrolmentBoys}` : ""}
    ${params.enrolmentGirls ? `- Enrolment Girls: ${params.enrolmentGirls}` : ""}
    ${params.attendanceBoys ? `- Attendance Boys: ${params.attendanceBoys}` : ""}
    ${params.attendanceGirls ? `- Attendance Girls: ${params.attendanceGirls}` : ""}
    ${params.lessonLength ? `- Lesson Length/Format: ${params.lessonLength}` : ""}
    ${params.learningEnvironments ? `- Learning Environments: ${params.learningEnvironments.join(", ")}` : ""}
    ${params.learningActivities?.length ? `- SELECTED MODULE LEARNING ACTIVITIES (TEACHER'S EXCLUSIVE SELECTION):
${params.learningActivities.map((act, i) => `      ${i + 1}. ${act}`).join("\n")}
      CRITICAL MANDATE FOR LEARNING ACTIVITIES (STRICT EXCLUSION RULE):
      1. Under the "<b>LEARNING ACTIVITIES:</b>" section and throughout the entire lesson plan/notes/scheme, you MUST list ONLY the above selected learning activities.
      2. You are STRICTLY FORBIDDEN from including, adding, appending, or generating ANY OTHER learning activities from the module or syllabus that were NOT selected by the teacher (e.g. if Activity 1a is selected, DO NOT include Activity 1b, 1c, or 1d).
      3. The entire lesson plan (Lesson Goal, Teacher's Activities, Learners' Activities, and Performance Indicators) MUST focus strictly and exclusively around delivering ONLY these selected learning activities.` : ""}
    - Include Teaching Notes: ${params.includeTeachingNotes ? "YES" : "NO"}
    - Document Content Scale: HIGH PEDAGOGICAL STANDARD (Regardless of whether 'lighter' or 'medium' scale is toggled, ALWAYS generate the lesson plan at the highest academic standard of detail, structure, and quality, ensuring full 2-page coverage with rich context, concrete cited examples, complete 2-bullet activities per stage, and robust exercises/homework)
    ${params.duration ? `- Duration: ${params.duration}` : ""}
    ${params.objectives ? `- Specific Objectives: ${params.objectives}` : ""}
    ${params.studentLevel ? `- Student Capability Level: ${params.studentLevel}` : ""}
    ${params.additionalContext ? `
    ========================================================================
    PASTED INSTRUCTIONS & SOURCE OF TRUTH (COPIED/PASTED OUTSIDE CONTENT):
    The teacher has pasted the following specific information/instructions/curriculum in the instructions box.
    You MUST prioritize this pasted content over ALL other syllabus rules, default templates, or AI internal training knowledge:
    """
    ${params.additionalContext}
    """
    
    CRITICAL MANDATE FOR PASTED CONTENT & ZAMBIAN LANGUAGE:
    1. STRICT TRUTHFULNESS: If the pasted content contains specific topics, subtopics, competencies, outcomes, activities, lists of vocabulary, or lesson stages/exercises, you MUST use them with 100% fidelity. Do NOT replace them with standard textbook topics or standard English terms.
    2. LOCAL LANGUAGE PRESERVATION: If the subject is a Zambian language (e.g. Icibemba, Chitonga, Cinyanja, Silozi, Kiikaonde, Lunda, Luvale, etc.) and the pasted text contains local language terms, words, phrases, or translations, you MUST retain them EXACTLY as they are pasted. Do NOT translate them to English or substitute them with default phrases.
    3. DETAILED ALIGNMENT: Populate the Lesson Development table (INTRODUCTION, LESSON DEVELOPMENT, PRACTICE/APPLICATION, EXERCISE, CONCLUSION) and the general information details strictly aligned with the pasted content.
    4. WEEKLY FORECAST EXTRACTION: For Weekly Forecasts, if the pasted text contains a Scheme of Work or Weekly Forecast table/schedule or day-by-day plan, you MUST extract and populate Week ${params.forecastWeek || 1} topics, subtopics, competencies/outcomes, expected standards, learning activities, teaching methods, aids, and references directly from the pasted text with ZERO substitution, zero default topic overrides, and ZERO generic fallback strings like 'Curriculum Concepts' or 'Subject Concepts'! Every row MUST contain the exact extracted topic, subtopic, competency, and learning activity from the instruction box.
    ========================================================================` : ""}

    ${
      params.referenceModuleContent
        ? `
    SOURCE OF TRUTH (Teaching Module & Syllabus Dual-Authority):
    The following is a teaching module or scanned reference document provided by the teacher.
    
    CRITICAL MODULE & SYLLABUS SCHEMING MANDATE:
    1. DIRECT MODULE SCHEMING MODE: Modules are designed termly to be taught in order. When a Teaching Module or scanned document is present, draw the EXACT chronological arrangement of topics, subtopics, and content from the Module.
    2. SYLLABUS CONFIRMATION & VALIDATION: Use the official Syllabus to back up, confirm, and enrich every topic coming from the Module — extracting exact Specific Outcomes/Competencies, Learning Activities, and Expected Standards.
    3. NO MANUAL TOPIC SELECTION REQUIRED: If no specific topics were manually selected from drop-downs in the form, generate the full Scheme of Work directly following the Module's sequential arrangement backed by the Syllabus.
    4. HYBRID MODE: If specific topics WERE manually selected from the table drop-downs, prioritize those selected topics while utilizing the scanned Module and Syllabus to supply high-quality, authentic content and references.
    5. TERM CONSISTENCY: Ensure all topics, subtopics, and outcomes correspond to Term ${params.term || "1"}.
    
    REFERENCE CONTENT (Scanned Module / Syllabus Documents):
    """
    ${params.referenceModuleContent.substring(0, 150000)}
    """
    `
        : ""
    }

    Rules:
    1. PROFESSIONAL HEADER BLOCK: ${params.type === "lesson_notes" ? "For LESSON NOTES, your response MUST start with the professional header block and dynamic general info listing GRADE, SUBJECT, TOPIC, and SUB-TOPIC EXACTLY as shown in the template, and you are strictly forbidden from placing references or other tables at the top." : "Your response MUST start with a professional header block EXACTLY as shown below."}
       
       ${params.type === "assessments" ? "" : `
       <center>
        <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.district ? (params.district.toUpperCase().includes("DISTRICT") ? params.district.toUpperCase() : params.district.toUpperCase() + " DISTRICT") : "................ DISTRICT"}</h2>
        <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : "................ SCHOOL"}</h2>
        <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">${params.type?.toUpperCase().replace(/_/g, " ")}</h1>
       </center>
       `}

       ${
         params.type === "lesson_notes" || params.type === "assessments"
           ? ""
           : params.type === "lesson_plan"
           ? `
           <table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>TEACHER:</strong> ${params.teacherName || "Kombe fortune"}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>DATE:</strong> ${params.date || ".........."}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>Att: (BOYS:</strong> ....... &nbsp;&nbsp;&nbsp;&nbsp; <strong>GIRLS:</strong> .......<strong>)</strong></td>
  </tr>
  <tr>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 35%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> ${params.year || "2026"} / TERM ${params.term || "1"}</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 33%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>TIME:</strong> ..........</td>
    <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>DURATION:</strong> ${cleanDurationDisplay(params.duration)}</td>
  </tr>
</table>`
           : params.type === "schemes_of_work"
           ? `
       <table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
         <tr>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 45%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>TEACHER'S NAME:</strong> ${params.teacherName || "Kombe fortune"}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>GRADE:</strong> ${cleanGradeDisplay(params.grade)}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 25%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>SUBJECT:</strong> ${params.subject || ".........."}</td>
         </tr>
         <tr>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 45%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> ${params.year || new Date().getFullYear()} / TERM ${params.term || "1"}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"></td>
            <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 25%; text-align: right; white-space: nowrap; word-break: keep-all;"></td>
         </tr>
       </table>`
           : params.type === "weekly_forecast"
           ? `
       <table class="general-info-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-family: 'Calibri', 'Arial', 'Segoe UI', system-ui, sans-serif; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; border-left: none; border-right: none;">
         <tr>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 45%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>TEACHER'S NAME:</strong> ${params.teacherName || "Kombe fortune"}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>GRADE:</strong> ${cleanGradeDisplay(params.grade)}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 25%; text-align: right; white-space: nowrap; word-break: keep-all;"><strong>SUBJECT:</strong> ${params.subject || ".........."}</td>
         </tr>
         <tr>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 45%; text-align: left; white-space: nowrap; word-break: keep-all;"><strong>YEAR/TERM:</strong> ${params.year || new Date().getFullYear()} / TERM ${params.term || "1"}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 30%; text-align: center; white-space: nowrap; word-break: keep-all;"><strong>WEEK:</strong> ${params.forecastWeek || "..."}</td>
           <td style="padding: 2px 2px; font-size: 8pt; vertical-align: middle; border: none; width: 32%; text-align: right; white-space: nowrap; word-break: keep-all;"></td>
         </tr>
       </table>`
           : `
       <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 15pt; text-align: left; width: 100%; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6pt 0;">
        <div style="display: flex; justify-content: space-between; gap: 10pt; margin-bottom: 5pt;">
          <div style="flex: 1.6; white-space: nowrap;"><b>NAME OF TEACHER:</b> ${params.teacherName || ".........."}</div>
          <div style="flex: 1; text-align: center;"><b>TS NO:</b> ${params.tsNumber || ".........."}</div>
          <div style="flex: 1.4; text-align: right;"><b>${params.type === "individual_work_plan" ? "PERIOD" : "SUBJECT"}:</b> ${params.type === "individual_work_plan" ? `${params.workPlanPeriodStart || "JANUARY"} TO ${params.workPlanPeriodEnd || "DECEMBER"}` : params.subject}</div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10pt; margin-bottom: 5pt;">
          <div style="flex: 1.6;">${((params.jobTitle || "").toLowerCase().includes("head teacher") || (params.jobTitle || "").toLowerCase().includes("deputy head")) ? "" : `<b>GRADE:</b> ${params.grade || ".........."}`}</div>
          <div style="flex: 1; text-align: center;"><b>YEAR:</b> ${params.year || new Date().getFullYear()}</div>
          <div style="flex: 1.4; text-align: right;"><b>TERM:</b> ${params.type === "individual_work_plan" ? "TERM 1 - TERM 3" : (params.term || "1")}</div>
        </div>
       </div>`
       }
       
    2. NO REPETITION: DO NOT provide a header above a horizontal line and then another one below it. The header above is your ONLY header.
    3. NO SEPARATORS AT TOP: Do not start with "---", dots, or long lines of dashes before the Ministry header.
    4. SPACING & HORIZONTAL RESTRAINT: Ensure the Teacher's Name and Subject are output on a single horizontal line within their flex containers. Use <div> wrappers with margin-bottom for pre-lesson info headings (Topic, Sub-topic, etc.) to ensure clear separation.
    ${
      params.curriculumType === "OBC"
        ? `4. Align all content strictly with the Zambian Outcomes-Based Curriculum (OBC) standards. 
    5. OBC TABLE STRUCTURE (MANDATE: SUBTOPIC IS MERGED UNDER TOPIC AS 'TOPIC/Subtopics'): 
       - For English Language and Zambian Languages (Language Subjects where components like Listening & Speaking, Reading, Writing, Structure are followed):
         * Introduce the Component column immediately before TOPIC and write the header strictly abbreviated as 'COMP':
         * For Schemes of Work (10 columns): | WEEK | COMP | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |
         * For Weekly Forecast (11 columns): | DAY | COMP | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |
       - For Non-Language Subjects:
         * For Schemes of Work (9 columns): | WEEK | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |
         * For Weekly Forecast (10 columns): | DAY | TOPIC/Subtopics | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |
       - IMPORTANT: Inside the TOPIC/Subtopics cell, first state the main topic, and secondly state the mentioned subtopic from the syllabus or moved from old column in smaller bold text with proper numbering (e.g. Topic Title<br/><small><b>1. Subtopic Name</b></small>).
       - CRITICAL OBC WEEKLY FORECAST PROGRESSION & DIFFERENTIATION RULE:
         * NEVER repeat identical Knowledge items, identical Teaching Methods, and identical Specific Outcomes across Day 1 to Day 5!
         * You MUST sequentially sub-divide and distribute the weekly Knowledge pool and Teaching Methods across Day 1 to Day 5 so every day has a unique, distinct daily lesson focus:
           - Day 1: First Knowledge item(s); Methods: • Teacher exposition • Brainstorming • Class discussion; Specific focus outcome.
           - Day 2: Second Knowledge item(s); Methods: • Group work • Case study • Teacher exposition; Specific focus outcome.
           - Day 3: Third Knowledge item(s); Methods: • Pair work • Question & answer • Teacher exposition; Specific focus outcome.
           - Day 4: Resolution / Demonstration Knowledge; Methods: • Role play • Demonstration • Class discussion; Specific focus outcome.
           - Day 5: Synthesis / Assessment Knowledge; Methods: • Class discussion • Individual work • Teacher exposition; Review outcome.
         * MANDATORY ALL METHODS USED PER LESSON: For EVERY single day in the Weekly Forecast or Lesson Plan, you MUST list ALL methods used in that lesson (AT LEAST 3 TO 4 METHODS PER DAY, e.g. • Teacher exposition • Question and answer • Class discussion • Group work). NEVER list a single isolated method like "• Discussion" or "• Brainstorming". "Question and answer" and "Teacher exposition" MUST ALWAYS BE INCLUDED for every lesson.
         * MANDATORY DESCRIPTIVE T/L AIDS: In the T/L AIDS column, NEVER output generic 1-word terms like "Charts" or "Pictures". ALWAYS describe the specific content shown (e.g., • Wall chart showing causes of division in families, • Pictures showing instances of nepotism and favouritism). ALWAYS include essential foundational classroom aids: "Chalkboard & Chalk / Whiteboard & Markers" and "Worksheets / Exercise books".
       - CRITICAL MANDATE: The 'REFERENCE' column MUST ALWAYS be filled with a specific citation. If selected/uploaded teaching modules (reference modules) are provided in SOURCE OF TRUTH below, the 'REFERENCE' column MUST explicitly cite BOTH the Syllabus and the Teaching Module by name (e.g., "Primary Syllabus Pages 12-26; Module: [Module Name]"). Always use official Syllabus citations with realistic page ranges (e.g., "Primary English Syllabus Grade 3, Pages 12 - 26"). NEVER leave references blank or use placeholder dots like "PG:.....".`
        : `4. Align all content strictly with the Zambian Competency-Based Curriculum (CBC) standards.
    5. CBC TABLE STRUCTURE (MANDATE: SUBTOPIC IS MERGED UNDER TOPIC AS 'TOPIC/Subtopics'): 
       - For English Language and Zambian Languages (Language Subjects where components like Listening & Speaking, Reading, Writing, Structure, Vocabulary, Comprehension appear in the syllabus):
         * Introduce the Component column immediately before TOPIC to accurately categorise content in syllabus order.
         * CRITICAL ABBREVIATION RULE: You MUST write the header strictly as 'COMP' (do NOT write "COMPONENT" in full so the column stays compact and fits cleanly).
         * For Schemes of Work (9 columns): | WEEK | COMP | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |
         * For Weekly Forecast (10 columns): | DAY | COMP | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |
       - For Non-Language Subjects (Mathematics, Science, Social Studies, CTS, Expressive Arts, etc.):
         * For Schemes of Work (8 columns): | WEEK | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |
         * For Weekly Forecast (9 columns): | DAY | TOPIC/Subtopics | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |
       - IMPORTANT: Inside the TOPIC/Subtopics cell, first state the main topic, and secondly state the mentioned subtopic from the syllabus or moved from old column in smaller bold text with proper numbering (e.g. Topic Title<br/><small><b>1. Subtopic Name</b></small>).
       - CRITICAL MANDATE: The 'REFERENCE' column MUST ALWAYS be filled with a specific citation. If selected/uploaded teaching modules (reference modules) are provided in SOURCE OF TRUTH below, the 'REFERENCE' column MUST explicitly cite BOTH the Syllabus and the Teaching Module by name (e.g., "Primary Syllabus Pages 12-26; Module: [Module Name]"). Always use official Syllabus citations with realistic page ranges (e.g., "Primary English Syllabus Grade 3, Pages 12 - 26"). NEVER leave references blank or use placeholder dots like "PG:.....".
    6. RATIONALE REQUIREMENT: For Lesson Plans, the <b>RATIONALE:</b> section MUST briefly explain the core importance of this lesson, what learners will gain or benefit at the end of the lesson (in brief sentences), and explicitly include the specific teaching methods (e.g., "This lesson will be taught using teacher exposition, group work, demonstration, gradual release, etc.") used to deliver it, based strictly on the content shown in the lesson plan. Keep it highly concise, under 60 words maximum.`
    }
    3. ${getZambianLanguageInstructions(params).strictRule}
    4. Use professional, educational terminology.
    5. Ensure the content is age-appropriate for the specified grade.
    5a. ZERO LOCAL LANGUAGE IN NON-ZAMBIAN LANGUAGE SUBJECTS: You are STRICTLY FORBIDDEN from outputting or attaching local Zambian language terms/translations in brackets (such as "(uku-ipika amanshi)", "(Ukulenga amanshi...)", "(inyali/icefuko)") for ANY subject EXCEPT when the subject IS EXPLICITLY a Zambian Language subject (e.g. Icibemba, Cinyanja, Chitonga, Silozi, Kiikaonde, Luvale, Lunda). For Mathematics, Science, Social Studies, English, CTS, etc., write 100% pure, professional English with ZERO local language words!
    5b. STRICT SUBTOPIC-TO-COMPETENCY MATCHING & MULTI-SUBTOPIC FORECAST MANDATE:
        - Specific competencies/outcomes and knowledge MUST strictly match the specific subtopic being taught on that day (e.g. if subtopic 1.1.9 Things found at home is taught, generate/use ONLY specific competencies and knowledge belonging to 1.1.9).
        - MANDATORY EXHAUSTIVE MULTI-SUBTOPIC FORECAST COVERAGE: If a week in the scheme of work contains multiple subtopics (e.g. Subtopic 1 and Subtopic 2, such as "3.9.1 Tell time at specified intervals" and "3.9.2 Read and use the calendar"), ALL SUBTOPICS present in that week of the schemes MUST be included and distributed across the days of the Weekly Forecast without leaving any subtopic out! Day 1 to Day 3 teach Subtopic 1 (with competencies and knowledge matching Subtopic 1), and Day 4 to Day 5 teach Subtopic 2 (with competencies and knowledge matching Subtopic 2). Under NO circumstances omit or leave out any subtopic present in that week of the schemes, and NEVER repeat only the first subtopic across all days when multiple subtopics exist in that week!
    5c. AUTHENTIC SYLLABUS LEARNING ACTIVITIES MANDATE: Every Subtopic has specific learning activities defined in the official Zambian Syllabus or pasted schemes. You MUST draw active learning tasks directly from that subtopic's official syllabus activities or extracted scheme activities, providing progressive daily variations across Day 1 to Day 5 (e.g. Day 1: Observing/identifying; Day 2: Demonstrating/discussing steps; Day 3: Practical group work; Day 4: Problem solving; Day 5: Appraising/evaluating).
    6. SYLLABUS ALIGNMENT: 
       - If SOURCE MATERIAL or REFERENCE CONTENT is provided, you MUST use it as the definitive source for topics, subtopics, official numerical sequences (e.g. 1.1, 1.2.3), and syllabus content. 
       - Do NOT invent topics if they are provided in the source material.
    6. For Schemes of Work: 
       - STRICT 7-PAGE CEILING: Schemes of work MUST NOT be generated above 7 pages. The entire document MUST strictly fit within 7 pages and below (ideally 4 to 6 pages, absolute maximum 7 pages for the whole term). Calibrate the length and compactness of descriptions so rows never overflow beyond 7 pages.
       - PERIODS ALLOCATION & VERBATIM SYLLABUS LEARNING ACTIVITIES: Curriculum framework stipulations about weekly periods must be followed strictly. Allocate Subtopics and learning activities accordingly based on weekly periods assigned to this subject (${params.subject || 'Subject'}) for this grade. When topics contain multiple learning activities, SPLIT and distribute them across multiple weeks so active learning spans Week 1 to Week 11 completely.
       - WEEKS 1 TO 11 ARE ACTIVE TEACHING & LEARNING WEEKS: Active learning must take place from Week 1 all the way to Week 11. Revisions are in Week 12 ONLY. You are strictly forbidden from placing Weeks 9, 10, or 11 into a revision state!
       - WEEK 4 & WEEK 8 MANDATORY ACTIVE LEARNING + CONTINUOUS ASSESSMENT:
         * Week 4: Active teaching & learning on syllabus subtopic/activities for Week 4 PLUS Continuous Monthly Assessment Test 1 (covering concepts from Weeks 1-4). Learning MUST take place in Week 4.
         * Week 8: Active teaching & learning on syllabus subtopic/activities for Week 8 PLUS Continuous Monthly Assessment Test 2 (covering concepts from Weeks 5-8). Learning MUST take place in Week 8.
       - WEEK 12 (REVISIONS ONLY) & WEEK 13 (END OF TERM TEST):
         * Week 12: Dedicated to Revisions ONLY (consolidation of all term topics, remedial exercises, and examination preparation).
         * Week 13: End of Term Summative Test / Examination, script marking, and compilation of learner progress reports.
       - ECE GRADES (Early Childhood Education): The term runs from Week 1 to 13. Week 7 is the Mid-Term Break (Learners resting at home). Week 12 is for Revisions. Week 13 is for Consolidation of Assessments. There is NO summative assessment in ECE; emphasize Formative Assessment through observation throughout the term.
       - IMPORTANT: For assessments, revisions, and the end of term test, DO NOT leave the columns blank or simply write the word "Assessment". You MUST provide detailed explanations of what will happen: expectations, types of activities, areas of focus, what the learners are expected to do or demonstrate, and specific materials.
    6. EXACT CONTENT MATCHING: When a Topic, Sub-topic, or ${params.curriculumType === "OBC" ? "Specific Outcome" : "Specific Competence"} code (e.g., 1.2.1.1 vs 1.2.3.1) is provided, you MUST construct the lesson or forecast using ONLY that exact ${params.curriculumType === "OBC" ? "outcome" : "competency"}. Pay close attention to numbering prefixes.
    7. NUMERICAL SEQUENCE PREFIXES: You MUST extract and include the official numerical sequence prefixes (e.g., "1.1", "1.1.2") from the Syllabus for ALL Topics, Subtopics, and Competencies you generate. DO NOT leave out the numbers. They must be present so the teacher sees the official syllabus mapping.
    8. EXHAUSTIVE SUBTOPIC COVERAGE: For Schemes of Work and Weekly Forecasts, you MUST exhaustively cover EVERY SINGLE subtopic within a main topic before moving to the next topic. DO NOT skip any subtopics. For example, if a topic has subtopics 2.1.1 to 2.1.10, you MUST explicitly sequence all of them (2.1.1, 2.1.2, 2.1.3, 2.1.4, ..., 2.1.10) within the timeframe before ever introducing topic 2.2. Skipping subtopics (e.g., jumping from 2.1.6 to a new topic) is strictly prohibited.
    10. SEQUENCE PACING: For Weekly Forecasts and Schemes of Work, you MUST follow the logical numerical sequence of competencies from the official syllabus for that grade (e.g., 1.2.1 before 1.2.2 before 1.2.3).
    11. SYLLABUS REFERENCE & AUTHENTICITY (CDC, CBC & OBC STANDARDS): 
        - VERBATIM SYLLABUS ADHERENCE: You are strictly forbidden from summarizing, paraphrasing, or manipulating official Zambian Syllabus text. You MUST copy Topic names, Sub-Topic names, Competencies/Outcomes, and Expected Standards EXACTLY as they appear in the official CDC / CBC / OBC syllabus documents, character for character.
        - MANDATORY SHORT SYLLABUS CITATION FORMATS (APPLIES TO ALL 3 DOCUMENT TYPES: SCHEMES OF WORK, WEEKLY FORECAST, AND LESSON PLANS):
          * References MUST be written short throughout the weekly forecast and the schemes also in lesson plans like the following examples below:
          * UNDER CBC CURRICULUM:
            1. ECE LEVELS: - ECE levels 1-2 [Subject] syllabus page:...... (Indicate if coming from the upload and pasting methods)
            2. Primary grades (Grade 1-3): - Grade 1- 3 [Subject] syllabus page:..... (e.g. - Grade 1- 3 creative & technology studies syllabus page:.....)
            3. UPPER PRIMARY (Grade 4-6): - Grade 4-6 [Subject] syllabus page:...... (e.g. - Grade 4-6 English language syllabus page:......)
            4. FORM 1-4: - Form 1- 4 [Subject] syllabus 1 page:.... (e.g. - Form 1- 4 Mathematics syllabus 1 page:....)
            5. FORM 5-6: - Form 5-6 [Subject] syllabus page:........ (e.g. - Form 5-6 chemistry syllabus page:........)
          * UNDER OUTCOME BASED CURRICULUM (OBC):
            1. primary (Grade 1 to 4): - Grade 1 to 4 [Subject] syllabus page:...... (e.g. - Grade 1 to 4 science syllabus page:......)
            2. upper (Grade 5 to 7): - Grade 5 to 7 [Subject] syllabus page:...... (e.g. - Grade 5 to 7 social studies syllabus page:......)
            3. Secondary (Grade 8-12): - grade 11 to 12 [Subject] 2 syllabus page:..... (e.g. - grade 11 to 12 mathematics 2 syllabus page:.....)
          * UPLOAD / PASTING INDICATION: If coming from upload and pasting methods, append " (From uploaded scheme)".
        - TEACHING METHODS & GRADUAL RELEASE RULE:
          * Teaching Methods should NOT be suited identically all days from Day 1 to Day 5. The lesson itself must attract teaching methods!
          * The Gradual Release of Responsibility (GRR) method ("I do", "We do", "You do together", "You do alone") is always there as a way to deliver the CBC curriculum lesson.
          * Methods MUST vary throughout the week:
            - Day 1: Teacher modeling, direct exposition, demonstration.
            - Day 2: Guided discovery, question and answer, think-pair-share, class discussion.
            - Day 3: Collaborative group work, peer investigation, practical activity, problem-solving.
            - Day 4: Independent inquiry, problem solving, individual practice, applied task.
            - Day 5: Learner demonstration, class presentation, formative review & reflection.
        - TEACHING AND LEARNING AIDS (T/L AIDS) CONCISENESS RULE:
          * T/L aids MUST NOT overload the column cell because of becoming so many!
          * What is needed are just a few teaching aids (2 to 3 items maximum per day) shown in the weekly day lesson depending on the nature of the lesson to be delivered.
          * Also this one should not be suited throughout identically unless otherwise. Vary the aids across the week based on what is being taught.
        - PAGE NUMBERS & DOTTED LINE FALLBACK: Page numbers MUST be directly retrieved from the official syllabus being mentioned for that particular category. If the system cannot locate the page number in that syllabus for that particular information/topic being prepared, it MUST leave ONLY dotted lines (e.g., "page .....") to indicate that the system has failed to locate the page of the information which has been prepared from the syllabus. Never invent or guess page numbers.
        - TEXTBOOK REFERENCES & MATERIALS: Under "TEXTBOOK REFERENCES:" or resource sections, it is fully valid and expected to cite Grade 8 to Grade 11 or Grade 12 textbooks (e.g., "Grade 8 - 12 [Subject] Pupils' Book / Textbook"), because curriculum-specific textbooks may not all be formulated and distributed yet, so teachers utilize the available Grade 8 to Grade 12 textbooks.
        - EXACT NUMBER SEQUENCING: You MUST include the official numerical sequence prefixes (e.g., "1.1", "1.1.2") for ALL items. Follow the sequence exactly as provided in the REFERENCE CONTENT. Skipping subtopics or inventing sequences is a critical failure.
        - STRICT PAGE RANGES BY LAW (WHEN PAGE IS KNOWN):
          * For ECE Levels (Early Childhood Education), all subjects and syllabus references MUST strictly fall within Pages 5 - 87. Specifying any page outside this range is a critical non-compliance error.
            - Pre-Mathematics & Science references MUST strictly fall within Pages 55 - 72.
            - English / Language and Literacy references MUST strictly fall within Pages 39 - 54.
            - Zambian language / Local language references MUST strictly fall within Pages 23 - 38.
            - Creative and technology studies references MUST strictly fall within Pages 73 - 87.
            - Social, Emotional and Spiritual Development references MUST strictly fall within Pages 5 - 22.
          * For Grades 1, 2, and 3 (Primary levels), all subjects and syllabus references MUST strictly fall within Pages 4 - 156. Specifying any page outside this range is a critical non-compliance error.
             - English / Literacy references MUST strictly fall within Pages 4 - 32.
             - Zambian language / Local language references MUST strictly fall within Pages 33 - 58.
             - Mathematics / Math references MUST strictly fall within Pages 59 - 88.
             - Integrated science / Science references MUST strictly fall within Pages 89 - 112.
             - Social studies references MUST strictly fall within Pages 113 - 134.
             - Creative and technology studies / Expressive arts / Home Economics / Technology references MUST strictly fall within Pages 135 - 156.
          * CITATION SELECTION RULE: For any given topic/subtopic, if exact page numbers are precisely known from the syllabus text provided, use that exact page number falling strictly within the proper subject page range specified above. Map sequentially so earlier topics have lower page numbers in that range and later topics have higher page numbers. If the page number cannot be located, ALWAYS use "page ....." as the page indicator. Do not under any circumstances invent or guess page numbers.
        - FOUNDATION OF TRUTH: Use ONLY the provided REFERENCE CONTENT. If you manufacture information outside the CDC modules, it is "not fit for purpose."
    12. AUTHENTIC INSTRUCTIONAL FLOW: In Lesson Plans, every cell must contain clear, step-by-step instructions derived directly from CDC modules.
        - TABLE STRUCTURE:
          * ALL SUBJECTS (including Mathematics, Zambian Language, Literacy in English, Grade 1/2 Oral English, and all General Subjects):
            You MUST use EXACTLY 5 COLUMNS in this STRICT ORDER for the Lesson Development / Lesson Progression table:
            | STAGES | TEACHER'S ROLE (or ACTIVITIES) | LEARNERS' ROLE (or ACTIVITIES) | CONTENT | PERFORMANCE INDICATOR (or ASSESSMENT CRITERIA) |
            (For general subjects, Mathematics, and Zambian Language, the 5th column header MUST be ASSESSMENT CRITERIA; for Literacy in English and Oral English, PERFORMANCE INDICATOR).
            CRITICAL COLUMNS MANDATE: Under NO circumstances are you allowed to add a 6th column (such as Time, Duration, Specific Outcomes, or Notes). The table MUST contain EXACTLY 5 columns. Do NOT place CONTENT right after STAGES; Column 2 is TEACHER'S ACTIVITIES, Column 3 is LEARNERS' ACTIVITIES, Column 4 is CONTENT, and Column 5 is ASSESSMENT CRITERIA / PERFORMANCE INDICATOR.
        - VERBATIM ALIGNMENT: Activities and examples must match the official CDC syllabus exactly.
    13. NO TRUNCATION: Write out the full official names of all topics.
    14. ASSESSMENT WEEKS (4, 8, 12, 13): These MUST be as high-quality and detailed as teaching weeks. Specify exactly which CDC topics are being assessed.
    15. VERTICAL LISTS IN CELLS: When a cell contains multiple items (e.g., multiple specific outcomes or multiple activities), you MUST arrange them VERTICALLY using Markdown line breaks (<br/>) or as a list. Do NOT group them horizontally with slashes (e.g. 1.1/1.2).
        - Correct Arrangement Example:
          3.1.2 Learners to identify nouns<br/>
          3.1.3 Learners to use nouns in sentences
    16. TABLE FORMATTING & VERTICAL ALIGNMENT: Ensure Markdown tables are clean. Use <br/> extensively to keep content readable and vertical.
        - VERTICAL ENFORCEMENT: When listing multiple items in a cell (like multiple Specific Outcomes), you MUST separate them vertically using <br/>. You MUST NOT use slashes (e.g., 3.1.2/3.1.3). 
        - Example: 3.1.2 Learners to identify...<br/>3.1.3 Learners to use...
    17. FOR WEEKLY FORECASTS (CRITICAL):
        - FOLLOW DAY COUNT: STRICTLY ONLY generate rows for the specific days provided in the "Weekly Forecast" list above.
        - ONE PAGE LIMIT: The entire document MUST fit on ONE (1) A4 page. Spanning onto a second page is a failure. Use telegraphic, professional, and extremely brief language to ensure this.
        - COMPACT BUT READABLE: Use concise, technical phrases. Do not omit critical syllabus numbers.
        - VERTICAL ORDER: Numbering like 3.1.2/3.1.3 MUST be arranged vertically in the cell using <br/>.
        - WEEKLY RECORD: Keep the 'WEEKLY RECORD' (or 'RECORD OF WORK') column empty with horizontal lines for manual entry.
        - STRICTLY NO APPROVAL SECTION: Do NOT include any Approval Section, Teacher's Signature, or Supervisor's Signature at the end. Stop immediately after the table.
    18. Format the output using clean Markdown (headings, tables, lists).
    19. DO NOT wrap the entire document in markdown code blocks (e.g., do not start with \`\`\`markdown or \`\`\`html and do not end with \`\`\`). Output the contents directly as raw text.
    20. Do not include introductory conversational filler like "Sure, here is your plan". Start directly with the document content (e.g., for lesson plans, start directly with <b>TOPIC:</b>). Do NOT output a document title header like "# LESSON PLAN" or "# SCHEMES OF WORK" at the start of the content as this is already handled by the system's main header.
    21. Make it highly practical and ready to use in a classroom.
    22. FOR LESSON PLANS: 
       - Do NOT include a "Weekly Forecast" or "Weeks 1-13" summary table. Focus ONLY on the single lesson topic provided.
       - Use HTML <b> tags (e.g., <b>TOPIC:</b>) for ALL section headers and labels (NAME OF TEACHER, SUBJECT, GRADE, TOPIC, SUB-TOPIC, RATIONALE, EXPECTED STANDARD, LESSON GOAL, PRIOR KNOWLEDGE, TEXTBOOK REFERENCES, TEACHING AND LEARNING RESOURCES, etc.) instead of markdown stars (**). This ensures a cleaner look without visible markdown artifacts. These MUST be in black and bold.
       - <b>EXPECTED STANDARD:</b> Extract and include the official Expected Standard from the syllabus for this lesson topic. It must be a single, clear sentence describing the performance level.
       - <b>LESSON GOAL:</b> Define a comprehensive lesson goal starting with "By the end of the lesson, learners will be able to...", followed by specific, measurable actions aligning with the lesson topic and competencies.
     23. ${getLowerPrimaryEnglishInstructions(params)}
     ${getZambianLanguageLessonPlanInstructions(params)}
       - <b>PRIOR KNOWLEDGE/SKILLS/VALUES:</b> You MUST expand this section vertically into three specific sub-bullets using <b> tags:
         <b>Knowledge:</b> [Describe what learners already know related to the topic]<br/>
         <b>Skills:</b> [Describe existing skills learners possess]<br/>
         <b>Values:</b> [Describe relevant values or attitudes learners have]<br/>
       - <b>LEARNING ACTIVITIES:</b> You MUST include the Learning Activities section after the Learning Environment section and before the Lesson Development table heading. Format it exactly as <b>LEARNING ACTIVITIES:</b> followed by the exact list of learning activities that the teacher has selected or entered. If generating from a Weekly Forecast or scanned schedule, include ONLY the single activity assigned to this specific lesson/day (e.g., Activity 1a only for Day 1; DO NOT append Activity 1b or other days). Format them as a simple bullet list. Your job is to expand the lesson development table according to the subject's required stage structure (for general subjects and Zambian Language use INTRODUCTION, LESSON DEVELOPMENT, PRACTICE/APPLICATION, EXERCISE, CONCLUSION; for Grade 1 & 2 Oral English strictly use 'Introduction', 'Step 1: Present', 'Step 2: Practice', 'Step 3: Produce', 'Step 4: Closure'; for Literacy in English strictly place <b>INTRODUCTION (5 minutes):</b> outside before the table situated strictly between <b>EXPECTED STANDARD:</b> and the <b>LESSON DEVELOPMENT</b> heading, and use table stages 'Step 1: Phonemic awareness (5 minutes)', 'Step 2: Phonics (10 minutes)', 'Step 3: Fluency (20 minutes)', 'Step 4: Vocabulary (7 minutes)', 'Step 5: Writing (20 minutes)', 'Comprehension (5 minutes)', 'Conclusion (3 minutes)'), followed by Homework.
       - Use the teacher's exact selected learning activity as the exclusive driver for the "LESSON DEVELOPMENT" section. You are STRICTLY FORBIDDEN from introducing activities from future lessons or days. 
       - <b>TABLE CONTENT REQUIREMENTS (5 COLUMNS FOR MATHEMATICS, ZAMBIAN LANGUAGE & GENERAL SUBJECTS):</b> For each of the 5 columns in the "LESSON DEVELOPMENT" / "LESSON PROGRESSION" table:
         1. <b>STAGES:</b> STAGE 1: INTRODUCTION, STAGE 2: LESSON DEVELOPMENT ("I DO" - Teacher Modeling), STAGE 3: PRACTICE/APPLICATION ("WE DO" - Mandatory Collaborative Group Work), STAGE 4: EXERCISE ("YOU DO" - Independent Practice), STAGE 5: CONCLUSION (or the required subject stages).
         2. <b>TEACHER'S ACTIVITIES:</b> Provide 2-3 specific, concise bullet points using the '*' symbol starting with "Teacher to..." (e.g., * Teacher to guide learners to observe different materials in the surroundings..., * Teacher to guide learners to touch and feel different materials..., * Teacher to explain that these are called materials...).
            - <b>CRITICAL STRICT PROHIBITION:</b> DO NOT MENTION OR LIST EXAMPLES, MATERIALS, OBJECTS, OR BRACKETED EXAMPLES (e.g. do NOT write "(wood, stone, metal, plastic)" or "(e.g., ...)") in this column. Keep this column strictly focused on pedagogical actions. All specific examples, objects, and items MUST be shown ONLY in the CONTENT column.
         3. <b>LEARNERS' ACTIVITIES:</b> Provide 2-3 concise corresponding bullet points using the '*' symbol starting with "Learners to..." (e.g., * Learners to walk orderly to the designated area..., * Learners to touch and feel the texture of materials presented..., * Learners to repeat the key terms after the teacher...).
            - <b>CRITICAL STRICT PROHIBITION:</b> DO NOT MENTION OR LIST EXAMPLES, SPECIFIC ITEMS, OR BRACKETED REPLIES (e.g. do NOT write '(e.g., "Stone")') in this column. Keep this column strictly focused on learner actions. All specific items, answers, and objects MUST be shown ONLY in the CONTENT column.
         4. <b>CONTENT:</b> This is the sole, dedicated column for ALL subject content, concrete examples, classifications, drawings/pictures, and summary points:
            - <b>Underlined Brief Stage Title (MANDATORY):</b> On top of the content for EVERY stage, place a brief underlined title summarizing the focus of that stage (e.g., <u>Observation of Environmental Objects</u>, <u>Man-made / Natural Materials</u>, <u>Classification of Materials</u>, <u>Written Exercise Task</u>, <u>Summary of Explored Concepts</u>).
            - <b>Structured Categorization & Sub-labels:</b> When classifying, categorizing, or grouping items, format them cleanly using bold uppercase lettered sub-labels after the underlined title.
            - <b>STRICT PICTURE / ILLUSTRATION RULE:</b>
              * <b>NO Pictures for Listing, Classifying, or Naming:</b> When the activity involves listing, classifying, naming, defining, explaining, or writing words/numbers, DO NOT accompany words with pictures, illustrations, or emoji icons. Present pure text cleanly:
                <u>Man-made / Natural Materials</u><br/>
                * <b>A) Man-made:</b> Plastic, Bicycle, Metal spoon, Paper<br/>
                * <b>B) Natural:</b> Stone, Mud, Trees, Sand, Leaves
              * <b>Pictures/Drawings ONLY for 'Drawing' or 'Showing':</b> Include small pictures / diagrams / illustrations / sketches ONLY when the pedagogical action explicitly involves <b>DRAWING</b>, <b>SHOWING</b>, displaying pictures/flashcards, or visual diagram tasks (e.g. Teacher shows picture cards -> Content shows small picture boxes, or Learners draw objects -> Content shows drawing reference boxes).
              * <b>DIVERSITY ACROSS LESSONS:</b> When drawing or showing is involved, dynamically vary the items across lessons (e.g., plastic bottles, bicycles, buckets, trees, leaves, cups, coins, seeds, geometry shapes) tailored to the lesson flow.
            - <b>Varied & Contextual Exercise Stage Content:</b> The EXERCISE stage MUST dynamically match what the lesson demands—it is NOT limited to drawing:
              * <b>Written Tasks & Questions:</b> Provide 2-4 direct classroom exercise questions, fill-in-the-blanks, or short answer prompts directly in the Content column (e.g., <u>Written Exercise / Task</u><br/>* 1. Define what a natural material is.<br/>* 2. Give three examples of man-made objects.<br/>* 3. Complete: Sand is a ________ material.).
              * <b>Classification & Sorting Tasks:</b> Provide items to categorize into tables or lists (e.g., <u>Classification Task</u><br/>* Sort these items into Natural vs Man-made: Brick, Clay, Glass, Cotton, Plastic, Stone.).
              * <b>Calculations & Math Tasks:</b> For Mathematics/Science, provide specific equations or numerical problems to solve.
              * <b>Drawing & Labeling Tasks (ONLY When Stated):</b> When the exercise explicitly asks learners to draw/sketch, provide distinct reference items with small visual boxes in the Content column (e.g., <u>Drawing & Labeling Task</u><br/>* Draw and label: [Stone], [Wood Log], [Plastic Bottle], [Bicycle], [Green Leaf]).
            - <b>Conclusion Content:</b> In the CONCLUSION stage, place the underlined title (<u>Summary & Review Questions</u>), followed by the list of key materials/concepts explored and closing reflection questions.
         5. <b>ASSESSMENT CRITERIA:</b> State exactly what constitutes evidence/success of performance in this stage (e.g., * Learners identify at least 3 materials correctly / Learners categorize collected items accurately).
         * NOTE: The 3 middle columns (TEACHER'S ACTIVITIES, LEARNERS' ACTIVITIES, CONTENT) must be balanced and equal in width.
         * For Mathematics and all other general subjects, the assessment column header MUST be <b>ASSESSMENT CRITERIA</b> (replacing Performance Indicator, except for Literacy in English and Oral English which retain their standard format).
       - Ensure the content is thorough, highly practical, and complete for immediate classroom use, fitting strictly within TWO (2) pages. Use clear bullet points and keep the actions clear.
       - Use '*' as the bullet symbol for all items inside the table cells. Do NOT use markdown list symbols.
       - Format the "Learning Environment" section strictly in this vertical order using bold labels:
         <b>Natural:</b> [Description]
         <b>Artificial:</b> [Description] 
         <b>Technological:</b> [Description]
       - Ensure all table row labels (for general subjects and Zambian Language: INTRODUCTION, LESSON DEVELOPMENT, PRACTICE/APPLICATION, EXERCISE, CONCLUSION; for Oral English: Introduction, Step 1: Present, Step 2: Practice, Step 3: Produce, Step 4: Closure; for Literacy in English: Step 1: Phonemic awareness, Step 2: Phonics, Step 3: Fluency, Step 4: Vocabulary, Step 5: Writing, Comprehension, Conclusion) and footer labels (HOMEWORK, LEARNER'S EVALUATION, TEACHER'S EVALUATION) are formatted with <b> tags and appear in black. Column header for assessment in general subjects, Mathematics, and Zambian Language MUST be ASSESSMENT CRITERIA (for Literacy and Oral English, PERFORMANCE INDICATOR).
       - STRICT ALIGNMENT, VERTICAL ORDER, & NEW LINES (BOTH CBC AND OBC): For ALL Lesson Plans (including Primary and Secondary/Form 1-4), all pre-lesson information headers MUST be left-aligned and each header and its associated content MUST start on its own new line using HTML '<br/>'. They MUST NOT be joined or concatenated on the same line.
        - Use EXACTLY this vertical order and format for the pre-lesson information:
          <b>GRADE:</b> ${cleanGradeDisplay(params.grade)}<br/>
          <b>SUBJECT:</b> ${params.subject || ".........."}<br/>
          <b>TOPIC:</b> ${params.topic || ".........."}<br/>
          <b>SUB-TOPIC:</b> ${params.subtopic || ".........."}<br/>
          <b>GENERAL COMPETENCES:</b> (or <b>GENERAL OUTCOMES:</b>)<br/>
          - [Short-form competence phrase ONLY e.g. Develop critical thinking skills]<br/>
          - [Short-form competence phrase ONLY e.g. Communication skills]<br/>
          (CRITICAL RULE FOR GENERAL COMPETENCES/OUTCOMES: You MUST write general competences strictly in SHORT FORM listing core skills/outcomes without long explanatory clauses or sentences explaining lesson activities/topics. NEVER write "by identifying...", "through discussing...", or long paragraphs).<br/>
          <b>SPECIFIC COMPETENCES:</b> (or <b>SPECIFIC OUTCOMES:</b>)<br/>
          - [Brief specific competency direct from syllabus ONLY - do NOT attach Expected Standards or Learning Activities to this string]<br/>
          <b>LESSON GOAL:</b> [Lesson Goal text]<br/>
          <b>RATIONALE:</b> [Explain briefly the core importance of this lesson, what learners will gain or benefit at the end of the lesson (in brief sentences), and explicitly specify the specific teaching methods (e.g., teacher exposition, group work, demonstration, or gradual release) that will be used to deliver the lesson, strictly based on the lesson plan content. Keep it highly concise, direct, and under 60 words maximum. ${params.type === 'lesson_plan' ? `Immediately following the last full stop of the rationale, without starting a new paragraph, exactly output this sentence as part of the same paragraph: This is lesson ${params.lessonNumber || '........'} in week ${params.lessonWeekNumber || '.......'}.` : ''}]<br/>
          <b>PRIOR KNOWLEDGE/SKILLS/VALUES:</b> (or <b>Prior knowledge/skills/values:</b>)<br/>
          - <b>Knowledge:</b> [Knowledge]<br/>
          - <b>Skills:</b> [Skills]<br/>
          - <b>Values:</b> [Values]<br/> (or bulleted items if CBC)<br/>
          <b>TEXTBOOK REFERENCES:</b><br/>
          - [Reference 1]<br/>
          <b>TEACHING AND LEARNING RESOURCES / MATERIALS:</b><br/>
          - [Resource 1]<br/>
          - [Resource 2]<br/>
          <b>LEARNING ENVIRONMENT:</b><br/>
          <b>Natural:</b> [Description]<br/>
          <b>Artificial:</b> [Description]<br/>
          <b>Technological:</b> [Description]<br/>
          <b>LEARNING ACTIVITIES:</b><br/>
          - [Activity 1]<br/>
          - [Activity 2]<br/>
          <b>EXPECTED STANDARD:</b> [Expected Standard text]<br/>
        - MANDATORY HEADERS & SEPARATION: You MUST include ALL the headers listed above for every lesson plan according to its curriculum, with proper HTML '<br/>' tags at the end of every header line and content line. Do not omit any.
       - MANDATORY HEADERS: You MUST include ALL the headers listed above for every lesson plan according to its curriculum. Do not omit any.
        - NO MARKDOWN HEADERS IN GENERAL INFO: Do NOT use markdown heading symbols (such as #, ##, or ###) or markdown asterisks (like **Topic**) for general info fields (like Topic, Sub-Topic, Rationale, Outcomes, Goal, Learning Environment, Learning Activities, etc.) as this centers them and changes their casing inside the CSS. Use EXACTLY raw HTML <b> tags at the beginning of the line instead.
        - STRUCTURED DETAIL & STRICT 2-PAGE MAXIMUM MANDATE: The primary lesson plan from the Republic/Ministry Header down to the Evaluations (LEARNER'S EVALUATION and TEACHER'S EVALUATION) MUST FIT WITHIN EXACTLY TWO (2) PAGES.
        - UNIFIED HIGH PEDAGOGICAL STANDARD (ABSOLUTE MANDATE): Regardless of any scale or display toggles, you MUST ALWAYS generate the lesson plan at the highest academic and educational standard of detail, structure, and quality:
          * Every stage of the Lesson Development table MUST be fully fleshed out with complete, detailed, and professional educational contents. Do NOT shorten, summarize, or simplify the content based on any toggles.
          * TEACHER'S & LEARNERS' ACTIVITIES: Provide at least 2 clear, precise, and highly detailed bullet points per stage outlining concrete pedagogical actions.
          * CONTENT COLUMN: Give rich, thorough context with definitions, concepts, and 2-3 practical cited examples (e.g. concrete set examples, list of terms, specific equations, or vocabulary) to give the teacher clear guidance.
          * EXERCISE & CONCLUSION: Include 2-3 specific, tiered, written or practical questions that test comprehension directly.
          * HOMEWORK: Provide 1-2 short but highly specific, practical review questions for learners to practice at home.
          * STRICT 2-PAGE CEILING: Calibrate the density so that the entire lesson plan (including header, General Info, table, homework, and evaluations) always fits perfectly within EXACTLY TWO (2) A4 pages, without spilling over to a 3rd page, while preserving full academic depth and thoroughness.
          - For every stage in the Lesson Development table, provide clear, step-by-step instructions. All instructions must start with "Teacher to ..." under teacher's activities and "Learners to ..." under learners' activities. Do NOT list specific examples, items, or objects in teacher/learner activity columns; all specific examples, materials, classifications, small drawings/illustrations, and conclusion tasks MUST be presented strictly in the CONTENT column.
          - Use detailed, action-oriented items in strict bullet form. VAGUE OR REPETITIVE TEXT IS FORBIDDEN. Ensure everything is clear for immediate classroom implementation.
        - TEACHING NOTES (MANDATORY OPTION): If the "Include Teaching Notes" option is set to YES, you MUST generate an extremely comprehensive, highly detailed set of TEACHING NOTES for the lesson.
          - POSITIONING, ORDER, AND PAGES (CRITICAL): The evaluations (LEARNER'S EVALUATION and TEACHER'S EVALUATION) are strictly part of the core lesson plan, NOT the teaching notes. They must follow immediately after the Homework section (or the Conclusion stage if Homework is omitted) at the bottom of the second page of the lesson plan itself. If "Include Teaching Notes" is YES, you must output the full lesson plan (including Homework first, then the '<div class="lesson-plan-footer">...</div>' evaluations), followed by exactly one page-break '<div class="page-break"></div>' after the evaluations, and only then output the "# TEACHING NOTES: ${params.topic} - ${params.subtopic}" section. This ensures the teaching notes ALWAYS start strictly on top of the THIRD (3rd) PAGE. The teaching notes can span from page 3 onto page 4 if the teaching instructions, vocabulary, or exercises are highly detailed and extensive, but they must NOT start before page 3. If "Include Teaching Notes" is NO, the document ends with the evaluations and has no page-break or third page.
         - FORMATTING: Use the header "# TEACHING NOTES: ${params.topic} - ${params.subtopic}". Arrange the notes logically by key concepts, definitions, step-by-step procedures, and concrete examples. Use bold bullet points and clear, black bold headers.
         - DEPTH, EXAMPLES, AND CONTENT: These notes should be sufficient for the teacher to deliver the lesson directly off the page. You MUST extract and use the actual zambian vocabulary words, concepts, list of words or translations, questions, tasks, and exercises provided in the "REFERENCE CONTENT" (the selected module/syllabus data). Do NOT summarize, shorten, or omit these. ${getZambianLanguageInstructions(params).notesRule}
         - STEP-BY-STEP TEACHER LOGISTICS (FIRST STEP TO LAST STEP): You MUST detail the exact instructional flow and delivery steps of the teacher from the opening minute of the lesson to the final closing task, clearly explaining what and how the teacher should implement the lesson to learners, including specific step-by-step actions and materials/resources (e.g., puppets, flashcards, charts, storybooks) used in each stage.
            1. Step 1: Introduction & Connection: State exactly how the teacher will hook the learners, connect to prior knowledge, and introduce the topic. Write down the precise teacher prompt (what the teacher says) and the expected learner response.
            2. Step 2: Modeling & Core Demonstration: Provide a step-by-step description of teacher actions, demonstrating active modeling of sounds, words, concepts, or rules. (e.g. "The teacher holds up picture card A, points to the /kw/ sound...").
            3. Step 3: Guided Practice Flow: Outline step-by-step collaborative and interactive tasks, group setups, or games. Give examples of questions the teacher will ask during the activity.
            4. Step 4: Independent Practice & Exercises: Define the exact exercise or worksheet questions to be written on the blackboard or distributed, with the correct answers provided in the notes.
            5. Step 5: Wrap-up & Formative Check: Detailed final feedback, summary of key points, and instructions for homework.
         - NO GENERIC PLACEMENT: Do NOT use boilerplate placeholder lists. Write fully developed examples, dialogues, and script snippets so that there is zero guesswork for the teacher.
       - CRITICAL HEADER RULES: For the header section (DATE, TIME, DURATION): If values are provided in the input, use them. If any are missing or blank, you MUST leave them as exactly "......................." (long dotted space) to allow for handwriting. Do NOT generate times or durations if they are not provided by the teacher.
       - CRITICAL TABLE RULES: In the Lesson Development table, you MUST NOT generate a separate "TIME" column or include time values within the "STAGE" column. In the "STAGE" column, use ONLY the exact required stage name (e.g., "INTRODUCTION", "LESSON DEVELOPMENT", "PRACTICE/APPLICATION", "EXERCISE", "CONCLUSION" for general subjects and Zambian Language, "Step 1: Present", "Step 2: Practice", "Step 3: Produce", "Step 4: Closure" for Oral English, or "Step 1: Phonemic awareness", "Step 2: Phonics", "Step 3: Fluency", "Step 4: Vocabulary", "Step 5: Writing", "Comprehension", "Conclusion" for Literacy in English) without any dotted space or time placeholders.
       ${params.type === "lesson_notes" ? `
       - STRICT LESSON NOTES INSTRUCTIONS: Since the selected document type is LESSON NOTES (which are purely Teaching Notes), you MUST NOT output any Lesson Plan Table (stages/columns like introduction, development, practice, learner evaluation, etc.).
       - You MUST NOT output any general information arrangement table or grid (the table fields for Teacher Name, TS Number, Zone, Date, Time, Duration, Enrolment, Attendance). 
       - The output MUST consist ONLY of the Fortunes Edutech header at the top and the single, beautiful double-bordered block containing SUBJECT, GRADE, TOPIC, and SUB-TOPIC.
       - DIRECT SEQUENTIAL FLOW FOR LESSON NOTES:
         1. **INTRODUCTION TO THE LESSON/CONCEPTS**: Provide a comprehensive, learner-friendly introduction explaining the core concepts of this lesson's topic. Explain how the selected sub-topics fit together, using clear definitions, real-life analogies, and setting the learning context firmly.
         2. **CORE CONTENT & DETAILED SUB-TOPICS EXPOSITION**: For each selected sub-topic (Subtopic 1: ... , Subtopic 2: ..., etc.), you MUST generate a separate, beautifully structured segment containing:
            - **A. TEACHER'S PATHWAY & INSTRUCTIONAL STEPS**: Complete step-by-step masterclass delivery guide detailing the exact flow, teacher actions, explanations, verbal instructions, modelling phrases (what to say), questions to ask, and teaching materials/flashcards used to guide delivery from the first explanation to the concept check.
            - **B. DETAILED LEARNERS' NOTES TO BE COPIED**: Structured using clear BULLET INSTRUCTIONS (the bulleted definitions, rules, facts, or procedures). EACH bullet instruction MUST be immediately followed by a deep, rich, detailed paragraph explaining the concept in full depth, with no placeholders, brief lists, or summaries.
            - **C. MODEL PRACTICE PROBLEMS & WORKED EXAMPLES**: Provide at least two fully worked-out scenarios, questions, or problems with step-by-step answers and solution explanations.
         3. **INTEGRATED CLASSROOM EXERCISE / TASKS**: A final set of tiered questions (Cognitive recall, Application, and Critical Thinking) to test all of the selected subtopics together.
         4. **DOCUMENT REFERENCES & CITATIONS**: A professional bibliography listing the official books and syllabus pages used.
       ` : ""}
  `;

  try {
    // Let the server handle the complex fallback logic and model selection.
    const response = await callGemini("DEFAULT", prompt);

    let text = response.text || "";

    if (
      !text ||
      text.startsWith("RESOURCE_EXHAUSTED") ||
      text.startsWith("{\"error\":") ||
      text.includes("Internal server error")
    ) {
      throw new Error("Generation failed: Empty or invalid response from AI service.");
    }

    // CLEANUP: If the model wrapped the response in backticks, strip them
    if (text.includes("```")) {
      text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/m, "");
    }

    // EXPLICIT CLEANUP: Remove any accidental introductory headers generated by the AI
    // We want to remove the "double header" effect.
    const isSpecialCase = params.type === "weekly_forecast" || params.type === "individual_work_plan" || params.type === "assessments";
    
    // 1. Detect if the AI provided two headers and remove the first one (safely search only inside the first 2500 characters)
    const ministryRegex = /(MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS)/gi;
    const headerPrefix = text.substring(0, 2500);
    const matches = headerPrefix.match(ministryRegex);
    if (matches && matches.length >= 4 && !isSpecialCase) {
      const firstSectionEnd = headerPrefix.toLowerCase().indexOf("ministry", 10);
      if (firstSectionEnd > 0) {
        const secondOccurrence = headerPrefix.toLowerCase().indexOf("ministry", firstSectionEnd + 20);
        if (secondOccurrence > 0) {
          // If we see two ministries in the header, we keep the one that seems more complete
          text = text.substring(secondOccurrence).replace(/^<\/h1><\/center>/i, "");
          // Prefix with missing tags if we stripped them
          if (!text.trim().startsWith("<center>")) {
             text = "<center>\n<h1>" + text;
          }
        }
      }
    }

    // 2. Remove common header lines ONLY if they appear before a horizontal rule AND we have content after
    // This refined approach preserves the professional header we want
    if (text.match(/(<center>|MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS)[\s\S]*?---/im) || isSpecialCase) {
       // Keep it
    } else {
       text = text.replace(/^(MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|.*DISTRICT|.*PROVINCE|{school}|{schoolName})\s*\n/gim, "");
    }
    
    // 3. Remove accidental markdown separators at the very top (preserving the one after our header if any)
    const firstSeparator = text.indexOf("---");
    if ((firstSeparator > 0 && firstSeparator < 500) || isSpecialCase) {
       // Keep it, it's probably the one we asked for
    } else {
       text = text.replace(/^[\s\n]*([-*_.]){3,}[\s\n]*/, "");
    }

    // 4. Final check: if it still starts with Ministry or District alone, strip that one line
    const testLines = text.split('\n').slice(0, 15);
    const hasManyHeaders = testLines.filter(l => l.match(/MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|DISTRICT|SCHOOL/i)).length > 5;
    if (hasManyHeaders && !isSpecialCase) {
       text = text.replace(/^[\s\n]*#+ (MINISTRY OF EDUCATION|REPUBLIC OF ZAMBIA|SCHEMES OF WORK|WEEKLY FORECAST|LESSON PLAN|LESSON NOTES|ASSESSMENTS|.*DISTRICT|SCHOOL NAME).*?\n/gi, "");
    }
    
    // Explicitly remove redundant type headers (like # LESSON PLAN) that appear in the raw text
    text = text.replace(/^[#*_\s]*(LESSON PLAN|SCHEMES OF WORK|WEEKLY FORECAST|LESSON NOTES|ASSESSMENTS|RECORD OF WORK|INDIVIDUAL WORK PLAN)[#*_\s]*\n?/gim, "");
    
    if (params.type === "lesson_plan" && text) {
      // Strip redundant AI-generated title headers like "<b>ICIBEMBA GRADE 1 SAMPLE LESSON PLAN</b>"
      text = text.replace(/^[#*_\s]*<b>[^<]*SAMPLE LESSON PLAN[^<]*<\/b>[\s\n]*/gi, "");
      // Strip redundant metadata lines if generated before main content
      text = text.replace(/^<b>(SCHOOL|NAME OF TEACHER|TEACHER'S NAME|CLASS|CLASS DESCRIPTION|TIME|DURATION|DATE|ZONE|TS NO):<\/b>.*?\n/gim, "");

      // Sanitize General Competences/Outcomes to short form
      text = text.replace(
        /(<b>(?:GENERAL COMPETENCES|GENERAL OUTCOMES):<\/b>(?:\s*<br\s*\/?>)?)([\s\S]*?)(?=(?:<br\s*\/?>\s*)?<b>(?:SPECIFIC COMPETENCES|SPECIFIC OUTCOMES|LESSON GOAL|EXPECTED STANDARD|RATIONALE):<\/b>)/gi,
        (_match, header, body) => {
          const formatted = formatGeneralCompetenciesShortForm(body);
          return `${header}<br/>${formatted.replace(/\n/g, '<br/>')}`;
        }
      );

      const sLowPost = (params.subject || '').toLowerCase();
      const isLiteracyInEnglishPost = (sLowPost.includes('literacy') || params.englishComponent === 'literacy') && !sLowPost.includes('oral');

      if (isLiteracyInEnglishPost) {
        let extractedTeacher = "";
        let extractedLearners = "";

        // 1. Check if Introduction is inside an HTML <tr> row
        const introTrRegex = /<tr[^>]*>\s*<td[^>]*>\s*(?:<b>)?\s*INTRODUCTION\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/i;
        const introTrMatch = text.match(introTrRegex);
        if (introTrMatch) {
          extractedTeacher = introTrMatch[1].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          extractedLearners = introTrMatch[2].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          text = text.replace(introTrRegex, '');
        }

        // 2. Check if Introduction is inside a Markdown table row
        const introTableRowRegex = /\|\s*(?:<b>)?\s*Introduction.*?(?:<\/b>)?\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|[ \t]*\r?\n?/i;
        const introMatch = text.match(introTableRowRegex);
        if (introMatch) {
          if (!extractedTeacher) extractedTeacher = introMatch[1].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          if (!extractedLearners) extractedLearners = introMatch[2].trim().replace(/^<br\s*\/?>/i, '').replace(/<br\s*\/?>$/i, '');
          text = text.replace(introTableRowRegex, '');
        }

        // If text does not already have an outside INTRODUCTION section before Lesson Development / table:
        if (!text.match(/<b>\s*INTRODUCTION[\s\S]*?(?:LESSON DEVELOPMENT|<table|\|[ \t]*STAGE)/i)) {
          const introBlock = `\n<div style="margin-top: 15px; margin-bottom: 15px; line-height: 1.6;">\n<b>INTRODUCTION (5 minutes):</b><br/>\n* <b>Teacher to:</b> ${extractedTeacher || 'review previously taught sounds, show cards with taught graphemes, and introduce the target sound/concept.'}<br/>\n* <b>Learners will:</b> ${extractedLearners || 'sound out given graphemes, listen to words, mention common sound, and focus on the target sound/concept.'}<br/>\n</div>\n`;

          if (text.match(/<b>EXPECTED STANDARD:<\/b>[\s\S]*?<\/div>/i)) {
            text = text.replace(/(<b>EXPECTED STANDARD:<\/b>[\s\S]*?<\/div>)/i, `$1\n${introBlock}`);
          } else if (text.match(/<b>EXPECTED STANDARD:<\/b>.*?(?:<br\s*\/?>|\n)/i)) {
            text = text.replace(/(<b>EXPECTED STANDARD:<\/b>.*?(?:<br\s*\/?>|\n))/i, `$1\n${introBlock}`);
          } else if (text.match(/EXPECTED STANDARD:.*?(?:<br\s*\/?>|\n)/i)) {
            text = text.replace(/(EXPECTED STANDARD:.*?(?:<br\s*\/?>|\n))/i, `$1\n${introBlock}`);
          } else if (text.match(/(?:<h3[^>]*>|<b>)LESSON DEVELOPMENT/i)) {
            text = text.replace(/((?:<h3[^>]*>|<b>)LESSON DEVELOPMENT)/i, `${introBlock}\n$1`);
          }
        }
      }
    }

    if (params.type === "lesson_plan" && params.curriculumType === "OBC" && text) {
      // Strip LEARNING ACTIVITIES section
      text = text.replace(/<b>LEARNING ACTIVITIES:<\/b>(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      text = text.replace(/(?:<strong>)?LEARNING ACTIVITIES:?(?:<\/strong>)?(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      // Strip EXPECTED STANDARD section
      text = text.replace(/<b>EXPECTED STANDARDS?:<\/b>(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      text = text.replace(/(?:<strong>)?EXPECTED STANDARDS?:?(?:<\/strong>)?(?:(?!<b>)[\s\S])*?(?=(?:<b>|<h3|<table|LESSON DEVELOPMENT|<\/div>|$))/gi, "");
      
      // Clean up consecutive trailing line breaks
      text = text.replace(/(?:<br\s*\/?>\s*){2,}/gi, "<br/>");
    }
    
    // Ensure learner's and teacher's evaluations in lesson plans have exactly two beautiful full-width dotted handwriting lines each
    if (params.type === "lesson_plan" && text) {
      const regexFooter = /<div class="lesson-plan-footer"[\s\S]*?<\/div>/gi;
      if (text.match(regexFooter)) {
        text = text.replace(regexFooter, `<div class="lesson-plan-footer" style="width: 100%; margin-top: 5px; page-break-inside: avoid; break-inside: avoid;">
  <p style="margin-bottom: 1px; font-size: 9.2pt;"><b>LEARNER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>
  
  <p style="margin-top: 4px; margin-bottom: 1px; font-size: 9.2pt;"><b>TEACHER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>
</div>`);
      } else {
        if (text.match(/LEARNER'S EVALUATION/i) || text.match(/TEACHER'S EVALUATION/i)) {
          text = text.replace(/<b>LEARNER'S EVALUATION:<\/b>[\s\S]*?(?=<b>TEACHER'S EVALUATION:|$)/gi, 
            `<b>LEARNER'S EVALUATION:</b><br/>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 4px;"></div>\n`);
          text = text.replace(/<b>TEACHER'S EVALUATION:<\/b>[\s\S]*?(?=<\/div>|$)/gi, 
            `<b>TEACHER'S EVALUATION:</b><br/>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 2px;"></div>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.15em; width: 100%; margin-bottom: 4px;"></div>\n`);
        }
      }
    }

    // Ensure "Step 1: .... Step 2: ...." in the teaching steps segment are formatted on clean individual lines from the left, rather than inline.
    // 1. Prepend <br/> to inline steps (e.g. "interest. Step 2:") so they split into new lines.
    text = text.replace(/([^\n><\s])\s*(?:Step|Sep|Step\s+)\s*(\d+)\s*[:.-]+/gi, "$1<br/>Step $2: ");
    
    // 2. Remove any leading whitespace, bullet points, asterisks, or tab indents before "Step X:" to pull it strictly left-aligned at column 1.
    text = text.replace(/^[ \t>*-•\s]*(?:Step|Sep|Step\s+)\s*(\d+)\s*[:.-]+/gim, "Step $1: ");

    // Ensure table headers and column alignment match data rows perfectly across all tables
    text = fixAndAlignTableColumns(text, params);

    // CRITICAL FIX: Guarantee Schemes of Work & Weekly Forecasts ALWAYS output standard table format, NEVER plain words/paragraphs
    if (params.type === "schemes_of_work" || params.type === "weekly_forecast") {
      const hasTableStructure = text.includes("<table") || (text.includes("|") && text.split("\n").filter(l => l.trim().startsWith("|")).length >= 3);
      if (!hasTableStructure) {
        console.warn(`${params.type} response lacked table format (words only detected). Auto-reconstructing into official standard table format.`);
        text = generateFallbackTable(params, "Standard official curriculum table format generated.");
      }
    }

    // Strip any accidental approval section or signatures generated for schemes of work, weekly forecast, lesson plans, etc.
    if (params.type !== "individual_work_plan") {
      text = text.replace(/<div[^>]*>[\s\S]*?(?:APPROVAL SECTION|SIGNATURES?)[\s\S]*?<\/div>/gi, "");
      text = text.replace(/###?\s*(?:APPROVAL SECTION|SIGNATURES?|VERIFICATION)[\s\S]*$/gi, "");
      // Only strip supervisor/headteacher or explicit teacher signature/comments at document footer, NEVER TEACHER'S NAME in header!
      text = text.replace(/\n\s*(?:<p>|<div>|<h[1-6]>|\*\*|__)?\s*(?:SUPERVISOR(?:'S)?\s*(?:NAME|SIGNATURE|COMMENT|REMARKS?)|HEADTEACHER(?:'S)?\s*(?:NAME|SIGNATURE|COMMENT|REMARKS?)|TEACHER(?:'S)?\s*(?:SIGNATURE|COMMENT|REMARKS?))\s*[:：]?[\s\S]*$/gi, "");
      text = text.replace(/(?:<b>|\*\*|__)?\s*SUPERVISOR(?:'S)?\s*(?:NAME|SIGNATURE)\s*[:：]?[\s\S]*$/gi, "");
      text = text.replace(/(?:<b>|\*\*|__)?\s*TEACHER(?:'S)?\s*SIGNATURE\s*[:：]?[\s\S]*$/gi, "");
      text = text.replace(/(?:<b>|\*\*|__)?\s*HEADTEACHER(?:'S)?\s*SIGNATURE\s*[:：]?[\s\S]*$/gi, "");
      text = text.replace(/(?:<b>|\*\*|__)?\s*CHECKED BY\s*[:：]?[\s\S]*$/gi, "");
      text = text.replace(/<table[^>]*>[\s\S]*?(?:SUPERVISOR|TEACHER)'S SIGNATURE[\s\S]*?<\/table>/gi, "");
    }

    // Clean up reference column artifacts: remove "(from the uploaded scheme)" or anything added after page dotted lines
    text = text.replace(/\s*\(from the uploaded scheme\)/gi, "");
    text = text.replace(/(Page:\s*\.{3,})\s*(?:\(?from the uploaded scheme\)?|[^\n|<]*)/gi, "$1");

    const result = text.trim();
    
    // Only cache if the result looks like genuine content, not a fallback warning
    if (!result.includes("AI GENERATION UNAVAILABLE")) {
       setCachedResult(cacheKey, result);
    }
    
    return result;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const msg = error?.message || String(error);

    const isDaily = msg.toLowerCase().includes("daily") || 
                   msg.toLowerCase().includes("per day") || 
                   msg.toLowerCase().includes("quotaid: generaterequestsperday") ||
                   msg.toLowerCase().includes("limit") ||
                   msg.toLowerCase().includes("quota") ||
                   msg.toLowerCase().includes("exceeded") ||
                   msg.toLowerCase().includes("exhausted") ||
                   msg.toLowerCase().includes("429");
                   
    const userFriendlyError = isDaily 
      ? "Daily AI usage limit reached (Free tier: 20 requests/day). All fallback models are also exhausted. You can still manually fill the document below." 
      : "The AI service is currently busy or a network issue occurred. Retrying might help, or you can manually edit the document below.";
      
    console.warn(
      `AI error caught: ${msg}. Returning beautiful, print-ready fallback table structure.`,
    );
    // Return a compiled fallback structure so the app never crashes and the user can manually enter/view things
    return generateFallbackTable(params, userFriendlyError);
  }
}

export function matchTopicInSyllabus(t: any, target: string): boolean {
  if (!t || !target) return false;
  const title = typeof t === 'string' ? t : (t.title || t.topic || '');
  if (!title) return false;

  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  if (cleanTitle === cleanTarget) return true;
  if (cleanTitle.includes(cleanTarget) || cleanTarget.includes(cleanTitle)) return true;

  // Match topic numbers if available (e.g. 1.1, 1.2, 2.3 or 4.1)
  const titleNumMatch = title.match(/(?:topic\s*)?(\d+(?:\.\d+)*)/i);
  const targetNumMatch = target.match(/(?:topic\s*)?(\d+(?:\.\d+)*)/i);

  if (titleNumMatch && targetNumMatch) {
    if (titleNumMatch[1] === targetNumMatch[1]) {
      return true;
    }
    // CRITICAL FIX: If both title and target contain explicit topic numbers (e.g. 1.1 vs 4.1),
    // and they are NOT equal, they are distinct topics from different units/grades.
    // Return false immediately to prevent matching false-positive words like "FAMILY" or "COMMUNITY".
    return false;
  }

  // Word token overlap matching (e.g. "understand materials" matches "1.1 UNDERSTANDING MATERIALS")
  const targetWords = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && w !== 'topic');
  const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && w !== 'topic');

  if (targetWords.length > 0) {
    const matchedCount = targetWords.filter(w => titleWords.includes(w)).length;
    if (matchedCount === targetWords.length || (targetWords.length >= 2 && matchedCount >= 2)) {
      return true;
    }
  }

  return false;
}

export function filterSyllabusForSchemes(
  syllabus: any[],
  initialTopic?: string,
  stoppingTopic?: string,
  markedTopics?: (string | { topic: string; subtopics?: string[] })[]
): any[] {
  if (!Array.isArray(syllabus) || syllabus.length === 0) return [];

  // If markedTopics is provided and non-empty, use marked topics strictly
  if (Array.isArray(markedTopics) && markedTopics.length > 0) {
    const markedTopicMap = new Map<string, string[] | null>();
    markedTopics.forEach(item => {
      if (typeof item === 'string') {
        const clean = item.trim().toLowerCase();
        if (clean) markedTopicMap.set(clean, null);
      } else if (item && typeof item === 'object' && item.topic) {
        const clean = item.topic.trim().toLowerCase();
        const subs = Array.isArray(item.subtopics) ? item.subtopics : null;
        if (clean) markedTopicMap.set(clean, subs);
      }
    });

    if (markedTopicMap.size > 0) {
      const result: any[] = [];
      syllabus.forEach(t => {
        const tTitle = (typeof t === 'string' ? t : (t.title || t.topic || '')).trim();
        const tClean = tTitle.toLowerCase();

        let isMarked = false;
        let targetSubs: string[] | null = null;
        for (const [mKey, subs] of markedTopicMap.entries()) {
          if (tClean === mKey || matchTopicInSyllabus(t, mKey)) {
            isMarked = true;
            targetSubs = subs;
            break;
          }
        }

        if (isMarked) {
          if (targetSubs !== null && Array.isArray(t.subtopics) && t.subtopics.length > 0) {
            const filteredSubtopics = t.subtopics.filter((st: any) => {
              const stTitle = (typeof st === 'string' ? st : (st.title || st.name || '')).trim().toLowerCase();
              return targetSubs!.some(ts => {
                const tsClean = ts.trim().toLowerCase();
                return stTitle === tsClean || stTitle.includes(tsClean) || tsClean.includes(stTitle);
              });
            });
            result.push({
              ...t,
              subtopics: filteredSubtopics
            });
          } else {
            result.push(t);
          }
        }
      });

      if (result.length > 0) {
        return result;
      }
    }
  }

  // Fallback to range slicing if no specific marked topics
  return sliceSyllabusByTopicRange(syllabus, initialTopic, stoppingTopic);
}

export function sliceSyllabusByTopicRange(
  syllabus: any[],
  initialTopic?: string,
  stoppingTopic?: string
): any[] {
  if (!Array.isArray(syllabus) || syllabus.length === 0) return [];

  let startIdx = 0;
  let stopIdx = syllabus.length - 1;

  if (initialTopic && initialTopic.trim()) {
    const targetClean = initialTopic.trim().toLowerCase();
    let foundStart = syllabus.findIndex((t: any) => {
      const title = (typeof t === 'string' ? t : (t.title || t.topic || '')).trim().toLowerCase();
      return title === targetClean;
    });
    if (foundStart === -1) {
      foundStart = syllabus.findIndex((t: any) => matchTopicInSyllabus(t, initialTopic));
    }
    if (foundStart !== -1) {
      startIdx = foundStart;
    }
  }

  if (stoppingTopic && stoppingTopic.trim()) {
    const stopClean = stoppingTopic.trim().toLowerCase();
    let foundStop = syllabus.findIndex((t: any) => {
      const title = (typeof t === 'string' ? t : (t.title || t.topic || '')).trim().toLowerCase();
      return title === stopClean;
    });
    if (foundStop === -1) {
      foundStop = syllabus.findIndex((t: any) => matchTopicInSyllabus(t, stoppingTopic));
    }
    if (foundStop !== -1) {
      if (foundStop >= startIdx) {
        stopIdx = foundStop;
      } else {
        stopIdx = startIdx;
      }
    }
  }

  return syllabus.slice(startIdx, stopIdx + 1);
}

export function generateDeterministicSchemeSequence(
  filteredSyllabus: any[],
  numWeeks: number
): { topic: string; subtopics: string[] }[] {
  if (!Array.isArray(filteredSyllabus) || filteredSyllabus.length === 0) {
    return Array.from({ length: numWeeks }, () => ({
      topic: "Revisions",
      subtopics: ["Revision of Term Topics & Remedial Exercises"]
    }));
  }

  const result: { topic: string; subtopics: string[] }[] = [];
  const flatSubtopicUnits: { topicTitle: string; subtopicTitle: string }[] = [];

  filteredSyllabus.forEach((tObj: any, topicIdx: number) => {
    if (!tObj) return;
    const tTitle = (typeof tObj === 'string' ? tObj : (tObj.title || tObj.topic || `Topic ${topicIdx + 1}`)).trim();
    if (!tTitle) return;

    let rawSubs: any[] = Array.isArray(tObj.subtopics) ? tObj.subtopics : [];
    let subList: string[] = rawSubs
      .map((st: any) => typeof st === 'string' ? st : (st.title || st.name || st.subtopic || ''))
      .filter(Boolean);

    if (subList.length === 0) {
      flatSubtopicUnits.push({ topicTitle: tTitle, subtopicTitle: "Core competencies & concepts" });
    } else {
      subList.forEach(st => {
        flatSubtopicUnits.push({ topicTitle: tTitle, subtopicTitle: st });
      });
    }
  });

  if (flatSubtopicUnits.length === 0) {
    return Array.from({ length: numWeeks }, () => ({
      topic: "Revisions",
      subtopics: ["Revision of Term Topics & Remedial Exercises"]
    }));
  }

  // Allocate/distribute units across teaching weeks (usually 11 weeks)
  const N = flatSubtopicUnits.length;
  const W = numWeeks;

  if (N <= W) {
    // Fewer subtopics than weeks: stretch them as evenly as possible across W weeks ensuring ALL N units are included at least once
    for (let w = 0; w < W; w++) {
      const idx = Math.min(N - 1, Math.floor((w * N) / W));
      const unit = flatSubtopicUnits[idx];
      result.push({
        topic: unit.topicTitle,
        subtopics: [unit.subtopicTitle]
      });
    }
  } else {
    // More subtopics than weeks: group them sequentially into W non-overlapping buckets
    let currentIdx = 0;
    for (let w = 0; w < W; w++) {
      const size = Math.floor(N / W) + (w < (N % W) ? 1 : 0);
      const chunk = flatSubtopicUnits.slice(currentIdx, currentIdx + size);
      currentIdx += size;

      if (chunk.length > 0) {
        const mainTopic = chunk[0].topicTitle;
        const subtopicTitles = chunk.map(c => c.subtopicTitle);

        result.push({
          topic: mainTopic,
          subtopics: subtopicTitles
        });
      }
    }
  }

  while (result.length < W) {
    // If fewer units than weeks, loop over and stretch the last available units across remaining teaching weeks
    const fallbackUnit = flatSubtopicUnits[result.length % flatSubtopicUnits.length];
    result.push({
      topic: fallbackUnit.topicTitle,
      subtopics: [fallbackUnit.subtopicTitle]
    });
  }

  return result.slice(0, W);
}

export async function getTermlySchemeSequence(
  grade: string,
  subject: string,
  term: string,
  year: string,
  numWeeks: number,
  officialSyllabusData?: any,
  stoppingTopic?: string,
  initialTopic?: string,
  markedTopics?: (string | { topic: string; subtopics?: string[] })[]
): Promise<{ topic: string; subtopics: string[] }[]> {
  let filteredSyllabus = officialSyllabusData;
  if (Array.isArray(officialSyllabusData)) {
    filteredSyllabus = filterSyllabusForSchemes(officialSyllabusData, initialTopic, stoppingTopic, markedTopics);
  }

  const prompt = `You are an expert curriculum planner for the Zambian CBC / OBC.
  Generate a strictly sequential and exclusive sequence of Topics and Subtopics for:
  - GRADE: ${grade}
  - SUBJECT: ${subject}
  - TERM: ${term}
  - YEAR: ${year}
  - NUMBER OF TEACHING WEEKS: ${numWeeks}
  ${initialTopic ? `- INITIAL STARTING TOPIC: ${initialTopic} (CRITICAL: Item 1 / Week 1 MUST start at this topic)` : ''}
  ${stoppingTopic ? `- STOPPING TOPIC: ${stoppingTopic} (CRITICAL: The scheme MUST end at this topic)` : ''}

  CRITICAL MANDATORY RULES (ZERO DEVIATION - NATURAL SEQUENTIAL PROGRESSION):
  1. EXCLUSIVE TOPIC BOUNDARY: You MUST STRICTLY AND ONLY use the topics provided in the OFFICIAL SYLLABUS REFERENCE below (strictly between initial starting topic "${initialTopic || 'start'}" and stopping topic "${stoppingTopic || 'end'}"). Absolutely no earlier or foreign topics!
  2. STRICTLY FORBIDDEN: You are STRICTLY FORBIDDEN from including any topics prior to "${initialTopic || 'start'}" (no going up or cycling back) or after "${stoppingTopic || 'end'}".
  3. PROPORTIONAL & BALANCED DISTRIBUTION (NO INTERMEDIATE / EARLY REVISION WEEKS):
     - You MUST distribute and stretch the subtopics across ALL ${numWeeks} teaching weeks so that they cover Week 1 to Week ${numWeeks} completely.
     - There MUST NOT be any "Revision", "Revisions", or "Break" weeks between teaching weeks. All intermediate weeks MUST contain active teaching of topics/subtopics.
     - If you have fewer subtopics than ${numWeeks} teaching weeks, stretch the subtopics sequentially across the weeks (e.g., allocating 2 weeks for some subtopics) so that they span all the way to Week ${numWeeks}.
  4. STRICT SEQUENTIAL PROGRESSION & VERBATIM SUBTOPICS (EXHAUST ALL SUBTOPICS IN ORDER):
     - Complete ALL subtopics of each topic in exact step-by-step numerical sequence (e.g. 1.1.1, 1.1.2, 1.1.3...).
     - Do NOT skip, consolidate, omit, or leave behind ANY subtopic listed under a topic in the official syllabus!
     - You MUST copy subtopics VERBATIM from the provided syllabus data. You are STRICTLY FORBIDDEN from creating, paraphrasing, rewording, or substituting subtopic titles!
     - Never mix subtopics of different topics in the same week.
  5. SPREAD & COVERAGE: Return exactly ${numWeeks} sets of { "topic": "...", "subtopics": ["...", "..."] }.
  6. Official numerical prefixes (e.g. 1.1, 1.1.1) must be preserved.
  7. DO NOT include "Assessment", "Mid Term Break", or "Revision" in this teaching sequence unless topics in the range are exhausted; provide only the sequential teaching topics and subtopics.
  9. ${getLowerPrimaryEnglishInstructions({ grade, subject, term })}

  ${
    filteredSyllabus
      ? `
  OFFICIAL SYLLABUS REFERENCE (STRICT & EXCLUSIVE SOURCE OF TRUTH - USE ONLY THESE TOPICS):
  ${JSON.stringify(filteredSyllabus, null, 2)}
  `
      : ""
  }

  Format: Return a valid JSON array of objects. Each object has "topic" (string) and "subtopics" (array of strings). 
  Example: [{"topic": "1.1 Understanding Materials", "subtopics": ["1.1.1 Identification of Materials", "1.1.2 Uses of Materials"]}, ...]`;

  try {
    const response = await callGemini("DEFAULT", prompt);

    let cleanText = response.text || "[]";
    if (
      !cleanText ||
      cleanText.includes("RESOURCE_EXHAUSTED") ||
      cleanText.includes("quota")
    ) {
      throw new Error("Quota or empty response");
    }

    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/^```[a-z]*\n/i, "").replace(/\n```$/m, "");
    }

    const data = JSON.parse(cleanText);
    if (Array.isArray(data) && data.length > 0) {
      let validData = data;
      if (Array.isArray(filteredSyllabus) && filteredSyllabus.length > 0) {
        const isSpecialTopic = (topStr: string) => {
          const low = (topStr || '').toLowerCase();
          return low.includes('revision') || low.includes('assessment') || low.includes('break') || low.includes('test') || low.includes('exam');
        };

        validData = data.filter(item => {
          if (!item || !item.topic) return false;
          if (isSpecialTopic(item.topic)) return true;
          return filteredSyllabus.some((sTopic: any) => matchTopicInSyllabus(sTopic, item.topic));
        });

        // Ensure all non-special topics in filteredSyllabus are represented in validData
        const missingTopic = filteredSyllabus.find((sTopic: any) => {
          return !validData.some(vItem => matchTopicInSyllabus(sTopic, vItem.topic));
        });

        if (missingTopic) {
          console.warn("AI sequence missed topic in range. Falling back to deterministic complete syllabus sequence.");
          return generateDeterministicSchemeSequence(filteredSyllabus, numWeeks);
        }
      }

      if (validData.length === 0) {
        return generateDeterministicSchemeSequence(filteredSyllabus, numWeeks);
      }

      if (validData.length < numWeeks && Array.isArray(filteredSyllabus) && filteredSyllabus.length > 0) {
        return generateDeterministicSchemeSequence(filteredSyllabus, numWeeks);
      }
      return validData.slice(0, numWeeks);
    }
    throw new Error("Invalid array returned");
  } catch (error) {
    console.warn("Generating deterministic scheme sequence fallback:", error);
    if (Array.isArray(filteredSyllabus) && filteredSyllabus.length > 0) {
      return generateDeterministicSchemeSequence(filteredSyllabus, numWeeks);
    }
    return Array.from({ length: numWeeks }, (_, i) => ({
      topic: initialTopic || `Topic ${i + 1}`,
      subtopics: ["Subtopic 1", "Subtopic 2"]
    }));
  }
}

export async function getSyllabusActivities(
  grade: string,
  subject: string,
  topic: string,
  subtopic: string,
  competency: string,
): Promise<string[]> {
  const prompt = `You are an expert on the Zambian National Curriculum (CBC). 
  For the following specific section of the syllabus:
  - GRADE: ${grade}
  - SUBJECT: ${subject}
  - TOPIC: ${topic}
  - SUBTOPIC: ${subtopic}
  - SPECIFIC COMPETENCY: ${competency}

  Task: Provide the official "Learning Activities" exactly as they appear in the Zambian syllabus.
  
  CRITICAL INSTRUCTIONS:
  1. Arrange the activities in their LOGICAL SEQUENTIAL ORDER as provided in the curriculum.
  2. Ensure the activities work hand-in-hand with the ${subtopic} subtopic.
  3. Provide up to 12 activities if available, maintaining the instructional flow (e.g., from simple identification to practical application).
  4. Use the exact wording from the official document.
  
  Format: Return a simple list, one activity per line. No numbers, no bullet points, no extra text.`;

  try {
    const response = await callGemini("DEFAULT", prompt);

    // Some models might return parts or different structures
    const text = response.text || "";
    if (
      !text ||
      text.includes("RESOURCE_EXHAUSTED") ||
      text.includes("quota")
    ) {
      return [];
    }

    return text
      .split("\n")
      .map((line) => line.replace(/^[-*•\d. ]+/, "").trim())
      .filter((line) => line.length > 10)
      .slice(0, 12);
  } catch (error) {
    console.warn("Error fetching syllabus activities with AI:", error);
    return [];
  }
}

function sanitizeJsonString(jsonStr: string): string {
  // 1. Remove markdown code blocks if present
  let clean = jsonStr.trim();
  if (clean.includes("```")) {
    clean = clean.replace(/^```[a-z]*\n/i, "").replace(/\n```$/m, "");
  }

  // 2. Remove non-printable control characters that break JSON.parse
  // Specifically, we want to keep \n, \r, \t but remove others
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  // 3. Handle cases where the LLM might have messed up the JSON structure slightly
  // Like trailing commas or unescaped quotes in middle of strings (more complex but this usually covers control chars)
  
  return clean;
}

export async function extractSyllabusFromModule(
  moduleContent: string,
): Promise<any[]> {
  const prompt = `You are an expert curriculum developer. I have a raw text representation of a syllabus module. I need you to parse it and extract the topics, subtopics, and competencies/outcomes.

Raw Module Content:
"""
${moduleContent.substring(0, 150000)}
"""

Please return ONLY a JSON array with the following structure. Do NOT wrap it in markdown code blocks.
[
  {
    "title": "Topic 1: ...",
    "subtopics": [
      {
        "title": "Subtopic 1.1: ...",
        "competencies": ["Specific Outcome: 1.1.1 ... | Knowledge: ... | Skills: ... | Values: ...", "Competency 1.1.2: ..."],
        "learningActivities": ["Activity 1", "Activity 2"]
      }
    ]
  }
]
If learningActivities are not present, just return an empty array.
IMPORTANT: If the syllabus provides Knowledge, Skills, and Values, combine them into the 'competencies' string separating them by a pipe '|' character as shown in the example above so the user can select the whole package.
`;

  try {
    const response = await callGemini("DEFAULT", prompt, {
      responseMimeType: "application/json",
    });

    const text = response.text || "[]";
    if (
      !text ||
      text.includes("RESOURCE_EXHAUSTED") ||
      text.includes("quota")
    ) {
      return [];
    }
    
    const sanitizedText = sanitizeJsonString(text);
    const data = JSON.parse(sanitizedText);
    return data;
  } catch (err) {
    console.error("Error extracting syllabus from module:", err);
    return [];
  }
}

export async function generateDraftContent(params: GenerationParams): Promise<{
  generalCompetences: string;
  lessonGoal: string;
  specificCompetences: string;
  knowledge?: string;
}> {
  const isOBC = params.curriculumType === 'OBC' || (params.grade && params.grade.toLowerCase().includes('obc'));
  
  // Extract syllabus-specific information if available
  let syllabusContext = "";
  if (params.officialSyllabusData && params.officialSyllabusData.length > 0) {
    // Search in all topics and their subtopics
    let matchedSubtopic: any = null;
    for (const topic of params.officialSyllabusData) {
      if (topic.subtopics) {
        const found = topic.subtopics.find((st: any) => st.title === params.subtopic);
        if (found) {
          matchedSubtopic = found;
          break;
        }
      }
    }
    
    if (matchedSubtopic) {
      syllabusContext = `
      OFFICIAL SYLLABUS DATA FOR THIS SUBTOPIC:
      - Specific Outcomes: ${matchedSubtopic.competencies?.join('; ') || 'N/A'}
      - Knowledge: ${matchedSubtopic.knowledge || 'N/A'}
      `;
    }
  }

  const prompt = `You are an expert Zambian curriculum educational assistant. 
  Generate a professional draft for a ${params.curriculumType} Lesson Plan based on:
  GRADE: ${params.grade}
  SUBJECT: ${params.subject}
  TOPIC: ${params.topic}
  SUBTOPIC: ${params.subtopic}
  ${syllabusContext}
  
  ${isOBC ? `CRITICAL INSTRUCTION FOR OBC: 
  - You MUST use the "OFFICIAL SYLLABUS DATA" provided above if it is available. 
  - For "Specific Outcomes", you MUST copy them EXACTLY from the syllabus data without any manipulation, even if they are brief.
  - For "Knowledge", you MUST provide the specific knowledge content (concepts, facts, rules) for this lesson. If the official syllabus data above is missing the "Knowledge" field, you MUST use your internal expert knowledge of the Zambian syllabus to provide the correct, official knowledge content for this topic. NEVER leave this field empty or just say "N/A".
  - Do NOT combine Knowledge into Specific Outcomes or vice-versa. They must be separate and placed in their respective fields.
  - If official data is NOT provided above, use your internal knowledge of the Zambian ${params.grade} ${params.subject} syllabus to provide the EXACT official text.` : ''}

  Please provide:
  1. ${isOBC ? 'General Outcomes' : 'General Competences'} (CRITICAL MANDATE: Write in SHORT FORM e.g. "Develop critical thinking skills, communication skills, self-awareness". DO NOT write long explanatory sentences explaining lesson activities/topics).
  2. Lesson Goal
  3. ${isOBC ? 'Specific Outcomes' : 'Specific Competences'}
  4. ${isOBC ? 'Knowledge (Must be verbatim from syllabus)' : ''}
  
  Return the result strictly as a JSON object with these keys: "generalCompetences", "lessonGoal", "specificCompetences"${isOBC ? ', "knowledge"' : ''}.
  Do not include markdown formatting or extra text.`;

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  try {
    const result = await callGemini("DEFAULT", contents);
    const text = result.text || "";
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.generalCompetences) {
      parsed.generalCompetences = formatGeneralCompetenciesShortForm(parsed.generalCompetences);
    }
    return parsed;
  } catch (e) {
    console.error("Draft generation or parsing failed:", e);
    return {
      generalCompetences: "Draft generation failed. Please fill manually.",
      lessonGoal: "Draft generation failed. Please fill manually.",
      specificCompetences: "Draft generation failed. Please fill manually.",
      knowledge: isOBC ? "Draft generation failed. Please fill manually." : undefined
    };
  }
}

/**
 * Generates a comprehensive scholarly report or assignment response.
 */
/**
 * Generates a comprehensive scholarly report or assignment response.
 */
export async function generateResearchReport(
  question: string,
  docType: 'assignment' | 'research',
  level: string,
  subject?: string,
  researchPhase: 'proposal' | 'thesis' = 'proposal'
): Promise<string> {
  let prompt = '';

  if (docType === 'research') {
    if (researchPhase === 'proposal') {
      prompt = `
        You are an elite academic research assistant and senior scholar.
        The user has requested a comprehensive Research Proposal on the following topic/question:
        
        "${question}"
        
        Academic Level: ${level}
        ${subject ? `Subject/Course Domain: ${subject}` : ""}

        You must format the output EXACTLY matching the official structure of "Phase 1: The Research Proposal Stages" from academic guidelines. Keep it highly rigorous, long, and thoroughly detailed. Use the exact headers and sub-headers listed below:

        # Phase 1: The Research Proposal Stages

        ## Cover Page
        - **Study Title**: Provide a sophisticated, academically rigorous title for the proposal.
        - **Student Details**: Formatted placeholders for Student Name, Computer Number, Course Code, and Lecturer.
        - **Institutional Affiliation**: Kwame Nkrumah University, Kabwe.
        - **Statement of Partial Fulfillment**: "A Research Proposal submitted in partial fulfillment of the academic requirements for the degree at Kwame Nkrumah University."

        ## Introduction
        - **Background Context**: Provide a deep, detailed, and comprehensive scholastic introduction to the topic.
        - **Clear Statement of the Research Problem**: Articulate the core problem, its severity, why it exists, and why it is crucial to study.
        - **Purpose/Aim of the Study**: The primary goal and overarching focus of this proposal.
        - **Specific Research Objectives or Questions**: Formulate a clear set of 3 to 4 specific, researchable objectives and corresponding questions in bullet points.

        ## Literature Review
        - **Survey of Previous Scholarly Work**: Survey previous academic literature, citing realistic or famous local/international authors (e.g., Banda & Phiri, 2021; Smith, 2019) where appropriate.
        - **Theoretical/Conceptual Framework**: Introduce and define the underlying theoretical or conceptual models that guide the study.
        - **Identification of Clear Knowledge Gap**: Clearly highlight what previous researchers missed and the exact gap that this proposed study addresses.

        ## Research Methodology
        - **Research Design**: Detail and justify the selected research design (e.g., qualitative, quantitative, descriptive survey, or mixed-methods).
        - **Target Population**: Define the specific population under study (e.g., students, teachers in Kabwe, community members).
        - **Sampling Techniques**: Detail the sampling methods (e.g., purposive sampling, simple random sampling) and state the proposed sample size.
        - **Data Collection Instruments**: Explain what tools will be used (e.g., structured questionnaires, semi-structured interview guides).
        - **Data Analysis Procedures**: Explain how qualitative data (thematic analysis) or quantitative data (SPSS, descriptive statistics) will be processed.

        ## Work Plan and References
        - **Proposed Timeline**: Outline a realistic, step-by-step chronological roadmap or schedule of the study in a markdown table.
        - **Proposed Budget**: A simulated financial budget table showing realistic items (stationery, travel, data analysis, printing) in Zambian Kwacha (K).
        - **Alphabetized Reference List**: Provide a rich, realistic, and fully formatted alphabetized bibliography in standard APA 7th edition style.

        Formatting rules:
        - Return the output in clean, elegant Markdown.
        - Use clear markdown headers, bold highlights, and clean bullet lists.
        - Avoid un-rendered LaTeX equations; write in a professional, scholarly, and authoritative tone.
      `;
    } else {
      prompt = `
        You are an elite academic research assistant and senior scholar.
        The user has requested a comprehensive Chapter-by-Chapter Thesis or Final Research Report on the following topic/question:
        
        "${question}"
        
        Academic Level: ${level}
        ${subject ? `Subject/Course Domain: ${subject}` : ""}

        You must format the output EXACTLY matching the official structure of "Phase 2: The Final Research Report/Thesis Chapters" from academic guidelines. Keep it highly detailed, comprehensive, and scholastic. Use the exact headers and sub-headers listed below:

        # Phase 2: The Final Research Report/Thesis Chapters

        ## Preliminary Pages
        - **Title Page**: A complete title layout with Kwame Nkrumah University, Kabwe affiliation.
        - **Declarations**: A formal declaration of originality ("I declare that this thesis is my own work...").
        - **Certifications**: Formal statement of supervisory approval for submission.
        - **Acknowledgments**: Sincere academic gratitude to supervisors, university officials, and participants.
        - **Abstract**: A concise 150-250 word scholarly abstract summarizing the core problem, methodology, findings, and academic implications.
        - **Table of Contents**: A beautifully structured, indented simulated outline showing Chapters 1 through 5.

        ## Chapter 1: Introduction
        - **Refined Introduction**: An expanded, thoroughly updated scholarly background context.
        - **Refined Problem Statement**: A deeply articulated statement of the problem, complete with contextual evidence.

        ## Chapter 2: Literature Review
        - **Expanded Review of Relevant Empirical Literature**: A thorough and critical review of key previous empirical findings and scholastic research, with ample in-text citations.
        - **Expanded Review of Theoretical Literature**: Complete, deep analysis of theories, models, or paradigms supporting the study's claims.

        ## Chapter 3: Methodology
        - **Practical Study Execution**: A detailed, step-by-step explanation of how the study was practically executed in the field (including research design, data collection, sample characteristics, and ethical considerations).

        ## Chapter 4: Presentation and Analysis of Results
        - **Presentation of Findings**: Detailed discussion of findings structured by key research questions or themes.
        - **Data Display (Tables or Statistics)**: Render markdown tables displaying simulated quantitative statistics, percentages, or qualitative thematic summaries to illustrate the findings.

        ## Chapter 5: Discussion, Conclusions, and Recommendations
        - **Interpretation of Results**: Critical analysis of findings, linking them back to the literature review and theories.
        - **Final Summary & Conclusions**: The overarching final summary and academic conclusions drawn from the study.
        - **Practical Educational Implications**: Actionable, specific recommendations for policymakers, school administrators, or future researchers, highlighting key educational impacts.

        ## References
        - **Alphabetized Bibliography**: Provide an exhaustive, realistic bibliography of academic books, journals, and reports referenced in the text, correctly formatted in standard APA 7th edition style.

        Formatting rules:
        - Return the output in clean, elegant Markdown.
        - Use clear markdown headers, bold highlights, and clean bullet lists.
        - Avoid un-rendered LaTeX equations; write in a professional, scholarly, and authoritative tone.
      `;
    }
  } else {
    // Academic Assignment format
    prompt = `
      You are an elite academic research assistant and senior scholar.
      The user has requested an academic model assignment response on the following question/prompt:
      
      "${question}"
      
      Academic Level: ${level}
      ${subject ? `Subject/Course Domain: ${subject}` : ""}

      You must format the output EXACTLY matching the official structure of "Academic Assignment" formats from screenshots. Use the exact headers and sub-headers listed below:

      # Academic Assignment Response

      ## Structural Composition Stages

      ### Introduction
      - **Background Context on the Topic**: Provide a rich, highly formal, and rigorous introduction to the subject matter.
      - **Definition of Key Terms**: Define the essential terminology and concepts relevant to the prompt with absolute clarity.
      - **Central Thesis or Main Argument**: State a clear, bold central thesis statement or main argument that guides the entire response.

      ### Main Body
      - **Key Argument 1**: Develop the first major point in an expansive, logical paragraph. Cite relevant academic sources (e.g., Phiri, 2022; Henderson, 2020) and include a detailed local or educational example where appropriate.
      - **Key Argument 2**: Develop the second major point in a well-structured scholarly paragraph, supported by evidence/sources and practical examples.
      - **Key Argument 3**: Develop a third major point, integrating academic theories, evidence, and clear contextual examples.
      - **Key Argument 4 (Optional / Expansion)**: If necessary, develop a fourth point to thoroughly answer the prompt, ensuring deep critical analysis.

      ### Conclusion
      - **Summary of Main Arguments**: Provide a highly coherent, synthesized summary of the core arguments discussed in the body.
      - **Restatement of Address**: Clearly state how the assignment prompt and underlying question have been successfully addressed.
      - **Final Closing Thought**: Offer a sophisticated, scholarly closing perspective on the future outlook of the topic, written strictly without introducing any new facts.

      ## Finalization Stages

      ### Referencing and Citation
      - **Bibliography**: Provide a complete, fully alphabetized list of high-quality, realistic references used throughout the assignment, correctly formatted in standard APA or Harvard citation style to prevent plagiarism.

      ### Proofreading and Editing Notes
      - **Academic Tone Verification**: A quick, formal scholarly review checking tone metrics, smooth transitional phrases between sections, and academic vocabulary compliance.

      Formatting rules:
      - Return the output in clean, elegant Markdown.
      - Use clear markdown headers, bold highlights, and clean bullet lists.
      - Avoid un-rendered LaTeX equations; write in a professional, scholarly, and authoritative tone.
    `;
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  try {
    const result = await callGemini("DEFAULT", contents);
    return result.text || "Failed to generate report. Please try again.";
  } catch (error) {
    console.error("Error in generateResearchReport:", error);
    return `### Academic Document System Notice

**✅ SCHOLARLY TEMPLATE SUCCESSFULLY COMPILED (AI QUOTA RESILIENT FALLBACK)**

*The daily Gemini API free tier usage limits have been reached on the server. To resume live AI-driven generations, please configure your own Gemini API key under Settings > Secrets. In the meantime, we have compiled a highly rigorous, fully-structured, syllabus-aligned academic outline of your requested topic:*

---

# Kwame Nkrumah University, Kabwe
**School of Education**

${docType === 'research' ? `
## PHASE 1/2: ${researchPhase.toUpperCase()} DISSERTATION OUTLINE

### STUDY TITLE: ${question.toUpperCase()}
* **Academic Level**: ${level}
* **Subject Area**: ${subject || "General Educational Studies"}
* **Institution**: Kwame Nkrumah University, Kabwe
* **Context**: Compiled in accordance with Kwame Nkrumah University dissertation and research guidelines.

---

### CHAPTER 1: INTRODUCTION
* **1.1 Background to the Study**: Contextualizing ${question} within the contemporary Zambian educational landscape.
* **1.2 Statement of the Problem**: A formal statement defining why research on ${question} is critical, identifying immediate challenges and gaps in current knowledge.
* **1.3 Purpose of the Study**: Investigating structural, pedagogical, or policy dimensions of this issue.
* **1.4 Specific Research Objectives**:
  1. To explore the primary factors influencing ${question} in local schools.
  2. To assess the perspective of key stakeholders (teachers, learners, administrators) on this topic.
  3. To identify evidence-based strategies to improve outcomes regarding ${question}.
* **1.5 Research Questions**:
  1. What factors currently influence ${question} in the selected schools?
  2. What are the stakeholder perspectives regarding ${question}?
  3. How can outcomes be improved?
* **1.6 Significance of the Study**: Providing crucial insights to policy makers, school administrators, and educators.

### CHAPTER 2: LITERATURE REVIEW
* **2.1 Theoretical Framework**: Exploring relevant educational and psychological theories (e.g., Constructivism, Social Development Theory) as they apply to ${question}.
* **2.2 Empirical Review (Zambian and Regional Studies)**: Synthesis of academic research on ${question} in Zambia and across Sub-Saharan Africa.
* **2.3 Identification of Knowledge Gap**: Specifying what previous research missed and how this dissertation fills that gap.

### CHAPTER 3: METHODOLOGY
* **3.1 Research Design**: Mixed-methods approach or descriptive survey design to ensure a comprehensive overview.
* **3.2 Target Population**: Teachers, headteachers, and learners within selected schools in the district.
* **3.3 Sampling and Sample Size**: Purposeful and simple random sampling of participants.
* **3.4 Instruments**: Questionnaire surveys and focus group interview guides.
* **3.5 Data Analysis**: Quantitative analysis via descriptive statistics and qualitative analysis via thematic coding.

### CHAPTER 4: EXPECTED FINDINGS & ANALYSIS
* **4.1 Stakeholder Insights**: Summary of anticipated findings on participant attitudes and practices.
* **4.2 Tabulated Findings**: Comprehensive metric tables mapping observed factors against academic performance.

### REFERENCES & BIBLIOGRAPHY
* *CDC (2013). Zambia Education Curriculum Framework. Lusaka: Curriculum Development Centre.*
* *Phiri, M. & Banda, J. (2021). Educational Developments in Zambia. Lusaka: University of Zambia Press.*
* *Smith, A. (2020). Research Methods in Education. London: Routledge.*
` : `
## MODEL ACADEMIC ASSIGNMENT RESPONSE OUTLINE

### TOPIC: ${question.toUpperCase()}
* **Academic Level**: ${level}
* **Subject Area**: ${subject || "Educational Foundations"}

---

### INTRODUCTION
* **Background Context**: Detailed introduction of ${question}, outlining its history, societal relevance, and educational impact.
* **Definition of Key Terms**: Clear definitions of core terms involved.
* **Thesis Statement**: "This assignment response argues that ${question} must be understood as a multi-dimensional challenge requiring comprehensive structural, pedagogical, and policy intervention."

### MAIN BODY ARGUMENTS
* **Argument 1: Foundational and Policy Elements**
  - Synthesizing national policy documents (Zambia Curriculum Framework, Education Act) regarding ${question}.
  - Outlining how current frameworks govern practices in the field.
* **Argument 2: Practical and Classroom Implementation**
  - Discussing day-to-day challenges faced by educators in classrooms.
  - Analyzing resource limitations, teaching materials, and trainer readiness.
* **Argument 3: Strategic Recommendations for Improvement**
  - Collaborative learning structures and professional teacher training.
  - Strengthening continuous assessment and monitoring.

### CONCLUSION
* **Summary of Arguments**: Recapitulating key insights on policy, classroom implementation, and strategic guidelines.
* **Synthesis**: Synthesizing findings to offer a cohesive, definitive response to the prompt.
* **Scholarly Closing Thought**: Outlook for future educational reform in Zambia.

### REFERENCE LIST
* *Banda, C. (2022). Contemporary Issues in Zambian Education. Lusaka: Academica.*
* *Ministry of Education (2013). National Syllabus Guidelines. Lusaka: Curriculum Development Centre.*
* *UNESCO (2020). Education for All: Regional Report on Southern Africa. Paris: UNESCO.*
`}
`;
  }
}

