import fs from 'fs';
const code = fs.readFileSync('src/components/DocGenerator.tsx', 'utf8');

const t1 = `                                  <option value="">Select Topic</option>
                                  {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') ? (`;
const r1 = `                                  <option value="">Select Topic</option>
                                  {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && formData.subject.toLowerCase().includes('english') && formData.englishPreparationMode !== 'normal' ? (`;

const t2 = `                        <option value="">Select Topic</option>
                        {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral')) ? (`;
const r2 = `                        <option value="">Select Topic</option>
                        {(formData.grade.includes('Grade 1') || formData.grade.includes('Grade 2')) && (formData.subject.toLowerCase().includes('english') || formData.subject.toLowerCase().includes('literacy') || formData.subject.toLowerCase().includes('oral')) && formData.englishPreparationMode !== 'normal' ? (`;

const u1 = code.replace(t1, r1);
const u2 = u1.replace(t2, r2);

fs.writeFileSync('src/components/DocGenerator.tsx', u2);
console.log((u2 !== code && u1 !== code) ? "Both replaced!" : (u1 !== code ? "Only first replaced!" : "None replaced!"));
