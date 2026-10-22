import { SYLLABI } from '../data/syllabi';
import {
  deriveExpectedStandardFromCompetency,
  deriveLearningActivitiesFromCompetency,
  deriveKnowledgeFromOutcome,
  deriveSkillsFromOutcome,
  deriveValuesFromOutcome,
  getOfficialSyllabusCitation,
  parseRawCompetency,
} from './competencyUtils';

export function getVariedTeachingMethods(dayIndex: number, subtopic?: string): string {
  const dIdx = Math.max(0, dayIndex) % 5;
  const isPractical = /measure|shape|experiment|art|graph|draw|construct|area|time|fraction|math/i.test(subtopic || '');

  if (isPractical) {
    switch (dIdx) {
      case 0:
        return '• Teacher demonstration • Exposition • Direct modeling';
      case 1:
        return '• Guided discovery • Hands-on exploration • Question & answer';
      case 2:
        return '• Group practical activity • Investigation • Collaborative task';
      case 3:
        return '• Problem solving • Individual practice • Applied task';
      case 4:
      default:
        return '• Practical exhibition • Peer evaluation • Consolidation';
    }
  }

  switch (dIdx) {
    case 0:
      return '• Teacher modeling • Demonstration • Guided questioning • Exposition';
    case 1:
      return '• Guided discovery • Question and answer • Think-pair-share • Class discussion';
    case 2:
      return '• Group work • Peer investigation • Practical activity • Problem-solving';
    case 3:
      return '• Independent inquiry • Guided practice • Individual task • Problem solving';
    case 4:
    default:
      return '• Learner demonstration • Class presentation • Formative review • Reflection';
  }
}

export function getConciseTeachingAids(dayIndex: number, subtopic?: string): string {
  const dIdx = Math.max(0, dayIndex) % 5;
  const sLow = (subtopic || '').toLowerCase();

  if (sLow.includes('time') || sLow.includes('area') || sLow.includes('measure')) {
    switch (dIdx) {
      case 0: return 'Wall clock, squared grids, chalkboard';
      case 1: return 'Time flashcards, grid tiles, notebooks';
      case 2: return 'Cardboard clock faces, grid sheets, rulers';
      case 3: return 'Learner textbooks, calculation worksheets';
      case 4: default: return 'Time & area charts, assessment checklist';
    }
  }

  if (sLow.includes('shape') || sLow.includes('angle') || sLow.includes('geometry')) {
    switch (dIdx) {
      case 0: return 'Solid shape models, protractor, chalkboard';
      case 1: return 'Angle flashcards, cut-out shapes, notebooks';
      case 2: return 'Cardboard nets, set squares, geometric models';
      case 3: return 'Textbooks, drawing instruments, worksheets';
      case 4: default: return 'Shape charts, rubric checklist';
    }
  }

  if (sLow.includes('graph') || sLow.includes('data') || sLow.includes('statist')) {
    switch (dIdx) {
      case 0: return 'Bar graph charts, tally charts, chalkboard';
      case 1: return 'Frequency tables, flashcards, notebooks';
      case 2: return 'Grid paper, group task cards, rulers';
      case 3: return 'Learner textbooks, plotting worksheets';
      case 4: default: return 'Sample graphs, evaluation rubrics';
    }
  }

  switch (dIdx) {
    case 0: return 'Wall charts, real objects/models, chalkboard';
    case 1: return 'Flashcards, sentence strips, learner notebooks';
    case 2: return 'Group task cards, counters/manipulatives';
    case 3: return 'Learner textbooks, exercise worksheets';
    case 4: default: return 'Evaluation rubrics, sample artifacts, chalkboard';
  }
}

/**
 * Parser for outside source Schemes of Work pasted into the instructions / additional context box.
 * Supports:
 * 1. Markdown tables (| Week | Topic | Subtopic | ...)
 * 2. Tab-delimited tables (copied from Excel, Word, Google Docs)
 * 3. Structured plain text (Week 1, Week 2, ... with Topic:, Subtopic:, Outcomes:, etc.)
 */

export interface ParsedSchemeWeek {
  week: number;
  weekLabel?: string;
  dateRange?: string;
  dates?: string;
  component?: string;
  topic: string;
  topic2?: string;
  topic3?: string;
  subtopics: string[];
  competencies: string[];
  knowledge?: string[];
  skills?: string[];
  values?: string[];
  expectedStandards: string[];
  activities: string[];
  methods: string[];
  teachingAids: string;
  references: string;
}

/**
 * Resolves an outcome code (e.g. 3.5.1.3 or 3.2.5.1) or text to its official parent Topic and Subtopic from the syllabus.
 */
