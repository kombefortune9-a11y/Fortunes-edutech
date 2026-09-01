const fs = require('fs');
let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// The error was:
// Duplicate key "learningActivities" in object literal
// This usually means there's a line like: `something"], learningActivities: ["something`
// Or something similar inside the object block. Let's just remove the second key.

let fixed = content.replace(/], learningActivities: \[/g, ', ');
fs.writeFileSync('src/data/obeEnglishZambianData.ts', fixed, 'utf8');
console.log("Replaced instances of duplicated keys.");
