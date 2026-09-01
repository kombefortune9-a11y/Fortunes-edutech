const fs = require('fs');

let content = fs.readFileSync('./src/constants.ts', 'utf8');

const homeworkInstruction = `
- CRITICAL HOMEWORK RULE: Homework MUST ONLY be included if the lesson date falls on a WEDNESDAY or a FRIDAY. If the lesson date is not a Wednesday or Friday, completely omit the entire "Homework" component from the generated markup (do not output the homework section at all).
`;

content = content.replace('- CRITICAL: The document MUST follow a clean, continuous layout that fits on as few pages as possible (Target: 2 pages, Maximum: 3 pages).', 
  '- CRITICAL: The document MUST follow a clean, continuous layout that fits on as few pages as possible (Target: 2 pages, Maximum: 3 pages).' + homeworkInstruction);

fs.writeFileSync('./src/constants.ts', content);
console.log('done updating homework rule');
