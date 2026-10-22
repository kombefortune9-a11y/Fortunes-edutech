/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocType } from '../constants';
import { GenerationParams } from './geminiService';

export interface ClassAllocation {
  id: string;
  grade: string;          // e.g. "Grade 5"
  stream: string;         // e.g. "5A", "Green", "Room 3"
  subject: string;        // e.g. "Mathematics"
  periodsPerWeek: number; // e.g. 5
  curriculumType: 'CBC' | 'OBC';
  term: string;           // e.g. "Term 1"
  year: number;           // e.g. 2026
}

export interface TimetablePeriod {
  id: string;
  periodNumber: number; // 1 to 8
  startTime: string;    // "08:00"
  endTime: string;      // "08:40"
  classAllocationId?: string;
  grade?: string;
  stream?: string;
  subject?: string;
  isBreak?: boolean;
  breakLabel?: string;
}

export interface TimetableDay {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periods: TimetablePeriod[];
}

export interface LinkedSchemeWeek {
  week: number;
  topic: string;
  subtopics: string[];
  competencies: string[];
  activities: string[];
  teachingAids?: string;
  references?: string;
}

export interface LinkedMasterScheme {
  id: string;
  grade: string;
  subject: string;
  curriculumType: 'CBC' | 'OBC';
  term: string;
  year: number;
  title: string;
  weeks: LinkedSchemeWeek[];
  lastUpdated: string;
}

export interface LinkedForecastDay {
  dayName: string;
  periodNumber?: number;
  time?: string;
  classStream?: string;
  topic: string;
  subtopic: string;
  competency: string;
  activities: string[];
  teachingAids?: string;
  references?: string;
  lessonPlanGenerated?: boolean;
  lessonPlanId?: string;
}

export interface LinkedWeeklyForecast {
  id: string;
  grade: string;
  subject: string;
  stream?: string;
  week: number;
  term: string;
  year: number;
  topic: string;
  subtopic?: string;
  schemeId?: string;
  days: LinkedForecastDay[];
  createdAt: string;
  updatedAt: string;
}

export interface SmartPlanningSetup {
  teacherName: string;
  schoolName: string;
  term: string;
  year: number;
  curriculumType: 'CBC' | 'OBC';
  classAllocations: ClassAllocation[];
  timetable: TimetableDay[];
  linkedSchemes: LinkedMasterScheme[];
  isConfigured: boolean;
  lastUpdated: string;
}

const STORAGE_KEY = 'eduplan_smart_planning_setup_v2';
const FORECASTS_STORAGE_KEY = 'eduplan_smart_planning_forecasts_v2';

export const STANDARD_DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
];

export const STANDARD_PERIOD_SLOTS = [
  { periodNumber: 1, startTime: '08:00', endTime: '08:40', isBreak: false },
  { periodNumber: 2, startTime: '08:40', endTime: '09:20', isBreak: false },
  { periodNumber: 3, startTime: '09:20', endTime: '10:00', isBreak: false },
  { periodNumber: 0, startTime: '10:00', endTime: '10:20', isBreak: true, breakLabel: 'Tea Break' },
  { periodNumber: 4, startTime: '10:20', endTime: '11:00', isBreak: false },
  { periodNumber: 5, startTime: '11:00', endTime: '11:40', isBreak: false },
  { periodNumber: 6, startTime: '11:40', endTime: '12:20', isBreak: false },
  { periodNumber: 0, startTime: '12:20', endTime: '13:00', isBreak: true, breakLabel: 'Lunch Break' },
  { periodNumber: 7, startTime: '13:00', endTime: '13:40', isBreak: false },
  { periodNumber: 8, startTime: '13:40', endTime: '14:20', isBreak: false },
];

/**
 * Creates a blank timetable template for Monday through Friday
 */
export function createBlankTimetable(): TimetableDay[] {
  return STANDARD_DAYS.map(dayName => ({
    dayName,
    periods: STANDARD_PERIOD_SLOTS.map((slot, sIdx) => ({
      id: `${dayName}-p${slot.periodNumber || `b${sIdx}`}`,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBreak: slot.isBreak,
      breakLabel: slot.breakLabel,
      grade: '',
      stream: '',
      subject: '',
      classAllocationId: ''
    }))
  }));
}

/**
 * Auto-populates a standard timetable from a list of class allocations
 */
export function autoFillTimetableFromAllocations(allocations: ClassAllocation[]): TimetableDay[] {
  const timetable = createBlankTimetable();
  if (!allocations || allocations.length === 0) return timetable;

  let allocIndex = 0;
  for (const day of timetable) {
    for (const period of day.periods) {
      if (period.isBreak) continue;
      const alloc = allocations[allocIndex % allocations.length];
      if (alloc) {
        period.classAllocationId = alloc.id;
        period.grade = alloc.grade;
        period.stream = alloc.stream;
        period.subject = alloc.subject;
      }
      allocIndex++;
    }
  }

  return timetable;
}

/**
 * Builds or retrieves a 13-week master Scheme of Work blueprint
 */
