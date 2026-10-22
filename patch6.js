import fs from 'fs';
const code = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const target = `    includeTeachingNotes: false,
    includeHomework: false,
    englishCombined: true,
    references: '',`;

const replacement = `    includeTeachingNotes: false,
    includeHomework: false,
    englishCombined: false,
    references: '',`;

const updated = code.replace(target, replacement);
fs.writeFileSync('src/components/DocGenerator.tsx', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");
