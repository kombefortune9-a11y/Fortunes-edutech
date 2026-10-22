
import { parsePastedSchemesTextToWeeks, splitSubtopicsIntoArray } from './outsideSchemeParser';

console.log('Split Length:', splitSubtopicsIntoArray('Length'));

const sampleTable = `
| WEEK | TOPIC | SUBTOPIC | SPECIFIC OUTCOMES | KNOWLEDGE | SKILLS | VALUES | METHOD | AIDS | REF |
| 5 | MEASURES | Length | Measure length using non-standard units | Non-standard units | Measuring | Precision | Demonstration | Ruler | Syllabus |
| 6 | TIME | 3.9.1 Tell time at specified intervals; 3.9.2 Read and use the calendar | Tell time | Time | Reading | Accuracy | Practical | Clock | Syllabus |
`;

const parsed = parsePastedSchemesTextToWeeks(sampleTable, 'Grade 5', 'Mathematics');
console.log(JSON.stringify(parsed, null, 2));
