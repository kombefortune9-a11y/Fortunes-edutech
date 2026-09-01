/**
 * Utility functions for parsing, cleaning, and extracting components
 * from raw syllabus competency strings that may contain piped metadata
 * such as | Expected Standard: ... | Learning Activities: ...
 */

export interface ParsedCompetencyData {
  briefCompetency: string; // Brief competency statement without piped metadata
  expectedStandard?: string;
  learningActivities?: string[];
  knowledge?: string;
  skills?: string;
  values?: string;
}

/**
 * Parses a single raw competency string (which may contain piped segments)
 */
export function parseRawCompetency(raw: string): ParsedCompetencyData {
  if (!raw || typeof raw !== 'string') {
    return { briefCompetency: '' };
  }

  const parts = raw.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return { briefCompetency: '' };

  const briefCompetency = parts[0].trim();
  let expectedStandard: string | undefined = undefined;
  let learningActivities: string[] | undefined = undefined;
  let knowledge: string | undefined = undefined;
  let skills: string | undefined = undefined;
  let values: string | undefined = undefined;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (/^expected\s*standards?\s*:/i.test(part)) {
      expectedStandard = part.replace(/^expected\s*standards?\s*:\s*/i, '').trim();
    } else if (/^learning\s*activities\s*:/i.test(part)) {
      const actStr = part.replace(/^learning\s*activities\s*:\s*/i, '').trim();
      if (actStr) {
        learningActivities = actStr.split(';').map(a => a.trim()).filter(Boolean);
      }
    } else if (/^(\[?knowledge\]?)\s*:/i.test(part)) {
      knowledge = part.replace(/^\[?knowledge\]?\s*:\s*/i, '').trim();
    } else if (/^(\[?skills?\]?)\s*:/i.test(part)) {
      skills = part.replace(/^\[?skills?\]?\s*:\s*/i, '').trim();
    } else if (/^(\[?values?\]?)\s*:/i.test(part)) {
      values = part.replace(/^\[?values?\]?\s*:\s*/i, '').trim();
    }
  }

  return {
    briefCompetency,
    expectedStandard,
    learningActivities,
    knowledge,
    skills,
    values
  };
}

/**
 * Returns only the brief competency statement from a raw string or multiline text
 */
export function extractBriefCompetencies(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map(line => parseRawCompetency(line).briefCompetency)
    .filter(Boolean)
    .join('\n');
}

/**
 * Extracts all expected standards embedded in raw competency strings/text
 */
export function extractEmbeddedExpectedStandards(rawText: string | string[]): string[] {
  const lines = Array.isArray(rawText) ? rawText : (rawText || '').split('\n');
  const standards: string[] = [];
  lines.forEach(line => {
    const parsed = parseRawCompetency(line);
    if (parsed.expectedStandard) {
      standards.push(parsed.expectedStandard);
    }
  });
  return standards;
}

/**
 * Extracts all learning activities embedded in raw competency strings/text
 */
export function extractEmbeddedLearningActivities(rawText: string | string[]): string[] {
  const lines = Array.isArray(rawText) ? rawText : (rawText || '').split('\n');
  const activities: string[] = [];
  lines.forEach(line => {
    const parsed = parseRawCompetency(line);
    if (parsed.learningActivities && parsed.learningActivities.length > 0) {
      activities.push(...parsed.learningActivities);
    }
  });
  return activities;
}

/**
 * Formats General Competencies into concise short form,
 * trimming out long explanatory clauses (e.g. "by identifying...", "through discussing...").
 */
