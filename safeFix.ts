import { DOC_TEMPLATES } from '../constants';
import { generateDocParams, GenerationParams } from './types'; // Or whatever necessary imports

export function patch(customizedPrompt, params) {
  if (params.curriculumType === 'OBE') {
    if (params.type === 'schemes_of_work') {
      customizedPrompt = customizedPrompt.replace(
        /### TABLE STRUCTURE:[\\s\\S]*?### REQUIREMENTS:/,
        `### TABLE STRUCTURE:
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

    ### REQUIREMENTS:`
      ).replace(/CBC/g, 'OBE');
    } else if (params.type === 'weekly_forecast') {
      customizedPrompt = customizedPrompt.replace(
        /### TABLE STRUCTURE:[\\s\\S]*?### REQUIREMENTS:/,
        `### TABLE STRUCTURE:
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

    ### REQUIREMENTS:`
      ).replace(/CBC/g, 'OBE');
    } else if (params.type === 'lesson_plan') {
      customizedPrompt = customizedPrompt
        .replace(/GENERAL COMPETENCES/g, 'GENERAL OUTCOMES')
        .replace(/SPECIFIC COMPETENCES/g, 'SPECIFIC OUTCOMES')
        .replace('<div class="section"><strong>LEARNING ACTIVITIES:</strong><br/>- [Activity 1]<br/>- [Activity 2]</div>', '')
        .replace(/CBC/g, 'OBE');
    }
  }
  return customizedPrompt;
}
