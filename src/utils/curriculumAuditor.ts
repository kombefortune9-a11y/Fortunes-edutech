import { SYLLABI, Topic, Subtopic } from '../data/syllabi';
import { 
  agricultureScienceForm1, agricultureScienceForm2, agricultureScienceForm3, agricultureScienceForm4 
} from '../data/agricultureScienceSecondaryData';
import { 
  artDesignForm1, artDesignForm2, artDesignForm3, artDesignForm4 
} from '../data/artDesignSecondaryData';
import { 
  biologyForm1, biologyForm2, biologyForm3, biologyForm4 
} from '../data/biologySecondaryData';
import { 
  chemistryForm1, chemistryForm2, chemistryForm3, chemistryForm4 
} from '../data/chemistrySecondaryData';
import { 
  civicEducationForm1, civicEducationForm2, civicEducationForm3, civicEducationForm4 
} from '../data/civicEducationSecondaryData';
import { 
  commerceForm1, commerceForm2, commerceForm3, commerceForm4 
} from '../data/commerceSecondaryData';
import { 
  computerScienceForm1, computerScienceForm2, computerScienceForm3, computerScienceForm4 
} from '../data/computerScienceSecondaryData';
import { 
  designTechnologyForm1, designTechnologyForm2, designTechnologyForm3, designTechnologyForm4 
} from '../data/designTechnologySecondaryData';
import { 
  englishLanguageForm1, englishLanguageForm2, englishLanguageForm3, englishLanguageForm4 
} from '../data/englishSecondaryData';
import { 
  fashionFabricsForm1, fashionFabricsForm2, fashionFabricsForm3, fashionFabricsForm4 
} from '../data/fashionFabricsSecondaryData';
import { 
  foodNutritionForm1, foodNutritionForm2, foodNutritionForm3, foodNutritionForm4 
} from '../data/foodNutritionSecondaryData';
import { 
  frenchLanguageForm1, frenchLanguageForm2, frenchLanguageForm3, frenchLanguageForm4 
} from '../data/frenchLanguageSecondaryData';
import { 
  geographyForm1, geographyForm2, geographyForm3, geographyForm4 
} from '../data/geographySecondaryData';
import { 
  historyForm1, historyForm2, historyForm3, historyForm4 
} from '../data/historySecondaryData';
import { 
  hospitalityManagementForm1, hospitalityManagementForm2, hospitalityManagementForm3, hospitalityManagementForm4 
} from '../data/hospitalitySecondaryData';
import { 
  ictForm1, ictForm2, ictForm3, ictForm4 
} from '../data/ictSecondaryData';
import { 
  literatureForm1, literatureForm2, literatureForm3, literatureForm4 
} from '../data/literatureSecondaryData';
import { 
  mathematics1Form1, mathematics1Form2, mathematics1Form3, mathematics1Form4 
} from '../data/mathematics1SecondaryData';
import { 
  mathematics2Form1, mathematics2Form2, mathematics2Form3, mathematics2Form4 
} from '../data/mathematics2SecondaryData';
import { 
  musicArtsForm1, musicArtsForm2, musicArtsForm3, musicArtsForm4 
} from '../data/musicArtsSecondaryData';
import { 
  physicalEducationForm1, physicalEducationForm2, physicalEducationForm3, physicalEducationForm4 
} from '../data/physicalEducationSecondaryData';
import { 
  physicsForm1, physicsForm2, physicsForm3, physicsForm4 
} from '../data/physicsSecondaryData';
import { 
  principlesOfAccountsForm1, principlesOfAccountsForm2, principlesOfAccountsForm3, principlesOfAccountsForm4 
} from '../data/principlesOfAccountsSecondaryData';
import { 
  religiousEducationForm1, religiousEducationForm2, religiousEducationForm3, religiousEducationForm4 
} from '../data/religiousEducationSecondaryData';
import { 
  travelTourismForm1, travelTourismForm2, travelTourismForm3, travelTourismForm4 
} from '../data/travelTourismSecondaryData';
import { 
  zambianLanguagesForm1, zambianLanguagesForm2, zambianLanguagesForm3, zambianLanguagesForm4 
} from '../data/zambianLanguagesSecondaryData';