export function formatGeneralCompetenciesShortForm(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const rawLines = text.split(/\n|<br\s*\/?>/i);
  const resultLines: string[] = [];

  for (const line of rawLines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    const bulletMatch = trimmed.match(/^([•\-\*]|&bull;)\s*/);
    const bullet = bulletMatch ? '- ' : '';
    let content = trimmed.replace(/^([•\-\*]|&bull;)\s*/, '').trim();

    // Strip long explanatory clauses that turn short skills into full sentences
    content = content
      .replace(/\s+(by|through|in order to|towards|so as to|for overall|to enable)\s+[\s\S]*/i, '')
      .replace(/\s+and\s+their\s+(functions|uses|applications).*/i, '')
      .replace(/[\.,;:]+$/, '')
      .trim();

    if (content) {
      resultLines.push(`${bullet}${content}`);
    }
  }

  if (resultLines.length === 0 && text.trim()) {
    let content = text.trim()
      .replace(/^([•\-\*]|&bull;)\s*/, '')
      .replace(/\s+(by|through|in order to|towards|so as to|for overall|to enable)\s+[\s\S]*/i, '')
      .replace(/[\.,;:]+$/, '')
      .trim();
    return content;
  }

  return resultLines.join('\n');
}

/**
 * Constructs the exact official syllabus citation reference format based on Curriculum (CBC vs OBC),
 * Grade level, Subject name, and optional page number according to national CDC guidelines.
 * Format: Direct string (no '>'), with CDC immediately after the subject then the year.
 * Special Rule: Oral English and Literacy in English use English Language as their main syllabus source, followed by secondary PLP references.
 * Page Rule: Uses exact page number if located; otherwise uses dotted lines 'page .....'.
 */
export function getOfficialSyllabusCitation(
  grade: string,
  subject: string,
  curriculumType: 'CBC' | 'OBC' | string = 'CBC',
  page?: string | number
): string {
  const gNorm = (grade || '').trim();
  const gLow = gNorm.toLowerCase();
  const sRaw = (subject || '').trim() || 'Subject';
  const sLow = sRaw.toLowerCase();

  // Special rule: Oral English and Literacy in English fall under "English Language" as main subject
  const isOral = sLow.includes('oral english') || sLow.includes('oral component');
  const isLiteracy = sLow.includes('literacy') || sLow.includes('english literacy');
  const primarySubject = (isOral || isLiteracy) ? 'English Language' : sRaw;

  // Format page string: use exact page number if provided & valid; otherwise use dotted lines 'page .....'
  const pClean = page !== undefined && page !== null ? String(page).trim() : '';
  const pageStr = (pClean !== '' && pClean !== '.....' && !pClean.includes('....')) ? `page ${pClean}` : 'page .....';
  const isOBC = curriculumType === 'OBC';

  let primaryCitation = '';

  if (isOBC) {
    // OUTCOME BASED CURRICULUM (OBC) - 2013 Syllabus
    if (gLow.includes('ece') || gLow.includes('baby') || gLow.includes('middle') || gLow.includes('reception') || gLow.includes('3-5')) {
      primaryCitation = `ECE 3-5 Year ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    } else if (
      gLow.includes('grade 1') || gLow.includes('grade 2') || gLow.includes('grade 3') || gLow.includes('grade 4') ||
      gLow.includes('lower primary') || gLow === '1' || gLow === '2' || gLow === '3' || gLow === '4'
    ) {
      primaryCitation = `Grade 1-4 lower primary ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    } else if (
      gLow.includes('grade 5') || gLow.includes('grade 6') || gLow.includes('grade 7') ||
      gLow.includes('upper primary') || gLow === '5' || gLow === '6' || gLow === '7'
    ) {
      primaryCitation = `Grade 5-7 upper primary ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    } else if (gLow.includes('grade 8') || gLow.includes('grade 9') || gLow.includes('junior')) {
      primaryCitation = `Grade 8-9 ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    } else if (
      gLow.includes('grade 10') || gLow.includes('grade 11') || gLow.includes('grade 12') ||
      gLow.includes('form') || gLow.includes('senior')
    ) {
      primaryCitation = `Grade 10-12 ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    } else {
      primaryCitation = `Grade 1-4 lower primary ${primarySubject} CDC 2013 syllabus ${pageStr}`;
    }
  } else {
    // COMPETENCY BASED CURRICULUM (CBC) - 2024-2025 Syllabus
    if (gLow.includes('ece') || gLow.includes('baby') || gLow.includes('middle') || gLow.includes('reception') || gLow.includes('3-5')) {
      primaryCitation = `Early childhood education syllabi 3-5-Year ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    } else if (
      gLow.includes('grade 1') || gLow.includes('grade 2') || gLow.includes('grade 3') ||
      gLow.includes('lower primary') || gLow === '1' || gLow === '2' || gLow === '3'
    ) {
      primaryCitation = `Grade 1-3 lower primary ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    } else if (
      gLow.includes('grade 4') || gLow.includes('grade 5') || gLow.includes('grade 6') ||
      gLow.includes('upper primary') || gLow === '4' || gLow === '5' || gLow === '6'
    ) {
      primaryCitation = `Grade 4-6 upper primary ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    } else if (
      gLow.includes('form 5') || gLow.includes('form 6') || gLow.includes('advanced') ||
      gLow.includes('grade 11') || gLow.includes('grade 12')
    ) {
      primaryCitation = `Form 5-6 Advanced ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    } else if (
      gLow.includes('form') || gLow.includes('grade 7') || gLow.includes('grade 8') ||
      gLow.includes('grade 9') || gLow.includes('grade 10') || gLow.includes('secondary')
    ) {
      primaryCitation = `Form 1 - 4 ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    } else {
      primaryCitation = `Grade 1-3 lower primary ${primarySubject} CDC 2024-2025 CBC syllabus ${pageStr}`;
    }
  }

  // Secondary citation for Oral English or Literacy components
  if (isOral) {
    return `${primaryCitation}; PLP Oral English Teaching Module`;
  } else if (isLiteracy) {
    return `${primaryCitation}; PLP National Literacy Teaching Module`;
  }

  return primaryCitation;
}

