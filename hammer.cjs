const fs = require('fs');
let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

let replacement = [
  "  // Perform placeholder replacement in template prompt",
  "  let customizedPrompt = template.prompt;",
  "  if (params.curriculumType === 'OBE') {",
  "    if (params.type === 'schemes_of_work') {",
  "      customizedPrompt = customizedPrompt.replace("
];

lines.splice(36, 1, ...replacement);
fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('Fixed for real');
