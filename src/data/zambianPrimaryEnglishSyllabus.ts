export interface SyllabusSubtopic {
  title: string;
  competencies: string[];
  learningActivities: string[];
  expectedStandard: string[];
  component: string;
}

export interface SyllabusTopic {
  title: string;
  component: string;
  subtopics: SyllabusSubtopic[];
}

export const englishGrade1Syllabus: SyllabusTopic[] = [
  // COMPONENT 1: LISTENING AND SPEAKING
  {
    title: "1.1 CONVERSATION",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.1.1 Greetings",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.1.1 Use appropriate greetings at different times of the day"],
        learningActivities: [
          "Formulating greetings at different times of the day (morning, afternoon, evening)",
          "Responding appropriately to greetings",
          "Role-playing greeting situations with peers and teachers"
        ],
        expectedStandard: ["Greetings at different times of the day formulated, responded to and used accordingly."]
      },
      {
        title: "1.1.2 Family",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.2.1 Use appropriate language to talk about members of a nuclear family"],
        learningActivities: [
          "Naming members of a nuclear family (father, mother, brother, sister)",
          "Talking about family relationships and drawing family members",
          "Using vocabulary related to family roles"
        ],
        expectedStandard: ["Appropriate language to talk about members of a nuclear family used correctly."]
      },
      {
        title: "1.1.3 Simple Commands",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.3.1 Give and follow simple commands"],
        learningActivities: [
          "Giving simple commands (stand up, sit down, open the door, come here, look at the board)",
          "Responding to verbal commands with appropriate actions",
          "Playing classroom instructional games like 'Simon says' or 'Teacher says'"
        ],
        expectedStandard: ["Simple commands given and followed accordingly."]
      },
      {
        title: "1.1.4 Classroom Rules",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.4.1 Use appropriate language to talk about classroom rules"],
        learningActivities: [
          "Discussing classroom rules (raising hand before speaking, keeping quiet, sitting properly)",
          "Demonstrating adherence to classroom rules through role-play",
          "Explaining why rules are important in school"
        ],
        expectedStandard: ["Appropriate language to talk about classroom rules used correctly."]
      },
      {
        title: "1.1.5 Home Chores and Responsibilities",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.5.1 Use appropriate language to discuss chores and responsibilities of family members"],
        learningActivities: [
          "Identifying common home chores (sweeping, washing dishes, making the bed, collecting water)",
          "Discussing responsibilities of each family member",
          "Role-playing carrying out household chores"
        ],
        expectedStandard: ["Appropriate language to discuss chores and responsibilities used correctly."]
      },
      {
        title: "1.1.6 Time",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.6.1 Use appropriate language to tell time of the day, days of the week and months of the year"],
        learningActivities: [
          "Naming parts of the day (morning, afternoon, evening, night)",
          "Reciting and ordering days of the week (Monday to Sunday)",
          "Reciting months of the year"
        ],
        expectedStandard: ["Time of the day, days of the week and months of the year named and used appropriately."]
      },
      {
        title: "1.1.7 Food and Meals",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.7.1 Use appropriate language to talk about different foods and meals of the day"],
        learningActivities: [
          "Identifying and naming common foods (nshima, rice, vegetables, fish, chicken, fruits)",
          "Mentioning meals of the day (breakfast, lunch, supper/dinner)",
          "Practicing polite expressions during meal times"
        ],
        expectedStandard: ["Language to talk about different foods and meals used appropriately."]
      },
      {
        title: "1.1.8 Occupations",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.8.1 Use appropriate language to talk about occupations in the community"],
        learningActivities: [
          "Naming different occupations in the community (teacher, nurse, doctor, farmer, driver, police officer)",
          "Discussing the roles of different community helpers",
          "Role-playing different occupations"
        ],
        expectedStandard: ["Language to talk about occupations used appropriately."]
      },
      {
        title: "1.1.9 Things Found at Home",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.9.1 Use appropriate language to talk about things found at home"],
        learningActivities: [
          "Naming common household items (chair, table, bed, pot, spoon, cup, plate)",
          "Categorising items by room (sitting room, kitchen, bedroom)",
          "Describing objects by color, shape and size"
        ],
        expectedStandard: ["Things found at home named and described appropriately."]
      },
      {
        title: "1.1.10 Things Found at School",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.10.1 Use appropriate language to talk about things found at school"],
        learningActivities: [
          "Naming items in the classroom and school compound (chalkboard, desk, book, pencil, ruler, school bag, bell)",
          "Describing functions and care of school materials",
          "Practicing asking for classroom items politely"
        ],
        expectedStandard: ["Things found at school named and described appropriately."]
      },
      {
        title: "1.1.11 Domestic Animals",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.11.1 Use appropriate language to describe domestic animals"],
        learningActivities: [
          "Naming common domestic animals (dog, cat, cow, goat, sheep, chicken, duck)",
          "Describing animal sounds, body parts and uses",
          "Talking about animal care and feeding"
        ],
        expectedStandard: ["Domestic animals named and described correctly."]
      },
      {
        title: "1.1.12 At the Market",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.12.1 Use appropriate language for buying and selling"],
        learningActivities: [
          "Role-playing buying and selling goods at the market",
          "Using expressions for asking prices and quantities (How much is this? I want two oranges)",
          "Demonstrating courtesy during transactions"
        ],
        expectedStandard: ["Language for buying and selling used appropriately."]
      },
      {
        title: "1.1.13 Community Practices",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.13.1 Use appropriate language to talk about community practices"],
        learningActivities: [
          "Discussing positive community practices (keeping the surroundings clean, helping elders, planting trees)",
          "Talking about traditional ceremonies and celebrations",
          "Demonstrating community solidarity and helpfulness"
        ],
        expectedStandard: ["Appropriate language to talk about community practices used accordingly."]
      },
      {
        title: "1.1.14 Statements",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.14.1 Use appropriate language to deny, confirm, correct and express statements and propositions"],
        learningActivities: [
          "Making positive and negative statements (Yes, it is / No, it is not; I can / I cannot)",
          "Confirming information using short answers",
          "Correcting untrue statements politely"
        ],
        expectedStandard: ["Statements confirmed, denied and corrected appropriately."]
      },
      {
        title: "1.1.15 Plurals",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.1.15.1 Use the plural forms of regular nouns"],
        learningActivities: [
          "Identifying singular and plural items using real objects and pictures (one book, three books; one dog, two dogs)",
          "Practicing oral formation of regular plurals by adding -s / -es",
          "Using plurals in simple spoken sentences"
        ],
        expectedStandard: ["Plural forms of regular nouns used correctly."]
      }
    ]
  },
  {
    title: "1.2 ETIQUETTE",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.2.1 Manners",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.2.1.1 Use appropriate language to talk about good manners and behaviour"],
        learningActivities: [
          "Demonstrating polite words and courteous behavior (please, thank you, excuse me, sorry, you are welcome)",
          "Practicing good manners in social interactions with peers and elders",
          "Role-playing situations requiring apology and gratitude"
        ],
        expectedStandard: ["Polite expressions and good manners demonstrated correctly."]
      }
    ]
  },
  {
    title: "1.3 STORIES",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.3.1 Simple Stories",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.3.1.1 Analyse simple stories orally"],
        learningActivities: [
          "Listening attentively to simple traditional stories and fables",
          "Re-telling stories in correct sequence using visual prompts",
          "Answering oral comprehension questions regarding characters, setting and events"
        ],
        expectedStandard: ["Simple stories listened to and analysed orally correctly."]
      }
    ]
  },
  {
    title: "1.4 SONGS",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.4.1 Simple Songs",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.4.1.1 Use appropriate language in simple songs"],
        learningActivities: [
          "Listening to and singing educational, nursery and cultural songs",
          "Singing with correct pronunciation, pitch, tempo and rhythm",
          "Performing action songs and clapping along"
        ],
        expectedStandard: ["Appropriate language used in singing simple songs correctly."]
      }
    ]
  },
  {
    title: "1.5 DRAMA",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.5.1 Role Playing",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.5.1.1 Use appropriate language to depict real-life situations"],
        learningActivities: [
          "Dramatising simple everyday situations (at home, clinic, market, school)",
          "Using clear speech, gestures and facial expressions",
          "Interpreting characters through spoken dialogue"
        ],
        expectedStandard: ["Language used appropriately to depict real-life situations."]
      }
    ]
  },
  {
    title: "1.6 POETRY",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.6.1 Simple Poems",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.6.1.1 Recite simple poems"],
        learningActivities: [
          "Listening to and reciting simple rhymes and short poems",
          "Reciting poems with rhythm, expression, tone and actions",
          "Discussing the moral or main idea of the poem"
        ],
        expectedStandard: ["Simple poems recited correctly with appropriate rhythm."]
      },
      {
        title: "1.6.2 Tongue Twisters",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.6.2.1 Recite tongue twisters"],
        learningActivities: [
          "Practicing simple English tongue twisters",
          "Articulating challenging consonant and vowel sound combinations",
          "Competing in clear and rapid recitation of tongue twisters"
        ],
        expectedStandard: ["Tongue twisters recited with clear articulation."]
      }
    ]
  },
  {
    title: "1.7 DESCRIPTIONS",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.7.1 Describing People and Objects",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.7.1.1 Use appropriate language in describing people and objects"],
        learningActivities: [
          "Describing people by size, height and appearance (tall, short, slim, smiling)",
          "Describing objects by color, shape, size and texture (red ball, round table, soft cloth)",
          "Constructing oral sentences describing items in the immediate environment"
        ],
        expectedStandard: ["Appropriate language in describing people and objects used correctly."]
      }
    ]
  },
  {
    title: "1.8 GAMES",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "1.8.1 Language Games",
        component: "LISTENING AND SPEAKING",
        competencies: ["1.8.1.1 Use appropriate language in playing games"],
        learningActivities: [
          "Participating in interactive language games (I spy, pass the message, word guessing, Simon says)",
          "Following rules and verbal prompts of the games",
          "Using targeted English vocabulary during play"
        ],
        expectedStandard: ["Appropriate language used in playing language games correctly."]
      }
    ]
  },

  // COMPONENT 2: READING
  {
    title: "1.9 SOUNDS",
    component: "READING",
    subtopics: [
      {
        title: "1.9.1 Short Vowels",
        component: "READING",
        competencies: ["1.9.1.1 Sound out short vowels"],
        learningActivities: [
          "Identifying and pronouncing short vowel sounds: /a/ in ant, /e/ in egg, /i/ in ink, /o/ in orange, /u/ in umbrella",
          "Associating short vowel sounds with letter graphemes",
          "Blending CVC words containing short vowels (cat, bed, pin, pot, sun)"
        ],
        expectedStandard: ["Short vowels sounded out correctly in spoken and printed words."]
      },
      {
        title: "1.9.2 Consonants",
        component: "READING",
        competencies: [
          "1.9.2.1 Sound out consonants in English",
          "1.9.2.2 Blend and read words with consonants"
        ],
        learningActivities: [
          "Sounding single consonant letters (b, c, d, f, g, h, j, k, l, m, n, p, r, s, t, v, w, y, z)",
          "Blending consonants with vowels to decode words (m-a-t = mat, d-o-g = dog)",
          "Reading decodable words, phrases and simple sentences"
        ],
        expectedStandard: [
          "Consonants sounded out correctly.",
          "Words with consonants blended and read correctly."
        ]
      },
      {
        title: "1.9.3 Long Vowels",
        component: "READING",
        competencies: [
          "1.9.3.1 Sound out long vowels",
          "1.9.3.2 Blend and read words with long vowels"
        ],
        learningActivities: [
          "Identifying long vowel sounds: /ai/, /ee/, /ie/, /oa/, /ue/",
          "Blending sounds to read words with long vowels (rain, see, pie, boat, moon)",
          "Reading decodable texts containing long vowel patterns"
        ],
        expectedStandard: [
          "Long vowels sounded out correctly.",
          "Words with long vowels blended and read accurately."
        ]
      },
      {
        title: "1.9.4 Digraphs",
        component: "READING",
        competencies: [
          "1.9.4.1 Sound out digraphs",
          "1.9.4.2 Blend and read words with digraphs"
        ],
        learningActivities: [
          "Identifying consonant digraphs: /sh/, /ch/, /th/, /ng/, /ck/",
          "Sounding digraphs in initial and final positions (ship, fish, chop, rich, thin, ring, duck)",
          "Reading sentences containing decodable digraph words"
        ],
        expectedStandard: [
          "Digraphs sounded out accurately.",
          "Words containing digraphs blended and read correctly."
        ]
      },
      {
        title: "1.9.5 Diphthongs",
        component: "READING",
        competencies: [
          "1.9.5.1 Sound out diphthongs",
          "1.9.5.2 Blend and read words with diphthongs"
        ],
        learningActivities: [
          "Identifying diphthong sounds: /oi/ in coin/toy, /ou/ in out/cow",
          "Blending and segmenting words with diphthongs",
          "Reading short decodable stories featuring diphthongs"
        ],
        expectedStandard: [
          "Diphthongs sounded out correctly.",
          "Words with diphthongs blended and read fluently."
        ]
      },
      {
        title: "1.9.6 Consonant Blends",
        component: "READING",
        competencies: ["1.9.6.1 Read words with consonant blends and clusters"],
        learningActivities: [
          "Identifying initial consonant blends (bl-, cl-, fl-, gl-, pl-, sl-, br-, cr-, dr-, fr-, gr-, pr-, tr-)",
          "Identifying final consonant blends (-st, -nd, -mp, -lk, -nt, -ft)",
          "Blending consonant blends with vowels to read words and phrases"
        ],
        expectedStandard: ["Words with consonant blends read correctly and fluently."]
      }
    ]
  },
  {
    title: "1.10 SENTENCES",
    component: "READING",
    subtopics: [
      {
        title: "1.10.1 Sight Words",
        component: "READING",
        competencies: ["1.10.1.1 Read sight words with fluency"],
        learningActivities: [
          "Recognising high-frequency sight words (the, a, is, was, he, she, to, in, at, on, they, my, we, you, have)",
          "Reading sight words automatically from flashcards and word walls",
          "Reading simple sentences incorporating sight words and decodable vocabulary"
        ],
        expectedStandard: ["High-frequency sight words read fluently with automaticity."]
      }
    ]
  },

  // COMPONENT 3: WRITING
  {
    title: "1.11 HANDWRITING (Manuscript/Print)",
    component: "WRITING",
    subtopics: [
      {
        title: "1.11.1 Sitting Posture",
        component: "WRITING",
        competencies: ["1.11.1.1 Demonstrate correct sitting posture"],
        learningActivities: [
          "Demonstrating upright writing posture with feet flat on the floor and back straight",
          "Positioning paper and desk appropriately for writing comfort",
          "Maintaining correct posture consistently during writing sessions"
        ],
        expectedStandard: ["Correct sitting posture demonstrated consistently."]
      },
      {
        title: "1.11.2 Fine Motor Skills",
        component: "WRITING",
        competencies: ["1.11.2.1 Use appropriate grip to hold pencils"],
        learningActivities: [
          "Practicing proper tripod pencil grip",
          "Engaging in finger and hand strengthening exercises (clay modelling, paper tearing, pegging)",
          "Controlling pencil pressure and movement smoothly"
        ],
        expectedStandard: ["Pencils held with appropriate tripod grip."]
      },
      {
        title: "1.11.3 Concept of Print",
        component: "WRITING",
        competencies: ["1.11.3.1 Demonstrate knowledge of basic concepts of print"],
        learningActivities: [
          "Demonstrating left-to-right and top-to-bottom directionality across the page",
          "Recognising front cover, back cover, spine, title and pages of a book",
          "Identifying word boundaries and spaces between words"
        ],
        expectedStandard: ["Basic concepts of print understood and demonstrated correctly."]
      },
      {
        title: "1.11.4 Copying Patterns",
        component: "WRITING",
        competencies: ["1.11.4.1 Draw a variety of patterns"],
        learningActivities: [
          "Tracing and drawing pre-writing patterns (vertical lines, horizontal lines, slanting lines, zigzags, curves, circles, waves)",
          "Maintaining steady line orientation and spacing across ruled lines",
          "Completing pattern borders neatly"
        ],
        expectedStandard: ["A variety of pre-writing patterns drawn smoothly and accurately."]
      },
      {
        title: "1.11.5 Letters of the Alphabet",
        component: "WRITING",
        competencies: ["1.11.5.1 Form upper-case and lower-case letters in print"],
        learningActivities: [
          "Practicing letter formation for lowercase print letters (a-z) with correct starting points and strokes",
          "Practicing letter formation for uppercase print letters (A-Z)",
          "Writing letters between four guidelines with proper sizing and alignment"
        ],
        expectedStandard: ["Uppercase and lowercase letters formed legibly and accurately."]
      },
      {
        title: "1.11.6 Own Name",
        component: "WRITING",
        competencies: ["1.11.6.1 Write own name"],
        learningActivities: [
          "Tracing and copying own first and last names",
          "Writing own name independently from memory",
          "Using initial capital letter followed by lowercase letters correctly"
        ],
        expectedStandard: ["Own name written legibly and correctly."]
      }
    ]
  },
  {
    title: "1.12 PUNCTUATION",
    component: "WRITING",
    subtopics: [
      {
        title: "1.12.1 Punctuate Sentences",
        component: "WRITING",
        competencies: ["1.12.1.1 Use correct punctuation marks in sentences"],
        learningActivities: [
          "Identifying capital letters at the beginning of a sentence",
          "Identifying full stops at the end of a sentence",
          "Rewriting simple sentences applying capital letters and full stops accurately"
        ],
        expectedStandard: ["Sentences punctuated correctly with capital letters and full stops."]
      }
    ]
  },
  {
    title: "1.13 WORD BUILDING",
    component: "WRITING",
    subtopics: [
      {
        title: "1.13.1 Decodable Words",
        component: "WRITING",
        competencies: ["1.13.1.1 Use knowledge of sounds to build words"],
        learningActivities: [
          "Building CVC words using letter cards, flashcards or movable alphabet tiles",
          "Substituting initial, medial or final sounds to form new words (e.g., cat -> bat -> bag)",
          "Writing newly built words in exercise books"
        ],
        expectedStandard: ["Decodable words built and written accurately using sound knowledge."]
      }
    ]
  },
  {
    title: "1.14 DICTATION",
    component: "WRITING",
    subtopics: [
      {
        title: "1.14.1 Decodable Texts",
        component: "WRITING",
        competencies: ["1.14.1.1 Write dictated words, phrases and sentences"],
        learningActivities: [
          "Listening carefully to teacher-dictated sounds, decodable words and sight words",
          "Writing dictated two- to three-word phrases (a red bag, the big dog)",
          "Writing simple dictated sentences with correct spelling and spacing"
        ],
        expectedStandard: ["Dictated decodable words, phrases and sentences written legibly and correctly."]
      }
    ]
  },
  {
    title: "1.15 SEQUENCING",
    component: "WRITING",
    subtopics: [
      {
        title: "1.15.1 Word Sequencing",
        component: "WRITING",
        competencies: [
          "1.15.1.1 Re-arrange words within a phrase in logical order",
          "1.15.1.2 Re-arrange words within a sentence in logical order"
        ],
        learningActivities: [
          "Rearranging jumbled words to make meaningful phrases (e.g. big / the / dog -> the big dog)",
          "Rearranging jumbled word cards into grammatical sentences (e.g. boy / reading / The / is -> The boy is reading.)",
          "Writing out the ordered phrases and sentences neatly"
        ],
        expectedStandard: ["Jumbled words within phrases and sentences rearranged in correct logical order."]
      }
    ]
  }
];

