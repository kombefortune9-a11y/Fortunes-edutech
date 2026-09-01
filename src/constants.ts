export const ADMIN_EMAIL = 'kombefortune9@gmail.com';
export const DEVELOPER_EMAILS = [
  'kombefortune9@gmail.com',
  'admin@fortunesedutech.com'
];

export const isDeveloperEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim().replace(/\s+/g, '');
  return DEVELOPER_EMAILS.some(dev => dev.toLowerCase().trim().replace(/\s+/g, '') === clean);
};

export type DocType =
  | "lesson_plan"
  | "assessments"
  | "syllabi"
  | "schemes_of_work"
  | "weekly_forecast"
  | "records_of_work"
  | "individual_work_plan"
  | "lesson_notes"
  | "video_script";

export interface DocTemplate {
  id: DocType;
  title: string;
  description: string;
  prompt: string;
  color: string;
  icon?: string;
}

export const TEACHER_ROLES = [
  "Class teacher",
  "Senior teacher",
  "Deputy head teacher",
  "Head Teacher",
  "Section Leader",
  "Department Head",
];

export const JOB_PURPOSE_DEFAULTS: Record<string, string> = {
  'Class teacher': 'To teach effectively in order to impart knowledge and skills.',
  'Senior teacher': 'To teach effectively, supervise classroom activities, monitor the pedagogical performance of junior teachers, and provide middle-management administrative support to the school leadership in line with CBC standards.',
  'Deputy head teacher': 'To assist the Head Teacher in administrative duties and ensure effective teaching and learning in the school.',
  'Head Teacher': 'To manage the administration and academic programmes in the school in order to facilitate delivery of quality education.',
  'Section Leader': 'To coordinate activities and standards within a specific grade section or department.',
  'Department Head': 'To manage and supervise the curriculum and staff within a specific subject or academic department.'
};

export const ROLE_SPECIFIC_KRAS: Record<string, string[]> = {
  'Class teacher': [
    'PLANNING AND PREPARATION',
    'TEACHING AND LEARNING MATERIALS',
    'PERFORMANCE / SERVICE DELIVERY',
    'LEARNER ASSESSMENT & EVALUATION',
    'PROFESSIONAL DEVELOPMENT & CPD'
  ],
  'Senior teacher': [
    'SECTION ACADEMIC STANDARDS',
    'MIDDLE MANAGEMENT & COORDINATION',
    'CLASSROOM PERFORMANCE MONITORING',
    'RESOURCE & INVENTORY MANAGEMENT',
    'POLICY IMPLEMENTATION & WELFARE'
  ],
  'Deputy head teacher': [
    'ACADEMIC COORDINATION',
    'ADMINISTRATIVE SUPPORT',
    'MONITORING AND QUALITY ASSURANCE',
    'STAFF DEVELOPMENT & BRIEFINGS',
    'RECORDS MANAGEMENT & ARCHIVING'
  ],
  'Head Teacher': [
    'ACADEMIC MANAGEMENT & STANDARDS',
    'ADMINISTRATION & SUPERVISION',
    'RESOURCE & FINANCIAL MANAGEMENT',
    'POLICY INTERPRETATION & ADHERENCE',
    'PERFORMANCE MANAGEMENT & APPRAISALS'
  ]
};

