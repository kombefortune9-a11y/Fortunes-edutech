import fs from 'fs';
const code = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const target = `        setFormData(prev => ({
          ...prev,
          englishCombined: false,
          englishComponent: 'combined',
          additionalContext: combinedSyncInstructionStr,`;

const replacement = `        setFormData(prev => ({
          ...prev,
          englishCombined: true,
          englishComponent: 'combined',
          additionalContext: combinedSyncInstructionStr,`;

const updated = code.replace(target, replacement);
fs.writeFileSync('src/components/DocGenerator.tsx', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");
