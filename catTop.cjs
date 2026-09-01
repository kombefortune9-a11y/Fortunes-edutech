const fs = require('fs');

let topCode = fs.readFileSync('top.ts', 'utf8');
let body = fs.readFileSync('./src/services/geminiService.ts', 'utf8');

let full = topCode + body;

fs.writeFileSync('./src/services/geminiService.ts', full);
console.log('Restored the top section!');
