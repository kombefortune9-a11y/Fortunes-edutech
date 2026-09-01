// import { GoogleGenAI } from "@google/genai";

import { extractBriefCompetencies, formatGeneralCompetenciesShortForm } from "../utils/competencyUtils";

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
  format?: string;
  selectedTopics?: { topic: string; subtopics: string[] }[];
  selectedSubtopics?: string[];
  selectedCompetences?: string[];
  expectedStandards?: string[];
  expectedStandard?: string;
  skills?: string;
  values?: string;
  teachingMethods?: string[];
  teachingAids?: string;
  references?: string;
  weeks?: {
    week: number;
    topic: string;
    topic2?: string;
    topic3?: string;
    subtopics: string[];
    competencies: string[];
    activities?: string[];
    expectedStandards?: string[];
    teachingAids?: string;
    references?: string;
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
  includeTeachingNotes?: boolean;
  includeHomework?: boolean;
  englishCombined?: boolean;
  englishComponent?: string;
  referenceModuleContent?: string;
  isBatch?: boolean;
  batchItems?: any[];
  prompt?: string;
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
(Generate a Markdown Table with these exact headers: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- |
| <b>Step 1: Phonemic awareness</b><br/>(5 minutes) | [Target sound identification (/s/); model sounding out target sound to learners; ask learners to sound out target sound] | [Listen and sound out target sound (/s/)] | Learners sound out target sound correctly |
| <b>Step 2: Phonics</b><br/>(10 minutes) | [Letter shape formation and blending; show grapheme card and show how to blend target sound with other learnt sounds to form words] | [Observe letter shape formation, sound out target sound and blend with other learnt sounds] | Learners form letter shapes and blend sounds correctly |
| <b>Step 3: Fluency</b><br/>(20 minutes) | [Word reading and segmenting; write words on board carrying target sound, model reading words on board and segmenting] | [Read words on board with teacher and segment given words] | Learners read words fluently and segment correctly |
| <b>Step 4: Vocabulary</b><br/>(7 minutes) | [Contextual stories and sentence building; display chart with words carrying target sound, instruct learners to identify words and use them in sentences orally] | [Identify target sound words in context and use words in oral sentences] | Learners identify words and build contextual sentences |
| <b>Step 5: Writing</b><br/>(20 minutes) | [CVC writing and pattern drawing; instruct learners to complete CVC missing graphemes/writing] | [Complete CVC writing and form letter shapes accurately] | Learners perform CVC writing independently |
| <b>Comprehension</b><br/>(5 minutes) | [Tell or read a story for learners to listen; ask learners to re-tell story using their own words] | [Listen attentively to story; re-tell story using own words] | Learners re-tell story using own words |
| <b>Conclusion</b><br/>(3 minutes) | [Model singing a song with words that carry target sound /s/; ask learners to repeat] | [Sing song with words that carry target sound /s/] | Learners sing song with target sound words |

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
(Generate a Markdown Table with these exact headers: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- |
| <b>Step 1: Phonemic awareness</b><br/>(5 minutes) | [Target sound identification (/s/); model sounding out target sound to learners; ask learners to sound out target sound] | [Listen and sound out target sound (/s/)] | Learners sound out target sound correctly |
| <b>Step 2: Phonics</b><br/>(10 minutes) | [Letter shape formation and blending; show grapheme card and show how to blend target sound with other learnt sounds to form words] | [Observe letter shape formation, sound out target sound and blend with other learnt sounds] | Learners form letter shapes and blend sounds correctly |
| <b>Step 3: Fluency</b><br/>(20 minutes) | [Word reading and segmenting; write words on board carrying target sound, model reading words on board and segmenting] | [Read words on board with teacher and segment given words] | Learners read words fluently and segment correctly |
| <b>Step 4: Vocabulary</b><br/>(7 minutes) | [Contextual stories and sentence building; display chart with words carrying target sound, instruct learners to identify words and use them in sentences orally] | [Identify target sound words in context and use words in oral sentences] | Learners identify words and build contextual sentences |
| <b>Step 5: Writing</b><br/>(20 minutes) | [CVC writing and pattern drawing; instruct learners to complete CVC missing graphemes/writing] | [Complete CVC writing and form letter shapes accurately] | Learners perform CVC writing independently |
| <b>Comprehension</b><br/>(5 minutes) | [Tell or read a story for learners to listen; ask learners to re-tell story using their own words] | [Listen attentively to story; re-tell story using own words] | Learners re-tell story using own words |
| <b>Conclusion</b><br/>(3 minutes) | [Model singing a song with words that carry target sound /s/; ask learners to repeat] | [Sing song with words that carry target sound /s/] | Learners sing song with target sound words |

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
(Generate a Markdown Table with these exact headers: STAGES, TEACHER'S ROLE, LEARNERS' ROLE, PERFORMANCE INDICATOR)
| STAGES | TEACHER'S ROLE | LEARNERS' ROLE | PERFORMANCE INDICATOR |
| :--- | :--- | :--- | :--- |
| <b>Introduction</b><br/>(2 minutes) | -Ask learners to recall prior oral greetings or name items related to the lesson context. | -Recall and respond by naming greetings or items from home/class. | Learners recall prior greeting/context and respond orally. |
| <b>Development</b><br/><b>Step 1: Present</b><br/>(5 minutes) | -Introduce the phrase "Good morning."<br/>-Explain that "Good morning" is used before noon (12 hours).<br/>-Demonstrate greeting each other in the morning:<br/>  • Teacher: "Good morning, Mapalo!"<br/>  • Mapalo (Learner): "Good morning, Teacher!"<br/>  • Learner 1 (Grace): "Good morning, John!"<br/>  • Learner 2 (John): "Good morning, Grace!" | -Listen attentively to the introduction of "Good morning".<br/>-Observe teacher demonstrations.<br/>-Participate in demo dialogues with teacher and peers. | Learners listen attentively, identify morning greeting context, and respond in demonstration dialogues. |
| <b>Step 2: Practice</b><br/>(10 minutes) | -Conduct a whole-class choral repetition of "Good morning."<br/>-Pair learners to practice the greeting in a dialogue format:<br/>  • Learner 1 (Jane): "Good morning, Peter."<br/>  • Learner 2 (Peter): "Good morning, Jane."<br/>-Rotate pairs to ensure everyone practices with different partners. | -Participate enthusiastically in whole-class choral repetition.<br/>-In pairs, practice the morning greeting dialogue.<br/>-Switch partners to practice with different peers. | Learners repeat phrase chorally and exchange morning greetings accurately in pairs with different partners. |
| <b>Step 3: Produce</b><br/>(10 minutes) | -Put learners into small groups to role-play a scenario where they meet in the morning (e.g. arriving at school).<br/>-Ask each group to perform their dialogue in front of the class.<br/>-Provide constructive feedback, appraisal, and praise. | -Organize into small groups and role-play morning meeting scenarios.<br/>-Perform dialogues confidently in front of the class.<br/>-Listen to teacher feedback. | Learners perform morning greeting role-play dialogues confidently and accurately in front of class. |
| <b>Step 4: Closure</b><br/>(3 minutes) | -Summarize when "Good morning" is used.<br/>-Lead the class in singing the 'Good Morning song' with actions.<br/>-Conduct a final quick oral check. | -Recite that "Good morning" is used before noon.<br/>-Sing the 'Good Morning song' enthusiastically with actions.<br/>-Respond to teacher's final greeting. | Learners sing 'Good Morning song' and articulate correct usage context. |

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

  if (!isZambianLanguage) {
    return {
      strictRule: "STRICT LANGUAGE REQUIREMENT: You MUST write the ENTIRE document (Scheme, Forecast, and Lesson Plan) and ALL of its text, teaching materials, examples, questions, activities, and references strictly in ENGLISH. Do NOT include any local Zambian languages (like Tonga, Bemba, Nyanja, Lozi, Kiikaonde, Luvale, Lunda etc.) or local words anywhere in this document. All examples must be in standard English. This is extremely important because the selected subject is not Zambian language.",
      exampleRule: "All examples in the activities, teacher actions, or learner roles MUST be strictly in English. Do NOT use local vocabulary like 'Mulishani', 'omwe', or 'Mwapona'. Use standard English examples only.",
      notesRule: "All vocabulary, counting, numbers, colors, calendar terms, customs, and greetings MUST be presented in standard English. Absolutely no localized Zambian dialects or local words are permitted."
    };
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

  return {
    strictRule: `STRICT LANGUAGE REQUIREMENT: You MUST write the ENTIRE Scheme of Work and Weekly Forecast in ENGLISH. Topics, subtopics, expected standards, and materials MUST be in English. ONLY use local language for brief examples in quotes. Since the chosen subject is Zambian local language, and specifically the selected local language is **${dialect}**, you MUST strictly use authentic ${dialect} vocabulary, words, and phrases for all examples (do NOT use Tonga or Bemba words if they are not the chosen dialect). For Lesson Plans, you may incorporate examples and module content in ${dialect} so the teacher can relate directly to the syllabus.`,
    exampleRule: `Under teacher's and learners' activities where examples are called for, utilize authentic **${dialect}** examples (such as: counting, colors, greeting greetings, and basic verbs). Never use other languages than ${dialect}.`,
    notesRule: `You MUST use real and correct **${dialect}** terms throughout the teaching notes:
        - For Numbers: ${countEx}.
        - For Colours: ${colorEx}.
        - For Calendar: ${calEx}.
        - For Customs & Greetings: ${greetEx}.
        - For Grammar & Verbs: ${verbEx}.
        Do NOT use other dialects' equivalents, and never use boilerplate placeholder lists. These ${dialect} words must be written out explicitly with their pronunciation, translations, and precise teacher usage guides.`
  };
}

export function getZambianLanguageLessonPlanInstructions(params: GenerationParams): string {
  const sLow = (params.subject || '').toLowerCase();
  const isZambianLang = sLow.includes('zambian') || 
                        sLow.includes('icibemba') || sLow.includes('cinyanja') || 
                        sLow.includes('chitonga') || sLow.includes('silozi') || 
                        sLow.includes('kiikaonde') || sLow.includes('lunda') || 
                        sLow.includes('luvale') || sLow.includes('bemba') || 
                        sLow.includes('nyanja') || sLow.includes('tonga') || 
                        sLow.includes('lozi');

  if (!isZambianLang || params.type !== 'lesson_plan') return '';

  const dialect = params.zambianLanguage || 'Icibemba';
  const gradeStr = String(params.grade || '').toLowerCase();

  const isGrade1 = (gradeStr.includes('grade 1') || gradeStr.includes('grade1')) && !gradeStr.includes('10') && !gradeStr.includes('11') && !gradeStr.includes('12') || gradeStr === '1' || gradeStr === '1a' || gradeStr === '1b' || gradeStr === '1c' || (gradeStr.includes('1') && !gradeStr.includes('10') && !gradeStr.includes('11') && !gradeStr.includes('12') && !gradeStr.includes('2') && !gradeStr.includes('3'));

  if (isGrade1) {
    return `
SPECIAL ZAMBIAN LANGUAGE CBC INTEGRATED LITERACY LESSON PLAN FORMAT FOR GRADE 1 (MANDATORY):
Since the selected subject is a Zambian Language (${dialect}) for Grade 1, you MUST structure the entire lesson plan strictly following the official Ministry of Education / CDC Sample Lesson Plan format for Grade 1 Zambian Languages Integrated Literacy:

CRITICAL FORMAT REQUIREMENT:
- The <b>INTRODUCTION</b> section MUST be placed OUTSIDE and BEFORE the Lesson Development table as standalone text. Do NOT place Introduction as a row inside the table!
- Following Introduction, output the section title <b>LESSON DEVELOPMENT</b>, followed directly by the 4-column Markdown table (COMPONENT, TEACHER'S ROLE, LEARNERS' ROLE, ASSESSMENT CRITERIA).

CRITICAL HEADER RULE:
- DO NOT output any document title header (e.g., "${dialect.toUpperCase()} GRADE 1 SAMPLE LESSON PLAN"), school name, district name, teacher name, TS number, grade, date, duration, time, or attendance lines. The main header block with all school and teacher metadata is ALREADY inserted automatically at the top by the system.
- Start your output DIRECTLY with <b>COMPONENTS:</b> Listening and Speaking, Reading, Writing (or <b>TOPICS:</b> / <b>SUB-TOPICS:</b>), followed by <b>SPECIFIC COMPETENCES:</b>, <b>RATIONALE:</b>, <b>REFERENCES:</b>, <b>TEACHING AND LEARNING RESOURCES:</b>, <b>INTRODUCTION:</b>, and <b>LESSON DEVELOPMENT</b>!

<b>COMPONENTS:</b> Listening and Speaking, Reading, Writing
<i>(Note that this is lesson 1 on sound '[letter]'. Lesson 2 on letter sound '[letter]' should include listening comprehension in place of listening and speaking.)</i>

<b>TOPICS:</b> ${params.topic || 'Descriptions, Phonological Awareness and Phonics, and Handwriting'}
<b>SUB-TOPICS:</b> ${params.subtopic || "Descriptions of people, phonemic awareness, letter sound 't', syllables, and letter formation"}

<b>SPECIFIC COMPETENCES:</b>
You MUST map specific competences with their official syllabus code numbers and bold component tags in parentheses:
- [Code e.g. 1.3.1.1] [Specific Competence text] <b>(Listening and Speaking)</b> (or <b>Listening Comprehension</b> for Lesson 2)
- [Code e.g. 1.7.1.1] Identify and manipulate phonemes (sound /[letter]/) <b>(Reading - Phonemic Awareness)</b>
- [Code e.g. 1.7.2.1] Identify and manipulate syllables in oral words (syllables with /[letter]/) <b>(Reading - Phonological awareness)</b>
- [Code e.g. 1.8.1.1] Sound out letters (letter '[letter]') <b>(Reading - Phonics)</b>
- [Code e.g. 1.8.2.1] Blend consonants and vowels to form syllables <b>(Reading - Phonics)</b>
- [Code e.g. 1.15.1.1] Write letters (letter '[letter]') <b>(Writing - Handwriting)</b>

<b>RATIONALE:</b>
Write a comprehensive rationale paragraph:
"This is an integrated literacy lesson with three components: Listening and speaking, reading and writing. Listening and speaking is on [Subtopic/Topic]. It is important to the learners as they will be able to [skills gained]. Under reading, learners will learn to identify and manipulate sound /[letter]/ in oral syllable and words as well as to sound letter '[letter]' and to form syllables using letter '[letter]'. Under writing, learners will learn how to form letter '[letter]'. These skills are necessary in learning how to read and write. The lesson will be delivered using the following strategies: Gradual Release Model, question and answer, and discussions. This is lesson ${params.lessonNumber || '1'} of 2 lessons on sound /[letter]/ in Week ${params.lessonWeekNumber || '1'}."

<b>REFERENCES:</b> Literacy and Language syllabus pages [Page numbers], [Module details].
<b>TEACHING AND LEARNING RESOURCES:</b> Pictures of [topic], letter cards for letter '[letter]' and vowels (a, e, i, o, u), pictures or objects whose names begin with /[letter]/.

<b>INTRODUCTION (5 minutes):</b> (THIS MUST BE OUTSIDE AND BEFORE THE LESSON DEVELOPMENT TABLE)
Teacher sings a topic/description song with learners in authentic ${dialect} (e.g. song lines in ${dialect} with English translations in quotes e.g., <i>Ba teacher bapa college 'teachers at college...' Baliba abapusanasana '...are of different physical appearance'</i>). Teacher explains that the song is [describing...], and that in this lesson they will [describe..., sound out /[letter]/, write letter '[letter]', and form syllables using '[letter]'].

2. LESSON DEVELOPMENT TABLE STRUCTURE:
Output heading: <b>LESSON DEVELOPMENT</b>

Generate a Markdown Table with headers:
| COMPONENT | TEACHER'S ROLE | LEARNERS' ROLE | ASSESSMENT CRITERIA |

The table MUST start directly with Component 1 (Listening and Speaking / Listening Comprehension). DO NOT put Introduction inside the table!

The table MUST include these exact integrated components and activities derived directly from the official modules:

<b>1. LISTENING AND SPEAKING (20 minutes)</b> (or <b>1. LISTENING COMPREHENSION (20 minutes)</b> if Lesson 2)
- <b>Activity 1: Listing words used to [describe topic/people/objects]</b>
  - Teacher's Role: Sings the description/topic song with learners again and asks learners to identify words in the song describing [teachers/people/topic] ([words in ${dialect}]). Explains that when describing [people/topic] we look at physical appearance / traits. Asks learners to mention appropriate words describing [people/topic] (teacher guides/corrects where appropriate). Icilangililo / Example: <b>[5-6 authentic ${dialect} words e.g. umutali, umwipi, uwaonda, uwaina, uwafita, uwakashika]</b>.
  - Learners' Role: Provide answers: <b>[words in ${dialect}]</b>. Listen and answer questions. Provide appropriate words of describing [people/topic]. Icilangililo / Example: <b>[words in ${dialect}]</b>.
  - Assessment Criteria: Identification of the words in the song describing [teachers/people/topic]. Appropriate words of describing [people/topic] provided like: <b>[words in ${dialect}]</b>.
- <b>Activity 2: Using identified words in sentences to describe [people/topic] (this can be done in groups)</b>
  - Teacher's Role: Shows different pictures of [people/topic] and asks learners to describe them. Teacher demonstrates the activity by describing one picture in ${dialect} (e.g., <i>Namona umukashaana umutali kabili uwakashika.</i>).
  - Learners' Role: Respond to teacher's questions and elicitation. Use identified words to describe people/objects in pictures.
  - Assessment Criteria: A sentence with at least 1 description word used to describe a given person/object.

<b>2. READING (20 minutes) (Phonological awareness and Phonics)</b>
- <b>Activity 1: Identifying syllables in oral words</b>
  - Teacher's Role: Provides words (using pictures or objects) whose syllables are formed by sound /[letter]/. Icilangililo / Example: <b>[5 oral words beginning with target sound in ${dialect}, e.g. tapa, toba, tina, tula, tema]</b>. Explains that the word <b>[word, e.g. tapa]</b> has two syllables <b>[ta]</b> and <b>[pa]</b> (teacher explains to learners that a word has parts which are heard as pauses when spoken). Demonstrates how to identify syllables in oral words provided e.g. mentions the parts of the word individually <b>ta - pa</b>. Works with learners to identify syllables in oral words provided. Gives words to learners individually and in groups to identify the syllables.
  - Learners' Role: Listen to teacher's explanation. Work with teacher in identifying syllables in oral words. Identify syllables in given words individually and in groups.
  - Assessment Criteria: Correct identification of syllables in given oral words identified.
- <b>Activity 2: Identifying initial sound in oral words</b>
  - Teacher's Role: Demonstrates how to identify initial sound in given oral words which begin with /[letter]/. Works with learners to identify initial sounds in words which begin with /[letter]/. Gives learners oral words which begin with /[letter]/ so that they can identify the initial sound. Amashiwi / Words: (<b>[5 words starting with target letter in ${dialect}]</b>).
  - Learners' Role: Listen to instructions given by teacher. Work with teacher to identify initial sounds of words. In groups and pairs identify initial sound of oral words which begin with sound /[letter]/.
  - Assessment Criteria: Correct identification of initial sounds of words beginning with sound /[letter]/.
- <b>Activity 3: Sounding out letter '[letter]'</b>
  - Teacher's Role: Explains that sound /[letter]/ is represented by letter '[letter]' and shows learners letter '[letter]' on letter card. Demonstrates how to sound letter '[letter]'. Sounds out '[letter]' with learners. Asks learners to sound out '[letter]' (individually, in pairs and in groups).
  - Learners' Role: Listen to teacher's explanation. Listen to sounding out of letter '[letter]' by teacher. Sound out letter '[letter]' with teacher. Sound out letter '[letter]' (individually, in pairs and in groups).
  - Assessment Criteria: Letter '[letter]' sounded out correctly and audibly.
- <b>Activity 4: Forming syllables by bending/blending letter '[letter]' and vowels</b>
  - Teacher's Role: Teacher explains that a syllable can be formed by merging a consonant and a vowel. Demonstrates how to form syllables using imfumu <b>a, e, i, o, u</b>. [letter] + a = [sa/ta], [letter] + e = [se/te], [letter] + i = [si/ti], [letter] + o = [so/to], [letter] + u = [su/tu].
  - Learners' Role: Listen to teacher explanation, answer questions and elicitation. Follow teacher's demonstration of forming syllables. Work with teacher to form syllables. Form syllables by blending letter '[letter]' with vowels using letter cards.
  - Assessment Criteria: Correct syllables formed: <b>[ta, te, ti, to, tu / sa, se, si, so, su]</b>.

<b>3. WRITING (10 minutes) Write letters</b>
- <b>Activity 1. Copying letter '[letter]'</b>
  - Teacher's Role: Demonstrates how to form letter '[letter]'. Works with learners to demonstrate how to write letter '[letter]' in the air, on the ground, on the board. Tells learners to write letter '[letter]' in groups and individually: [letter] [letter] [letter] [letter] [letter] [letter] [letter] [letter] [letter].
  - Learners' Role: Observe and listen to pick the way of writing letter '[letter]'. Work with teacher to write letter '[letter]'. Write letter '[letter]' in groups and individually.
  - Assessment Criteria: Letter '[letter]' correctly formed in the air, on the ground, on the chalkboard, and in books.

<b>CONCLUSION (5 minutes)</b>
- Teacher's Role: Emphasises key teaching points of the lesson through questions.
- Learners' Role: Conclude with teacher through answering some questions.
- Assessment Criteria: Questions on key teaching points correctly answered.

3. LESSON EVALUATION:
End with:
<b>Lesson Evaluation</b>
.........................................................................................................................................
.........................................................................................................................................
`;
  }

  // FOR GRADE 2 AND GRADE 3 (AND OTHER ZAMBIAN LANGUAGE LESSON PLANS):
  return `
SPECIAL ZAMBIAN LANGUAGE CBC LESSON PLAN FORMAT FOR GRADE 2 AND GRADE 3 (MANDATORY):
Since the selected subject is a Zambian Language (${dialect}) for Grade ${params.grade || '2'}, you MUST structure the entire lesson plan strictly following the official Ministry of Education / CDC Sample Lesson Plan format for Grade 2 and Grade 3 Zambian Languages:

CRITICAL HEADER RULE:
- DO NOT output any document title header (e.g., "${dialect.toUpperCase()} GRADE ${params.grade || '2'} SAMPLE LESSON PLAN"), school name, district name, teacher name, TS number, grade, date, duration, time, or attendance lines. The main header block with all school and teacher metadata is ALREADY inserted automatically at the top by the system.
- Start your output DIRECTLY with <b>TOPICS:</b> or <b>SUB-TOPICS:</b>, followed by <b>GENERAL COMPETENCES:</b>, <b>SPECIFIC COMPETENCES:</b>, <b>LESSON GOAL:</b>, <b>RATIONALE:</b>, <b>REFERENCES:</b>, <b>TEACHING AND LEARNING RESOURCES:</b>, <b>INTRODUCTION:</b>, and <b>LESSON DEVELOPMENT</b>!

<b>TOPICS:</b> ${params.topic || 'Descriptions, Reading fluency and Handwriting'}
<b>SUB-TOPICS:</b> ${params.subtopic || 'People, Oral reading and Manuscript writing'}

<b>GENERAL COMPETENCES:</b> Communication, collaboration, critical thinking, creativity.

<b>SPECIFIC COMPETENCES:</b>
List the 3 specific competences mapping Listening and Speaking, Reading, and Writing:
- [Syllabus Code e.g. 2.3.1.1] Give physical descriptions of people <b>(Listening and Speaking)</b>
- [Syllabus Code e.g. 2.6.1.1] Read aloud syllables formed by three or more consonant clusters <b>(Reading)</b>
- [Syllabus Code e.g. 2.12.1.1] Write words of increasing number of syllables legibly in manuscript form <b>(Writing)</b>

<b>LESSON GOAL:</b> In this lesson, learners will describe people using appropriate language, read aloud syllables formed by 3 or more consonant clusters and write words of increasing numbers of syllables legibly in manuscript form.

<b>RATIONALE:</b> This is an integrated literacy lesson with three components: Listening and speaking, reading and writing. Listening and speaking is on descriptions. It is important to the learners as they will be able to give accurate physical descriptions of people and will use appropriate words to describe people. Under reading, learners will learn to read syllables of more than 3 consonant clusters. On writing, learners will write words of increasing number of syllables. These skills are necessary in learning how to read and write. The lesson will be delivered using the following strategies: Gradual Release Model, question and answer and discussions. This is lesson ${params.lessonNumber || '1'} of 5 lessons in Week ${params.lessonWeekNumber || '1'}.

<b>REFERENCES:</b>
- Ministry of Education (2025), <i>Grade ${params.grade || '2'} ${dialect} Teaching Module</i>. Lusaka: ZEPH.
- Ministry of Education (2024) <i>Zambian Languages Ordinary Level syllabus</i>. Curriculum Development Centre, Lusaka.
- Ministry of Education (2024) <i>Competence Based Curriculum Framework</i>. Lusaka: ZEPH.

<b>LEARNING ENVIRONMENT:</b>
<b>Artificial Environment:</b> Classroom.

<b>TEACHING AND LEARNING RESOURCES:</b> Chart showing a picture of people, syllable cards.

<b>EXPECTED STANDARDS:</b>
i. Words used to describe people identified correctly
ii. Formed syllables read aloud correctly
iii. Words of 3-4 syllables copied correctly and legibly in manuscript form

2. LESSON PROGRESSION TABLE (4 COLUMNS: STAGES, TEACHER'S ACTIVITY, LEARNERS' ACTIVITY, ASSESSMENT CRITERIA):
Generate a Markdown Table with exact columns:
| STAGES | TEACHER'S ACTIVITY | LEARNERS' ACTIVITY | ASSESSMENT CRITERIA |

The table MUST include all 5 stages populated with authentic topic details and ${dialect} words:

| <b>Introduction</b> | Ask learners to describe their guardians.<br/><br/>Display the chart showing people and ask learners to describe them. | To describe their guardians.<br/><br/>Describe people seen on the chart. | To describe their guardians using appropriate language (abeepi, abatali, abaina, abaonda, abafiita).<br/><br/>Use appropriate words to describe people on the chart. |
| <b>Lesson development</b> | Show learners cards with syllables and ask them to read the syllables aloud.<br/><br/>Write 6 words of 3-4 syllables on the board and ask learners to read them correctly with your guidance. | Reading aloud the syllables on the syllable cards.<br/><br/>Read the given words on the board. | Learners to read aloud the syllables on the cards with correct pronunciation (mbya, mfwa, ndwi).<br/><br/>To read the given words on the board with correct pronunciation. |
| <b>Exercise</b> | Ask learners to copy the written words on the board in their exercise books. | Copy the given words correctly in their exercise books. | Words of 3-4 syllables copied correctly and legibly in manuscript form. |
| <b>Home work</b> | Lemba amashiwi yatatu umuli ifilundwa ifi:<br/>1. Mbya<br/>2. Mfwa<br/>3. Ndwi | Copy the given work in their books. | Copying the work in their books individually. |
| <b>Conclusion</b> | Ask learners to mention words used to describe people.<br/><br/>Ask them to read through the written words on the board with 3 or more syllables. | Mention words used to describe people.<br/><br/>Read words with 3 or more syllables. | Summarizing the lesson by mentioning words used to describe people and reading words with more than 3 syllables. |

3. LESSON EVALUATION SECTION:
Must end with the exact evaluation text:
<b>LESSON EVALUATION:</b>

<i>Note to the teacher: under evaluation, the teacher should write about the following;</i>

1. What has been achieved during the lesson
2. What has not been achieved during the lesson.
3. If there were challenges during the lesson, you can mention them.
4. Mention the remedies that you will use to rectify the identified challenges
5. If there were successes during the lesson, what are those? And to what extent?
`;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries + 1; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || String(error);
      const isQuotaError = msg.toLowerCase().includes("quota") || 
                          msg.toLowerCase().includes("429") || 
                          msg.toLowerCase().includes("resource_exhausted") ||
                          msg.toLowerCase().includes("limit");
      
      // Since the server-side already performs comprehensive fallback, any rate/quota error
      // reaching the client means ALL server models have exhausted their rates.
      // We fail fast to avoid keeping the user waiting in a frozen state.
      if (isQuotaError) {
        throw new Error(
          "Gemini API Quota is temporarily exhausted (Google AI Studio Free Tier limits). Please wait 30-60 seconds before generating again, or decrease the document length/complexity to lower token usage."
        );
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

async function callGemini(model: string, contents: any, config?: any) {
  return withRetry(async () => {
    const response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, contents, config }),
    });

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
      console.error("Expected JSON but got:", text.substring(0, 500));
      throw new Error("Invalid response format from server. Please try again.");
    }

    return await response.json();
  });
}