import { SYLLABI } from '../data/syllabi';

export function getCompetenciesForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string[] {
  if (!grade || !subject) return [`Demonstrate competence in ${subtopicTitle}`];
  
  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          const comps = sub.competencies || (sub as any).outcomes || [];
          return comps.map((c: any) => parseRawCompetency(typeof c === 'string' ? c : String(c)).briefCompetency);
        }
      }
    }
  }
  return [`Demonstrate competence in ${subtopicTitle}`];
}

export function getExpectedStandardsForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string {
  if (!grade || !subject) return 'Learners demonstrate mastery of topic skills.';

  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          const exp = sub.expectedStandard || (sub as any).expectedStandards;
          if (exp) {
            return Array.isArray(exp) ? exp.join('; ') : String(exp);
          }
        }
      }
    }
  }
  return 'Learners demonstrate mastery of topic skills accurately according to syllabus standards.';
}

export function getActivitiesForSubtopic(topicTitle: string, subtopicTitle: string, _competencyTitle?: string, grade?: string, subject?: string): string[] {
  if (!grade || !subject) {
    return [
      `Observing, listening to, and discussing model examples on ${subtopicTitle}`,
      `Practicing core skills and practical routines in ${subtopicTitle}`,
      `Demonstrating understanding through individual exercises on ${subtopicTitle}`
    ];
  }

  const rawSyllabi = SYLLABI[grade]?.[subject] || SYLLABI[grade]?.[subject.toLowerCase()] || [];
  for (const topic of rawSyllabi) {
    if (topic.title.toLowerCase().includes(topicTitle.toLowerCase()) || topicTitle.toLowerCase().includes(topic.title.toLowerCase())) {
      for (const sub of (topic.subtopics || [])) {
        const title = sub.title || (sub as any).name || '';
        if (title.toLowerCase().includes(subtopicTitle.toLowerCase()) || subtopicTitle.toLowerCase().includes(title.toLowerCase())) {
          if (sub.learningActivities && Array.isArray(sub.learningActivities) && sub.learningActivities.length > 0) {
            return sub.learningActivities;
          }
          // Check embedded learning activities in competencies
          const comps = sub.competencies || (sub as any).outcomes || [];
          const embedded = extractEmbeddedLearningActivities(comps);
          if (embedded.length > 0) return embedded;
        }
      }
    }
  }

  return [
    `Identifying key concepts and vocabulary related to ${subtopicTitle}`,
    `Engaging in guided practical exercises, group tasks, and role-playing on ${subtopicTitle}`,
    `Solving problems, drawing diagrams, or writing compositions to demonstrate mastery of ${subtopicTitle}`
  ];
}