export const englishGrade2Syllabus: SyllabusTopic[] = [
  // COMPONENT 1: LISTENING AND SPEAKING
  {
    title: "2.1 CONVERSATION",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.1.1 Family",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.1.1 Use appropriate language to talk about an extended family"],
        learningActivities: [
          "Identifying members of an extended family using pictures.",
          "Talking about the composition of an extended family (aunty, uncle, cousins, grandmother, grandfather)"
        ],
        expectedStandard: ["Appropriate language to talk about an extended family used correctly."]
      },
      {
        title: "2.1.2 Time",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.2.1 Use appropriate language to describe seasons of the year"],
        learningActivities: [
          "Mentioning seasons of the year in Zambia: (Cold Season; Dry Season; Rainy Season)",
          "Describing the conditions associated to the seasons of the year (Rainy Season-it rains; Cold Season - it is cold; Dry Season - It is hot ...)"
        ],
        expectedStandard: ["Appropriate language to describe seasons of the year used correctly."]
      },
      {
        title: "2.1.3 Places in the Community",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.3.1 Use appropriate language to name different places in the community"],
        learningActivities: [
          "Naming places in the community (schools, clinics and hospitals, chiefs' palaces, police stations, markets, shops, places of worship)",
          "Stating different religious groups that use different places in the communities (church – Christians, mosque – Muslims, temple – Hindu, shrine – African Traditional Religion)"
        ],
        expectedStandard: ["Appropriate language to name different places in the community used correctly."]
      },
      {
        title: "2.1.4 Community Practices",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.4.1 Use appropriate language to talk about good practices in the community"],
        learningActivities: [
          "Mentioning good practices in the community (keep the environment clean, following rules, being kind, being honest, and being fair...)",
          "Discussing how good practices can affect the community.",
          "Demonstrating good practices in the community and school (keeping the environment clean, recycling)"
        ],
        expectedStandard: ["Appropriate language to talk about good practices in the community used correctly."]
      },
      {
        title: "2.1.5 Instructions",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.5.1 Give and follow a series of instructions"],
        learningActivities: [
          "Giving and following instructions using imperative verbs. (Give, turn, bring, move, lift, put, stop)",
          "Using games to give and follow instructions (Simon says...instructional story, follow the leader ...)"
        ],
        expectedStandard: ["Instructions given and followed accordingly."]
      },
      {
        title: "2.1.6 Occupations",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.6.1 Use appropriate language to discuss different occupations in the community"],
        learningActivities: [
          "Naming different occupations in the community (nursing, farming, driving, teaching ...)",
          "Discussing the roles played by different workers in the community (teacher teaches, nurse takes care of the sick, farmer grows crops ....)"
        ],
        expectedStandard: ["Appropriate language to discuss different occupations in the community used accordingly."]
      },
      {
        title: "2.1.7 Expressing Feelings",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.7.1 Use appropriate language to express feelings"],
        learningActivities: [
          "Discussing feelings expressed in given pictures (sadness, happiness, excitement)",
          "Expressing feelings through facial expressions, words and body language... (I was happy to receive some sweets...)",
          "Using interjections to express feelings (surprise – wow! pain –ouch!)"
        ],
        expectedStandard: ["Appropriate language to express feelings used accordingly."]
      },
      {
        title: "2.1.8 Expressing Opinions",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.8.1 Use appropriate language to express personal opinions"],
        learningActivities: [
          "Discussing pictures depicting different activities and expressing which one they like and why.",
          "Expressing personal opinions and giving reasons (I like watching T.V because there are interesting cartoons...)"
        ],
        expectedStandard: ["Appropriate language to express personal opinions used accordingly."]
      },
      {
        title: "2.1.9 Wild Animals",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.9.1 Use appropriate language to describe wild animals"],
        learningActivities: [
          "Naming wild animals in pictures (monkey, zebra, lion, rhino...)",
          "Discussing wild animals' attributes and habitats. (live in the bush, come in all shapes and sizes (big & small, hares-small elephants-big, some animals eat grass and others eat other animals, some are dangerous...)"
        ],
        expectedStandard: ["Appropriate language to describe wild animals used correctly."]
      },
      {
        title: "2.1.10 Etiquette",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.1.10.1 Use appropriate language to demonstrate manners and good behaviour"],
        learningActivities: [
          "Discussing respect, honesty and empathy based on a text (identify honest/respectful/empathetic characters from the text...)",
          "Demonstrating good behaviour (greeting, using polite language 'please', 'excuse me', 'thank you'...)"
        ],
        expectedStandard: ["Appropriate language to demonstrate manners and good behaviour used correctly."]
      }
    ]
  },
  {
    title: "2.2 STORIES",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.2.1 Simple Stories",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.2.1.1 Analyse simple stories"],
        learningActivities: [
          "Listening to simple traditional stories on different themes (animals, legends...)",
          "Re-telling simple stories (animals, legends...)",
          "Answering oral questions based on the story (predictions, main character(s), setting, plot, and important events in a story)"
        ],
        expectedStandard: ["Simple stories analysed correctly."]
      }
    ]
  },
  {
    title: "2.3 DRAMA",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.3.1 Simple Plays",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.3.1.1 Use language to engage in simple plays"],
        learningActivities: [
          "Dramatising simple plays (voice projection, stage movement, public speaking, confidence...)",
          "Answering oral questions based on the play (theme, plot, setting, characterisation...)"
        ],
        expectedStandard: ["Language to engage in simple plays used appropriately."]
      }
    ]
  },
  {
    title: "2.4 POETRY",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.4.1 Simple Poems",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.4.1.1 Recite simple poems"],
        learningActivities: [
          "Reciting poems (poems on cross cutting issues, climate change, good practices in the community, as well as poems to encourage imagination...)",
          "Discussing the lessons from the poems."
        ],
        expectedStandard: ["Poems recited correctly."]
      }
    ]
  },
  {
    title: "2.5 RIDDLES",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.5.1 Simple Riddles",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.5.1.1 Interpret simple riddles"],
        learningActivities: [
          "Reciting simple riddles (A house without a door or window... an egg)",
          "Interpreting simple riddles (What has hands but cannot clap? 'clock')",
          "Competing to solve the riddles fastest."
        ],
        expectedStandard: ["Simple riddles interpreted correctly."]
      }
    ]
  },
  {
    title: "2.6 SONGS",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.6.1 Simple Songs",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.6.1.1 Use appropriate language in singing songs"],
        learningActivities: [
          "Listening to and singing simple songs focusing on pronunciation, and rhythm (Phonics songs depending on the phoneme of the day, National Anthem, Hymns, Praise and Worship songs, I want to cross the road, the Alphabet Song, 'Twinkle, Twinkle, Little Star', 'Head, Shoulders, Knees, and Toes', If You're Happy and You Know It, Five Little Monkeys Jumping on the bed...)",
          "Answering oral questions based on the song (specific vocab, main idea, theme, plot, ...)"
        ],
        expectedStandard: ["Appropriate language in singing songs used correctly."]
      }
    ]
  },
  {
    title: "2.7 DESCRIPTIONS",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.7.1 Describing people",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.7.1.1 Use appropriate language to describe people"],
        learningActivities: [
          "Describing people using adjectives (tall, short, fat, slim...)",
          "Constructing sentences that describe people (I am clever, they are ..., we are ..., she is...)"
        ],
        expectedStandard: ["Appropriate language to describe people used correctly."]
      }
    ]
  },
  {
    title: "2.8 GAMES",
    component: "LISTENING AND SPEAKING",
    subtopics: [
      {
        title: "2.8.1 Language Games",
        component: "LISTENING AND SPEAKING",
        competencies: ["2.8.1.1 Use appropriate language in playing games"],
        learningActivities: [
          "Playing language games (Story chain, guess the sounds, I spy, what am I, Chinese whisper, odd one out...)."
        ],
        expectedStandard: ["Appropriate language in playing games used correctly."]
      }
    ]
  },

  // COMPONENT 2: READING
  {
    title: "2.9 SOUNDS",
    component: "READING",
    subtopics: [
      {
        title: "2.9.1 Consonant Alternative Spelling Choices",
        component: "READING",
        competencies: [
          "2.9.1.1 Identify sounds and graphemes used as alternative spelling choices of consonants",
          "2.9.1.2 Blend and read words with alternative spelling choices of consonants"
        ],
        learningActivities: [
          "Identifying the alternative consonant spelling choices: s - ss, se, c, ce; d - dd; t - tt; g - gg; p - pp; l - ll; n - nn, kn; f - ff, ph; c, k - ck, ch; b - bb; r - rr, wr; j - g, ge; m - mm, mb; z - zz, ze, s, se; w - wh; v - ve",
          "Blending words with alternative spelling choices (wh-e-n=when, e-gg=egg, b-u-zz=buzz, kn-o-ck=knock...)",
          "Reading words with alternative spelling choices (miss, back, photo...)",
          "Reading phrases and sentences that contain words with alternative spelling choices (She took a photo.)"
        ],
        expectedStandard: [
          "Sounds and graphemes used as alternative spelling choices of consonants identified correctly.",
          "Words with alternative spelling choices of consonants blended and read correctly."
        ]
      },
      {
        title: "2.9.2 Vowel Alternative Spelling Choices",
        component: "READING",
        competencies: [
          "2.9.2.1 Identify sounds and graphemes used as alternative spelling choices of vowels",
          "2.9.2.2 Blend and read words with alternative spelling choices of vowels"
        ],
        learningActivities: [
          "Identifying the alternative vowel spelling choices: /e/ - ea (bread); /oa/ - o, o-e, ow, oe; /ai/ - a, a-e, ay; /ue/ - u, u-e, ew; /ee/ - e, ea, ey, y; /or/ - a, au, aw, oor; /ie/ - i, i-e, igh, y; /ou/ - ow; /oi/ - oy; /er/ - ir, ur",
          "Blending words with alternative vowel spelling choices (b-oy=boy, l-igh-t=light, sh-ir-t=shirt, m-y=my...)",
          "Segmenting words with alternative vowel spelling choices. (toy=t/oy, cow=c/ow, write=wr/i/t/e...)",
          "Reading phrases and sentences that contain words with alternative vowel spelling choices (blue shirt, The bird is flying...)"
        ],
        expectedStandard: [
          "Sounds and graphemes used as alternative spelling choices of vowels identified accordingly.",
          "Words with alternative spelling choices of vowels blended and read correctly."
        ]
      },
      {
        title: "2.9.3 Digraph Alternative Spelling Choices",
        component: "READING",
        competencies: [
          "2.9.3.1 Identify alternative spelling choices of digraphs",
          "2.9.3.2 Use alternative spelling choices of digraphs to blend and read words"
        ],
        learningActivities: [
          "Identifying the alternative digraph spelling choices: ch – tch (match); ng – n (ink)",
          "Blending words with alternative digraph spelling choices (match, ink...)",
          "Reading phrases and sentences that contain words with alternative digraph spelling choices (pink bag, hatching eggs, I like to catch fish...)"
        ],
        expectedStandard: [
          "Alternative spelling choices of digraphs identified correctly.",
          "Alternative spelling choices of digraphs to blend and read words used correctly."
        ]
      },
      {
        title: "2.9.4 Trigraphs",
        component: "READING",
        competencies: [
          "2.9.4.1 Sound out trigraphs in words",
          "2.9.4.2 Blend and read words using trigraphs"
        ],
        learningActivities: [
          "Identifying trigraphs /ear/ ear, hear, tear; /air/ air, hair, chair; /oor/ poor",
          "Sounding trigraphs (/ear/ ear, hear, tear ...)",
          "Blending words with trigraphs (rear, fair...)",
          "Reading phrases and sentences that contain words trigraphs (poor boy, She sat on the chair...)"
        ],
        expectedStandard: [
          "Trigraphs in given words sounded out correctly.",
          "Words blended and read correctly using trigraphs."
        ]
      },
      {
        title: "2.9.5 Consonant Blends",
        component: "READING",
        competencies: ["2.9.5.1 Sound initial and final consonant blends"],
        learningActivities: [
          "Identifying initial consonant blends (pl-, sl-, br-, cr-, dr-, fr-, pr-, tr-, sc, sm-, tw-...) and final consonant blends (-lb, -ld, -lf,-lk, -lm, -ln, -lp, -lt, -ft, -nt, -pt, -xt...)",
          "Reading words with consonant blends (slap, broom, cry...) (palm, ant, next, milk...)"
        ],
        expectedStandard: ["Initial and final consonant blends sounded correctly."]
      }
    ]
  },
  {
    title: "2.10 SENTENCES",
    component: "READING",
    subtopics: [
      {
        title: "2.10.1 Sight Words",
        component: "READING",
        competencies: ["2.10.1.1 Read sight words with fluency"],
        learningActivities: [
          "Recognising high frequency sight words (you, your, come, some, said, here, there, they, go, no, so, my, one, by, only, old, like, have, live, give, little, down...)",
          "Reading high frequency sight words",
          "Reading high frequency sight words in sentences: Subject + verb (SV); Subject + verb + object (SVO)"
        ],
        expectedStandard: ["Sight words read fluently."]
      }
    ]
  },
  {
    title: "2.11 COMPREHENSION",
    component: "READING",
    subtopics: [
      {
        title: "2.11.1 Intensive Reading",
        component: "READING",
        competencies: ["2.11.1.1 Read texts with understanding"],
        learningActivities: [
          "Discussing new vocabulary from texts.",
          "Reading simple texts (folk tales, fables, traditional stories, fairytales...)",
          "Re-telling simple texts (sequencing events in a story)",
          "Answering questions based on the text (main character(s), setting, and important events in a story)",
          "Answering comprehension questions (4W+H questions)"
        ],
        expectedStandard: ["Texts read with understanding accordingly."]
      },
      {
        title: "2.11.2 Extensive Reading",
        component: "READING",
        competencies: ["2.11.2.1 Read a variety of texts for pleasure"],
        learningActivities: [
          "Reading a variety of texts (texts of choice)",
          "Reviewing a variety of texts. (re-telling, summarising, identify themes/central ideas of a story)"
        ],
        expectedStandard: ["A variety of texts read for pleasure accordingly."]
      }
    ]
  },

  // COMPONENT 3: WRITING
  {
    title: "2.12 HANDWRITING (Tailed Writing)",
    component: "WRITING",
    subtopics: [
      {
        title: "2.12.1 Copying",
        component: "WRITING",
        competencies: [
          "2.12.1.1 Write lower and upper-case letters using tailed handwriting",
          "2.12.1.2 Write decodable and sight words",
          "2.12.1.3 Write phrases",
          "2.12.1.4 Write sentences",
          "2.12.1.5 Write paragraphs"
        ],
        learningActivities: [
          "Practising letter formation of lowercase letters - ascenders (d, l, f, h, t, k), descenders (j, p, q, y) and square letters (a, c, e, i, m, n, o, r, s, u, v, w, x)",
          "Practising letter formation of uppercase letters - ascenders (A - Z)",
          "Writing decodable and sight words containing ascenders, descenders and square letters (bag, bridge, fly...)",
          "Copying phrases (three blue bags, fat cat ...)",
          "Drawing pictures depicting the phrases that have been copied (happy dog, big fish...)",
          "Copying sentences while paying attention to capital letters, comma, spacing, full stop and question mark (She carried a spoon.; What is your name?; Mary bought a pencil, rubber and a book...)",
          "Drawing pictures depicting the sentences that have been copied (A lion is sleeping – picture of a sleeping lion, A big tree - picture of a big tree...)",
          "Copying paragraphs with three to four sentences (The sun is shining brightly in the sky. Birds are happily singing up the trees. It is a beautiful day. ...)"
        ],
        expectedStandard: [
          "Lower and upper-case letters written in tailed handwriting legibly.",
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
    component: "WRITING",
    subtopics: [
      {
        title: "2.13.1 Words, Phrases and Sentences",
        component: "WRITING",
        competencies: ["2.13.1.1 Write words, phrases and simple sentences independently"],
        learningActivities: [
          "Writing words independently (using a picture, or real objects ...)",
          "Filling in crossword puzzles (cross and down words)",
          "Writing words based on learnt sounds independently.",
          "Writing phrases based on pictures and real objects independently (picture of 'big ball', picture of 'red dress'....)",
          "Writing sentences based on pictures such as conversation posters and picture strips independently (The cat is black. I see a bus....)"
        ],
        expectedStandard: ["Words, phrases and simple sentences written correctly."]
      }
    ]
  },
  {
    title: "2.14 ALPHABETICAL ORDER AND SEQUENCING",
    component: "WRITING",
    subtopics: [
      {
        title: "2.14.1 Alphabetical Order",
        component: "WRITING",
        competencies: ["2.14.1.1 Sequence words according to alphabetical order"],
        learningActivities: [
          "Arranging given words in the alphabetical order (sky, hippo, pear, beans, Zebra =beans, hippo, pear, sky, Zebra...)"
        ],
        expectedStandard: ["Words arranged according to alphabetical order correctly."]
      },
      {
        title: "2.14.2 Logical Order",
        component: "WRITING",
        competencies: ["2.14.2.1 Sequence words and sentences logically"],
        learningActivities: [
          "Rearranging pictures into a logical order (Picture strips jumbled up).",
          "Rearranging words in a sentence in a logical order (boy the eating is = The boy is eating.)",
          "Rearranging sentences logically (He sells it at the market. Mr. Banda is a fisherman. He catches fish.) = (Mr. Banda is a fisherman. He catches fish. He sells it at the market.)"
        ],
        expectedStandard: ["Words and sentences sequenced logically."]
      }
    ]
  },
  {
    title: "2.15 SPELLING",
    component: "WRITING",
    subtopics: [
      {
        title: "2.15.1 Word Spelling",
        component: "WRITING",
        competencies: ["2.15.1.1 Spell words correctly"],
        learningActivities: [
          "Completing given words by writing missing graphemes (letters) (b—d, b i r d; tr—n = train)",
          "Playing spelling games (Word sorting - sort words according to spelling patterns or phonetic features eg. sorting words with long vowel sounds vs short vowel sounds; Word building–learners use cards to build words that follow a specific spelling pattern...).",
          "Searching for words (Learners search for words that follow a certain spelling rule in a text or other visual aids ...)",
          "Creating a spelling journal – (learners to create a journal where they write words, sentences or short paragraphs)."
        ],
        expectedStandard: ["Words spelt correctly."]
      },
      {
        title: "2.15.2 Dictation",
        component: "WRITING",
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
    component: "WRITING",
    subtopics: [
      {
        title: "2.16.1 Synonyms",
        component: "WRITING",
        competencies: ["2.16.1.1 Demonstrate knowledge of synonyms"],
        learningActivities: [
          "Matching words of similar meanings (sad & unhappy, close & shut)",
          "Mapping given words with synonyms (large – big, enormous, gigantic, huge ...).",
          "Sorting words into categories of synonyms (Tasty, hungry, delicious, starving, yummy...)"
        ],
        expectedStandard: ["Knowledge of synonyms demonstrated correctly."]
      },
      {
        title: "2.16.2 Antonyms",
        component: "WRITING",
        competencies: ["2.16.2.1 Demonstrate knowledge of antonyms"],
        learningActivities: [
          "Matching words of opposite meanings (far and near, bad and good, easy and difficult, above and below, cold and hot, follow and lead, hard and soft...)",
          "Mapping given words with their antonyms (large – small, little, thin...).",
          "Drawing pictures to depict antonyms (big ball and a small dish to represent big and small ...)"
        ],
        expectedStandard: ["Knowledge of antonyms demonstrated correctly."]
      }
    ]
  },
  {
    title: "2.17 PARTS OF SPEECH",
    component: "WRITING",
    subtopics: [
      {
        title: "2.17.1 Nouns",
        component: "WRITING",
        competencies: ["2.17.1.1 Demonstrate knowledge of nouns"],
        learningActivities: [
          "Circling proper nouns from a list of words (John, Lusaka, boy, school, book ...)",
          "Writing nouns found in the classroom (books, duster, ruler...)",
          "Creating a list of nouns found in a picture.",
          "Drawing pictures next to appropriate nouns to depict the meaning.",
          "Writing sentences using different nouns and underlining them.",
          "Adding 's' to a noun to make it plural (dog + s = dogs, bag+ s = bags ...)"
        ],
        expectedStandard: ["Knowledge of nouns demonstrated correctly."]
      },
      {
        title: "2.17.2 Verbs",
        component: "WRITING",
        competencies: ["2.17.2.1 Demonstrate knowledge of verbs"],
        learningActivities: [
          "Identifying verbs depicted in pictures (a bird flying, a cat jumping, a rabbit hopping...)",
          "Role modeling different actions (dancing, singing, eating, clapping, reading...)",
          "Writing sentences with action words represented in a picture (John is sweeping the floor...)"
        ],
        expectedStandard: ["Knowledge of verbs demonstrated correctly."]
      },
      {
        title: "2.17.3 Prepositions",
        component: "WRITING",
        competencies: ["2.17.3.1 Demonstrate knowledge of prepositions"],
        learningActivities: [
          "Identifying prepositions (position of things) (in, on, under, at, next to, behind, in front of...)",
          "Underlining prepositions in given sentences (The teacher is behind the desk. The book is in the box...)",
          "Completing sentences using prepositions according to given pictures (The ball is under the table. The book is on the table...)"
        ],
        expectedStandard: ["Knowledge of prepositions demonstrated correctly."]
      },
      {
        title: "2.17.4 Conjunctions",
        component: "WRITING",
        competencies: ["2.17.4.1 Demonstrate knowledge of conjunctions"],
        learningActivities: [
          "Identifying conjunctions in given sentences (but, and)",
          "Underlining conjunctions in given sentences (I went to the market but there were no chickens. My teacher was reading a story, and I was listening...)",
          "Writing two simple sentences and join them using 'but' or 'and' (I like to play football but my brother likes to play basketball. I will peel my bananas and eat them...)"
        ],
        expectedStandard: ["Knowledge of conjunctions demonstrated correctly."]
      },
      {
        title: "2.17.5 Possessive Words",
        component: "WRITING",
        competencies: ["2.17.5.1 Demonstrate knowledge of possessive words"],
        learningActivities: [
          "Identifying possessive words in given sentences (my, mine, yours) (My name is Blessing. The bottle is mine. The dog ate your lunch. The pencil I am using is yours...)",
          "Choosing correct possessive words to fill in the blank spaces in given sentences My, mine, your, yours (My name is John. This is my book, it is mine. This is your bag, it is yours....)"
        ],
        expectedStandard: ["Knowledge of possessive words demonstrated correctly."]
      }
    ]
  },
  {
    title: "2.18 PUNCTUATION",
    component: "WRITING",
    subtopics: [
      {
        title: "2.18.1 Punctuate sentences",
        component: "WRITING",
        competencies: ["2.18.1.1 Use commas and question marks in sentences."],
        learningActivities: [
          "Punctuating a list of items with a comma (banana, apple, mango ....)",
          "Adding question marks to interrogative statements (What is your name? Where do you live?...)",
          "Using punctuation marks in given sentences (capital letter, full stop, spacing, question mark, comma)"
        ],
        expectedStandard: ["Commas and question marks used in sentences correctly."]
      }
    ]
  }
];