export type AuditSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AuditIssueType =
  | 'EMPTY_TOPICS_LIST'
  | 'MISSING_TOPIC_TITLE'
  | 'MISSING_SUBTOPICS'
  | 'MISSING_SUBTOPIC_TITLE'
  | 'MISSING_COMPETENCIES'
  | 'EMPTY_COMPETENCY_STRING'
  | 'MISSING_EXPECTED_STANDARDS'
  | 'MISSING_LEARNING_ACTIVITIES'
  | 'MISSING_KSV';

export interface CurriculumAuditIssue {
  id: string;
  grade: string;
  subject: string;
  topicTitle: string;
  topicIndex: number;
  subtopicTitle?: string;
  subtopicIndex?: number;
  competencyIndex?: number;
  severity: AuditSeverity;
  type: AuditIssueType;
  message: string;
  recommendation: string;
}

export interface GradeSubjectStats {
  grade: string;
  subject: string;
  totalTopics: number;
  totalSubtopics: number;
  totalCompetencies: number;
  totalStandards: number;
  totalActivities: number;
  criticalIssuesCount: number;
  warningsCount: number;
  infoCount: number;
  completenessScore: number; // 0 - 100
}

export interface CurriculumAuditSummary {
  timestamp: string;
  totalGrades: number;
  totalSubjects: number;
  totalTopics: number;
  totalSubtopics: number;
  totalCompetencies: number;
  totalStandards: number;
  totalActivities: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  overallHealthScore: number; // 0 - 100
  fullyCompliantSubjects: number;
  subjectsNeedingAttention: number;
}

export interface CurriculumAuditReport {
  summary: CurriculumAuditSummary;
  gradeSubjectStats: GradeSubjectStats[];
  issues: CurriculumAuditIssue[];
}

/**
 * Checks if a subtopic or raw competency string contains an expected standard.
 */
export function hasExpectedStandard(subtopic: Subtopic, rawCompetency?: string): boolean {
  // Check direct expectedStandard field on subtopic
  if (subtopic.expectedStandard) {
    if (typeof subtopic.expectedStandard === 'string' && subtopic.expectedStandard.trim().length > 0) {
      return true;
    }
    if (Array.isArray(subtopic.expectedStandard) && subtopic.expectedStandard.length > 0) {
      return true;
    }
  }

  // Check if raw competency contains pipe "| Expected Standard:" or "[Expected Standard]:"
  if (rawCompetency && typeof rawCompetency === 'string') {
    const lower = rawCompetency.toLowerCase();
    if (lower.includes('expected standard:') || lower.includes('expected standards:') || lower.includes('[expected standard]')) {
      const parts = rawCompetency.split('|');
      for (const p of parts) {
        if (/expected\s*standards?\s*:/i.test(p) || /\[expected\s*standards?\]/i.test(p)) {
          const val = p.replace(/^(?:\[?expected\s*standards?\]?:?\s*)/i, '').trim();
          if (val.length > 0) return true;
        }
      }
    }
  }

  return false;
}

/**
 * Audits a single Topic and all its subtopics, competencies, standards, and learning activities.
 */
