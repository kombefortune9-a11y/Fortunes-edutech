const fs = require('fs');

const filesToUpdate = [
  'src/components/ReceiptManager.tsx',
  'src/components/Settings.tsx',
  'src/components/AIPlanningVoiceGuide.tsx',
  'src/components/UserManual.tsx',
  'src/components/AccessModal.tsx',
  'src/components/CircleDownloadTracker.tsx',
  'src/components/CurriculumAuditViewer.tsx',
  'src/components/FirebaseProvider.tsx'
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ECE Level 1 to Form 4/gi, 'ECE Level 1 to Form 6 (A Level)');
  content = content.replace(/ECE level 1 - Form 4/gi, 'ECE Level 1 - Form 6 (A Level)');
  content = content.replace(/up to Form 4/gi, 'up to Form 6 (A Level)');
  content = content.replace(/through Form 4/gi, 'through Form 6 (A Level)');
  content = content.replace(/ECE to Form 4/gi, 'ECE to Form 6 (A Level)');
  fs.writeFileSync(file, content);
}

console.log("Updated files");
