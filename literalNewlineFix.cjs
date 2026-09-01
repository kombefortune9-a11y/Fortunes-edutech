const fs = require('fs');
let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');

// I will look for string "\\\\n  let customizedPrompt" which corresponds to literal "\\n" text if I injected "\\n" instead of actual newline!
content = content.replace(/\\/\\/ Perform placeholder replacement in template prompt\\\\n  let customizedPrompt = template\\.prompt;\\\\n  customizedPrompt = customizedPrompt\\.replace\\(/g, 
  "// Perform placeholder replacement in template prompt\\n  let customizedPrompt = template.prompt;\\n  if (params.curriculumType === 'OBE') {\\n    if (params.type === 'schemes_of_work') {\\n      customizedPrompt = customizedPrompt.replace("
);

fs.writeFileSync('./src/services/geminiService.ts', content);
console.log('Fixed literal newlines');
