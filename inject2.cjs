const fs = require('fs');

let content = fs.readFileSync('./src/data/syllabi.ts', 'utf8');

// Inject subjects into Grade 3
content = content.replace(/"Grade 3 \(OBE\)": \{/g, '"Grade 3 (OBE)": { "Integrated science": integratedScienceGrade3,');

// Inject subjects into Grade 5
content = content.replace(/"Grade 5 \(OBE\)": \{/g, '"Grade 5 (OBE)": { "Integrated science": integratedScienceGrade5, "English": englishGrade5, "Zambian Languages": zambianLangGrade5,');

// // Inject subjects into Grade 6
content = content.replace(/"Grade 6 \(OBE\)": \{/g, '"Grade 6 (OBE)": { "Integrated science": integratedScienceGrade6, "English": engZambianPlaceholder, "Zambian Languages": engZambianPlaceholder,');

// // Inject subjects into Grade 7
content = content.replace(/"Grade 7 \(OBE\)": \{/g, '"Grade 7 (OBE)": { "Integrated science": integratedScienceGrade7, "English": engZambianPlaceholder, "Zambian Languages": engZambianPlaceholder,');

fs.writeFileSync('./src/data/syllabi.ts', content);
console.log('done modifying syllabi.ts second try');
