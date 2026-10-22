import fs from 'fs';
const code = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const target = `    let uniqueCombined = Array.from(new Set(combined));

    // English Preparation Mode filtering for Grades 1 & 2
    if (grade.toLowerCase().includes('grade 1') || grade.toLowerCase().includes('grade 2')) {
      if (formData.englishPreparationMode === 'normal') {
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'Oral English' && s !== 'Literacy in English');
      } else {
        // If 'separate' or 'combined', replace 'English' with the specific components
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'English');
        if (formData.englishPreparationMode === 'separate') {
          if (!uniqueCombined.includes('Oral English')) uniqueCombined.push('Oral English');
          if (!uniqueCombined.includes('Literacy in English')) uniqueCombined.push('Literacy in English');
        } else if (formData.englishPreparationMode === 'combined') {
          uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'Oral English' && s !== 'Literacy in English');
          if (!uniqueCombined.includes('English (Combined: Oral + Literacy)')) uniqueCombined.push('English (Combined: Oral + Literacy)');
        }
      }
    }`;

const replacement = `    let uniqueCombined = Array.from(new Set(combined));

    // English Preparation Mode filtering for Grades 1 & 2
    if (grade.toLowerCase().includes('grade 1') || grade.toLowerCase().includes('grade 2')) {
      if (formData.englishPreparationMode === 'normal') {
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'Oral English' && s !== 'Literacy in English');
        if (combined.some(s => s === 'Oral English' || s === 'Literacy in English') && !uniqueCombined.includes('English')) {
          uniqueCombined.push('English');
        }
      } else {
        // If 'separate' or 'combined', replace 'English' with the specific components
        uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'English');
        if (formData.englishPreparationMode === 'separate') {
          if (!uniqueCombined.includes('Oral English')) uniqueCombined.push('Oral English');
          if (!uniqueCombined.includes('Literacy in English')) uniqueCombined.push('Literacy in English');
        } else if (formData.englishPreparationMode === 'combined') {
          uniqueCombined = Array.from(new Set(uniqueCombined)).filter(s => s !== 'Oral English' && s !== 'Literacy in English');
          if (!uniqueCombined.includes('English (Combined: Oral + Literacy)')) uniqueCombined.push('English (Combined: Oral + Literacy)');
        }
      }
    }`;

const updated = code.replace(target, replacement);
fs.writeFileSync('src/components/DocGenerator.tsx', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");
