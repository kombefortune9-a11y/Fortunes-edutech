const fs = require('fs');

let content = fs.readFileSync('./src/services/geminiService.ts', 'utf8');

const headPencil = "// Perform placeholder replacement in template prompt";
const tailPencil = "customizedPrompt = customizedPrompt\\n    .replace(/{schoolName}/g";

const idx1 = content.indexOf(headPencil);
const idx2 = content.indexOf(tailPencil);

const newBlock = "  let customizedPrompt = template.prompt;\\n\\n" + 
"  if (params.curriculumType === 'OBE') {\\n" +
"    if (params.type === 'schemes_of_work') {\\n" +
"      customizedPrompt = customizedPrompt.replace(\\n" +
"        /### TABLE STRUCTURE:[\\\\s\\\\S]*?### REQUIREMENTS:/,\\n" +
"        `### TABLE STRUCTURE:\\n" +
"    Create a Markdown table with these EXACT 10 columns:\\n" +
"    1. WEEK\\n" +
"    2. TOPIC\\n" +
"    3. SUBTOPICS\\n" +
"    4. SPECIFIC OUTCOMES\\n" +
"    5. KNOWLEDGE\\n" +
"    6. SKILLS\\n" +
"    7. VALUES\\n" +
"    8. TEACHING METHODS\\n" +
"    9. T/L AIDS\\n" +
"    10. REFERENCES\\n\\n" +
"    ### REQUIREMENTS:`\\n" +
"      ).replace(/CBC/g, 'OBE');\\n" +
"    } else if (params.type === 'weekly_forecast') {\\n" +
"      customizedPrompt = customizedPrompt.replace(\\n" +
"        /### TABLE STRUCTURE:[\\\\s\\\\S]*?### REQUIREMENTS:/,\\n" +
"        `### TABLE STRUCTURE:\\n" +
"    Create a Markdown table with these EXACT 9 columns:\\n" +
"    1. DAY\\n" +
"    2. TOPIC\\n" +
"    3. SUBTOPICS\\n" +
"    4. SPECIFIC OUTCOMES\\n" +
"    5. KNOWLEDGE\\n" +
"    6. T/L AIDS\\n" +
"    7. METHOD\\n" +
"    8. REFERENCES\\n" +
"    9. RECORD OF WORK\\n\\n" +
"    ### REQUIREMENTS:`\\n" +
"      ).replace(/CBC/g, 'OBE');\\n" +
"    } else if (params.type === 'lesson_plan') {\\n" +
"      customizedPrompt = customizedPrompt\\n" +
"        .replace(/GENERAL COMPETENCES/g, 'GENERAL OUTCOMES')\\n" +
"        .replace(/SPECIFIC COMPETENCES/g, 'SPECIFIC OUTCOMES')\\n" +
"        .replace('<div class=\"section\"><strong>LEARNING ACTIVITIES:</strong><br/>- [Activity 1]<br/>- [Activity 2]</div>', '')\\n" +
"        .replace(/CBC/g, 'OBE');\\n" +
"    }\\n" +
"  }\\n\\n  ";

if (idx1 !== -1 && idx2 !== -1) {
    const head = content.substring(0, idx1 + headPencil.length + 1);
    const tail = content.substring(idx2);
    fs.writeFileSync('./src/services/geminiService.ts', head + newBlock + tail);
    console.log('Fixed everything');
} else {
    console.log('Markers not found');
}
