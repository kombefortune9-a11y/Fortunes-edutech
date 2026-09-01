export interface GuidePage {
  pageNumber: string;
  title: string;
  content: string;
  highlights?: string[];
  illustrations?: string[];
}

export interface GuideSection {
  sectionTitle: string;
  pages: GuidePage[];
}

export const LITERACY_GUIDE: GuideSection[] = [
  {
    sectionTitle: "1. Background & Foundational Principles",
    pages: [
      {
        pageNumber: "Page 1 - 2",
        title: "Introduction and Educational Situation",
        content: `The Ministry of General Education has made great strides to improve primary access and equity in Zambia. Present remedial attention has shifted toward ensuring quality learning through the Zambia Education Curriculum Framework, ensuring Grade 3-5 learners acquire foundational literacy skills. 

Despite national efforts, baseline biennial Grade 5 assessments demonstrate that many learners are not breaking through to literacy and numeracy. This shortfall is caused by overcrowding, which limits individual attention. The Catch-Up programme / Teaching at the Right Level (TaRL) methodology is designed to adapt instruction to grouped learner competencies rather than ages or grades.

**The Teacher's Role as Facilitator:**
1. Develop a warm, playful, and responsive learning environment where pupils feel secure to take chances.
2. Foster active and peer-led horizontal reading networks.
3. Guide small structured groups based on verified ability level rather than standard age/grade grids.`,
        highlights: [
          "Curriculum alignment with Zambia Education Framework of 2013.",
          "Grouped teaching according to verified reading ability, not chronological grade.",
          "Instruction delivered in the learners' familiar language (Cinyanja, Chitonga, Icibemba, Silozi, Kikaonde, Luvale, Lunda) with appropriate vocabulary translations."
        ]
      }
    ]
  },
  {
    sectionTitle: "2. The Placement Test & Ability Grouping",
    pages: [
      {
        pageNumber: "Page 3 - 5",
        title: "One-on-One Literacy Assessment Levels",
        content: `The critical starting point consists of establishing each child's current reading level utilizing a standardized, rapid, oral assessment conducted privately on a one-on-one basis.

**The 5 Assessment Levels:**
- **Beginner Level:** Cannot recognize even 4 basic letter sounds correctly.
- **Letter Sound Level:** Can correctly identify and sound out at least 4 individual phonetic letter sounds.
- **Word Level:** Can decode and read at least 4 simple words correctly.
- **Simple Paragraph Level:** Can read a basic 3-line paragraph without splitting words, making no more than 3 mistakes.
- **Story Level:** Can read a complete story smoothly, answering text-based comprehension questions to verify deep understanding.

**Assessment Best Practices:**
1. Maintain a friendly posture to put the learner at ease.
2. Fold the sheet to present only the relevant section, preventing overwhelming focus fatigue.
3. Provide ample silent time (max 5 minutes total per learner).`,
        highlights: [
          "Never group by Grade: align Grades 3, 4, and 5 into ability cohorts.",
          "Cohort 1: Beginners & Letter-sound levels.",
          "Cohort 2: Word & Simple-paragraph levels.",
          "Cohort 3: Story level (advanced comprehension readers)."
        ]
      }
    ]
  },
  {
    sectionTitle: "3. Common Activities for All Levels",
    pages: [
      {
        pageNumber: "Page 9 - 13",
        title: "Standard Daily Classroom Routines",
        content: `Every lesson should integrate communicative verbal and spatial focus items to trigger kinesthetic pathways for all cohorts:

**1. Informal Chat (10 mins):**
A daily oral session where the facilitator shares a friendly, animated personal anecdote (e.g., about their walk to school, weekends, or marriages) utilizing expressive vocal modulation. Pupils are encouraged to respond, share opinions, and build spoken sentence syntax.

**2. Storytelling (10 mins):**
Read out or act a fictitious story. Gauge pupil comprehension by asking them to summarize, describe character traits, and retell the plot in their own words.

**3. Picture Study (10 mins):**
Show a scenic local poster (e.g., market day, soccer games, village layouts). Ask learners to name objects they see and construct complete sentences describing the active events without repeating prior classmates.

**4. Core Mind Map (15 mins):**
A highly effective spatial mapping technique. Circle a central target vocabulary item (e.g., "Mango", "Nkhwangwa"). Learners brainstorm associated properties (sweet, yellow, juicy, trees).
- For beginners: Elicit spoken sounds and initial vowels.
- For writers: Guide them to generate written sentences around each branch and copy them in notebook entries.`,
        highlights: [
          "Point-and-Track Rule: Pupils must trace and point fingers at each word as the teacher/peers read.",
          "Oral chat builds peer bonding.",
          "Maintain active notebooks: COPY WRITING and DICTATION should be practiced daily."
        ]
      }
    ]
  },
  {
    sectionTitle: "4. Beginner & Letter-Sound Level Activities",
    pages: [
      {
        pageNumber: "Page 14 - 18",
        title: "Phonics Reading & Syllable Decoding",
        content: `Beginners need intensive focus on decoding letters, phonetic sounding, and structured visual games:

**1. Syllabic Chart Reading:**
The facilitator points and reads the syllable grid (ba, be, bi, bo, bu) horizontally, vertically, and in random zigzag orders. Call on individuals or small teams to trace, read, and cross-reference sounds.

**2. Strings of Syllables (Phonemic Awareness):**
Write a base target word prominently (e.g., 'Mother'). Segment it to vowels and consonants. Write a consonant string with all vowels (ma, me, mi, mo, mu; ta, te, ti, to, tu). Guide pupils in blending these units into words, including nonsense words which help test mechanical letter connection.

**3. The Basket Game:**
Place syllable or vowel cards in a basket. Stand or sit in an active circle. Sing a local song and pass the basket. When the song stops, the student holding the basket draws a card, sounds out the vowel/syllable, and names a corresponding local word.

**4. Flipping the Flashcard:**
Lay 6 syllables face down. Point to a syllable on the board chart. Ask a student to locate and flip the matching face-down card. The pupil gets up to 3 tries. Correct pairs are matched to the board in celebration.`,
        highlights: [
          "Maximum 15 minutes of pure syllabic chart pointing daily to avoid mental overload.",
          "Celebrate mistakes: nonsense word creations are vital signs of phonemic learning.",
          "Incorporate star stickers or cardboard tokens for victorious groups."
        ]
      }
    ]
  },
  {
    sectionTitle: "5. Word and Simple Paragraph Activities",
    pages: [
      {
        pageNumber: "Page 19 - 21",
        title: "Fluency Drills & Correcting Syntax",
        content: `At this stage, learners transition from individual syllable decoding to complete sentence flow and story construction:

**1. Story Making - 'Go Ahead':**
The teacher writes a single starter sentence on the chalkboard (e.g., 'Mariya went to the stream.'). Choose small groups. Group leaders say and write an additional sentence logically connected to the previous statement. Continue in a round-robin rotation until a short cohesive story with a moral ending is finalized.

**2. Correct the Incorrect:**
The facilitator reads a standard sentence correctly but writes it on the blackboard containing common syntax, gender representation, or singular-plural conjugation bugs. The pupils are called to point out errors and write corrected versions in their books.

**3. Simple Paragraph Reading (Daily Routine):**
The facilitator demonstrates fluent and rhythmic vocal pacing over a custom 3-line paragraph panel. All pupils point their fingers directly at each word on their personal cards. Pupils then take turns reading horizontally aloud.`,
        highlights: [
          "Paragraph reading is a mandatory daily routine for word/paragraph level cohorts.",
          "Focus on punctuation awareness: pause on commas, stop on full periods.",
          "Sit directly with struggling teams to manage eye-hand coordination problems."
        ]
      }
    ]
  },
  {
    sectionTitle: "6. Story Level Activities",
    pages: [
      {
        pageNumber: "Page 20 - 21",
        title: "Story Level: Lesson-Based Activities",
        content: `At this stage, learners transition from paragraphs to complete story comprehension, vocabulary reinforcement, and creative writing.

**Procedure 1: Lesson-Based 6-Step Activities (45 - 50 mins):**

**STEP 1: Discussion on title**
Write the title of the story on the chalkboard. Elicit and discuss learners' imaginations and predictions about what is given in the story based on the title.

**STEP 2: Reading by the teacher**
Give story cards or story books to the learners. Instruct them that no one should read yet, but listen first. Demonstrate reading with a clear voice, proper intonation, correct punctuation, and pronunciation while pupils point fingers at each word.

**STEP 3: Reading by the learners**
Learners take turns reading 2-3 sentences each. Verify if content matches pre-reading expectations. Write keywords on the chalkboard. Ask learners to rearrange keywords and retell the story in their own words as a summary.

**STEP 4: Group activities–competition**
Divide the class into groups. Each group prepares quiz questions based on:
- Activity 1: Facts from the story (filling in the blanks / completing sentences).
- Activity 2: Meanings of difficult words.
- Activity 3: Words with opposite meanings.
- Activity 4: Words with same meanings.

**STEP 5: Further discussion on the text**
Ask critical thinking and analytical questions:
- What is the story about? Why was this story written? What is your own experience in relation to this story? Is there any extra element you would like to share?

**STEP 6: Writing**
Learners write a personal summary of the text in their own words, or answer comprehension questions.

*Note on Lesson Splitting:*
- The lesson can be split into two days.
- **Lesson 1 (Day 1 - Step 1-3):** Covers pre-reading, teacher modeling, and learner reading.
- **Lesson 2 (Day 2 - Step 4-6):** Covers group quiz competition, critical discussion, and final summary writing.
- Use this 6-step procedure 3-4 times per week, alternating with common activities like Mind Maps.`,
        highlights: [
          "Story-level learners are the most advanced readers; promote independent summary writing.",
          "Ensure group quizzes remain friendly, engaging, and structured competitive games.",
          "Integrate critical reading questions on step 5 to stimulate high-order analytical reasoning."
        ]
      }
    ]
  },
  {
    sectionTitle: "7. Assessment Sample Cards",
    pages: [
      {
        pageNumber: "Page 36 - 37",
        title: "Official MoE Regional Assessment Samples",
        content: `**CINYANJA TOOL:**
- **Letters:** k, b, m, s, c, n, t, p, a, z
- **Words:** kuno, samba, pita, buku, caka, lomba, nthano, tero
- **Paragraph:** Dzulo kunali mvula. Mvula imeneyi sinathe. Atate sanopite kunchito. Ine ndinali panyumba. Mkulu wanga anali panyumba. Tonse tinali panyumba.
- **Story:** Pamudzi pa Kawalala m’boma la Kafete...

**ICIBEMBA TOOL:**
- **Letters:** p, u, n, w, f, s, y, l, b, t
- **Words:** icimbala, landa, amataba, ubunga, umutwe, seka, imbushi, pupuka
- **Paragraph:** Bamaoyo na batata ba ilimi basuma. Balikwala Ibala kunuma ya ganda. Mwibala mwaba umusalu, tomato na mataba. Ilim inga nqa f yapya balafishilisha.
- **Story:** Ba Lombe baliba bwino saana. Bakala mu mushi mwa Nkula...

**SILOZI TOOL:**
- **Letters:** p, l, n, w, t, h, y, I, b, z
- **Words:** sihwana, pulli, buka, taha, likota, booko, zini, noha
- **Paragraph:** Boma ni bondate ki balimi babafuna. Simu yabona lindi kwa mandamino. Kuna ni milaho yamilufutafu. Milaho yeo halibuzwise twalekisanga.
- **Story:** Bo Sepiso nelli basali ba pillu yende...`,
        highlights: [
          "Ensure teachers utilize language booklets matching their specific regional location.",
          "Test stories should contain a maximum of 6 cohesive sentences of local interest.",
          "Keep assessment records securely stored for termly diagnostic charts."
        ]
      }
    ]
  }
];