export async function askGeminiAssistant(
  prompt: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  const systemInstruction = `You are a helpful, senior virtual consultant and Zambian Teacher's Assistant in the Fortunes Edutech App.
Your role is to help educators with academic subjects, general questions, and support with using the app. You have NO limits on general or academic topics, but you MUST protect the proprietary development details of the application.

Here are your guidelines for answering questions:

1. **General Knowledge & All Academic Subjects (No Limits)**: Feel free to answer any general queries, math problems, science questions, English, history, geography, general knowledge, or any academic topic.
2. **Account Support, Pricing Circles & Cache Verification (User-Facing only)**:
    *   Detail the pricing circles: Weekly (ZMK 20), 14 Days (ZMK 40), Monthly (ZMK 90), Termly (ZMK 250), and Lifetime Unlimited (ZMK 1500).
    *   Explain how accounts work, how whitelist activations sync, and how to troubleshoot activation issues using the "Sync & Verify Activation" or "Verify Activation" buttons.
3. **Zambian Curriculum Support**: Guide teachers on CDC guidelines, Outcomes-Based Education (OBE/OBC), Primary Literacy Programme (PLP), and how to generate Schemes of Work, Lesson Plans, and forecasts.
4. **Developer Support Contacts**: Provide WhatsApp/calls support number: +260957622025 or +260961622222.
5. **CRITICAL RESTRICTION - No Engineering/Code/Developer Details**:
    *   If a user asks about the internal engineering, source code, frameworks (like React, Vite, Tailwind), database internals, file structures, or how the developer built the app, you MUST politely decline to answer.
    *   Say: "I cannot share the technical engineering, source code, or internal development details of the Fortunes Edutech App. For any application support, pricing circle inquiries, or curriculum guidance, please let me know and I will be happy to help!"

Be encouraging, objective, and detailed on allowed topics. Provide complete answers using clean markdown tables and bullet points.`;

  const formattedContents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    { role: "model", parts: [{ text: "Understood. I will act as a senior Zambian Teacher's Assistant to guide and support the educator with concise, highly practical, and relevant advice using Zambian curriculum guidelines." }] },
    ...history,
    { role: "user", parts: [{ text: prompt }] }
  ];

  try {
    const res = await callGemini("gemini-2.5-flash", formattedContents, {
      temperature: 0.7,
      maxOutputTokens: 1500,
    });
    return res.text || res.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (err: any) {
    console.error("Error in askGeminiAssistant:", err);
    throw err;
  }
}

