const fs = require('fs');
let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');
let safeFixLines = fs.readFileSync('./safeFix.ts', 'utf8').split('\\n').slice(4, 38);

let startIdx = lines.findIndex(l => l.includes('// Perform placeholder replacement'));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('.replace(/{schoolName}/g'));

if (startIdx !== -1 && endIdx !== -1) {
   let endRemove = endIdx - 1;
   while(endRemove > startIdx && !lines[endRemove].includes('customizedPrompt = customizedPrompt')) {
       endRemove--;
   }

   const insertion = [
     "  // Perform placeholder replacement in template prompt",
     "  let customizedPrompt = template.prompt;"
   ].concat(safeFixLines);

   lines.splice(startIdx, endRemove - startIdx, ...insertion);
   fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
   console.log('Fixed clean with safeFix!');
} else {
   console.log('Indexes not found', startIdx, endIdx);
}
