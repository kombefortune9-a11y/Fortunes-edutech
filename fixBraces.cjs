const fs = require('fs');
let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');
lines.splice(137, 14); // Remove lines 137 to 150
fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('done fixing bracket');
