const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

const litRegex = /\{\s*title:\s*"2\.11 COMPREHENSION"[\s\S]*?\}\s*\]\s*\}\s*\];/m;

const litTerm3Replacement = `{
    title: "2.11 COMPREHENSION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.11.1 Intensive Reading", 
        competencies: ["2.11.1.1 Read texts with understanding"],
        learningActivities: [
          "Discussing new vocabulary from texts",
          "Reading simple texts (folk tales, fables, traditional stories, fairytales...)",
          "Retelling simple texts (sequencing events in a story)",
          "Answering questions based on the text (main character(s), setting and important events in a story)",
          "Answering comprehension questions (5 W+H questions)"
        ],
        expectedStandard: ["Texts read with understanding accordingly."]
      },
      { 
        title: "2.11.2 Extensive Reading", 
        competencies: ["2.11.2.1 Read a variety of texts for pleasure"],
        learningActivities: [
          "Reading a variety of texts (texts of choice)",
          "Reviewing a variety of texts (re-telling, summarising, identify themes, central ideas of a story)"
        ],
        expectedStandard: ["A variety of texts read for pleasure accordingly."]
      }
    ]
  },
  {
    title: "2.12 HANDWRITING (Tailed Writing)",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.12.1 Copying", 
        competencies: [
          "2.12.1.1 Write lower and upper case letters using tailed handwriting",
          "2.12.1.2 Write decodable and sight words",
          "2.12.1.3 Write phrases",
          "2.12.1.4 Write sentences",
          "2.12.1.5 Write paragraphs"
        ],
        learningActivities: [
          "Practising letter formation of lower case letters ascenders (b, d, l, f, h, t, k), descenders (g, j, p, q, y) and square letters (a, c, e, i, m, n, o, r, s, u, v, w, x)",
          "Practising letter formation of upper case letters ascenders (A - Z)",
          "Writing decodable and sight words containing ascenders, descenders and square letters (bag, bridge, fly...)",
          "Copying phrases (three blue bags, fat cat...). Drawing pictures depicting the phrases that have been copied",
          "Copying sentences while paying attention to capital letters, comma, spacing, full stop and question mark. Drawing pictures depicting the sentences that have been copied",
          "Copying paragraphs with three to four sentences"
        ],
        expectedStandard: [
          "Lower and upper case letters written in tailed handwriting legibly.",
          "Decodable and sight words written legibly.",
          "Phrases written legibly.",
          "Sentences written correctly and legibly.",
          "Paragraphs written correctly and legibly."
        ]
      }
    ]
  },
  {
    title: "2.13 SENTENCE CONSTRUCTION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.13.1 Words, Phrases and Sentences", 
        competencies: ["2.13.1.1 Write words, phrases and simple sentences independently"],
        learningActivities: [
          "Writing words independently (using a picture or real objects...)",
          "Filling in crossword puzzles (cross and down words)",
          "Writing words based on learnt sounds independently",
          "Writing phrases based on pictures and real objects independently",
          "Writing sentences based on pictures such as conversation posters and picture strips independently"
        ],
        expectedStandard: ["Words, phrases and simple sentences written correctly."]
      }
    ]
  },
  {
    title: "2.14 ALPHABETICAL ORDER AND SEQUENCING",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.14.1 Alphabetical Order", 
        competencies: ["2.14.1.1 Sequence words according to alphabetical order"],
        learningActivities: [
          "Arranging given words in the alphabetical order (sky, hippo, pear, beans, Zebra...)"
        ],
        expectedStandard: ["Words arranged according to alphabetical order correctly."]
      },
      { 
        title: "2.14.2 Logical Order", 
        competencies: ["2.14.2.1 Sequence words and sentences logically"],
        learningActivities: [
          "Rearranging pictures into a logical order",
          "Rearranging words in a sentence in a logical order",
          "Rearranging sentences logically"
        ],
        expectedStandard: ["Words and sentences sequenced logically."]
      }
    ]
  },
  {
    title: "2.15 SPELLING",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.15.1 Word Spelling", 
        competencies: ["2.15.1.1 Spell words correctly"],
        learningActivities: [
          "Completing given words by writing missing graphemes",
          "Playing spelling games: Word sorting, Word building",
          "Searching for words",
          "Creating a spelling journal"
        ],
        expectedStandard: ["Words spelt correctly."]
      },
      { 
        title: "2.15.2 Dictation", 
        competencies: ["2.15.2.1 Write dictated words, phrases and sentences"],
        learningActivities: [
          "Writing dictated words (church, sneeze...)",
          "Writing dictated phrases (red flowers, tall man...)",
          "Writing dictated sentences (The girl is sitting on the floor...)"
        ],
        expectedStandard: ["Dictated words, phrases and sentences written correctly."]
      }
    ]
  },
  {
    title: "2.16 WORD RELATIONSHIPS",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.16.1 Synonyms", 
        competencies: ["2.16.1.1 Demonstrate knowledge of synonyms"],
        learningActivities: [
          "Matching words of similar meanings (sad & unhappy, close & shut)",
          "Mapping given words with synonyms (large - big, enormous, gigantic, huge...)",
          "Sorting words into categories of synonyms"
        ],
        expectedStandard: ["Knowledge of synonyms demonstrated correctly."]
      },
      { 
        title: "2.16.2 Antonyms", 
        competencies: ["2.16.2.1 Demonstrate knowledge of antonyms"],
        learningActivities: [
          "Matching words of opposite meanings (far and near, bad and good...)",
          "Mapping given words with their antonyms",
          "Drawing pictures to depict antonyms"
        ],
        expectedStandard: ["Knowledge of antonyms demonstrated correctly."]
      }
    ]
  },
  {
    title: "2.17 PARTS OF SPEECH",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.17.1 Nouns", 
        competencies: ["2.17.1.1 Demonstrate knowledge of nouns"],
        learningActivities: [
          "Circling proper nouns from a list of words",
          "Writing nouns found in the classroom",
          "Creating a list of nouns found in a picture",
          "Drawing pictures next to appropriate nouns",
          "Writing sentences using different nouns",
          "Adding 's' to a noun to make it plural"
        ],
        expectedStandard: ["Knowledge of nouns demonstrated correctly."]
      },
      { 
        title: "2.17.2 Verbs", 
        competencies: ["2.17.2.1 Demonstrate knowledge of verbs"],
        learningActivities: [
          "Identifying verbs depicted in pictures",
          "Role modeling different actions",
          "Writing sentences with action words represented in a picture"
        ],
        expectedStandard: ["Knowledge of verbs demonstrated correctly."]
      },
      { 
        title: "2.17.3 Prepositions", 
        competencies: ["2.17.3.1 Demonstrate knowledge of prepositions"],
        learningActivities: [
          "Identifying prepositions (in, on, under, at, next to...)",
          "Underlining prepositions in given sentences",
          "Completing sentences using prepositions"
        ],
        expectedStandard: ["Knowledge of prepositions demonstrated correctly."]
      },
      { 
        title: "2.17.4 Conjunctions", 
        competencies: ["2.17.4.1 Demonstrate knowledge of conjunctions"],
        learningActivities: [
          "Identifying conjunctions in given sentences",
          "Underlining conjunctions in given sentences",
          "Writing two simple sentences and join them using 'but' or 'and'"
        ],
        expectedStandard: ["Knowledge of conjunctions demonstrated correctly."]
      },
      { 
        title: "2.17.5 Possessive Words", 
        competencies: ["2.17.5.1 Demonstrate knowledge of possessive words"],
        learningActivities: [
          "Identifying possessive words in given sentences",
          "Choosing correct possessive words to fill in the blank spaces"
        ],
        expectedStandard: ["Knowledge of possessive words demonstrated correctly."]
      }
    ]
  },
  {
    title: "2.18 PUNCTUATION",
    term: "Term 3",
    subtopics: [
      { 
        title: "2.18.1 Punctuate sentences", 
        competencies: ["2.18.1.1 Use commas and question marks in sentences"],
        learningActivities: [
          "Punctuating a list of items with a comma",
          "Adding question marks to interrogative statements",
          "Using punctuation marks in given sentences"
        ],
        expectedStandard: ["Commas and question marks used in sentences correctly."]
      }
    ]
  }
];`;

content = content.replace(litRegex, litTerm3Replacement);
fs.writeFileSync('src/data/obeEnglishZambianData.ts', content);
console.log("Patched Grade 2 Literacy Term 3 fully!");
