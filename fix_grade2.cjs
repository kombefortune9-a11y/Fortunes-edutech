const fs = require('fs');
let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// I will rebuild `englishGrade2Oral` completely.
const grade2OralData = `export const englishGrade2Oral = [
  {
    title: "2.1 CONVERSATIONS",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.1.1 Family", 
        competencies: ["2.1.1.1 Use appropriate language to talk about an extended family."],
        learningActivities: [
          "Activity 1a: Identifying members of an extended family using pictures.",
          "Activity 1b: Talking about the composition of an extended family."
        ],
        expectedStandard: ["Appropriate language to talk about an extended family used correctly."]
      },
      { 
        title: "2.1.2 Time", 
        competencies: ["2.1.2.1 Use appropriate language to talk about the seasons of the year."],
        learningActivities: [
          "Activity 1a: Mentioning the seasons of the year in Zambia.",
          "Activity 1b: Describing the conditions associated to the seasons of the year."
        ],
        expectedStandard: ["Appropriate language to describe the seasons of the year used correctly."]
      }
    ]
  },
  {
    title: "2.7 DESCRIPTIONS",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.7.1 Describing people", 
        competencies: ["2.7.1.1 Use appropriate language to describe people."],
        learningActivities: [
          "Activity 1a: Describing people using adjectives.",
          "Activity 1b: Constructing sentences that describe people."
        ],
        expectedStandard: ["Appropriate language to describe people used correctly."]
      }
    ]
  },
  {
    title: "2.2 STORIES",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.2.1 Simple stories", 
        competencies: ["2.2.1.1 Analyse simple stories."],
        learningActivities: [
          "Activity 1a: Listening to simple traditional stories on different themes.",
          "Activity 1b: Retelling simple stories."
        ],
        expectedStandard: ["Simple stories analysed correctly."]
      }
    ]
  },
  {
    title: "2.6 SONGS",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.6.1 Simple songs", 
        competencies: ["2.6.1.1 Use appropriate language in singing songs."],
        learningActivities: [
          "Activity 1a: Listening to and singing simple songs.",
          "Activity 1b: Answering oral questions based on the song."
        ],
        expectedStandard: ["Appropriate language in singing songs used correctly."]
      }
    ]
  },
  {
    title: "2.1 CONVERSATION",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.1.6 Occupations", 
        competencies: ["2.1.6.1 Use appreciate language to discuss different occupations in the community."],
        learningActivities: [
          "Activity 1a: Naming different occupations in the community.",
          "Activity 1b: Discussing the roles played by different workers in the community."
        ],
        expectedStandard: ["Appropriate language to discuss different occupations in the community used accordingly."]
      }
    ]
  },
  {
    title: "2.6 SONGS",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.6.1 Simple songs", 
        competencies: ["2.6.1.1 Use appropriate language in singing songs."],
        learningActivities: [
          "Activity 1a: Listening to and singing simple songs focusing on pronunciation and rhythm.",
          "Activity 1b: Answering oral questions based on the song."
        ],
        expectedStandard: ["Appropriate language in singing songs used correctly."]
      }
    ]
  },
  {
    title: "2.3 DRAMA",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.3.1 Simple plays", 
        competencies: ["2.3.1.1 Use language to engage in simple plays."],
        learningActivities: [
          "Activity 1a: Dramatising simple plays.",
          "Activity 1b: Answering oral questions based on the play."
        ],
        expectedStandard: ["Language to engage in simple plays used appropriately."]
      }
    ]
  },
  {
    title: "2.1 CONVERSATION",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.1.10 Etiquette", 
        competencies: ["2.2.10.1 Use appropriate language to demonstrate manners and good behaviour."],
        learningActivities: [
          "Activity 1a: Discussing respect, honesty and empathy based on a text.",
          "Activity 1b: Demonstrating good behaviour."
        ],
        expectedStandard: ["Appropriate language to demonstrate manners and good behaviour used correctly."]
      }
    ]
  },
  {
    title: "2.2 STORIES",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.2.1 Simple stories", 
        competencies: ["2.2.1.1 Analyse simple stories."],
        learningActivities: [
          "Activity 1a: Listening to simple traditional stories on different themes.",
          "Activity 1b: Retelling simple stories."
        ],
        expectedStandard: ["Simple stories analysed correctly."]
      }
    ]
  },
  {
    title: "2.5 RIDDLES",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.5.1 Simple riddles", 
        competencies: ["2.5.1.1 Interpret simple riddles."],
        learningActivities: [
          "Activity 1a: Reciting simple riddles.",
          "Activity 1b: Interpreting simple riddles.",
          "Activity 1c: Competing to solve the riddles fastest."
        ],
        expectedStandard: ["Simple riddles interpreted correctly."]
      }
    ]
  },
  {
    title: "2.1 CONVERSATION",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.1.7 Expressing Feelings", 
        competencies: ["2.5.1.1 Use appropriate language to express feelings."],
        learningActivities: [
          "Activity 1a: Discussing feelings expressed in given pictures.",
          "Activity 1b: Expressing feeling through facial expressions, words and body language.",
          "Activity 1c: Using interjections to express feelings."
        ],
        expectedStandard: ["Appropriate language to express feelings used accordingly."]
      }
    ]
  },
  {
    title: "2.2 STORIES",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.2.1 Simple stories", 
        competencies: ["2.2.1.1 Analyse simple stories."],
        learningActivities: [
          "Activity 1a: Retelling simple stories.",
          "Activity 1b: Answering oral questions based on the story."
        ],
        expectedStandard: ["Simple stories analysed correctly."]
      }
    ]
  },
  {
    title: "2.1 CONVERSATIONS",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.1.4 Community Practices", 
        competencies: ["2.1.4.1 Use appropriate language to talk about good practices in the community."],
        learningActivities: [
          "Activity 1a: Mentioning good practices in the community.",
          "Activity 1b: Discussing how good practices can affect the community."
        ],
        expectedStandard: ["Appropriate language to talk about good practices in the community used correctly."]
      }
    ]
  },
  {
    title: "2.8 GAMES",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.8.1 Language Games", 
        competencies: ["2.8.1.1 Use appropriate language in playing games."],
        learningActivities: [
          "Activity 1a: Playing language games (Story chain).",
          "Activity 1b: Playing language games (Chinese whisper)."
        ],
        expectedStandard: ["Appropriate language in playing games used correctly."]
      }
    ]
  },
  {
    title: "2.6 SONGS",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.6.1 Simple songs", 
        competencies: ["2.6.1.1 Use appropriate language in singing simple songs."],
        learningActivities: [
          "Activity 1a: Listening to and singing simple songs focusing on pronunciation and rhythm.",
          "Activity 1b: Answering oral questions based on the song."
        ],
        expectedStandard: ["Appropriate language in singing songs used correctly."]
      }
    ]
  },
  {
    title: "2.1 CONVERSATION",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.1.8 Expressing opinions", 
        competencies: ["2.1.8.1 Use appropriate language to express personal opinion."],
        learningActivities: [
          "Activity 1a: Discussing pictures depicting different activities and expressing which one they like and why.",
          "Activity 1b: Expressing personal opinions and giving reasons."
        ],
        expectedStandard: ["Appropriate language to express personal opinions used accordingly."]
      }
    ]
  },
  {
    title: "2.3 DRAMA",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.3.1 Simple plays", 
        competencies: ["2.3.1.1 Use language to engage in simple plays."],
        learningActivities: [
          "Activity 1a: Dramatising simple plays.",
          "Activity 1b: Answering oral questions based on the play."
        ],
        expectedStandard: ["Language to engage in simple plays used appropriately."]
      }
    ]
  },
  {
    title: "2.4 POETRY",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.4.1 Simple Poems", 
        competencies: ["2.4.1.1 Recite simple poems."],
        learningActivities: [
          "Activity 1a: Reciting poems.",
          "Activity 1b: Discussing the lessons from the poems."
        ],
        expectedStandard: ["Poems recited correctly."]
      }
    ]
  }
];`

