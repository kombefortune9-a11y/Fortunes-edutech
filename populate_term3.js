const fs = require('fs');
let content = fs.readFileSync('src/data/obeEnglishZambianData.ts', 'utf8');

// I will just completely replace the end of englishGrade2Oral and englishGrade2Literacy.
// I'll do this by matching the file contents precisely.

const oralTerm3Replacement = `
  {
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

content = content.replace(/\{\s*title:\s*"2\.1 CONVERSATION",\s*term:\s*"Term 3",\s*subtopics:\s*\[[\s\S]*?\];\s*$/m, oralTerm3Replacement.trim());

// Wait, the regex might fail. Let's just do a specific string replace for the Oral part.