export function lookupTopicAndSubtopicByOutcome(
  outcomeText: string,
  grade?: string,
  subject?: string
): { topic: string; subtopic: string; matchedOutcome?: string } | null {
  if (!outcomeText || typeof outcomeText !== 'string') return null;
  const match = outcomeText.match(/\b(\d+(?:\.\d+){2,3})\b/);
  const code = match ? match[1] : null;

  const normGrade = (grade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normSubject = (subject || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const gKey of Object.keys(SYLLABI)) {
    const normGKey = gKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normGrade && !normGKey.includes(normGrade.slice(0, 5)) && !normGrade.includes(normGKey.slice(0, 5))) continue;
    const gObj = SYLLABI[gKey];
    for (const sKey of Object.keys(gObj)) {
      const normSKey = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normSubject && !normSKey.includes(normSubject.slice(0, 5)) && !normSubject.includes(normSKey.slice(0, 5))) continue;
      const topics = gObj[sKey];
      for (const t of topics) {
        for (const st of (t.subtopics || [])) {
          for (const comp of (st.competencies || [])) {
            if ((code && comp.includes(code)) || comp.toLowerCase().includes(outcomeText.toLowerCase().substring(0, 25))) {
              return { topic: t.title, subtopic: st.title, matchedOutcome: comp };
            }
          }
        }
      }
    }
  }

  // Global search across all syllabi if specific grade/subject didn't match
  if (code) {
    for (const gKey of Object.keys(SYLLABI)) {
      const gObj = SYLLABI[gKey];
      for (const sKey of Object.keys(gObj)) {
        const topics = gObj[sKey];
        for (const t of topics) {
          for (const st of (t.subtopics || [])) {
            for (const comp of (st.competencies || [])) {
              if (comp.includes(code)) {
                return { topic: t.title, subtopic: st.title, matchedOutcome: comp };
              }
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Checks if the provided text contains pasted outside source schemes of work, weekly forecasts, or multi-week/day definitions.
 */
export function isPastedOutsideSchemes(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // Explicit keywords
  if (
    lower.includes('outside source') || 
    lower.includes('outsider source') || 
    lower.includes('external scheme') ||
    lower.includes('pasted schemes') ||
    lower.includes('pasted forecast') ||
    lower.includes('pasted weekly forecast') ||
    lower.includes('pasted lesson') ||
    lower.includes('pasted from outside') ||
    lower.includes('weekly forecast')
  ) {
    return true;
  }

  // Multi-week definitions in text or tables
  const hasWeek1 = /(?:^|[|\n\r\s*#])(?:week|wk)\s*1\b/i.test(text);
  const hasWeek2 = /(?:^|[|\n\r\s*#])(?:week|wk)\s*2\b/i.test(text);
  const hasWeek3 = /(?:^|[|\n\r\s*#])(?:week|wk)\s*3\b/i.test(text);

  if ((hasWeek1 && hasWeek2) || (hasWeek1 && hasWeek3) || (hasWeek2 && hasWeek3)) {
    return true;
  }

  // Day definitions for Weekly Forecast tables
  const hasDay1 = /(?:^|[|\n\r\s*#])(?:day)\s*1\b/i.test(text);
  const hasDay2 = /(?:^|[|\n\r\s*#])(?:day)\s*2\b/i.test(text);
  if (hasDay1 && hasDay2) {
    return true;
  }

  // Table with Markdown pipes or tab separations
  const lines = text.split('\n');
  const pipeTableLines = lines.filter(l => (l.match(/\|/g) || []).length >= 3);
  if (pipeTableLines.length >= 2) {
    return true;
  }

  return false;
}

export function cleanCellContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, ' • ')
    .replace(/<\/p>/gi, ' • ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z0-9]+;/gi, ' ')
    .replace(/\s*•\s*•\s*/g, ' • ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Proportionally maps each of the week's days (e.g. 5 days) to a subtopic index (0 .. numSubs - 1),
 * guaranteeing that EVERY subtopic present in that week appears on at least one day without leaving any out.
 */
export function getSubtopicIndicesForDays(numSubs: number, numDays: number = 5): number[] {
  if (numSubs <= 1) return Array(numDays).fill(0);
  const result: number[] = [];
  if (numSubs >= numDays) {
    for (let d = 0; d < numDays; d++) {
      result.push(Math.min(d, numSubs - 1));
    }
  } else {
    for (let d = 0; d < numDays; d++) {
      const idx = Math.min(Math.floor((d / numDays) * numSubs), numSubs - 1);
      result.push(idx);
    }
    // Guarantee that every subtopic 0 .. numSubs - 1 is present in result
    for (let s = 0; s < numSubs; s++) {
      if (!result.includes(s)) {
        result[numDays - numSubs + s] = s;
      }
    }
  }
  return result;
}

/**
 * Splits any string or list of subtopics into an exhaustive, flat array of distinct subtopics.
 * Handles:
 * - Line breaks (\n, \r\n, <br>, <br/>, </p><p>)
 * - Numbered subtopic codes (e.g. "3.9.1 Tell time at specified intervals 3.9.2 Read and use the calendar")
 * - Bullet characters (•, -, *)
 * - Semicolons (;) and delimiters
 * - Numbered lists (1. ... 2. ... or (a) ... (b) ... or i) ... ii) ...)
 */
export function splitSubtopicsIntoArray(rawInput: string | string[]): string[] {
  if (!rawInput) return [];
  const rawList = Array.isArray(rawInput) ? rawInput : [rawInput];
  const results: string[] = [];

  for (const item of rawList) {
    if (!item) continue;
    const str = typeof item === 'string' ? item : String(item);
    
    // Normalize HTML tags & linebreaks
    const normalized = str
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(?:p|div|tr|td|li|ul|ol|small|b|strong|i|em|span)[^>]*>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      .trim();

    const lineParts = normalized.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lineParts) {
      // 1. Check if line contains bullet delimiter " • "
      if (line.includes(' • ')) {
        const bulletParts = line.split(' • ').map(p => p.trim()).filter(Boolean);
        for (const bp of bulletParts) {
          results.push(...splitSubtopicsIntoArray(bp));
        }
        continue;
      }

      // 2. Check if line contains 2 or more 3-part or 2-part numbered subtopics, e.g.
      // "3.9.1 Tell time at specified intervals 3.9.2 Read and use the calendar"
      // or "3.9.1 Tell time at specified intervals and 3.9.2 Read and use the calendar"
      const multiSubMatches = line.match(/\b\d+\.\d+(?:\.\d+)?\b/g);
      if (multiSubMatches && multiSubMatches.length > 1) {
        // Normalize delimiters before subtopic numbers
        const normSubLine = line
          .replace(/[\s,;•\-\*]+(?=\d+\.\d+(?:\.\d+)?\b)/g, ' ')
          .replace(/\s+and\s+(?=\d+\.\d+(?:\.\d+)?\b)/gi, ' ');
        const parts = normSubLine.split(/(?=(?:^|\s)\d+\.\d+(?:\.\d+)?\b)/).map(p => {
          return p.trim().replace(/^[\s,;:\/&•\-\*]+/, '').replace(/[\s,;:\/&•\-\*]+$/, '').trim();
        }).filter(p => p && p !== 'and');
        if (parts.length > 1) {
          for (const p of parts) {
            results.push(p);
          }
          continue;
        }
      }

      // 3. Check for numbered list indicators e.g. "1. Subtopic A 2. Subtopic B" or "(a) ... (b) ..."
      const listMatches = line.match(/(?:^|\s)(?:(?:\d+|[a-e]|i{1,3}|iv|v)[\.\)]\s+)/gi);
      if (listMatches && listMatches.length > 1) {
        const parts = line.split(/(?=(?:^|\s)(?:(?:\d+|[a-e]|i{1,3}|iv|v)[\.\)]\s+))/i).map(p => {
          return p.trim().replace(/^[\s,;:\/&•\-\*]+/, '').trim();
        }).filter(Boolean);
        if (parts.length > 1) {
          for (const p of parts) {
            results.push(p);
          }
          continue;
        }
      }

      // 4. Check for semicolon separator e.g. "Tell time at specified intervals; Read and use the calendar"
      if (line.includes(';')) {
        const semiParts = line.split(';').map(p => p.trim()).filter(Boolean);
        if (semiParts.length > 1 && semiParts.every(p => p.length >= 3)) {
          for (const sp of semiParts) {
            results.push(sp);
          }
          continue;
        }
      }

      results.push(line);
    }
  }

  return results
    .map(s => s.replace(/^[•\-\*\s]+/, '').replace(/[*_#]+$/, '').trim())
    .filter(Boolean);
}

/**
 * Parses raw text from a TOPIC/Subtopics cell into distinct topic and subtopics.
 * Handles HTML formatting (<small><b>1. Subtopic</b></small>), Markdown bold, or numbered lists.
 */
export function splitTopicAndSubtopics(
  rawCellText: string,
  grade?: string,
  subject?: string
): { topic: string; subtopics: string[] } {
  if (!rawCellText) return { topic: '', subtopics: [] };

  const cleaned = rawCellText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:small|b|strong|i|em|span|p|div)[^>]*>/gi, '')
    .trim();

  let lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  
  // If only 1 line, check if topic and subtopic are separated by bullet (e.g. "3.8 FRACTIONS • 3.8.2 Draw and shade proper fractions")
  if (lines.length === 1) {
    const singleLine = lines[0];
    if (singleLine.includes(' • ')) {
      lines = singleLine.split(' • ').map(l => l.trim()).filter(Boolean);
    } else if (/\b\d+\.\d+\.\d+\b/.test(singleLine)) {
      // Split by numbered subtopics e.g. "3.9 MEASURES 3.9.1 Tell time at specified intervals 3.9.2 Read and use the calendar"
      const parts = singleLine.split(/(?=\b\d+\.\d+\.\d+\b)/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        lines = parts;
      }
    }
  }

  if (lines.length === 0) return { topic: '', subtopics: [] };

  let mainTopic = lines[0].replace(/^[#*_\-\s]+/, '').replace(/[*_#]+$/, '').trim();
  const subtopics: string[] = [];

  // Check if mainTopic starts with a 4-level outcome code (e.g. 3.5.1.3 or 3.2.5.1) and NOT a main topic
  const outcomeMatch = mainTopic.match(/^(\d+\.\d+\.\d+\.\d+)/);
  if (outcomeMatch) {
    const resolved = lookupTopicAndSubtopicByOutcome(mainTopic, grade, subject);
    if (resolved) {
      return {
        topic: cleanExtractedTopic(resolved.topic, subject) || resolved.topic,
        subtopics: cleanExtractedSubtopics([resolved.subtopic], subject)
      };
    }
  }

  // Check if first line contains a slash or colon separating topic and subtopic, e.g. "FRACTIONS: Addition"
  if (lines.length === 1) {
    if (mainTopic.includes(':') && !mainTopic.toLowerCase().startsWith('http')) {
      const parts = mainTopic.split(':');
      mainTopic = parts[0].trim();
      const subParts = parts.slice(1).join(':').split(/,|;/).map(s => s.trim()).filter(Boolean);
      subtopics.push(...subParts);
    } else if (mainTopic.includes(' / ')) {
      const parts = mainTopic.split(' / ');
      mainTopic = parts[0].trim();
      subtopics.push(...parts.slice(1).map(s => s.trim()).filter(Boolean));
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Strip bullet symbol only, but strictly PRESERVE numerical sequence prefixes (e.g. 3.8.1 or 1.1)
    const stripped = rawLine
      .replace(/^[•\-\*]\s*/, '')
      .replace(/[*_#]+$/, '')
      .trim();
    if (stripped) {
      const splitSubs = splitSubtopicsIntoArray(stripped);
      if (splitSubs.length > 0) {
        subtopics.push(...splitSubs);
      } else {
        subtopics.push(stripped);
      }
    }
  }

  // If no subtopics extracted from secondary lines, and topic contains numbers like "1. Subtopic"
  if (subtopics.length === 0 && lines.length > 1) {
    subtopics.push(...splitSubtopicsIntoArray(lines.slice(1)));
  }

  const cleanedTopic = cleanExtractedTopic(mainTopic, subject) || mainTopic;
  const cleanedSubs = cleanExtractedSubtopics(subtopics, subject);

  return { topic: cleanedTopic, subtopics: cleanedSubs };
}

/**
 * Normalizes HTML tables into markdown-like pipe tables if HTML was pasted or saved.
 */
export function normalizeHtmlToMarkdownTable(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Clean HTML entities across text
  const cleanEntities = (str: string) => {
    return str
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-z0-9]+;/gi, ' ');
  };

  let cleaned = cleanEntities(text);

  if (cleaned.includes('<table') || cleaned.includes('<tr')) {
    cleaned = cleaned.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, rowContent) => {
      const cellMatches = Array.from(rowContent.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi));
      if (cellMatches.length === 0) return '';
      const cells = cellMatches.map(m => {
        const raw = (m[1] as string)
          .replace(/<br\s*\/?>/gi, ' <br> ')
          .replace(/<p[^>]*>/gi, '')
          .replace(/<\/p>/gi, ' <br> ')
          .replace(/<[^>]*>/g, ' ');
        return cleanEntities(raw).replace(/[\r\n]+/g, ' ').replace(/[ \t]+/g, ' ').trim();
      });
      return '| ' + cells.join(' | ') + ' |\n';
    });
  }

  // Also convert tab-separated values (TSV) from Excel / Word / Google Sheets into markdown pipe tables
  if (cleaned.includes('\t')) {
    const rawLines = cleaned.split('\n');
    const tsvConverted = rawLines.map(line => {
      if (!line.includes('\t')) return line;
      const cells = line.split('\t').map(c => c.trim());
      if (cells.length >= 2) {
        return '| ' + cells.join(' | ') + ' |';
      }
      return line;
    });
    cleaned = tsvConverted.join('\n');
  }

  return cleaned;
}

export function isMetadataOrHeaderRow(cells: string[]): boolean {
  const cleanCells = cells.map(c => c.replace(/[*_`#]/g, '').replace(/<[^>]*>/g, '').trim());
  const rowText = cleanCells.join(' ').trim();
  if (!rowText) return true;

  // 1. Check if row consists of table column header keywords
  const headerMatches = cleanCells.filter(c => 
    /^(week|wk|period|date|topic|sub-?topic|component|outcome|competency|specific\s*outcomes?|knowledge|content|skills?|values?|attitudes?|expected\s*standards?|activit(y|ies)|methods?|strategies|t\/l\s*aids?|teaching\s*aids?|references?|ref)$/i.test(c)
  ).length;
  if (headerMatches >= 2) return true;

  // 2. Check if row is document metadata (e.g. GRADE | 3 (OBC) | SUBJECT | Integrated Science | TERM | 1)
  const containsDocMetaKey = cleanCells.some(c => 
    /^(grade|subject|term|teacher|school|academic\s*year|class|scheme\s*of\s*work|weekly\s*forecast)$/i.test(c)
  ) || /^\s*(grade|subject|term|teacher|school|class)\s*[:\-\|\t]/i.test(rowText);

  const hasExplicitWeekLabel = cleanCells.some(c => /\b(?:week|wk)\s*\d{1,2}\b/i.test(c));

  if (containsDocMetaKey && !hasExplicitWeekLabel) {
    return true;
  }

  return false;
}

export function cleanExtractedTopic(topic: string, subject?: string): string {
  if (!topic) return '';
  let cleaned = topic.trim();
  
  // SPECIAL RULE FOR LITERACY IN ENGLISH: Phonics is NOT a topic. Topic is strictly "sounds".
  const isEnglishOrLiteracy = subject && (subject.toLowerCase().includes('literacy') || subject.toLowerCase().includes('english') || subject.toLowerCase().includes('sound'));
  if (isEnglishOrLiteracy) {
    if (cleaned.toLowerCase().includes('phonic') || cleaned.toLowerCase().includes('sound') || /^[a-zA-Z]$/.test(cleaned)) {
      return 'sounds';
    }
  }

  if (/^(grade|subject|term|class|teacher|school|scheme\s*of\s*work|weekly\s*forecast)\b/i.test(cleaned) ||
      /^\s*grade\s*\d*\s*\(?(?:cbc|obc)?\)?\s*$/i.test(cleaned)) {
    if (cleaned.length < 40 && !/\b(topic|fractions?|weathering|matter|living|energy|numbers?|measurement|shapes?|geometry|algebra|reading|writing|counting|addition|subtraction|multiplication|division|sets?|time|money|data|handling)\b/i.test(cleaned)) {
      return '';
    }
  }
  if (/^(english|english language|primary english|oral english|literacy in english|mathematics|math|maths|integrated science|science|social studies|creative and technology studies|creative & technology studies|cts|technology studies|zambian language|zambian languages|home economics|expressive arts|physical education|community studies)\s*$/i.test(cleaned)) {
    return '';
  }
  if (subject && cleaned.toLowerCase() === subject.trim().toLowerCase()) {
    return '';
  }
  return cleaned;
}

export function cleanExtractedSubtopics(subtopics: string[], subject?: string): string[] {
  const flattened = splitSubtopicsIntoArray(subtopics);
  const isEnglishOrLiteracy = subject && (subject.toLowerCase().includes('literacy') || subject.toLowerCase().includes('english') || subject.toLowerCase().includes('sound'));
  return flattened.filter(st => {
    const clean = st.trim();
    if (!clean) return false;
    if (/^(grade|subject|term|class|teacher|school|\d+\s*\(obc\)|\d+\s*\(cbc\))\b/i.test(clean) && clean.length < 35 && !/\b(fractions?|weathering|matter|living|energy|numbers?|measurement|shapes?|addition|subtraction)\b/i.test(clean)) {
      return false;
    }
    if (/^\s*\d+\s*\(?(?:obc|cbc)?\)?\s*$/i.test(clean)) return false;
    if (/^(english|english language|primary english|oral english|literacy in english|mathematics|math|maths|integrated science|science|social studies|creative and technology studies|creative & technology studies|cts|technology studies|zambian language|zambian languages|home economics|expressive arts|physical education|community studies)\s*$/i.test(clean)) {
      return false;
    }
    if (subject && clean.toLowerCase() === subject.trim().toLowerCase()) {
      return false;
    }
    return true;
  }).map(st => {
    let clean = st.trim();
    if (isEnglishOrLiteracy) {
      if (/^[a-zA-Z]$/.test(clean)) {
        return `sound ${clean.toLowerCase()}`;
      }
      if (/^\/[a-zA-Z]\/$/.test(clean)) {
        return `sound ${clean.charAt(1).toLowerCase()}`;
      }
      clean = clean.replace(/phonics?\s*/gi, '').replace(/\s+/g, ' ').trim();
      if (clean.toLowerCase().startsWith('letter ')) {
        clean = 'sound ' + clean.substring(7);
      }
      if (!clean.toLowerCase().startsWith('sound') && clean.length <= 15) {
        if (clean.includes(' and ')) {
          const parts = clean.split(' and ');
          return parts.map(p => p.toLowerCase().startsWith('sound') ? p : `sound ${p}`).join(' and ');
        }
        clean = `sound ${clean}`;
      }
    }
    return clean;
  });
}

export function cleanExtractedCompetencies(competencies: string[]): string[] {
  return competencies
    .map(c => {
      let cleaned = typeof c === 'string' ? c.trim() : String(c).trim();
      cleaned = cleaned.replace(/^(?:subject|grade|term|class)\s*:\s*[^,\n•]+[,\n•]?\s*/gi, '');
      return cleaned.trim();
    })
    .filter(c => {
      if (!c) return false;
      if (/^(subject|grade|term|class)\s*:\s*/i.test(c)) return false;
      if (/^(mathematics|integrated science|english|social studies|expressive arts|technology studies|zambian language|home economics)\s*$/i.test(c)) return false;
      return true;
    });
}

/**
 * Helper to split embedded Knowledge, Skills, and Values from a single combined text/cell
 */
export function splitContentIntoKnowledgeSkillsValues(rawText: string): { knowledge?: string; skills?: string; values?: string } {
  if (!rawText || typeof rawText !== 'string') return {};
  const t = rawText.trim();
  const kMatch = t.match(/(?:^|\*|\b)knowledge\s*[:\-]\s*([^;*\n]+(?:;[^;*\n]+)*?)(?=\s*(?:\*|\b)(?:skills?|values?|methods?)|$)/i);
  const sMatch = t.match(/(?:^|\*|\b)skills?\s*[:\-]\s*([^;*\n]+(?:;[^;*\n]+)*?)(?=\s*(?:\*|\b)(?:knowledge|values?|methods?)|$)/i);
  const vMatch = t.match(/(?:^|\*|\b)values?\s*[:\-]\s*([^;*\n]+(?:;[^;*\n]+)*?)(?=\s*(?:\*|\b)(?:knowledge|skills?|methods?)|$)/i);

  return {
    knowledge: kMatch ? kMatch[1].trim() : undefined,
    skills: sMatch ? sMatch[1].trim() : undefined,
    values: vMatch ? vMatch[1].trim() : undefined
  };
}

/**
 * Parses markdown table format
 */
function parseMarkdownTable(markdown: string, grade?: string, subject?: string, curriculumType?: string): ParsedSchemeWeek[] | null {
  try {
    const normalized = normalizeHtmlToMarkdownTable(markdown);
    const lines = normalized.split('\n');
    const tableLines = lines.filter(l => {
      const trimmed = l.trim();
      return (trimmed.match(/\|/g) || []).length >= 2;
    });
    if (tableLines.length < 3) return null;

    // Detect header row to determine dynamic column positions
    const headerRow = tableLines.find(l => /week|day|topic|competenc|outcome/i.test(l)) || tableLines[0];
    let headerCells = headerRow.split('|').map(c => c.trim().toLowerCase());
    if (headerCells[0] === '') headerCells.shift();
    if (headerCells[headerCells.length - 1] === '') headerCells.pop();

    const weekIdx = headerCells.findIndex(c => c.includes('week') || c.includes('day'));
    const compHeaderIdx = headerCells.findIndex(c => c === 'comp' || c.includes('component'));
    const mergedTopicSubIdx = headerCells.findIndex(c => 
      (c.includes('topic') && c.includes('sub')) || 
      c.includes('topic/sub') || 
      c.includes('topic / sub')
    );
    const topicIdx = mergedTopicSubIdx >= 0 
      ? mergedTopicSubIdx 
      : headerCells.findIndex(c => (c.includes('topic') || c.includes('theme') || c.includes('unit')) && !c.includes('sub'));
    const subtopicIdx = mergedTopicSubIdx >= 0 
      ? -1 
      : headerCells.findIndex(c => (/sub-?topics?/i.test(c) || c.includes('subtopic') || c.includes('sub-topic') || c.includes('sub topic') || (c.includes('sub') && !c.includes('subject'))));
    
    // Outcomes / Competencies
    const compIdx = headerCells.findIndex(c => c.includes('outcome') || c.includes('competenc'));

    // OBC specific columns
    const knowledgeIdx = headerCells.findIndex(c => c.includes('knowledge') || (c.includes('content') && !c.includes('context')) || c.includes('concept') || c.includes('subject matter'));
    const skillsIdx = headerCells.findIndex(c => c.includes('skill'));
    const valuesIdx = headerCells.findIndex(c => c.includes('value') || c.includes('attitude'));

    // CBC specific columns
    const stdIdx = headerCells.findIndex(c => c.includes('standard') || (!c.includes('outcome') && c.includes('expect')));
    const actIdx = headerCells.findIndex(c => c.includes('activit') || c.includes('task'));

    // Methods (strictly check method/strategy/approach, NEVER value)
    const methodIdx = headerCells.findIndex(c => c.includes('method') || c.includes('strategy') || c.includes('pedagog') || c.includes('approach'));

    // Aids & Resources
    const aidIdx = headerCells.findIndex(c => c.includes('aid') || c.includes('t/l') || c.includes('resource') || c.includes('material'));

    // References
    const refIdx = headerCells.findIndex(c => c.includes('ref') || c.includes('source') || c.includes('book'));

    const isHeaderGenuine = headerRow !== tableLines[0] || headerCells.some(c => /week|day|topic|outcome|knowledge|skills|methods/i.test(c));

    const dataRows = tableLines.filter(l => {
      if (l.includes('---') || l === headerRow) return false;
      let cells = l.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      return !isMetadataOrHeaderRow(cells);
    });

    const parsedMap = new Map<number, ParsedSchemeWeek>();
    let currentWeekNum = 0;

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

      currentWeekNum = rowWeekNum;

      // Extract date range (e.g. 07-09-2026 to 11-09-2026 or (21-09-2026 to 25-09-2026))
      let extractedDateRange = '';
      const dateRangeMatch = cleanWeekCell.match(/\(?(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\s*(?:to|-)\s*\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})\)?/i);
      if (dateRangeMatch) {
        extractedDateRange = dateRangeMatch[1].trim();
      }

      let topicCell = '';
      let subtopicList: string[] = [];

      if (mergedTopicSubIdx >= 0) {
        const rawMergedCell = cells[mergedTopicSubIdx] || '';
        const parsedMerged = splitTopicAndSubtopics(rawMergedCell, grade, subject);
        topicCell = parsedMerged.topic;
        subtopicList = parsedMerged.subtopics;
      } else {
        topicCell = cells[topicIdx >= 0 ? topicIdx : 1] || '';
        const subCell = cells[subtopicIdx >= 0 ? subtopicIdx : 2] || '';
        if (subCell) subtopicList = splitSubtopicsIntoArray(subCell);
        if (subtopicList.length === 0 && topicCell) {
          const parsedTopic = splitTopicAndSubtopics(topicCell, grade, subject);
          if (parsedTopic.subtopics.length > 0) {
            topicCell = parsedTopic.topic;
            subtopicList = parsedTopic.subtopics;
          }
        }
      }

      topicCell = cleanExtractedTopic(topicCell, subject);
      subtopicList = cleanExtractedSubtopics(subtopicList, subject);

      // If subtopicList is empty but we have a topic, try resolving official subtopic from syllabus
      if (subtopicList.length === 0 && topicCell) {
        const resolved = lookupTopicAndSubtopicByOutcome(topicCell, grade, subject);
        if (resolved && resolved.subtopic) {
          const cleanedResolvedSub = cleanExtractedSubtopics([resolved.subtopic], subject);
          if (cleanedResolvedSub.length > 0) {
            subtopicList = cleanedResolvedSub;
          }
        }
      }

      // Smart Semantic Classification & Shift Repair:
      // If cell 1 contains 4-level outcome numbers (e.g. 3.5.1.3 or 3.2.5.1) and NOT a main topic:
      const rawCell1 = cleanCellContent(cells[1] || '');
      const hasOutcomeCodeInCell1 = /\b\d+\.\d+\.\d+\.\d+\b/.test(rawCell1);
      const isShiftedRow = hasOutcomeCodeInCell1 && (!topicCell || /\b\d+\.\d+\.\d+\.\d+\b/.test(topicCell));

      let competencyCell = '';
      let knowledgeCell = '';
      let skillsCell = '';
      let valuesCell = '';
      let expectedStandardCell = '';
      let activityCell = '';
      let methodCell = '';
      let aidCell = '';
      let referenceCell = '';

      if (isShiftedRow) {
        // Resolve true Topic and Subtopic from syllabus using outcome code
        const resolved = lookupTopicAndSubtopicByOutcome(rawCell1, grade, subject);
        if (resolved) {
          topicCell = resolved.topic;
          subtopicList = [resolved.subtopic];
        } else {
          const mCode = rawCell1.match(/\b(\d+)\.(\d+)\.(\d+)\.(\d+)\b/);
          if (mCode) {
            topicCell = `Topic ${mCode[1]}.${mCode[2]}`;
            subtopicList = [`Subtopic ${mCode[1]}.${mCode[2]}.${mCode[3]}`];
          }
        }
        competencyCell = rawCell1;
        knowledgeCell = cleanCellContent(cells[2] || '');
        expectedStandardCell = knowledgeCell;
        skillsCell = cleanCellContent(cells[3] || '');
        valuesCell = cleanCellContent(cells[4] || '');
        methodCell = cleanCellContent(cells[5] || '');
        aidCell = cleanCellContent(cells[6] || '');
        referenceCell = cleanCellContent(cells[7] || cells[8] || '');
      } else {
        let effCompIdx = compIdx;
        let effKnowledgeIdx = knowledgeIdx;
        let effSkillsIdx = skillsIdx;
        let effValuesIdx = valuesIdx;
        let effMethodIdx = methodIdx;
        let effAidIdx = aidIdx;
        let effRefIdx = refIdx;

        // Smart positional fallback when headers weren't found or columns were unlabeled:
        if (effCompIdx < 0 || effKnowledgeIdx < 0) {
          if (cells.length >= 10) {
            // Standard 10 columns: Week (0), Topic (1), Subtopic (2), Outcomes (3), Knowledge (4), Skills (5), Values (6), Methods (7), Aids (8), Ref (9)
            if (effCompIdx < 0) effCompIdx = mergedTopicSubIdx >= 0 ? 2 : 3;
            if (effKnowledgeIdx < 0) effKnowledgeIdx = mergedTopicSubIdx >= 0 ? 3 : 4;
            if (effSkillsIdx < 0) effSkillsIdx = mergedTopicSubIdx >= 0 ? 4 : 5;
            if (effValuesIdx < 0) effValuesIdx = mergedTopicSubIdx >= 0 ? 5 : 6;
            if (effMethodIdx < 0) effMethodIdx = mergedTopicSubIdx >= 0 ? 6 : 7;
            if (effAidIdx < 0) effAidIdx = mergedTopicSubIdx >= 0 ? 7 : 8;
            if (effRefIdx < 0) effRefIdx = mergedTopicSubIdx >= 0 ? 8 : 9;
          } else if (cells.length >= 8) {
            if (effCompIdx < 0) effCompIdx = 2;
            if (effKnowledgeIdx < 0) effKnowledgeIdx = 3;
            if (effSkillsIdx < 0) effSkillsIdx = 4;
            if (effValuesIdx < 0) effValuesIdx = 5;
            if (effMethodIdx < 0) effMethodIdx = 6;
            if (effAidIdx < 0) effAidIdx = 7;
          }
        }

        const rawCompCell = effCompIdx >= 0 ? cleanCellContent(cells[effCompIdx] || '') : '';
        competencyCell = cleanExtractedCompetencies([rawCompCell])[0] || '';
        knowledgeCell = effKnowledgeIdx >= 0 ? cleanCellContent(cells[effKnowledgeIdx] || '') : '';
        skillsCell = effSkillsIdx >= 0 ? cleanCellContent(cells[effSkillsIdx] || '') : '';
        valuesCell = effValuesIdx >= 0 ? cleanCellContent(cells[effValuesIdx] || '') : '';
        expectedStandardCell = stdIdx >= 0 ? cleanCellContent(cells[stdIdx] || '') : (knowledgeCell || '');
        activityCell = actIdx >= 0 ? cleanCellContent(cells[actIdx] || '') : '';
        methodCell = effMethodIdx >= 0 ? cleanCellContent(cells[effMethodIdx] || '') : '';
        aidCell = effAidIdx >= 0 ? cleanCellContent(cells[effAidIdx] || '') : '';
        referenceCell = effRefIdx >= 0 ? cleanCellContent(cells[effRefIdx] || '') : '';

        // Disambiguate combined Content cell into Knowledge, Skills, Values
        const rawContent = knowledgeCell || rawCompCell;
        if (rawContent && (rawContent.toLowerCase().includes('knowledge:') || rawContent.toLowerCase().includes('skills:') || rawContent.toLowerCase().includes('values:'))) {
          const split = splitContentIntoKnowledgeSkillsValues(rawContent);
          if (split.knowledge) knowledgeCell = split.knowledge;
          if (split.skills && !skillsCell) skillsCell = split.skills;
          if (split.values && !valuesCell) valuesCell = split.values;
        }

        // Disambiguate individual cells:
        // If aidCell contains syllabus reference and referenceCell is empty:
        if (/(?:syllabus|curriculum|module|page\s*[:.]?\s*\d+|pg[:.]?\s*\d+)/i.test(aidCell) && !referenceCell) {
          referenceCell = aidCell;
          aidCell = methodCell && !/(?:exposition|discussion|demonstration|group work|pair work|question)/i.test(methodCell) ? methodCell : '';
        }
        // If topicCell contains 4-level outcome code:
        if (/\b\d+\.\d+\.\d+\.\d+\b/.test(topicCell)) {
          const resolved = lookupTopicAndSubtopicByOutcome(topicCell, grade, subject);
          if (resolved) {
            if (!competencyCell) competencyCell = topicCell;
            topicCell = resolved.topic;
            if (subtopicList.length === 0 || /\b\d+\.\d+\.\d+\.\d+\b/.test(subtopicList[0])) {
              subtopicList = [resolved.subtopic];
            }
          }
        }

        // Auto-enrich missing OBC fields from official syllabus:
        const isOBCMode = curriculumType === 'OBC' || (grade && /obc/i.test(grade)) || (!curriculumType && !stdIdx);
        if (isOBCMode || !knowledgeCell || !skillsCell || !valuesCell || !methodCell || !aidCell || !referenceCell) {
          const sMatch = findSyllabusEntryForForecast(topicCell, subtopicList[0], competencyCell, grade, subject, 'OBC');
          if (sMatch) {
            if (!knowledgeCell || knowledgeCell.length < 4 || /^n\/?a$/i.test(knowledgeCell) || knowledgeCell === '...') {
              knowledgeCell = sMatch.knowledge || '';
            }
            if (!skillsCell || skillsCell.length < 4 || /^n\/?a$/i.test(skillsCell) || skillsCell === '...') {
              skillsCell = sMatch.skills || '';
            }
            if (!valuesCell || valuesCell.length < 4 || /^n\/?a$/i.test(valuesCell) || valuesCell === '...') {
              valuesCell = sMatch.values || '';
            }
            if (!methodCell || methodCell.length < 3 || /^n\/?a$/i.test(methodCell) || methodCell === '...') {
              methodCell = sMatch.teachingMethods || '• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration';
            }
            if (!aidCell || aidCell.length < 3 || /^n\/?a$/i.test(aidCell) || aidCell === '...') {
              aidCell = sMatch.teachingAids || `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${subtopicList[0] || topicCell || 'topic'}`;
            }
            if (!referenceCell || referenceCell.length < 3 || /^n\/?a$/i.test(referenceCell) || referenceCell.toLowerCase() === 'official zambian syllabus' || referenceCell === '...') {
              referenceCell = sMatch.references || getOfficialSyllabusCitation(grade || 'Grade 3-7', subject || 'Science', 'OBC');
            }
          } else {
            if (!knowledgeCell || knowledgeCell.length < 4 || /^n\/?a$/i.test(knowledgeCell)) {
              knowledgeCell = deriveKnowledgeFromOutcome(competencyCell, subtopicList[0], topicCell);
            }
            if (!skillsCell || skillsCell.length < 4 || /^n\/?a$/i.test(skillsCell)) {
              skillsCell = deriveSkillsFromOutcome(competencyCell, subtopicList[0], topicCell);
            }
            if (!valuesCell || valuesCell.length < 4 || /^n\/?a$/i.test(valuesCell)) {
              valuesCell = deriveValuesFromOutcome(competencyCell, subtopicList[0], topicCell);
            }
            if (!methodCell || methodCell.length < 3 || /^n\/?a$/i.test(methodCell)) {
              methodCell = '• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration';
            }
            if (!aidCell || aidCell.length < 3 || /^n\/?a$/i.test(aidCell)) {
              aidCell = `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${subtopicList[0] || topicCell || 'topic'}`;
            }
            if (!referenceCell || referenceCell.length < 3 || /^n\/?a$/i.test(referenceCell)) {
              referenceCell = getOfficialSyllabusCitation(grade || 'Grade 3-7', subject || 'Science', 'OBC');
            }
          }
        }
      }

      const extractedComp = compHeaderIdx >= 0 ? cleanCellContent(cells[compHeaderIdx] || '') : undefined;

      if (!parsedMap.has(currentWeekNum)) {
        const topicParts = topicCell ? topicCell.split('/').map(t => t.trim()) : [];
        parsedMap.set(currentWeekNum, {
          week: currentWeekNum,
          weekLabel: weekCell || `Week ${currentWeekNum}`,
          dateRange: extractedDateRange || undefined,
          dates: extractedDateRange || undefined,
          component: extractedComp,
          topic: topicParts[0] || topicCell || '',
          topic2: topicParts[1] || '',
          topic3: topicParts[2] || '',
          subtopics: subtopicList,
          competencies: competencyCell ? [competencyCell] : [],
          knowledge: knowledgeCell ? [knowledgeCell] : [],
          skills: skillsCell ? [skillsCell] : [],
          values: valuesCell ? [valuesCell] : [],
          expectedStandards: expectedStandardCell ? [expectedStandardCell] : [],
          activities: activityCell ? [activityCell] : [],
          methods: methodCell ? [methodCell] : [],
          teachingAids: aidCell || '',
          references: referenceCell || ''
        });
      } else {
        const existing = parsedMap.get(currentWeekNum)!;
        if (extractedDateRange && !existing.dateRange) {
          existing.dateRange = extractedDateRange;
          existing.dates = extractedDateRange;
        }
        if (extractedComp && !existing.component) {
          existing.component = extractedComp;
        }
        if (topicCell && (!existing.topic || /^(grade|subject|term|class)\b/i.test(existing.topic))) {
          const topicParts = topicCell.split('/').map(t => t.trim());
          existing.topic = topicParts[0] || topicCell;
          existing.topic2 = topicParts[1] || '';
          existing.topic3 = topicParts[2] || '';
        }
        for (const st of subtopicList) {
          if (!existing.subtopics.includes(st)) {
            existing.subtopics.push(st);
          }
        }
        if (competencyCell && !existing.competencies.includes(competencyCell)) {
          existing.competencies.push(competencyCell);
        }
        if (knowledgeCell && !existing.knowledge?.includes(knowledgeCell)) {
          if (!existing.knowledge) existing.knowledge = [];
          existing.knowledge.push(knowledgeCell);
        }
        if (skillsCell && !existing.skills?.includes(skillsCell)) {
          if (!existing.skills) existing.skills = [];
          existing.skills.push(skillsCell);
        }
        if (valuesCell && !existing.values?.includes(valuesCell)) {
          if (!existing.values) existing.values = [];
          existing.values.push(valuesCell);
        }
        if (expectedStandardCell && !existing.expectedStandards.includes(expectedStandardCell)) {
          existing.expectedStandards.push(expectedStandardCell);
        }
        if (activityCell && !existing.activities.includes(activityCell)) {
          existing.activities.push(activityCell);
        }
        if (methodCell && !existing.methods.includes(methodCell)) {
          existing.methods.push(methodCell);
        }
        if (aidCell && !existing.teachingAids.includes(aidCell)) {
          existing.teachingAids = existing.teachingAids ? `${existing.teachingAids}; ${aidCell}` : aidCell;
        }
        if (referenceCell && !existing.references.includes(referenceCell)) {
          existing.references = existing.references ? `${existing.references}; ${referenceCell}` : referenceCell;
        }
      }
    }

    if (parsedMap.size > 0) {
      return Array.from(parsedMap.values()).sort((a, b) => a.week - b.week);
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Parses tab-delimited text (TSV copied from Excel or Word tables)
 */
function parseTsvTable(text: string): ParsedSchemeWeek[] | null {
  try {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const tsvLines = lines.filter(l => l.includes('\t'));
    if (tsvLines.length < 2) return null;

    // Detect header row if present
    const headerRow = tsvLines.find(l => {
      const lower = l.toLowerCase();
      const matchCount = (lower.match(/week|topic|competenc|outcome|knowledge|skill|value|standard|activit|method|aids?|ref/g) || []).length;
      return matchCount >= 2;
    });

    let weekIdx = 0;
    let topicIdx = 1;
    let subtopicIdx = -1;
    let mergedTopicSubIdx = -1;
    let compIdx = 2;
    let knowledgeIdx = -1;
    let skillsIdx = -1;
    let valuesIdx = -1;
    let stdIdx = -1;
    let actIdx = -1;
    let methodIdx = -1;
    let aidIdx = -1;
    let refIdx = -1;

    if (headerRow) {
      const headerCells = headerRow.split('\t').map(c => cleanCellContent(c).toLowerCase());
      weekIdx = headerCells.findIndex(c => /\b(week|wk)\b/i.test(c));
      mergedTopicSubIdx = headerCells.findIndex(c => c.includes('topic/sub') || c.includes('topic / sub') || (c.includes('topic') && c.includes('sub')));
      topicIdx = mergedTopicSubIdx >= 0 ? mergedTopicSubIdx : headerCells.findIndex(c => c.includes('topic') && !c.includes('sub'));
      subtopicIdx = mergedTopicSubIdx >= 0 ? -1 : headerCells.findIndex(c => c.includes('subtopic') || c.includes('sub-topic') || (c.includes('sub') && !c.includes('subject')));
      compIdx = headerCells.findIndex(c => c.includes('outcome') || c.includes('competenc'));
      knowledgeIdx = headerCells.findIndex(c => c.includes('knowledge') || c.includes('content'));
      skillsIdx = headerCells.findIndex(c => c.includes('skill'));
      valuesIdx = headerCells.findIndex(c => c.includes('value') || c.includes('attitude'));
      stdIdx = headerCells.findIndex(c => c.includes('standard') || (!c.includes('outcome') && c.includes('expect')));
      actIdx = headerCells.findIndex(c => c.includes('activit') || c.includes('task'));
      methodIdx = headerCells.findIndex(c => c.includes('method') || c.includes('strategy'));
      aidIdx = headerCells.findIndex(c => c.includes('aid') || c.includes('t/l') || c.includes('material') || c.includes('resource'));
      refIdx = headerCells.findIndex(c => c.includes('ref') || c.includes('source') || c.includes('book'));
    }

    const parsedMap = new Map<number, ParsedSchemeWeek>();
    let currentWeekNum = 0;

    for (let i = 0; i < tsvLines.length; i++) {
      const line = tsvLines[i];
      if (line === headerRow) continue;
      const cells = line.split('\t').map(c => c.trim());
      if (cells.length < 2) continue;

      if (isMetadataOrHeaderRow(cells)) {
        continue;
      }

      const cleanWeekCell = cells[weekIdx >= 0 ? weekIdx : 0] || '';
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
          rowWeekNum = currentWeekNum > 0 ? currentWeekNum + 1 : parsedMap.size + 1;
        }
      }

      currentWeekNum = rowWeekNum;

      let topicCell = '';
      let subtopicList: string[] = [];

      if (mergedTopicSubIdx >= 0 && cells[mergedTopicSubIdx]) {
        const parsed = splitTopicAndSubtopics(cells[mergedTopicSubIdx]);
        topicCell = parsed.topic;
        subtopicList = parsed.subtopics;
      } else {
        let effTopicIdx = topicIdx;
        let effSubIdx = subtopicIdx;
        let effCompIdx = compIdx;
        let effKnowledgeIdx = knowledgeIdx;
        let effSkillsIdx = skillsIdx;
        let effValuesIdx = valuesIdx;
        let effMethodIdx = methodIdx;
        let effAidIdx = aidIdx;
        let effRefIdx = refIdx;

        if (effCompIdx < 0 || effKnowledgeIdx < 0) {
          if (cells.length >= 10) {
            if (effTopicIdx < 0) effTopicIdx = 1;
            if (effSubIdx < 0) effSubIdx = 2;
            if (effCompIdx < 0) effCompIdx = 3;
            if (effKnowledgeIdx < 0) effKnowledgeIdx = 4;
            if (effSkillsIdx < 0) effSkillsIdx = 5;
            if (effValuesIdx < 0) effValuesIdx = 6;
            if (effMethodIdx < 0) effMethodIdx = 7;
            if (effAidIdx < 0) effAidIdx = 8;
            if (effRefIdx < 0) effRefIdx = 9;
          } else if (cells.length >= 8) {
            if (effTopicIdx < 0) effTopicIdx = 1;
            if (effCompIdx < 0) effCompIdx = 2;
            if (effKnowledgeIdx < 0) effKnowledgeIdx = 3;
            if (effSkillsIdx < 0) effSkillsIdx = 4;
            if (effValuesIdx < 0) effValuesIdx = 5;
            if (effMethodIdx < 0) effMethodIdx = 6;
            if (effAidIdx < 0) effAidIdx = 7;
          }
        }

        topicCell = cleanExtractedTopic(cells[effTopicIdx >= 0 ? effTopicIdx : 1] || '');
        const rawSub = cells[effSubIdx >= 0 ? effSubIdx : 2] || '';
        if (rawSub) subtopicList = splitSubtopicsIntoArray(rawSub);
        if (subtopicList.length === 0 && topicCell) {
          const parsedTopic = splitTopicAndSubtopics(topicCell);
          if (parsedTopic.subtopics.length > 0) {
            topicCell = parsedTopic.topic;
            subtopicList = parsedTopic.subtopics;
          }
        }
        subtopicList = cleanExtractedSubtopics(subtopicList);
      }

      let effCompIdx = compIdx;
      let effKnowledgeIdx = knowledgeIdx;
      let effSkillsIdx = skillsIdx;
      let effValuesIdx = valuesIdx;
      let effMethodIdx = methodIdx;
      let effAidIdx = aidIdx;
      let effRefIdx = refIdx;

      if (effCompIdx < 0 || effKnowledgeIdx < 0) {
        if (cells.length >= 10) {
          if (effCompIdx < 0) effCompIdx = 3;
          if (effKnowledgeIdx < 0) effKnowledgeIdx = 4;
          if (effSkillsIdx < 0) effSkillsIdx = 5;
          if (effValuesIdx < 0) effValuesIdx = 6;
          if (effMethodIdx < 0) effMethodIdx = 7;
          if (effAidIdx < 0) effAidIdx = 8;
          if (effRefIdx < 0) effRefIdx = 9;
        } else if (cells.length >= 8) {
          if (effCompIdx < 0) effCompIdx = 2;
          if (effKnowledgeIdx < 0) effKnowledgeIdx = 3;
          if (effSkillsIdx < 0) effSkillsIdx = 4;
          if (effValuesIdx < 0) effValuesIdx = 5;
          if (effMethodIdx < 0) effMethodIdx = 6;
          if (effAidIdx < 0) effAidIdx = 7;
        }
      }

      const rawComp = effCompIdx >= 0 ? cells[effCompIdx] : '';
      let compCell = cleanExtractedCompetencies(rawComp ? [rawComp] : [])[0] || '';
      let knowCell = effKnowledgeIdx >= 0 ? cleanCellContent(cells[effKnowledgeIdx] || '') : '';
      let skillCell = effSkillsIdx >= 0 ? cleanCellContent(cells[effSkillsIdx] || '') : '';
      let valCell = effValuesIdx >= 0 ? cleanCellContent(cells[effValuesIdx] || '') : '';
      const stdCell = stdIdx >= 0 ? cleanCellContent(cells[stdIdx] || '') : (knowCell || '');
      const actCell = actIdx >= 0 ? cleanCellContent(cells[actIdx] || '') : '';
      let methodCell = effMethodIdx >= 0 ? cleanCellContent(cells[effMethodIdx] || '') : '';
      let aidCell = effAidIdx >= 0 ? cleanCellContent(cells[effAidIdx] || '') : '';
      let refCell = effRefIdx >= 0 ? cleanCellContent(cells[effRefIdx] || '') : '';

      // Disambiguate combined Content cell into Knowledge, Skills, Values
      const rawContent = knowCell || compCell;
      if (rawContent && (rawContent.toLowerCase().includes('knowledge:') || rawContent.toLowerCase().includes('skills:') || rawContent.toLowerCase().includes('values:'))) {
        const split = splitContentIntoKnowledgeSkillsValues(rawContent);
        if (split.knowledge) knowCell = split.knowledge;
        if (split.skills && !skillCell) skillCell = split.skills;
        if (split.values && !valCell) valCell = split.values;
      }

      // Auto-enrich missing OBC fields from official syllabus:
      if (!knowCell || !skillCell || !valCell || !methodCell || !aidCell || !refCell) {
        const sMatch = findSyllabusEntryForForecast(topicCell, subtopicList[0], compCell, undefined, undefined, 'OBC');
        if (sMatch) {
          if (!knowCell || knowCell.length < 4 || /^n\/?a$/i.test(knowCell) || knowCell === '...') {
            knowCell = sMatch.knowledge || '';
          }
          if (!skillCell || skillCell.length < 4 || /^n\/?a$/i.test(skillCell) || skillCell === '...') {
            skillCell = sMatch.skills || '';
          }
          if (!valCell || valCell.length < 4 || /^n\/?a$/i.test(valCell) || valCell === '...') {
            valCell = sMatch.values || '';
          }
          if (!methodCell || methodCell.length < 3 || /^n\/?a$/i.test(methodCell) || methodCell === '...') {
            methodCell = sMatch.teachingMethods || '• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration';
          }
          if (!aidCell || aidCell.length < 3 || /^n\/?a$/i.test(aidCell) || aidCell === '...') {
            aidCell = sMatch.teachingAids || `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${subtopicList[0] || topicCell || 'topic'}`;
          }
          if (!refCell || refCell.length < 3 || /^n\/?a$/i.test(refCell) || refCell.toLowerCase() === 'official zambian syllabus' || refCell === '...') {
            refCell = sMatch.references || getOfficialSyllabusCitation('Grade 3-7', 'Science', 'OBC');
          }
        } else {
          if (!knowCell || knowCell.length < 4 || /^n\/?a$/i.test(knowCell)) {
            knowCell = deriveKnowledgeFromOutcome(compCell, subtopicList[0], topicCell);
          }
          if (!skillCell || skillCell.length < 4 || /^n\/?a$/i.test(skillCell)) {
            skillCell = deriveSkillsFromOutcome(compCell, subtopicList[0], topicCell);
          }
          if (!valCell || valCell.length < 4 || /^n\/?a$/i.test(valCell)) {
            valCell = deriveValuesFromOutcome(compCell, subtopicList[0], topicCell);
          }
          if (!methodCell || methodCell.length < 3 || /^n\/?a$/i.test(methodCell)) {
            methodCell = '• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration';
          }
          if (!aidCell || aidCell.length < 3 || /^n\/?a$/i.test(aidCell)) {
            aidCell = `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${subtopicList[0] || topicCell || 'topic'}`;
          }
          if (!refCell || refCell.length < 3 || /^n\/?a$/i.test(refCell)) {
            refCell = getOfficialSyllabusCitation('Grade 3-7', 'Science', 'OBC');
          }
        }
      }

      if (!parsedMap.has(currentWeekNum)) {
        parsedMap.set(currentWeekNum, {
          week: currentWeekNum,
          topic: topicCell,
          subtopics: subtopicList,
          competencies: compCell ? [compCell] : [],
          knowledge: knowCell ? [knowCell] : [],
          skills: skillCell ? [skillCell] : [],
          values: valCell ? [valCell] : [],
          expectedStandards: stdCell ? [stdCell] : [],
          activities: actCell ? [actCell] : [],
          methods: methodCell ? [methodCell] : [],
          teachingAids: aidCell,
          references: refCell
        });
      } else {
        const existing = parsedMap.get(currentWeekNum)!;
        if (topicCell && (!existing.topic || /^(grade|subject|term|class)\b/i.test(existing.topic))) existing.topic = topicCell;
        for (const st of subtopicList) {
          if (!existing.subtopics.includes(st)) existing.subtopics.push(st);
        }
        if (compCell && !existing.competencies.includes(compCell)) existing.competencies.push(compCell);
        if (knowCell && !existing.knowledge?.includes(knowCell)) {
          if (!existing.knowledge) existing.knowledge = [];
          existing.knowledge.push(knowCell);
        }
        if (skillCell && !existing.skills?.includes(skillCell)) {
          if (!existing.skills) existing.skills = [];
          existing.skills.push(skillCell);
        }
        if (valCell && !existing.values?.includes(valCell)) {
          if (!existing.values) existing.values = [];
          existing.values.push(valCell);
        }
        if (stdCell && !existing.expectedStandards.includes(stdCell)) existing.expectedStandards.push(stdCell);
        if (actCell && !existing.activities.includes(actCell)) existing.activities.push(actCell);
        if (methodCell && !existing.methods.includes(methodCell)) existing.methods.push(methodCell);
        if (aidCell && !existing.teachingAids.includes(aidCell)) {
          existing.teachingAids = existing.teachingAids ? `${existing.teachingAids}; ${aidCell}` : aidCell;
        }
        if (refCell && !existing.references.includes(refCell)) {
          existing.references = existing.references ? `${existing.references}; ${refCell}` : refCell;
        }
      }
    }

    if (parsedMap.size > 0) {
      return Array.from(parsedMap.values()).sort((a, b) => a.week - b.week);
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Parses free-form structured text with Week sections
 */
function parseStructuredText(text: string): ParsedSchemeWeek[] {
  const parsedMap = new Map<number, ParsedSchemeWeek>();

  // Split text by lines starting with Week headers
  const weekHeaderRegex = /(?:^|\n)(?:[#*_\-\s]*)(?:WEEK|Week|Wk)\s*(\d+)(?:[#*_\-\s:]*)([^\n]*)/gi;
  const matches: Array<{ weekNum: number; headerTitle: string; index: number }> = [];
  
  let match: RegExpExecArray | null;
  while ((match = weekHeaderRegex.exec(text)) !== null) {
    matches.push({
      weekNum: parseInt(match[1], 10),
      headerTitle: match[2]?.trim() || '',
      index: match.index
    });
  }

  if (matches.length === 0) {
    return [];
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index;
    const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    const weekBlock = text.slice(startIndex, endIndex);

    const weekNum = current.weekNum;
    const lines = weekBlock.split('\n').map(l => l.trim()).filter(Boolean);

    let topic = '';
    const subtopics: string[] = [];
    const competencies: string[] = [];
    const knowledge: string[] = [];
    const skills: string[] = [];
    const values: string[] = [];
    const expectedStandards: string[] = [];
    const activities: string[] = [];
    const methods: string[] = [];
    let teachingAids = '';
    let references = '';

    // If the header itself had a topic, e.g. "Week 1: Numbers and Algebra"
    if (current.headerTitle && !/^(week|wk)/i.test(current.headerTitle)) {
      topic = current.headerTitle.replace(/^[:\-–\s]+/, '').trim();
    }

    let currentSection: 'subtopics' | 'competencies' | 'knowledge' | 'skills' | 'values' | 'activities' | 'methods' | null = null;

    for (const line of lines) {
      // Check for Topic
      const topicMatch = line.match(/^(?:[-*•\s]*)Topic(?:\s*\d+)?\s*[:\-–]\s*(.+)/i);
      if (topicMatch) {
        topic = topicMatch[1].trim();
        currentSection = null;
        continue;
      }

      // Check for Subtopic
      const subMatch = line.match(/^(?:[-*•\s]*)Sub[\s-]?topic(?:s)?\s*[:\-–]\s*(.+)/i);
      if (subMatch) {
        const val = subMatch[1].trim();
        if (val) subtopics.push(...splitSubtopicsIntoArray(val));
        currentSection = 'subtopics';
        continue;
      }

      // Check for Competencies / Specific Outcomes
      const compMatch = line.match(/^(?:[-*•\s]*)(?:Specific\s+Outcomes?|Specific\s+Competenc(?:ies|y)|Outcomes?|Competenc(?:ies|y))\s*[:\-–]\s*(.+)/i);
      if (compMatch) {
        const val = compMatch[1].trim();
        if (val) competencies.push(val);
        currentSection = 'competencies';
        continue;
      }

      // Check for Knowledge / Content
      const knowMatch = line.match(/^(?:[-*•\s]*)(?:Knowledge|Content)\s*[:\-–]\s*(.+)/i);
      if (knowMatch) {
        const val = knowMatch[1].trim();
        if (val) knowledge.push(val);
        currentSection = 'knowledge';
        continue;
      }

      // Check for Skills
      const skillMatch = line.match(/^(?:[-*•\s]*)(?:Skills?)\s*[:\-–]\s*(.+)/i);
      if (skillMatch) {
        const val = skillMatch[1].trim();
        if (val) skills.push(val);
        currentSection = 'skills';
        continue;
      }

      // Check for Values
      const valMatch = line.match(/^(?:[-*•\s]*)(?:Values?|Attitudes?)\s*[:\-–]\s*(.+)/i);
      if (valMatch) {
        const val = valMatch[1].trim();
        if (val) values.push(val);
        currentSection = 'values';
        continue;
      }

      // Check for Expected Standards
      const stdMatch = line.match(/^(?:[-*•\s]*)(?:Expected\s+Standards?|Standards?)\s*[:\-–]\s*(.+)/i);
      if (stdMatch) {
        const val = stdMatch[1].trim();
        if (val) expectedStandards.push(val);
        continue;
      }

      // Check for Learning Activities
      const actMatch = line.match(/^(?:[-*•\s]*)(?:Learning\s+Activities|Suggested\s+Activities|Activities)\s*[:\-–]\s*(.+)/i);
      if (actMatch) {
        const val = actMatch[1].trim();
        if (val) activities.push(val);
        currentSection = 'activities';
        continue;
      }

      // Check for Teaching Methods
      const methodMatch = line.match(/^(?:[-*•\s]*)(?:Teaching\s+Methods?|Methods?)\s*[:\-–]\s*(.+)/i);
      if (methodMatch) {
        const val = methodMatch[1].trim();
        if (val) methods.push(val);
        currentSection = 'methods';
        continue;
      }

      // Check for Teaching Aids
      const aidMatch = line.match(/^(?:[-*•\s]*)(?:Teaching\s+(?:and|&)\s+Learning\s+Aids?|Teaching\s+Aids?|T\/?L\s+Aids?|Aids?)\s*[:\-–]\s*(.+)/i);
      if (aidMatch) {
        teachingAids = aidMatch[1].trim();
        currentSection = null;
        continue;
      }

      // Check for References
      const refMatch = line.match(/^(?:[-*•\s]*)(?:References?|Ref)\s*[:\-–]\s*(.+)/i);
      if (refMatch) {
        references = refMatch[1].trim();
        currentSection = null;
        continue;
      }

      // Continuation bullet points
      if (/^[-*•\d.)]\s+/.test(line)) {
        const cleanedBullet = line.replace(/^[-*•\d.)]\s+/, '').trim();
        if (currentSection === 'subtopics' && cleanedBullet) {
          subtopics.push(...splitSubtopicsIntoArray(cleanedBullet));
        } else if (currentSection === 'competencies' && cleanedBullet) {
          competencies.push(cleanedBullet);
        } else if (currentSection === 'knowledge' && cleanedBullet) {
          knowledge.push(cleanedBullet);
        } else if (currentSection === 'skills' && cleanedBullet) {
          skills.push(cleanedBullet);
        } else if (currentSection === 'values' && cleanedBullet) {
          values.push(cleanedBullet);
        } else if (currentSection === 'activities' && cleanedBullet) {
          activities.push(cleanedBullet);
        } else if (currentSection === 'methods' && cleanedBullet) {
          methods.push(cleanedBullet);
        }
      }
    }

    parsedMap.set(weekNum, {
      week: weekNum,
      topic: topic || `Week ${weekNum} Content`,
      subtopics: subtopics.length > 0 ? subtopics : [],
      competencies: competencies.length > 0 ? competencies : [],
      knowledge: knowledge.length > 0 ? knowledge : [],
      skills: skills.length > 0 ? skills : [],
      values: values.length > 0 ? values : [],
      expectedStandards: expectedStandards.length > 0 ? expectedStandards : (knowledge.length > 0 ? knowledge : []),
      activities: activities.length > 0 ? activities : [],
      methods: methods.length > 0 ? methods : [],
      teachingAids: teachingAids || '',
      references: references || ''
    });
  }

  return Array.from(parsedMap.values()).sort((a, b) => a.week - b.week);
}

/**
 * Universal parser for pasted outside schemes of work.
 * Seamlessly handles markdown tables, tab-delimited sheets, and structured text lists.
 */
export function parsePastedSchemesTextToWeeks(
  rawText?: string | null,
  grade?: string,
  subject?: string
): ParsedSchemeWeek[] {
  if (!rawText || typeof rawText !== 'string') return [];

  // Try markdown table first
  const tableResult = parseMarkdownTable(rawText, grade, subject);
  if (tableResult && tableResult.length > 0) {
    return tableResult;
  }

  // Try tab-delimited
  const tsvResult = parseTsvTable(rawText);
  if (tsvResult && tsvResult.length > 0) {
    return tsvResult;
  }

  // Try structured plain text
  const textResult = parseStructuredText(rawText);
  if (textResult && textResult.length > 0) {
    return textResult;
  }

  return [];
}

/**
 * Stricter data-matching validation logic for synchronization.
 * Cross-references the selected week number/index from the Weekly Forecast
 * with the exact corresponding row index in the Schemes of Work dataset
 * to strictly prevent cross-week data leakage.
 */
export function matchStrictWeekFromSchemes(
  weeksList?: any[] | null,
  targetWeekNum: number = 1,
  grade?: string,
  subject?: string,
  curriculumType?: string
): ParsedSchemeWeek | null {
  if (!weeksList || !Array.isArray(weeksList) || weeksList.length === 0) {
    return null;
  }

  const targetNum = Number(targetWeekNum) || 1;
  const targetIndex = targetNum - 1;

  // 1. Check exact row index in the sequential dataset
  let candidateByIndex: any = null;
  if (targetIndex >= 0 && targetIndex < weeksList.length) {
    const itemAtIdx = weeksList[targetIndex];
    if (itemAtIdx && Number(itemAtIdx.week) === targetNum) {
      candidateByIndex = itemAtIdx;
    }
  }

  // 2. Check direct week property match
  const directMatches = weeksList.filter((w: any) => Number(w.week) === targetNum);

  // 3. Check explicit label match (e.g. "Week 3", "Wk 3")
  const labelMatches = weeksList.filter((w: any) => 
    w.weekLabel && new RegExp(`\\b(?:week|wk)\\s*${targetNum}(?:\\b|[^0-9])`, 'i').test(w.weekLabel)
  );

  let selected: any = null;

  // Prioritize verified cross-referenced match:
  if (candidateByIndex) {
    // Exact row index and week number align perfectly (Zero ambiguity)
    selected = candidateByIndex;
  } else if (directMatches.length === 1) {
    // Exactly one matching week found in dataset
    selected = directMatches[0];
  } else if (directMatches.length > 1) {
    // If multiple rows have this week number, pick the one matching targetIndex or first
    selected = directMatches.find((_, idx) => idx === targetIndex) || directMatches[0];
  } else if (labelMatches.length > 0) {
    selected = labelMatches[0];
  } else if (targetIndex >= 0 && targetIndex < weeksList.length) {
    // Validate whether the item at targetIndex has matching week characteristics and is not from an explicit other week
    const fallbackItem = weeksList[targetIndex];
    const fallbackWeekNum = Number(fallbackItem?.week);
    if (!fallbackWeekNum || fallbackWeekNum === targetNum) {
      selected = fallbackItem;
    }
  } else if (weeksList.length > 0) {
    // When user pastes a single week or smaller dataset into instruction box for Week N, map to the pasted week
    selected = weeksList[targetIndex % weeksList.length] || weeksList[0];
  }

  if (!selected) return null;

  const rawTopic = cleanExtractedTopic(selected.topic || '');
  const rawSubtopics: string[] = Array.isArray(selected.subtopics) 
    ? Array.from<string>(new Set<string>(selected.subtopics.map((s: any) => typeof s === 'string' ? s.trim() : String(s)).filter(Boolean)))
    : (selected.subtopics ? [String(selected.subtopics).trim()] : []);
  const cleanSubs = cleanExtractedSubtopics(rawSubtopics, subject);

  const rawCompetencies: string[] = Array.isArray(selected.competencies) 
    ? Array.from<string>(new Set<string>(selected.competencies.map((c: any) => typeof c === 'string' ? c.trim() : String(c)).filter(Boolean)))
    : (selected.competencies ? [String(selected.competencies).trim()] : []);
  let cleanComps = cleanExtractedCompetencies(rawCompetencies);

  let cleanKnowledge: string[] = Array.isArray(selected.knowledge) 
    ? Array.from<string>(new Set<string>(selected.knowledge.map((k: any) => typeof k === 'string' ? k.trim() : String(k)).filter(Boolean)))
    : (selected.knowledge ? [String(selected.knowledge).trim()] : []);
  let cleanSkills: string[] = Array.isArray(selected.skills) 
    ? Array.from<string>(new Set<string>(selected.skills.map((s: any) => typeof s === 'string' ? s.trim() : String(s)).filter(Boolean)))
    : (selected.skills ? [String(selected.skills).trim()] : []);
  let cleanValues: string[] = Array.isArray(selected.values) 
    ? Array.from<string>(new Set<string>(selected.values.map((v: any) => typeof v === 'string' ? v.trim() : String(v)).filter(Boolean)))
    : (selected.values ? [String(selected.values).trim()] : []);

  const resolvedKnowledge: string[] = [];
  const resolvedSkills: string[] = [];
  const resolvedValues: string[] = [];
  const resolvedComps: string[] = [];
  const resolvedAids: string[] = [];
  const resolvedMethods: string[] = [];

  for (let sIdx = 0; sIdx < cleanSubs.length; sIdx++) {
    const curSub = cleanSubs[sIdx];
    const curComp = cleanComps[sIdx] || cleanComps[0] || '';
    const stMatch = findSyllabusEntryForForecast(rawTopic, curSub, curComp, grade, subject, curriculumType);

    // Knowledge
    let kVal = cleanKnowledge[sIdx] || '';
    if (!kVal || /^n\/?a$/i.test(kVal) || kVal === '...') {
      kVal = stMatch?.knowledge?.trim() || deriveKnowledgeFromOutcome(curComp || curSub || rawTopic, curSub, rawTopic);
    }
    resolvedKnowledge.push(kVal);

    // Skills
    let skVal = cleanSkills[sIdx] || '';
    if (!skVal || /^n\/?a$/i.test(skVal) || skVal === '...') {
      skVal = stMatch?.skills?.trim() || deriveSkillsFromOutcome(curComp || curSub || rawTopic, curSub, rawTopic);
    }
    resolvedSkills.push(skVal);

    // Values
    let vVal = cleanValues[sIdx] || '';
    if (!vVal || /^n\/?a$/i.test(vVal) || vVal === '...') {
      vVal = stMatch?.values?.trim() || deriveValuesFromOutcome(curComp || curSub || rawTopic, curSub, rawTopic);
    }
    resolvedValues.push(vVal);

    // Competency / Outcome
    let cVal = cleanComps[sIdx] || '';
    if (!cVal && stMatch?.competencies && stMatch.competencies.length > 0) {
      cVal = stMatch.competencies[0];
    }
    resolvedComps.push(cVal || curComp || curSub);

    if (stMatch?.teachingAids) {
      resolvedAids.push(stMatch.teachingAids);
    }
    if (stMatch?.teachingMethods) {
      resolvedMethods.push(stMatch.teachingMethods);
    }
  }

  if (resolvedKnowledge.length > 0) cleanKnowledge = resolvedKnowledge;
  if (resolvedSkills.length > 0) cleanSkills = resolvedSkills;
  if (resolvedValues.length > 0) cleanValues = resolvedValues;
  if (resolvedComps.length > 0) cleanComps = resolvedComps;

  let cleanMethods: string[] = Array.isArray(selected.methods) 
    ? Array.from<string>(new Set<string>(selected.methods.map((m: any) => typeof m === 'string' ? m.trim() : String(m)).filter(Boolean)))
    : (selected.methods ? [String(selected.methods).trim()] : []);
  if (cleanMethods.length === 0) {
    cleanMethods = resolvedMethods.length > 0 ? resolvedMethods : ['• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration • Practical activity'];
  }

  let cleanAids = (selected.teachingAids || '').trim();
  if (!cleanAids || /^n\/?a$/i.test(cleanAids)) {
    cleanAids = resolvedAids.length > 0 ? Array.from(new Set(resolvedAids)).join('; ') : `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${cleanSubs.join(', ') || rawTopic || 'topic'}`;
  }

  const sMatch = findSyllabusEntryForForecast(rawTopic, cleanSubs[0], cleanComps[0], grade, subject, curriculumType);

  let cleanRefs = (selected.references || '').trim();
  if (!cleanRefs || /^n\/?a$/i.test(cleanRefs) || cleanRefs.toLowerCase() === 'official zambian syllabus') {
    cleanRefs = sMatch?.references || getOfficialSyllabusCitation(grade || 'Grade 3-7', subject || 'Science', curriculumType || (grade && grade.includes('OBC') ? 'OBC' : 'CBC'));
  }

  // Return a clean, strictly isolated copy with deduplicated fields (zero leakage)
  return {
    week: targetNum,
    weekLabel: selected.weekLabel || `Week ${targetNum}`,
    topic: rawTopic,
    topic2: (selected.topic2 || '').trim(),
    topic3: (selected.topic3 || '').trim(),
    subtopics: cleanSubs,
    competencies: cleanComps,
    knowledge: cleanKnowledge,
    skills: cleanSkills,
    values: cleanValues,
    expectedStandards: Array.isArray(selected.expectedStandards) 
      ? Array.from<string>(new Set<string>(selected.expectedStandards.map((e: any) => typeof e === 'string' ? e.trim() : String(e)).filter(Boolean)))
      : (selected.expectedStandards ? [String(selected.expectedStandards).trim()] : []),
    activities: Array.isArray(selected.activities) 
      ? Array.from<string>(new Set<string>(selected.activities.map((a: any) => typeof a === 'string' ? a.trim() : String(a)).filter(Boolean)))
      : (selected.activities ? [String(selected.activities).trim()] : []),
    methods: cleanMethods,
    teachingAids: cleanAids,
    references: cleanRefs
  };
}

/**
 * Extracts data for a single specific week from pasted outside schemes text.
 */
export function extractWeekFromPastedText(
  rawText?: string | null, 
  targetWeek: number = 1,
  grade?: string,
  subject?: string,
  curriculumType?: string
): ParsedSchemeWeek | null {
  const weeks = parsePastedSchemesTextToWeeks(rawText, grade, subject);
  if (weeks.length === 0) return null;

  return matchStrictWeekFromSchemes(weeks, targetWeek, grade, subject, curriculumType);
}

export interface ParsedLessonFromForecast {
  day: number;
  week: number;
  topic: string;
  subtopic: string;
  competency: string;
  expectedStandard?: string;
  knowledge?: string;
  skills?: string;
  values?: string;
  learningActivities: string[];
  teachingMethods?: string;
  teachingAids?: string;
  references?: string;
}

/**
 * Extracts a specific Day and Week lesson plan content from pasted Weekly Forecast text or Scheme of Work.
 */
export function extractLessonFromPastedForecastText(
  rawText?: string | null,
  targetDay: number = 1,
  targetWeek: number = 1,
  grade?: string,
  subject?: string,
  curriculumType?: string
): ParsedLessonFromForecast | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const toStr = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) return val.filter(Boolean).map(x => typeof x === 'string' ? x.trim() : String(x)).join('\n');
    return String(val).trim();
  };

  // 1. Try to parse as a Weekly Forecast first using the highly robust parsePastedWeeklyForecast
  if (isPastedWeeklyForecast(rawText)) {
    const parsedDays = parsePastedWeeklyForecast(rawText, grade, subject, curriculumType);
    if (parsedDays && parsedDays.length > 0) {
      // Find the day that matches targetDay
      const dayData = parsedDays.find(d => d.day === targetDay) || parsedDays[targetDay - 1];
      if (dayData) {
        const top = toStr(dayData.topic);
        const sub = toStr(dayData.subtopic);
        const comp = toStr(dayData.competency);
        let know = toStr(dayData.knowledge);
        let skills = toStr(dayData.skills);
        let values = toStr(dayData.values);

        if (!know || know.length < 4 || /^n\/?a$/i.test(know)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          know = sMatch?.knowledge || deriveKnowledgeFromOutcome(comp, sub, top);
        }
        if (!skills || skills.length < 4 || /^n\/?a$/i.test(skills)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          skills = sMatch?.skills || deriveSkillsFromOutcome(comp, sub, top);
        }
        if (!values || values.length < 4 || /^n\/?a$/i.test(values)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          values = sMatch?.values || deriveValuesFromOutcome(comp, sub, top);
        }

        return {
          day: Number(dayData.day) || targetDay,
          week: targetWeek,
          topic: top,
          subtopic: sub,
          competency: comp,
          expectedStandard: toStr(dayData.expectedStandard),
          knowledge: know,
          skills: skills,
          values: values,
          learningActivities: Array.isArray(dayData.activities) ? dayData.activities.map(a => toStr(a)).filter(Boolean) : (dayData.activities ? [toStr(dayData.activities)] : []),
          teachingMethods: toStr(dayData.teachingMethods),
          teachingAids: toStr(dayData.teachingAids),
          references: toStr(dayData.references)
        };
      }
    }
  }

  const normalized = normalizeHtmlToMarkdownTable(rawText);
  const lines = normalized.split('\n');

  // Check if there are markdown table rows
  const tableLines = lines.filter(l => (l.trim().match(/\|/g) || []).length >= 3);
  if (tableLines.length >= 2) {
    let headerRow = tableLines.find(l => /day|topic|competenc|outcome|activity/i.test(l)) || tableLines[0];
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
    let subIdx = mergedTopicSubIdx >= 0 
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
      subIdx = -1;
      compIdx = 2;
      stdIdx = -1;
      actIdx = 3;
      methodIdx = 4;
      aidIdx = -1;
      refIdx = -1;
      mergedTopicSubIdx = -1;
    }

    const dataRows = tableLines.filter(l => !l.includes('---') && l !== headerRow);

    for (let idx = 0; idx < dataRows.length; idx++) {
      const row = dataRows[idx];
      let cells = row.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      if (cells.length < 2) continue;

      const firstCell = cells[dayIdx >= 0 ? dayIdx : 0] || '';
      const dayMatch = firstCell.match(/Day\s*(\d+)/i) || firstCell.match(/^(\d+)\b/);
      const rowDayNum = dayMatch ? parseInt(dayMatch[1], 10) : 0;

      if (rowDayNum === targetDay || (rowDayNum === 0 && idx + 1 === targetDay)) {
        let top = '';
        let sub = '';

        if (mergedTopicSubIdx >= 0) {
          const rawCell = cells[mergedTopicSubIdx] || '';
          const parsedMerged = splitTopicAndSubtopics(rawCell);
          top = parsedMerged.topic;
          sub = parsedMerged.subtopics[targetDay - 1] || parsedMerged.subtopics[0] || '';
        } else {
          top = cells[topicIdx >= 0 ? topicIdx : 1] || '';
          sub = cells[subIdx >= 0 ? subIdx : 2] || '';
        }

        const comp = compIdx >= 0 ? (cells[compIdx] || '') : '';
        let know = knowledgeIdx >= 0 ? (cells[knowledgeIdx] || '') : '';
        let skills = skillsIdx >= 0 ? (cells[skillsIdx] || '') : '';
        let values = valuesIdx >= 0 ? (cells[valuesIdx] || '') : '';
        const std = stdIdx >= 0 ? (cells[stdIdx] || '') : know;
        const act = actIdx >= 0 ? (cells[actIdx] || '') : '';
        const method = methodIdx >= 0 ? (cells[methodIdx] || '') : '';
        const aid = aidIdx >= 0 ? (cells[aidIdx] || '') : '';
        const ref = refIdx >= 0 ? (cells[refIdx] || '') : '';

        if (!know || know.length < 4 || /^n\/?a$/i.test(know)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          know = sMatch?.knowledge || deriveKnowledgeFromOutcome(comp, sub, top);
        }
        if (!skills || skills.length < 4 || /^n\/?a$/i.test(skills)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          skills = sMatch?.skills || deriveSkillsFromOutcome(comp, sub, top);
        }
        if (!values || values.length < 4 || /^n\/?a$/i.test(values)) {
          const sMatch = findSyllabusEntryForForecast(top, sub, comp, grade, subject);
          values = sMatch?.values || deriveValuesFromOutcome(comp, sub, top);
        }

        return {
          day: targetDay,
          week: targetWeek,
          topic: toStr(top),
          subtopic: toStr(sub),
          competency: toStr(comp),
          expectedStandard: toStr(std),
          knowledge: toStr(know),
          skills: toStr(skills),
          values: toStr(values),
          learningActivities: act ? [toStr(act)] : [],
          teachingMethods: toStr(method),
          teachingAids: toStr(aid),
          references: toStr(ref)
        };
      }
    }
  }

  // Fallback to ParsedSchemeWeek
  const schemeWeek = extractWeekFromPastedText(rawText, targetWeek, grade, subject);
  if (schemeWeek) {
    const numSubs = schemeWeek.subtopics?.length || 1;
    const subIdx = Math.min(targetDay - 1, numSubs - 1);
    const sub = schemeWeek.subtopics?.[subIdx] || schemeWeek.subtopics?.[0] || '';
    const comp = schemeWeek.competencies?.[subIdx] || schemeWeek.competencies?.[0] || '';
    const act = schemeWeek.activities?.[targetDay - 1] || schemeWeek.activities?.[0] || '';
    let know = schemeWeek.knowledge?.[subIdx] || schemeWeek.knowledge?.[0] || '';
    let skills = schemeWeek.skills?.[subIdx] || schemeWeek.skills?.[0] || '';
    let values = schemeWeek.values?.[subIdx] || schemeWeek.values?.[0] || '';

    if (!know || know.length < 4 || /^n\/?a$/i.test(know)) {
      const sMatch = findSyllabusEntryForForecast(schemeWeek.topic, sub, comp, grade, subject);
      know = sMatch?.knowledge || deriveKnowledgeFromOutcome(comp, sub, schemeWeek.topic);
    }
    if (!skills || skills.length < 4 || /^n\/?a$/i.test(skills)) {
      const sMatch = findSyllabusEntryForForecast(schemeWeek.topic, sub, comp, grade, subject);
      skills = sMatch?.skills || deriveSkillsFromOutcome(comp, sub, schemeWeek.topic);
    }
    if (!values || values.length < 4 || /^n\/?a$/i.test(values)) {
      const sMatch = findSyllabusEntryForForecast(schemeWeek.topic, sub, comp, grade, subject);
      values = sMatch?.values || deriveValuesFromOutcome(comp, sub, schemeWeek.topic);
    }

    return {
      day: targetDay,
      week: targetWeek,
      topic: toStr(schemeWeek.topic),
      subtopic: toStr(sub),
      competency: toStr(comp),
      expectedStandard: toStr(schemeWeek.expectedStandards?.[0]),
      knowledge: toStr(know),
      skills: toStr(skills),
      values: toStr(values),
      learningActivities: act ? [toStr(act)] : (Array.isArray(schemeWeek.activities) ? schemeWeek.activities.map(a => toStr(a)) : []),
      teachingMethods: toStr(schemeWeek.methods?.[0]),
      teachingAids: toStr(schemeWeek.teachingAids),
      references: toStr(schemeWeek.references)
    };
  }

  return null;
}

/**
 * Parses a date range string like "07-09-2026 to 11-09-2026" or "21/09/2026 - 25/09/2026"
 * into an array of 5 dates for Monday through Friday (in "DD-MM-YYYY" format).
 */
export function parseDateRangeToDays(dateRangeStr?: string | null): string[] {
  if (!dateRangeStr || typeof dateRangeStr !== 'string') return [];
  const match = dateRangeStr.match(/(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})\s*(?:to|-|\b)\s*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/i);
  if (!match) return [];

  const startPart = match[1];
  const dateTokens = startPart.split(/[-\/.]/);
  if (dateTokens.length < 3) return [];

  const d = parseInt(dateTokens[0], 10);
  const m = parseInt(dateTokens[1], 10) - 1;
  const y = parseInt(dateTokens[2].length === 2 ? `20${dateTokens[2]}` : dateTokens[2], 10);

  if (isNaN(d) || isNaN(m) || isNaN(y)) return [];

  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const dt = new Date(y, m, d + i);
    const dayStr = String(dt.getDate()).padStart(2, '0');
    const monthStr = String(dt.getMonth() + 1).padStart(2, '0');
    const yearStr = dt.getFullYear();
    days.push(`${dayStr}-${monthStr}-${yearStr}`);
  }
  return days;
}

/**
 * Derives the Term Start Date (Monday of Week 1) given a week's starting date (DD-MM-YYYY) and week number.
 */
export function deriveTermStartDate(day1DateStr: string, weekNum: number): string {
  const parts = day1DateStr.split(/[-\/.]/);
  if (parts.length < 3) return '';
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);

  const date = new Date(y, m, d);
  date.setDate(date.getDate() - (Math.max(1, weekNum) - 1) * 7);

  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

export interface ExtractedMetadata {
  grade?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
}

/**
 * Parses any pasted text (instructions/weekly forecast/pasted schemes/extracted text)
 * and intelligently extracts Grade, Subject, Topic, and Subtopic if present.
 */
export function extractFullMetadataFromText(
  text?: string | null,
  targetDay: number = 1,
  targetWeek: number = 1
): ExtractedMetadata {
  if (!text || typeof text !== 'string') return {};
  const lower = text.toLowerCase();
  const res: ExtractedMetadata = {};

  // 1. GRADE DETECTION
  const gradeMatch = text.match(/\b(?:Grade|Form|Class|Level|ECE)\s*([0-9]{1,2}|[A-Za-z]+)\b/i);
  if (gradeMatch) {
    const rawG = gradeMatch[0].trim();
    if (/ece/i.test(rawG)) res.grade = 'ECE / Primary';
    else if (/form/i.test(rawG)) {
      const numMatch = rawG.match(/\d+/);
      if (numMatch) {
        res.grade = `Form ${numMatch[0]} (OBC)`;
      } else {
        res.grade = rawG;
      }
    } else {
      const numMatch = rawG.match(/\d+/);
      if (numMatch) {
        res.grade = `Grade ${numMatch[0]} (CBC)`;
      } else {
        res.grade = rawG;
      }
    }
  } else {
    // Specific quick checks
    if (/\bgrade\s*1\b/i.test(text)) res.grade = 'Grade 1 (CBC)';
    else if (/\bgrade\s*2\b/i.test(text)) res.grade = 'Grade 2 (CBC)';
    else if (/\bgrade\s*3\b/i.test(text)) res.grade = 'Grade 3 (CBC)';
    else if (/\bgrade\s*4\b/i.test(text)) res.grade = 'Grade 4 (CBC)';
    else if (/\bgrade\s*5\b/i.test(text)) res.grade = 'Grade 5 (CBC)';
    else if (/\bgrade\s*6\b/i.test(text)) res.grade = 'Grade 6 (CBC)';
    else if (/\bgrade\s*7\b/i.test(text)) res.grade = 'Grade 7 (CBC)';
    else if (/\bgrade\s*8\b/i.test(text)) res.grade = 'Grade 8 (CBC)';
    else if (/\bgrade\s*9\b/i.test(text)) res.grade = 'Grade 9 (CBC)';
    else if (/\bform\s*1\b/i.test(text)) res.grade = 'Form 1 (OBC)';
    else if (/\bform\s*2\b/i.test(text)) res.grade = 'Form 2 (OBC)';
    else if (/\bform\s*3\b/i.test(text)) res.grade = 'Form 3 (OBC)';
    else if (/\bform\s*4\b/i.test(text)) res.grade = 'Form 4 (OBC)';
    else if (/\bform\s*5\b/i.test(text)) res.grade = 'Form 5 (OBC)';
    else if (/\bform\s*6\b/i.test(text)) res.grade = 'Form 6 (OBC)';
  }

  // 2. SUBJECT DETECTION
  const subjects = [
    'Integrated Science', 'Science', 'Mathematics', 'Math', 'Social Studies',
    'English', 'Literacy', 'Oral English', 'ICT', 'Computer Studies',
    'Home Economics', 'Agricultural Science', 'Expressive Arts', 'Technology Studies',
    'Zambian Languages', 'Icibemba', 'Chinyanja', 'Silozi', 'Chitonga', 'Lunda', 'Luvale', 'Kiikaonde',
    'Biology', 'Chemistry', 'Physics', 'Geography', 'History', 'Civic Education', 'Commerce'
  ];
  for (const subj of subjects) {
    const reg = new RegExp(`\\b${subj.replace('/', '\\/')}\\b`, 'i');
    if (reg.test(text)) {
      res.subject = subj;
      break;
    }
  }

  // 3. TOPIC DETECTION
  const topicMatch = text.match(/(?:Topic|Theme|Unit|TOPIC|THEME)\s*[:\-]\s*([^\n\r,|;]+)/i);
  if (topicMatch) {
    res.topic = cleanExtractedTopic(topicMatch[1].trim());
  } else {
    const lessonData = extractLessonFromPastedForecastText(text, targetDay, targetWeek);
    if (lessonData?.topic) {
      res.topic = cleanExtractedTopic(lessonData.topic);
    }
  }

  // 4. SUBTOPIC DETECTION
  const subtopicMatch = text.match(/(?:Subtopic|Sub-topic|SUBTOPIC|Sub\s*Topic)\s*[:\-]\s*([^\n\r,|;]+)/i);
  if (subtopicMatch) {
    const rawList = subtopicMatch[1].split(/[,;]/).map(s => s.trim());
    res.subtopic = cleanExtractedSubtopics(rawList).join(', ');
  } else {
    const lessonData = extractLessonFromPastedForecastText(text, targetDay, targetWeek);
    if (lessonData?.subtopic) {
      const rawList = lessonData.subtopic.split(/[,;]/).map(s => s.trim());
      res.subtopic = cleanExtractedSubtopics(rawList).join(', ');
    }
  }

  return res;
}

export interface ParsedForecastDay {
  day: number | string;
  dayLabel?: string;
  date?: string;
  component?: string;
  topic: string;
  subtopic: string;
  competency: string;
  expectedStandard?: string;
  knowledge?: string;
  skills?: string;
  values?: string;
  activities?: string[];
  teachingMethods?: string;
  teachingAids?: string;
  references?: string;
  recordOfWork?: string;
  isRevision?: boolean;
}

/**
 * Detects whether the pasted text represents an outside Weekly Forecast document or table.
 */
export function isPastedWeeklyForecast(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.length < 15) return false;

  const hasDay1 = /(?:^|[|\t\n\r\s*#])(?:day)\s*1\b/i.test(text);
  const hasDay2 = /(?:^|[|\t\n\r\s*#])(?:day)\s*2\b/i.test(text);
  const hasDay3 = /(?:^|[|\t\n\r\s*#])(?:day)\s*3\b/i.test(text);
  const hasWeeklyForecastHeader = /weekly\s+forecast/i.test(text);
  const hasWeekdays = /(?:^|[|\t\n\r\s*#])(?:monday|tuesday|wednesday|thursday|friday)\b/i.test(text);

  if (hasDay1 && (hasDay2 || hasDay3 || hasWeeklyForecastHeader || hasWeekdays)) return true;
  if (hasWeeklyForecastHeader && (hasDay1 || /(?:^|[|\t\n\r\s*#])(?:day)\b/i.test(text) || hasWeekdays)) return true;
  if (hasWeeklyForecastHeader) return true;

  // Also check if table has DAY column header and at least 2 rows
  const lines = text.split('\n');
  const pipeLines = lines.filter(l => (l.match(/\||\t/g) || []).length >= 3);
  if (pipeLines.length >= 2) {
    const hasDayCol = pipeLines.some(l => /\bday\b/i.test(l) && !/\bholiday\b/i.test(l));
    if (hasDayCol) return true;
  }

  return false;
}

export interface SyllabusMatchResult {
  grade: string;
  subject: string;
  topic: string;
  subtopic: string;
  component?: string;
  expectedStandard?: string | string[];
  learningActivities?: string[] | Record<string, string[]>;
  competencies?: string[];
  knowledge?: string;
  skills?: string;
  values?: string;
  teachingMethods?: string;
  teachingAids?: string;
  references?: string;
}

/**
 * Searches the official Zambian Syllabi repository for a matching topic, subtopic, or outcome code
 * to extract authentic Expected Standards, Learning Activities, Knowledge, Skills, Values,
 * Teaching Methods, Teaching Aids, and References.
 * Prioritizes OBC syllabi when OBC curriculum or grade is specified.
 */
export function findSyllabusEntryForForecast(
  topicText?: string,
  subtopicText?: string,
  compText?: string,
  grade?: string,
  subject?: string,
  curriculumType?: string
): SyllabusMatchResult | null {
  const cleanStr = (s?: string) => (s || '')
    .toLowerCase()
    .replace(/\(page\s*\d+\)/gi, '')
    .replace(/^[0-9\.\s\-–—:]+/, '')
    .trim();

  const tNorm = cleanStr(topicText);
  const sNorm = cleanStr(subtopicText);
  const cNorm = cleanStr(compText);

  // Extract code if present (e.g. 1.1.1.1 or 3.2.1)
  const codeMatch = (compText || subtopicText || topicText || '').match(/\b(\d+(?:\.\d+){1,3})\b/);
  const code = codeMatch ? codeMatch[1] : null;

  const tWords = tNorm.split(/[\s,;&/]+/).filter(w => w.length >= 3);
  const sWords = sNorm.split(/[\s,;&/]+/).filter(w => w.length >= 3);

  const gradeStr = (grade || '').toLowerCase();
  const subjectStr = (subject || '').toLowerCase();
  const isExplicitOBC = curriculumType === 'OBC' || gradeStr.includes('obc') || gradeStr.includes('obe');
  const gradeNumMatch = gradeStr.match(/\b(?:grade|form)\s*(\d{1,2})\b/i) || gradeStr.match(/\b(\d{1,2})\b/);
  const targetGradeNum = gradeNumMatch ? parseInt(gradeNumMatch[1], 10) : null;

  const extractSyllabusData = (gKey: string, sKey: string, t: any, sub: any): SyllabusMatchResult => {
    // 1. Expected standards: direct or embedded in competencies
    let expStd = sub.expectedStandard;
    if (!expStd || (Array.isArray(expStd) && expStd.length === 0)) {
      const embedded = (sub.competencies || []).map((c: string) => {
        const parsed = parseRawCompetency(c);
        return parsed.expectedStandard;
      }).filter(Boolean);
      if (embedded.length > 0) expStd = embedded;
    }

    // 2. Learning activities: direct or embedded in competencies
    let learnActs = sub.learningActivities;
    if (!learnActs || (Array.isArray(learnActs) && learnActs.length === 0)) {
      const embeddedActs = (sub.competencies || []).flatMap((c: string) => {
        const parsed = parseRawCompetency(c);
        return parsed.learningActivities || [];
      }).filter(Boolean);
      if (embeddedActs.length > 0) learnActs = embeddedActs;
    }

    // 3. Knowledge, skills, values: direct or embedded
    let know = typeof sub.knowledge === 'string' ? sub.knowledge : (Array.isArray(sub.knowledge) ? sub.knowledge.join('; ') : '');
    let skill = typeof sub.skills === 'string' ? sub.skills : (Array.isArray(sub.skills) ? sub.skills.join('; ') : '');
    let val = typeof sub.values === 'string' ? sub.values : (Array.isArray(sub.values) ? sub.values.join('; ') : '');

    if (!know || !skill || !val) {
      for (const c of (sub.competencies || [])) {
        const parsed = parseRawCompetency(c);
        if (!know && parsed.knowledge) know = parsed.knowledge;
        if (!skill && parsed.skills) skill = parsed.skills;
        if (!val && parsed.values) val = parsed.values;
      }
    }

    if (!know && t.knowledge) {
      know = typeof t.knowledge === 'string' ? t.knowledge : (Array.isArray(t.knowledge) ? t.knowledge.join('; ') : '');
    }
    if (!skill && t.skills) {
      skill = typeof t.skills === 'string' ? t.skills : (Array.isArray(t.skills) ? t.skills.join('; ') : '');
    }
    if (!val && t.values) {
      val = typeof t.values === 'string' ? t.values : (Array.isArray(t.values) ? t.values.join('; ') : '');
    }

    // In OBC: extract substantive knowledge from learning activities or expected standards if not explicitly defined
    if (!know || know.trim().length < 4 || /^n\/?a$/i.test(know.trim())) {
      if (learnActs && learnActs.length > 0) {
        const substantiveConcepts = (Array.isArray(learnActs) ? learnActs : [String(learnActs)])
          .map((a: string) => a.replace(/^[•\-\*\s]+/, '').replace(/^(?:identifying|describing|exploring|discussing|relating|making|demonstrating|practising|sorting|classifying|investigating)\s+/i, '').trim())
          .filter(a => a.length > 3);
        if (substantiveConcepts.length > 0) {
          know = substantiveConcepts.join('; ');
        }
      }
    }

    if (!know || know.trim().length < 4 || /^n\/?a$/i.test(know.trim())) {
      if (sub.expectedStandard) {
        const stdList = Array.isArray(sub.expectedStandard) ? sub.expectedStandard : [String(sub.expectedStandard)];
        const cleanStd = stdList
          .map((s: string) => s.replace(/^[•\-\*\s]+/, '').replace(/\b(?:identified|described|demonstrated|stated|classified|listed|explained|solved|calculated|drawn)\b\s*(?:appropriately|correctly|accordingly|accurately)?/gi, '').trim())
          .filter((s: string) => s.length > 5)
          .join('; ');
        if (cleanStd && cleanStd.length > 5) {
          know = cleanStd;
        }
      }
    }

    const firstOutcome = (sub.competencies && sub.competencies.length > 0) ? sub.competencies[0] : (sub.title || t.title);
    if (!know || know.trim().length < 4 || /^n\/?a$/i.test(know.trim())) {
      know = deriveKnowledgeFromOutcome(firstOutcome, sub.title, t.title);
    }
    if (!skill || skill.trim().length < 4 || /^n\/?a$/i.test(skill.trim())) {
      skill = deriveSkillsFromOutcome(firstOutcome, sub.title, t.title);
    }
    if (!val || val.trim().length < 4 || /^n\/?a$/i.test(val.trim())) {
      val = deriveValuesFromOutcome(firstOutcome, sub.title, t.title);
    }

    const teachingMethods = (sub.teachingMethods || t.teachingMethods) 
      ? String(sub.teachingMethods || t.teachingMethods) 
      : '• Teacher exposition • Question and answer • Class discussion • Group work • Demonstration';

    const teachingAids = (sub.teachingAids || t.teachingAids) 
      ? String(sub.teachingAids || t.teachingAids) 
      : `Chalkboard and chalk, wall charts, learner's textbooks, flashcards, realia/models for ${sub.title || t.title}`;

    const references = (sub.references || t.references) 
      ? String(sub.references || t.references) 
      : getOfficialSyllabusCitation(gKey, sKey, isExplicitOBC ? 'OBC' : 'CBC');

    return {
      grade: gKey,
      subject: sKey,
      topic: t.title,
      subtopic: sub.title,
      component: sub.component || t.component,
      expectedStandard: expStd,
      learningActivities: learnActs,
      competencies: sub.competencies,
      knowledge: know,
      skills: skill,
      values: val,
      teachingMethods,
      teachingAids,
      references
    };
  };

  // Helper to test if topic/subtopic match
  const matchesSubtopic = (t: any, sub: any): boolean => {
    const titleClean = cleanStr(t.title);
    const subClean = cleanStr(sub.title);

    // Special sound/phonics mapping for early grade English / Literacy in English
    const isSoundsTopic = tNorm && (tNorm.includes('sound') || tNorm.includes('phonic') || tNorm.includes('literacy'));
    if (isSoundsTopic) {
      const subTitleLower = subClean.toLowerCase();
      const soundVal = sNorm.replace(/^sound\s+/i, '').replace(/[\s\(\)\/]/g, '').trim();

      if (soundVal) {
        // Digraphs
        const digraphs = ['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng', 'oo', 'oa', 'ee', 'ai', 'ou', 'oi', 'ay', 'or', 'ar', 'er', 'ir', 'ur'];
        // Blends
        const blends = ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw'];
        // Short vowels
        const shortVowels = ['a', 'e', 'i', 'o', 'u'];

        if (digraphs.includes(soundVal) && subTitleLower.includes('digraph')) return true;
        if (blends.includes(soundVal) && subTitleLower.includes('blend')) return true;
        if (shortVowels.includes(soundVal) && subTitleLower.includes('short vowel')) return true;
        
        // Default consonants
        const consonants = ['s', 't', 'p', 'n', 'm', 'd', 'g', 'c', 'k', 'r', 'h', 'f', 'b', 'l', 'j', 'v', 'w', 'y', 'z', 'x', 'q'];
        if (consonants.includes(soundVal) && subTitleLower.includes('consonant') && !subTitleLower.includes('blend')) return true;
      }
    }

    // Code match
    if (code) {
      if ((sub.competencies || []).some((c: string) => c.includes(code))) return true;
      if (sub.title.includes(code) || t.title.includes(code)) return true;
    }

    const tExactMatch = tNorm && (titleClean.includes(tNorm) || tNorm.includes(titleClean));
    const sExactMatch = sNorm && (subClean.includes(sNorm) || sNorm.includes(subClean));

    if (tExactMatch && sExactMatch) return true;
    if (sExactMatch && sNorm.length >= 4) return true;

    // Word token match
    const sWordMatch = sWords.length > 0 && sWords.some(w => subClean.includes(w));
    const tWordMatch = tWords.length > 0 && tWords.some(w => titleClean.includes(w));

    if (tWordMatch && sWordMatch) return true;
    if (sWordMatch && !tNorm) return true;
    if (tExactMatch && !sNorm) return true;

    // Competency text match
    if (cNorm && cNorm.length >= 6) {
      const cMatch = (sub.competencies || []).some((c: string) => {
        const cleanC = cleanStr(c);
        return cleanC.includes(cNorm.slice(0, 20)) || cNorm.includes(cleanC.slice(0, 20));
      });
      if (cMatch && (tWordMatch || sWordMatch || !tNorm)) return true;
    }

    return false;
  };

  const cleanSubjectNorm = subjectStr.replace(/[^a-z0-9]/g, '');
  const isMatchSubject = (sKey: string): boolean => {
    if (!cleanSubjectNorm) return true;
    const sKeyNorm = sKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sKeyNorm === cleanSubjectNorm) return true;
    if (sKeyNorm.includes(cleanSubjectNorm) || cleanSubjectNorm.includes(sKeyNorm)) return true;
    if ((cleanSubjectNorm.includes('science') || cleanSubjectNorm.includes('biology') || cleanSubjectNorm.includes('physics') || cleanSubjectNorm.includes('chemistry')) && 
        (sKeyNorm.includes('science') || sKeyNorm.includes('biology') || sKeyNorm.includes('physics') || sKeyNorm.includes('chemistry'))) return true;
    if ((cleanSubjectNorm.includes('math') || cleanSubjectNorm.includes('numeracy')) && sKeyNorm.includes('math')) return true;
    if ((cleanSubjectNorm.includes('social') || cleanSubjectNorm.includes('civic') || cleanSubjectNorm.includes('history') || cleanSubjectNorm.includes('geography')) && 
        (sKeyNorm.includes('social') || sKeyNorm.includes('civic') || sKeyNorm.includes('history') || sKeyNorm.includes('geography'))) return true;
    if ((cleanSubjectNorm.includes('english') || cleanSubjectNorm.includes('literacy')) && (sKeyNorm.includes('english') || sKeyNorm.includes('literacy'))) return true;
    if (cleanSubjectNorm.includes('zambian') && sKeyNorm.includes('zambian')) return true;
    if ((cleanSubjectNorm.includes('tech') || cleanSubjectNorm.includes('computer') || cleanSubjectNorm.includes('ict')) && 
        (sKeyNorm.includes('tech') || sKeyNorm.includes('computer') || sKeyNorm.includes('ict'))) return true;
    if ((cleanSubjectNorm.includes('home') || cleanSubjectNorm.includes('hospitality')) && (sKeyNorm.includes('home') || sKeyNorm.includes('hospitality'))) return true;
    if ((cleanSubjectNorm.includes('art') || cleanSubjectNorm.includes('expressive')) && (sKeyNorm.includes('art') || sKeyNorm.includes('expressive'))) return true;
    if (cleanSubjectNorm.includes('religio') && sKeyNorm.includes('religio')) return true;
    return false;
  };

  const getGradeScore = (gKey: string): number => {
    const gKeyLower = gKey.toLowerCase();
    const gKeyNumMatch = gKeyLower.match(/\b(?:grade|form)\s*(\d{1,2})\b/i) || gKeyLower.match(/\b(\d{1,2})\b/);
    const gKeyNum = gKeyNumMatch ? parseInt(gKeyNumMatch[1], 10) : null;
    const sameGrade = targetGradeNum !== null && gKeyNum === targetGradeNum;
    const isGKeyOBC = gKeyLower.includes('obc') || gKeyLower.includes('obe');

    if (isExplicitOBC) {
      if (isGKeyOBC && sameGrade) return 100;
      if (isGKeyOBC) return 80;
      if (sameGrade) return 40;
      return 10;
    } else {
      if (!isGKeyOBC && sameGrade) return 100;
      if (!isGKeyOBC) return 70;
      if (sameGrade) return 40;
      return 10;
    }
  };

  const sortedGrades = Object.entries(SYLLABI).sort(([aKey], [bKey]) => {
    return getGradeScore(bKey) - getGradeScore(aKey);
  });

  // 1. Try matching within priority-scored grades and matching subjects first
  for (const [gKey, gObj] of sortedGrades) {
    for (const [sKey, topics] of Object.entries(gObj)) {
      if (!isMatchSubject(sKey)) continue;
      for (const t of topics) {
        for (const sub of (t.subtopics || [])) {
          if (matchesSubtopic(t, sub)) {
            return extractSyllabusData(gKey, sKey, t, sub);
          }
        }
      }
    }
  }

  // 2. Global search across all grades for matching subject
  for (const [gKey, gObj] of sortedGrades) {
    for (const [sKey, topics] of Object.entries(gObj)) {
      for (const t of topics) {
        for (const sub of (t.subtopics || [])) {
          if (matchesSubtopic(t, sub)) {
            return extractSyllabusData(gKey, sKey, t, sub);
          }
        }
      }
    }
  }

  // 3. Fallback: Search all subjects if code or subtopic matched
  for (const [gKey, gObj] of sortedGrades) {
    for (const [sKey, topics] of Object.entries(gObj)) {
      for (const t of topics) {
        for (const sub of (t.subtopics || [])) {
          if (code && ((sub.competencies || []).some((c: string) => c.includes(code)) || sub.title.includes(code))) {
            return extractSyllabusData(gKey, sKey, t, sub);
          }
          if (sNorm && sNorm.length >= 5 && cleanStr(sub.title).includes(sNorm)) {
            return extractSyllabusData(gKey, sKey, t, sub);
          }
        }
      }
    }
  }

  return null;
}

/**
 * Helper to split a Markdown or pipe table row into cells, safely preserving empty cells
 * and trimming boundary pipes without index-shifting side-effects.
 */
function splitPipeRow(row: string): string[] {
  let trimmed = row.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map(c => c.trim());
}

/**
 * Enriches parsed Weekly Forecast days with authentic Zambian Syllabus data:
 * - Fills missing EXPECTED STANDARDS directly from the official syllabus matching the content provided
 * - Fills missing LEARNING ACTIVITIES directly from the official syllabus
 * - Fills missing KNOWLEDGE, SKILLS, VALUES, TEACHING METHODS, T/L AIDS, and REFERENCES
 * - Allocates Topic, Subtopic, and Component accurately without cell/column shifts
 */
export function enrichForecastDaysWithSyllabus(
  days: ParsedForecastDay[],
  grade?: string,
  subject?: string,
  curriculumType?: string
): ParsedForecastDay[] {
  if (!days || days.length === 0) return [];

  const sLow = (subject || '').toLowerCase();
  const isLanguageSubject = Boolean(
    sLow.includes('english') ||
    sLow.includes('zambian') ||
    sLow.includes('literacy') ||
    sLow.includes('oral') ||
    sLow.includes('cinyanja') ||
    sLow.includes('nyanja') ||
    sLow.includes('bemba') ||
    sLow.includes('tonga') ||
    sLow.includes('lozi') ||
    sLow.includes('luvale') ||
    sLow.includes('lunda') ||
    sLow.includes('kaonde')
  );

  return days.map((d, dIdx) => {
    let top = d.topic || '';
    let sub = d.subtopic || '';
    let compVal = d.competency || '';
    let stdVal = d.expectedStandard || '';
    let acts = Array.isArray(d.activities) ? [...d.activities] : (d.activities ? [String(d.activities)] : []);

    // Helper to extract concatenated labels
    let extractedAct: string | undefined;
    let extractedComp: string | undefined;

    const sanitizeField = (str: string) => {
      if (!str) return '';
      let s = str;
      const actM = s.match(/(?:\*|\s|^)(?:learning\s*activities|activities)\s*:\s*([^:*|]+)/i);
      if (actM) {
        extractedAct = actM[1].trim();
        s = s.replace(actM[0], '');
      }
      const compM = s.match(/(?:\*|\s|^)(?:specific\s*competenc(?:ies|y)|specific\s*outcomes?|competenc(?:ies|y)|outcomes?)\s*:\s*([^:*|]+)/i);
      if (compM) {
        extractedComp = compM[1].trim();
        s = s.replace(compM[0], '');
      }
      // Strip parenthetical day ranges like (Monday to Friday), (Monday-Friday), (Mon-Fri), (Monday), etc.
      s = s.replace(/\s*\(\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*(?:to|\-|\&|through)\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*\)/gi, '');
      s = s.replace(/\s*\(\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*\)/gi, '');
      return s.replace(/^[*_:\-\s]+/, '').replace(/[*_:\-\s]+$/, '').trim();
    };

    top = sanitizeField(top);
    sub = sanitizeField(sub);
    compVal = sanitizeField(compVal);

    if (extractedComp && !compVal) {
      compVal = extractedComp;
    }
    if (extractedAct && (acts.length === 0 || acts.every(a => !a || a.includes('• • •') || a === '...'))) {
      acts = [extractedAct];
    }

    // 1. Separate topic and subtopic if topic contains combined string
    if (top && (!sub || sub.trim() === '')) {
      const split = splitTopicAndSubtopics(top, subject);
      if (split.subtopics.length > 0) {
        top = split.topic;
        sub = split.subtopics.join(', ');
      }
    }

    // 2. Query syllabus
    const match = findSyllabusEntryForForecast(top, sub, compVal, grade, subject, curriculumType);

    if (match) {
      if (!top || top.trim() === '') {
        top = match.topic;
      } else if (match.topic && !/^\d+(\.\d+)+/.test(top) && /^\d+(\.\d+)+/.test(match.topic)) {
        top = match.topic;
      }

      if (!sub || sub.trim() === '') {
        sub = match.subtopic;
      } else if (match.subtopic && !/^\d+(\.\d+)+/.test(sub) && /^\d+(\.\d+)+/.test(match.subtopic)) {
        sub = match.subtopic;
      }
    }

    if (sub) {
      sub = sub.replace(/\(page\s*\d+\)/gi, '').trim();
    }

    // 3. Resolve Component if language subject
    let compCol = d.component;
    if (!compCol && isLanguageSubject) {
      if (match?.component) {
        compCol = match.component;
      } else {
        const cleanT = (top + ' ' + sub).toLowerCase();
        if (cleanT.includes('read') || cleanT.includes('comprehension')) compCol = 'Reading';
        else if (cleanT.includes('writ') || cleanT.includes('composition') || cleanT.includes('letter') || cleanT.includes('spelling')) compCol = 'Writing';
        else if (cleanT.includes('structure') || cleanT.includes('grammar') || cleanT.includes('tense')) compCol = 'Structure';
        else compCol = 'Listening & Speaking';
      }
    }

    // 4. Resolve Competency / Specific Outcome
    if ((!compVal || compVal.trim() === '' || compVal.toLowerCase() === 'n/a' || compVal.toLowerCase() === 'na' || compVal.toLowerCase() === 'n.a') && match?.competencies && match.competencies.length > 0) {
      compVal = match.competencies[dIdx % match.competencies.length] || match.competencies[0];
    }

    // 5. Resolve EXPECTED STANDARDS (CRITICAL: Sourced exactly from syllabus based on provided content)
    const isStdEmptyOrGeneric = !stdVal || 
      stdVal.trim() === '' || 
      stdVal === d.knowledge || 
      stdVal.toLowerCase().includes('n/a') || 
      stdVal.trim().toLowerCase() === 'na' ||
      stdVal.trim().toLowerCase() === 'n.a' ||
      stdVal.includes('.....') ||
      stdVal.toLowerCase().includes('learners apply competencies accurately') ||
      stdVal.toLowerCase().startsWith('learner demonstrate mastery');

    if (isStdEmptyOrGeneric) {
      if (match?.expectedStandard) {
        if (Array.isArray(match.expectedStandard)) {
          stdVal = match.expectedStandard[dIdx % match.expectedStandard.length] || match.expectedStandard[0];
        } else {
          stdVal = String(match.expectedStandard);
        }
      } else if (compVal) {
        stdVal = deriveExpectedStandardFromCompetency(compVal);
      } else if (sub) {
        stdVal = deriveExpectedStandardFromCompetency(sub);
      } else if (top) {
        stdVal = deriveExpectedStandardFromCompetency(top);
      } else {
        stdVal = 'Learners demonstrate mastery of topic competencies according to syllabus standards.';
      }
    }

    // 6. Resolve LEARNING ACTIVITIES
    const isActEmpty = !acts || acts.length === 0 || acts.every(a => !a || a.trim() === '' || a.includes('• • •') || a === '...' || a.toLowerCase() === 'n/a' || a.toLowerCase() === 'na' || a.toLowerCase() === 'n.a');
    if (isActEmpty) {
      if (match?.learningActivities) {
        if (Array.isArray(match.learningActivities)) {
          const actChoice = match.learningActivities[dIdx % match.learningActivities.length] || match.learningActivities[0];
          acts = [actChoice];
        } else if (typeof match.learningActivities === 'object') {
          const compClean = (compVal || sub || '').toLowerCase().trim();
          const matchedKey = Object.keys(match.learningActivities).find(k => {
            const kLow = k.toLowerCase().trim();
            return compClean && (kLow.includes(compClean) || compClean.includes(kLow));
          });
          if (matchedKey && Array.isArray((match.learningActivities as any)[matchedKey])) {
            const mActs = (match.learningActivities as any)[matchedKey];
            acts = [mActs[dIdx % mActs.length] || mActs[0]];
          } else {
            const allActs = Object.values(match.learningActivities).flat();
            acts = [allActs[dIdx % allActs.length] || allActs[0]];
          }
        } else {
          acts = [String(match.learningActivities)];
        }
      } else {
        acts = deriveLearningActivitiesFromCompetency(compVal, sub, top);
      }
    }

    // Filter empty/dot activity strings
    acts = acts.map(a => a.replace(/^[•\-\*\s]+/, '').trim()).filter(a => a && a !== '...' && a !== '• • •');

    // 7. Resolve KNOWLEDGE, SKILLS, VALUES (Mandatory for OBC Curriculum)
    let knowVal = (d.knowledge || '').trim();
    const isKnowMismatched = match?.knowledge && sub && (
      (/calendar/i.test(sub) && !/calendar/i.test(knowVal)) ||
      (/fraction/i.test(sub) && !/fraction/i.test(knowVal)) ||
      (/distance|length|km/i.test(sub) && !/distance|length|km|meter/i.test(knowVal)) ||
      (/mass|gram/i.test(sub) && !/mass|gram|weight/i.test(knowVal)) ||
      (/capacity|litre/i.test(sub) && !/capacity|litre/i.test(knowVal))
    );
    if (!knowVal || knowVal.length < 4 || /^n\/?a$/i.test(knowVal) || knowVal === '...' || isKnowMismatched) {
      knowVal = (match?.knowledge || '').trim() || deriveKnowledgeFromOutcome(compVal, sub, top);
    }

    let skillsVal = (d.skills || '').trim();
    const isSkillsMismatched = match?.skills && sub && (
      (/calendar/i.test(sub) && !/calendar/i.test(skillsVal)) ||
      (/fraction/i.test(sub) && !/fraction/i.test(skillsVal))
    );
    if (!skillsVal || skillsVal.length < 4 || /^n\/?a$/i.test(skillsVal) || skillsVal === '...' || isSkillsMismatched) {
      skillsVal = (match?.skills || '').trim() || deriveSkillsFromOutcome(compVal, sub, top);
    }

    let valuesVal = (d.values || '').trim();
    if (!valuesVal || valuesVal.length < 4 || /^n\/?a$/i.test(valuesVal) || valuesVal === '...') {
      valuesVal = (match?.values || '').trim() || deriveValuesFromOutcome(compVal, sub, top);
    }

    // 8. Resolve TEACHING METHODS (Vary by day according to CBC Gradual Release of Responsibility)
    let methodsVal = (d.teachingMethods || '').trim();
    if (!methodsVal || methodsVal.length < 3 || /^n\/?a$/i.test(methodsVal) || methodsVal === '...' || methodsVal.includes('Teacher exposition • Question and answer • Class discussion • Group work • Demonstration • Practical activity')) {
      methodsVal = getVariedTeachingMethods(dIdx, sub);
    }

    // 9. Resolve TEACHING AIDS (Concise, 2-3 aids max, avoid cell overload, tailored to the lesson)
    let aidsVal = (d.teachingAids || '').trim();
    const isAidsMismatched = match?.teachingAids && sub && (
      (/calendar/i.test(sub) && !/calendar/i.test(aidsVal)) ||
      (/clock|time/i.test(sub) && !/clock|time/i.test(aidsVal))
    );
    const isAidsOverloaded = aidsVal.includes('Chalkboard and chalk, wall charts, learner\'s textbooks, flashcards, realia/models');
    if (!aidsVal || aidsVal.length < 3 || /^n\/?a$/i.test(aidsVal) || aidsVal === '...' || isAidsMismatched || isAidsOverloaded) {
      aidsVal = getConciseTeachingAids(dIdx, sub);
    }

    // 10. Resolve REFERENCES (Exact short reference format with indication of upload/paste method)
    let refVal = (d.references || '').trim();
    if (!refVal || refVal.length < 3 || /^n\/?a$/i.test(refVal) || refVal.toLowerCase() === 'official zambian syllabus' || refVal === '...' || refVal.includes('CDC 20')) {
      refVal = getOfficialSyllabusCitation(grade || 'Grade 3-7', subject || 'Science', curriculumType || (grade && grade.includes('OBC') ? 'OBC' : 'CBC'), undefined, true);
    }

    return {
      ...d,
      topic: top,
      subtopic: sub,
      component: compCol,
      competency: compVal,
      expectedStandard: stdVal,
      activities: acts,
      knowledge: knowVal,
      skills: skillsVal,
      values: valuesVal,
      teachingMethods: methodsVal,
      teachingAids: aidsVal,
      references: refVal,
      recordOfWork: d.recordOfWork || ''
    };
  });
}

/**
 * Parses pasted outside Weekly Forecast text (markdown table, TSV, HTML, or structured text)
 * directly into individual day objects (Day 1 to 5), accurately extracting and allocating
 * every cell to its corresponding column without cross-column shifting.
 * Intelligently fills missing fields from the official Zambian syllabus.
 */
export function parsePastedWeeklyForecast(
  rawText?: string | null,
  grade?: string,
  subject?: string,
  curriculumType?: string
): ParsedForecastDay[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const normalized = normalizeHtmlToMarkdownTable(rawText);
  const lines = normalized.split('\n');

  // 1. Try parsing from markdown table format
  const tableLines = lines.filter(l => (l.trim().match(/\|/g) || []).length >= 3);
  if (tableLines.length >= 1) {
    // Find header row if present
    const headerRow = tableLines.find(l => {
      const lower = l.toLowerCase();
      const matchCount = (lower.match(/day|period|comp|topic|competenc|outcome|standard|activit|knowledge|content|concept|skill|values?|attitude|method|aids?|ref|record|remark/g) || []).length;
      return matchCount >= 2;
    });

    let headerCells: string[] = [];
    if (headerRow) {
      headerCells = splitPipeRow(headerRow).map(c => c.toLowerCase());
    }

    const isMergedTopicSub = (c: string) => {
      if (/^sub-?topics?$/i.test(c)) return false;
      return c.includes('topic/sub') || c.includes('topic / sub') || c.includes('topic & sub') || c.includes('topic and sub') || (c.includes('topic') && (c.includes('/') || c.includes('&') || c.includes('and')) && c.includes('sub'));
    };

    const dayIdx = headerCells.findIndex(c => /\b(day|period|lesson|date)\b/i.test(c));
    const compColIdx = headerCells.findIndex(c => (/^comp(?:onent)?s?$/i.test(c) || c.includes('component')) && !c.includes('competenc') && !c.includes('outcome'));
    const mergedTopicSubIdx = headerCells.findIndex(isMergedTopicSub);
    const topicIdx = mergedTopicSubIdx >= 0 
      ? mergedTopicSubIdx 
      : headerCells.findIndex(c => (c.includes('topic') || c.includes('theme') || c.includes('unit')) && !c.includes('sub'));
    const subIdx = mergedTopicSubIdx >= 0 
      ? -1 
      : headerCells.findIndex(c => (/sub-?topics?/i.test(c) || c.includes('subtopic') || c.includes('sub-topic') || c.includes('sub topic')) && !c.includes('subject'));

    const compIdx = headerCells.findIndex(c => (c.includes('outcome') || c.includes('competenc') || c.includes('objective')) && !c.includes('standard'));
    const knowledgeIdx = headerCells.findIndex(c => c.includes('knowledge') || (c.includes('content') && !c.includes('context')) || c.includes('core concept') || c.includes('subject matter'));
    const skillsIdx = headerCells.findIndex(c => c.includes('skill'));
    const valuesIdx = headerCells.findIndex(c => c.includes('value') || c.includes('attitude'));
    const stdIdx = headerCells.findIndex(c => c.includes('standard') || c.includes('benchmark') || (!c.includes('outcome') && !c.includes('competenc') && c.includes('expect')));
    const actIdx = headerCells.findIndex(c => (c.includes('activit') || c.includes('task') || c.includes('learner act') || c.includes('pupil act')) && !c.includes('standard'));
    const methodIdx = headerCells.findIndex(c => c.includes('method') || c.includes('strategy') || c.includes('pedagog') || c.includes('approach') || c.includes('technique'));
    const aidIdx = headerCells.findIndex(c => c.includes('aid') || c.includes('t/l') || c.includes('resource') || c.includes('material') || c.includes('apparatus') || c.includes('media'));
    const refIdx = headerCells.findIndex(c => c.includes('ref') || c.includes('source') || c.includes('book') || c.includes('syllabus'));
    const recordIdx = headerCells.findIndex(c => c.includes('record') || c.includes('remark') || c.includes('comment') || c.includes('evaluat'));

    const dataRows = tableLines.filter(l => !l.includes('---') && l !== headerRow);
    const parsedDays: ParsedForecastDay[] = [];

    const isOBC = curriculumType === 'OBC' || (grade && /obc|obe/i.test(grade)) || false;

    for (let idx = 0; idx < dataRows.length; idx++) {
      const row = dataRows[idx];
      let cells = splitPipeRow(row);
      if (cells.length < 2) continue;

      let effectiveDayIdx = dayIdx;
      let effectiveCompColIdx = compColIdx;
      let effectiveTopicIdx = topicIdx;
      let effectiveSubIdx = subIdx;
      let effectiveCompIdx = compIdx;
      let effectiveStdIdx = stdIdx;
      let effectiveActIdx = actIdx;
      let effectiveKnowledgeIdx = knowledgeIdx;
      let effectiveSkillsIdx = skillsIdx;
      let effectiveValuesIdx = valuesIdx;
      let effectiveMethodIdx = methodIdx;
      let effectiveAidIdx = aidIdx;
      let effectiveRefIdx = refIdx;
      let effectiveRecordIdx = recordIdx;

      // Fallback column positions if no explicit header row was present
      if (!headerRow) {
        effectiveDayIdx = 0;
        const secondCellLower = (cells[1] || '').toLowerCase();
        const isSecondCellComp = secondCellLower.includes('listening') || secondCellLower.includes('reading') || 
                                 secondCellLower.includes('writing') || secondCellLower.includes('structure') || 
                                 secondCellLower.includes('oral') || secondCellLower.includes('literacy');
        if (isOBC) {
          if (isSecondCellComp) {
            effectiveCompColIdx = 1;
            effectiveTopicIdx = 2;
            effectiveCompIdx = 3;
            effectiveKnowledgeIdx = 4;
            effectiveSkillsIdx = 5;
            effectiveValuesIdx = 6;
            effectiveMethodIdx = 7;
            effectiveAidIdx = 8;
            effectiveRefIdx = 9;
            effectiveRecordIdx = 10;
          } else if (cells.length >= 11) {
            // Separate Topic (1) and Subtopic (2)
            effectiveTopicIdx = 1;
            effectiveSubIdx = 2;
            effectiveCompIdx = 3;
            effectiveKnowledgeIdx = 4;
            effectiveSkillsIdx = 5;
            effectiveValuesIdx = 6;
            effectiveMethodIdx = 7;
            effectiveAidIdx = 8;
            effectiveRefIdx = 9;
            effectiveRecordIdx = 10;
          } else if (cells.length >= 10) {
            const cell2 = cleanCellContent(cells[2] || '');
            const isCell2Outcome = /^\d+\.\d+\.\d+/.test(cell2) || cell2.length > 50;
            if (!isCell2Outcome) {
              // 10 columns: Day (0), Topic (1), Subtopic (2), Outcome (3), Knowledge (4), Skills (5), Values (6), Methods (7), Aids (8), Ref (9)
              effectiveTopicIdx = 1;
              effectiveSubIdx = 2;
              effectiveCompIdx = 3;
              effectiveKnowledgeIdx = 4;
              effectiveSkillsIdx = 5;
              effectiveValuesIdx = 6;
              effectiveMethodIdx = 7;
              effectiveAidIdx = 8;
              effectiveRefIdx = 9;
            } else {
              // 10 columns with merged Topic/Subtopic: Day (0), Topic/Subtopic (1), Outcome (2), Knowledge (3), Skills (4), Values (5), Methods (6), Aids (7), Ref (8), Record (9)
              effectiveTopicIdx = 1;
              effectiveCompIdx = 2;
              effectiveKnowledgeIdx = 3;
              effectiveSkillsIdx = 4;
              effectiveValuesIdx = 5;
              effectiveMethodIdx = 6;
              effectiveAidIdx = 7;
              effectiveRefIdx = 8;
              effectiveRecordIdx = 9;
            }
          } else {
            effectiveTopicIdx = 1;
            effectiveCompIdx = 2;
            effectiveKnowledgeIdx = 3;
            effectiveSkillsIdx = 4;
            effectiveValuesIdx = 5;
            effectiveMethodIdx = 6;
            effectiveAidIdx = 7;
            effectiveRefIdx = 8;
            effectiveRecordIdx = 9;
          }
        } else {
          if (isSecondCellComp) {
            effectiveCompColIdx = 1;
            effectiveTopicIdx = 2;
            effectiveCompIdx = 3;
            effectiveStdIdx = 4;
            effectiveActIdx = 5;
            effectiveMethodIdx = 6;
            effectiveAidIdx = 7;
            effectiveRefIdx = 8;
            effectiveRecordIdx = 9;
          } else {
            effectiveTopicIdx = 1;
            effectiveCompIdx = 2;
            effectiveStdIdx = 3;
            effectiveActIdx = 4;
            effectiveMethodIdx = 5;
            effectiveAidIdx = 6;
            effectiveRefIdx = 7;
            effectiveRecordIdx = 8;
          }
        }
      }

      const firstCell = (effectiveDayIdx >= 0 && effectiveDayIdx < cells.length) ? cells[effectiveDayIdx] : (cells[0] || '');
      const dayMatch = firstCell.match(/Day\s*(\d+)/i) || firstCell.match(/^(\d+)\b/);
      const rowDayNum = dayMatch ? parseInt(dayMatch[1], 10) : (idx + 1);

      // Extract date if present in day cell
      const dateMatch = firstCell.match(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/);
      const dayDate = dateMatch ? dateMatch[1] : undefined;

      let top = '';
      let sub = '';

      if (mergedTopicSubIdx >= 0 && cells[mergedTopicSubIdx]) {
        const rawCell = cells[mergedTopicSubIdx] || '';
        const parsedMerged = splitTopicAndSubtopics(rawCell, subject);
        top = parsedMerged.topic;
        sub = parsedMerged.subtopics.join(', ') || '';
      } else {
        const rawTop = (effectiveTopicIdx >= 0 && effectiveTopicIdx < cells.length) ? cells[effectiveTopicIdx] : '';
        const rawSub = (effectiveSubIdx >= 0 && effectiveSubIdx < cells.length) ? cells[effectiveSubIdx] : '';
        if (rawTop && !rawSub) {
          const parsedMerged = splitTopicAndSubtopics(rawTop, subject);
          top = parsedMerged.topic;
          sub = parsedMerged.subtopics.join(', ') || '';
        } else {
          top = cleanExtractedTopic(rawTop, subject);
          sub = rawSub ? cleanExtractedSubtopics([rawSub], subject).join(', ') : '';
        }
      }

      const compVal = (effectiveCompIdx >= 0 && effectiveCompIdx < cells.length) ? cleanCellContent(cells[effectiveCompIdx]) : '';
      const knowVal = (effectiveKnowledgeIdx >= 0 && effectiveKnowledgeIdx < cells.length) ? cleanCellContent(cells[effectiveKnowledgeIdx]) : '';
      const skillsVal = (effectiveSkillsIdx >= 0 && effectiveSkillsIdx < cells.length) ? cleanCellContent(cells[effectiveSkillsIdx]) : '';
      const valuesVal = (effectiveValuesIdx >= 0 && effectiveValuesIdx < cells.length) ? cleanCellContent(cells[effectiveValuesIdx]) : '';
      const stdVal = (effectiveStdIdx >= 0 && effectiveStdIdx < cells.length) ? cleanCellContent(cells[effectiveStdIdx]) : '';
      const actVal = (effectiveActIdx >= 0 && effectiveActIdx < cells.length) ? cleanCellContent(cells[effectiveActIdx]) : '';
      const methodVal = (effectiveMethodIdx >= 0 && effectiveMethodIdx < cells.length) ? cleanCellContent(cells[effectiveMethodIdx]) : '';
      const aidVal = (effectiveAidIdx >= 0 && effectiveAidIdx < cells.length) ? cleanCellContent(cells[effectiveAidIdx]) : '';
      const refVal = (effectiveRefIdx >= 0 && effectiveRefIdx < cells.length) ? cleanCellContent(cells[effectiveRefIdx]) : '';
      const compHeaderVal = (effectiveCompColIdx >= 0 && effectiveCompColIdx < cells.length) ? cleanCellContent(cells[effectiveCompColIdx]) : '';
      const recordVal = (effectiveRecordIdx >= 0 && effectiveRecordIdx < cells.length) ? cleanCellContent(cells[effectiveRecordIdx]) : '';

      let finalKnow = knowVal;
      let finalSkills = skillsVal;
      let finalValues = valuesVal;
      const rawMixed = finalKnow || compVal;
      if (rawMixed && (rawMixed.toLowerCase().includes('knowledge:') || rawMixed.toLowerCase().includes('skills:') || rawMixed.toLowerCase().includes('values:'))) {
        const split = splitContentIntoKnowledgeSkillsValues(rawMixed);
        if (split.knowledge) finalKnow = split.knowledge;
        if (split.skills && !finalSkills) finalSkills = split.skills;
        if (split.values && !finalValues) finalValues = split.values;
      }

      const dayActivities = actVal
        ? actVal.split(/<br\s*\/?>|;\s*|\n/i).map(a => a.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
        : [];

      parsedDays.push({
        day: rowDayNum,
        dayLabel: `Day ${rowDayNum}`,
        date: dayDate,
        component: compHeaderVal || undefined,
        topic: top,
        subtopic: sub,
        competency: compVal,
        expectedStandard: stdVal,
        knowledge: finalKnow,
        skills: finalSkills,
        values: finalValues,
        activities: dayActivities,
        teachingMethods: methodVal,
        teachingAids: aidVal,
        references: refVal,
        recordOfWork: recordVal
      });
    }

    if (parsedDays.length > 0) {
      const sortedDays = parsedDays.sort((a, b) => Number(a.day) - Number(b.day));
      return enrichForecastDaysWithSyllabus(sortedDays, grade, subject, curriculumType);
    }
  }

  // 2. Fallback: structured plain text / day-by-day parsing (Days 1 to 5, Monday to Friday)
  const fallbackDays: ParsedForecastDay[] = [];

  // Extract top-level global fields from text header if present
  const cleanGlobalText = (str: string) => str
    .replace(/\s*\(\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*(?:to|\-|\&|through)\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*\)/gi, '')
    .replace(/\s*\(\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s*\)/gi, '')
    .trim();

  const globalTopMatch = rawText.match(/(?:Topic|TOPIC)\s*[:\-]\s*([^\n\r]+)/i);
  const globalCompMatch = rawText.match(/(?:Specific competencies|Specific competency|Specific Outcome|Specific Outcomes|Competency|Competencies|OUTCOME|COMPETENCY)\s*[:\-]\s*([^\n\r]+)/i);
  const globalStdMatch = rawText.match(/(?:Expected Standard|Standard|EXPECTED STANDARD)\s*[:\-]\s*([^\n\r]+)/i);
  const globalMethodMatch = rawText.match(/(?:Teaching Methods|Methods|METHODS)\s*[:\-]\s*([^\n\r]+)/i);
  const globalAidMatch = rawText.match(/(?:Teaching Aids|T\/L Aids|Aids|AIDS)\s*[:\-]\s*([^\n\r]+)/i);
  const globalRefMatch = rawText.match(/(?:Reference|References|Ref|REFERENCE)\s*[:\-]\s*([^\n\r]+)/i);

  const globalTopic = globalTopMatch ? cleanGlobalText(cleanExtractedTopic(globalTopMatch[1], subject)) : '';
  const globalComp = globalCompMatch ? cleanGlobalText(globalCompMatch[1]) : '';
  const globalStd = globalStdMatch ? cleanGlobalText(globalStdMatch[1]) : '';
  const globalMethod = globalMethodMatch ? globalMethodMatch[1].trim() : '';
  const globalAid = globalAidMatch ? globalAidMatch[1].trim() : '';
  const globalRef = globalRefMatch ? globalRefMatch[1].trim() : '';

  // Split into daily blocks by Day X or Day of Week (Monday...Friday)
  const daySplitRegex = /(?=(?:^|\n|\r)\s*(?:[\-\*\"\']\s*)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri|Day\s*\d+|DAY\s*\d+)\b)/i;
  const dayBlocks = rawText.split(daySplitRegex).filter(b => /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri|Day\s*\d+|DAY\s*\d+)/i.test(b));

  const dayNameToNum = (str: string, indexFallback: number): number => {
    const lower = str.toLowerCase();
    if (lower.includes('monday') || /\bmon\b/.test(lower) || lower.includes('day 1')) return 1;
    if (lower.includes('tuesday') || /\btue\b/.test(lower) || lower.includes('day 2')) return 2;
    if (lower.includes('wednesday') || /\bwed\b/.test(lower) || lower.includes('day 3')) return 3;
    if (lower.includes('thursday') || /\bthu\b/.test(lower) || lower.includes('day 4')) return 4;
    if (lower.includes('friday') || /\bfri\b/.test(lower) || lower.includes('day 5')) return 5;
    const numM = str.match(/\d+/);
    if (numM) return parseInt(numM[0], 10);
    return indexFallback + 1;
  };

  if (dayBlocks.length > 0) {
    for (let i = 0; i < dayBlocks.length; i++) {
      const block = dayBlocks[i];
      const headerLineMatch = block.match(/(?:^|\n|\r)\s*(?:[\-\*\"\']\s*)?([^\n\r:]+)/);
      const headerStr = headerLineMatch ? headerLineMatch[1] : '';
      const dNum = dayNameToNum(headerStr, i);

      const topMatch = block.match(/(?:Topic|TOPIC)\s*[:\-]\s*([^\n\r]+)/i);
      const subMatch = block.match(/(?:Subtopic|Subtopics|Sub-topic|Sub-topics|SUBTOPIC)\s*[:\-]\s*([^\n\r]+)/i);
      const compMatch = block.match(/(?:Specific Outcome|Specific Competency|Competency|Outcome|OUTCOME|COMPETENCY)\s*[:\-]\s*([^\n\r]+)/i);
      const stdMatch = block.match(/(?:Expected Standard|Standard|EXPECTED STANDARD)\s*[:\-]\s*([^\n\r]+)/i);
      const actMatch = block.match(/(?:Learning activities|Learning activity|Leaning activity|Activities|Activity|ACTIVITIES)\s*[:\-]\s*([^\n\r]+)/i);
      const knowMatch = block.match(/(?:Knowledge|Content|KNOWLEDGE)\s*[:\-]\s*([^\n\r]+)/i);
      const skillMatch = block.match(/(?:Skills|SKILLS)\s*[:\-]\s*([^\n\r]+)/i);
      const valMatch = block.match(/(?:Values|VALVES|VALUES)\s*[:\-]\s*([^\n\r]+)/i);
      const methodMatch = block.match(/(?:Teaching Methods|Methods|METHODS)\s*[:\-]\s*([^\n\r]+)/i);
      const aidMatch = block.match(/(?:Teaching Aids|T\/L Aids|Aids|AIDS)\s*[:\-]\s*([^\n\r]+)/i);
      const refMatch = block.match(/(?:Reference|References|Ref|REFERENCE)\s*[:\-]\s*([^\n\r]+)/i);

      let dayTop = topMatch ? cleanExtractedTopic(cleanGlobalText(topMatch[1]), subject) : globalTopic;
      let daySub = subMatch ? cleanGlobalText(subMatch[1]) : '';
      let dayComp = compMatch ? cleanGlobalText(compMatch[1]) : globalComp;
      let dayStd = stdMatch ? cleanGlobalText(stdMatch[1]) : globalStd;
      
      let dayActs: string[] = [];
      if (actMatch && actMatch[1].trim()) {
        const cleanedAct = actMatch[1].replace(/^(?:Learning activities|Learning activity|Leaning activity|Activities|Activity)\s*[:\-]\s*/i, '').trim();
        if (cleanedAct) {
          dayActs = [cleanedAct];
        }
      }

      fallbackDays.push({
        day: dNum,
        dayLabel: `Day ${dNum}`,
        topic: dayTop,
        subtopic: daySub,
        competency: dayComp,
        expectedStandard: dayStd,
        activities: dayActs,
        knowledge: knowMatch ? knowMatch[1].trim() : '',
        skills: skillMatch ? skillMatch[1].trim() : '',
        values: valMatch ? valMatch[1].trim() : '',
        teachingMethods: methodMatch ? methodMatch[1].trim() : globalMethod,
        teachingAids: aidMatch ? aidMatch[1].trim() : globalAid,
        references: refMatch ? refMatch[1].trim() : globalRef
      });
    }
  }

  const sortedFallback = fallbackDays.sort((a, b) => Number(a.day) - Number(b.day));
  return enrichForecastDaysWithSyllabus(sortedFallback, grade, subject, curriculumType);
}

