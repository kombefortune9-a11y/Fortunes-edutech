import sys
import os

def replace_block(file_path, start_marker, end_marker, new_content):
    with open(file_path, 'r') as f:
        content = f.read()
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found: {start_marker}")
        return False
    
    end_idx = content.find(end_marker, start_idx + len(start_marker))
    if end_idx == -1:
        print(f"End marker not found: {end_marker}")
        return False
    
    # We want to replace everything from start_marker up to but NOT including end_marker
    new_file_content = content[:start_idx] + new_content + content[end_idx:]
    
    with open(file_path, 'w') as f:
        f.write(new_file_content)
    return True

# Update Creative and Technology Studies
cts_file = 'src/data/obeCreativeTechData.ts'
g1_cts = """export const obeCreativeTechGrade1 = [
  {
    title: "1.1 CREATIVE ARTS (Page 146)",
    subtopics: [
      {
        title: "1.1.1 Drawing and Colouring",
        competencies: ["Sketch simple objects", "Draw pictures of objects", "Paint pictures based on themes"],
        learningActivities: ["Sketching local objects", "Painting the Zambian flag", "Using primary colours to mix and create new hues"],
        expectedStandard: "Creates recognizable sketches and understands basic colour theory."
      }
    ]
  },
  {
    title: "1.2 PHYSICAL EDUCATION (Page 152)",
    subtopics: [
      {
        title: "1.2.1 Body Movements",
        competencies: ["Demonstrate locomotor and non-locomotor skills"],
        learningActivities: ["Hopping, skipping and jumping in rhythm", "Participating in simple relay races", "Demonstrating safe landing techniques"],
        expectedStandard: "Coordinates body movements and follows simple safety rules during play."
      }
    ]
  },
  {
    title: "1.3 HOME ECONOMICS (Page 158)",
    subtopics: [
      {
        title: "1.3.1 Health and Hygiene",
        competencies: ["Practise personal and food hygiene", "Demonstrate care for the home environment"],
        learningActivities: ["Demonstrating correct tooth brushing", "Washing kitchen utensils with soap", "Sorting waste items into bins"],
        expectedStandard: "Follows basic hygiene routines at school and home."
      }
    ]
  },
  {
    title: "1.4 TECHNOLOGY (Page 164)",
    subtopics: [
      {
        title: "1.4.1 ICT Devices",
        competencies: ["Identify and operate ICT devices", "Practise safe handling of digital equipment"],
        learningActivities: ["Naming parts of a computer", "Practising mouse control for clicking", "Turning devices on and off correctly"],
        expectedStandard: "Recognizes core ICT components and basic operation."
      }
    ]
  }
];

"""
replace_block(cts_file, "export const obeCreativeTechGrade1 = [", "export const obeCreativeTechGrade2 = [", g1_cts)

g2_cts = """export const obeCreativeTechGrade2 = [
  {
    title: "2.1 CREATIVE ARTS (Page 168)",
    subtopics: [
      {
        title: "2.1.1 Print Making and Designing",
        competencies: ["Create simple prints using various techniques", "Design simple objects for use"],
        learningActivities: ["Making potato prints on paper", "Designing a simple bookmark", "Exploring textures in nature for printing"],
        expectedStandard: "Can create uniform prints and understands basic design principles."
      }
    ]
  },
  {
    title: "2.2 PHYSICAL EDUCATION (Page 172)",
    subtopics: [
      {
        title: "2.2.1 Group Games",
        competencies: ["Participate in group games and follow rules"],
        learningActivities: ["Playing handball and netball basics", "Practising team cooperation in games", "Following referee signals"],
        expectedStandard: "Cooperates with teammates and respects game rules."
      }
    ]
  },
  {
    title: "2.3 HOME ECONOMICS (Page 180)",
    subtopics: [
      {
        title: "2.3.1 Nutrition and Food",
        competencies: ["Identify different types of food", "Practise good eating habits"],
        learningActivities: ["Grouping foods into energy-giving and body-building", "Setting a simple table for a meal", "Discussing healthy snacks"],
        expectedStandard: "Recognises basic food groups and proper mealtime behaviour."
      }
    ]
  },
  {
    title: "2.4 TECHNOLOGY (Page 186)",
    subtopics: [
      {
        title: "2.4.1 Materials and Tools",
        competencies: ["Identify properties of various materials", "Use tools safely to manipulate materials"],
        learningActivities: ["Testing if materials are hard or soft", "Cutting paper with safety scissors", "Using glue to join light materials"],
        expectedStandard: "Knows basic material properties and uses tools correctly."
      }
    ]
  }
];

"""
replace_block(cts_file, "export const obeCreativeTechGrade2 = [", "export const obeCreativeTechGrade4 = [", g2_cts)

