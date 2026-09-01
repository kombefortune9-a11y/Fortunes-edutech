const { execSync } = require('child_process');
execSync('git checkout src/services/geminiService.ts');
console.log('Restored geminiService.ts from git');
