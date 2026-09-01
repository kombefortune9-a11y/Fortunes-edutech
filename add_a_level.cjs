const fs = require('fs');

// 1. Update constants.ts
let constants = fs.readFileSync('src/constants.ts', 'utf8');

// Add to GRADES
constants = constants.replace(
  /"Form 6 \(CBC\)",\n\];/,
  '"Form 6 (CBC)",\n  "Form 5 (A Level)",\n  "Form 6 (A Level)",\n];'
);

// We can create ADVANCED_GRADES in constants.ts
constants += `\nexport const ADVANCED_GRADES = [\n  "Form 5 (A Level)",\n  "Form 6 (A Level)"\n];\n`;

fs.writeFileSync('src/constants.ts', constants);

// 2. Update CurriculumStandardsViewer.tsx
let cv = fs.readFileSync('src/components/CurriculumStandardsViewer.tsx', 'utf8');
cv = cv.replace(
  /useState<'ALL' \| 'CBC' \| 'OBC' \| 'ECE' \| 'SECONDARY'>\('ALL'\);/,
  "useState<'ALL' | 'CBC' | 'OBC' | 'ECE' | 'SECONDARY' | 'ADVANCED'>('ALL');"
);

cv = cv.replace(
  /\{ id: 'Form 4 \(CBC\)', label: 'Form 4 \(CBC - Secondary\)', framework: 'SECONDARY', level: 'Secondary' \}/,
  "{ id: 'Form 4 (CBC)', label: 'Form 4 (CBC - Secondary)', framework: 'SECONDARY', level: 'Secondary' },\n      { id: 'Form 5 (A Level)', label: 'Form 5 (A Level - Advanced)', framework: 'ADVANCED', level: 'Advanced' },\n      { id: 'Form 6 (A Level)', label: 'Form 6 (A Level - Advanced)', framework: 'ADVANCED', level: 'Advanced' }"
);

cv = cv.replace(
  /if \(curriculumFramework === 'SECONDARY'\) return all.filter\(g => g.framework === 'SECONDARY'\);/,
  "if (curriculumFramework === 'SECONDARY') return all.filter(g => g.framework === 'SECONDARY');\n    if (curriculumFramework === 'ADVANCED') return all.filter(g => g.framework === 'ADVANCED');"
);

cv = cv.replace(
  /\{ id: 'SECONDARY', label: 'Secondary \(Form 1-4\)' \}/,
  "{ id: 'SECONDARY', label: 'Secondary (Form 1-4)' },\n              { id: 'ADVANCED', label: 'Advanced (Form 5-6)' }"
);

fs.writeFileSync('src/components/CurriculumStandardsViewer.tsx', cv);
console.log("Updated CurriculumStandardsViewer.tsx");
