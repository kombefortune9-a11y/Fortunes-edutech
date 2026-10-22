import fs from 'fs';
const code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const target = `    ${
      params.englishCombined && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? \`
    ### ENGLISH COMBINED (ORAL & LITERACY) SPECIAL RULES:`;

const replacement = `    ${
      params.englishPreparationMode === 'normal' && (params.grade?.includes('Grade 1') || params.grade?.includes('Grade 2')) && params.subject?.toLowerCase().includes('english') && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? \`
    ### NORMAL ENGLISH (GRADES 1 & 2) SPECIAL RULES:
    1. SUBJECT MANDATE: Prepare this document treating "English" as a single unified subject, exactly as shown in the syllabus.
    2. NO ORAL/LITERACY SEPARATION: You are STRICTLY FORBIDDEN from creating separate "Oral English" and "Literacy in English" sections, headers, or slots. Cancel out any dual-topic oral/literacy rules.
    3. SYLLABUS ALIGNMENT: Include all topics from the syllabus as "English" from the first topic to the last topic sequentially.
    4. ACCURACY: Make sure all Topics, Sub-topics, Specific Competencies, Learning Activities, and Expected Standards appear EXACTLY as the syllabus indicates without separating them into oral vs literacy components.
    \`
        : params.englishCombined && (params.type === "schemes_of_work" || params.type === "weekly_forecast")
        ? \`
    ### ENGLISH COMBINED (ORAL & LITERACY) SPECIAL RULES:`;

const updated = code.replace(target.replace(/\\`/g, '`'), replacement.replace(/\\`/g, '`'));
fs.writeFileSync('src/services/geminiService.ts', updated);
console.log(updated !== code ? "Replaced!" : "Not found!");
