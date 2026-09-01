const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// We want to find blocks like:
//      {
//        title: "1.9.2 Sound /s/",
//        competencies: [...],
//        learningActivities: [
//          "Activity 1a: ...",
//          "Activity 1b: ...",
//          "Activity 1c: ..."
//        ],
//        expectedStandard: [...]
//      },

const regex = /\{\s*title:\s*"([^"]+Sound[^"]+)",\s*competencies:\s*\[(.*?)\],\s*learningActivities:\s*\[([\s\S]*?)\],\s*expectedStandard:\s*\[(.*?)\]\s*\}/g;

let matchCount = 0;
content = content.replace(regex, (match, title, competencies, activitiesStr, expectedStandard) => {
    // If it doesn't contain Activity 1a, 1b etc, or already split, return original
    if (!title.match(/Sound/i)) return match;
    if (title.includes("(Lesson")) return match; // already split

    // parse activities
    const activities = activitiesStr.split(/",\s*"/).map(s => s.replace(/^"|"$/g, '').trim()).map(s => s.replace(/^"|"$/, '').trim());
    
    // We only split if there are distinct activities starting with Activity 1a, 1b etc.
    // Actually, let's just split if there are multiple activities and it's a Sound.
    if (activities.length <= 1) return match;

    matchCount++;
    
    let replacement = [];
    
    for (let i = 0; i < activities.length; i++) {
        let act = activities[i];
        let subType = "";
        if (act.includes("1a")) subType = " (Lesson 1a)";
        else if (act.includes("1b")) subType = " (Lesson 1b)";
        else if (act.includes("1c")) subType = " (Lesson 1c)";
        else subType = ` (Lesson ${i+1})`;
        
        let newTitle = title.replace(" (unvoiced)", "").replace(" (voiced)", "").replace(" (short)", "").replace(" (long)", "");
        // re-add them if needed to differentiate, actually keep them:
        newTitle = title + subType;
        
        replacement.push(`      {
        title: "${newTitle}",
        competencies: [${competencies}],
        learningActivities: [
          "${act}"
        ],
        expectedStandard: [${expectedStandard}]
      }`);
    }
    
    return replacement.join(",\n");
});

console.log("Replaced blocks: " + matchCount);
fs.writeFileSync('src/data/obeEnglishZambianData.ts', content, 'utf8');

