const fs = require('fs');

let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

const newBlock = "  if (params.curriculumType === 'OBE') {\\n" +
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
"  }";

lines.splice(93, 58, newBlock); // Replace 58 lines starting from index 93

fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
console.log('Successfully repatched');