export const DEFAULT_AI_INSTRUCTIONS = `Instructions to AI 
(Weekly forecast/ Lesson plan:) let the weekly forecast/ Lesson plan be syllabus based and modules quoted based. All information should nothing but with authenticity, ready to deliver lessons with detailed but easy to follow through class standard.

Modules have been aligned properly in line with the Zambian curriculum framework or CBC curriculum`;

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "lesson_plan",
    title: "Lesson Plans",
    description: "Professional, CBC/OBC-aligned lesson plans.",
    prompt: `Generate a detailed Lesson Plan in the following exact format. Provide all placeholders.

<style>
  .lesson-plan-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 10px; 
    margin-bottom: 25px; 
    table-layout: fixed;
  }
  .lesson-plan-table th, .lesson-plan-table td { 
    border: 1px solid black; 
    padding: 14px 10px; 
    text-align: left; 
    vertical-align: top; 
    font-size: 11pt; 
    line-height: 1.5;
    word-wrap: break-word;
  }
  .lesson-plan-table td {
    height: 115px;
  }
  .lesson-plan-table th { 
    background-color: #f8f9fa; 
    font-weight: bold; 
    text-transform: uppercase;
    font-size: 9pt;
    height: auto;
  }
  .stage-cell {
    min-height: 80px;
  }
</style>

<div class="lesson-plan-content" style="margin-top: 10px;">
  <b>TOPIC:</b> [Topic]<br/>
  <b>SUB-TOPIC:</b> [Sub-Topic]<br/>
  <b>GENERAL {{header_general}}:</b><br/>- [List item]<br/>- [List item]<br/>
  <b>SPECIFIC {{header_specific}}:</b><br/>- [List item]<br/>
  <b>{{header_knowledge_label}}:</b> {knowledge}<br/>
  <b>LESSON GOAL:</b> [Text]<br/>
  <b>RATIONALE:</b> [Rationale Text]. This is lesson {lessonNumber} in week {lessonWeekNumber}<br/>
  <b>PRIOR KNOWLEDGE/SKILLS/VALUES:</b><br/>
  - <b>Knowledge:</b> [Text]<br/>
  - <b>Skills:</b> [Text]<br/>
  - <b>Values:</b> [Text]<br/>
  <b>TEXTBOOK REFERENCES:</b><br/>- [List item]<br/>
  <b>TEACHING AND LEARNING RESOURCES / MATERIALS:</b><br/>- [List item]<br/>
  <b>LEARNING ENVIRONMENT:</b><br/>
  <b>Natural:</b> [Text]<br/>
  <b>Artificial:</b> [Text]<br/>
  <b>Technological:</b> [Text]<br/>
  <b>LEARNING ACTIVITIES:</b><br/>- [Activity 1]<br/>- [Activity 2]<br/>
  <b>EXPECTED STANDARD:</b> [Text]<br/>
</div>

<h3 style="text-align: left; font-size: 12pt; font-weight: bold; margin-bottom: 15px; margin-top: 25px;">LESSON DEVELOPMENT</h3>
<table class="lesson-plan-table">
  <tr>
    <th style="width: 12%;">STAGE</th>
    <th style="width: 36%;">TEACHER'S ACTIVITIES</th>
    <th style="width: 36%;">LEARNERS' ACTIVITIES</th>
    <th style="width: 16%;">PERFORMANCE INDICATOR</th>
  </tr>
  <tr><td class="stage-cell">INTRODUCTION</td><td>[Text]</td><td>[Text]</td><td>[Text]</td></tr>
  <tr><td class="stage-cell">LESSON DEVELOPMENT</td><td>[Text]</td><td>[Text]</td><td>[Text]</td></tr>
  <tr><td class="stage-cell">PRACTICE/APPLICATION</td><td>[Text]</td><td>[Text]</td><td>[Text]</td></tr>
  <tr><td class="stage-cell">EXERCISE</td><td>[Text]</td><td>[Text]</td><td>[Text]</td></tr>
  <tr><td class="stage-cell">CONCLUSION</td><td>[Text]</td><td>[Text]</td><td>[Text]</td></tr>
</table>

<div class="lesson-plan-homework-section" style="margin-top: 20px;">
  <p><strong>Homework:</strong></p>
  <p>1. [Task]</p>
  <p>2. [Task]</p>
  <p><strong>Instructions:</strong> Step-by-step: 1. [Step] 2. [Step] 3. [Step] <strong>Due:</strong> [Text]</p>
</div>

**Requirements:**
- VERBATIM SYLLABUS ADHERENCE: You MUST copy Topic names, Sub-Topic names, Competencies, and Expected Standards EXACTLY as they appear in the official Zambian syllabus. DO NOT paraphrase or change any words.
- OFFICIAL NUMBERING: Include the exact numerical sequence prefixes (e.g., 1.1.2) for all topics and subtopics.
- AUTHENTIC PRINTED PAGE NUMBERS: The "TEXTBOOK REFERENCES" and citation sections MUST use the original printed page numbers from the hard-copy CDC modules provided in the data. Do NOT use soft-copy page numbers.
- NOTE: "Knowledge", "Skills", and "Values" MUST be moved to the "PRIOR KNOWLEDGE/SKILLS/VALUES" section or integrated into Rationale. They should NOT appear as separate sub-sections in the Outcomes or elsewhere.
- CRITICAL: The primary lesson plan from the Republic/Ministry Header down to the Evaluations (LEARNER'S EVALUATION and TEACHER'S EVALUATION) should fit within TWO to THREE PAGES. 
- CRITICAL HOMEWORK RULE: Homework MUST ONLY be included if the lesson date falls on a WEDNESDAY or a FRIDAY. If the lesson date is not a Wednesday or Friday, completely omit the entire "Homework" component from the generated markup (do not output the homework section at all).
- CDC FOUNDATION: Fill all placeholders ([Text]) with meaningful, high-quality content derived EXCLUSIVELY from the Zambian CDC modules and syllabus data. Any content outside this is considered not fit for purpose.
- RATIONALE: The RATIONALE must briefly explain the core importance of this lesson, its benefits, and explicitly name the teaching methods used (e.g. teacher exposition). Keep it under 60 words.
- The "LESSON DEVELOPMENT" table: Under Teacher's Activities, Learners' Activities, and Assessment Criteria columns, provide detailed, step-by-step bullet points using the '*' symbol. 
- DETAILED INSTRUCTIONS: Provide explicit, clear action points with concrete CDC examples (e.g., "identifying 5 stones" if in syllabus).
- STRICT INFORMATION TALLYING: Teacher and learner activities MUST tally perfectly across the row. Every teacher action must have a corresponding learner response.
- Provide all content directly as plain text within the specified HTML structures.

<div class="lesson-plan-footer">
  <p><strong>LEARNER'S EVALUATION:</strong></p>
  <p>............................................................................................................................................................</p>
  <p>............................................................................................................................................................</p>
  
  <p><strong>TEACHER'S EVALUATION:</strong></p>
  <p>............................................................................................................................................................</p>
  <p>............................................................................................................................................................</p>
</div>`,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "Tests, quizzes and evaluation rubrics.",
    prompt:
      "Generate a formal Assessment. Include 5 Multiple Choice, 5 Short Answer, and 2 Essay questions with a marking guide. DO NOT include any district header, ministry of education header, or Republic of Zambia header at the top of the assessment.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "syllabi",
    title: "Syllabus Library",
    description: "Browse full Zambian curriculum content by subject & grade.",
    prompt:
      "Generate a Syllabus/Module guide. Outline the scope, sequence, and key milestones for the subject.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "schemes_of_work",
    title: "Schemes of Work",
    description: "Long-term termly or yearly planning.",
    prompt: `Generate a professional Zambian CBC Schemes of Work document. 

    ### TABLE STRUCTURE:
    Create a standard Markdown table with the required columns. You MUST include both leading and trailing pipes (|) for every row, including the alignment row.
    | WEEK | TOPIC | SUBTOPIC | SPECIFIC COMPETENCIES | EXPECTED STANDARD | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE |
    |:---|:---|:---|:---|:---|:---|:---|:---|:---|

    ### STRICT PAGE LIMIT, ROW BALANCING & VERTICAL FILL MANDATE:
    - The entire Schemes of Work document MUST fit comfortably within FIVE to SIX PAGES (maximum 6 pages for the whole term).
    - CRITICAL ROW DENSITY & FULL-PAGE VERTICAL FILL:
      * Every single week's row MUST have an even, balanced height so that exactly 2 to 3 weeks fit onto each landscape page, filling the page completely from top to bottom without leaving huge empty gaps at the bottom of any page.
      * In LEARNING ACTIVITIES: Provide exactly 3 to 4 concise, high-impact bullet points per week (do NOT write 8-10 verbose paragraphs in one week and 2 in another).
      * In SPECIFIC COMPETENCIES: Provide 1 to 2 clear, numbered syllabus competencies (e.g. 1.4.5.1 Exhibit care for surroundings).
      * In TEACHING METHODS and TEACHING AND LEARNING AIDS: Provide 2 to 4 concise items.
      * This ensures every week row has an even, predictable height (~200px-230px), allowing each printed/exported page to fill vertically with 3 full weeks with zero wasted bottom space.

    ### REQUIREMENTS:
    - ONLY output the table. DO NOT include any "Weekly Forecast", "Weekly Record", or additional tables at the end.
    - Ensure there is a blank line before the table starts.
    - EVERY row must start with a pipe (|) and end with a pipe (|).
    - The alignment row (the second row with dashes) MUST have exactly 9 columns matching the header (or 10 if OBC).
    - REFERENCE COLUMN MANDATE: You MUST ALWAYS fill the "REFERENCE" column with a specific citation from the Zambian Syllabus (e.g., "CDC Grade 8 Social Studies Syllabus pg. 12"). NEVER leave it blank, dots, or placeholder symbols.
    - DO NOT include sections for "Remarks", "Evaluation", "Signatures", or "Success Indicators" at the bottom of the document. Keep them ONLY as columns in the table.
    - WEEKLY RULES:
        * Week 4 and Week 8 MUST include "Monthly Assessment" alongside learning topics.
        * Week 12 MUST be focused on "REVISIONS" only.
        * Week 13 MUST be "END OF TERM TEST" / "EXAMINATIONS".
    - Populate the table based on Zambian CBC 2024/2025 standards.
    - Ensure every row is clear but do not use fancy ASCII borders.`,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    id: "weekly_forecast",
    title: "Weekly Forecast",
    description: "Week-ahead classroom coordination.",
    prompt: `Generate a professional Zambian CBC Weekly Forecast document.

    ### HEADER REQUIREMENT:
    You MUST start the document with this EXACT professional Ministry of Education header using the provided metadata:
    <center>
    <h2 style="margin: 1px 0; padding: 0; font-size: 11pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
    <h2 style="margin: 1px 0; padding: 0; font-size: 11pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
    <h1 style="margin: 0; padding: 0; font-size: 13pt; font-weight: 800; text-align: center; text-transform: uppercase;">WEEKLY FORECAST</h1>
    </center>
    <div style="display: flex; justify-content: space-between; border-top: 1px solid black; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 2px 4px; font-size: 9.5pt; margin-top: 2px;">
    <div style="flex: 1; text-align: left;"><b>NAME OF TEACHER:</b> {teacherName}</div>
    <div style="flex: 1; text-align: center;"><b>GRADE:</b> {grade}</div>
    <div style="flex: 1; text-align: right;"><b>ZONE:</b> {zone}</div>
    </div>
    <div style="display: flex; justify-content: space-between; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; padding: 2px 4px; font-size: 9.5pt; margin-bottom: 2px;">
    <div style="flex: 1; text-align: left;"><b>TS NO:</b> {tsNumber}</div>
    <div style="flex: 1; text-align: center;"><b>SUBJECT:</b> {subject}</div>
    <div style="flex: 1; text-align: right;"><b>TERM:</b> {term} &nbsp;&nbsp; <b>WEEK:</b> {week} &nbsp;&nbsp; <b>YEAR:</b> {year}</div>
    </div>
    <center><b># WEEKLY FORECAST - WEEK {week}</b></center>

    ### TABLE STRUCTURE:
    Create a standard Markdown table with EXACTLY 10 columns. You MUST include leading and trailing pipes.
    | DAY | TOPIC | SUBTOPICS | SPECIFIC COMPETENCIES | EXPECTED STANDARDS | LEARNING ACTIVITIES | TEACHING METHODS | TEACHING AND LEARNING AIDS | REFERENCE | RECORD OF WORK |
    |:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
  
    ### STRICT 1-PAGE MANDATE & ROW DENSITY REQUIREMENTS:
    - ABSOLUTE SINGLE PAGE MANDATE: The ENTIRE Weekly Forecast document (header + all 5 days from Day 1 to Day 5) MUST fit on EXACTLY ONE (1) A4 LANDSCAPE PAGE. It is strictly forbidden to overflow into a 2nd page or create gaps.
    - To guarantee fitting perfectly on 1 page:
      * Keep every row concise and compact so all 5 rows plus header fit completely on one single page.
      * LEARNING ACTIVITIES: Provide exactly 1 to 2 concise action phrases per day (e.g. 'Activity: Exploring materials (wood, stone)'). DO NOT write long paragraphs.
      * SPECIFIC COMPETENCIES: 1 concise competency statement (e.g. '1.4.1.1 Explore different materials').
      * TEACHING METHODS: 2 concise items (e.g. 'Demonstration, Group work').
      * TEACHING AND LEARNING AIDS: 2 concise items (e.g. 'Flashcards, Pictures').
      * REFERENCE: Concise official syllabus citation (e.g. 'Grade 1-3 lower primary Mathematics CDC 2024-2025 CBC syllabus page 12' or 'Grade 1-3 lower primary English Language CDC 2024-2025 CBC syllabus page .....; PLP Oral English Teaching Module').
      * EXPECTED STANDARDS: 1 concise statement (e.g. 'Materials explored accordingly').
      * RECORD OF WORK: Keep empty for handwriting or manual records.
    - Include all 5 days (Day 1, Day 2, Day 3, Day 4, Day 5).
    - All table rows must perfectly align with the 10 columns.`,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    id: "records_of_work",
    title: "Recent documents",
    description: "Review your downloaded documents and track progress.",
    prompt: "View your activity history.",
    color: "bg-slate-50 text-slate-600",
  },
  {
    id: "individual_work_plan",
    title: "Individual Work Plan",
    description:
      "Detailed professional work plan for teachers and administrators.",
    prompt: `Generate a professional Zambian Ministry of General Education Individual Work Plan document. 
    
    ### CORE CONTENT FLOW (Strict Sequence):
    1. PROFESSIONAL PROFILE: REPUBLIC OF ZAMBIA header, teacher details (Name: {teacherName}, TS: {tsNumber}, Grade: {grade}, Period: {workPlanPeriodStart} TO {workPlanPeriodEnd}), and a concise JOB PURPOSE statement.
    2. KEY PERFORMANCE AREAS & STANDARDS: A HIGHLY DETAILED Markdown table with EXACTLY these five columns: | KRA | ACCOUNTABILITIES | PERFORMANCE STANDARDS | TARGETS | RATINGS |. 
       POPULATION MANDATE: You MUST populate all 5 columns for every KRA. Do NOT combine columns.
       Populate the table with these EXACT five KRAs:
       - 1. TEACHING AND LEARNING (Focus: Schemes of Work, Weekly Forecasts, Lesson Plans, Lesson delivery, Remedial teaching)
       - 2. LEARNER ASSESSMENT (Focus: Designing assessment tools, Marking/recording, Remediation, Markbooks)
       - 3. RESOURCE MANAGEMENT (Focus: Management of textbooks, TLMs, Classroom upkeep)
       - 4. PROFESSIONAL DEVELOPMENT (Focus: Attendance of ZIT/SIT/CPD, Peer observations)
       - 5. EXTRA-CURRICULAR ACTIVITIES (Focus: Supervising sports/clubs, preventive maintenance, school committees)
    3. OVERALL ASSESSMENT & RATING: 
       - Header: <h3 style="text-align: center; text-decoration: underline;">OVERALL ASSESSMENT & RATING</h3>
       - **RATING KEY**: 5: Exceptional | 4: Exceeds Targets | 3: Met Targets | 2: Below Targets | 1: Unsatisfactory
       - Score Box: <div class="overall-rating-box"><span class="score-label">OVERALL SCORE:</span></div>
       - **SUPERVISOR'S COMMENTS**:
         ................................................................................................................................................................................................
         ................................................................................................................................................................................................
         ................................................................................................................................................................................................
    4. FINAL SIGNATURES & STAMP:
       - Header: <h3 style="text-align: center; text-decoration: underline;">FINAL SIGNATURES & STAMP</h3>
       - **APPRAISEE (TEACHER)**: ............................................................ **DATE**: ....................................
       - **HEAD OF SECTION/DEPARTMENT**: ............................................................ **DATE**: ....................................
       - **SUPERVISOR (HEAD TEACHER/DEPUTY)**: ............................................................ **DATE**: ....................................
       - **OFFICIAL STAMP**:
         <div style="border: 1px dashed #ccc; width: 150px; height: 80px; margin-top: 5px; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #999;">PLACE SCHOOL STAMP HERE</div>

    ---

    ### OPTIONAL SECTION: ANNUAL WORK PLAN (ONLY if "Include Annual Work Plan Section" is YES)
    - If YES, use the "---" separator above to start a NEW PAGE for a full-year instructional activity schedule mapping months to focuses.
    - If NO, do NOT include this section.

    ### REQUIREMENTS:
    - CONTINUOUS FLOW: Do NOT use "---" between sections 1, 2, 3, and 4. They must flow together to fill pages.
    - DO NOT TRUNCATE: Ensure every section (Profile, Table, Assessment, Signatures) is included in full.
    - ORIENTATION: Landscape.
    - DETAIL: Provide comprehensive, professional descriptions in the tables.
    - NO GAPS: Structure headers and tables to minimize white space while maintaining readability.`,
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "lesson_notes",
    title: "Lesson Notes",
    description: "Detailed, syllabus-based lesson notes for any grade and topic.",
    prompt: `Generate comprehensive, detailed and syllabus-based Lesson Notes based on the following exact template, providing deep, complete educational material.

<center>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
  <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">LESSON NOTES</h1>
</center>

<div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
  <p style="margin: 4px 0;"><b>SUBJECT:</b> {subject}</p>
  <p style="margin: 4px 0;"><b>GRADE:</b> {grade}</p>
  <p style="margin: 4px 0;"><b>TOPIC:</b> {topic}</p>
  <p style="margin: 4px 0;"><b>SUB-TOPIC:</b> {subtopic}</p>
</div>

<div style="font-size: 10pt; font-weight: bold; margin-bottom: 15px; text-align: right;"># DETAILED LESSON NOTES</div>

<div class="lesson-notes-meta" style="margin-bottom: 25px; line-height: 1.6;">
  <b>SPECIFIC {header_specific}:</b><br/>{specificCompetences}<br/>
</div>

<hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 25px;" />

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">1. INTRODUCTION TO THE CONCEPTS</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
  [Provide a comprehensive, learner-friendly introduction explaining the core concepts of this sub-topic. Use clear definitions, real-life analogies, and set the learning context firmly based on the selected specific competencies/outcomes. Ensure this section is detailed and highly informative (at least 150-200 words).]
</p>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">2. CORE CONTENT & TEACHING EXPOSITION</h3>
<div style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
  [Provide exhaustive, comprehensive, step-by-step explanatory notes covering the full syllabus material of the topic and subtopic. This must serve as the primary teaching notes for the chalkboard or handouts. Break it down logically utilizing sub-headers, bold terms, or a bulleted layout for readability:
  - Discuss the primary rules, scientific/mathematical formulas, linguistic conventions, or historical facts.
  - Detail specific procedural steps, processes, or logical sequences relevant to the sub-topic.
  - Present comprehensive explanatory examples with full, rich information (ensure this section contains at least 300 to 450 words of solid, educational material with no brief placeholders)].
</div>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">3. {subtopic}</h3>
<div style="font-size: 11pt; line-height: 1.6; margin-bottom: 20px;">
  <p>Below are detailed lesson notes and model problems / discussion questions illustrating applications of the core concepts of {subtopic}:</p>
  <div style="background-color: #F8FAFC; border-left: 4px solid #00A86B; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <strong>Worked Example / Application Scenario 1:</strong><br/>
    [Provide a complex question or practical scenario or concept question based on the specific outcome selected.]<br/>
    <strong style="color: #0F172A;">Detailed Explanation / Solution:</strong><br/>
    [Provide a detailed, step-by-step explanation or solution that a teacher can write on the board to guide learners.]
  </div>
  <div style="background-color: #F8FAFC; border-left: 4px solid #00A86B; padding: 15px; border-radius: 8px;">
    <strong>Worked Example / Application Scenario 2:</strong><br/>
    [Provide another structured scenario or practical question illustrating another learning facet of the sub-topic.]<br/>
    <strong style="color: #0F172A;">Detailed Explanation / Solution:</strong><br/>
    [Provide a step-by-step guide for worked example 2.]
  </div>
</div>

<h3 style="font-size: 14pt; font-weight: bold; margin-top: 25px; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">4. INTEGRATED CLASSROOM EXERCISE / TASKS</h3>
<div style="font-size: 11pt; line-height: 1.6; margin-bottom: 25px;">
  <p>To verify that learners have acquired the relevant competencies, guide them to complete the following assessment exercise:</p>
  <ol style="padding-left: 20px; margin-top: 10px;">
    <li style="margin-bottom: 10px;"><strong>[Cognitive task / Direct question]</strong>: [Provide a high-quality test item testing recollection or basic calculation/explanation...]</li>
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

**Requirements:**
- The document MUST strictly start with the official professional headers block:
  <center>
    <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
    <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
    <h1 style="font-size: 18pt; font-weight: bold; margin-top: 15px; margin-bottom: 15px; text-transform: uppercase; text-align: center; font-family: 'Inter', sans-serif;">LESSON NOTES</h1>
  </center>
- Immediately below and before # DETAILED LESSON NOTES, the following clean, elegant non-table info block must exist:
  <div class="lesson-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
    <p style="margin: 4px 0;"><b>SUBJECT:</b> {subject}</p>
    <p style="margin: 4px 0;"><b>GRADE:</b> {grade}</p>
    <p style="margin: 4px 0;"><b>TOPIC:</b> {topic}</p>
    <p style="margin: 4px 0;"><b>SUB-TOPIC:</b> {subtopic}</p>
  </div>
- You are STRICTLY FORBIDDEN from putting any list of references, plain reference strings (including {references}), or extra text above or before the official professional header.
- Do NOT repeat the professional header, and do NOT include any horizontal line ("---") or separators at the very beginning of your response.
- The notes MUST be incredibly rich, detailed, informative, and complete. There should be NO placeholder text or TBD. All scientific facts, steps, definitions, historical events, mathematical formulas, or language rules must be written in full detailed paragraphs.
- Incorporate selected references and specific competency statements directly in a supportive, deeply academic manner.
- Under the "DOCUMENT REFERENCES & CITATIONS" section, ensure that the selected references ({references}) are displayed as a well-arranged, numbered list. Number each reference (1, 2, 3...) in a smaller, neat, readable font (8pt size).
- Number 3 header MUST be the document name ({subtopic}). Only update for the lesson notes. Nothing else apart from this.
- Ensure the output maintains clean vertical separation and is highly printable.`,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "video_script",
    title: "Video Lesson Scripts",
    description: "Ready-to-record video lessons & storyboard scripts based on syllabus.",
    prompt: `Generate a detailed professional Video Lesson Script & Storyboard in the following exact format. Keep dialogues high-impact, crisp, and concise (focused, punchy, and under 1200 words total across the entire document) to ensure lightning-fast generation speed. Provide all placeholders.
    
<center>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{district} DISTRICT</h2>
  <h2 style="margin: 2px 0; padding: 0; font-size: 14pt; font-weight: 700; text-align: center; text-transform: uppercase;">{school}</h2>
  <h1 style="margin: 0; padding: 0; font-size: 18pt; font-weight: 800; text-align: center; text-transform: uppercase;">VIDEO LESSON SCRIPT</h1>
</center>

<div class="video-notes-general-info" style="font-family: 'Inter', sans-serif; font-size: 11.5pt; line-height: 1.6; margin-top: 20px; margin-bottom: 25px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; text-align: left; width: 100%;">
  <p style="margin: 4px 0;"><b>SUBJECT:</b> {subject}</p>
  <p style="margin: 4px 0;"><b>GRADE:</b> {grade}</p>
  <p style="margin: 4px 0;"><b>TOPIC:</b> {topic}</p>
  <p style="margin: 4px 0;"><b>SUB-TOPIC:</b> {subtopic}</p>
  <p style="margin: 4px 0;"><b>TARGET VIDEO LENGTH:</b> 10-15 Minutes</p>
</div>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">1. OVERVIEW & COMPETENCIES</h3>
<p style="font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
  <b>SPECIFIC COMPETENCIES/LEARNING OUTCOMES:</b><br/>{specificCompetences}<br/><br/>
  <b>VIDEO LESSON FOCUS & GOALS:</b><br/>
  [Provide a short, clear description of the specific visual and conceptual learning goals of this video lesson based on the Zambian curriculum standards.]
</p>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">2. TEACHER PREPARATION CHECKLIST</h3>
<ul style="font-size: 11pt; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
  <li style="margin-bottom: 5px;"><b>Technical Set-up:</b> High-quality microphone, clean lighting, clear framing (medium close-up).</li>
  <li style="margin-bottom: 5px;"><b>Physical/Digital Props:</b> [List 2-3 physical props or models derived from teaching and learning aids of {topic}].</li>
  <li style="margin-bottom: 5px;"><b>Board Preparation:</b> [List key diagrams or formulas that must be pre-drawn on the chalkboard before recording begins].</li>
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
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Teacher on screen in a friendly medium-shot, smiling warmly. Title slide is displayed first: <i>{topic} - {subtopic}</i>. Cut back to teacher who points to an interesting local object or introduces an engaging real-world hook.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Hello boys and girls! Welcome back to another exciting lesson. I'm your teacher, {teacherName}, and today we are going to explore a super interesting topic: <b>{subtopic}</b>! Before we begin, look at this..." [Provide an incredibly engaging hook story or simple demonstration question centered on local Zambian life or context].</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>01:30 - 05:00</b><br/>Core Concept & Definitions</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Camera pans to the whiteboard. Zoom in on a neatly arranged definition and simple diagrams illustrating the core terms. Use bright markers for emphasis. Teacher uses a pointer.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Awesome! Now, what exactly do we mean by {subtopic}? Let's read this together on the board..." [Write out a comprehensive, clear, age-appropriate definition, explaining the concept with highly interactive, energetic, and clear verbal descriptions, avoiding any abbreviations or placeholders.]</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>05:00 - 08:30</b><br/>Step-by-step Demonstration</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">whiteboard close-up. Teacher solves a model problem or does a clear scientific/conceptual step-by-step breakdown. Writes clear step numbers (1, 2, 3...) on the board with corresponding visual solutions.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Let's see this in action! Suppose we are asked to find or explain..." [Provide a complete, detailed model example or scenario from the syllabus. Work it out out-loud step-by-step, explaining the 'why' behind each action so the student at home can follow easily.]</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>08:30 - 11:30</b><br/>Pause & Active Practice</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">A dynamic on-screen slide appears: <b>"YOUR TURN: PAUSE & TRY!"</b>. Displays 2 practice questions. Soft instrumental thinking music starts. Camera shows teacher making a playful "pause" gesture.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Alright, active learners! Now it's your turn to shine. I want you to <b>pause this video right now</b>, grab your exercise book and pen, and try solving these two questions on your screen. Don't worry, we'll solve them together when you get back! Go ahead, pause now!" [Pause for 3 seconds of silence] "Welcome back! Let's check your answers..." [Provide the full worked solutions and praise the learners].</td>
    </tr>
    <tr>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>11:30 - 13:00</b><br/>Summary & Wrap-up</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;">Teacher is back in a medium-shot, smiling. Summary slide listing 3 critical takeaways is shown on screen next to the teacher.</td>
      <td style="border: 1px solid black; padding: 10px; font-size: 10pt; vertical-align: top;"><b>Teacher:</b> "Superb effort today! We have learned some wonderful things about <b>{subtopic}</b>. Let's recap our three main golden rules..." [Briefly summarize 3 main learning points clearly] "Remember to do your homework and keep practicing. I will see you in our next video lesson. Happy learning, and goodbye!"</td>
    </tr>
  </tbody>
</table>

<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #1E293B; border-bottom: 2px solid #00A86B; padding-bottom: 5px;">4. ON-SCREEN TEXT, GRAPHICS & OVERLAYS</h3>
<div style="font-size: 11pt; line-height: 1.6; background-color: #F8FAFC; border-left: 4px solid #00A86B; padding: 15px; border-radius: 8px;">
  <b>Overlay 1 (Title Graphic):</b> Fortunes Edutech | {subject} Grade {grade} | Topic: {topic}<br/>
  <b>Overlay 2 (Syllabus Concept):</b> [Key terminology, definitions and bullet points to be overlaid as text at the bottom of the screen]<br/>
  <b>Overlay 3 (Practice Prompt):</b> [Full-screen layout displaying the questions and an animated 'Pause' icon]
</div>

<div style="page-break-before: always; margin-top: 40px; border-top: 2px solid #00A86B; padding-top: 20px;">
  <h3 style="font-size: 11pt; font-weight: bold; color: #1E293B; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px;">DOCUMENT REFERENCES & CITATIONS</h3>
  <p style="font-size: 9pt; color: #475569; margin-bottom: 15px;">
    The educational material, video script structure, and academic syllabus guidelines are derived from:
  </p>
  <ol class="references-list" style="font-size: 8pt; line-height: 1.6; color: #475569; padding-left: 20px; font-family: 'Inter', sans-serif;">
    <!-- Carefully generate a numbered bibliography of the specified and selected references here: {references}. -->
  </ol>
</div>

<div class="video-notes-footer" style="margin-top: 40px; border-top: 1.5px solid black; padding-top: 15px; font-size: 9.5pt; text-align: center;">
  <strong>FORTUNES EDUTECH HYBRID CLASSROOM RESOURCE © {year}</strong>
</div>`,
    color: "bg-emerald-50 text-emerald-600",
  },
];