export function auditTopic(
  topic: Topic,
  topicIndex: number,
  grade: string,
  subject: string
): { issues: CurriculumAuditIssue[]; stats: { subtopics: number; competencies: number; standards: number; activities: number } } {
  const issues: CurriculumAuditIssue[] = [];
  let subtopicCount = 0;
  let competencyCount = 0;
  let standardCount = 0;
  let activityCount = 0;

  const topicTitle = topic.title?.trim() || `(Topic Index ${topicIndex + 1})`;

  if (!topic.title || topic.title.trim().length === 0) {
    issues.push({
      id: `${grade}-${subject}-t${topicIndex}-notitle`,
      grade,
      subject,
      topicTitle: '(Untitled Topic)',
      topicIndex,
      severity: 'CRITICAL',
      type: 'MISSING_TOPIC_TITLE',
      message: `Topic at index ${topicIndex + 1} has no title specified.`,
      recommendation: `Provide a descriptive syllabus topic title (e.g. '1.1.0 Living Organisms').`
    });
  }

  if (!topic.subtopics || !Array.isArray(topic.subtopics) || topic.subtopics.length === 0) {
    issues.push({
      id: `${grade}-${subject}-t${topicIndex}-nosubtopics`,
      grade,
      subject,
      topicTitle,
      topicIndex,
      severity: 'CRITICAL',
      type: 'MISSING_SUBTOPICS',
      message: `Topic '${topicTitle}' has no subtopics defined (subtopics array is empty).`,
      recommendation: `Add at least one subtopic with title, specific competencies, and expected standards.`
    });
    return { issues, stats: { subtopics: 0, competencies: 0, standards: 0, activities: 0 } };
  }

  subtopicCount = topic.subtopics.length;

  topic.subtopics.forEach((subtopic, sIdx) => {
    const subtopicTitle = subtopic.title?.trim() || `(Subtopic Index ${sIdx + 1})`;

    if (!subtopic.title || subtopic.title.trim().length === 0) {
      issues.push({
        id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-notitle`,
        grade,
        subject,
        topicTitle,
        topicIndex,
        subtopicTitle: '(Untitled Subtopic)',
        subtopicIndex: sIdx,
        severity: 'CRITICAL',
        type: 'MISSING_SUBTOPIC_TITLE',
        message: `Subtopic at index ${sIdx + 1} in topic '${topicTitle}' has no title.`,
        recommendation: `Assign a specific subtopic name (e.g. '1.1.1 Cell Structure').`
      });
    }

    // Check competencies
    if (!subtopic.competencies || !Array.isArray(subtopic.competencies) || subtopic.competencies.length === 0) {
      issues.push({
        id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-nocompetencies`,
        grade,
        subject,
        topicTitle,
        topicIndex,
        subtopicTitle,
        subtopicIndex: sIdx,
        severity: 'CRITICAL',
        type: 'MISSING_COMPETENCIES',
        message: `Subtopic '${subtopicTitle}' has NO specific competencies or learning outcomes defined.`,
        recommendation: `Add official CBC/OBC specific competency statements (e.g. '1.1.1.1 Identify cell components').`
      });
    } else {
      let subtopicHasAnyStandard = false;

      subtopic.competencies.forEach((comp, cIdx) => {
        if (!comp || (typeof comp === 'string' && comp.trim().length === 0)) {
          issues.push({
            id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-c${cIdx}-empty`,
            grade,
            subject,
            topicTitle,
            topicIndex,
            subtopicTitle,
            subtopicIndex: sIdx,
            competencyIndex: cIdx,
            severity: 'CRITICAL',
            type: 'EMPTY_COMPETENCY_STRING',
            message: `Competency at index ${cIdx + 1} in subtopic '${subtopicTitle}' is an empty string.`,
            recommendation: `Fill in the missing competency text or remove the blank entry.`
          });
        } else {
          competencyCount++;
          if (hasExpectedStandard(subtopic, comp)) {
            subtopicHasAnyStandard = true;
          }
        }
      });

      if (subtopicHasAnyStandard) {
        standardCount++;
      } else {
        issues.push({
          id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-nostandard`,
          grade,
          subject,
          topicTitle,
          topicIndex,
          subtopicTitle,
          subtopicIndex: sIdx,
          severity: 'WARNING',
          type: 'MISSING_EXPECTED_STANDARDS',
          message: `Subtopic '${subtopicTitle}' does not specify an Expected Standard (neither in subtopic.expectedStandard nor in competency pipe tags).`,
          recommendation: `Add expectedStandard property or pipe '| Expected Standard: ...' into competencies.`
        });
      }
    }

    // Check Learning Activities
    if (subtopic.learningActivities) {
      if (Array.isArray(subtopic.learningActivities) && subtopic.learningActivities.length > 0) {
        activityCount += subtopic.learningActivities.length;
      } else if (typeof subtopic.learningActivities === 'object' && Object.keys(subtopic.learningActivities).length > 0) {
        activityCount += Object.keys(subtopic.learningActivities).length;
      }
    } else {
      issues.push({
        id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-noactivities`,
        grade,
        subject,
        topicTitle,
        topicIndex,
        subtopicTitle,
        subtopicIndex: sIdx,
        severity: 'INFO',
        type: 'MISSING_LEARNING_ACTIVITIES',
        message: `Subtopic '${subtopicTitle}' does not include explicit suggested learning activities.`,
        recommendation: `Add learningActivities array to support automatic lesson plan population.`
      });
    }

    // Check Knowledge / Skills / Values metadata
    const hasKSV = subtopic.knowledge || subtopic.skills || subtopic.values;
    if (!hasKSV) {
      // Check if inside competency string
      const compHasKSV = subtopic.competencies?.some(c => 
        typeof c === 'string' && (/knowledge\s*:/i.test(c) || /skills?\s*:/i.test(c) || /values?\s*:/i.test(c))
      );
      if (!compHasKSV) {
        issues.push({
          id: `${grade}-${subject}-t${topicIndex}-s${sIdx}-noksv`,
          grade,
          subject,
          topicTitle,
          topicIndex,
          subtopicTitle,
          subtopicIndex: sIdx,
          severity: 'INFO',
          type: 'MISSING_KSV',
          message: `Subtopic '${subtopicTitle}' has no explicit Knowledge, Skills, or Values metadata unpacked.`,
          recommendation: `Add knowledge, skills, values properties for complete CBC taxonomy alignment.`
        });
      }
    }
  });

  return {
    issues,
    stats: {
      subtopics: subtopicCount,
      competencies: competencyCount,
      standards: standardCount,
      activities: activityCount
    }
  };
}

/**
 * Audits a specific Subject under a Grade Level.
 */
export function auditSubject(
  grade: string,
  subject: string,
  topics: Topic[]
): { issues: CurriculumAuditIssue[]; stats: GradeSubjectStats } {
  const issues: CurriculumAuditIssue[] = [];
  let totalSubtopics = 0;
  let totalCompetencies = 0;
  let totalStandards = 0;
  let totalActivities = 0;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    issues.push({
      id: `${grade}-${subject}-notopics`,
      grade,
      subject,
      topicTitle: '(No Topics Found)',
      topicIndex: -1,
      severity: 'CRITICAL',
      type: 'EMPTY_TOPICS_LIST',
      message: `Subject '${subject}' in '${grade}' contains no topics (topics list is empty).`,
      recommendation: `Populate the subject syllabus dataset with official curriculum topics.`
    });

    return {
      issues,
      stats: {
        grade,
        subject,
        totalTopics: 0,
        totalSubtopics: 0,
        totalCompetencies: 0,
        totalStandards: 0,
        totalActivities: 0,
        criticalIssuesCount: 1,
        warningsCount: 0,
        infoCount: 0,
        completenessScore: 0
      }
    };
  }

  topics.forEach((topic, tIdx) => {
    const res = auditTopic(topic, tIdx, grade, subject);
    issues.push(...res.issues);
    totalSubtopics += res.stats.subtopics;
    totalCompetencies += res.stats.competencies;
    totalStandards += res.stats.standards;
    totalActivities += res.stats.activities;
  });

  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const warningsCount = issues.filter(i => i.severity === 'WARNING').length;
  const infoCount = issues.filter(i => i.severity === 'INFO').length;

  // Calculate completeness score (0-100)
  let score = 100;
  if (topics.length === 0) {
    score = 0;
  } else {
    // Penalty per critical issue
    score -= criticalCount * 25;
    // Penalty per warning
    score -= warningsCount * 5;
    // Penalty per info
    score -= infoCount * 0.5;

    // Bonus for high standard & competency ratio
    if (totalSubtopics > 0) {
      const standardsRatio = totalStandards / totalSubtopics;
      if (standardsRatio < 0.8) {
        score -= (1 - standardsRatio) * 20;
      }
    }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    issues,
    stats: {
      grade,
      subject,
      totalTopics: topics.length,
      totalSubtopics,
      totalCompetencies,
      totalStandards,
      totalActivities,
      criticalIssuesCount: criticalCount,
      warningsCount,
      infoCount,
      completenessScore: score
    }
  };
}

/**
 * Builds a dictionary of all raw secondary subjects for Forms 1 - 4
 * to verify complete multi-grade secondary subject coverage.
 */
export function getSecondarySubjectsMap(): Record<string, Record<string, Topic[]>> {
  return {
    "Form 1 (CBC)": {
      "Agriculture Science": agricultureScienceForm1,
      "Art and Design": artDesignForm1,
      "Biology": biologyForm1,
      "Chemistry": chemistryForm1,
      "Civic Education": civicEducationForm1,
      "Commerce": commerceForm1,
      "Computer Science": computerScienceForm1,
      "Design and Technology": designTechnologyForm1,
      "English": englishLanguageForm1,
      "Fashion and Fabrics": fashionFabricsForm1,
      "Food and Nutrition": foodNutritionForm1,
      "French Language": frenchLanguageForm1,
      "Geography": geographyForm1,
      "History": historyForm1,
      "Hospitality Management": hospitalityManagementForm1,
      "Information and Communication Technology (ICT)": ictForm1,
      "Literature in English": literatureForm1,
      "Mathematics 1": mathematics1Form1,
      "Mathematics 2": mathematics2Form1,
      "Musical Arts": musicArtsForm1,
      "Physical Education": physicalEducationForm1,
      "Physics": physicsForm1,
      "Principles of Accounts": principlesOfAccountsForm1,
      "Religious Education": religiousEducationForm1,
      "Travel and Tourism": travelTourismForm1,
      "Zambian Languages": zambianLanguagesForm1
    },
    "Form 2 (CBC)": {
      "Agriculture Science": agricultureScienceForm2,
      "Art and Design": artDesignForm2,
      "Biology": biologyForm2,
      "Chemistry": chemistryForm2,
      "Civic Education": civicEducationForm2,
      "Commerce": commerceForm2,
      "Computer Science": computerScienceForm2,
      "Design and Technology": designTechnologyForm2,
      "English": englishLanguageForm2,
      "Fashion and Fabrics": fashionFabricsForm2,
      "Food and Nutrition": foodNutritionForm2,
      "French Language": frenchLanguageForm2,
      "Geography": geographyForm2,
      "History": historyForm2,
      "Hospitality Management": hospitalityManagementForm2,
      "Information and Communication Technology (ICT)": ictForm2,
      "Literature in English": literatureForm2,
      "Mathematics 1": mathematics1Form2,
      "Mathematics 2": mathematics2Form2,
      "Musical Arts": musicArtsForm2,
      "Physical Education": physicalEducationForm2,
      "Physics": physicsForm2,
      "Principles of Accounts": principlesOfAccountsForm2,
      "Religious Education": religiousEducationForm2,
      "Travel and Tourism": travelTourismForm2,
      "Zambian Languages": zambianLanguagesForm2
    },
    "Form 3 (CBC)": {
      "Agriculture Science": agricultureScienceForm3,
      "Art and Design": artDesignForm3,
      "Biology": biologyForm3,
      "Chemistry": chemistryForm3,
      "Civic Education": civicEducationForm3,
      "Commerce": commerceForm3,
      "Computer Science": computerScienceForm3,
      "Design and Technology": designTechnologyForm3,
      "English": englishLanguageForm3,
      "Fashion and Fabrics": fashionFabricsForm3,
      "Food and Nutrition": foodNutritionForm3,
      "French Language": frenchLanguageForm3,
      "Geography": geographyForm3,
      "History": historyForm3,
      "Hospitality Management": hospitalityManagementForm3,
      "Information and Communication Technology (ICT)": ictForm3,
      "Literature in English": literatureForm3,
      "Mathematics 1": mathematics1Form3,
      "Mathematics 2": mathematics2Form3,
      "Musical Arts": musicArtsForm3,
      "Physical Education": physicalEducationForm3,
      "Physics": physicsForm3,
      "Principles of Accounts": principlesOfAccountsForm3,
      "Religious Education": religiousEducationForm3,
      "Travel and Tourism": travelTourismForm3,
      "Zambian Languages": zambianLanguagesForm3
    },
    "Form 4 (CBC)": {
      "Agriculture Science": agricultureScienceForm4,
      "Art and Design": artDesignForm4,
      "Biology": biologyForm4,
      "Chemistry": chemistryForm4,
      "Civic Education": civicEducationForm4,
      "Commerce": commerceForm4,
      "Computer Science": computerScienceForm4,
      "Design and Technology": designTechnologyForm4,
      "English": englishLanguageForm4,
      "Fashion and Fabrics": fashionFabricsForm4,
      "Food and Nutrition": foodNutritionForm4,
      "French Language": frenchLanguageForm4,
      "Geography": geographyForm4,
      "History": historyForm4,
      "Hospitality Management": hospitalityManagementForm4,
      "Information and Communication Technology (ICT)": ictForm4,
      "Literature in English": literatureForm4,
      "Mathematics 1": mathematics1Form4,
      "Mathematics 2": mathematics2Form4,
      "Musical Arts": musicArtsForm4,
      "Physical Education": physicalEducationForm4,
      "Physics": physicsForm4,
      "Principles of Accounts": principlesOfAccountsForm4,
      "Religious Education": religiousEducationForm4,
      "Travel and Tourism": travelTourismForm4,
      "Zambian Languages": zambianLanguagesForm4
    }
  };
}

/**
 * Systematically audits the entire curriculum database across all grades and subjects.
 * Iterates through every subject (Agriculture, Biology, Chemistry, English, Mathematics, etc.)
 * for each grade level, checking topics, subtopics, competencies, and standards.
 */
export function auditCurriculum(options?: {
  includeCombinedSecondary?: boolean;
}): CurriculumAuditReport {
  const mergedSyllabi: Record<string, Record<string, Topic[]>> = { ...SYLLABI };

  // Ensure Secondary forms 1-4 include full subject list from secondary data
  const secondaryMap = getSecondarySubjectsMap();
  for (const [formKey, subjects] of Object.entries(secondaryMap)) {
    if (!mergedSyllabi[formKey]) {
      mergedSyllabi[formKey] = {};
    }
    for (const [subKey, topics] of Object.entries(subjects)) {
      mergedSyllabi[formKey][subKey] = topics;
    }
  }

  const issues: CurriculumAuditIssue[] = [];
  const gradeSubjectStats: GradeSubjectStats[] = [];

  let totalTopics = 0;
  let totalSubtopics = 0;
  let totalCompetencies = 0;
  let totalStandards = 0;
  let totalActivities = 0;

  const gradesToCheck = Object.keys(mergedSyllabi).filter(g => {
    // If option to exclude combined "Form 1-4 Subject (CBC)" entries is desired
    if (!options?.includeCombinedSecondary && g.startsWith('Form 1-4 ') && g.endsWith(' (CBC)')) {
      return false;
    }
    return true;
  });

  const uniqueSubjectsSet = new Set<string>();

  gradesToCheck.forEach(grade => {
    const subjectsMap = mergedSyllabi[grade];
    if (!subjectsMap) return;

    for (const [subject, topics] of Object.entries(subjectsMap)) {
      uniqueSubjectsSet.add(subject);
      const res = auditSubject(grade, subject, topics);
      issues.push(...res.issues);
      gradeSubjectStats.push(res.stats);

      totalTopics += res.stats.totalTopics;
      totalSubtopics += res.stats.totalSubtopics;
      totalCompetencies += res.stats.totalCompetencies;
      totalStandards += res.stats.totalStandards;
      totalActivities += res.stats.totalActivities;
    }
  });

  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter(i => i.severity === 'WARNING').length;
  const infoCount = issues.filter(i => i.severity === 'INFO').length;

  const fullyCompliantSubjects = gradeSubjectStats.filter(s => s.criticalIssuesCount === 0 && s.warningsCount === 0).length;
  const subjectsNeedingAttention = gradeSubjectStats.length - fullyCompliantSubjects;

  // Calculate overall health score (0-100)
  const averageScore = gradeSubjectStats.length > 0
    ? Math.round(gradeSubjectStats.reduce((acc, s) => acc + s.completenessScore, 0) / gradeSubjectStats.length)
    : 0;

  const summary: CurriculumAuditSummary = {
    timestamp: new Date().toISOString(),
    totalGrades: gradesToCheck.length,
    totalSubjects: uniqueSubjectsSet.size,
    totalTopics,
    totalSubtopics,
    totalCompetencies,
    totalStandards,
    totalActivities,
    totalIssues: issues.length,
    criticalCount,
    warningCount,
    infoCount,
    overallHealthScore: averageScore,
    fullyCompliantSubjects,
    subjectsNeedingAttention
  };

  return {
    summary,
    gradeSubjectStats,
    issues
  };
}

/**
 * Formats the audit report into a clean, comprehensive Markdown management audit report.
 */
export function formatAuditReportAsMarkdown(report: CurriculumAuditReport): string {
  const { summary, gradeSubjectStats, issues } = report;

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const warningIssues = issues.filter(i => i.severity === 'WARNING');
  const infoIssues = issues.filter(i => i.severity === 'INFO');

  let md = `# 📋 CURRICULUM AUDIT & VERIFICATION MANAGEMENT LOG
**Generated At:** ${summary.timestamp}  
**System:** FORTUNES EDUTECH Curriculum Core  
**Overall Curriculum Health Score:** ${summary.overallHealthScore}%  

---

## 1. EXECUTIVE SUMMARY & METRICS

| Metric | Verified Count | Status |
| :--- | :--- | :--- |
| **Total Grade Levels Audited** | ${summary.totalGrades} Grades | ✅ Audited |
| **Unique Subjects Audited** | ${summary.totalSubjects} Subjects | ✅ Audited |
| **Total Topics In Database** | ${summary.totalTopics} Topics | ✅ Verified |
| **Total Subtopics Verified** | ${summary.totalSubtopics} Subtopics | ✅ Checked |
| **Total Specific Competencies** | ${summary.totalCompetencies} Competencies | ✅ Verified |
| **Subtopics with Expected Standards** | ${summary.totalStandards} / ${summary.totalSubtopics} | ${Math.round((summary.totalStandards / Math.max(1, summary.totalSubtopics)) * 100)}% Coverage |
| **Fully Compliant Subjects** | ${summary.fullyCompliantSubjects} / ${gradeSubjectStats.length} | ${Math.round((summary.fullyCompliantSubjects / Math.max(1, gradeSubjectStats.length)) * 100)}% |
| **🔴 Critical Missing Sections** | ${summary.criticalCount} Issues | ${summary.criticalCount === 0 ? '✅ Clean' : '⚠️ Action Required'} |
| **🟡 Warnings (Missing Standards)** | ${summary.warningCount} Warnings | ${summary.warningCount === 0 ? '✅ Complete' : '📝 Review Needed'} |
| **🔵 Informational Items** | ${summary.infoCount} Notes | ℹ️ Optimal Enhancements |

---

## 2. GRADE & SUBJECT COMPLIANCE BREAKDOWN

| Grade Level | Subject | Topics | Subtopics | Competencies | Standards | Health Score | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  gradeSubjectStats.forEach(stat => {
    const statusIcon = stat.criticalIssuesCount > 0 ? '🔴 Incomplete' : stat.warningsCount > 0 ? '🟡 Missing Standards' : '🟢 Compliant';
    md += `| **${stat.grade}** | ${stat.subject} | ${stat.totalTopics} | ${stat.totalSubtopics} | ${stat.totalCompetencies} | ${stat.totalStandards} | ${stat.completenessScore}% | ${statusIcon} |\n`;
  });

  md += `\n---\n\n## 3. AUDIT ACTION LOG & DEFICIENCIES\n\n`;

  if (criticalIssues.length > 0) {
    md += `### 🔴 Critical Missing Sections (${criticalIssues.length})\n\n`;
    criticalIssues.forEach((issue, idx) => {
      md += `#### ${idx + 1}. [${issue.grade}] > [${issue.subject}] > ${issue.topicTitle}\n`;
      if (issue.subtopicTitle) md += `- **Subtopic:** ${issue.subtopicTitle}\n`;
      md += `- **Issue Type:** \`${issue.type}\`\n`;
      md += `- **Deficiency:** ${issue.message}\n`;
      md += `- **Recommended Action:** ${issue.recommendation}\n\n`;
    });
  } else {
    md += `### 🔴 Critical Missing Sections (0)\n*No critical missing topics, subtopics, or empty competency arrays found.*\n\n`;
  }

  if (warningIssues.length > 0) {
    md += `### 🟡 Missing Expected Standards & Warnings (${warningIssues.length})\n\n`;
    warningIssues.forEach((issue, idx) => {
      md += `${idx + 1}. **[${issue.grade} - ${issue.subject}]** \`${issue.topicTitle}\` -> \`${issue.subtopicTitle}\`\n`;
      md += `   - **Deficiency:** ${issue.message}\n`;
      md += `   - **Recommendation:** ${issue.recommendation}\n\n`;
    });
  } else {
    md += `### 🟡 Missing Expected Standards (0)\n*All subtopics have valid Expected Standards populated.*\n\n`;
  }

  if (infoIssues.length > 0) {
    md += `### 🔵 Informational Enhancements (${infoIssues.length})\n`;
    md += `*The following subtopics are functional but would benefit from explicit learning activities or KSV unpacking:*\n\n`;
    infoIssues.slice(0, 50).forEach((issue, idx) => {
      md += `- **[${issue.grade} - ${issue.subject}]** \`${issue.subtopicTitle}\`: ${issue.message}\n`;
    });
    if (infoIssues.length > 50) {
      md += `\n*... and ${infoIssues.length - 50} more informational items.*\n`;
    }
  }

  md += `\n---\n\n*Audit completed systematically by FORTUNES EDUTECH Automated Curriculum Auditor.*\n`;

  return md;
}

/**
 * Formats the audit report into CSV format for Excel/Spreadsheet manual auditing.
 */
export function formatAuditReportAsCsv(report: CurriculumAuditReport): string {
  const headers = ['Grade', 'Subject', 'Topic Index', 'Topic Title', 'Subtopic Index', 'Subtopic Title', 'Severity', 'Issue Type', 'Deficiency Message', 'Recommendation'];
  
  const rows = report.issues.map(i => [
    `"${i.grade.replace(/"/g, '""')}"`,
    `"${i.subject.replace(/"/g, '""')}"`,
    i.topicIndex + 1,
    `"${(i.topicTitle || '').replace(/"/g, '""')}"`,
    i.subtopicIndex !== undefined ? i.subtopicIndex + 1 : '',
    `"${(i.subtopicTitle || '').replace(/"/g, '""')}"`,
    `"${i.severity}"`,
    `"${i.type}"`,
    `"${i.message.replace(/"/g, '""')}"`,
    `"${i.recommendation.replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Formats the audit report as JSON.
 */
export function formatAuditReportAsJson(report: CurriculumAuditReport): string {
  return JSON.stringify(report, null, 2);
}
