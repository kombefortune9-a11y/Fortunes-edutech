const fs = require('fs');
const path = require('path');

const logDir = fs.readdirSync('/.gemini/antigravity/brain/')[0];
const transcript = fs.readFileSync(\`/.gemini/antigravity/brain/\${logDir}/.system_generated/logs/transcript.jsonl\`, 'utf8');

// I will look for any "view_file" or "file contents" that contains the original imports.
// But better, I'll search for "import { GoogleGenAI } from '@google/genai';" within the transcript.

let found = transcript.split('\\n').filter(line => line.includes('generateEducationalDoc') && line.includes('import'));
console.log(found.length > 0 ? found[0].substring(0, 500) : "Not found in 1 line");

// Also, the system prompt doesn't have it, but maybe an earlier tool response has the full file!
let lines = transcript.split('\\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export async function generateEducationalDoc')) {
     console.log('Found it around line ' + i);
  }
}
