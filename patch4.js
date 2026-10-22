import fs from 'fs';
const code = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const target = `                  const isGrade12 = prev.grade?.includes('Grade 1') || prev.grade?.includes('Grade 2');
                  const sLowVal = newSubject.toLowerCase();
                  const isLiteracy = sLowVal.includes('literacy');
                  const isOral = sLowVal.includes('oral');
                  const isCombinedEnglish = (sLowVal.includes('english') || sLowVal.includes('combined')) && !isLiteracy && !isOral;

                  return { 
                    ...prev, 
                    subject: newSubject,
                    topic: '', 
                    subtopic: '',
                    englishCombined: isGrade12 && isCombinedEnglish,
                    englishComponent: isLiteracy ? 'literacy' : (isOral ? 'oral' : (isCombinedEnglish ? 'combined' : prev.englishComponent))
                  };`;

const replacement = `                  const isGrade12 = prev.grade?.includes('Grade 1') || prev.grade?.includes('Grade 2');
                  const sLowVal = newSubject.toLowerCase();
                  const isLiteracy = sLowVal.includes('literacy');
                  const isOral = sLowVal.includes('oral');
                  const isCombinedEnglish = (sLowVal.includes('english') || sLowVal.includes('combined')) && !isLiteracy && !isOral;

                  return { 
                    ...prev, 
                    subject: newSubject,
                    topic: '', 
                    subtopic: '',
                    englishCombined: isGrade12 && isCombinedEnglish && prev.englishPreparationMode !== 'normal',
                    englishComponent: isLiteracy ? 'literacy' : (isOral ? 'oral' : (isCombinedEnglish && prev.englishPreparationMode !== 'normal' ? 'combined' : prev.englishComponent))
                  };`;

const updated = code.replace(target, replacement);
fs.writeFileSync('src/components/DocGenerator.tsx', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");
