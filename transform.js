import fs from 'fs';

// Helper function to create topics for Grade 5 English
const eng5 = [
  {
    title: "5.1 Listening and Speaking",
    subtopics: [
      {
        title: "5.1.1 Stories (characterization)",
        competencies: ["Specific Outcome: 5.1.1.1 Name major and minor characters in a story | Knowledge: Major and minor characters | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.2 Language in a social setting and giving directions",
        competencies: ["Specific Outcome: 5.1.2.1 Seek and give factual information | Knowledge: E.g. asking for directions to a place | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.3 Proverbs/sayings",
        competencies: ["Specific Outcome: 5.1.3.1 Use proverbs and sayings | Knowledge: E.g. Not all that glitters is gold | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.4 Drama",
        competencies: ["Specific Outcome: 5.1.4.1 Dramatise stories | Knowledge: Role play, Voice projection, Confidence, Fluency | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.5 Poetry",
        competencies: ["Specific Outcome: 5.1.5.1 Recite common praises | Knowledge: Praises about God, chiefs, heroes and natural beauties | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.6 Processes",
        competencies: ["Specific Outcome: 5.1.6.1 Describe simple processes | Knowledge: E.g. How to prepare nshima; how to make fire etc. | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.7 Calendar Vocabulary",
        competencies: ["Specific Outcome: 5.1.7.1 Recognise and discuss calendar vocabulary | Knowledge: E.g. dates, days, weekend | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.8 Polite requests",
        competencies: ["Specific Outcome: 5.1.8.1 Make polite requests | Knowledge: Extension of an invitation | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.9 Debate",
        competencies: ["Specific Outcome: 5.1.9.1 Debate on familiar topics | Knowledge: E.g. Gender stereotype | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.10 Messages",
        competencies: ["Specific Outcome: 5.1.10.1 Transmit a message to a person | Knowledge: E.g. by word of mouth, phone or radio | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.1.11 Language use in a social setting",
        competencies: ["Specific Outcome: 5.1.11.1 Disagree and affirm statements, 5.1.11.2 Express and accept apologies | Knowledge: E.g. I don’t agree... I accept... | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      }
    ]
  },
  {
    title: "5.2 Reading",
    subtopics: [
      {
        title: "5.2.1 Intensive Reading",
        competencies: ["Specific Outcome: 5.1.1.1 Read a message to answer multiple choice, surface and inference questions | Knowledge: Knowledge of the text, back referencing | Skills: Application of knowledge | Values: Knowledge and awareness of", "Specific Outcome: 5.2.1.2.1 Read and interpret information presented in print | Knowledge: Electronic expressions, figurative language | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.2.2 Skimming and scanning",
        competencies: ["Specific Outcome: 5.2.2.1.1 Demonstrate information for skimming and scanning | Knowledge: Reading for specific information | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.2.3 Reading Aloud",
        competencies: ["Specific Outcome: 5.2.2.1 Read a given text at an appropriate pace, with correct pronunciation and understanding | Knowledge: Reading with fluency and comprehension | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.2.4 Extensive reading",
        competencies: ["Specific Outcome: 5.2.3.1 Read materials from other subjects | Knowledge: E.g. Science, Social Studies etc | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      }
    ]
  },
  {
    title: "5.3 Writing",
    subtopics: [
      {
        title: "5.3.1 Sequencing",
        competencies: ["Specific Outcome: 5.3.4.1 Re-arrange sentences to make logical order to form paragraphs | Knowledge: Sequencing sentences to make paragraphs | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.3.2 Narratives",
        competencies: ["Specific Outcome: Narrate a story based on series of pictures | Knowledge: Composing sentences on given picture strips | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.3.3 Keeping and writing a Diary",
        competencies: ["Specific Outcome: Keep and write a diary | Knowledge: E.g. Today I went to church with mother | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.3.4 Notices and advertisements",
        competencies: ["Specific Outcome: 5.3.5.1 Write notices and advertisements | Knowledge: E.g. Be aware! Take notice! | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.3.5 Letter writing",
        competencies: ["Specific Outcome: 5.3.6.1 Write informal and formal letters | Knowledge: Informal letters: one address | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.3.6 Summary",
        competencies: ["Specific Outcome: 5.3.5.1 Identify Title and Theme | Knowledge: Title and Theme | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      }
    ]
  },
  {
    title: "5.4 Structure",
    subtopics: [
      {
        title: "5.4.1 Tenses",
        competencies: ["Specific Outcome: Change word form to suitable tenses | Knowledge: Regular verbs e.g. walk-walked | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.2 Punctuation",
        competencies: ["Specific Outcome: 5.3.10.1 Punctuate given sentences | Knowledge: Exclamation marks, Question and Exclamation mark | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.3 Direct Speech",
        competencies: ["Specific Outcome: Recognise and use direct speech | Knowledge: Words directly spoken by someone and use of speech marks | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.4 Synonyms and antonyms",
        competencies: ["Specific Outcome: 5.3.12 Write synonyms and antonyms of words | Knowledge: Synonyms - words that have similar | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.5 Homographs",
        competencies: ["Specific Outcome: 5.3.12.1 Identify homographs in sentences | Knowledge: Words that spell the same with different meanings | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.6 Sentence construction",
        competencies: ["Specific Outcome: 5.3.11.1 Change sentences from positive to negative form and vice versa | Knowledge: E.g. I like nshima. I dislike nshima. | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.7 The Noun",
        competencies: ["Specific Outcome: Recognise and use different types of nouns | Knowledge: Types of nouns: Proper, Common, Collective and Countable and uncountable | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.8 The Verb",
        competencies: ["Specific Outcome: Recognise and use different types of verbs | Knowledge: Types of verbs: regular and irregular | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.9 Conjunctions",
        competencies: ["Specific Outcome: Join phrases using because, since and yet | Knowledge: Eg I am late because, I woke up late. | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.10 Adjectives",
        competencies: ["Specific Outcome: Recognise and use adjectives | Knowledge: Adjectives- words that describe nouns | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.11 Adverbs",
        competencies: ["Specific Outcome: Recognise and use adverbs | Knowledge: Adverbs- words that describe how an action is taking place | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      },
      {
        title: "5.4.12 Spellings",
        competencies: ["Specific Outcome: Spell the given words correctly | Knowledge: Phonemic awareness (Letter sounds) | Skills: Application of knowledge | Values: Knowledge and awareness of"]
      }
    ]
  }
];

const zambianLang5 = [
  {
    title: "5.1 Listening and Speaking",
    subtopics: [
      {
        title: "5.1.1 Listening Comprehension",
        competencies: ["Specific Outcome: 5.1.1.1 Listen comprehensively to a passage read aloud."]
      },
      {
        title: "5.1.2 Story telling",
        competencies: ["Specific Outcome: 5.1.2.1 Narrate fiction and non-fiction stories."]
      },
      {
        title: "5.1.3 Information and Explanations",
        competencies: ["Specific Outcome: 5.1.3.1 Ask for information and explanations."]
      },
      {
        title: "5.1.4 Extracting information",
        competencies: ["Specific Outcome: 5.1.4.1 Extract and obtain information from conversations."]
      },
      {
        title: "5.1.5 Life Skills",
        competencies: ["Specific Outcome: 5.1.5.1 Express sympathy, interest, concern, hope, apology and forgiveness."]
      },
      {
        title: "5.1.6 Dramatising plays",
        competencies: ["Specific Outcome: 5.1.6.1 Demonstrate the use of emphasis, irony and imitation."]
      },
      {
        title: "5.1.7 Debate",
        competencies: ["Specific Outcome: 5.1.7.1 Debate issues cutting across such as Health, gender based violence, HIV/AIDS, Child Abuse, Equity."]
      },
      {
        title: "5.1.8 Meaning of proverbs and sayings",
        competencies: ["Specific Outcome: 5.1.8.1 Tell and explain the actual meanings."]
      },
      {
        title: "5.1.9 Business Plan",
        competencies: ["Specific Outcome: 5.1.9.1 Prepare Business plans."]
      },
      {
        title: "5.1.10 Reporting",
        competencies: ["Specific Outcome: 5.1.10.1 Report personal experience.", "Specific Outcome: 5.1.10.2 Report briefly on a Conversation."]
      }
    ]
  },
  {
    title: "5.2 Reading",
    subtopics: [
      {
        title: "5.2.1 Reading names",
        competencies: ["Specific Outcome: 5.2.1.1 Identify sources of income generation."]
      },
      {
        title: "5.2.2 Disagreeing and concurring",
        competencies: ["Specific Outcome: 5.2.2.1 Express agreement and disagreement."]
      },
      {
        title: "5.2.3 Types of Business",
        competencies: ["Specific Outcome: 5.2.3.1 Identify types of business."]
      },
      {
        title: "5.2.4 Requests, Affirming, Warning, Suggestions",
        competencies: ["Specific Outcome: 5.2.4.1 Correct use of language to request, affirm, warn, suggest, responsibility, leadership."]
      },
      {
        title: "5.2.5 Quantity, capacity and weight information",
        competencies: ["Specific Outcome: 5.2.5.1 Express area, mass, capacity, weight and height in quantity."]
      },
      {
        title: "5.3.1 Comprehension",
        competencies: ["Specific Outcome: 5.3.1.1 Read fiction and non-fiction passages with understanding."]
      },
      {
        title: "5.3.2 Summary",
        competencies: ["Specific Outcome: 5.3.2.1 Explain the meaning of words.", "Specific Outcome: 5.3.2.3 Compose different summaries."]
      },
      {
        title: "5.3.3 Oral reading",
        competencies: ["Specific Outcome: 5.3.3.1 Read aloud with acceptable pronunciation and appropriate expression."]
      },
      {
        title: "5.3.4 Paraphrasing passages",
        competencies: ["Specific Outcome: 5.3.4.1 Paraphrase what has been read."]
      },
      {
        title: "5.3.5 Idioms",
        competencies: ["Specific Outcome: 5.3.5.1 Show an understanding of idiomatic language."]
      },
      {
        title: "5.3.6 Summary",
        competencies: ["Specific Outcome: 5.3.6.1 Summarise a story."]
      },
      {
        title: "5.3.7 Extensive Reading",
        competencies: ["Specific Outcome: 5.3.7.1 Locate information from print sources."]
      },
      {
        title: "5.3.8 Phonology",
        competencies: ["Specific Outcome: 5.3.8.1 Locate phonetic patterns."]
      }
    ]
  },
  {
    title: "5.3 Writing & Language",
    subtopics: [
      {
        title: "5.3.1 Composition",
        competencies: ["Specific Outcome: 5.3.1.1 Write essays i.e. introduction, body and conclusion."]
      },
      {
        title: "5.3.2 Reports",
        competencies: ["Specific Outcome: 5.3.2.1 Write reports on issues and situations in the local community."]
      },
      {
        title: "5.3.3 Reporting",
        competencies: ["Specific Outcome: 5.3.3.1 Report personal experiences."]
      },
      {
        title: "5.3.4 Notices and advertisement",
        competencies: ["Specific Outcome: 5.3.4.1 Write notices and advertisements."]
      },
      {
        title: "5.3.5 Translation",
        competencies: ["Specific Outcome: 5.3.5.1 Translate short paragraphs from English into Zambian language."]
      },
      {
        title: "5.3.6 Free writing",
        competencies: ["Specific Outcome: 5.3.6.1 Use a variety of writing styles e.g. personal, narrative, descriptive and functional."]
      },
      {
        title: "5.3.7 Handwriting",
        competencies: ["Specific Outcome: 5.3.7.1 Demonstrate how to use space, punctuation, margins by observing lines and margins."]
      },
      {
        title: "5.3.8 Sequencing",
        competencies: ["Specific Outcome: 5.3.8.1 Arrange sentences in logical order."]
      },
      {
        title: "5.3.9 Dictation",
        competencies: ["Specific Outcome: 5.3.9.1 Write from dictation."]
      },
      {
        title: "5.4.1 Use of Tenses",
        competencies: ["Specific Outcome: 5.4.1.1 Write a paragraph using a selected tense."]
      },
      {
        title: "5.4.2 Grammar",
        competencies: ["Specific Outcome: 5.4.2.1 Build up words using different suffixes, stems and suffixes."]
      },
      {
        title: "5.4.3 Poems",
        competencies: ["Specific Outcome: 5.4.3.1 Recite common prayers and poems."]
      },
      {
        title: "5.4.5 Noun classes",
        competencies: ["Specific Outcome: 5.4.5.1 List nouns according to noun prefixes."]
      },
      {
        title: "5.4.6 Figures of speech",
        competencies: ["Specific Outcome: 5.4.6.1 Use various figures of speech."]
      },
      {
        title: "5.4.12 Sentence construction",
        competencies: ["Specific Outcome: 5.4.12.1 Construct meaningful sentences."]
      },
      {
        title: "5.4.15 Direct and indirect speech",
        competencies: ["Specific Outcome: 5.4.15.1 Change direct into indirect speech and vice versa."]
      }
    ]
  }
];

const grade6Template = [{
  title: "6.1 Topics",
  subtopics: [{ title: "To be populated", competencies: ["Outcome: 6.1"] }]
}];
const grade7Template = [{
  title: "7.1 Topics",
  subtopics: [{ title: "To be populated", competencies: ["Outcome: 7.1"] }]
}];


fs.writeFileSync('./src/data/obeEnglishZambianData.ts', \`export const englishGrade5 = \${JSON.stringify(eng5, null, 2)};
export const zambianLangGrade5 = \${JSON.stringify(zambianLang5, null, 2)};
export const engZambianPlaceholder = \${JSON.stringify(grade6Template, null, 2)};
\`);
