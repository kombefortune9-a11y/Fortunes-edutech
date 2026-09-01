const fs = require('fs');

let content = fs.readFileSync('src/constants.ts', 'utf8');

// Add to GRADES
content = content.replace(
  /"Form 4 \(CBC\)",\n\];/,
  '"Form 4 (CBC)",\n  "Form 5 (CBC)",\n  "Form 6 (CBC)",\n];'
);

// Add to SECONDARY_GRADES or define ADVANCED_GRADES? Let's check what SECONDARY_GRADES is used for
fs.writeFileSync('src/constants.ts', content);
console.log("Updated constants GRADES");
