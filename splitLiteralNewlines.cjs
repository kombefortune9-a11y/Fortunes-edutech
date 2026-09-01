const fs = require('fs');

let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

let targetIdx = 36;
let badLine = lines[targetIdx];

// replace the literal '\\n' sequences with actual newline characters
let splitByEscapedN = badLine.split('\\\\n');
let fixedLines = splitByEscapedN.join('\\n');

lines.splice(targetIdx, 1, fixedLines);
fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('Split line 37 successfully');
