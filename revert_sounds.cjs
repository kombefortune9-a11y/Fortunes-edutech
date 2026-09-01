const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// We have multiple objects that look like:
//      {
//        title: "1.9.2 Sound /s/ (Lesson 1a)",
//        competencies: ["..."],
//        learningActivities: [
//          "Activity 1a: ..."
//        ],
//        expectedStandard: ["..."]
//      },
// We want to combine adjacent objects that have the same base title.

const regex = /\{\s*title:\s*"([^"]+)\s*\(Lesson[^)]+\)",\s*competencies:\s*(\[[^\]]+\]),\s*learningActivities:\s*\[([\s\S]*?)\],\s*expectedStandard:\s*(\[[^\]]+\])\s*\}/g;

let matches = [...content.matchAll(regex)];
console.log(`Found ${matches.length} matching blocks to revert.`);

// We can replace the whole array by reading and parsing the array, but it's simpler to do string replacements.
// Since we have the matches, we can group them by their index and base title.
// Actually, it's safer to just do a pass where we find a match, and if the next block is the same base title, we merge the learning activities.

let newContent = content;

let grouped = {};
for (let m of matches) {
    let fullMatch = m[0];
    let title = m[1]; // base title
    let comps = m[2];
    let act = m[3].trim();
    let std = m[4];
    
    if (!grouped[title]) {
        grouped[title] = {
            competencies: comps,
            learningActivities: [],
            expectedStandard: std,
            toReplace: []
        };
    }
    grouped[title].learningActivities.push(act);
    grouped[title].toReplace.push(fullMatch);
}

for (let baseTitle in grouped) {
    let g = grouped[baseTitle];
    // Form the combined block
    let combined = `{
        title: "${baseTitle}",
        competencies: ${g.competencies},
        learningActivities: [
          ${g.learningActivities.join(",\n          ")}
        ],
        expectedStandard: ${g.expectedStandard}
      }`;
      
    // Replace the first occurrence with the combined block
    newContent = newContent.replace(g.toReplace[0], combined);
    
    // Replace all subsequent occurrences with nothing (and optionally clear up trailing commas)
    for (let i = 1; i < g.toReplace.length; i++) {
        // Because they might be separated by ",\n      ", we can replace the match preceded by a comma
        let r1 = new RegExp(",\\s*" + g.toReplace[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (r1.test(newContent)) {
            newContent = newContent.replace(r1, "");
        } else {
            // try without comma
            newContent = newContent.replace(g.toReplace[i], "");
        }
    }
}

fs.writeFileSync('src/data/obeEnglishZambianData.ts', newContent, 'utf8');
console.log("Reversion complete.");
