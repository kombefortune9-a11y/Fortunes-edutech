const fs = require('fs');

let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

const replacement = `export const englishGrade1Oral = [
  {
    title: "1.1 CONVERSATIONS",
    term: "Term 1",
    subtopics: [
      { 
        title: "1.1.1 Greetings (page 10)", 
        competencies: ["1.1.1.1 Use appropriate greetings at different times of the day."],
        learningActivities: [
          "Activity 1a: Good Morning Greeting",
          "Activity 1b: Good Afternoon Greeting",
          "Activity 1c: Good Evening Greeting"
        ],
        expectedStandard: ["Appropriate greetings at different times of the day used correctly."]
      },
      { 
        title: "1.1.1 Greetings (continued) (page 14)", 
        competencies: ["1.1.1.1 Use appropriate greetings at different times of the day."],
        learningActivities: [
          "Activity 2a: How are you? I’m fine/not fine. Good/I’m sorry",
          "Activity 2b: How is home? Home is fine/not fine. Good/I’m sorry",
          "Activity 2c: Consolidation of Greetings content."
        ],
        expectedStandard: ["Appropriate greetings at different times of the day used correctly."]
      },
      { 
        title: "1.1.4 Classroom Rules (page 19)", 
        competencies: ["1.1.4.1 Use language to talk about classroom rules."],
        learningActivities: [
          "Activity 1a: How do rules help us?",
          "Activity 1b: Talking about classroom rules",
          "Activity 1c: Asking permission"
        ],
        expectedStandard: ["Appropriate language to talk about classroom rules used correctly."]
      },
      { 
        title: "1.1.2 Family (page 23)", 
        competencies: ["1.1.2.1 Use appropriate language to talk about members of a nuclear family."],
        learningActivities: [
          "Activity 1a: Mentioning members of a nuclear family (father, mother, child/children)",
          "Activity 1b: Talk about relationships that exist within the nuclear family (parent/s, brother, sister)",
          "Activity 1c: Consolidation of nuclear family content."
        ],
        expectedStandard: ["Language to talk about members of a nuclear family used appropriately."]
      },
      { 
        title: "1.1.3 Simple commands (page 27)", 
        competencies: ["1.1.3.1 Giving and responding to commands."],
        learningActivities: [
          "Activity 1a: responding to simple commands",
          "Activity 1b: Roleplaying in groups giving and responding to simple commands",
          "Activity 1c: Playing games on giving and responding to commands"
        ],
        expectedStandard: ["Simple commands given and followed accordingly."]
      },
      { 
        title: "1.1.5 Home Chores and Responsibilities (page 31)", 
        competencies: ["1.1.5.1 Use language to discuss chores and responsibilities of family members."],
        learningActivities: [
          "Activity 1a: Name the chores of family members",
          "Activity 1b: Naming the responsibilities of family members",
          "Activity 1c: Name and discuss the chores and responsibilities of family members"
        ],
        expectedStandard: ["Appropriate language to discuss chores and responsibilities of family members used accordingly."]
      },
      { 
        title: "1.1.6 Time (page 35)", 
        competencies: ["1.1.6.1 Use appropriate language to tell time of the day, days of the week and months of the year."],
        learningActivities: [
          "Activity 1a: Tell time of the day (morning, afternoon and night)",
          "Activity 1b: Mention and sequence days of the week",
          "Activity 1c: Mention and sequence months of the year"
        ],
        expectedStandard: ["Appropriate language to tell the times of the day, days of the week and months of the year used correctly."]
      },
      { 
        title: "1.1.7 Food and meals (page 40)", 
        competencies: ["1.1.7.1 Use language to talk about different foods and meals of the day."],
        learningActivities: [
          "Activity 1a: Identifying different types of foods (fruits, vegetables, grains)",
          "Activity 1b: Mentioning types of meals (breakfast, lunch and supper/dinner)",
          "Activity 1c: Reciting a prayer before meals"
        ],
        expectedStandard: ["Language to talk about different food and meals used appropriately."]
      }
    ]
  },
  {
    title: "1.1 CONVERSATIONS",
    term: "Term 2",
    subtopics: [
      { 
        title: "1.1.7 Food and Meals (page 11)", 
        competencies: ["1.1.7.1 Use language to talk about different foods and meals of the day."],
        learningActivities: [
          "Activity 1a: Identifying different types of foods (fruits, vegetables, grains)",
          "Activity 1b: Mentioning types of meals (breakfast, lunch and supper/dinner)",
          "Activity 1c: Reciting a prayer before meals"
        ],
        expectedStandard: ["Language to talk about different food and meals used appropriately."]
      },
      { 
        title: "1.1.8 Occupations (page 16)", 
        competencies: ["1.1.8.1 Use appropriate language to talk about occupations in the community."],
        learningActivities: [
          "Activity 1a: Naming occupations in the community",
          "Activity 1b: Stating the role played by people in different occupations in the community",
          "Activity 1c: Exploring occupations through role-play"
        ],
        expectedStandard: ["Appropriate language to talk about occupations in the community used accordingly."]
      },
      { 
        title: "1.1.9 Things found in a home (page 20)", 
        competencies: ["1.1.9.1 Use appropriate language to talk about things found at home."],
        learningActivities: [
          "Activity 1a: Parts of a house",
          "Activity 1b: Things found in a home",
          "Activity 1c: Uses of things found in a home."
        ],
        expectedStandard: ["Appropriate language to talk about things found at home accordingly."]
      },
      { 
        title: "1.1.10 Things found at school (page 24)", 
        competencies: ["1.1.10.1 Use appropriate language to talk about things found at school."],
        learningActivities: [
          "Activity 1a: Things found in a classroom",
          "Activity 1b: Uses of things found in a classroom",
          "Activity 1c: Keeping the classroom clean."
        ],
        expectedStandard: ["Appropriate language to talk about things found at school used correctly."]
      },
      { 
        title: "1.1.10 Things found at school (Activities) (page 32)", 
        competencies: ["1.1.10.1 Use appropriate language to talk about things found at school."],
        learningActivities: [
          "Activity 1a: Keeping the school clean.",
          "Activity 1b: What do you like doing?",
          "Activity 1c: Let us play."
        ],
        expectedStandard: ["Appropriate language to talk about things found at school used correctly."]
      },
      { 
        title: "1.1.11 Domestic animals (page 41)", 
        competencies: ["1.1.11.1 Use appropriate language to describe domestic animals."],
        learningActivities: [
          "Activity 1a: Identifying domestic animals",
          "Activity 1b: Describing domestic animals",
          "Activity 1c: Uses of domestic animals"
        ],
        expectedStandard: ["Appropriate language to describe domestic animals used correctly."]
      },
      { 
        title: "1.1.11 Domestic animals (continued) (page 41)", 
        competencies: ["1.1.11.1 Use appropriate language to describe domestic animals."],
        learningActivities: [
          "Activity 2a: Food we get from domestic animals",
          "Activity 2b: Talking about homes for domestic animals",
          "Activity 2c: Taking care of domestic animals"
        ],
        expectedStandard: ["Appropriate language to describe domestic animals used correctly."]
      },
      { 
        title: "1.1.12 At the Market (page 45)", 
        competencies: ["1.1.12.1 Use appropriate language for buying and selling."],
        learningActivities: [
          "Activity 1a: Identify items found at the market",
          "Activity 1b: Identify people found at the market",
          "Activity 1c: Buying and selling"
        ],
        expectedStandard: ["Appropriate language for buying and selling used accordingly."]
      },
      { 
        title: "1.1.13 Community practices (page 48)", 
        competencies: ["1.1.13.1 Use appropriate language to talk about community practices."],
        learningActivities: [
          "Activity 1a: Good community practices",
          "Activity 1b: How we live together in harmony",
          "Activity 1c: Keeping our Community Clean"
        ],
        expectedStandard: ["Appropriate language to talk about community practices used accordingly."]
      }
    ]
  },
  {
    title: "1.1 CONVERSATIONS",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.1.13 Community practices (page 11)", 
        competencies: ["1.1.13.1 Use appropriate language to talk about community practices."],
        learningActivities: [
          "Activity 1a: Good community practices",
          "Activity 1b: How we live together in harmony",
          "Activity 1c: Keeping our community clean"
        ],
        expectedStandard: ["Appropriate language to talk about community practices used accordingly."]
      },
      { 
        title: "1.1.14 Statements (page 14)", 
        competencies: ["1.1.14.1 Use appropriate language to deny, confirm, correct and express statements and propositions."],
        learningActivities: [
          "Activity 1a: Denying statements",
          "Activity 1b: Confirming statements",
          "Activity 1c: Asking and answering questions-denying and confirming"
        ],
        expectedStandard: ["Appropriate language to deny, confirm, correct, express statements and propositions used correctly."]
      },
      { 
        title: "1.1.15 Plurals (page 18)", 
        competencies: ["1.1.15.1 Use the plural forms of regular nouns."],
        learningActivities: [
          "Activity 1a: Changing regular nouns from singular to plural form",
          "Activity 1b: Changing regular nouns from singular to plural form",
          "Activity 1c: Changing regular nouns from singular to plural form"
        ],
        expectedStandard: ["The plural form of regular nouns used correctly."]
      }
    ]
  },
  {
    title: "1.2 ETIQUETTE",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.2.1 Manner (page 24)", 
        competencies: ["1.2.1.1 Use appropriate language to talk about good manners and behavior."],
        learningActivities: [
          "Activity 1a: Table manners.",
          "Activity 1b: Being kind.",
          "Activity 1c: Respecting personal space."
        ],
        expectedStandard: ["Appropriate language to talk about good manners and behavior used accordingly."]
      }
    ]
  },
  {
    title: "1.3 STORIES",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.3.1 Simple stories (page 29)", 
        competencies: ["1.3.1.1 Analyse simple stories orally."],
        learningActivities: [
          "Activity 1a: Listening to simple stories.",
          "Activity 1b: Retelling simple stories.",
          "Activity 1c: Answering oral questions based on the text."
        ],
        expectedStandard: ["Simple stories analysed correctly."]
      }
    ]
  },
  {
    title: "1.4 SONGS",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.4.1 Simple songs (page 33)", 
        competencies: ["1.4.1.1 Appropriate language in simple songs used correctly."],
        learningActivities: [
          "Activity 1a: Listening to and singing simple songs",
          "Activity 1b: Listening to and singing simple songs",
          "Activity 1c: Answering oral questions based on the song"
        ],
        expectedStandard: ["Appropriate language in simple songs used correctly."]
      }
    ]
  },
  {
    title: "1.5 DRAMA",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.5.1 Role playing (page 41)", 
        competencies: ["1.5.1.1 Use appropriate language to depict real life situations."],
        learningActivities: [
          "Activity 1a: Events.",
          "Activity 1b: Simple events",
          "Activity 1c: Simple events"
        ],
        expectedStandard: ["Appropriate language to depict real life situations used correctly."]
      }
    ]
  },
  {
    title: "1.6 POETRY",
    term: "Term 3",
    subtopics: [
      { 
        title: "1.6.1 Simple poems (page 46)", 
        competencies: ["1.6.1.1 Recite simple poems."],
        learningActivities: [
          "Activity 1a: Reciting simple poems on animals",
          "Activity 1b: Reciting simple poems on colors",
          "Activity 1c: Reciting simple poems on family"
        ],
        expectedStandard: ["Simple poems recited accurately."]
      },
      { 
        title: "1.6.2 Tongue twisters (page 54)", 
        competencies: ["1.6.2.1 Recite tongue twisters."],
        learningActivities: [
          "Activity 1a: Reciting tongue twisters with correct pronunciation",
          "Activity 1b: Reciting tongue twisters with correct pronunciation",
          "Activity 1c: Reciting tongue twisters with correct pronunciation"
        ],
        expectedStandard: ["Tongue twisters recited correctly."]
      }
    ]
  }
];`;

const startIndex = content.indexOf('export const englishGrade1Oral = [');
if (startIndex !== -1) {
  let endIndex = content.indexOf('];', startIndex);
  while (endIndex !== -1 && content.substr(endIndex, 2) === '];') {
    // wait, could be just the first `];` matching the array closure.
    // Let's use a cleaner replace strategy
    break;
  }
  // The structure is strictly export const englishGrade1Oral = [ ... ]; at the very end of the file.
  
  // Wait, let's just replace from 'export const englishGrade1Oral = [' to the end of the file or until the next export.
  const regex = /export const englishGrade1Oral = \[\s*[\s\S]*?\];\s*$/m;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/data/obeEnglishZambianData.ts', content, 'utf8');
    console.log("Successfully replaced englishGrade1Oral array.");
  } else {
    console.log("Could not match the exact array bounds with regex. Appending instead or needs manual slice.");
  }
}

