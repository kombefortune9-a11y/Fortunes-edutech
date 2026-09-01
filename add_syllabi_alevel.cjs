const fs = require('fs');
let content = fs.readFileSync('src/data/syllabi.ts', 'utf8');

// Append Form 5 and Form 6 empty structures to syllabi.ts
const aLevel = `
  "Form 5 (A Level)": {
    "Advanced Mathematics": [],
    "Advanced Physics": [],
    "Advanced Chemistry": [],
    "Advanced Biology": [],
    "Advanced Geography": [],
    "Advanced History": [],
    "Advanced Literature": [],
    "Advanced Business Studies": []
  },
  "Form 6 (A Level)": {
    "Advanced Mathematics": [],
    "Advanced Physics": [],
    "Advanced Chemistry": [],
    "Advanced Biology": [],
    "Advanced Geography": [],
    "Advanced History": [],
    "Advanced Literature": [],
    "Advanced Business Studies": []
  }
};
`;

content = content.replace(/\n\};\n?$/, ',\n' + aLevel);
fs.writeFileSync('src/data/syllabi.ts', content);
console.log("Updated syllabi.ts");