export const NUMERACY_GUIDE: GuideSection[] = [
  {
    sectionTitle: "1. Intro, placement & placement-marking",
    pages: [
      {
        pageNumber: "Page 1 - 4",
        title: "Background & The Placement Test Matrix",
        content: `Remedial mathematics in grades 3-5 aims to combat foundational mathematical anxiety by focusing on number sense and algorithms rather than mechanical formula memorization.

**Assessment Procedure:**
1. **Start from Level 3 (3-digit Numbers).**
2. If the pupil successfully identifies at least 4 out of 6 numbers in Level 3, proceed immediately to Level 4 (4-digit Numbers).
   - If they identify 4 numbers in Level 4, mark as Level 4. Proceed to Part 2 Operations.
   - If they fail Level 4, mark at Level 3. Proceed to Part 2 Operations.
3. If they fail Level 3 to identify 4 numbers, test with Level 2 (2-digit Numbers).
   - If they pass, mark at Level 2. Proceed to Part 2.
   - If they fail Level 2, test with Level 1 (1-digit Numbers).
4. If they pass Level 1, mark as Level 1 and proceed to operations.
5. If they fail Level 1, mark as "Beginner". **Stop Assessment.** Do not test operations.

**Operations Marking Instructions:**
- **Start with Subtraction (2-digit with borrowing).**
  - If 2 calculations are correct: Mark 'Can do Subtraction'. Continue with Division.
  - If less than 2 are correct: Continue with Addition.
- **If Division (2-digit by 1-digit) is passed (2 correct):** Mark 'Can do Division'. Stop.
- **If Addition is passed:** Continue with Division / Multiplication.`,
        highlights: [
          "Always start number assessment at Level 3.",
          "Operations must begin test path at SUBTRACTION, not addition.",
          "Do not test operations for beginners who fail Level 1 number recognition."
        ]
      }
    ]
  },
  {
    sectionTitle: "2. Difficulties Faced & Teacher Facilitation",
    pages: [
      {
        pageNumber: "Page 5 - 6",
        title: "The KNOW Model & Number Concept Challenges",
        content: `Mathematical phobia develops early when abstract representations are forced onto pupils without concrete roots.

**Common Challenges:**
- **Identifications:** Recognizing or writing random multi-digit sequences.
- **Reversals:** Confusion in place value orientation. (e.g., writing or reading '23' when '32' is voiced).
- **Term Confusions:** Blending everyday colloquial terms with operational vocabulary.

**The "KNOW" Model Guidelines:**
- **LISTEN:** Actively attend to spoken mathematical words and oral word problems.
- **READ/SAY:** Participate in oral choral reading of number and multiplication tables.
- **DO:** Directly manipulate raw, physical objects (abacus, bundle sticks, play money) to solve equations.
- **WRITE:** Solidify physical results inside written notes and grids.
- **SOLVE:** Devote quiet thinking time to solve problems independently.`,
        highlights: [
          "Avoid pure rote-memorization: transition abstract logic into physical 'doing'.",
          "Explain place-value grids to prevent number reversal issues.",
          "Always contextualize equations into relatable everyday local tasks."
        ]
      }
    ]
  },
  {
    sectionTitle: "3. Number Recognition Activities",
    pages: [
      {
        pageNumber: "Page 7 - 13",
        title: "Spatial & Kinetic Games for Numbers",
        content: `**1. Clap and Snap:**
A classic activity for place values.
- Snapping fingers = Ones (Units).
- Clapping hands = Tens.
- Stamping feet = Hundreds.
- *Example:* 2 claps and 3 snaps = 23. The teacher claps/snaps and pupils call out the value. Turn it into a student-led competition.

**2. Number Circle:**
Draw concentric rings on the ground. Label the inner ring 'Ones', the middle 'Tens', and the outer 'Hundreds' (add more outer rings for Levels 3 & 4). 
- Pupils throw 9 small pebbles into the rings.
- Stones landing on lines or outside are excluded.
- Count the stones inside rings and write the numbers in a column frame.

**3. Bundle & Sticks:**
Pupils count and group loose sticks. Introduce the **10-Stick Rule**: Once pupils hold 10 sticks, they must bind them together with a rubber band to construct **1 bundle (representing 1 Ten)**.
- Use this visual to write numbers in a BUNDLES | STICKS column frame. Compare quantities (e.g. 34 has more bundles than 25, hence 34 > 25).

**4. Expansion Chart & Play Money:**
A 5x9 matrix displaying Ones, Tens, Hundreds, Thousands, and Ten Thousands.
- Use Play Money (notes of 1, 10, 100, 1000) to represent complex values.
- *Example:* Count and stack 427 Kwacha. Ask: how does 427 split? 4 notes of 100 make 400. 2 notes of 10 make 20. 7 notes of 1 make 7. Place notes directly inside the matching place value drawers.`,
        highlights: [
          "The 10-Stick Rule: Pupils must bind 10 units to make 1 Ten bundle.",
          "DIALECT NOTICE: Play money is used solely as a place-value tool. It holds no real currency value.",
          "Point-and-Chant Chart reading: read charts left-to-right, right-to-left, top-to-bottom, and diagonally to prevent pure visual-pattern memorization."
        ]
      }
    ]
  },
  {
    sectionTitle: "4. Mental Mathematics & Math Conversations",
    pages: [
      {
        pageNumber: "Page 14 - 15",
        title: "Brain Warm-ups & Mathematical Conversations",
        content: `Mental math exercises are structured to build rapid operational intuition. They must be fast-paced, encouraging, and run for 5 to 10 minutes at the start of the Operations section.

**Activities:**
- **Tossing the Ball:** Toss a soft ball to a pupil and call out a simple math query (e.g., '4 + 5' or '3 times 3'). The pupil catches the ball, answers, and tosses it back.
- **Mind Map math:** Link operations to central value figures.
- **Activity with 9 Sticks:** Distribute 9 sticks. Instruct pupils to mix, take away, or group sticks. Use daily with terminology like 'take away', 'remove', 'add', 'put together' to build concept pathways block by block.

**Mathematics Conversations (MoE Daily Integration):**
Connect math to home life by asking pupils:
1. "How does mathematics help when we are cooking meals at home?" (measurement, timing, counting).
2. "How is mathematics useful on a bus trip to town?" (fares, distance, travel time).
3. "How does a carpenter, builder, tailor, or farmer depend on mathematics daily?"`,
        highlights: [
          "Limit mental math to 5-10 minutes to maintain high adrenaline focus.",
          "Never penalize errors: maintain a supportive 'try again until we succeed' environment.",
          "Always practice reciting tables at the end of every lesson."
        ]
      }
    ]
  },
  {
    sectionTitle: "5. Basic Operations (Addition & Subtraction)",
    pages: [
      {
        pageNumber: "Page 16 - 21",
        title: "Sticks and Play Money Algorithms",
        content: `Concrete operations precede abstract algorithms:

**1. Addition with Bundles & Sticks (sums up to 50):**
- Write word problem: 'Richard has 26 pineapples. Anne gives him 15 more.'
- Count Richard's sticks (2 bundles, 6 loose sticks) and Anne's (1 bundle, 5 loose sticks).
- Combine loose sticks first: 6 + 5 = 11 sticks.
- Apply the **10-Stick Rule:** Bind 10 sticks into a new bundle, leaving 1 loose stick in the Units column. Carry the 1 new bundle over to the Bundles column.
- Sum bundles: 2 + 1 + 1 (carried-over) = 4 bundles. Complete answer: 41.

**2. Subtraction with Bundles & Sticks (with borrowing):**
- 'Samuel has 32 balloons. He gives Nella 13 balloons.'
- Represent 32 as 3 bundles, 2 sticks.
- Attempt to subtract 3 loose sticks from 2. This is impossible.
- Borrow Rule: Take 1 bundle from the Tens column, unbundle it into 10 loose sticks, and move them to the Units column. 2 sticks become 12 sticks.
- Subtract units: 12 - 3 = 9.
- Subtract remaining bundles: 2 bundles - 1 bundle = 1 bundle. Total: 19 balloons left.

**3. Play Money Addition & Subtraction (Hundreds, Tens, Ones):**
- Rosa has 321 Kwacha. She pays Robert 165. How much is left?
- Set 3 notes of 100, 2 notes of 10, 1 note of 1.
- Subtract 5 ones from 1 (impossible). Change 1 note of 10 to 10 notes of 1. 1 becomes 11 ones. 11 - 5 = 6 ones.
- Subtract 6 tens from remaining 1 ten (impossible). Change 1 note of 100 to 10 notes of 10. 1 ten becomes 11 tens. 11 - 6 = 5 tens.
- Subtract hundreds: 2 hundreds - 1 hundred = 1 hundred. Result: 156 Kwacha.`,
        highlights: [
          "Always write algorithms vertically in clear place-value frames.",
          "Ensure unbundled tens sticks are physically untied, not kept bound.",
          "Have pupils recite the mathematical steps in complete sentences to verbalize logic."
        ]
      }
    ]
  },
  {
    sectionTitle: "6. Multiplication & Long Division",
    pages: [
      {
        pageNumber: "Page 24 - 30",
        title: "Ladder, Grid-Box & Long Division",
        content: `Multiplication is first introduced as repeated addition, then progressed using structured visual engines:

**1. Ladder Method of Intersections:**
- E.g., Table of 2: Draw 2 vertical lines.
- To solve 2 x 3, draw 3 horizontal lines crossing the 2 verticals.
- Have pupils point and count the points of intersection to find the product: 6.

**2. Grid-Box Method (Multiplication Box):**
For 2-digit multiplications (e.g. 24 x 30).
- Decompose numbers: 24 becomes (20 and 4), 30 becomes (30 and 0).
- Draw a 2x2 grid. Write 20 and 4 across the top, and 30 and 0 along the side.
- Cross-multiply cells:
  - Cell (1,1): 20 x 30 = 600
  - Cell (1,2): 4 x 30 = 120 (Row sum = 720)
  - Cell (2,1): 20 x 0 = 0
  - Cell (2,2): 4 x 0 = 0 (Row sum = 0)
- Sum partial products: 720 + 0 = 720.

**3. Long Division (Sharing & Repeated Subtraction):**
- Problem: 'Alex distributed 72 Kwacha equally among 3 friends. How much does each friend get?'
- Set tens and ones frame: 7 tens, 2 ones.
- Distribute 7 notes of 10 among 3 friends: each gets 2 notes of 10 (Total 6 notes used, 1 note of 10 remaining).
- Write '2' in Tens column on top. Subtract 6 from 7.
- Exchange remaining 1 Ten note for 10 ones. Combine with 2 ones = 12 ones.
- Distribute 12 ones among 3 friends: each gets 4 ones. Write '4' on top.
- Final answer: 24 Kwacha each.`,
        highlights: [
          "Zero Rule: Introduce properties of zero by showing empty hands or empty stick columns.",
          "Keep tables from 2 to 10 visible on a large wall chart.",
          "Write multiplication facts adjacent to the long division layout to support calculations."
        ]
      }
    ]
  }
];