export const CATEGORY_SUBJECTS: Record<string, string[]> = {
  ECE: [
    "Creative and technology studies",
    "Zambian language",
    "English",
    "Pre-Mathematics & Science",
  ],
  "Grade 1-3": [
    "Mathematics and science",
    "Creative and technology studies",
    "Zambian language",
    "English",
  ],
  "Grade 4-6": [
    "Creative and technology studies",
    "Science",
    "English",
    "Zambian language",
    "Home Economics",
    "Home Economics & Hospitality",
    "Mathematics",
    "Expressive arts",
    "Social Studies",
  ],
  Secondary: [
    "Mathematics 1",
    "Mathematics 2",
    "English",
    "Zambian language",
    "Biology",
    "Chemistry",
    "Physics",
    "Civic Education",
    "History",
    "Geography",
    "Literature in English",
    "Musical Arts",
    "Physical Education",
    "Religious Education",
    "Travel and Tourism",
    "Computer Science",
    "Information and Communication Technology (ICT)",
    "Hospitality Management",
    "Food and Nutrition",
    "Art and Design",
    "Design and Technology",
    "Agriculture Science",
    "Commerce",
    "Principles of Accounts",
    "French Language",
    "Fashion and Fabrics",
  ],
};

export const OBC_GRADES = [
  "Grade 3 (OBC)",
  "Grade 5 (OBC)",
  "Grade 6 (OBC)",
  "Grade 7 (OBC)",
  "Grade 10 (OBC)",
  "Grade 11 (OBC)",
  "Grade 12 (OBC)",
];

