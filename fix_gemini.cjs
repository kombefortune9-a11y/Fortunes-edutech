const fs = require('fs');

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

content = content.replace(/\|\| gLow.includes\("form 4"\)/g, '|| gLow.includes("form 4") || gLow.includes("form 5") || gLow.includes("form 6")');
content = content.replace(/"Form 1 - Form 4"/g, '"Form 1 - Form 6"');
content = content.replace(/\(Form 1 - Form 4\)/g, '(Form 1 - Form 6)');
content = content.replace(/Form 1, Form 2, Form 3, Form 4/g, 'Form 1, Form 2, Form 3, Form 4, Form 5, Form 6');

fs.writeFileSync('src/services/geminiService.ts', content);
console.log("Updated geminiService.ts");
