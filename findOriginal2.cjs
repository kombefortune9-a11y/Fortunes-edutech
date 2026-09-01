const fs = require('fs');
const path = require('path');

const brains = fs.readdirSync('/.gemini/antigravity/brain/');
const logDir = brains[0];
const transcriptPath = '/.gemini/antigravity/brain/' + logDir + '/.system_generated/logs/transcript.jsonl';
if (!fs.existsSync(transcriptPath)) {
    console.log('No transcript');
    process.exit(1);
}

const transcript = fs.readFileSync(transcriptPath, 'utf8');

let foundIdxs = [];
let lines = transcript.split('\\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function generateEducationalDoc')) {
     foundIdxs.push(i);
  }
}
console.log('Found occurrences at jsonl lines:', foundIdxs);