export const OBC_LEVELS = [
  "Grade 3 (OBC)",
  "Grade 5 (OBC)",
  "Grade 6 (OBC)",
  "Grade 7 (OBC)",
  "Grade 10 (OBC)",
  "Grade 11 (OBC)",
  "Grade 12 (OBC)",
];

export const OBC_SUBJECTS: string[] = [
  "Mathematics",
  "Integrated Science",
  "Creative and Technology Studies",
  "Technology Studies",
  "Social Studies",
  "English",
  "Zambian language",
  "Home Economics and Hospitality",
  "Home Economics",
  "Civic Education",
  "Computer Studies",
  "Additional Mathematics",
  "Biology",
  "Religious Education 2044",
  "Zambian language",
  "Chemistry",
  "Physics",
];

export const GRADES = [
  "ECE level 1",
  "ECE level 2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 3 (OBC)",
  "Grade 5 (OBC)",
  "Grade 6 (OBC)",
  "Grade 7 (OBC)",
  "Grade 10 (OBC)",
  "Grade 11 (OBC)",
  "Form 3 (OBC)",
  "Form 1 O Level",
  "Form 2 O Level",
  "Form 3 O Level",
  "Form 4 O Level",
  "Form 5 A Level",
  "Form 6 A Level",
];

export const SUBSCRIPTION_PLANS: Record<string, {
  label: string;
  price: number;
  limit: number;
  durationDays: number;
  colorClass: string;
}> = {
  weekly: {
    label: 'Weekly Circle',
    price: 20,
    limit: 40,
    durationDays: 7,
    colorClass: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  '14days': {
    label: '14 Days Circle',
    price: 40,
    limit: 80,
    durationDays: 14,
    colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  monthly: {
    label: 'Monthly Circle',
    price: 90,
    limit: 180,
    durationDays: 30,
    colorClass: 'text-purple-700 bg-purple-50 border-purple-100',
  },
  termly: {
    label: 'Termly Circle',
    price: 250,
    limit: 500,
    durationDays: 90,
    colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  },
  unlimited: {
    label: 'Unlimited Access',
    price: 1500,
    limit: Infinity,
    durationDays: Infinity,
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  guest_trial: {
    label: 'Trial Access',
    price: 0,
    limit: 4,
    durationDays: 1,
    colorClass: 'text-blue-700 bg-blue-50 border-blue-100',
  }
};

export const SECONDARY_GRADES = [
  "Form 1 O Level",
  "Form 2 O Level",
  "Form 3 O Level",
  "Form 4 O Level",
];

export const getSubjectsForGrade = (grade: string): string[] => {
  if (!grade) return [];
  const g = grade.toLowerCase();
  
  // Custom mapping for OBC levels to exactly match the SYLLABI keys
  if (g.includes("(obc)")) {
    if ((g.includes("grade 1") && !g.includes("grade 10") && !g.includes("grade 11") && !g.includes("grade 12")) || g.includes("grade 2")) {
      return [
        "Mathematics",
        "Integrated science",
        "Creative and Technology Studies",
        "Zambian language",
        "English",
        "Literacy in English",
        "Oral English"
      ];
    }
    if (g.includes("grade 3")) {
      return [
        "Integrated science",
        "Creative and Technology Studies",
        "English",
        "Zambian language",
        "Mathematics",
        "Social Studies"
      ];
    }
    if (g.includes("grade 4")) {
      return [
        "English",
        "Integrated science",
        "Social Studies",
        "Zambian language",
        "Mathematics",
        "Technology Studies",
        "Home Economics and Hospitality"
      ];
    }
    if (g.includes("grade 5") || g.includes("grade 6") || g.includes("grade 7")) {
      return [
        "Integrated science",
        "Technology Studies",
        "English",
        "Zambian language",
        "Home Economics",
        "Expressive arts",
        "Mathematics",
        "Social Studies"
      ];
    }
    if (g.includes("form 1 o level") ||
      g.includes("form 2 o level") ||
      g.includes("form 3 o level") ||
      g.includes("form 4 o level") ||
      g.includes("grade 10") ||
      g.includes("grade 11") ||
      g.includes("grade 12")
    ) {
      return [
        "English",
        "Home Economics",
        "Civic Education",
        "Computer Studies",
        "Additional Mathematics",
        "Biology",
        "Religious Education 2044",
        "Zambian language",
        "Chemistry",
        "Physics"
      ];
    }
  }

  if (g.includes("form 5") || g.includes("form 6") || g.includes("form 5-6")) {
    return [
      "Agricultural Science adva",
      "Art and Design adva",
      "Biology adva",
      "Business Studies adva",
      "Chemistry adva",
      "Civic Education adva",
      "Computer Science adva",
      "Design and Technology adva",
      "Economics adva",
      "English Language adva",
      "French Language adva",
      "Geography adva",
      "History adva",
      "Hospitality Management adva",
      "Literature in English adva",
      "Literature in Zambian Languages adva",
      "Mathematics adva",
      "Musical Arts Education adva",
      "Nutrition and Food Technology adva",
      "Physical Education adva",
      "Physics adva",
      "Religious Education adva",
      "Textile Design and Technology adva",
      "Travel and Tourism adva"
    ];
  }

  if (g.includes("ece")) return CATEGORY_SUBJECTS["ECE"];
  
  const gradeNumMatch = g.match(/grade\s*(\d+)/);
  if (gradeNumMatch) {
    const num = parseInt(gradeNumMatch[1]);
    if (num >= 1 && num <= 3) {
      if (num === 1 || num === 2) {
        return [
          "Mathematics and science",
          "Creative and technology studies",
          "Zambian language",
          "English",
          "Literacy in English",
          "Oral English"
        ];
      }
      return CATEGORY_SUBJECTS["Grade 1-3"];
    }
    if (num >= 4 && num <= 6) {
      const subjects = CATEGORY_SUBJECTS["Grade 4-6"];
      if (!subjects.includes("Social Studies")) {
        return ["Social Studies", ...subjects];
      }
      return subjects;
    }
    if (num >= 8) return CATEGORY_SUBJECTS["Secondary"];
    if (num >= 7) return CATEGORY_SUBJECTS["Grade 4-6"]; // Still use these subjects for Grade 7 OBC if applicable
  }

  if (g.includes("form") || g.includes("secondary"))
    return CATEGORY_SUBJECTS["Secondary"];

  // Fallback for Trial Access or any unrecognized grades to allow experimenting
  return CATEGORY_SUBJECTS["Grade 4-6"];
};

export const ADVANCED_GRADES = [
  "Form 5 A Level",
  "Form 6 A Level"
];