export interface RemedialIllustration {
  id: string;
  title: string;
  category: string;
  gradeSuitability: string;
  emoji: string;
  description: string;
  howToTeach: string;
  visualLayout: string;
}

export const REMEDIAL_GUIDE: GuideSection[] = [
  {
    sectionTitle: "1. Background & Preface",
    pages: [
      {
        pageNumber: "Page ii - 1",
        title: "Foreword on Remedial Learning & Survey Findings",
        content: `The National Assessment Survey of Learning Achievement at Middle Basic School Level in Zambia demonstrated a crucial gap: many Grade 5 pupils face persistent learning difficulties in foundational literacy, basic operations, and life skills. In response, the Ministry of Education compiled this Educational Remedial Material Booklet focusing on the "Difficult Learning Areas".

The primary goal of this booklet is to provide teachers with practical methodologies, exercises, and diagnostic visual illustrations to address these learning gaps directly in the classroom.

**Key Structural Guidelines:**
1. **Adaptive Instruction:** Use these remedial materials across all levels where gaps exist (not limited to Grade 5; highly applicable for early childhood (ECE) and lower primary).
2. **Visual & Active Learning:** Integrate the diagnostic drawings and charts directly into blackboard work, cards, and interactive games.
3. **Continuous Support:** Group learners based on specific remedial needs identified in English, Mathematics, and Life Skills, rather than age-grades.`,
        highlights: [
          "Developed by the Republic of Zambia Ministry of Education.",
          "Targeted directly at middle basic school levels and difficult learning areas.",
          "Provides specific visual illustration tables for abstract concepts."
        ]
      }
    ]
  },
  {
    sectionTitle: "2. English - Alphabet, Phonics & Spelling",
    pages: [
      {
        pageNumber: "Page 2 - 7",
        title: "Phonetics, Alphabetical Order & Picture Matching",
        content: `A core barrier in early literacy is alphabet recognition and words sequencing. Pupils often struggle to arrange letters in a fixed order and sequence words.

**Remedial Strategies:**
1. **The Alphabet Song & Phonetic Chart:** Start by singing the alphabet song. Use phonetic letter cards to connect sounds to standard alphabet characters.
2. **Alphabetical Sorting Games:** Teach learners how to alphabetize names, districts (e.g., Lusaka, Ndola, Chipata), or common terms. Use the visual illustration index (A for Ant, B for Ball, etc.) as concrete flashcards.
3. **Word Card Matching:** Prepare simple word cards and corresponding picture cards. Have learners match the written word with the illustrative drawing on the board.

**A to Z Phonics Reference Index (For ECE & All Grades):**
- **A** (Ant) • **B** (Ball) • **C** (Cow) • **D** (Dog) • **E** (Egg) • **F** (Flower)
- **G** (Goat) • **H** (Hat) • **I** (Ice cream) • **J** (Jacket) • **K** (Kite) • **L** (Lion)
- **M** (Mango) • **N** (Nail) • **O** (Owl) • **P** (Pot) • **Q** (Queen) • **R** (Rabbit)
- **S** (Snake) • **T** (Tree) • **U** (Umbrella) • **V** (Vest) • **W** (Window) • **X** (Xylophone)
- **Y** (Yoke) • **Z** (Zebra)`,
        highlights: [
          "Alphabet illustrations are perfect for ECE and lower grades to build basic nouns vocab.",
          "Encourage tactile sorting of word cards in alphabetical sequences.",
          "Incorporate alphabet games (e.g., 'Alphabet Race' on the blackboard)."
        ]
      },
      {
        pageNumber: "Page 18 - 20",
        title: "Spelling Games, Word Wheels & Ladder Progress",
        content: `Spelling requires decoding visual phonetics and spelling rules. The booklet introduces active games to make spelling fun:

**1. Spelling Game - Magic Wheel Game:**
- Draw a wheel divided into segments on the blackboard. Write common syllables/prefixes (e.g., 'fin', 'sit', 'hat', 'win', 'can', 'fat', 'uid', 'kit') around the wheel.
- Place a target letter (like 'e') in the center. Spin the wheel (using a spinner or finger pointing) and ask learners to combine segments to formulate words.
- *Example:* uid + e = guide, fin + e = fine, win + e = wine, can + e = cane.

**2. Spelling Ladder Game:**
- Draw a vertical ladder on the board. Write simple words on the bottom rungs (e.g., 'is', 'and', 'man') and progress to more complex words (e.g., 'class', 'room', 'house', 'school') on the upper rungs.
- Pupils spell each word. They can only 'climb' to the next ladder rung if they spell the current word correctly.
- *Example progress:* is ➔ and ➔ man ➔ class ➔ room ➔ house ➔ school.`,
        highlights: [
          "Magic Wheel games stimulate rapid phoneme blending.",
          "Use the Spelling Ladder to provide visual evidence of academic growth.",
          "Perfect for multi-grade classes; adjust word complexity on the rungs to match the learner's level."
        ]
      }
    ]
  },
  {
    sectionTitle: "3. English - Grammar & Structure",
    pages: [
      {
        pageNumber: "Page 8 - 9",
        title: "Prepositions and Positional Relationships",
        content: `Prepositions represent physical spatial and temporal relations. Many pupils struggle to choose correct prepositions in active sentences.

**Position Mapping (The 16 Essential Prepositions with Illustration Guide):**
- **In:** Show a chicken inside a wicker basket. ('The chicken is in the basket.')
- **on:** Show a radio set resting on top of a table. ('The radio is on the table.')
- **at:** Show a girl pointing her finger at a lizard on a tree trunk. ('The girl is pointing at the lizard.')
- **under:** Show a cat hiding directly beneath a table. ('The cat is under the table.')
- **below:** Show a girl climbing a tree, situated on a lower branch than a boy. ('The girl is below the boy.')
- **behind:** Show a playful dog running behind a child on a bicycle. ('The dog is running behind the bicycle.')
- **over:** Show a boy kicking a soccer ball directly over a goalpost. ('The boy has kicked the ball over the goal post.')
- **from:** Show a student in uniform walking away from a school building. ('The boy is walking from school.')
- **to:** Show a student with a backpack walking toward a school gate. ('The boy is walking to school.')
- **Into:** Show a boy pouring water from a clay jar into a clear glass. ('The boy is pouring water from a jar into a glass.')
- **above:** Show a passenger plane flying high above tall pine trees. ('The aeroplane is flying above the trees.')
- **against:** Show a girl leaning her back comfortably against a brick wall. ('The girl is leaning against the wall.')
- **between:** Show a boy sitting on a bench directly between two girls. ('The boy is sitting between two girls.')
- **in front of:** Show a dog standing obediently in front of an active boy. ('The dog is in front of the boy.')
- **beside:** Show a dog sitting peacefully beside a girl. ('The dog is beside the girl.')
- **round:** Show a group of children standing in a circular ring around a campfire. ('The boys and girls are standing round the fire.')`,
        highlights: [
          "Preposition illustrations are universally useful (essential for ECE levels to learn spatial concepts).",
          "Conduct 'Live Action prepositions': place objects in/on/under desks and ask pupils to state relations.",
          "Ask learners to copy the preposition illustration sentences while illustrating them in books."
        ]
      },
      {
        pageNumber: "Page 10 - 15",
        title: "Subject-Verb Agreement, Nouns & Comparatives",
        content: `Mastering English syntax requires systematic scaffolding of grammar components:

**1. Subject-Verb Agreement Substitution Table:**
Provide a substitution grid to help learners visually map correct singular and plural concordances:
- **Subjects (Plural/I/You):** 'I', 'We', 'You', 'They', 'Mother & father' ➔ **Verb:** 'go' ➔ **Phrase:** 'to the market every weekend.'
- **Subjects (Singular):** 'He/She/It', 'They' (when singular group), 'Mother' ➔ **Verb:** 'goes' ➔ **Phrase:** 'to the market every weekend.'

**2. Countable vs. Uncountable Nouns Table:**
- **Countable Nouns:** 'Two bananas', 'Two boys and two girls', 'Money (coins/bills)' (represented by concrete individual objects).
- **Uncountable Nouns:** 'Mealie meal' (in a bowl), 'Sand' (in a pile), 'Milk' (in a jug). Teach that these require quantity descriptors (a lot of, some, a little).

**3. Comparatives & Superlatives (Tree/Stick/Animal size visual tables):**
Use comparative illustrations to represent degrees of adjectives:
- **Height (Tall ➔ Taller ➔ Tallest):** Draw Tree A (tall), Tree B (taller than A), Tree C (tallest among A, B, C).
- **Length (Long ➔ Longer ➔ Longest):** Stick B (long), Stick A (longer), Stick C (longest).
- **Size (Big ➔ Bigger ➔ Biggest):** Lion (big), Hippopotamus (bigger), Elephant (biggest).`,
        highlights: [
          "Avoid dry rules: use the substitution table orally before writing.",
          "For ECE and lower grades, use actual fruits and sand cups to explain countable vs uncountable.",
          "Ask pupils to collect sticks of different lengths to practice comparatives ('long', 'longer', 'longest')."
        ]
      }
    ]
  },
  {
    sectionTitle: "4. Mathematics - Basics, Decimals & Currency",
    pages: [
      {
        pageNumber: "Page 24 - 27",
        title: "Operational Signs, Comparisons & Notation Tools",
        content: `Many learners struggle to align calculations vertically or associate operational symbols with their meanings:

**1. Operational Signs Table:**
Introduce signs in symbols, spoken words, and Braille tactile patterns:
- **+** ➔ 'add' / 'plus'
- **-** ➔ 'subtract' / 'minus'
- **÷** ➔ 'divide by' / 'share'
- **×** ➔ 'multiply by' / 'times'
- **=** ➔ 'equals' / 'makes'

**2. Number Comparison (Greater/Less/Equal sugar blocks):**
Use weighted sugar boxes to teach comparison signs:
- **2kg Sugar** ➔ **>** ➔ **1kg Sugar** (Greater than: sign opens toward the larger weight).
- **1kg Sugar** ➔ **<** ➔ **2kg Sugar** (Less than: sign points toward the smaller weight).
- **1kg Sugar** ➔ **=** ➔ **1kg Sugar** (Equal: sign indicates balanced equivalence).

**3. Vertical Alignment and Abacus Counting:**
- Use a **Place Value Abacus Chart** (HT, TT, T, H, T, O - Hundred Thousands, Ten Thousands, Thousands, Hundreds, Tens, Ones) on the chalkboard to align vertical calculations.
- Always align columns before adding or subtracting decimals (e.g., aligning decimal points vertically: 12.5 + 6.09 + 542.3 = 560.89).`,
        highlights: [
          "Explain comparison symbols using the 'hungry crocodile/open mouth' rule (it always eats the bigger number).",
          "Vertical decimal alignment is a frequent source of errors; emphasize drawing vertical gridlines.",
          "Use physical abacuses made of strings and bottle tops in the classroom."
        ]
      },
      {
        pageNumber: "Page 29",
        title: "Zambian Currency & Small Transactions",
        content: `Connect mathematical operations to practical real-world transaction skills using Bank of Zambia currency denominations.

**Denomination & Currency Identification:**
Introduce play money representing standard Kwacha values to teach addition, subtraction, and decimals:
- **Twenty Kwacha (K20)**
- **Fifty Kwacha (K50)**
- **One Hundred Kwacha (K100)**
- **Five Hundred Kwacha (K500)**
- **One Thousand Kwacha (K1000)**
- **Five Thousand Kwacha (K5000)**
- **Ten Thousand Kwacha (K10000)**
- **Fifty Thousand Kwacha (K50000)**

**Transaction Activities:**
1. **The School Market Corner:** Set up a mock grocery stall. Assign prices to common items (e.g., banana = K3, book = K12, pen = K5).
2. **Calculating Change:** Give a learner a K50 note. Ask them to buy a book and calculate the exact change they should receive.`,
        highlights: [
          "Ideal for practical numeracy skills in upper grades and simple counting in lower grades.",
          "Explain that 100 Ngwee equals 1 Kwacha to introduce simple decimals and fractions.",
          "Integrate local languages: practice counting money in regional languages."
        ]
      }
    ]
  },
  {
    sectionTitle: "5. Mathematics - Fractions, Geometry & Sets",
    pages: [
      {
        pageNumber: "Page 31 - 34",
        title: "Fractions Slices & Operations on Fractions",
        content: `Fractions are highly abstract. The booklet scaffolds fractions by utilizing segmented circular shapes (pies) and semi-circles:

**1. Fraction Addition (Adding with same/different denominators):**
- **Same Denominator:** Show half a circle (1/2) plus a slice (1/3). Show how to convert them into common denominator parts (3/6 + 2/6 = 5/6) using circle slices.
- Draw circular diagrams divided into 6 equal parts to represent addition visually.

**2. Fraction Subtraction:**
- E.g., solve 1/2 - 1/6: Represent 1/2 as 3 slices of a 6-slice pie (3/6). Subtract 1 slice (1/6) which leaves 2 slices (2/6), simplified to 1/3.
- Draw circular segment subtraction diagrams.

**3. Whole Numbers Divided by Fractions:**
- E.g., solve 4 ÷ 1/2: Show 4 full circles. Cut each circle directly in half. Count the total resulting half-circles to find the answer: 8.
- **Algorithm:** Write 4 x 2 = 8. Explain the reciprocal division rule.

**4. Whole Numbers Multiplied by Fractions:**
- E.g., solve 2 x 1/2: Draw 2 semi-circles (half pies). Combine them together to form 1 full, complete circle (1).
- **Algorithm:** 2 x 1/2 = 2/2 = 1.`,
        highlights: [
          "Fraction circle diagrams are highly visual and excellent for Grade 4-7 remedial blocks.",
          "For ECE, use the same semi-circle drawings to introduce the concepts of 'half' and 'whole'.",
          "Encourage pupils to cut circular cardboard sheets into equal portions to physically model equations."
        ]
      },
      {
        pageNumber: "Page 35 - 36",
        title: "3D Shapes, Geometry & Venn Diagrams",
        content: `Scaffold geometry and logical grouping using everyday household containers:

**1. 3D Shapes Identification (Physical objects vs abstract geometry):**
- **Carton Box (Cuboid):** Show a cardboard soap box. Emphasize faces (6), edges (12), and vertices (8).
- **Pyramid:** Draw a triangular pyramid in sand. Discuss its properties.
- **Match Box (Rectangular Prism):** Use a standard Matchbox to count vertices and faces physically.

**2. Sets and Venn Diagrams:**
Explain logical categorization using disjoint and overlapping circular sets:
- **Sets with Common Elements (Intersecting Sets):** Draw overlapping Circles A and B.
  - Set A (factors/multiples or letter lists, e.g., {r, u, s, t}) overlaps with Set B ({s, o, a, p}).
  - Intersection Set = {s} (element common to both).
  - Universal Set E = {r, u, t, s, o, a, p}.
- **Disjoint Sets:** Draw two separated, non-touching circles M ({3, 5, 7, 9, 11}) and N ({2, 4, 6, 8, 10}). Explain that disjoint sets share zero common elements.`,
        highlights: [
          "Use actual matchboxes and cartons in the classroom to count faces/edges together.",
          "Create Venn Diagrams on the playground using chalk circles. Have pupils physically stand inside circles based on traits (e.g., boys, wearing blue shirts, overlapping intersection).",
          "Venn diagrams are great to introduce basic classification logic to children."
        ]
      }
    ]
  },
  {
    sectionTitle: "6. Life Skills - Health, Safety & Environment",
    pages: [
      {
        pageNumber: "Page 37 - 39",
        title: "Hygiene, ORS, Cholera spread & Road Signs",
        content: `Life skills are critical for safe daily living. The booklet provides clear visual posters for hygiene and health campaigns:

**1. Hygiene & Rubbish Disposal Campaign:**
- Draw illustrations of pupils cleaning house windows, sweeping schoolyards, and throwing plastic and organic rubbish in designated compost pits.

**2. Preparing Oral Rehydration Solution (ORS):**
Provide clear pictorial recipes to treat dehydration and diarrhea:
- Poster 1: Boil clean water and let it cool.
- Poster 2: Pour 1 litre of clean water into a clean container.
- Poster 3: Open 1 packet of ORS and pour it entirely into the water (or measure correct salt/sugar ratios: 6 level teaspoons of sugar, 1/2 level teaspoon of salt).
- Poster 4: Stir thoroughly with a clean spoon until dissolved. Give to the sick person.

**3. Disease Spread Cycles (Cholera & Bilharzia):**
- **Cholera Spread:** Visual poster depicting a person defecating in the open, flies carrying germs to open food baskets, vomiting, and a sick child in bed.
- **Bilharzia Cycle:** Illustrate a circular cycle: a child defecating/urinating near water, parasite entering water snails, swimming larvae entering a child's bare foot in the stream, causing stomach illness.

**4. Road Safety Signs:**
- **School Crossing Sign:** Showing two children walking.
- **Road Hump Sign:** Warning of humps.
- **STOP Sign:** Octagon stop signal.
- **Pedestrian Zebra Crossing Sign:** Instructing where to cross safely.`,
        highlights: [
          "The ORS preparation drawing is a life-saving skill that should be taught annually.",
          "Illustrate the Bilharzia snail cycle to explain why kids should avoid swimming in stagnant streams.",
          "Zebra crossing drawings are perfect for ECE and lower primary road safety walks."
        ]
      }
    ]
  },
  {
    sectionTitle: "7. Life Skills - Ethics, Work & Entrepreneurship",
    pages: [
      {
        pageNumber: "Page 40 - 45",
        title: "Empathy, Traditional Culture, Soil & Entrepreneurship",
        content: `Nurture values, culture, and vocational skills using descriptive visual illustrations:

**1. Social Values & Empathy:**
- **Orphans Support:** Illustration of children sitting in a room at 'Temba Inshiko Orphanage', visiting and caring for a sick friend in bed.
- **Anti-Vandalism Campaign:** Poster showing children throwing rocks at school windows, and discussing the negative community impact of vandalizing public buildings.
- **Decision Making (Smoking Dagga):** Poster showing two boys smoking weed in grass, another peer discouraging them, and a police officer apprehending the dagga smoker.

**2. Zambian Culture and Heritage:**
- Draw illustrations of traditional dancers in provincial costumes (e.g., Likishi, Makishi, or Chokwe dancers) celebrating initiation ceremonies. Highlight values of respecting elders and learning provincial crafts.

**3. Entrepreneurship, Agriculture & Vocational Crafts:**
- **Marketing Bananas:** Illustrate bananas displayed on a clean village market stall under different hygienic conditions with different pricing strategies.
- **Gardening Activities:** Children clearing grass, making soil beds, and watering vegetable plants.
- **Soil Fertility Diagrams:** Show plant roots below ground, nitrogen-fixing nodules, composting processes, compost manure, and animal manure.
- **Beekeeping Crafts:** Illustrate bee hives in trees, bees swarming, and harvesting honey combs safely.
- **Needlework & Embroidery:** Step-by-step drawing of needlework threads, embroidery hoops, and weaving patterns.`,
        highlights: [
          "Traditional dance illustrations celebrate Zambian identity and provincial history.",
          "Use the 'Marketing Bananas' and 'Gardening' panels to introduce basic accounting and agricultural skills.",
          "Vandalism and drug posters foster robust classroom ethical debates."
        ]
      }
    ]
  }
];