# Update English and Zambian Language
eng_file = 'src/data/obeEnglishZambianData.ts'

g2_eng = """export const englishGrade2CBC = [
  {
    title: "2.1 STORIES (Page 13)",
    subtopics: [
      {
        title: "2.1.1 Listening to and Telling Stories",
        competencies: ["Listen to simple stories", "Retell stories in sequence", "Identify main characters"],
        learningActivities: ["Listening to audio stories", "Role-playing characters from a story", "Drawing scenes from a favourite story"],
        expectedStandard: "Understands simple narratives and can identify key story elements."
      }
    ]
  },
  {
    title: "2.2 CONVERSATIONS (Page 16)",
    subtopics: [
      {
        title: "2.2.1 Social Interaction",
        competencies: ["Initiate and sustain simple conversations", "Use polite expressions"],
        learningActivities: ["Practising telephone etiquette", "Asking and answering questions about hobbies", "Using words like 'please', 'thank you', and 'excuse me'"],
        expectedStandard: "Communicates effectively in familiar social settings."
      }
    ]
  },
  {
    title: "2.3 SOCIAL AND CULTURAL TOPICS (Page 22)",
    subtopics: [
      {
        title: "2.3.1 Community and Heritage",
        competencies: ["Talk about local community roles", "Describe cultural celebrations"],
        learningActivities: ["Identifying community helpers", "Sharing stories about traditional festivals", "Discussing family traditions"],
        expectedStandard: "Shows awareness of their social and cultural environment."
      }
    ]
  },
  {
    title: "2.4 READING AND WRITING (Page 28)",
    subtopics: [
      {
        title: "2.4.1 Literacy Skills",
        competencies: ["Read simple sentences fluently", "Write short descriptive paragraphs"],
        learningActivities: ["Reading aloud in small groups", "Writing a 'My Pet' description", "Practising spelling of high-frequency words"],
        expectedStandard: "Developing confidence in basic reading and creative writing."
      }
    ]
  }
];

"""
replace_block(eng_file, "export const englishGrade2CBC = [", "export const zambianLangGrade2Unpacked = [", g2_eng)

g2_zam = """export const zambianLangGrade2Unpacked = [
  {
    title: "2.1 STORIES (Page 15)",
    subtopics: [
      {
        title: "2.1.1 Traditional Tales",
        competencies: ["Listen and respond to traditional Zambian stories", "Explain morals in stories"],
        learningActivities: ["Listening to elders/audio of local fables", "Discussing what a character should have done", "Group retelling of a story"],
        expectedStandard: "Understands cultural values through local narratives."
      }
    ]
  },
  {
    title: "2.2 CONVERSATIONS (Page 18)",
    subtopics: [
      {
        title: "2.2.1 Oral Communication",
        competencies: ["Talk about immediate family and friends in local language", "Follow multi-step directions"],
        learningActivities: ["Introducing a friend to the class", "Following instructions to play a traditional game", "Describing a home chore"],
        expectedStandard: "Can express personal ideas clearly in the local language."
      }
    ]
  },
  {
    title: "2.3 SOCIAL AND CULTURAL TOPICS (Page 24)",
    subtopics: [
      {
        title: "2.3.1 Local Customs",
        competencies: ["Demonstrate respect through local traditional greetings", "Identify local geographical features"],
        learningActivities: ["Practising kneeling or bowing as per local custom", "Naming local rivers and hills in the area", "Singing traditional folk songs"],
        expectedStandard: "Practises local etiquette and knows local geography."
      }
    ]
  },
  {
    title: "2.4 LITERACY (READING AND WRITING) (Page 30)",
    subtopics: [
      {
        title: "2.4.1 Local Language Literacy",
        competencies: ["Read and write words with local phonemes", "Compose simple letters/notes"],
        learningActivities: ["Phonics drills for specific local sounds", "Writing a thank-you note in local language", "Labeling objects in the classroom"],
        expectedStandard: "Correctly reads and writes basic local language structures."
      }
    ]
  }
];

"""
replace_block(eng_file, "export const zambianLangGrade2Unpacked = [", "export const englishGrade3CBC = [", g2_zam)