const grade2LiteracyData = `export const englishGrade2Literacy = [
  {
    title: "2.9 SOUNDS",
    term: "Term 1",
    subtopics: [
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /s/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants blended and read correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.2 Vowel alternative spelling choices: Sound /e/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.15.2.1 Write dictated words phrases and sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified accordingly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Dictated words, phrases and sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /j/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonant.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /t/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.12.1.2 Write decodable and sight words."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Decodable and sight words written legibly."]
      },
      { 
        title: "2.9.1 Vowel alternative spelling choices: Sound /ai/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.1 Vowel alternative spelling choices: Sound /oi/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.15.2.1. Write dictated words, phrases and sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Dictated words, phrases and sentences written correctly."]
      },
      { 
        title: "2.9.1 Vowel alternative spelling choices: Sound /ee/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /n/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.12.1.4 Write sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Sentences written correctly and legibly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /ie/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.15.2.1 Write dictated words, phrases and sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Dictated words, phrases and sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /k/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /r/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants blended and read correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /o/", 
        competencies: ["2.9.1.2 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.12.1.4 Write sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels blended and read correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Sentences written correctly and legibly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /m/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants blended and read correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /ue/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels blended and read correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /w/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants blended and read correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /or/", 
        competencies: ["2.9.1.2 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowel.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels blended and read correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /d/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonant blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /g/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      }
    ]
  },
  {
    title: "2.9 SOUNDS",
    term: "Term 2",
    subtopics: [
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /l/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.2 Vowel alternative spelling choices: Sound /er/", 
        competencies: ["2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels.", "2.9.2.2 Blend and read words with alternative spelling choices of vowels.", "2.15.2.1 Write dictated words, phrases and sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of vowels identified correctly.", "Words with alternative spelling choices of vowels blended and read correctly.", "Dictated words, phrases and sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /b/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonant.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /z/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonant.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants blended and read correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /v/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonant.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.1 Consonant alternative spelling choices: Sound /p/", 
        competencies: ["2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonant.", "2.9.1.2 Blend and read words with alternative spelling choices of consonants.", "2.13.1.1 Write words, phrases and simple sentences correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sounds and graphemes used as alternative spelling choices of consonants identified correctly.", "Words with alternative spelling choices of consonants blended and read correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: sl", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: nt", 
        competencies: ["2.9.5.1 Sound initial and final consonant blends.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounds correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: pl", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounds correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: ft", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounds correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: fl", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.15.2.1 Write dictated words, phrases and sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Dictated words, phrases and sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: st", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.14.2.1. Sequencing words and sentences logically."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words and sentences sequenced logically."]
      },
      { 
        title: "2.9.5 Consonant blends: pr", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.13.1.1. Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: mp", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.15.1.1. Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: dr", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.11.1.1. Read texts with understanding."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Texts read with understanding accordingly."]
      },
      { 
        title: "2.9.5 Consonant blends: nd", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.15.1.1. Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: tr", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.15.1.1. Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words spelt correctly."]
      },
      { 
        title: "2.9.5 Consonant blends: lk", 
        competencies: ["2.9.5.1 Sound initial and final consonants consonant blends.", "2.13.1.1. Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Initial and final consonant blends sounded out correctly.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.10.1 Sight words", 
        competencies: ["2.10.1.1 Read sight words with fluency.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Sight words)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Sight words read fluently.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.3 Digraph alternative spelling choices: Sound /ch/", 
        competencies: ["2.9.3.1 Identify alternative spelling choices of digraphs.", "2.9.3.2 Use alternative spelling choices of digraphs to blend and read words.", "2.12.1.5 Write paragraphs."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Alternative spelling choices of digraphs identified correctly.", "Alternative spelling choices of digraphs to be blended and words read correctly.", "Paragraphs written correctly and legibly."]
      },
      { 
        title: "2.9.3 Digraph alternative spelling choices: Sound /ng/", 
        competencies: ["2.9.3.1 Identify alternative spelling choices of diagraphs.", "2.9.3.2 Use alternative spelling choices of diagraphs to blend and read words.", "2.12.1.4 Write sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Alternative spelling choices of diagraphs identified correctly.", "Alternative spelling choices of diagraphs to blend and read used correctly.", "Sentences written correctly and legibly."]
      },
      { 
        title: "2.9.4 Trigraphs: /ear/", 
        competencies: ["2.9.4.1 Sound out trigraphs in words.", "2.9.4.2 Blend and read words using trigraphs.", "2.13.1.1 Write words, phrases and simple sentences independently."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Trigraghs in given words sounded out correctly.", "Words blended and read correctly using trigraphs.", "Words, phrases and simple sentences written correctly."]
      },
      { 
        title: "2.9.4 Trigraphs: /oor/", 
        competencies: ["2.9.4.1 Sound out trigraphs in words.", "2.9.4.2 Blend and read words using trigraphs.", "2.12.1.4 Write sentences."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Trigraphs in given words sounded out correctly.", "Words blended and read correctly using trigraphs.", "Sentences written correctly and legibly."]
      },
      { 
        title: "2.9.4 Trigraphs: /air/", 
        competencies: ["2.9.4.1 Sound out trigraphs in words.", "2.9.4.2 Blend and read words using trigraphs.", "2.15.1.1 Spell words correctly."],
        learningActivities: [
          "Activity 1a: Main Lesson (Phonics, Fluency, Vocabulary, Writing, Comprehension)",
          "Activity 1b: Revision Lesson"
        ],
        expectedStandard: ["Trigraphs in given words sounded correctly.", "Words blended and read correctly using trigraphs.", "Decodable and sight words written legibly."]
      },
      { 
        title: "2.17.1 Nouns", 
        competencies: ["2.17.1.1 Demonstrate knowledge of nouns.", "2.12.1.2 Write decodable and sight words."],
        learningActivities: [
          "Activity 1a: Presenting, practicing and producing nouns.",
          "Activity 1b: Demonstrating knowledge of proper and common nouns.",
          "Activity 1c: Practicing sorting and matching nouns.",
          "Activity 1d: Presenting nouns in conversation."
        ],
        expectedStandard: ["Knowledge of nouns demonstrated correctly.", "Decodable and sight words written legibly.", "Words, phrases and simple sentences written correctly."]
      }
    ]
  }
];`

let regexOral = /export const englishGrade2Oral = \\[\s*[\\s\\S]*?\\];\\s*$/m;
let regexLiteracy = /export const englishGrade2Literacy = \\[\s*[\\s\\S]*?\\];\\s*$/m;

content = content.replace(regexOral, grade2OralData);
content = content.replace(regexLiteracy, grade2LiteracyData);

fs.writeFileSync('src/data/obeEnglishZambianData.ts', content, 'utf8');
console.log("Successfully replaced Grade 2 Oral and Literacy arrays.");
