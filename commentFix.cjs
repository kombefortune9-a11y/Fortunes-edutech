const fs = require('fs');

let lines = fs.readFileSync('./src/services/geminiService.ts', 'utf8').split('\\n');

let target = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Perform placeholder replacement') && lines[i].includes('let customizedPrompt = template.prompt;')) {
    target = i;
    break;
  }
}

if (target !== -1) {
    const replacement = [
      "  // Perform placeholder replacement in template prompt",
      "  let customizedPrompt = template.prompt;",
      "  if (params.curriculumType === 'OBE') {",
      "    if (params.type === 'schemes_of_work') {",
      "      customizedPrompt = customizedPrompt.replace("
    ];
    lines.splice(target, 1, ...replacement);
    fs.writeFileSync('./src/services/geminiService.ts', lines.join('\\n'));
    console.log('Fixed comment line');
} else {
    console.log('Not found');
}
