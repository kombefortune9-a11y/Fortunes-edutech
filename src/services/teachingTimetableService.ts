/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeLocalStorage } from '../lib/storage';
import { getSubjectsForGrade } from '../constants';

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export const ALL_WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface SubjectSchedule {
  subject: string;
  days: Weekday[]; // e.g. ['Monday', 'Tuesday', 'Thursday', 'Friday']
  periodsPerDay?: number;
  dayPeriods?: Partial<Record<Weekday, number>>; // e.g. { Monday: 1, Tuesday: 2, ... }
  defaultTime?: string;
  duration?: string;
}

export interface GradeTimetable {
  grade: string;
  curriculum: 'CBC' | 'OBC';
  term: string; // 'Term 1' | 'Term 2' | 'Term 3'
  termStartDate: string; // YYYY-MM-DD e.g. "2026-10-12"
  termEndDate: string;
  year: number;
  subjectSchedules: Record<string, SubjectSchedule>;
  updatedAt: number;
  expiresAt: number; // 90 days
  isPermanentThreeMonths: boolean;
  isSavedByUser?: boolean;
}

const LOCAL_STORAGE_KEY = 'eduplan_teaching_timetable_v1';
const TOGGLE_STORAGE_KEY = 'eduplan_connect_dropdown_timetable';
export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Default term start dates (e.g. 2026 academic calendar)
// Note: In Zambia, Term 3 starts in September (Monday 7th September 2026) and runs for 13 weeks to early December
export const TERM_START_DATES: Record<string, string> = {
  'Term 1': '2026-01-12',
  'Term 2': '2026-05-11',
  'Term 3': '2026-09-07', // Monday 7th September 2026 (Runs to early December)
};

export const SYNCED_TERM_START_DATE_KEY = 'eduplan_synced_term_start_date';

