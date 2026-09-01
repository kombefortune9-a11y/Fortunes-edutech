const fs = require('fs');
let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

const oralRegex = /\{\s*title:\s*"2\.1 CONVERSATION",\s*term:\s*"Term 3",\s*subtopics:\s*\[[\s\S]*?\];/;

const oralTerm3Replacement = `{
    title: "2.1 CONVERSATION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.1.3 Places in the Community (page 29)", 
        competencies: ["2.1.3.1 Use appropriate language to name different places in the community"],
        learningActivities: [
          "Naming places in the community (schools, clinics and hospitals, chiefs' palaces, police stations, markets, shops, places of worship)",
          "Stating different religious groups that use different places in the communities (church - Christians, mosque - Muslims, temple - Hindu, shrine - African Traditional Religion)"
        ],
        expectedStandard: ["Appropriate language to name different places in the community used correctly."]
      },
      { 
        title: "2.1.5 Instructions (page 30)", 
        competencies: ["2.1.5.1 Give and follow a series of instructions"],
        learningActivities: [
          "Giving and following instructions using imperative verbs. (Give, turn, bring, move, lift, put, stop)",
          "Using games to give and follow instructions (Simon says...instructional story, follow the leader...)"
        ],
        expectedStandard: ["Instructions given and followed accordingly."]
      },
      { 
        title: "2.1.7 Expressing Feelings (page 30)", 
        competencies: ["2.1.7.1 Use appropriate language to express feelings"],
        learningActivities: [
          "Discussing feelings expressed in given pictures (sadness, happiness, excitement)",
          "Expressing feelings through facial expressions, words and body language... (I was happy to receive some sweets...)",
          "Using interjections to express feelings (surprise - wow! pain -ouch!)"
        ],
        expectedStandard: ["Appropriate language to express feelings used accordingly."]
      },
      { 
        title: "2.1.9 Wild Animals (page 31)", 
        competencies: ["2.1.9.1 Use appropriate language to describe wild animals"],
        learningActivities: [
          "Naming wild animals in pictures (monkey, zebra, lion, rhino...)",
          "Discussing wild animals' attributes and habitats. (live in the bush, come in all shapes and sizes (big & small, hares-small elephants-big, some animals eat grass and others eat other animals, some are dangerous...)"
        ],
        expectedStandard: ["Appropriate language to describe wild animals used correctly."]
      }
    ]
  }
];`;

content = content.replace(oralRegex, oralTerm3Replacement);

const litRegex = /\{\s*title:\s*"2\.11 COMPREHENSION",\s*term:\s*"Term 3",\s*subtopics:\s*\[[\s\S]*?\];/;

const litTerm3Replacement = `{
    title: "2.11 COMPREHENSION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.11.1 Intensive Reading (page 37)", 
        competencies: ["2.11.1.1 Read and answer questions", "2.11.1.2 Re-tell a story in a sequential order"],
        learningActivities: [
          "Reading aloud texts",
          "Answering 5 Ws questions in full sentences from text read",
          "Answering questions based on text read",
          "Retelling a story sequentially"
        ],
        expectedStandard: ["Simple text read and 5 Ws questions answered correctly", "Story retold in sequential order"]
      },
      { 
        title: "2.11.2 Extensive Reading (page 37)", 
        competencies: ["2.11.2.1 Read for pleasure and information"],
        learningActivities: [
          "Reading books and supplementary readers from the class library",
          "Discussing materials read (setting, characters, plot...)"
        ],
        expectedStandard: ["Books read for pleasure and information and discussed accordingly."]
      }
    ]
  },
  {
    title: "2.12 HANDWRITING",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.12.1 Copying (page 38)", 
        competencies: ["2.12.1.1 Copy short texts legibly and neatly"],
        learningActivities: [
          "Copying sentences legibly",
          "Forming joined letters correctly (tailed letters)"
        ],
        expectedStandard: ["Short texts copied legibly and neatly."]
      }
    ]
  },
  {
    title: "2.13 SENTENCE CONSTRUCTION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.13.1 Words, Phrases and Sentences (page 39)", 
        competencies: ["2.13.1.1 Re-write scrambled sentences", "2.13.1.2 Complete given sentences", "2.13.1.3 Construct sentences using pictures and given words"],
        learningActivities: [
          "Writing scrambled words to form correct sentences",
          "Choosing words to complete sentences",
          "Constructing sentences using substitution tables",
          "Writing sentences based on pictures"
        ],
        expectedStandard: ["Sentences constructed correctly."]
      }
    ]
  },
  {
    title: "2.14 ALPHABETICAL ORDER AND SEQUENCING",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.14.1 Alphabetical Order (page 40)", 
        competencies: ["2.14.1.1 Write letters in alphabetical order"],
        learningActivities: [
          "Saying and singing the alphabet",
          "Arranging 3-5 letters/words in alphabetical order using the first letter only"
        ],
        expectedStandard: ["Letters and words arranged in alphabetical order accurately."]
      },
      { 
        title: "2.14.2 Logical Order (page 40)", 
        competencies: ["2.14.2.1 Arrange sentences in a logical order"],
        learningActivities: [
          "Arranging 3-5 sentences in logical order to form a story"
        ],
        expectedStandard: ["Sentences arranged in logical order to make a story."]
      }
    ]
  },
  {
    title: "2.15 SPELLING",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.15.1 Word Spelling (page 40)", 
        competencies: ["2.15.1.1 Spell words correctly"],
        learningActivities: [
          "Spelling words correctly by adding/dropping letters",
          "Using words in sentences"
        ],
        expectedStandard: ["Words spelt correctly in sentences."]
      },
      { 
        title: "2.15.2 Dictation (page 41)", 
        competencies: ["2.15.2.1 Write dictated words and sentences accurately"],
        learningActivities: [
          "Listening and writing dictated words and sentences"
        ],
        expectedStandard: ["Dictated words and sentences written correctly."]
      }
    ]
  },
  {
    title: "2.16 WORD RELATIONSHIPS",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.16.1 Synonyms (page 42)", 
        competencies: ["2.16.1.1 Identify and use synonyms"],
        learningActivities: [
          "Identifying synonyms (big/large, small/tiny)",
          "Matching words with similar meanings"
        ],
        expectedStandard: ["Synonyms identified and used correctly."]
      },
      { 
        title: "2.16.2 Antonyms (page 42)", 
        competencies: ["2.16.2.1 Identify and use antonyms"],
        learningActivities: [
          "Identifying antonyms (big/small, tall/short)",
          "Matching words with opposite meanings"
        ],
        expectedStandard: ["Antonyms identified and used correctly."]
      }
    ]
  },
  {
    title: "2.17 PARTS OF SPEECH",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.17.2 Verbs (page 43)", 
        competencies: ["2.17.2.1 Identify and use verbs"],
        learningActivities: [
          "Identifying verbs in sentences",
          "Using verbs to complete sentences",
          "Using tenses correctly (present and past continuous tenses)"
        ],
        expectedStandard: ["Verbs identified and used correctly in sentences."]
      },
      { 
        title: "2.17.3 Prepositions (page 43)", 
        competencies: ["2.17.3.1 Identify and use prepositions"],
        learningActivities: [
          "Identifying prepositions (in, on, under, near)",
          "Using prepositions in sentences"
        ],
        expectedStandard: ["Prepositions identified and used appropriately."]
      },
      { 
        title: "2.17.4 Conjunctions (page 44)", 
        competencies: ["2.17.4.1 Identify and use conjunctions"],
        learningActivities: [
          "Identifying conjunctions (and, but)",
          "Using conjunctions to join words and simple sentences"
        ],
        expectedStandard: ["Conjunctions identified and used correctly."]
      },
      { 
        title: "2.17.5 Possessive Words (page 44)", 
        competencies: ["2.17.5.1 Identify and use possessive words"],
        learningActivities: [
          "Identifying possessive words (my, his, her, our, their)",
          "Using possessive words in sentences"
        ],
        expectedStandard: ["Possessive words identified and used correctly."]
      }
    ]
  },
  {
    title: "2.18 PUNCTUATION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.18.1 Punctuate sentences (page 45)", 
        competencies: ["2.18.1.1 Punctuate sentences correctly"],
        learningActivities: [
          "Using capital letters, full stops and question marks at appropriate places in sentences"
        ],
        expectedStandard: ["Sentences punctuated correctly."]
      }
    ]
  }
];`;

content = content.replace(litRegex, litTerm3Replacement);
fs.writeFileSync('src/data/obeEnglishZambianData.ts', content);
console.log("Patched Term 3 with real PDF data!");
