import fs from 'fs';
const data = fs.readFileSync('./src/data/syllabi.ts', 'utf8');

const sci3 = \`
    "Integrated science": [
      {
        "title": "3.1.0 The human body",
        "subtopics": [
          {
            "title": "3.1.1 Mouth",
            "competencies": [
              "Specific Outcome: 3.1.1.1 State the function of the teeth and tongue | Knowledge: Functions: teeth for chewing food, tongue for tasting with | Skills: Communicating information on the function of the mouth"
            ]
          },
          {
            "title": "3.1.2 Nose",
            "competencies": [
              "Specific Outcome: 3.1.2.1 State the function of the nose | Knowledge: Function of the nose for smelling and breathing | Skills: Communicating information on the function of the nose"
            ]
          },
          {
            "title": "3.1.3 Structure of the Body",
            "competencies": [
              "Specific Outcome: 3.1.3.1 Demonstrate the movement of arms and legs | Knowledge: Movement of arms and legs | Skills: Observing movable joints of the body",
              "Specific Outcome: 3.1.3.2 Name the major movable joints in the body | Knowledge: Movable joints (Elbow, knee, shoulder, hip, wrist and ankle) | Skills: Communicating information on the human skeleton",
              "Specific Outcome: 3.1.3.3 Explain the role played by bones, joints and muscles | Knowledge: Function of bones and muscles (hold structure, support the body and help in movement)",
              "Specific Outcome: 3.1.3.4 Explain what happens if a bone gets broken | Knowledge: Broken arm or leg: pain, no movement or playing",
              "Specific Outcome: 3.1.3.5 Identify the major parts of the human skeleton | Knowledge: Parts of the human skeleton: skull, neck, arms, ribs, hip, legs, feet, spine"
            ]
          }
        ]
      },
      {
        "title": "3.2.0 Health",
        "subtopics": [
          {
            "title": "3.2.1 Food",
            "competencies": [
              "Specific Outcome: 3.2.1.1 State the importance of food | Knowledge: Importance of food for Energy, body building and Protection | Skills: Classifying foods according to nutrients",
              "Specific Outcome: 3.2.1.2 Classify foods according to their nutrients | Knowledge: Food nutrients such as Energy foods, Body building foods, Protective foods",
              "Specific Outcome: 3.2.1.3 Demonstrate the composition of a balanced diet for health | Knowledge: Composition of balanced diet: e.g. sadza, meat and vegetables | Skills: Communicating the composition of a balanced diet for health"
            ]
          },
          {
            "title": "3.2.2 Drug Abuse",
            "competencies": [
              "Specific Outcome: 3.2.2.1 Identify common drugs in the community | Knowledge: Common drugs: cigarettes, glue, mutoriro, ganja, alcohol | Skills: Investigating common drugs",
              "Specific Outcome: 3.2.2.2 Explain the effects of taking too much drugs | Knowledge: Effects of too much drugs: addiction, death, Poor bad health | Skills: Communicating the effects of taking drugs"
            ]
          },
          {
            "title": "3.2.3 Illnesses and diseases",
            "competencies": [
              "Specific Outcome: 3.2.3.1 Identify the common causes of diseases | Knowledge: Parasites, bacteria and viruses | Skills: Investigating the common causes of diseases",
              "Specific Outcome: 3.2.3.2 List common diseases in the community | Knowledge: Malaria, cholera, dysentery, colds, bilharzia",
              "Specific Outcome: 3.2.3.3 Distinguish between infectious and non-infectious diseases | Knowledge: Infections: HIV, TB, Measles | Skills: Comparing infectious and non-infectious diseases",
              "Specific Outcome: 3.2.3.4 Explain different ways of preventing diseases | Knowledge: Personal hygiene, good sanitation, vaccination, healthy food | Skills: Communicating ways of preventing diseases"
            ]
          }
        ]
      },
      {
        "title": "3.3.0 The Environment",
        "subtopics": [
          {
            "title": "3.3.1 Soil formation",
            "competencies": [
              "Specific Outcome: 3.3.1.1 State what weathering is | Knowledge: Weathering as the breaking up of rocks to form soil | Skills: Investigating the layers of soil",
              "Specific Outcome: 3.3.1.2 Identify the agents of weathering | Knowledge: Agents of weathering: Wind, aves, water, animals | Skills: Communicating the agents of weathering",
              "Specific Outcome: 3.3.1.3 Demonstrate the formation of soil layers | Knowledge: Soil layers: top soil, subsoil and bedrock"
            ]
          }
        ]
      },
      {
        "title": "3.4.0 Plants and Animals",
        "subtopics": [
          {
            "title": "3.4.1 Plant Classification",
            "competencies": [
              "Specific Outcome: 3.4.1.1 Classify plants into flowering and non-flowering | Knowledge: Flowering Plants vs non-flowering plants | Skills: Classifying plants into flowering and non-flowering"
            ]
          },
          {
            "title": "3.4.2 Animal Classification",
            "competencies": [
              "Specific Outcome: 3.4.2.1 Classify animals into vertebrates and invertebrates | Knowledge: Vertebrates and Invertebrates | Skills: Classifying vertebrates and invertebrates",
              "Specific Outcome: 3.4.2.2 Classify vertebrates into their groups | Knowledge: Mammals, birds, amphibians, fish, reptiles | Skills: Grouping vertebrates into their five groups"
            ]
          },
          {
            "title": "3.4.3 Homes of living things",
            "competencies": [
              "Specific Outcome: 3.4.3.1 Identify different places where animals and plants live | Knowledge: Place of living: Land, water | Skills: Comparing places where animals and plants live"
            ]
          }
        ]
      },
      {
        "title": "3.5.0 Materials and energy",
        "subtopics": [
          {
            "title": "3.5.1 Three States of matter",
            "competencies": [
              "Specific Outcome: 3.5.1.1 Demonstrate the effect of heating and cooling on matter | Knowledge: Effects of heating and cooling | Skills: Investigating the effect of heating and cooling",
              "Specific Outcome: 3.5.1.2 Demonstrate the process of melting, evaporation and freezing | Knowledge: Process of Melting, Evaporation, Freezing | Skills: Communicating the process of melting, evaporation"
            ]
          },
          {
            "title": "3.5.2 Solutions",
            "competencies": [
              "Specific Outcome: 3.5.2.1 Demonstrate the existence of saturated and unsaturated solutions | Knowledge: Salt and sugar solutions | Skills: Observing saturated and unsaturated solutions"
            ]
          }
        ]
      }
    ],
\`;
const sci5 = \`
    "Integrated science": [
      {
        "title": "5.1.0 The human body",
        "subtopics": [
          {
            "title": "5.1.1 The Heart",
            "competencies": [
              "Specific Outcome: 5.1.1.1 State the function of the heart",
              "Specific Outcome: 5.1.1.2 Describe the structure of the heart",
              "Specific Outcome: 5.1.1.3 Demonstrate how to take the pulse"
            ]
          },
          {
             "title": "5.1.2 Puberty",
             "competencies": [
               "Specific Outcome: 5.1.2.1 Identify male and female parts of the body",
               "Specific Outcome: 5.1.2.2 Describe changes that occur at puberty in human beings"
             ]
          }
        ]
      },
      {
        "title": "5.2.0 Health",
        "subtopics": [
          {
            "title": "5.2.1 Fresh Air",
            "competencies": [
              "Specific Outcome: 5.2.1.1 Explain the importance of good ventilation",
              "Specific Outcome: 5.2.1.2 Explain ways of providing good ventilation in buildings",
              "Specific Outcome: 5.2.1.3 Demonstrate ways of treating a suffocated person"
            ]
          },
          {
            "title": "5.2.2 Air and water borne Diseases",
            "competencies": [
              "Specific Outcome: 5.2.2.1 Name common airborne and water borne diseases",
              "Specific Outcome: 5.2.2.2 Describe symptoms of diseases",
              "Specific Outcome: 5.2.2.3 Describe how to prevent diseases"
            ]
          },
          {
            "title": "5.2.3 Malaria",
            "competencies": [
              "Specific Outcome: 5.2.3.1 Identify causes of malaria",
              "Specific Outcome: 5.2.3.2 State the symptoms of malaria",
              "Specific Outcome: 5.2.3.3 Describe ways of preventing and treating malaria"
            ]
          },
          {
             "title": "5.2.4 HIV and AIDS and STIs",
             "competencies": [
               "Specific Outcome: 5.2.4.1 Describe ways in which STIs and HIV are transmitted",
               "Specific Outcome: 5.2.4.2 Identify ways of preventing the spread",
               "Specific Outcome: 5.2.4.3 Describe the care and treatment for AIDS patients"
             ]
          },
          {
             "title": "5.2.5 Harmful substances and their effects",
             "competencies": [
               "Specific Outcome: 5.2.5.1 Mention the substances which are harmful",
               "Specific Outcome: 5.2.5.2 State the harmful effects of substance abuse",
               "Specific Outcome: 5.2.5.3 Explain the effects of drinking alcohol"
             ]
          }
        ]
      },
      {
         "title": "5.3.0 The Environment",
         "subtopics": [
           {
             "title": "5.3.1 Soil",
             "competencies": [
               "Specific Outcome: 5.3.1.1 Explain the importance of water retained in the soil",
               "Specific Outcome: 5.3.1.2 Identify types of water in which water can be retained in the soil",
               "Specific Outcome: 5.3.1.3 Demonstrate the drainage rates of soils"
             ]
           },
           {
             "title": "5.3.2 Fertilizers",
             "competencies": [
               "Specific Outcome: 5.3.2.1 Explain what organic and inorganic fertilizers are",
               "Specific Outcome: 5.3.2.2 Demonstrate how to prepare compost manure",
               "Specific Outcome: 5.3.2.3 Explain the importance of maintaining a supply of composted materials",
               "Specific Outcome: 5.3.2.4 Explain the advantages and disadvantages of chemical fertilizers"
             ]
           }
         ]
      },
      {
         "title": "5.4.0 Plants and Animals",
         "subtopics": [
           {
             "title": "5.4.1 Non-Flowering Plants",
             "competencies": [
               "Specific Outcome: 5.4.1.1 Identify different types of non-flowering plants",
               "Specific Outcome: 5.4.1.2 Identify use of ferns and fungi"
             ]
           },
           {
             "title": "5.4.2 Invertebrate Animals",
             "competencies": [
                "Specific Outcome: 5.4.2.1 Identify the different types of invertebrate animals",
                "Specific Outcome: 5.4.2.2 Investigate the basic structure of insects",
                "Specific Outcome: 5.4.2.3 Explain the difference between insects and spiders",
                "Specific Outcome: 5.4.2.4 State ways in which insects are useful"
             ]
           },
           {
             "title": "5.4.3 Pest and Parasites",
             "competencies": [
               "Specific Outcome: 5.4.3.1 Identify common pests and parasites",
               "Specific Outcome: 5.4.3.2 Describe the harm caused by pests and parasites",
               "Specific Outcome: 5.4.3.3 Explain how pests are controlled using local plant extracts",
               "Specific Outcome: 5.4.3.4 Explain how chemical pesticides can harm the environment"
             ]
           }
         ]
      },
      {
        "title": "5.5.0 Materials and energy",
        "subtopics": [
          {
            "title": "5.5.1 Electricity",
            "competencies": [
              "Specific Outcome: 5.5.1.1 State what electricity can do",
              "Specific Outcome: 5.5.1.2 Identify sources of electricity",
              "Specific Outcome: 5.5.1.3 Identify electrical appliances",
              "Specific Outcome: 5.5.1.4 Identify good and bad conductors of electricity",
              "Specific Outcome: 5.5.1.5 Describe the uses of good and bad conductors",
              "Specific Outcome: 5.5.1.6 Explain methods of conserving electricity"
            ]
          },
          {
             "title": "5.5.2 Heat Conduction",
             "competencies": [
               "Specific Outcome: 5.5.2.1 Describe what heat is",
               "Specific Outcome: 5.5.2.2 Determine the temperature of human body, etc.",
               "Specific Outcome: 5.5.2.3 Distinguish good and bad conductors of heat",
               "Specific Outcome: 5.5.2.4 Identify materials which are good insulators",
               "Specific Outcome: 5.5.2.5 Explain the uses of good and bad conduction of heat"
             ]
          },
          {
             "title": "5.5.3 Measuring Matter",
             "competencies": [
               "Specific Outcome: 5.5.4.1 Identify instruments used to compare how heavy objects are",
               "Specific Outcome: 5.5.4.2 Demonstrate the effect of gravity on objects",
               "Specific Outcome: 5.5.4.3 Distinguish between mass and weight"
             ]
          },
          {
             "title": "5.5.4 Volume",
             "competencies": [
               "Specific Outcome: 5.5.4.1 Identify various instruments to measure volume",
               "Specific Outcome: 5.5.4.2 Measure the volume of liquids",
               "Specific Outcome: 5.5.4.3 Measure the volume of regular and irregular solid objects"
             ]
          },
          {
             "title": "5.5.5 Simple Machines",
             "competencies": [
               "Specific Outcome: 5.5.5.1 Explain what simple machine is",
               "Specific Outcome: 5.5.5.2 Identify six kinds of simple machines",
               "Specific Outcome: 5.5.5.3 Demonstrate the use of simple machines"
             ]
          }
        ]
      }
    ],
\`;
const sci6 = \`
    "Integrated science": [
      {
         "title": "6.1.0 The human body",
         "subtopics": [
           {
              "title": "6.1.1 The Blood",
              "competencies": [
                "Specific Outcome: 6.1.1.1 Describe the composition of blood",
                "Specific Outcome: 6.1.1.2 Describe the function of blood in the body"
              ]
           },
           {
             "title": "6.1.2 Features of pregnancy",
             "competencies": [
               "Specific Outcome: 6.1.2.1 Describe how blood circulates in the body",
               "Specific Outcome: 6.1.2.2 Describe features of pregnancy",
               "Specific Outcome: 6.1.2.3 Identify signs and symptoms of pregnancy"
             ]
           },
           {
             "title": "6.1.3 Health risks",
             "competencies": [
               "Specific Outcome: 6.1.3.1 Identify health and social risks for teenage pregnancy"
             ]
           }
         ]
      },
      {
        "title": "6.2.0 Health",
        "subtopics": [
          {
            "title": "6.2.1 Food Nutrients",
            "competencies": [
              "Specific Outcome: 6.2.1.1 List foods which are good sources of vitamins and minerals",
              "Specific Outcome: 6.2.1.2 Explain the importance of vitamins and minerals",
              "Specific Outcome: 6.2.1.3 Explain the importance of eating a variety of foods",
              "Specific Outcome: 6.2.1.4 Explain the importance of food labeling",
              "Specific Outcome: 6.2.1.5 Identify deficiency diseases",
              "Specific Outcome: 6.2.1.6 Interpret children's clinic cards"
            ]
          },
          {
            "title": "6.2.2 Effects of harmful substance use",
            "competencies": [
               "Specific Outcome: 6.2.2.1 Explain how substance abuse can ruin lives",
               "Specific Outcome: 6.2.2.2 Explain how substance abuse can be helped"
            ]
          },
          {
             "title": "6.2.3 Living with HIV and AIDS",
             "competencies": [
               "Specific Outcome: 6.2.3.1 Describe the challenges of living with HIV and AIDS"
             ]
          }
        ]
      },
      {
         "title": "6.3.0 The Environment",
         "subtopics": [
           {
              "title": "6.3.1 The water cycle",
              "competencies": [
                "Specific Outcome: 6.3.1.1 Describe the water cycle system",
                "Specific Outcome: 6.3.1.2 Describe the process of evaporation and condensation",
                "Specific Outcome: 6.3.1.3 State the effects of the water cycle"
              ]
           }
         ]
      },
      {
         "title": "6.4.0 Plants and Animals",
         "subtopics": [
           {
             "title": "6.4.1 Photosynthesis",
             "competencies": [
                "Specific Outcome: 6.4.1.1 Demonstrate how water and mineral salts reach the leaves",
                "Specific Outcome: 6.4.1.2 Describe the process by which plants make their own food",
                "Specific Outcome: 6.4.1.3 Test for the presence of starch in a leaf"
             ]
           },
           {
              "title": "6.4.2 Care for Domestic Animals",
              "competencies": [
                "Specific Outcome: 6.4.2.1 Explain the basic needs of livestock",
                "Specific Outcome: 6.4.2.2 Explain the importance of cleanliness",
                "Specific Outcome: 6.4.2.2 Find out the advantages of keeping livestock together",
                "Specific Outcome: 6.4.2.3 Find out the disadvantages of crowding livestock"
              ]
           },
           {
              "title": "6.4.3 Vertebrate animals",
              "competencies": [
                "Specific Outcome: 6.4.3.1 Identify the different types of vertebrate animals",
                "Specific Outcome: 6.4.3.2 Describe adaptations shown by vertebrate animals",
                "Specific Outcome: 6.4.3.3 Describe the life cycle of vertebrate animals",
                "Specific Outcome: 6.4.3.4 State ways of conserving vertebrates"
              ]
           }
         ]
      },
      {
         "title": "6.5.0 Materials and Energy",
         "subtopics": [
           {
              "title": "6.5.1 Nature of Air",
              "competencies": [
                 "Specific Outcome: 6.5.1.1 Describe the composition of air",
                 "Specific Outcome: 6.5.1.2 State the physical properties of air"
              ]
           },
           {
              "title": "6.5.2 Sound",
              "competencies": [
                "Specific Outcome: 6.5.2.1 Demonstrate that air has weight and occupies space",
                "Specific Outcome: 6.5.2.2 Explain what sound is",
                "Specific Outcome: 6.5.2.3 Demonstrate how sound is produced",
                "Specific Outcome: 6.5.2.4 Describe how sound travels"
              ]
           },
           {
              "title": "6.5.3 Pressure",
              "competencies": [
                "Specific Outcome: 6.5.3.1 Show the effect of pressure on objects",
                "Specific Outcome: 6.5.3.2 Explain why tools and implements should be sharpened",
                "Specific Outcome: 6.5.3.3 Explain why water tanks are placed on a higher level",
                "Specific Outcome: 6.5.3.4 Explain why the foot exerts pressure",
                "Specific Outcome: 6.5.3.5 Explain why pumping a tube makes it stand more difficult"
              ]
           },
           {
              "title": "6.5.4 Communication",
              "competencies": [
                 "Specific Outcome: 6.5.4.1 State methods of communication",
                 "Specific Outcome: 6.5.4.2 Explain the importance of communication",
                 "Specific Outcome: 6.5.4.3 Describe how sound waves are used in communication"
              ]
           }
         ]
      }
    ],
\`;
const sci7 = \`
    "Integrated science": [
       {
         "title": "7.1.0 The human body",
         "subtopics": [
           {
             "title": "7.1.1 The Digestive System",
             "competencies": [
               "Specific Outcome: 7.1.1.1 Describe digestion",
               "Specific Outcome: 7.1.1.2 Identify the organs of the digestive system",
               "Specific Outcome: 7.1.1.3 Identify parts of the alimentary canal where digested food is absorbed",
               "Specific Outcome: 7.1.1.4 Explain what happens to undigested food"
             ]
           }
         ]
       },
       {
         "title": "7.2.0 Health",
         "subtopics": [
           {
             "title": "7.2.1 Illnesses",
             "competencies": [
                "Specific Outcome: 7.2.1.1 Distinguish between a virus and a bacterium",
                "Specific Outcome: 7.2.1.2 Explain how viruses and bacteria can affect body health",
                "Specific Outcome: 7.2.1.3 Identify common diseases of the skin",
                "Specific Outcome: 7.2.1.4 Explain the prevalence of diseases in relation to health services"
             ]
           },
           {
              "title": "7.2.2 Fruits",
              "competencies": [
                "Specific Outcome: 7.2.2.1 Identify fruits used as food",
                "Specific Outcome: 7.2.2.2 Identify seeds used as food"
              ]
           }
         ]
       },
       {
          "title": "7.3.0 The Environment",
          "subtopics": [
            {
               "title": "7.3.1 Separating substances",
               "competencies": [
                 "Specific Outcome: 7.3.1.1 Demonstrate the separation of an insoluble solid from water",
                 "Specific Outcome: 7.3.1.2 Demonstrate the separation of a soluble substance from water",
                 "Specific Outcome: 7.3.1.3 Demonstrate the separation of iron filings from sand"
               ]
            },
            {
               "title": "7.3.2 Water supply system",
               "competencies": [
                 "Specific Outcome: 7.3.2.1 Identify sources of water in the village and towns",
                 "Specific Outcome: 7.3.2.2 Identify different types of water treatment systems",
                 "Specific Outcome: 7.3.2.3 State the importance of water treatment",
                 "Specific Outcome: 7.3.2.4 Describe ways of conserving water"
               ]
            }
          ]
       },
       {
          "title": "7.4.0 Plants and Animals",
          "subtopics": [
            {
              "title": "7.4.1 The flower",
              "competencies": [
                 "Specific Outcome: 7.4.1.1 Identify the parts of a flower",
                 "Specific Outcome: 7.4.1.2 Explain the functions of the parts of the flower"
              ]
            },
            {
              "title": "7.4.2 Pollination and fertilisation in flowering plants",
              "competencies": [
                 "Specific Outcome: 7.4.2.1 Describe pollination in flowering plants",
                 "Specific Outcome: 7.4.2.2 Identify the agents of pollination",
                 "Specific Outcome: 7.4.2.3 Describe fertilisation in flowering plants"
              ]
            },
            {
              "title": "7.4.3 Fruits and seeds",
              "competencies": [
                "Specific Outcome: 7.4.3.1 Explain why plants produce seeds",
                "Specific Outcome: 7.4.3.2 Explain the importance of improving seed varieties"
              ]
            },
            {
              "title": "7.4.4 Seed dispersal",
              "competencies": [
                 "Specific Outcome: 7.4.4.1 Describe what seed dispersal is",
                 "Specific Outcome: 7.4.4.2 Describe ways in which seeds are dispersed",
                 "Specific Outcome: 7.4.4.3 Explain the importance of seed dispersal"
              ]
            },
            {
              "title": "7.4.5 Propagation",
              "competencies": [
                 "Specific Outcome: 7.4.5.1 Explain what plant propagation is",
                 "Specific Outcome: 7.4.5.2 State methods of plant propagation",
                 "Specific Outcome: 7.4.5.3 Demonstrate how some plants are propagated"
              ]
            }
          ]
       },
       {
          "title": "7.5.0 Materials and energy",
          "subtopics": [
            {
              "title": "7.5.1 Energy",
              "competencies": [
                 "Specific Outcome: 7.5.1.1 Explain what energy is",
                 "Specific Outcome: 7.5.1.2 Identify different types of energy",
                 "Specific Outcome: 7.5.1.3 Explain how energy is converted from one form into another"
              ]
            },
            {
              "title": "7.5.2 Electric current and Circuits",
              "competencies": [
                "Specific Outcome: 7.5.2.1 Explain what an electric current does",
                "Specific Outcome: 7.5.2.2 Demonstrate how to construct a simple electric circuit",
                "Specific Outcome: 7.5.2.3 Distinguish between a series and parallel circuit",
                "Specific Outcome: 7.5.2.4 Discuss the action of a switch in a circuit"
              ]
            },
            {
               "title": "7.5.3 Lightning",
               "competencies": [
                 "Specific Outcome: 7.5.3.1 Identify the causes of lightning",
                 "Specific Outcome: 7.5.3.2 Explain the effects of lightning",
                 "Specific Outcome: 7.5.3.3 Demonstrate how to prevent damage from lightning"
               ]
            },
            {
               "title": "7.5.4 The solar system",
               "competencies": [
                 "Specific Outcome: 7.5.4.1 Describe the solar system",
                 "Specific Outcome: 7.5.4.2 Explain the difference between the sun and the planets",
                 "Specific Outcome: 7.5.4.3 State the source of light in the solar system",
                 "Specific Outcome: 7.5.4.4 Explain how we have day and night on earth",
                 "Specific Outcome: 7.5.4.5 Compare the movement of the earth and the moon",
                 "Specific Outcome: 7.5.4.6 Describe the formation of solar and lunar eclipses",
                 "Specific Outcome: 7.5.4.7 State uses of solar energy"
               ]
            },
            {
               "title": "7.5.5 Metals",
               "competencies": [
                 "Specific Outcome: 7.5.5.1 Identify types of metals and non-metals"
               ]
            },
            {
               "title": "7.5.6 Mining",
               "competencies": [
                 "Specific Outcome: 7.5.6.1 Identify materials mined in Zambia",
                 "Specific Outcome: 7.5.6.2 List the preparation of copper ore",
                 "Specific Outcome: 7.5.6.3 Explain how copper is extracted and refined",
                 "Specific Outcome: 7.5.6.4 Identify items made from copper within Zambia",
                 "Specific Outcome: 7.5.6.5 Describe the process of making copper from within Zambia",
                 "Specific Outcome: 7.5.6.6 Describe the impact of mining on the environment"
               ]
            }
          ]
       }
     ],
\`;

let out = data.replace(/"Grade 3 \\(OBE\\)": \\{/g, \`"Grade 3 (OBE)": {\\n\${sci3}\`);
out = out.replace(/"Grade 5 \\(OBE\\)": \\{/g, \`"Grade 5 (OBE)": {\\n\${sci5}\`);
out = out.replace(/"Grade 6 \\(OBE\\)": \\{/g, \`"Grade 6 (OBE)": {\\n\${sci6}\`);
out = out.replace(/"Grade 7 \\(OBE\\)": \\{/g, \`"Grade 7 (OBE)": {\\n\${sci7}\`);

fs.writeFileSync('./src/data/syllabi.ts', out);
console.log('done');
