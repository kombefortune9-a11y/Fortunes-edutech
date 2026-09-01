const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// The file contains learningActivities blocks like:
// learningActivities: [
//   "item",
//   "item",
//   "duplicate"
// ]
// We can use a regex to replace learningActivities: [ ... ] blocks with a deduplicated version.

content = content.replace(/learningActivities:\s*\[([\s\S]*?)\]/g, (match, inner) => {
    // extract items (assuming they are strings)
    const itemsRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let items = [];
    let m;
    while ((m = itemsRegex.exec(inner)) !== null) {
        items.push(m[0]);
    }
    
    // deduplicate
    let unique = [...new Set(items)];
    
    return `learningActivities: [\n          ${unique.join(",\n          ")}\n        ]`;
});

fs.writeFileSync('src/data/obeEnglishZambianData.ts', content, 'utf8');
console.log("Deduplicated activities.");
