const fs = require('fs');
const content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

const oralMatch = content.match(/export const englishGrade2Oral = \[([\s\S]*?)\];/);
if (oralMatch) {
  console.log("ORAL:");
  console.log(oralMatch[1]);
}

const litMatch = content.match(/export const englishGrade2Literacy = \[([\s\S]*?)\];/);
if (litMatch) {
  console.log("LITERACY:");
  console.log(litMatch[1]);
}
