const fs = require('fs');

let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

let target = 36; // 0 index for line 37
console.log('Line 37 is:', lines[target]);

const replacement = [
  "  // Perform placeholder replacement in template prompt",
  "  let customizedPrompt = template.prompt;",
  "  if (params.curriculumType === 'OBE') {",
  "    if (params.type === 'schemes_of_work') {",
  "      customizedPrompt = customizedPrompt.replace("
];
lines.splice(target, 1, ...replacement);
fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('Fixed comment line manually');
