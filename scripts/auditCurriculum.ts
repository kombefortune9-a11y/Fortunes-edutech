import fs from 'fs';
import path from 'path';
import { 
  auditCurriculum, 
  formatAuditReportAsMarkdown, 
  formatAuditReportAsJson, 
  formatAuditReportAsCsv 
} from '../src/utils/curriculumAuditor';

async function runCurriculumAudit() {
  console.log('===========================================================');
  console.log('🚀 STARTING SYSTEMATIC CURRICULUM AUDIT & VERIFICATION');
  console.log('===========================================================');
  console.log('Iterating through all uploaded subject files & grade levels...');
  console.log('(Agriculture, Biology, Chemistry, English, Mathematics, Sciences, Arts, etc.)\n');

  const startTime = Date.now();
  const report = auditCurriculum({ includeCombinedSecondary: false });
  const durationMs = Date.now() - startTime;

  console.log('✅ AUDIT COMPLETE in ' + durationMs + 'ms');
  console.log('-----------------------------------------------------------');
  console.log(`📊 Summary:`);
  console.log(`   • Total Grade Levels Checked: ${report.summary.totalGrades}`);
  console.log(`   • Unique Subjects Checked:    ${report.summary.totalSubjects}`);
  console.log(`   • Total Topics In Database:   ${report.summary.totalTopics}`);
  console.log(`   • Total Subtopics Verified:   ${report.summary.totalSubtopics}`);
  console.log(`   • Specific Competencies:      ${report.summary.totalCompetencies}`);
  console.log(`   • Expected Standards Found:   ${report.summary.totalStandards} (${Math.round((report.summary.totalStandards / Math.max(1, report.summary.totalSubtopics)) * 100)}% coverage)`);
  console.log(`   • Overall Health Score:       ${report.summary.overallHealthScore}%`);
  console.log(`   • Fully Compliant Subjects:   ${report.summary.fullyCompliantSubjects} / ${report.gradeSubjectStats.length}`);
  console.log(`   • 🔴 Critical Issues:         ${report.summary.criticalCount}`);
  console.log(`   • 🟡 Warnings (No Standard):  ${report.summary.warningCount}`);
  console.log(`   • 🔵 Informational Notes:     ${report.summary.infoCount}`);
  console.log('-----------------------------------------------------------\n');

  // Print Grade-by-grade summary
  console.log('📋 GRADE & SUBJECT STATUS TABLE:');
  console.log('------------------------------------------------------------------------------------------------------');
  console.log('| Grade Level          | Subject                        | Topics | Subtopics | Comps | Stds | Health |');
  console.log('------------------------------------------------------------------------------------------------------');
  
  report.gradeSubjectStats.forEach(stat => {
    const gradePadded = stat.grade.padEnd(20).slice(0, 20);
    const subPadded = stat.subject.padEnd(30).slice(0, 30);
    const topStr = String(stat.totalTopics).padStart(6);
    const subStr = String(stat.totalSubtopics).padStart(9);
    const compStr = String(stat.totalCompetencies).padStart(5);
    const stdStr = String(stat.totalStandards).padStart(4);
    const scoreStr = `${stat.completenessScore}%`.padStart(6);
    console.log(`| ${gradePadded} | ${subPadded} | ${topStr} | ${subStr} | ${compStr} | ${stdStr} | ${scoreStr} |`);
  });
  console.log('------------------------------------------------------------------------------------------------------\n');

  // Print Critical issues if any
  const critical = report.issues.filter(i => i.severity === 'CRITICAL');
  if (critical.length > 0) {
    console.log(`🔴 CRITICAL DEFICIENCIES FOUND (${critical.length}):`);
    critical.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. [${issue.grade}] > [${issue.subject}] > Topic: "${issue.topicTitle}"`);
      if (issue.subtopicTitle) console.log(`     Subtopic: "${issue.subtopicTitle}"`);
      console.log(`     ❌ ${issue.message}`);
      console.log(`     💡 Fix: ${issue.recommendation}\n`);
    });
  } else {
    console.log('🟢 No critical missing topics or empty competency arrays found!\n');
  }

  // Print Warnings
  const warnings = report.issues.filter(i => i.severity === 'WARNING');
  if (warnings.length > 0) {
    console.log(`🟡 MISSING EXPECTED STANDARDS / WARNINGS (${warnings.length}):`);
    warnings.slice(0, 20).forEach((issue, idx) => {
      console.log(`  ${idx + 1}. [${issue.grade} - ${issue.subject}] "${issue.topicTitle}" -> "${issue.subtopicTitle}"`);
      console.log(`     ⚠️ ${issue.message}`);
    });
    if (warnings.length > 20) {
      console.log(`  ... and ${warnings.length - 20} more warnings (see full markdown report).`);
    }
    console.log('\n');
  }

  // Write output files
  const rootDir = process.cwd();
  const jsonReportPath = path.join(rootDir, 'curriculum-audit-log.json');
  const mdReportPath = path.join(rootDir, 'curriculum-audit-report.md');
  const csvReportPath = path.join(rootDir, 'curriculum-audit-issues.csv');

  fs.writeFileSync(jsonReportPath, formatAuditReportAsJson(report), 'utf-8');
  fs.writeFileSync(mdReportPath, formatAuditReportAsMarkdown(report), 'utf-8');
  fs.writeFileSync(csvReportPath, formatAuditReportAsCsv(report), 'utf-8');

  console.log('💾 MANAGEMENT LOG REPORTS GENERATED:');
  console.log(`   📄 Markdown Report:  ${mdReportPath}`);
  console.log(`   📊 JSON Audit Log:   ${jsonReportPath}`);
  console.log(`   📑 CSV Spreadsheet:  ${csvReportPath}`);
  console.log('\nAudit process finished successfully.\n');
}

// Run directly
runCurriculumAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