export const REMEDIAL_ILLUSTRATIONS: RemedialIllustration[] = [
  {
    id: "ill_ant",
    title: "A is for Ant (Alphabet Phonics)",
    category: "Phonics & Vocabulary",
    gradeSuitability: "ECE, Grade 1 - 2",
    emoji: "🐜",
    description: "A detailed black-ink drawing of an active forest ant with six legs, distinct head, thorax, and abdomen segments.",
    howToTeach: "Draw the ant segmentally on the blackboard. Teach the phonetic 'ah' sound. Have ECE/Grade 1 children count the legs and recite 'A is for Ant'.",
    visualLayout: "   \\  |  /\n   (O.O)   <- Head with feelers\n   =[_]=   <- Thorax with 6 legs\n   (____)  <- Abdomen segment"
  },
  {
    id: "ill_ball",
    title: "B is for Ball (Alphabet Phonics)",
    category: "Phonics & Vocabulary",
    gradeSuitability: "ECE, Grade 1 - 2",
    emoji: "⚽",
    description: "A classic leather soccer ball showing pentagonal and hexagonal black and white stitched patterns.",
    howToTeach: "Draw a circle, fill in pentagons with chalk. Play a physical bouncing game. Teach the 'buh' sound.",
    visualLayout: "    .----.\n  /  /\\  \\\n |  <  >  |  <- Circular ball with stitched panels\n  \\  \\/  /\n    '----'"
  },
  {
    id: "ill_cow",
    title: "C is for Cow (Alphabet Phonics)",
    category: "Phonics & Vocabulary",
    gradeSuitability: "ECE, Grade 1 - 2",
    emoji: "🐄",
    description: "A dairy cow standing in profile, showing black patches, horns, and udder detail.",
    howToTeach: "Point out the spots on the cow. Discuss dairy farming in Zambia. Teach the 'cuh' phonetic sound.",
    visualLayout: "   (,,_,,)  <- Head with horns\n   ( o o )  \n    \\_\"_/----.  <- Body with black patches\n      ||    ||\n      ||    ||  <- Legs"
  },
  {
    id: "ill_kite",
    title: "K is for Kite (Creative & Tech)",
    category: "Phonics, Creative Tech",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "🪁",
    description: "A diamond-shaped paper kite with cross-braces, string, and a tail decorated with small ribbon bows.",
    howToTeach: "Use this to teach the letter 'K' in phonics or as a practical project in Creative and Technology studies (using thin sticks, plastic sheets, and string).",
    visualLayout: "       /\\\n      /  \\\n     /____\\\n     \\    /\n      \\  /\n       \\/\n        |  <- Tail string with bows (🎀 🎀 🎀)"
  },
  {
    id: "ill_lion",
    title: "L is for Lion (Phonics & Size Comparison)",
    category: "Phonics, Grammar",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "🦁",
    description: "A male lion standing proudly with a thick, surrounding hairy mane and tail.",
    howToTeach: "Use for the letter 'L' sound. In grammar, use it for size comparison: 'The elephant is bigger than the lion' (Lion ➔ Big).",
    visualLayout: "    (( (0) ))  <- Thick mane around face\n     ( o o ) \n    / \\_-_/\\_  <- Proud posture\n   *  ||  ||"
  },
  {
    id: "ill_prep_basket",
    title: "In - Chicken in Basket",
    category: "Prepositions",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "🧺🐓",
    description: "A chicken sitting contentedly inside a woven grass wicker basket.",
    howToTeach: "Illustrate on the blackboard. Ask pupils: 'Where is the chicken?' Guide them to say and write: 'The chicken is in the basket.'",
    visualLayout: "      \\ _ /   <- Chicken comb and beak\n     ( o.o )  <- Chicken head inside basket\n   (=========) \n    \\=======/ <- Woven wicker pattern lines"
  },
  {
    id: "ill_prep_table",
    title: "on - Radio on Table",
    category: "Prepositions",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "📻📻",
    description: "A small transistor radio with an antenna resting on a wooden four-legged table.",
    howToTeach: "Show that the radio physically touches the top of the table surface. Teach: 'The radio is on the table.'",
    visualLayout: "     |--|    <- Antenna\n    [o  #]   <- Transistor Radio on table top\n   ===========\n   |   ||   |\n   |   ||   |  <- Four table legs"
  },
  {
    id: "ill_prep_cat",
    title: "under - Cat under Table",
    category: "Prepositions",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "🐱🐈",
    description: "A cat lying down resting under a wooden table.",
    howToTeach: "Point out the space below the table top. Teach: 'The cat is under the table.' Use actual school desks to practice.",
    visualLayout: "   ===========   <- Table top\n   |  ( ^_^) |   <- Cat face hiding below\n   |  ((___))|   \n   |   ||  | |"
  },
  {
    id: "ill_abacus",
    title: "The Abacus (Place Value Grid)",
    category: "Mathematics",
    gradeSuitability: "Grade 1 - 5",
    emoji: "🧮",
    description: "A place value abacus on vertical rods showing units, tens, and hundreds beads.",
    howToTeach: "Draw rods with labels 'H' (Hundreds), 'T' (Tens), 'O' (Ones). Draw circles (beads) on rods. For 25, draw 2 beads on T, 5 beads on O.",
    visualLayout: "     H     T     O    <- Columns\n     |     |     |\n     |    (O)   (O)   <- Beads on wire rods\n     |    (O)   (O)\n    =============\n     0     2     5    <- Value: 25"
  },
  {
    id: "ill_fractions_half",
    title: "2 x 1/2 = 1 (Fraction Circle)",
    category: "Mathematics",
    gradeSuitability: "Grade 3 - 5",
    emoji: "🍕",
    description: "Two semi-circle pie sections coming together to construct one single whole circle.",
    howToTeach: "Draw two separate half-circles on the chalkboard. Write '1/2' in each. Draw an equals arrow pointing to a complete, solid circle. Teach: 'Two halves make a whole.'",
    visualLayout: "     _.._     _.._          _.._\n    /    |   |    \\        /    \\\n    \\____| + |____/   =   (______)\n     1/2       1/2           1 Whole"
  },
  {
    id: "ill_shapes_pyramid",
    title: "The Triangular Pyramid",
    category: "Mathematics",
    gradeSuitability: "Grade 1 - 5",
    emoji: "📐🧱",
    description: "A 3-dimensional drawing of a square-based pyramid showing edges, faces, and vertex points.",
    howToTeach: "Draw the front triangle, then draw receding angled lines to represent depth. Point out vertices (5), faces (5), and edges (8).",
    visualLayout: "         /\n        /  \\ \n       /    \\ \n      / . -- \\  <- Shaded inner back edges\n     /_/______\\"
  },
  {
    id: "ill_ors_recipe",
    title: "How to Prepare ORS (Health Kit)",
    category: "Life Skills",
    gradeSuitability: "Grade 1 - 5",
    emoji: "🥤🧪",
    description: "Pictorial recipe showing boiling water, pouring 1 litre, dissolving 1 packet of ORS, and stirring.",
    howToTeach: "Teach this step-by-step drawing to prevent dehydration. Discuss cholera and diarrhea prevention.",
    visualLayout: "   1. [♨️] Boil 1L Water & Cool\n   2. [🫙] Pour in Clean Jar\n   3. [🧂] Pour 1 Packet ORS\n   4. [🥄] Stir thoroughly with clean spoon"
  },
  {
    id: "ill_road_stop",
    title: "The STOP Road Sign",
    category: "Life Skills",
    gradeSuitability: "ECE, Grade 1 - 5",
    emoji: "🛑",
    description: "An octagonal road safety sign with a thick border displaying the text 'STOP' in capital letters.",
    howToTeach: "Teach ECE / lower grades to recognize this shape on public roads and understand that drivers must halt completely.",
    visualLayout: "      .---.\n     / STOP \\\n     \\      /\n      '---'\n        ||  <- Supporting steel post"
  }
];

