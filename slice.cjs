const fs = require('fs');
let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');
lines.splice(136, 14);
fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('done slicing');
