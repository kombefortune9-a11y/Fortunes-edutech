const fs = require('fs');

let content = fs.readFileSync('src/data/syllabi.ts', 'utf8');

// Grade 5 (OBC)
content = content.replace(
  /"Home Economics": homeEconomicsGrade5,/,
  '"Home Economics": homeEconomicsGrade5,\n    "Home Economics and Hospitality": homeEconomicsHospitalityGrade5,'
);

// Grade 6 (OBC)
content = content.replace(
  /"Home Economics": homeEconomicsGrade6,/,
  '"Home Economics": homeEconomicsGrade6,\n    "Home Economics and Hospitality": homeEconomicsHospitalityGrade6,'
);

fs.writeFileSync('src/data/syllabi.ts', content);
console.log("Updated syllabi.ts");
