const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

const replacement = `export const englishGrade1Literacy = [
  {
    title: "1.9 SOUNDS",
    term: "Term 1",
    subtopics: [
      { 
        title: "1.9.2 Sound /s/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      { 
        title: "1.9.1 Sound /a/", 
        competencies: ["1.9.1.1 Sound out short vowels."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Short vowel in English sounded out and written correctly."]
      },
      { 
        title: "1.9.2 Sound /t/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      { 
        title: "1.9.1 Sound /i/", 
        competencies: ["1.9.1.1 Sound out short vowels."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Short vowel in English sounded out and written correctly."]
      },
      { 
        title: "1.9.2 Sound /p/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      { 
        title: "1.9.2 Sound /n/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      { 
        title: "1.9.2 Sound /ck/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      { 
        title: "1.9.1 Sound /e/", 
        competencies: ["1.9.1.1 Sound out short vowels."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Short vowel in English sounded out and written correctly."]
      },
      { 
        title: "1.9.2 Sound /h/", 
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1b: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1c: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension",
          "Activity 1d: Phonemic awareness, Phonics, Fluency, Vocabulary, Writing and Comprehension"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      }
    ]
  },
  {
    title: "1.9 SOUNDS",
    term: "Term 2",
    subtopics: [
      {
        title: "1.9.2 Sound /m/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /d/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /g/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.1 Sound /o/",
        competencies: ["1.9.1.1 Sound out vowel in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Short vowel in English sounded out and written correctly."]
      },
      {
        title: "1.9.1 Sound /u/",
        competencies: ["1.9.1.1 Sound out vowel in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Short vowel in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /l/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonants in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /f/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonants in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /b/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonants in English sounded out and written correctly."]
      },
      {
        title: "1.9.3 Sound /ai/",
        competencies: ["1.9.3.1 Sound out long vowels in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Long vowels sounded out correctly."]
      },
      {
        title: "1.9.2 Sound /j/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonants in English sounded out and written correctly."]
      },
      {
        title: "1.9.3 Sound /oa/",
        competencies: ["1.9.3.1 Sound out long vowels in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Long vowels sounded out correctly."]
      },
      {
        title: "1.9.3 Sound /ie/",
        competencies: ["1.9.3.1 Sound out long vowels in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Long vowels sounded out correctly."]
      },
      {
        title: "1.9.3 Sound /ee/",
        competencies: ["1.9.3.1 Sound out long vowels in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Long vowels sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /or/",
        competencies: ["1.9.4.1 Sound out diagraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Diagraphs sounded out correctly."]
      },
      {
        title: "1.9.2 Sound /z/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /w/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /v/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonants in English sounded out and written correctly."]
      }
    ]
  },
  {
    title: "1.9 SOUNDS",
    term: "Term 3",
    subtopics: [
      {
        title: "1.9.4 Sound /ng/",
        competencies: ["1.9.4.1 Sound out digraphs in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /oo/",
        competencies: ["1.9.4.1 Sound out digraphs in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs in English sounded out correctly."]
      },
      {
        title: "1.9.2 Sound /y/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.2 Sound /x/",
        competencies: ["1.9.2.1 Sound out consonants in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Consonant in English sounded out and written correctly."]
      },
      {
        title: "1.9.4 Sound /ch/",
        competencies: ["1.9.4.1 Sound out digraphs in English."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /sh/",
        competencies: ["1.9.4.1 Sound out digraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /th/",
        competencies: ["1.9.4.1 Sound out digraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /qu/",
        competencies: ["1.9.4.1 Sound out digraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs sounded out correctly."]
      },
      {
        title: "1.9.5 Sound /ou/",
        competencies: ["1.9.5.1 Sound out diphthongs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Diphthongs sounded out correctly."]
      },
      {
        title: "1.9.5 Sound /oi/",
        competencies: ["1.9.5.1 Sound out diphthongs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Digraphs in English sounded out correctly."]
      },
      {
        title: "1.9.3 Sound /ue/",
        competencies: ["1.9.3.1 Sound out long vowels."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Long vowels sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /er/",
        competencies: ["1.9.4.1 Sound out diagraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Diagraphs sounded out correctly."]
      },
      {
        title: "1.9.4 Sound /ar/",
        competencies: ["1.9.4.1 Sound out diagraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonemic awareness, Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Diagraphs sounded out correctly."]
      }
    ]
  }
];`;

const regex = /export const englishGrade1Literacy = \[\s*[\s\S]*?\];\s*$/m;
if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/data/obeEnglishZambianData.ts', content, 'utf8');
  console.log("Successfully replaced englishGrade1Literacy array.");
} else {
  console.log("Regex failed, manual replacement needed.");
}
