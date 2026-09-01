const fs = require('fs');

let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');
let openCount = 0;
let lines = content.split('\\n');

let index = 0;
for (let line of lines) {
    if (index >= 80 && index <= 365) {
        
        let cleaned = line.replace(/\\/\\/.*$/, '').replace(/('[^']*')|("[^"]*")|(\`[^\`]*\`)/g, ''); // Crude removal of strings/comments to avoid false brackets!
        for (let char of cleaned) {    
           if (char === '{') openCount++;
           if (char === '}') openCount--;
        }
        if (openCount < 0) {
            console.log("Extra closing brace found at line: " + (index + 1) + ": " + line);
            break;
        }
    }
    index++;
}
console.log("Final balance: " + openCount);
