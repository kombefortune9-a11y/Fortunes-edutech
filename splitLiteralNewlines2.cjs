const fs = require('fs');

let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

let targetIdx = 36;
let badLine = lines[targetIdx];

if (badLine.includes('\\\\n')) {
   console.log('It includes backslash-n!');
}

let fixedLine = badLine.replace(/\\\\n/g, '\\n');
lines[targetIdx] = fixedLine;

fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('Fixed line 37 aggressively');
