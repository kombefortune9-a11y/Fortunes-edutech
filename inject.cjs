const fs = require('fs');

let content = fs.readFileSync('./src/data/syllabi.ts', 'utf8');

// Add the imports
const imports = `import { integratedScienceGrade3, integratedScienceGrade5, integratedScienceGrade6, integratedScienceGrade7 } from './integratedScienceData';
import { englishGrade5, zambianLangGrade5, engZambianPlaceholder } from './obeEnglishZambianData';
`;

content = content.replace('export const SYLLABI: Record<string, Record<string, Topic[]>> = {', imports + '\nexport const SYLLABI: Record<string, Record<string, Topic[]>> = {');

// Inject subjects into Grade 3
content = content.replace(/"Grade 3 \\(OBE\\)": \\{/g, '"Grade 3 (OBE)": {\n    "Integrated science": integratedScienceGrade3,');

// Inject subjects into Grade 5
content = content.replace(/"Grade 5 \\(OBE\\)": \\{/g, '"Grade 5 (OBE)": {\n    "Integrated science": integratedScienceGrade5,\n    "English": englishGrade5,\n    "Zambian Languages": zambianLangGrade5,');

// Inject subjects into Grade 6
content = content.replace(/"Grade 6 \\(OBE\\)": \\{/g, '"Grade 6 (OBE)": {\n    "Integrated science": integratedScienceGrade6,\n    "English": engZambianPlaceholder,\n    "Zambian Languages": engZambianPlaceholder,');

// Inject subjects into Grade 7
content = content.replace(/"Grade 7 \\(OBE\\)": \\{/g, '"Grade 7 (OBE)": {\n    "Integrated science": integratedScienceGrade7,\n    "English": engZambianPlaceholder,\n    "Zambian Languages": engZambianPlaceholder,');

fs.writeFileSync('./src/data/syllabi.ts', content);
console.log('done modifying syllabi.ts');