function generateFallbackTable(params: GenerationParams, error?: string): string {
  const t = params.type;
  const isOBC = params.curriculumType === "OBC";
  const warningLine = error ? `<div style="background-color: #FEF2F2; color: #991B1B; padding: 15px; border: 2px solid #F87171; border-radius: 10px; margin-bottom: 20px; text-align: center;">\n<b style="font-size: 14pt;">⚠️ AI GENERATION LIMIT REACHED</b><br/>\n${error}.<br/>\n<b>You can still fill this document manually using the table below.</b>\n</div>\n\n` : "";
  
  // Create professional header for fallback
  const docTitle = (t?.toUpperCase() || "DOCUMENT").replace(/_/g, " ");
  const professionalHeader = `
<center>
<b style="font-size: 14pt; text-transform: uppercase;">${params.district ? params.district.toUpperCase() + (params.district.toUpperCase().includes("DISTRICT") ? "" : " DISTRICT") : "[DISTRICT NAME] DISTRICT"}</b><br/>
<b style="font-size: 14pt; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : "[SCHOOL NAME]"}</b><br/>
<b style="font-size: 16pt; text-transform: uppercase;">${docTitle}${params.forecastWeek ? ` - WEEK ${params.forecastWeek}` : ""}</b><br/>
</center>
<br/>
<div style="display: flex; justify-content: space-between; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 4px;">
<div style="flex: 1; text-align: left;"><b>NAME OF TEACHER:</b> ${params.teacherName ? params.teacherName.toUpperCase() : "NAME OF TEACHER"}</div>
<div style="flex: 1; text-align: center;"><b>GRADE:</b> ${params.grade || "____________________"}</div>
<div style="flex: 1; text-align: right;"><b>ZONE:</b> ${params.zone || "____________________"}</div>
</div>
<div style="display: flex; justify-content: space-between; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 4px;">
<div style="flex: 1; text-align: left;"><b>TS NO:</b> ${params.tsNumber || "____________________"}</div>
<div style="flex: 1; text-align: center;"><b>SUBJECT:</b> ${params.subject || "____________________"}</div>
<div style="flex: 1; text-align: right;"><b>TERM:</b> ${params.term || "___"} &nbsp;&nbsp; <b>WEEK:</b> ${params.forecastWeek || "___"} &nbsp;&nbsp; <b>YEAR:</b> ${params.year || "2026"}</div>
</div>
<br/>
  `.trim();

  if (t === "schemes_of_work") {
    const defaultWeeks = params.weeks ? params.weeks.length : 14;
    const tableHeader = isOBC 
      ? `| WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |`
      : `| WEEK | TOPIC | SUBTOPIC | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCES |`;
    
    const separator = isOBC 
      ? `|---|---|---|---|---|---|---|---|---|---|`
      : `|---|---|---|---|---|---|---|---|---|`;

    const rows = (params.weeks || Array.from({length: defaultWeeks})).map((w: any, i: number) => {
        const weekData = typeof w === 'object' ? w : { week: i + 1 };
        const topics = [weekData.topic, weekData.topic2, weekData.topic3].filter(Boolean).join(" / ");
        return `| ${weekData.week || i + 1} | ${topics || ""} | ${weekData.subtopics?.join(", ") || ""} | ${weekData.competencies?.join("; ") || ""} | ${weekData.expectedStandards?.join("; ") || ""} | ${weekData.activities?.join("; ") || ""} | | ${weekData.teachingAids || ""} | ${weekData.references || ""} |`;
      });

    return `${warningLine}${professionalHeader}\n\n${tableHeader}\n${separator}\n${rows.join("\n")}`;
  } else if (t === "weekly_forecast") {
    const tableHeader = isOBC 
      ? `| DAY | TOPIC | SUBTOPICS | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCES | WEEKLY RECORD |`
      : `| DAY | TOPIC | SUBTOPICS | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | T/L AIDS | REFERENCES | WEEKLY RECORD |`;
    
    const separator = isOBC 
      ? `|---|---|---|---|---|---|---|---|---|---|---|`
      : `|---|---|---|---|---|---|---|---|---|---|`;

    // Use whatever forecast days were entered in the form
    const rows = (params.forecastDays || []).map(dayData => {
        const topic = dayData.topic || "";
        const subtopic = dayData.subtopic || "";
        const outcomes = dayData.competency || "";
        const activities = dayData.activities?.filter(a => a.trim() !== "").join("; ") || "";
        const standards = dayData.expectedStandard || "";
        
        if (isOBC) {
          return `| ${dayData.day} | ${topic} | ${subtopic} | ${outcomes} | | | | | ${dayData.teachingAids || ""} | ${dayData.references || ""} | |`;
        }
        return `| ${dayData.day} | ${topic} | ${subtopic} | ${outcomes} | ${standards} | ${activities} | | ${dayData.teachingAids || ""} | ${dayData.references || ""} | |`;
    });

    // If no days entered, create 5 empty numbered rows
    if (rows.length === 0) {
      for (let i = 1; i <= 5; i++) {
        const d = i.toString();
        if (isOBC) {
          rows.push(`| ${d} | | | | | | | | | | |`);
        } else {
          rows.push(`| ${d} | | | | | | | | | |`);
        }
      }
    }

    return `${warningLine}${professionalHeader}\n\n${tableHeader}\n${separator}\n${rows.join("\n")}`;
  } else if (t === "lesson_plan") {
    const generalHeader = isOBC ? "GENERAL OUTCOMES" : "GENERAL COMPETENCES";
    const specificHeader = isOBC ? "SPECIFIC OUTCOMES" : "SPECIFIC COMPETENCES";
    const sLowFallback = (params.subject || '').toLowerCase();
    const isLiteracyInEnglishFallback = (sLowFallback.includes('literacy') || params.englishComponent === 'literacy') && !sLowFallback.includes('oral');

    const fallbackTableContent = isLiteracyInEnglishFallback ? `  <tr><td class="stage-cell" style="font-weight: bold;">Step 1: Phonemic awareness</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Step 2: Phonics</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Step 3: Fluency</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Step 4: Vocabulary</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Step 5: Writing</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Comprehension</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">Conclusion</td><td></td><td></td><td></td></tr>` : `  <tr><td class="stage-cell" style="font-weight: bold;">INTRODUCTION</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">LESSON DEVELOPMENT</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">PRACTICE/APPLICATION</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">EXERCISE</td><td></td><td></td><td></td></tr>
  <tr><td class="stage-cell" style="font-weight: bold;">CONCLUSION</td><td></td><td></td><td></td></tr>`;

    return `
${warningLine}
<center>
  <strong style="font-size: 14pt; text-transform: uppercase;">${params.district ? (params.district.toUpperCase().includes("DISTRICT") ? params.district.toUpperCase() : params.district.toUpperCase() + " DISTRICT") : "................ DISTRICT"}</strong><br/>
  <strong style="font-size: 14pt; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : "................"}</strong><br/>
  <strong style="font-size: 16pt; text-transform: uppercase;">LESSON PLAN</strong><br/>
</center>

<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 5px; font-family: 'Inter', sans-serif;">
  <tr style="border-top: 2px solid black; border-bottom: 1.5px solid black;">
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 65%; white-space: nowrap;"><strong>SUBJECT:</strong> ${params.subject || "................"}</td>
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 35%; text-align: right; white-space: nowrap;"><strong>DATE:</strong> .....................</td>
  </tr>
  <tr style="border-bottom: 1.5px solid black;">
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 45%; white-space: nowrap;"><strong>GRADE:</strong> ${params.grade || "................"}</td>
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 35%; text-align: center; white-space: nowrap;"><strong>YEAR/TERM:</strong> ${params.year || "2026"} / TERM ${params.term || "1"}</td>
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 20%; text-align: right; white-space: nowrap;"><strong>TIME:</strong> .................</td>
  </tr>
  <tr style="border-bottom: 2px solid black;">
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 45%; white-space: nowrap;"><strong>SUBJECT:</strong> ${params.subject || "................"}</td>
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 35%; text-align: center; white-space: nowrap;"><strong>ATTENDANCE:</strong> (B: ....... / G: .......)</td>
    <td style="padding: 7px 6px; font-size: 10.5pt; font-weight: normal; border: none; width: 20%; text-align: right; white-space: nowrap;"><strong>DURATION:</strong> .............</td>
  </tr>
</table>

<div class="lesson-plan-content" style="margin-top: 10px;">
  <div style="margin-bottom: 10px;"><b>TOPIC:</b> ${params.topic || "................"}</div>
  <div style="margin-bottom: 10px;"><b>SUB-TOPIC:</b> ${params.subtopic || "................"}</div>
  <div style="margin-bottom: 10px;"><b>${generalHeader}:</b><br/>
  - <br/></div>
  <div style="margin-bottom: 10px;"><b>${specificHeader}:</b><br/>
  - <br/></div>
  <div style="margin-bottom: 10px;"><b>EXPECTED STANDARD:</b> ${params.expectedStandards?.join("; ") || "................"}</div>
  ${isLiteracyInEnglishFallback ? `<div style="margin-bottom: 15px;"><b>INTRODUCTION (5 minutes):</b><br/>
  * <b>Teacher to:</b> ........................................................................................................................................<br/>
  * <b>Learners will:</b> ........................................................................................................................................</div>` : ''}
  <div style="margin-bottom: 10px;"><b>LESSON GOAL:</b> ............................................................................................................................................................</div>
  <div style="margin-bottom: 15px;"><b>RATIONALE:</b><br/>
  ............................................................................................................................................................</div>
  <div style="margin-bottom: 15px;"><b>PRIOR KNOWLEDGE/SKILLS/VALUES:</b><br/>
  <b>Knowledge:</b> ........................................................<br/>
  <b>Skills:</b> ........................................................<br/>
  <b>Values:</b> ........................................................</div>
  <div style="margin-bottom: 15px;"><b>TEXTBOOK REFERENCES:</b><br/>
  - <br/></div>
  <div style="margin-bottom: 15px;"><b>TEACHING AND LEARNING RESOURCES / MATERIALS:</b><br/>
  - <br/></div>
  <div style="margin-bottom: 15px;"><b>LEARNING ENVIRONMENT:</b><br/>
  <b>Natural:</b> ........................................................<br/>
  <b>Artificial:</b> ........................................................<br/>
  <b>Technological:</b> ........................................................</div>
  <div style="margin-bottom: 15px;"><b>LEARNING ACTIVITIES:</b><br/>
  - </div>
</div>

<h3 style="text-align: left; font-size: 11pt; font-weight: bold; margin-bottom: 15px; margin-top: 25px;">LESSON DEVELOPMENT</h3>
<table class="lesson-plan-table">
  <tr>
    <th style="width: 12%;">STAGE</th>
    <th style="width: 36%;">TEACHER'S ACTIVITIES</th>
    <th style="width: 36%;">LEARNERS' ACTIVITIES</th>
    <th style="width: 16%;">PERFORMANCE INDICATOR</th>
  </tr>
${fallbackTableContent}
</table>

<div class="lesson-plan-footer">
  <p><strong>LEARNER'S EVALUATION:</strong></p>
  <p>............................................................................................................................................................</p>
  <p>............................................................................................................................................................</p>
  
  <p><strong>TEACHER'S EVALUATION:</strong></p>
  <p>............................................................................................................................................................</p>
  <p>............................................................................................................................................................</p>
</div>
`.trim();
  } else if (t === "lesson_notes") {
    const selectedSubtopicsList = (params.selectedSubtopics && params.selectedSubtopics.length > 0)
      ? params.selectedSubtopics
      : (params.subtopic ? [params.subtopic] : ["................"]);

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
<h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.school ? params.school.toUpperCase() : "................"}</h2>
</center>

<div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
<p style="margin: 4px 0;"><b>SUBJECT:</b> ${params.subject || "................"}</p>
<p style="margin: 4px 0;"><b>GRADE:</b> ${params.grade || "................"}</p>
<p style="margin: 4px 0;"><b>TOPIC:</b> ${params.topic || "................"}</p>
<p style="margin: 4px 0;"><b>SUB-TOPIC:</b> ${joinedSubtopics}</p>
</div>

<div style="font-size: 10pt; font-weight: bold; margin-bottom: 15px; text-align: right;"># DETAILED LESSON NOTES</div>

<div class="lesson-notes-meta" style="margin-bottom: 25px; line-height: 1.6;">
<b>SPECIFIC ${isOBC ? "OUTCOMES" : "COMPETENCES"}:</b><br/>${params.specificCompetences || "................"}<br/>
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
<li>${params.references || "................"}</li>
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
      kras = [
        { area: "1. PLANNING AND PREPARATION", acc: "Prepare professional documents for teaching.", act: "- Schemes of work<br/>- Weekly forecasts<br/>- Lesson plans", target: "Approved documents by week 1", rating: "" },
        { area: "2. TEACHING AND LEARNING", acc: "Deliver quality lessons to learners.", act: "- Use active learning methods<br/>- Use TLMs effectively", target: "80% learner pass rate", rating: "" },
        { area: "3. PERFORMANCE DELIVERY", acc: "Ensure effective syllabus coverage.", act: "- Teach all periods<br/>- Maintain class records", target: "100% syllabus coverage", rating: "" },
        { area: "4. ASSESSMENT & MONITORING", acc: "Assess learner progress regularly.", act: "- Continuous assessments<br/>- Remedial teaching", target: "Improved learner performance", rating: "" },
        { area: "5. PROFESSIONAL DEVELOPMENT", acc: "Engage in continuous professional growth.", act: "- Attend CPD/SIT/ZIT<br/>- Peer observations", target: "Updated professional skills", rating: "" }
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
    const schoolTitle = params.school ? params.school.toUpperCase() : "CHINIKA SECONDARY SCHOOL";
    return `
${warningLine}
<center><h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${schoolTitle}</h2></center>

<div style="text-align: left; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; margin-top: 10px;">
<h3 style="margin: 0; font-size: 16pt; text-align: center; margin-bottom: 10px; font-weight: 800; text-transform: uppercase;">${testTitle}</h3>
<p style="margin: 5px 0;"><b>SUBJECT:</b> ${params.subject || "................"} &nbsp;&nbsp;&nbsp;&nbsp; <b>GRADE:</b> ${params.grade || "........"} &nbsp;&nbsp;&nbsp;&nbsp; <b>TERM:</b> ${params.term || "1"} &nbsp;&nbsp;&nbsp;&nbsp; <b>YEAR:</b> ${params.year || "2026"}</p>
<p style="margin: 5px 0;"><b>DATE:</b> ${params.testDate || "_________________"} &nbsp;&nbsp;&nbsp;&nbsp; <b>TIME DURATION:</b> ${params.testDuration ? `${params.testDuration} minutes` : "60 minutes"}</p>
<p style="margin: 10px 0 5px 0;"><b>LEARNER'S NAME:</b> _______________________________________________________________</p>
</div>

**SECTION A: MULTIPLE CHOICE QUESTIONS (10 Marks)**

1. Which of the following is a key requirement according to the standard ${params.subject || "curriculum"} syllabus for ${params.grade || "this grade"}?
   A. Option 1 &nbsp;&nbsp;&nbsp; B. Option 2 &nbsp;&nbsp;&nbsp; C. Option 3 &nbsp;&nbsp;&nbsp; D. Option 4

2. Identify the correct term or principle associated with ${params.topic || "the core topic"}:
   A. Option A &nbsp;&nbsp;&nbsp; B. Option B &nbsp;&nbsp;&nbsp; C. Option C &nbsp;&nbsp;&nbsp; D. Option D

3. Fill in the blank: The primary objective of this subject is to promote __________.
   A. Comprehension &nbsp;&nbsp;&nbsp; B. Observation &nbsp;&nbsp;&nbsp; C. Application &nbsp;&nbsp;&nbsp; D. Synthesis

4. Choose the true statement regarding ${params.subject || "this subject"}:
   A. Statement A &nbsp;&nbsp;&nbsp; B. Statement B &nbsp;&nbsp;&nbsp; C. Statement C &nbsp;&nbsp;&nbsp; D. Statement D

5. Select the item that best demonstrates the practical application of this concept:
   A. Example 1 &nbsp;&nbsp;&nbsp; B. Example 2 &nbsp;&nbsp;&nbsp; C. Example 3 &nbsp;&nbsp;&nbsp; D. Example 4

<br/>

**SECTION B: SHORT ANSWER QUESTIONS (10 Marks)**

6. Define the main concepts related to ${params.topic || "this topic"} and state two key characteristics. (4 Marks)
   _________________________________________________________________________________
   _________________________________________________________________________________

7. Briefly explain how a learner demonstrates competency in ${params.subject || "this subject"}. (3 Marks)
   _________________________________________________________________________________
   _________________________________________________________________________________

8. List three examples or applications of this subtopic in daily life. (3 Marks)
   _________________________________________________________________________________
   _________________________________________________________________________________

<br/>

**SECTION C: ESSAY / STRUCTURED QUESTIONS (10 Marks)**

9. Describe in detail the procedure and key principles for ${params.topic || "the syllabus topic"}. Provide clear step-by-step explanations. (10 Marks)
   _________________________________________________________________________________
   _________________________________________________________________________________
   _________________________________________________________________________________
   _________________________________________________________________________________

<div class="page-break"></div>

<h3 style="margin: 0; font-size: 16pt; text-align: center; margin-bottom: 15px; font-weight: 800; text-transform: uppercase;">MARKING KEY & ANSWER GUIDE</h3>

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
  }
  return `${warningLine}| CONTENT |\n|---|\n| No AI data available. Please fill manually. |`;
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
    const cleanGrade = grade.replace(/\s*\(obc\)/i, '') || 'Grade 3/5/6/7';
    const baseSyllabus = `Zambian OBC ${subject || 'Curriculum'} Syllabus (${cleanGrade})`;
    return { baseSyllabus, range: "PG:.....", start: 1, end: 300 };
  }

  // 2. CBC Secondary Levels (Form 1 to Form 4)
  if (isForm) {
    const formMatch = gLow.match(/form\s*[1-4]/i);
    const formLabel = formMatch ? formMatch[0].toUpperCase() : "Form 1 - Form 6";
    const baseSyllabus = `Zambian CBC Secondary ${subject || 'Curriculum'} Syllabus (${formLabel})`;
    return { baseSyllabus, range: "PG:.....", start: 1, end: 300 };
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

  let defaultSyllabusCitation = "";
  
  if (custom) {
    defaultSyllabusCitation = `${custom.baseSyllabus} - PG:.....`;
  } else if (isForm) {
    const formMatch = gLow.match(/form\s*[1-4]/i);
    const formLabel = formMatch ? formMatch[0].toUpperCase() : "Form 1 - Form 6";
    defaultSyllabusCitation = `Zambian CBC Secondary ${params.subject || 'Curriculum'} Syllabus (${formLabel}) - PG:.....`;
  } else if (isOBC) {
    defaultSyllabusCitation = `Zambian OBC ${params.subject || 'Curriculum'} Syllabus (${params.grade || 'Grade 3/5/6/7'}) - PG:.....`;
  } else {
    defaultSyllabusCitation = `Zambian CBC ${params.subject || 'Curriculum'} Syllabus (${params.grade || 'ECE/Grade 1/2/4'}) - PG:.....`;
  }

  let refs = params.references || "";
  let moduleCitations = modulesFromContent.map(mName => `Module: ${mName} - PG:.....`).join("; ");

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
        return `${custom.baseSyllabus}, ${params.subject} - PG:.....`;
      }
      return r;
    });
    
    const combinedRefs = [...splitted];

    if (autoModuleCitation && !combinedRefs.some(r => r.includes("Literacy Teaching Module") || r.includes("Oral English Teaching Module"))) {
      combinedRefs.push(`Module: ${autoModuleCitation}`);
    }

    modulesFromContent.forEach(mName => {
      const matchText = `Module: ${mName}`;
      const alreadyHas = combinedRefs.some(r => r.includes(matchText));
      if (!alreadyHas) {
        combinedRefs.push(`Module: ${mName} - PG:.....`);
      }
    });
    
    refs = combinedRefs.filter(Boolean).join("; ");
  }

  return refs;
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
      : (params.subtopic ? [params.subtopic] : ["................"]);

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

  // Set up standard metadata for replacement
  const replacements: Record<string, string> = {
    "{school}": params.school?.toUpperCase() || "................",
    "{schoolName}": params.school?.toUpperCase() || "................",
    "{teacherName}": params.teacherName || "................",
    "{grade}": params.grade || "................",
    "{subject}": params.subject || "................",
    "{topic}": params.topic || "................",
    "{subtopic}": (params.selectedSubtopics && params.selectedSubtopics.length > 0) ? params.selectedSubtopics.join(", ") : (params.subtopic || "................"),
    "{tsNumber}": params.tsNumber || "................",
    "{district}": params.district || "................",
    "{year}": params.year?.toString() || new Date().getFullYear().toString(),
    "{term}": params.term || "........",
    "{{term}}": params.term || "........",
    "{{school}}": params.school || "................",
    "{{header_general}}": params.curriculumType === "OBC" ? "OUTCOMES" : "COMPETENCES",
    "{{header_specific}}": params.curriculumType === "OBC" ? "OUTCOMES" : "COMPETENCES",
    "{zone}": params.zone || "................",
    "{jobTitle}": params.jobTitle || "TEACHER",
    "{{header_knowledge_label}}": params.curriculumType === "OBC" ? "KNOWLEDGE" : "CORE CONCEPTS",
    "{knowledge}": params.knowledge || "................",
    "{workPlanPeriod}": params.workPlanPeriod || "ANNUAL",
    "{jobPurpose}": params.jobPurpose || "TEACHING AND LEARNING",
    "{week}": params.forecastWeek?.toString() || "................",
    "{forecastWeek}": params.forecastWeek?.toString() || "................",
    "{references}": formatZambianSyllabusReferences(params) || "................",
  };

  // Execute replacements
  Object.entries(replacements).forEach(([key, value]) => {
    customizedPrompt = customizedPrompt.replaceAll(key, value);
  });

  if (params.curriculumType === "OBC") {
    if (params.type === "schemes_of_work") {
      customizedPrompt = customizedPrompt
        .replace(/CBC/g, "OBC")
        .replace(/Create a standard Markdown table with the required columns\./g, "Create a standard Markdown table with EXACTLY 10 columns.")
        .replace(/\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
        .replace(/\|:---|:---|:---|:---|:---|:---|:---|:---|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
        .replace(/\|\s*WEEK\s*\|\s*TOPIC\s*\|\s*SUBTOPIC\s*\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING MATERIALS\s*\|\s*REFERENCES\s*\|/gi, "| WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |")
        .replace(/WEEK\s*\|\s*TOPIC\s*\|\s*SUBTOPIC\s*\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARD\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING MATERIALS\s*\|\s*REFERENCES/gi, "WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE")
        .replace(/GENERAL COMPETENCES/g, "GENERAL OUTCOMES")
        .replace(/SPECIFIC COMPETENCES/g, "SPECIFIC OUTCOMES")
        .replace(/COMPETENCIES/g, "OUTCOMES");
    } else if (params.type === "weekly_forecast") {
      customizedPrompt = customizedPrompt
        .replace(/CBC/g, "OBC")
        .replace(/Create a standard Markdown table with EXACTLY 10 columns\./g, "Create a standard Markdown table with EXACTLY 11 columns.")
        .replace(/\|\s*DAY\s*\|\s*TOPIC\s*\|\s*SUBTOPICS\s*\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCE\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)\s*\|/gi, "| DAY | TOPIC | SUBTOPICS | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK |")
        .replace(/DAY\s*\|\s*TOPIC\s*\|\s*SUBTOPICS\s*\|\s*SPECIFIC\s+(?:COMPETENCIES|OUTCOMES)\s*\|\s*EXPECTED STANDARDS\s*\|\s*LEARNING ACTIVITIES\s*\|\s*TEACHING METHODS\s*\|\s*TEACHING AND LEARNING AIDS\s*\|\s*REFERENCE\s*\|\s*(?:RECORD OF WORK|WEEKLY RECORD)/gi, "DAY | TOPIC | SUBTOPICS | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | RECORD OF WORK")
        .replace(/\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|:---\|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
        .replace(/\|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|/g, "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")
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
    }
  } else if (params.curriculumType === "CBC" && params.type === "lesson_plan") {
    customizedPrompt = customizedPrompt
      .replace(/GENERAL COMPETENCES\/OUTCOMES/g, "GENERAL COMPETENCES")
      .replace(/SPECIFIC COMPETENCES\/OUTCOMES/g, "SPECIFIC COMPETENCES");
  }

  if (params.type === "lesson_plan") {
    const sLowSubject = (params.subject || '').toLowerCase();
    const isLiteracyInEnglish = (sLowSubject.includes('literacy') || params.englishComponent === 'literacy') && !sLowSubject.includes('oral');

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
  }

  let effectiveSyllabus = params.officialSyllabusData;
  if ((params.type === "schemes_of_work" || params.type === "weekly_forecast") && Array.isArray(params.officialSyllabusData)) {
    effectiveSyllabus = sliceSyllabusByTopicRange(params.officialSyllabusData, params.topic, params.stoppingTopic);
  }

  const syllabusContext = (params.selectedTopics && params.selectedTopics.length > 0
    ? `SELECTED SYLLABUS TOPICS (USE THESE TO FILL THE TABLE):\n${params.selectedTopics.map(t => `- Topic: ${t.topic}\n  - Subtopics: ${t.subtopics.join(", ")}`).join("\n")}`
    : `SUBJECT: ${params.subject}\nGRADE: ${params.grade}\nINITIAL STARTING TOPIC: ${params.topic || "N/A"}\nINITIAL SUBTOPIC: ${params.subtopic || "N/A"}\nINITIAL SPECIFIC COMPETENCY: ${params.specificCompetences || "N/A"}\nSTOPPING TOPIC ENTERED BY USER: ${params.stoppingTopic || "N/A"}`) + 
    (effectiveSyllabus ? `\n\nOFFICIAL SYLLABUS DATA (STRICT AND EXCLUSIVE SOURCE OF TRUTH - ONLY TOPICS FROM "${params.topic || 'START'}" TO "${params.stoppingTopic || 'STOP'}"):\n${JSON.stringify(effectiveSyllabus, null, 2)}` : "");

  const prompt = `
    You are an expert curriculum designer and educator, specializing in the Zambian ${params.curriculumType === "OBC" ? "OBC (Outcomes-Based Curriculum)" : "CBC (Competency-Based Curriculum)"} curriculum standards.
    
    ### SYLLABUS ADHERENCE & INTEGRITY:
    - STRICT SYLLABUS ADHERENCE: You MUST directly and exclusively draw all Topics, Subtopics, and Specific Competencies/Outcomes from the "OFFICIAL SYLLABUS DATA" provided below.
    - NO HALLUCINATIONS OR OUTSIDE TOPICS: You are STRICTLY FORBIDDEN from inventing, guessing, substituting, or bringing in any topics from outside the provided syllabus slice.
    - VERBATIM SUBTOPICS: You MUST use the EXACT wording and numbering for subtopics directly from the provided syllabus data. Do NOT paraphrase, reword, or invent subtopic titles!
    - EXHAUST ALL SUBTOPICS IN SEQUENCE: You MUST exhaustively cover EVERY single subtopic in the provided syllabus data step-by-step in exact numerical sequence across the teaching weeks. Do NOT omit, skip, or consolidate any subtopic!
    - ORDER MATTERS: You MUST follow the exact step-by-step sequence and numbering of topics and subtopics as they appear in the provided syllabus data.
    - WORDING: Use the exact wording for topics and subtopics from the syllabus data.
    
    SOURCE MATERIAL:
    ${syllabusContext}

    ### CRITICAL MANDATORY TOPIC BOUNDARIES FOR SCHEMES & FORECASTS (ZERO DEVIATION - ABSOLUTE MANDATE):
    1. EXCLUSIVE TOPIC RANGE: You MUST STRICTLY AND ONLY include the topics present in the provided OFFICIAL SYLLABUS DATA (which is bounded from Initial Starting Topic "${params.topic || 'Start'}" up to Stopping Topic "${params.stoppingTopic || 'End'}").
    2. STRICTLY FORBIDDEN TOPICS: You are STRICTLY FORBIDDEN from including, importing, or mentioning any earlier topics (e.g. 0.2.1, 0.2.2, 0.2.3, etc.) or any later topics that do not belong to the selected range! The ONLY topics that may appear in the TOPIC column of the entire Scheme of Work table are the ones in the provided syllabus slice.
    3. PROPORTIONAL & EXHAUSTIVE COVERAGE OF ALL TOPICS (ESPECIALLY THE ENDING/STOPPING TOPIC):
       - DO NOT shove or isolate the stopping topic into just the very last teaching week or a single row!
       - The teaching weeks MUST be proportionately divided among ALL topics in the provided syllabus range.
       - If there are 2 topics in the range (e.g. "${params.topic || 'Topic 1'}" and "${params.stoppingTopic || 'Ending Topic'}") across 10 teaching weeks:
         * Weeks 1 through ~5 MUST be dedicated to "${params.topic || 'Topic 1'}", exhaustively covering all its subtopics, specific competencies, and learning activities.
         * Weeks ~6 through 10/11 MUST be dedicated to "${params.stoppingTopic || 'Ending Topic'}", exhaustively covering all of its subtopics, competencies, expected standards, and learning activities across multiple full weeks.
       - Every subtopic of the ending topic MUST be thoroughly planned and taught across several weeks before any end-of-term revision or assessment rows.
       - The topics must progress in strict sequential order (Topic 1 subtopics completed first, then Ending Topic subtopics completed next). Never mix or scramble subtopics.
    
    ### DETAIL & CONCISENESS RULES:
    - Avoid over-summarization, but prioritize professional conciseness.
    - BALANCED CONTENT: You MUST provide clear, actionable descriptions in every table cell. Use concise, structured action phrases and bullet points.
    - NO TRUNCATION: Every Topic, Subtopic, and Outcome/Competency MUST be written in full as per the official Zambian syllabus. Do NOT cut off words or sentences.
    - SCHEMES OF WORK PAGE LIMIT (STRICT MAXIMUM 6-7 PAGES): For Schemes of Work, the entire document MUST fit on SIX (6) PAGES OR LESS (maximum of 6-7 pages for the whole term). The table layout provides wide horizontal space for "LEARNING ACTIVITIES" and "SPECIFIC COMPETENCIES/OUTCOMES". Utilize this horizontal width with succinct pedagogical action points so rows remain compact vertically and do not stretch across 13 pages.
    - WEEKLY FORECAST PAGE LIMIT (EXACTLY 1 SINGLE PAGE): For Weekly Forecast, the entire generated document MUST FIT ON EXACTLY ONE (1) SINGLE PAGE ONLY. Output length must be calibrated so all 5 day rows, headers, and references fit seamlessly on a single page without spilling over.
    - VISIBLE FONT & HIGH LEGIBILITY: Ensure text is crisp, structured, and highly legible. Avoid unnecessarily verbose phrases so font sizes remain clear and easily readable.

    ${
      params.curriculumType === "OBC" && params.type === "schemes_of_work"
        ? "FINAL ABSOLUTE MANDATE: You MUST NOT attach any 'Weekly Forecast' or 'Weekly Record' below the table. Output ONLY the Scheme of Work table and nothing else. Every row MUST have a Reference."
        : ""
    }

    ${
      params.type === "weekly_forecast"
        ? `FINAL ABSOLUTE MANDATE (PERMANENT & SEALED FOREVER): You MUST output the full professional header (DOCUMENT NAME, DISTRICT, SCHOOL, etc.) followed by the Weekly Forecast table. 
    - TABLE FORMAT: You MUST output a standard Markdown pipe table. 
    - TABLE HEADER (EXACT): | DAY | TOPIC | SUBTOPICS | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | REFERENCES | WEEKLY RECORD |
    - TABLE SEPARATOR (EXACT): |:---|:---|:---|:---|:---|:---|:---|:---|:---|
    - DAY COUNT ENFORCEMENT: You MUST generate EXACTLY the number of rows corresponding to the number of days provided in the list below. 
    - HIGH CONTENT DENSITY WITH CONCISENESS: Every cell MUST contain high-impact, professional descriptive statements. Keep statements highly "telegraphic" (concise, precise, and short, e.g. "Identify letter sounds" instead of "The pupils will be guided to identify modern letter sounds using charts"), and avoid fluffy or repetitive phrases. This ensures it stays dense but compact.
    - STRICT SINGLE PAGE LIMIT: The entire generated document (including headers and all rows of the table) MUST fit on EXACTLY ONE (1) A4 page. Never let the table or text overflow beyond one page. Output length must be calibrated to ensure a clean, beautiful single-page print fit.
    - LEARNING ACTIVITIES DISTRIBUTION BY DAY: You MUST NOT repeat all four module activities (Activity 1a and Activity 1b (for Term 2 and 3), or up to Activity 1d (only for Term 1)) on every single day row. Assign Day 1 to Activity 1a, Day 2 to Activity 1b, Day 3 to Activity 1c, Day 4 to Activity 1d, and Day 5 to Activity 1e or revision. Every activity MUST be a detailed, actionable learning statement (e.g. 'Activity 1a: Phonemic awareness (identifying sound /s/ in words), letter shape formation, and grapheme blending'), NEVER a generic bare sound label.
    - TEACHING METHODS: Use ONLY standard names (e.g., 'Demonstration', 'Group work').`
        : ""
    }

    Task: ${customizedPrompt}
    
    ${
      params.englishCombined && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
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
    `
        : !params.englishCombined && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && (params.subject?.toLowerCase().includes('oral') || params.englishComponent === 'oral') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### STANDALONE ORAL ENGLISH SPECIAL RULES:
    1. STANDALONE SUBJECT MANDATE: Prepare this document STRICTLY and EXCLUSIVELY for ORAL ENGLISH as an independent, standalone subject.
    2. NO LITERACY MIXING: You are STRICTLY FORBIDDEN from including Literacy in English topics, phonics, sound blending, or National Literacy Teaching Module activities.
    3. TABLE STRUCTURE: Use standard single-subject topic slots and subtopics (e.g. 1 main topic and 3 subtopics per week in Scheme of Work, or 5 days of Oral English in Weekly Forecast).
    4. REFERENCES: Cite the official Oral English Teaching Module and Lower Primary Literacy & Language Syllabus (Oral English section).
    `
        : !params.englishCombined && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && (params.subject?.toLowerCase().includes('literacy') || params.englishComponent === 'literacy') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? `
    ### STANDALONE LITERACY IN ENGLISH SPECIAL RULES:
    1. STANDALONE SUBJECT MANDATE: Prepare this document STRICTLY and EXCLUSIVELY for LITERACY IN ENGLISH as an independent, standalone subject.
    2. NO ORAL ENGLISH MIXING: You are STRICTLY FORBIDDEN from including Oral English conversation topics or general listening/speaking outcomes.
    3. LITERACY ACTIVITIES: Plan Literacy in English lessons following the National Literacy Teaching Module structure (Phonemic awareness, Phonics, Activity 1a, 1b, 1c, 1d, sound blending, decodable text reading, writing, and comprehension).
    4. TABLE STRUCTURE: Use standard single-subject topic slots and subtopics.
    5. REFERENCES: Cite the official National Literacy Teaching Module and Lower Primary Literacy & Language Syllabus (Literacy in English section).
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
       - OBC TABLE STRUCTURE (MANDATORY 10 COLUMNS): For OBC curriculum, you MUST use exactly these 10 columns in this order: WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE.
       - COLUMN WIDTHS & PACING: Keep the "WEEK" content minimal (just the digit). 
       - PAGE TARGET: For Schemes of Work, the document MUST fit within 6 pages or less (ideally 4 to 6 pages). Provide rich, comprehensive curriculum detail across all 13-14 weeks.
       - ASSESSMENT WEEKS (Weeks 4, 8, 12, 13): You MUST provide detailed learning activities and focus areas in these weeks. Specify what is being assessed.
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
    - Header MUST include: MINISTRY OF EDUCATION, ZAMBIA.
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
    
    CRITICAL FORMATTING RULES FOR ASSESSMENTS:
    1. HEADER EXCLUSIONS: You MUST NOT include "REPUBLIC OF ZAMBIA", "MINISTRY OF EDUCATION", or District Name headers in the assessment document. These MUST BE COMPLETELY OMITTED for assessments. DO NOT generate the "Teacher Name / TS No" box that is used for other document types; for assessments, use ONLY the HEADER LAYOUT below.
    2. HEADER LAYOUT: You MUST construct a clean header block EXACTLY as follows at the very beginning of the document (DO NOT INCLUDE REPUBLIC OF ZAMBIA, MINISTRY OF EDUCATION, OR DISTRICT HEADER):
    
    ${params.school ? `<center><h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">${params.school.toUpperCase()}</h2></center>` : ""}

    <div style="text-align: left; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; margin-top: 10px;">
    <h3 style="margin: 0; font-size: 16pt; text-align: center; margin-bottom: 10px; font-weight: 800; text-transform: uppercase;">${params.testName ? params.testName.toUpperCase() : params.testType ? params.testType.toUpperCase() : "ASSESSMENT"}</h3>
    <p style="margin: 5px 0;"><b>SUBJECT:</b> ${params.subject} &nbsp;&nbsp;&nbsp;&nbsp; <b>GRADE:</b> ${params.grade} &nbsp;&nbsp;&nbsp;&nbsp; <b>TERM:</b> ${params.term || "____"} &nbsp;&nbsp;&nbsp;&nbsp; <b>YEAR:</b> ${params.year || "____"}</p>
    <p style="margin: 5px 0;"><b>DATE:</b> ${params.testDate || "_________________"} &nbsp;&nbsp;&nbsp;&nbsp; <b>TIME DURATION:</b> ${params.testDuration ? `${params.testDuration} minutes` : "____ minutes"}</p>
    <p style="margin: 10px 0 5px 0;"><b>LEARNER'S NAME:</b> _______________________________________________________________</p>
    </div>
    
    3. SECTIONS: Section headers MUST be bold. Example: **SECTION A: MULTIPLE CHOICE**. Ensure wide separation between sections by leaving empty lines before and after.
    4. NUMBERING: Ensure every question is numbered clearly (1., 2., 3., etc.). The numbering should restart at 1 for each new section (Section A 1, 2... Section B 1, 2...). Do NOT use bullet points for the questions themselves.
    5. OPTIONS: For multiple choice, format the options horizontally on the same line if possible, or closely together. Example: A. Option1 &nbsp;&nbsp;&nbsp; B. Option2 &nbsp;&nbsp;&nbsp; C. Option3 &nbsp;&nbsp;&nbsp; D. Option4
    6. IMAGES & ILLUSTRATIONS: ${params.includeVisuals !== false ? `For questions that need pictures (especially for young learners in Grade 1-4), you MUST use appropriate and high-quality Emojis (e.g., 🍎, 🧹, 🚲, 🫙, 🫗, 📱, 🐕, 🏠, 🚗, 🌳) to represent the objects. Place the emoji prominently near the question text. The user specifically wants to see these emojis clearly to help learners understand. DO NOT use empty placeholder boxes or text-only descriptions like "[IMAGE: broom]". Use the actual emoji character. If a question asks to "Identify the object below", make sure the emoji is large and clear.` : `STRICT RULE: DO NOT include any visual emojis, illustrations, or pictures for any questions. All questions must be entirely text-based. Do not include icons, emojis, or image placeholders.`}
    7. MARKING KEY: You MUST ALWAYS include an answer key at the very end of the document. You MUST prepend it with <div class="page-break"></div> so that it starts on a new page immediately following the questions.
    8. TOPIC COVERAGE: If specific topics are provided in the 'Topics to Include' section below, you MUST strictly use ONLY those topics to generate the questions. Do NOT invent or add questions from other topics outside what the user selected. If no specific topics are provided, you MUST generate questions that span a wide variety of topics from the standard ${params.subject} curriculum for ${params.grade}. Ensure broad syllabus coverage.
    9. LOWER PRIMARY LITERACY & ENGLISH ASSESSMENT ALIGNMENT (GRADE 1 & GRADE 2):
       ${(params.grade?.includes('1') || params.grade?.includes('2')) && (params.subject?.toLowerCase().includes('english') || params.subject?.toLowerCase().includes('literacy')) ? `
       CRITICAL MANDATE: You MUST align the assessment questions to what Grade 1 and Grade 2 learners learn according to the CDC Zambian syllabus and Literacy / Oral English modules.
       
       Learners MUST be assessed across these exact competence areas:
       (a) Phonemic awareness & Phonics
       (b) Fluency
       (c) Vocabulary
       (d) Comprehension
       (e) Writing practice
       
       EXACT QUESTION TYPES & SKILLS TO INCLUDE IN THE ASSESSMENT:
       - BLENDING SKILLS: Questions asking learners to blend given sounds or syllables to form and write words.
         Examples: "Blend chi + sa + la = _________", "Blend b + e + d = _________", "Blend s + u + n = _________".
       - SEGMENTING SKILLS: Questions asking learners to segment words into individual sounds or syllables using slashes / /.
         Examples: "Segment chisala = /chi/sa/la/", "Segment cat = /c/a/t/", "Segment house = /h/ou/se/".
       - SUBSTITUTING SKILLS: Questions asking learners to substitute a sound in a word to form a new word.
         Example: "Change the sound /s/ in set to /p/. What new word do you get? (pet)".
       - DELETING SKILLS: Questions asking learners to remove/delete a sound from a word.
         Example: "Delete the sound /s/ from stop. What word is left? (top)".
       - ADDING SKILLS: Questions asking learners to add a sound to a word.
         Example: "Add the sound /s/ to lip. What is the new word? (slip)".
       - WRITING PRACTICE & HANDWRITING:
         * Letter shaping in both lowercase and uppercase (e.g. Matching uppercase A, B, D to lowercase a, b, d).
         * Letter formation, sizing, and line placement (ascending letters e.g. b, d, h vs descending letters e.g. g, j, p, q, y).
         * Copying simple decodable words or sentences cleanly on lines.
       - VOCABULARY & CONTEXT: Grade 1 & 2 contextual words (e.g. family members, animals, home items, school routines, seasons).
       - COMPREHENSION: Provide a short, simple 3-4 sentence decodable story (e.g., "Chisala has a red ball. The ball bounced in the garden. His dog ran to pick the ball.") followed by 3-4 direct comprehension questions.
       - ORAL ENGLISH / LISTENING & SPEAKING: Questions testing etiquette phrases ("Thank you", "Please", "Excuse me"), greetings, short dialogues, and identifying familiar roles/objects.
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
              // Verify if the topic in this week belongs to the sliced/effective syllabus
              const topicMatches = !effectiveSyllabus || !Array.isArray(effectiveSyllabus) || effectiveSyllabus.length === 0 || 
                [w.topic, w.topic2, w.topic3].filter(Boolean).some(top => effectiveSyllabus.some(t => matchTopicInSyllabus(t, top)));
              
              const safeTopic = topicMatches ? [w.topic, w.topic2, w.topic3].filter(Boolean).join(", ") : "";
              const safeSubtopics = topicMatches ? w.subtopics.filter(Boolean).join(", ") : "";
              const safeComps = topicMatches ? w.competencies.filter(Boolean).join(", ") : "";

              return `Week ${w.week}: 
      Topics: ${safeTopic || "Follow sequential progression of allowed syllabus topics"}, Sub-Topic: ${safeSubtopics || "Aligned subtopic"}, Competencies: ${safeComps || "Aligned competency"}${topicMatches && w.expectedStandards?.length ? `, Expected Standards: ${w.expectedStandards.join("; ")}` : ""}${topicMatches && w.activities?.length ? `, Activities: ${w.activities.join("; ")}` : ""}`;
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
    ${params.duration ? `- Duration: ${params.duration}` : ""}
    ${params.objectives ? `- Specific Objectives: ${params.objectives}` : ""}
    ${params.studentLevel ? `- Student Capability Level: ${params.studentLevel}` : ""}
    ${params.additionalContext ? `- Extra Context: ${params.additionalContext}` : ""}

    ${
      params.referenceModuleContent
        ? `
    SOURCE OF TRUTH (Syllabus/Reference Module):
    The following is a teaching module or syllabus document provided by the teacher. 
    You MUST use this document primarily to extract the correct official Zambian sequencing, topic and subtopic numbering (e.g., 1.1, 1.2.3), and syllabus progression.
    Use the module to accurately cite References (e.g., "Teaching module grade 1 term 1, page X").
    
    REFERENCE CONTENT:
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
       <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 15pt; text-align: left; width: 100%; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6pt 0;">
        <div style="display: flex; justify-content: space-between; gap: 15pt; margin-bottom: 5pt;">
          <div style="flex: 1; white-space: nowrap;"><b>TEACHER'S NAME:</b> ${params.teacherName || "................"}</div>
          <div style="flex: 1; text-align: center; white-space: nowrap;"><b>TS NO:</b> ${params.tsNumber || "................"}</div>
          <div style="flex: 1; text-align: right; white-space: nowrap;"><b>DATE:</b> ${params.date || "................"}</div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 15pt; margin-bottom: 5pt;">
          <div style="flex: 1; white-space: nowrap;"><b>GRADE:</b> ${params.grade || "................"}</div>
          <div style="flex: 1; text-align: center; white-space: nowrap;"><b>YEAR/TERM:</b> ${params.year || new Date().getFullYear()} / TERM ${params.term || "1"}</div>
          <div style="flex: 1; text-align: right; white-space: nowrap;"><b>TIME:</b> ................</div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 15pt;">
          <div style="flex: 1; white-space: nowrap;"><b>SUBJECT:</b> ${params.subject || "................"}</div>
          <div style="flex: 1; text-align: center; white-space: nowrap;"><b>ATTENDANCE:</b> (B: ....... / G: .......)</div>
          <div style="flex: 1; text-align: right; white-space: nowrap;"><b>DURATION:</b> ${params.duration || "................"}</div>
        </div>
       </div>`
           : params.type === "weekly_forecast"
           ? `
       <div style="font-size: 9pt; line-height: 1.1; margin-bottom: 4pt; text-align: left; width: 100%;">
        <div style="display: flex; justify-content: space-between; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 4px;">
          <div style="flex: 1; text-align: left;"><b>NAME OF TEACHER:</b> ${params.teacherName || "................"}</div>
          <div style="flex: 1; text-align: center;"><b>GRADE:</b> ${params.grade || "................"}</div>
          <div style="flex: 1; text-align: right;"><b>ZONE:</b> ${params.zone || "................"}</div>
        </div>
        <div style="display: flex; justify-content: space-between; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 4px;">
          <div style="flex: 1; text-align: left;"><b>TS NO:</b> ${params.tsNumber || "................"}</div>
          <div style="flex: 1; text-align: center;"><b>SUBJECT:</b> ${params.subject || "................"}</div>
          <div style="flex: 1; text-align: right;"><b>TERM:</b> ${params.term || "1"} &nbsp;&nbsp; <b>WEEK:</b> ${params.forecastWeek || "..."} &nbsp;&nbsp; <b>YEAR:</b> ${params.year || new Date().getFullYear()}</div>
        </div>
       </div>`
           : `
       <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 15pt; text-align: left; width: 100%; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6pt 0;">
        <div style="display: flex; justify-content: space-between; gap: 10pt; margin-bottom: 5pt;">
          <div style="flex: 1.6; white-space: nowrap;"><b>NAME OF TEACHER:</b> ${params.teacherName || "................"}</div>
          <div style="flex: 1; text-align: center;"><b>TS NO:</b> ${params.tsNumber || "................"}</div>
          <div style="flex: 1.4; text-align: right;"><b>${params.type === "individual_work_plan" ? "PERIOD" : "SUBJECT"}:</b> ${params.type === "individual_work_plan" ? `${params.workPlanPeriodStart || "JANUARY"} TO ${params.workPlanPeriodEnd || "DECEMBER"}` : params.subject}</div>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 10pt; margin-bottom: 5pt;">
          <div style="flex: 1.6;">${((params.jobTitle || "").toLowerCase().includes("head teacher") || (params.jobTitle || "").toLowerCase().includes("deputy head")) ? "" : `<b>GRADE:</b> ${params.grade || "................"}`}</div>
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
    5. OBC TABLE STRUCTURE: 
       - For Schemes of Work: Use 10 columns: | WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE |
       - For Weekly Forecast: Use 11 columns: | DAY | TOPIC | SUBTOPICS | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | TEACHING METHODS | T/L AIDS | REFERENCE | WEEKLY RECORD |
       - CRITICAL MANDATE: The 'REFERENCE' column MUST ALWAYS be filled with a specific citation. If selected/uploaded teaching modules (reference modules) are provided in SOURCE OF TRUTH below, the 'REFERENCE' column MUST explicitly cite BOTH the Syllabus and the Teaching Module by name (e.g., "Syllabus PG:.....; Module: [Module Name] PG:....."). If no teaching modules are provided, use "Syllabus PG:....." (or exact page numbers if precisely known from reference content). NEVER leave references blank or use virtual page numbers.`
        : `4. Align all content strictly with the Zambian Competency-Based Curriculum (CBC) standards.
    5. CBC TABLE STRUCTURE: 
       - For Schemes of Work: Use 9 columns: | WEEK | TOPIC | SUBTOPIC | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |
       - For Weekly Forecast: Use 10 columns: | DAY | TOPIC | SUBTOPICS | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | WEEKLY RECORD |
       - IMPORTANT: You MUST strictly use ALL 10 columns for Weekly Forecast. Do NOT combine "TEACHING AND LEARNING AIDS" with other columns.
       - CRITICAL MANDATE: The 'REFERENCE' column MUST ALWAYS be filled with a specific citation. If selected/uploaded teaching modules (reference modules) are provided in SOURCE OF TRUTH below, the 'REFERENCE' column MUST explicitly cite BOTH the Syllabus and the Teaching Module by name (e.g., "Syllabus PG:.....; Module: [Module Name] PG:....."). If no teaching modules are provided, use "Syllabus PG:....." (or exact page numbers if precisely known from reference content). NEVER leave references blank or use virtual page numbers.
    6. RATIONALE REQUIREMENT: For Lesson Plans, the <b>RATIONALE:</b> section MUST briefly explain the core importance of this lesson, what learners will gain or benefit at the end of the lesson (in brief sentences), and explicitly include the specific teaching methods (e.g., "This lesson will be taught using teacher exposition, group work, demonstration, gradual release, etc.") used to deliver it, based strictly on the content shown in the lesson plan. Keep it highly concise, under 60 words maximum.`
    }
    3. ${getZambianLanguageInstructions(params).strictRule}
    4. Use professional, educational terminology.
    5. Ensure the content is age-appropriate for the specified grade.
    5b. STRICT SUBTOPIC-TO-COMPETENCY MATCHING: Specific competencies/outcomes MUST strictly match the selected subtopic when scheming, preparing weekly forecast, and preparing lesson plans. NEVER mix or include competencies for other subtopics under the same main topic (e.g. if subtopic 1.1.9 Things found at home is selected, generate/use ONLY specific competencies belonging to 1.1.9 such as 1.1.9.1, and NEVER include competencies from 1.1.1, 1.1.2, 1.1.3, etc.).
    6. SYLLABUS ALIGNMENT: 
       - If SOURCE MATERIAL or REFERENCE CONTENT is provided, you MUST use it as the definitive source for topics, subtopics, official numerical sequences (e.g. 1.1, 1.2.3), and syllabus content. 
       - Do NOT invent topics if they are provided in the source material.
    6. For Schemes of Work: 
       - Non-ECE GRADES: Ensure Week 4 includes Monthly Assessment, Week 8 includes Monthly Assessment, Week 12 is for Revisions ONLY, and Week 13 is for End of Term Test.
       - ECE GRADES (Early Childhood Education): The term runs from Week 1 to 13. Week 7 is the Mid-Term Break (Learners resting at home). Week 12 is for Revisions. Week 13 is for Consolidation of Assessments. There is NO summative assessment in ECE; emphasize Formative Assessment through observation throughout the term.
       - IMPORTANT: For assessments, revisions, and the end of term test, DO NOT leave the columns blank or simply write the word "Assessment". You MUST provide detailed explanations of what will happen: expectations, types of activities, areas of focus, what the learners are expected to do or demonstrate, and specific materials.
    6. EXACT CONTENT MATCHING: When a Topic, Sub-topic, or ${params.curriculumType === "OBC" ? "Specific Outcome" : "Specific Competence"} code (e.g., 1.2.1.1 vs 1.2.3.1) is provided, you MUST construct the lesson or forecast using ONLY that exact ${params.curriculumType === "OBC" ? "outcome" : "competency"}. Pay close attention to numbering prefixes.
    7. NUMERICAL SEQUENCE PREFIXES: You MUST extract and include the official numerical sequence prefixes (e.g., "1.1", "1.1.2") from the Syllabus for ALL Topics, Subtopics, and Competencies you generate. DO NOT leave out the numbers. They must be present so the teacher sees the official syllabus mapping.
    8. EXHAUSTIVE SUBTOPIC COVERAGE: For Schemes of Work and Weekly Forecasts, you MUST exhaustively cover EVERY SINGLE subtopic within a main topic before moving to the next topic. DO NOT skip any subtopics. For example, if a topic has subtopics 2.1.1 to 2.1.10, you MUST explicitly sequence all of them (2.1.1, 2.1.2, 2.1.3, 2.1.4, ..., 2.1.10) within the timeframe before ever introducing topic 2.2. Skipping subtopics (e.g., jumping from 2.1.6 to a new topic) is strictly prohibited.
    10. SEQUENCE PACING: For Weekly Forecasts and Schemes of Work, you MUST follow the logical numerical sequence of competencies from the official syllabus for that grade (e.g., 1.2.1 before 1.2.2 before 1.2.3).
    11. SYLLABUS REFERENCE & AUTHENTICITY (CDC, CBC & OBC STANDARDS): 
        - VERBATIM SYLLABUS ADHERENCE: You are strictly forbidden from summarizing, paraphrasing, or manipulating official Zambian Syllabus text. You MUST copy Topic names, Sub-Topic names, Competencies/Outcomes, and Expected Standards EXACTLY as they appear in the official CDC / CBC / OBC syllabus documents, character for character.
        - MANDATORY SYLLABUS CITATION FORMATS (APPLIES TO ALL 3 DOCUMENT TYPES: SCHEMES OF WORK, WEEKLY FORECAST, AND LESSON PLANS):
          * CRITICAL RULE: DO NOT include '>' (angle brackets/chevrons) anywhere in syllabus references! Let everything flow directly. Always include 'CDC' immediately after the subject name, followed by the curriculum year.
          * ORAL ENGLISH & LITERACY IN ENGLISH RULE: Oral English and Literacy in English fall under "English Language" as their main subject in the official CDC syllabus. Therefore, for Oral English or Literacy in English, the primary citation MUST use "English Language" as the subject name in the syllabus citation (e.g., "Grade 1-3 lower primary English Language CDC 2024-2025 CBC syllabus page ....."), followed by the secondary citation (e.g. "; PLP Oral English Teaching Module" or "; PLP National Literacy Teaching Module").
          * UNDER CBC CURRICULUM (2024-2025 CBC):
            - ECE levels (3-5 Years / Early Childhood): "Early childhood education syllabi 3-5-Year [Subject] CDC 2024-2025 CBC syllabus page [Number/.....]"
            - Lower primary (Grades 1-3): "Grade 1-3 lower primary [Subject] CDC 2024-2025 CBC syllabus page [Number/.....]"
            - Upper primary (Grades 4-6): "Grade 4-6 upper primary [Subject] CDC 2024-2025 CBC syllabus page [Number/.....]"
            - Form 1 - 4 (Secondary Junior): "Form 1 - 4 [Subject] CDC 2024-2025 CBC syllabus page [Number/.....]"
            - Form 5 - 6 (Secondary Senior Advanced): "Form 5-6 Advanced [Subject] CDC 2024-2025 CBC syllabus page [Number/.....]"
          * UNDER OUTCOME BASED CURRICULUM (OBC - 2013 Syllabus):
            - ECE levels (3-5 Years): "ECE 3-5 Year [Subject] CDC 2013 syllabus page [Number/.....]"
            - Lower primary (Grades 1-4): "Grade 1-4 lower primary [Subject] CDC 2013 syllabus page [Number/.....]"
            - Upper primary (Grades 5-7): "Grade 5-7 upper primary [Subject] CDC 2013 syllabus page [Number/.....]"
            - Secondary (Grades 8-9 & 10-12): "Grade 10-12 [Subject] CDC 2013 syllabus page [Number/.....]" (or "Grade 8-9 [Subject] CDC 2013 syllabus page [Number/.....]")
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
        - TABLE STRUCTURE (4 COLUMNS): | STAGES | TEACHER'S ROLE | LEARNERS' ROLE | PERFORMANCE INDICATOR |
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
       - <b>LEARNING ACTIVITIES:</b> You MUST include the Learning Activities section after the Learning Environment section and before the Lesson Development table heading. Format it exactly as <b>LEARNING ACTIVITIES:</b> followed by the exact list of learning activities that the teacher has selected or entered. Format them as a simple bullet list. Your job is to expand the lesson development table according to the subject's required stage structure (for general subjects use INTRODUCTION, LESSON DEVELOPMENT, PRACTICE/APPLICATION, EXERCISE, CONCLUSION; for Grade 1 & 2 Oral English strictly use 'Introduction', 'Step 1: Present', 'Step 2: Practice', 'Step 3: Produce', 'Step 4: Closure'; for Literacy in English strictly place <b>INTRODUCTION (5 minutes):</b> outside before the table situated strictly between <b>EXPECTED STANDARD:</b> and the <b>LESSON DEVELOPMENT</b> heading, and use table stages 'Step 1: Phonemic awareness (5 minutes)', 'Step 2: Phonics (10 minutes)', 'Step 3: Fluency (20 minutes)', 'Step 4: Vocabulary (7 minutes)', 'Step 5: Writing (20 minutes)', 'Comprehension (5 minutes)', 'Conclusion (3 minutes)'), followed by Homework.
       - Use the teacher's exact selected learning activities as the primary driver for the "LESSON DEVELOPMENT" section. 
       - <b>TABLE CONTENT REQUIREMENTS:</b> For each of the 4 columns in the "LESSON DEVELOPMENT" / "LESSON PROGRESSION" table:
         1. <b>TEACHER'S ROLE / ACTIVITIES:</b> Provide 3-4 specific, detailed bullet points using the '*' symbol (e.g., * Lead learners to count 5 stones on the floor..., * Demonstrate how to write the number 5 on the chalkboard...). Use explicit examples.
         2. <b>LEARNERS' ROLE / ACTIVITIES:</b> Provide 3-4 detailed bullet points using the '*' symbol describing actions learners take (e.g., * Observe teacher counting..., * Point to 5 pencils in their bags...). Ensure they correspond to teacher actions.
         3. <b>PERFORMANCE INDICATOR:</b> State exactly what constitutes evidence/success of performance in this stage (e.g., * Learners count 5 objects correctly with one-to-one correspondence / Learners perform morning greeting dialogue accurately).
       - Ensure the content is thorough, highly detailed, and complete for immediate classroom use, fitting comfortably within THREE (3) pages or less. Use clear bullet points and keep the actions clear.
       - Use '*' as the bullet symbol for all items inside the table cells. Do NOT use markdown list symbols.
       - Format the "Learning Environment" section strictly in this vertical order using bold labels:
         <b>Natural:</b> [Description]
         <b>Artificial:</b> [Description] 
         <b>Technological:</b> [Description]
       - Ensure all table row labels (for general subjects: INTRODUCTION, LESSON DEVELOPMENT, PRACTICE/APPLICATION, EXERCISE, CONCLUSION; for Oral English: Introduction, Step 1: Present, Step 2: Practice, Step 3: Produce, Step 4: Closure; for Literacy in English: Step 1: Phonemic awareness, Step 2: Phonics, Step 3: Fluency, Step 4: Vocabulary, Step 5: Writing, Comprehension, Conclusion) and footer labels (HOMEWORK, LEARNER'S EVALUATION, TEACHER'S EVALUATION) are formatted with <b> tags and appear in black. Column header for assessment/indicator MUST be PERFORMANCE INDICATOR.
       - STRICT ALIGNMENT, VERTICAL ORDER, & NEW LINES (BOTH CBC AND OBC): For ALL Lesson Plans (including Primary and Secondary/Form 1-4), all pre-lesson information headers MUST be left-aligned and each header and its associated content MUST start on its own new line using HTML '<br/>'. They MUST NOT be joined or concatenated on the same line.
        - Use EXACTLY this vertical order and format for the pre-lesson information:
          <b>TOPIC:</b> ${params.topic || "................"}<br/>
          <b>SUB-TOPIC:</b> ${params.subtopic || "................"}<br/>
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
        - STRUCTURED DETAIL & STRICT 3-PAGE MAXIMUM MANDATE: The primary lesson plan from the Republic/Ministry Header down to the Evaluations (LEARNER'S EVALUATION and TEACHER'S EVALUATION) MUST FIT WITHIN A MAXIMUM OF THREE (3) PAGES. Keep teacher roles, learner roles, and performance indicators concise, bulleted, and direct (max 2-3 concise bullet points per stage) so that the entire document never exceeds 3 pages when exported or printed. 
          - For every stage in the Lesson Development table, provide clear, step-by-step instructions. All instructions must start with "Teacher to ..." under teacher's activities and "Learners will ..." under learners' activities. Every instruction point MUST carry an example where possible to provide concrete context and eliminate guesswork.
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
       - CRITICAL TABLE RULES: In the Lesson Development table, you MUST NOT generate a separate "TIME" column or include time values within the "STAGE" column. In the "STAGE" column, use ONLY the exact required stage name (e.g., "INTRODUCTION", "DEVELOPMENT" for general subjects, "Step 1: Present", "Step 2: Practice", "Step 3: Produce", "Step 4: Closure" for Oral English, or "Step 1: Phonemic awareness", "Step 2: Phonics", "Step 3: Fluency", "Step 4: Vocabulary", "Step 5: Writing", "Comprehension", "Conclusion" for Literacy in English) without any dotted space or time placeholders.
       ${params.type === "lesson_notes" ? `
       - STRICT LESSON NOTES INSTRUCTIONS: Since the selected document type is LESSON NOTES (which are purely Teaching Notes), you MUST NOT output any Lesson Plan Table (stages/columns like introduction, development, practice, learner evaluation, etc.).
       - You MUST NOT output any general information arrangement table or grid (the table fields for Teacher Name, TS Number, Zone, Date, Time, Duration, Enrolment, Attendance). 
       - The output MUST consist ONLY of the Ministry of Education header at the top and the single, beautiful double-bordered block containing SUBJECT, GRADE, TOPIC, and SUB-TOPIC.
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
      text.includes("RESOURCE_EXHAUSTED") ||
      text.includes("quota") ||
      text.includes("Internal server error")
    ) {
      throw new Error("Quota exceeded or Server error.");
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
    
    // Ensure learner's and teacher's evaluations in lesson plans have exactly two beautiful full-width dotted handwriting lines each
    if (params.type === "lesson_plan" && text) {
      const regexFooter = /<div class="lesson-plan-footer"[\s\S]*?<\/div>/gi;
      if (text.match(regexFooter)) {
        text = text.replace(regexFooter, `<div class="lesson-plan-footer" style="width: 100%; margin-top: 15px; page-break-inside: avoid; break-inside: avoid;">
  <p style="margin-bottom: 2px;"><b>LEARNER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  
  <p style="margin-top: 10px; margin-bottom: 2px;"><b>TEACHER'S EVALUATION:</b></p>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
  <div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>
</div>`);
      } else {
        if (text.match(/LEARNER'S EVALUATION/i) || text.match(/TEACHER'S EVALUATION/i)) {
          text = text.replace(/<b>LEARNER'S EVALUATION:<\/b>[\s\S]*?(?=<b>TEACHER'S EVALUATION:|$)/gi, 
            `<b>LEARNER'S EVALUATION:</b><br/>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 8px;"></div>\n`);
          text = text.replace(/<b>TEACHER'S EVALUATION:<\/b>[\s\S]*?(?=<\/div>|$)/gi, 
            `<b>TEACHER'S EVALUATION:</b><br/>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 4px;"></div>\n<div style="border-bottom: 1.5px dotted #000000; height: 1.6em; width: 100%; margin-bottom: 8px;"></div>\n`);
        }
      }
    }

    // Ensure "Step 1: .... Step 2: ...." in the teaching steps segment are formatted on clean individual lines from the left, rather than inline.
    // 1. Prepend <br/> to inline steps (e.g. "interest. Step 2:") so they split into new lines.
    text = text.replace(/([^\n><\s])\s*(?:Step|Sep|Step\s+)\s*(\d+)\s*[:.-]+/gi, "$1<br/>Step $2: ");
    
    // 2. Remove any leading whitespace, bullet points, asterisks, or tab indents before "Step X:" to pull it strictly left-aligned at column 1.
    text = text.replace(/^[ \t>*-•\s]*(?:Step|Sep|Step\s+)\s*(\d+)\s*[:.-]+/gim, "Step $1: ");

    const result = text.trim();
    
    // Only cache if the result looks like genuine content, not a fallback warning
    if (!result.includes("AI GENERATION UNAVAILABLE")) {
       setCachedResult(cacheKey, result);
    }
    
    return result;
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const msg = error?.message || String(error);

    if (
      msg.toLowerCase().includes("429") ||
      msg.toLowerCase().includes("resource_exhausted") ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("server error") ||
      msg.toLowerCase().includes("internal server error")
    ) {
      const isDaily = msg.toLowerCase().includes("daily") || 
                     msg.toLowerCase().includes("per day") || 
                     msg.toLowerCase().includes("quotaid: generaterequestsperday") ||
                     msg.toLowerCase().includes("limit: 20") ||
                     msg.toLowerCase().includes("limit: 0");
                     
      const userFriendlyError = isDaily 
        ? "Daily AI usage limit reached (Free tier: 20 requests/day). All fallback models are also exhausted. You can still manually fill the document below." 
        : "The AI service is currently busy (Rate Limit). Retrying might help or try again in a few minutes.";
        
      console.warn(
        `AI Quota exhausted: ${userFriendlyError}. Returning blank structure.`,
      );
      // Return a blank structure so the app doesn't crash and the user can manually enter things
      return generateFallbackTable(params, userFriendlyError);
    }

    // As a fallback to prevent the whole app from crashing
    console.warn("AI failed with error. Returning blank structure.");
    return generateFallbackTable(params, "An error occurred while generating content.");
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

  // Match topic numbers if available (e.g. 1.1, 1.2, 2.3)
  const titleNumMatch = title.match(/(?:topic\s*)?(\d+(?:\.\d+)*)/i);
  const targetNumMatch = target.match(/(?:topic\s*)?(\d+(?:\.\d+)*)/i);

  if (titleNumMatch && targetNumMatch && titleNumMatch[1] === targetNumMatch[1]) {
    return true;
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

export function sliceSyllabusByTopicRange(
  syllabus: any[],
  initialTopic?: string,
  stoppingTopic?: string
): any[] {
  if (!Array.isArray(syllabus) || syllabus.length === 0) return syllabus;

  let startIdx = 0;
  let stopIdx = syllabus.length - 1;

  if (initialTopic && initialTopic.trim()) {
    const foundStart = syllabus.findIndex((t: any) => matchTopicInSyllabus(t, initialTopic));
    if (foundStart !== -1) {
      startIdx = foundStart;
    }
  }

  if (stoppingTopic && stoppingTopic.trim()) {
    const foundStop = syllabus.findIndex((t: any) => matchTopicInSyllabus(t, stoppingTopic));
    if (foundStop !== -1 && foundStop >= startIdx) {
      stopIdx = foundStop;
    }
  }

  return syllabus.slice(startIdx, stopIdx + 1);
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
): Promise<{ topic: string; subtopics: string[] }[]> {
  let filteredSyllabus = officialSyllabusData;
  if (Array.isArray(officialSyllabusData)) {
    filteredSyllabus = sliceSyllabusByTopicRange(officialSyllabusData, initialTopic, stoppingTopic);
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

  CRITICAL MANDATORY RULES (ZERO DEVIATION - PROPORTIONAL & EXHAUSTIVE TOPIC COVERAGE):
  1. EXCLUSIVE TOPIC BOUNDARY: You MUST STRICTLY AND ONLY use the topics provided in the OFFICIAL SYLLABUS REFERENCE below (strictly between initial starting topic "${initialTopic || 'start'}" and stopping topic "${stoppingTopic || 'end'}"). Absolutely no earlier or foreign topics!
  2. PROPORTIONAL DISTRIBUTION ACROSS TEACHING WEEKS (CRITICAL MANDATE FOR ENDING TOPIC):
     - The available ${numWeeks} teaching weeks MUST be proportionately shared among all topics in the reference list.
     - THE STOPPING/ENDING TOPIC ("${stoppingTopic || 'Ending Topic'}") IS A FULL INSTRUCTIONAL UNIT AND MUST NOT BE SQUEEZED INTO ONLY THE LAST WEEK!
     - If there are 2 topics in the list across ${numWeeks} teaching weeks, dedicate approximately ${Math.floor(numWeeks / 2)} weeks to Topic 1, and the remaining ${numWeeks - Math.floor(numWeeks / 2)} weeks to the Stopping Topic.
     - BOTH the starting topic AND the ending topic must have ALL of their subtopics exhaustively distributed across multiple full teaching weeks until every subtopic is completely covered.
  3. STRICT SEQUENTIAL PROGRESSION & VERBATIM SUBTOPICS (EXHAUST ALL SUBTOPICS IN ORDER):
     - Complete ALL subtopics of each topic in exact step-by-step numerical sequence (e.g. 1.1.1, 1.1.2, 1.1.3...).
     - Do NOT skip, consolidate, omit, or leave behind ANY subtopic listed under a topic in the official syllabus!
     - You MUST copy subtopics VERBATIM from the provided syllabus data. You are STRICTLY FORBIDDEN from creating, paraphrasing, rewording, or substituting subtopic titles!
     - Never mix subtopics of different topics in the same week.
  4. SPREAD & COVERAGE: Return exactly ${numWeeks} sets of { "topic": "...", "subtopics": ["...", "..."] }.
  5. Official numerical prefixes (e.g. 1.1, 1.1.1) must be preserved.
  6. DO NOT include "Assessment", "Mid Term Break", or "Revision" in this teaching sequence; provide only the sequential teaching topics and subtopics.
  7. ${getLowerPrimaryEnglishInstructions({ grade, subject, term })}

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
      return data;
    }
    throw new Error("Invalid array returned");
  } catch (error) {
    console.warn("Generating deterministic scheme sequence fallback:", error);
    
    // Deterministic fallback: allocate weeks proportionately across all topics in filteredSyllabus
    if (Array.isArray(filteredSyllabus) && filteredSyllabus.length > 0) {
      const numTopics = filteredSyllabus.length;
      const result: { topic: string; subtopics: string[] }[] = [];
      
      // Calculate how many weeks each topic gets
      const weeksPerTopic = Math.floor(numWeeks / numTopics);
      const extraWeeks = numWeeks % numTopics;

      filteredSyllabus.forEach((t: any, topicIdx: number) => {
        const tTitle = t.title || t.topic || `Topic ${topicIdx + 1}`;
        const rawSubs: any[] = Array.isArray(t.subtopics) ? t.subtopics : [];
        const subList: string[] = rawSubs.map((st: any) => typeof st === 'string' ? st : (st.title || st.name || 'Subtopic'));
        
        const allocatedWeeks = weeksPerTopic + (topicIdx < extraWeeks ? 1 : 0);
        
        if (allocatedWeeks > 0) {
          if (subList.length === 0) {
            for (let w = 0; w < allocatedWeeks; w++) {
              result.push({ topic: tTitle, subtopics: [`Core competencies part ${w + 1}`] });
            }
          } else {
            // Distribute subtopics across allocatedWeeks
            const itemsPerWeek = Math.max(1, Math.ceil(subList.length / allocatedWeeks));
            for (let w = 0; w < allocatedWeeks; w++) {
              const startSub = w * itemsPerWeek;
              const currentSubs = subList.slice(startSub, startSub + itemsPerWeek);
              result.push({
                topic: tTitle,
                subtopics: currentSubs.length > 0 ? currentSubs : [subList[subList.length - 1] || 'Review & practice']
              });
            }
          }
        }
      });

      if (result.length > 0) {
        return result.slice(0, numWeeks);
      }
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

  const result = await callGemini("DEFAULT", contents);
  const text = result.text || "";
  
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.generalCompetences) {
      parsed.generalCompetences = formatGeneralCompetenciesShortForm(parsed.generalCompetences);
    }
    return parsed;
  } catch (e) {
    console.error("Draft parsing failed:", e);
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

  const result = await callGemini("DEFAULT", contents);
  return result.text || "Failed to generate report. Please try again.";
}

