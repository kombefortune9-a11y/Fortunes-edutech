const fs = require('fs');
let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

// we want to drop from index 89 (line 90) to index 144 (line 145, inclusive) -> 56 lines
// let's verify line 89 is `// Perform placeholder replacement`...
// wait, line 90 is index 89. Yes.
// let's verify where `customizedPrompt = customizedPrompt.replace(/{schoolName}/g` is.

let startIdx = lines.findIndex(l => l.includes('// Perform placeholder replacement'));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('.replace(/{schoolName}/g'));

if (startIdx !== -1 && endIdx !== -1) {
   // delete everything from startIdx to endIdx - 1
   // wait, endIdx is `.replace(/{schoolName}/`, but usually `customizedPrompt = customizedPrompt` is on the line BEFORE `endIdx`.
   // Let's find `customizedPrompt = customizedPrompt` before endIdx.
   let endRemove = endIdx - 1;
   while(endRemove > startIdx && !lines[endRemove].includes('customizedPrompt = customizedPrompt')) {
       endRemove--;
   }

   const insertion = \`  // Perform placeholder replacement in template prompt
  let customizedPrompt = template.prompt;

  if (params.curriculumType === 'OBE') {
    if (params.type === 'schemes_of_work') {
      customizedPrompt = customizedPrompt.replace(
        /### TABLE STRUCTURE:[\\\\s\\\\S]*?### REQUIREMENTS:/,
        \\\`### TABLE STRUCTURE:
    Create a Markdown table with these EXACT 10 columns:
    1. WEEK
    2. TOPIC
    3. SUBTOPICS
    4. SPECIFIC OUTCOMES
    5. KNOWLEDGE
    6. SKILLS
    7. VALUES
    8. TEACHING METHODS
    9. T/L AIDS
    10. REFERENCES

    ### REQUIREMENTS:\\\`
      ).replace(/CBC/g, 'OBE');
    } else if (params.type === 'weekly_forecast') {
      customizedPrompt = customizedPrompt.replace(
        /### TABLE STRUCTURE:[\\\\s\\\\S]*?### REQUIREMENTS:/,
        \\\`### TABLE STRUCTURE:
    Create a Markdown table with these EXACT 9 columns:
    1. DAY
    2. TOPIC
    3. SUBTOPICS
    4. SPECIFIC OUTCOMES
    5. KNOWLEDGE
    6. T/L AIDS
    7. METHOD
    8. REFERENCES
    9. RECORD OF WORK

    ### REQUIREMENTS:\\\`
      ).replace(/CBC/g, 'OBE');
    } else if (params.type === 'lesson_plan') {
      customizedPrompt = customizedPrompt
        .replace(/GENERAL COMPETENCES/g, 'GENERAL OUTCOMES')
        .replace(/SPECIFIC COMPETENCES/g, 'SPECIFIC OUTCOMES')
        .replace('<div class="section"><strong>LEARNING ACTIVITIES:</strong><br/>- [Activity 1]<br/>- [Activity 2]</div>', '')
        .replace(/CBC/g, 'OBE');
    }
  }\`.split('\\n');

  lines.splice(startIdx, endRemove - startIdx, ...insertion);
  fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
  console.log('Fixed clean!');
} else {
  console.log('Indexes not found', startIdx, endIdx);
}
