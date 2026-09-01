const fs = require('fs');

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

// The problematic line is:
// 3. LITERACY ACTIVITIES: Plan Literacy in English lessons following the National Literacy Teaching Module structure (Phonemic awareness, Phonics, Activity 1a, 1b, 1c, 1d, sound blending, decodable text reading, writing, and comprehension).

content = content.replace(
    "Activity 1a, 1b, 1c, 1d",
    "Activity 1a and Activity 1b (for Term 2 and 3), or up to Activity 1d (only for Term 1)"
);

fs.writeFileSync('src/services/geminiService.ts', content, 'utf8');
console.log("Fixed the hardcoded 1a, 1b, 1c, 1d instruction in geminiService.");
