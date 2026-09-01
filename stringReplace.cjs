const fs = require('fs');
let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');

let target = "  // Perform placeholder replacement in template prompt\\n  let customizedPrompt = template.prompt;\\n  customizedPrompt = customizedPrompt.replace(";

let replacement = "  // Perform placeholder replacement in template prompt\\n" +
                  "  let customizedPrompt = template.prompt;\\n" +
                  "  if (params.curriculumType === 'OBE') {\\n" +
                  "    if (params.type === 'schemes_of_work') {\\n" + 
                  "      customizedPrompt = customizedPrompt.replace(";

content = content.split(target).join(replacement);

fs.writeFileSync('./src/services/geminiService.ts', content);
console.log('Done string replace');
