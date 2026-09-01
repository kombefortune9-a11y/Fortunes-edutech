const fs = require('fs');

let content = fs.readFileSync('src/data/obeHomeEconomicsHospitalityData.ts', 'utf8');
content = content.replace(/"Creating posters illustrating key messages such as \("my body/g, '"Creating posters illustrating key messages such as (\\"my body');
content = content.replace(/my rules," respect others' privacy", or "ask before you touch"/g, 'my rules,\\" respect others\\' privacy\\", or \\"ask before you touch\\"');

fs.writeFileSync('src/data/obeHomeEconomicsHospitalityData.ts', content);
console.log("Fixed quotes");
