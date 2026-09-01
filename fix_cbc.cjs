const fs = require('fs');
let content = fs.readFileSync('src/data/syllabi.ts', 'utf8');

// Replace cbcHomeEconomicsHospitalityGrade5 and 6 with homeEconomicsHospitalityGrade5 and 6
content = content.replace(/cbcHomeEconomicsHospitalityGrade5/g, 'homeEconomicsHospitalityGrade5');
content = content.replace(/cbcHomeEconomicsHospitalityGrade6/g, 'homeEconomicsHospitalityGrade6');

fs.writeFileSync('src/data/syllabi.ts', content);
console.log("Replaced cbc mappings");