export function buildMasterSchemeFromSyllabus(
  grade: string,
  subject: string,
  curriculumType: 'CBC' | 'OBC' = 'CBC',
  term: string = 'Term 1',
  year: number = new Date().getFullYear()
): LinkedMasterScheme {
  const weeks: LinkedSchemeWeek[] = [];

  const sampleTopics = [
    { name: "General Concepts and Foundations", subtopics: ["Core Introduction and Terminology", "Basic Principles"] },
    { name: "Core Operations and Practice", subtopics: ["Practical Applications", "Guided Exercises"] },
    { name: "Advanced Analysis and Problem Solving", subtopics: ["Complex Scenarios", "Contextual Problem Solving"] },
    { name: "Review, Application and Assessment", subtopics: ["Practical Projects", "Weekly Consolidation"] }
  ];

  for (let w = 1; w <= 13; w++) {
    if (w === 12) {
      weeks.push({
        week: 12,
        topic: "Revision and Remediation",
        subtopics: ["Term Concepts Review & Skill Consolidation"],
        competencies: ["Consolidate and review all competencies taught during the term"],
        activities: ["Revision worksheets, group problem-solving, and remediation clinics"],
        teachingAids: "Revision charts, chalkboard summaries, practice cards",
        references: `${grade} ${subject} Syllabus, Term ${term} Review Section`
      });
      continue;
    }

    if (w === 13) {
      weeks.push({
        week: 13,
        topic: "End of Term Assessment and Evaluation",
        subtopics: ["Comprehensive Term Evaluation & Reporting"],
        competencies: ["Demonstrate mastery of term learning outcomes through standardized assessment"],
        activities: ["Administering term assessment, marking, record keeping, and pupil feedback"],
        teachingAids: "Assessment question papers, answer keys, mark schedules",
        references: "National Assessment Guidelines, Term Record Sheets"
      });
      continue;
    }

    const tObj = sampleTopics[(w - 1) % sampleTopics.length];
    const stTitle = tObj.subtopics[(w - 1) % tObj.subtopics.length];

    weeks.push({
      week: w,
      topic: `${tObj.name} (Part ${w})`,
      subtopics: [stTitle],
      competencies: [
        `Explain and apply key principles of ${stTitle}`,
        `Demonstrate practical skills related to ${tObj.name}`
      ],
      activities: [
        `Learners discuss and identify key features of ${stTitle} in groups`,
        `Learners practice hands-on tasks and record findings in exercise books`
      ],
      teachingAids: "Charts, realia, flashcards, chalkboard illustrations",
      references: `${grade} ${subject} Syllabus, Teachers Guide pg. ${w * 3}`
    });
  }

  return {
    id: `scheme-${grade.toLowerCase().replace(/\s+/g, '-')}-${subject.toLowerCase().replace(/\s+/g, '-')}-${term.toLowerCase()}`,
    grade,
    subject,
    curriculumType,
    term,
    year,
    title: `${grade} ${subject} Master Scheme of Work (${curriculumType} - ${term})`,
    weeks,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Loads current Smart Planning setup from localStorage
 */
export function getSmartPlanningSetup(): SmartPlanningSetup {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.classAllocations)) {
        return parsed;
      }
    }
  } catch {}

  const defaultAllocations: ClassAllocation[] = [
    {
      id: 'alloc-1',
      grade: 'Grade 5',
      stream: '5A',
      subject: 'Mathematics',
      periodsPerWeek: 5,
      curriculumType: 'CBC',
      term: 'Term 1',
      year: new Date().getFullYear()
    },
    {
      id: 'alloc-2',
      grade: 'Grade 5',
      stream: '5A',
      subject: 'Integrated Science',
      periodsPerWeek: 4,
      curriculumType: 'CBC',
      term: 'Term 1',
      year: new Date().getFullYear()
    }
  ];

  const defaultTimetable = autoFillTimetableFromAllocations(defaultAllocations);
  const defaultSchemes = defaultAllocations.map(a => 
    buildMasterSchemeFromSyllabus(a.grade, a.subject, a.curriculumType, a.term, a.year)
  );

  return {
    teacherName: '',
    schoolName: '',
    term: 'Term 1',
    year: new Date().getFullYear(),
    curriculumType: 'CBC',
    classAllocations: defaultAllocations,
    timetable: defaultTimetable,
    linkedSchemes: defaultSchemes,
    isConfigured: false,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Saves Smart Planning setup to localStorage
 */
export function saveSmartPlanningSetup(setup: SmartPlanningSetup): void {
  try {
    const dataToSave = {
      ...setup,
      isConfigured: true,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {}
}

/**
 * Loads all saved linked weekly forecasts
 */
export function getSavedLinkedForecasts(): LinkedWeeklyForecast[] {
  try {
    const raw = localStorage.getItem(FORECASTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Saves or updates a linked weekly forecast
 */
export function saveLinkedForecast(forecast: LinkedWeeklyForecast): void {
  try {
    const list = getSavedLinkedForecasts();
    const existingIdx = list.findIndex(f => 
      f.grade === forecast.grade && 
      f.subject === forecast.subject && 
      f.week === forecast.week &&
      (f.stream === forecast.stream || (!f.stream && !forecast.stream))
    );

    if (existingIdx >= 0) {
      list[existingIdx] = forecast;
    } else {
      list.unshift(forecast);
    }

    localStorage.setItem(FORECASTS_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * 🔗 DERIVE WEEKLY FORECAST FROM SCHEME OF WORK
 */
export function deriveWeeklyForecastFromScheme(
  setup: SmartPlanningSetup,
  grade: string,
  subject: string,
  stream: string = '',
  weekNumber: number = 1
): LinkedWeeklyForecast {
  let scheme = setup.linkedSchemes.find(s => 
    s.grade.toLowerCase() === grade.toLowerCase() && 
    s.subject.toLowerCase() === subject.toLowerCase()
  );

  if (!scheme) {
    scheme = buildMasterSchemeFromSyllabus(grade, subject, setup.curriculumType, setup.term, setup.year);
    setup.linkedSchemes.push(scheme);
    saveSmartPlanningSetup(setup);
  }

  const weekData = scheme.weeks.find(w => w.week === weekNumber) || scheme.weeks[0];
  const topic = weekData.topic;
  const subtopic = weekData.subtopics[0] || "General Foundations";

  const scheduledDays: { dayName: string; periodNumber: number; time: string }[] = [];
  
  for (const day of setup.timetable) {
    for (const p of day.periods) {
      if (p.isBreak) continue;
      const matchGrade = p.grade && p.grade.toLowerCase() === grade.toLowerCase();
      const matchSubj = p.subject && p.subject.toLowerCase() === subject.toLowerCase();
      const matchStream = !stream || !p.stream || p.stream.toLowerCase() === stream.toLowerCase();

      if (matchGrade && matchSubj && matchStream) {
        scheduledDays.push({
          dayName: day.dayName,
          periodNumber: p.periodNumber,
          time: `${p.startTime} - ${p.endTime}`
        });
      }
    }
  }

  const daysToMap = scheduledDays.length > 0 
    ? scheduledDays 
    : STANDARD_DAYS.map((d, idx) => ({ dayName: d, periodNumber: idx + 1, time: '08:00 - 08:40' }));

  const competenciesPool = weekData.competencies || [`Explain and apply key principles of ${subtopic}`];
  const activitiesPool = weekData.activities || [`Learners practice tasks on ${subtopic}`];

  const forecastDays: LinkedForecastDay[] = daysToMap.map((slot, dIdx) => {
    const comp = competenciesPool[dIdx % competenciesPool.length] || competenciesPool[0];
    const act = activitiesPool[dIdx % activitiesPool.length] || activitiesPool[0];
    
    return {
      dayName: slot.dayName,
      periodNumber: slot.periodNumber,
      time: slot.time,
      classStream: stream || undefined,
      topic,
      subtopic,
      competency: comp,
      activities: [act, `Independent pupil practice on exercise ${dIdx + 1}`],
      teachingAids: weekData.teachingAids || "Chalkboard, charts, textbooks",
      references: weekData.references || `${grade} ${subject} Syllabus, Week ${weekNumber}`
    };
  });

  const forecast: LinkedWeeklyForecast = {
    id: `forecast-${grade.toLowerCase().replace(/\s+/g, '-')}-${subject.toLowerCase().replace(/\s+/g, '-')}-w${weekNumber}`,
    grade,
    subject,
    stream,
    week: weekNumber,
    term: setup.term,
    year: setup.year,
    topic,
    subtopic,
    schemeId: scheme.id,
    days: forecastDays,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveLinkedForecast(forecast);
  return forecast;
}

/**
 * 🔗 DERIVE LESSON PLAN PARAMS DIRECTLY FROM WEEKLY FORECAST
 */
export function deriveLessonPlanParamsFromForecast(
  setup: SmartPlanningSetup,
  forecast: LinkedWeeklyForecast,
  dayIndex: number = 0,
  teacherName?: string,
  schoolName?: string
): GenerationParams {
  const day = forecast.days[dayIndex] || forecast.days[0];

  return {
    type: 'lesson_plan',
    curriculumType: setup.curriculumType,
    grade: forecast.grade,
    subject: forecast.subject,
    classDescription: forecast.stream || '45 Pupils',
    term: forecast.term,
    weekNumber: forecast.week,
    forecastWeek: forecast.week,
    topic: day.topic || forecast.topic,
    subtopic: day.subtopic || forecast.subtopic || '',
    specificCompetences: day.competency,
    learningActivities: day.activities,
    teachingAids: day.teachingAids || 'Chalkboard, visual charts, pupil textbooks',
    references: day.references || `${forecast.grade} ${forecast.subject} Syllabus, Week ${forecast.week}`,
    dayOfWeek: day.dayName,
    date: new Date().toISOString().split('T')[0],
    schoolName: schoolName || setup.schoolName || 'Fortunes Community School',
    teacherName: teacherName || setup.teacherName || 'Teacher',
    time: day.time || '08:00 - 08:40',
    duration: '40 minutes',
    additionalInstructions: `Smart Planning linked from Week ${forecast.week} Weekly Forecast & Master Scheme.`
  };
}
