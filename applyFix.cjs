const fs = require('fs');

let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');
let safeFix = fs.readFileSync('./safeFix.ts', 'utf8');

const match = /export function patch\\(customizedPrompt, params\\) \\{([\\s\\S]*?)\\n  return customizedPrompt;\\n\\}/.exec(safeFix);
const newBlock = match[1];

const regex = /^\s*\/\/\s*Perform placeholder replacement in template prompt[\s\S]*?customizedPrompt = customizedPrompt\n    \.replace\(\{schoolName\}\/g\, params\.school || '\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.'\)/m;

content = content.replace(
  /^\s*\/\/\s*Perform placeholder replacement in template prompt[\s\S]*?customizedPrompt = customizedPrompt/m, 
  "// Perform placeholder replacement in template prompt\\n  let customizedPrompt = template.prompt;\\n" + newBlock + "\\n  customizedPrompt = customizedPrompt"
);

fs.writeFileSync('./src/services/geminiService.ts', content);
console.log('patched');
