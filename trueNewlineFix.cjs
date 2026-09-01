const fs = require('fs');
let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');

// replace literal '\\n' that appears after '// Perform placeholder replacement in template prompt'
content = content.replace("  // Perform placeholder replacement in template prompt\\n  let customizedPrompt = template.prompt;\\n  if (params.curriculumType === 'OBE') {\\n    if (params.type === 'schemes_of_work') {\\n      customizedPrompt = customizedPrompt.replace(", 
  "  // Perform placeholder replacement in template prompt\\n" +
  "  let customizedPrompt = template.prompt;\\n" +
  "  if (params.curriculumType === 'OBE') {\\n" +
  "    if (params.type === 'schemes_of_work') {\\n" +
  "      customizedPrompt = customizedPrompt.replace("
);

fs.writeFileSync('./src/services/geminiService.ts', content);
console.log('Replaced literal newlines with exact file newlines!');