g3_eng = """export const englishGrade3CBC = [
  {
    title: "3.1 STORIES (Page 33)",
    subtopics: [
      {
        title: "3.1.1 Reading Comprehension",
        competencies: ["Read and infer meaning from short stories", "Predict story outcomes"],
        learningActivities: ["Silent reading followed by a quiz", "Discussing 'What happens next?'", "Creating a different ending for a story"],
        expectedStandard: "Reads with understanding and can think critically about texts."
      }
    ]
  },
  {
    title: "3.2 CONVERSATIONS (Page 38)",
    subtopics: [
      {
        title: "3.2.1 Formal and Informal Talk",
        competencies: ["Participate in debates on simple topics", "Role-play formal interviews"],
        learningActivities: ["Debating: 'Should we have homework?'", "Mock news reporting", "Practising speech for an assembly"],
        expectedStandard: "Adapts language style according to the situation."
      }
    ]
  },
  {
    title: "3.3 SOCIAL AND CULTURAL TOPICS (Page 44)",
    subtopics: [
      {
        title: "3.3.1 National Identity",
        competencies: ["Discuss national symbols and their meanings", "Describe major Zambian historical events"],
        learningActivities: ["Drawing theCoat of Arms", "Discussing Independence Day significance", "Visiting a local historical site or museum virtual tour"],
        expectedStandard: "Has a sense of national pride and historical awareness."
      }
    ]
  },
  {
    title: "3.4 READING AND WRITING (Page 52)",
    subtopics: [
      {
        title: "3.4.1 Functional Writing",
        competencies: ["Write formal letters and invitations", "Use correct punctuation and grammar"],
        learningActivities: ["Writing a letter to the Headteacher", "Designing a birthday invitation card", "Editing a peer's writing for mistakes"],
        expectedStandard: "Produced organized and correctly punctuated functional texts."
      }
    ]
  }
];

"""
replace_block(eng_file, "export const englishGrade3CBC = [", "export const zambianLangGrade3Unpacked = [", g3_eng)

g3_zam = """export const zambianLangGrade3Unpacked = [
  {
    title: "3.1 STORIES (Page 35)",
    subtopics: [
      {
        title: "3.1.1 Creative Storytelling",
        competencies: ["Create and tell original stories in local language", "Analyse character development"],
        learningActivities: ["Using picture prompts to build a story", "Describing how a character changed through a story", "Recording a story for others to hear"],
        expectedStandard: "Creative and expressive in oral storytelling."
      }
    ]
  },
  {
    title: "3.2 CONVERSATIONS (Page 40)",
    subtopics: [
      {
        title: "3.2.1 Advanced Oral Skills",
        competencies: ["Deliver a short prepared talk in local language", "Negotiate and solve problems in groups"],
        learningActivities: ["Giving a talk on 'How to keep our school clean'", "Solving a puzzle through group discussion", "Interviewing an elder about the past"],
        expectedStandard: "Confident in delivering oral presentations and group collaboration."
      }
    ]
  },
  {
    title: "3.3 SOCIAL AND CULTURAL TOPICS (Page 46)",
    subtopics: [
      {
        title: "3.3.1 Traditions and Values",
        competencies: ["Explain the importance of various local ceremonies", "Demonstrate hospitality values"],
        learningActivities: ["Researching an Initiation or Harvest ceremony", "Role-playing welcoming a guest to the village", "Sharing traditional recipes"],
        expectedStandard: "Appreciates and can explain local cultural significance."
      }
    ]
  },
  {
    title: "3.4 READING AND WRITING (Page 54)",
    subtopics: [
      {
        title: "3.4.1 Creative Literacy",
        competencies: ["Write poems and songs in local language", "Read local news or informational texts"],
        learningActivities: ["Composing a poem about nature", "Writing lyrics for a new folk song", "Reading a simplified local newspaper article"],
        expectedStandard: "Produces creative written work and reads various text types in local language."
      }
    ]
  }
];

"""
replace_block(eng_file, "export const zambianLangGrade3Unpacked = [", "export const zambianLangGrade4Unpacked = [", g3_zam)

print("Replacement complete.")