export function getSyncedTermStartDate(term: string = 'Term 3'): string {
  try {
    const saved = safeLocalStorage.getItem(SYNCED_TERM_START_DATE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return TERM_START_DATES[term] || '2026-09-07';
}

export function setSyncedTermStartDate(dateStr: string) {
  try {
    if (dateStr) {
      safeLocalStorage.setItem(SYNCED_TERM_START_DATE_KEY, dateStr);
    }
  } catch {}
}

/**
 * Returns official curriculum period duration and default time slot based on grade
 * - ECE levels to Grade 3 CBC: 30 minutes
 * - Upper Primary (Grades 4-7) and Secondary (Forms 1-6 / Grades 8-12): 40 minutes
 */
export function getPeriodDurationForGrade(grade: string): { duration: string; defaultTime: string; durationMinutes: number } {
  const g = (grade || '').toLowerCase();
  const isLowerOrECE = g.includes('ece') || g.includes('baby') || g.includes('middle') || g.includes('reception') ||
    g.includes('nursery') || g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3') ||
    g.includes('lower primary');
  if (isLowerOrECE) {
    return { duration: '30 min', defaultTime: '08:00 - 08:30', durationMinutes: 30 };
  }
  return { duration: '40 min', defaultTime: '08:00 - 08:40', durationMinutes: 40 };
}

/**
 * Secondary grade helper: determines if grade is secondary (Form 1 to Form 6 / Grades 8-12)
 */
export function isSecondaryGradeLevel(grade: string): boolean {
  const g = (grade || '').toLowerCase();
  return g.includes('form') || g.includes('grade 8') || g.includes('grade 9') || 
         g.includes('grade 10') || g.includes('grade 11') || g.includes('grade 12') ||
         g.includes('secondary');
}

/**
 * Local storage key for secondary teachers' allocated subjects
 */
export function getSecondaryAllocatedSubjectsKey(grade: string): string {
  return `eduplan_allocated_subjects_${(grade || '').toLowerCase().replace(/\s+/g, '_')}`;
}

export function getSecondaryAllocatedSubjects(grade: string): string[] | null {
  try {
    const raw = safeLocalStorage.getItem(getSecondaryAllocatedSubjectsKey(grade));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

export function saveSecondaryAllocatedSubjects(grade: string, subjects: string[]) {
  try {
    safeLocalStorage.setItem(getSecondaryAllocatedSubjectsKey(grade), JSON.stringify(subjects));
  } catch {}
}

/**
 * Default teaching schedule generator based on subject type
 */
export function getDefaultScheduleForSubject(subject: string): Weekday[] {
  const s = (subject || '').toLowerCase();
  if (s.includes('mathematics and science') || s.includes('mathematics') || s.includes('english') || s.includes('literacy')) {
    // 5 periods/week: Monday to Friday
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }
  if (s.includes('science') || s.includes('social studies') || s.includes('zambian language') || s.includes('physics') || s.includes('chemistry') || s.includes('biology')) {
    // 4 periods/week: e.g. Mon, Tue, Thu, Fri (Wednesday free)
    return ['Monday', 'Tuesday', 'Thursday', 'Friday'];
  }
  if (s.includes('creative') || s.includes('technology') || s.includes('expressive') || s.includes('home economics') || s.includes('agriculture') || s.includes('geography') || s.includes('history')) {
    // 3 periods/week: Mon, Wed, Fri
    return ['Monday', 'Wednesday', 'Friday'];
  }
  // 2 periods/week: Tuesday, Thursday
  return ['Tuesday', 'Thursday'];
}

/**
 * Returns minimum learning activities required based on scheduled days count
 */
export function getMinimumActivitiesForDays(daysCount: number): number {
  if (daysCount >= 5) return 5;
  if (daysCount === 4) return 4;
  if (daysCount === 3) return 3;
  return 2;
}

/**
 * RULES FOR TIMETABLE PERIODS CONTROLLER:
 * - Subject with 2 periods per day = 1hr at lower primary (ECE to Grade 3), 80min Grade 4-secondary
 * - 1 period per day = 30min at lower primary, 40min Grade 4-secondary
 * - 2 periods can carry MAX 2 learning activities joined as bulletins to make 1 lesson
 * - 1 period = 1 learning activity = 1 lesson
 */
export function getDayPeriodDuration(grade: string, periods: number): { duration: string; durationMinutes: number; maxActivities: number; defaultTime: string } {
  const g = (grade || '').toLowerCase();
  const isLowerPrimary = g.includes('ece') || g.includes('baby') || g.includes('middle') || g.includes('reception') ||
    g.includes('nursery') || g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3') ||
    g.includes('lower primary');

  if (periods >= 2) {
    if (isLowerPrimary) {
      return { duration: '1 hr', durationMinutes: 60, maxActivities: 2, defaultTime: '08:00 - 09:00' };
    }
    return { duration: '80 min', durationMinutes: 80, maxActivities: 2, defaultTime: '08:00 - 09:20' };
  }
  // 1 period
  if (isLowerPrimary) {
    return { duration: '30 min', durationMinutes: 30, maxActivities: 1, defaultTime: '08:00 - 08:30' };
  }
  return { duration: '40 min', durationMinutes: 40, maxActivities: 1, defaultTime: '08:00 - 08:40' };
}

/**
 * Creates default timetable structure for a grade
 */
export function createDefaultGradeTimetable(grade: string, term: string = 'Term 3'): GradeTimetable {
  const isOBC = grade.toLowerCase().includes('(obc)');
  const subjects = getSubjectsForGrade(grade);
  const subjectSchedules: Record<string, SubjectSchedule> = {};
  const gLower = (grade || '').toLowerCase();

  const isGrade1 = gLower.includes('grade 1') && !gLower.includes('grade 10') && !gLower.includes('grade 11') && !gLower.includes('grade 12');
  const isGrade2 = gLower.includes('grade 2');

  subjects.forEach(sub => {
    const sLower = sub.toLowerCase();
    let days = getDefaultScheduleForSubject(sub);
    const dayPeriods: Partial<Record<Weekday, number>> = {};

    // ENGLISH RULE: Grade 1 & 2 English = Literacy + Oral share same timetable
    // Default Grade 1 Term 3: Oral 3 days (30min 1 prd), Literacy 2 days (1hr 2 prds)
    // Default Grade 2 Term 3: Oral 2 days (30min 1 prd), Literacy 3 days (1hr 2 prds)
    if (isGrade1 && (sLower.includes('oral') || sLower.includes('literacy'))) {
      if (sLower.includes('oral')) {
        days = ['Monday', 'Wednesday', 'Friday'];
        days.forEach(d => { dayPeriods[d] = 1; });
      } else {
        days = ['Tuesday', 'Thursday'];
        days.forEach(d => { dayPeriods[d] = 2; });
      }
    } else if (isGrade2 && (sLower.includes('oral') || sLower.includes('literacy'))) {
      if (sLower.includes('oral')) {
        days = ['Tuesday', 'Thursday'];
        days.forEach(d => { dayPeriods[d] = 1; });
      } else {
        days = ['Monday', 'Wednesday', 'Friday'];
        days.forEach(d => { dayPeriods[d] = 2; });
      }
    } else {
      days.forEach(d => {
        dayPeriods[d] = 1;
      });
    }

    const { duration, defaultTime } = getPeriodDurationForGrade(grade);

    subjectSchedules[sub] = {
      subject: sub,
      days,
      periodsPerDay: 1,
      dayPeriods,
      defaultTime,
      duration
    };
  });

  const startDate = TERM_START_DATES[term] || '2026-09-07';
  const startD = new Date(startDate);
  const endD = new Date(startD);
  endD.setDate(endD.getDate() + 90); // 13 weeks

  const now = Date.now();
  return {
    grade,
    curriculum: isOBC ? 'OBC' : 'CBC',
    term,
    termStartDate: startDate,
    termEndDate: endD.toISOString().split('T')[0],
    year: 2026,
    subjectSchedules,
    updatedAt: now,
    expiresAt: now + NINETY_DAYS_MS,
    isPermanentThreeMonths: true
  };
}

/**
 * Loads all timetables from backend or localStorage cache
 */
export async function getAllTeachingTimetables(): Promise<Record<string, GradeTimetable>> {
  let serverTimetables: Record<string, GradeTimetable> = {};

  try {
    const res = await fetch('/api/teaching-timetable');
    if (res.ok) {
      const data = await res.json();
      if (data.timetables && typeof data.timetables === 'object') {
        serverTimetables = data.timetables;
      }
    }
  } catch (err) {
    console.warn('Backend teaching timetable fetch fallback:', err);
  }

  let localTimetables: Record<string, GradeTimetable> = {};
  try {
    const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      localTimetables = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Local timetable cache read error:', e);
  }

  const merged = { ...localTimetables, ...serverTimetables };
  return merged;
}

/**
 * Gets the timetable for a specific grade
 */
export async function getGradeTeachingTimetable(grade: string, term: string = 'Term 3'): Promise<GradeTimetable> {
  const all = await getAllTeachingTimetables();
  const cleanGrade = (grade || '').trim();
  
  if (all[cleanGrade]) {
    const existing = all[cleanGrade];
    // Ensure all current subjects for the grade exist in the schedule
    const subjects = getSubjectsForGrade(cleanGrade);
    let changed = false;
    subjects.forEach(sub => {
      if (!existing.subjectSchedules[sub]) {
        existing.subjectSchedules[sub] = {
          subject: sub,
          days: getDefaultScheduleForSubject(sub),
          periodsPerDay: 1,
          defaultTime: '08:00 - 08:40',
          duration: '40 min'
        };
        changed = true;
      }
    });
    if (changed) {
      await saveGradeTeachingTimetable(existing);
    }
    return existing;
  }

  // Create and save new default timetable for this grade
  const def = createDefaultGradeTimetable(cleanGrade, term);
  await saveGradeTeachingTimetable(def);
  return def;
}

/**
 * Saves a grade's timetable (3-month resilient storage)
 */
export async function saveGradeTeachingTimetable(timetable: GradeTimetable): Promise<GradeTimetable> {
  const now = Date.now();
  const toSave: GradeTimetable = {
    ...timetable,
    updatedAt: now,
    expiresAt: timetable.expiresAt || (now + NINETY_DAYS_MS),
    isPermanentThreeMonths: true
  };

  // 1. Save to server backend
  try {
    await fetch('/api/teaching-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave)
    });
  } catch (err) {
    console.warn('Backend timetable save warning:', err);
  }

  // 2. Save to local storage cache
  try {
    const all = await getAllTeachingTimetables();
    all[toSave.grade] = toSave;
    safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Local storage timetable write warning:', e);
  }

  return toSave;
}

/**
 * Resets timetable for a specific grade or all grades
 */
export async function resetTeachingTimetable(grade?: string): Promise<void> {
  try {
    if (!grade) {
      await fetch('/api/teaching-timetable/reset', { method: 'POST' });
      safeLocalStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      const all = await getAllTeachingTimetables();
      delete all[grade];
      await fetch('/api/teaching-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetables: all })
      });
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.warn('Reset timetable warning:', e);
  }
}

/**
 * Calculates dates for a specific week based on the scheduled days in the timetable
 * Week 1 starts at termStartDate. Week W starts at termStartDate + (W-1)*7 days.
 * Only returns the scheduled days, jumping unselected days!
 * 
 * E.g., User has selected Mon, Tue, Thu, Fri for Term 3 (Start: 2026-10-12):
 * - Day 1: Monday (12/10/2026)
 * - Day 2: Tuesday (13/10/2026)
 * - Day 3: Thursday (15/10/2026) [Wednesday is excluded/jumped]
 * - Day 4: Friday (16/10/2026)
 */
export function calculateForecastDaysForWeek(
  weekNumber: number,
  scheduledDays: Weekday[],
  termStartDateStr: string = '2026-09-07'
): { day: Weekday; date: string; formattedDate: string; lessonIndex: number }[] {
  const baseStart = new Date(termStartDateStr);
  
  // Find Monday of the base start week (if not already Monday)
  const baseDayOfWeek = baseStart.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (baseDayOfWeek + 6) % 7; // days after Monday
  const firstMonday = new Date(baseStart);
  firstMonday.setDate(firstMonday.getDate() - distanceToMonday);

  // Monday of weekNumber (1-indexed)
  const weekMonday = new Date(firstMonday);
  weekMonday.setDate(weekMonday.getDate() + (weekNumber - 1) * 7);

  const dayOffsets: Record<Weekday, number> = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4
  };

  const results: { day: Weekday; date: string; formattedDate: string; lessonIndex: number }[] = [];
  
  // Sort days in natural weekday order
  const orderedDays = ALL_WEEKDAYS.filter(d => scheduledDays.includes(d));

  orderedDays.forEach((day, idx) => {
    const offset = dayOffsets[day];
    const targetDate = new Date(weekMonday);
    targetDate.setDate(targetDate.getDate() + offset);

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    
    // Format: DD/MM/YYYY e.g. "15/09/2026"
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    const dateStr = `${yyyy}-${mm}-${dd}`;

    results.push({
      day,
      date: dateStr,
      formattedDate,
      lessonIndex: idx + 1
    });
  });

  return results;
}

/**
 * Returns formatted date range for Schemes of Work for weekNumber (Monday to Friday)
 */
export function getSchemesMondayToFridayRange(
  weekNumber: number,
  termStartDateStr: string = '2026-09-07'
): { mondayDate: string; fridayDate: string; rangeText: string } {
  const baseStart = new Date(termStartDateStr);
  const baseDayOfWeek = baseStart.getDay();
  const distanceToMonday = (baseDayOfWeek + 6) % 7;
  const firstMonday = new Date(baseStart);
  firstMonday.setDate(firstMonday.getDate() - distanceToMonday);

  const weekMonday = new Date(firstMonday);
  weekMonday.setDate(weekMonday.getDate() + (weekNumber - 1) * 7);

  const weekFriday = new Date(weekMonday);
  weekFriday.setDate(weekFriday.getDate() + 4);

  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const mon = fmt(weekMonday);
  const fri = fmt(weekFriday);
  return {
    mondayDate: mon,
    fridayDate: fri,
    rangeText: `${mon} - ${fri}`
  };
}

/**
 * Syllabus Drop-Down Method Timetable Connection Toggle
 */
export function isTimetableConnectedToDropdown(): boolean {
  try {
    const val = safeLocalStorage.getItem(TOGGLE_STORAGE_KEY);
    return val === 'true';
  } catch (e) {
    return false;
  }
}

export function setTimetableConnectedToDropdown(enabled: boolean): void {
  try {
    safeLocalStorage.setItem(TOGGLE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Error setting timetable toggle:', e);
  }
}
